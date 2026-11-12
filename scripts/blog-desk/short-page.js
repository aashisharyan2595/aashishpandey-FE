/* Runs inside the page the short video is drawn on. window.draw(t) paints the scene at t seconds, so the video maker can step through time frame by frame.
   Everything that moves is computed from t (nothing depends on real time), which makes every render identical. */
(function () {
  const clamp = (x, a, b) => Math.max(a || 0, Math.min(b === undefined ? 1 : b, x));
  const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
  const back = (x) => { x = clamp(x); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  let CFG, kids = [], stage = [], stars = [], numEls = [];
  window.init = (cfg) => {
    CFG = cfg;
    stars = $$('.stars circle').map((c, i) => ({ el: c, y: +c.getAttribute('cy'), sp: 6 + (i % 5) * 3, ph: i * 1.7 }));
    const svg = $('.art svg');
    if (svg) { const all = Array.from(svg.children).filter((e) => e.tagName !== 'defs'); stage = all.slice(0, 9); kids = all.slice(9); } // the first nine are the stage (disc, rings, bokeh, shadow)
    numEls = $$('[data-num]');
  };
  const countText = (txt, p) => txt.replace(/\d+(?:,\d{3})*(?:\.\d+)?/g, (m) => { const dec = (m.split('.')[1] || '').length, v = parseFloat(m.replace(/,/g, '')) * p; return dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US'); });
  window.draw = (t, opts) => {
    opts = opts || {}; const T = CFG.T0 + t, D = CFG.dur;
    // camera push-in over the scene, a different drift each scene
    const k = t / D, dir = CFG.idx % 2 ? 1 : -1;
    $('.cam').style.transform = `scale(${(1.0 + 0.06 * k).toFixed(4)}) translate(${(dir * 10 * k).toFixed(1)}px,${(-12 * k).toFixed(1)}px)`;
    stars.forEach((s) => { const y = ((s.y - T * s.sp) % 1300 + 1300) % 1300; s.el.setAttribute('cy', y.toFixed(1)); s.el.setAttribute('opacity', (0.25 + 0.4 * (0.5 + 0.5 * Math.sin(T * 1.6 + s.ph))).toFixed(2)); });
    $('.glow').style.transform = `translate(-50%,-50%) scale(${(1 + 0.08 * Math.sin(T * 1.3)).toFixed(3)})`;
    $('.hz').style.transform = `scale(${(1.02 + 0.02 * Math.sin(T * 0.5)).toFixed(3)})`;
    $('.bar i').style.width = (CFG.p0 + (CFG.p1 - CFG.p0) * clamp(t / D)) * 100 + '%';
    // headline: each word springs in
    $$('.hw').forEach((w, i) => { const d = 0.08 + i * 0.09, p = back((t - d) / 0.5), q = clamp((t - d) / 0.2); w.style.opacity = q; w.style.transform = `translateY(${((1 - p) * 70).toFixed(1)}px) scale(${(0.55 + 0.45 * p).toFixed(3)}) rotate(${((1 - p) * -4).toFixed(2)}deg)`; });
    const ul = $('.ul'); if (ul) ul.style.transform = `scaleX(${eo((t - 0.5) / 0.5)})`;
    const bt = $('.beat'); if (bt) { const p = eo((t - 0.15) / 0.4); bt.style.opacity = p; bt.style.transform = `translateX(${((1 - p) * 40).toFixed(1)}px)`; }
    // the picture
    const art = $('.art');
    if (art) {
      const fl = CFG.art === 'rocket' ? 22 : 12; art.style.transform = `translateY(${(Math.sin(T * 1.9) * fl).toFixed(1)}px) rotate(${(Math.sin(T * 1.1) * 1.2).toFixed(2)}deg)`;
      stage.forEach((e, i) => { const p = eo((t - 0.05 - i * 0.03) / 0.5); e.style.opacity = i >= 4 && i < 8 ? p * (0.75 + 0.25 * Math.sin(T * 2 + i)) : p; });
      kids.forEach((el, i) => {
        const d = 0.18 + i * 0.07, p = back((t - d) / 0.5), q = clamp((t - d) / 0.16), tag = el.tagName;
        el.style.opacity = q; el.style.transformBox = 'fill-box'; el.style.transformOrigin = '50% 60%';
        if (tag === 'polyline') { const L = el.getTotalLength ? el.getTotalLength() : 600; el.style.opacity = 1; el.style.strokeDasharray = L; el.style.strokeDashoffset = L * (1 - eo((t - 0.4 - i * 0.02) / 1.1)); return; }
        if (CFG.art === 'chart' && tag === 'rect' && el.getAttribute('width') === '36') { el.style.transformOrigin = '50% 100%'; el.style.transform = `scaleY(${eo((t - 0.15 - i * 0.09) / 0.6).toFixed(3)})`; el.style.opacity = 1; return; }
        if (CFG.art === 'robot' && tag === 'circle' && el.getAttribute('r') === '17') { const bl = (T % 2.7) < 0.13 ? 0.08 : 1; el.style.transform = `scale(${(0.5 + 0.5 * p).toFixed(3)},${((0.5 + 0.5 * p) * bl).toFixed(3)})`; return; }
        if (el.hasAttribute('transform')) return; // groups that carry their own rotation keep it and only fade in
        el.style.transform = `scale(${(0.45 + 0.55 * p).toFixed(3)}) translateY(${((1 - eo((t - d) / 0.5)) * 26).toFixed(1)}px)`;
      });
      // pulse rings and orbiting dots behind the picture
      $$('.ring').forEach((r, i) => { const ph = (T * 0.45 + i * 0.5) % 1; r.style.transform = `translate(-50%,-50%) scale(${(0.7 + ph * 0.9).toFixed(3)})`; r.style.opacity = ((1 - ph) * 0.45).toFixed(3); });
      $$('.orbit').forEach((o, i) => { const a = T * (0.7 + i * 0.25) + i * 2.1, r = 430 + i * 36; o.style.transform = `translate(${(Math.cos(a) * r).toFixed(1)}px,${(Math.sin(a) * r * 0.55).toFixed(1)}px)`; });
    }
    $$('.pt').forEach((e, i) => { const sp = 0.12 + (i % 4) * 0.05, ph = (T * sp + i * 0.137) % 1; e.style.transform = `translate(${(Math.sin(T * 0.9 + i) * 24).toFixed(1)}px,${((1 - ph) * 760).toFixed(1)}px) scale(${(0.6 + 0.6 * (i % 3) / 2).toFixed(2)})`; e.style.opacity = (Math.sin(ph * Math.PI) * 0.85).toFixed(3); });
    // stats and pros/cons slide up in turn, numbers count up
    $$('.stat').forEach((e, i) => { const d = 0.2 + i * 0.16, p = back((t - d) / 0.5); e.style.opacity = clamp((t - d) / 0.15); e.style.transform = `translateY(${((1 - p) * 140).toFixed(1)}px) scale(${(0.9 + 0.1 * p).toFixed(3)})`; });
    numEls.forEach((e) => { const idx = +e.dataset.i || 0, p = eo((t - 0.35 - idx * 0.16) / 1.0); e.textContent = countText(e.dataset.num, p); });
    $$('.pc .col').forEach((e, i) => { const d = 0.2 + i * 0.5, p = back((t - d) / 0.5); e.style.opacity = clamp((t - d) / 0.15); e.style.transform = `translateX(${((1 - p) * (i ? 160 : -160)).toFixed(1)}px)`; });
    $$('.pc p').forEach((e, i) => { const idx = i % 3, side = i < 3 ? 0 : 1, d = 0.45 + side * 0.5 + idx * 0.22, p = back((t - d) / 0.4); e.style.opacity = clamp((t - d) / 0.12); e.style.transform = `translateX(${((1 - p) * 60).toFixed(1)}px)`; });
    // captions: the chunk being spoken, the active word lit
    const ch = CFG.chunks.find((c) => t >= c.t0 && t < c.t1) || CFG.chunks[CFG.chunks.length - 1], cap = $('.cap');
    if (opts.noCaption || !ch) cap.style.opacity = 0;
    else {
      cap.style.opacity = 1;
      const html = ch.words.map((w) => { const on = t >= w.t0 && t < w.t1; return `<span class="cw" style="${on ? `display:inline-block;transform:scale(${(1.12 - 0.04 * clamp((t - w.t0) / 0.2)).toFixed(3)});color:${CFG.acc}` : ''}">${w.w}</span>`; }).join(' ');
      if (cap.dataset.h !== html) { cap.dataset.h = html; cap.innerHTML = html; }
      const p = back((t - ch.t0) / 0.28); cap.style.transform = `translateY(${((1 - p) * 34).toFixed(1)}px) scale(${(0.9 + 0.1 * p).toFixed(3)})`;
    }
    // the scene change: an angled accent sweep
    const wp = clamp(t / 0.5), wipe = $('.wipe');
    if (CFG.idx === 0 || wp >= 1) wipe.style.display = 'none'; else { wipe.style.display = 'block'; wipe.style.transform = `translateX(${(-130 + 260 * eo(wp)).toFixed(1)}%) skewX(-14deg)`; }
  };
})();
