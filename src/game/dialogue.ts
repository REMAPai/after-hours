// World-space speech bubbles with typewriter + voice blips + choices (spec §6.2, §26).
import * as THREE from 'three'
import { audio } from '../engine/audio.ts'
import { BLIPS } from '../data/dialogue.ts'
import { glyph, type Device } from '../engine/input.ts'
import { speech } from '../engine/speech.ts'

export interface DialogueLine {
  speaker: string          // blip + name tag key
  name?: string            // display name (first bubble of exchange)
  text: string
  anchor?: THREE.Object3D | (() => THREE.Vector3)  // world anchor; default: screen bottom
  choices?: { label: string; value: string }[]
}

export interface SayOpts { onDone?: () => void; onChoice?: (v: string) => void; critical?: boolean }

interface ActiveExchange {
  lines: DialogueLine[]
  index: number
  onChoice?: (value: string) => void
  onDone?: () => void
  critical: boolean
}

export class DialogueSystem {
  private bubble: HTMLDivElement
  private nameTag: HTMLDivElement
  private textEl: HTMLDivElement
  private choicesEl: HTMLDivElement
  private contEl: HTMLDivElement
  private exchange: ActiveExchange | null = null
  // Exchanges started while one is playing wait their turn instead of replacing it,
  // so puzzle callbacks (onDone/onChoice) are never lost when the player keeps acting.
  private queue: { lines: DialogueLine[]; opts: SayOpts }[] = []
  private charIndex = 0
  private charTimer = 0
  private device: Device = 'kb'
  private choiceIdx = 0
  charsPerSec = 35
  // Lines play out on their own: advance when the spoken line ends (or after a
  // reading-time fallback). Choice lines always wait for the player.
  autoAdvance = true
  private lineTimer = 0
  private lineToken = 0
  private speechDone = true
  active = false
  log: { name: string; text: string }[] = []
  onExchangeStart: ((line: DialogueLine) => void) | null = null
  onExchangeEnd: (() => void) | null = null
  camera: THREE.PerspectiveCamera | null = null

  constructor(uiRoot: HTMLElement) {
    this.bubble = document.createElement('div')
    this.bubble.className = 'speech-bubble'
    this.bubble.style.display = 'none'
    this.nameTag = document.createElement('div')
    this.nameTag.className = 'speech-name'
    this.textEl = document.createElement('div')
    this.textEl.className = 'speech-text'
    this.choicesEl = document.createElement('div')
    this.choicesEl.className = 'speech-choices'
    this.contEl = document.createElement('div')
    this.contEl.className = 'speech-continue'
    this.bubble.append(this.nameTag, this.textEl, this.choicesEl, this.contEl)
    uiRoot.appendChild(this.bubble)
  }

  setDevice(d: Device) { this.device = d }

  say(lines: DialogueLine[], opts: SayOpts = {}) {
    if (this.exchange) {
      // Talking to the ghost who is already talking (or re-pressing E) skips the
      // current line instead of queueing a repeat of their whole script.
      const cur = this.cur()
      const same = cur && lines[0] && lines[0].speaker === cur.speaker && !opts.onDone && !opts.onChoice
      const dup = this.queue.some((q) => q.lines[0]?.text === lines[0]?.text)
      if (same || dup) { this.advance(); return }
      this.queue.push({ lines, opts })
      return
    }
    this.exchange ={ lines, index: 0, onDone: opts.onDone, onChoice: opts.onChoice, critical: opts.critical ?? false }
    this.active = true
    this.startLine()
  }

  private cur(): DialogueLine | null {
    return this.exchange ? this.exchange.lines[this.exchange.index] ?? null : null
  }

  private startLine() {
    const line = this.cur()
    if (!line) { this.end(); return }
    this.charIndex = 0
    this.charTimer = 0
    this.choiceIdx = 0
    this.bubble.style.display = 'block'
    this.nameTag.textContent = line.name ?? ''
    this.nameTag.style.display = line.name ? 'block' : 'none'
    this.textEl.textContent = ''
    this.choicesEl.innerHTML = ''
    this.contEl.innerHTML = ''
    if (this.charsPerSec >= 999) this.charIndex = line.text.length
    if (this.exchange?.index === 0) this.onExchangeStart?.(line)
    this.lineTimer = 0
    const token = ++this.lineToken
    this.speechDone = !speech.speak(line.speaker, line.text, () => { if (token === this.lineToken) this.speechDone = true })
    this.log.push({ name: line.name ?? line.speaker, text: line.text })
    if (this.log.length > 30) this.log.shift()
  }

  // Returns true if input was consumed.
  advance(): boolean {
    const line = this.cur()
    if (!line || !this.exchange) return false
    if (this.charIndex < line.text.length) {
      this.charIndex = line.text.length // complete typewriter
      return true
    }
    if (line.choices && line.choices.length) {
      // choose focused option
      const c = line.choices[this.choiceIdx]
      const onChoice = this.exchange.onChoice
      this.exchange.index++
      if (this.exchange.index >= this.exchange.lines.length) this.end()
      else this.startLine()
      onChoice?.(c.value)
      audio.sfx('uiClack')
      return true
    }
    this.exchange.index++
    if (this.exchange.index >= this.exchange.lines.length) { this.end() } else this.startLine()
    return true
  }

  moveChoice(dir: number) {
    const line = this.cur()
    if (!line?.choices) return
    this.choiceIdx = (this.choiceIdx + dir + line.choices.length) % line.choices.length
    audio.sfx('uiClack')
  }
  selectChoice(i: number) {
    const line = this.cur()
    if (!line?.choices || i >= line.choices.length) return
    this.choiceIdx = i
    this.advance()
  }

  tryClose(): boolean {
    if (!this.exchange) return false
    if (this.exchange.critical) return true // consume but don't skip story-critical lines
    this.end()
    return true
  }

  private end() {
    const finished = this.exchange
    speech.stop()
    this.exchange = null
    this.active = false
    this.bubble.style.display = 'none'
    this.onExchangeEnd?.()
    finished?.onDone?.()
    const next = this.queue.shift()
    if (next) setTimeout(() => { if (!this.exchange) this.say(next.lines, next.opts); else this.queue.unshift(next) }, 350)
  }

  isTalking(): boolean {
    const line = this.cur()
    return !!line && this.charIndex < line.text.length
  }
  currentSpeaker(): string | null { return this.cur()?.speaker ?? null }

  update(dt: number) {
    const line = this.cur()
    if (!line) return
    // typewriter
    if (this.charIndex < line.text.length) {
      this.charTimer += dt * this.charsPerSec
      while (this.charTimer >= 1 && this.charIndex < line.text.length) {
        this.charTimer -= 1
        this.charIndex++
        const ch = line.text[this.charIndex - 1]
        if (ch && ch !== ' ' && this.charIndex % 2 === 0 && !(speech.enabled && speech.available)) {
          const blip = BLIPS[line.speaker] ?? BLIPS.narrator
          audio.blip(blip.pitch, blip.low)
        }
      }
      this.textEl.textContent = line.text.slice(0, this.charIndex)
      this.contEl.innerHTML = ''
    } else {
      this.textEl.textContent = line.text
      if (line.choices && line.choices.length) {
        if (!this.choicesEl.childElementCount) {
          line.choices.forEach((c, i) => {
            const b = document.createElement('button')
            b.className = 'choice-btn'
            b.textContent = `${i + 1}. ${c.label}`
            b.onclick = () => this.selectChoice(i)
            this.choicesEl.appendChild(b)
          })
        }
        Array.from(this.choicesEl.children).forEach((el, i) => {
          el.classList.toggle('focused', i === this.choiceIdx)
        })
        this.contEl.innerHTML = ''
      } else {
        this.contEl.innerHTML = `${glyph('interact', this.device)} skip`
        // auto-advance: minimum reading time, then wait for the voice to finish (capped)
        this.lineTimer += dt
        const readTime = Math.max(1.2, 0.8 + line.text.length * 0.028)
        // voice done = its end event fired, or nothing is speaking any more; hard cap
        // scaled to the line so a stuck speech engine can never freeze a conversation
        // the speech engine guarantees onEnd (start/duration watchdogs), so the cap is
        // only a last resort — kept short so nothing ever feels stuck
        const voiceDone = this.speechDone
        const cap = readTime + Math.min(8, line.text.length * 0.04)
        if (this.autoAdvance && this.lineTimer >= readTime && (voiceDone || this.lineTimer > cap)) {
          this.advance()
          return
        }
      }
    }
    // position: project anchor
    if (this.camera) {
      let world: THREE.Vector3 | null = null
      if (line.anchor instanceof THREE.Object3D) {
        world = new THREE.Vector3()
        line.anchor.getWorldPosition(world)
        world.y += 1.95
      } else if (typeof line.anchor === 'function') {
        world = line.anchor()
      }
      if (world) {
        const p = world.clone().project(this.camera)
        let x = (p.x * 0.5 + 0.5) * innerWidth
        let y = (-p.y * 0.5 + 0.5) * innerHeight
        const behind = p.z > 1
        if (behind) { x = innerWidth / 2; y = innerHeight * 0.25 }
        x = Math.max(170, Math.min(innerWidth - 170, x))
        y = Math.max(80, Math.min(innerHeight - 160, y))
        this.bubble.style.left = `${x}px`
        this.bubble.style.top = `${y}px`
        this.bubble.classList.remove('bottom')
      } else {
        this.bubble.style.left = '50%'
        this.bubble.style.top = ''
        this.bubble.classList.add('bottom')
      }
    }
  }
}
