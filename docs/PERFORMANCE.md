# Ride performance on low-end machines

The homepage ride (`assets/js/world-v7.js`) was made much lighter for weak CPUs and GPUs. This page records what was wrong, what changed, how it was measured and how to undo it.

## What was wrong

Measured on a 4-core, 4 GB profile (which switches the ride to its low-power path) with the CPU slowed 6 times:

- **About 1,500 draw calls a frame.** Only a tenth were the instanced trees and grass. The rest were animals (each part its own mesh, drawn even when far away), props, clouds, sprites and landmarks.
- **139 shader programs compiled one at a time on the main thread**, each at the moment its material first appeared. On a weak GPU that froze the page for seconds.
- **The world was built in one long task** of about 2.3 s.
- **Every frame recomputed the world matrix of roughly 6,500 objects**, most of which never move.

## What changed

These changes were first generated from `world-v6.js` by a patch script. Since then `assets/js/world-v7.js` has been edited in place (ride physics, helmet, speed feel, design drops), so it is the only source of truth; the old generator, `world-v6.js` and the one-off patch scripts were removed and live in git history.

| Change | Effect |
|---|---|
| **Shader warm-up.** Every distinct material variant is compiled with `compileAsync` (parallel, off the main thread) before the first frame, against the render target the scene really draws into. Skipped when the browser has no `KHR_parallel_shader_compile`. | No compile freezes in the first seconds of the ride. |
| **Cooperative building.** `createWorld` is async and yields to the browser about every 10 ms while it builds the world. `Portfolio.dc.html` awaits it. | The longest single freeze fell from about 2.3 s to about 0.35 s (6x slowdown). |
| **Distance culling of small props and animals** (direct children of the scene only; not lights, custom shaders, unfogged materials, guide wisps, notes, flares). Uses the fog distance and an on-screen size test. | Draw calls fell by more than half. |
| **Static batching.** Scenery that never moves (canyon walls, rocks, boulders, birch trees, pier posts, ruin columns) is merged into one mesh per material and map cell. Each cloud's puffs are merged into one mesh. | Fewer, larger draws. |
| **Matrix updates only where needed.** Static chunks and terrain tiles are frozen. Hidden roots are skipped and refreshed when they reappear. | Matrix work fell by about two thirds. |
| **Lambert scenery in low-power mode.** The scenery was roughness 0.9 / metalness 0 standard material, which lights almost the same as Lambert but costs far more to compile and draw. Bike, rider and companion are unchanged. | Cheaper shaders on weak GPUs. |

## Results (same machine, same profile, v6 against v7)

| | v6 | v7 |
|---|---|---|
| Draw calls per frame | about 1,500 | about 640 |
| Frame rate, 6x slowdown | 32 fps | 60 fps (the display limit) |
| Frame rate, 12x slowdown | 15 fps | 22 to 28 fps |
| Worst single frame, 6x | 2.3 s | 0.35 s |
| Long-task time, no slowdown | 727 ms | 120 ms |
| Long-task time, 12x slowdown | 17.6 s | 6.3 to 7.8 s |

The first draw arrives later than in v6 (3.9 s against 3.2 s at 6x) because the shaders are compiled first. In v6 that work happened after the first draw, as freezes.

These are lab numbers on a fast GPU. They do not include the real cost of shader compilation on a slow integrated GPU, which is the part the warm-up is meant to hide.

## Known limits

- Without `KHR_parallel_shader_compile` (software rendering, a few old drivers) shader compilation still blocks the main thread. Lighthouse and PageSpeed Insights render in software, so their homepage scores improve only a little.
- Merging and culling only touch the kinds of object the original patch script listed. Anything else is drawn as before.
- `createWorld` now returns a promise. `await` on an older synchronous version from git history still works.

## Measuring

```bash
npm install --no-save puppeteer-core
node scripts/perf/frame-stats.cjs "http://localhost:8775/?perf" 6 18 1366x768 low
LOWEND=1 node scripts/perf/cpu-profile.cjs http://localhost:8775/ 6 18 myrun
node scripts/perf/analyze-profile.cjs myrun
node scripts/perf/busy-stretches.cjs myrun 100
```

`?perf` on the page URL exposes `window.__apW = { renderer, scene }` for ad-hoc inspection.

## Rolling back

Restore an earlier `assets/js/world-v7.js` from git history (`git log -- assets/js/world-v7.js`, then `git checkout <commit> -- assets/js/world-v7.js`) and bump its `?v=` in `Portfolio.dc.html`.
