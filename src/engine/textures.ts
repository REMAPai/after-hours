// Canvas-generated textures: labels, posters, badges, sticky notes (spec §2.2, §24).
import * as THREE from 'three'

const cache = new Map<string, THREE.CanvasTexture>()

export interface LabelStyle {
  w?: number; h?: number
  bg?: string; fg?: string
  font?: string
  pad?: number
  align?: CanvasTextAlign
  hand?: boolean
  border?: string
}

export function makeLabelTexture(text: string, style: LabelStyle = {}): THREE.CanvasTexture {
  const key = text + JSON.stringify(style)
  const hit = cache.get(key)
  if (hit) return hit
  const w = style.w ?? 256, h = style.h ?? 128
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const g = c.getContext('2d')!
  g.fillStyle = style.bg ?? '#f5f0e6'
  g.fillRect(0, 0, w, h)
  if (style.border) {
    g.strokeStyle = style.border
    g.lineWidth = 6
    g.strokeRect(3, 3, w - 6, h - 6)
  }
  g.fillStyle = style.fg ?? '#22262e'
  const fontSize = style.font ?? `${Math.floor(h / 4)}px`
  g.font = `${style.hand ? 'italic ' : ''}bold ${fontSize} ${style.hand ? '"Comic Sans MS", "Segoe Print", cursive' : 'Arial, sans-serif'}`
  g.textAlign = style.align ?? 'center'
  g.textBaseline = 'middle'
  const lines = text.split('\n')
  const lh = h / (lines.length + 1)
  lines.forEach((line, i) => {
    g.fillText(line, style.align === 'left' ? (style.pad ?? 12) : w / 2, lh * (i + 1), w - 16)
  })
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  cache.set(key, tex)
  return tex
}

export function makeScreenTexture(draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w = 256, h = 160): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const g = c.getContext('2d')!
  draw(g, w, h)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// The official Remap.ai logo, recreated as canvas vectors from the brand image:
// an angular black glyph (two crossing italic bars, the lower-left arm in orange)
// followed by the "Remap.ai" wordmark with an orange dot.
export const BRAND_INK = '#1c1c1e'
export const BRAND_ORANGE = '#F4581C'

// 7 pieces (HUD fragment fill-in): 1 glyph black · 2 glyph orange accent ·
// 3-7 the letters R e m a p. ".ai" appears once all 7 are present.
export function drawRemapLogo(
  g: CanvasRenderingContext2D, x: number, y: number, size: number,
  color = BRAND_INK, pieces = 7, accent = BRAND_ORANGE
) {
  g.save()
  g.translate(x, y)
  const s = size * 0.26 // glyph half-extent
  const gy = -size * 0.2 // glyph centre sits above the wordmark
  const t = size * 0.13  // bar thickness
  const slant = s * 0.22 // italic lean
  g.lineCap = 'butt'
  g.lineWidth = t
  const bar = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    g.strokeStyle = c
    g.beginPath()
    g.moveTo(x0, gy + y0)
    g.lineTo(x1, gy + y1)
    g.stroke()
  }
  if (pieces >= 1) {
    // black: full "\" bar + upper-right arm of the "/" bar (gap at the crossing)
    bar(-s + slant, -s, s - slant, s, color)
    bar(s * 0.16, s * 0.16 - slant * 0.3, s + slant, -s, color)
  }
  if (pieces >= 2) {
    // orange: detached lower-left arm of the "/" bar
    bar(-s - slant * 0.4, s, -s * 0.28, s * 0.34, accent)
  }
  // Wordmark: letters fill in piece by piece
  const letters = ['R', 'e', 'm', 'a', 'p']
  const fs = size * 0.34
  g.font = `bold ${fs}px Arial, sans-serif`
  g.textBaseline = 'middle'
  g.textAlign = 'left'
  const suffix = '.ai'
  const totalW = g.measureText('Remap').width + (pieces >= 7 ? g.measureText(suffix).width : 0)
  let lx = -totalW / 2
  const ly = size * 0.32
  for (let i = 0; i < letters.length; i++) {
    if (pieces >= 3 + i) {
      g.fillStyle = color
      g.fillText(letters[i], lx, ly)
    }
    lx += g.measureText(letters[i]).width
  }
  if (pieces >= 7) {
    g.fillStyle = accent
    g.fillText('.', lx, ly)
    lx += g.measureText('.').width
    g.fillStyle = color
    g.fillText('ai', lx, ly)
  }
  g.restore()
}

export function logoTexture(color = BRAND_ORANGE, withWordmark = true): THREE.CanvasTexture {
  return makeScreenTexture((g, w, h) => {
    g.clearRect(0, 0, w, h)
    if (withWordmark) {
      // full lockup on a light card — official dark-on-light colourway
      g.fillStyle = '#f6f3ec'
      g.fillRect(0, 0, w, h)
      drawRemapLogo(g, w / 2, h / 2, h * 0.7, BRAND_INK, 7, BRAND_ORANGE)
    } else {
      // glyph only, tinted (finale/lift glow panels) — transparent background
      g.save()
      g.translate(w / 2, h / 2)
      const s = h * 0.3, t = h * 0.15, slant = s * 0.22
      g.lineCap = 'butt'
      g.lineWidth = t
      g.strokeStyle = color
      g.beginPath(); g.moveTo(-s + slant, -s); g.lineTo(s - slant, s); g.stroke()
      g.beginPath(); g.moveTo(s * 0.16, s * 0.16); g.lineTo(s + slant, -s); g.stroke()
      g.strokeStyle = BRAND_ORANGE
      g.beginPath(); g.moveTo(-s - slant * 0.4, s); g.lineTo(-s * 0.28, s * 0.34); g.stroke()
      g.restore()
    }
  }, 256, 256)
}
