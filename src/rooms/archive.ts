// ARCHIVE — "Memory": Hira + Read One Page Aloud (spec §8.4). The emotional pivot.
import * as THREE from 'three'
import type { Game, RoomModule } from '../game/game.ts'
import { makeGhost, type Ghost } from '../characters/ghosts.ts'
import { D } from '../data/dialogue.ts'
import { box, std, shelfUnit, binderRow, desk } from './props.ts'
import { makeLabelTexture } from '../engine/textures.ts'
import { audio } from '../engine/audio.ts'

export function buildArchive(game: Game): RoomModule {
  const g = new THREE.Group()
  game.scene.add(g)
  const solved = game.flags.has('archiveSolved')
  const cx = -7, cz = -21

  // Tall shelves with instanced binders
  const binderColors = [0x6a5a4a, 0x4a5a6a, 0x5a4a5a, 0x4a6a5a, 0x6a6a4a]
  for (let i = 0; i < 4; i++) {
    const shelf = shelfUnit(2.2, 2.6, 0.4, 5)
    shelf.position.set(cx - 3.5 + i * 2.3, 0, cz - 3.8)
    g.add(shelf)
    game.world.addCollider(shelf.position.x - 1.1, shelf.position.z - 0.25, shelf.position.x + 1.1, shelf.position.z + 0.25)
    for (let level = 0; level < 4; level++) {
      const row = binderRow(2.0, (level / 5) * 2.6 + 0.5, binderColors)
      row.position.set(shelf.position.x, 0, shelf.position.z)
      g.add(row)
    }
  }
  for (let i = 0; i < 4; i++) {
    const shelf = shelfUnit(2.2, 2.6, 0.4, 5)
    shelf.position.set(cx - 3.5 + i * 2.3, 0, cz + 3.8)
    g.add(shelf)
    game.world.addCollider(shelf.position.x - 1.1, shelf.position.z - 0.25, shelf.position.x + 1.1, shelf.position.z + 0.25)
    for (let level = 0; level < 4; level++) {
      const row = binderRow(2.0, (level / 5) * 2.6 + 0.5, binderColors)
      row.position.set(shelf.position.x, 0, shelf.position.z)
      g.add(row)
    }
  }

  // Desk with the warm lamp — THE warm island
  const dsk = desk(1.6, 0.8)
  dsk.position.set(cx + 3.5, 0, cz)
  g.add(dsk)
  game.world.addCollider(cx + 2.7, cz - 0.4, cx + 4.3, cz + 0.4, 0.8)
  const lampArm = new THREE.Group()
  lampArm.add(box(0.04, 0.4, 0.04, std(0x3a5a3a, { metal: 0.4, rough: 0.4 }), 0, 0.2, 0))
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.14, 12, 1, true), std(0x3a5a3a, { metal: 0.4, rough: 0.4 }))
  shade.position.set(0.1, 0.42, 0)
  shade.rotation.z = 0.6
  lampArm.add(shade)
  lampArm.position.set(cx + 4, 0.78, cz - 0.25)
  g.add(lampArm)
  const lampLight = new THREE.SpotLight(0xffd9a0, 12, 5, 0.7, 0.6)
  lampLight.position.set(cx + 4, 1.25, cz - 0.2)
  const lampTarget = new THREE.Object3D()
  lampTarget.position.set(cx + 3.5, 0.8, cz)
  g.add(lampTarget)
  lampLight.target = lampTarget
  g.add(lampLight)
  // open binder under the lamp
  const openBinder = box(0.45, 0.03, 0.32, std(0xf0ead8, { rough: 0.95 }), cx + 3.5, 0.79, cz)
  g.add(openBinder)

  // rolling ladder, card index, typewriter, cross-stitch
  const ladder = new THREE.Group()
  for (let i = 0; i < 5; i++) ladder.add(box(0.35, 0.03, 0.04, std(0x8a7a5a), 0, 0.3 + i * 0.45, 0))
  ladder.add(box(0.04, 2.3, 0.04, std(0x8a7a5a), -0.18, 1.15, 0))
  ladder.add(box(0.04, 2.3, 0.04, std(0x8a7a5a), 0.18, 1.15, 0))
  ladder.rotation.z = -0.15
  ladder.position.set(cx - 1, 0, cz - 3.3)
  g.add(ladder)
  game.interact.add({ id: 'arc-ladder', position: ladder.position.clone().setY(1), verb: 'Inspect ladder', mesh: ladder, onInteract: () => game.toast(D.toasts.archive.ladder) })
  const cardIndex = box(0.6, 1.2, 0.5, std(0x5a4a3a, { rough: 0.7 }), cx - 4.6, 0.6, cz)
  g.add(cardIndex)
  game.world.addCollider(cx - 4.9, cz - 0.25, cx - 4.3, cz + 0.25)
  game.interact.add({ id: 'arc-cards', position: cardIndex.position.clone(), verb: 'Open a drawer', mesh: cardIndex, onInteract: () => game.toast(D.toasts.archive.cardIndex) })
  const typewriter = box(0.35, 0.15, 0.3, std(0x2a3038, { metal: 0.4, rough: 0.4 }), cx + 2.9, 0.85, cz + 0.25)
  g.add(typewriter)
  game.interact.add({ id: 'arc-type', position: typewriter.position.clone(), verb: 'Inspect typewriter', mesh: typewriter, onInteract: () => game.toast(D.toasts.archive.typewriter) })
  const stitch = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), new THREE.MeshStandardMaterial({
    map: makeLabelTexture('DOCS ARE\n♥ LOVE ♥', { w: 128, h: 96, bg: '#f4ecd8', fg: '#a05060', hand: true })
  }))
  stitch.position.set(cx + 5.4, 1.6, cz)
  stitch.rotation.y = -Math.PI / 2
  g.add(stitch)
  game.interact.add({ id: 'arc-stitch', position: new THREE.Vector3(cx + 5, 1.5, cz), verb: 'Read cross-stitch', mesh: stitch, onInteract: () => game.toast(D.toasts.archive.crossStitch) })
  game.interact.add({ id: 'arc-dust', position: new THREE.Vector3(cx, 1, cz), radius: 1.4, verb: 'Watch the dust', onInteract: () => game.toast(D.toasts.archive.dust) })

  // --- Puzzle: 6 decoy binders + the masterwork --------------------------------
  const decoySpines = [
    'Meeting Minutes 2011\n(unminuted)',
    'Q3 Plans v1-v9\n(abandoned)',
    'EXPENSES: DO NOT\nAUDIT',
    'Onboarding Guide v13\n(cursed)',
    'FINAL final v12\n(not final)',
    'Fire Drill Logs\n(one entry: "fine")'
  ]
  let haveBinder = game.flags.has('haveBinder') && !solved
  let hintStage = 0
  const decoyMeshes: THREE.Mesh[] = []
  decoySpines.forEach((spine, i) => {
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.34, 0.3),
      new THREE.MeshStandardMaterial({ color: binderColors[i % binderColors.length], roughness: 0.85 })
    )
    const sx = cx - 3.5 + (i % 4) * 2.3
    const sz = i < 4 ? cz - 3.75 : cz + 3.75
    b.position.set(sx - 0.6 + (i % 3) * 0.5, 1.75, sz)
    g.add(b)
    decoyMeshes.push(b)
    game.interact.add({
      id: `binder-decoy-${i}`,
      position: b.position.clone(),
      verb: 'Read spine',
      mesh: b,
      enabled: () => !solvedGetter() && hintStage < 2,
      onInteract: () => {
        game.toast(`Spine: "${spine.replace('\n', ' ')}"`)
        if (game.flags.has('inesTask')) game.toast(D.ines.wrongBinder)
      }
    })
  })
  // the masterwork
  const masterwork = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.36, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x8cc5bc, roughness: 0.7, emissive: 0x8cc5bc, emissiveIntensity: 0 })
  )
  masterwork.position.set(cx - 1.2 + 0.5, 2.15, cz + 3.75)
  masterwork.visible = !haveBinder && !solved
  g.add(masterwork)
  game.interact.add({
    id: 'masterwork',
    position: masterwork.position.clone(),
    verb: 'Read spine',
    mesh: masterwork,
    enabled: () => !solvedGetter() && !haveBinder,
    onInteract: () => {
      if (!game.flags.has('inesTask')) {
        game.toast('Spine: "THE ONBOARDING GUIDE, v14 FINAL final(2)". Someone cared about this one.')
        return
      }
      haveBinder = true
      game.flags.add('haveBinder')
      masterwork.visible = false
      game.hud.setHeldItem('THE ONBOARDING GUIDE v14')
      audio.sfx('paperPeel')
      if (ines && !ines.released) {
        game.say([{ speaker: 'ines', name: 'HIRA', text: D.ines.foundPrompt, anchor: ines.rig.head }], { ghost: ines, frame: false })
      }
      game.setObjective(D.ui.objectives.archiveRead, D.ui.hints.archive, [cx + 3.5, cz])
      game.saveNow()
    }
  })

  // Desk: read the page
  game.interact.add({
    id: 'archive-desk',
    position: new THREE.Vector3(cx + 3.5, 0.8, cz),
    radius: 1.8,
    verb: 'Read page one aloud',
    mesh: openBinder,
    enabled: () => haveBinder && !solvedGetter(),
    onInteract: () => readAloud()
  })

  // --- Hira ---------------------------------------------------------------------
  let ines: Ghost | null = null
  if (!solved) {
    ines = makeGhost('ines')
    ines.setPosition(cx + 3.1, -0.04, cz + 0.7, Math.PI * 0.9) // perched on the desk edge (top 0.79)
    ines.seated = true
    ines.rig.spine.rotation.x = 0.12
    game.scene.add(ines.group)
    game.ghosts.push(ines)
  } else {
    leaveKeepsake()
  }

  function leaveKeepsake() {
    const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.14, 8), std(0x2a4a5a, { metal: 0.6, rough: 0.3 }))
    pen.rotation.z = Math.PI / 2.3
    pen.position.set(cx + 3.7, 0.82, cz + 0.1)
    g.add(pen)
    game.interact.add({
      id: 'pen-keepsake',
      position: pen.position.clone().setY(0.9),
      verb: 'Inspect the desk',
      mesh: pen,
      onInteract: () => game.toast(D.ines.echo)
    })
  }

  let taskGiven = game.flags.has('inesTask')
  let greetIdx = 0
  game.interact.add({
    id: 'ines',
    position: new THREE.Vector3(cx + 3.1, 0, cz + 0.7),
    radius: 2.2,
    verb: 'Talk to Hira',
    priority: 0.9,
    mesh: ines?.rig.root,
    enabled: () => !!ines && !ines.released && !ines.releasing,
    onInteract: () => {
      if (!ines) return
      const anchor = ines.rig.head
      if (!taskGiven) {
        taskGiven = true
        game.flags.add('inesTask')
        game.say([
          { speaker: 'ines', name: 'HIRA', text: D.ines.greet[0], anchor },
          { speaker: 'ines', text: D.ines.greet[1], anchor },
          { speaker: 'ines', text: D.ines.task[0], anchor },
          { speaker: 'ines', text: D.ines.task[1], anchor }
        ], {
          ghost: ines, critical: true, onDone: () => {
            game.setObjective(D.ui.objectives.archiveBinder, D.ui.hints.archive, [cx - 1, cz + 3.5])
            game.saveNow()
          }
        })
      } else {
        const line = D.ines.greet[2 - (greetIdx % 2)]
        greetIdx++
        game.say([{ speaker: 'ines', name: 'HIRA', text: line, anchor }], { ghost: ines })
      }
    }
  })

  function readAloud() {
    if (!ines) return
    game.hud.setHeldItem(null)
    const playerAnchor = () => game.player.pos.clone().add(new THREE.Vector3(0, 2.0, 0))
    // The sincere reading — zero jokes (spec §26)
    game.say(
      D.ines.reading.map((text, i) => ({
        speaker: 'player', name: i === 0 ? 'YOU (reading)' : undefined, text, anchor: playerAnchor
      })),
      {
        critical: true, onDone: () => {
          const anchor = ines!.rig.head
          game.say([
            { speaker: 'ines', name: 'HIRA', text: D.ines.solve, anchor },
            { speaker: 'ines', text: D.ines.release[0], anchor },
            { speaker: 'ines', text: D.ines.release[1], anchor },
            { speaker: 'ines', text: D.ines.release[2], anchor }
          ], {
            ghost: ines!, critical: true, onDone: () => {
              game.flags.add('archiveSolved')
              game.pen = true
              game.hud.neatHandwriting = true
              game.toast(D.toasts.misc.penGet)
              game.player.locked = true
              audio.sfx('ghostExhale')
              ines!.release(() => {
                leaveKeepsake()
                game.collectFragment('memory', ines!.group.position)
              })
            }
          })
        }
      }
    )
  }

  let hintTimer = 0
  const solvedGetter = () => game.flags.has('archiveSolved')

  return {
    id: 'archive',
    onEnter: () => {
      if (!solvedGetter()) {
        game.setObjective(taskGiven ? (haveBinder ? D.ui.objectives.archiveRead : D.ui.objectives.archiveBinder) : D.ui.objectives.archive, D.ui.hints.archive, [cx + 3.1, cz + 0.7])
      }
    },
    update: (dt: number) => {
      if (ines && !ines.released && !solvedGetter() && taskGiven && !haveBinder && game.currentRoom === 'archive' && !game.dialogue.active) {
        hintTimer += dt
        if (hintTimer > 60 && hintStage === 0) {
          hintStage = 1
          game.say([{ speaker: 'ines', name: 'HIRA', text: D.ines.hints[0], anchor: ines.rig.head }], { ghost: ines, frame: false })
        } else if (hintTimer > 120 && hintStage === 1) {
          hintStage = 2 // decoys stop being interactable (enabled predicates read hintStage)
          game.say([{ speaker: 'ines', name: 'HIRA', text: D.ines.hints[1], anchor: ines.rig.head }], { ghost: ines, frame: false })
        }
      }
      if (!solvedGetter() && !haveBinder && (hintStage >= 1 || game.hintsUsed > 0)) {
        const m = masterwork.material as THREE.MeshStandardMaterial
        m.emissiveIntensity = 0.3 + Math.sin(performance.now() / 350) * 0.2
      }
    }
  }
}
