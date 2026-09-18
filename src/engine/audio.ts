// All audio is synthesized with plain WebAudio (spec §13 allows this).
// Nothing plays until unlock() is called from a user gesture (spec §28).

export type SfxName =
  | 'ding' | 'badgeDeny' | 'badgeAccept' | 'doorSlide' | 'doorClunk' | 'paperPeel'
  | 'fragmentChime' | 'spark' | 'fanDown' | 'fanUp' | 'photocopier' | 'vendingClunk'
  | 'liftDing' | 'ghostExhale' | 'cheer' | 'calcDing' | 'tink' | 'footstep' | 'pagerBeep'
  | 'uiClack' | 'shimmer' | 'liftWhineDown'

export class AudioEngine {
  ctx: AudioContext | null = null
  private master!: GainNode
  private musicBus!: GainNode
  private sfxBus!: GainNode
  private blipBus!: GainNode
  private ambientBus!: GainNode
  volumes = { master: 0.8, music: 0.7, sfx: 0.8, blips: 0.7 }
  private ambientNodes: { stop: () => void } | null = null
  private musicNodes: { stop: () => void } | null = null
  private currentAmbient = ''

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return }
    try {
      this.ctx = new AudioContext()
    } catch { return }
    const c = this.ctx
    this.master = c.createGain(); this.master.connect(c.destination)
    this.musicBus = c.createGain(); this.musicBus.connect(this.master)
    this.sfxBus = c.createGain(); this.sfxBus.connect(this.master)
    this.blipBus = c.createGain(); this.blipBus.connect(this.master)
    this.ambientBus = c.createGain(); this.ambientBus.connect(this.master)
    this.applyVolumes()
  }

  applyVolumes() {
    if (!this.ctx) return
    this.master.gain.value = this.volumes.master
    this.musicBus.gain.value = this.volumes.music
    this.sfxBus.gain.value = this.volumes.sfx
    this.blipBus.gain.value = this.volumes.blips
  }

  mute(m: boolean) {
    if (!this.ctx) return
    this.master.gain.value = m ? 0 : this.volumes.master
  }

  // Short synth blip per dialogue character. pitch ~ 200-900.
  blip(pitch: number, low = false) {
    const c = this.ctx; if (!c) return
    const o = c.createOscillator()
    o.type = low ? 'triangle' : 'square'
    o.frequency.value = pitch * (0.97 + Math.random() * 0.06)
    const g = c.createGain()
    g.gain.setValueAtTime(0.055, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05)
    o.connect(g); g.connect(this.blipBus)
    o.start(); o.stop(c.currentTime + 0.06)
    // duck ambience -6dB briefly
    if (this.ambientBus) {
      this.ambientBus.gain.cancelScheduledValues(c.currentTime)
      this.ambientBus.gain.setValueAtTime(0.5, c.currentTime)
      this.ambientBus.gain.linearRampToValueAtTime(1, c.currentTime + 0.4)
    }
  }

  sfx(name: SfxName) {
    const c = this.ctx; if (!c) return
    const t = c.currentTime
    const out = this.sfxBus
    const tone = (freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.15, when = 0, slide = 0) => {
      const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t + when)
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + when + dur)
      const g = c.createGain()
      g.gain.setValueAtTime(vol, t + when)
      g.gain.exponentialRampToValueAtTime(0.001, t + when + dur)
      o.connect(g); g.connect(out); o.start(t + when); o.stop(t + when + dur + 0.02)
    }
    const noise = (dur: number, vol = 0.12, when = 0, filterFreq = 2000) => {
      const len = Math.max(1, Math.floor(c.sampleRate * dur))
      const buf = c.createBuffer(1, len, c.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
      const src = c.createBufferSource(); src.buffer = buf
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filterFreq
      const g = c.createGain(); g.gain.value = vol
      src.connect(f); f.connect(g); g.connect(out); src.start(t + when)
    }
    switch (name) {
      case 'ding': tone(880 * 0.985, 0.5, 'sine', 0.12); tone(1318, 0.4, 'sine', 0.05, 0.02); break
      case 'badgeDeny': tone(220, 0.15, 'square', 0.1); tone(185, 0.2, 'square', 0.1, 0.16); break
      case 'badgeAccept': tone(660, 0.1, 'square', 0.08); tone(880, 0.18, 'square', 0.08, 0.1); break
      case 'doorSlide': noise(0.5, 0.08, 0, 900); break
      case 'doorClunk': tone(90, 0.15, 'sine', 0.2); noise(0.08, 0.1, 0, 500); break
      case 'paperPeel': noise(0.25, 0.1, 0, 4000); break
      case 'fragmentChime': tone(1046, 0.8, 'sine', 0.1); tone(1318, 0.8, 'sine', 0.08, 0.08); tone(1568, 1.0, 'sine', 0.07, 0.16); break
      case 'shimmer': for (let i = 0; i < 5; i++) tone(1200 + i * 220, 0.3, 'sine', 0.03, i * 0.05); break
      case 'spark': noise(0.15, 0.2, 0, 6000); tone(120, 0.1, 'sawtooth', 0.1); break
      case 'fanDown': tone(160, 1.8, 'sawtooth', 0.05, 0, -140); break
      case 'fanUp': tone(40, 1.6, 'sawtooth', 0.05, 0, 120); break
      case 'photocopier': for (let i = 0; i < 6; i++) noise(0.06, 0.06, i * 0.12, 1200); tone(320, 0.7, 'square', 0.03, 0.1); break
      case 'vendingClunk': tone(70, 0.25, 'sine', 0.25); noise(0.12, 0.15, 0.05, 700); break
      case 'liftDing': tone(987, 0.9, 'sine', 0.12); break
      case 'liftWhineDown': tone(300, 2.2, 'sawtooth', 0.06, 0, -260); break
      case 'ghostExhale': noise(1.2, 0.07, 0, 700); break
      case 'cheer': for (let i = 0; i < 12; i++) tone(300 + Math.random() * 500, 0.4, 'sawtooth', 0.02, Math.random() * 0.4); noise(0.9, 0.06, 0, 1500); break
      case 'calcDing': tone(1760, 0.5, 'sine', 0.1); break
      case 'tink': tone(2200, 0.12, 'sine', 0.1); break
      case 'footstep': noise(0.07, 0.045, 0, 400); break
      case 'pagerBeep': tone(1400, 0.09, 'square', 0.06); tone(1400, 0.09, 'square', 0.06, 0.14); break
      case 'uiClack': noise(0.04, 0.08, 0, 3000); break
    }
  }

  // Zone ambient beds: layered filtered noise + hum oscillators (spec §13).
  setAmbient(zone: string, warmth: number) {
    if (!this.ctx || zone === this.currentAmbient) return
    this.currentAmbient = zone
    const c = this.ctx
    const old = this.ambientNodes
    if (old) { old.stop() }
    const bus = c.createGain()
    bus.gain.setValueAtTime(0, c.currentTime)
    bus.gain.linearRampToValueAtTime(1, c.currentTime + 1.5)
    bus.connect(this.ambientBus)
    const stops: (() => void)[] = []
    const hum = (freq: number, vol: number, type: OscillatorType = 'sine') => {
      const o = c.createOscillator(); o.type = type; o.frequency.value = freq
      const g = c.createGain(); g.gain.value = vol
      o.connect(g); g.connect(bus); o.start()
      stops.push(() => { try { o.stop() } catch { /* */ } })
    }
    const hiss = (vol: number, freq: number) => {
      const len = c.sampleRate * 2
      const buf = c.createBuffer(1, len, c.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
      const src = c.createBufferSource(); src.buffer = buf; src.loop = true
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq
      const g = c.createGain(); g.gain.value = vol
      src.connect(f); f.connect(g); g.connect(bus); src.start()
      stops.push(() => { try { src.stop() } catch { /* */ } })
    }
    switch (zone) {
      case 'lobby': hum(120, 0.008, 'sine'); hiss(0.012, 300); break
      case 'corridor': hum(100, 0.012, 'triangle'); hum(119, 0.006); hiss(0.01, 250); break
      case 'serverRoom': hiss(0.03, 800); hum(90, 0.015, 'sawtooth'); break
      case 'meetingRoom': hum(110, 0.006); hiss(0.008, 200); break
      case 'archive': hiss(0.004, 120); break // quietest room
      case 'breakRoom': hum(55, 0.02, 'sine'); hum(110, 0.006); hiss(0.008, 250); break
      case 'designStudio': hum(120, 0.005); hiss(0.008, 300); break
      case 'financeCorner': hum(120, 0.006); hiss(0.008, 280); break
      case 'rooftop': hiss(0.035, 500); break // wind
      case 'lift': hum(110, 0.008); break
    }
    // warmth softens the hums
    bus.gain.value = Math.max(0.4, 1 - warmth * 0.3)
    this.ambientNodes = {
      stop: () => {
        const g = bus.gain
        g.cancelScheduledValues(c.currentTime)
        g.setValueAtTime(g.value, c.currentTime)
        g.linearRampToValueAtTime(0, c.currentTime + 1.5)
        setTimeout(() => stops.forEach((s) => s()), 1600)
      }
    }
  }

  // Warm pad: rooftop and finale music (spec §13). mode: 'rooftop' | 'finale' | 'off'
  setMusic(mode: 'off' | 'rooftop' | 'finale') {
    if (!this.ctx) return
    const c = this.ctx
    if (this.musicNodes) { this.musicNodes.stop(); this.musicNodes = null }
    if (mode === 'off') return
    const bus = c.createGain()
    bus.gain.setValueAtTime(0, c.currentTime)
    bus.gain.linearRampToValueAtTime(mode === 'finale' ? 0.5 : 0.35, c.currentTime + 3)
    bus.connect(this.musicBus)
    const stops: (() => void)[] = []
    const chord = mode === 'finale' ? [130.8, 196.0, 261.6, 329.6, 392.0] : [110, 164.8, 220, 277.2]
    chord.forEach((f, i) => {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f
      const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2.003
      const g = c.createGain(); g.gain.value = 0.035 / (1 + i * 0.3)
      const lfo = c.createOscillator(); lfo.frequency.value = 0.08 + i * 0.05
      const lfoG = c.createGain(); lfoG.gain.value = 0.012
      lfo.connect(lfoG); lfoG.connect(g.gain)
      o.connect(g); o2.connect(g); g.connect(bus)
      o.start(); o2.start(); lfo.start()
      stops.push(() => { try { o.stop(); o2.stop(); lfo.stop() } catch { /* */ } })
    })
    this.musicNodes = {
      stop: () => {
        bus.gain.cancelScheduledValues(c.currentTime)
        bus.gain.setValueAtTime(bus.gain.value, c.currentTime)
        bus.gain.linearRampToValueAtTime(0, c.currentTime + 2)
        setTimeout(() => stops.forEach((s) => s()), 2100)
      }
    }
  }
}

export const audio = new AudioEngine()
