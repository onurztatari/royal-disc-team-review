# Terra Games studio bumper — v3.3 (23 Sep 2026)

Designer's wordmark **as delivered** (his letters, his background, his shadow) + the Terra wireframe sphere as the mark:
field already on screen → TERRA GAMES writes in letter by letter → the sphere sparks in at 1.00 s and completes one full turn, decelerating (done by 1.9 s) → holds.
Total 2.6 s. The last frame is the approved static.

## Files
| File | Use |
|---|---|
| `terra-bumper.js` + `assets/` | Drop-in ES module for the game (web view / Capacitor / any HTML5 engine). Keep `assets/` next to the .js — it resolves them via `import.meta.url`. ~700 KB total. |
| `demo.html` | Runs the module (serve the folder over http; ES modules do not load from `file://`). |
| `terra-bumper-standalone.html` | Everything inline in one file; `?t=1.2` freezes it at 1.2 s (used to render the video). |
| `video/TerraGames_Bumper_1290x2796_60fps.mp4` | H.264 master for non-web engines, store previews, Miro. |
| `video/TerraGames_Bumper_1080x2340_30fps.mp4` | Android-friendly encode. |
| `static/TerraGames_LoadScreen_*.png` | The static load screen (end frame), 1290×2796 and 1080×2400. |
| `static/TerraGames_Wallpaper_iPhone_1290x2796.png` | Same lockup set at 57% height — clears the lock-screen clock. |
| `static/TerraGames_Splash_FieldOnly_*.png` | Field only — what the OS shows before the web view is up. |
| `static/capacitor_splash_field_2732.png` | `resources/splash.png` for `@capacitor/assets` (field only, recommended). |
| `static/capacitor_splash_lockup_2732.png` | Same with the lockup, if you prefer a static-only splash. |

## Integration (web / Capacitor)
```js
import { playTerraBumper } from './terra-bumper.js';
await playTerraBumper({ fadeOut: true });   // resolves after ~2.9 s (2.6 s + 0.26 s fade)
startGame();
```
Seamless handoff from the native splash:
1. Native splash = **field only** (`capacitor_splash_field_2732.png`), `SplashScreen.launchAutoHide = false`, `backgroundColor = "#0044FC"`.
2. Hide it on the bumper's first painted frame:
   `await playTerraBumper({ fadeOut: true, onStart: () => SplashScreen.hide({ fadeOutDuration: 0 }) });`
   Both sides show the same field, so the user only sees the wordmark write in.
3. Load assets while it plays; pass `hold: <seconds>` if loading needs longer.

Manual control: `const b = mountTerraBumper(el); await b.ready; b.seek(t); await b.play(); b.destroy();`

## Non-web engines
Play the MP4 full-bleed (cover), then cut to `TerraGames_LoadScreen_*.png` — same image as the last frame.

## Notes
- Source resolution is the designer's 852×1846 file; the lockup is Lanczos-upscaled 1.51× for 1290-px screens. If the designer exports the same file at 1290×2796 or 3×, drop it in and re-run the build — nothing else changes.
- Sphere: R 46 in a 100 box, all in the letters' cream #F4F5E9 — ring 6.0, lines 4.2, meridians 0°/48°/96°, parallels ±30°/0°, view tilt 18°, roll −16°, rests at 42° (axis upright, symmetric bows either side); hidden-line removal (only the front of each circle is drawn) and the wireframe clipped to r 43.5 so nothing fuses with the limb; hard shadow on the ring only (#0225C8, masked to outside the silhouette so it never shows through the globe), matching the letters. Box = the designer's globe slot (64 design px at 780, 918).
- Timing (s): letters 0.18 + 0.055·i, 0.34 each · sphere spark (scale 0→1, cubic-bezier(.2,.8,.2,1)) 1.00–1.26 · one 360° turn 1.00–1.90 decelerating with cubic-bezier(.16,.84,.24,1) · end 2.60. `playTerraBumper({ lockupY: 0.57 })` gives the wallpaper placement.
