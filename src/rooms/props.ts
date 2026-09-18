// Shared code-built prop library (spec §24). Chunky, bevel-ish, readable silhouettes.
import * as THREE from 'three'
import { makeLabelTexture, makeScreenTexture } from '../engine/textures.ts'

export function std(color: number, opts: { rough?: number; metal?: number; emissive?: number; emissiveIntensity?: number } = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.rough ?? 0.7,
    metalness: opts.metal ?? 0.05,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1
  })
}

export function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

export function cyl(rTop: number, rBot: number, h: number, mat: THREE.Material, x = 0, y = 0, z = 0, seg = 12): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat)
  m.position.set(x, y, z)
  m.castShadow = true
  return m
}

export function desk(w = 1.6, d = 0.8): THREE.Group {
  const g = new THREE.Group()
  const top = box(w, 0.05, d, std(0x8a6f52, { rough: 0.55 }), 0, 0.74, 0)
  g.add(top)
  const legMat = std(0x3a3d42, { metal: 0.5, rough: 0.4 })
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    g.add(box(0.05, 0.72, 0.05, legMat, sx * (w / 2 - 0.06), 0.36, sz * (d / 2 - 0.06)))
  }
  return g
}

export function officeChair(color = 0x33373d): THREE.Group {
  const g = new THREE.Group()
  const mat = std(color, { rough: 0.75 })
  g.add(box(0.42, 0.06, 0.42, mat, 0, 0.46, 0))
  const back = box(0.42, 0.5, 0.06, mat, 0, 0.75, -0.2)
  g.add(back)
  g.add(cyl(0.03, 0.03, 0.4, std(0x555a61, { metal: 0.7, rough: 0.3 }), 0, 0.25, 0))
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const leg = box(0.22, 0.03, 0.05, std(0x555a61, { metal: 0.7, rough: 0.3 }), Math.sin(a) * 0.12, 0.04, Math.cos(a) * 0.12)
    leg.rotation.y = a
    g.add(leg)
  }
  return g
}

export function monitor(screenDraw?: (g: CanvasRenderingContext2D, w: number, h: number) => void, emissiveIntensity = 1.2): THREE.Group {
  const g = new THREE.Group()
  g.add(box(0.52, 0.32, 0.03, std(0x1a1c20, { rough: 0.3 }), 0, 0.36, 0))
  const tex = screenDraw
    ? makeScreenTexture(screenDraw, 256, 160)
    : makeScreenTexture((c, w, h) => { c.fillStyle = '#0a0c10'; c.fillRect(0, 0, w, h) })
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.48, 0.28),
    new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity, map: tex })
  )
  screen.position.set(0, 0.36, 0.017)
  g.add(screen)
  g.add(cyl(0.03, 0.05, 0.18, std(0x222428), 0, 0.1, 0))
  g.add(box(0.2, 0.02, 0.14, std(0x222428), 0, 0.01, 0))
  return g
}

export function poster(text: string, w = 0.7, h = 0.9, bg = '#3d4653', fg = '#cfd8e4'): THREE.Mesh {
  const p = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: makeLabelTexture(text, { w: 256, h: 320, bg, fg }), roughness: 0.9 })
  )
  return p
}

export function stickyNote3D(text: string, size = 0.22): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({ map: makeLabelTexture(text, { w: 128, h: 128, bg: '#f7e97a', fg: '#5a4a20', hand: true }) })
  )
}

export function plant(dead = true): THREE.Group {
  const g = new THREE.Group()
  g.add(cyl(0.14, 0.11, 0.22, std(0x8a5a3a), 0, 0.11, 0))
  const leafMat = std(dead ? 0x6b5a3a : 0x4a8a4a, { rough: 0.8 })
  for (let i = 0; i < 6; i++) {
    const leaf = box(0.03, 0.35, 0.008, leafMat, 0, 0.38, 0)
    leaf.rotation.z = (i - 2.5) * (dead ? 0.5 : 0.25)
    leaf.rotation.y = i * 1.1
    leaf.position.x = Math.sin(i) * 0.05
    if (dead) leaf.rotation.z += 0.9 * Math.sign(leaf.rotation.z || 1)
    g.add(leaf)
  }
  return g
}

export function shelfUnit(w = 1.8, h = 2.4, d = 0.4, shelves = 5): THREE.Group {
  const g = new THREE.Group()
  const mat = std(0x5e6066, { rough: 0.7, metal: 0.3 })
  for (let i = 0; i <= shelves; i++) {
    g.add(box(w, 0.04, d, mat, 0, (i / shelves) * h, 0))
  }
  g.add(box(0.05, h, d, mat, -w / 2, h / 2, 0))
  g.add(box(0.05, h, d, mat, w / 2, h / 2, 0))
  return g
}

export function binderRow(w: number, y: number, colors: number[]): THREE.Group {
  const g = new THREE.Group()
  let x = -w / 2 + 0.05
  let i = 0
  while (x < w / 2 - 0.05) {
    const bw = 0.07 + Math.random() * 0.03
    const bh = 0.28 + Math.random() * 0.06
    const b = box(bw, bh, 0.3, std(colors[i % colors.length], { rough: 0.85 }), x + bw / 2, y + bh / 2 + 0.02, 0)
    b.rotation.z = (Math.random() - 0.5) * 0.06
    g.add(b)
    x += bw + 0.012
    i++
  }
  return g
}

export function paperStack(n = 4): THREE.Group {
  const g = new THREE.Group()
  for (let i = 0; i < n; i++) {
    const p = box(0.3 + Math.random() * 0.06, 0.05, 0.4, std(0xe8e4d8, { rough: 0.95 }), (Math.random() - 0.5) * 0.05, 0.025 + i * 0.052, (Math.random() - 0.5) * 0.05)
    p.rotation.y = (Math.random() - 0.5) * 0.3
    g.add(p)
  }
  return g
}

export function mug(color = 0xffffff): THREE.Group {
  const g = new THREE.Group()
  g.add(cyl(0.04, 0.035, 0.09, std(color, { rough: 0.4 }), 0, 0.045, 0))
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.008, 6, 10, Math.PI), std(color, { rough: 0.4 }))
  handle.position.set(0.045, 0.045, 0)
  handle.rotation.z = -Math.PI / 2
  g.add(handle)
  return g
}

export function vendingMachine(): THREE.Group {
  const g = new THREE.Group()
  g.add(box(0.9, 1.9, 0.7, std(0x2a3440, { rough: 0.4 }), 0, 0.95, 0))
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x8899aa, transparent: true, opacity: 0.35, roughness: 0.2 })
  )
  glass.position.set(-0.1, 1.15, 0.355)
  g.add(glass)
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(0.18, 0.1),
    std(0x000000, { emissive: 0x7cffd4, emissiveIntensity: 2 })
  )
  display.position.set(0.32, 1.5, 0.36)
  g.add(display)
  // coils + snacks
  for (let r = 0; r < 3; r++) {
    for (let cIdx = 0; cIdx < 3; cIdx++) {
      const snack = box(0.1, 0.14, 0.05, std([0xaa5544, 0x5577aa, 0x77aa55][(r + cIdx) % 3], { rough: 0.6 }),
        -0.28 + cIdx * 0.17, 1.55 - r * 0.32, 0.25)
      g.add(snack)
    }
  }
  return g
}

export function fridge(): { group: THREE.Group; door: THREE.Group; innerLight: THREE.PointLight } {
  const group = new THREE.Group()
  const body = box(0.8, 1.7, 0.75, std(0xd8dde2, { rough: 0.35, metal: 0.3 }), 0, 0.85, 0)
  group.add(body)
  const door = new THREE.Group()
  const doorMesh = box(0.78, 1.64, 0.06, std(0xcdd3d8, { rough: 0.3, metal: 0.35 }), 0.38, 0, 0)
  door.add(doorMesh)
  const handle = box(0.03, 0.5, 0.04, std(0x8a9096, { metal: 0.7, rough: 0.3 }), 0.72, 0.2, 0.06)
  door.add(handle)
  door.position.set(-0.4, 0.85, 0.38)
  group.add(door)
  const innerLight = new THREE.PointLight(0xdff6ff, 0, 3)
  innerLight.position.set(0, 1.2, 0.5)
  group.add(innerLight)
  return { group, door, innerLight }
}

export function serverRack(ledColor = 0x3a7bff): { group: THREE.Group; leds: THREE.MeshStandardMaterial } {
  const group = new THREE.Group()
  group.add(box(0.7, 2.1, 0.9, std(0x14181e, { rough: 0.45, metal: 0.4 }), 0, 1.05, 0))
  const ledMat = std(0x000000, { emissive: ledColor, emissiveIntensity: 2 })
  for (let u = 0; u < 12; u++) {
    group.add(box(0.62, 0.1, 0.02, std(0x232830, { rough: 0.5, metal: 0.5 }), 0, 0.2 + u * 0.155, 0.455))
    for (let l = 0; l < 4; l++) {
      const led = box(0.02, 0.02, 0.012, ledMat, -0.22 + l * 0.09, 0.2 + u * 0.155, 0.465)
      group.add(led)
    }
  }
  return { group, leds: ledMat }
}

export function whiteboard(text: string, w = 1.8, h = 1.1): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: makeLabelTexture(text, { w: 512, h: 320, bg: '#f2f4f4', fg: '#33507a', hand: true }), roughness: 0.5 })
  )
}

export function ceilingPanelLight(color = 0xe6f1ff, intensity = 1): THREE.Group {
  const g = new THREE.Group()
  g.add(box(1.2, 0.05, 0.6, std(0xffffff, { emissive: color, emissiveIntensity: intensity })))
  return g
}

export function table(w = 3.6, d = 1.4, h = 0.75): THREE.Group {
  const g = new THREE.Group()
  g.add(box(w, 0.06, d, std(0x7a6248, { rough: 0.5 }), 0, h, 0))
  g.add(box(0.12, h, 0.12, std(0x3a3d42), -w / 2 + 0.3, h / 2, -d / 2 + 0.3))
  g.add(box(0.12, h, 0.12, std(0x3a3d42), w / 2 - 0.3, h / 2, -d / 2 + 0.3))
  g.add(box(0.12, h, 0.12, std(0x3a3d42), -w / 2 + 0.3, h / 2, d / 2 - 0.3))
  g.add(box(0.12, h, 0.12, std(0x3a3d42), w / 2 - 0.3, h / 2, d / 2 - 0.3))
  return g
}

export function deckchair(color = 0xcc7755): THREE.Group {
  const g = new THREE.Group()
  const frame = std(0x8a7a5a, { rough: 0.7 })
  const seat = box(0.5, 0.03, 1.1, std(color, { rough: 0.9 }), 0, 0.35, 0)
  seat.rotation.x = -0.35
  g.add(seat)
  g.add(box(0.04, 0.4, 0.04, frame, -0.24, 0.2, 0.4))
  g.add(box(0.04, 0.4, 0.04, frame, 0.24, 0.2, 0.4))
  g.add(box(0.04, 0.55, 0.04, frame, -0.24, 0.3, -0.4))
  g.add(box(0.04, 0.55, 0.04, frame, 0.24, 0.3, -0.4))
  return g
}

export function frame(tex: THREE.Texture, w = 0.6, h = 0.6): THREE.Group {
  const g = new THREE.Group()
  g.add(box(w + 0.06, h + 0.06, 0.03, std(0x4a3d2e, { rough: 0.5 })))
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }))
  pic.position.z = 0.02
  g.add(pic)
  return g
}
