// World architecture: floors, walls, sliding doors, gating, global lighting & warmth (spec §5, §12, §22).
import * as THREE from 'three'
import { LIGHTING, ROOMS, type RoomDef, type RoomId, type WarmthPreset } from '../config.ts'
import { makeLabelTexture, makeScreenTexture } from '../engine/textures.ts'
import { audio } from '../engine/audio.ts'

export interface Collider {
  box: THREE.Box3
  enabled: boolean
}

export class Door {
  group = new THREE.Group()
  panel: THREE.Mesh
  collider: Collider
  light: THREE.Mesh
  locked = true
  private openAmt = 0
  private stickyNote: THREE.Mesh | null = null
  axis: 'x' | 'z'
  width: number

  constructor(x: number, z: number, axis: 'x' | 'z', width = 2, excuse?: string) {
    this.axis = axis
    this.width = width
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.5, metalness: 0.4 })
    // clearer frosted glass — at higher opacity the panels read as blank walls
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xaac4d4, roughness: 0.3, transparent: true, opacity: 0.22, metalness: 0.1, depthWrite: false
    })
    // frame posts
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(axis === 'z' ? 0.12 : 0.2, 3, axis === 'z' ? 0.2 : 0.12), frameMat)
      if (axis === 'z') post.position.set(s * (width / 2), 1.5, 0)
      else post.position.set(0, 1.5, s * (width / 2))
      this.group.add(post)
    }
    const header = new THREE.Mesh(new THREE.BoxGeometry(axis === 'z' ? width + 0.2 : 0.2, 0.35, axis === 'z' ? 0.2 : width + 0.2), frameMat)
    header.position.y = 2.8
    this.group.add(header)
    // sliding frosted panel with visible door furniture (stiles, mid-rail, handle)
    // so it reads as a door, never as a stray wall
    this.panel = new THREE.Mesh(new THREE.BoxGeometry(axis === 'z' ? width : 0.08, 2.65, axis === 'z' ? 0.08 : width), glassMat)
    this.panel.position.y = 1.32
    const along = (v: number): [number, number, number] => axis === 'z' ? [v, 0, 0] : [0, 0, v]
    const bar = (lenAcross: number, h: number, posAlong: number, py: number, thick = 0.1) => {
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(axis === 'z' ? lenAcross : thick, h, axis === 'z' ? thick : lenAcross),
        frameMat
      )
      const [bx, , bz] = along(posAlong)
      b.position.set(bx, py, bz)
      this.panel.add(b)
      return b
    }
    bar(0.07, 2.6, -width / 2 + 0.05, 0)          // leading stile
    bar(0.07, 2.6, width / 2 - 0.05, 0)           // trailing stile
    bar(width - 0.08, 0.09, 0, -0.28)             // mid-rail at hand height
    bar(width - 0.08, 0.09, 0, -1.24)             // kick rail
    bar(0.05, 0.55, -width / 2 + 0.16, -0.28, 0.14) // handle bar
    this.group.add(this.panel)
    // badge reader light
    this.light = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.12, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff2020, emissiveIntensity: 1.6 })
    )
    if (axis === 'z') this.light.position.set(width / 2 + 0.25, 1.2, 0.15)
    else this.light.position.set(0.15, 1.2, width / 2 + 0.25)
    this.group.add(this.light)
    if (excuse) {
      this.stickyNote = new THREE.Mesh(
        new THREE.PlaneGeometry(0.35, 0.35),
        new THREE.MeshStandardMaterial({ map: makeLabelTexture(excuse, { w: 128, h: 128, bg: '#f7e97a', fg: '#5a4a20', hand: true }) })
      )
      this.stickyNote.position.y = 1.6
      if (axis === 'z') { this.stickyNote.position.z = 0.06 } else { this.stickyNote.position.x = 0.06; this.stickyNote.rotation.y = Math.PI / 2 }
      this.group.add(this.stickyNote)
    }
    this.group.position.set(x, 0, z)
    const half = axis === 'z' ? new THREE.Vector3(width / 2, 1.5, 0.15) : new THREE.Vector3(0.15, 1.5, width / 2)
    const c = new THREE.Vector3(x, 1.5, z)
    this.collider = { box: new THREE.Box3(c.clone().sub(half), c.clone().add(half)), enabled: true }
  }

  setLocked(locked: boolean) {
    this.locked = locked
    const m = this.light.material as THREE.MeshStandardMaterial
    m.emissive = new THREE.Color(locked ? 0xff2020 : 0x30ff60)
    if (!locked && this.stickyNote) { this.stickyNote.visible = false }
  }

  update(dt: number, playerPos: THREE.Vector3) {
    const d = playerPos.distanceTo(this.group.position)
    const wantOpen = !this.locked && d < 2.2
    const prev = this.openAmt
    this.openAmt = THREE.MathUtils.clamp(this.openAmt + (wantOpen ? dt / 0.6 : -dt / 0.6), 0, 1)
    if (prev === 0 && this.openAmt > 0) audio.sfx('doorSlide')
    const slide = easeOut(this.openAmt) * (this.width - 0.15)
    if (this.axis === 'z') this.panel.position.x = slide
    else this.panel.position.z = slide
    this.collider.enabled = this.openAmt < 0.6
  }
}

function easeOut(k: number): number { return 1 - Math.pow(1 - k, 3) }

interface Tube {
  mesh: THREE.Mesh
  light: THREE.PointLight | null
  mode: 'ok' | 'flicker' | 'dead'
  timer: number
  diedOnce: boolean
}

export class World {
  group = new THREE.Group()
  colliders: Collider[] = []
  wallMeshes: THREE.Object3D[] = []   // for camera spring-arm
  doors = new Map<RoomId, Door>()
  hemi: THREE.HemisphereLight
  moon: THREE.DirectionalLight
  fog: THREE.FogExp2
  warmth = 0 // 0 cold → 1 warm; drives preset interpolation
  private warmthTarget = 0
  tubes: Tube[] = []
  posterMats: THREE.MeshStandardMaterial[] = []
  remapLetters: THREE.Mesh[] = []
  lobbyWarmLight: THREE.PointLight
  floorMat: THREE.MeshPhysicalMaterial
  spookFree = false
  reduceMotion = false
  onTubeDeath: (() => void) | null = null
  private lightningTimer = 14
  onLightning: (() => void) | null = null

  constructor(public scene: THREE.Scene) {
    scene.add(this.group)
    this.fog = new THREE.FogExp2(LIGHTING.COLD.fogColor, LIGHTING.COLD.fogDensity)
    scene.fog = this.fog
    this.hemi = new THREE.HemisphereLight(LIGHTING.COLD.hemiSky, LIGHTING.COLD.hemiGround, LIGHTING.COLD.hemiIntensity)
    scene.add(this.hemi)
    this.moon = new THREE.DirectionalLight(0x6f84b8, 1.6)
    this.moon.position.set(20, 25, 20)
    this.moon.castShadow = true
    this.moon.shadow.mapSize.set(1024, 1024)
    this.moon.shadow.camera.left = -25
    this.moon.shadow.camera.right = 25
    this.moon.shadow.camera.top = 25
    this.moon.shadow.camera.bottom = -50
    scene.add(this.moon)

    // Polished lino floor in 2 m tiles: the grid gives depth and scale cues
    const floorTex = makeScreenTexture((g, w, h) => {
      g.fillStyle = '#3a4049'
      g.fillRect(0, 0, w, h)
      for (let i = 0; i < 1800; i++) {
        g.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`
        g.fillRect(Math.random() * w, Math.random() * h, 3, 3)
      }
      g.strokeStyle = '#22262c'
      g.lineWidth = 5
      g.strokeRect(0, 0, w, h)
    }, 256, 256)
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping
    floorTex.repeat.set(14, 29)
    this.floorMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: floorTex, roughness: 0.35, clearcoat: 0.3, metalness: 0.05 })
    this.buildArchitecture()
    this.lobbyWarmLight = new THREE.PointLight(0xffb36b, 0, 14)
    this.lobbyWarmLight.position.set(0, 2.6, 7)
    this.group.add(this.lobbyWarmLight)
  }

  addCollider(minX: number, minZ: number, maxX: number, maxZ: number, h = 3): Collider {
    const c: Collider = { box: new THREE.Box3(new THREE.Vector3(minX, 0, minZ), new THREE.Vector3(maxX, h, maxZ)), enabled: true }
    this.colliders.push(c)
    return c
  }

  // Plaster wall with a dado line and dark skirting baked into the texture, so
  // every wall reads as an interior surface rather than a flat slab.
  private wallMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.82,
    map: makeScreenTexture((g, w, h) => {
      g.fillStyle = '#6f757f'
      g.fillRect(0, 0, w, h)
      for (let i = 0; i < 2600; i++) {
        g.fillStyle = `rgba(${200 + Math.random() * 55},${205 + Math.random() * 50},${215 + Math.random() * 40},${0.05 + Math.random() * 0.08})`
        g.fillRect(Math.random() * w, Math.random() * h, 2, 2)
      }
      // dado rail at ~1 m
      g.fillStyle = '#4a5058'
      g.fillRect(0, h * 0.655, w, 4)
      // skirting board
      g.fillStyle = '#2c3037'
      g.fillRect(0, h * 0.955, w, h * 0.045)
    }, 256, 256)
  })
  private wallMatDark = new THREE.MeshStandardMaterial({ color: 0x383d44, roughness: 0.9 })

  private mkWall(cx: number, cz: number, w: number, d: number, h = 3, mat?: THREE.Material) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat ?? this.wallMat)
    m.position.set(cx, h / 2, cz)
    m.receiveShadow = true
    this.group.add(m)
    this.wallMeshes.push(m)
    this.addCollider(cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, h)
    return m
  }

  // wall along z at fixed x, with optional gaps (list of [z0,z1])
  wallX(x: number, z0: number, z1: number, gaps: [number, number][] = []) {
    const segs = cut(z0, z1, gaps)
    for (const [a, b] of segs) this.mkWall(x, (a + b) / 2, 0.18, b - a)
  }
  wallZ(z: number, x0: number, x1: number, gaps: [number, number][] = []) {
    const segs = cut(x0, x1, gaps)
    for (const [a, b] of segs) this.mkWall((a + b) / 2, z, b - a, 0.18)
  }

  private buildArchitecture() {
    // Floors: one big slab under everything main; separate for rooftop
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(28, 58), this.floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, 0, -13)
    floor.receiveShadow = true
    this.group.add(floor)
    // Ceiling: suspended tile grid
    const ceilTex = makeScreenTexture((g, w, h) => {
      g.fillStyle = '#4a4f57'
      g.fillRect(0, 0, w, h)
      g.strokeStyle = '#30343b'
      g.lineWidth = 6
      g.strokeRect(0, 0, w, h)
    }, 128, 128)
    ceilTex.wrapS = ceilTex.wrapT = THREE.RepeatWrapping
    ceilTex.repeat.set(23, 48)
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: ceilTex, roughness: 0.95 })
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(28, 58), ceilMat)
    ceil.rotation.x = Math.PI / 2
    ceil.position.set(0, 3, -13)
    this.group.add(ceil)

    // Room ceiling panel lights: one warm-white panel per room + lobby trio,
    // so every space has a visible light source and readable walls.
    const panelAt = (x: number, z: number, color = 0xe6f1ff, intensity = 7) => {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.05, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 1.1 })
      )
      panel.position.set(x, 2.96, z)
      this.group.add(panel)
      const pl = new THREE.PointLight(color, intensity, 10)
      pl.position.set(x, 2.6, z)
      this.group.add(pl)
    }
    panelAt(-3.5, 6, 0xcfe3ff); panelAt(3.5, 6, 0xcfe3ff); panelAt(0, 11, 0xcfe3ff)
    for (const r of ROOMS) {
      if (r.id === 'corridor' || r.id === 'lobby' || r.id === 'rooftop' || r.id === 'lift') continue
      const cx = (r.rect[0] + r.rect[2]) / 2, cz = (r.rect[1] + r.rect[3]) / 2
      panelAt(cx, cz + (r.id === 'meetingRoom' ? 2.5 : 0), r.id === 'serverRoom' ? 0x9fb8ff : 0xe6f1ff, r.id === 'serverRoom' ? 3 : 6)
    }

    // Corridor walls with door gaps
    const westGaps: [number, number][] = [[-34, -32], [-22, -20], [-10, -8]]
    const eastGaps: [number, number][] = [[-34, -32], [-22, -20], [-10, -8]]
    this.wallX(-1.5, -40, 0, westGaps)
    this.wallX(1.5, -40, 0, eastGaps)
    // Corridor north wall + stairwell door gap
    this.wallZ(-40, -1.5, 1.5, [[-1, 1]])

    // Side rooms: outer walls
    const sideRooms: [RoomId, number[], 'W' | 'E'][] = [
      ['serverRoom', [-12.5, -38, -1.5, -28], 'W'],
      ['archive', [-12.5, -26, -1.5, -16], 'W'],
      ['breakRoom', [-12.5, -14, -1.5, -4], 'W'],
      ['meetingRoom', [1.5, -38, 12.5, -28], 'E'],
      ['designStudio', [1.5, -26, 12.5, -16], 'E'],
      ['financeCorner', [1.5, -14, 12.5, -4], 'E']
    ]
    for (const [id, [x0, z0, x1, z1], side] of sideRooms) {
      this.wallZ(z0, x0, x1)
      this.wallZ(z1, x0, x1)
      this.wallX(side === 'W' ? x0 : x1, z0, z1)
      const def = ROOMS.find((r) => r.id === id)!
      const door = new Door(def.door.x, def.door.z, 'x', 2, def.unlockAt > 0 ? 'Cleaning in\nprogress\nsince 2019' : undefined)
      door.setLocked(def.unlockAt > 0)
      this.group.add(door.group)
      this.colliders.push(door.collider)
      this.doors.set(id, door)
    }

    // Lobby walls
    this.wallZ(0, -7, 7, [[-1.5, 1.5]])
    this.wallZ(14, -7, 7)
    this.wallX(-7, 0, 14)
    this.wallX(7, 0, 14, [[4.6, 6.8]])
    // Lift box
    this.wallZ(4, 7, 10.4)
    this.wallZ(7.4, 7, 10.4)
    this.wallX(10.4, 4, 7.4)
    const liftDoor = new Door(7, 5.7, 'x', 2.2)
    liftDoor.setLocked(true)
    this.group.add(liftDoor.group)
    this.colliders.push(liftDoor.collider)
    this.doors.set('lift', liftDoor)

    // Stairwell door (rooftop access)
    const roofDoor = new Door(0, -40, 'z', 2, 'STAIRS —\nauthorised\npersonnel &\nghosts only')
    roofDoor.setLocked(true)
    this.group.add(roofDoor.group)
    this.colliders.push(roofDoor.collider)
    this.doors.set('rooftop', roofDoor)

    // Corridor fluorescent tubes
    for (let i = 0; i < 12; i++) {
      const z = -3 - i * 3.2
      const tubeMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.06, 1.4),
        new THREE.MeshStandardMaterial({ color: 0xd8ffe8, emissive: 0xd8ffe8, emissiveIntensity: 1.4 })
      )
      tubeMesh.position.set(0, 2.95, z)
      this.group.add(tubeMesh)
      let light: THREE.PointLight | null = null
      if (i % 2 === 0) {
        light = new THREE.PointLight(0xd8ffe8, 8, 10)
        light.position.set(0, 2.7, z)
        this.group.add(light)
      }
      this.tubes.push({
        mesh: tubeMesh, light,
        mode: i === 2 || i === 5 || i === 9 ? 'flicker' : 'ok',
        timer: Math.random() * 2,
        diedOnce: false
      })
    }

    // Windows: lobby back wall night skyline
    const skyTex = makeScreenTexture((g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, '#0a0e1c')
      grad.addColorStop(1, '#1a2033')
      g.fillStyle = grad
      g.fillRect(0, 0, w, h)
      for (let b = 0; b < 14; b++) {
        const bw = 20 + Math.random() * 30
        const bh = 60 + Math.random() * 90
        const bx = Math.random() * (w - bw)
        g.fillStyle = '#12141f'
        g.fillRect(bx, h - bh, bw, bh)
        g.fillStyle = '#e8d9a0'
        for (let wy = h - bh + 6; wy < h - 8; wy += 12) {
          for (let wx = bx + 4; wx < bx + bw - 6; wx += 9) {
            if (Math.random() < 0.3) g.fillRect(wx, wy, 4, 6)
          }
        }
      }
    }, 512, 256)
    const win = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 2.2),
      new THREE.MeshBasicMaterial({ map: skyTex })
    )
    win.position.set(0, 1.7, 13.9)
    win.rotation.y = Math.PI
    this.group.add(win)
  }

  setWarmthTarget(w: number) { this.warmthTarget = w }

  currentRoom(p: THREE.Vector3): RoomId {
    for (const r of ROOMS) {
      if (r.id === 'corridor') continue
      if (p.x >= r.rect[0] && p.x <= r.rect[2] && p.z >= r.rect[1] && p.z <= r.rect[3]) return r.id
    }
    return 'corridor'
  }

  roomDef(id: RoomId): RoomDef { return ROOMS.find((r) => r.id === id)! }

  update(dt: number, playerPos: THREE.Vector3, time: number) {
    // warmth interpolation over ~2s
    this.warmth += THREE.MathUtils.clamp(this.warmthTarget - this.warmth, -dt / 2, dt / 2)
    const w = this.warmth
    const pick = (k: keyof typeof LIGHTING['COLD']) => {
      const c = LIGHTING.COLD[k] as number, n = LIGHTING.NEUTRAL[k] as number, wa = LIGHTING.WARM[k] as number
      return w < 0.5 ? THREE.MathUtils.lerp(c, n, w * 2) : THREE.MathUtils.lerp(n, wa, (w - 0.5) * 2)
    }
    const lerpColor = (k: 'hemiSky' | 'hemiGround' | 'fogColor') => {
      const c = new THREE.Color(LIGHTING.COLD[k]), n = new THREE.Color(LIGHTING.NEUTRAL[k]), wa = new THREE.Color(LIGHTING.WARM[k])
      return w < 0.5 ? c.lerp(n, w * 2) : n.lerp(wa, (w - 0.5) * 2)
    }
    this.hemi.color = lerpColor('hemiSky')
    this.hemi.groundColor = lerpColor('hemiGround')
    this.hemi.intensity = pick('hemiIntensity') + (this.spookFree ? 0.5 : 0)
    this.fog.color = lerpColor('fogColor')
    this.fog.density = pick('fogDensity')

    // door updates
    for (const d of this.doors.values()) d.update(dt, playerPos)

    // tube flicker
    for (const t of this.tubes) {
      const m = t.mesh.material as THREE.MeshStandardMaterial
      if (t.mode === 'dead') { m.emissiveIntensity = 0; if (t.light) t.light.intensity = 0; continue }
      if (t.mode === 'flicker' && !this.reduceMotion) {
        t.timer -= dt
        if (t.timer <= 0) {
          t.timer = 0.2 + Math.random() * (2.8 - this.warmth * 2)
          const on = Math.random() > 0.35
          m.emissiveIntensity = on ? 1.4 : 0.15
          if (t.light) t.light.intensity = on ? 8 : 1
        }
      } else {
        m.emissiveIntensity = 1.4
        if (t.light) t.light.intensity = 8
      }
      // warmth tints the tubes
      const cold = new THREE.Color(0xd8ffe8), warm = new THREE.Color(0xffe0b8)
      m.emissive = cold.clone().lerp(warm, w)
      if (t.light) t.light.color = m.emissive
    }

    // lobby warm light rises with warmth
    this.lobbyWarmLight.intensity = w * 14

    // slow lightning through lobby window
    this.lightningTimer -= dt
    if (this.lightningTimer <= 0) {
      this.lightningTimer = 18 + Math.random() * 20
      if (!this.reduceMotion && this.warmth < 0.8) this.onLightning?.()
    }
  }

  killTube(index: number) {
    const t = this.tubes[index]
    if (t && !t.diedOnce) {
      t.diedOnce = true
      t.mode = 'dead'
      audio.sfx('tink')
      this.onTubeDeath?.()
    }
  }

  // Circle-vs-AABB collision with sliding (spec §3.3)
  collide(pos: THREE.Vector3, radius: number): THREE.Vector3 {
    const p = pos.clone()
    for (let iter = 0; iter < 3; iter++) {
      let moved = false
      for (const c of this.colliders) {
        if (!c.enabled) continue
        const b = c.box
        if (p.x + radius < b.min.x || p.x - radius > b.max.x || p.z + radius < b.min.z || p.z - radius > b.max.z) continue
        // nearest point on box
        const nx = THREE.MathUtils.clamp(p.x, b.min.x, b.max.x)
        const nz = THREE.MathUtils.clamp(p.z, b.min.z, b.max.z)
        const dx = p.x - nx, dz = p.z - nz
        const d2 = dx * dx + dz * dz
        if (d2 < radius * radius) {
          if (d2 > 1e-9) {
            const d = Math.sqrt(d2)
            p.x = nx + (dx / d) * radius
            p.z = nz + (dz / d) * radius
          } else {
            // centre inside box: push out along min axis
            const pushL = p.x - (b.min.x - radius), pushR = (b.max.x + radius) - p.x
            const pushD = p.z - (b.min.z - radius), pushU = (b.max.z + radius) - p.z
            const m = Math.min(pushL, pushR, pushD, pushU)
            if (m === pushL) p.x = b.min.x - radius
            else if (m === pushR) p.x = b.max.x + radius
            else if (m === pushD) p.z = b.min.z - radius
            else p.z = b.max.z + radius
          }
          moved = true
        }
      }
      if (!moved) break
    }
    return p
  }
}

function cut(a: number, b: number, gaps: [number, number][]): [number, number][] {
  let segs: [number, number][] = [[Math.min(a, b), Math.max(a, b)]]
  for (const [g0, g1] of gaps) {
    const out: [number, number][] = []
    for (const [s0, s1] of segs) {
      if (g1 <= s0 || g0 >= s1) { out.push([s0, s1]); continue }
      if (g0 > s0) out.push([s0, g0])
      if (g1 < s1) out.push([g1, s1])
    }
    segs = out
  }
  return segs.filter(([s0, s1]) => s1 - s0 > 0.05)
}
