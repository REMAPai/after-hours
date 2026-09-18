// Ghost material, anatomy, factories per visual card, release choreography (spec §19.3–19.4).
import * as THREE from 'three'
import { CharacterRig, blobMesh, tubeMesh, latheMesh, roundedBoxMesh } from './rig.ts'
import { makeScreenDot } from './playerChar.ts'

export interface GhostDef {
  id: string
  base: number
  glow: number
  warmth: number // 0..1 drives distortion amount and calm
}

export const GHOST_DEFS: Record<string, GhostDef> = {
  doris: { id: 'doris', base: 0xb9a7d9, glow: 0xd8c8ff, warmth: 0.4 },
  marcus: { id: 'marcus', base: 0x7fb6e8, glow: 0x8fe0ff, warmth: 0.05 },
  priya: { id: 'priya', base: 0x8fa3b8, glow: 0xe8f2ff, warmth: 0.15 },
  standup: { id: 'standup', base: 0x76889c, glow: 0xaebfd4, warmth: 0.15 },
  ines: { id: 'ines', base: 0x8cc5bc, glow: 0x9fe8d8, warmth: 0.5 },
  gary: { id: 'gary', base: 0xd9b85b, glow: 0xffe08a, warmth: 0.6 },
  kit: { id: 'kit', base: 0xe89a7c, glow: 0xffc0a0, warmth: 0.7 },
  beatriz: { id: 'beatriz', base: 0xa6c58f, glow: 0xd0f0b0, warmth: 0.8 },
  sam: { id: 'sam', base: 0xf2c879, glow: 0xffedc0, warmth: 1.0 }
}

// Custom ghost shader: fresnel rim, vertical sine distortion, bottom fade.
function ghostMaterial(def: GhostDef, baseColor: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      baseColor: { value: new THREE.Color(baseColor) },
      glowColor: { value: new THREE.Color(def.glow) },
      time: { value: 0 },
      distortion: { value: 0.012 * (1 - def.warmth * 0.7) },
      opacity: { value: 0.45 },
      fadeY: { value: 0.5 }, // world Y below which we fade
      dissolve: { value: 0 } // 0 none .. 1 fully dissolved bottom-up
    },
    vertexShader: /* glsl */ `
      uniform float time, distortion;
      varying vec3 vNormalW, vViewDir, vWorldPos;
      void main() {
        vec3 p = position;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        wp.x += sin(wp.y * 3.0 + time * 1.5) * distortion;
        wp.z += cos(wp.y * 2.6 + time * 1.3) * distortion;
        vWorldPos = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 baseColor, glowColor;
      uniform float opacity, fadeY, dissolve, time;
      varying vec3 vNormalW, vViewDir, vWorldPos;
      void main() {
        float fresnel = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vViewDir))), 2.5);
        vec3 col = mix(baseColor, glowColor, fresnel) + glowColor * fresnel * 0.9;
        float a = opacity + fresnel * 0.4;
        // legs fade below knees
        a *= smoothstep(fadeY - 0.45, fadeY, vWorldPos.y);
        // dissolve bottom-up
        if (dissolve > 0.0) {
          float cut = mix(-0.2, 2.2, dissolve);
          a *= smoothstep(cut - 0.15, cut + 0.05, vWorldPos.y - floor(vWorldPos.y / 100.0));
          a *= smoothstep(cut - 0.15, cut + 0.05, vWorldPos.y);
          col += glowColor * dissolve * 0.8;
        }
        gl_FragColor = vec4(col, a);
      }
    `
  })
}

export class Ghost {
  group = new THREE.Group()
  rig: CharacterRig
  def: GhostDef
  light: THREE.PointLight
  motes: THREE.Points
  private mats: THREE.ShaderMaterial[] = []
  private t = Math.random() * 10
  baseY = 0
  releasing = false
  released = false
  private releaseT = 0
  private onReleased: (() => void) | null = null
  talking = false
  lookTarget: THREE.Vector3 | null = null
  seated = false

  constructor(defId: string, accessories?: (rig: CharacterRig) => void) {
    this.def = GHOST_DEFS[defId] ?? GHOST_DEFS.standup
    this.rig = new CharacterRig({ skin: this.def.base, hair: this.def.base, shirt: this.def.base, trousers: this.def.base })
    accessories?.(this.rig)
    // Replace every material with the ghost shader
    const coreMat = ghostMaterial(this.def, this.def.base)
    this.mats.push(coreMat)
    this.rig.root.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh && mesh !== this.rig.contactShadow && mesh !== this.rig.mouth) {
        mesh.material = coreMat
        mesh.castShadow = false
      }
    })
    // eyes/brows/mouth stay readable: give eyes a brighter ghost mat
    const faceMat = ghostMaterial(this.def, 0xffffff)
    ;(faceMat.uniforms.opacity as THREE.IUniform).value = 0.9
    this.mats.push(faceMat)
    this.rig.eyeL.material = faceMat
    this.rig.eyeR.material = faceMat
    this.rig.eyeL.children.forEach((c) => ((c as THREE.Mesh).material = faceMat))
    this.rig.eyeR.children.forEach((c) => ((c as THREE.Mesh).material = faceMat))
    // Fainter tinted contact shadow
    const sm = this.rig.contactShadow.material as THREE.MeshBasicMaterial
    sm.opacity = 0.4
    sm.color = new THREE.Color(this.def.glow)

    // Wisps under hips: 3 tapered trails
    const wispMat = ghostMaterial(this.def, this.def.glow)
    ;(wispMat.uniforms.opacity as THREE.IUniform).value = 0.25
    this.mats.push(wispMat)
    for (let i = 0; i < 3; i++) {
      const pts = []
      for (let j = 0; j <= 6; j++) {
        pts.push(new THREE.Vector3(Math.sin(i * 2.1 + j) * 0.06, -j * 0.09, Math.cos(i * 1.7 + j) * 0.06))
      }
      const wisp = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.035 - i * 0.008, 5), wispMat)
      wisp.position.y = -0.15
      this.rig.hips.add(wisp)
    }

    this.light = new THREE.PointLight(this.def.glow, 2.2, 4)
    this.light.position.y = 1.2
    this.group.add(this.light)

    // Drifting motes
    const moteCount = 8
    const pos = new Float32Array(moteCount * 3)
    for (let i = 0; i < moteCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1.2
      pos[i * 3 + 1] = Math.random() * 1.6
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.2
    }
    const moteGeo = new THREE.BufferGeometry()
    moteGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    this.motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
      color: this.def.glow, size: 0.035, map: makeScreenDot(), transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending
    }))
    this.group.add(this.motes)
    this.group.add(this.rig.root)
  }

  setPosition(x: number, y: number, z: number, rotY = 0) {
    this.group.position.set(x, y, z)
    this.baseY = y
    this.rig.root.rotation.y = rotY
  }

  release(onDone: () => void) {
    if (this.releasing || this.released) return
    this.releasing = true
    this.releaseT = 0
    this.onReleased = onDone
  }

  update(dt: number) {
    this.t += dt
    for (const m of this.mats) (m.uniforms.time as THREE.IUniform).value = this.t
    // hover
    if (!this.releasing) {
      const hoverAmt = this.seated ? 0.02 : 0.1 + 0.03 * Math.sin(this.t * 1.2)
      this.rig.root.position.y = hoverAmt
    }
    this.motes.rotation.y = this.t * 0.3
    this.rig.breathRate = 0.15
    this.rig.update(dt, this.lookTarget, this.talking)
    if (this.seated) {
      // re-apply seat pose (rig idle lerps limbs back to standing)
      this.rig.upperLegL.rotation.x = -1.35
      this.rig.upperLegR.rotation.x = -1.35
      this.rig.lowerLegL.rotation.x = 1.3
      this.rig.lowerLegR.rotation.x = 1.3
    }

    if (this.releasing && !this.released) {
      this.releaseT += dt
      const T = this.releaseT
      // (1) 0-1.5s: distortion -> 0, warms to gold
      const k1 = Math.min(1, T / 1.5)
      for (const m of this.mats) {
        ;(m.uniforms.distortion as THREE.IUniform).value = 0.012 * (1 - k1)
        const bc = m.uniforms.baseColor.value as THREE.Color
        bc.lerp(new THREE.Color(0xffd98a), Math.min(1, dt * 1.2))
      }
      // (2) 1.5-3s: rise 0.6m, arms open
      if (T > 1.5) {
        const k2 = Math.min(1, (T - 1.5) / 1.5)
        this.rig.root.position.y = 0.1 + k2 * 0.6
        this.rig.upperArmL.rotation.z = 0.6 * k2
        this.rig.upperArmR.rotation.z = -0.6 * k2
        this.rig.setMouth('smile')
        this.light.intensity = 2.2 + k2 * 3
      }
      // (4) 3-4.5s: dissolve bottom-up
      if (T > 3) {
        const k4 = Math.min(1, (T - 3) / 1.5)
        for (const m of this.mats) (m.uniforms.dissolve as THREE.IUniform).value = k4
        ;(this.motes.material as THREE.PointsMaterial).size = 0.035 + k4 * 0.06
        this.motes.position.y = k4 * 1.2
      }
      if (T > 4.6) {
        this.released = true
        this.group.visible = false
        this.onReleased?.()
      }
    }
  }
}

// --- Accessory builders per visual card (spec §19.4) ------------------------
// NOTE: the Ghost constructor swaps every mesh material for the ghost shader,
// so each character's identity must live in SILHOUETTE, not color.

function solid(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
}

export function makeGhost(id: string): Ghost {
  switch (id) {
    case 'doris': return new Ghost('doris', (r) => {
      // towering beehive with a climbing swirl + cat-eye glasses + brooch
      const hairMat = solid(0xcabbe0)
      const hive = latheMesh([
        [0.001, 0], [0.115, 0.008], [0.138, 0.06], [0.112, 0.125], [0.124, 0.18],
        [0.092, 0.24], [0.098, 0.285], [0.06, 0.34], [0.025, 0.375], [0.001, 0.39]
      ], hairMat, 18)
      hive.position.y = 0.04
      r.hairSlot.add(hive)
      // swirl strand spiralling up the hive
      const spiral: [number, number, number][] = []
      for (let j = 0; j <= 9; j++) {
        const a = j * 1.15
        const rad = 0.128 - j * 0.0115
        spiral.push([Math.sin(a) * rad, 0.055 + j * 0.036, Math.cos(a) * rad])
      }
      r.hairSlot.add(tubeMesh(spiral, 0.013, hairMat, 20, 5))
      // soft rolled fringe at the hairline
      r.hairSlot.add(blobMesh([
        { r: 0.05, p: [-0.05, 0.055, 0.085], s: [1.3, 0.6, 0.7], e: [0, 0, 0.25] },
        { r: 0.05, p: [0.05, 0.055, 0.085], s: [1.3, 0.6, 0.7], e: [0, 0, -0.25] }
      ], hairMat, 8, 6))
      // cat-eye glasses: squashed lenses, flicked outer tips, bridge, temple arms
      const glassMat = solid(0x554466)
      for (const s of [-1, 1]) {
        const lens = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.007, 6, 14), glassMat)
        lens.position.set(0.057 * s, 0.12, 0.13)
        lens.rotation.z = s * 0.28
        lens.scale.set(1.1, 0.8, 1)
        r.headMeshes.add(lens)
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.035, 6), glassMat)
        tip.position.set(0.098 * s, 0.148, 0.122)
        tip.rotation.z = s * -0.9
        r.headMeshes.add(tip)
        r.headMeshes.add(tubeMesh([[0.09 * s, 0.135, 0.115], [0.125 * s, 0.115, 0.05], [0.135 * s, 0.1, 0.0]], 0.005, glassMat, 6, 4))
        // little drop earrings
        const drop = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), glassMat)
        drop.position.set(0.142 * s, 0.045, 0)
        drop.scale.set(0.8, 1.3, 0.8)
        r.headMeshes.add(drop)
      }
      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.04, 6), glassMat)
      bridge.position.set(0, 0.13, 0.132)
      bridge.rotation.z = Math.PI / 2
      r.headMeshes.add(bridge)
      const brooch = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffe9a0, metalness: 0.8, roughness: 0.2 }))
      brooch.position.set(-0.08, 0.12, 0.155)
      brooch.scale.set(1, 1.2, 0.5)
      r.chest.add(brooch)
    })
    case 'marcus': return new Ghost('marcus', (r) => {
      // hood up (rimmed shell + point) + headset worn over it + keycard fan
      const hoodMat = solid(0x5577a0)
      const hood = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.72), hoodMat)
      hood.position.y = 0.05
      hood.scale.set(1, 1.02, 1.05)
      hood.castShadow = true
      r.hairSlot.add(hood)
      // rolled rim framing the face opening
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.148, 0.024, 7, 18), hoodMat)
      rim.position.set(0, 0.03, 0.045)
      rim.rotation.x = 1.25
      rim.scale.set(1, 1.05, 1)
      rim.castShadow = true
      r.hairSlot.add(rim)
      // floppy point hanging at the back
      const point = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.14, 8), hoodMat)
      point.position.set(0, 0.04, -0.185)
      point.rotation.x = -2.3
      point.castShadow = true
      r.hairSlot.add(point)
      // hood drape pooling on the shoulders
      const drape = blobMesh([
        { r: 0.085, p: [0, 0.185, -0.1], s: [1.6, 0.55, 1.0] },
        { r: 0.06, p: [-0.12, 0.17, -0.06], s: [1.1, 0.6, 1.1] },
        { r: 0.06, p: [0.12, 0.17, -0.06], s: [1.1, 0.6, 1.1] }
      ], hoodMat, 9, 7)
      r.chest.add(drape)
      // headset clamped over the hood: arc band + earcups + mic boom
      const setMat = solid(0x333a44)
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.015, 6, 16, Math.PI), setMat)
      band.position.y = 0.08
      band.castShadow = true
      r.headMeshes.add(band)
      for (const s of [-1, 1]) {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.035, 12), setMat)
        cup.position.set(0.19 * s, 0.075, 0)
        cup.rotation.z = Math.PI / 2
        cup.castShadow = true
        r.headMeshes.add(cup)
        const cushion = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.012, 6, 12), setMat)
        cushion.position.set(0.172 * s, 0.075, 0)
        cushion.rotation.y = Math.PI / 2
        r.headMeshes.add(cushion)
      }
      r.headMeshes.add(tubeMesh([[-0.185, 0.03, 0.02], [-0.15, -0.015, 0.09], [-0.085, -0.03, 0.135]], 0.008, setMat, 8, 5))
      const mic = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), setMat)
      mic.position.set(-0.08, -0.032, 0.138)
      r.headMeshes.add(mic)
      // lanyard + fanned keycards
      const cardMat = solid(0xdddddd)
      r.chest.add(tubeMesh([[-0.05, 0.2, 0.13], [-0.035, 0.12, 0.165], [-0.01, 0.06, 0.175], [0.02, 0.05, 0.175], [0.045, 0.12, 0.165], [0.05, 0.2, 0.13]], 0.006, solid(0x445366), 14, 5))
      for (let i = 0; i < 4; i++) {
        const card = roundedBoxMesh(0.052, 0.072, 0.006, 0.004, cardMat)
        card.position.set(-0.035 + i * 0.023, 0.005 - i * 0.018, 0.175 + i * 0.008)
        card.rotation.z = (i - 1.5) * 0.16
        r.chest.add(card)
      }
    })
    case 'priya': return new Ghost('priya', (r) => {
      // sharp chin-length bob with inward curl + structured blazer + tablet
      const hairMat = solid(0x2f2a33)
      const bob = blobMesh([
        { r: 0.155, p: [0, 0.045, -0.02], s: [1.0, 0.9, 1.0] },
        { r: 0.09, p: [-0.115, -0.045, -0.005], s: [0.62, 1.35, 0.95] }, // side curtains
        { r: 0.09, p: [0.115, -0.045, -0.005], s: [0.62, 1.35, 0.95] },
        { r: 0.1, p: [0, -0.01, -0.11], s: [1.0, 1.15, 0.62] }           // back panel
      ], hairMat, 10, 8)
      r.hairSlot.add(bob)
      // inward curl at the bottom edge
      for (const s of [-1, 1]) {
        r.hairSlot.add(tubeMesh([[0.12 * s, -0.15, 0.03], [0.1 * s, -0.175, 0.055], [0.075 * s, -0.165, 0.07]], 0.024, hairMat, 8, 6))
      }
      // blunt straight fringe
      const fringeCut = roundedBoxMesh(0.2, 0.052, 0.055, 0.02, hairMat)
      fringeCut.position.set(0, 0.085, 0.09)
      fringeCut.rotation.x = 0.18
      r.hairSlot.add(fringeCut)
      // blazer: crisp shoulder pads + lapel V + buttons
      const blazerMat = solid(0x3c4254)
      for (const s of [-1, 1]) {
        const pad = blobMesh([{ r: 0.075, p: [0.19 * s, 0.17, 0], s: [1.2, 0.68, 1.05] }], blazerMat, 10, 8)
        r.chest.add(pad)
        const lapel = roundedBoxMesh(0.055, 0.17, 0.014, 0.007, blazerMat)
        lapel.position.set(0.052 * s, 0.06, 0.148)
        lapel.rotation.set(-0.1, s * 0.28, s * 0.38)
        r.chest.add(lapel)
      }
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.008, 8), blazerMat)
      btn.position.set(0, -0.075, 0.152)
      btn.rotation.x = Math.PI / 2
      r.chest.add(btn)
      // tablet hugged in the left hand
      const tablet = roundedBoxMesh(0.16, 0.22, 0.014, 0.007, solid(0x223344))
      tablet.position.set(0, -0.02, 0.02)
      tablet.rotation.x = 0.3
      r.handL.add(tablet)
      const tabScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.135, 0.19), solid(0x8fb6d8))
      tabScreen.position.set(0, -0.02, 0.029)
      tabScreen.rotation.x = 0.3
      r.handL.add(tabScreen)
    })
    case 'ines': return new Ghost('ines', (r) => {
      // long CURLY dark hair in a full braid + big round glasses + oversized jumper
      const hairMat = solid(0x4a3b30)
      // curly centre-parted base with lumpy volume all around
      r.hairSlot.add(blobMesh([
        { r: 0.15, p: [0, 0.04, -0.025], s: [1.04, 0.88, 1.0] },
        { r: 0.072, p: [-0.09, 0.03, 0.055], s: [0.78, 0.82, 1.0], e: [0, 0.4, 0.3] },
        { r: 0.072, p: [0.09, 0.03, 0.055], s: [0.78, 0.82, 1.0], e: [0, -0.4, -0.3] },
        { r: 0.06, p: [-0.1, 0.09, -0.02], s: [0.9, 0.75, 1.0], e: [0, 0.4, 0.5] },     // curl lumps
        { r: 0.055, p: [0.095, 0.1, -0.04], s: [0.9, 0.7, 1.05], e: [0, -0.4, -0.4] },
        { r: 0.052, p: [0, 0.02, -0.118], s: [1.15, 0.9, 0.75] },
        { r: 0.045, p: [-0.02, 0.14, -0.05], s: [1.1, 0.6, 1.0], e: [0.2, 0, 0.3] }
      ], hairMat, 10, 8))
      // face-framing escaped curl
      r.hairSlot.add(tubeMesh([[-0.115, 0.05, 0.04], [-0.132, -0.02, 0.052], [-0.118, -0.08, 0.04]], 0.02, hairMat, 8, 6))
      // braid: fat alternating bumps with side curl lobes, down one shoulder
      const braidParts = []
      for (let j = 0; j <= 8; j++) {
        const off = Math.sin(j * 2.6)
        braidParts.push({
          r: 0.046 - j * 0.0015,
          p: [0.105 + off * 0.02, 0.055 - j * 0.08, 0.055 + j * 0.008] as [number, number, number],
          s: [1.15, 1.3, 1.15] as [number, number, number],
          e: [0, 0, off * 0.35] as [number, number, number]
        })
        braidParts.push({
          r: 0.028 - j * 0.001,
          p: [0.105 - off * 0.032, 0.085 - j * 0.08, 0.055 + j * 0.008 + (j % 2 ? 0.022 : -0.022)] as [number, number, number],
          s: [1, 1.1, 1] as [number, number, number],
          e: [0, 0, -off * 0.4] as [number, number, number]
        })
      }
      r.headMeshes.add(blobMesh(braidParts, hairMat, 8, 6))
      // tail tuft + tie band
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.08, 8), hairMat)
      tail.position.set(0.112, -0.63, 0.122)
      tail.rotation.x = Math.PI
      tail.castShadow = true
      r.headMeshes.add(tail)
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.009, 6, 10), solid(0x9a4444))
      band.position.set(0.108, -0.585, 0.118)
      band.rotation.x = Math.PI / 2
      r.headMeshes.add(band)
      // big round glasses with bridge + arms
      const glassMat = solid(0x445566)
      for (const s of [-1, 1]) {
        const lens = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.007, 6, 16), glassMat)
        lens.position.set(0.057 * s, 0.12, 0.13)
        r.headMeshes.add(lens)
        r.headMeshes.add(tubeMesh([[0.1 * s, 0.125, 0.12], [0.13 * s, 0.115, 0.05], [0.138 * s, 0.1, 0.0]], 0.005, glassMat, 6, 4))
      }
      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.032, 6), glassMat)
      bridge.position.set(0, 0.128, 0.134)
      bridge.rotation.z = Math.PI / 2
      r.headMeshes.add(bridge)
      // oversized jumper: widened torso + fat rolled collar + chunky hem
      r.chest.scale.multiplyScalar(1.12)
      const knitMat = solid(0x7fae9f)
      const roll = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.03, 8, 18), knitMat)
      roll.position.y = 0.195
      roll.rotation.x = Math.PI / 2
      roll.scale.set(1, 0.85, 1)
      roll.castShadow = true
      r.chest.add(roll)
      const hem = new THREE.Mesh(new THREE.TorusGeometry(0.168, 0.026, 8, 20), knitMat)
      hem.position.y = -0.27
      hem.rotation.x = Math.PI / 2
      hem.scale.set(1, 0.8, 1)
      hem.castShadow = true
      r.chest.add(hem)
    })
    case 'gary': return new Ghost('gary', (r) => {
      // backwards cap + walrus moustache + full apron; squat build
      const capMat = solid(0x8a4a3a)
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.152, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), capMat)
      dome.position.y = 0.035
      dome.scale.set(1.02, 0.9, 1.02)
      dome.castShadow = true
      r.hairSlot.add(dome)
      const button = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), capMat)
      button.position.y = 0.175
      r.hairSlot.add(button)
      // peak swept backwards, gently tipped up
      const peak = roundedBoxMesh(0.125, 0.02, 0.115, 0.009, capMat)
      peak.position.set(0, 0.055, -0.175)
      peak.rotation.x = 0.28
      r.hairSlot.add(peak)
      // strap arch at the back over escaping hair tuft
      const tuft = blobMesh([{ r: 0.045, p: [0, 0.005, -0.135], s: [1.4, 0.6, 0.7] }], solid(0x554433), 8, 6)
      r.hairSlot.add(tuft)
      // walrus moustache: two drooping tubes hiding the top lip
      const stacheMat = solid(0x554433)
      for (const s of [-1, 1]) {
        r.headMeshes.add(tubeMesh([[0.0, 0.058, 0.132], [0.035 * s, 0.048, 0.134], [0.062 * s, 0.022, 0.127], [0.068 * s, -0.008, 0.112]], 0.017, stacheMat, 10, 6))
      }
      // apron: bib + skirt with pocket, neck strap, waist tie with back bow
      const apronMat = solid(0x556644)
      const bib = roundedBoxMesh(0.2, 0.2, 0.022, 0.012, apronMat)
      bib.position.set(0, 0.06, 0.155)
      bib.rotation.x = -0.06
      r.chest.add(bib)
      const skirt = roundedBoxMesh(0.27, 0.28, 0.022, 0.012, apronMat)
      skirt.position.set(0, -0.19, 0.15)
      skirt.rotation.x = 0.06
      r.chest.add(skirt)
      const pocket = roundedBoxMesh(0.13, 0.08, 0.022, 0.01, apronMat)
      pocket.position.set(0, -0.15, 0.167)
      r.chest.add(pocket)
      r.chest.add(tubeMesh([[-0.08, 0.155, 0.14], [-0.06, 0.23, 0.06], [0, 0.25, 0.0], [0.06, 0.23, 0.06], [0.08, 0.155, 0.14]], 0.009, apronMat, 12, 5))
      r.chest.add(tubeMesh([[-0.1, -0.06, 0.15], [-0.18, -0.07, 0.02], [-0.12, -0.08, -0.13], [0.12, -0.08, -0.13], [0.18, -0.07, 0.02], [0.1, -0.06, 0.15]], 0.009, apronMat, 16, 5))
      // bow knot at the back
      const bow = blobMesh([
        { r: 0.028, p: [-0.04, -0.08, -0.15], s: [1.4, 0.7, 0.6], e: [0, 0, 0.4] },
        { r: 0.028, p: [0.04, -0.08, -0.15], s: [1.4, 0.7, 0.6], e: [0, 0, -0.4] },
        { r: 0.018, p: [0, -0.08, -0.15] }
      ], apronMat, 8, 6)
      r.chest.add(bow)
      r.root.scale.set(1.1, 0.92, 1.1)
    })
    case 'kit': return new Ghost('kit', (r) => {
      // undercut with a big upward swoop + wrapped scarf + pencil behind ear
      const hairMat = solid(0x554a66)
      const swoop = blobMesh([
        { r: 0.125, p: [-0.015, 0.065, -0.015], s: [1.02, 0.72, 0.98] },
        { r: 0.095, p: [-0.07, 0.115, 0.005], s: [1.0, 0.72, 0.92], e: [0, 0, 0.5] },
        { r: 0.068, p: [-0.125, 0.165, 0.015], s: [1.15, 0.58, 0.78], e: [0, 0, 0.85] },
        { r: 0.05, p: [0.05, 0.1, 0.055], s: [1.2, 0.5, 0.7], e: [0, -0.3, -0.25] }
      ], hairMat, 11, 9)
      r.hairSlot.add(swoop)
      // flicked tips riding off the swoop
      r.hairSlot.add(tubeMesh([[-0.11, 0.16, 0.02], [-0.165, 0.215, 0.01], [-0.2, 0.26, -0.01]], 0.016, hairMat, 8, 5))
      r.hairSlot.add(tubeMesh([[-0.08, 0.14, 0.05], [-0.13, 0.19, 0.06], [-0.155, 0.23, 0.05]], 0.012, hairMat, 8, 5))
      // chunky wrapped scarf: double ring + knot + hanging fringed tails
      const scarfMat = solid(0xaa6655)
      const wrapA = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.042, 8, 18), scarfMat)
      wrapA.position.y = 0.225
      wrapA.rotation.x = Math.PI / 2
      wrapA.scale.set(1, 0.9, 1)
      wrapA.castShadow = true
      r.chest.add(wrapA)
      const wrapB = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.038, 8, 18), scarfMat)
      wrapB.position.y = 0.168
      wrapB.rotation.x = Math.PI / 2
      wrapB.scale.set(1, 0.9, 1)
      wrapB.castShadow = true
      r.chest.add(wrapB)
      const knot = blobMesh([{ r: 0.048, p: [0.035, 0.15, 0.12], s: [1.1, 0.9, 0.8], e: [0, 0, 0.4] }], scarfMat, 9, 7)
      r.chest.add(knot)
      r.chest.add(tubeMesh([[0.04, 0.13, 0.135], [0.06, 0.02, 0.165], [0.045, -0.09, 0.175]], 0.028, scarfMat, 10, 6))
      r.chest.add(tubeMesh([[0.025, 0.13, 0.13], [0.0, 0.04, 0.16], [-0.015, -0.03, 0.17]], 0.024, scarfMat, 10, 6))
      const fringeMat = solid(0x8f5344)
      for (let i = 0; i < 3; i++) {
        const f = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.035, 5), fringeMat)
        f.position.set(0.03 + i * 0.014, -0.115, 0.175)
        f.castShadow = true
        r.chest.add(f)
      }
      // pencil tucked behind the ear: body + sharpened tip + eraser
      const pencil = new THREE.Group()
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.1, 6), solid(0xffcc44))
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.022, 6), solid(0xd9b07c))
      tip.position.y = 0.061
      const lead = new THREE.Mesh(new THREE.ConeGeometry(0.003, 0.008, 5), solid(0x333333))
      lead.position.y = 0.075
      const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.0072, 0.0072, 0.014, 6), solid(0xdd7788))
      eraser.position.y = -0.057
      pencil.add(shaft, tip, lead, eraser)
      pencil.traverse((o) => { (o as THREE.Mesh).castShadow = true })
      pencil.position.set(0.145, 0.135, 0.01)
      pencil.rotation.z = 1.35
      pencil.rotation.x = 0.15
      r.headMeshes.add(pencil)
    })
    case 'beatriz': return new Ghost('beatriz', (r) => {
      // sleek pulled-back hair + high lathe bun with a pin + pearls + chain
      const hairMat = solid(0x777788)
      r.hairSlot.add(blobMesh([
        { r: 0.148, p: [0, 0.035, -0.02], s: [1.02, 0.84, 1.0] },
        { r: 0.1, p: [0, -0.005, -0.1], s: [1.05, 0.95, 0.72] },
        { r: 0.062, p: [-0.1, 0.02, 0.04], s: [0.7, 0.72, 1.0], e: [0, 0.3, 0.25] },
        { r: 0.062, p: [0.1, 0.02, 0.04], s: [0.7, 0.72, 1.0], e: [0, -0.3, -0.25] }
      ], hairMat, 10, 8))
      const bun = latheMesh([
        [0.001, 0], [0.052, 0.008], [0.07, 0.042], [0.058, 0.08], [0.032, 0.102], [0.001, 0.11]
      ], hairMat, 16)
      bun.position.set(0, 0.145, -0.03)
      bun.rotation.x = 0.2
      r.hairSlot.add(bun)
      const bunWrap = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.011, 6, 14), hairMat)
      bunWrap.position.set(0, 0.16, -0.033)
      bunWrap.rotation.x = 0.2 + Math.PI / 2
      bunWrap.castShadow = true
      r.hairSlot.add(bunWrap)
      // hair pin skewering the bun
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 6), solid(0xd9c48a))
      pin.position.set(0, 0.2, -0.035)
      pin.rotation.z = 1.15
      pin.castShadow = true
      r.hairSlot.add(pin)
      // half-moon reading glasses low on the nose + chains sweeping back
      const glassMat = solid(0x8a7f66)
      for (const s of [-1, 1]) {
        const lens = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.006, 6, 12), glassMat)
        lens.position.set(0.05 * s, 0.095, 0.135)
        lens.scale.set(1.1, 0.75, 1)
        r.headMeshes.add(lens)
        r.headMeshes.add(tubeMesh([[0.085 * s, 0.1, 0.12], [0.135 * s, 0.06, 0.03], [0.148 * s, -0.02, -0.02], [0.13 * s, -0.09, -0.04]], 0.004, glassMat, 10, 4))
      }
      const gBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03, 6), glassMat)
      gBridge.position.set(0, 0.1, 0.138)
      gBridge.rotation.z = Math.PI / 2
      r.headMeshes.add(gBridge)
      // graduated pearl string
      const pearlMat = new THREE.MeshStandardMaterial({ color: 0xfff3e0, roughness: 0.15 })
      for (let i = 0; i < 9; i++) {
        const a = -0.62 + (i / 8) * 1.24
        const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.011 + (1 - Math.abs(a) / 0.62) * 0.006, 8, 6), pearlMat)
        pearl.position.set(Math.sin(a) * 0.105, 0.215 - Math.cos(a) * -0.02 - (1 - Math.abs(a) / 0.62) * 0.055, 0.115 + Math.cos(a) * 0.045)
        pearl.castShadow = true
        r.chest.add(pearl)
      }
    })
    case 'sam': return new Ghost('sam', (r) => {
      // messy silver hair + hoodie knotted at the waist + steaming cup
      const hairMat = solid(0xd8d8dc)
      r.hairSlot.add(blobMesh([
        { r: 0.148, p: [0, 0.04, -0.02], s: [1.03, 0.86, 1.0] },
        { r: 0.075, p: [-0.09, 0.1, -0.03], s: [1.05, 0.62, 1.1], e: [0, 0.3, 0.5] },
        { r: 0.07, p: [0.085, 0.105, -0.045], s: [1.0, 0.6, 1.15], e: [0, -0.4, -0.45] },
        { r: 0.055, p: [0.015, 0.085, 0.075], s: [1.35, 0.5, 0.65], e: [0, 0, -0.18] }, // pushed-up fringe
        { r: 0.06, p: [0, 0.005, -0.115], s: [1.2, 0.8, 0.7] }
      ], hairMat, 11, 9))
      // stray flicks
      r.hairSlot.add(tubeMesh([[-0.07, 0.13, -0.04], [-0.12, 0.18, -0.06], [-0.145, 0.2, -0.09]], 0.012, hairMat, 8, 5))
      r.hairSlot.add(tubeMesh([[0.08, 0.125, -0.02], [0.13, 0.165, 0.0], [0.16, 0.175, 0.03]], 0.011, hairMat, 8, 5))
      // hoodie tied at the waist: soft ring + knot + dangling sleeves w/ cuffs
      const hoodieMat = solid(0xcf9950)
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.055, 9, 18), hoodieMat)
      tie.position.y = 0.02
      tie.rotation.x = Math.PI / 2
      tie.scale.set(1, 0.82, 0.88)
      tie.castShadow = true
      r.hips.add(tie)
      const bundle = blobMesh([{ r: 0.075, p: [0, 0.035, -0.2], s: [1.5, 0.7, 0.8] }], hoodieMat, 9, 7)
      r.hips.add(bundle)
      const knot = blobMesh([{ r: 0.05, p: [0, 0.01, 0.185], s: [1.2, 0.8, 0.8] }], hoodieMat, 9, 7)
      r.hips.add(knot)
      r.hips.add(tubeMesh([[0.035, -0.01, 0.19], [0.095, -0.13, 0.16], [0.085, -0.24, 0.11]], 0.032, hoodieMat, 10, 6))
      r.hips.add(tubeMesh([[-0.035, -0.01, 0.19], [-0.085, -0.11, 0.17], [-0.07, -0.2, 0.13]], 0.028, hoodieMat, 10, 6))
      for (const [cx, cy, cz, cr] of [[0.085, -0.25, 0.105, 0.034], [-0.07, -0.21, 0.125, 0.03]] as const) {
        const cuff = new THREE.Mesh(new THREE.CylinderGeometry(cr, cr * 0.92, 0.03, 10), hoodieMat)
        cuff.position.set(cx, cy, cz)
        cuff.castShadow = true
        r.hips.add(cuff)
      }
      // steaming cup: tapered cup + handle + curling steam wisp
      const cupMat = solid(0xf5f0e8)
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.026, 0.075, 12), cupMat)
      cup.position.y = -0.02
      cup.castShadow = true
      r.handR.add(cup)
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.006, 6, 10, Math.PI), cupMat)
      handle.position.set(0.032, -0.02, 0)
      handle.rotation.z = -Math.PI / 2
      r.handR.add(handle)
      r.handR.add(tubeMesh([[0, 0.02, 0], [0.012, 0.07, 0.008], [-0.01, 0.115, -0.006], [0.008, 0.16, 0.004]], 0.008, cupMat, 12, 5))
    })
    default: return new Ghost('standup')
  }
}
