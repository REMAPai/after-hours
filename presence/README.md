# presence/ — v2 seam (DO NOT BUILD in v1)

Multiplayer/presence is explicitly out of scope for v1 (spec §15). This folder is the clean seam.

## Intended interface

All player state a presence layer needs already flows through one place:

- `Game.currentRoom: RoomId` — the room the local player is in
- `Player.pos: THREE.Vector3` / `Player.facing: number` — position + heading
- `Game.fragments: FragmentId[]` — progress (for cosmetic display)

A future presence layer would:

1. Open a WebSocket to a presence server.
2. Publish `{ room, x, z, facing, name }` at ~5 Hz (throttled, only while `phase === 'PLAY'`).
3. Subscribe to peers and render each as a simple ghost-shader avatar (reuse
   `characters/ghosts.ts` → `Ghost('standup')`) with a floating DOM name-tag
   (reuse the speech-bubble projection in `game/dialogue.ts`).
4. Despawn on disconnect; fade avatars in the player's current room only.

No game logic may depend on presence. It is cosmetic only.
