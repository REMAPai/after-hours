// Minimap styled as a fire-evacuation floor plan (spec §7).
import { ROOMS, type RoomId } from '../config.ts'

interface RoomState {
  locked: boolean
  completed: boolean
  active: boolean
  discovered: boolean
}

export class Minimap {
  private canvas: HTMLCanvasElement
  private bigCanvas: HTMLCanvasElement
  private bigWrap: HTMLDivElement
  private logEl: HTMLDivElement
  enlarged = false
  private ping: { x: number; z: number; t: number } | null = null
  states = new Map<RoomId, RoomState>()
  cbSafe = false
  private t = 0
  getLog: () => { name: string; text: string }[] = () => []

  constructor(uiRoot: HTMLElement) {
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'minimap'
    this.canvas.width = 180
    this.canvas.height = 180
    uiRoot.appendChild(this.canvas)

    this.bigWrap = document.createElement('div')
    this.bigWrap.className = 'minimap-big-wrap'
    this.bigWrap.style.display = 'none'
    this.bigCanvas = document.createElement('canvas')
    this.bigCanvas.width = 640
    this.bigCanvas.height = 640
    const title = document.createElement('div')
    title.className = 'minimap-title'
    title.textContent = 'FIRE EVACUATION PLAN — YOU ARE HERE →'
    this.logEl = document.createElement('div')
    this.logEl.className = 'minimap-log'
    this.bigWrap.append(title, this.bigCanvas, this.logEl)
    uiRoot.appendChild(this.bigWrap)

    for (const r of ROOMS) {
      this.states.set(r.id, { locked: r.unlockAt > 0, completed: false, active: false, discovered: r.unlockAt === 0 })
    }
  }

  toggleEnlarged(): boolean {
    this.enlarged = !this.enlarged
    this.bigWrap.style.display = this.enlarged ? 'flex' : 'none'
    if (this.enlarged) {
      const log = this.getLog()
      this.logEl.innerHTML = '<b>MEETING MINUTES (last 30 lines)</b><br>' +
        log.map((l) => `<i>${l.name}:</i> ${escapeHtml(l.text)}`).join('<br>')
      this.logEl.scrollTop = this.logEl.scrollHeight
    }
    return this.enlarged
  }

  pingAt(x: number, z: number) {
    this.ping = { x, z, t: 0 }
  }

  hide(h: boolean) {
    this.canvas.style.display = h ? 'none' : 'block'
    if (h && this.enlarged) this.toggleEnlarged()
  }

  update(dt: number, px: number, pz: number, facing: number, currentRoom: RoomId) {
    this.t += dt
    if (this.ping) { this.ping.t += dt; if (this.ping.t > 3) this.ping = null }
    this.draw(this.canvas, px, pz, facing, currentRoom, false)
    if (this.enlarged) this.draw(this.bigCanvas, px, pz, facing, currentRoom, true)
  }

  // Maps world coords (x: -13..13, z: -41..15) to canvas. Rooftop drawn inset.
  private draw(c: HTMLCanvasElement, px: number, pz: number, facing: number, currentRoom: RoomId, big: boolean) {
    const g = c.getContext('2d')!
    const W = c.width, H = c.height
    g.clearRect(0, 0, W, H)
    g.fillStyle = 'rgba(240, 236, 224, 0.92)'
    g.beginPath()
    g.roundRect(0, 0, W, H, 10)
    g.fill()
    g.strokeStyle = '#b02020'
    g.lineWidth = big ? 4 : 2
    g.strokeRect(3, 3, W - 6, H - 6)

    const worldToMap = (x: number, z: number): [number, number] => {
      // main building x -13..13 → margin..W-margin ; z -42..15
      const mx = ((x + 13) / 26) * (W * 0.86) + W * 0.07
      const mz = ((z + 42) / 57) * (H * 0.86) + H * 0.07
      return [mx, mz]
    }

    for (const r of ROOMS) {
      const st = this.states.get(r.id)!
      if (!st.discovered && st.locked) {
        // still draw outline greyed with padlock
      }
      let [x0, z0] = worldToMap(r.rect[0], r.rect[1])
      let [x1, z1] = worldToMap(r.rect[2], r.rect[3])
      if (r.id === 'rooftop') {
        // inset top-right
        x0 = W * 0.72; z0 = H * 0.04; x1 = W * 0.96; z1 = H * 0.16
      }
      const w = x1 - x0, h = z1 - z0
      // fill
      if (st.completed) {
        g.fillStyle = this.cbSafe ? 'rgba(60,110,200,0.25)' : 'rgba(90,160,90,0.3)'
        g.fillRect(x0, z0, w, h)
      } else if (r.id === currentRoom) {
        g.fillStyle = 'rgba(180,170,140,0.35)'
        g.fillRect(x0, z0, w, h)
      }
      // outline
      if (st.locked) {
        g.strokeStyle = '#999'
        g.setLineDash(this.cbSafe ? [2, 4] : [])
        g.lineWidth = 1.5
      } else if (st.active) {
        g.strokeStyle = this.cbSafe ? '#3355cc' : '#c07820'
        g.setLineDash([5, 4])
        g.lineDashOffset = -this.t * 12
        g.lineWidth = big ? 3 : 2
      } else if (!st.completed) {
        const pulse = 0.55 + Math.sin(this.t * 2.4) * 0.25
        g.strokeStyle = `rgba(60,80,120,${pulse})`
        g.setLineDash([])
        g.lineWidth = big ? 2.5 : 1.8
      } else {
        g.strokeStyle = '#557755'
        g.setLineDash([])
        g.lineWidth = 1.5
      }
      g.strokeRect(x0, z0, w, h)
      g.setLineDash([])
      // padlock / fragment glyph / ghost dot
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      if (st.locked) {
        g.fillStyle = '#888'
        g.font = `${big ? 16 : 9}px Arial`
        g.fillText('🔒', x0 + w / 2, z0 + h / 2)
      } else if (st.completed) {
        g.fillStyle = this.cbSafe ? '#3355cc' : '#557755'
        g.font = `${big ? 15 : 9}px Arial`
        g.fillText('✦', x0 + w / 2, z0 + h / 2)
      } else if (st.discovered && r.id !== 'corridor' && r.id !== 'lobby' && r.id !== 'lift') {
        g.fillStyle = '#8888aa'
        g.font = `${big ? 14 : 8}px Arial`
        g.fillText('👻', x0 + w / 2, z0 + h / 2)
      }
      if (big) {
        g.fillStyle = '#333'
        g.font = 'bold 13px Arial'
        g.fillText(r.name.toUpperCase(), x0 + w / 2, z0 + Math.min(h - 8, 12))
      }
    }

    // hint ping
    if (this.ping) {
      const [mx, mz] = worldToMap(this.ping.x, this.ping.z)
      const rr = (this.ping.t % 1) * (big ? 40 : 20)
      g.strokeStyle = `rgba(200,60,40,${1 - (this.ping.t % 1)})`
      g.lineWidth = 2
      g.beginPath()
      g.arc(mx, mz, rr, 0, Math.PI * 2)
      g.stroke()
    }

    // player arrow (north-up fixed)
    let [pxm, pzm] = worldToMap(px, pz)
    if (currentRoom === 'rooftop') { pxm = W * 0.84; pzm = H * 0.1 }
    g.save()
    g.translate(pxm, pzm)
    g.rotate(facing + Math.PI)
    g.fillStyle = '#c02818'
    g.beginPath()
    g.moveTo(0, -(big ? 9 : 5.5))
    g.lineTo(big ? 6 : 4, big ? 7 : 4.5)
    g.lineTo(-(big ? 6 : 4), big ? 7 : 4.5)
    g.closePath()
    g.fill()
    g.restore()

    // "YOU ARE HERE"
    if (!big) {
      g.fillStyle = '#b02020'
      g.font = 'bold 8px Arial'
      g.textAlign = 'left'
      g.fillText('YOU ARE HERE', 8, H - 9)
      g.beginPath()
      g.moveTo(70, H - 12)
      g.lineTo(pxm - 4, pzm + 4)
      g.strokeStyle = 'rgba(176,32,32,0.4)'
      g.lineWidth = 1
      g.stroke()
    }
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
