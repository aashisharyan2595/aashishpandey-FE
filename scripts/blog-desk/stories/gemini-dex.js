/* Story pack: "Dex and the thousand questions" - the Gemini Decisions API explained as a mail-room story. Nine scenes, matched to content/blog/videos/gemini-decisions-api-review-pros-cons.json.
   Each scene has build(C) (the drawing), draw(t, C) (the motion), sfx(C) (the sound effects) and optionally cam(t, C). */
(function () {
  const K = KIT, P = K.P, COLS = [P.yellow, P.pink, P.blue, P.teal, P.orange];
  const card = (id, txt, col, w) => `<g id="${id}"><rect x="${-(w || 480) / 2}" y="-58" width="${w || 480}" height="116" rx="38" fill="${col}"/><text x="0" y="18" text-anchor="middle" font-family="Geist" font-weight="900" font-size="54" fill="${P.ink}">${K.esc(txt)}</text></g>`;
  const pencil = (id) => `<g id="${id}"><rect x="-14" y="-110" width="28" height="170" rx="6" fill="${P.yellow}" transform="rotate(35)"/><path d="M-14 60 L0 100 L14 60Z" fill="#f3d2a2" transform="rotate(35)"/><circle r="52" cy="-8" fill="none" stroke="${P.pink}" stroke-width="12" opacity="0" id="${id}ring"/><path id="${id}x" d="M-70 -70 L70 70" stroke="${P.pink}" stroke-width="16" stroke-linecap="round" opacity="0"/></g>`;
  const bell = (id) => `<g id="${id}"><path d="M-46 30 q0 -70 46 -80 q46 10 46 80 z" fill="${P.yellow}"/><rect x="-56" y="28" width="112" height="14" rx="7" fill="#f0a91d"/><circle cy="58" r="14" fill="#f0a91d"/></g>`;
  const heart = (id) => `<path id="${id}" d="M0 20 C-60 -20 -40 -60 0 -30 C40 -60 60 -20 0 20Z" fill="${P.pink}"/>`;
  const burst = (id, col) => `<g id="${id}">${Array.from({ length: 10 }, (_, i) => `<rect x="-5" y="-150" width="10" height="46" rx="5" fill="${col}" transform="rotate(${i * 36})"/>`).join('')}</g>`;
  const S = [];

  /* 1. THE HOOK: Dex and the avalanche of questions */
  S.push({
    build() { let e = ''; for (let i = 0; i < 14; i++) e += K.envelope('e' + i, COLS[i % 5], true); return K.robot('dx') + K.desk() + e + K.label('cN', '0', 200, P.yellow) + K.label('cL', 'questions', 86, '#fff'); },
    cam(t, C) { return { z: 1.12 + 0.1 * t / C.d, cx: 540, cy: 900 - 40 * t / C.d }; },
    draw(t, C) {
      const { put, clamp, eo, lerp, rn } = C, N = 14, t0 = 0.9, t1 = C.d * 0.8, fl = 0.8; let landed = 0;
      for (let i = 0; i < N; i++) {
        const ti = t0 + (t1 - t0) * i / (N - 1), p = clamp((t - ti) / fl), fromL = i % 2 === 0, sx = fromL ? -160 : 1240, sy = 260 + rn(i, 1) * 280, tx = 355 + (i % 5) * 92 + rn(i, 2) * 12, ty = 896 - Math.floor(i / 5) * 56;
        const land = t - ti - fl, sq = land > 0 ? 1 + 0.14 * Math.exp(-land * 9) * Math.sin(land * 30) : 1; if (land >= 0) landed++;
        put('e' + i, { x: lerp(sx, tx, eo(p)), y: lerp(sy, ty, eo(p)) - Math.sin(p * Math.PI) * 220, r: lerp((fromL ? -1 : 1) * 170, (rn(i, 3) - 0.5) * 16, eo(p)), sx: sq, sy: 1 / sq, o: p > 0 ? 1 : 0 });
      }
      const f = landed / N, mood = f < 0.35 ? 'calm' : f < 0.85 ? 'worried' : 'shock', n = Math.round(1000 * C.tw(t, t0, t1 + fl));
      C.text('cN', n.toLocaleString('en-US')); put('cN', { x: 540, y: 420, s: (0.9 + 0.1 * C.back((t - 0.4) / 0.5)) * (1 + (n < 1000 ? 0.05 * Math.sin(t * 16) : 0)), o: clamp((t - 0.3) / 0.2) });
      put('cL', { x: 540, y: 520, s: C.back((t - 0.7) / 0.5), o: clamp((t - 0.7) / 0.2) });
      C.bot('dx', { x: 540, y: 1060, s: 0.95, T: C.T, mood, look: Math.sin(t * 3), sweat: clamp((f - 0.5) / 0.3), talk: C.speak(t), armL: 8 + 14 * f, armR: 8 + 14 * f + Math.sin(t * 9) * 4 * f, head: Math.sin(t * 2) * 2 - 5 * f });
    },
    sfx(C) { const o = [{ t: 0.1, type: 'swell', v: 0.5 }], N = 14, t0 = 0.9, t1 = C.d * 0.8; for (let i = 0; i < N; i++) { const ti = t0 + (t1 - t0) * i / (N - 1); o.push({ t: ti + 0.8, type: 'pop', v: 0.45 }); if (i % 3 === 0) o.push({ t: ti, type: 'whoosh', v: 0.18 }); } return o; },
  });

  /* 2. THE PROBLEM: three questions, and every one is urgent */
  S.push({
    build() { let e = ''; for (let i = 0; i < 7; i++) e += K.envelope('e' + i, COLS[i % 5], true); return K.robot('dx') + K.desk() + e + card('q1', 'Complaint?', P.teal, 500) + card('q2', 'Which team?', P.blue, 500) + card('q3', 'How urgent?', P.pink, 500); },
    cam(t, C) { return { z: 1.08 + 0.06 * t / C.d, cx: 560, cy: 900 }; },
    draw(t, C) {
      const { put, back, clamp } = C, ts = [C.W(/complaint/i, 0.05), C.W(/team/i, 0.3), C.W(/urgent/i, 0.55)];
      for (let i = 0; i < 7; i++) put('e' + i, { x: 470 + (i % 4) * 92 + (i > 3 ? 40 : 0), y: 896 - (i > 3 ? 56 : 0), r: (C.rn(i, 3) - 0.5) * 14 + Math.sin(C.T * 2 + i) * 1.5 });
      [[700, 330, -3], [700, 500, 2.5], [700, 670, -2]].forEach((q, i) => { const p = back((t - ts[i]) / 0.5); put('q' + (i + 1), { x: q[0], y: q[1] + Math.sin(C.T * 2 + i) * 6, r: q[2] * p, s: p, o: clamp((t - ts[i]) / 0.12) }); });
      const n = ts.filter((x) => t >= x).length;
      C.bot('dx', { x: 330, y: 1060, s: 0.95, T: C.T, mood: n < 3 ? 'worried' : 'shock', look: 0.8, sweat: 1, talk: C.speak(t), armL: 30 + 14 * Math.sin(t * 5), armR: 30 - 14 * Math.sin(t * 5), head: Math.sin(t * 6) * (n > 1 ? 5 : 1) });
    },
    sfx(C) { return [C.W(/complaint/i, 0.05), C.W(/team/i, 0.3), C.W(/urgent/i, 0.55)].map((x) => ({ t: x, type: 'pop', v: 0.5 })); },
  });

  /* 3. THE OLD WAY: a paragraph for every answer */
  S.push({
    build() { let s = ''; for (let j = 0; j < 14; j++) s += K.sheet('sh' + j); let st = ''; for (let k = 0; k < 9; k++) st += K.sheet('st' + k);
      return K.robot('dx') + K.conveyor('cv') + s + `<g id="box"><rect x="-130" y="-210" width="260" height="210" rx="46" fill="url(#gDev)"/><circle cx="-48" cy="-130" r="26" fill="#f3f6ff"/><circle cx="48" cy="-130" r="26" fill="#f3f6ff"/><circle id="bpL" cx="-48" cy="-124" r="11" fill="${P.ink}"/><circle id="bpR" cx="48" cy="-124" r="11" fill="${P.ink}"/><rect x="-80" y="-80" width="160" height="12" rx="6" fill="#f3f6ff" opacity=".8"/></g>` + st + K.label('bl', 'YOUR CODE', 36, P.teal) + K.label('t3', 'a paragraph per answer', 56, '#fff'); },
    cam(t, C) { return { z: 0.92 + 0.06 * t / C.d, cx: 560, cy: 880 }; },
    draw(t, C) {
      const { put, clamp, eo, lerp } = C, d = C.d, spd = 300, tick = $id2('cvticks');
      if (tick) tick.setAttribute('transform', `translate(${((C.T * spd) % 60).toFixed(1)} 0)`);
      put('cv', { x: 0, y: 960 });
      for (let j = 0; j < 14; j++) { const tj = 0.5 + j * 0.46, x = -90 + spd * (t - tj), on = t > tj && x < 800; put('sh' + j, { x, y: 892 + Math.sin(x * 0.03) * 2, r: Math.sin(x * 0.02 + j) * 3, o: on ? 1 : 0 }); }
      const fed = Math.floor(clamp((t - 0.5 - 2.4) / 0.46, 0, 14)), shake = clamp(fed / 8) * 6;
      put('box', { x: 920 + Math.sin(t * 50) * shake, y: 960, sy: 1 - 0.05 * clamp(fed / 9) + 0.02 * Math.sin(t * 20) * clamp(fed / 9), ox: 0, oy: 0 });
      for (let k = 0; k < 9; k++) { const tk = 0.5 + 2.4 + (k + 1) * 0.46 * 1.35, p = C.back((t - tk) / 0.35); put('st' + k, { x: 920 + (C.rn(k, 1) - 0.5) * 70, y: 748 - k * 28 + (1 - p) * -80, r: (C.rn(k, 2) - 0.5) * 26, s: p * 0.9, o: clamp((t - tk) / 0.1) }); }
      put('bl', { x: 920, y: 905, s: 1, o: 1 }); put('t3', { x: 540, y: 270, s: C.back((t - 0.3) / 0.5), o: clamp((t - 0.3) / 0.2) });
      C.bot('dx', { x: 250, y: 1060, s: 0.85, T: C.T, mood: 'flat', look: 1, talk: C.speak(t), armR: -150 * C.tw(t, d * 0.45, d * 0.45 + 0.6, C.back), armL: 6, head: 7 * C.tw(t, d * 0.45, d * 0.45 + 0.6), sweat: clamp((t - d * 0.4) / 1) });
    },
    sfx(C) { const o = []; for (let j = 0; j < 8; j++) o.push({ t: 0.5 + 2.4 + (j + 1) * 0.46 * 1.35 + 0.1, type: 'tick', v: 0.35 }); o.push({ t: 0.3, type: 'whoosh', v: 0.25 }); return o; },
  });
  const $id2 = (id) => document.getElementById(id);

  /* 4. THE GIFT: Google hands Dex a tool that decides */
  S.push({
    build() { return K.robot('dx') + K.desk() + burst('rays', P.yellow) + `<g id="gift"><rect x="-100" y="-170" width="200" height="170" rx="14" fill="${P.pink}"/><rect x="-18" y="-170" width="36" height="170" fill="${P.yellow}"/></g><g id="lid"><rect x="-112" y="-46" width="224" height="46" rx="12" fill="#ff7aa6"/><rect x="-18" y="-46" width="36" height="46" fill="${P.yellow}"/><path d="M0 -46 q-50 -54 -70 -14 q40 -10 70 14 q30 -24 70 -14 q-20 -40 -70 14z" fill="${P.yellow}"/></g>` + K.gadget('gd') + K.label('g1', 'Gemini', 128, P.teal) + K.label('g2', 'Decisions API', 90, '#fff') + pencil('pen') + K.check('ck', P.teal); },
    cam(t, C) { return { z: 0.98 + 0.08 * t / C.d, cx: 560, cy: 830 }; },
    draw(t, C) {
      const { put, clamp, eo, back, elastic, tw } = C, dropT = 0.4, openT = 1.7, gx = 720, ground = 918;
      const dp = clamp((t - dropT) / 0.7), by = -260 + (ground + 260) * dp * dp, bounce = t > dropT + 0.7 ? Math.max(0, Math.sin((t - dropT - 0.7) * 16) * 26 * Math.exp(-(t - dropT - 0.7) * 5)) : 0;
      put('gift', { x: gx, y: by - bounce, o: dp > 0 ? 1 : 0 });
      const lp = clamp((t - openT) / 0.5);
      put('lid', { x: gx + lp * 90, y: by - 170 - bounce - 260 * Math.sin(lp * Math.PI) * 0.8 - 40 * lp, r: lp * 50, o: dp > 0 ? 1 - clamp((lp - 0.8) * 4) : 0 });
      put('rays', { x: gx, y: ground - 150, r: C.T * 40, s: lp > 0 ? 0.9 + 0.2 * Math.sin(C.T * 6) : 0, o: lp > 0 ? 0.35 * (1 - clamp((t - openT - 1.5) / 1)) : 0 });
      const gp = elastic((t - openT - 0.15) / 0.9);
      put('gd', { x: gx, y: lerp2(ground - 120, 640, eo((t - openT - 0.15) / 0.8)) + Math.sin(C.T * 2.4) * 10, s: 0.0001 + 0.95 * gp, r: Math.sin(C.T * 1.5) * 4, o: t > openT ? 1 : 0 });
      C.text('gdscr', t % 2 < 1 ? 'YES' : '94%');
      put('g1', { x: 540, y: 270, s: back((t - C.W(/gemini/i, 0.1)) / 0.5), o: clamp((t - C.W(/gemini/i, 0.1)) / 0.15) }); put('g2', { x: 540, y: 360, s: back((t - C.W(/decisions/i, 0.15)) / 0.5), o: clamp((t - C.W(/decisions/i, 0.15)) / 0.15) });
      const tw1 = C.W(/write/i, 0.55), pp = back((t - tw1) / 0.45); put('pen', { x: 250, y: 560 + Math.sin(C.T * 2) * 8, s: pp * 0.9, o: clamp((t - tw1) / 0.1) }); put('penx', { s: 1 }); C.show('penx', clamp((t - tw1 - 0.35) / 0.15)); C.show('penring', clamp((t - tw1 - 0.35) / 0.15));
      const td = C.W(/decides/i, 0.8), cp = back((t - td) / 0.45); put('ck', { x: 880, y: 560 + Math.sin(C.T * 2.2) * 8, s: cp * 1.3, o: clamp((t - td) / 0.1) });
      const happy = t > openT;
      C.bot('dx', { x: 300, y: 1060, s: 0.95, T: C.T, mood: happy ? 'happy' : 'calm', look: 1, talk: C.speak(t), armL: happy ? 130 + 15 * Math.sin(t * 9) : 10, armR: happy ? 130 - 15 * Math.sin(t * 9) : 10, bob: happy ? -Math.abs(Math.sin(t * 6)) * 18 : 0 });
    },
    sfx(C) { return [{ t: 0.4, type: 'whoosh', v: 0.3 }, { t: 1.1, type: 'thump', v: 0.6 }, { t: 1.7, type: 'sparkle', v: 0.55 }, { t: C.W(/gemini/i, 0.1), type: 'pop', v: 0.4 }, { t: C.W(/write/i, 0.55) + 0.35, type: 'thump', v: 0.4 }, { t: C.W(/decides/i, 0.8), type: 'ding', v: 0.5 }]; },
  });
  const lerp2 = (a, b, p) => a + (b - a) * p;

  /* 5. HOW IT WORKS: yes/no, pick one, score it, in one call */
  S.push({
    build() { let e = ''; for (let j = 0; j < 12; j++) e += K.envelope('e' + j, COLS[j % 5], j % 2 === 0); const tile = (id, txt, col) => `<g id="${id}"><rect x="-130" y="-60" width="260" height="120" rx="40" fill="${P.ink}" opacity=".7"/><rect id="${id}r" x="-130" y="-60" width="260" height="120" rx="40" fill="none" stroke="${col}" stroke-width="8"/><text x="0" y="16" text-anchor="middle" font-family="Geist" font-weight="900" font-size="44" fill="${col}">${txt}</text></g>`;
      return K.robot('dx') + K.conveyor('cv') + e + K.scanner('sc') + K.chip('b0', 'YES 94%', P.teal, 290) + K.chip('b1', 'TEAM B 87%', P.blue, 360) + K.chip('b2', 'SEVERITY 3/5', P.yellow, 400) + tile('tA', 'Yes / No', P.teal) + tile('tB', 'Pick one', P.blue) + tile('tC', 'Score it', P.yellow) + K.label('c1', '1 call', 130, '#fff') + K.label('c2', '1,000 questions', 70, P.yellow); },
    cam(t, C) { return { z: 0.98 + 0.05 * t / C.d, cx: 540, cy: 860 }; },
    draw(t, C) {
      const { put, clamp, eo, back } = C, spd = 270, tk = document.getElementById('cvticks'); if (tk) tk.setAttribute('transform', `translate(${((C.T * spd) % 60).toFixed(1)} 0)`);
      put('cv', { x: 0, y: 900 }); put('sc', { x: 620, y: 900, s: 1.25 });
      const hit = [];
      for (let j = 0; j < 12; j++) { const tj = 0.3 + j * 0.78, x = -110 + spd * (t - tj); put('e' + j, { x, y: 846 + Math.sin(x * 0.04) * 2, s: 1.15, o: x > -130 && x < 1220 ? 1 : 0 }); const tp = tj + (620 + 110) / spd; if (t >= tp && t < tp + 1.3) hit.push([j, t - tp]); }
      for (let b = 0; b < 3; b++) { let best = null; hit.forEach(([j, a]) => { if (j % 3 === b) best = a; }); const p = best === null ? 0 : back(best / 0.4); put('b' + b, { x: 620, y: 560 - (best || 0) * 40, s: p, o: best === null ? 0 : clamp(1 - (best - 0.9) / 0.4) }); }
      const tt = [C.W(/yes/i, 0.05), C.W(/pick/i, 0.2), C.W(/score/i, 0.32)];
      ['tA', 'tB', 'tC'].forEach((id, i) => { const a = back((t - 0.15 - i * 0.1) / 0.5), hi = clamp(1 - Math.abs(t - tt[i] - 0.3) / 0.7); put(id, { x: [215, 540, 865][i], y: 320 + (1 - a) * -90, s: (0.92 + 0.16 * hi) * a, o: clamp((t - 0.15 - i * 0.1) / 0.15) }); });
      const tc = C.W(/call/i, 0.9), tq = C.W(/thousand/i, 0.6);
      put('c2', { x: 620, y: 1040, s: back((t - tq) / 0.5), o: clamp((t - tq) / 0.15) }); C.text('c2', Math.round(1000 * C.tw(t, tq, tq + 1)).toLocaleString('en-US') + ' questions');
      put('c1', { x: 620, y: 1010, s: back((t - tc) / 0.5), o: clamp((t - tc) / 0.15) });
      C.bot('dx', { x: 170, y: 1075, s: 0.8, T: C.T, mood: 'happy', look: 1, talk: C.speak(t), armL: 20 + 20 * Math.sin(t * 5), armR: 20 - 20 * Math.sin(t * 5), bob: -Math.abs(Math.sin(t * 4)) * 8 });
    },
    sfx(C) { const o = [], spd = 270; for (let j = 0; j < 12; j++) { const tp = 0.3 + j * 0.78 + 730 / spd; if (tp < C.d) { o.push({ t: tp, type: 'thump', v: 0.3 }); o.push({ t: tp + 0.05, type: 'ding', v: 0.3 }); } } [C.W(/yes/i, 0.05), C.W(/pick/i, 0.2), C.W(/score/i, 0.32)].forEach((x) => o.push({ t: x, type: 'pop', v: 0.35 })); o.push({ t: C.W(/call/i, 0.9), type: 'sparkle', v: 0.5 }); return o; },
  });

  /* 6. THE PROOF: fast and cheap */
  S.push({
    build() { return K.robot('dx') + K.stopwatch('sw') + K.coin('cn') + K.label('sT', '150-250 ms', 66, P.teal) + K.label('sL', 'end to end, says Google', 34, '#fff') + K.label('cT', '$0.10', 88, P.yellow) + K.label('cL', 'per million tokens', 34, '#fff'); },
    cam(t, C) { return { z: 1.0 + 0.05 * t / C.d, cx: 540, cy: 800 }; },
    draw(t, C) {
      const { put, clamp, eo, back, elastic } = C, tq = C.W(/quarter|answers|takes/i, 0.1), tm = C.W(/cents|ten/i, 0.55);
      const sp = back((t - 0.2) / 0.5); put('sw', { x: 320, y: 500 + Math.sin(C.T * 2) * 8, s: sp * 0.82, o: clamp((t - 0.2) / 0.1) });
      const hp = eo((t - tq) / 0.7); put('swhand', { r: 90 * hp + (t < tq ? Math.sin(t * 8) * 3 : 0) }); C.show('swarc', hp);
      const n = C.tw(t, tq, tq + 1.2); C.text('sT', Math.round(150 * n) + '-' + Math.round(250 * n) + ' ms'); put('sT', { x: 320, y: 720, s: back((t - tq) / 0.5), o: clamp((t - tq) / 0.15) }); put('sL', { x: 320, y: 775, o: clamp((t - tq - 0.3) / 0.3) });
      const cp = clamp((t - tm) / 0.8), cy = lerp3(-150, 560, cp < 1 ? cp * cp : 1) - (cp >= 1 ? Math.max(0, Math.sin((t - tm - 0.8) * 14) * 30 * Math.exp(-(t - tm - 0.8) * 5)) : 0);
      put('cn', { x: 770, y: cy - 60, sx: cp < 1 ? Math.max(0.05, Math.abs(Math.cos((t - tm) * 9))) : 1, sy: 0.9, o: t > tm ? 1 : 0 });
      const cn = C.tw(t, tm + 0.5, tm + 1.3); C.text('cT', '$' + (0.1 * cn).toFixed(2)); put('cT', { x: 770, y: 720, s: back((t - tm - 0.5) / 0.5), o: clamp((t - tm - 0.5) / 0.15) }); put('cL', { x: 770, y: 775, o: clamp((t - tm - 0.9) / 0.3) });
      const clap = t > tq + 0.9;
      C.bot('dx', { x: 540, y: 1085, s: 0.62, T: C.T, mood: t < tq + 0.8 ? 'shock' : 'happy', look: 0, lookY: -0.5, talk: C.speak(t), armL: clap ? -35 - 25 * Math.abs(Math.sin(t * 9)) : 25, armR: clap ? -35 - 25 * Math.abs(Math.sin(t * 9)) : 25, bob: clap ? -Math.abs(Math.sin(t * 5)) * 10 : 0 });
    },
    sfx(C) { const tq = C.W(/quarter|answers|takes/i, 0.1), tm = C.W(/cents|ten/i, 0.55); return [{ t: 0.2, type: 'pop', v: 0.4 }, { t: tq, type: 'whoosh', v: 0.35 }, { t: tq + 0.7, type: 'ding', v: 0.5 }, { t: tm + 0.7, type: 'thump', v: 0.5 }, { t: tm + 0.9, type: 'sparkle', v: 0.45 }]; },
  });
  const lerp3 = (a, b, p) => a + (b - a) * p;

  /* 7. THE TWIST: a rival, and Google's own numbers */
  S.push({
    build() { return K.robot('dx') + K.robot('jv', { rival: true }) + `<g id="sb"><rect x="-340" y="-170" width="680" height="340" rx="46" fill="${P.ink}"/><rect x="-326" y="-156" width="652" height="312" rx="36" fill="#141a58"/>${K.label('sbN', '7 of 9', 190, P.teal).replace('x="0" y="0"', 'x="0" y="50"')}${K.label('sbT', 'benchmarks led, per Google', 42, '#fff').replace('x="0" y="0"', 'x="0" y="112"')}</g>` + K.magnifier('mg') + `<g id="tr"><path d="M-48 -90 h96 v50 q0 54 -48 62 q-48 -8 -48 -62z" fill="url(#gGold)"/><rect x="-14" y="20" width="28" height="30" fill="#e79a1c"/><rect x="-46" y="48" width="92" height="22" rx="8" fill="#c97b0a"/>${K.label('trN', '2 of 9', 60, P.yellow).replace('x="0" y="0"', 'x="0" y="-118"')}</g>` + K.label('t7', 'plot twist', 100, P.pink); },
    cam(t, C) { return { z: 0.98 + 0.06 * t / C.d, cx: 560, cy: 880 }; },
    draw(t, C) {
      const { put, clamp, eo, back } = C, tp = C.W(/twist/i, 0.1), tj = C.W(/rival|jev/i, 0.6), tg = C.W(/google/i, 0.3), sh = t > tj ? clamp(1 - (t - tj) / 0.8) * 5 : 0;
      put('t7', { x: 540, y: 280, s: back((t - tp) / 0.5), r: -4, o: clamp((t - tp) / 0.15) * (1 - clamp((t - tg) / 0.3)) });
      put('sb', { x: 540 + Math.sin(t * 60) * sh, y: 470 + (1 - back((t - tg) / 0.55)) * -60, s: back((t - tg) / 0.55), o: clamp((t - tg) / 0.15) });
      const jp = eo((t - tj) / 0.6); C.bot('jv', { x: 1300 - 450 * jp, y: 1060, s: 0.58, T: C.T + 1, mood: 'smirk', flip: true, look: -1, armL: 130 + 12 * Math.sin(t * 7), armR: 10 });
      put('tr', { x: 1300 - 450 * jp + 30, y: 790 + (1 - back((t - tj - 0.3) / 0.5)) * 40, s: back((t - tj - 0.3) / 0.5) * 0.9, r: Math.sin(t * 5) * 4, o: clamp((t - tj - 0.2) / 0.15) });
      put('mg', { x: 300 + Math.sin(t * 3) * 6, y: 735 + Math.cos(t * 2.4) * 5, s: 0.9, r: -18 });
      C.bot('dx', { x: 250, y: 1060, s: 0.9, T: C.T, mood: 'curious', look: 0.4, talk: C.speak(t), armL: 8, armR: 70 + 6 * Math.sin(t * 3), head: -5 });
    },
    sfx(C) { return [{ t: C.W(/twist/i, 0.1), type: 'thump', v: 0.5 }, { t: C.W(/google/i, 0.3), type: 'pop', v: 0.45 }, { t: C.W(/rival|jev/i, 0.6), type: 'whoosh', v: 0.4 }, { t: C.W(/rival|jev/i, 0.6) + 0.55, type: 'ding', v: 0.4 }]; },
  });

  /* 8. THE VERDICT: good for, not for */
  S.push({
    build() { const item = (id, txt, ok) => `<g id="${id}"><rect x="-216" y="-52" width="432" height="104" rx="34" fill="${P.ink}" opacity=".78"/>${(ok ? K.check(id + 'i', P.teal) : K.cross(id + 'i')).replace(/<g id="[^"]+">/, '<g transform="translate(-166 0) scale(.78)">')}<text x="-122" y="14" font-family="Geist" font-weight="800" font-size="38" fill="#fff">${K.esc(txt)}</text></g>`;
      return K.robot('dx') + K.label('hL', 'GREAT FOR', 70, P.teal) + K.label('hR', 'NOT FOR', 70, P.pink) + item('l0', 'Repeat decisions', true) + item('l1', 'Audio, video, PDFs', true) + item('l2', 'Numbers, not text', true) + item('r0', 'Lowest price', false) + item('r1', 'Self-hosting', false) + item('r2', 'Writing text', false); },
    cam(t, C) { return { z: 0.98 + 0.05 * t / C.d, cx: 540, cy: 860 }; },
    draw(t, C) {
      const { put, clamp, back } = C, tl = [C.W(/decision/i, 0.2), C.W(/audio/i, 0.4), C.W(/numbers/i, 0.55)], tr = [C.W(/cheapest/i, 0.7), C.W(/self|hosted/i, 0.8), C.W(/write/i, 0.92)];
      put('hL', { x: 300, y: 340, s: back((t - 0.2) / 0.5), o: clamp((t - 0.2) / 0.15) }); put('hR', { x: 780, y: 340, s: back((t - tr[0] + 0.5) / 0.5), o: clamp((t - tr[0] + 0.5) / 0.15) });
      tl.forEach((x, i) => { const p = back((t - x) / 0.45); put('l' + i, { x: 300, y: 480 + i * 128 + (1 - p) * 40, s: p + 0.0001, o: clamp((t - x) / 0.1) }); });
      tr.forEach((x, i) => { const p = back((t - x) / 0.45); put('r' + i, { x: 780, y: 480 + i * 128 + (1 - p) * 40, s: p + 0.0001, o: clamp((t - x) / 0.1) }); });
      const nr = tr.filter((x) => t >= x).length;
      C.bot('dx', { x: 540, y: 1085, s: 0.7, T: C.T, mood: nr > 0 ? 'flat' : 'happy', talk: C.speak(t), armL: nr > 0 ? 30 + 18 * Math.sin(t * 6) : 22, armR: nr > 0 ? 30 - 18 * Math.sin(t * 6) : 22, head: nr > 0 ? Math.sin(t * 5) * 4 : Math.sin(t * 4) * 3 });
    },
    sfx(C) { return [C.W(/decision/i, 0.2), C.W(/audio/i, 0.4), C.W(/numbers/i, 0.55)].map((x) => ({ t: x, type: 'ding', v: 0.35 })).concat([C.W(/cheapest/i, 0.7), C.W(/self|hosted/i, 0.8), C.W(/write/i, 0.92)].map((x) => ({ t: x, type: 'thump', v: 0.35 }))); },
  });

  /* 9. NEXT: see you tomorrow */
  S.push({
    build() { let h = ''; for (let i = 0; i < 6; i++) h += heart('h' + i); return K.robot('dx') + `<g id="urlc"><rect x="-370" y="-78" width="740" height="156" rx="52" fill="${P.ink}" opacity=".78"/><rect x="-370" y="-78" width="740" height="156" rx="52" fill="none" stroke="${P.teal}" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Geist" font-weight="900" font-size="46" fill="#fff">aashishpandey.com/blog</text></g>` + K.chip('fol', 'FOLLOW', P.yellow, 330) + bell('bell') + h + K.label('tm', 'see you tomorrow', 70, P.teal); },
    cam(t, C) { return { z: 0.98 + 0.06 * t / C.d, cx: 540, cy: 900 }; },
    draw(t, C) {
      const { put, clamp, back } = C, tu = C.W(/blog/i, 0.15), tf = C.W(/follow/i, 0.5), tb = C.W(/tomorrow|back/i, 0.7);
      put('urlc', { x: 540, y: 400, s: back((t - tu + 0.3) / 0.5), o: clamp((t - tu + 0.3) / 0.15) });
      put('fol', { x: 400, y: 530, s: back((t - tf) / 0.5) * (1 + 0.04 * Math.sin(t * 8)), o: clamp((t - tf) / 0.15) });
      put('bell', { x: 730, y: 520, s: back((t - tf - 0.15) / 0.5), r: Math.sin((t - tf) * 14) * 14 * Math.exp(-(t - tf) * 0.8), ox: 0, oy: -50, o: clamp((t - tf) / 0.15) });
      put('tm', { x: 540, y: 665, s: back((t - tb) / 0.5), o: clamp((t - tb) / 0.15) });
      for (let i = 0; i < 6; i++) { const ph = ((t - tb - i * 0.25) * 0.5), p = ph - Math.floor(ph); put('h' + i, { x: (i % 2 ? 790 : 250) + (i % 3) * 40 + Math.sin(ph * 6 + i) * 20, y: 1000 - p * 300, s: 0.5 + 0.4 * Math.sin(p * Math.PI), o: t > tb ? Math.sin(p * Math.PI) : 0 }); }
      C.bot('dx', { x: 540, y: 1085, s: 0.85, T: C.T, mood: 'happy', talk: C.speak(t), armR: -(140 + 25 * Math.sin(t * 8)), armL: 10, head: Math.sin(t * 3) * 4, bob: -Math.abs(Math.sin(t * 3)) * 6 });
    },
    sfx(C) { return [{ t: C.W(/blog/i, 0.15) - 0.3, type: 'pop', v: 0.4 }, { t: C.W(/follow/i, 0.5), type: 'ding', v: 0.5 }, { t: C.W(/follow/i, 0.5) + 0.15, type: 'sparkle', v: 0.4 }]; },
  });
  window.PACK = { scenes: S };
})();
