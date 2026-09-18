# AFTER HOURS — Complete Game Specification (Source of Truth)

**Project:** "After Hours" — a browser-based 3D narrative exploration game for Remap
**Purpose:** Internal engagement piece + embeddable on the Remap website
**Version:** 2.0 (audited & expanded, 2026-09-18). Part I (§1–18) = game & product spec. Part II (§19–31) = production-quality detail: characters, animation, rendering, lighting, VFX, level dressing, item system, camera, web platform, pacing, QA. Part II sections are **requirements**, not suggestions.
**Document role:** This is the SRS / single source of truth. The implementing model (Claude Code) must treat every section as a requirement unless marked *(optional / v2)*. Where a detail is unspecified, choose the simplest option consistent with the Design Pillars in §1.2.

---

## 1. Overview

### 1.1 Elevator pitch
You are the newest employee at Remap, badging in late one evening to grab a forgotten charger. The lifts die, the lights flicker, and the building's intercom informs you that you cannot leave "until the work is done." The office is haunted — not by monsters, but by former colleagues stuck mid-task for years. Help each ghost finish the one thing that's keeping them here. Each freed ghost gives you a fragment; the fragments assemble into the Remap logo, the lift opens, and the building lets you go home.

Tone: starts gently spooky, ends as a warm love letter to the company. No combat, no death, no fail states that block progress. ~25 minutes of play.

### 1.2 Design pillars (tie-breakers for all implementation decisions)
1. **Atmosphere over mechanics** — lighting, sound and pacing carry the game; puzzles are simple.
2. **Spooky → warm gradient** — every successive room is less scary and more heartfelt than the last.
3. **Runs anywhere** — a mid-range laptop in Chrome at 60fps, no install, no login.
4. **Remap is the punchline and the payoff** — company humour throughout; the brand reveal is the finale.
5. **Ship in a day** — when in doubt, cut scope, never quality of feel.

### 1.3 Player-facing summary
- Genre: third-person narrative exploration / light puzzle ("walking sim with jokes")
- Session length: 20–30 minutes, single sitting, auto-saves
- Audience: Remap employees and website visitors; all ages
- Platform: desktop browser (Chrome/Edge/Firefox/Safari latest), keyboard+mouse and Xbox-style gamepad
- Mobile: *(v2 — show a friendly "best played on desktop" screen on small viewports)*

---

## 2. Technical requirements

### 2.1 Stack
- **Three.js** (pinned recent stable version) for rendering — UMD or ES module build per project setup.
- **Vite** project, vanilla TypeScript (no framework needed; UI is DOM/CSS overlaid on the canvas).
- **Audio:** Web Audio API via **Howler.js** (or plain WebAudio if simpler).
- **State/saves:** `localStorage` (guard all reads/writes in try/catch; game must run with storage unavailable).
- **No backend. No network calls at runtime.** All assets bundled/local.
- Output: static build (`dist/`) deployable to any static host / the Remap website.

### 2.2 Performance budget
- 60 fps target, 30 fps minimum on integrated graphics.
- Draw calls < 150 per frame; total triangles < 300k in view.
- Stylized geometry authored **in code** — **no external 3D model files or texture images**. This is NOT a licence for crude box-people: use the full Three.js geometry toolkit (Sphere/Capsule/Lathe/Extrude/Tube/Shape geometries, `mergeGeometries`, smooth normals, bevelled edges) to build appealing, readable, "Pixar-office-toy" quality props and characters per the Character Bible (§19). Target look: a clean stylised 3D short film, not a prototype.
- Textures: canvas-generated at runtime (labels, posters, logo variants, badge photos, sticky notes, wood grain/carpet noise) cached as `CanvasTexture`; `MeshStandardMaterial`/`MeshPhysicalMaterial` with sensible roughness/metalness; one small procedural `PMREM` environment map for reflections (floors, glass, monitor screens).
- Lighting per the Lighting Design (§22): one shadow-casting key light per room max (1024² map, PCFSoft), fill via `HemisphereLight` + emissive props; fake contact shadows (soft radial-gradient plane) under characters and large props.
- Post-processing per the Rendering Pipeline (§21) — required for the visual bar; must degrade gracefully by quality tier.

### 2.3 Code architecture (required shape)
```
src/
  main.ts              // boot, resize, game loop
  engine/              // renderer, input, audio, save, camera-rig
  game/
    state.ts           // finite state machine: TITLE → BADGE_IN → PLAY → PAUSED → FINALE → CREDITS
    player.ts          // controller, animation states
    interaction.ts     // raycast/proximity interactable system
    dialogue.ts        // speech-bubble system, typewriter text
    objectives.ts      // objective card + fragment tracking
    minimap.ts
    hints.ts
  rooms/
    lobby.ts serverRoom.ts meetingRoom.ts archive.ts breakRoom.ts
    designStudio.ts financeCorner.ts rooftop.ts lift.ts
    corridor.ts
  ui/                  // DOM overlays: title, HUD, pause, settings, credits
  data/
    dialogue.ts        // ALL text lines live here (single file, keyed by ghost/beat)
    puzzles.ts         // puzzle configs
assets/ (audio, favicon, fonts)
```
- Every room implements a common `Room` interface: `build(scene)`, `update(dt)`, `onEnter()`, `onExit()`, `interactables[]`.
- All tunables (walk speed, camera distances, colours, timings) in one `config.ts`.

### 2.4 Save system
- Auto-save on: room enter, puzzle solved, fragment collected, settings change.
- Saved data: fragments collected, puzzles solved, duck collectible state, current room, settings, playtime.
- Title screen shows **Continue** (if save exists) and **New Game** (with "overwrite save?" confirm).

---

## 3. Player character

### 3.1 Identity
- A junior employee, **three weeks in**, name never spoken (the intercom calls them "New Hire" until the ending, where it uses "you" warmly).
- Still wearing a **paper VISITOR lanyard** because IT never issued the real badge. This is a running joke *and* the progress indicator:

| Fragments collected | Lanyard state (visible on character + HUD icon) |
|---|---|
| 0 | Crumpled paper "VISITOR (temporary)" |
| 2 | Laminated "VISITOR (less temporary)" |
| 4 | Plastic badge, photo is a shrug emoji |
| 6 | Proper badge, wrong department |
| 7 (all) | Real badge with their silhouette — awarded in the finale |

### 3.2 Visual
- Full construction, proportions, face, costume and lanyard spec: **§19.2 (Character Bible — Player)**. Animation states and blending: **§20**.
- Carries a **phone-torch in the left hand** (spotlight parented to the hand bone, slight sway, volumetric cone per §23) and the badge in the right.

### 3.3 Movement & controls
| Action | Keyboard/Mouse | Xbox gamepad |
|---|---|---|
| Move | WASD / arrows | Left stick |
| Camera | Mouse move | Right stick |
| Jog (hold) | Shift | LS click or hold A |
| Interact / advance dialogue | E or Left click | **A** |
| Back / close | Esc | **B** |
| Hint ping | H | **Y** |
| Minimap toggle (enlarge) | M | Back/View |
| Pause | Esc / P | Start/Menu |

- Walk 2.2 m/s, jog 4.0 m/s, acceleration 12 m/s², instant-feeling stop.
- No jump, no crouch, no combat, no fall damage, no stamina.
- Collision: capsule vs. axis-aligned room colliders; gentle wall sliding. Player can never get stuck; add invisible ramps over any step.
- Gamepad support via the Gamepad API; **button prompts switch automatically** to Xbox glyphs when a gamepad is used, back to key glyphs on keyboard input (see §5.6).

### 3.4 Camera
- Third-person **over-the-right-shoulder**, Assassin's-Creed style framing:
  - Follow distance 3.2 m, height 1.7 m, shoulder offset +0.45 m right.
  - Mouse/right-stick orbit: yaw free, pitch clamped −35°…+55°.
  - Spring-arm collision: camera pulls in smoothly when geometry intrudes; player fades to 30% opacity if closer than 1 m.
  - Subtle lag (position lerp ~8/s) for cinematic weight; extra sway while jogging.
- Scripted camera moments (slow push-in) on: first intercom line, each ghost's release, rooftop scene, finale. During these, input locked except dialogue-advance.

---

## 4. Screens & UI (every screen specified)

General UI style: **corporate-office pastiche.** Everything looks like office software or stationery — login pages, sticky notes, out-of-office replies. Font pairing: a clean sans (e.g. Inter/system-ui) for "corporate" UI, a marker-style hand font for sticky notes. All UI is DOM/CSS layered over the WebGL canvas.

### 4.1 Title screen — "the login page that's slightly wrong"
- Looks like a bland corporate SSO login: centered card, Remap logo placeholder at top, fields "Employee ID" and "Password", a "Sign in" button.
- The wrongness (subtle, escalating over ~20s idle): the tagline under the logo flickers between "Work smarter." and "You never left."; the stock-photo background's people slowly stop smiling; cursor in the ID field types by itself: `you're still here?` then deletes it.
- Buttons (styled as form elements): **Sign in → New Game**, **Continue session → Continue** (only if save exists), **IT Settings → Settings**, **Log off → Credits**.
- Faint fluorescent hum + distant HVAC audio. Any click plays a corporate "ding" that's slightly detuned.

### 4.2 Badge-in screen (tutorial)
- First-person-ish close-up: a badge reader by a glass door. Prompt: "Tap your badge — [E] / (A)".
- Reader flashes **red, "ACCESS DENIED — VISITOR"**, twice; third try: green, "…fine." Door opens into the lobby; camera pulls back into third person — this transition doubles as the camera tutorial.
- During the walk to the lobby desk, contextual prompts teach: move, camera, jog, interact. Each prompt is a sticky note (see §4.3) that peels away once performed.

### 4.3 In-game HUD (minimal; fades out when idle)
1. **Objective card** — top-left, styled as a yellow sticky note, slightly rotated (−2°), hand-font. One line, e.g. *"Find whoever keeps restarting Server 6."* Updates with a peel-off/re-stick animation and a soft paper sound.
2. **Fragment counter** — top-right: the Remap logo as a 7-piece outline; collected pieces fill in with a glow. Hovering/holding Y shows piece names.
3. **Lanyard chip** — under the fragment counter: tiny badge icon reflecting the current lanyard tier (§3.1).
4. **Minimap** — bottom-right (full spec §7).
5. **Interaction prompt** — floating at the interactable: glyph + verb, e.g. `[E] Talk`, `(A) Inspect`, `[E] Label sandwich`. Verb is always specific, never just "Interact".
6. **Dialogue** — speech bubbles in world space above ghosts (§8.4).
7. **Toast line** — bottom-center, for flavour ("The vending machine watches you leave."), auto-fades 3s.

### 4.4 Pause menu — "Out of Office"
- Overlay styled as an email auto-reply being composed:
  > **From:** New Hire
  > **Subject:** Out of Office
  > "I am currently away from my desk (paused). I will respond to your request when I return."
- Menu items as email actions: **Send later → Resume**, **Edit signature → Settings**, **Recall message → Restart room**, **Unsubscribe → Quit to title**.
- Background: game world frozen, desaturated, slight blur.

### 4.5 Settings ("IT Settings — please raise a ticket")
- Volume sliders: Master / Music / SFX / Voice-blips.
- Camera: sensitivity, invert Y.
- Accessibility: **Spook-free mode** (disables the two jump-ish scares, brightens ambient light 20%), text size (100/125/150%), reduce motion (removes camera sway/head-bob), colour-blind-safe minimap palette toggle.
- Graphics: quality Low/Med/High (shadow toggle, pixel ratio cap, bloom toggle).
- Each setting has a fake "ticket number" that increments when changed (pure joke, persisted).

### 4.6 Finale + credits screens — spec in §9 (story) and §10.

### 4.7 UI sounds
Paper peel (objective), soft chime + logo shimmer (fragment), badge beep (checkpoints), keyboard clack (menus), detuned ding (title).

---

## 5. World layout

### 5.1 Floor plan (one contiguous level + rooftop + lift)
```
                    ┌───────────┐
                    │  ROOFTOP  │  (via stairwell door in corridor, unlocks late)
                    └─────┬─────┘
 ┌──────────┐  ┌──────────┴──────────────────────────────┐  ┌───────────┐
 │ SERVER   │──│                                          │──│ MEETING   │
 │ ROOM     │  │            MAIN CORRIDOR                 │  │ ROOM      │
 └──────────┘  │   (long, flickering, the spooky spine)   │  └───────────┘
 ┌──────────┐  │                                          │  ┌───────────┐
 │ ARCHIVE  │──│                                          │──│ DESIGN    │
 └──────────┘  │                                          │  │ STUDIO    │
 ┌──────────┐  │                                          │  └───────────┘
 │ BREAK    │──│                                          │  ┌───────────┐
 │ ROOM     │  │                                          │──│ FINANCE   │
 └──────────┘  └──────────┬───────────────────────────────┘  │ CORNER    │
                    ┌─────┴─────┐   ┌──────┐                 └───────────┘
                    │   LOBBY   │───│ LIFT │  (hub; game starts & ends here)
                    └───────────┘   └──────┘
```
- **Lobby is the hub**; the corridor is the spine; six side rooms branch off it; stairwell door to rooftop at the corridor's far end (locked until 6 fragments); the lift sits off the lobby (dead until 7 fragments).
- Doors: sliding office doors with frosted glass. Locked doors show a red badge-reader light and a sticky note excuse ("Cleaning in progress since 2019").
- Room gating (soft-linear): Server Room and Meeting Room open from the start; Archive unlocks at 2 fragments; Break Room & Design Studio at 3; Finance at 5; Rooftop at 6; Lift at 7. The receptionist announces each unlock.
- Scale: corridor ~40 m long, 3 m wide, 3 m ceilings; rooms 8–12 m square. Player traversal lobby→farthest room ≤ 30 s jogging.

### 5.2 Corridor dressing & atmosphere beats
- Flickering fluorescent tubes (2–3 flicker on timers; one dies permanently with a *tink* the first time you pass it).
- Motivational posters that get less motivational the deeper you go: "TEAMWORK", then "SYNERGY?", then a poster that is just the word "STAY."
- A photocopier that switches on by itself once (scare #1 — suppressed in Spook-free mode) and prints a page reading "HELP ME — no toner".
- Wet-floor sign with a small ghost drawn on it. A plant that has clearly been dead for years but has a "please water me" note.
- Windows show a night skyline; occasional slow lightning (no sound thunder — silence is spookier).

---

## 6. Core systems

### 6.1 Interaction system
- Interactables register with: position, radius (default 1.6 m), verb label, glyph, enabled-predicate, and callback.
- Nearest enabled interactable inside radius + within 60° of camera forward shows its prompt; E/A triggers it.
- All puzzle objects, ghosts, doors, collectibles, and flavour objects (min. 3 flavour inspects per room, each with one toast line) use this one system.

### 6.2 Dialogue system
- World-space speech bubbles above the speaker: rounded-rect DOM elements projected from 3D anchors; tail pointing to speaker; typewriter reveal (~35 chars/s, click/A to complete, click/A again to advance).
- Each ghost has a distinct **voice blip** (short synth tone at different pitch/timbre per character) that plays per character typed. The intercom voice uses a lower-pitched blip with light reverb.
- Player responses: when the player "speaks", show a smaller bubble over the player with 1–2 short options max (used sparingly; mostly the player is silent and expressive).
- ALL lines live in `data/dialogue.ts`, keyed `ghost.beat.line` — no strings hardcoded in room files. Every ghost needs: greeting loop (2–3 idle lines), task explanation, 2 escalating hint lines, solve reaction, release monologue (3–5 lines), and one post-release echo line (heard if you inspect their spot again).

### 6.3 Objectives & fragments
- Exactly one active objective at a time (sticky note, §4.3). Objective chain is linear per room but rooms can be tackled in any unlocked order; the sticky note always points to the nearest unfinished unlocked room if the player has no active room task.
- **Fragments (7):** each freed ghost yields one glowing shard that flies into the HUD logo. Fragment names (shown on collect + in counter hover): *Uptime, Alignment, Memory, Taste, Care, Balance, Purpose* — mapping to Server, Meeting, Archive, Design, Break, Finance, Rooftop respectively.
- Fragment collect sequence (~4 s, input locked): shard rises from ghost, chime, arcs to HUD, logo piece fills, lanyard tier check, objective updates.

### 6.4 Hint system (three layers, never letting anyone get stuck)
1. **Passive:** after 60 s without progress on a puzzle, the ghost says its first hint line; after a further 60 s, the blunt second hint.
2. **On demand:** press H/(Y) → the objective sticky note flips over, revealing a handwritten hint for the current step; simultaneously the minimap pings the relevant spot.
3. **The receptionist:** talking to Doris in the lobby always yields a plain-language "go here, do this" for the current objective, plus one joke.
- Puzzles also have an invisible mercy rule: after 3 failed attempts, the puzzle visually simplifies (e.g. wrong options dim).

### 6.5 Xbox-style contextual prompts
- Glyph set required: A, B, X, Y, LS, RS, Start, View for pad; key-cap style for E, Esc, H, M, WASD, Shift for keyboard. Render as inline SVG/CSS, no image files.
- Prompts appear: on interactables, inside dialogue ("(A) Continue"), in menus, and as brief teaching toasts the first time each mechanic is needed. Auto-swap on last-used input device.

## 7. Minimap (full spec)
- Bottom-right, 180×180 px rounded card styled as a **fire-evacuation floor plan** ("YOU ARE HERE" printed on it, arrow pointing at the player dot, of course).
- Top-down orthographic schematic (not a render): corridor + room outlines in thin lines; current room fill slightly lighter.
- Player: small arrow dot rotating with facing. North-up fixed (no rotation) for readability.
- Room states: locked = greyed + tiny padlock; unlocked & unfinished = soft pulsing outline; active objective room = animated dashed outline + label; completed = filled with a faint fragment glyph; ghost icons appear in rooms you've discovered.
- Hint ping (H/Y): expanding ring at the objective location for 3 s.
- M / View enlarges to a centered 60%-screen version with room names and fragment names; game pauses underneath while enlarged.
- Colour-blind-safe palette toggle swaps the state colours for pattern fills.

---

## 8. Rooms, ghosts & puzzles (full detail)

Common rules: every ghost is built per the shared rig and ghost material in **§19.1/§19.3**, with its own visual card in **§19.4**; translucent fresnel-glow shell, hovers 10 cm off the floor, gently bobs, casts a faint coloured light. Ghosts get **warmer in colour and calmer in animation** with each successive room per the spooky→warm gradient (Marcus is cold blue and jittery; the founder is candle-warm gold and still). On release: the ghost brightens, exhales (audio), rises, and dissolves into the fragment shard. Each room lists: layout, dressing, ghost, puzzle (mechanics, fail/hints), dialogue beats, and its scare/warmth rating.

### 8.1 LOBBY — hub (warmth 2/10 at start → 8/10 by the end)
- **Layout:** reception desk center, dead lift doors on one wall, seating corner, corridor mouth opposite, big "REMAP" letters behind the desk with two letters unlit (they light up as fragments are collected — all lit at 7).
- **Ghost: DORIS, the receptionist** — has been greeting an empty lobby since 2009. Unfailingly cheerful, weaponised small talk. She is the guide/hint dispenser, not a puzzle. She names the player "the new hire, oh I *knew* they'd send someone eventually."
- **Role:** tutorialises talking; announces room unlocks over the intercom-adjacent desk mic; delivers current-objective help + one joke per ask (cycle 10+ joke lines).
- **Dialogue flavour:** "Visitor badge? Oh you poor thing. IT's ticket queue survived them, you know." / "The building isn't haunted, it's just *committed*."
- Doris is the LAST ghost freed — automatically during the finale (§9), not via puzzle.

### 8.2 SERVER ROOM — "Uptime" (spook 7/10)
- **Layout:** dark, cold-blue LEDs, four server racks in rows, thick cable trays, one rack (Server 6) strobing red. Loud fans that fall silent the moment you enter (scare beat #2: three seconds of dead silence, then a single fan spins back up).
- **Ghost: MARCUS, ops engineer** — jittery, speaks in incident-report fragments, has been power-cycling Server 6 for six years. "It's not down if I keep restarting it. That's the rule. That's… is that the rule?"
- **Puzzle — Cable Match:** 4 labelled cables (POWER, NET, BACKUP, "MYSTERY — DO NOT UNPLUG") hang from a tray; 4 ports on Server 6 with icon labels. Pick up a cable (E), plug into a port (E). Wrong = spark + Marcus flinch + witty error line. Correct order lights green per cable. MYSTERY cable's correct port is labelled "???" — plugging it makes the vending machine in the break room audibly clunk (foreshadow joke).
  - Hints: (1) "The labels… the labels never lie. Mostly." (2) Ports' icons start glowing when the matching cable is held.
- **Solve:** rack goes steady-green, fans purr, Marcus receives one last pager beep that reads "RESOLVED", laughs once, releases. Release line: "Six years of on-call… tell them— tell them the uptime was *worth it*." → **Fragment: UPTIME.**

### 8.3 MEETING ROOM — "Alignment" (spook 6/10)
- **Layout:** long table, ten ghost silhouettes seated mid-standup, a projector looping a slide that says "Q3 SYNC (recurring)". A whiteboard covered in agenda scribbles. The door closes itself behind you (scare beat #3, gentle).
- **Ghosts: THE ETERNAL STANDUP** — ten murmuring ghosts, led by PRIYA the PM, who cannot end the meeting because nobody ever said the closing item. They speak in rotating meeting clichés ("Let's take that offline." "Can everyone see my screen?" — the projector shows nothing).
- **Puzzle — Find the Final Agenda Item:** 5 inspectable notes are hidden around the room (under the table, behind the whiteboard, in the projector tray, taped to a chair, inside a biscuit tin). Four are decoys with funny non-items ("Item 9: circle back on the circling back"). One reads "**AOB: someone say 'no blockers' and GO HOME.**" Take it to Priya and choose the dialogue option: *"No blockers."*
  - Hints: (1) Priya: "It's written down somewhere. Everything is always written down somewhere." (2) The correct note's hiding spot glints.
- **Solve:** the room ERUPTS in relieved cheering, chairs push back, ten ghosts float off "to lunch," Priya lingers: "Meeting adjourned. Ten years, and it was *one agenda item*. Classic." → **Fragment: ALIGNMENT.**

### 8.4 ARCHIVE — "Memory" (spook 5/10, first real warmth)
- **Layout:** tall shelves, dust motes in torchlight, paper drifts, a single desk lamp glowing over an open binder. Quietest room in the game — muffle all ambient audio here.
- **Ghost: INES, the technical writer** — soft-spoken, wrote 400 pages of documentation nobody ever opened. She doesn't want help. "It's fine. Nobody reads the docs. It's fine. I indexed it and everything."
- **Puzzle — Read One Page Aloud:** find her masterwork binder ("THE ONBOARDING GUIDE, v14 FINAL final(2)") among 6 shelved decoy binders with joke spines ("Meeting Minutes 2011 (unminuted)"). Bring it to her desk and interact → the player "reads": a slow scripted beat where the page's actual text scrolls on screen — and it's *genuinely good, warm advice for new employees* (write 6–8 sincere lines; this is the emotional pivot of the game). Ines listens, hands over her ghost pen as a keepsake toast.
  - Hints: (1) "v14. FINAL final. The *second* final." (2) Decoy binders stop being interactable.
- **Solve:** she dissolves mid-smile: "Someone read it. Page one. That's… that's all it ever needed." → **Fragment: MEMORY.** After this room, corridor lights flicker noticeably less (global warmth step).

### 8.5 BREAK ROOM — "Care" (comic relief, spook 2/10)
- **Layout:** kitchenette, humming fridge with a faint inner glow, the vending machine (which clunks if the Server Room MYSTERY cable was plugged — dispenses the RUBBER DUCK collectible, see §8.6/§11), a sad birthday banner reading "HAPPY BIRTHD" (the AY fell off).
- **Ghost: GARY** — a man of one grievance. Someone has been taking his unlabelled sandwich since 2014. He has ascended beyond hunger but not beyond pettiness.
- **Puzzle — Label the Sandwich Properly:** open the fridge → a shelf of absurd items (galaxy-glowing tupperware "DO NOT OPEN — Q2", a single olive, someone's houseplant). Take the sandwich, take the label maker on the counter, choose the label from 4 options: "SANDWICH", "GARY'S", "**GARY'S. YES, THIS GARY. THE GHOST. HE KNOWS.**", "FREE FOOD". Only option 3 satisfies him (options 1/2/4 get escalating deadpan rejections — this "puzzle" is really a joke-delivery machine; mercy rule dims wrong options after 2 tries).
- **Solve:** Gary places the sandwich reverently back, pats the fridge: "Justice. Cold, refrigerated justice." Releases mid-bite of a ghost sandwich. → **Fragment: CARE.**

### 8.6 DESIGN STUDIO — "Taste" (spook 3/10)
- **Layout:** warm anglepoise lamps, corkboards, walls COVERED in near-miss versions of the Remap logo (generate ~24 procedural variants: wrong colours, comic-sans wordmark, upside down, one that's just a map with "re" written on it). A pottery-of-failed-ideas shelf.
- **Ghost: KIT, the designer** — perfectionist, has been iterating on the logo "for one more pass" since forever. Speaks in critique: "The kerning haunts me. *I* haunt *me*."
- **Puzzle — Canonise the Logo:** 6 large framed candidates on the main wall; inspect each (Kit critiques 5 of them hilariously and specifically); the 6th is the real Remap mark. Choose it and confirm: "This one. It was always this one."
  - Implementation note: render the real Remap logo as a clean vector recreation placeholder with a clearly marked TODO for dropping in the official SVG. Hints: (1) "Simplicity. It's the one I kept walking past." (2) Wrong frames dim.
- **Solve:** Kit straightens the frame one millimetre — "…there." — and releases, at peace. → **Fragment: TASTE.** The chosen logo then appears subtly through the rest of the building (lobby letters, lift doors).

### 8.7 FINANCE CORNER — "Balance" (spook 2/10)
- **Layout:** cubicle island, ten-key calculators, a mountain of paper, one spreadsheet projected on the wall that is off by exactly £4.99.
- **Ghost: BEATRIZ, the accountant** — serene until reconciliation is mentioned. One receipt from 2016 has never reconciled. "Everything balances. Everything except *the duck*."
- **Puzzle — Reconcile the Duck:** requires the **RUBBER DUCK** (vending machine, §8.5 — if the player lacks it, Beatriz's dialogue and the sticky-note hint route them to the break room/server-room cable chain). Present the duck → she scans it → the receipt materialises: "1× RUBBER DUCK — MORALE (ESSENTIAL) — £4.99". The spreadsheet ticks to zero with an almighty satisfying *ding*.
- **Solve:** "Balanced. Every line. Every year. Tell finance… the duck was *always* essential." She bows to the duck; the duck stays with you. → **Fragment: BALANCE.** Stairwell to the rooftop unlocks (Doris announces it).

### 8.8 ROOFTOP — "Purpose" (no puzzle; warmth 10/10)
- **Layout:** night city skyline (simple emissive-window building silhouettes + skybox), slow wind, string lights someone hung years ago still glowing, two deckchairs, an old telescope. Music here for the first time: a soft warm pad — the only real "music" before the finale.
- **Ghost: THE FOUNDER (call them "SAM")** — calm, warm-gold, looking at the city. No task. A ~90-second scripted conversation (advance at player pace): why Remap was started, what the ghosts all had in common ("they cared past closing time — that's the whole secret and the whole problem"), and that the building never trapped anyone: *"It just wanted the work finished. Work that's finished can be put down."* Sam gives the final fragment freely.
- Then, gently: "One more thing. Doris has been at that desk longer than any of us. Go badge out. She's waiting to say goodnight."
- → **Fragment: PURPOSE.** Lift unlocks. On leaving the rooftop, the corridor is fully lit and warm for the walk back — every fixed light on, posters now genuinely nice.

---

## 9. Story beats & finale (scripted sequence spec)

### 9.1 Beat sheet (canonical order of scripted moments)
1. **Cold open:** badge-in tutorial → lobby. Lights drop, lift dies with a descending whine, intercom (calm, pleasant, wrong): *"Good evening, New Hire. The building is closed. You may leave when the work is done."* Objective: "Find out what 'the work' is."
2. Meet **Doris** → she explains the ghosts, points at Server Room & Meeting Room. Unlock cadence per §5.1, each announced by Doris with a joke.
3. Rooms in soft-linear order (player choice within unlocks). Global warmth steps after fragments 3 and 5: corridor lighting, poster swaps, ambient audio warms.
4. **Rooftop scene** (§8.8) → fragment 7 given freely.
5. **Finale (below).**

### 9.2 Finale — "Badge Out" (~2.5 min, mostly scripted)
1. Player returns to the lobby: fully lit, warm. All previously freed ghosts stand in a loose line by the lift, waiting like it's the end of a shift.
2. Talk to Doris → she stands (first time ever), takes off her own ancient badge, places it on the desk: *"Front desk's covered, I think. You'll do."* She joins the line. (Doris releases here — no puzzle.)
3. Interact with the lift badge reader → the 7 HUD fragments fly out, orbit, and **assemble into the Remap logo** on the lift doors (bespoke ~8 s animation, the visual centrepiece — glow, chime chord, doors part).
4. Player steps in; turns around (scripted camera): the ghosts wave; each dissolves into a drifting mote of light; motes stream into the logo above the lobby desk — the last two dark letters of "REMAP" light up.
5. Doors close. Black screen, one beat of silence. Intercom, warm now, uses no title, just: *"Goodnight. See you tomorrow."*
6. Smash cut: the corporate login page from the title screen — but now it's normal, sunny stock photo, tagline reads "Work smarter." A single new notification: **"IT: Your badge is ready for collection."** → lanyard tier 7 icon stamps on. Fade to credits.

### 9.3 Credits — styled as a leaving-card
- A big office greeting card ("SORRY YOU'RE LEAVING (the building) (for tonight)") that scrolls open; credits written as handwritten messages: dev/team names, "Ghost wrangling: …", plus each ghost's signature and one final line each (write 7 send-off lines).
- Post-credits sting: 2 s of the dark title screen; the cursor types "same time tomorrow?" — then the real "Play again?" button appears. Stats card: time played, hints used, ducks reconciled (1/1), sandwiches labelled correctly (1/1, attempts: N).

## 10. Intercom / narrator character
- **THE BUILDING** speaks via intercom: pleasant corporate-neutral text voice (text + low blip tone only, no VO). Personality arc: politely ominous → curious → warm. It speaks exactly 9 times (cold open, once after each odd fragment, pre-rooftop, finale close, post-credits). Write all 9 lines in `dialogue.ts`. It never threatens; menace comes purely from politeness + context.

## 11. Collectibles & extras
- **THE RUBBER DUCK:** obtained via Server-Room mystery cable → vending machine clunk → collect in Break Room. Visible thereafter peeking from the player's pocket. Required by Finance (§8.7 routes players who missed it). After reconciliation it gains a tiny ghost-glow. Appears on the stats card and in the credits card margin.
- **Ghost pen (from Ines):** cosmetic keepsake; the objective sticky notes' handwriting becomes neater after receiving it (subtle, delightful).
- **7 flavour "toast" objects per zone minimum** (§6.1) — write all toast lines in `dialogue.ts`.

## 12. Art direction
- **Palette arc:** cold desaturated blue-greys + sickly fluorescent green (start) → neutral (mid) → warm ambers/golds (end). Define 3 lighting presets (COLD/NEUTRAL/WARM) in `config.ts`; global warmth steps interpolate between them over 2 s.
- **Geometry style:** chunky low-poly, slightly oversized props, clean silhouettes, no textures needed beyond flat colours + emissive + a subtle screen-space grain/vignette post-pass (grain OFF in reduce-motion mode).
- **Ghost shader:** fresnel rim glow, 40% opacity core, slight vertical sine distortion; colour temperature per ghost per §8 gradient.
- **Fog:** exponential, colour-matched to the lighting preset; corridor visibility ~15 m when COLD, effectively unlimited when WARM.

## 13. Audio direction
- Ambient beds per zone (fluorescent hum, HVAC, server fans, fridge hum, rooftop wind) — all synthesizable/loopable; crossfade on room transitions (1.5 s).
- No music until the rooftop pad, then a fuller warm theme for the finale/credits (2 short loopable pieces). May be generated tones/pads — keep it minimal and tasteful.
- SFX list (each one short, synthesized or CC0): footsteps ×2 surfaces, badge beep (deny/accept), door slide, paper peel, fragment chime, spark, fan spin-down/up, photocopier, vending clunk, lift ding, ghost exhale, cheer crowd (meeting room), calculator ding.
- Voice blips per character (§6.2). Master ducking: dialogue blips duck ambience −6 dB.

## 14. Accessibility & options (required, not optional)
- Spook-free mode (disables scare beats #1–3, +20% ambient light), reduce motion, text scaling, colour-blind minimap palette, remappable-in-code key constants, subtitles are inherent (all text), pause anywhere, no timed puzzles, mercy rule on all puzzles (§6.4).

## 15. Multiplayer / presence — **explicitly v2, DO NOT BUILD in v1**
- v1 is single-player. Leave a clean seam: player position/room already flows through one state object; a future presence layer (WebSocket, floating name-tags + simple avatar ghosts of coworkers) would subscribe to that state. Add a `presence/` stub folder with a README describing the intended interface; nothing else.

## 16. Build milestones (implement in this order; each ends runnable)
1. **M1 Skeleton:** Vite+TS+Three boot, game loop, config, state machine, grey-box lobby+corridor, player controller + camera + collision, one test interactable. 
2. **M2 Systems:** dialogue, objectives/sticky note, fragments HUD, minimap, hints, save/load, pause/settings/title screens (functional, unstyled ok).
3. **M3 Rooms pass 1:** all 9 spaces grey-boxed with doors/gating; Doris + all 6 puzzle ghosts functional end-to-end (placeholder text ok); full game completable.
4. **M4 Content:** all dialogue/toast/hint text final; puzzles polished with mercy rules; duck chain; rooftop scene; finale sequence; credits.
5. **M5 Characters & animation:** shared rig, player build + face + lanyard tiers, all 8 ghost builds per visual cards, animation state machine, look-at, release choreography (§19–20).
6. **M6 Art, lighting & VFX:** rendering pipeline + quality tiers, per-room lighting tables, warmth arc, particles/VFX catalogue, full prop dressing per room, UI styling (login page, sticky notes, out-of-office), all SFX/blips (§21–24).
7. **M7 Polish & QA:** performance budget pass, accessibility options, gamepad + prompt swapping + menu focus, web-platform hardening (§28), save-integrity, pacing pass (§29), full acceptance checklist (§17 + §31).

## 17. Acceptance criteria (test checklist — all must pass)
- [ ] Fresh Chrome load → title → new game → **fully completable in one sitting** with no console errors.
- [ ] Completable using ONLY keyboard+mouse; separately using ONLY an Xbox-style gamepad; prompts swap correctly.
- [ ] Every puzzle solvable via the 3-layer hint system without outside knowledge; no soft-locks (test: solve Finance before getting the duck → routed correctly).
- [ ] Refresh mid-game → Continue restores room, fragments, duck, settings.
- [ ] localStorage disabled → game still runs (no crash; Continue hidden).
- [ ] 60 fps on a mid-range laptop in every room (fps meter behind a `?debug` flag along with room-teleport keys).
- [ ] Spook-free + reduce-motion + text-scale + colour-blind options all function.
- [ ] All 7 fragments, lanyard tiers, warmth steps, and the finale logo assembly trigger correctly.
- [ ] Window resize / fullscreen at 16:9, 16:10, ultrawide — UI never overlaps unusably.
- [ ] Total bundle ≤ ~5 MB gzipped; no runtime network requests.
- [ ] All Part II acceptance items in §31 pass (visual bar, character bar, platform hardening).

## 18. Open TODOs for the implementer (only allowed deviations)
1. Drop in the **official Remap logo SVG** where the placeholder mark is (§8.6, HUD counter, finale, lobby letters).
2. Team/dev names in the credits card.
3. Optional: swap synthesized SFX for licensed CC0 samples if readily available offline.

*End of Part I. Part II follows and is equally binding.*

---
---

# PART II — PRODUCTION QUALITY SPECIFICATION

## 19. Character Bible

### 19.1 Shared humanoid rig (used by player and all ghosts)
Build one `CharacterRig` class: a hierarchy of `Object3D` pivots with meshes attached, so all animation code is shared and every character moves believably.
```
root (ground contact)
└─ hips            (y 0.95)  — bob/sway origin
   ├─ spine        (y 1.05)  — lean/breathe
   │  ├─ chest     (y 1.30)
   │  │  ├─ neck   (y 1.52)
   │  │  │  └─ head (y 1.60)  — look-at target, nod, tilt
   │  │  │     ├─ eyeL / eyeR (blink scale-Y), brows, mouth (decal plane)
   │  │  │     └─ hair / hat / accessory slot
   │  │  ├─ shoulderL → upperArmL → foreArmL → handL (prop slot: torch/binder/duck)
   │  │  └─ shoulderR → upperArmR → foreArmR → handR (prop slot: badge/pen/calculator)
   │  └─ lanyard / accessory slot on chest
   ├─ upperLegL → lowerLegL → footL
   └─ upperLegR → lowerLegR → footR
```
- **Proportions (stylised, appealing):** total height 1.72 m; head ~1/5.5 of height (slightly large, friendly); shoulders 0.42 m wide; hands slightly oversized (readability of held props); feet chunky. Limbs are tapered capsules (`CapsuleGeometry` → scaled), joints hidden by overlapping spheres so nothing gaps when bending.
- **Head:** a slightly squashed sphere (x 1.0, y 1.08, z 0.96) with a soft jaw (a second, smaller sphere merged low-front). Neck cylinder. Ears: small flattened spheres.
- **Face (all characters):** eyes = white sphere + dark iris disc + tiny specular dot (emissive) → readable from 5 m; eyelids = a hemisphere shell that rotates to blink (blink every 3–6 s, double-blink occasionally); brows = thin bevelled boxes (rotate ± for emotions); mouth = a `CanvasTexture` decal plane swapped between 6 states: neutral, smile, wide-smile, talk-A, talk-B, frown/worry. Talk states alternate while a bubble is typing.
- **Silhouette rule:** every character must be identifiable from a black silhouette alone — via hair shape, one accessory, and posture (see cards). Colours reinforce, never carry, identity.
- **Material quality:** `MeshStandardMaterial`, roughness 0.55–0.8 for cloth, 0.35 for skin/hair with slight sheen; subtle **vertex AO** baked in code (darken crevices at neck, armpits, under hair) using `vertexColors`.
- **Contact shadow:** soft radial-gradient plane under each character, scaled by height off ground (ghosts: fainter, tinted their colour).

### 19.2 The Player — "New Hire"
- **Silhouette:** slight forward-lean eager posture, oversized untucked shirt hem, messy short hair swept to one side (`LatheGeometry` cap + 3–4 merged tuft spheres), a **backpack** worn on one shoulder only (strap across chest — visually anchors the lanyard).
- **Costume:** muted blue oxford shirt `#5B7DA8`, sleeves rolled (cuff cylinders lighter tone), dark charcoal trousers `#2E3238`, white trainers with a coloured heel tab `#E86B4A` (the one warm accent — foreshadows the warm ending), grey backpack `#6E7379`.
- **Skin/hair:** neutral warm skin `#D9A98C`, hair `#3B2A22`. (Keep the character ethnically ambiguous and gender-neutral in name/voice; the design can read either way.)
- **Lanyard (progress item, §3.1):** a thin ribbon `TubeGeometry` around the neck to a badge plane with a `CanvasTexture` redrawn per tier; tier 0 is a torn paper rectangle with a paperclip; tier 7 is a glossy card (`MeshPhysicalMaterial`, clearcoat) with the player's silhouette.
- **Props:** phone in left hand (rounded box, emissive screen, `SpotLight` child, angle 35°, penumbra 0.6, distance 12, intensity ramps per warmth preset); badge in right hand.
- **Expressions used:** neutral (default), worried (brows up-inner, mouth frown) in COLD zones, startled (brows up, mouth open) on scare beats, smile in WARM zones, wide-smile at the finale. The face state is driven by the current lighting preset + scripted overrides — the player visibly relaxes as the game warms.
- **Idle fidgets** (random every 8–15 s idle): check phone, adjust backpack strap, look over shoulder (COLD only), tap badge on palm.

### 19.3 Ghost material & anatomy (shared)
- Two-layer body: **core** = the rig's normal meshes with a custom `ShaderMaterial` (or `MeshPhysicalMaterial` with `transmission` if the quality tier allows): base colour per character at 45% opacity, **fresnel rim** (power 2.5) in the ghost's glow colour, vertical sine-wave distortion of vertex positions (amplitude 1.2 cm, frequency 3, speed 1.5) that decreases with warmth; **shell** = the same meshes scaled 1.04, back-face, additive, 12% opacity for a soft halo.
- Legs fade to transparency below the knee (alpha gradient by world Y) and end in a soft **wisp**: 3 small tapered trails (`TubeGeometry` along a slowly waving spline) beneath the hips.
- Depth-write off, render order after opaque, `depthTest` on so they occlude correctly behind furniture.
- A `PointLight` child (colour = glow colour, intensity 0.6, distance 4) plus 6–10 drifting **motes** (§23) orbiting slowly.
- Hover: y = 0.10 + 0.03·sin(t·1.2); heading tilts 3° toward movement direction.
- **Look-at:** heads track the player when within 6 m (clamped ±60°, slerp 4/s), eyes lead the head by 30 ms — makes them feel alive.
- **Release choreography (all ghosts, ~5 s):** (1) distortion → 0 and colour temperature warms to gold over 1.5 s; (2) exhale SFX, body rises 0.6 m, arms open slightly; (3) shell opacity → 0.6 and expands ×1.6 over 1.2 s; (4) body dissolves bottom-up (alpha threshold by Y, 1.5 s) into 150 upward motes; (5) motes converge into the fragment shard at chest height; shard sequence (§6.3) begins. Their prop is left behind as a physical, now-opaque keepsake object on the floor/desk (Marcus's pager, Priya's marker, Ines's pen [collected], Gary's label maker, Kit's frame, Beatriz's calculator, Sam's telescope cap).

### 19.4 Ghost visual cards (one per character)
| Ghost | Silhouette / hair / accessory | Base colour → glow | Posture & idle loop | Face default | Prop (hand) | Warmth |
|---|---|---|---|---|---|---|
| **Doris** (reception) | Tall beehive hairdo, cat-eye glasses, cardigan with a big brooch | Lilac `#B9A7D9` → pale violet | Perfectly upright behind desk; idle: adjusts glasses, taps a pen, waves at nobody | Bright smile | Pen / telephone receiver on desk | starts 4/10 → ends 10 |
| **Marcus** (ops) | Hoodie hood up, headset around neck, lanyard with 11 keycards | Ice blue `#7FB6E8` → cold cyan | Hunched, restless pacing 1.5 m loop, twitches at pager beeps | Worried | Pager (blinks red) | 1 |
| **Priya** (PM) | Sharp bob, blazer, tablet under arm, standing at the table head | Steel blue-grey `#8FA3B8` → white | Arms crossed, tapping foot, glances at a wall clock every 4 s | Tight neutral | Whiteboard marker | 2 |
| **Standup ghosts ×9** | Variations of the same slouched seated rig (3 hair shapes × 3 shirt tones), mugs | As Priya, dimmer | Seated, occasionally nod / sip / check phone; one is asleep | Neutral | Mugs / laptops | 2 |
| **Ines** (writer) | Long braid over shoulder, big round glasses, oversized knit jumper, sleeves over hands | Soft teal `#8CC5BC` → sea-green | Sits on the desk edge, shoulders in, hugging a binder; idle: pushes glasses up, tucks hair | Wistful small smile | Binder / fountain pen | 5 |
| **Gary** (break room) | Squat, wide stance, chef-ish paper hat?—no: **cap on backwards**, apron over polo, moustache (bevelled torus segment) | Mustard `#D9B85B` → warm yellow | Arms folded, one foot tapping, stares at the fridge; idle: opens/closes fridge door 5 cm | Deadpan frown | Label maker | 6 |
| **Kit** (design) | Half-shaved undercut with a swoop, big scarf, pencil behind ear, paint-splat apron | Coral `#E89A7C` → peach | Steps back, squints, steps in, head tilt; idle: holds up frame at arm's length | Squint | Picture frame | 7 |
| **Beatriz** (finance) | Neat high bun, pearl necklace, reading glasses on a chain, pencil skirt | Sage `#A6C58F` → mint-gold | Seated, very still, only the calculator hand moves; idle: pushes glasses, straightens paper stack | Serene | Ten-key calculator | 8 |
| **Sam** (founder) | Silver hair, rolled shirt sleeves, old company hoodie tied at waist, sitting on the roof ledge | Candle gold `#F2C879` → warm white | Almost still; idle: looks up at sky, small breath, turns to player when they arrive | Gentle smile | Coffee cup that still steams | 10 |

- Every card must be implemented as its own factory (`ghosts/doris.ts` …) built on `CharacterRig`; include a **debug character viewer** (`?debug=chars`) that lines all characters up on a turntable for visual QA.
- Standup ghosts: instance the rig meshes (`InstancedMesh` per part) to keep draw calls low.

## 20. Procedural animation system
- **State machine per character:** `Idle → Walk → Jog → Interact → Startled → Cinematic`, with 0.15–0.25 s cross-blend (lerp joint rotations/positions between the two states' outputs). Never snap.
- **Locomotion (player):** walk cycle from phase φ = distance travelled / stride (stride 0.75 m walk, 1.1 m jog): legs swing ±28° (walk) / ±38° (jog); knees bend on the back-swing; feet plant with a hold at the extreme (no "moon-walk": foot forward speed must match body speed — derive φ from actual displacement); arms counter-swing ±20°/±35°, elbows bent 15°/45°; torso lean 3°/9° forward; head counter-bobs to stay level; hips bob 2 cm/4 cm and sway 1.5°. Torch hand stabilises (arm swing reduced 50%) so the light cone doesn't strobe.
- **Turning:** body yaw slerps toward input direction at 720°/s; head leads the turn by up to 20°; feet shuffle-turn on the spot when input rotates > 90° (short 2-step turn animation).
- **Stop:** small 2-frame settle (hips dip 1 cm, arms swing to rest).
- **Interact:** right arm reaches to the interactable's height (simple 2-bone IK: solve elbow angle to place the hand), head looks at it; 0.5 s, then blends back.
- **Startled** (scare beats): 0.3 s hop (root +12 cm), arms up, brows up, mouth open, torch swings toward the source; then a "shake it off" head turn.
- **Head look-at (both):** targets prioritised: dialogue speaker > nearest interactable in view > movement direction. Eyes lead by 30 ms; clamps: yaw ±70°, pitch ±35°.
- **Ghost specifics:** no ground contact — locomotion is a glide with hips bob only, legs trail; their arm/hand idles per the visual cards are keyframed micro-animations (2–4 keyframes each, ease-in-out).
- **Cinematic:** scripted timelines (`Timeline` helper with keyframes for rig joints, camera, and lights) for: release choreography, rooftop conversation blocking, finale line-up + wave, Doris standing up.
- **Breathing:** chest scale 1 ± 0.012 at 0.25 Hz for everyone, including ghosts (slower, 0.15 Hz).

## 21. Rendering pipeline & quality tiers
- Renderer: `WebGLRenderer({antialias:true, powerPreference:'high-performance'})`, `outputColorSpace = SRGB`, `toneMapping = ACESFilmic`, exposure 1.0 (COLD) → 1.15 (WARM); physically-correct lights; pixel ratio min(devicePixelRatio, 1.5) on High, 1.25 Med, 1.0 Low.
- **Post stack (EffectComposer order):** Render → **SMAA** (or FXAA on Low) → **UnrealBloom** (threshold 0.85, strength 0.35 COLD / 0.55 WARM, radius 0.6; drives all emissives, ghosts, fragments) → **Color grade** (custom shader: per-preset lift/gamma/gain + saturation; COLD: −18% saturation, blue lift; WARM: +8% saturation, warm gain) → **Vignette** (0.35 COLD → 0.15 WARM) → **Film grain** (0.04, animated; off in reduce-motion) → **Chromatic aberration** (0.0015, only on scare beats, lerps to 0 over 0.8 s).
- **Environment map:** small procedural gradient/room-box `PMREMGenerator` env → scene.environment (intensity 0.35) so floors, glass, screens and badge clear-coat have reflections.
- **Floors:** `MeshPhysicalMaterial` polished-lino look, roughness 0.35, clearcoat 0.3 — reflections of fluorescent tubes are a huge part of the "spooky office" read.
- **Glass:** frosted doors via `transmission 0.9, roughness 0.5`; on Low tier fall back to alpha 0.4.
- **Screens/monitors/signage:** emissive `CanvasTexture`, animated where noted (projector loop, server LEDs, vending machine display, login page in-world on a monitor in the lobby as a wink).
- **Quality tiers:** High = full stack; Med = no SMAA→FXAA, bloom half-res, shadows 512²; Low = no bloom/grain/CA, no shadows (blob shadows only), no transmission, fog stronger to hide LOD. Auto-detect: measure 2 s of frame times after load and step down a tier if < 50 fps (once; user can override in settings).
- **Fog:** `FogExp2`, density 0.045 COLD / 0.02 NEUTRAL / 0.008 WARM, colour = preset ambient.

## 22. Lighting design (per-room tables; values are starting points, tune by eye but keep the ratios)
Global: `HemisphereLight(sky, ground)` per preset — COLD `#2B3345`/`#0B0D12` ×0.35; NEUTRAL `#4A4F5C`/`#1A1C22` ×0.5; WARM `#8A6A4E`/`#2A2016` ×0.7. Moonlight `DirectionalLight #6F84B8` ×0.6 through windows (casts shadows in corridor/lobby only).

| Space | Key lights | Practical/emissive | Notes |
|---|---|---|---|
| Lobby | 2 recessed `SpotLight` down over desk `#CFE3FF` ×2.2 (one flickers on the cold open) | REMAP letters (unlit → lit per fragment, `#FF7A59` glow), monitor, lift call button red→green | Add warm `PointLight #FFB36B` ×0 that rises to ×1.8 by finale |
| Corridor | 12 fluorescent tubes = emissive boxes + `RectAreaLight` equivalents (use 6 `PointLight`s, alternate), `#D8FFE8` greenish ×1.2; 3 on flicker timers (random 0.2–3 s), 1 dies at first pass | Exit sign green, badge readers red/green, photocopier screen | Leading-light rule: the next unlocked room's door light is always the brightest thing in view |
| Server room | 4 `PointLight #3A7BFF` ×1.4 low behind racks; Server 6 strobing `#FF2A2A` ×3 (2 Hz) | Hundreds of LED dots via `InstancedMesh` emissive, cable-tray underglow | Coldest room; on solve all LEDs → steady green, lights warm 15% |
| Meeting room | Projector `SpotLight #E8F0FF` ×3 cone on screen (dust in beam §23); ceiling panel `#C9D6E8` ×0.6 | Laptop screens, wall clock | Door-close scare drops key light 40% for 2 s |
| Archive | Single desk lamp `SpotLight #FFD9A0` ×2.5 (THE warm island); rest dim `#3C4658` ×0.25 | Lamp bulb, dust motes lit in cone | Torch is the player's main light here — make the beam beautiful |
| Break room | Fridge interior `PointLight #DFF6FF` ×1.6 when open; fluorescent panel `#E6F1FF` ×0.8; vending machine glow `#7CFFD4` | Microwave clock 88:88, birthday string lights (half dead) | First room with a genuinely cosy light when the fridge opens |
| Design studio | 3 anglepoise `SpotLight #FFC87A` ×1.8 on corkboards + wall | Light-box table emissive, monitor | Warm peach preset locally regardless of global warmth |
| Finance | Desk lamps `#FFE0B0` ×1.2, projected spreadsheet `#F4F8FF` ×1.5 | Calculator displays | The £4.99 cell pulses faintly red until solved |
| Rooftop | Skybox gradient + `DirectionalLight` city glow `#FFB38A` ×0.5 from below horizon; string lights = 40 emissive spheres `#FFD27A` + 4 `PointLight`s | City windows emissive, steaming cup | Slow lightning: brief `DirectionalLight` flash ×4 for 120 ms, no thunder |
| Lift | Interior `RectAreaLight`-style panel `#FFF4E0` ×2 | Logo assembly glow (bloom heavy) | Fully WARM |

## 23. VFX & particle catalogue (one lightweight GPU `Points`/`InstancedMesh` particle class, pooled)
- **Dust motes:** 300 per room, slow drift, lit only inside light cones (fade by dot with spot direction) — Archive, Meeting room projector beam, torch cone.
- **Volumetric torch cone:** additive translucent `ConeGeometry` from the phone, opacity 0.06, soft-edged via fresnel, hides when looking directly along it.
- **Ghost motes:** 6–10 per ghost, orbit radius 0.6 m; **release burst** 150 motes.
- **Fragment shard:** faceted `IcosahedronGeometry` with emissive core + bloom, trail of 40 motes; HUD flight is a screen-space bezier.
- **Sparks (server room):** 20-particle burst, gravity, 0.6 s, orange→white.
- **Paper flutter (archive/meeting):** 8 thin planes tumbling when the player jogs past a pile.
- **Lightning flash / light-tube flicker:** intensity noise curves, plus a matching **screen-space flash** in the color grade (subtle).
- **Finale:** 7 shards orbit (spiral, 6 s), snap into logo pieces with a per-piece bloom pulse; ghost dissolve motes stream to the lobby sign; **confetti of sticky notes** (60 small planes) falls when doors open.
- **Steam** (Sam's cup), **fridge cold breath**, **projector beam haze**: soft additive sprite planes with scrolling noise.
- All VFX off/reduced by quality tier and reduce-motion (motes → static, no flicker flashes).

## 24. Level dressing — prop manifests (minimums; every prop is code-built with bevels, decals and correct scale)
- **Lobby (≥ 18 props):** reception desk with monitor + old CRT (shows the login page), phone, bell, visitor log book, bowl of expired mints, 4 lounge chairs, low table with 2019 magazines, plant (dead), water cooler (empty), turnstile, lift call panel, wall clock stopped at 6:47, framed "Employee of the Month" gallery (all the ghosts' portraits — foreshadowing, players can inspect: 8 toast lines), big REMAP letters, mat "WELCOME" (worn to "WEL OME").
- **Corridor (≥ 25):** tubes, exit signs, 6 posters (canvas text, per §5.2), photocopier, wet-floor sign, fire extinguisher, notice board with 12 pinned notes (readable on inspect), dead plant, recycling bins ×3, a lone office chair rolling slowly when first seen (scare #1b), badge readers per door, windows with blinds (some crooked), ceiling tiles (one missing, cable dangling), radiator, a "You are here" fire map (matches the minimap — a joke players can find).
- **Server room (≥ 14):** 4 racks (each 12 unit boxes, LED strips), cable trays, patch panel, raised floor tiles (one lifted), KVM cart, whiteboard with "DAYS SINCE INCIDENT: 0", desk fan, energy drink cans ×6, sticky note "DO NOT TURN OFF" on Server 6, the 4 puzzle cables with tags.
- **Meeting room (≥ 16):** table, 11 chairs, projector + screen, whiteboard (agenda scribbles canvas), 10 mugs, 3 laptops, biscuit tin, wall clock, phone spider, TV on wall (no signal), flipchart "PARKING LOT" full of items, the 5 hidden notes.
- **Archive (≥ 14):** 8 shelving units with 200+ instanced binders (spine text varies), desk + lamp, rolling ladder, dust everywhere, card-index cabinet, a typewriter, a framed "Docs are love" cross-stitch, 6 decoy binders + the masterwork (glows softly once found).
- **Break room (≥ 16):** fridge (openable door), kettle, microwave, sink with mugs, vending machine (display + coil + the duck behind glass), 2 tables, 6 chairs, bulletin board, banner "HAPPY BIRTHD", cake box, label maker, coffee machine with "OUT OF ORDER (2017)".
- **Design studio (≥ 14):** 3 desks with monitors + tablets, light-box, corkboards, 24 logo variants (canvas), 6 framed candidates, pantone-ish swatch wall, mannequin wearing branded hoodie, plant (alive! first living thing), pencil jars, the pottery shelf of failed ideas.
- **Finance (≥ 12):** 3 cubicles, ten-keys, paper mountains (stacked boxes with paper caps), filing cabinets, projector spreadsheet, a rubber-duck-shaped outline drawn on the desk where it belongs, shredder, framed "AUDIT READY" cert.
- **Rooftop (≥ 12):** AC units, railings, string lights, 2 deckchairs, telescope, cooler, crate table, city skyline (60 buildings with random window grids), water tank, stars (`Points`, 2000), moon.
- **Lift (≥ 6):** doors with logo panel, floor indicator, buttons, mirror (fake via env-map), inspection cert ("last inspected: never"), emergency phone.
- **Text on props:** all via a single `makeLabelTexture(text, style)` helper (fonts bundled locally, §28).

## 25. Held-item & interaction feedback system
- **Held items** (cable, agenda note, binder, sandwich, label maker, duck): a single `HeldItem` slot in player state; the item mesh parents to `handL` (torch tucks to pocket) with a 0.3 s pick-up animation; HUD shows a small item chip next to the sticky note ("Holding: Binder v14"). `B`/Right-click puts it back at its origin. Only one held item at a time; picking another swaps (with a toast).
- **Persistent inventory** (duck, ghost pen): shown as pocket props on the character (§11) and on the enlarged minimap panel.
- **Hover feedback:** the focused interactable gets an **outline** (`OutlinePass` on High/Med, emissive pulse on Low) in white (COLD) / amber (WARM), plus a 2 % scale pulse; prompt fades in over 0.12 s. Puzzle targets accept-highlight green when the correct held item is present, red-shake on wrong.
- **Doors:** approach within 2 m → auto-slide open (0.6 s, ease-out) with SFX; locked → reader flashes red, sticky-note excuse toast, 0.2 s door "clunk".

## 26. Dialogue & choice UX (detail) + writing guide
- **Bubble layout:** max 90 chars per bubble; auto-splits long lines. Speaker name tag on first bubble of an exchange. Bubble anchors 0.25 m above head; if off-screen, clamps to screen edge with an arrow; if speaker behind camera, camera auto-frames (§27).
- **Choices:** 2–3 options as buttons under the player's bubble; keyboard 1/2/3 or ↑↓+E; gamepad D-pad/LS + A; hovering previews nothing (no spoilers).
- **Controls:** E/A advance; hold E/A 0.6 s = fast-forward the exchange; Esc/B never skips story-critical lines, only closes optional chatter.
- **Log:** the enlarged minimap panel has a "Minutes" tab listing the last 30 lines (styled as meeting minutes).
- **Text speed setting:** slow/normal/instant.
- **Writing guide (mandatory for the content pass):** each ghost has a distinct verbal tic (Marcus: incident-report fragments & timestamps; Priya: meeting jargon; Ines: trailing off, "it's fine"; Gary: one-word sentences, justice metaphors; Kit: critique vocabulary; Beatriz: precise numbers, serene; Doris: relentless small talk, calls everyone "love"; Sam: plain, short, kind). Jokes punch at *work*, never at people's identities. The Archive reading and the Rooftop talk are sincere — zero jokes inside them. Minimum line counts: greetings 3, task 2, hints 2, solve 1, release 3–5, echo 1, plus ≥ 10 Doris jokes, 9 Building lines, 7 credit sign-offs, ≥ 3 toasts per zone, 8 portrait toasts, 12 notice-board notes.

## 27. Camera (detail)
- FOV 55° (walk) → 60° (jog), lerp 3/s; near 0.05, far 120.
- **Dialogue framing:** when an exchange starts, camera eases (1 s) to an over-shoulder two-shot: player lower-left third, ghost upper-right third, distance 2.4 m, slight low angle for spooky ghosts / eye-level for warm ones. Orbit input disabled; returns to follow cam on exit.
- **Cinematic mode:** 2.39:1 letterbox bars slide in (0.4 s), HUD hides, input limited to advance; used for release choreography, rooftop, finale.
- **Door transitions:** none needed (contiguous world); on entering a room the first time, a 1.2 s gentle dolly-in on the room's key prop, then control returns.
- **Collision:** spherecast 0.25 m along the boom; also avoid clipping through ghosts (ignore) and glass (allowed).
- **Screen-shake:** tiny (0.5 cm, 0.2 s) on door clunk, vending clunk, lift arrival; none in reduce-motion.
- **Pointer lock:** camera uses `requestPointerLock` on canvas click during PLAY; Esc releases and opens pause; show a "click to look around" hint if the pointer is unlocked during play for > 3 s.

## 28. Web platform hardening
- **Loading screen:** styled as "Installing updates 1 of 1 — do not turn off your computer" with a real progress bar driven by geometry/texture generation steps (build the world in chunks across frames so the bar moves); ends with a "Click to sign in" button — this click satisfies **audio autoplay** policy (create AudioContext on gesture) and grants pointer lock.
- **Fonts:** bundle woff2 files locally (a clean sans + a marker/hand font, permissively licensed) — no Google Fonts at runtime.
- **Tab blur / focus:** auto-pause + mute on `visibilitychange`/blur; resume manually.
- **Resize & DPR:** handle resize, orientation, and DPR changes; UI uses `rem`/`vh`; safe-area padding.
- **Embed:** provide `embed.html` snippet (iframe with `allow="fullscreen; gamepad; autoplay"`), in-game fullscreen toggle (F / View+Start), `postMessage` events for `game:start`, `game:complete` (for website analytics, optional), OG/Twitter meta tags and favicon in `index.html`.
- **Browser support:** Chrome/Edge/Firefox/Safari latest 2 versions; feature-detect WebGL2 (fall back to WebGL1 with Low tier) and show a friendly IT-ticket-styled error page if unavailable.
- **Gamepad menu focus:** all DOM menus are navigable with D-pad/LS + A/B; visible focus ring styled as a highlighted spreadsheet cell.
- **Save schema:** `{ v: 1, ... }` versioned; migrate or reset safely on mismatch; export/import save as a JSON "timesheet" from settings (optional).

## 29. Pacing budget & first 60 seconds
| Segment | Target time | Notes |
|---|---|---|
| Title → badge-in → lobby cold open | 1.5 min | Scare-free, curiosity only |
| Doris intro | 1 min | Teaches talking + hints |
| Server room | 3 min | Peak spook |
| Meeting room | 3.5 min | Search puzzle; cap at 5 hidden spots |
| Archive | 3 min | Includes the 60 s reading beat |
| Break room | 2 min | Fast comic win |
| Design studio | 2.5 min | |
| Finance (+ duck detour if missed) | 2–3.5 min | |
| Rooftop | 2 min | Un-skippable core lines only |
| Finale + credits | 3 min | |
| **Total** | **~24–27 min** | Corridor walks ≤ 20 s each with jog |
- **First 60 seconds script (exact):** 0:00 login page idle-weirdness visible; 0:05 click Sign in → 0:06 loading "update" (≤ 6 s on Med hardware, else show tips); 0:12 badge reader denied/denied/"…fine"; 0:20 door slides, camera pulls back to third person as the lobby lights **drop** and the lift whines dead (startle #0 — a tonal, non-jump beat); 0:28 Building line 1 via intercom; 0:35 sticky note appears with teaching prompts; 0:45 player reaches Doris; 0:60 first joke lands and both starter rooms are pointed at. No menu, no text wall, no unskippable cutscene longer than 8 s before control.

## 30. Debug & authoring tools (required for a one-day build)
- `?debug`: FPS/draw-call/triangle overlay, room teleport keys 1–9, `G` grant fragment, `T` toggle warmth preset, `L` reload dialogue JSON, free-fly camera (`F`), collider wireframes (`C`), quality tier switch.
- `?debug=chars`: character turntable (§19.4) with expression/animation state buttons.
- `?debug=lights`: per-room light intensity/colour sliders (lil-gui or similar, dev-only) that print a config snippet to console for pasting into `config.ts`.
- `?skip=<roomId>`: start with everything before that room solved (for QA of later content).

## 31. Part II acceptance criteria
- [ ] Character turntable: every character is identifiable in silhouette; faces blink, look at the player, and change expression per zone; no mesh gaps at joints while walking/reaching.
- [ ] Player locomotion has no foot-slide; turns, stops and starts read naturally at both speeds; torch beam does not strobe while walking.
- [ ] All 8 release sequences play per §19.3 choreography with keepsake left behind.
- [ ] Post stack renders on High with bloom on emissives/ghosts, correct tone mapping, grain, vignette; Med/Low tiers visibly degrade gracefully with no black screens; auto-tier steps down on slow hardware.
- [ ] Each room's lighting matches its table row in mood; the "leading light" rule holds — testers can find the next room without the minimap.
- [ ] Every prop manifest minimum is met; every inspectable has a toast; no floating/intersecting props; all text legible at 1080p.
- [ ] Held-item flow: pick up / swap / put back works with kb+mouse and pad; outlines highlight the focused object; wrong-item feedback is clear.
- [ ] Dialogue framing, letterbox cinematics, and pointer lock behave per §27 in Chrome, Firefox and Safari; Esc releases lock and pauses.
- [ ] Loading screen shows real progress; audio starts only after the sign-in click; tab blur pauses and mutes.
- [ ] Pacing playtest by 2 people lands between 20 and 32 minutes with ≤ 3 hint uses each.
- [ ] Embed snippet works inside an iframe on a test page with fullscreen + gamepad.

*End of specification (v2.0). Everything above is in scope for v1 unless marked v2. When ambiguity is found, favour the Design Pillars (§1.2) and the quality bar of Part II, then ship.*
