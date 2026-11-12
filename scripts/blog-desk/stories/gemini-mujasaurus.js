/* Story pack: "The AI that can't write" - the Gemini Decisions API explained on the Night Ride with Mujasauraus, Aashish's dino ride companion.
   Built the way modern Reels and Shorts are cut: the payoff is on screen in frame 1, a new picture or camera cut every 2-3 seconds, one idea per scene, re-hook mid-way, and the last line loops back to the first.
   Nine scenes, matched to content/blog/videos/gemini-decisions-api-mujasaurus.json. Each scene has build(C), draw(t, C), sfx(C) and optionally cam(t, C). */
(function () {
  const K = KIT, P = K.P;
  const DX = 540, DY = 1130; // where Mujasauraus stands
  const VY = 760;            // the road's vanishing point
  const roadHalf = (y) => 22 + 838 * ((y - VY) / (1920 - VY));
  // ---- the Night Ride: moon, hills, glowing road that streams towards you
  window.PACK = { scenes: [] };
  window.PACK.room = (acc, stars) => {
    const hills = (y, c, o) => `<path d="M-60 ${y} Q120 ${y - 90 * o} 300 ${y - 20} T640 ${y - 40 * o} T1000 ${y - 10} T1200 ${y - 60 * o} V${VY + 40} H-60Z" fill="${c}"/>`;
    let marks = ''; for (let i = 0; i < 9; i++) marks += `<polygon id="rd${i}" points="0,0" fill="#eef2ff"/>`;
    for (let i = 0; i < 7; i++) marks += `<circle id="rl${i}" r="10" fill="${P.teal}"/><circle id="rr${i}" r="10" fill="${P.pink}"/>`;
    return `<defs><linearGradient id="rdSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0d2a"/><stop offset=".5" stop-color="#1d2158"/><stop offset="1" stop-color="#4a3aa8"/></linearGradient>
<linearGradient id="rdRoad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#363c96"/><stop offset="1" stop-color="#0f1340"/></linearGradient></defs>
<rect x="-300" y="-500" width="1680" height="${VY + 540}" fill="url(#rdSky)"/>${stars}
<circle cx="840" cy="330" r="230" fill="url(#gGlow)"/><circle cx="840" cy="330" r="96" fill="#fff6c8"/><circle cx="812" cy="306" r="14" fill="#efe3a8"/><circle cx="870" cy="352" r="20" fill="#efe3a8"/>
${hills(VY + 10, '#262c7c', 1)}${hills(VY + 40, '#1a1f5c', 0.7)}
<rect x="-300" y="${VY + 30}" width="1680" height="1300" fill="#10143c"/>
<polygon points="${540 - 22},${VY} ${540 + 22},${VY} ${540 + 860},1920 ${540 - 860},1920" fill="url(#rdRoad)"/>
<line x1="${540 - 22}" y1="${VY}" x2="${540 - 860}" y2="1920" stroke="${P.teal}" stroke-width="7" opacity=".7"/><line x1="${540 + 22}" y1="${VY}" x2="${540 + 860}" y2="1920" stroke="${P.pink}" stroke-width="7" opacity=".7"/>${marks}`;
  };
  window.PACK.tick = (t, C) => {
    const T = C.T;
    for (let i = 0; i < 9; i++) {
      const d = ((T * 0.34 + i / 9) % 1), y1 = VY + 1160 * d * d, y2 = VY + 1160 * Math.min(1, d + 0.045) ** 2, h1 = 2 + 22 * d * d, h2 = 2 + 22 * Math.min(1, d + 0.045) ** 2;
      const e = document.getElementById('rd' + i); if (e) e.setAttribute('points', `${540 - h1},${y1.toFixed(1)} ${540 + h1},${y1.toFixed(1)} ${540 + h2},${y2.toFixed(1)} ${540 - h2},${y2.toFixed(1)}`);
    }
    for (let i = 0; i < 7; i++) {
      const d = ((T * 0.34 + i / 7) % 1), y = VY + 1160 * d * d, r = 2 + 15 * d * d, w = roadHalf(y) + 18 + 60 * d * d;
      [['rl', -1], ['rr', 1]].forEach(([k, sd]) => { const e = document.getElementById(k + i); if (e) { e.setAttribute('cx', (540 + sd * w).toFixed(1)); e.setAttribute('cy', (y - 10 * d).toFixed(1)); e.setAttribute('r', r.toFixed(1)); e.setAttribute('opacity', (0.15 + 0.85 * d).toFixed(2)); } });
    }
  };
  const board = (id, txt, col, w, h, tc) => `<g id="${id}"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="30" fill="${col}"/><rect x="${-w / 2 + 8}" y="${-h / 2 + 8}" width="${w - 16}" height="${h - 16}" rx="24" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="5"/><text x="0" y="${h * 0.17}" text-anchor="middle" font-family="Geist" font-weight="900" font-size="${Math.round(h * 0.5)}" fill="${tc || P.ink}">${K.esc(txt)}</text></g>`;
  const arrowSign = (id, dir, col) => `<g id="${id}"><rect x="-9" y="-10" width="18" height="260" fill="#7d8be0"/><g transform="scale(${dir} 1)"><path d="M-90 -90 h110 v-40 l110 80 l-110 80 v-40 h-110z" fill="${col}"/></g></g>`;
  const pencil = (id) => `<g id="${id}"><g transform="rotate(35)"><rect x="-26" y="-190" width="52" height="300" rx="10" fill="${P.yellow}"/><rect x="-26" y="-190" width="52" height="50" rx="10" fill="${P.pink}"/><path d="M-26 110 L0 180 L26 110Z" fill="#f3d2a2"/><path d="M-9 152 L0 180 L9 152Z" fill="${P.ink}"/></g><g id="${id}x" opacity="0"><circle r="170" fill="none" stroke="${P.pink}" stroke-width="26"/><path d="M-120 -120 L120 120" stroke="${P.pink}" stroke-width="26" stroke-linecap="round"/></g></g>`;
  const heart = (id) => `<path id="${id}" d="M0 20 C-60 -20 -40 -60 0 -30 C40 -60 60 -20 0 20Z" fill="${P.pink}"/>`;
  const bell = (id) => `<g id="${id}"><path d="M-46 30 q0 -70 46 -80 q46 10 46 80z" fill="${P.yellow}"/><rect x="-56" y="28" width="112" height="14" rx="7" fill="#f0a91d"/><circle cy="58" r="14" fill="#f0a91d"/></g>`;
  const D = (C, t, o) => C.dino('mj', Object.assign({ x: DX, y: DY, s: 1, T: C.T, talk: C.speak(t) }, o));
  const S = [];
  const cuts = (t, arr) => { let r = arr[0]; for (const a of arr) if (t >= a[0]) r = a; return { z: r[1], cx: r[2], cy: r[3], shake: r[4] || 0 }; };

  /* 1. HOOK: the payoff is on screen from frame 1 - an AI that can't write */
  S.push({
    noFade: true,
    build() { return K.dino('mj') + pencil('pc') + K.label('hA', 'AI THAT', 168, '#fff') + K.label('hB', "CAN'T WRITE", 124, P.pink) + K.label('hQ', 'WHY?', 150, P.yellow); },
    cam(t, C) { const a = C.W(/one/i, 0.4), b = C.W(/whole/i, 0.7); return cuts(t, [[0, 1.0, 540, 930], [a, 1.22, 540, 700, 5], [b, 1.0, 540, 930]]); },
    draw(t, C) {
      const { put, clamp, back, eo } = C, tw = C.W(/write/i, 0.2), tn = C.W(/one/i, 0.4), tp = C.W(/whole/i, 0.7);
      const sl = (a) => 1 + 0.35 * (1 - eo((t - a) / 0.2));
      put('hA', { x: 540, y: 400, s: sl(0) }); put('hB', { x: 540, y: 560, s: sl(0.08) * (1 + 0.04 * Math.sin(t * 14) * (t < 1.6 ? 1 : 0)) });
      const pp = clamp((t - 0.1) / 0.3); put('pc', { x: 540, y: 880, s: 0.8 + 0.3 * eo(pp) + (t > tw ? 0.12 * Math.exp(-(t - tw) * 6) : 0), r: Math.sin(t * 3) * 3 });
      put('pcx', { s: C.back((t - tw) / 0.25), o: t >= tw ? 1 : 0 });
      put('hQ', { x: 820, y: 700, r: 8, s: C.back((t - tp) / 0.3), o: t >= tp ? 1 : 0 });
      const sh = t >= tn; D(C, t, { y: DY + 40, s: 0.78, mood: t < tw ? 'curious' : sh ? 'worried' : 'shock', look: Math.sin(t * 2), armL: 16 + 6 * Math.sin(t * 6), armR: 16, head: -4 + 3 * Math.sin(t * 5), sweat: sh ? 0.6 : 0 });
      put('mj', { x: DX, y: 1170, s: 0.8 });
    },
    sfx(C) { return [{ t: 0.02, type: 'thump', v: 0.9 }, { t: C.W(/write/i, 0.2), type: 'thump', v: 0.9 }, { t: C.W(/one/i, 0.4), type: 'whoosh', v: 0.5 }, { t: C.W(/whole/i, 0.7), type: 'ding', v: 0.6 }]; },
  });

  /* 2. MEET: Mujasauraus and a thousand junctions */
  S.push({
    build() { let s = ''; for (let i = 0; i < 6; i++) s += arrowSign('sg' + i, i % 2 ? -1 : 1, [P.yellow, P.pink, P.teal, P.orange, P.blue, P.violet][i]); return K.dino('mj') + s + board('nm', 'MUJASAURAUS', P.violet, 600, 110, '#fff') + K.label('cN', '1,000', 190, P.yellow) + K.label('cL', 'junctions tonight', 70, '#fff') + heart('ht'); },
    cam(t, C) { const a = C.W(/ride/i, 0.3), b = C.W(/thousand/i, 0.55), c = C.W(/Fast/i, 0.9); return cuts(t, [[0, 1.0, 540, 940], [a, 1.14, 540, 1000], [b, 1.0, 540, 900], [c, 1.28, 540, 1000, 6]]); },
    draw(t, C) {
      const { put, clamp, back } = C, tn = C.W(/Muja/i, 0.05), tr = C.W(/ride/i, 0.3), tj = C.W(/thousand/i, 0.55), tf = C.W(/Fast/i, 0.9);
      put('nm', { x: 540, y: 560, s: back((t - tn) / 0.4), o: t >= tn ? 1 : 0 });
      put('ht', { x: 800, y: 760 - 40 * clamp((t - tr) / 1.2), s: back((t - tr) / 0.3) * 1.1, o: t >= tr && t < tr + 1.4 ? 1 : 0 });
      for (let i = 0; i < 6; i++) { const ti = tj + i * 0.13, p = clamp((t - ti) / 0.45), side = i % 2 ? 1 : -1; C.put('sg' + i, { x: 540 + side * (170 + 105 * Math.floor(i / 2)), y: 780 + 240 * Math.floor(i / 2) * 0.55 + 140 * (1 - back(p)) , s: (0.4 + 0.18 * Math.floor(i / 2)) * back(p), o: p > 0 ? 1 : 0 }); }
      const n = Math.round(1000 * C.tw(t, tj, tj + 1.0)); C.text('cN', n.toLocaleString('en-US')); put('cN', { x: 540, y: 460, s: t >= tj ? 1 + 0.04 * Math.sin(t * 16) : 0, o: t >= tj ? 1 : 0 }); put('cL', { x: 540, y: 545, s: C.back((t - tj - 0.2) / 0.4), o: t >= tj ? 1 : 0 });
      const wave = t < tj;
      D(C, t, { mood: t < tj ? 'happy' : t < tf ? 'worried' : 'shock', look: 0.3, armL: wave ? 14 : 24, armR: wave ? 120 + 28 * Math.sin(t * 9) : 24, head: Math.sin(t * 2) * 3, sweat: t >= tj ? 0.6 : 0, wagA: 14 });
      put('nm', { x: 540, y: 600, s: 1, o: t >= tn && t < tj ? 1 : 0 });
    },
    sfx(C) { const a = C.W(/Muja/i, 0.05), b = C.W(/thousand/i, 0.55); const o = [{ t: a, type: 'pop', v: 0.6 }, { t: C.W(/ride/i, 0.3), type: 'sparkle', v: 0.5 }, { t: b, type: 'swell', v: 0.5 }, { t: C.W(/Fast/i, 0.9), type: 'thump', v: 0.7 }]; for (let i = 0; i < 6; i++) o.push({ t: b + i * 0.13 + 0.25, type: 'pop', v: 0.35 }); return o; },
  });

  /* 3. PROBLEM: the chatty passenger */
  S.push({
    build() { let r = ''; for (let i = 0; i < 6; i++) r += `<rect id="bl${i}" x="-200" y="${-130 + i * 44}" width="${i % 3 === 2 ? 220 : 400}" height="16" rx="8" fill="#9aa4d4"/>`; return K.dino('mj') + arrowSign('sgM', 1, P.yellow) + `<g id="bb"><rect x="-250" y="-200" width="500" height="400" rx="56" fill="#f3f6ff"/><path d="M-120 196 l-50 70 l110 -70z" fill="#f3f6ff"/>${r}</g>` + board('ms', 'MISSED IT', P.pink, 560, 120, '#fff'); },
    cam(t, C) { const a = C.W(/paragraph/i, 0.4), b = C.W(/missed/i, 0.75); return cuts(t, [[0, 1.0, 540, 940], [a, 1.06, 580, 820], [b, 1.12, 540, 900, 8]]); },
    draw(t, C) {
      const { put, clamp, back, eo } = C, tc = C.W(/chatty/i, 0.1), tp = C.W(/paragraph/i, 0.4), tm = C.W(/missed/i, 0.75);
      const bp = back((t - tc) / 0.4); put('bb', { x: 690, y: 540, s: 0.78 * bp * (1 + 0.02 * Math.sin(t * 9)) + 0.05 * clamp((t - tp) / 1.0), o: t >= tc ? 1 : 0 });
      for (let i = 0; i < 6; i++) put('bl' + i, { sx: clamp((t - tc - 0.15 * i) / 0.25 + (t >= tp ? 1 : 0)) , o: 1 });
      const q = clamp((t - tp) / (tm - tp + 0.3)); put('sgM', { x: 540 - 650 * eo(clamp((t - tm) / 0.6)) , y: 800 + 120 * q, s: 0.3 + 1.5 * q * q, o: t >= tp ? 1 : 0 });
      put('ms', { x: 540, y: 1050, r: -4, s: back((t - tm - 0.3) / 0.35), o: t >= tm + 0.3 ? 1 : 0 });
      D(C, t, { mood: t < tm ? 'worried' : 'shock', look: t < tm ? 0.7 : -1, armL: 20, armR: 10 + 18 * Math.sin(t * 5), head: Math.sin(t * 3) * 4, sweat: t >= tp ? 1 : 0.3, y: DY, wagA: 4 });
    },
    sfx(C) { const tm = C.W(/missed/i, 0.75); return [{ t: C.W(/chatty/i, 0.1), type: 'pop', v: 0.5 }, { t: C.W(/paragraph/i, 0.4), type: 'swell', v: 0.5 }, { t: tm - 0.1, type: 'whoosh', v: 0.8 }, { t: tm + 0.3, type: 'thump', v: 0.8 }]; },
  });

  /* 4. SOLUTION: the co-pilot that just says LEFT */
  S.push({
    build() { return K.dino('mj') + K.gadget('gd') + K.label('gl', 'LEFT', 140, P.teal) + `<g id="ar"><path d="M-130 0 h160 v-60 l130 -0 -130 -0z" fill="none"/><path d="M130 -50 h-200 v-70 l-150 120 l150 120 v-70 h200z" fill="${P.teal}"/></g>` + K.label('ne', 'NO ESSAY.', 120, P.pink); },
    cam(t, C) { const a = C.W(/left/i, 0.3), b = C.W(/ninety/i, 0.5), c = C.W(/essay/i, 0.8); return cuts(t, [[0, 1.0, 540, 940], [a, 1.14, 440, 760], [b, 1.22, 540, 640], [c, 1.0, 540, 900, 6]]); },
    draw(t, C) {
      const { put, clamp, back } = C, tg = C.W(/co-?pilot|copilot/i, 0.1), tl = C.W(/left/i, 0.3), tn = C.W(/ninety/i, 0.5), te = C.W(/essay/i, 0.8);
      put('gd', { x: 700, y: 640, s: 1.2 * back((t - tg) / 0.5), r: 4 * Math.sin(t * 2), o: t >= tg ? 1 : 0 });
      put('ar', { x: 360 - 60 * (1 - C.eo((t - tl) / 0.3)), y: 600, s: 0.8 * back((t - tl) / 0.3), o: t >= tl ? 1 : 0 }); put('gl', { x: 360, y: 800, s: back((t - tl) / 0.3), o: t >= tl ? 1 : 0 });
      C.text('gdscr', Math.round(94 * C.tw(t, tn, tn + 0.6)) + '%');
      put('ne', { x: 540, y: 1000, r: -3, s: back((t - te) / 0.3), o: t >= te ? 1 : 0 });
      D(C, t, { mood: t < tg ? 'worried' : 'happy', look: t >= tl ? -1 : 0.3, armL: 16, armR: t >= tl ? 140 : 14, head: t >= tl ? 6 : 0, sweat: t < tg ? 0.5 : 0, wagA: 16, wag: 8 });
    },
    sfx(C) { return [{ t: C.W(/co-?pilot|copilot/i, 0.1), type: 'ding', v: 0.7 }, { t: C.W(/left/i, 0.3), type: 'pop', v: 0.7 }, { t: C.W(/ninety/i, 0.5), type: 'tick', v: 0.7 }, { t: C.W(/essay/i, 0.8), type: 'thump', v: 0.7 }]; },
  });

  /* 5. HOW: yes/no, pick one, score it - then a thousand at once */
  S.push({
    build() { return K.dino('mj') + board('c1', 'YES or NO', P.teal, 640, 120) + board('c2', 'PICK ONE', P.blue, 640, 120, '#fff') + board('c3', 'SCORE IT', P.orange, 640, 120) + K.label('cN', '1,000', 200, P.yellow) + K.label('cL', 'in ONE call', 90, '#fff'); },
    cam(t, C) { const a = C.W(/pick/i, 0.3), b = C.W(/thousand/i, 0.7); return cuts(t, [[0, 1.0, 540, 900], [a, 1.1, 540, 700], [b, 1.18, 540, 640, 5]]); },
    draw(t, C) {
      const { put, back, clamp } = C, ty = C.W(/yes/i, 0.05), tp = C.W(/pick/i, 0.3), ts = C.W(/score/i, 0.5), tt = C.W(/thousand/i, 0.7), fade = 1 - clamp((t - tt + 0.1) / 0.25);
      [['c1', ty, 420], ['c2', tp, 580], ['c3', ts, 740]].forEach(([id, a, y], i) => put(id, { x: 540 + (i % 2 ? 30 : -30) * (1 - C.eo((t - a) / 0.3)), y, r: (i - 1) * 2, s: back((t - a) / 0.35) * (0.6 + 0.4 * fade) , o: (t >= a ? 1 : 0) * fade }));
      const n = Math.round(1000 * C.tw(t, tt, tt + 0.9)); C.text('cN', n.toLocaleString('en-US')); put('cN', { x: 540, y: 560, s: t >= tt ? back((t - tt) / 0.3) : 0, o: t >= tt ? 1 : 0 }); put('cL', { x: 540, y: 680, s: back((t - tt - 0.3) / 0.4), o: t >= tt + 0.3 ? 1 : 0 });
      D(C, t, { mood: t >= tt ? 'shock' : 'happy', look: Math.sin(t * 2), armL: 14, armR: t >= tt ? 90 : 20, head: Math.sin(t * 3) * 3, wagA: 14, wag: 8, y: DY });
    },
    sfx(C) { return [{ t: C.W(/yes/i, 0.05), type: 'pop', v: 0.6 }, { t: C.W(/pick/i, 0.3), type: 'pop', v: 0.6 }, { t: C.W(/score/i, 0.5), type: 'pop', v: 0.6 }, { t: C.W(/thousand/i, 0.7), type: 'swell', v: 0.6 }, { t: C.W(/thousand/i, 0.7) + 0.9, type: 'thump', v: 0.8 }]; },
  });

  /* 6. PROOF: speed and price */
  S.push({
    build() { return K.dino('mj') + K.stopwatch('sw') + K.coin('cn') + K.label('sT', '0.25 sec', 84, P.teal) + K.label('cT', '$0.10', 96, P.yellow) + K.label('cS', 'per million tokens', 46, '#fff'); },
    cam(t, C) { const a = C.W(/ten/i, 0.55); return t < a ? { z: 1.2, cx: 360, cy: 680 } : cuts(t, [[a, 1.2, 730, 680], [a + 1.6, 1.0, 540, 900]]); },
    draw(t, C) {
      const { put, back, clamp, eo } = C, tq = C.W(/quarter/i, 0.15), tc = C.W(/ten/i, 0.55);
      const p = back((t - tq) / 0.45); put('sw', { x: 360, y: 560, s: 0.85 * p, o: t >= tq - 0.05 ? 1 : 0 }); put('swhand', { r: 90 * eo((t - tq) / 0.5) + (t > tq + 0.5 ? 6 * Math.sin(t * 20) : 0) }); const arc = document.getElementById('swarc'); if (arc) arc.setAttribute('opacity', t > tq + 0.5 ? 0.55 : 0);
      put('sT', { x: 360, y: 780, s: back((t - tq - 0.3) / 0.35), o: t >= tq + 0.3 ? 1 : 0 });
      put('cn', { x: 730, y: 560, s: 1.0 * back((t - tc) / 0.45), r: 360 * (1 - eo((t - tc) / 0.7)) , o: t >= tc ? 1 : 0 });
      put('cT', { x: 730, y: 780, s: back((t - tc - 0.3) / 0.35), o: t >= tc + 0.3 ? 1 : 0 }); put('cS', { x: 730, y: 840, s: back((t - tc - 0.5) / 0.35), o: t >= tc + 0.5 ? 1 : 0 });
      D(C, t, { y: DY, s: 0.78, mood: 'happy', look: t < tc ? -0.6 : 0.6, armL: 20, armR: 20 + 20 * Math.sin(t * 6), wagA: 18, wag: 9 });
    },
    sfx(C) { const tq = C.W(/quarter/i, 0.15), tc = C.W(/ten/i, 0.55); return [{ t: tq, type: 'whoosh', v: 0.6 }, { t: tq + 0.5, type: 'ding', v: 0.7 }, { t: tc, type: 'sparkle', v: 0.7 }, { t: tc + 0.3, type: 'pop', v: 0.5 }]; },
  });

  /* 7. RE-HOOK / TWIST: Google ran the tests itself */
  S.push({
    build() { return K.dino('mj') + `<g id="sb"><rect x="-380" y="-190" width="760" height="380" rx="50" fill="#1a1f5c"/><rect x="-372" y="-182" width="744" height="364" rx="44" fill="none" stroke="${P.teal}" stroke-opacity=".6" stroke-width="5"/><text x="0" y="-120" text-anchor="middle" font-family="Geist" font-weight="800" font-size="38" fill="#9aa4d4" letter-spacing="4">GOOGLE'S OWN TESTS</text><text x="0" y="40" text-anchor="middle" font-family="Geist" font-weight="900" font-size="180" fill="${P.teal}">7 / 9</text><text x="0" y="130" text-anchor="middle" font-family="Geist" font-weight="800" font-size="40" fill="#fff">GEMINI WINS</text></g>` + K.magnifier('mg') + board('jv', 'JEV  wins 2', P.orange, 560, 110) + K.label('hC', 'THE CATCH', 130, P.yellow); },
    cam(t, C) { const a = C.W(/Google/i, 0.2), b = C.W(/rival/i, 0.5), c = C.W(/two/i, 0.75); return cuts(t, [[0, 1.0, 540, 900, 6], [a, 1.06, 540, 700], [b, 1.05, 580, 780], [c, 1.1, 620, 820, 4]]); },
    draw(t, C) {
      const { put, back, clamp } = C, th = C.W(/catch/i, 0.0), tg = C.W(/Google/i, 0.2), tr = C.W(/rival/i, 0.5), tw = C.W(/two/i, 0.75);
      put('hC', { x: 540, y: 400, s: back((t - 0.05) / 0.3) * (t < tg ? 1 : 0.55), o: t < tg + 0.5 ? 1 : 0, r: -3 }); put('hC', { x: 540, y: t < tg ? 400 : 330, s: back((t - 0.05) / 0.3) * (t < tg ? 1 : 0.5), r: -3 });
      const sp = back((t - 0.15) / 0.4); put('sb', { x: 540, y: 600, s: sp * 0.78, r: t < 0.6 ? 3 * (1 - sp) : 0, o: t >= 0.1 ? 1 : 0 });
      put('mg', { x: 460 + 230 * C.eo((t - tg) / 1.2), y: 700 + 20 * Math.sin(t * 3), s: 1.4 * back((t - tg) / 0.3), o: t >= tg ? 1 : 0 });
      put('jv', { x: 540 + 600 * (1 - C.eo((t - tr) / 0.35)), y: 880, r: -3, s: 1 + (t > tw ? 0.08 * Math.sin((t - tw) * 14) * Math.exp(-(t - tw) * 2) : 0), o: t >= tr ? 1 : 0 });
      D(C, t, { y: DY + 40, s: 0.72, mood: t < tg ? 'curious' : 'smirk', look: 0.7, lookY: -0.5, armL: 14, armR: 14 + 40 * clamp((t - tr) / 0.5), head: -6, wagA: 5 });
    },
    sfx(C) { return [{ t: 0.05, type: 'thump', v: 0.9 }, { t: C.W(/Google/i, 0.2), type: 'ding', v: 0.6 }, { t: C.W(/rival/i, 0.5) , type: 'whoosh', v: 0.6 }, { t: C.W(/two/i, 0.75), type: 'thump', v: 0.7 }]; },
  });

  /* 8. VERDICT: who it is for */
  S.push({
    build() { return K.dino('mj') + K.label('gH', 'GREAT FOR', 66, P.teal) + K.label('nH', 'NOT FOR', 66, P.pink) + board('g1', 'Same decision, daily', P.teal, 470, 100) + board('g2', 'Audio, video, PDFs', P.teal, 470, 100) + board('n1', 'Writing', P.pink, 400, 100, '#fff') + board('n2', 'Cheapest', P.pink, 400, 100, '#fff') + board('n3', 'Self-hosting', P.pink, 400, 100, '#fff'); },
    cam(t, C) { const b = C.W(/can't|cant|isn't/i, 0.45); return t < b ? { z: 1.05, cx: 300, cy: 700 } : { z: 1.05, cx: 780, cy: 720 }; },
    draw(t, C) {
      const { put, back } = C, tg = C.W(/same|small/i, 0.05), tn = C.W(/can't|cant|isn't/i, 0.45), ts = C.W(/cheapest|isn't/i, 0.6), th = C.W(/host/i, 0.8);
      put('gH', { x: 290, y: 430, s: back((t - tg) / 0.3), o: t >= tg ? 1 : 0 }); put('g1', { x: 290, y: 540, s: back((t - tg - 0.15) / 0.3), o: t >= tg + 0.15 ? 1 : 0 }); put('g2', { x: 290, y: 670, s: back((t - tg - 0.55) / 0.3), o: t >= tg + 0.55 ? 1 : 0 });
      put('nH', { x: 790, y: 430, s: back((t - tn) / 0.3), o: t >= tn ? 1 : 0 }); put('n1', { x: 790, y: 540, s: back((t - tn) / 0.3), o: t >= tn ? 1 : 0 }); put('n2', { x: 790, y: 670, s: back((t - ts) / 0.3), o: t >= ts ? 1 : 0 }); put('n3', { x: 790, y: 800, s: back((t - th) / 0.3), o: t >= th ? 1 : 0 });
      D(C, t, { y: DY + 20, s: 0.8, mood: t < tn ? 'happy' : 'curious', look: t < tn ? -0.6 : 0.6, armL: 16, armR: 16, wagA: 12, wag: 7 });
    },
    sfx(C) { return [{ t: C.W(/same|small/i, 0.05), type: 'pop', v: 0.5 }, { t: C.W(/same|small/i, 0.05) + 0.6, type: 'pop', v: 0.5 }, { t: C.W(/can't|cant|isn't/i, 0.45), type: 'thump', v: 0.6 }, { t: C.W(/cheapest|isn't/i, 0.6), type: 'pop', v: 0.5 }, { t: C.W(/host/i, 0.8), type: 'pop', v: 0.5 }]; },
  });

  /* 9. CTA that loops back to the hook */
  S.push({
    build() { let h = ''; for (let i = 0; i < 6; i++) h += K.dino ? heart('hr' + i) : ''; return K.dino('mj') + board('ur', 'aashishpandey.com/blog', P.blue, 820, 110, '#fff') + `<g id="fl"><rect x="-230" y="-62" width="460" height="124" rx="62" fill="${P.pink}"/><text x="0" y="22" text-anchor="middle" font-family="Geist" font-weight="900" font-size="64" fill="#fff">FOLLOW</text></g>` + bell('bl') + h + pencil('pc') + K.label('lp', 'Still smart.', 110, P.teal); },
    cam(t, C) { const a = C.W(/Because|smartest/i, 0.65); return cuts(t, [[0, 1.0, 540, 940], [a, 1.2, 540, 780, 4]]); },
    draw(t, C) {
      const { put, back, clamp } = C, tb = C.W(/blog|sources/i, 0.05), tf = C.W(/Follow/i, 0.3), tl = C.W(/Because|smartest/i, 0.65);
      const gone = t >= tl; put('ur', { x: 540, y: 480, s: back((t - tb) / 0.35) * (gone ? 0 : 1), o: t >= tb && !gone ? 1 : 0 });
      const fp = back((t - tf) / 0.35); put('fl', { x: 480, y: 660, s: fp * (1 + 0.04 * Math.sin(t * 8)) * (gone ? 0 : 1), o: t >= tf && !gone ? 1 : 0 }); put('bl', { x: 790, y: 650, s: fp * 0.9 * (gone ? 0 : 1), r: 14 * Math.sin(t * 10), o: t >= tf && !gone ? 1 : 0 });
      for (let i = 0; i < 6; i++) { const ti = tf + 0.4 + i * 0.12, p = clamp((t - ti) / 1.2); put('hr' + i, { x: 380 + i * 60 + Math.sin(t * 3 + i) * 12, y: 560 - 180 * p, s: 0.7 * back(clamp((t - ti) / 0.3)) * (1 - p * 0.5), o: p > 0 && p < 1 && !gone ? 1 - p * 0.6 : 0 }); }
      put('pc', { x: 540, y: 560, s: 0.62 * back((t - tl) / 0.35), o: gone ? 1 : 0, r: 2 * Math.sin(t * 3) }); put('pcx', { s: 1, o: gone ? 1 : 0 });
      put('lp', { x: 540, y: 880, s: back((t - tl - 0.3) / 0.35), o: t >= tl + 0.3 ? 1 : 0 });
      D(C, t, { mood: 'happy', look: 0.2, armL: 16, armR: 120 + 30 * Math.sin(t * 9), head: Math.sin(t * 2.5) * 4, wagA: 18, wag: 9 });
      put('mj', { x: DX, y: DY + (gone ? 60 : 0), s: gone ? 0.8 : 1 });
    },
    sfx(C) { return [{ t: C.W(/blog|sources/i, 0.05), type: 'pop', v: 0.5 }, { t: C.W(/Follow/i, 0.3), type: 'ding', v: 0.6 }, { t: C.W(/Because|smartest/i, 0.65), type: 'sparkle', v: 0.6 }, { t: C.W(/Because|smartest/i, 0.65) + 0.8, type: 'thump', v: 0.6 }]; },
  });

  window.PACK.scenes = S;
})();
