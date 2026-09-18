// ROOFTOP — "Purpose": Tariq, the skyline, no puzzle (spec §8.8).
import * as THREE from 'three'
import type { Game, RoomModule } from '../game/game.ts'
import { makeGhost, type Ghost } from '../characters/ghosts.ts'
import { D } from '../data/dialogue.ts'
import { box, std, deckchair } from './props.ts'
import { makeScreenDot } from '../characters/playerChar.ts'
import { audio } from '../engine/audio.ts'

export function buildRooftop(game: Game): RoomModule {
  const g = new THREE.Group()
  game.scene.add(g)
  const done = game.flags.has('rooftopDone')
  const cx = 52, cz = -50 // rooftop centre (rect [40,-60,64,-40])

  // Roof slab + railings
  const slab = new THREE.Mesh(new THREE.BoxGeometry(24, 0.4, 20), std(0x3a3f46, { rough: 0.9 }))
  slab.position.set(cx, -0.2, cz)
  slab.receiveShadow = true
  g.add(slab)
  const railMat = std(0x5a6068, { metal: 0.6, rough: 0.4 })
  const mkRail = (x0: number, z0: number, x1: number, z1: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0)
    const rail = box(len, 0.06, 0.06, railMat, (x0 + x1) / 2, 1.1, (z0 + z1) / 2)
    rail.rotation.y = Math.atan2(z1 - z0, x1 - x0) * -1
    g.add(rail)
    for (let i = 0; i <= len; i += 2) {
      const t = i / len
      g.add(box(0.05, 1.1, 0.05, railMat, x0 + (x1 - x0) * t, 0.55, z0 + (z1 - z0) * t))
    }
  }
  mkRail(40, -60, 64, -60)
  mkRail(40, -40, 64, -40)
  mkRail(40, -60, 40, -40)
  mkRail(64, -60, 64, -40)
  game.world.addCollider(40, -60.4, 64, -59.9)
  game.world.addCollider(40, -40.1, 64, -39.6)
  game.world.addCollider(39.6, -60, 40.1, -40)
  game.world.addCollider(63.9, -60, 64.4, -40)

  // AC units, water tank, cooler, crate, deckchairs, telescope
  for (let i = 0; i < 2; i++) {
    const ac = box(2, 1.2, 1.4, std(0x7a8088, { metal: 0.4, rough: 0.6 }), 44 + i * 4, 0.6, -57)
    g.add(ac)
    game.world.addCollider(43 + i * 4, -57.7, 45 + i * 4, -56.3, 1.2)
  }
  game.interact.add({ id: 'roof-ac', position: new THREE.Vector3(45, 0.8, -56.6), verb: 'Inspect AC unit', onInteract: () => game.toast(D.toasts.rooftop.acUnit) })
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2.4, 14), std(0x6a7078, { metal: 0.5, rough: 0.5 }))
  tank.position.set(61, 1.2, -57)
  g.add(tank)
  game.world.addCollider(59.8, -58.2, 62.2, -55.8, 2.4)
  const dc1 = deckchair(0xcc7755); dc1.position.set(51, 0, -46); dc1.rotation.y = 0.4; g.add(dc1)
  const dc2 = deckchair(0x77aacc); dc2.position.set(52.4, 0, -45.6); dc2.rotation.y = -0.2; g.add(dc2)
  game.interact.add({ id: 'roof-deckchair', position: new THREE.Vector3(51.7, 0.4, -45.8), verb: 'Inspect deckchairs', onInteract: () => game.toast(D.toasts.rooftop.deckchair) })
  const cooler = box(0.5, 0.4, 0.35, std(0xcc4444, { rough: 0.5 }), 53.5, 0.2, -46)
  g.add(cooler)
  game.interact.add({ id: 'roof-cooler', position: cooler.position.clone(), verb: 'Open cooler', mesh: cooler, onInteract: () => game.toast(D.toasts.rooftop.cooler) })
  const crate = box(0.7, 0.5, 0.7, std(0x8a7a5a, { rough: 0.9 }), 52.7, 0.25, -46.6)
  g.add(crate)
  // telescope
  const tele = new THREE.Group()
  tele.add(box(0.05, 1.0, 0.05, std(0x3a3f46), 0, 0.5, 0))
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.7, 10), std(0x8a5a3a, { metal: 0.5, rough: 0.4 }))
  tube.rotation.x = Math.PI / 2.6
  tube.position.y = 1.05
  tele.add(tube)
  tele.position.set(56, 0, -52.5)
  g.add(tele)
  game.interact.add({ id: 'roof-telescope', position: tele.position.clone().setY(1), verb: 'Look through telescope', mesh: tele, onInteract: () => game.toast(done ? D.sam.echo : D.toasts.rooftop.telescope) })

  // String lights
  const lightsGroup = new THREE.Group()
  for (let i = 0; i < 40; i++) {
    const t = i / 39
    const x = 44 + t * 16
    const y = 2.2 - Math.sin(t * Math.PI * 3) * 0.3
    const on = i % 2 === 0
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 6, 5),
      std(on ? 0xffd27a : 0x554a33, on ? { emissive: 0xffd27a, emissiveIntensity: 2 } : {})
    )
    bulb.position.set(x, y, -48 + Math.sin(t * 9) * 0.4)
    lightsGroup.add(bulb)
  }
  g.add(lightsGroup)
  for (let i = 0; i < 4; i++) {
    const pl = new THREE.PointLight(0xffd27a, 3, 6)
    pl.position.set(46 + i * 4, 2.2, -48)
    g.add(pl)
  }
  game.interact.add({ id: 'roof-lights', position: new THREE.Vector3(52, 1.8, -48), radius: 2.4, verb: 'Inspect string lights', onInteract: () => game.toast(D.toasts.rooftop.stringLights) })

  // City skyline: 60 buildings with window grids + stars + moon
  const cityGroup = new THREE.Group()
  // The skyline ring must never intrude into the office footprint (x -14..14,
  // z -42..16) — buildings there showed up as giant black walls inside the level.
  const insideOffice = (x: number, z: number) => Math.abs(x) < 20 && z > -50 && z < 24
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2
    let dist = 55 + Math.random() * 40
    let bx = cx + Math.sin(a) * dist, bz = cz + Math.cos(a) * dist
    if (insideOffice(bx, bz)) {
      // push this one out past the office instead of dropping it
      dist = 110 + Math.random() * 30
      bx = cx + Math.sin(a) * dist; bz = cz + Math.cos(a) * dist
      if (insideOffice(bx, bz)) continue
    }
    const bw = 4 + Math.random() * 8
    const bh = 8 + Math.random() * 26
    const bld = new THREE.Mesh(
      new THREE.BoxGeometry(bw, bh, bw),
      std(0x10141c, { rough: 0.9, emissive: 0x2a3448, emissiveIntensity: 0.12 })
    )
    bld.position.set(bx, bh / 2 - 6, bz)
    cityGroup.add(bld)
    // a few emissive window strips
    for (let wI = 0; wI < 3; wI++) {
      const strip = new THREE.Mesh(
        new THREE.PlaneGeometry(bw * 0.8, 0.5),
        new THREE.MeshBasicMaterial({ color: 0xe8d9a0 })
      )
      strip.position.set(bld.position.x, 1 + Math.random() * bh * 0.8 - 5, bld.position.z + bw / 2 + 0.05)
      strip.lookAt(cx, strip.position.y, cz)
      cityGroup.add(strip)
    }
  }
  g.add(cityGroup)
  // stars
  const starPos = new Float32Array(2000 * 3)
  for (let i = 0; i < 2000; i++) {
    const a = Math.random() * Math.PI * 2
    const el = Math.random() * Math.PI * 0.45
    const r = 90
    starPos[i * 3] = cx + Math.cos(el) * Math.sin(a) * r
    starPos[i * 3 + 1] = Math.sin(el) * r
    starPos[i * 3 + 2] = cz + Math.cos(el) * Math.cos(a) * r
  }
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xdfe8ff, size: 0.35, map: makeScreenDot(), transparent: true, depthWrite: false
  }))
  g.add(stars)
  const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), new THREE.MeshBasicMaterial({ color: 0xf0ead8 }))
  moonMesh.position.set(cx + 40, 42, cz - 55)
  g.add(moonMesh)
  const cityGlow = new THREE.DirectionalLight(0xffb38a, 1.4)
  cityGlow.position.set(cx, 2, cz + 40)
  cityGlow.target.position.set(cx, 6, cz)
  g.add(cityGlow, cityGlow.target)

  // Exit door back down
  const exitDoor = box(1.2, 2.2, 0.15, std(0x4a5058, { rough: 0.6 }), 52, 1.1, -40.2)
  g.add(exitDoor)
  game.interact.add({
    id: 'roof-exit',
    position: new THREE.Vector3(52, 1, -40.6),
    radius: 2,
    verb: 'Head back down',
    mesh: exitDoor,
    onInteract: () => {
      game.flags.add('rooftopDone')
      game.leaveRooftop()
    }
  })

  // --- Tariq --------------------------------------------------------------------
  let sam: Ghost | null = null
  if (!done || !game.fragments.includes('purpose')) {
    sam = makeGhost('sam')
    sam.setPosition(56.5, 0, -58.2, Math.PI)
    game.scene.add(sam.group)
    game.ghosts.push(sam)
  } else {
    leaveKeepsake()
  }
  function leaveKeepsake() {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 12), std(0x3a3026, { rough: 0.5 }))
    cap.position.set(56.4, 1.06, -57.8)
    g.add(cap)
    game.interact.add({
      id: 'cap-keepsake',
      position: cap.position.clone(),
      verb: 'Inspect telescope cap',
      mesh: cap,
      onInteract: () => game.toast(D.sam.echo)
    })
  }

  let talked = game.fragments.includes('purpose')
  game.interact.add({
    id: 'sam',
    position: new THREE.Vector3(56.5, 0, -58.2),
    radius: 3,
    verb: 'Sit with Tariq',
    priority: 0.9,
    mesh: sam?.rig.root,
    enabled: () => !!sam && !sam.released && !sam.releasing && !talked,
    onInteract: () => {
      if (!sam) return
      talked = true
      const anchor = sam.rig.head
      audio.setMusic('rooftop')
      game.say(
        D.sam.arrive.map((text, i) => ({ speaker: 'sam', name: i === 0 ? 'TARIQ' : undefined, text, anchor })),
        {
          ghost: sam, critical: true, onDone: () => {
            game.player.locked = true
            audio.sfx('ghostExhale')
            sam!.release(() => {
              leaveKeepsake()
              game.collectFragment('purpose', sam!.group.position, () => {
                game.setObjective(D.ui.objectives.badgeOut, D.ui.hints.lobby, [0, 8])
              })
            })
          }
        }
      )
    }
  })

  return {
    id: 'rooftop',
    onEnter: () => {
      if (!talked) game.setObjective('Someone is waiting by the ledge.', D.ui.hints.rooftop, null)
    }
  }
}
