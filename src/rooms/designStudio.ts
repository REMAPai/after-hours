// DESIGN STUDIO — "Taste": Kit + Canonise the Logo (spec §8.6).
import * as THREE from 'three'
import type { Game, RoomModule } from '../game/game.ts'
import { makeGhost, type Ghost } from '../characters/ghosts.ts'
import { D } from '../data/dialogue.ts'
import { box, std, desk, monitor, plant, frame } from './props.ts'
import { makeScreenTexture, drawRemapLogo, logoTexture } from '../engine/textures.ts'
import { audio } from '../engine/audio.ts'

export function buildDesignStudio(game: Game): RoomModule {
  const g = new THREE.Group()
  game.scene.add(g)
  const solved = game.flags.has('designSolved')
  const cx = 7, cz = -21

  // Desks with monitors + tablets, warm anglepoise lights
  for (let i = 0; i < 3; i++) {
    const d = desk(1.5, 0.8)
    d.position.set(cx - 3 + i * 2.2, 0, cz + 3.4)
    g.add(d)
    game.world.addCollider(d.position.x - 0.75, d.position.z - 0.4, d.position.x + 0.75, d.position.z + 0.4, 0.8)
    const mon = monitor((c, w, h) => {
      c.fillStyle = '#1e2128'; c.fillRect(0, 0, w, h)
      drawRemapLogo(c, w / 2, h / 2, 60, ['#FF7A59', '#59a0ff', '#a0ff59'][i])
    })
    mon.position.copy(d.position).add(new THREE.Vector3(0, 0.78, 0))
    mon.rotation.y = Math.PI
    g.add(mon)
    const spot = new THREE.SpotLight(0xffc87a, 8, 6, 0.8, 0.7)
    spot.position.set(d.position.x, 2.2, d.position.z - 1)
    const st = new THREE.Object3D()
    st.position.set(d.position.x, 0.8, d.position.z)
    g.add(st)
    spot.target = st
    g.add(spot)
  }

  // Corkboards covered in ~24 near-miss logo variants
  const variantJokes = ['comic sans', 'upside down', 'six greens', 'literal map', 'bevel-emboss', 'clip art']
  for (let i = 0; i < 24; i++) {
    const tex = makeScreenTexture((c, w, h) => {
      c.fillStyle = '#f0ece0'
      c.fillRect(0, 0, w, h)
      c.save()
      if (i % 7 === 3) { c.translate(w / 2, h / 2); c.rotate(Math.PI); c.translate(-w / 2, -h / 2) }
      const hue = (i * 47) % 360
      drawRemapLogo(c, w / 2, h / 2 - 4, 36, `hsl(${hue}, ${40 + (i % 4) * 15}%, ${35 + (i % 3) * 15}%)`)
      c.restore()
      c.fillStyle = '#666'
      c.font = i % 5 === 0 ? 'italic 9px "Comic Sans MS", cursive' : '9px Arial'
      c.textAlign = 'center'
      c.fillText(i % 6 === 2 ? 're (map)' : 'REMAP', w / 2, h - 6)
    }, 64, 80)
    const v = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.4), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }))
    v.position.set(cx - 4 + (i % 8) * 1.1, 1.4 + Math.floor(i / 8) * 0.55, cz + 4.87)
    v.rotation.y = Math.PI
    v.rotation.z = (Math.random() - 0.5) * 0.12
    g.add(v)
  }
  game.interact.add({
    id: 'variants-wall',
    position: new THREE.Vector3(cx, 1.6, cz + 4.4),
    radius: 2.4,
    verb: 'Study the wall of attempts',
    onInteract: () => game.toast(`Twenty-four near-misses. One is ${variantJokes[Math.floor(Math.random() * variantJokes.length)]}. All of them are lessons.`)
  })

  // Pottery shelf, swatch wall, mannequin, light-box, living plant, pencil jars
  const potShelf = box(1.6, 0.05, 0.35, std(0x8a7a5a), cx - 4.8, 1.3, cz - 2)
  g.add(potShelf)
  for (let i = 0; i < 4; i++) {
    const pot = new THREE.Mesh(new THREE.LatheGeometry([
      new THREE.Vector2(0.05, 0), new THREE.Vector2(0.08, 0.06), new THREE.Vector2(0.05 + (i % 2) * 0.03, 0.14)
    ], 10), std([0xc08a6a, 0x8ac0a0, 0x6a8ac0, 0xc0c08a][i], { rough: 0.8 }))
    pot.position.set(cx - 5.4 + i * 0.4, 1.33, cz - 2)
    g.add(pot)
  }
  game.interact.add({ id: 'ds-pottery', position: new THREE.Vector3(cx - 4.6, 1.3, cz - 2), verb: 'Inspect pottery', mesh: potShelf, onInteract: () => game.toast(D.toasts.designStudio.pottery) })
  const swatches = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshStandardMaterial({
    map: makeScreenTexture((c, w, h) => {
      for (let i = 0; i < 24; i++) {
        c.fillStyle = `hsl(${(i * 31) % 360}, 55%, ${40 + (i % 3) * 15}%)`
        c.fillRect((i % 6) * (w / 6) + 2, Math.floor(i / 6) * (h / 4) + 2, w / 6 - 4, h / 4 - 4)
      }
    }, 192, 128)
  }))
  swatches.position.set(cx + 5.37, 1.6, cz - 1)
  swatches.rotation.y = -Math.PI / 2
  g.add(swatches)
  game.interact.add({ id: 'ds-swatches', position: new THREE.Vector3(cx + 4.9, 1.5, cz - 1), verb: 'Inspect swatches', mesh: swatches, onInteract: () => game.toast(D.toasts.designStudio.swatches) })
  const mann = new THREE.Group()
  mann.add(box(0.34, 0.5, 0.2, std(0xe86b4a, { rough: 0.8 }), 0, 1.2, 0))
  mann.add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), std(0xd8d4c8, { rough: 0.6 })))
  mann.children[1].position.y = 1.62
  mann.add(box(0.08, 0.9, 0.08, std(0x8a8478), 0, 0.45, 0))
  mann.position.set(cx + 4.5, 0, cz + 3.8)
  g.add(mann)
  game.interact.add({ id: 'ds-mann', position: mann.position.clone().setY(1.2), verb: 'Inspect mannequin', mesh: mann, onInteract: () => game.toast(D.toasts.designStudio.mannequin) })
  const lightbox = box(0.9, 0.08, 0.6, std(0xffffff, { emissive: 0xfff4e0, emissiveIntensity: 1.2 }), cx - 3, 0.78, cz - 3.4)
  const lbDesk = desk(1.1, 0.7)
  lbDesk.position.set(cx - 3, 0, cz - 3.4)
  g.add(lbDesk, lightbox)
  game.world.addCollider(cx - 3.55, cz - 3.75, cx - 2.45, cz - 3.05, 0.85)
  game.interact.add({ id: 'ds-lightbox', position: lightbox.position.clone(), verb: 'Inspect light-box', mesh: lightbox, onInteract: () => game.toast(D.toasts.designStudio.lightbox) })
  const alivePlant = plant(false)
  alivePlant.position.set(cx + 4.8, 0, cz - 4.3)
  g.add(alivePlant)
  game.interact.add({ id: 'ds-plant', position: alivePlant.position.clone().setY(0.4), verb: 'Admire the plant', mesh: alivePlant, onInteract: () => game.toast(D.toasts.designStudio.plant) })

  // --- Puzzle: 6 framed candidates ------------------------------------------------
  const wrongTexts: ((c: CanvasRenderingContext2D, w: number, h: number) => void)[] = [
    (c, w, h) => { c.fillStyle = '#f0ece0'; c.fillRect(0, 0, w, h); c.fillStyle = '#3a8a3a'; c.font = 'italic bold 22px "Comic Sans MS", cursive'; c.textAlign = 'center'; c.fillText('ReMaP', w / 2, h / 2 + 8) },
    (c, w, h) => { c.fillStyle = '#f0ece0'; c.fillRect(0, 0, w, h); c.save(); c.translate(w / 2, h / 2); c.rotate(Math.PI); drawRemapLogo(c, 0, 0, 60, '#FF7A59'); c.restore() },
    (c, w, h) => { c.fillStyle = '#f0ece0'; c.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) { c.fillStyle = `hsl(${100 + i * 10}, 60%, ${30 + i * 8}%)`; c.fillRect(10, 10 + i * (h - 20) / 6, w - 20, (h - 20) / 6) } },
    (c, w, h) => { c.fillStyle = '#e8f0d8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8a9a7a'; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(Math.random() * w, Math.random() * h); c.lineTo(Math.random() * w, Math.random() * h); c.stroke() } c.fillStyle = '#333'; c.font = 'bold 18px Arial'; c.fillText('re', 20, 30) },
    (c, w, h) => { c.fillStyle = '#f0ece0'; c.fillRect(0, 0, w, h); c.fillStyle = '#888'; c.font = 'bold 26px Arial'; c.textAlign = 'center'; c.shadowColor = '#000'; c.shadowOffsetX = 4; c.shadowOffsetY = 4; c.fillText('REMAP', w / 2, h / 2 + 8); c.shadowColor = 'transparent' }
  ]
  const critiqued = new Set<number>()
  let hintStage = 0
  const frames: THREE.Group[] = []
  const order = [0, 1, 5, 2, 3, 4] // real one (5) sits third on the wall
  order.forEach((which, slot) => {
    const isReal = which === 5
    const tex = isReal
      ? logoTexture('#FF7A59', true)
      : makeScreenTexture(wrongTexts[which], 128, 128)
    const f = frame(tex, 0.55, 0.55)
    f.position.set(cx - 3.2 + slot * 1.3, 1.7, cz - 4.82)
    g.add(f)
    frames.push(f)
    game.interact.add({
      id: `logo-frame-${slot}`,
      position: f.position.clone(),
      radius: 1.9,
      verb: isReal ? 'Consider this one' : 'Inspect candidate',
      mesh: f,
      enabled: () => !solvedGetter() && (!hintDimmed() || isReal),
      onInteract: () => {
        if (!game.flags.has('kitTask')) {
          game.toast('Six framed candidates. Kit should weigh in first.')
          return
        }
        if (!kit || kit.released) return
        const anchor = kit.rig.head
        if (isReal) {
          game.say([
            {
              speaker: 'kit', name: 'KIT', text: D.kit.choosePrompt, anchor,
              choices: [
                { label: '"This one. It was always this one."', value: 'yes' },
                { label: 'Keep looking', value: 'no' }
              ]
            }
          ], { ghost: kit, onChoice: (v) => { if (v === 'yes') solve() } })
        } else {
          const idx = which
          critiqued.add(idx)
          game.say([{ speaker: 'kit', name: 'KIT', text: D.kit.critiques[idx], anchor }], { ghost: kit, frame: false })
        }
      }
    })
  })
  const hintDimmed = () => hintStage >= 2
  const dimWrongFrames = () => {
    order.forEach((which, slot) => {
      if (which === 5) return
      frames[slot].traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial
        if (m && m.color) { m.color.multiplyScalar(0.4) }
      })
    })
  }

  // --- Kit --------------------------------------------------------------------------
  let kit: Ghost | null = null
  if (!solved) {
    kit = makeGhost('kit')
    kit.setPosition(cx - 1, 0, cz - 3, Math.PI)
    game.scene.add(kit.group)
    game.ghosts.push(kit)
  } else {
    leaveKeepsake()
    canoniseEverywhere()
  }

  function leaveKeepsake() {
    const f = frame(logoTexture('#FF7A59', true), 0.4, 0.4)
    f.position.set(cx - 1, 0.2, cz - 3)
    f.rotation.x = -0.3
    g.add(f)
    game.interact.add({
      id: 'frame-keepsake',
      position: f.position.clone().setY(0.5),
      verb: "Inspect Kit's frame",
      mesh: f,
      onInteract: () => game.toast(D.kit.echo)
    })
  }

  function canoniseEverywhere() {
    game.flags.add('logoCanon')
  }

  let taskGiven = game.flags.has('kitTask')
  let greetIdx = 0
  game.interact.add({
    id: 'kit',
    position: new THREE.Vector3(cx - 1, 0, cz - 3),
    radius: 2.2,
    verb: 'Talk to Kit',
    priority: 0.9,
    mesh: kit?.rig.root,
    enabled: () => !!kit && !kit.released && !kit.releasing,
    onInteract: () => {
      if (!kit) return
      const anchor = kit.rig.head
      if (!taskGiven) {
        taskGiven = true
        game.flags.add('kitTask')
        game.say([
          { speaker: 'kit', name: 'KIT', text: D.kit.greet[1], anchor },
          { speaker: 'kit', text: D.kit.task[0], anchor },
          { speaker: 'kit', text: D.kit.task[1], anchor }
        ], {
          ghost: kit, critical: true, onDone: () => {
            game.setObjective(D.ui.objectives.designChoose, D.ui.hints.design, [cx - 1, cz - 4.5])
            game.saveNow()
          }
        })
      } else {
        const line = D.kit.greet[greetIdx % D.kit.greet.length]
        greetIdx++
        game.say([{ speaker: 'kit', name: 'KIT', text: line, anchor }], { ghost: kit })
      }
    }
  })

  function solve() {
    game.flags.add('designSolved')
    canoniseEverywhere()
    audio.sfx('calcDing')
    if (!kit) return
    const anchor = kit.rig.head
    game.say([
      { speaker: 'kit', name: 'KIT', text: D.kit.solve, anchor },
      { speaker: 'kit', text: D.kit.release[0], anchor },
      { speaker: 'kit', text: D.kit.release[1], anchor },
      { speaker: 'kit', text: D.kit.release[2], anchor }
    ], {
      ghost: kit, critical: true, onDone: () => {
        game.player.locked = true
        audio.sfx('ghostExhale')
        kit!.release(() => {
          leaveKeepsake()
          game.collectFragment('taste', kit!.group.position)
        })
      }
    })
  }

  let hintTimer = 0
  const solvedGetter = () => game.flags.has('designSolved')

  return {
    id: 'designStudio',
    onEnter: () => {
      if (!solvedGetter()) {
        game.setObjective(taskGiven ? D.ui.objectives.designChoose : D.ui.objectives.design, D.ui.hints.design, [cx - 1, cz - 3])
      }
    },
    update: (dt: number) => {
      if (kit && !kit.released && !solvedGetter() && taskGiven && game.currentRoom === 'designStudio' && !game.dialogue.active) {
        hintTimer += dt
        if (hintTimer > 60 && hintStage === 0) {
          hintStage = 1
          game.say([{ speaker: 'kit', name: 'KIT', text: D.kit.hints[0], anchor: kit.rig.head }], { ghost: kit, frame: false })
        } else if (hintTimer > 120 && hintStage === 1) {
          hintStage = 2
          dimWrongFrames()
          game.say([{ speaker: 'kit', name: 'KIT', text: D.kit.hints[1], anchor: kit.rig.head }], { ghost: kit, frame: false })
        }
      }
    }
  }
}
