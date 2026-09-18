// Boot, resize, game loop, state machine wiring (spec §2.3, §16, §28, §30).
import './ui/styles.css'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { Renderer, type Quality } from './engine/renderer.ts'
import { CameraRig } from './engine/cameraRig.ts'
import { Input, glyph } from './engine/input.ts'
import { audio } from './engine/audio.ts'
import { loadSave, loadSettings, writeSettings, clearSave } from './engine/save.ts'
import { World } from './game/world.ts'
import { Player } from './game/player.ts'
import { InteractionSystem } from './game/interaction.ts'
import { DialogueSystem } from './game/dialogue.ts'
import { HUD } from './game/objectives.ts'
import { Minimap } from './game/minimap.ts'
import { VFX } from './game/vfx.ts'
import { Game } from './game/game.ts'
import { LIGHTING, DEBUG, ROOMS, type RoomId, FRAGMENTS } from './config.ts'
import { D } from './data/dialogue.ts'
import { buildLobby } from './rooms/lobby.ts'
import { buildCorridor } from './rooms/corridor.ts'
import { buildServerRoom } from './rooms/serverRoom.ts'
import { buildMeetingRoom } from './rooms/meetingRoom.ts'
import { buildArchive } from './rooms/archive.ts'
import { buildBreakRoom } from './rooms/breakRoom.ts'
import { buildDesignStudio } from './rooms/designStudio.ts'
import { buildFinanceCorner } from './rooms/financeCorner.ts'
import { buildRooftop } from './rooms/rooftop.ts'
import { buildLift } from './rooms/lift.ts'
import { showTitle, showLoading, showBadgeIn, showPause, showSettings, showCredits, makeLetterbox, makeFade, el } from './ui/screens.ts'

const appEl = document.getElementById('app')!
const uiRoot = document.getElementById('ui-root')!
const settings = loadSettings()

// WebGL support check (spec §28)
function webglOk(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch { return false }
}
if (!webglOk()) {
  uiRoot.innerHTML = `<div class="screen loading-screen" style="pointer-events:auto"><h2>Ticket #IT-${settings.ticket}: graphics unavailable</h2><p>Your browser doesn't support WebGL. IT has been notified. IT is, unfortunately, a ghost.</p></div>`
  throw new Error('WebGL unavailable')
}

// --- Core objects -------------------------------------------------------------
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x0c1017)
const camRig = new CameraRig()
const rndr = new Renderer(scene, camRig.camera, appEl)
const input = new Input(rndr.canvas)
const world = new World(scene)
const player = new Player(world, scene)
const interact = new InteractionSystem(uiRoot)
const dialogue = new DialogueSystem(uiRoot)
dialogue.camera = camRig.camera
const hud = new HUD(uiRoot)
const minimap = new Minimap(uiRoot)
minimap.getLog = () => dialogue.log
const vfx = new VFX(scene)
const game = new Game(scene, rndr, camRig, input, world, player, interact, dialogue, hud, minimap, vfx, settings)
game.letterbox = makeLetterbox()
game.fadeScreen = makeFade()
camRig.colliders = world.wallMeshes

// environment map for reflections
{
  const pmrem = new THREE.PMREMGenerator(rndr.renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  if ('environmentIntensity' in scene) (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity = 0.35
}

input.onDeviceChange = (d) => { interact.setDevice(d); dialogue.setDevice(d) }

function applySettings() {
  audio.volumes = { master: settings.volMaster, music: settings.volMusic, sfx: settings.volSfx, blips: settings.volBlips }
  audio.applyVolumes()
  hud.setTextScale(settings.textSize)
  minimap.cbSafe = settings.cbMinimap
  world.spookFree = settings.spookFree
  world.reduceMotion = settings.reduceMotion
  camRig.reduceMotion = settings.reduceMotion
  rndr.reduceMotion = settings.reduceMotion
  dialogue.charsPerSec = settings.textSpeed === 'slow' ? 18 : settings.textSpeed === 'instant' ? 9999 : 35
  if (settings.quality !== 'auto') rndr.setQuality(settings.quality as Quality)
  writeSettings(settings)
}
applySettings()

// --- Build rooms (chunked so the loading bar moves, spec §28) -------------------
const loading = showLoading()
const buildSteps: [string, () => void][] = [
  ['lobby', () => game.rooms.push(buildLobby(game))],
  ['corridor', () => game.rooms.push(buildCorridor(game))],
  ['serverRoom', () => game.rooms.push(buildServerRoom(game))],
  ['meetingRoom', () => game.rooms.push(buildMeetingRoom(game))],
  ['archive', () => game.rooms.push(buildArchive(game))],
  ['breakRoom', () => game.rooms.push(buildBreakRoom(game))],
  ['designStudio', () => game.rooms.push(buildDesignStudio(game))],
  ['financeCorner', () => game.rooms.push(buildFinanceCorner(game))],
  ['rooftop', () => game.rooms.push(buildRooftop(game))],
  ['lift', () => game.rooms.push(buildLift(game))]
]

const save = loadSave()
// Restore flags BEFORE building rooms so they build in solved state
if (save) {
  game.flags = new Set(save.solved)
  game.fragments = [...save.fragments]
  game.duck = save.duck
  game.pen = save.pen
}

let stepIdx = 0
function buildNext() {
  if (stepIdx < buildSteps.length) {
    buildSteps[stepIdx][1]()
    stepIdx++
    loading.setProgress(stepIdx / (buildSteps.length + 1))
    setTimeout(buildNext, 16) // timer, not rAF: must complete even in a hidden tab
  } else {
    loading.setProgress(1)
    onBuilt()
  }
}
setTimeout(buildNext, 16)

// --- Screens flow ----------------------------------------------------------------
let removeTitle: (() => void) | null = null
let removePause: (() => void) | null = null
let removeSettings: (() => void) | null = null

let autostart = false
try {
  if (sessionStorage.getItem('ah.autostart')) {
    sessionStorage.removeItem('ah.autostart')
    autostart = true
  }
} catch { /* storage unavailable */ }

function onBuilt() {
  loading.ready(() => {
    if (autostart) startNewGame()
    else goTitle()
  })
}

function goTitle() {
  game.phase = 'TITLE'
  hud.hide(true)
  minimap.hide(true)
  removeTitle = showTitle(!!loadSave(), {
    onNew: () => {
      removeTitle?.()
      clearSave()
      // Fresh state requires a clean world; simplest robust path: reload with autostart flag
      if (save || game.fragments.length) {
        try { sessionStorage.setItem('ah.autostart', '1') } catch { /* */ }
        location.reload()
        return
      }
      startNewGame()
    },
    onContinue: () => {
      removeTitle?.()
      const s = loadSave()
      if (s) game.restoreFrom(s)
      enterPlay()
    },
    onSettings: () => {
      removeSettings = showSettings(settings, applySettings, () => { removeSettings = null })
    },
    onCredits: () => {
      showCreditsScreen(false)
    }
  })
}

function startNewGame() {
  game.phase = 'BADGE_IN'
  showBadgeIn(() => {
    player.teleport(0, 12.5, Math.PI)
    camRig.yaw = 0
    camRig.snapTo(player.pos)
    enterPlay(false) // cold open sets the first objective itself
    game.coldOpen?.()
    hud.setFragments(game.fragments)
    game.toast('Move: WASD · Camera: mouse · Interact: E · Jog: Shift · Pause/exit: Esc')
  })
}

function enterPlay(refreshObjective = true) {
  game.phase = 'PLAY'
  hud.hide(false)
  minimap.hide(false)
  audio.setAmbient(game.currentRoom, world.warmth)
  if (refreshObjective && !game.hud.currentObjective) game.refreshObjective()
}

function showCreditsScreen(complete: boolean) {
  game.phase = 'CREDITS'
  hud.hide(true)
  minimap.hide(true)
  game.letterbox(false)
  const mins = Math.floor(game.playtime / 60)
  const secs = Math.floor(game.playtime % 60)
  showCredits(
    { time: `${mins}m ${secs.toString().padStart(2, '0')}s`, hints: game.hintsUsed, sandwichTries: game.sandwichAttempts, complete },
    () => {
      clearSave()
      try { sessionStorage.setItem('ah.autostart', '1') } catch { /* */ }
      location.reload()
    }
  )
}
game.onCredits = () => showCreditsScreen(true)


// --- Pause ------------------------------------------------------------------------
function openPause() {
  if (game.phase !== 'PLAY') return
  game.phase = 'PAUSED'
  input.exitPointerLock()
  audio.mute(true)
  removePause = showPause({
    onResume: closePause,
    onSettings: () => {
      removeSettings = showSettings(settings, applySettings, () => { removeSettings = null; game.saveNow() })
    },
    onRestartRoom: () => {
      // teleport back to current room's door / safe spot
      const def = ROOMS.find((r) => r.id === game.currentRoom)!
      player.putBack()
      hud.setHeldItem(null)
      if (game.currentRoom === 'rooftop') player.teleport(52, -44, Math.PI)
      else if (game.currentRoom === 'lobby' || game.currentRoom === 'lift') player.teleport(0, 8, Math.PI)
      else if (game.currentRoom === 'corridor') player.teleport(0, -2, Math.PI)
      else player.teleport((def.rect[0] + def.rect[2]) / 2, (def.rect[1] + def.rect[3]) / 2, 0)
      camRig.snapTo(player.pos)
      closePause()
    },
    onQuit: () => {
      game.saveNow()
      location.reload()
    }
  })
}
function closePause() {
  removePause?.()
  removePause = null
  if (game.phase === 'PAUSED') game.phase = 'PLAY'
  audio.mute(false)
}

// Tab blur → auto-pause + mute (spec §28)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.phase === 'PLAY') openPause()
})
window.addEventListener('blur', () => {
  if (game.phase === 'PLAY') openPause()
})

// Pointer lock on canvas click during play
rndr.canvas.addEventListener('click', () => {
  if (game.phase === 'PLAY' && !minimap.enlarged) input.requestPointerLock()
})

// Fullscreen toggle (F)
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyF' && !DEBUG.has('debug') && game.phase === 'PLAY') {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen?.()
  }
})

// Pointer-lock hint
const pointerHint = el('div', 'pointer-hint', 'Click to look around')
pointerHint.style.display = 'none'
uiRoot.appendChild(pointerHint)
let unlockedTime = 0

// postMessage embed events (spec §28)
function emitEmbed(event: string) {
  try { window.parent?.postMessage({ source: 'after-hours', event }, '*') } catch { /* */ }
}
emitEmbed('game:start')

// --- Debug tools (spec §30) ----------------------------------------------------------
const debugMode = DEBUG.has('debug')
let debugOverlay: HTMLDivElement | null = null
let frameCount = 0
let fpsTimer = 0
let fps = 0
if (debugMode) {
  ;(window as unknown as Record<string, unknown>).game = game
  debugOverlay = el('div', 'debug-overlay', '')
  uiRoot.appendChild(debugOverlay)
  window.addEventListener('keydown', (e) => {
    if (game.phase !== 'PLAY') return
    const teleports: Record<string, [number, number]> = {
      Digit1: [0, 8], Digit2: [0, -20], Digit3: [-7, -33], Digit4: [7, -33],
      Digit5: [-7, -21], Digit6: [7, -21], Digit7: [-7, -9], Digit8: [7, -9], Digit9: [52, -44]
    }
    if (teleports[e.code]) {
      const [x, z] = teleports[e.code]
      game.onRooftop = e.code === 'Digit9'
      player.teleport(x, z)
      camRig.snapTo(player.pos)
    }
    if (e.code === 'KeyG') {
      const next = FRAGMENTS.find((f) => !game.fragments.includes(f.id))
      if (next) game.collectFragment(next.id, player.pos.clone())
    }
    if (e.code === 'KeyT') {
      world.setWarmthTarget(world.warmth > 0.6 ? 0 : world.warmth > 0.2 ? 1 : 0.5)
    }
  })
}
const skipTo = DEBUG.get('skip')
if (skipTo) {
  // start with everything before <roomId> solved (spec §30)
  const order: RoomId[] = ['serverRoom', 'meetingRoom', 'archive', 'designStudio', 'breakRoom', 'financeCorner', 'rooftop']
  const flagMap: Record<string, string[]> = {
    serverRoom: ['serverSolved', 'marcusTask'], meetingRoom: ['meetingSolved', 'priyaTask'],
    archive: ['archiveSolved', 'inesTask'], designStudio: ['designSolved', 'kitTask', 'logoCanon'],
    breakRoom: ['breakSolved', 'garyTask'], financeCorner: ['financeSolved', 'beatrizTask'], rooftop: ['rooftopDone']
  }
  const fragMap: Record<string, string> = {
    serverRoom: 'uptime', meetingRoom: 'alignment', archive: 'memory', designStudio: 'taste',
    breakRoom: 'care', financeCorner: 'balance', rooftop: 'purpose'
  }
  const idx = order.indexOf(skipTo as RoomId)
  if (idx > 0) {
    game.flags.add('metDoris')
    game.duck = 'held'
    for (let i = 0; i < idx; i++) {
      for (const f of flagMap[order[i]]) game.flags.add(f)
      game.fragments.push(fragMap[order[i]] as never)
    }
  }
}

// --- Auto quality detection (spec §21) -------------------------------------------------
let autoQualityTimer = 0
let autoQualityFrames = 0
let autoQualityDone = settings.quality !== 'auto'
if (settings.quality === 'auto') rndr.setQuality('high')

// --- Main loop ---------------------------------------------------------------------------
const clock = new THREE.Clock()
let time = 0
let lastTick = performance.now()

function frame() {
  requestAnimationFrame(frame)
  tick()
}
// Fallback: keep simulating when the window is occluded and rAF stalls
setInterval(() => {
  if (performance.now() - lastTick > 250) tick()
}, 100)

function tick() {
  lastTick = performance.now()
  const dt = Math.min(clock.getDelta(), 0.1)
  time += dt
  input.update(dt)

  const playing = game.phase === 'PLAY'
  const paused = game.phase === 'PAUSED' || minimap.enlarged

  if (playing && !paused) {
    // look
    const look = input.lookDelta(0.0022 * settings.sensitivity, settings.invertY)
    camRig.addLook(look.x, look.y)

    // action inputs
    if (input.consume('pause')) { openPause() }
    else if (input.consume('back')) {
      if (dialogue.active) {
        if (!dialogue.tryClose()) { /* critical */ }
      } else if (player.held) {
        player.putBack()
        hud.setHeldItem(null)
        game.toast('You put it back. Neatly. Ish.')
      } else if (input.pointerLocked) {
        // Esc released pointer lock natively; open pause
        openPause()
      } else {
        openPause()
      }
    }
    if (input.consume('interact')) {
      if (dialogue.active) dialogue.advance()
      else {
        if (interact.tryInteract()) player.char.rig.triggerInteract()
      }
    }
    if (dialogue.active) {
      if (input.consume('choice1')) dialogue.selectChoice(0)
      if (input.consume('choice2')) dialogue.selectChoice(1)
      if (input.consume('choice3')) dialogue.selectChoice(2)
      if (input.consume('up')) dialogue.moveChoice(-1)
      if (input.consume('down')) dialogue.moveChoice(1)
    }
    if (input.consume('hint')) game.requestHint()
    if (input.consume('map')) minimap.toggleEnlarged()

    // world + player + systems
    player.locked = player.locked || dialogue.active
    if (!dialogue.active && game.phase === 'PLAY' && !game.finaleStarted) {
      // release lock unless a sequence holds it
    }
    player.update(dt, input, camRig)
    player.lookTarget = interact.focused ? interact.focused.position.clone().add(new THREE.Vector3(0, 1.2, 0)) : null
    world.update(dt, player.pos, time)
    game.update(dt)
    interact.suppressed = dialogue.active || player.locked
    interact.update(dt, player.pos, camRig.camera)
    camRig.update(dt, player.pos, player.jogging)
    player.updateVisibility(camRig.camera.position)
    vfx.update(dt)
    dialogue.update(dt)
    hud.update(dt, player.moving)
    minimap.update(dt, player.pos.x, player.pos.z, player.facing, game.currentRoom)

    // pointer-lock hint
    if (!input.pointerLocked && !dialogue.active && !player.locked) {
      unlockedTime += dt
      pointerHint.style.display = unlockedTime > 3 ? 'block' : 'none'
    } else {
      unlockedTime = 0
      pointerHint.style.display = 'none'
    }

    // grade per warmth
    const w = world.warmth
    const pick = (k: keyof typeof LIGHTING['COLD']) => {
      const c = LIGHTING.COLD[k] as number, n = LIGHTING.NEUTRAL[k] as number, wa = LIGHTING.WARM[k] as number
      return w < 0.5 ? c + (n - c) * w * 2 : n + (wa - n) * (w - 0.5) * 2
    }
    rndr.setGrade(pick('saturation'), pick('vignette'), w, pick('bloomStrength'), pick('exposure'))
    scene.background = world.fog.color

    // auto quality: measure 2s after play begins, step down once if < 50fps
    if (!autoQualityDone) {
      autoQualityTimer += dt
      autoQualityFrames++
      if (autoQualityTimer >= 2.5) {
        const measured = autoQualityFrames / autoQualityTimer
        if (measured < 35) rndr.setQuality('low')
        else if (measured < 50) rndr.setQuality('med')
        autoQualityDone = true
      }
    }
  } else if (minimap.enlarged) {
    // game pauses underneath while map enlarged (spec §7)
    if (input.consume('map') || input.consume('back')) minimap.toggleEnlarged()
    minimap.update(dt, player.pos.x, player.pos.z, player.facing, game.currentRoom)
  } else if (game.phase === 'PAUSED') {
    // Esc / P / Start resumes (only when the pause menu itself is on top)
    if (removePause && !removeSettings && (input.consume('back') || input.consume('pause'))) closePause()
  } else if (game.phase === 'TITLE' || game.phase === 'CREDITS' || game.phase === 'BADGE_IN') {
    // idle world tick keeps lights alive behind screens
    world.update(dt, player.pos, time)
  }
  input.clearFrame()

  rndr.render(dt, time)

  if (debugOverlay) {
    frameCount++
    fpsTimer += dt
    if (fpsTimer >= 0.5) {
      fps = Math.round(frameCount / fpsTimer)
      frameCount = 0
      fpsTimer = 0
    }
    const info = rndr.renderer.info
    debugOverlay.textContent = `${fps} fps · calls ${info.render.calls} · tris ${info.render.triangles} · room ${game.currentRoom} · frags ${game.fragments.length} · warmth ${world.warmth.toFixed(2)}`
  }
}
frame()

// Doris echo line reference kept alive for the intercom (spec exactness)
void D.building.workUnknown
