# After Hours — a Remap ghost story

Browser-based 3D narrative exploration game ("walking sim with jokes"), ~25 min playtime.
Built for Remap: internal engagement piece + embeddable on the Remap website.
Source of truth: `GAME_SPEC.md` (SRS v2.0).

## Stack

- Three.js (pinned 0.169.0) + Vite + vanilla TypeScript. No framework.
- All geometry/textures generated in code (no external model/texture assets).
- Audio fully synthesized with plain WebAudio (`src/engine/audio.ts`).
- Saves/settings in `localStorage` (guarded — game runs without storage).
- No backend, no runtime network calls. Static `dist/` output.

## How to run

- `npm install`
- `npm run dev` — dev server (Vite, default port 5173)
- `npm run build` — typecheck + production build to `dist/`
- `npm run preview` — serve the production build

## Debug / QA

- `?debug` — FPS/draw-call overlay, teleport keys 1–9, `G` grant fragment, `T` cycle warmth
- `?skip=<roomId>` — start with everything before that room solved
  (roomIds: serverRoom, meetingRoom, archive, designStudio, breakRoom, financeCorner, rooftop)

## Architecture

- `src/config.ts` — all tunables (speeds, camera, lighting presets, room layout, gating)
- `src/engine/` — renderer+post stack, input (kb/mouse/gamepad), audio synth, saves, camera rig
- `src/game/` — Game orchestrator/FSM, world architecture, player controller,
  interaction/dialogue/objectives/minimap systems, VFX
- `src/characters/` — shared procedural rig, player build, ghost shader + factories
- `src/rooms/` — one module per room (props, ghost, puzzle, hints)
- `src/data/dialogue.ts` — ALL text lives here
- `src/ui/` — DOM screens (title/login, pause, settings, credits) + styles

## Safe vs approval-required

- Safe: edits under `src/`, running dev/build/preview, adding tests.
- Ask first: changing `package.json` dependencies, deleting saves logic, touching `presence/` (v2 seam — do not build).
- Forbidden: adding runtime network calls, external asset files, backends, analytics beyond the existing `postMessage` embed events.

## Known TODOs (spec §18)

1. ~~Official Remap logo~~ — DONE: `drawRemapLogo` in `src/engine/textures.ts` now recreates the
   official Remap.ai lockup (angular glyph + orange accent + "Remap.ai" wordmark, brand orange #F4581C).
2. Real team names in `src/data/dialogue.ts` → `D.credits`.
