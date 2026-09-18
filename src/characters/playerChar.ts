// The Player — "New Hire" (spec §19.2): backpack, phone-torch, lanyard tiers.
import * as THREE from 'three'
import { CharacterRig, blobMesh, tubeMesh, latheMesh, roundedBoxMesh } from './rig.ts'
import { makeLabelTexture, makeScreenTexture } from '../engine/textures.ts'

export class PlayerCharacter {
  rig: CharacterRig
  torch: THREE.SpotLight
  torchTarget: THREE.Object3D
  private badgeMesh: THREE.Mesh
  duckMesh: THREE.Group | null = null
  private tier = -1

  constructor() {
    this.rig = new CharacterRig({ skin: 0xd9a98c, hair: 0x3b2a22, shirt: 0x5b7da8, trousers: 0x2e3238 })
    const r = this.rig

    // Messy dark hair swept to one side, with a small back bun (per reference sheets).
    // Built as clustered merged spheres for organic volume, plus tube strands.
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x2c1f18, roughness: 0.45 })
    const volume = blobMesh([
      { r: 0.15, p: [0, 0.045, -0.035], s: [1.04, 0.9, 1.0] },      // core crown
      { r: 0.13, p: [0, 0.095, -0.07], s: [1.0, 0.82, 1.05] },      // top-back mass
      { r: 0.115, p: [-0.06, 0.06, 0.01], s: [1.0, 0.78, 1.0] },    // left swell (swept side)
      { r: 0.105, p: [0.062, 0.055, -0.015], s: [0.92, 0.74, 0.98] },
      { r: 0.1, p: [0, 0.015, -0.105], s: [1.08, 0.92, 0.8] },      // nape
      { r: 0.055, p: [-0.09, 0.12, -0.015], s: [1.05, 0.62, 1.15], e: [0, 0.3, 0.45] },  // messy lumps
      { r: 0.05, p: [0.075, 0.125, -0.055], s: [1.0, 0.6, 1.2], e: [0, -0.5, -0.35] },
      { r: 0.06, p: [-0.11, 0.075, -0.06], s: [0.9, 0.7, 1.05], e: [0.2, 0.5, 0.6] },   // irregular side mass
      { r: 0.052, p: [0.1, 0.07, 0.02], s: [0.95, 0.65, 1.0], e: [0, -0.6, -0.5] },
      { r: 0.048, p: [0.02, 0.135, 0.03], s: [1.15, 0.55, 0.9], e: [0.15, 0, -0.3] }    // crown push-up
    ], hairMat, 8, 7)
    r.hairSlot.add(volume)
    // low swept fringe right at the hairline (kept clear of the brows)
    const fringe = blobMesh([
      { r: 0.042, p: [-0.088, 0.072, 0.078], s: [1.2, 0.42, 0.55], e: [0, 0, 0.34] },
      { r: 0.042, p: [-0.046, 0.08, 0.086], s: [1.25, 0.45, 0.55], e: [0, 0, 0.18] },
      { r: 0.042, p: [-0.002, 0.072, 0.089], s: [1.2, 0.42, 0.55], e: [0, 0, 0.05] },
      { r: 0.042, p: [0.042, 0.079, 0.086], s: [1.15, 0.44, 0.55], e: [0, 0, -0.12] },
      { r: 0.042, p: [0.082, 0.07, 0.078], s: [1.1, 0.4, 0.55], e: [0, 0, -0.28] }
    ], hairMat, 7, 5)
    r.hairSlot.add(fringe)
    // loose strands: tubes flowing from the crown to the sides
    r.hairSlot.add(tubeMesh([[0.005, 0.155, -0.03], [-0.06, 0.125, 0.03], [-0.108, 0.06, 0.055], [-0.118, 0.0, 0.05]], 0.02, hairMat, 10, 6))
    r.hairSlot.add(tubeMesh([[0.01, 0.15, -0.06], [0.075, 0.11, -0.03], [0.115, 0.045, -0.015], [0.12, -0.01, -0.03]], 0.018, hairMat, 10, 6))
    r.hairSlot.add(tubeMesh([[-0.01, 0.145, -0.095], [-0.05, 0.1, -0.125], [-0.065, 0.04, -0.128]], 0.017, hairMat, 8, 6))
    // stray flick standing up off the crown
    r.hairSlot.add(tubeMesh([[0.015, 0.155, -0.045], [0.035, 0.2, -0.055], [0.06, 0.225, -0.075]], 0.011, hairMat, 8, 5))
    // crossing strands over the crown and low across the back — kills the "helmet" read
    r.hairSlot.add(tubeMesh([[0.09, 0.11, -0.01], [0.02, 0.165, -0.02], [-0.07, 0.14, -0.005], [-0.12, 0.08, 0.02]], 0.016, hairMat, 12, 6))
    r.hairSlot.add(tubeMesh([[-0.08, 0.06, -0.1], [-0.01, 0.02, -0.132], [0.07, 0.05, -0.112]], 0.015, hairMat, 10, 6))
    // small messy bun at the back: lathe swirl + wrap ring + escaped wisps
    const bun = latheMesh([[0.001, 0.0], [0.042, 0.006], [0.06, 0.032], [0.05, 0.06], [0.028, 0.075], [0.001, 0.082]], hairMat, 16)
    bun.position.set(0, 0.125, -0.1)
    bun.rotation.x = 0.55 // tilt the swirl to face up-back
    r.hairSlot.add(bun)
    const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.011, 6, 14), hairMat)
    wrap.position.set(0, 0.14, -0.108)
    wrap.rotation.x = 0.55 + Math.PI / 2
    wrap.castShadow = true
    r.hairSlot.add(wrap)
    const bunWisp = blobMesh([
      { r: 0.026, p: [0.048, 0.185, -0.09], s: [1, 0.55, 1.1], e: [0, 0, -0.4] },
      { r: 0.02, p: [-0.04, 0.175, -0.11], s: [1, 0.5, 1.2], e: [0, 0.4, 0.3] }
    ], hairMat, 8, 6)
    r.hairSlot.add(bunWisp)
    // sideburn tufts by the ears (kept high, behind the cheeks)
    for (const s of [-1, 1]) {
      const burn = blobMesh([{ r: 0.03, p: [0.128 * s, -0.03, -0.015], s: [0.55, 1.0, 0.8] }], hairMat, 8, 6)
      r.hairSlot.add(burn)
    }

    // Backpack, one shoulder — soft rounded shell + front pocket + tube strap
    const packMat = new THREE.MeshStandardMaterial({ color: 0x6e7379, roughness: 0.8 })
    const pack = roundedBoxMesh(0.24, 0.3, 0.13, 0.04, packMat, 2)
    pack.position.set(0.05, 0.02, -0.19)
    pack.rotation.z = -0.08
    r.chest.add(pack)
    const pocket = roundedBoxMesh(0.15, 0.13, 0.05, 0.022, packMat)
    pocket.position.set(0.045, -0.045, -0.255)
    pocket.rotation.z = -0.08
    r.chest.add(pocket)
    const zipMat = new THREE.MeshStandardMaterial({ color: 0x43474c, roughness: 0.5 })
    for (const [zx, zy, zz] of [[0.05, 0.13, -0.24], [0.115, -0.045, -0.26]] as const) {
      const pull = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 5), zipMat)
      pull.position.set(zx, zy, zz)
      r.chest.add(pull)
    }
    // strap slung over the right shoulder, front to back
    r.chest.add(tubeMesh([[0.1, 0.05, 0.135], [0.125, 0.18, 0.09], [0.14, 0.24, -0.01], [0.115, 0.17, -0.12], [0.09, 0.08, -0.155]], 0.016, packMat, 12, 5))
    // grab handle on top
    r.chest.add(tubeMesh([[0.01, 0.175, -0.18], [0.05, 0.2, -0.185], [0.09, 0.175, -0.19]], 0.011, packMat, 8, 5))

    // Thin belt at the trouser line, peeking below the untucked shirt hem
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x453a33, roughness: 0.55 })
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.172, 0.013, 4, 18), beltMat)
    belt.position.y = 0.0
    belt.rotation.x = Math.PI / 2
    belt.scale.set(1, 0.82, 0.8)
    belt.castShadow = true
    r.hips.add(belt)
    const buckle = roundedBoxMesh(0.05, 0.034, 0.014, 0.005, new THREE.MeshStandardMaterial({ color: 0xb9bec6, roughness: 0.3, metalness: 0.6 }))
    buckle.position.set(0, 0.0, 0.142)
    r.hips.add(buckle)

    // Trainers: heel tab + white toe cap + side stripe + laces over the instep
    const tabMat = new THREE.MeshStandardMaterial({ color: 0xe86b4a, roughness: 0.5 })
    const toeMat = new THREE.MeshStandardMaterial({ color: 0xf7f6f2, roughness: 0.4 })
    const laceMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.6 })
    for (const foot of [r.footL, r.footR]) {
      const tab = roundedBoxMesh(0.055, 0.05, 0.016, 0.007, tabMat)
      tab.position.set(0, -0.05, -0.102)
      tab.rotation.x = 0.12
      foot.add(tab)
      const toeCap = blobMesh([{ r: 0.048, p: [0, -0.078, 0.155], s: [1.15, 0.55, 0.75] }], toeMat, 8, 6)
      foot.add(toeCap)
      for (const s of [-1, 1]) {
        const stripe = roundedBoxMesh(0.006, 0.022, 0.11, 0.003, tabMat)
        stripe.position.set(0.056 * s, -0.066, 0.02)
        stripe.rotation.x = -0.12
        foot.add(stripe)
      }
      for (let i = 0; i < 3; i++) {
        const lace = roundedBoxMesh(0.062, 0.009, 0.015, 0.004, laceMat)
        lace.position.set(0, -0.014 - i * 0.016, 0.104 - i * 0.012)
        lace.rotation.x = -0.5
        foot.add(lace)
      }
    }

    // Phone-torch in left hand
    const phone = new THREE.Group()
    const body = roundedBoxMesh(0.046, 0.02, 0.095, 0.008, new THREE.MeshStandardMaterial({ color: 0x1a1a20, roughness: 0.3 }))
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.08), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xcfe8ff, emissiveIntensity: 1.6 }))
    screen.position.y = 0.011
    screen.rotation.x = -Math.PI / 2
    const camDot = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 8), new THREE.MeshStandardMaterial({ color: 0x2b3038, roughness: 0.2 }))
    camDot.position.set(0.012, -0.011, -0.035)
    phone.add(body, screen, camDot)
    phone.position.set(0, -0.04, 0.05)
    phone.rotation.x = 0.5
    r.handL.add(phone)

    this.torch = new THREE.SpotLight(0xd8e6ff, 22, 12, (35 * Math.PI) / 180, 0.6, 1.6)
    this.torchTarget = new THREE.Object3D()
    this.torchTarget.position.set(0, -0.3, 3.5)
    phone.add(this.torch, this.torchTarget)
    this.torch.position.set(0, 0.02, 0.04)
    this.torch.target = this.torchTarget

    // Lanyard ribbon + clip + badge
    const ribbonMat = new THREE.MeshStandardMaterial({ color: 0x33415c, roughness: 0.8 })
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.07, 0.34, 0.1),
      new THREE.Vector3(-0.05, 0.22, 0.16),
      new THREE.Vector3(0, 0.1, 0.185),
      new THREE.Vector3(0.05, 0.22, 0.16),
      new THREE.Vector3(0.07, 0.34, 0.1)
    ])
    const ribbon = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.009, 6), ribbonMat)
    ribbon.castShadow = true
    r.chest.add(ribbon)
    const clip = roundedBoxMesh(0.024, 0.018, 0.01, 0.004, new THREE.MeshStandardMaterial({ color: 0xb9bec6, roughness: 0.3, metalness: 0.6 }))
    clip.position.set(0, 0.128, 0.185)
    r.chest.add(clip)
    this.badgeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.09, 0.12),
      new THREE.MeshStandardMaterial({ map: makeLabelTexture('VISITOR\n(temporary)', { w: 128, h: 160, bg: '#efe9da', fg: '#444' }), roughness: 0.6 })
    )
    this.badgeMesh.position.set(0, 0.06, 0.19)
    this.badgeMesh.rotation.x = -0.15
    r.chest.add(this.badgeMesh)
    this.setLanyardTier(0)
  }

  setLanyardTier(tier: number) {
    if (tier === this.tier) return
    this.tier = tier
    const mat = this.badgeMesh.material as THREE.MeshStandardMaterial
    const texts = [
      { t: 'VISITOR\n(temporary)', bg: '#efe9da', fg: '#555' },
      { t: 'VISITOR\n(less\ntemporary)', bg: '#f7f3e8', fg: '#444' },
      { t: 'VISITOR\n¯\\_(ツ)_/¯', bg: '#dfe8f0', fg: '#334' },
      { t: 'STAFF\nDept. of ???', bg: '#dfeadf', fg: '#243' },
      { t: 'REMAP\nNEW HIRE ★', bg: '#ffffff', fg: '#e8542f' }
    ]
    const s = texts[Math.min(tier, texts.length - 1)]
    mat.map = makeLabelTexture(s.t, { w: 128, h: 160, bg: s.bg, fg: s.fg })
    mat.roughness = tier >= 4 ? 0.15 : 0.6
    mat.needsUpdate = true
  }

  // Rubber duck peeking from the backpack (spec §11)
  giveDuck() {
    if (this.duckMesh) return
    this.duckMesh = makeDuck()
    this.duckMesh.scale.setScalar(0.6)
    this.duckMesh.position.set(0.05, 0.2, -0.2)
    this.rig.chest.add(this.duckMesh)
  }
  duckGlow() {
    this.duckMesh?.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial
      if (m && m.emissive) { m.emissive = new THREE.Color(0xffe28a); m.emissiveIntensity = 0.35 }
    })
  }
}

export function makeDuck(): THREE.Group {
  const g = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color: 0xffd21f, roughness: 0.35 })
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xff8c1a, roughness: 0.4 })
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), mat)
  body.scale.set(1.15, 0.85, 1)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), mat)
  head.position.set(0, 0.09, 0.05)
  const beak = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), beakMat)
  beak.position.set(0, 0.085, 0.1)
  beak.scale.set(1.45, 0.5, 1.35)
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222 })
  const eL = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), eyeMat); eL.position.set(-0.03, 0.105, 0.09)
  const eR = eL.clone(); eR.position.x = 0.03
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), mat)
  tail.position.set(0, 0.03, -0.09); tail.scale.set(0.8, 0.8, 1.2); tail.rotation.x = -0.5
  const wingL = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 6), mat)
  wingL.position.set(-0.08, 0.01, -0.01); wingL.scale.set(0.45, 0.65, 1.1); wingL.rotation.x = -0.2
  const wingR = wingL.clone(); wingR.position.x = 0.08
  g.add(body, head, beak, eL, eR, tail, wingL, wingR)
  g.traverse((o) => { (o as THREE.Mesh).castShadow = true })
  return g
}

export function makeScreenDot(): THREE.CanvasTexture {
  return makeScreenTexture((g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.4, 'rgba(255,255,255,0.4)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, w, h)
  }, 32, 32)
}
