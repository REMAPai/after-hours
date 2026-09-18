// LOBBY — hub. Amna, dressing, cold open, and the finale "Badge Out" (spec §8.1, §9.2).
import * as THREE from 'three'
import type { Game, RoomModule } from '../game/game.ts'
import { makeGhost, type Ghost } from '../characters/ghosts.ts'
import { D } from '../data/dialogue.ts'
import { desk, box, std, monitor, plant, mug, officeChair, paperStack } from './props.ts'
import { makeLabelTexture, logoTexture, makeScreenTexture } from '../engine/textures.ts'
import { audio } from '../engine/audio.ts'
import { makeShard } from '../game/vfx.ts'

export function buildLobby(game: Game): RoomModule {
  const g = new THREE.Group()
  game.scene.add(g)
  const dorisReleased = game.flags.has('finaleDone')

  // Reception desk centre
  const deskG = new THREE.Group()
  const deskTop = box(2.6, 0.08, 0.9, std(0x7a6248, { rough: 0.5 }), 0, 1.02, 0)
  const deskFront = box(2.6, 1.0, 0.12, std(0x5e4a36, { rough: 0.6 }), 0, 0.5, 0.42)
  deskG.add(deskTop, deskFront)
  deskG.position.set(0, 0, 8)
  g.add(deskG)
  game.world.addCollider(-1.3, 7.5, 1.3, 8.5, 1.1)

  // Desk props: monitor (login page wink), CRT, phone, bell, log book, mints
  const mon = monitor((c, w, h) => {
    c.fillStyle = '#e8ecf2'; c.fillRect(0, 0, w, h)
    c.fillStyle = '#ffffff'; c.fillRect(w * 0.25, h * 0.15, w * 0.5, h * 0.7)
    c.fillStyle = '#F4581C'; c.beginPath(); c.arc(w / 2, h * 0.3, 8, 0, 7); c.fill()
    c.fillStyle = '#99a'; c.fillRect(w * 0.3, h * 0.45, w * 0.4, 6)
    c.fillRect(w * 0.3, h * 0.58, w * 0.4, 6)
    c.fillStyle = '#4466aa'; c.fillRect(w * 0.3, h * 0.7, w * 0.4, 10)
  })
  mon.position.set(-0.7, 1.06, 8)
  mon.rotation.y = 0.4
  g.add(mon)
  const crt = box(0.4, 0.35, 0.4, std(0xc8c4b8, { rough: 0.7 }), 0.8, 1.24, 8)
  g.add(crt)
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(0xd8b850, { metal: 0.8, rough: 0.25 }))
  bell.position.set(0.3, 1.07, 7.8)
  g.add(bell)
  const logbook = box(0.3, 0.03, 0.22, std(0x8a3030, { rough: 0.8 }), -0.2, 1.08, 7.75)
  g.add(logbook)
  const mints = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), std(0xd0d8e0, { rough: 0.3 }))
  mints.position.set(0.55, 1.06, 7.7)
  g.add(mints)

  // REMAP letters behind desk (unlit → lit)
  const letters: THREE.Mesh[] = []
  const word = 'REMAP'
  for (let i = 0; i < word.length; i++) {
    const tex = makeLabelTexture(word[i], { w: 64, h: 64, bg: '#1a1e26', fg: '#F4581C' })
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xf4581c, emissiveMap: tex, emissiveIntensity: 0 })
    const letter = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), mat)
    letter.position.set(-2.2 + i * 1.1, 2.1, 13.85)
    letter.rotation.y = Math.PI
    letters.push(letter)
    g.add(letter)
  }
  const updateLetters = () => {
    const lit = game.flags.has('finaleDone') ? 5 : Math.min(3 + (game.fragments.length >= 4 ? 1 : 0), 4)
    letters.forEach((l, i) => {
      ;(l.material as THREE.MeshStandardMaterial).emissiveIntensity = i < lit ? 1.6 : 0.06
    })
  }
  updateLetters()

  // Seating corner, low table, magazines, plant, water cooler, turnstile, clock, mat
  for (let i = 0; i < 4; i++) {
    const ch = officeChair(0x4a5560)
    ch.position.set(-5 + (i % 2) * 1.2, 0, 10.5 + Math.floor(i / 2) * 1.4)
    ch.rotation.y = 0.8 + i * 0.3
    g.add(ch)
  }
  const lowTable = box(1.0, 0.4, 0.7, std(0x6a5a44), -4.4, 0.2, 11.2)
  g.add(lowTable)
  game.world.addCollider(-5.6, 10, -3.8, 12, 1)
  const mags = paperStack(2); mags.position.set(-4.4, 0.42, 11.2); mags.scale.setScalar(0.8); g.add(mags)
  const deadPlant = plant(true); deadPlant.position.set(-6.3, 0, 13.2); g.add(deadPlant)
  const cooler = new THREE.Group()
  cooler.add(box(0.35, 1.0, 0.35, std(0xd8dde2, { rough: 0.4 }), 0, 0.5, 0))
  cooler.add(cyl2(0.14, 0.3, std(0x9fc4e8, { rough: 0.2 }), 0, 1.15, 0))
  cooler.position.set(6.3, 0, 12.8)
  g.add(cooler)
  const turnstile = new THREE.Group()
  turnstile.add(box(0.15, 1.0, 0.15, std(0x555a61, { metal: 0.6, rough: 0.3 }), 0, 0.5, 0))
  turnstile.add(box(0.8, 0.06, 0.06, std(0x555a61, { metal: 0.6, rough: 0.3 }), 0.4, 0.9, 0))
  turnstile.position.set(3.5, 0, 1.5)
  g.add(turnstile)
  const clockMesh = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), new THREE.MeshStandardMaterial({
    map: makeScreenTexture((c, w, h) => {
      c.fillStyle = '#f0ede4'; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 2, 0, 7); c.fill()
      c.strokeStyle = '#333'; c.lineWidth = 4
      c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 - 14, h / 2 - 20); c.stroke() // 6:47ish
      c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 + 22, h / 2 + 6); c.stroke()
    }, 64, 64)
  }))
  clockMesh.position.set(-3, 2.4, 13.88)
  clockMesh.rotation.y = Math.PI
  g.add(clockMesh)
  const mat2 = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.0), new THREE.MeshStandardMaterial({
    map: makeLabelTexture('WEL OME', { w: 256, h: 128, bg: '#5a4a3a', fg: '#c8b89a' })
  }))
  mat2.rotation.x = -Math.PI / 2
  mat2.position.set(0, 0.012, 2)
  g.add(mat2)

  // Employee of the Month gallery — 8 portraits (foreshadowing)
  const portraitIds = ['doris', 'marcus', 'priya', 'ines', 'gary', 'kit', 'beatriz', 'sam'] as const
  portraitIds.forEach((id, i) => {
    const colors: Record<string, string> = { doris: '#b9a7d9', marcus: '#7fb6e8', priya: '#8fa3b8', ines: '#8cc5bc', gary: '#d9b85b', kit: '#e89a7c', beatriz: '#a6c58f', sam: '#f2c879' }
    const tex = makeScreenTexture((c, w, h) => {
      c.fillStyle = '#22262e'; c.fillRect(0, 0, w, h)
      c.fillStyle = colors[id]
      c.beginPath(); c.arc(w / 2, h * 0.38, w * 0.2, 0, 7); c.fill()
      c.beginPath(); c.ellipse(w / 2, h * 0.85, w * 0.3, h * 0.3, 0, Math.PI, 0); c.fill()
      c.fillStyle = '#ccc'; c.font = 'bold 11px Arial'; c.textAlign = 'center'
      const shown: Record<string, string> = { doris: 'AMNA', marcus: 'ABDUL MOIZ', priya: 'ZAINAB', ines: 'HIRA', gary: 'IRFAN', kit: 'BILAL', beatriz: 'SANA', sam: 'TARIQ' }
      c.fillText(shown[id] ?? id.toUpperCase(), w / 2, h * 0.95)
    }, 96, 128)
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.6), new THREE.MeshStandardMaterial({ map: tex }))
    p.position.set(-6.88, 1.9, 4 + i * 1.1)
    p.rotation.y = Math.PI / 2
    g.add(p)
    game.interact.add({
      id: `portrait-${id}`,
      position: p.position.clone(),
      verb: 'Inspect portrait',
      mesh: p,
      onInteract: () => game.toast(D.toasts.portraits[id])
    })
  })

  // Flavour inspects
  const flavour: [string, THREE.Vector3, string, THREE.Object3D?][] = [
    ['mints', mints.position.clone().setY(1.1), D.toasts.lobby.mints, mints],
    ['magazines', new THREE.Vector3(-4.4, 0.5, 11.2), D.toasts.lobby.magazines, mags],
    ['cooler', new THREE.Vector3(6.3, 0.8, 12.8), D.toasts.lobby.waterCooler, cooler],
    ['lobbyclock', new THREE.Vector3(-3, 1.8, 13.5), D.toasts.lobby.clock, clockMesh],
    ['mat', new THREE.Vector3(0, 0.2, 2), D.toasts.lobby.mat],
    ['logbook', new THREE.Vector3(-0.2, 1.1, 7.75), D.toasts.lobby.logbook, logbook],
    ['turnstile', new THREE.Vector3(3.5, 0.8, 1.5), D.toasts.lobby.turnstile, turnstile]
  ]
  for (const [id, pos, toast, mesh] of flavour) {
    game.interact.add({ id: `lobby-${id}`, position: pos, verb: 'Inspect', mesh, onInteract: () => game.toast(toast) })
  }

  // Lift call panel
  const liftPanel = box(0.12, 0.3, 0.12, std(0x3a4048, { metal: 0.5, rough: 0.4 }), 6.85, 1.2, 6.6)
  const liftButton = box(0.05, 0.05, 0.03, std(0x330000, { emissive: 0xff3030, emissiveIntensity: 2 }), 0, 0.05, 0.06)
  liftPanel.add(liftButton)
  g.add(liftPanel)

  // --- AMNA -----------------------------------------------------------------
  let doris: Ghost | null = null
  if (!dorisReleased) {
    doris = makeGhost('doris')
    doris.setPosition(0, 0, 7.3, 0)
    game.scene.add(doris.group)
    game.ghosts.push(doris)
    game.dorisAnchor = doris.rig.head
  }

  let jokeIdx = 0
  let greetIdx = 0
  game.interact.add({
    id: 'doris',
    position: new THREE.Vector3(0, 0, 7.6),
    radius: 2.6,
    verb: 'Talk to Amna',
    priority: 0.9,
    mesh: doris?.rig.root,
    enabled: () => !!doris && !doris.released && !game.finaleStarted,
    onInteract: () => {
      if (!doris) return
      if (game.finaleReady()) { startFinale(); return }
      const anchor = doris.rig.head
      if (!game.flags.has('metDoris')) {
        game.flags.add('metDoris')
        game.say(
          D.doris.intro.map((text) => ({ speaker: 'doris', name: 'AMNA', text, anchor })),
          {
            ghost: doris, critical: true, onDone: () => {
              game.refreshObjective() // routes to the nearest starter room with directions + beacon
              game.toast(D.missionBrief)
              game.saveNow()
            }
          }
        )
        return
      }
      // hint dispenser: plain-language route + one joke (spec §6.4)
      const joke = D.doris.jokes[jokeIdx % D.doris.jokes.length]
      jokeIdx++
      const greeting = D.doris.greet[greetIdx % D.doris.greet.length]
      greetIdx++
      const route = game.hud.currentHint || 'Off you pop down the corridor, love.'
      game.say([
        { speaker: 'doris', name: 'AMNA', text: greeting, anchor },
        { speaker: 'doris', text: `Your next step, love: ${route}`, anchor },
        { speaker: 'doris', text: joke, anchor }
      ], { ghost: doris })
    }
  })
  game.interact.add({
    id: 'doris-echo',
    position: new THREE.Vector3(0, 0, 8.6),
    radius: 2.0,
    verb: 'Inspect the desk',
    enabled: () => !doris || doris.released,
    onInteract: () => game.toast(D.doris.echo)
  })

  // --- Lift badge reader / finale --------------------------------------------
  const reader = box(0.14, 0.2, 0.08, std(0x2a2f36, { metal: 0.4, rough: 0.4 }), 6.82, 1.25, 4.6)
  g.add(reader)
  game.interact.add({
    id: 'lift-reader',
    position: new THREE.Vector3(6.85, 1.2, 5.2),
    radius: 2.0,
    verb: 'Badge the lift reader',
    mesh: reader,
    enabled: () => !game.finaleStarted || finaleStep === 'awaitBadge',
    onInteract: () => {
      if (finaleStep === 'awaitBadge') { badgeOut(); return }
      audio.sfx('badgeDeny')
      if (game.finaleReady()) {
        game.toast('Say goodbye to Amna first. She has been waiting.')
      } else {
        game.intercom(D.building.liftDead, undefined, false)
      }
    }
  })

  // --- Cold open (called from main after badge-in) ----------------------------
  const coldOpen = () => {
    game.player.locked = true
    setTimeout(() => {
      audio.sfx('liftWhineDown')
      game.rndr.scarePulse()
      setTimeout(() => {
        game.intercom(D.building.coldOpen, () => {
          game.setObjective(D.ui.objectives.findWork, D.ui.hints.lobby, [0, 8])
          setTimeout(() => {
            if (!game.dialogue.active) game.setObjective(D.ui.objectives.meetDoris, D.ui.hints.lobby, [0, 8])
          }, 3000)
          game.player.locked = false
        })
      }, 1600)
    }, 800)
  }
  game.coldOpen = coldOpen

  // --- FINALE ----------------------------------------------------------------
  let finaleStep: 'idle' | 'dorisTalk' | 'awaitBadge' | 'assembly' | 'boarding' | 'waving' | 'done' = 'idle'
  let finaleT = 0
  const lineGhosts: Ghost[] = []
  let logoPanel: THREE.Mesh | null = null
  const shards: THREE.Mesh[] = []

  function startFinale() {
    if (!doris || game.finaleStarted) return
    game.finaleStarted = true
    finaleStep = 'dorisTalk'
    game.letterbox(true)
    // spawn the freed ghosts in a loose line by the lift
    const ids = ['marcus', 'priya', 'ines', 'gary', 'kit', 'beatriz', 'sam']
    ids.forEach((id, i) => {
      const gh = makeGhost(id)
      gh.setPosition(4.6 - i * 0.9, 0, 4.2 + (i % 2) * 0.7, Math.PI * 0.1)
      game.scene.add(gh.group)
      game.ghosts.push(gh)
      lineGhosts.push(gh)
      gh.rig.setMouth('smile')
    })
    const anchor = doris.rig.head
    game.say(
      D.doris.finale.map((text) => ({ speaker: 'doris', name: 'AMNA', text, anchor })),
      {
        ghost: doris, critical: true, onDone: () => {
          // Amna stands, removes badge, joins the line
          audio.sfx('paperPeel')
          doris!.release(() => {
            const badge = box(0.14, 0.02, 0.2, std(0xd8d0b8, { rough: 0.6 }), 0, 1.08, 8)
            g.add(badge)
          })
          setTimeout(() => {
            finaleStep = 'awaitBadge'
            game.player.locked = false
            game.setObjective(D.ui.objectives.lift, 'Badge the lift reader.', [7, 5.7])
          }, 5200)
        }
      }
    )
  }

  function badgeOut() {
    finaleStep = 'assembly'
    finaleT = 0
    game.player.locked = true
    audio.sfx('badgeAccept')
    audio.setMusic('finale')
    game.camRig.startCinematic()
    game.camRig.cinePos.set(3.5, 1.8, 8.5)
    game.camRig.cineLook.set(7, 1.6, 5.7)
    // spawn 7 shards orbiting
    for (let i = 0; i < 7; i++) {
      const s = makeShard()
      s.position.set(6.2, 1.5, 5.7)
      shards.push(s)
      game.scene.add(s)
    }
    // logo panel on lift doors
    logoPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 1.4),
      new THREE.MeshStandardMaterial({
        map: logoTexture('#F4581C', false), transparent: true, opacity: 0,
        emissive: 0xf4581c, emissiveIntensity: 0, emissiveMap: logoTexture('#ffffff', false)
      })
    )
    logoPanel.position.set(6.88, 1.6, 5.7)
    logoPanel.rotation.y = -Math.PI / 2
    g.add(logoPanel)
  }

  const update = (dt: number) => {
    updateLetters()
    if (finaleStep === 'assembly') {
      finaleT += dt
      // shards orbit then snap in (spec: ~8s centrepiece)
      shards.forEach((s, i) => {
        const k = Math.min(1, finaleT / 6)
        const a = finaleT * (1.5 - k) + (i / 7) * Math.PI * 2
        const r = 1.6 * (1 - k)
        s.position.set(6.4 - Math.cos(a) * r * 0.4, 1.6 + Math.sin(a * 1.3) * r * 0.5, 5.7 + Math.sin(a) * r)
        s.scale.setScalar(1 - k * 0.5)
      })
      if (logoPanel) {
        const m = logoPanel.material as THREE.MeshStandardMaterial
        m.opacity = Math.min(1, finaleT / 6)
        m.emissiveIntensity = Math.min(2.2, (finaleT / 6) * 2.2)
      }
      if (finaleT > 6.5 && finaleT - dt <= 6.5) {
        audio.sfx('fragmentChime')
        audio.sfx('liftDing')
        shards.forEach((s) => game.scene.remove(s))
        game.vfx.confetti(new THREE.Vector3(6.5, 2.4, 5.7))
        const liftDoor = game.world.doors.get('lift')!
        liftDoor.setLocked(false)
      }
      if (finaleT > 8) {
        finaleStep = 'boarding'
        finaleT = 0
      }
    } else if (finaleStep === 'boarding') {
      finaleT += dt
      // auto-walk player into the lift
      const target = new THREE.Vector3(8.7, 0, 5.7)
      const to = target.clone().sub(game.player.pos)
      if (to.length() > 0.15) {
        const step = to.normalize().multiplyScalar(1.8 * dt)
        game.player.pos.add(step)
        game.player.char.rig.root.position.copy(game.player.pos)
        game.player.char.rig.state = 'walk'
        game.player.char.rig.speed = 1.8
        game.player.facing = Math.atan2(to.x, to.z)
        game.player.char.rig.root.rotation.y = game.player.facing
      } else {
        finaleStep = 'waving'
        finaleT = 0
        game.player.facing = -Math.PI / 2
        game.player.char.rig.root.rotation.y = -Math.PI / 2
        game.player.char.rig.state = 'idle'
        game.camRig.cinePos.set(8.6, 1.7, 5.7)
        game.camRig.cineLook.set(0, 1.4, 7)
        // ghosts wave & dissolve
        lineGhosts.forEach((gh, i) => {
          setTimeout(() => gh.release(() => { /* motes */ }), 600 + i * 500)
        })
        game.player.char.rig.setMouth('wideSmile')
        game.player.char.rig.browEmotion = 0.4
      }
    } else if (finaleStep === 'waving') {
      finaleT += dt
      if (finaleT > 6.5 && finaleT - dt <= 6.5) {
        game.flags.add('finaleDone')
        updateLetters()
        audio.sfx('shimmer')
      }
      if (finaleT > 8) {
        finaleStep = 'done'
        game.fadeScreen(() => {
          audio.setMusic('off')
          game.intercom(D.building.finaleClose, () => {
            game.onCredits?.()
          })
        })
      }
    }
  }

  return {
    id: 'lobby',
    update,
    onEnter: () => {
      if (game.finaleReady() && !game.finaleStarted && game.flags.has('rooftopDone')) {
        game.setObjective(D.ui.objectives.badgeOut, D.ui.hints.lobby, [0, 8])
      }
    }
  }
}

function cyl2(r: number, h: number, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), mat)
  m.position.set(x, y, z)
  return m
}
