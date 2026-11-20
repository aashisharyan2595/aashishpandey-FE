/* Night Ride Dash: the phone-only game on the home page.
 * Loaded by the small gate in Portfolio.dc.html only on phones; desktop never fetches this file and phones never
 * fetch the 3D world. Plain canvas 2D, no libraries, no network calls. Swipe sideways to change lane, tap to jump.
 * Aashish rides, MujaSauros holds on behind. Collect gold orbs (each few unlock a skill), dodge Bangalore traffic. */
(() => {
  'use strict';
  const LS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; };
  const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const MONO = "'JetBrains Mono',ui-monospace,Menlo,monospace", SERIF = "'Cormorant Garamond',Georgia,serif";
  const SKILLS = [
    ['Project management', '/freelance-project-manager'], ['Shopify', '/shopify-developer'], ['WordPress & Webflow', '/wordpress-webflow-developer'],
    ['SEO', '/seo-consultant'], ['UI/UX design', '/ui-ux-design'], ['Full-stack', '/full-stack-developer'], ['Tech consulting', '/tech-consultant']
  ];
  const ORBS_PER_SKILL = 6, LANES = [-1, 0, 1], Z0 = 7, MAXHEART = 3;

  /* ---------- DOM ---------- */
  const css = document.createElement('style');
  css.textContent = `
#apg{position:fixed;inset:0;z-index:2147483000;background:#2a3a7c;color:#fff6ea;font-family:${MONO};touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;overscroll-behavior:none}
#apg canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#apg button,#apg a{font:inherit;color:inherit}
#apg .bar{position:absolute;top:0;left:0;right:0;padding:max(10px,env(safe-area-inset-top)) 10px 0 14px;display:flex;align-items:center;justify-content:space-between;gap:8px;pointer-events:none}
#apg .bar>*{pointer-events:auto}
#apg .sc{font-size:24px;font-weight:700;letter-spacing:.02em;text-shadow:0 2px 10px rgba(30,10,40,.55);min-width:84px}
#apg .sc small{display:block;font-size:10px;font-weight:500;letter-spacing:.16em;color:#ffe6c7;text-transform:uppercase}
#apg .hp{font-size:20px;letter-spacing:3px;text-shadow:0 2px 8px rgba(30,10,40,.6);color:#ff7a8a;white-space:nowrap}
#apg .hp i{font-style:normal;opacity:.28}
#apg .pill{height:38px;min-width:38px;padding:0 13px;border-radius:999px;border:1px solid rgba(255,246,234,.4);background:rgba(26,20,32,.5);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:6px;text-decoration:none;cursor:pointer}
#apg .gold{background:#f5b867;color:#1a1420;border-color:#f5b867}
#apg .tools{display:flex;gap:6px}
#apg .toast{position:absolute;left:50%;top:max(64px,calc(env(safe-area-inset-top) + 56px));transform:translate(-50%,-6px);opacity:0;transition:opacity .25s,transform .25s;padding:8px 14px;border-radius:999px;background:rgba(26,20,32,.72);border:1px solid #f5b867;color:#ffe6c7;font-size:11px;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap;pointer-events:none}
#apg .toast.on{opacity:1;transform:translate(-50%,0)}
#apg .card{position:absolute;left:16px;right:16px;margin:auto;max-width:380px;text-align:center;display:none}
#apg .card.on{display:block}
#apg .t1{font-family:${SERIF};font-style:italic;font-weight:500;font-size:46px;line-height:.95;margin:0;text-shadow:0 4px 30px rgba(60,20,40,.55)}
#apg .t2{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#ffe6c7;margin:10px 0 0}
#apg .t3{font-size:12.5px;line-height:1.5;color:#fff1dd;margin:12px auto 0;max-width:290px;text-shadow:0 1px 8px rgba(30,10,40,.6)}
#apg .big{height:52px;padding:0 34px;font-size:13px;margin-top:16px}
#apg .menu{top:12%}
#apg .over{top:50%;transform:translateY(-50%);padding:18px 16px 16px;border-radius:20px;background:rgba(26,20,32,.86);border:1px solid rgba(245,184,103,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);max-height:88vh;overflow:auto}
#apg .num{font-size:44px;font-weight:700;line-height:1;margin:6px 0 2px}
#apg .chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:12px 0 0}
#apg .chips a{padding:6px 10px;border-radius:999px;background:rgba(159,224,110,.16);border:1px solid #9fe06e;color:#d3f7ac;font-size:10.5px;text-decoration:none}
#apg .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}
#apg .grid .pill{height:44px;justify-content:center}
#apg .hint{position:absolute;left:0;right:0;bottom:max(14px,env(safe-area-inset-bottom));text-align:center;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#ffe6c7;text-shadow:0 1px 6px rgba(30,10,40,.7);pointer-events:none}
@media (max-height:560px){#apg .t1{font-size:34px}#apg .menu{top:6%}#apg .big{margin-top:10px}#apg .t3{display:none}}
`;
  document.head.appendChild(css);

  const root = document.createElement('div');
  root.id = 'apg';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Night Ride Dash, a small game. Use Skip to site to leave it at any time.');
  root.innerHTML = `<canvas aria-hidden="true"></canvas>
<div class="bar"><div class="sc"><span id="apg-s">0</span><small id="apg-b"></small></div><div class="hp" id="apg-h" aria-label="Lives"></div>
<div class="tools"><button class="pill" id="apg-snd" aria-pressed="false" aria-label="Sound">♪ Off</button><button class="pill gold" id="apg-skip">Skip to site</button></div></div>
<div class="toast" id="apg-t" role="status"></div>
<div class="card menu on" id="apg-menu"><p class="t2">Bangalore · 12.97° N · dusk</p><h1 class="t1">Night Ride<br>Dash</h1>
<p class="t3">Swipe sideways to change lane. Tap to jump. Grab the gold orbs, dodge the traffic, keep MujaSauros on board.</p>
<button class="pill gold big" id="apg-play">Play</button></div>
<div class="card over" id="apg-over"><p class="t2" id="apg-ot">Ride over</p><div class="num" id="apg-on">0</div><p class="t2" id="apg-ob"></p><div class="chips" id="apg-ch"></div>
<button class="pill gold big" id="apg-again" style="width:100%;margin-top:14px">Ride again</button>
<div class="grid"><a class="pill" href="/portfolio">Portfolio</a><a class="pill" href="/case-studies">Work</a><a class="pill" href="/tools">Free tools</a><a class="pill" href="/contact">Hire me</a></div></div>
<div class="card over" id="apg-sheet"><p class="t2">Skip the game</p><h2 class="t1" style="font-size:34px;margin-top:8px">Go to the site</h2>
<div class="grid"><a class="pill" href="/portfolio">Portfolio</a><a class="pill" href="/case-studies">Work</a><a class="pill" href="/tools">Free tools</a><a class="pill" href="/contact">Hire me</a><a class="pill" href="/services">Services</a><a class="pill" href="/?ride=1" id="apg-3d">3D ride</a></div>
<button class="pill big" id="apg-back" style="width:100%;margin-top:12px;height:44px">Back to the game</button></div>
<div class="hint" id="apg-hint"></div>`;
  document.body.appendChild(root);
  document.documentElement.style.overflow = 'hidden';
  const $ = id => document.getElementById(id), cv = root.querySelector('canvas'), ctx = cv.getContext('2d', { alpha: false });
  const el = { s: $('apg-s'), b: $('apg-b'), h: $('apg-h'), t: $('apg-t'), menu: $('apg-menu'), over: $('apg-over'), sheet: $('apg-sheet'), hint: $('apg-hint'), snd: $('apg-snd') };
  if (!ctx.roundRect) ctx.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };

  /* ---------- state ---------- */
  let W = 0, H = 0, dpr = 1, hy = 0, py = 0, LW = 0, raf = 0, last = 0, slow = 0;
  let best = +LS('apGameBest') || 0, soundOn = false, ac = null;
  const G = { mode: 'menu', t: 0, v: 12, dist: 0, bonus: 0, orbs: 0, combo: 0, hearts: MAXHEART, boost: 0, inv: 0, shake: 0, unlocked: 0, over: 0,
    lane: 0, tl: 0, y: 0, vy: 0, lean: 0, ents: [], parts: [], nextZ: 40, scroll: 0, mood: 0, moodT: 0 };
  const toastT = { id: 0 };

  function resize() {
    W = innerWidth; H = innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, slow > 1 ? 1 : 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    hy = H * 0.37; py = H * 0.8; LW = Math.min(W * 0.3, H * 0.19);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', resize);

  /* ---------- small helpers ---------- */
  const rnd = (a, b) => a + Math.random() * (b - a), clamp = (x, a, b) => x < a ? a : x > b ? b : x;
  const proj = z => Z0 / (z + Z0);
  const curveAt = () => Math.sin(G.scroll * 0.018) * 0.55 + Math.sin(G.scroll * 0.0071 + 1.7) * 0.35;
  const sx = (lane, z, c) => { const p = proj(z); return W / 2 + lane * LW * p + c * W * 0.8 * (1 - p) * (1 - p); };
  const sy = z => hy + (py - hy) * proj(z);
  const hash = k => { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  function beep(f1, f2, d, type, vol) {
    if (!soundOn || !ac) return;
    try {
      const o = ac.createOscillator(), g = ac.createGain(), n = ac.currentTime;
      o.type = type || 'triangle'; o.frequency.setValueAtTime(f1, n); o.frequency.exponentialRampToValueAtTime(f2, n + d);
      g.gain.setValueAtTime(vol || 0.08, n); g.gain.exponentialRampToValueAtTime(0.0001, n + d);
      o.connect(g); g.connect(ac.destination); o.start(n); o.stop(n + d + 0.02);
    } catch (e) {}
  }
  function toast(msg) { el.t.textContent = msg; el.t.classList.add('on'); clearTimeout(toastT.id); toastT.id = setTimeout(() => el.t.classList.remove('on'), 1700); }
  function buzz(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }
  function hud() {
    el.s.textContent = score();
    el.b.textContent = 'Best ' + best;
    let h = ''; for (let i = 0; i < MAXHEART; i++) h += i < G.hearts ? '♥' : '<i>♥</i>'; el.h.innerHTML = h;
  }
  const score = () => Math.floor(G.dist / 4 + G.bonus);

  /* ---------- game flow ---------- */
  function reset(mode) {
    Object.assign(G, { mode, t: 0, v: mode === 'play' ? 15 : 12, dist: 0, bonus: 0, orbs: 0, combo: 0, hearts: MAXHEART, boost: 0, inv: 0, shake: 0, unlocked: 0, over: 0,
      lane: 0, tl: 0, y: 0, vy: 0, lean: 0, ents: [], parts: [], nextZ: 38, mood: 0, moodT: 0 });
    hud();
  }
  function play() {
    reset('play');
    el.menu.classList.remove('on'); el.over.classList.remove('on'); el.sheet.classList.remove('on');
    el.hint.textContent = 'Swipe ← → lanes · tap to jump';
    setTimeout(() => { if (G.mode === 'play' && G.t > 2) el.hint.textContent = ''; }, 4500);
    go();
  }
  function finish() {
    G.mode = 'over'; G.over = 0;
    const sc = score(), isBest = sc > best;
    if (isBest) { best = sc; LS('apGameBest', String(best)); }
    setTimeout(() => {
      if (G.mode !== 'over') return;
      $('apg-ot').textContent = isBest && sc > 0 ? 'New best ride' : 'Ride over';
      $('apg-on').textContent = sc;
      $('apg-ob').textContent = 'Best ' + best + ' · ' + G.orbs + ' orbs';
      $('apg-ch').innerHTML = G.unlocked ? SKILLS.slice(0, G.unlocked).map(s => `<a href="${s[1]}">${s[0]}</a>`).join('') : '<span style="font-size:11px;color:#ffe6c7">Collect ' + ORBS_PER_SKILL + ' orbs to unlock a skill</span>';
      el.over.classList.add('on'); el.hint.textContent = ''; hud();
    }, 650);
  }
  function hit(e) {
    if (G.inv > 0) return;
    if (G.boost > 0) return;
    G.hearts--; G.combo = 0; G.inv = 1.5; G.shake = RM ? 0 : 0.4; G.mood = 2; G.moodT = 1; buzz(45); beep(180, 60, 0.28, 'sawtooth', 0.1);
    for (let i = 0; i < (RM ? 4 : 10); i++) spark(W / 2 + G.lane * LW, py - LW * 0.4, '#ffd27a', 1.4);
    hud();
    if (G.hearts <= 0) finish();
  }
  function spark(x, y, c, k) { if (G.parts.length > 70) return; G.parts.push({ x, y, vx: rnd(-90, 90) * k, vy: rnd(-170, -30) * k, l: rnd(0.35, 0.75), m: 0.75, c, r: rnd(2, 4.2) }); }

  /* ---------- spawning ---------- */
  function spawn() {
    const free = LANES[Math.floor(Math.random() * 3)], r = Math.random(), z = G.nextZ, gap = Math.max(13, G.v * 0.8);
    const add = (type, lane, dz, h) => G.ents.push({ type, lane, z: z + (dz || 0), h: h || 0, dead: 0, spin: 0 });
    if (r < 0.34) { for (let i = 0; i < 5; i++) add('orb', free, i * 2.4); G.nextZ += 12 + gap * 0.6; }
    else if (r < 0.66) {
      const blocked = LANES.filter(l => l !== free), nb = Math.random() < 0.4 + Math.min(0.35, G.t / 140) ? 2 : 1;
      blocked.slice(0, nb).forEach(l => add(Math.random() < 0.5 ? 'cow' : 'auto', l));
      if (nb === 1) { const other = blocked[1]; for (let i = 0; i < 3; i++) add('orb', other, i * 2.2 - 2); }
      for (let i = 0; i < 3; i++) add('orb', free, i * 2.4 - 3);
      G.nextZ += gap;
    } else if (r < 0.86) {
      for (const l of LANES) add('bump', l);
      for (let i = 0; i < 3; i++) add('orb', LANES[(i + 1) % 3 === 0 ? 0 : 1], -2 + i * 2, 1);
      G.nextZ += gap + 4;
    } else if (r < 0.93 && G.hearts < MAXHEART) { add('heart', free); G.nextZ += gap; }
    else if (r < 0.97 && G.boost <= 0) { add('boost', free); for (let i = 1; i < 5; i++) add('orb', free, i * 2.4); G.nextZ += gap + 6; }
    else { for (let i = 0; i < 4; i++) add('orb', free, i * 2.4); G.nextZ += gap * 0.7; }
  }

  /* ---------- update ---------- */
  function update(dt) {
    const play = G.mode === 'play', c = curveAt();
    G.t += dt;
    if (play) {
      const base = Math.min(33, 15 + G.t * 0.3);
      G.v += ((G.boost > 0 ? base * 1.5 : base) - G.v) * Math.min(1, dt * 3);
    } else if (G.mode === 'over') G.v *= Math.max(0, 1 - dt * 3); else G.v = 12;
    const mv = G.v * dt;
    G.dist += play ? mv : 0; G.scroll += mv;
    if (G.mode === 'menu') { G.tl = Math.sin(G.t * 0.7) > 0.35 ? 1 : Math.sin(G.t * 0.7) < -0.35 ? -1 : 0; }
    G.lane += (G.tl - G.lane) * Math.min(1, dt * 14);
    G.lean += ((G.tl - G.lane) * 0.9 - G.lean) * Math.min(1, dt * 12);
    if (G.y > 0 || G.vy > 0) { G.vy -= 27 * dt; G.y += G.vy * dt; if (G.y <= 0) { G.y = 0; G.vy = 0; if (play) for (let i = 0; i < 4; i++) spark(W / 2 + G.lane * LW, py, '#fff1dd', 0.5); } }
    if (G.inv > 0) G.inv -= dt;
    if (G.shake > 0) G.shake -= dt;
    if (G.moodT > 0) { G.moodT -= dt; if (G.moodT <= 0) G.mood = 0; }
    if (G.boost > 0) { G.boost -= dt; if (G.boost <= 0) toast('Boost over'); }
    if (G.mode !== 'menu') {
      G.nextZ -= mv; if (G.mode === 'play') while (G.nextZ < 70) spawn();
      for (const e of G.ents) {
        e.z -= mv;
        if (e.dead) { e.dead += dt; continue; }
        if (!play || e.z > 0.9 || e.z < -0.9) continue;
        if (Math.abs(e.lane - G.lane) > 0.62) continue;
        if (e.type === 'orb') {
          if (e.h && G.y < 0.5) continue;
          e.dead = 0.001; G.orbs++; G.combo++; const m = Math.min(5, 1 + Math.floor(G.combo / 5)) * (G.boost > 0 ? 2 : 1); G.bonus += 10 * m; G.mood = 1; G.moodT = 0.4;
          beep(880 + Math.min(G.combo, 10) * 60, 1500, 0.09, 'triangle', 0.07);
          for (let i = 0; i < (RM ? 2 : 5); i++) spark(sx(e.lane, 0, 0), py - LW * (0.5 + e.h * 0.4), '#ffd27a', 0.8);
          if (G.orbs % ORBS_PER_SKILL === 0 && G.unlocked < SKILLS.length) { toast('Skill unlocked: ' + SKILLS[G.unlocked][0]); G.unlocked++; buzz(18); }
          else if (G.combo > 0 && G.combo % 10 === 0) toast('Combo x' + m);
        } else if (e.type === 'heart') { e.dead = 0.001; G.hearts = Math.min(MAXHEART, G.hearts + 1); toast('MujaSauros is happy'); beep(520, 980, 0.2, 'sine', 0.09); hud(); }
        else if (e.type === 'boost') { e.dead = 0.001; G.boost = 4.5; G.inv = Math.max(G.inv, 4.5); toast('Boost: smash through traffic'); beep(300, 900, 0.4, 'sawtooth', 0.07); buzz(30); }
        else if (e.type === 'bump') { if (G.y < 0.45) { e.dead = 0.001; hit(e); } }
        else if (G.boost > 0) { e.dead = 0.001; e.spin = rnd(-1, 1) > 0 ? 1 : -1; G.bonus += 25; G.shake = RM ? 0 : 0.2; beep(220, 600, 0.15, 'square', 0.06); for (let i = 0; i < 8; i++) spark(sx(e.lane, 0, 0), py - LW * 0.4, '#ffffff', 1.2); }
        else { e.dead = 0.001; hit(e); }
      }
      G.ents = G.ents.filter(e => e.z > -6 && e.dead < 0.7);
    }
    for (const p of G.parts) { p.l -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; }
    G.parts = G.parts.filter(p => p.l > 0);
    if (play) { const s = score(); if (el.s.textContent !== String(s)) el.s.textContent = s; }
    return c;
  }

  /* ---------- drawing ---------- */
  function sky() {
    const g = ctx.createLinearGradient(0, 0, 0, hy);
    g.addColorStop(0, '#1f2a63'); g.addColorStop(0.55, '#7a5a8e'); g.addColorStop(1, '#e29a72');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, hy + 2);
    ctx.fillStyle = 'rgba(255,246,234,.8)';
    for (let i = 0; i < 26; i++) { const x = hash(i) * W, y = hash(i + 50) * hy * 0.55, r = 0.6 + hash(i + 9) * 1.1; ctx.globalAlpha = 0.25 + hash(i + 3) * 0.5; ctx.fillRect(x, y, r, r); }
    ctx.globalAlpha = 1;
    const sg = ctx.createRadialGradient(W * 0.5, hy, 4, W * 0.5, hy, W * 0.55);
    sg.addColorStop(0, 'rgba(255,214,150,.95)'); sg.addColorStop(0.18, 'rgba(255,170,110,.55)'); sg.addColorStop(1, 'rgba(255,170,110,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, hy + 2);
  }
  function hills(c) {
    const layer = (amp, base, col, f, par) => {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, hy + 1);
      const off = G.scroll * par - c * 90;
      for (let x = 0; x <= W; x += 14) ctx.lineTo(x, hy - base - amp * (Math.sin((x + off) * f) * 0.5 + Math.sin((x + off) * f * 2.3 + 1) * 0.3 + 0.5));
      ctx.lineTo(W, hy + 1); ctx.fill();
    };
    layer(H * 0.075, 4, '#5a3f78', 0.011, 0.25); layer(H * 0.05, 2, '#2f2a58', 0.019, 0.55);
  }
  function ground(c) {
    const g = ctx.createLinearGradient(0, hy, 0, H);
    g.addColorStop(0, '#3b2c55'); g.addColorStop(1, '#171230'); ctx.fillStyle = g; ctx.fillRect(0, hy, W, H - hy);
    // road, in strips so it can bend and show speed
    const N = 30, zf = 80, step = 2.6;
    for (let i = 0; i < N; i++) {
      const z1 = zf * Math.pow(1 - i / N, 2) - 4, z0 = zf * Math.pow(1 - (i + 1) / N, 2) - 4;
      const k = Math.floor((G.scroll + z1) / step);
      const p1 = proj(z1), p0 = proj(z0), y1 = sy(z1), y0 = sy(z0);
      const l1 = sx(-1.55, z1, c), r1 = sx(1.55, z1, c), l0 = sx(-1.55, z0, c), r0 = sx(1.55, z0, c);
      ctx.fillStyle = (k & 1) ? '#3a3350' : '#342d49';
      ctx.beginPath(); ctx.moveTo(l0, y0); ctx.lineTo(r0, y0); ctx.lineTo(r1, y1); ctx.lineTo(l1, y1); ctx.fill();
      if ((k & 1) === 0) { ctx.fillStyle = 'rgba(255,246,234,.55)'; for (const d of [-0.5, 0.5]) { const a = sx(d - 0.018, z1, c), b = sx(d + 0.018, z1, c), a0 = sx(d - 0.018, z0, c), b0 = sx(d + 0.018, z0, c); ctx.beginPath(); ctx.moveTo(a0, y0); ctx.lineTo(b0, y0); ctx.lineTo(b, y1); ctx.lineTo(a, y1); ctx.fill(); } }
      ctx.fillStyle = (k & 1) ? '#e8424f' : '#fbf6ee';
      for (const s of [-1, 1]) { const e1 = sx(s * 1.55, z1, c), e0 = sx(s * 1.55, z0, c), o1 = sx(s * 1.66, z1, c), o0 = sx(s * 1.66, z0, c); ctx.beginPath(); ctx.moveTo(e0, y0); ctx.lineTo(o0, y0); ctx.lineTo(o1, y1); ctx.lineTo(e1, y1); ctx.fill(); }
    }
  }
  function side(z, c, kind, s, k) {
    const p = proj(z); if (p < 0.03 || p > 1.7) return;
    const x = sx(s * (kind === 'lamp' ? 2.05 : 2.6 + hash(k) * 1.6), z, c), y = sy(z), u = LW * p;
    if (kind === 'lamp') {
      ctx.fillStyle = '#14131c'; ctx.fillRect(x - u * 0.03, y - u * 1.5, u * 0.06, u * 1.5);
      ctx.fillRect(x - u * 0.03 * 1, y - u * 1.5, -s * u * 0.28, u * 0.05);
      const lx = x - s * u * 0.28, ly = y - u * 1.48, g = ctx.createRadialGradient(lx, ly, 1, lx, ly, u * 0.7);
      g.addColorStop(0, 'rgba(255,210,122,.95)'); g.addColorStop(0.3, 'rgba(255,190,100,.35)'); g.addColorStop(1, 'rgba(255,190,100,0)');
      ctx.fillStyle = g; ctx.fillRect(lx - u * 0.7, ly - u * 0.7, u * 1.4, u * 1.4);
    } else {
      ctx.fillStyle = '#14131c'; ctx.beginPath(); ctx.moveTo(x - u * 0.05, y); ctx.lineTo(x + u * 0.05, y); ctx.lineTo(x + u * 0.03, y - u * 1.1); ctx.lineTo(x - u * 0.03, y - u * 1.1); ctx.fill();
      ctx.fillStyle = hash(k + 4) > 0.5 ? '#244a52' : '#2d3f6e';
      for (const [dx, dy, r] of [[0, -1.25, 0.46], [-0.3, -1.05, 0.34], [0.3, -1.05, 0.34]]) { ctx.beginPath(); ctx.arc(x + dx * u, y + dy * u, r * u, 0, 7); ctx.fill(); }
      ctx.fillStyle = 'rgba(245,184,103,.28)'; ctx.beginPath(); ctx.arc(x + u * 0.12, y - u * 1.4, u * 0.2, 0, 7); ctx.fill();
    }
  }
  function sceneryAll(c) {
    const items = [];
    for (let i = 0; i < 9; i++) { const k = Math.floor(G.scroll / 11) + 8 - i, z = k * 11 - G.scroll; items.push([z, 'lamp', k % 2 ? 1 : -1, k]); }
    for (let i = 0; i < 12; i++) { const k = Math.floor(G.scroll / 6.5) + 11 - i, z = k * 6.5 - G.scroll + 2; if (hash(k) > 0.35) items.push([z, 'tree', hash(k + 7) > 0.5 ? 1 : -1, k]); }
    items.sort((a, b) => b[0] - a[0]);
    for (const it of items) side(it[0], c, it[1], it[2], it[3]);
  }

  function ent(e, c) {
    const z = e.z, p = proj(z); if (p > 1.9 || p < 0.03) return;
    const x = sx(e.lane, z, c), y = sy(z), u = LW * p, t = e.dead;
    ctx.save();
    if (t) { ctx.globalAlpha = Math.max(0, 1 - t * 1.6); if (e.spin) { ctx.translate(x, y); ctx.translate(e.spin * t * u * 4, -t * u * 3); ctx.rotate(e.spin * t * 9); ctx.translate(-x, -y); } else if (e.type !== 'orb') ctx.globalAlpha = 0; }
    if (e.type === 'bump') {
      const z2 = z + 1.1, y2 = sy(z2), xl = sx(-1.55, z, c), xr = sx(1.55, z, c), xl2 = sx(-1.55, z2, c), xr2 = sx(1.55, z2, c);
      ctx.fillStyle = '#ffd54a'; ctx.beginPath(); ctx.moveTo(xl2, y2); ctx.lineTo(xr2, y2); ctx.lineTo(xr, y - u * 0.16); ctx.lineTo(xl, y - u * 0.16); ctx.fill();
      ctx.fillStyle = '#14131c'; for (let i = 0; i < 12; i++) { const a = i / 12, b = (i + 0.5) / 12, lx = (n, zz, cc) => sx(-1.55 + 3.1 * n, zz, cc); ctx.beginPath(); ctx.moveTo(lx(a, z2, c), y2); ctx.lineTo(lx(b, z2, c), y2); ctx.lineTo(lx(b, z, c), y - u * 0.16); ctx.lineTo(lx(a, z, c), y - u * 0.16); ctx.fill(); }
    } else if (e.type === 'cow') {
      // facing the rider: head low and centred, body behind, white with brown patches
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, y, u * 0.55, u * 0.1, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#f4ead7'; ctx.beginPath(); ctx.roundRect(x - u * 0.46, y - u * 0.98, u * 0.92, u * 0.78, u * 0.2); ctx.fill();
      ctx.fillStyle = '#9b6a4a'; ctx.beginPath(); ctx.ellipse(x - u * 0.22, y - u * 0.78, u * 0.17, u * 0.13, 0.4, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + u * 0.26, y - u * 0.55, u * 0.14, u * 0.18, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#e9dcc1'; for (const s of [-1, 1]) ctx.fillRect(x + s * u * 0.3 - u * 0.06, y - u * 0.22, u * 0.12, u * 0.22);
      ctx.fillStyle = '#f4ead7'; ctx.beginPath(); ctx.roundRect(x - u * 0.2, y - u * 0.7, u * 0.4, u * 0.5, u * 0.16); ctx.fill();
      ctx.fillStyle = '#f2a9a0'; ctx.beginPath(); ctx.roundRect(x - u * 0.15, y - u * 0.38, u * 0.3, u * 0.17, u * 0.07); ctx.fill();
      ctx.fillStyle = '#14131c'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * u * 0.09, y - u * 0.56, u * 0.03, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x + s * u * 0.06, y - u * 0.3, u * 0.018, 0, 7); ctx.fill(); }
      ctx.strokeStyle = '#d9c9a8'; ctx.lineWidth = Math.max(1.5, u * 0.05); ctx.lineCap = 'round';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * u * 0.17, y - u * 0.68); ctx.quadraticCurveTo(x + s * u * 0.36, y - u * 0.74, x + s * u * 0.34, y - u * 0.92); ctx.stroke(); }
      ctx.fillStyle = '#e9dcc1'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * u * 0.27, y - u * 0.62, u * 0.1, u * 0.055, s * 0.4, 0, 7); ctx.fill(); }
    } else if (e.type === 'auto') {
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x, y, u * 0.6, u * 0.1, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#14131c'; ctx.beginPath(); ctx.roundRect(x - u * 0.5, y - u * 0.62, u * 1, u * 0.56, u * 0.08); ctx.fill();
      ctx.fillStyle = '#f5c518'; ctx.beginPath(); ctx.roundRect(x - u * 0.52, y - u * 1.08, u * 1.04, u * 0.5, [u * 0.26, u * 0.26, u * 0.04, u * 0.04]); ctx.fill();
      ctx.fillStyle = '#2a3a7c'; ctx.beginPath(); ctx.roundRect(x - u * 0.38, y - u * 0.98, u * 0.76, u * 0.22, u * 0.07); ctx.fill();
      ctx.fillStyle = '#ff3b4a'; for (const s of [-1, 1]) ctx.fillRect(x + s * u * 0.4 - u * 0.06, y - u * 0.55, u * 0.12, u * 0.1);
      ctx.fillStyle = '#0c0b12'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.roundRect(x + s * u * 0.36 - u * 0.09, y - u * 0.2, u * 0.18, u * 0.2, u * 0.05); ctx.fill(); }
    } else {
      const h = (e.h || 0) * LW * 0.55 * p, cy = y - u * 0.5 - h, r = u * (e.type === 'orb' ? 0.2 : 0.28), col = e.type === 'heart' ? '#ff6a86' : e.type === 'boost' ? '#5ff0d0' : '#ffd27a';
      const gl = ctx.createRadialGradient(x, cy, 1, x, cy, r * 2.6); gl.addColorStop(0, e.type === 'boost' ? 'rgba(95,240,208,.7)' : e.type === 'heart' ? 'rgba(255,106,134,.6)' : 'rgba(255,210,122,.65)'); gl.addColorStop(1, 'rgba(255,210,122,0)');
      ctx.fillStyle = gl; ctx.fillRect(x - r * 2.6, cy - r * 2.6, r * 5.2, r * 5.2);
      const bob = Math.sin(G.t * 5 + e.z) * r * 0.12; ctx.fillStyle = col;
      if (e.type === 'heart') { ctx.beginPath(); ctx.moveTo(x, cy + r * 0.9 + bob); ctx.bezierCurveTo(x - r * 1.5, cy - r * 0.1, x - r * 0.6, cy - r * 1.1, x, cy - r * 0.3 + bob); ctx.bezierCurveTo(x + r * 0.6, cy - r * 1.1, x + r * 1.5, cy - r * 0.1, x, cy + r * 0.9 + bob); ctx.fill(); }
      else if (e.type === 'boost') { ctx.beginPath(); ctx.roundRect(x - r * 0.7, cy - r + bob, r * 1.4, r * 2, r * 0.5); ctx.fill(); ctx.fillStyle = '#fff6ea'; ctx.beginPath(); ctx.moveTo(x + r * 0.1, cy - r * 0.7 + bob); ctx.lineTo(x - r * 0.35, cy + r * 0.1 + bob); ctx.lineTo(x, cy + r * 0.1 + bob); ctx.lineTo(x - r * 0.1, cy + r * 0.7 + bob); ctx.lineTo(x + r * 0.35, cy - r * 0.15 + bob); ctx.lineTo(x, cy - r * 0.15 + bob); ctx.fill(); }
      else { const sq = Math.abs(Math.cos(G.t * 4 + e.z * 0.5)); ctx.beginPath(); ctx.ellipse(x, cy + bob, r * (0.35 + 0.65 * sq), r, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fff1c0'; ctx.beginPath(); ctx.ellipse(x - r * 0.1, cy - r * 0.2 + bob, r * 0.12, r * 0.4, 0, 0, 7); ctx.fill(); }
    }
    ctx.restore();
  }

  function rider(x, y, s, lean, air) {
    // rear view. Origin = ground under the rear tyre. Aashish on the Honda, MujaSauros holding on behind him.
    ctx.save(); ctx.translate(x, y); ctx.rotate(lean * 0.22 - air * 0.0);
    const sh = Math.max(0.35, 1 - air * 0.25);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.46 * sh, s * 0.08 * sh, 0, 0, 7); ctx.fill();
    if (air) ctx.translate(0, -air);
    if (G.boost > 0) { for (const sd of [-1, 1]) { const f = 0.4 + Math.random() * 0.5; ctx.fillStyle = 'rgba(255,170,70,.9)'; ctx.beginPath(); ctx.moveTo(sd * s * 0.2 - s * 0.05, -s * 0.12); ctx.lineTo(sd * s * 0.2 + s * 0.05, -s * 0.12); ctx.lineTo(sd * s * 0.2, s * 0.1 + s * f * 0.5); ctx.fill(); } }
    const jacket = '#14131c', red = '#e8424f';
    // tyre + mudguard + tail light
    ctx.fillStyle = '#0c0b12'; ctx.beginPath(); ctx.roundRect(-s * 0.11, -s * 0.5, s * 0.22, s * 0.5, s * 0.1); ctx.fill();
    ctx.fillStyle = '#2b2740'; for (let i = 0; i < 4; i++) ctx.fillRect(-s * 0.11, -s * 0.46 + ((G.scroll * 3 + i * 0.12 * s) % (s * 0.46)), s * 0.22, 1.5);
    ctx.fillStyle = '#263a8a'; ctx.beginPath(); ctx.roundRect(-s * 0.22, -s * 0.62, s * 0.44, s * 0.2, s * 0.08); ctx.fill();
    ctx.fillStyle = '#ff3b4a'; ctx.shadowColor = '#ff3b4a'; ctx.shadowBlur = RM ? 0 : s * 0.2; ctx.fillRect(-s * 0.14, -s * 0.57, s * 0.28, s * 0.05); ctx.shadowBlur = 0;
    ctx.fillStyle = '#c9ccd6'; ctx.beginPath(); ctx.roundRect(s * 0.2, -s * 0.46, s * 0.1, s * 0.3, s * 0.05); ctx.fill();
    // seat and rider
    ctx.fillStyle = '#1b1a28'; ctx.beginPath(); ctx.roundRect(-s * 0.2, -s * 0.78, s * 0.4, s * 0.2, s * 0.08); ctx.fill();
    ctx.fillStyle = jacket; ctx.beginPath(); ctx.roundRect(-s * 0.27, -s * 1.38, s * 0.54, s * 0.64, s * 0.2); ctx.fill();
    ctx.fillStyle = red; ctx.fillRect(-s * 0.04, -s * 1.3, s * 0.08, s * 0.4);
    ctx.fillStyle = jacket; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.roundRect(sd * s * 0.31 - s * 0.07, -s * 1.3, s * 0.14, s * 0.5, s * 0.07); ctx.fill(); }
    ctx.fillStyle = red; ctx.beginPath(); ctx.arc(0, -s * 1.58, s * 0.22, 0, 7); ctx.fill();
    ctx.fillStyle = '#fbf6ee'; ctx.fillRect(-s * 0.04, -s * 1.8, s * 0.08, s * 0.22);
    ctx.fillStyle = '#14131c'; ctx.beginPath(); ctx.roundRect(-s * 0.13, -s * 1.43, s * 0.26, s * 0.06, s * 0.03); ctx.fill();
    // MujaSauros pillion: lavender body, gold fins, turned head looking back at you
    const wob = Math.sin(G.t * 9) * (G.mode === 'play' ? 0.03 : 0.015) * s, ex = G.mood === 2 ? 1 : G.mood === 1 ? 2 : 0;
    ctx.strokeStyle = '#a48cff'; ctx.lineWidth = s * 0.15; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-s * 0.1, -s * 0.8); ctx.quadraticCurveTo(-s * 0.55, -s * 0.7 + wob * 2, -s * 0.5, -s * 1.0 + wob * 3); ctx.stroke();
    ctx.fillStyle = '#ffd88c'; for (let i = 0; i < 3; i++) { const tx = -s * (0.2 + i * 0.12), ty = -s * (0.78 + i * 0.07) + wob; ctx.beginPath(); ctx.moveTo(tx - s * 0.04, ty); ctx.lineTo(tx, ty - s * 0.1); ctx.lineTo(tx + s * 0.04, ty); ctx.fill(); }
    ctx.fillStyle = '#a48cff'; ctx.beginPath(); ctx.ellipse(0, -s * 0.98, s * 0.32, s * 0.28, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd88c'; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.11 - s * 0.045, -s * 1.2); ctx.lineTo(i * s * 0.11, -s * 1.32 + Math.abs(i) * s * 0.03); ctx.lineTo(i * s * 0.11 + s * 0.045, -s * 1.2); ctx.fill(); }
    ctx.fillStyle = '#a48cff'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * s * 0.3, -s * 0.96 + wob, s * 0.09, s * 0.14, sd * 0.5, 0, 7); ctx.fill(); }
    const hx = s * 0.1, hyy = -s * 1.12 + wob;
    ctx.fillStyle = '#a48cff'; ctx.beginPath(); ctx.arc(hx, hyy, s * 0.24, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd88c'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx + sd * s * 0.14, hyy - s * 0.18); ctx.lineTo(hx + sd * s * 0.2, hyy - s * 0.38); ctx.lineTo(hx + sd * s * 0.06, hyy - s * 0.24); ctx.fill(); }
    ctx.fillStyle = '#ff8fb4'; for (const sd of [-1, 1]) { ctx.globalAlpha = 0.75; ctx.beginPath(); ctx.ellipse(hx + sd * s * 0.16, hyy + s * 0.07, s * 0.045, s * 0.03, 0, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(hx + sd * s * 0.09, hyy - s * 0.03, s * 0.06, s * (ex === 2 ? 0.045 : 0.07), 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#16321f'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(hx + sd * s * 0.09 - s * 0.012, hyy - s * 0.03, s * 0.032, 0, 7); ctx.fill(); }
    ctx.strokeStyle = '#16321f'; ctx.lineWidth = Math.max(1.2, s * 0.025); ctx.beginPath();
    if (ex === 1) ctx.ellipse(hx, hyy + s * 0.1, s * 0.05, s * 0.04, 0, 0, 7); else if (ex === 2) { ctx.moveTo(hx - s * 0.05, hyy + s * 0.13); ctx.quadraticCurveTo(hx, hyy + s * 0.07, hx + s * 0.05, hyy + s * 0.13); } else { ctx.moveTo(hx - s * 0.05, hyy + s * 0.09); ctx.quadraticCurveTo(hx, hyy + s * 0.14, hx + s * 0.05, hyy + s * 0.09); }
    ctx.stroke();
    ctx.restore();
  }

  function draw(c) {
    ctx.save();
    if (G.shake > 0) ctx.translate(rnd(-1, 1) * G.shake * 18, rnd(-1, 1) * G.shake * 18);
    sky(); hills(c); ground(c); sceneryAll(c);
    const list = G.ents.slice().sort((a, b) => b.z - a.z);
    for (const e of list) ent(e, c);
    if (G.boost > 0 && !RM) {
      ctx.strokeStyle = 'rgba(255,246,234,.22)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i < 16; i++) { const a = hash(i + Math.floor(G.t * 14) * 3) * 6.283, r0 = W * 0.28, r1 = W * (0.6 + hash(i) * 0.4); ctx.moveTo(W / 2 + Math.cos(a) * r0, hy + Math.sin(a) * r0 * 0.9); ctx.lineTo(W / 2 + Math.cos(a) * r1, hy + Math.sin(a) * r1 * 0.9); }
      ctx.stroke();
    }
    const flick = G.inv > 0 && G.boost <= 0 && Math.floor(G.inv * 14) % 2 === 0;
    if (G.mode !== 'over' || G.hearts > 0) { if (!flick) rider(W / 2 + G.lane * LW, py, LW * 0.8, G.lean, G.y * LW * 0.62); }
    else { ctx.globalAlpha = 0.9; rider(W / 2 + G.lane * LW, py, LW * 0.8, G.lean + 1.2, 0); ctx.globalAlpha = 1; }
    for (const p of G.parts) { ctx.globalAlpha = clamp(p.l / p.m, 0, 1); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    const v = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.3, W / 2, H * 0.5, H * 0.75); v.addColorStop(0, 'rgba(10,6,24,0)'); v.addColorStop(1, 'rgba(10,6,24,.5)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    if (G.mode === 'paused') { ctx.fillStyle = 'rgba(10,6,24,.55)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff6ea'; ctx.textAlign = 'center'; ctx.font = '600 13px ' + MONO; ctx.fillText('PAUSED · TAP TO RIDE ON', W / 2, H * 0.5); }
    ctx.restore();
  }

  /* ---------- loop, pause, quality ---------- */
  let prevMode = 'play';
  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
    if (G.mode === 'paused') return;
    const c = update(dt); draw(c);
    if (dt > 0.034) { if (++slow === 40 && dpr > 1) resize(); } else if (slow > 0 && slow < 40) slow -= 0.25;
  }
  function go() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function halt() { cancelAnimationFrame(raf); raf = 0; }
  function pause() { if (G.mode === 'play') { prevMode = 'play'; G.mode = 'paused'; draw(curveAt()); } }
  function resume() { if (G.mode === 'paused') { G.mode = prevMode; last = performance.now(); } }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); halt(); } else go(); });

  /* ---------- input ---------- */
  let down = null;
  const act = { left() { if (G.mode === 'play') G.tl = clamp(G.tl - 1, -1, 1); }, right() { if (G.mode === 'play') G.tl = clamp(G.tl + 1, -1, 1); },
    jump() { if (G.mode === 'play' && G.y === 0) { G.vy = 9.2; beep(420, 760, 0.14, 'triangle', 0.06); } } };
  cv.addEventListener('pointerdown', e => { if (G.mode === 'paused') { if (!el.sheet.classList.contains('on')) resume(); return; } down = { x: e.clientX, y: e.clientY, t: performance.now(), done: false }; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => {
    if (!down || down.done) return; const dx = e.clientX - down.x, dy = e.clientY - down.y;
    if (Math.abs(dx) > 26 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? act.left() : act.right(); down.done = true; }
    else if (dy < -30 && Math.abs(dy) > Math.abs(dx)) { act.jump(); down.done = true; }
  });
  const up = () => { if (down && !down.done && performance.now() - down.t < 380) act.jump(); down = null; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => { down = null; });
  addEventListener('keydown', e => {
    if (!document.getElementById('apg')) return;
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a') act.left(); else if (k === 'ArrowRight' || k === 'd') act.right(); else if (k === 'ArrowUp' || k === ' ' || k === 'w') { if (G.mode === 'menu' || G.mode === 'over') return; act.jump(); }
    else if (k === 'p') G.mode === 'paused' ? resume() : pause();
  });

  /* ---------- buttons ---------- */
  $('apg-play').addEventListener('click', play);
  $('apg-again').addEventListener('click', play);
  $('apg-skip').addEventListener('click', () => { pause(); el.sheet.classList.add('on'); el.menu.classList.remove('on'); el.over.classList.remove('on'); });
  $('apg-back').addEventListener('click', () => { el.sheet.classList.remove('on'); if (G.mode === 'paused') resume(); else if (G.mode === 'over') el.over.classList.add('on'); else if (G.mode === 'menu') el.menu.classList.add('on'); });
  el.snd.addEventListener('click', () => {
    soundOn = !soundOn; el.snd.textContent = soundOn ? '♪ On' : '♪ Off'; el.snd.setAttribute('aria-pressed', soundOn);
    if (soundOn) { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume && ac.resume(); beep(660, 990, 0.12, 'triangle', 0.07); } catch (e) { soundOn = false; el.snd.textContent = '♪ Off'; } }
  });

  resize(); reset('menu'); go();
  window.__apGame = { G };
})();
