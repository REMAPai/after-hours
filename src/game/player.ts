// Player controller: movement, collision, held items, footsteps (spec §3, §25).
import * as THREE from 'three'
import { PLAYER } from '../config.ts'
import { PlayerCharacter } from '../characters/playerChar.ts'
import type { World } from './world.ts'
import type { Input } from '../engine/input.ts'
import type { CameraRig } from '../engine/cameraRig.ts'
import { audio } from '../engine/audio.ts'

export interface HeldItem {
  id: string
  name: string
  mesh: THREE.Object3D
  origin: THREE.Object3D | null // parent to restore on put-back
}

export class Player {
  char = new PlayerCharacter()
  pos = new THREE.Vector3(0, 0, 11)
  vel = new THREE.Vector3()
  facing = Math.PI
  jogging = false
  moving = false
  locked = false // input lock during cinematics/dialogue
  held: HeldItem | null = null
  private stepTimer = 0
  lookTarget: THREE.Vector3 | null = null

  constructor(public world: World, scene: THREE.Scene) {
    scene.add(this.char.rig.root)
    this.char.rig.root.position.copy(this.pos)
    this.char.rig.root.rotation.y = this.facing
  }

  teleport(x: number, z: number, facing?: number) {
    this.pos.set(x, 0, z)
    this.vel.set(0, 0, 0)
    if (facing !== undefined) this.facing = facing
    this.char.rig.root.position.copy(this.pos)
  }

  hold(item: HeldItem, hud?: { toast: (t: string) => void }) {
    if (this.held) {
      this.putBack()
      hud?.toast(`Swapped to: ${item.name}`)
    }
    this.held = item
    item.mesh.userData.prevParent = item.mesh.parent
    item.mesh.userData.prevPos = item.mesh.position.clone()
    item.mesh.userData.prevRot = item.mesh.rotation.clone()
    item.mesh.userData.prevScale = item.mesh.scale.clone()
    this.char.rig.handR.add(item.mesh)
    item.mesh.position.set(0, -0.08, 0.06)
    item.mesh.rotation.set(0, 0, 0)
    this.char.rig.triggerInteract()
  }

  putBack() {
    const item = this.held
    if (!item) return
    this.held = null
    const prev = item.mesh.userData.prevParent as THREE.Object3D | null
    if (prev) {
      prev.add(item.mesh)
      item.mesh.position.copy(item.mesh.userData.prevPos)
      item.mesh.rotation.copy(item.mesh.userData.prevRot)
      item.mesh.scale.copy(item.mesh.userData.prevScale)
    } else {
      item.mesh.removeFromParent()
    }
  }

  consumeHeld() {
    const item = this.held
    if (!item) return
    this.held = null
    item.mesh.removeFromParent()
  }

  update(dt: number, input: Input, camRig: CameraRig) {
    const rig = this.char.rig
    let mvx = 0, mvy = 0, jog = false
    if (!this.locked) {
      const mv = input.moveVector()
      mvx = mv.x; mvy = mv.y; jog = mv.jog
    }
    const wish = new THREE.Vector3()
    if (mvx !== 0 || mvy !== 0) {
      const f = camRig.forward(), r = camRig.right()
      wish.addScaledVector(f, mvy).addScaledVector(r, mvx)
      wish.normalize()
    }
    this.jogging = jog && wish.lengthSq() > 0
    const targetSpeed = this.jogging ? PLAYER.jogSpeed : PLAYER.walkSpeed
    const targetVel = wish.multiplyScalar(wish.lengthSq() > 0 ? targetSpeed : 0)
    // acceleration; near-instant stop
    const accel = targetVel.lengthSq() > 0 ? PLAYER.accel : PLAYER.accel * 3
    this.vel.x += THREE.MathUtils.clamp(targetVel.x - this.vel.x, -accel * dt, accel * dt)
    this.vel.z += THREE.MathUtils.clamp(targetVel.z - this.vel.z, -accel * dt, accel * dt)

    const next = this.pos.clone().addScaledVector(this.vel, dt)
    const resolved = this.world.collide(next, PLAYER.radius)
    const actualDelta = resolved.clone().sub(this.pos)
    this.pos.copy(resolved)
    const speed = actualDelta.length() / Math.max(dt, 1e-5)
    this.moving = speed > 0.2

    // facing: slerp toward movement dir
    if (this.moving && actualDelta.lengthSq() > 1e-8) {
      const targetFacing = Math.atan2(actualDelta.x, actualDelta.z)
      let diff = targetFacing - this.facing
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      // eased turn: fast to start, settles softly near the target heading
      const maxTurn = PLAYER.turnRate * dt
      this.facing += THREE.MathUtils.clamp(diff * Math.min(1, dt * 14), -maxTurn, maxTurn)
    }

    rig.root.position.copy(this.pos)
    rig.root.rotation.y = this.facing
    rig.speed = speed
    rig.state = this.moving ? (this.jogging ? 'jog' : 'walk') : 'idle'
    rig.update(dt, this.lookTarget, false)

    // footsteps
    if (this.moving) {
      this.stepTimer -= dt
      if (this.stepTimer <= 0) {
        this.stepTimer = this.jogging ? 0.3 : 0.45
        audio.sfx('footstep')
      }
    } else {
      this.stepTimer = 0.1
    }
  }

  // Fade player when camera is very close (spec §3.4)
  updateVisibility(camPos: THREE.Vector3) {
    const d = camPos.distanceTo(this.pos.clone().add(new THREE.Vector3(0, 1.4, 0)))
    const targetOpacity = d < 1 ? 0.3 : 1
    this.char.rig.root.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial
      if (m && 'opacity' in m && !(o as THREE.Mesh).userData.keepOpacity) {
        m.transparent = targetOpacity < 1
        m.opacity = targetOpacity
      }
    })
  }
}
