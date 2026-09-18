// HUD: objective sticky note, fragment counter, lanyard chip, toasts, held-item chip (spec §4.3).
import { FRAGMENTS, LANYARD_TIERS, lanyardTier, type FragmentId } from '../config.ts'
import { drawRemapLogo } from '../engine/textures.ts'
import { audio } from '../engine/audio.ts'

export class HUD {
  root: HTMLDivElement
  private sticky: HTMLDivElement
  private stickyText: HTMLDivElement
  private stickyWhere: HTMLDivElement
  private stickyHint: HTMLDivElement
  private fragCanvas: HTMLCanvasElement
  private fragLabel: HTMLDivElement
  private lanyardChip: HTMLDivElement
  private toastEl: HTMLDivElement
  private heldChip: HTMLDivElement
  private toastTimer = 0
  private toastQueue: string[] = []
  private idleTimer = 0
  private flipT = -1
  currentObjective = ''
  currentHint = ''
  neatHandwriting = false

  constructor(uiRoot: HTMLElement) {
    this.root = document.createElement('div')
    this.root.className = 'hud'
    uiRoot.appendChild(this.root)

    this.sticky = document.createElement('div')
    this.sticky.className = 'sticky-note'
    const label = document.createElement('div')
    label.className = 'sticky-label'
    label.textContent = 'MISSION'
    this.sticky.appendChild(label)
    this.stickyText = document.createElement('div')
    this.stickyText.className = 'sticky-text'
    this.stickyWhere = document.createElement('div')
    this.stickyWhere.className = 'sticky-where'
    this.stickyHint = document.createElement('div')
    this.stickyHint.className = 'sticky-hint'
    this.sticky.append(this.stickyText, this.stickyWhere, this.stickyHint)
    this.root.appendChild(this.sticky)

    this.heldChip = document.createElement('div')
    this.heldChip.className = 'held-chip'
    this.heldChip.style.display = 'none'
    this.root.appendChild(this.heldChip)

    const fragWrap = document.createElement('div')
    fragWrap.className = 'frag-counter'
    this.fragCanvas = document.createElement('canvas')
    this.fragCanvas.width = 96
    this.fragCanvas.height = 96
    this.fragLabel = document.createElement('div')
    this.fragLabel.className = 'frag-label'
    fragWrap.append(this.fragCanvas, this.fragLabel)
    this.root.appendChild(fragWrap)
    fragWrap.addEventListener('mouseenter', () => this.showFragNames())
    fragWrap.addEventListener('mouseleave', () => { this.fragLabel.textContent = '' })

    this.lanyardChip = document.createElement('div')
    this.lanyardChip.className = 'lanyard-chip'
    this.root.appendChild(this.lanyardChip)

    this.toastEl = document.createElement('div')
    this.toastEl.className = 'toast'
    this.toastEl.style.display = 'none'
    this.root.appendChild(this.toastEl)

    this.drawFragments(0)
    this.setLanyard(0)
  }

  private fragCount = 0
  private fragCollected: FragmentId[] = []

  setObjective(text: string, hint: string, silent = false, where = '') {
    if (text === this.currentObjective) { this.currentHint = hint; this.stickyWhere.textContent = where; return }
    this.currentObjective = text
    this.currentHint = hint
    // peel-off animation
    this.sticky.classList.remove('peel')
    void this.sticky.offsetWidth
    this.sticky.classList.add('peel')
    this.stickyText.textContent = text
    this.stickyWhere.textContent = where
    this.stickyHint.textContent = ''
    this.sticky.classList.toggle('neat', this.neatHandwriting)
    if (!silent) audio.sfx('paperPeel')
  }

  flipHint() {
    this.flipT = 0
    this.stickyHint.textContent = this.currentHint
    this.sticky.classList.add('flipped')
    setTimeout(() => this.sticky.classList.remove('flipped'), 6000)
    audio.sfx('paperPeel')
  }

  setFragments(collected: FragmentId[]) {
    this.fragCollected = collected
    this.fragCount = collected.length
    this.drawFragments(this.fragCount)
    this.setLanyard(lanyardTier(this.fragCount))
  }

  private drawFragments(n: number) {
    const g = this.fragCanvas.getContext('2d')!
    g.clearRect(0, 0, 96, 96)
    // ghosted outline of the full logo
    g.globalAlpha = 0.22
    drawRemapLogo(g, 48, 40, 62, '#aab4c4', 7, '#aab4c4')
    g.globalAlpha = 1
    // collected pieces in brand colours (light ink for the dark HUD)
    drawRemapLogo(g, 48, 40, 62, '#f2f4f8', n)
    g.fillStyle = '#cfd6e4'
    g.font = 'bold 13px Arial'
    g.textAlign = 'center'
    g.fillText(`${n}/7`, 48, 90)
  }

  private showFragNames() {
    const names = FRAGMENTS.filter((f) => this.fragCollected.includes(f.id)).map((f) => f.name)
    this.fragLabel.textContent = names.length ? names.join(' · ') : 'No fragments yet'
  }

  setLanyard(tier: number) {
    const t = LANYARD_TIERS[Math.min(tier, LANYARD_TIERS.length - 1)]
    this.lanyardChip.innerHTML = `<span class="badge-ico">▮</span> ${t.label}`
  }

  setHeldItem(name: string | null) {
    if (name) {
      this.heldChip.style.display = 'block'
      this.heldChip.textContent = `Holding: ${name}`
    } else {
      this.heldChip.style.display = 'none'
    }
  }

  toast(text: string) {
    this.toastQueue.push(text)
  }

  setTextScale(pct: number) {
    this.root.style.fontSize = `${pct}%`
    document.documentElement.style.setProperty('--text-scale', `${pct / 100}`)
  }

  update(dt: number, playerMoving: boolean) {
    // toast queue
    if (this.toastTimer > 0) {
      this.toastTimer -= dt
      if (this.toastTimer <= 0) {
        this.toastEl.style.display = 'none'
      }
    } else if (this.toastQueue.length) {
      const t = this.toastQueue.shift()!
      this.toastEl.textContent = t
      this.toastEl.style.display = 'block'
      this.toastTimer = 3 + t.length * 0.02
    }
    // fade HUD when idle
    this.idleTimer = playerMoving ? 0 : this.idleTimer + dt
    this.root.classList.toggle('hud-faded', this.idleTimer > 12)
  }

  hide(h: boolean) { this.root.style.display = h ? 'none' : 'block' }
}
