// MEETING ROOM — "Alignment": the Eternal Standup + Find the Final Agenda Item (spec §8.3).
import * as THREE from 'three'
import type { Game, RoomModule } from '../game/game.ts'
import { makeGhost, Ghost } from '../characters/ghosts.ts'
import { D } from '../data/dialogue.ts'
import { box, std, table, officeChair, whiteboard, mug, stickyNote3D } from './props.ts'
import { makeLabelTexture, makeScreenTexture } from '../engine/textures.ts'
import { audio } from '../engine/audio.ts'

export function buildMeetingRoom(game: Game): RoomModule {
  const g = new THREE.Group()
  game.scene.add(g)
  const solved = game.flags.has('meetingSolved')
  const cx = 7, cz = -33

  // Long table + 11 chairs
  const tbl = table(5.2, 1.6)
  tbl.position.set(cx, 0, cz)
  g.add(tbl)
  game.world.addCollider(cx - 2.6, cz - 0.8, cx + 2.6, cz + 0.8, 0.8)
  const chairs: THREE.Group[] = []
  for (let i = 0; i < 11; i++) {
    const ch = officeChair()
    const side = i < 5 ? -1 : i < 10 ? 1 : 0
    if (side === 0) { ch.position.set(cx - 3.2, 0, cz); ch.rotation.y = Math.PI / 2 }
    else {
      ch.position.set(cx - 2 + (i % 5) * 1.0, 0, cz + side * 1.35)
      ch.rotation.y = side === -1 ? 0 : Math.PI
    }
    g.add(ch)
    chairs.push(ch)
  }

  // Projector + screen
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.5),
    new THREE.MeshStandardMaterial({
      map: makeLabelTexture(solved ? 'ADJOURNED ☀' : 'Q3 SYNC\n(recurring)', { w: 384, h: 240, bg: '#dfe8f4', fg: '#3a5077' }),
      emissive: 0xe8f0ff, emissiveIntensity: 0.6,
      emissiveMap: makeLabelTexture(solved ? 'ADJOURNED ☀' : 'Q3 SYNC\n(recurring)', { w: 384, h: 240, bg: '#dfe8f4', fg: '#3a5077' })
    })
  )
  screen.position.set(cx + 5.3, 1.7, cz)
  screen.rotation.y = -Math.PI / 2
  g.add(screen)
  const projector = box(0.3, 0.12, 0.3, std(0x2a2f36, { rough: 0.4 }), cx, 2.7, cz)
  g.add(projector)
  const projLight = new THREE.SpotLight(0xe8f0ff, 14, 8, 0.4, 0.5)
  projLight.position.set(cx, 2.6, cz)
  const projTarget = new THREE.Object3D()
  projTarget.position.set(cx + 5.3, 1.7, cz)
  g.add(projTarget)
  projLight.target = projTarget
  g.add(projLight)

  // Whiteboard with agenda scribbles
  const wb = whiteboard('AGENDA:\n1-38: (see board 2)\nboard 2: (missing)', 1.9, 1.2)
  wb.position.set(cx - 2, 1.7, cz - 4.85)
  g.add(wb)

  // Ceiling panel light
  const panel = box(1.4, 0.05, 0.7, std(0xffffff, { emissive: 0xc9d6e8, emissiveIntensity: 1.1 }), cx, 2.95, cz)
  g.add(panel)
  const key = new THREE.PointLight(0xc9d6e8, 6, 9)
  key.position.set(cx, 2.5, cz)
  g.add(key)

  // Mugs, laptops, biscuit tin, clock, phone spider, TV, flipchart
  for (let i = 0; i < 10; i++) {
    const m = mug([0xffffff, 0xcc6655, 0x6688cc][i % 3])
    m.position.set(cx - 2.2 + (i % 5) * 1.0, 0.78, cz - 0.5 + Math.floor(i / 5) * 1.0)
    g.add(m)
  }
  game.interact.add({ id: 'mtg-mugs', position: new THREE.Vector3(cx, 0.8, cz), radius: 1.8, verb: 'Inspect mugs', onInteract: () => game.toast(D.toasts.meetingRoom.mugs) })
  for (let i = 0; i < 3; i++) {
    const lap = new THREE.Group()
    lap.add(box(0.3, 0.02, 0.2, std(0x2a2f36), 0, 0, 0))
    const lid = box(0.3, 0.2, 0.015, std(0x2a2f36), 0, 0.1, -0.1)
    lid.rotation.x = -0.4
    lap.add(lid)
    lap.position.set(cx - 1.5 + i * 1.6, 0.79, cz + 0.3)
    g.add(lap)
  }
  const tin = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 14), std(0xaa4444, { metal: 0.5, rough: 0.35 }))
  tin.position.set(cx + 2.2, 0.85, cz - 0.4)
  g.add(tin)
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.25, 18), std(0xf0ede4, { rough: 0.8 }))
  clock.position.set(cx, 2.4, cz - 4.88)
  g.add(clock)
  game.interact.add({ id: 'mtg-clock', position: new THREE.Vector3(cx, 1.9, cz - 4.4), verb: 'Check clock', mesh: clock, onInteract: () => game.toast(D.toasts.meetingRoom.clock) })
  const spider = new THREE.Group()
  spider.add(cyl(0.1, 0.04, std(0x333940), 0, 0.02, 0))
  for (let i = 0; i < 3; i++) {
    const leg = box(0.24, 0.02, 0.05, std(0x333940), 0, 0.01, 0)
    leg.rotation.y = (i / 3) * Math.PI * 2
    spider.add(leg)
  }
  spider.position.set(cx + 1, 0.79, cz)
  g.add(spider)
  const tv = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.85), std(0x0a1018, { emissive: 0x223344, emissiveIntensity: 0.5 }))
  tv.position.set(cx + 2, 1.9, cz + 4.85)
  tv.rotation.y = Math.PI
  g.add(tv)
  game.interact.add({ id: 'mtg-tv', position: new THREE.Vector3(cx + 2, 1.6, cz + 4.4), verb: 'Inspect TV', mesh: tv, onInteract: () => game.toast(D.toasts.meetingRoom.tv) })
  const flip = new THREE.Group()
  flip.add(box(0.7, 0.9, 0.02, std(0xf4f0e4, { rough: 0.9 }), 0, 1.4, 0))
  flip.add(box(0.04, 1.6, 0.04, std(0x8a7a5a), -0.3, 0.8, 0.05))
  flip.add(box(0.04, 1.6, 0.04, std(0x8a7a5a), 0.3, 0.8, 0.05))
  flip.position.set(cx + 4.5, 0, cz + 4.2)
  g.add(flip)
  game.interact.add({ id: 'mtg-flip', position: flip.position.clone().setY(1.2), verb: 'Read flipchart', mesh: flip, onInteract: () => game.toast(D.toasts.meetingRoom.parkingLot) })

  // --- Ghosts: Priya + 9 standup ghosts ---------------------------------------
  let priya: Ghost | null = null
  const standups: Ghost[] = []
  if (!solved) {
    priya = makeGhost('priya')
    priya.setPosition(cx - 3.2, 0, cz - 1.6, Math.PI * 0.35) // facing the table head
    game.scene.add(priya.group)
    game.ghosts.push(priya)
    for (let i = 0; i < 9; i++) {
      const s = new Ghost('standup')
      s.seated = true
      const side = i < 4 ? -1 : 1
      const idx = i < 4 ? i : i - 4
      // face the table: rig faces +z at rotation 0, so the north row (side -1) faces +z
      if (i === 8) s.setPosition(cx + 2.8, -0.28, cz, -Math.PI / 2)
      else s.setPosition(cx - 2 + idx * 1.0, -0.28, cz + side * 1.35, side === -1 ? 0 : Math.PI)
      // seated pose
      s.rig.upperLegL.rotation.x = -1.35
      s.rig.upperLegR.rotation.x = -1.35
      s.rig.lowerLegL.rotation.x = 1.3
      s.rig.lowerLegR.rotation.x = 1.3
      s.rig.spine.rotation.x = 0.15
      game.scene.add(s.group)
      game.ghosts.push(s)
      standups.push(s)
    }
  } else {
    leaveKeepsake()
  }

  function leaveKeepsake() {
    const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8), std(0x3355aa, { rough: 0.4 }))
    marker.rotation.z = Math.PI / 2
    marker.position.set(cx - 3.2, 0.82, cz - 1.6)
    g.add(marker)
    game.interact.add({
      id: 'marker-keepsake',
      position: marker.position.clone(),
      verb: "Inspect Priya's marker",
      mesh: marker,
      onInteract: () => game.toast(D.priya.echo)
    })
  }

  // --- Puzzle: 5 hidden notes ---------------------------------------------------
  // spots: under table, behind whiteboard, projector tray, taped to chair, biscuit tin (real)
  let haveNote = false
  const noteSpots: { id: string; pos: THREE.Vector3; verb: string; real: boolean; decoy: string }[] = [
    { id: 'note-table', pos: new THREE.Vector3(cx, 0.3, cz + 0.7), verb: 'Look under the table', real: false, decoy: D.priya.decoys[0] },
    { id: 'note-wb', pos: new THREE.Vector3(cx - 2.6, 1.2, cz - 4.5), verb: 'Check behind whiteboard', real: false, decoy: D.priya.decoys[1] },
    { id: 'note-proj', pos: new THREE.Vector3(cx, 1.9, cz), verb: 'Check projector tray', real: false, decoy: D.priya.decoys[2] },
    { id: 'note-chair', pos: new THREE.Vector3(cx - 2, 0.5, cz + 1.35), verb: 'Check under chair', real: false, decoy: D.priya.decoys[3] },
    { id: 'note-tin', pos: new THREE.Vector3(cx + 2.2, 0.9, cz - 0.4), verb: 'Open biscuit tin', real: true, decoy: '' }
  ]
  const found = new Set<string>()
  let hintStage = 0
  for (const spot of noteSpots) {
    game.interact.add({
      id: spot.id,
      position: spot.pos,
      radius: 1.8,
      verb: spot.verb,
      mesh: spot.id === 'note-tin' ? tin : undefined,
      enabled: () => !solvedFlag() && !found.has(spot.id) && !!priya && game.flags.has('priyaTask'),
      onInteract: () => {
        found.add(spot.id)
        audio.sfx('paperPeel')
        if (spot.real) {
          haveNote = true
          game.toast(D.toasts.meetingRoom.biscuitTin)
          game.hud.setHeldItem('The final agenda item')
          game.setObjective(D.ui.objectives.meetingSay, D.ui.hints.meeting, [cx - 3.2, cz - 1.6])
          setTimeout(() => {
            if (!game.dialogue.active) game.toast(`The note: "${D.priya.finalNote}"`)
          }, 1500)
        } else {
          game.toast(`A note: "${spot.decoy}"`)
        }
      }
    })
  }

  // --- Priya interaction ---------------------------------------------------------
  let taskGiven = game.flags.has('priyaTask')
  let greetIdx = 0
  game.interact.add({
    id: 'priya',
    position: new THREE.Vector3(cx - 3.2, 0, cz - 1.6),
    radius: 2.2,
    verb: 'Talk to Priya',
    priority: 0.9,
    mesh: priya?.rig.root,
    enabled: () => !!priya && !priya.released && !priya.releasing,
    onInteract: () => {
      if (!priya) return
      const anchor = priya.rig.head
      if (!taskGiven) {
        taskGiven = true
        game.flags.add('priyaTask')
        game.say([
          { speaker: 'priya', name: 'PRIYA', text: D.priya.greet[0], anchor },
          { speaker: 'priya', text: D.priya.task[0], anchor },
          { speaker: 'priya', text: D.priya.task[1], anchor }
        ], {
          ghost: priya, critical: true, onDone: () => {
            game.setObjective(D.ui.objectives.meetingNotes, D.ui.hints.meeting, [cx - 3.2, cz - 1.6])
            game.saveNow()
          }
        })
      } else if (haveNote) {
        game.say([
          { speaker: 'priya', name: 'PRIYA', text: D.priya.solvePrompt, anchor },
          {
            speaker: 'player', name: 'YOU', text: 'You clear your throat…',
            anchor: () => game.player.pos.clone().add(new THREE.Vector3(0, 2.0, 0)),
            choices: [
              { label: '"No blockers."', value: 'solve' },
              { label: '"Any other business?"', value: 'nope' }
            ]
          }
        ], {
          ghost: priya, critical: true,
          onChoice: (v) => { if (v === 'solve') solve(); else game.say([{ speaker: 'priya', name: 'PRIYA', text: 'NO. No other business. Read the note. Say the words.', anchor }], { ghost: priya! }) }
        })
      } else {
        const line = D.priya.greet[1 + (greetIdx % 2)]
        greetIdx++
        game.say([{ speaker: 'priya', name: 'PRIYA', text: line, anchor }], { ghost: priya })
      }
    }
  })

  function solve() {
    game.flags.add('meetingSolved')
    game.hud.setHeldItem(null)
    audio.sfx('cheer')
    // chairs push back, standups float off
    standups.forEach((s, i) => {
      setTimeout(() => s.release(() => { /* off to lunch */ }), 300 + i * 220)
    })
    chairs.forEach((c) => { c.position.z += (c.position.z > cz ? 0.4 : -0.4) })
    const sm = screen.material as THREE.MeshStandardMaterial
    const adjTex = makeLabelTexture('ADJOURNED ☀', { w: 384, h: 240, bg: '#f4ecd8', fg: '#7a5a2a' })
    sm.map = adjTex; sm.emissiveMap = adjTex; sm.needsUpdate = true
    if (!priya) return
    const anchor = priya.rig.head
    setTimeout(() => {
      game.say(
        [D.priya.solve, ...D.priya.release].map((text, i) => ({ speaker: 'priya', name: i === 0 ? 'PRIYA' : undefined, text, anchor })),
        {
          ghost: priya!, critical: true, onDone: () => {
            game.player.locked = true
            audio.sfx('ghostExhale')
            priya!.release(() => {
              leaveKeepsake()
              game.collectFragment('alignment', priya!.group.position)
            })
          }
        }
      )
    }, 1200)
  }

  // door-close scare (beat #3, gentle)
  let doorScareDone = game.flags.has('scareDoor')
  let hintTimer = 0

  const solvedFlag = () => game.flags.has('meetingSolved')

  return {
    id: 'meetingRoom',
    onEnter: () => {
      if (!doorScareDone) {
        doorScareDone = true
        game.flags.add('scareDoor')
        if (!game.settings.spookFree) {
          setTimeout(() => {
            audio.sfx('doorClunk')
            game.scare('door')
            key.intensity = 3.5
            setTimeout(() => { key.intensity = 6 }, 2000)
          }, 1200)
        }
      }
      if (!solvedFlag()) {
        game.setObjective(taskGiven ? (haveNote ? D.ui.objectives.meetingSay : D.ui.objectives.meetingNotes) : D.ui.objectives.meeting, D.ui.hints.meeting, [cx - 3.2, cz - 1.6])
      }
    },
    update: (dt: number) => {
      if (priya && !priya.released && !solvedFlag() && taskGiven && game.currentRoom === 'meetingRoom' && !game.dialogue.active && !haveNote) {
        hintTimer += dt
        if (hintTimer > 60 && hintStage === 0) {
          hintStage = 1
          game.say([{ speaker: 'priya', name: 'PRIYA', text: D.priya.hints[0], anchor: priya.rig.head }], { ghost: priya, frame: false })
        } else if (hintTimer > 120 && hintStage === 1) {
          hintStage = 2
          game.say([{ speaker: 'priya', name: 'PRIYA', text: D.priya.hints[1], anchor: priya.rig.head }], { ghost: priya, frame: false })
          // glint the tin
          const tm = tin.material as THREE.MeshStandardMaterial
          tm.emissive = new THREE.Color(0xffd080)
          tm.emissiveIntensity = 0.6
        }
      }
      if (hintStage >= 2 && !solvedFlag()) {
        const tm = tin.material as THREE.MeshStandardMaterial
        tm.emissiveIntensity = 0.4 + Math.sin(performance.now() / 300) * 0.3
      }
    }
  }
}

function cyl(r: number, h: number, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), mat)
  m.position.set(x, y, z)
  return m
}
