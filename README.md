# After Hours — a Remap ghost story

A browser-based 3D narrative exploration game (~25 minutes). You're the newest hire at Remap,
badging in late to grab a forgotten charger. The lifts die, the intercom says you can leave
"when the work is done" — and the office turns out to be haunted by former colleagues stuck
mid-task. Help each ghost finish the one thing keeping them here, collect the seven fragments
of the Remap logo, and go home.

**▶ Play it: https://after-hours-pink-ten.vercel.app**

No combat, no fail states, spooky → warm. Built as an internal engagement piece and for
embedding on the Remap website.

## Play

- **Desktop browser** (Chrome/Edge 80+, Firefox 74+, Safari 15+), keyboard + mouse or an
  Xbox-style gamepad.
- Controls: `WASD` move · mouse look · `E` interact · `Shift` jog · `H` hint · `M` map ·
  `Esc` pause · `F` fullscreen.
- Progress auto-saves in your browser.

## Tech

- Three.js 0.169 + Vite + vanilla TypeScript. No framework.
- **Zero external assets**: all geometry, textures, UI and audio are generated in code.
- No backend, no runtime network requests. Static output (~750 KB, ~200 KB gzipped).

## Develop

```bash
npm install
npm run dev        # hot-reload dev server on http://localhost:5173
npm run build      # typecheck + production build -> dist/
npm run preview    # serve the production build on http://localhost:4173
```

Debug helpers: `?debug` (FPS overlay, teleport keys 1–9, `G` grant fragment, `T` cycle warmth),
`?skip=<roomId>` (start with earlier rooms solved).

## Deploy

Auto-deployed by Vercel on every push to `main` (production: https://after-hours-pink-ten.vercel.app).
`dist/` is also plain static files — upload anywhere, or let Vercel build from this repo
(auto-detected Vite: `npm run build`, output `dist`). Embed with:

```html
<iframe src="https://after-hours-pink-ten.vercel.app/" width="1280" height="720"
        allow="fullscreen; gamepad; autoplay" style="border:0"></iframe>
```

## Docs

- `GAME_SPEC.md` — the full game specification (source of truth)
- `CLAUDE.md` — architecture map and working conventions
- `presence/README.md` — reserved seam for a future multiplayer/presence layer (v2)
