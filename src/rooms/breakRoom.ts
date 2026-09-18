// BREAK ROOM — "Care": Irfan + Label the Sandwich + the vending machine duck (spec §8.5, §11).
import * as THREE from 'three'
import type { Game, RoomModule } from '../game/game.ts'
import { makeGhost, type Ghost } from '../characters/ghosts.ts'
import { D } from '../data/dialogue.ts'
import { box, std, fridge, vendingMachine, table, officeChair, mug, plant } from './props.ts'
import { makeLabelTexture } from '../engine/textures.ts'
import { makeDuck } from '../characters/playerChar.ts'
import { audio } from '../engine/audio.ts'

export function buildBreakRoom(game: Game): RoomModule {
  const g = new THREE.Group()
  game.scene.add(g)
  const solved = game.flags.has('breakSolved')
  const cx = -7, cz = -9

  // Kitchenette along back wall
  const counter = box(4, 0.9, 0.6, std(0x6a6e74, { rough: 0.5 }), cx - 2, 0.45, cz - 4.4)
  g.add(counter)
  game.world.addCollider(cx - 4, cz - 4.7, cx, cz - 4.1, 0.95)
  const sink = box(0.6, 0.08, 0.4, std(0x9aa0a8, { metal: 0.7, rough: 0.25 }), cx - 3, 0.91, cz - 4.4)
  g.add(sink)
  for (let i = 0; i < 3; i++) {
    const m = mug([0xffffff, 0xcc6655, 0x88aa66][i])
    m.position.set(cx - 3.2 + i * 0.15, 0.95, cz - 4.3)
    g.add(m)
  }
  const kettle = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.7), std(0xd8dde2, { metal: 0.6, rough: 0.3 }))
  kettle.position.set(cx - 2.2, 1.0, cz - 4.4)
  g.add(kettle)
  game.interact.add({ id: 'brk-kettle', position: kettle.position.clone(), verb: 'Inspect kettle', mesh: kettle, onInteract: () => game.toast(D.toasts.breakRoom.kettle) })
  const micro = box(0.5, 0.3, 0.4, std(0x2a2f36, { rough: 0.4 }), cx - 1.4, 1.05, cz - 4.4)
  const microDisp = box(0.12, 0.06, 0.02, std(0x001100, { emissive: 0x33ff66, emissiveIntensity: 1.5 }), 0.14, 0.02, 0.2)
  micro.add(microDisp)
  g.add(micro)
  game.interact.add({ id: 'brk-micro', position: micro.position.clone(), verb: 'Check microwave', mesh: micro, onInteract: () => game.toast(D.toasts.breakRoom.microwave) })
  const coffee = box(0.35, 0.5, 0.35, std(0x3a3026, { rough: 0.5 }), cx - 0.6, 1.15, cz - 4.4)
  g.add(coffee)
  game.interact.add({ id: 'brk-coffee', position: coffee.position.clone(), verb: 'Try coffee machine', mesh: coffee, onInteract: () => game.toast(D.toasts.breakRoom.coffee) })

  // Banner "HAPPY BIRTHD"
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.4), new THREE.MeshStandardMaterial({
    map: makeLabelTexture('HAPPY BIRTHD', { w: 384, h: 64, bg: '#d84a6a', fg: '#ffe8a0' })
  }))
  banner.position.set(cx - 1, 2.5, cz - 4.85)
  banner.rotation.z = -0.04
  g.add(banner)
  game.interact.add({ id: 'brk-banner', position: new THREE.Vector3(cx - 1, 1.9, cz - 4.4), verb: 'Read banner', mesh: banner, onInteract: () => game.toast(D.toasts.breakRoom.banner) })

  // Tables & chairs & cake box
  for (let t = 0; t < 2; t++) {
    const tb = table(1.2, 1.2, 0.75)
    tb.position.set(cx - 2.5 + t * 3, 0, cz + 2)
    g.add(tb)
    game.world.addCollider(tb.position.x - 0.6, tb.position.z - 0.6, tb.position.x + 0.6, tb.position.z + 0.6, 0.8)
    for (let c = 0; c < 3; c++) {
      const ch = officeChair(0x5a5044)
      const a = (c / 3) * Math.PI * 2
      ch.position.set(tb.position.x + Math.sin(a) * 0.9, 0, tb.position.z + Math.cos(a) * 0.9)
      ch.rotation.y = a + Math.PI
      g.add(ch)
    }
  }
  const cakeBox = box(0.35, 0.15, 0.35, std(0xf0e8dc, { rough: 0.9 }), cx + 0.5, 0.85, cz + 2)
  g.add(cakeBox)
  game.interact.add({ id: 'brk-cake', position: cakeBox.position.clone(), verb: 'Open cake box', mesh: cakeBox, onInteract: () => game.toast(D.toasts.breakRoom.cakeBox) })

  // --- Fridge -------------------------------------------------------------------
  const fr = fridge()
  fr.group.position.set(cx + 3.8, 0, cz - 3.8)
  fr.group.rotation.y = -Math.PI / 2
  g.add(fr.group)
  game.world.addCollider(cx + 3.3, cz - 4.3, cx + 4.3, cz - 3.3, 1.8)
  let fridgeOpen = false
  // sandwich inside
  const sandwich = new THREE.Group()
  sandwich.add(box(0.16, 0.03, 0.16, std(0xe8d8a0, { rough: 0.9 }), 0, 0, 0))
  sandwich.add(box(0.15, 0.02, 0.15, std(0xc8b060, { rough: 0.9 }), 0, 0.025, 0))
  sandwich.add(box(0.16, 0.03, 0.16, std(0xe8d8a0, { rough: 0.9 }), 0, 0.05, 0))
  sandwich.position.set(0, 0.9, 0.15)
  fr.group.add(sandwich)
  const q2 = box(0.14, 0.1, 0.14, std(0x5a3a8a, { emissive: 0x8a5aff, emissiveIntensity: 0.6 }), -0.2, 1.2, 0.1)
  fr.group.add(q2)
  const olive = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), std(0x6a7a2a, { rough: 0.4 }))
  olive.position.set(0.2, 1.21, 0.1)
  fr.group.add(olive)
  const fridgePlant = plant(false)
  fridgePlant.scale.setScalar(0.4)
  fridgePlant.position.set(0.15, 0.42, 0.1)
  fr.group.add(fridgePlant)

  game.interact.add({
    id: 'fridge',
    position: new THREE.Vector3(cx + 3.3, 1, cz - 3.8),
    radius: 1.8,
    verb: 'Open fridge',
    mesh: fr.group,
    enabled: () => !fridgeOpen,
    onInteract: () => {
      fridgeOpen = true
      fr.door.rotation.y = -1.8
      fr.innerLight.intensity = 5
      audio.sfx('doorSlide')
      game.toast(D.toasts.misc.fridgeItems)
    }
  })
  game.interact.add({
    id: 'fridge-q2', position: new THREE.Vector3(cx + 3.4, 1.2, cz - 3.9), radius: 1.5,
    verb: 'Inspect glowing tupperware', mesh: q2,
    enabled: () => fridgeOpen,
    onInteract: () => game.toast(D.toasts.breakRoom.q2)
  })
  game.interact.add({
    id: 'fridge-olive', position: new THREE.Vector3(cx + 3.4, 1.2, cz - 3.6), radius: 1.5,
    verb: 'Inspect the olive', mesh: olive,
    enabled: () => fridgeOpen,
    onInteract: () => game.toast(D.toasts.breakRoom.olive)
  })
  let haveSandwich = false
  game.interact.add({
    id: 'sandwich', position: new THREE.Vector3(cx + 3.5, 0.95, cz - 3.8), radius: 1.6,
    verb: 'Take the sandwich', mesh: sandwich,
    enabled: () => fridgeOpen && !haveSandwich && !solvedGetter(),
    onInteract: () => {
      haveSandwich = true
      sandwich.visible = false
      game.hud.setHeldItem('The Sandwich (2014)')
      game.toast(D.ui.heldItem('one unlabelled sandwich, radiating grievance'))
      if (game.flags.has('garyTask')) game.setObjective(D.ui.objectives.sandwich, D.ui.hints.breakRoom, [cx - 2, cz - 4.4])
    }
  })

  // --- Vending machine (duck dispenser) -------------------------------------------
  const vm = vendingMachine()
  vm.position.set(cx + 3.8, 0, cz + 3.5)
  vm.rotation.y = -Math.PI / 2
  g.add(vm)
  game.world.addCollider(cx + 3.3, cz + 3.0, cx + 4.3, cz + 4.0, 1.9)
  const duckInVM = makeDuck()
  duckInVM.position.set(0, 0.45, 0.2)
  duckInVM.visible = game.duck === 'vending' || game.duck === 'none'
  vm.add(duckInVM)
  game.interact.add({
    id: 'vending',
    position: new THREE.Vector3(cx + 3.2, 1, cz + 3.5),
    radius: 1.8,
    verb: game.duck === 'vending' ? 'Collect the duck' : 'Inspect vending machine',
    mesh: vm,
    onInteract: () => {
      if (game.duck === 'vending') {
        game.duck = 'held'
        duckInVM.visible = false
        game.player.char.giveDuck()
        audio.sfx('vendingClunk')
        game.toast(D.toasts.misc.duckGet)
        const it = game.interact.get('vending')
        if (it) it.verb = 'Inspect vending machine'
        game.saveNow()
      } else if (game.duck === 'none') {
        game.toast(D.toasts.misc.duckHint)
      } else {
        game.toast(D.toasts.lobby.vending)
      }
    }
  })

  // --- Irfan + label puzzle ---------------------------------------------------------
  let gary: Ghost | null = null
  if (!solved) {
    gary = makeGhost('gary')
    gary.setPosition(cx + 2.6, 0, cz - 3.2, -Math.PI / 2.5)
    game.scene.add(gary.group)
    game.ghosts.push(gary)
  } else {
    leaveKeepsake()
    sandwich.visible = true
  }

  function leaveKeepsake() {
    const lm = box(0.2, 0.08, 0.12, std(0x3a5a8a, { rough: 0.5 }), cx - 2.5, 0.94, cz - 4.35)
    g.add(lm)
    game.interact.add({
      id: 'labelmaker-keepsake',
      position: lm.position.clone(),
      verb: 'Inspect label maker',
      mesh: lm,
      onInteract: () => game.toast(D.gary.echo)
    })
  }

  // label maker on counter
  const labelMaker = box(0.2, 0.08, 0.12, std(0x3a5a8a, { rough: 0.5 }), cx - 2.5, 0.94, cz - 4.35)
  if (!solved) g.add(labelMaker)
  let wrongTries = 0
  game.interact.add({
    id: 'labelmaker',
    position: new THREE.Vector3(cx - 2.5, 0.94, cz - 4.2),
    radius: 1.8,
    verb: 'Label sandwich',
    mesh: labelMaker,
    enabled: () => !solvedGetter() && haveSandwich && game.flags.has('garyTask'),
    onInteract: () => labelChoice()
  })

  function labelChoice() {
    const playerAnchor = () => game.player.pos.clone().add(new THREE.Vector3(0, 2.0, 0))
    const dimmed = wrongTries >= 2 // mercy rule
    const firstChoices = [
      ...(dimmed ? [] : [{ label: '"SANDWICH"', value: 'w1' }, { label: '"IRFAN\'S"', value: 'w2' }]),
      { label: 'More label ideas…', value: 'more' }
    ]
    game.say([
      { speaker: 'player', name: 'YOU', text: 'The label maker hums, ready. What do you print?', anchor: playerAnchor, choices: firstChoices }
    ], {
      onChoice: (v) => {
        if (v === 'more') {
          game.say([
            {
              speaker: 'player', name: 'YOU', text: 'Bigger. Bolder. Something… binding.', anchor: playerAnchor,
              choices: [
                { label: '"IRFAN\'S. YES, THIS IRFAN. THE GHOST. HE KNOWS."', value: 'win' },
                ...(dimmed ? [] : [{ label: '"FREE FOOD"', value: 'w3' }])
              ]
            }
          ], { onChoice: (v2) => handleLabel(v2) })
        } else {
          handleLabel(v)
        }
      }
    })
  }

  function handleLabel(v: string) {
    game.sandwichAttempts++
    if (!gary) return
    const anchor = gary.rig.head
    if (v === 'win') {
      solve()
    } else {
      wrongTries++
      audio.sfx('badgeDeny')
      const rejIdx = v === 'w1' ? 0 : v === 'w2' ? 1 : 2
      game.say([{ speaker: 'gary', name: 'IRFAN', text: D.gary.rejections[rejIdx], anchor }], { ghost: gary })
      game.saveNow()
    }
  }

  let taskGiven = game.flags.has('garyTask')
  let greetIdx = 0
  game.interact.add({
    id: 'gary',
    position: new THREE.Vector3(cx + 2.6, 0, cz - 3.2),
    radius: 2.2,
    verb: 'Talk to Irfan',
    priority: 0.9,
    mesh: gary?.rig.root,
    enabled: () => !!gary && !gary.released && !gary.releasing,
    onInteract: () => {
      if (!gary) return
      const anchor = gary.rig.head
      if (!taskGiven) {
        taskGiven = true
        game.flags.add('garyTask')
        game.say([
          { speaker: 'gary', name: 'IRFAN', text: D.gary.greet[2], anchor },
          { speaker: 'gary', text: D.gary.task[0], anchor },
          { speaker: 'gary', text: D.gary.task[1], anchor }
        ], {
          ghost: gary, critical: true, onDone: () => {
            game.setObjective(D.ui.objectives.sandwich, D.ui.hints.breakRoom, [cx + 3.8, cz - 3.8])
            game.saveNow()
          }
        })
      } else {
        const line = D.gary.greet[greetIdx % 2]
        greetIdx++
        game.say([{ speaker: 'gary', name: 'IRFAN', text: line, anchor }], { ghost: gary })
      }
    }
  })

  function solve() {
    game.flags.add('breakSolved')
    game.hud.setHeldItem(null)
    haveSandwich = false
    sandwich.visible = true
    // labelled monument
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.06), new THREE.MeshStandardMaterial({
      map: makeLabelTexture("IRFAN'S.", { w: 128, h: 48, bg: '#ffffff', fg: '#222' })
    }))
    label.position.set(0, 0.04, 0.09)
    sandwich.add(label)
    if (!gary) return
    const anchor = gary.rig.head
    game.say([
      { speaker: 'gary', name: 'IRFAN', text: D.gary.solve, anchor },
      { speaker: 'gary', text: D.gary.release[0], anchor },
      { speaker: 'gary', text: D.gary.release[1], anchor },
      { speaker: 'gary', text: D.gary.release[2], anchor }
    ], {
      ghost: gary, critical: true, onDone: () => {
        game.player.locked = true
        audio.sfx('ghostExhale')
        gary!.release(() => {
          g.remove(labelMaker)
          leaveKeepsake()
          game.collectFragment('care', gary!.group.position)
        })
      }
    })
  }

  let hintTimer = 0
  let hintStage = 0
  const solvedGetter = () => game.flags.has('breakSolved')

  return {
    id: 'breakRoom',
    onEnter: () => {
      if (!solvedGetter()) {
        game.setObjective(taskGiven ? D.ui.objectives.sandwich : D.ui.objectives.breakRoom, D.ui.hints.breakRoom, [cx + 2.6, cz - 3.2])
      }
    },
    update: (dt: number) => {
      if (gary && !gary.released && !solvedGetter() && taskGiven && game.currentRoom === 'breakRoom' && !game.dialogue.active) {
        hintTimer += dt
        if (hintTimer > 60 && hintStage === 0) {
          hintStage = 1
          game.say([{ speaker: 'gary', name: 'IRFAN', text: D.gary.hints[0], anchor: gary.rig.head }], { ghost: gary, frame: false })
        } else if (hintTimer > 120 && hintStage === 1) {
          hintStage = 2
          game.say([{ speaker: 'gary', name: 'IRFAN', text: D.gary.hints[1], anchor: gary.rig.head }], { ghost: gary, frame: false })
        }
      }
    }
  }
}
