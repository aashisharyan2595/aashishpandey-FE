/* Story engine (browser side). A story pack (stories/<name>.js) fills window.PACK = { scenes: [ { build(C), draw(t, C), sfx(C), cam(t, C) } ] }.
   window.boot(cfg) builds one scene, window.draw(t) paints it at t seconds, window.sfxList() lists its sound effects. Everything is a pure function of t. */
(function () {
  const K = window.KIT, P = K.P;
  const clamp = (x, a, b) => Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, x));
  const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
  const ei = (x) => Math.pow(clamp(x), 3);
  const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const back = (x) => { x = clamp(x); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const elastic = (x) => { x = clamp(x); return x === 0 || x === 1 ? x : Math.pow(2, -9 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI) / 3) + 1; };
  const lerp = (a, b, p) => a + (b - a) * p;
  const rn = (i, k) => { const x = Math.sin(i * 127.1 + (k || 0) * 311.7) * 43758.5453; return x - Math.floor(x); };
  const ids = {}; const $id = (id) => ids[id] || (ids[id] = document.getElementById(id));
  // move/rotate/scale a drawn piece: (x,y) shifts it, r degrees and scale pivot on (ox,oy) in the piece's own coordinates
  function put(id, o) {
    const e = $id(id); if (!e) return; o = o || {};
    const sx = o.sx !== undefined ? o.sx : o.s !== undefined ? o.s : 1, sy = o.sy !== undefined ? o.sy : o.s !== undefined ? o.s : 1, ox = o.ox || 0, oy = o.oy || 0;
    e.setAttribute('transform', `translate(${(o.x || 0).toFixed(2)} ${(o.y || 0).toFixed(2)}) translate(${ox} ${oy}) rotate(${(o.r || 0).toFixed(2)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-ox} ${-oy})`);
    if (o.o !== undefined) e.setAttribute('opacity', clamp(o.o).toFixed(3));
  }
  const show = (id, v) => { const e = $id(id); if (e) e.setAttribute('opacity', clamp(v).toFixed(3)); };
  const text = (id, s) => { const e = $id(id); if (e && e.textContent !== s) e.textContent = s; };
  const MOUTH = { calm: 'M-24 -282 Q0 -274 24 -282', happy: 'M-36 -292 Q0 -254 36 -292', worried: 'M-26 -270 Q0 -292 26 -270', smirk: 'M-26 -278 Q10 -268 30 -292', flat: 'M-24 -280 L24 -280' };
  const BROWS = { calm: [0, 0, 0], happy: [0, 0, 0], worried: [-18, 18, 1], shock: [0, 0, 1], curious: [0, -14, 1], smirk: [10, -4, 1], angry: [16, -16, 1], flat: [0, 0, 1] };
  // pose a robot. p: x y s flip T mood look armL armR head talk sweat bob eyeS
  function bot(id, p) {
    p = p || {}; const s = p.s || 1, T = p.T || 0, mood = p.mood || 'calm', bob = p.bob || 0, br = BROWS[mood] || BROWS.calm;
    put(id, { x: p.x || 0, y: (p.y || 0) + bob, sx: s * (p.flip ? -1 : 1), sy: s });
    put(id + 'body', { sy: 1 + 0.012 * Math.sin(T * 2.2), ox: 0, oy: -60 });
    put(id + 'armL', { r: p.armL || 0, ox: -125, oy: -215 }); put(id + 'armR', { r: -(p.armR || 0), ox: 125, oy: -215 });
    put(id + 'head', { r: p.head || 0, ox: 0, oy: -235, y: Math.sin(T * 2.2 + 0.6) * 3 });
    const blink = (T % 3.1) < 0.13 ? 0.1 : 1, es = p.eyeS || (mood === 'shock' ? 1.22 : mood === 'happy' ? 0.78 : 1);
    put(id + 'eL', { sy: blink * es, ox: -50, oy: -336 }); put(id + 'eR', { sy: blink * es, ox: 50, oy: -336 });
    const lx = (p.look || 0) * 9, ly = (p.lookY || 0) * 7; put(id + 'pL', { x: lx, y: ly }); put(id + 'pR', { x: lx, y: ly });
    put(id + 'bL', { r: br[0], ox: -53, oy: -383, y: mood === 'shock' || mood === 'curious' ? -10 : 0 }); put(id + 'bR', { r: br[1], ox: 53, oy: -383, y: mood === 'shock' ? -10 : 0 }); show(id + 'bL', br[2]); show(id + 'bR', br[2]);
    const talk = p.talk || 0, m = $id(id + 'mouth'); if (m) { m.setAttribute('d', MOUTH[mood] || MOUTH.calm); m.setAttribute('opacity', talk > 0.15 || mood === 'shock' ? 0 : 1); }
    const mo = $id(id + 'mouthO'); if (mo) { const open = mood === 'shock' ? 0.8 : talk; mo.setAttribute('opacity', open > 0.15 ? 1 : 0); mo.setAttribute('ry', (4 + 17 * open).toFixed(1)); mo.setAttribute('cy', (-282 + 4 * open).toFixed(1)); }
    const sw = clamp(p.sweat || 0), sweat = $id(id + 'sweat'); if (sweat) { sweat.setAttribute('opacity', sw > 0 ? 0.9 : 0); sweat.setAttribute('transform', `translate(0 ${(((T * 1.1) % 1) * 36 * sw).toFixed(1)})`); }
    put(id + 'ant', { s: 1 + 0.12 * Math.sin(T * 4), ox: 0, oy: -466 });
  }
  const DMOUTH = { calm: 'M-24 -252 Q0 -244 24 -252', happy: 'M-38 -258 Q0 -222 38 -258', worried: 'M-26 -240 Q0 -262 26 -240', smirk: 'M-24 -250 Q10 -242 34 -262', flat: 'M-24 -250 L24 -250', shock: 'M-24 -250 L24 -250', curious: 'M-24 -250 Q0 -240 24 -252' };
  // pose Mujasauraus. p: x y s flip T mood look lookY armL armR head talk bob wag wagA eyeS sweat
  function dino(id, p) {
    p = p || {}; const s = p.s === undefined ? 1 : p.s, T = p.T || 0, mood = p.mood || 'calm', br = BROWS[mood] || BROWS.calm;
    put(id, { x: p.x || 0, y: (p.y || 0) + (p.bob || 0), sx: s * (p.flip ? -1 : 1), sy: s });
    put(id + 'body', { sy: 1 + 0.014 * Math.sin(T * 2.4), ox: 0, oy: -60 });
    put(id + 'armL', { r: p.armL || 0, ox: -110, oy: -190 }); put(id + 'armR', { r: -(p.armR || 0), ox: 110, oy: -190 });
    put(id + 'head', { r: p.head || 0, ox: 0, oy: -215, y: Math.sin(T * 2.4 + 0.6) * 3 });
    put(id + 'tail', { r: Math.sin(T * (p.wag || 5)) * (p.wagA === undefined ? 9 : p.wagA), ox: 60, oy: -150 });
    const blink = (T % 3.3) < 0.13 ? 0.1 : 1, es = p.eyeS || (mood === 'shock' ? 1.18 : mood === 'happy' ? 0.82 : 1);
    put(id + 'eL', { sy: blink * es, ox: -46, oy: -318 }); put(id + 'eR', { sy: blink * es, ox: 46, oy: -318 });
    const lx = (p.look || 0) * 9, ly = (p.lookY || 0) * 7; put(id + 'pL', { x: lx, y: ly }); put(id + 'pR', { x: lx, y: ly });
    put(id + 'bL', { r: br[0], ox: -46, oy: -368, y: mood === 'shock' || mood === 'curious' ? -10 : 0 }); put(id + 'bR', { r: br[1], ox: 46, oy: -368, y: mood === 'shock' ? -10 : 0 }); show(id + 'bL', br[2]); show(id + 'bR', br[2]);
    const talk = p.talk || 0, m = $id(id + 'mouth'); if (m) { m.setAttribute('d', DMOUTH[mood] || DMOUTH.calm); m.setAttribute('opacity', talk > 0.15 || mood === 'shock' ? 0 : 1); }
    const mo = $id(id + 'mouthO'); if (mo) { const open = mood === 'shock' ? 0.85 : talk; mo.setAttribute('opacity', open > 0.15 ? 1 : 0); mo.setAttribute('ry', (4 + 19 * open).toFixed(1)); mo.setAttribute('rx', mood === 'shock' ? 17 : 22); mo.setAttribute('cy', (-248 + 4 * open).toFixed(1)); }
    const sw = clamp(p.sweat || 0), sweat = $id(id + 'sweat'); if (sweat) { sweat.setAttribute('opacity', sw > 0 ? 0.9 : 0); sweat.setAttribute('transform', `translate(0 ${(((T * 1.1) % 1) * 36 * sw).toFixed(1)})`); }
    put(id + 'spk', { s: 1 + 0.05 * Math.sin(T * 3), ox: 0, oy: -300 });
  }
  window.ENGINE = { dino, bot, put, show, text, clamp, eo, ei, eio, back, elastic, lerp, rn };
  let CFG, SC, C;
  // C: what a scene's draw() gets
  function mkC(cfg) {
    const words = cfg.words, d = cfg.dur;
    return {
      d, T0: cfg.T0, idx: cfg.idx, words,
      W: (re, frac) => { const w = words.find((x) => re.test(x.w.replace(/[^\w']/g, ''))); return w ? w.t0 : (frac || 0) * d; },
      speak: (t) => { const w = words.find((x) => t >= x.t0 && t < x.t1); return w ? 0.55 + 0.45 * Math.abs(Math.sin(t * 17)) : 0; },
      clamp, eo, ei, eio, back, elastic, lerp, rn, put, show, text, bot, dino, K, P,
      path: (t, keys) => { let i = 0; while (i < keys.length - 2 && t >= keys[i + 1][0]) i++; const a = keys[i], b = keys[i + 1], p = eio((t - a[0]) / Math.max(0.001, b[0] - a[0])); return { z: lerp(a[1], b[1], p), cx: lerp(a[2], b[2], p), cy: lerp(a[3], b[3], p), shake: 0 }; },
      tw: (t, a, b, f) => (f || eo)((t - a) / Math.max(0.001, b - a)),
    };
  }
  window.boot = (cfg) => {
    CFG = cfg; SC = window.PACK.scenes[cfg.sceneIndex]; C = mkC(cfg);
    const stars = Array.from({ length: 60 }, (_, i) => `<circle cx="${(rn(i, 1) * 1080).toFixed(0)}" cy="${(rn(i, 2) * 1000).toFixed(0)}" r="${rn(i, 3) < 0.15 ? 2.6 : 1.4}" fill="#fff" opacity="${(0.25 + rn(i, 4) * 0.5).toFixed(2)}"/>`).join('');
    document.getElementById('world').innerHTML = K.DEFS(cfg.acc) + (SC.room ? SC.room(cfg.acc, stars, C) : window.PACK.room ? window.PACK.room(cfg.acc, stars) : K.room(cfg.acc, stars)) + SC.build(C);
    Object.keys(ids).forEach((k) => delete ids[k]);
  };
  window.sfxList = () => (SC.sfx ? SC.sfx(C) : []);
  window.draw = (t, opts) => {
    opts = opts || {}; const d = CFG.dur, T = CFG.T0 + t; C.T = T;
    // room: the clock runs, the moon-lit window breathes
    put('clkM', { r: T * 40, ox: 905, oy: 350 }); put('clkH', { r: T * 3.3, ox: 905, oy: 350 });
    // camera: a slow push-in on the focus point, scenes can steer it
    const u = t / d, cam = SC.cam ? SC.cam(t, C) : {}, z = cam.z || 1 + 0.07 * u, cx = cam.cx === undefined ? 540 : cam.cx, cy = cam.cy === undefined ? 930 : cam.cy;
    const inP = SC.noFade || window.PACK.noFade ? 1 : eo(t / 0.4), sh = cam.shake || 0;
    document.getElementById('cam').setAttribute('transform', `translate(${540 + (sh ? Math.sin(T * 63) * sh : 0)} ${960 + (sh ? Math.cos(T * 71) * sh : 0)}) scale(${(z * 1.12 * (1.07 - 0.07 * inP)).toFixed(4)}) translate(${-cx} ${-cy})`);
    document.getElementById('world').style.opacity = SC.noFade || window.PACK.noFade ? 1 : clamp(t / 0.25);
    if (window.PACK.tick) window.PACK.tick(t, C);
    SC.draw(t, C);
    // anime finish: film grain and the swipe between scenes
    { const g = document.querySelector('.grain'); g.style.display = window.PACK.anime ? 'block' : 'none'; g.style.transform = `translate(${((T * 977) % 160).toFixed(0)}px,${((T * 613) % 160).toFixed(0)}px)`;
      const w = document.querySelector('.wipe'), dd = 0.5; let x = -4000;
      if (window.PACK.anime) { if (!CFG.first && t < dd) x = lerp(-660, 1500, eio(t / dd)); else if (!CFG.last && t > d - dd) x = lerp(-2900, -660, eio((t - (d - dd)) / dd)); }
      w.style.transform = `translateX(${x.toFixed(0)}px) skewX(-14deg)`; }
    // chrome around the picture
    document.querySelector('.bar i').style.width = ((CFG.p0 + (CFG.p1 - CFG.p0) * clamp(u)) * 100).toFixed(2) + '%';
    const ch = CFG.chunks.find((c) => t >= c.t0 && t < c.t1) || CFG.chunks[CFG.chunks.length - 1], cap = document.querySelector('.cap');
    if (opts.noCaption || !ch) cap.style.opacity = 0;
    else {
      cap.style.opacity = 1;
      const html = ch.words.map((w) => { const on = t >= w.t0 && t < w.t1; return `<span class="cw" style="${on ? `transform:scale(${(1.1 - 0.03 * clamp((t - w.t0) / 0.2)).toFixed(3)});color:${CFG.acc}` : ''}">${w.w}</span>`; }).join(' ');
      if (cap.dataset.h !== html) { cap.dataset.h = html; cap.innerHTML = html; }
      const p = back((t - ch.t0) / 0.26); cap.style.transform = `translateY(${((1 - p) * 30).toFixed(1)}px) scale(${(0.92 + 0.08 * p).toFixed(3)})`;
    }
  };
})();
