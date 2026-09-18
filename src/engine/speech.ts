// Spoken ghost voices via the browser's built-in SpeechSynthesis (no assets, offline).
// Each character gets a distinct pitch/rate and a preferred voice gender; falls back
// gracefully when the browser has no voices (blips still play).

interface VoiceProfile { pitch: number; rate: number; gender: 'f' | 'm' | 'n'; volume?: number }

const PROFILES: Record<string, VoiceProfile> = {
  building: { pitch: 0.55, rate: 0.88, gender: 'n', volume: 0.9 },
  doris: { pitch: 1.35, rate: 1.08, gender: 'f' },
  marcus: { pitch: 0.95, rate: 1.22, gender: 'm' },
  priya: { pitch: 1.15, rate: 1.12, gender: 'f' },
  standup: { pitch: 0.9, rate: 1.0, gender: 'n' },
  ines: { pitch: 1.2, rate: 0.9, gender: 'f' },
  gary: { pitch: 0.65, rate: 0.85, gender: 'm' },
  kit: { pitch: 1.05, rate: 1.05, gender: 'n' },
  beatriz: { pitch: 1.05, rate: 0.95, gender: 'f' },
  sam: { pitch: 0.8, rate: 0.9, gender: 'm' },
  player: { pitch: 1.0, rate: 1.0, gender: 'n' },
  narrator: { pitch: 0.9, rate: 0.95, gender: 'n' }
}

const FEMALE_HINTS = /female|zira|hazel|susan|samantha|victoria|karen|moira|tessa|fiona|libby|sonia|aria|jenny|emma|ava|serena/i
const MALE_HINTS = /male|david|mark|george|daniel|james|ryan|guy|thomas|oliver|alex|fred|arthur|brian|christopher|eric/i

export class Speech {
  enabled = true
  volume = 0.9
  private voices: SpeechSynthesisVoice[] = []
  private supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  constructor() {
    if (!this.supported) return
    const load = () => { this.voices = speechSynthesis.getVoices() }
    load()
    speechSynthesis.addEventListener?.('voiceschanged', load)
  }

  get available(): boolean { return this.supported && this.voices.length > 0 }

  private pick(gender: 'f' | 'm' | 'n', seed: string): SpeechSynthesisVoice | null {
    if (!this.voices.length) return null
    const english = this.voices.filter((v) => /^en/i.test(v.lang))
    const pool = english.length ? english : this.voices
    const byGender = pool.filter((v) => gender === 'f' ? FEMALE_HINTS.test(v.name) : gender === 'm' ? MALE_HINTS.test(v.name) : true)
    const list = byGender.length ? byGender : pool
    // stable per-character choice so the same ghost always gets the same voice
    let h = 0
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
    return list[h % list.length]
  }

  speak(speaker: string, text: string) {
    if (!this.supported || !this.enabled) return
    try {
      speechSynthesis.cancel()
      const p = PROFILES[speaker] ?? PROFILES.narrator
      const u = new SpeechSynthesisUtterance(text.replace(/[*_~]/g, ''))
      u.pitch = p.pitch
      u.rate = p.rate
      u.volume = Math.min(1, this.volume * (p.volume ?? 1))
      const v = this.pick(p.gender, speaker)
      if (v) u.voice = v
      speechSynthesis.speak(u)
    } catch { /* voices unavailable — blips carry the line */ }
  }

  stop() {
    if (!this.supported) return
    try { speechSynthesis.cancel() } catch { /* */ }
  }
}

export const speech = new Speech()
