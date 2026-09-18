// All tunables in one place (spec §2.3).

export const PLAYER = {
  walkSpeed: 2.6, // opened up per playtest — longer, freer strides
  jogSpeed: 4.6,
  accel: 12,
  radius: 0.36,
  height: 1.72,
  turnRate: (720 * Math.PI) / 180 // rad/s
}

export const CAMERA = {
  distance: 3.2,
  height: 1.7,
  shoulder: 0.45,
  pitchMin: (-35 * Math.PI) / 180,
  pitchMax: (55 * Math.PI) / 180,
  lerp: 8,
  fovWalk: 55,
  fovJog: 60,
  near: 0.05,
  far: 120,
  sensitivity: 0.0022
}

export type WarmthPreset = 'COLD' | 'NEUTRAL' | 'WARM'

export const LIGHTING: Record<WarmthPreset, {
  hemiSky: number; hemiGround: number; hemiIntensity: number
  fogColor: number; fogDensity: number
  exposure: number; saturation: number; vignette: number
  bloomStrength: number
}> = {
  COLD: { hemiSky: 0x2b3345, hemiGround: 0x0b0d12, hemiIntensity: 2.2, fogColor: 0x0c1017, fogDensity: 0.02, exposure: 1.12, saturation: -0.18, vignette: 0.28, bloomStrength: 0.35 },
  NEUTRAL: { hemiSky: 0x4a4f5c, hemiGround: 0x1a1c22, hemiIntensity: 2.8, fogColor: 0x14161c, fogDensity: 0.011, exposure: 1.18, saturation: 0.0, vignette: 0.2, bloomStrength: 0.45 },
  WARM: { hemiSky: 0x8a6a4e, hemiGround: 0x2a2016, hemiIntensity: 3.4, fogColor: 0x241c12, fogDensity: 0.005, exposure: 1.28, saturation: 0.08, vignette: 0.14, bloomStrength: 0.55 }
}

export const REMAP_ORANGE = '#F4581C' // official brand accent

// --- World layout ---------------------------------------------------------
// Corridor runs north (+z is south). Lobby at south end. Rooms branch west/east.
// Units in metres. Y-up. Ground at y=0.

export interface RoomDef {
  id: RoomId
  name: string
  fragment?: FragmentId
  // Floor rect: [minX, minZ, maxX, maxZ]
  rect: [number, number, number, number]
  door: { x: number; z: number; facing: 'N' | 'S' | 'E' | 'W' }
  unlockAt: number // fragments needed
}

export type RoomId =
  | 'lobby' | 'corridor' | 'serverRoom' | 'meetingRoom' | 'archive'
  | 'breakRoom' | 'designStudio' | 'financeCorner' | 'rooftop' | 'lift'

export type FragmentId = 'uptime' | 'alignment' | 'memory' | 'taste' | 'care' | 'balance' | 'purpose'

export const FRAGMENTS: { id: FragmentId; name: string; room: RoomId }[] = [
  { id: 'uptime', name: 'Uptime', room: 'serverRoom' },
  { id: 'alignment', name: 'Alignment', room: 'meetingRoom' },
  { id: 'memory', name: 'Memory', room: 'archive' },
  { id: 'taste', name: 'Taste', room: 'designStudio' },
  { id: 'care', name: 'Care', room: 'breakRoom' },
  { id: 'balance', name: 'Balance', room: 'financeCorner' },
  { id: 'purpose', name: 'Purpose', room: 'rooftop' }
]

// Corridor: x in [-1.5, 1.5], z from -40 (north end) to 0 (lobby mouth).
export const ROOMS: RoomDef[] = [
  { id: 'lobby', name: 'Lobby', rect: [-7, 0, 7, 14], door: { x: 0, z: 0, facing: 'N' }, unlockAt: 0 },
  { id: 'corridor', name: 'Main Corridor', rect: [-1.5, -40, 1.5, 0], door: { x: 0, z: 0, facing: 'N' }, unlockAt: 0 },
  { id: 'serverRoom', name: 'Server Room', rect: [-12.5, -38, -1.5, -28], door: { x: -1.5, z: -33, facing: 'W' }, unlockAt: 0 },
  { id: 'meetingRoom', name: 'Meeting Room', rect: [1.5, -38, 12.5, -28], door: { x: 1.5, z: -33, facing: 'E' }, unlockAt: 0 },
  { id: 'archive', name: 'Archive', rect: [-12.5, -26, -1.5, -16], door: { x: -1.5, z: -21, facing: 'W' }, unlockAt: 2 },
  { id: 'designStudio', name: 'Design Studio', rect: [1.5, -26, 12.5, -16], door: { x: 1.5, z: -21, facing: 'E' }, unlockAt: 3 },
  { id: 'breakRoom', name: 'Break Room', rect: [-12.5, -14, -1.5, -4], door: { x: -1.5, z: -9, facing: 'W' }, unlockAt: 3 },
  { id: 'financeCorner', name: 'Finance Corner', rect: [1.5, -14, 12.5, -4], door: { x: 1.5, z: -9, facing: 'E' }, unlockAt: 5 },
  // Rooftop is a separate area placed far away; entered via stairwell door at corridor north end.
  { id: 'rooftop', name: 'Rooftop', rect: [40, -60, 64, -40], door: { x: 0, z: -40, facing: 'N' }, unlockAt: 6 },
  { id: 'lift', name: 'Lift', rect: [7, 4, 10.4, 7.4], door: { x: 7, z: 5.7, facing: 'E' }, unlockAt: 7 }
]

export const ROOFTOP_SPAWN = { x: 52, z: -44 }
export const ROOFTOP_EXIT = { x: 0, z: -38.6 } // back in corridor

export const LANYARD_TIERS = [
  { at: 0, label: 'VISITOR (temporary)', desc: 'Crumpled paper' },
  { at: 2, label: 'VISITOR (less temporary)', desc: 'Laminated' },
  { at: 4, label: 'VISITOR :shrug:', desc: 'Plastic badge, shrug photo' },
  { at: 6, label: 'STAFF? (Dept. of ???)', desc: 'Proper badge, wrong department' },
  { at: 7, label: 'NEW HIRE — REMAP', desc: 'Real badge' }
]

export function lanyardTier(fragments: number): number {
  let t = 0
  LANYARD_TIERS.forEach((tier, i) => { if (fragments >= tier.at) t = i })
  return t
}

export const INTERACT = {
  radius: 1.6,
  angleCos: Math.cos((60 * Math.PI) / 180)
}

export const SAVE_KEY = 'afterhours.save.v1'
export const SETTINGS_KEY = 'afterhours.settings.v1'

export const DEBUG = new URLSearchParams(location.search)
