// Third-person over-the-right-shoulder camera with spring-arm collision (spec §3.4, §27).
import * as THREE from 'three'
import { CAMERA } from '../config.ts'

export class CameraRig {
  camera: THREE.PerspectiveCamera
  yaw = 0 // face north (-z) initially
  pitch = 0.08
  mode: 'follow' | 'dialogue' | 'cinematic' = 'follow'
  private targetPos = new THREE.Vector3()
  private curPos = new THREE.Vector3(0, 1.7, 3)
  private lookTarget = new THREE.Vector3()
  private curLook = new THREE.Vector3()
  private raycaster = new THREE.Raycaster()
  colliders: THREE.Object3D[] = []
  // dialogue framing
  private dlgAnchor = new THREE.Vector3()
  private dlgPlayer = new THREE.Vector3()
  // cinematic
  cinePos = new THREE.Vector3()
  cineLook = new THREE.Vector3()
  fovTarget = CAMERA.fovWalk
  shake = 0
  reduceMotion = false
  private t = 0

  constructor() {
    this.camera = new THREE.PerspectiveCamera(CAMERA.fovWalk, innerWidth / innerHeight, CAMERA.near, CAMERA.far)
    this.camera.position.copy(this.curPos)
  }

  addLook(dx: number, dy: number) {
    if (this.mode !== 'follow') return
    this.yaw -= dx
    this.pitch = THREE.MathUtils.clamp(this.pitch + dy, CAMERA.pitchMin, CAMERA.pitchMax)
  }

  // forward direction on ground plane
  forward(): THREE.Vector3 {
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
  }
  right(): THREE.Vector3 {
    // forward × up: true camera-right (A/D strafe + right-shoulder offset)
    return new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw))
  }

  startDialogue(playerPos: THREE.Vector3, speakerPos: THREE.Vector3) {
    this.mode = 'dialogue'
    this.dlgPlayer.copy(playerPos)
    this.dlgAnchor.copy(speakerPos)
  }
  endDialogue() {
    if (this.mode === 'dialogue') this.mode = 'follow'
  }
  startCinematic() { this.mode = 'cinematic'; this.cinePos.copy(this.camera.position); this.cineLook.copy(this.curLook) }
  endCinematic() { this.mode = 'follow' }

  update(dt: number, playerPos: THREE.Vector3, jogging: boolean) {
    this.t += dt
    const head = playerPos.clone().add(new THREE.Vector3(0, 1.45, 0))
    if (this.mode === 'follow') {
      const back = this.forward().multiplyScalar(-1)
      const dir = new THREE.Vector3(
        back.x * Math.cos(this.pitch),
        Math.sin(this.pitch),
        back.z * Math.cos(this.pitch)
      ).normalize()
      const shoulder = this.right().multiplyScalar(CAMERA.shoulder)
      const pivot = head.clone().add(shoulder)
      let dist = CAMERA.distance
      // spring-arm: raycast pivot -> desired
      if (this.colliders.length) {
        this.raycaster.set(pivot, dir)
        this.raycaster.far = dist + 0.25
        const hits = this.raycaster.intersectObjects(this.colliders, false)
        if (hits.length && hits[0].distance < dist + 0.25) {
          dist = Math.max(0.4, hits[0].distance - 0.25)
        }
      }
      this.targetPos.copy(pivot).addScaledVector(dir, dist)
      this.targetPos.y = Math.max(0.3, this.targetPos.y + (CAMERA.height - 1.45) * Math.cos(this.pitch) * 0.4)
      this.lookTarget.copy(pivot).addScaledVector(this.forward(), 1.4)
      const l = 1 - Math.pow(0.0003, dt) // ~ fast smooth
      this.curPos.lerp(this.targetPos, l)
      this.curLook.lerp(this.lookTarget, l)
      this.fovTarget = jogging ? CAMERA.fovJog : CAMERA.fovWalk
    } else if (this.mode === 'dialogue') {
      // over-shoulder two-shot: player lower-left, speaker upper-right
      const mid = this.dlgPlayer.clone().lerp(this.dlgAnchor, 0.42)
      const toSpeaker = this.dlgAnchor.clone().sub(this.dlgPlayer).setY(0).normalize()
      const side = new THREE.Vector3(-toSpeaker.z, 0, toSpeaker.x)
      const camPos = this.dlgPlayer.clone()
        .addScaledVector(toSpeaker, -1.2)
        .addScaledVector(side, 1.5)
        .add(new THREE.Vector3(0, 1.55, 0))
      this.targetPos.copy(camPos)
      this.lookTarget.copy(mid).add(new THREE.Vector3(0, 1.35, 0))
      const l = 1 - Math.pow(0.02, dt)
      this.curPos.lerp(this.targetPos, l)
      this.curLook.lerp(this.lookTarget, l)
      this.fovTarget = 48
    } else {
      // cinematic: externally driven
      const l = 1 - Math.pow(0.02, dt)
      this.curPos.lerp(this.cinePos, l)
      this.curLook.lerp(this.cineLook, l)
    }
    // jog sway + screen shake
    let sway = new THREE.Vector3()
    if (!this.reduceMotion) {
      if (jogging && this.mode === 'follow') {
        sway.set(Math.sin(this.t * 9) * 0.02, Math.abs(Math.sin(this.t * 9)) * 0.025, 0)
      }
      if (this.shake > 0) {
        sway.add(new THREE.Vector3((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake, 0))
        this.shake = Math.max(0, this.shake - dt * 0.03)
      }
    } else {
      this.shake = 0
    }
    this.camera.position.copy(this.curPos).add(sway)
    this.camera.lookAt(this.curLook)
    this.camera.fov += (this.fovTarget - this.camera.fov) * Math.min(1, dt * 3)
    this.camera.updateProjectionMatrix()
  }

  doShake(amount = 0.005) { if (!this.reduceMotion) this.shake = amount }

  snapTo(playerPos: THREE.Vector3) {
    const head = playerPos.clone().add(new THREE.Vector3(0, 1.45, 0))
    const back = this.forward().multiplyScalar(-CAMERA.distance)
    this.curPos.copy(head).add(back).add(new THREE.Vector3(0, 0.4, 0))
    this.curLook.copy(head)
    this.camera.position.copy(this.curPos)
    this.camera.lookAt(this.curLook)
  }
}
