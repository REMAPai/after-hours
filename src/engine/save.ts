// Guarded localStorage save/settings (spec §2.4, §28). Game must run with storage unavailable.
import { SAVE_KEY, SETTINGS_KEY, type RoomId, type FragmentId } from '../config.ts'

export interface SaveData {
  v: 1
  fragments: FragmentId[]
  solved: string[]        // puzzle/flag ids
  duck: 'none' | 'vending' | 'held' | 'reconciled'
  pen: boolean
  room: RoomId
  playtime: number
  hintsUsed: number
  sandwichAttempts: number
}

export interface SettingsData {
  v: 1
  volMaster: number; volMusic: number; volSfx: number; volBlips: number
  sensitivity: number; invertY: boolean
  spookFree: boolean; textSize: number; reduceMotion: boolean; cbMinimap: boolean
  quality: 'auto' | 'low' | 'med' | 'high'
  textSpeed: 'slow' | 'normal' | 'instant'
  voice: boolean
  ticket: number
}

export const defaultSettings = (): SettingsData => ({
  v: 1, volMaster: 0.8, volMusic: 0.7, volSfx: 0.8, volBlips: 0.7,
  sensitivity: 1.0, invertY: false, spookFree: false, textSize: 100,
  reduceMotion: false, cbMinimap: false, quality: 'auto', textSpeed: 'normal', voice: true, ticket: 40412
})

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value) } catch { /* storage unavailable — fine */ }
}
function safeRemove(key: string): void {
  try { localStorage.removeItem(key) } catch { /* */ }
}

export function loadSave(): SaveData | null {
  const raw = safeGet(SAVE_KEY)
  if (!raw) return null
  try {
    const d = JSON.parse(raw)
    if (d && d.v === 1 && Array.isArray(d.fragments)) return d as SaveData
  } catch { /* corrupt */ }
  safeRemove(SAVE_KEY)
  return null
}

export function writeSave(d: SaveData): void {
  safeSet(SAVE_KEY, JSON.stringify(d))
}

export function clearSave(): void {
  safeRemove(SAVE_KEY)
}

export function loadSettings(): SettingsData {
  const raw = safeGet(SETTINGS_KEY)
  if (raw) {
    try {
      const d = JSON.parse(raw)
      if (d && d.v === 1) return { ...defaultSettings(), ...d }
    } catch { /* corrupt */ }
  }
  return defaultSettings()
}

export function writeSettings(d: SettingsData): void {
  safeSet(SETTINGS_KEY, JSON.stringify(d))
}
