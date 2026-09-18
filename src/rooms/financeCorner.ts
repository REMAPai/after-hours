// FINANCE CORNER — "Balance": Beatriz + Reconcile the Duck (spec §8.7).
import * as THREE from 'three'
import type { Game, RoomModule } from '../game/game.ts'
import { makeGhost, type Ghost } from '../characters/ghosts.ts'
import { D } from '../data/dialogue.ts'
import { box, std, desk, officeChair, paperStack } from './props.ts'
import { makeScreenTexture, makeLabelTexture } from '../engine/textures.ts'
import { audio } from '../engine/audio.ts'

export function buildFinanceCorner(game: Game): RoomModule {
  const g = new THREE.Group()
  game.scene.add(g)
  const solved = game.flags.has('financeSolved')
  const cx = 7, cz = -9

  // Cubicle island: 3 cubicles
  const cubMat = std(0x8a8e96, { rough: 0.9 })
  for (let i = 0; i < 3; i++) {
    const d = desk(1.4, 0.7)
    d.position.set(cx - 2 + i * 2, 0, cz)
    g.add(d)
    game.world.addCollider(d.position.x - 0.7, d.position.z - 0.35, d.position.x + 0.7, d.position.z + 0.35, 0.8)
    const divider = box(1.5, 1.3, 0.05, cubMat, d.position.x, 0.65, d.position.z - 0.5)
    g.add(divider)
    game.world.addCollider(d.position.x - 0.75, d.position.z - 0.55, d.position.x + 0.75, d.position.z - 0.45, 1.3)
    const ch = officeChair()
    ch.position.set(d.position.x, 0, d.position.z + 0.8)
    g.add(ch)
    // ten-key calculator
    const calc = box(0.14, 0.04, 0.2, std(0xd8d4c8, { rough: 0.6 }), d.position.x + 0.3, 0.79, d.position.z)
    g.add(calc)
    // desk lamp
    const lampL = new THREE.PointLight(0xffe0b0, 3, 4)
    lampL.position.set(d.position.x - 0.4, 1.1, d.position.z)
    g.add(lampL)
  }
  game.interact.add({ id: 'fin-tenkey', position: new THREE.Vector3(cx + 0.3, 0.8, cz), verb: 'Inspect calculator', onInteract: () => game.toast(D.toasts.financeCorner.tenkey) })

  // Paper mountains
  for (let i = 0; i < 3; i++) {
    const stack = paperStack(5 + i)
    stack.position.set(cx - 3.5 + i * 0.7, 0, cz + 3.4)
    stack.scale.setScalar(1.4)
    g.add(stack)
  }
  game.world.addCollider(cx - 4, cz + 3, cx - 1.8, cz + 3.9, 0.6)
  game.interact.add({ id: 'fin-paper', position: new THREE.Vector3(cx - 2.8, 0.5, cz + 3.4), verb: 'Inspect paper strata', onInteract: () => game.toast(D.toasts.financeCorner.paper) })

  // Filing cabinets + shredder + cert
  for (let i = 0; i < 3; i++) {
    const cab = box(0.5, 1.3, 0.6, std(0x6a7078, { metal: 0.4, rough: 0.5 }), cx + 4.6, 0.65, cz - 3 + i * 0.8)
    g.add(cab)
  }
  game.world.addCollider(cx + 4.3, cz - 3.4, cx + 4.9, cz - 0.8, 1.3)
  const shredder = box(0.4, 0.6, 0.3, std(0x3a3f46, { rough: 0.5 }), cx + 4.5, 0.3, cz + 2)
  g.add(shredder)
  game.interact.add({ id: 'fin-shredder', position: shredder.position.clone().setY(0.5), verb: 'Inspect shredder', mesh: shredder, onInteract: () => game.toast(D.toasts.financeCorner.shredder) })
  const cert = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), new THREE.MeshStandardMaterial({
    map: makeLabelTexture('AUDIT\nREADY ✓', { w: 128, h: 96, bg: '#f4f0e0', fg: '#3a5a8a' })
  }))
  cert.position.set(cx + 5.37, 1.7, cz + 1)
  cert.rotation.y = -Math.PI / 2
  cert.rotation.z = 0.06
  g.add(cert)
  game.interact.add({ id: 'fin-cert', position: new THREE.Vector3(cx + 4.9, 1.6, cz + 1), verb: 'Read certificate', mesh: cert, onInteract: () => game.toast(D.toasts.financeCorner.cert) })

  // Duck outline on Beatriz's desk
  const duckOutline = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.2), new THREE.MeshStandardMaterial({
    map: makeScreenTexture((c, w, h) => {
      c.clearRect(0, 0, w, h)
      c.strokeStyle = '#c8b880'
      c.setLineDash([4, 3])
      c.lineWidth = 2
      c.beginPath()
      c.ellipse(w / 2, h * 0.6, w * 0.32, h * 0.24, 0, 0, Math.PI * 2)
      c.stroke()
      c.beginPath()
      c.ellipse(w * 0.62, h * 0.32, w * 0.14, h * 0.14, 0, 0, Math.PI * 2)
      c.stroke()
    }, 96, 80),
    transparent: true
  }))
  duckOutline.rotation.x = -Math.PI / 2
  duckOutline.position.set(cx, 0.775, cz + 0.1)
  g.add(duckOutline)
  game.interact.add({ id: 'fin-outline', position: new THREE.Vector3(cx, 0.9, cz), verb: 'Inspect outline', mesh: duckOutline, enabled: () => !solvedGetter(), onInteract: () => game.toast(D.toasts.financeCorner.duckOutline) })

  // Projected spreadsheet, off by £4.99
  const makeSheet = (balanced: boolean) => makeScreenTexture((c, w, h) => {
    c.fillStyle = '#f4f8ff'; c.fillRect(0, 0, w, h)
    c.strokeStyle = '#b8c4d8'; c.lineWidth = 1
    for (let r = 0; r < 8; r++) { c.beginPath(); c.moveTo(0, r * h / 8); c.lineTo(w, r * h / 8); c.stroke() }
    for (let col = 0; col < 5; col++) { c.beginPath(); c.moveTo(col * w / 5, 0); c.lineTo(col * w / 5, h); c.stroke() }
    c.fillStyle = '#334'; c.font = '11px Arial'
    for (let r = 1; r < 7; r++) {
      for (let col = 0; col < 4; col++) {
        c.fillText(balanced ? '0.00' : `${((r * col * 137) % 900 / 100).toFixed(2)}`, col * w / 5 + 8, r * h / 8 + 16)
      }
    }
    c.font = 'bold 13px Arial'
    if (balanced) {
      c.fillStyle = '#2a7a3a'
      c.fillText('DIFFERENCE: £0.00 ✓', w * 0.55, h - 10)
      c.fillText('🦆', w * 0.9, h - 10)
    } else {
      c.fillStyle = '#c02020'
      c.fillText('DIFFERENCE: £4.99', w * 0.55, h - 10)
    }
  }, 320, 200)
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.6),
    new THREE.MeshStandardMaterial({
      map: makeSheet(solved), emissive: 0xf4f8ff, emissiveIntensity: 0.55,
      emissiveMap: makeSheet(solved)
    })
  )
  sheet.position.set(cx + 2, 1.7, cz - 4.85)
  g.add(sheet)

  // --- Beatriz -----------------------------------------------------------------
  let beatriz: Ghost | null = null
  if (!solved) {
    beatriz = makeGhost('beatriz')
    beatriz.setPosition(cx, -0.37, cz + 0.72, Math.PI) // in her chair, facing the desk
    beatriz.seated = true
    game.scene.add(beatriz.group)
    game.ghosts.push(beatriz)
  } else {
    leaveKeepsake()
  }

  function leaveKeepsake() {
    const calc = box(0.16, 0.05, 0.22, std(0xd8d4c8, { rough: 0.5 }), cx, 0.81, cz + 0.15)
    g.add(calc)
    game.interact.add({
      id: 'calc-keepsake',
      position: calc.position.clone().setY(1),
      verb: "Inspect Beatriz's calculator",
      mesh: calc,
      onInteract: () => game.toast(D.beatriz.echo)
    })
  }

  let taskGiven = game.flags.has('beatrizTask')
  let greetIdx = 0
  game.interact.add({
    id: 'beatriz',
    position: new THREE.Vector3(cx, 0, cz),
    radius: 2.2,
    verb: game.duck === 'held' ? 'Present the duck' : 'Talk to Beatriz',
    priority: 0.9,
    mesh: beatriz?.rig.root,
    enabled: () => !!beatriz && !beatriz.released && !beatriz.releasing,
    onInteract: () => {
      if (!beatriz) return
      const anchor = beatriz.rig.head
      const it = game.interact.get('beatriz')
      if (game.duck === 'held') {
        if (it) it.verb = 'Present the duck'
        game.say([
          { speaker: 'beatriz', name: 'BEATRIZ', text: D.beatriz.taskDuck[0], anchor },
          { speaker: 'beatriz', text: D.beatriz.scan, anchor }
        ], { ghost: beatriz, critical: true, onDone: () => solve() })
        return
      }
      if (!taskGiven) {
        taskGiven = true
        game.flags.add('beatrizTask')
        game.say([
          { speaker: 'beatriz', name: 'BEATRIZ', text: D.beatriz.greet[0], anchor },
          { speaker: 'beatriz', text: D.beatriz.greet[1], anchor },
          { speaker: 'beatriz', text: D.beatriz.taskNoDuck[0], anchor },
          { speaker: 'beatriz', text: D.beatriz.taskNoDuck[1], anchor }
        ], {
          ghost: beatriz, critical: true, onDone: () => {
            routeToDuck()
            game.saveNow()
          }
        })
      } else {
        const line = greetIdx % 2 === 0 ? D.beatriz.hints[game.duck === 'none' ? 0 : 1] : D.beatriz.greet[2]
        greetIdx++
        game.say([{ speaker: 'beatriz', name: 'BEATRIZ', text: line, anchor }], { ghost: beatriz })
      }
    }
  })

  // Soft-lock proof routing (spec §17): solve Finance before the duck → routed correctly
  function routeToDuck() {
    if (game.duck === 'held') {
      game.setObjective(D.ui.objectives.duckPresent, D.ui.hints.finance, [cx, cz])
    } else if (game.duck === 'vending') {
      game.setObjective(D.ui.objectives.duckRoute, D.ui.hints.finance, [-3.2, -5.5]) // break room vending machine
    } else {
      game.setObjective(D.ui.objectives.duckRoute, D.ui.hints.finance, [-7, -33])
    }
  }

  function solve() {
    game.flags.add('financeSolved')
    game.duck = 'reconciled'
    game.player.char.duckGlow()
    audio.sfx('calcDing')
    // receipt materialises
    game.toast('Receipt: "1× RUBBER DUCK — MORALE (ESSENTIAL) — £4.99"')
    const balancedTex = makeSheet(true)
    const sm = sheet.material as THREE.MeshStandardMaterial
    sm.map = balancedTex
    sm.emissiveMap = balancedTex
    sm.needsUpdate = true
    if (!beatriz) return
    const anchor = beatriz.rig.head
    setTimeout(() => {
      game.say([
        { speaker: 'beatriz', name: 'BEATRIZ', text: D.beatriz.solve, anchor },
        { speaker: 'beatriz', text: D.beatriz.release[0], anchor },
        { speaker: 'beatriz', text: D.beatriz.release[1], anchor },
        { speaker: 'beatriz', text: D.beatriz.release[2], anchor }
      ], {
        ghost: beatriz!, critical: true, onDone: () => {
          game.player.locked = true
          audio.sfx('ghostExhale')
          beatriz!.release(() => {
            leaveKeepsake()
            game.collectFragment('balance', beatriz!.group.position)
          })
        }
      })
    }, 1200)
  }

  let hintTimer = 0
  let hintStage = 0
  const solvedGetter = () => game.flags.has('financeSolved')

  return {
    id: 'financeCorner',
    onEnter: () => {
      const it = game.interact.get('beatriz')
      if (it) it.verb = game.duck === 'held' ? 'Present the duck' : 'Talk to Beatriz'
      if (!solvedGetter()) {
        if (taskGiven) routeToDuck()
        else game.setObjective(D.ui.objectives.finance, D.ui.hints.finance, [cx, cz])
      }
    },
    update: (dt: number) => {
      const it = game.interact.get('beatriz')
      if (it && beatriz && !beatriz.released) it.verb = game.duck === 'held' ? 'Present the duck' : 'Talk to Beatriz'
      if (!solvedGetter()) {
        // £4.99 cell pulses faintly red — emissive pulse on the sheet
        const sm = sheet.material as THREE.MeshStandardMaterial
        sm.emissiveIntensity = 0.5 + Math.sin(performance.now() / 400) * 0.12
      }
      if (beatriz && !beatriz.released && !solvedGetter() && taskGiven && game.currentRoom === 'financeCorner' && !game.dialogue.active) {
        hintTimer += dt
        if (hintTimer > 60 && hintStage === 0) {
          hintStage = 1
          game.say([{ speaker: 'beatriz', name: 'BEATRIZ', text: D.beatriz.hints[game.duck === 'none' ? 0 : 1], anchor: beatriz.rig.head }], { ghost: beatriz, frame: false })
        }
      }
    }
  }
}
