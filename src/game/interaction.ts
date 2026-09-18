// One interactable system for everything (spec §6.1).
import * as THREE from 'three'
import { INTERACT } from '../config.ts'
import { glyph, type Device } from '../engine/input.ts'

export interface Interactable {
  id: string
  position: THREE.Vector3
  radius?: number
  verb: string            // always specific: "Talk", "Inspect", "Label sandwich"
  enabled?: () => boolean
  onInteract: () => void
  mesh?: THREE.Object3D   // optional highlight target
  prompt?: string         // overrides verb text
  priority?: number       // subtracted from distance when picking focus (ghosts > props)
}

export class InteractionSystem {
  items = new Map<string, Interactable>()
  focused: Interactable | null = null
  private el: HTMLDivElement
  private device: Device = 'kb'
  suppressed = false
  private pulseT = 0

  constructor(uiRoot: HTMLElement) {
    this.el = document.createElement('div')
    this.el.className = 'interact-prompt'
    this.el.style.display = 'none'
    uiRoot.appendChild(this.el)
  }

  add(i: Interactable) { this.items.set(i.id, i) }
  remove(id: string) { this.items.delete(id) }
  get(id: string) { return this.items.get(id) }
  setDevice(d: Device) { this.device = d }

  update(dt: number, playerPos: THREE.Vector3, camera: THREE.PerspectiveCamera) {
    this.pulseT += dt
    if (this.suppressed) { this.setFocus(null); this.el.style.display = 'none'; return }
    const camFwd = new THREE.Vector3()
    camera.getWorldDirection(camFwd)
    let best: Interactable | null = null
    let bestD = Infinity
    for (const it of this.items.values()) {
      if (it.enabled && !it.enabled()) continue
      // horizontal distance (interactables sit at varying heights)
      const d = Math.hypot(it.position.x - playerPos.x, it.position.z - playerPos.z)
      if (Math.abs(it.position.y - playerPos.y) > 2.6) continue
      const r = it.radius ?? INTERACT.radius
      if (d > r) continue
      const toIt = it.position.clone().sub(camera.position).normalize()
      if (toIt.dot(camFwd) < INTERACT.angleCos) continue
      const score = d - (it.priority ?? 0)
      if (score < bestD) { bestD = score; best = it }
    }
    this.setFocus(best)
    if (best) {
      // project to screen
      const p = best.position.clone().add(new THREE.Vector3(0, 0.35, 0)).project(camera)
      if (p.z < 1) {
        const x = (p.x * 0.5 + 0.5) * innerWidth
        const y = (-p.y * 0.5 + 0.5) * innerHeight
        this.el.style.display = 'block'
        this.el.style.left = `${x}px`
        this.el.style.top = `${y}px`
        this.el.innerHTML = `${glyph('interact', this.device)} <span class="verb">${best.prompt ?? best.verb}</span>`
      } else {
        this.el.style.display = 'none'
      }
    } else {
      this.el.style.display = 'none'
    }
  }

  private setFocus(it: Interactable | null) {
    if (this.focused === it) {
      this.applyPulse()
      return
    }
    this.clearHighlight(this.focused)
    this.focused = it
    this.applyPulse()
  }

  private applyPulse() {
    if (!this.focused?.mesh) return
    const s = 1 + Math.sin(this.pulseT * 5) * 0.02
    const pulse = 0.25 + Math.sin(this.pulseT * 5) * 0.15
    this.focused.mesh.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial
      if (m && 'emissiveIntensity' in m) {
        if ((o as THREE.Mesh).userData.baseEmissive === undefined) {
          ;(o as THREE.Mesh).userData.baseEmissive = m.emissiveIntensity
          ;(o as THREE.Mesh).userData.baseEmissiveColor = m.emissive?.clone()
        }
        if (m.emissive && m.emissive.getHex() === 0) m.emissive = new THREE.Color(0xffffff)
        // textured props glow through their artwork instead of washing white
        if (m.map && !m.emissiveMap) { m.emissiveMap = m.map; m.needsUpdate = true }
        m.emissiveIntensity = ((o as THREE.Mesh).userData.baseEmissive as number) + pulse * 0.3
      }
    })
    if (this.focused.mesh.userData.baseScale === undefined) this.focused.mesh.userData.baseScale = this.focused.mesh.scale.x
    // small scale pulse only for small props
  }

  private clearHighlight(it: Interactable | null) {
    if (!it?.mesh) return
    it.mesh.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial
      const base = (o as THREE.Mesh).userData.baseEmissive
      if (m && base !== undefined) {
        m.emissiveIntensity = base
        const bc = (o as THREE.Mesh).userData.baseEmissiveColor
        if (bc) m.emissive = bc
      }
    })
  }

  tryInteract(): boolean {
    if (this.focused && !this.suppressed) {
      this.focused.onInteract()
      return true
    }
    return false
  }
}
