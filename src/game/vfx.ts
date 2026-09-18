// Lightweight pooled particles + fragment shard (spec §23).
import * as THREE from 'three'
import { makeScreenDot } from '../characters/playerChar.ts'

interface Burst {
  points: THREE.Points
  vels: Float32Array
  life: number
  maxLife: number
  gravity: number
  target?: THREE.Vector3
}

export class VFX {
  private bursts: Burst[] = []
  constructor(public scene: THREE.Scene) {}

  burst(pos: THREE.Vector3, count: number, color: number, opts: { speed?: number; gravity?: number; life?: number; up?: boolean; target?: THREE.Vector3; size?: number } = {}) {
    const positions = new Float32Array(count * 3)
    const vels = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x + (Math.random() - 0.5) * 0.3
      positions[i * 3 + 1] = pos.y + (Math.random() - 0.5) * 0.8 + 0.6
      positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.3
      const s = opts.speed ?? 1
      vels[i * 3] = (Math.random() - 0.5) * s
      vels[i * 3 + 1] = opts.up ? Math.random() * s * 1.5 : (Math.random() - 0.5) * s
      vels[i * 3 + 2] = (Math.random() - 0.5) * s
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color, size: opts.size ?? 0.05, map: makeScreenDot(), transparent: true,
      opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending
    })
    const points = new THREE.Points(geo, mat)
    this.scene.add(points)
    this.bursts.push({ points, vels, life: 0, maxLife: opts.life ?? 1.6, gravity: opts.gravity ?? 0, target: opts.target })
  }

  confetti(pos: THREE.Vector3, count = 60) {
    // sticky-note confetti: small yellow planes handled as points for cheapness
    this.burst(pos, count, 0xf7e97a, { speed: 2.4, gravity: -2.2, life: 3.2, up: true, size: 0.09 })
  }

  update(dt: number) {
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i]
      b.life += dt
      const attr = b.points.geometry.getAttribute('position') as THREE.BufferAttribute
      const arr = attr.array as Float32Array
      for (let j = 0; j < arr.length / 3; j++) {
        if (b.target) {
          // converge toward target
          const k = Math.min(1, b.life / b.maxLife)
          arr[j * 3] += (b.target.x - arr[j * 3]) * k * dt * 6 + b.vels[j * 3] * dt * (1 - k)
          arr[j * 3 + 1] += (b.target.y - arr[j * 3 + 1]) * k * dt * 6 + b.vels[j * 3 + 1] * dt * (1 - k)
          arr[j * 3 + 2] += (b.target.z - arr[j * 3 + 2]) * k * dt * 6 + b.vels[j * 3 + 2] * dt * (1 - k)
        } else {
          b.vels[j * 3 + 1] += b.gravity * dt
          arr[j * 3] += b.vels[j * 3] * dt
          arr[j * 3 + 1] += b.vels[j * 3 + 1] * dt
          arr[j * 3 + 2] += b.vels[j * 3 + 2] * dt
          if (arr[j * 3 + 1] < 0.02) arr[j * 3 + 1] = 0.02
        }
      }
      attr.needsUpdate = true
      const m = b.points.material as THREE.PointsMaterial
      m.opacity = Math.max(0, 1 - b.life / b.maxLife)
      if (b.life >= b.maxLife) {
        this.scene.remove(b.points)
        b.points.geometry.dispose()
        m.dispose()
        this.bursts.splice(i, 1)
      }
    }
  }
}

export function makeShard(color = 0xf4581c): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.09, 0),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.4, roughness: 0.2 })
  )
  return m
}
