#!/usr/bin/env python3
"""Builds world-v7.js from world-v6.js by applying the low-end performance patches below.

Run from the repo root:  python3 scripts/make-world-v7.py
world-v6.js stays untouched (it is the rollback). Every patch anchors on an exact string and the script stops if an
anchor is missing, so a changed world file fails loudly instead of being half-patched.

What the patches do (measured on a 4-core / 4 GB profile at 6x CPU slowdown, see docs/SETUP.md):
  1. warm-up   compile every shader program before the first frame with renderer.compileAsync (parallel, off the main
               thread). Without it each new material links synchronously in the middle of a frame; on a weak GPU that
               froze the page for seconds.
  2. freeze    static chunks and terrain tiles stop being matrix-updated every frame.
  3. cull      small props and animals (direct children of the scene) are hidden once they are further away than they
               could be seen, which removes their draw calls. Uses the fog distance the chunk culling already uses.
  4. debug     ?perf in the URL exposes window.__apW = { renderer, scene } for profiling.
  6. lambert   low-power mode builds scenery materials as MeshLambertMaterial instead of MeshStandardMaterial.
  5. slice     createWorld becomes async and yields to the browser about every 10 ms while the world is built
               (scripts/slice-world.cjs, needs `npm install --no-save acorn`). Portfolio.dc.html awaits it.
"""
import re, sys, os

ROOT = os.path.join(os.path.dirname(__file__), '..')
src = open(os.path.join(ROOT, 'world-v6.js'), encoding='utf8').read()


def patch(text, anchor, new, count=1, label=''):
    n = text.count(anchor)
    if n < 1:
        sys.exit('anchor not found for patch "%s": %r' % (label, anchor[:70]))
    if count and n != count:
        sys.exit('anchor for "%s" matched %d times, expected %d' % (label, n, count))
    return text.replace(anchor, new)


# ---------------------------------------------------------------- 4. debug hook
src = patch(src, "  const scene = new THREE.Scene();",
            "  const scene = new THREE.Scene();\n"
            "  scene.matrixWorldAutoUpdate = false; // v7: world matrices are updated by updateRoots() in the frame loop, skipping hidden and static roots\n"
            "  if (/[?&]perf\\b/.test(location.search)) window.__apW = { renderer, scene, get lowPower() { return lp; } };",
            label='debug')

MERGE_JS = r'''
  // v7: merge helpers. mergeKids() folds the plain child meshes of one group into a single mesh (same material). mergeStatic() batches
  // scenery that never moves (each kind is created once, nothing else refers to it) into one mesh per material and map cell.
  const bakeMerge = (list, name) => {
    const g0 = list[0].geometry, names = Object.keys(g0.attributes);
    if (list.some(o => { const a = Object.keys(o.geometry.attributes); return a.length !== names.length || a.some(n => !g0.attributes[n] || !(o.geometry.attributes[n].array instanceof Float32Array)); })) return null;
    const geos = list.map(o => { const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); o.updateMatrix(); g.applyMatrix4(o.matrix); return g; });
    let nv = 0; geos.forEach(g => { nv += g.attributes.position.count; });
    const mg = new THREE.BufferGeometry();
    names.forEach(n => { const a0 = geos[0].attributes[n], arr = new Float32Array(nv * a0.itemSize); let off = 0; geos.forEach(g => { arr.set(g.attributes[n].array, off); off += g.attributes[n].array.length; }); mg.setAttribute(n, new THREE.BufferAttribute(arr, a0.itemSize, a0.normalized)); });
    mg.computeBoundingSphere(); geos.forEach(g => g.dispose());
    const m = new THREE.Mesh(mg, list[0].material); m.name = name; m.castShadow = list[0].castShadow; m.receiveShadow = list[0].receiveShadow; return m; };
  const mergeKids = (grp, name) => { const kids = grp.children.filter(c => c.isMesh && !c.isInstancedMesh && !Array.isArray(c.material)); if (kids.length < 2 || kids.some(k => k.material !== kids[0].material)) return;
    const m = bakeMerge(kids, name); if (!m) return; kids.forEach(k => grp.remove(k)); grp.add(m); };
  const STATIC_MERGE = /^(canyon-wall|ridge-rock|moss-boulder|moss-cap|shore-rock|birch-trunk|birch-leaf|pier-post|ruin-column)$/;
  const mergeStatic = () => { const B = new Map();
    scene.children.forEach(o => { if (!o.isMesh || o.isInstancedMesh || o.userData.apMerged || !STATIC_MERGE.test(o.name) || Array.isArray(o.material) || o.geometry.morphAttributes.position) return;
      const k = o.material.uuid + '|' + Math.floor((o.position.x + 2000) / CH) + '|' + Math.floor((TZ0 - o.position.z) / CH) + '|' + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0); let b = B.get(k); if (!b) B.set(k, b = []); b.push(o); });
    B.forEach(list => { if (list.length < 2) return; const m = bakeMerge(list, list[0].name + '-merged'); if (!m) return;
      list.forEach(o => scene.remove(o)); const bs = m.geometry.boundingSphere; m.userData.apMerged = true; m.userData.chunked = true; m.userData.cx = bs.center.x; m.userData.cz = bs.center.z; m.userData.r = bs.radius;
      scene.add(m); chunks.push(m); freeze(m); }); };
'''

# ---------------------------------------------------------------- 2. freeze static chunks and terrain tiles
src = patch(src, "  // Spatial chunking: split big instanced sets so frustum + distance culling can skip them\n",
            "  // v7: static objects never move, so stop recomputing their world matrix every frame\n"
            "  const freeze = o => { o.matrixAutoUpdate = false; o.userData.apStatic = true; o.updateMatrix(); o.updateMatrixWorld(true); };\n"
            + MERGE_JS +
            "  // Spatial chunking: split big instanced sets so frustum + distance culling can skip them\n",
            label='freeze-def')
src = patch(src, "scene.add(n); chunks.push(n); v4Chunk(n); });",
            "scene.add(n); chunks.push(n); v4Chunk(n); freeze(n); if (n.userData.lo) freeze(n.userData.lo); });",
            label='freeze-chunks')
src = patch(src, "m.receiveShadow = !lp && J.cell < 10; scene.add(m); return m; }",
            "m.receiveShadow = !lp && J.cell < 10; scene.add(m); freeze(m); return m; }",
            label='freeze-tiles')

src = patch(src, "scene.remove(im); }); };\n  chunkify();", "scene.remove(im); }); mergeStatic(); };\n  chunkify();", label='merge-static')
src = patch(src, "m.rotation.set(rnd(), rnd(), rnd()); g.add(m); } g.position.set(x, y, z); scene.add(g); clouds.push(",
            "m.rotation.set(rnd(), rnd(), rnd()); g.add(m); } mergeKids(g, 'cloud-puffs'); g.position.set(x, y, z); scene.add(g); clouds.push(", label='merge-clouds')


# ---------------------------------------------------------------- 6. cheaper materials in low-power mode
# The scenery is almost all roughness 0.9 / metalness 0 flat-shaded standard material, which lights almost exactly like Lambert but costs
# far more shader work to compile and to draw. Low-power mode uses Lambert for it. Bike, rider and companion materials are built directly
# (Standard/Physical) and are left alone. Every shader patch in the file only touches chunks that Lambert has too.
src = patch(src, "  const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.9, metalness: 0, ...o });",
            "  const std = lp ? (c, o = {}) => { const { roughness, metalness, envMapIntensity, ...rest } = o; const m = new THREE.MeshLambertMaterial({ color: c, flatShading: true, ...rest }); m.roughness = roughness === undefined ? 0.9 : roughness; m.metalness = metalness || 0; return m; }\n"
            "    : (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.9, metalness: 0, ...o });",
            label='lambert')

# ---------------------------------------------------------------- 1 + 3. warm-up and small-prop culling, defined before the frame loop
HELPERS = r'''
  // v7: shader warm-up. Every distinct material variant in the scene is compiled up front with compileAsync (parallel, off the
  // main thread) and the first frame waits for it. Details that matter:
  //  - the scene is drawn into postRT, and three.js builds different programs for a render target than for the canvas, so the
  //    compile calls run with postRT (or BL.a for the bloom passes) selected;
  //  - one representative object per variant (material + instancing + vertex colours + shadow flags) is compiled, through a small
  //    stand-in scene that carries the real lights and fog, so a call does not have to walk all ~6,000 objects;
  //  - proxies share the real geometry and material but are never added to the scene, and only a few milliseconds of work run per frame.
  let warm = 0, warmT0 = 0, warmJobs = [], warmProxies = null; const warmSeen = new Set(), warmScene = new THREE.Scene();
  const warmKey = o => { const m = o.material; return (Array.isArray(m) ? m.map(x => x.uuid).join() : m.uuid) + '|' + (o.isInstancedMesh ? 'i' + (o.instanceColor ? 'c' : '') : '') + (o.isPoints ? 'p' : o.isLine ? 'l' : o.isSprite ? 's' : '') + (o.geometry && o.geometry.attributes.color ? 'v' : '') + (o.receiveShadow ? 'r' : '') + (o.castShadow ? 'a' : ''); };
  const warmCollect = () => { const seen = warmSeen, out = [], L = [];
    scene.traverse(o => { if (o.isLight) { if (o.visible) L.push(o); return; } if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite) || !o.material) return; const k = warmKey(o); if (seen.has(k)) return; seen.add(k); out.push(o); });
    warmScene.children = L; warmScene.fog = scene.fog; warmScene.environment = scene.environment;
    return out.map(o => { let p;
      if (o.isInstancedMesh) { p = new THREE.InstancedMesh(o.geometry, o.material, 1); if (o.instanceColor) p.setColorAt(0, new THREE.Color()); }
      else if (o.isPoints) p = new THREE.Points(o.geometry, o.material); else if (o.isLine) p = new THREE.Line(o.geometry, o.material); else if (o.isSprite) p = new THREE.Sprite(o.material); else p = new THREE.Mesh(o.geometry, o.material);
      p.receiveShadow = o.receiveShadow; p.castShadow = o.castShadow; p.frustumCulled = false; return p; }); };
  const warmRun = (list, jobs, budget) => { const t0 = performance.now(); renderer.setRenderTarget(postRT);
    while (list.length && performance.now() - t0 < budget) { try { jobs.push(renderer.compileAsync(list.pop(), camera, warmScene)); } catch (err) { /* skip */ } }
    renderer.setRenderTarget(null); };
  const warmFinish = () => { if (warm < 2) { warm = 2; warmProxies = null; opts.onWarm && opts.onWarm(performance.now() - warmT0); } };
  const warmStep = () => { // once per frame while warming
    if (!warmProxies) { warmProxies = warmCollect();
      renderer.setRenderTarget(BL.a); fsq.material = brightMat; warmJobs.push(renderer.compileAsync(fsScene, postCamB)); fsq.material = blurMat; warmJobs.push(renderer.compileAsync(fsScene, postCamB));
      renderer.setRenderTarget(null); warmJobs.push(renderer.compileAsync(postScene, postCam)); return; }
    warmRun(warmProxies, warmJobs, 10);
    if (!warmProxies.length) Promise.all(warmJobs).then(warmFinish, warmFinish);
  };
  // Without KHR_parallel_shader_compile (software GL, a few old drivers) compiling up front would just block the main thread for longer, so leave it lazy.
  const canWarm = () => { try { return renderer.extensions.has('KHR_parallel_shader_compile'); } catch (err) { return false; } };
  const beginWarm = () => { warm = 1; warmT0 = performance.now(); try { mergeStatic(); } catch (err) { console.warn(err); } if (!canWarm()) { warmFinish(); return; } setTimeout(warmFinish, 12000); };
  // After each deferred build step, compile the new materials in the background, a few at a time, without holding the frame.
  const warmMore = () => { try { if (!canWarm()) return; const ps = warmCollect(), jobs = []; const step = () => { warmRun(ps, jobs, 4); if (ps.length) setTimeout(step, 24); }; step(); } catch (err) { /* ignore */ } };

  // v7: distance culling for small props and animals. Only direct children of the scene, only if they are small, use fog,
  // contain no lights and no custom shaders. "Hidden" is a separate flag so the world's own show/hide logic is untouched.
  const cullList = [], cullQ = [], cullSeen = new WeakSet(), cullBox = new THREE.Box3(), cullSph = new THREE.Sphere();
  const CULL_SKIP = /^(sky|cloud|star|sun|moon|flare|wind|water|road|terrain|far-|aurora|rain|snow|dust|petal|leaf|fog|spark|fire|glow|ground|bike|rider|dino|muja|wheel|wisp|note|hit)/i;
  const vAcc = o => { if (o._apAcc) return; o._apAcc = true; let v = o.visible; Object.defineProperty(o, 'visible', { get() { return v && !this._apHide; }, set(x) { v = x; }, configurable: true }); };
  const cullEligible = o => {
    if (!(o.isMesh || o.isGroup || o.isSprite || o.type === 'Object3D') || o.isInstancedMesh || o.userData.chunked || o.frustumCulled === false || CULL_SKIP.test(o.name || '')) return false;
    let ok = true;
    o.traverse(c => { if (!ok) return; if (c.isLight || c.isPoints || c.isLine || c.isSkinnedMesh) { ok = false; return; }
      if (c.material) (Array.isArray(c.material) ? c.material : [c.material]).forEach(m => { if (m.isShaderMaterial || m.fog === false || m.isPointsMaterial || m.isSpriteMaterial) ok = false; }); });
    return ok;
  };
  const cullScan = () => { for (const o of scene.children) if (!cullSeen.has(o)) { cullSeen.add(o); cullQ.push(o); } };
  const cullStep = n => { // measure a few new candidates per frame so the cost is spread out
    while (n-- > 0 && cullQ.length) { const o = cullQ.pop(); if (!cullEligible(o)) continue;
      cullBox.setFromObject(o); if (cullBox.isEmpty()) continue; cullBox.getBoundingSphere(cullSph);
      const r = cullSph.radius + cullSph.center.distanceTo(o.position); if (r > 70) continue;
      vAcc(o); cullList.push({ o, r }); } };
  const updateRoots = () => { const ch = scene.children; for (let i = 0; i < ch.length; i++) { const o = ch[i]; if (o._apHide || o.userData.apStatic) continue; o.updateMatrixWorld(); } };
  const cullPass = () => {
    const cp = camera.position, lim = scene.fog.far + 20, PX = lp ? 3 : 1.4, F = (renderer.domElement.height / 2) / Math.tan(camera.fov * Math.PI / 360);
    for (let i = 0; i < cullList.length; i++) { const c = cullList[i], o = c.o, p = o.position, dx = p.x - cp.x, dy = p.y - cp.y, dz = p.z - cp.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz) - c.r;
      const lim2 = Math.min(lim, c.r * F / PX + 30);   // beyond this the object is under about a pixel, or fully fogged
      if (o._apHide) { if (d < lim2 * 0.9) { o._apHide = false; o.updateMatrixWorld(true); } } else if (d > lim2) o._apHide = true; } };
'''
src = patch(src, "\n  function loop(now) {\n", HELPERS + "\n  function loop(now) {\n", label='helpers')

# gate the first frame on the warm-up and run the cull pass
src = patch(src, "    renderer.setRenderTarget(postRT); renderer.render(scene, camera);\n    const doBloom = tier > 0;",
            "    if (frameNo % 6 === 3) { cullScan(); cullStep(160); cullPass(); }\n"
            "    if (warm < 2) { if (warm === 0) beginWarm(); warmStep(); if (warm < 2) return; }\n"
            "    updateRoots();\n"
            "    renderer.setRenderTarget(postRT); renderer.render(scene, camera);\n    const doBloom = tier > 0;",
            label='gate-and-cull')

# after every deferred build step, compile the new materials in the background
src = patch(src, "seed = saved; chunkify(); hookAll(); renderer.shadowMap.needsUpdate = true;",
            "seed = saved; chunkify(); hookAll(); warmMore(); renderer.shadowMap.needsUpdate = true;",
            label='warm-more')


# ---------------------------------------------------------------- 7. phone start-up
# Phones started at tier 2 (pixel ratio 1.75) with 4x MSAA on the post target, and the adaptive quality needed ~60 slow frames
# plus a cool-down per step to react, so the first seconds were choppy. Start at the lowest tier without MSAA and climb.
src = patch(src, "samples: lp && !opts.mobile ? 0 : 4", "samples: lp || opts.mobile ? 0 : 4", label='msaa')
src = patch(src, "let tier = opts.mobile ? (lp ? 1 : 2) : (lp ? 1 : 3)", "let tier = opts.mobile ? 0 : (lp ? 1 : 3)", label='phone tier')
src = patch(src, "if (++perf.good >= 5 &&", "if (++perf.good >= (opts.mobile ? 3 : 5) &&", label='phone climb')
# phones run the low-power path (Portfolio.dc.html passes lowPower on narrow screens) but may still climb tiers, unlike a low-end desktop
src = patch(src, "paused = false, forceLow = lp;", "paused = false, forceLow = lp && !opts.mobile;", label='phone force-low')

out = os.path.join(ROOT, 'world-v7.js')
open(out, 'w', encoding='utf8').write(src)
import subprocess
subprocess.run(['node', os.path.join(ROOT, 'scripts', 'slice-world.cjs')], check=True)   # needs: npm install --no-save acorn
print('wrote world-v7.js (%d bytes, v6 is %d)' % (len(src.encode('utf8')), len(open(os.path.join(ROOT, 'world-v6.js'), encoding='utf8').read().encode('utf8'))))
