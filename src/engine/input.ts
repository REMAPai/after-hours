// Unified keyboard/mouse + gamepad input with automatic glyph swapping (spec §3.3, §6.5).

export type Device = 'kb' | 'pad'
export type Action = 'interact' | 'back' | 'hint' | 'map' | 'pause' | 'choice1' | 'choice2' | 'choice3' | 'up' | 'down'

export class Input {
  keys = new Set<string>()
  device: Device = 'kb'
  lookX = 0
  lookY = 0
  pointerLocked = false
  onDeviceChange: ((d: Device) => void) | null = null
  private pressed = new Set<Action>()
  private held = new Set<Action>()
  private prevPadButtons: boolean[] = []
  private canvas: HTMLElement
  wantPointerLock = false
  interactHoldTime = 0

  constructor(canvas: HTMLElement) {
    this.canvas = canvas
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return
      this.setDevice('kb')
      this.keys.add(e.code)
      const a = keyToAction(e.code)
      if (a) { this.pressed.add(a); this.held.add(a) }
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault()
    })
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code)
      const a = keyToAction(e.code)
      if (a) this.held.delete(a)
    })
    window.addEventListener('mousemove', (e) => {
      if (this.pointerLocked) {
        this.lookX += e.movementX
        this.lookY += e.movementY
      }
    })
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) { this.setDevice('kb'); this.pressed.add('interact'); this.held.add('interact') }
      if (e.button === 2) { this.pressed.add('back') }
    })
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.held.delete('interact')
    })
    window.addEventListener('contextmenu', (e) => e.preventDefault())
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.canvas
    })
    window.addEventListener('gamepadconnected', () => this.setDevice('pad'))
  }

  setDevice(d: Device) {
    if (this.device !== d) {
      this.device = d
      this.onDeviceChange?.(d)
    }
  }

  requestPointerLock() {
    try {
      const p = (this.canvas as HTMLCanvasElement).requestPointerLock?.() as unknown
      if (p instanceof Promise) p.catch(() => { /* embedded contexts may refuse; fine */ })
    } catch { /* fine */ }
  }
  exitPointerLock() {
    try { document.exitPointerLock?.() } catch { /* fine */ }
  }

  // Movement vector in input space: x = strafe (right+), y = forward (+)
  moveVector(): { x: number; y: number; jog: boolean } {
    let x = 0, y = 0
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y += 1
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y -= 1
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1
    let jog = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')
    const gp = this.pad()
    if (gp) {
      const gx = dead(gp.axes[0]), gy = dead(-gp.axes[1])
      if (Math.abs(gx) > 0 || Math.abs(gy) > 0) { x = gx; y = gy; this.setDevice('pad') }
      if (gp.buttons[10]?.pressed || (gp.buttons[0]?.pressed && (Math.abs(gx) > 0.5 || Math.abs(gy) > 0.5))) jog = true
    }
    const len = Math.hypot(x, y)
    if (len > 1) { x /= len; y /= len }
    return { x, y, jog }
  }

  lookDelta(sensitivity: number, invertY: boolean): { x: number; y: number } {
    let dx = this.lookX * sensitivity
    let dy = this.lookY * sensitivity
    this.lookX = 0; this.lookY = 0
    const gp = this.pad()
    if (gp) {
      const rx = dead(gp.axes[2]), ry = dead(gp.axes[3])
      if (Math.abs(rx) > 0 || Math.abs(ry) > 0) this.setDevice('pad')
      dx += rx * 0.045
      dy += ry * 0.035
    }
    if (invertY) dy = -dy
    return { x: dx, y: dy }
  }

  private pad(): Gamepad | null {
    const pads = navigator.getGamepads?.() ?? []
    for (const p of pads) if (p && p.connected) return p
    return null
  }

  // Poll pad buttons -> edge-triggered actions. Call once per frame.
  update(dt: number) {
    const gp = this.pad()
    if (gp) {
      const map: [number, Action][] = [
        [0, 'interact'], [1, 'back'], [3, 'hint'], [8, 'map'], [9, 'pause'],
        [12, 'up'], [13, 'down']
      ]
      for (const [idx, action] of map) {
        const now = !!gp.buttons[idx]?.pressed
        const before = this.prevPadButtons[idx] ?? false
        if (now && !before) { this.pressed.add(action); this.held.add(action); this.setDevice('pad') }
        if (!now && before) this.held.delete(action)
        this.prevPadButtons[idx] = now
      }
    }
    this.interactHoldTime = this.held.has('interact') ? this.interactHoldTime + dt : 0
  }

  consume(a: Action): boolean {
    if (this.pressed.has(a)) { this.pressed.delete(a); return true }
    return false
  }
  peek(a: Action): boolean { return this.pressed.has(a) }
  clearFrame() { this.pressed.clear() }
  isHeld(a: Action): boolean { return this.held.has(a) }
}

function keyToAction(code: string): Action | null {
  switch (code) {
    case 'KeyE': return 'interact'
    case 'Escape': return 'back'
    case 'KeyH': return 'hint'
    case 'KeyM': return 'map'
    case 'KeyP': return 'pause'
    case 'Digit1': return 'choice1'
    case 'Digit2': return 'choice2'
    case 'Digit3': return 'choice3'
    default: return null
  }
}

function dead(v: number): number {
  return Math.abs(v) < 0.18 ? 0 : v
}

// --- Glyphs (inline SVG/CSS, spec §6.5) ------------------------------------

export function glyph(action: 'interact' | 'back' | 'hint' | 'map' | 'pause', device: Device): string {
  if (device === 'pad') {
    const m: Record<string, [string, string]> = {
      interact: ['A', '#6BCB77'], back: ['B', '#E86B4A'], hint: ['Y', '#F2C879'], map: ['⧉', '#ccc'], pause: ['≡', '#ccc']
    }
    const [t, c] = m[action]
    return `<span class="glyph pad" style="border-color:${c};color:${c}">${t}</span>`
  }
  const m: Record<string, string> = { interact: 'E', back: 'Esc', hint: 'H', map: 'M', pause: 'P' }
  return `<span class="glyph key">${m[action]}</span>`
}
