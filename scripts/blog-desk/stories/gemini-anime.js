/* Story pack: "The AI that can't write" in an anime-studio look. Concept first: what apps do today, why it is slow and messy, what the Decisions API changes, what it can do, the numbers, the catch, who it is for.
   Cel-shaded cards and characters, painted dusk/tech/dawn backgrounds with parallax, eased camera paths, swipe transitions between scenes (the engine draws them). Mujasauraus only appears where he helps explain (the code that digs through the paragraph, the benchmark check, the sign-off).
   Matched to content/blog/videos/gemini-decisions-api-anime.json. Each scene has room (background), build(C), draw(t, C), sfx(C) and cam(t, C). */
(function () {
  const K = KIT, A = K.A, P = K.P, INK = A.INK;
  window.PACK = { anime: true, noFade: true, room: null, scenes: [] };
  const S = [];
  const sbk = (x) => { x = Math.max(0, Math.min(1, x)); const c1 = 0.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const pop = (t, a, d) => (t < a ? 0 : sbk((t - a) / (d || 0.5)));
  const op = (t, a, d) => Math.max(0, Math.min(1, (t - a) / (d || 0.18)));
  const par = (C, t) => { const u = t / C.d; C.put('bgA', { x: -16 * u, y: -6 * u }); C.put('bgB', { x: -34 * u }); C.put('bgC', { x: -58 * u }); };
  const setT = (C, id, s) => { C.text(id + 'a', s); C.text(id + 'b', s); };
  const bob = (C, i, a) => Math.sin(C.T * 1.6 + i * 1.7) * (a || 8);
  const camP = (keys) => (t, C) => C.path(t, keys.map((k) => [k[0] * C.d, k[1], k[2], k[3]]));
  const chip = (id, txt, col, w, tc, size) => K.A.card(id, w || 320, 92, col, `<text x="0" y="${(size || 40) * 0.36}" text-anchor="middle" font-family="Geist" font-weight="900" font-size="${size || 40}" fill="${tc || INK}">${K.esc(txt)}</text>`, 46);
  const arrow = (id, col) => `<g id="${id}"><path d="M-34 -40 h68 v44 h38 l-72 70 l-72 -70 h38z" fill="${col || P.teal}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/></g>`;
  const lines = (n, w) => Array.from({ length: n }, (_, i) => `<rect x="${-w / 2}" y="${-56 + i * 30}" width="${i % 4 === 3 ? w * 0.55 : w}" height="12" rx="6" fill="#8a94d4"/>`).join('');
  const envelope = (id, col) => K.A.card(id, 360, 240, col || '#fff', `<path d="M-166 -96 L0 30 L166 -96" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M-166 96 L-54 -10 M166 96 L54 -10" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" opacity=".5"/>`, 30);
  const wrap = (id, inner) => `<g id="${id}">${inner}</g>`;

  /* 1. HOOK + CONTEXT */
  S.push({
    room: () => A.dusk(),
    build() {
      return A.burst('bs', '#ffe3f0', 34) + `<g id="orb"><circle r="260" fill="url(#aGlowP)"/><circle r="150" fill="#2d2f9f" stroke="${INK}" stroke-width="8"/><circle r="150" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="6" stroke-dasharray="40 300" stroke-linecap="round"/><text x="0" y="40" text-anchor="middle" font-family="Geist" font-weight="900" font-size="120" fill="#fff" stroke="${INK}" stroke-width="10" paint-order="stroke">AI</text>
<g id="pn" transform="translate(150 -130) rotate(35)"><rect x="-22" y="-110" width="44" height="190" rx="8" fill="${P.yellow}" stroke="${INK}" stroke-width="5"/><rect x="-22" y="-110" width="44" height="36" rx="8" fill="${P.pink}" stroke="${INK}" stroke-width="5"/><path d="M-22 80 L0 130 L22 80Z" fill="#f3d2a2" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/></g>
<g id="nox" opacity="0"><circle cx="150" cy="-130" r="112" fill="none" stroke="${P.pink}" stroke-width="22"/><path d="M80 -200 L220 -60" stroke="${P.pink}" stroke-width="22" stroke-linecap="round"/></g></g>`
        + K.A.card('q1', 300, 120, '#fff', `<text x="0" y="16" text-anchor="middle" font-family="Geist" font-weight="900" font-size="54" fill="${INK}">YES?</text>`) + K.A.card('q2', 300, 120, '#fff', `<text x="0" y="16" text-anchor="middle" font-family="Geist" font-weight="900" font-size="54" fill="${INK}">NO?</text>`) + K.A.card('q3', 300, 120, '#fff', `<text x="0" y="16" text-anchor="middle" font-family="Geist" font-weight="900" font-size="54" fill="${INK}">URGENT?</text>`)
        + A.title('hA', 'AI THAT', 170, '#fff', '#ff5f8f') + A.title('hB', "CAN'T WRITE", 118, '#ffe36b', '#ff5f8f') + chip('gc', "Google's new Decisions API", '#fff', 700, INK, 40) + A.spark('s1', '#fff', 34) + A.spark('s2', '#ffe36b', 26) + A.spark('s3', '#fff', 22);
    },
    cam: camP([[0, 1.0, 540, 960], [1, 1.1, 540, 900]]),
    draw(t, C) {
      const { put, clamp, eo } = C, tw = C.W(/write/i, 0.55), ty = C.W(/yes/i, 0.7);
      par(C, t);
      put('hA', { x: 540, y: 420, s: 1 + 0.25 * (1 - eo(t / 0.35)), o: 1 }); put('hB', { x: 540, y: 570, s: 1 + 0.25 * (1 - eo((t - 0.08) / 0.35)) });
      put('orb', { x: 540, y: 960 + bob(C, 0, 10), s: 1 + 0.03 * Math.sin(C.T * 3) });
      put('nox', { s: pop(t, tw, 0.35), ox: 150, oy: -130, o: t >= tw ? 1 : 0 });
      put('bs', { x: 540, y: 960, r: C.T * 6, s: 0.6 + 0.5 * eo((t - tw) / 0.5), o: t >= tw ? 0.55 * (1 - clamp((t - tw - 0.15) / 0.55)) : 0 });
      [['q1', 250, 840, -6], ['q2', 840, 900, 5], ['q3', 800, 1130, -3]].forEach((q, i) => { const a = ty + i * 0.3; put(q[0], { x: q[1], y: q[2] + bob(C, i + 2, 10) - 40 * (1 - eo((t - a) / 0.6)), r: q[3], s: pop(t, a, 0.6), o: op(t, a) }); });
      put('gc', { x: 540, y: 1180, s: pop(t, 0.5, 0.6), o: op(t, 0.5) });
      [['s1', 220, 700], ['s2', 880, 740], ['s3', 740, 1050]].forEach((p, i) => put(p[0], { x: p[1], y: p[2] + bob(C, i, 14), s: 0.7 + 0.5 * Math.abs(Math.sin(C.T * 2 + i * 2)), r: C.T * 30, o: 1 }));
    },
    sfx(C) { return [{ t: 0.02, type: 'thump', v: 0.9 }, { t: C.W(/write/i, 0.55), type: 'thump', v: 0.8 }, { t: C.W(/yes/i, 0.7), type: 'pop', v: 0.5 }]; },
  });

  /* 2. THE SETUP: a thousand support emails, three answers each */
  S.push({
    room: () => A.tech(),
    build() {
      return envelope('e2', '#e7ecff') + envelope('e1', '#f3f6ff') + envelope('e0', '#fff') + A.title('cT', '1,000', 150, P.yellow, '#ff5f8f') + A.title('cS', 'SUPPORT EMAILS', 70, '#fff', '#5b8cff')
        + chip('t1', 'ANGRY?', P.pink, 330, '#fff', 46) + chip('t2', 'URGENT?', P.yellow, 360, INK, 46) + chip('t3', 'WHO HANDLES IT?', P.teal, 560, INK, 44);
    },
    cam: camP([[0, 1.0, 540, 940], [1, 1.1, 540, 880]]),
    draw(t, C) {
      const { put, eo } = C, th = C.W(/thousand/i, 0.1), a1 = C.W(/angry/i, 0.45), a2 = C.W(/urgent/i, 0.6), a3 = C.W(/handle|who/i, 0.78);
      par(C, t);
      put('cT', { x: 540, y: 470, s: pop(t, th, 0.6), o: op(t, th) }); setT(C, 'cT', Math.round(1000 * C.tw(t, th, th + 1.2)).toLocaleString('en-US')); put('cS', { x: 540, y: 570, s: pop(t, th + 0.2, 0.6), o: op(t, th + 0.2) });
      [2, 1, 0].forEach((i) => put('e' + i, { x: 540 + (i - 1) * 40 * pop(t, 0, 0.7) + (i === 0 ? 0 : 0), y: 820 - i * 36 + bob(C, i, 10), r: (i - 1) * 7 * pop(t, 0, 0.8) + Math.sin(C.T + i) * 1.5, s: (0.95 - i * 0.06) * pop(t, i * 0.12, 0.6), o: 1 }));
      [['t1', 215, 1040, a1, -5], ['t2', 860, 1000, a2, 5], ['t3', 540, 1150, a3, -2]].forEach((q) => put(q[0], { x: q[1], y: q[2] + bob(C, q[1], 8) + 40 * (1 - eo((t - q[3]) / 0.5)), r: q[4], s: pop(t, q[3], 0.55), o: op(t, q[3]) }));
    },
    sfx(C) { return [{ t: C.W(/thousand/i, 0.1), type: 'swell', v: 0.5 }, { t: C.W(/angry/i, 0.45), type: 'pop', v: 0.5 }, { t: C.W(/urgent/i, 0.6), type: 'pop', v: 0.5 }, { t: C.W(/handle|who/i, 0.78), type: 'pop', v: 0.5 }]; },
  });

  /* 3. THE OLD WAY: chatbot writes a paragraph, the code digs the answer out */
  S.push({
    room: () => A.tech(),
    build() {
      return envelope('em', '#fff') + arrow('a1', P.teal) + arrow('a2', P.pink)
        + `<g id="bot"><circle r="190" fill="url(#aGlowT)"/><rect x="-120" y="-100" width="240" height="200" rx="80" fill="#e9eeff" stroke="${INK}" stroke-width="7"/><rect x="-86" y="-66" width="172" height="110" rx="46" fill="#171d63"/><ellipse cx="-34" cy="-14" rx="16" ry="22" fill="${P.teal}"/><ellipse cx="34" cy="-14" rx="16" ry="22" fill="${P.teal}"/><circle cx="-28" cy="-22" r="6" fill="#fff"/><circle cx="40" cy="-22" r="6" fill="#fff"/><line x1="0" y1="-100" x2="0" y2="-150" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><circle cx="0" cy="-158" r="16" fill="${P.yellow}" stroke="${INK}" stroke-width="5"/></g>`
        + K.A.card('pg', 760, 300, '#f3f6ff', lines(6, 640)) + chip('cs', 'SLOW', P.pink, 240, '#fff', 40) + chip('cm', 'MESSY', P.orange, 270, INK, 40) + K.dino('mj') + K.magnifier('mg');
    },
    cam: camP([[0, 1.0, 540, 900], [1, 1.08, 580, 960]]),
    draw(t, C) {
      const { put, eo, clamp } = C, te = C.W(/chatbot/i, 0.12), tp = C.W(/paragraph/i, 0.3), td = C.W(/dig|code/i, 0.58), ts = C.W(/slow/i, 0.85);
      par(C, t);
      put('em', { x: 540, y: 450, s: 0.5 * pop(t, 0, 0.5), o: 1 }); put('a1', { x: 540, y: 560 + 8 * Math.sin(C.T * 5), s: 0.55 * pop(t, te - 0.1, 0.4), o: op(t, te - 0.1) });
      put('bot', { x: 540, y: 730 + bob(C, 1, 8), s: 0.8 * pop(t, te, 0.55), o: op(t, te) });
      put('a2', { x: 540, y: 870 + 8 * Math.sin(C.T * 5), s: 0.55 * pop(t, tp - 0.1, 0.4), o: op(t, tp - 0.1) });
      put('pg', { x: 500, y: 1040, s: pop(t, tp, 0.6) * (1 + 0.02 * Math.sin(C.T * 3)), o: op(t, tp) });
      put('cs', { x: 850, y: 640, r: 7, s: pop(t, ts, 0.5), o: op(t, ts) }); put('cm', { x: 235, y: 760, r: -6, s: pop(t, ts + 0.5, 0.5), o: op(t, ts + 0.5) });
      const mx = 330 + 380 * ((Math.sin(C.T * 1.5) + 1) / 2);
      put('mg', { x: mx, y: 1020 + 30 * Math.sin(C.T * 3), s: 0.9 * pop(t, td, 0.5), o: op(t, td) });
      C.dino('mj', { x: 920, y: 1290, s: 0.45 * pop(t, td - 0.1, 0.6), T: C.T, mood: t < ts ? 'curious' : 'worried', talk: C.speak(t), look: -0.8, armL: 30, armR: 40 + 20 * Math.sin(C.T * 3), head: 4, sweat: t > ts ? 0.7 : 0, wagA: 8 });
    },
    sfx(C) { return [{ t: C.W(/chatbot/i, 0.12), type: 'pop', v: 0.5 }, { t: C.W(/paragraph/i, 0.3), type: 'swell', v: 0.45 }, { t: C.W(/dig|code/i, 0.58), type: 'tick', v: 0.6 }, { t: C.W(/slow/i, 0.85), type: 'thump', v: 0.6 }]; },
  });

  /* 4. THE NEW WAY: numbers, not paragraphs */
  S.push({
    room: () => A.tech(),
    build() {
      const row = (i, label, col) => `<text x="-370" y="${-82 + i * 130 + 14}" font-family="Geist" font-weight="900" font-size="46" fill="${INK}">${label}</text><rect x="-130" y="${-82 + i * 130 - 22}" width="360" height="52" rx="26" fill="#cfd6f7" stroke="${INK}" stroke-width="4"/><rect id="bar${i}" x="-130" y="${-82 + i * 130 - 22}" width="360" height="52" rx="26" fill="${col}" stroke="${INK}" stroke-width="4"/><text id="val${i}" x="370" y="${-82 + i * 130 + 14}" text-anchor="end" font-family="Geist" font-weight="900" font-size="50" fill="${INK}">0%</text>`;
      return A.title('hA', 'NUMBERS,', 100, '#fff', '#5b8cff') + A.title('hB', 'NOT PARAGRAPHS', 96, '#ffe36b', '#ff5f8f') + chip('ap', 'GEMINI DECISIONS API', '#fff', 620, INK, 38)
        + K.A.card('pn', 860, 540, '#eef1ff', row(0, 'Angry', P.pink) + row(1, 'Urgent', P.yellow) + `<text x="-370" y="${-82 + 260 + 14}" font-family="Geist" font-weight="900" font-size="46" fill="${INK}">Team</text><g id="tm"><rect x="-130" y="${-82 + 260 - 34}" width="500" height="76" rx="38" fill="${P.teal}" stroke="${INK}" stroke-width="4"/><text x="120" y="${-82 + 260 + 16}" text-anchor="middle" font-family="Geist" font-weight="900" font-size="50" fill="${INK}">Billing</text></g>`, 44)
        + chip('ex', 'EXAMPLE', P.violet, 250, '#fff', 34) + A.spark('s1', '#fff', 30) + A.spark('s2', P.teal, 24);
    },
    cam: camP([[0, 1.04, 540, 980], [1, 1.0, 540, 900]]),
    draw(t, C) {
      const { put, eo } = C, tn = C.W(/numbers|sends/i, 0.5), tb = C.W(/ninety|angry/i, 0.75);
      par(C, t);
      put('hA', { x: 540, y: 440, s: pop(t, 0.1, 0.6), o: op(t, 0.1) }); put('hB', { x: 540, y: 540, s: pop(t, 0.25, 0.6), o: op(t, 0.25) }); put('ap', { x: 540, y: 660, s: pop(t, 0.4, 0.5), o: op(t, 0.4) });
      put('pn', { x: 540, y: 1000, s: pop(t, tn - 0.3, 0.7) * (1 + 0.01 * Math.sin(C.T * 2)), o: op(t, tn - 0.3) });
      const v0 = 0.94 * C.tw(t, tb, tb + 0.9), v1 = 0.81 * C.tw(t, tb + 0.4, tb + 1.3);
      put('bar0', { sx: Math.max(0.001, v0), ox: -130 }); put('bar1', { sx: Math.max(0.001, v1), ox: -130 }); C.text('val0', Math.round(v0 * 100) + '%'); C.text('val1', Math.round(v1 * 100) + '%');
      put('tm', { s: pop(t, tb + 0.9, 0.5), ox: 120, oy: 178, o: op(t, tb + 0.9) });
      put('ex', { x: 820, y: 700, r: 8, s: pop(t, tn, 0.5), o: op(t, tn) });
      put('s1', { x: 130, y: 760, s: 0.6 + 0.5 * Math.abs(Math.sin(C.T * 2)), r: C.T * 30 }); put('s2', { x: 960, y: 1290, s: 0.6 + 0.5 * Math.abs(Math.sin(C.T * 2 + 1)), r: -C.T * 30 });
    },
    sfx(C) { const tb = C.W(/ninety|angry/i, 0.75); return [{ t: C.W(/numbers|sends/i, 0.5), type: 'ding', v: 0.6 }, { t: tb, type: 'tick', v: 0.7 }, { t: tb + 0.5, type: 'tick', v: 0.7 }, { t: tb + 1.0, type: 'sparkle', v: 0.6 }]; },
  });

  /* 5. WHAT IT CAN DO: three kinds of question, a thousand at once, any kind of input */
  S.push({
    room: () => A.tech(),
    build() {
      const icon = {
        yn: `<rect x="-300" y="-30" width="110" height="60" rx="30" fill="${P.teal}" stroke="${INK}" stroke-width="5"/><circle cx="-220" cy="0" r="22" fill="#fff" stroke="${INK}" stroke-width="4"/>`,
        pk: `<rect x="-300" y="-36" width="100" height="20" rx="10" fill="#9aa4d4"/><rect x="-300" y="6" width="100" height="20" rx="10" fill="${P.blue}" stroke="${INK}" stroke-width="3"/>`,
        sc: `<rect x="-300" y="-8" width="120" height="16" rx="8" fill="#9aa4d4"/><circle cx="-228" cy="0" r="24" fill="${P.orange}" stroke="${INK}" stroke-width="5"/>`,
      };
      const fc = (id, label, col, ic) => K.A.card(id, 860, 140, col, ic + `<text x="40" y="16" font-family="Geist" font-weight="900" font-size="58" fill="${INK}" text-anchor="middle">${label}</text>`, 40);
      return fc('f1', 'YES or NO', '#dff7f0', icon.yn) + fc('f2', 'PICK ONE', '#dbe6ff', icon.pk) + fc('f3', 'SCORE IT', '#ffe7d4', icon.sc)
        + A.title('cN', '1,000', 190, P.yellow, '#ff5f8f') + A.title('cL', 'QUESTIONS IN ONE CALL', 56, '#fff', '#5b8cff')
        + ['TEXT', 'IMAGES', 'AUDIO', 'VIDEO', 'PDFs'].map((x, i) => chip('m' + i, x, [P.teal, P.pink, P.yellow, P.blue, P.orange][i], 260, INK, 44)).join('');
    },
    cam: camP([[0, 1.0, 540, 900], [1, 1.07, 540, 880]]),
    draw(t, C) {
      const { put, eo, clamp } = C, ty = C.W(/yes/i, 0.05), tp = C.W(/pick/i, 0.3), ts = C.W(/score/i, 0.5), tt = C.W(/thousand/i, 0.72), tx = C.W(/text/i, 0.88);
      par(C, t); const out = clamp((t - tt + 0.15) / 0.4);
      [['f1', ty, 560], ['f2', tp, 740], ['f3', ts, 920]].forEach(([id, a, y], i) => put(id, { x: 540 + 140 * eo(out) * (i % 2 ? 1 : -1) - 120 * (1 - eo((t - a) / 0.5)), y: y + bob(C, i, 5), s: pop(t, a, 0.55) * (1 - 0.3 * eo(out)), r: (i - 1) * 1.5, o: op(t, a) * (1 - eo(out)) }));
      put('cN', { x: 540, y: 600, s: pop(t, tt, 0.6), o: op(t, tt) }); setT(C, 'cN', Math.round(1000 * C.tw(t, tt, tt + 1.0)).toLocaleString('en-US')); put('cL', { x: 540, y: 700, s: pop(t, tt + 0.25, 0.6), o: op(t, tt + 0.25) });
      [[300, 860], [570, 860], [840, 860], [420, 980], [700, 980]].forEach((p, i) => { const a = tx + i * 0.22; put('m' + i, { x: p[0] + (i > 2 ? -10 : 0), y: p[1] + bob(C, i, 6) + 30 * (1 - eo((t - a) / 0.4)), s: 0.95 * pop(t, a, 0.5), o: op(t, a) }); });
    },
    sfx(C) { const tx = C.W(/text/i, 0.88); return [{ t: C.W(/yes/i, 0.05), type: 'pop', v: 0.6 }, { t: C.W(/pick/i, 0.3), type: 'pop', v: 0.6 }, { t: C.W(/score/i, 0.5), type: 'pop', v: 0.6 }, { t: C.W(/thousand/i, 0.72), type: 'swell', v: 0.6 }, { t: tx, type: 'pop', v: 0.4 }, { t: tx + 0.44, type: 'pop', v: 0.4 }, { t: tx + 0.88, type: 'pop', v: 0.4 }]; },
  });

  /* 6. THE NUMBERS: speed and price */
  S.push({
    room: () => A.tech(),
    build() { return K.stopwatch('sw') + K.coin('cn') + A.title('sT', '0.25s', 120, P.teal, '#5b8cff') + A.title('cT', '$0.10', 120, P.yellow, '#ff5f8f') + chip('sx', 'about, per Google', '#fff', 400, INK, 34) + chip('cx', 'per million input tokens', '#fff', 470, INK, 30) + chip('of', 'OUTPUT: FREE', P.pink, 460, '#fff', 46) + A.spark('s1', '#fff', 30) + A.spark('s2', P.yellow, 26); },
    cam: camP([[0, 1.0, 540, 900], [1, 1.05, 540, 880]]),
    draw(t, C) {
      const { put, eo } = C, tq = C.W(/quarter/i, 0.18), tc = C.W(/ten|cents/i, 0.55), tf = C.W(/output|free|nothing/i, 0.82);
      par(C, t);
      put('sw', { x: 300, y: 660 + bob(C, 0, 8), s: 0.95 * pop(t, tq - 0.2, 0.7), o: op(t, tq - 0.2) }); put('swhand', { r: 90 * eo((t - tq) / 0.7) }); const arc = document.getElementById('swarc'); if (arc) arc.setAttribute('opacity', t > tq + 0.7 ? 0.55 : 0);
      put('sT', { x: 300, y: 890, s: pop(t, tq + 0.2, 0.6), o: op(t, tq + 0.2) }); put('sx', { x: 300, y: 970, s: pop(t, tq + 0.5, 0.5), o: op(t, tq + 0.5) });
      put('cn', { x: 770, y: 660 + bob(C, 1, 8), s: 1.15 * pop(t, tc - 0.2, 0.7), r: 20 * Math.sin(C.T * 2), o: op(t, tc - 0.2) });
      put('cT', { x: 770, y: 890, s: pop(t, tc + 0.2, 0.6), o: op(t, tc + 0.2) }); put('cx', { x: 770, y: 970, s: pop(t, tc + 0.5, 0.5), o: op(t, tc + 0.5) });
      put('of', { x: 540, y: 1110, r: -3, s: pop(t, tf, 0.5), o: op(t, tf) });
      put('s1', { x: 520, y: 640, s: 0.6 + 0.5 * Math.abs(Math.sin(C.T * 2)), r: C.T * 30 }); put('s2', { x: 560, y: 900, s: 0.6 + 0.5 * Math.abs(Math.sin(C.T * 2 + 1)), r: -C.T * 30 });
    },
    sfx(C) { const tq = C.W(/quarter/i, 0.18), tc = C.W(/ten|cents/i, 0.55); return [{ t: tq, type: 'whoosh', v: 0.5 }, { t: tq + 0.7, type: 'ding', v: 0.6 }, { t: tc, type: 'sparkle', v: 0.7 }, { t: C.W(/output|free|nothing/i, 0.82), type: 'pop', v: 0.6 }]; },
  });

  /* 7. THE CATCH: Google's own tests */
  S.push({
    room: () => A.tech(),
    build() {
      const bar = (id, y, col, label) => `<text x="-380" y="${y - 52}" font-family="Geist" font-weight="900" font-size="44" fill="${INK}">${label}</text><rect x="-380" y="${y - 30}" width="760" height="64" rx="32" fill="#cfd6f7" stroke="${INK}" stroke-width="4"/><rect id="${id}" x="-380" y="${y - 30}" width="760" height="64" rx="32" fill="${col}" stroke="${INK}" stroke-width="4"/>`;
      return A.title('hC', 'THE CATCH', 130, P.yellow, '#ff5f8f') + chip('go', "GOOGLE'S OWN TESTS", '#fff', 640, INK, 40)
        + K.A.card('sb', 860, 470, '#eef1ff', bar('bg', -30, P.teal, 'GEMINI') + bar('bj', 150, P.orange, 'JEV') + `<text id="vg" x="380" y="-52" text-anchor="end" font-family="Geist" font-weight="900" font-size="64" fill="${INK}">0</text><text id="vj" x="380" y="128" text-anchor="end" font-family="Geist" font-weight="900" font-size="64" fill="${INK}">0</text><text x="0" y="214" text-anchor="middle" font-family="Geist" font-weight="800" font-size="34" fill="#6a73b3">WINS OUT OF 9 BENCHMARKS</text>`, 44)
        + K.dino('mj') + K.magnifier('mg');
    },
    cam: camP([[0, 1.0, 540, 900], [1, 1.08, 600, 940]]),
    draw(t, C) {
      const { put, eo, clamp } = C, tg = C.W(/Google/i, 0.2), ts = C.W(/seven|leads/i, 0.5), tj = C.W(/rival|Jev/i, 0.68);
      par(C, t);
      put('hC', { x: 540, y: 440, r: -3, s: pop(t, 0.05, 0.5) }); put('go', { x: 540, y: 560, s: pop(t, tg, 0.5), o: op(t, tg) });
      put('sb', { x: 540, y: 880, s: pop(t, 0.3, 0.7), o: op(t, 0.3) });
      const g = 7 * C.tw(t, ts, ts + 0.9), j = 2 * C.tw(t, tj, tj + 0.7); put('bg', { sx: Math.max(0.001, g / 9), ox: -380 }); put('bj', { sx: Math.max(0.001, j / 9), ox: -380 }); C.text('vg', String(Math.round(g))); C.text('vj', String(Math.round(j)));
      put('mg', { x: 650 + 60 * Math.sin(C.T * 1.2), y: 1120 + 20 * Math.sin(C.T * 2), s: 0.9 * pop(t, tg + 0.2, 0.5), o: op(t, tg + 0.2) });
      C.dino('mj', { x: 860, y: 1330, s: 0.5 * pop(t, tg, 0.6), T: C.T, mood: t < tj ? 'curious' : 'smirk', talk: C.speak(t), look: -0.8, lookY: -0.4, armL: 20, armR: 60, head: -6, wagA: 6 });
    },
    sfx(C) { return [{ t: 0.1, type: 'thump', v: 0.8 }, { t: C.W(/Google/i, 0.2), type: 'ding', v: 0.5 }, { t: C.W(/seven|leads/i, 0.5), type: 'tick', v: 0.6 }, { t: C.W(/rival|Jev/i, 0.68), type: 'tick', v: 0.6 }]; },
  });

  /* 8. WHO IT IS FOR */
  S.push({
    room: () => A.dusk(),
    build() {
      const li = (id, y, txt, good) => `<g id="${id}"><circle cx="-380" cy="${y}" r="26" fill="${good ? P.teal : P.pink}" stroke="${INK}" stroke-width="4"/>${good ? `<path d="M-392 ${y} l9 11 l18 -22" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>` : `<path d="M-392 ${y - 12} l24 24 M-368 ${y - 12} l-24 24" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`}<text x="-335" y="${y + 14}" font-family="Geist" font-weight="800" font-size="40" fill="${INK}">${K.esc(txt)}</text></g>`;
      return K.A.card('pg', 900, 300, '#e4fbf4', `<text x="0" y="-80" text-anchor="middle" font-family="Geist" font-weight="900" font-size="58" fill="#0b8a6f">GREAT WHEN</text>` + li('g1', -10, 'One small decision, repeated', true) + li('g2', 70, 'Audio, video and PDF inputs', true), 44)
        + K.A.card('pn', 900, 400, '#ffe8ee', `<text x="0" y="-120" text-anchor="middle" font-family="Geist" font-weight="900" font-size="58" fill="#c2335f">SKIP IT FOR</text>` + li('n1', -40, 'Writing text', false) + li('n2', 40, 'The lowest price', false) + li('n3', 120, 'Hosting it yourself', false), 44);
    },
    cam: camP([[0, 1.0, 540, 940], [1, 1.07, 540, 900]]),
    draw(t, C) {
      const { put, eo } = C, tg = C.W(/same|small|great|use/i, 0.05), tn = C.W(/skip/i, 0.5), t1 = C.W(/writing/i, 0.62), t2 = C.W(/lowest|price/i, 0.75), t3 = C.W(/servers|own|host/i, 0.88);
      par(C, t);
      put('pg', { x: 540, y: 600, s: pop(t, tg, 0.7), o: op(t, tg) });
      put('g1', { s: pop(t, tg + 0.35, 0.5), ox: -380, oy: -10, o: op(t, tg + 0.35) }); put('g2', { s: pop(t, tg + 0.9, 0.5), ox: -380, oy: 70, o: op(t, tg + 0.9) });
      put('pn', { x: 540, y: 1000, s: pop(t, tn, 0.7), o: op(t, tn) });
      put('n1', { s: pop(t, t1, 0.45), ox: -380, oy: -40, o: op(t, t1) }); put('n2', { s: pop(t, t2, 0.45), ox: -380, oy: 40, o: op(t, t2) }); put('n3', { s: pop(t, t3, 0.45), ox: -380, oy: 120, o: op(t, t3) });
    },
    sfx(C) { return [{ t: C.W(/same|small|great|use/i, 0.05), type: 'ding', v: 0.5 }, { t: C.W(/skip/i, 0.5), type: 'thump', v: 0.6 }, { t: C.W(/writing/i, 0.62), type: 'pop', v: 0.4 }, { t: C.W(/lowest|price/i, 0.75), type: 'pop', v: 0.4 }, { t: C.W(/servers|own|host/i, 0.88), type: 'pop', v: 0.4 }]; },
  });

  /* 9. SIGN-OFF */
  S.push({
    room: () => A.dawn(),
    build() {
      return chip('ur', 'aashishpandey.com/blog', '#fff', 800, INK, 48) + `<g id="fl"><rect x="-230" y="-62" width="460" height="124" rx="62" fill="${P.pink}" stroke="${INK}" stroke-width="6"/><path d="M-200 -40 h400" stroke="#fff" stroke-opacity=".5" stroke-width="7" stroke-linecap="round"/><text x="0" y="22" text-anchor="middle" font-family="Geist" font-weight="900" font-size="64" fill="#fff" stroke="${INK}" stroke-width="8" paint-order="stroke">FOLLOW</text></g>`
        + A.title('nt', 'A NEW AI TOOL', 82, '#fff', '#5b8cff') + A.title('ed', 'EVERY DAY', 100, P.yellow, '#ff5f8f') + K.dino('mj') + A.spark('s1', '#fff', 34) + A.spark('s2', P.yellow, 28) + A.spark('s3', '#fff', 24)
        + Array.from({ length: 5 }, (_, i) => `<path id="hr${i}" d="M0 20 C-60 -20 -40 -60 0 -30 C40 -60 60 -20 0 20Z" fill="${P.pink}" stroke="${INK}" stroke-width="4"/>`).join('');
    },
    cam: camP([[0, 1.0, 540, 960], [1, 1.1, 540, 900]]),
    draw(t, C) {
      const { put, eo, clamp } = C, tb = C.W(/blog|sources/i, 0.1), tf = C.W(/follow/i, 0.35), tn = C.W(/new|tool/i, 0.55);
      par(C, t);
      put('ur', { x: 540, y: 470, s: pop(t, tb, 0.6), o: op(t, tb) });
      put('fl', { x: 540, y: 620, s: pop(t, tf, 0.6) * (1 + 0.03 * Math.sin(C.T * 6)), o: op(t, tf) });
      put('nt', { x: 540, y: 790, s: pop(t, tn, 0.6), o: op(t, tn) }); put('ed', { x: 540, y: 900, s: pop(t, tn + 0.2, 0.6), o: op(t, tn + 0.2) });
      for (let i = 0; i < 5; i++) { const a = tf + 0.3 + i * 0.16, p = clamp((t - a) / 1.4); put('hr' + i, { x: 330 + i * 105 + Math.sin(C.T * 3 + i) * 14, y: 780 - 200 * p, s: 0.6 * pop(t, a, 0.4) * (1 - 0.4 * p), o: p > 0 && p < 1 ? 1 - p * 0.7 : 0 }); }
      [['s1', 160, 560], ['s2', 930, 700], ['s3', 880, 1020]].forEach((p, i) => put(p[0], { x: p[1], y: p[2] + bob(C, i, 14), s: 0.7 + 0.5 * Math.abs(Math.sin(C.T * 2 + i * 2)), r: C.T * 30 }));
      C.dino('mj', { x: 540, y: 1250, s: 0.72 * pop(t, 0.1, 0.8), T: C.T, mood: 'happy', talk: C.speak(t), look: 0.2, armL: 16, armR: 120 + 30 * Math.sin(C.T * 8), head: Math.sin(C.T * 2.5) * 4, wagA: 16, wag: 8 });
    },
    sfx(C) { return [{ t: C.W(/blog|sources/i, 0.1), type: 'pop', v: 0.5 }, { t: C.W(/follow/i, 0.35), type: 'ding', v: 0.6 }, { t: C.W(/new|tool/i, 0.55), type: 'sparkle', v: 0.6 }]; },
  });

  // the swipe between scenes gets a soft whoosh
  S.forEach((sc, i) => { const f = sc.sfx; sc.sfx = (C) => { const o = f ? f(C) : []; if (i > 0) o.push({ t: 0.08, type: 'whoosh', v: 0.35 }); if (i < S.length - 1) o.push({ t: C.d - 0.5, type: 'whoosh', v: 0.35 }); return o; }; });
  window.PACK.scenes = S;
})();
