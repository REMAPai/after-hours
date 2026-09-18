// SERVER ROOM — "Uptime": Marcus + Cable Match puzzle (spec §8.2).
import * as THREE from 'three'
import type { Game, RoomModule } from '../game/game.ts'
import { makeGhost, type Ghost } from '../characters/ghosts.ts'
import { D } from '../data/dialogue.ts'
import { box, std, serverRack, whiteboard, stickyNote3D } from './props.ts'
import { makeLabelTexture } from '../engine/textures.ts'
import { audio } from '../engine/audio.ts'

const CABLES = [
  { id: 'power', label: 'POWER', icon: '⚡', color: 0xcc3333 },
  { id: 'net', label: 'NET', icon: '⌗', color: 0x3388cc },
  { id: 'backup', label: 'BACKUP', icon: '⟳', color: 0x33aa66 },
  { id: 'mystery', label: 'MYSTERY —\nDO NOT\nUNPLUG', icon: '???', color: 0x8844aa }
]

export function buildServerRoom(game: Game): RoomModule {
  const g = new THREE.Group()
  game.scene.add(g)
  const solved = game.flags.has('serverSolved')
  const cx = -7, cz = -33 // room centre

  // Racks
  const racks: ReturnType<typeof serverRack>[] = []
  for (let i = 0; i < 4; i++) {
    const r = serverRack(i === 2 && !solved ? 0xff2a2a : 0x3a7bff)
    r.group.position.set(cx - 3.5 + i * 2.2, 0, cz - 3.2)
    g.add(r.group)
    racks.push(r)
    game.world.addCollider(r.group.position.x - 0.4, r.group.position.z - 0.5, r.group.position.x + 0.4, r.group.position.z + 0.5)
  }
  const server6 = racks[2]
  if (solved) server6.leds.emissive = new THREE.Color(0x33ff66)

  // low blue point lights behind racks
  for (let i = 0; i < 2; i++) {
    const pl = new THREE.PointLight(0x3a7bff, 6, 8)
    pl.position.set(cx - 2 + i * 3, 0.5, cz - 3.8)
    g.add(pl)
  }
  const strobe = new THREE.PointLight(0xff2a2a, solved ? 0 : 10, 7)
  strobe.position.set(server6.group.position.x, 1.6, cz - 2.4)
  g.add(strobe)

  // Cable tray overhead
  const tray = box(7, 0.08, 0.5, std(0x3a4048, { metal: 0.5, rough: 0.5 }), cx, 2.6, cz - 1)
  g.add(tray)

  // Whiteboard, KVM, desk fan, cans, floor tile, sticky note
  const wb = whiteboard('DAYS SINCE\nINCIDENT: 0')
  wb.position.set(cx - 4.8, 1.7, cz + 4.8)
  g.add(wb)
  game.interact.add({ id: 'srv-wb', position: wb.position.clone(), verb: 'Read whiteboard', mesh: wb, onInteract: () => game.toast(D.toasts.serverRoom.whiteboard) })
  const kvm = box(0.6, 1.1, 0.5, std(0x2a2f36, { rough: 0.5 }), cx + 3.5, 0.55, cz + 3)
  g.add(kvm)
  game.world.addCollider(cx + 3.1, cz + 2.6, cx + 3.9, cz + 3.4)
  game.interact.add({ id: 'srv-kvm', position: kvm.position.clone(), verb: 'Inspect KVM cart', mesh: kvm, onInteract: () => game.toast(D.toasts.serverRoom.kvm) })
  const fan = new THREE.Group()
  fan.add(box(0.06, 0.35, 0.06, std(0x555a60), 0, 0.18, 0))
  const fanHead = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 12), std(0x666c72, { metal: 0.4 }))
  fanHead.rotation.x = Math.PI / 2
  fanHead.position.y = 0.4
  fan.add(fanHead)
  fan.position.set(server6.group.position.x + 0.7, 0, cz - 2.2)
  g.add(fan)
  game.interact.add({ id: 'srv-fan', position: fan.position.clone().setY(0.4), verb: 'Inspect fan', mesh: fan, onInteract: () => game.toast(D.toasts.serverRoom.fan) })
  for (let i = 0; i < 6; i++) {
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 8), std([0x44cc88, 0xcc4488, 0x8844cc][i % 3], { metal: 0.6, rough: 0.3 }))
    can.position.set(cx + 3.3 + (i % 3) * 0.12, 1.16, cz + 2.85 + Math.floor(i / 3) * 0.12)
    g.add(can)
  }
  game.interact.add({ id: 'srv-cans', position: new THREE.Vector3(cx + 3.4, 1.1, cz + 2.9), verb: 'Inspect shrine', onInteract: () => game.toast(D.toasts.serverRoom.cans) })
  const tile = box(0.8, 0.05, 0.8, std(0x30353c), cx + 1.5, 0.1, cz + 4)
  tile.rotation.z = 0.15
  g.add(tile)
  game.interact.add({ id: 'srv-tile', position: tile.position.clone(), verb: 'Peer under floor', mesh: tile, onInteract: () => game.toast(D.toasts.serverRoom.floorTile) })
  const dnto = stickyNote3D('DO NOT\nTURN OFF')
  dnto.position.set(server6.group.position.x + 0.2, 1.9, cz - 2.72)
  g.add(dnto)

  // --- Puzzle: cables & ports --------------------------------------------------
  const plugged = new Set<string>(solved ? CABLES.map((c) => c.id) : [])
  let heldCable: string | null = null
  const cableMeshes = new Map<string, THREE.Group>()
  const portMeshes = new Map<string, THREE.Mesh>()
  // ports on server 6 front
  const portOrder = ['net', 'mystery', 'power', 'backup'] // shuffled vs cable hang order
  portOrder.forEach((pid, i) => {
    const def = CABLES.find((c) => c.id === pid)!
    const port = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.16, 0.05),
      new THREE.MeshStandardMaterial({
        map: makeLabelTexture(def.icon, { w: 64, h: 64, bg: '#10141a', fg: '#8899aa' }),
        emissive: 0x000000, emissiveIntensity: 0
      })
    )
    port.position.set(server6.group.position.x - 0.24 + i * 0.16, 0.85, cz - 2.7)
    g.add(port)
    portMeshes.set(pid, port)
    game.interact.add({
      id: `port-${pid}`,
      position: port.position.clone(),
      radius: 1.8,
      verb: `Plug into ${def.icon} port`,
      mesh: port,
      enabled: () => heldCable !== null && !plugged.has(pid),
      onInteract: () => tryPlug(pid)
    })
  })
  // hanging cables
  CABLES.forEach((def, i) => {
    if (plugged.has(def.id)) return
    const grp = new THREE.Group()
    const wire = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, -0.5, 0.05), new THREE.Vector3(0, -1.0, 0)
      ]), 8, 0.02, 6),
      std(def.color, { rough: 0.5 })
    )
    grp.add(wire)
    const plug = box(0.08, 0.14, 0.08, std(0x222831, { metal: 0.4, rough: 0.4 }), 0, -1.05, 0)
    grp.add(plug)
    const tag = stickyNote3D(def.label, 0.18)
    tag.position.set(0.12, -0.8, 0)
    grp.add(tag)
    grp.position.set(cx - 1.8 + i * 1.1, 2.6, cz - 1)
    g.add(grp)
    cableMeshes.set(def.id, grp)
    game.interact.add({
      id: `cable-${def.id}`,
      position: new THREE.Vector3(cx - 1.8 + i * 1.1, 1.6, cz - 1),
      radius: 1.8,
      verb: `Take ${def.label.split('\n')[0]} cable`,
      mesh: grp,
      enabled: () => !plugged.has(def.id) && heldCable !== def.id,
      onInteract: () => {
        if (heldCable) {
          const prev = cableMeshes.get(heldCable)
          if (prev) prev.visible = true
        }
        heldCable = def.id
        grp.visible = false
        game.hud.setHeldItem(`${def.label.split('\n')[0]} cable`)
        game.toast(D.ui.heldItem(`${def.label.split('\n')[0]} cable`))
        audio.sfx('uiClack')
      }
    })
  })

  let wrongCount = 0
  let marcus: Ghost | null = null
  function tryPlug(portId: string) {
    if (!heldCable) return
    const correct = heldCable === portId
    if (correct) {
      plugged.add(portId)
      const port = portMeshes.get(portId)!
      const m = port.material as THREE.MeshStandardMaterial
      m.emissive = new THREE.Color(0x33ff66)
      m.emissiveIntensity = 1.5
      const cable = cableMeshes.get(heldCable)
      if (cable) {
        cable.visible = true
        cable.position.set(port.position.x, port.position.y + 1.0, port.position.z + 0.05)
      }
      audio.sfx('badgeAccept')
      if (portId === 'mystery') {
        game.duck = 'vending'
        audio.sfx('vendingClunk')
        game.toast(D.toasts.misc.duckHint)
        if (marcus && !marcus.released) {
          game.say([{ speaker: 'marcus', name: 'MARCUS', text: D.marcus.mystery, anchor: marcus.rig.head }], { ghost: marcus })
        }
        game.saveNow()
      }
      heldCable = null
      game.hud.setHeldItem(null)
      if (plugged.size === CABLES.length) solve()
    } else {
      wrongCount++
      audio.sfx('spark')
      game.vfx.burst(portMeshes.get(portId)!.position, 20, 0xffaa44, { speed: 1.5, gravity: -3, life: 0.6 })
      game.camRig.doShake(0.004)
      if (marcus && !marcus.released) {
        marcus.rig.triggerStartle()
        const line = D.marcus.wrong[Math.min(wrongCount - 1, D.marcus.wrong.length - 1) % D.marcus.wrong.length]
        game.say([{ speaker: 'marcus', name: 'MARCUS', text: line, anchor: marcus.rig.head }], { ghost: marcus, frame: false })
      }
      // mercy rule: after 3 fails the matching port glows while cable held
    }
  }

  // --- Marcus -----------------------------------------------------------------
  if (!solved) {
    marcus = makeGhost('marcus')
    marcus.setPosition(cx + 1.5, 0, cz - 1.5, -Math.PI / 4)
    game.scene.add(marcus.group)
    game.ghosts.push(marcus)
  } else {
    leaveKeepsake()
  }

  function leaveKeepsake() {
    const pager = box(0.12, 0.04, 0.08, std(0x222831, { rough: 0.4 }), server6.group.position.x + 0.5, 0.06, cz - 2.2)
    const led = box(0.02, 0.015, 0.02, std(0x001100, { emissive: 0x33ff66, emissiveIntensity: 2 }), 0.03, 0.03, 0)
    pager.add(led)
    g.add(pager)
    game.interact.add({
      id: 'pager-keepsake',
      position: pager.position.clone().setY(0.3),
      verb: "Inspect Marcus's pager",
      mesh: pager,
      onInteract: () => game.toast(D.marcus.echo)
    })
  }

  let greetIdx = 0
  let taskGiven = game.flags.has('marcusTask')
  game.interact.add({
    id: 'marcus',
    position: new THREE.Vector3(cx + 1.5, 0, cz - 1.5),
    radius: 2.2,
    verb: 'Talk to Marcus',
    priority: 0.9,
    mesh: marcus?.rig.root,
    enabled: () => !!marcus && !marcus.released && !marcus.releasing,
    onInteract: () => {
      if (!marcus) return
      const anchor = marcus.rig.head
      if (!taskGiven) {
        taskGiven = true
        game.flags.add('marcusTask')
        game.say([
          { speaker: 'marcus', name: 'MARCUS', text: D.marcus.greet[0], anchor },
          { speaker: 'marcus', text: D.marcus.task[0], anchor },
          { speaker: 'marcus', text: D.marcus.task[1], anchor }
        ], {
          ghost: marcus, critical: true, onDone: () => {
            game.setObjective(D.ui.objectives.serverCables, D.ui.hints.server, [cx + 1.5, cz - 1.5])
            game.saveNow()
          }
        })
      } else {
        const line = D.marcus.greet[greetIdx % D.marcus.greet.length]
        greetIdx++
        game.say([{ speaker: 'marcus', name: 'MARCUS', text: line, anchor }], { ghost: marcus })
      }
    }
  })

  function solve() {
    game.flags.add('serverSolved')
    server6.leds.emissive = new THREE.Color(0x33ff66)
    strobe.intensity = 0
    audio.sfx('fanUp')
    audio.sfx('pagerBeep')
    if (!marcus) return
    const anchor = marcus.rig.head
    setTimeout(() => {
      game.say([
        { speaker: 'marcus', name: 'MARCUS', text: D.marcus.solve, anchor },
        { speaker: 'marcus', text: D.marcus.release[0], anchor },
        { speaker: 'marcus', text: D.marcus.release[1], anchor },
        { speaker: 'marcus', text: D.marcus.release[2], anchor }
      ], {
        ghost: marcus!, critical: true, onDone: () => {
          game.player.locked = true
          audio.sfx('ghostExhale')
          marcus!.release(() => {
            leaveKeepsake()
            game.collectFragment('uptime', marcus!.group.position)
          })
        }
      })
    }, 900)
  }

  // --- Fan-silence scare + passive hints ---------------------------------------
  let fansScareDone = game.flags.has('scareFans')
  let hintTimer = 0
  let hintStage = 0

  return {
    id: 'serverRoom',
    onEnter: () => {
      if (!fansScareDone) {
        fansScareDone = true
        game.flags.add('scareFans')
        if (!game.settings.spookFree) {
          audio.sfx('fanDown')
          setTimeout(() => { audio.sfx('fanUp'); game.scare('fans') }, 3000)
        }
      }
      if (!game.flags.has('serverSolved')) {
        game.setObjective(taskGiven ? D.ui.objectives.serverCables : D.ui.objectives.server, D.ui.hints.server, [cx + 1.5, cz - 1.5])
      }
    },
    update: (dt: number) => {
      if (!solvedFlag() && marcus && !marcus.released) {
        // strobe Server 6 at 2 Hz
        strobe.intensity = plugged.size === 4 ? 0 : (Math.sin(performance.now() / 250) > 0 ? 10 : 1)
        // pacing loop
        if (!marcus.talking && !marcus.releasing) {
          marcus.group.position.x = cx + 1.5 + Math.sin(performance.now() / 1800) * 0.75
        }
        // passive hints
        if (game.currentRoom === 'serverRoom' && taskGiven && !game.dialogue.active) {
          hintTimer += dt
          if (hintTimer > 60 && hintStage === 0) {
            hintStage = 1
            game.say([{ speaker: 'marcus', name: 'MARCUS', text: D.marcus.hints[0], anchor: marcus.rig.head }], { ghost: marcus, frame: false })
          } else if (hintTimer > 120 && hintStage === 1) {
            hintStage = 2
            game.say([{ speaker: 'marcus', name: 'MARCUS', text: D.marcus.hints[1], anchor: marcus.rig.head }], { ghost: marcus, frame: false })
          }
        }
        // port glow when matching cable held (hint 2 behaviour + mercy)
        for (const [pid, port] of portMeshes) {
          const m = port.material as THREE.MeshStandardMaterial
          if (plugged.has(pid)) continue
          if (heldCable === pid && (hintStage >= 2 || wrongCount >= 3)) {
            m.emissive = new THREE.Color(0x66ffaa)
            m.emissiveIntensity = 0.5 + Math.sin(performance.now() / 200) * 0.3
          } else if (heldCable && heldCable === pid) {
            m.emissive = new THREE.Color(0x334455)
            m.emissiveIntensity = 0.25
          } else {
            m.emissiveIntensity = 0
          }
        }
      }
    }
  }

  function solvedFlag() { return game.flags.has('serverSolved') }
}
