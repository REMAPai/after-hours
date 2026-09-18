// Shared humanoid rig (spec §19.1) + procedural animation (spec §20).
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { makeScreenTexture } from '../engine/textures.ts'

export type MouthState = 'neutral' | 'smile' | 'wideSmile' | 'talkA' | 'talkB' | 'frown'
export type AnimState = 'idle' | 'walk' | 'jog' | 'interact' | 'startled' | 'cinematic'

const mouthTexCache = new Map<string, THREE.CanvasTexture>()
function mouthTex(state: MouthState): THREE.CanvasTexture {
  const hit = mouthTexCache.get(state)
  if (hit) return hit
  const tex = makeScreenTexture((g, w, h) => {
    g.clearRect(0, 0, w, h)
    g.strokeStyle = '#3a2620'
    g.fillStyle = '#3a2620'
    g.lineWidth = 7
    g.lineCap = 'round'
    const cx = w / 2, cy = h / 2
    g.beginPath()
    switch (state) {
      case 'neutral': g.moveTo(cx - 14, cy); g.lineTo(cx + 14, cy); g.stroke(); break
      case 'smile': g.arc(cx, cy - 6, 18, 0.3, Math.PI - 0.3); g.stroke(); break
      case 'wideSmile': g.arc(cx, cy - 8, 22, 0.2, Math.PI - 0.2); g.stroke(); g.beginPath(); g.ellipse(cx, cy + 2, 14, 8, 0, 0, Math.PI); g.fill(); break
      case 'talkA': g.ellipse(cx, cy, 10, 12, 0, 0, Math.PI * 2); g.fill(); break
      case 'talkB': g.ellipse(cx, cy, 13, 6, 0, 0, Math.PI * 2); g.fill(); break
      case 'frown': g.arc(cx, cy + 12, 18, Math.PI + 0.3, Math.PI * 2 - 0.3); g.stroke(); break
    }
  }, 64, 64)
  mouthTexCache.set(state, tex)
  return tex
}

export interface RigOptions {
  skin: number
  hair: number
  shirt: number
  trousers: number
  height?: number
}

function capsule(r: number, len: number, mat: THREE.Material, capSeg = 3, radSeg = 9): THREE.Mesh {
  const geo = new THREE.CapsuleGeometry(r, len, capSeg, radSeg)
  const m = new THREE.Mesh(geo, mat)
  m.castShadow = true
  return m
}
function sphere(r: number, mat: THREE.Material, wSeg = 14, hSeg = 12): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, wSeg, hSeg), mat)
  m.castShadow = true
  return m
}

// --- Shared mesh-building helpers (also used by playerChar/ghosts) ----------

export interface BlobPart {
  r: number
  p: [number, number, number]
  s?: [number, number, number]
  e?: [number, number, number]
}

// Cluster of transformed spheres merged into one organic geometry — the
// building block for hair volumes, shoe uppers, and other soft shapes.
export function blobGeo(parts: BlobPart[], wSeg = 10, hSeg = 8): THREE.BufferGeometry {
  const geos = parts.map((part) => {
    const g = new THREE.SphereGeometry(part.r, wSeg, hSeg)
    const e = part.e ?? [0, 0, 0]
    const s = part.s ?? [1, 1, 1]
    g.applyMatrix4(new THREE.Matrix4().compose(
      new THREE.Vector3(part.p[0], part.p[1], part.p[2]),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(e[0], e[1], e[2])),
      new THREE.Vector3(s[0], s[1], s[2])
    ))
    return g
  })
  const merged = mergeGeometries(geos)
  geos.forEach((g) => g.dispose())
  return merged
}

export function blobMesh(parts: BlobPart[], mat: THREE.Material, wSeg = 10, hSeg = 8): THREE.Mesh {
  const m = new THREE.Mesh(blobGeo(parts, wSeg, hSeg), mat)
  m.castShadow = true
  return m
}

// Smooth tube along a Catmull-Rom curve — hair strands, straps, scarves.
export function tubeMesh(points: [number, number, number][], r: number, mat: THREE.Material, seg = 12, rSeg = 6): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])))
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, rSeg), mat)
  m.castShadow = true
  return m
}

export function latheMesh(pts: [number, number][], mat: THREE.Material, seg = 24): THREE.Mesh {
  const geo = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg)
  geo.computeVertexNormals()
  const m = new THREE.Mesh(geo, mat)
  m.castShadow = true
  return m
}

export function roundedBoxMesh(w: number, h: number, d: number, radius: number, mat: THREE.Material, seg = 1): THREE.Mesh {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, radius), mat)
  m.castShadow = true
  return m
}

export class CharacterRig {
  root = new THREE.Group()
  hips: THREE.Group
  spine: THREE.Group
  chest: THREE.Group
  neck: THREE.Group
  head: THREE.Group
  headMeshes = new THREE.Group()
  eyeL!: THREE.Mesh; eyeR!: THREE.Mesh
  browL!: THREE.Mesh; browR!: THREE.Mesh
  mouth!: THREE.Mesh
  shoulderL: THREE.Group; upperArmL: THREE.Group; foreArmL: THREE.Group; handL: THREE.Group
  shoulderR: THREE.Group; upperArmR: THREE.Group; foreArmR: THREE.Group; handR: THREE.Group
  upperLegL: THREE.Group; lowerLegL: THREE.Group; footL: THREE.Group
  upperLegR: THREE.Group; lowerLegR: THREE.Group; footR: THREE.Group
  chestSlot = new THREE.Group()
  hairSlot = new THREE.Group()
  contactShadow: THREE.Mesh
  materials: THREE.MeshStandardMaterial[] = []

  state: AnimState = 'idle'
  phase = 0 // stride phase from displacement
  private blinkTimer = 2 + Math.random() * 3
  private blinkT = -1
  private lookCur = new THREE.Quaternion()
  private t = Math.random() * 10
  private interactT = -1
  private startleT = -1
  browEmotion = 0 // -1 sad/worried, 0 neutral, +1 raised
  private idleFidgetT = 8 + Math.random() * 7
  private fidgetAnim = -1
  speed = 0
  breathRate = 0.25

  constructor(public opts: RigOptions) {
    const mk = (color: number, rough = 0.65) => {
      const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.02 })
      this.materials.push(m)
      return m
    }
    const skinMat = mk(opts.skin, 0.38)
    const hairMat = mk(opts.hair, 0.35)
    const shirtMat = mk(opts.shirt, 0.7)
    const trouserMat = mk(opts.trousers, 0.75)

    this.hips = new THREE.Group(); this.hips.position.y = 0.95; this.root.add(this.hips)
    // Soft rounded pelvis — pear-ish, a touch wider than the shoulders (refs)
    const pelvis = latheMesh([
      [0.001, -0.14], [0.095, -0.128], [0.155, -0.05], [0.166, 0.03], [0.14, 0.1], [0.062, 0.132], [0.001, 0.138]
    ], trouserMat, 22)
    pelvis.scale.set(1.0, 1, 0.8)
    this.hips.add(pelvis)

    this.spine = new THREE.Group(); this.spine.position.y = 0.1; this.hips.add(this.spine)
    this.chest = new THREE.Group(); this.chest.position.y = 0.25; this.spine.add(this.chest)
    // Shirt torso: lathe shoulder→chest→waist curve — narrower up top than at
    // the hem (pear silhouette), soft tummy curve, ending in a flared,
    // slightly curled-under untucked hem that drapes over the hips.
    const torso = latheMesh([
      [0.001, -0.325], [0.1, -0.318], [0.154, -0.3], [0.184, -0.268], [0.176, -0.215],
      [0.168, -0.14], [0.181, -0.045], [0.178, 0.04], [0.169, 0.135], [0.122, 0.195], [0.058, 0.225]
    ], shirtMat, 26)
    torso.scale.set(1.03, 1, 0.78)
    this.chest.add(torso)
    // Collar: soft rolled ring at the neckline + two folded collar points
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.021, 6, 14), shirtMat)
    collar.position.y = 0.212
    collar.rotation.x = Math.PI / 2
    collar.scale.set(1, 0.8, 1)
    collar.castShadow = true
    this.chest.add(collar)
    for (const s of [-1, 1]) {
      const tip = roundedBoxMesh(0.05, 0.048, 0.014, 0.007, shirtMat)
      tip.position.set(0.048 * s, 0.178, 0.108)
      tip.rotation.set(-0.35, s * 0.25, s * -0.55)
      this.chest.add(tip)
    }
    // Button placket down the front
    for (let i = 0; i < 3; i++) {
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.006, 10), skinMat)
      btn.position.set(0, 0.045 - i * 0.085, [0.143, 0.145, 0.144][i])
      btn.rotation.x = Math.PI / 2 - 0.12
      btn.castShadow = true
      this.chest.add(btn)
    }
    this.chestSlot.position.set(0, 0.08, 0.15); this.chest.add(this.chestSlot)

    this.neck = new THREE.Group(); this.neck.position.y = 0.22; this.chest.add(this.neck)
    const neckMesh = capsule(0.058, 0.06, skinMat); this.neck.add(neckMesh)
    this.head = new THREE.Group(); this.head.position.y = 0.1; this.neck.add(this.head)
    this.head.add(this.headMeshes)
    // Big-head stylised proportions (character reference sheets): scale the whole
    // head assembly so accessories and factory add-ons stay in proportion.
    this.headMeshes.scale.setScalar(1.32)

    // Head: squashed sphere + soft jaw + subtle cheeks
    const skull = sphere(0.145, skinMat, 24, 18)
    skull.scale.set(1.0, 1.06, 0.96)
    skull.position.y = 0.1
    this.headMeshes.add(skull)
    const jaw = sphere(0.105, skinMat, 16, 12)
    jaw.scale.set(1.05, 0.9, 1.0)
    jaw.position.set(0, 0.008, 0.03)
    this.headMeshes.add(jaw)
    // Cheeks: very subtle warmer tint (own material; ghosts overwrite anyway)
    const cheekMat = mk(new THREE.Color(opts.skin).lerp(new THREE.Color(0xd9776a), 0.22).getHex(), 0.35)
    for (const s of [-1, 1]) {
      const cheek = sphere(0.05, cheekMat, 10, 8)
      cheek.position.set(0.07 * s, 0.05, 0.09)
      this.headMeshes.add(cheek)
    }
    const earL = sphere(0.034, skinMat, 8, 6); earL.scale.set(0.5, 1, 0.8); earL.position.set(-0.14, 0.09, 0); this.headMeshes.add(earL)
    const earR = earL.clone(); earR.position.x = 0.14; this.headMeshes.add(earR)

    // Eyes: LARGE expressive eyes — white + big warm-brown iris + pupil + highlight
    const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xfffdf6, roughness: 0.15 })
    const iris = new THREE.MeshStandardMaterial({ color: 0x5a3620, roughness: 0.25 })
    const pupil = new THREE.MeshStandardMaterial({ color: 0x17100a, roughness: 0.3 })
    const specDot = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.1 })
    const lashMat = new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.5 })
    const mkEye = (x: number) => {
      const e = sphere(0.046, eyeWhite, 14, 10)
      e.scale.set(0.92, 1.06, 0.62)
      e.position.set(x, 0.115, 0.108)
      const i = sphere(0.03, iris, 12, 8); i.position.z = 0.052; i.scale.set(1, 1, 0.55); e.add(i)
      const p = sphere(0.016, pupil, 8, 6); p.position.z = 0.075; p.scale.set(1, 1, 0.4); e.add(p)
      const d = sphere(0.008, specDot, 6, 4); d.position.set(0.012, 0.014, 0.082); e.add(d)
      // upper-eyelid lash line: thin dark arc hugging the top rim. Child of the
      // eye mesh, so it closes with the blink scale-Y — never fights it.
      const lash = new THREE.Mesh(new THREE.TorusGeometry(0.0435, 0.0045, 5, 14, Math.PI * 0.66), lashMat)
      lash.position.z = 0.02
      lash.rotation.z = Math.PI * 0.17
      e.add(lash)
      return e
    }
    this.eyeL = mkEye(-0.062); this.eyeR = mkEye(0.062)
    this.headMeshes.add(this.eyeL, this.eyeR)

    // Brows: thicker, expressive
    const browGeo = new THREE.BoxGeometry(0.062, 0.018, 0.02)
    this.browL = new THREE.Mesh(browGeo, hairMat); this.browL.position.set(-0.062, 0.185, 0.122)
    this.browL.rotation.y = 0.15
    this.browR = this.browL.clone(); this.browR.position.x = 0.062; this.browR.rotation.y = -0.15
    this.headMeshes.add(this.browL, this.browR)

    // Small soft nose
    const nose = sphere(0.02, skinMat, 8, 6)
    nose.scale.set(1, 0.85, 0.9)
    nose.position.set(0, 0.075, 0.14)
    this.headMeshes.add(nose)

    // Mouth decal
    const mouthMat = new THREE.MeshBasicMaterial({ map: mouthTex('neutral'), transparent: true })
    this.mouth = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), mouthMat)
    this.mouth.position.set(0, 0.025, 0.134)
    this.mouth.userData.keepOpacity = true // alpha decal — never force opaque (player fade)
    this.headMeshes.add(this.mouth)

    this.hairSlot.position.y = 0.12
    this.headMeshes.add(this.hairSlot)

    // Arms: shirt sleeve with a rolled cuff, then bare forearm + soft hand
    const mkArm = (side: 1 | -1) => {
      const shoulder = new THREE.Group(); shoulder.position.set(0.2 * side, 0.16, 0); this.chest.add(shoulder)
      shoulder.add(sphere(0.068, shirtMat, 10, 8))
      const upper = new THREE.Group(); shoulder.add(upper)
      const upperMesh = capsule(0.057, 0.13, shirtMat); upperMesh.position.y = -0.1; upper.add(upperMesh)
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.017, 5, 10), shirtMat)
      cuff.position.y = -0.2
      cuff.rotation.x = Math.PI / 2
      cuff.castShadow = true
      upper.add(cuff)
      const fore = new THREE.Group(); fore.position.y = -0.26; upper.add(fore)
      fore.add(sphere(0.047, skinMat, 10, 8))
      const foreMesh = capsule(0.043, 0.14, skinMat); foreMesh.position.y = -0.11; fore.add(foreMesh)
      const hand = new THREE.Group(); hand.position.y = -0.24; fore.add(hand)
      // mitten hand: soft palm + three merged finger bumps (slightly oversized)
      const mitten = blobMesh([
        { r: 0.05, p: [0, -0.005, 0.008], s: [0.98, 1.0, 1.06] },              // palm
        { r: 0.023, p: [-0.028, -0.047, 0.016], s: [0.9, 1.5, 0.95], e: [0.12, 0, 0.1] },
        { r: 0.025, p: [0, -0.053, 0.02], s: [0.9, 1.6, 1.0], e: [0.12, 0, 0] },
        { r: 0.023, p: [0.028, -0.047, 0.016], s: [0.9, 1.5, 0.95], e: [0.12, 0, -0.1] }
      ], skinMat, 8, 6)
      hand.add(mitten)
      // separate opposable thumb bump on the inner side
      const thumb = sphere(0.024, skinMat, 8, 6)
      thumb.position.set(-0.045 * side, -0.012, 0.03)
      thumb.scale.set(0.82, 1.3, 0.95)
      thumb.rotation.set(0.25, 0, 0.35 * side)
      hand.add(thumb)
      return { shoulder, upper, fore, hand }
    }
    const armL = mkArm(-1); const armR = mkArm(1)
    this.shoulderL = armL.shoulder; this.upperArmL = armL.upper; this.foreArmL = armL.fore; this.handL = armL.hand
    this.shoulderR = armR.shoulder; this.upperArmR = armR.upper; this.foreArmR = armR.fore; this.handR = armR.hand

    // Legs: soft trousers with fold rings at the ankle + chunky soled shoes
    const mkLeg = (side: 1 | -1) => {
      const upper = new THREE.Group(); upper.position.set(0.09 * side, -0.03, 0); this.hips.add(upper)
      upper.add(sphere(0.078, trouserMat, 10, 8))
      const upperMesh = capsule(0.069, 0.2, trouserMat); upperMesh.position.y = -0.17; upper.add(upperMesh)
      const lower = new THREE.Group(); lower.position.y = -0.38; upper.add(lower)
      lower.add(sphere(0.061, trouserMat, 10, 8))
      const lowerMesh = capsule(0.054, 0.19, trouserMat); lowerMesh.position.y = -0.16; lower.add(lowerMesh)
      // trouser folds bunched at the ankle
      const foldA = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.013, 5, 10), trouserMat)
      foldA.position.set(0.003 * side, -0.3, 0.004); foldA.rotation.set(Math.PI / 2, 0, 0.08 * side); foldA.castShadow = true
      lower.add(foldA)
      const foldB = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.012, 5, 10), trouserMat)
      foldB.position.set(-0.003 * side, -0.345, -0.004); foldB.rotation.set(Math.PI / 2, 0, -0.07 * side); foldB.castShadow = true
      lower.add(foldB)
      // trouser hem draping down over the top of the shoe
      const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.056, 0.12, 12, 1, true), trouserMat)
      hem.position.y = -0.385
      hem.castShadow = true
      lower.add(hem)
      const foot = new THREE.Group(); foot.position.y = -0.42; lower.add(foot)
      // chunky shoe: rounded sole slab + merged-sphere upper (toe/body/heel)
      const sole = roundedBoxMesh(0.135, 0.046, 0.27, 0.016, mk(0xe9e6e0, 0.55), 1)
      sole.position.set(0, -0.107, 0.045)
      foot.add(sole)
      const shoe = blobMesh([
        { r: 0.06, p: [0, -0.062, 0.04], s: [0.95, 0.72, 1.65] },
        { r: 0.05, p: [0, -0.072, 0.135], s: [1.05, 0.68, 1.0] },
        { r: 0.048, p: [0, -0.058, -0.05], s: [0.95, 0.85, 0.95] }
      ], mk(0xf0f0f0, 0.5), 9, 7)
      foot.add(shoe)
      // tongue bump over the instep
      const tongue = sphere(0.032, trouserMat, 8, 6)
      tongue.scale.set(1.1, 0.55, 1.2)
      tongue.position.set(0, -0.032, 0.075)
      tongue.rotation.x = -0.5
      foot.add(tongue)
      return { upper, lower, foot, shoe }
    }
    const legL = mkLeg(-1); const legR = mkLeg(1)
    this.upperLegL = legL.upper; this.lowerLegL = legL.lower; this.footL = legL.foot
    this.upperLegR = legR.upper; this.lowerLegR = legR.lower; this.footR = legR.foot

    // Contact shadow
    const shadowTex = makeScreenTexture((g, w, h) => {
      const grad = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2)
      grad.addColorStop(0, 'rgba(0,0,0,0.45)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = grad; g.fillRect(0, 0, w, h)
    }, 64, 64)
    this.contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.8),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    )
    this.contactShadow.rotation.x = -Math.PI / 2
    this.contactShadow.position.y = 0.01
    this.contactShadow.userData.keepOpacity = true // radial-gradient decal stays transparent
    this.root.add(this.contactShadow)
  }

  setMouth(s: MouthState) {
    ;(this.mouth.material as THREE.MeshBasicMaterial).map = mouthTex(s)
    ;(this.mouth.material as THREE.MeshBasicMaterial).needsUpdate = true
  }

  triggerInteract() { if (this.interactT < 0) this.interactT = 0 }
  triggerStartle() { this.startleT = 0 }

  // lookTarget: world position or null.
  update(dt: number, lookTarget: THREE.Vector3 | null, talking = false) {
    this.t += dt
    // Breathing
    const breath = 1 + Math.sin(this.t * Math.PI * 2 * this.breathRate) * 0.012
    this.chest.scale.set(breath, breath, breath)

    // Blink
    this.blinkTimer -= dt
    if (this.blinkTimer <= 0) { this.blinkT = 0; this.blinkTimer = 3 + Math.random() * 3 + (Math.random() < 0.2 ? -2.6 : 0) }
    if (this.blinkT >= 0) {
      this.blinkT += dt
      const k = this.blinkT / 0.15
      const s = k < 0.5 ? 1 - k * 2 : (k - 0.5) * 2
      const sy = Math.max(0.08, s) * 1.06 // 1.06 = eye base y-scale
      this.eyeL.scale.y = sy; this.eyeR.scale.y = sy
      if (k >= 1) { this.blinkT = -1; this.eyeL.scale.y = 1.06; this.eyeR.scale.y = 1.06 }
    }

    // Brows
    const browRot = this.browEmotion * 0.25
    const browY = 0.175 + this.browEmotion * 0.012
    this.browL.rotation.z = browRot * 0.6
    this.browR.rotation.z = -browRot * 0.6
    this.browL.position.y = browY; this.browR.position.y = browY

    // Talk mouth flap
    if (talking) {
      this.setMouth(Math.sin(this.t * 14) > 0 ? 'talkA' : 'talkB')
    }

    // Head look-at
    if (lookTarget) {
      const local = this.head.parent!.worldToLocal(lookTarget.clone())
      const dir = local.sub(this.head.position).normalize()
      const yaw = THREE.MathUtils.clamp(Math.atan2(dir.x, dir.z) > Math.PI / 2 || Math.atan2(dir.x, dir.z) < -Math.PI / 2 ? 0 : Math.atan2(dir.x, dir.z), -1.2, 1.2)
      const pitch = THREE.MathUtils.clamp(-Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1)), -0.6, 0.6)
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch * 0.7, yaw, 0))
      this.lookCur.slerp(q, Math.min(1, dt * 4))
    } else {
      this.lookCur.slerp(new THREE.Quaternion(), Math.min(1, dt * 3))
    }
    this.head.quaternion.copy(this.lookCur)

    // Locomotion
    const jog = this.state === 'jog'
    const moving = this.state === 'walk' || jog
    const stride = jog ? 1.35 : 0.95 // longer steps — open, unhurried gait
    if (moving) this.phase += (this.speed * dt) / stride * Math.PI * 2
    const swing = moving ? Math.sin(this.phase) * (jog ? 0.76 : 0.56) : 0
    const swingB = moving ? Math.sin(this.phase + Math.PI) * (jog ? 0.76 : 0.56) : 0
    const blend = Math.min(1, dt * 7)
    const lerpRot = (g: THREE.Group, x: number) => { g.rotation.x += (x - g.rotation.x) * blend }

    lerpRot(this.upperLegL, swing)
    lerpRot(this.upperLegR, swingB)
    lerpRot(this.lowerLegL, moving ? Math.max(0, -Math.sin(this.phase)) * 0.9 : 0)
    lerpRot(this.lowerLegR, moving ? Math.max(0, -Math.sin(this.phase + Math.PI)) * 0.9 : 0)

    // Arms counter-swing; interact overrides right arm
    let armLTarget = moving ? swingB * (jog ? 0.62 : 0.42) : Math.sin(this.t * 0.8) * 0.03
    let armRTarget = moving ? swing * (jog ? 0.62 : 0.42) : Math.sin(this.t * 0.8 + 1) * 0.03
    if (this.interactT >= 0) {
      this.interactT += dt
      const k = this.interactT / 0.5
      const reach = Math.sin(Math.min(1, k) * Math.PI)
      armRTarget = -1.4 * reach
      if (k >= 1.2) this.interactT = -1
    }
    lerpRot(this.upperArmL, armLTarget)
    lerpRot(this.upperArmR, armRTarget)
    lerpRot(this.foreArmL, moving ? -(jog ? 0.8 : 0.26) : -0.15)
    lerpRot(this.foreArmR, this.interactT >= 0 ? -0.2 : moving ? -(jog ? 0.8 : 0.26) : -0.15)

    // Torso lean + hip bob
    const lean = moving ? (jog ? 0.16 : 0.05) : 0
    this.spine.rotation.x += (lean - this.spine.rotation.x) * blend
    const bob = moving ? Math.abs(Math.sin(this.phase)) * (jog ? 0.04 : 0.02) : 0
    let hipsY = 0.95 + bob
    this.hips.rotation.z = moving ? Math.sin(this.phase) * 0.026 : 0

    // Startle: 0.3s hop, arms up
    if (this.startleT >= 0) {
      this.startleT += dt
      const k = this.startleT / 0.3
      if (k < 1) {
        hipsY += Math.sin(k * Math.PI) * 0.12
        this.upperArmL.rotation.x = -2.2; this.upperArmR.rotation.x = -2.2
        this.browEmotion = 1
        this.setMouth('talkA')
      } else if (k > 2.4) {
        this.startleT = -1
      }
    }
    this.hips.position.y += (hipsY - this.hips.position.y) * Math.min(1, dt * 10)

    // Idle fidgets
    if (this.state === 'idle' && this.startleT < 0) {
      this.idleFidgetT -= dt
      if (this.idleFidgetT <= 0) { this.fidgetAnim = 0; this.idleFidgetT = 8 + Math.random() * 7 }
      if (this.fidgetAnim >= 0) {
        this.fidgetAnim += dt
        const k = this.fidgetAnim / 1.4
        if (k < 1) {
          // check phone / look over shoulder mix
          this.upperArmL.rotation.x = -1.1 * Math.sin(Math.min(1, k * 1.4) * Math.PI)
          this.foreArmL.rotation.x = -0.9 * Math.sin(Math.min(1, k * 1.4) * Math.PI)
        } else {
          this.fidgetAnim = -1
        }
      }
    }
  }
}
