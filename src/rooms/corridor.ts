// MAIN CORRIDOR — the spooky spine: dressing, scares, stairwell (spec §5.2).
import * as THREE from 'three'
import type { Game, RoomModule } from '../game/game.ts'
import { D } from '../data/dialogue.ts'
import { box, std, poster, plant, officeChair, stickyNote3D } from './props.ts'
import { makeLabelTexture } from '../engine/textures.ts'
import { audio } from '../engine/audio.ts'

export function buildCorridor(game: Game): RoomModule {
  const g = new THREE.Group()
  game.scene.add(g)

  // Posters that get less motivational deeper in — swapped nicer when warm
  const posterDefs: [string, string, number][] = [
    ['TEAMWORK', 'WE MADE THIS\nTOGETHER', -6],
    ['SYNERGY?', 'GO HOME\nON TIME', -16],
    ['STAY.', 'COME BACK\nTOMORROW\n(as a choice)', -26],
    ['HANG IN\nTHERE', 'THANK YOU', -34]
  ]
  const posterMeshes: { mesh: THREE.Mesh; cold: string; warm: string; swapped: boolean }[] = []
  posterDefs.forEach(([cold, warm, z], i) => {
    const p = poster(cold)
    const side = i % 2 === 0 ? -1 : 1
    p.position.set(side * 1.4, 1.8, z)
    p.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2
    g.add(p)
    posterMeshes.push({ mesh: p, cold, warm, swapped: false })
    game.interact.add({
      id: `poster-${i}`,
      position: p.position.clone(),
      verb: 'Read poster',
      mesh: p,
      onInteract: () => game.toast([D.toasts.corridor.poster1, D.toasts.corridor.poster2, D.toasts.corridor.poster3, 'Poster: "HANG IN THERE." The cat has long since let go.'][i])
    })
  })

  // Photocopier (scare #1)
  const copier = new THREE.Group()
  copier.add(box(0.9, 0.9, 0.7, std(0xb8bcc2, { rough: 0.5 }), 0, 0.45, 0))
  copier.add(box(0.7, 0.06, 0.5, std(0x8a8e94, { rough: 0.4 }), 0, 0.93, 0))
  const copierScreen = box(0.2, 0.04, 0.14, std(0x081008, { emissive: 0x30ff60, emissiveIntensity: 0 }), 0.25, 0.93, 0.15)
  copier.add(copierScreen)
  copier.position.set(1.05, 0, -13)
  g.add(copier)
  game.world.addCollider(0.6, -13.4, 1.5, -12.6, 1)
  let copierPage: THREE.Mesh | null = null
  game.interact.add({
    id: 'copier',
    position: new THREE.Vector3(1.05, 0.9, -13),
    verb: 'Inspect photocopier',
    mesh: copier,
    onInteract: () => game.toast(D.toasts.corridor.copier)
  })

  // Wet floor sign
  const sign = new THREE.Group()
  const signMat = new THREE.MeshStandardMaterial({ map: makeLabelTexture('WET\nFLOOR\n👻', { w: 96, h: 128, bg: '#f7d020', fg: '#5a4a10' }) })
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.42), signMat)
  panel.position.y = 0.35
  panel.rotation.x = -0.2
  sign.add(panel)
  const panel2 = panel.clone(); panel2.rotation.x = 0.2; panel2.rotation.y = Math.PI; sign.add(panel2)
  sign.position.set(-0.9, 0, -18.5)
  g.add(sign)
  game.interact.add({ id: 'wetfloor', position: sign.position.clone().setY(0.4), verb: 'Inspect sign', mesh: sign, onInteract: () => game.toast(D.toasts.corridor.wetFloor) })

  // Dead plant with note
  const dp = plant(true)
  dp.position.set(1.2, 0, -30.5)
  g.add(dp)
  const note = stickyNote3D('please\nwater me')
  note.position.set(1.15, 0.5, -30.2)
  note.rotation.y = -0.6
  g.add(note)
  game.interact.add({ id: 'corridor-plant', position: dp.position.clone().setY(0.4), verb: 'Inspect plant', mesh: dp, onInteract: () => game.toast(D.toasts.corridor.plant) })

  // Fire extinguisher, bins, radiator, ceiling tile w/ cable
  const ext = box(0.12, 0.4, 0.12, std(0xb02020, { rough: 0.4 }), -1.35, 1.1, -24)
  g.add(ext)
  game.interact.add({ id: 'extinguisher', position: ext.position.clone(), verb: 'Inspect', mesh: ext, onInteract: () => game.toast(D.toasts.corridor.extinguisher) })
  for (let i = 0; i < 3; i++) {
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.45, 10), std([0x3a6a4a, 0x3a4a6a, 0x6a6a3a][i], { rough: 0.6 }))
    bin.position.set(1.25, 0.22, -36 - i * 0.45)
    g.add(bin)
  }
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 6), std(0x222222))
  cable.position.set(0.4, 2.6, -22.5)
  cable.rotation.z = 0.15
  g.add(cable)
  game.interact.add({ id: 'ceiling-tile', position: new THREE.Vector3(0.4, 1.8, -22.5), verb: 'Look up', onInteract: () => game.toast(D.toasts.corridor.ceiling) })

  // Notice board with 12 notes
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), std(0x6a4a2a, { rough: 0.9 }))
  board.position.set(-1.4, 1.7, -11)
  board.rotation.y = Math.PI / 2
  g.add(board)
  for (let i = 0; i < 12; i++) {
    const n = stickyNote3D('', 0.16)
    ;(n.material as THREE.MeshStandardMaterial).color = new THREE.Color().setHSL(0.1 + (i % 4) * 0.15, 0.5, 0.75)
    n.position.set(-1.38, 1.45 + Math.floor(i / 4) * 0.28, -11.5 + (i % 4) * 0.33)
    n.rotation.y = Math.PI / 2
    n.rotation.z = (Math.random() - 0.5) * 0.3
    g.add(n)
  }
  let noteIdx = 0
  game.interact.add({
    id: 'noticeboard',
    position: new THREE.Vector3(-1.3, 1.6, -11),
    verb: 'Read notices',
    mesh: board,
    onInteract: () => {
      game.toast(D.toasts.noticeboard[noteIdx % D.toasts.noticeboard.length])
      noteIdx++
    }
  })

  // Fire map (matches the minimap — a joke)
  const fireMap = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), std(0xf0ece0, { rough: 0.9 }))
  fireMap.position.set(1.4, 1.7, -6)
  fireMap.rotation.y = -Math.PI / 2
  g.add(fireMap)
  game.interact.add({ id: 'firemap', position: fireMap.position.clone(), verb: 'Check map', mesh: fireMap, onInteract: () => game.toast(D.toasts.corridor.fireMap) })

  // Rolling chair (scare 1b)
  const chair = officeChair(0x2e3238)
  chair.position.set(-0.8, 0, -27)
  chair.rotation.y = 2
  g.add(chair)
  let chairRolled = game.flags.has('chairRolled')
  let chairVel = 0
  game.interact.add({ id: 'lone-chair', position: chair.position.clone().setY(0.5), verb: 'Inspect chair', mesh: chair, onInteract: () => game.toast(D.toasts.corridor.chair) })

  // Stairwell door interactable at north end
  game.interact.add({
    id: 'stairwell',
    position: new THREE.Vector3(0, 1.2, -39.6),
    radius: 2.2,
    verb: 'Take the stairs',
    onInteract: () => {
      if (game.roomUnlocked('rooftop')) {
        game.gotoRooftop()
      } else {
        audio.sfx('badgeDeny')
        game.toast(D.ui.doorLocked[Math.floor(Math.random() * D.ui.doorLocked.length)])
      }
    }
  })

  // scare triggers
  let copierDone = game.flags.has('scareCopier')
  let tubeDone = game.flags.has('scareTube')
  let fansEnterDone = false

  const update = (dt: number) => {
    const pz = game.player.pos.z
    const inCorridor = game.currentRoom === 'corridor'
    if (inCorridor && !tubeDone && pz < -7) {
      tubeDone = true
      game.flags.add('scareTube')
      game.world.killTube(1)
    }
    if (inCorridor && !copierDone && pz < -12 && Math.abs(game.player.pos.x) < 1.5) {
      copierDone = true
      game.flags.add('scareCopier')
      if (!game.settings.spookFree) {
        audio.sfx('photocopier')
        game.scare('copier')
        ;(copierScreen.material as THREE.MeshStandardMaterial).emissiveIntensity = 2
        copierPage = new THREE.Mesh(
          new THREE.PlaneGeometry(0.21, 0.3),
          new THREE.MeshStandardMaterial({ map: makeLabelTexture('HELP ME\n\n— no toner', { w: 128, h: 160, bg: '#f4f0e8', fg: '#333' }) })
        )
        copierPage.position.set(0.7, 0.96, -13.25)
        copierPage.rotation.x = -Math.PI / 2 + 0.1
        g.add(copierPage)
        game.interact.add({
          id: 'copier-page',
          position: new THREE.Vector3(0.7, 0.96, -13.25),
          verb: 'Read the page',
          mesh: copierPage,
          onInteract: () => game.toast('It reads: "HELP ME — no toner." You feel seen.')
        })
      }
    }
    if (inCorridor && !chairRolled && pz < -24) {
      chairRolled = true
      game.flags.add('chairRolled')
      if (!game.settings.spookFree) chairVel = 0.8
    }
    if (chairVel > 0.01) {
      chair.position.x += chairVel * dt * 0.4
      chair.rotation.y += chairVel * dt
      chairVel *= Math.pow(0.3, dt)
    }
    // warm poster swap
    if (game.world.warmth > 0.85) {
      for (const p of posterMeshes) {
        if (!p.swapped) {
          p.swapped = true
          ;(p.mesh.material as THREE.MeshStandardMaterial).map = makeLabelTexture(p.warm, { w: 256, h: 320, bg: '#5a4a38', fg: '#ffe0c0' })
          ;(p.mesh.material as THREE.MeshStandardMaterial).needsUpdate = true
        }
      }
    }
    void fansEnterDone
  }

  return { id: 'corridor', update }
}
