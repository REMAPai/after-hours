// LIFT — interior dressing (spec §24). The finale itself runs from lobby.ts.
import * as THREE from 'three'
import type { Game, RoomModule } from '../game/game.ts'
import { D } from '../data/dialogue.ts'
import { box, std } from './props.ts'
import { logoTexture, makeLabelTexture } from '../engine/textures.ts'

export function buildLift(game: Game): RoomModule {
  const g = new THREE.Group()
  game.scene.add(g)
  const cx = 8.7, cz = 5.7

  // warm interior panel light
  const panel = box(1.2, 0.05, 1.2, std(0xffffff, { emissive: 0xfff4e0, emissiveIntensity: 1.4 }), cx, 2.9, cz)
  g.add(panel)
  const pl = new THREE.PointLight(0xfff4e0, 5, 5)
  pl.position.set(cx, 2.4, cz)
  g.add(pl)

  // floor indicator + buttons
  const indicator = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.12), std(0x100800, { emissive: 0xff9a30, emissiveIntensity: 1.6 }))
  indicator.position.set(cx, 2.3, cz - 1.62)
  g.add(indicator)
  const buttons = box(0.12, 0.4, 0.04, std(0x3a4048, { metal: 0.5, rough: 0.4 }), cx + 1.5, 1.3, cz + 0.5)
  g.add(buttons)

  // mirror (fake): dark reflective plane
  const mirror = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 1.6),
    new THREE.MeshPhysicalMaterial({ color: 0x8a9098, metalness: 1, roughness: 0.08 })
  )
  mirror.position.set(cx + 1.63, 1.6, cz)
  mirror.rotation.y = -Math.PI / 2
  g.add(mirror)
  game.interact.add({ id: 'lift-mirror', position: new THREE.Vector3(cx + 1.2, 1.5, cz), verb: 'Check the mirror', mesh: mirror, onInteract: () => game.toast(D.toasts.lift.mirror) })

  // inspection cert + emergency phone
  const cert = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.22), new THREE.MeshStandardMaterial({
    map: makeLabelTexture('LIFT CERT.\nlast inspected:\nnever', { w: 128, h: 96, bg: '#f0ecdc', fg: '#555' })
  }))
  cert.position.set(cx, 1.7, cz + 1.62)
  cert.rotation.y = Math.PI
  g.add(cert)
  game.interact.add({ id: 'lift-cert', position: new THREE.Vector3(cx, 1.6, cz + 1.2), verb: 'Read certificate', mesh: cert, onInteract: () => game.toast(D.toasts.lift.cert) })
  const phone = box(0.16, 0.24, 0.08, std(0xaa3030, { rough: 0.5 }), cx - 0.6, 1.2, cz + 1.6)
  g.add(phone)
  game.interact.add({ id: 'lift-phone', position: new THREE.Vector3(cx - 0.6, 1.2, cz + 1.2), verb: 'Inspect emergency phone', mesh: phone, onInteract: () => game.toast(D.toasts.lift.phone) })

  // logo panel inside once canon
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.8),
    new THREE.MeshStandardMaterial({ map: logoTexture('#F4581C', false), transparent: true, opacity: 0 })
  )
  logo.position.set(cx, 1.7, cz - 1.6)
  g.add(logo)

  return {
    id: 'lift',
    update: () => {
      const m = logo.material as THREE.MeshStandardMaterial
      m.opacity = game.flags.has('logoCanon') ? 1 : 0
    }
  }
}
