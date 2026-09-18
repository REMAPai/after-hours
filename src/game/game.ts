// Central orchestrator: FSM, fragments, gating, intercom, saves, finale (spec §9, §16).
import * as THREE from 'three'
import { FRAGMENTS, ROOMS, ROOFTOP_SPAWN, ROOFTOP_EXIT, lanyardTier, type FragmentId, type RoomId } from '../config.ts'
import { Renderer } from '../engine/renderer.ts'
import { CameraRig } from '../engine/cameraRig.ts'
import { Input } from '../engine/input.ts'
import { audio } from '../engine/audio.ts'
import { loadSave, writeSave, clearSave, type SaveData, type SettingsData } from '../engine/save.ts'
import { World } from './world.ts'
import { Player } from './player.ts'
import { InteractionSystem } from './interaction.ts'
import { DialogueSystem, type DialogueLine } from './dialogue.ts'
import { HUD } from './objectives.ts'
import { Minimap } from './minimap.ts'
import { VFX, makeShard } from './vfx.ts'
import { D } from '../data/dialogue.ts'
import type { Ghost } from '../characters/ghosts.ts'

export type GamePhase = 'TITLE' | 'BADGE_IN' | 'PLAY' | 'PAUSED' | 'FINALE' | 'CREDITS'

export interface RoomModule {
  id: RoomId
  update?: (dt: number) => void
  onEnter?: () => void
  onExit?: () => void
  hintPing?: () => [number, number] | null
}

export class Game {
  phase: GamePhase = 'TITLE'
  flags = new Set<string>()
  fragments: FragmentId[] = []
  duck: 'none' | 'vending' | 'held' | 'reconciled' = 'none'
  pen = false
  playtime = 0
  hintsUsed = 0
  sandwichAttempts = 0
  currentRoom: RoomId = 'lobby'
  ghosts: Ghost[] = []
  rooms: RoomModule[] = []
  private announcedUnlocks = new Set<string>()
  onRooftop = false
  letterbox: (on: boolean) => void = () => {}
  fadeScreen: (cb?: () => void) => void = () => {}
  finaleStarted = false
  onCredits: (() => void) | null = null
  dorisAnchor: THREE.Object3D | null = null
  coldOpen: (() => void) | null = null
  private buildingOddLines: Record<number, string> = { 1: D.building.frag1, 3: D.building.frag3, 5: D.building.frag5 }
  private collectSeq: { shard: THREE.Mesh; t: number; from: THREE.Vector3; id: FragmentId; onDone?: () => void } | null = null
  debug = false

  constructor(
    public scene: THREE.Scene,
    public rndr: Renderer,
    public camRig: CameraRig,
    public input: Input,
    public world: World,
    public player: Player,
    public interact: InteractionSystem,
    public dialogue: DialogueSystem,
    public hud: HUD,
    public minimap: Minimap,
    public vfx: VFX,
    public settings: SettingsData
  ) {
    dialogue.onExchangeEnd = () => {
      this.player.locked = this.collectSeq !== null
      this.camRig.endDialogue()
      for (const g of this.ghosts) g.talking = false
    }
  }

  // --- Dialogue helper -------------------------------------------------------
  say(lines: DialogueLine[], opts: {
    onDone?: () => void; onChoice?: (v: string) => void; critical?: boolean
    ghost?: Ghost; frame?: boolean
  } = {}) {
    this.player.locked = true
    if (opts.ghost) {
      opts.ghost.talking = true
      opts.ghost.lookTarget = this.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0))
      if (opts.frame !== false) {
        const gp = new THREE.Vector3()
        opts.ghost.group.getWorldPosition(gp)
        this.camRig.startDialogue(this.player.pos.clone(), gp)
      }
    }
    this.dialogue.say(lines, {
      critical: opts.critical,
      onChoice: opts.onChoice,
      onDone: () => {
        if (opts.ghost) opts.ghost.talking = false
        opts.onDone?.()
      }
    })
  }

  intercom(text: string, onDone?: () => void, critical = true) {
    this.say([{ speaker: 'building', name: 'THE BUILDING (intercom)', text }], { onDone, critical })
  }

  toast(text: string) { this.hud.toast(text) }

  // --- Objectives ------------------------------------------------------------
  objectivePing: [number, number] | null = null
  objectiveRoom: RoomId | null = null
  private waypoint: THREE.Group | null = null
  private greeted = new Set<RoomId>()

  setObjective(text: string, hint: string, ping: [number, number] | null = null, silent = false, where = '', room: RoomId | null = null) {
    this.hud.setObjective(text, hint, silent, where)
    this.objectivePing = ping
    this.objectiveRoom = room ?? (ping ? this.roomAt(ping[0], ping[1]) : null)
    // minimap active states
    for (const [id, st] of this.minimap.states) {
      st.active = ping !== null && this.objectiveRoom === id
    }
  }

  // Corridor-side spot just outside a room's door — where the beacon leads you.
  private doorPing(id: RoomId): [number, number] {
    const def = ROOMS.find((r) => r.id === id)!
    const d = def.door
    if (d.facing === 'W') return [d.x + 0.7, d.z]
    if (d.facing === 'E') return [d.x - 0.7, d.z]
    if (d.facing === 'N') return [d.x, d.z + 0.7]
    return [d.x, d.z - 0.7]
  }

  private ensureWaypoint() {
    if (this.waypoint) return
    const grp = new THREE.Group()
    const mat = new THREE.MeshBasicMaterial({ color: 0xf4581c, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false })
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 12), mat)
    cone.rotation.x = Math.PI
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 8, 24), mat)
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.32
    grp.add(cone, ring)
    grp.renderOrder = 999
    grp.visible = false
    this.scene.add(grp)
    this.waypoint = grp
  }

  private updateWaypoint(dt: number) {
    this.ensureWaypoint()
    const wp = this.waypoint!
    const ping = this.objectivePing
    if (!ping || this.phase !== 'PLAY' || this.finaleStarted || this.onRooftop) { wp.visible = false; return }
    const dist = Math.hypot(ping[0] - this.player.pos.x, ping[1] - this.player.pos.z)
    wp.visible = dist > 2.4
    const t = performance.now() / 1000
    wp.position.set(ping[0], 2.25 + Math.sin(t * 2.2) * 0.12, ping[1])
    wp.rotation.y += dt * 1.5
    // "leading light" rule: the target room's badge reader pulses green
    for (const [id, door] of this.world.doors) {
      const m = door.light.material as THREE.MeshStandardMaterial
      if (id === this.objectiveRoom && !door.locked) m.emissiveIntensity = 1.8 + Math.sin(t * 5) * 1.4
      else m.emissiveIntensity = 1.6
    }
  }

  // First time you enter a room, its ghost calls out so you know who to talk to.
  private autoGreet(room: RoomId) {
    if (this.greeted.has(room)) return
    const map: Partial<Record<RoomId, { id: string; name: string; line: string }>> = {
      serverRoom: { id: 'marcus', name: 'Marcus', line: D.marcus.greet[0] },
      meetingRoom: { id: 'priya', name: 'Priya', line: D.priya.greet[0] },
      archive: { id: 'ines', name: 'Ines', line: D.ines.greet[0] },
      breakRoom: { id: 'gary', name: 'Gary', line: D.gary.greet[1] },
      designStudio: { id: 'kit', name: 'Kit', line: D.kit.greet[0] },
      financeCorner: { id: 'beatriz', name: 'Beatriz', line: D.beatriz.greet[0] }
    }
    const entry = map[room]
    if (!entry) return
    const ghost = this.ghosts.find((g) => g.def.id === entry.id && !g.released && !g.releasing)
    if (!ghost) return
    this.greeted.add(room)
    setTimeout(() => {
      if (this.dialogue.active || this.currentRoom !== room) return
      this.say([{ speaker: entry.id, name: entry.name.toUpperCase(), text: entry.line, anchor: ghost.rig.head }], {
        ghost, frame: false, onDone: () => this.toast(D.ui.greetPrompt(entry.name))
      })
    }, 1100)
  }

  private roomAt(x: number, z: number): RoomId {
    return this.world.currentRoom(new THREE.Vector3(x, 0, z))
  }

  // Default routing: nearest unfinished unlocked room (spec §6.3)
  refreshObjective() {
    const remaining = FRAGMENTS.filter((f) => !this.fragments.includes(f.id))
    if (!remaining.length) {
      this.setObjective(D.ui.objectives.badgeOut, D.ui.hints.lobby, [0, 9.5], false, D.ui.where.lobby)
      return
    }
    const unlocked = remaining.filter((f) => this.roomUnlocked(f.room))
    const pickList = unlocked.length ? unlocked : remaining
    let best = pickList[0]
    let bestD = Infinity
    for (const f of pickList) {
      const def = ROOMS.find((r) => r.id === f.room)!
      const cx = (def.rect[0] + def.rect[2]) / 2, cz = (def.rect[1] + def.rect[3]) / 2
      const d = Math.hypot(cx - this.player.pos.x, cz - this.player.pos.z)
      if (d < bestD) { bestD = d; best = f }
    }
    const map: Record<string, [string, string]> = {
      serverRoom: [D.ui.objectives.server, D.ui.hints.server],
      meetingRoom: [D.ui.objectives.meeting, D.ui.hints.meeting],
      archive: [D.ui.objectives.archive, D.ui.hints.archive],
      breakRoom: [D.ui.objectives.breakRoom, D.ui.hints.breakRoom],
      designStudio: [D.ui.objectives.design, D.ui.hints.design],
      financeCorner: [D.ui.objectives.finance, D.ui.hints.finance],
      rooftop: [D.ui.objectives.rooftop, D.ui.hints.rooftop]
    }
    const [text, hint] = map[best.room]
    // beacon at the room's door, plus plain-language directions on the note
    this.setObjective(text, hint, this.doorPing(best.room), false, D.ui.where[best.room] ?? '', best.room)
  }

  roomUnlocked(id: RoomId): boolean {
    const def = ROOMS.find((r) => r.id === id)!
    return this.fragments.length >= def.unlockAt
  }

  requestHint() {
    this.hintsUsed++
    this.hud.flipHint()
    if (this.objectivePing) this.minimap.pingAt(this.objectivePing[0], this.objectivePing[1])
    this.saveNow()
  }

  // --- Fragments -------------------------------------------------------------
  collectFragment(id: FragmentId, from: THREE.Vector3, onDone?: () => void) {
    if (this.fragments.includes(id)) { onDone?.(); return }
    const shard = makeShard()
    shard.position.copy(from).add(new THREE.Vector3(0, 1.2, 0))
    this.scene.add(shard)
    this.player.locked = true
    this.collectSeq = { shard, t: 0, from: from.clone(), id, onDone }
    audio.sfx('ghostExhale')
  }

  private finishCollect() {
    const seq = this.collectSeq!
    this.collectSeq = null
    this.scene.remove(seq.shard)
    const prevTier = lanyardTier(this.fragments.length)
    this.fragments.push(seq.id)
    const frag = FRAGMENTS.find((f) => f.id === seq.id)!
    this.hud.setFragments(this.fragments)
    this.toast(D.ui.toastFragment(frag.name))
    audio.sfx('shimmer')
    const newTier = lanyardTier(this.fragments.length)
    if (newTier !== prevTier) {
      this.player.char.setLanyardTier(newTier)
      this.toast(D.ui.toastLanyard[Math.min(newTier - 1, D.ui.toastLanyard.length - 1)])
    }
    const st = this.minimap.states.get(frag.room)
    if (st) { st.completed = true; st.active = false }
    // warmth steps (spec §9.1)
    const n = this.fragments.length
    if (n >= 5) this.world.setWarmthTarget(0.75)
    else if (n >= 3) this.world.setWarmthTarget(0.45)
    else if (n >= 1) this.world.setWarmthTarget(0.15)
    this.player.locked = false
    this.unlockRooms()
    this.refreshObjective()
    this.saveNow()
    // Building speaks after odd fragments
    const line = this.buildingOddLines[n]
    const done = seq.onDone
    if (line) {
      setTimeout(() => { if (!this.dialogue.active) this.intercom(line, done) }, 900)
    } else if (n === 6) {
      setTimeout(() => { if (!this.dialogue.active) this.intercom(D.building.preRooftop, done) }, 900)
    } else {
      done?.()
    }
  }

  unlockRooms() {
    const n = this.fragments.length
    const announcements: [string, RoomId[], string][] = [
      ['archive', ['archive'], D.doris.unlocks.archive],
      ['breakDesign', ['breakRoom', 'designStudio'], D.doris.unlocks.breakDesign],
      ['finance', ['financeCorner'], D.doris.unlocks.finance],
      ['rooftop', ['rooftop'], D.doris.unlocks.rooftop],
      ['lift', ['lift'], D.doris.unlocks.lift]
    ]
    for (const def of ROOMS) {
      if (def.unlockAt > 0 && n >= def.unlockAt) {
        const door = this.world.doors.get(def.id)
        if (door && door.locked && (def.id !== 'lift' || this.finaleReady())) {
          door.setLocked(false)
        } else if (door && door.locked && def.id === 'lift') {
          // lift stays physically locked until finale badge-out interaction
        }
        const st = this.minimap.states.get(def.id)
        if (st) { st.locked = false; st.discovered = true }
      }
    }
    for (const [key, ids, line] of announcements) {
      const needed = Math.min(...ids.map((id) => ROOMS.find((r) => r.id === id)!.unlockAt))
      if (n >= needed && !this.announcedUnlocks.has(key)) {
        this.announcedUnlocks.add(key)
        if (this.flags.has('metDoris')) {
          setTimeout(() => {
            if (!this.dialogue.active) {
              this.say([{ speaker: 'doris', name: 'DORIS (desk mic)', text: line }])
            } else {
              this.toast('Doris: ' + line)
            }
          }, 5200)
        }
      }
    }
  }

  finaleReady(): boolean { return this.fragments.length >= 7 }

  // --- Rooftop travel --------------------------------------------------------
  gotoRooftop() {
    this.fadeScreen(() => {
      this.player.teleport(ROOFTOP_SPAWN.x, ROOFTOP_SPAWN.z, Math.PI)
      this.onRooftop = true
      this.camRig.snapTo(this.player.pos)
      audio.setAmbient('rooftop', this.world.warmth)
      audio.setMusic('rooftop')
    })
  }
  leaveRooftop() {
    this.fadeScreen(() => {
      this.player.teleport(ROOFTOP_EXIT.x, ROOFTOP_EXIT.z, Math.PI)
      this.onRooftop = false
      this.camRig.snapTo(this.player.pos)
      audio.setMusic('off')
      // full warmth for the walk back (spec §8.8)
      this.world.setWarmthTarget(1)
      this.setObjective(D.ui.objectives.badgeOut, D.ui.hints.lobby, [0, 8])
    })
  }

  // --- Save ------------------------------------------------------------------
  saveNow() {
    const data: SaveData = {
      v: 1,
      fragments: [...this.fragments],
      solved: [...this.flags],
      duck: this.duck,
      pen: this.pen,
      room: this.currentRoom,
      playtime: this.playtime,
      hintsUsed: this.hintsUsed,
      sandwichAttempts: this.sandwichAttempts
    }
    writeSave(data)
  }

  restoreFrom(save: SaveData) {
    this.fragments = [...save.fragments] as FragmentId[]
    this.flags = new Set(save.solved)
    // save-integrity: a room flagged solved always yields its fragment (spec §28)
    const flagFrag: [string, FragmentId][] = [
      ['serverSolved', 'uptime'], ['meetingSolved', 'alignment'], ['archiveSolved', 'memory'],
      ['designSolved', 'taste'], ['breakSolved', 'care'], ['financeSolved', 'balance']
    ]
    for (const [flag, frag] of flagFrag) {
      if (this.flags.has(flag) && !this.fragments.includes(frag)) this.fragments.push(frag)
    }
    this.duck = save.duck
    this.pen = save.pen
    this.playtime = save.playtime
    this.hintsUsed = save.hintsUsed
    this.sandwichAttempts = save.sandwichAttempts
    this.currentRoom = save.room
    this.hud.setFragments(this.fragments)
    this.player.char.setLanyardTier(lanyardTier(this.fragments.length))
    if (this.duck === 'held' || this.duck === 'reconciled') this.player.char.giveDuck()
    if (this.duck === 'reconciled') this.player.char.duckGlow()
    if (this.pen) this.hud.neatHandwriting = true
    const n = this.fragments.length
    if (n >= 7) this.world.setWarmthTarget(1)
    else if (n >= 5) this.world.setWarmthTarget(0.75)
    else if (n >= 3) this.world.setWarmthTarget(0.45)
    else if (n >= 1) this.world.setWarmthTarget(0.15)
    for (const f of FRAGMENTS) {
      const st = this.minimap.states.get(f.room)
      if (st && this.fragments.includes(f.id)) { st.completed = true }
    }
    // mark unlock announcements already made
    if (n >= 2) this.announcedUnlocks.add('archive')
    if (n >= 3) this.announcedUnlocks.add('breakDesign')
    if (n >= 5) this.announcedUnlocks.add('finance')
    if (n >= 6) this.announcedUnlocks.add('rooftop')
    if (n >= 7) this.announcedUnlocks.add('lift')
    this.unlockRooms()
    // spawn point: room door-ish
    const def = ROOMS.find((r) => r.id === save.room)!
    if (save.room === 'rooftop') {
      this.player.teleport(ROOFTOP_SPAWN.x, ROOFTOP_SPAWN.z, Math.PI)
      this.onRooftop = true
    } else if (save.room === 'lobby' || save.room === 'lift') {
      this.player.teleport(0, 8, Math.PI)
    } else if (save.room === 'corridor') {
      this.player.teleport(0, -4, Math.PI)
    } else {
      const cx = (def.rect[0] + def.rect[2]) / 2
      const cz = (def.rect[1] + def.rect[3]) / 2
      this.player.teleport(cx, cz, 0)
    }
    this.camRig.snapTo(this.player.pos)
    this.refreshObjective()
  }

  newGame() {
    clearSave()
  }

  // --- Per-frame -------------------------------------------------------------
  update(dt: number) {
    this.playtime += dt
    // room change detection
    const room = this.onRooftop ? 'rooftop' as RoomId : this.world.currentRoom(this.player.pos)
    if (room !== this.currentRoom) {
      const prev = this.rooms.find((r) => r.id === this.currentRoom)
      prev?.onExit?.()
      this.currentRoom = room
      const st = this.minimap.states.get(room)
      if (st) st.discovered = true
      const mod = this.rooms.find((r) => r.id === room)
      mod?.onEnter?.()
      audio.setAmbient(room, this.world.warmth)
      this.autoGreet(room)
      this.saveNow()
    }
    for (const r of this.rooms) r.update?.(dt)
    for (const g of this.ghosts) g.update(dt)
    this.updateWaypoint(dt)

    // ghost look-at within 6m
    for (const g of this.ghosts) {
      if (g.released) continue
      const gp = new THREE.Vector3()
      g.group.getWorldPosition(gp)
      if (gp.distanceTo(this.player.pos) < 6) {
        g.lookTarget = this.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0))
      } else {
        g.lookTarget = null
      }
    }

    // fragment collect sequence
    if (this.collectSeq) {
      const seq = this.collectSeq
      seq.t += dt
      const s = seq.shard
      if (seq.t < 1.2) {
        s.position.y += dt * 0.8
        s.rotation.y += dt * 4
        if (seq.t < 0.1) audio.sfx('fragmentChime')
      } else if (seq.t < 3) {
        // arc toward a point in front-top-right of camera
        const cam = this.camRig.camera
        const target = cam.position.clone()
          .add(new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0).multiplyScalar(0.9))
          .add(new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1).multiplyScalar(0.55))
          .add(new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 2).multiplyScalar(-1.4))
        const k = (seq.t - 1.2) / 1.8
        s.position.lerp(target, Math.min(1, k * k * 3 * dt * 60 * 0.02 + dt * 5 * k))
        s.rotation.y += dt * 8
        s.scale.setScalar(1 - k * 0.6)
      } else {
        this.finishCollect()
      }
    }

    // player face relaxes as game warms (spec §19.2)
    const rig = this.player.char.rig
    if (!this.dialogue.active && this.collectSeq === null) {
      if (this.world.warmth < 0.3) { rig.browEmotion = -0.6; rig.setMouth('frown') }
      else if (this.world.warmth < 0.7) { rig.browEmotion = 0; rig.setMouth('neutral') }
      else { rig.browEmotion = 0.2; rig.setMouth('smile') }
    }

    // torch intensity ramps down as building warms
    this.player.char.torch.intensity = 22 * (1 - this.world.warmth * 0.75)
  }

  scare(kind: 'copier' | 'fans' | 'door' | 'chair') {
    if (this.settings.spookFree && (kind === 'copier' || kind === 'fans' || kind === 'door')) return
    this.rndr.scarePulse()
    this.player.char.rig.triggerStartle()
    this.camRig.doShake(0.008)
  }
}
