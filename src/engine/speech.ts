// Spoken voices via the browser's built-in SpeechSynthesis (no assets, offline).
// Each character gets a distinct pitch/rate and a preferred voice gender; falls back
// gracefully when the browser has no voices (blips still play).
//
// Chrome's speech engine is flaky: an utterance queued right after cancel() can be
// silently dropped (leaving it "speaking" forever), and utterances longer than ~15 s
// are cut off without an end event. So every line is chunked by sentence, started
// after a short delay, watched by start/duration watchdogs, and kept alive with the
// pause/resume trick. onEnd is guaranteed to fire exactly once per speak() call.

interface VoiceProfile { pitch: number; rate: number; gender: 'f' | 'm' | 'n'; volume?: number }

const PROFILES: Record<string, VoiceProfile> = {
  building: { pitch: 0.55, rate: 0.88, gender: 'n', volume: 0.9 },
  doris: { pitch: 1.3, rate: 1.06, gender: 'f' },      // Amna
  marcus: { pitch: 0.95, rate: 1.2, gender: 'm' },     // Abdul Moiz
  priya: { pitch: 1.15, rate: 1.1, gender: 'f' },      // Zainab
  standup: { pitch: 0.9, rate: 1.0, gender: 'n' },
  ines: { pitch: 1.2, rate: 0.9, gender: 'f' },        // Hira
  gary: { pitch: 0.7, rate: 0.85, gender: 'm' },       // Irfan
  kit: { pitch: 1.0, rate: 1.05, gender: 'm' },        // Bilal
  beatriz: { pitch: 1.05, rate: 0.95, gender: 'f' },   // Sana
  sam: { pitch: 0.8, rate: 0.9, gender: 'm' },         // Tariq
  player: { pitch: 1.05, rate: 1.0, gender: 'n' },
  // Opening narration: deep, unhurried, warm — the gravelly documentary register
  narrator: { pitch: 0.55, rate: 0.8, gender: 'm', volume: 1 }
}

const FEMALE_HINTS = /female|zira|hazel|susan|samantha|victoria|karen|moira|tessa|fiona|libby|sonia|aria|jenny|emma|ava|serena/i
const MALE_HINTS = /male|david|mark|george|daniel|james|ryan|guy|thomas|oliver|alex|fred|arthur|brian|christopher|eric/i

// Split into sentence-ish chunks of at most ~160 chars (Chrome cuts off long utterances).
function chunk(text: string): string[] {
  const clean = text.replace(/[*_~]/g, '').trim()
  const parts = clean.split(/(?<=[.!?…])\s+/)
  const out: string[] = []
  let cur = ''
  for (const p of parts) {
    if ((cur + ' ' + p).trim().length > 160 && cur) { out.push(cur.trim()); cur = p }
    else cur = (cur + ' ' + p).trim()
  }
  if (cur) out.push(cur)
  return out.length ? out : [clean]
}

export class Speech {
  enabled = true
  volume = 0.9
  speaking = false          // an utterance has actually started and not finished
  private busyToken = 0     // a speak() is in flight (from call until onEnd)
  private voices: SpeechSynthesisVoice[] = []
  private supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  private timers: number[] = []
  private keepAlive: number | null = null

  constructor() {
    if (!this.supported) return
    const load = () => { this.voices = speechSynthesis.getVoices() }
    load()
    speechSynthesis.addEventListener?.('voiceschanged', load)
  }

  get available(): boolean { return this.supported && this.voices.length > 0 }
  /** True from speak() until that line's onEnd — use this to avoid talking over a line. */
  get active(): boolean { return this.busyToken !== 0 }

  private pick(gender: 'f' | 'm' | 'n', seed: string): SpeechSynthesisVoice | null {
    if (!this.voices.length) return null
    const english = this.voices.filter((v) => /^en/i.test(v.lang))
    const pool = english.length ? english : this.voices
    const byGender = pool.filter((v) => gender === 'f' ? FEMALE_HINTS.test(v.name) : gender === 'm' ? MALE_HINTS.test(v.name) : true)
    const list = byGender.length ? byGender : pool
    let h = 0
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
    return list[h % list.length]
  }

  private clearTimers() {
    for (const t of this.timers) clearTimeout(t)
    this.timers = []
    if (this.keepAlive) { clearInterval(this.keepAlive); this.keepAlive = null }
  }

  // Returns true if the line will be spoken (onEnd will fire once, even on failure).
  speak(speaker: string, text: string, onEnd?: () => void): boolean {
    if (!this.supported || !this.enabled || !this.voices.length) return false
    this.stop()
    const token = ++this.busyToken || (this.busyToken = 1)
    const p = PROFILES[speaker] ?? PROFILES.narrator
    const voice = this.pick(p.gender, speaker)
    const chunks = chunk(text)
    const expectedMs = 600 + (text.length / (13 * p.rate)) * 1000
    let finished = false
    const finish = () => {
      if (finished || token !== this.busyToken) return
      finished = true
      this.clearTimers()
      this.speaking = false
      this.busyToken = 0
      onEnd?.()
    }
    let started = false
    let ended = 0
    // Chrome drops utterances queued immediately after cancel(); a short gap avoids that
    this.timers.push(window.setTimeout(() => {
      if (token !== this.busyToken) return
      try {
        for (const c of chunks) {
          const u = new SpeechSynthesisUtterance(c)
          u.pitch = p.pitch
          u.rate = p.rate
          u.volume = Math.min(1, this.volume * (p.volume ?? 1))
          if (voice) u.voice = voice
          u.onstart = () => { started = true; this.speaking = true }
          u.onend = () => { if (++ended >= chunks.length) finish() }
          u.onerror = (e) => {
            if (e.error === 'interrupted' || e.error === 'canceled') return
            if (++ended >= chunks.length) finish()
          }
          speechSynthesis.speak(u)
        }
        // keep Chrome from stalling mid-line
        this.keepAlive = window.setInterval(() => {
          try { if (speechSynthesis.speaking) { speechSynthesis.pause(); speechSynthesis.resume() } } catch { /* */ }
        }, 8000)
      } catch { finish() }
    }, 60))
    // watchdogs: never started → give up quickly; started but no end → force-finish
    this.timers.push(window.setTimeout(() => { if (!started) finish() }, 1800))
    this.timers.push(window.setTimeout(finish, expectedMs * 1.6 + 2500))
    return true
  }

  stop() {
    this.clearTimers()
    this.speaking = false
    this.busyToken = 0
    if (!this.supported) return
    try { speechSynthesis.cancel() } catch { /* */ }
  }
}

export const speech = new Speech()
