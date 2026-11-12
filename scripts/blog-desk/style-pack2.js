/* Style clips, set 2: the looks faceless short-story channels use. Each style draws its own scene (custom: true) as a pure function of time.
   board = whiteboard doodle drawn by a marker hand, cine = cinematic parallax night scene, shadow = silhouette theatre, stick = stick-figure cartoon, pixel = 8-bit pixel art, kinetic = kinetic typography. */
(function () {
  const E = window.ENGINE, K = window.KIT, rn = E.rn, eo = E.eo, STY = window.__STY, pop = window.__pop;
  const svgn = 'http://www.w3.org/2000/svg';
  const D2 = '<defs>'
    + '<filter id="fRim" x="-25%" y="-25%" width="150%" height="150%"><feColorMatrix type="matrix" values=".55 0 0 0 0 0 .55 0 0 0 0 0 .7 0 0 0 0 0 1 0" result="d"/><feDropShadow in="d" dx="-8" dy="-2" stdDeviation="2" flood-color="#9fd0ff" flood-opacity=".9"/></filter>'
    + '<filter id="fBlack" x="-20%" y="-20%" width="140%" height="140%"><feFlood flood-color="#17081f"/><feComposite in2="SourceAlpha" operator="in"/></filter>'
    + '<filter id="fBoil" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence id="tbB" type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="9"/></filter>'
    + '<radialGradient id="gFog"><stop offset="0" stop-color="#cfe0ff" stop-opacity=".35"/><stop offset="1" stop-color="#cfe0ff" stop-opacity="0"/></radialGradient>'
    + '<radialGradient id="gFly"><stop offset="0" stop-color="#fff6a8" stop-opacity="1"/><stop offset="1" stop-color="#fff6a8" stop-opacity="0"/></radialGradient>'
    + '</defs>';
  const NS = (tag, attrs) => { const e = document.createElementNS(svgn, tag); Object.keys(attrs).forEach((k) => e.setAttribute(k, attrs[k])); return e; };
  const seedBoil = (k) => { ['tbB', 'tbW', 'tbT'].forEach((id, i) => { const e = document.getElementById(id); if (e) e.setAttribute('seed', 1 + (k + i * 2) % 9); }); };
  const cam = (z, x, y, r) => document.getElementById('cam').setAttribute('transform', 'translate(' + (540 + (x || 0)) + ' ' + (960 + (y || 0)) + ') rotate(' + (r || 0) + ') scale(' + z + ') translate(-540 -960)');

  /* ---------- whiteboard doodle ---------- */
  const BOARD = [
    // [path, start, dur, colour wash after]  Mujasauraus doodled with a marker
    ['M540 810 m-150 0 a150 150 0 1 0 300 0 a150 150 0 1 0 -300 0', 0.55, 0.45],
    ['M430 700 L460 640 L495 690 L540 625 L585 690 L620 640 L650 700', 0.9, 0.3],
    ['M470 800 m-20 0 a20 26 0 1 0 40 0 a20 26 0 1 0 -40 0', 1.1, 0.14], ['M610 800 m-20 0 a20 26 0 1 0 40 0 a20 26 0 1 0 -40 0', 1.2, 0.14],
    ['M480 880 Q540 940 600 880', 1.28, 0.2],
    ['M400 1000 C380 1140 400 1260 540 1270 C680 1260 700 1140 680 1000', 1.0, 0.5],
    ['M470 1060 Q540 1110 610 1060 M470 1130 Q540 1180 610 1130', 1.45, 0.25],
    ['M400 1050 L330 1130 M680 1050 L770 980', 1.5, 0.3], ['M470 1268 L470 1330 L420 1335 M610 1268 L610 1330 L660 1335', 1.6, 0.25],
    ['M690 1180 Q800 1200 840 1130', 1.7, 0.2],
  ];
  const BOARDLEN = {};
  const board = { custom: true, fps: 12, build() {
      let grid = ''; for (let i = 0; i < 33; i++) grid += '<line x1="' + (i * 60) + '" y1="0" x2="' + (i * 60) + '" y2="1920" stroke="#e6e4d8" stroke-width="2"/>'; for (let i = 0; i < 32; i++) grid += '<line x1="0" y1="' + (i * 60) + '" x2="1080" y2="' + (i * 60) + '" stroke="#e6e4d8" stroke-width="2"/>';
      const washes = '<g id="bw" opacity="0"><ellipse cx="540" cy="810" rx="150" ry="150" fill="#a48cff"/><ellipse cx="540" cy="1140" rx="140" ry="130" fill="#a48cff"/><ellipse cx="540" cy="1170" rx="80" ry="90" fill="#fff3c4"/><path d="M430 700 L460 640 L495 690 L540 625 L585 690 L620 640 L650 700Z" fill="#3fe0c5"/><circle cx="470" cy="800" r="16" fill="#1a1a1a"/><circle cx="610" cy="800" r="16" fill="#1a1a1a"/></g>';
      return '<rect x="-300" y="-500" width="1680" height="3000" fill="#fbfaf4"/>' + grid + '<g id="bwg" filter="url(#fBoil)">' + washes + BOARD.map((p, i) => '<path id="bp' + i + '" d="' + p[0] + '" pathLength="1" fill="none" stroke="#1a1a1a" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 1" stroke-dashoffset="1"/>').join('')
        + '<g id="bt" clip-path="url(#tcl)"><text x="540" y="400" text-anchor="middle" font-family="Geist" font-weight="900" font-size="150" fill="#1a1a1a" transform="rotate(-3 540 400)">NEW AI TOOL</text><text x="540" y="540" text-anchor="middle" font-family="Geist" font-weight="900" font-size="120" fill="#e0405f" transform="rotate(-2 540 540)">EVERY DAY</text><path d="M200 570 Q540 600 880 560" stroke="#e0405f" stroke-width="10" fill="none" stroke-linecap="round"/></g></g>'
        + '<defs><clipPath id="tcl"><rect id="tclr" x="0" y="250" width="0" height="360"/></clipPath></defs>'
        + '<g id="hand"><g transform="rotate(35)"><rect x="-9" y="-150" width="18" height="150" rx="6" fill="#e0405f"/><path d="M-9 0 L0 26 L9 0Z" fill="#1a1a1a"/><rect x="-26" y="-250" width="56" height="130" rx="26" fill="#f5c9a0" stroke="#1a1a1a" stroke-width="5"/></g></g>'
        + '<g id="bst"><path d="M820 660 l18 -40 l18 40 l40 18 l-40 18 l-18 40 l-18 -40 l-40 -18z" fill="#ffd23f" stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"/></g>'; },
    frame(t, q) {
      cam(1.0, 0, 0, 0); seedBoil(Math.floor(q * 12));
      const rect = document.getElementById('tclr'); const tw = Math.max(0, Math.min(1, q / 0.55)); rect.setAttribute('width', (1080 * tw).toFixed(0));
      let hx = 200 + 700 * tw, hy = 400 + 60 * Math.sin(q * 30), drawing = q < 0.55;
      BOARD.forEach((p, i) => { const e = document.getElementById('bp' + i); const pr = Math.max(0, Math.min(1, (q - p[1]) / p[2])); e.setAttribute('stroke-dashoffset', (1 - pr).toFixed(3)); if (pr > 0 && pr < 1) { const L = e.getTotalLength(); const pt = e.getPointAtLength(L * pr); hx = pt.x; hy = pt.y; drawing = true; } });
      E.put('hand', { x: hx + 6, y: hy + 6, o: drawing && q < 1.95 ? 1 : 0 });
      document.getElementById('bw').setAttribute('opacity', Math.max(0, Math.min(1, (q - 1.55) / 0.3)).toFixed(2));
      E.put('bst', { x: 0, y: 0, s: q > 1.7 ? 1 + 0.12 * Math.sin(q * 20) : 0, ox: 840, oy: 700, o: q > 1.7 ? 1 : 0 });
    } };

  /* ---------- cinematic parallax ---------- */
  const cine = { custom: true, fps: 0, build() {
      let st = ''; for (let i = 0; i < 70; i++) st += '<circle cx="' + (rn(i, 1) * 1180 - 50).toFixed(0) + '" cy="' + (rn(i, 2) * 900).toFixed(0) + '" r="' + (1 + rn(i, 3) * 2.4).toFixed(1) + '" fill="#fff" opacity="' + (0.3 + rn(i, 4) * 0.6).toFixed(2) + '"/>';
      const trees = (id, y, n, h, col, seed) => { let s = ''; for (let i = 0; i < n; i++) { const x = -60 + i * (1260 / n) + rn(i, seed) * 40, hh = h * (0.7 + rn(i, seed + 1) * 0.6); s += '<polygon points="' + x + ',' + y + ' ' + (x + 40) + ',' + (y - hh * 0.5) + ' ' + (x + 12) + ',' + (y - hh * 0.5) + ' ' + (x + 52) + ',' + (y - hh) + ' ' + (x + 92) + ',' + (y - hh * 0.5) + ' ' + (x + 64) + ',' + (y - hh * 0.5) + ' ' + (x + 104) + ',' + y + '" fill="' + col + '"/>'; } return '<g id="' + id + '">' + s + '<rect x="-100" y="' + y + '" width="1400" height="900" fill="' + col + '"/></g>'; };
      let fl = ''; for (let i = 0; i < 18; i++) fl += '<g id="ff' + i + '"><circle r="26" fill="url(#gFly)"/><circle r="4" fill="#fffbd0"/></g>';
      return D2 + '<defs><linearGradient id="cSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05081c"/><stop offset=".55" stop-color="#1c2a66"/><stop offset="1" stop-color="#5c4f96"/></linearGradient></defs><rect x="-300" y="-500" width="1680" height="3000" fill="url(#cSky)"/><g id="cs">' + st + '</g>'
        + '<g id="cm"><circle cx="770" cy="640" r="260" fill="url(#gFog)"/><circle cx="770" cy="640" r="120" fill="#fff6d8"/><circle cx="740" cy="610" r="18" fill="#e9dcb4"/><circle cx="800" cy="670" r="26" fill="#e9dcb4"/></g>'
        + '<g id="c1"><polygon points="-100,1100 120,860 300,1010 520,800 760,1040 980,850 1200,1100 1200,1500 -100,1500" fill="#1b2360"/></g>' + trees('c2', 1230, 11, 360, '#101744', 5) + trees('c3', 1400, 8, 520, '#0a0f30', 11)
        + '<g id="cD"><g filter="url(#fRim)">' + K.dino('mj') + '</g></g>' + '<g id="c4"><rect x="-100" y="1520" width="1400" height="500" fill="#050818"/>' + Array.from({ length: 40 }, (_, i) => '<path d="M' + (i * 30 - 20) + ' 1530 q6 -50 ' + (4 + rn(i, 2) * 10) + ' -' + (30 + rn(i, 3) * 40) + '" stroke="#050818" stroke-width="7" fill="none"/>').join('') + '</g>'
        + '<g id="cf"><ellipse cx="300" cy="1380" rx="520" ry="90" fill="url(#gFog)"/><ellipse cx="860" cy="1460" rx="560" ry="100" fill="url(#gFog)"/></g>' + fl
        + '<g id="cT" opacity="0"><text x="540" y="1720" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-weight="700" font-size="64" fill="#fff" stroke="#000" stroke-width="6" paint-order="stroke">Every day, a new AI tool.</text></g>'
        + '<rect x="-100" y="-100" width="1400" height="330" fill="#000"/><rect x="-100" y="1790" width="1400" height="400" fill="#000"/>'; },
    frame(t, q) {
      const dz = 1.0 + 0.09 * (q / 2), sx = Math.sin(q * 2.1) * 6, sy = Math.sin(q * 1.6) * 5; cam(dz, sx - 10 * q, sy, Math.sin(q * 1.2) * 0.4);
      E.put('cs', { x: -4 * q }); E.put('cm', { x: -8 * q }); E.put('c1', { x: -22 * q }); E.put('c2', { x: -48 * q }); E.put('c3', { x: -90 * q }); E.put('c4', { x: -150 * q }); E.put('cf', { x: -60 * q + 40 * Math.sin(q) });
      E.dino('mj', { x: 540, y: 1560, s: 0.95 * pop(q, 0.1, 0.8), T: q, mood: q < 1.2 ? 'calm' : 'curious', look: 0.6, lookY: -0.4, armL: 10, armR: 10, head: 3 * Math.sin(q * 2), wagA: 6, wag: 3 });
      for (let i = 0; i < 18; i++) { const x = 100 + rn(i, 1) * 880 + 60 * Math.sin(q * (0.8 + rn(i, 2)) + i), y = 900 + rn(i, 3) * 700 + 40 * Math.sin(q * (1 + rn(i, 4)) + i * 2); E.put('ff' + i, { x, y, s: 0.5 + 0.5 * rn(i, 5), o: 0.4 + 0.6 * Math.abs(Math.sin(q * 3 + i)) }); }
      E.put('cT', { y: 20 * (1 - eo((q - 0.7) / 0.6)), o: Math.max(0, Math.min(1, (q - 0.7) / 0.6)) });
    } };

  /* ---------- silhouette theatre ---------- */
  const shadow = { custom: true, fps: 12, build() {
      const hills = (id, y, a, seed) => { let d = 'M-100 ' + y; for (let i = 0; i <= 8; i++) d += ' Q' + (i * 150 + 40) + ' ' + (y - a * (0.4 + rn(i, seed))) + ' ' + (i * 150 + 120) + ' ' + (y + 10); return '<g id="' + id + '"><path d="' + d + ' V2100 H-100Z" fill="#17081f"/></g>'; };
      const tree = (x, y, s) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><rect x="-8" y="-150" width="16" height="150" fill="#17081f"/><circle cx="0" cy="-190" r="70" fill="#17081f"/><circle cx="-46" cy="-150" r="44" fill="#17081f"/><circle cx="46" cy="-150" r="44" fill="#17081f"/></g>';
      let birds = ''; for (let i = 0; i < 5; i++) birds += '<path id="bd' + i + '" d="M-26 0 Q-13 -18 0 0 Q13 -18 26 0" fill="none" stroke="#17081f" stroke-width="6" stroke-linecap="round"/>';
      return D2 + '<defs><linearGradient id="sBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a1650"/><stop offset=".45" stop-color="#ff5e62"/><stop offset="1" stop-color="#ffb347"/></linearGradient></defs><rect x="-300" y="-500" width="1680" height="3000" fill="url(#sBg)"/><g id="sS"><circle cx="720" cy="900" r="260" fill="#ffe29a" opacity=".5"/><circle cx="720" cy="900" r="170" fill="#fff1b8"/></g>'
        + '<g id="sC" fill="#17081f" opacity=".85"><ellipse cx="200" cy="300" rx="170" ry="42"/><ellipse cx="300" cy="270" rx="90" ry="44"/><ellipse cx="880" cy="340" rx="150" ry="38"/></g>' + birds + hills('sH1', 1260, 200, 3) + hills('sH2', 1450, 160, 7)
        + '<g id="sTr">' + tree(140, 1470, 1.1) + tree(960, 1450, 1.3) + '</g><g id="sD" filter="url(#fBlack)">' + K.dino('mj') + '</g>'
        + '<g id="sL"><line x1="880" y1="-50" x2="880" y2="300" stroke="#17081f" stroke-width="6"/><g id="sLg"><rect x="850" y="300" width="60" height="80" rx="14" fill="#17081f"/><circle cx="880" cy="340" r="90" fill="#ffd27a" opacity=".5"/></g></g>'
        + '<text id="st1" x="540" y="520" text-anchor="middle" font-family="Geist" font-weight="900" font-size="140" fill="#17081f">NEW AI TOOL</text><text id="st2" x="540" y="660" text-anchor="middle" font-family="Geist" font-weight="900" font-size="110" fill="#17081f">EVERY DAY</text><rect x="-300" y="-500" width="1680" height="3000" fill="#000" opacity="0" id="sFl"/>'; },
    frame(t, q) {
      cam(1.0, 0, 0, 0); const k = Math.floor(q * 12);
      E.put('sS', { y: -14 * eo(q / 1.2) }); E.put('sC', { x: -50 * q + (rn(k, 1) - 0.5) * 3 }); E.put('sH1', { x: -26 * q }); E.put('sH2', { x: -60 * q + (rn(k, 2) - 0.5) * 3 }); E.put('sTr', { x: -90 * q });
      for (let i = 0; i < 5; i++) E.put('bd' + i, { x: 1200 - ((q * 220 + i * 150) % 1500), y: 760 + i * 70 + 20 * Math.sin(q * 6 + i), sy: 0.6 + 0.6 * Math.abs(Math.sin(q * 9 + i)) });
      E.put('sLg', { r: 8 * Math.sin(q * 3.2), ox: 880, oy: -50 });
      E.put('st1', { x: 0, y: 0, s: 1 + 0.2 * (1 - eo((q - 0.05) / 0.3)), ox: 540, oy: 480, o: 1 }); E.put('st2', { s: q > 0.25 ? 1 + 0.2 * (1 - eo((q - 0.25) / 0.3)) : 0, ox: 540, oy: 620, o: q > 0.25 ? 1 : 0 });
      E.dino('mj', { x: 540 + (rn(k, 3) - 0.5) * 3, y: 1330, s: 0.9 * pop(q, 0.25, 0.5), T: q, mood: 'happy', armL: 20, armR: 125 + 28 * Math.sin(q * 11), head: 4 * Math.sin(q * 6), wagA: 18, wag: 10 });
    } };

  /* ---------- stick-figure cartoon ---------- */
  const stick = { custom: true, fps: 12, build() {
      const L = (id, x, y, pieces) => '<g id="' + id + '">' + pieces + '</g>';
      return D2 + '<rect x="-300" y="-500" width="1680" height="3000" fill="#fffdf6"/><rect x="-300" y="1500" width="1680" height="600" fill="#f1ead6"/><line x1="-100" y1="1500" x2="1200" y2="1500" stroke="#1a1a1a" stroke-width="10"/><g filter="url(#fBoil)" stroke="#1a1a1a" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none">'
        + '<rect x="620" y="560" width="300" height="360" rx="14" fill="#cfe8ff"/><line x1="770" y1="560" x2="770" y2="920"/><line x1="620" y1="740" x2="920" y2="740"/>'
        + '<g id="kP"><line x1="0" y1="0" x2="0" y2="-300"/>'
        + '<g id="kB"><circle cx="0" cy="-440" r="110" fill="#fffdf6"/><g id="kE"><circle cx="-38" cy="-450" r="26" fill="#fff"/><circle cx="38" cy="-450" r="26" fill="#fff"/><circle id="kp1" cx="-34" cy="-446" r="9" fill="#1a1a1a"/><circle id="kp2" cx="42" cy="-446" r="9" fill="#1a1a1a"/></g><path id="kM" d="M-34 -390 Q0 -370 34 -390"/><ellipse id="kMo" cx="0" cy="-385" rx="26" ry="2" fill="#1a1a1a" opacity="0"/></g>'
        + '<g id="kAL"><line x1="0" y1="-300" x2="-120" y2="-210"/></g><g id="kAR"><line x1="0" y1="-300" x2="120" y2="-210"/><rect id="kPh" x="104" y="-250" width="44" height="76" rx="8" fill="#9aa4d4"/></g><line x1="0" y1="0" x2="-80" y2="160"/><line x1="0" y1="0" x2="80" y2="160"/></g></g>'
        + '<g id="kBub" opacity="0"><path d="M-300 -130 Q-360 -130 -360 -70 Q-360 -10 -300 -10 L-150 -10 L-110 60 L-120 -10 L300 -10 Q360 -10 360 -70 Q360 -130 300 -130Z" fill="#fff"/></g>'
        + '<text id="kBt1" x="0" y="0" text-anchor="middle" font-family="Geist" font-weight="900" font-size="56" fill="#1a1a1a" stroke="none" opacity="0">NEW AI TOOL</text><text id="kBt2" x="0" y="0" text-anchor="middle" font-family="Geist" font-weight="900" font-size="56" fill="#e0405f" stroke="none" opacity="0">EVERY DAY?!</text>'
        + '<g id="kSw" opacity="0"><path d="M0 0 q14 26 0 40 q-14 -14 0 -40z" fill="#7fd0ff" stroke="#1a1a1a" stroke-width="6"/></g>'
        + '<g id="kLn" stroke-width="10" opacity="0">' + Array.from({ length: 8 }, (_, i) => '<line x1="0" y1="-170" x2="0" y2="-230" transform="rotate(' + (i * 45) + ')"/>').join('') + '</g>'
        + '</g><g id="kD">' + K.dinoFlat('mj') + '</g>'; },
    frame(t, q) {
      cam(1.0, 0, 0, 0); seedBoil(Math.floor(q * 12)); const shock = q > 0.55, k = Math.floor(q * 12);
      const jump = shock ? -150 * Math.exp(-(q - 0.55) * 3) * Math.abs(Math.sin((q - 0.55) * 11)) : 0, sq = shock && q < 0.75 ? 1 + 0.12 * Math.sin((q - 0.55) * 40) : 1;
      E.put('kP', { x: 330 + (rn(k, 1) - 0.5) * 4, y: 1500 + jump, sx: 1 / sq, sy: sq, ox: 0, oy: 160 });
      E.put('kAR', { r: shock ? -160 : -20, ox: 0, oy: -300 }); E.put('kPh', { o: shock ? 0 : 1 }); E.put('kAL', { r: shock ? 120 : 30, ox: 0, oy: -300 });
      document.getElementById('kM').setAttribute('d', shock ? 'M-30 -394 Q0 -352 30 -394' : 'M-34 -390 Q0 -376 34 -390'); E.put('kMo', { s: 1, o: shock ? 1 : 0 }); document.getElementById('kMo').setAttribute('ry', shock ? 26 : 2); document.getElementById('kM').setAttribute('opacity', shock ? 0 : 1);
      E.put('kE', { s: shock ? 1.25 : 1, ox: 0, oy: -450 }); E.put('kp1', { x: shock ? 4 : 0, y: shock ? 2 : 6 }); E.put('kp2', { x: shock ? -4 : 0, y: shock ? 2 : 6 });
      E.put('kBub', { x: 560, y: 760, s: shock ? E.back((q - 0.6) / 0.25) : 0, ox: -100, oy: 60, o: shock ? 1 : 0 });
      E.put('kBt1', { x: 560, y: 690 + 0, o: shock && q > 0.7 ? 1 : 0 }); E.put('kBt2', { x: 560, y: 750, o: shock && q > 0.85 ? 1 : 0 });
      E.put('kSw', { x: 450, y: 1500 + jump - 520 + ((q * 3) % 1) * 30, o: shock ? 1 : 0 }); E.put('kLn', { x: 330, y: 1500 + jump - 420, s: shock ? 1 + 0.15 * Math.sin(q * 40) : 0, o: shock && q < 1.2 ? 1 : 0 });
      E.dino('mj', { x: 820, y: 1500, s: 0.55 * pop(q, 0.9, 0.4), T: q, mood: 'happy', armL: 16, armR: 130 + 25 * Math.sin(q * 12), head: 3 * Math.sin(q * 8), wagA: 16, wag: 12 });
    } };

  /* ---------- pixel art ---------- */
  const GL = { N: ['X...X', 'XX..X', 'X.X.X', 'X..XX', 'X...X'], E: ['XXXXX', 'X....', 'XXXX.', 'X....', 'XXXXX'], W: ['X...X', 'X...X', 'X.X.X', 'XX.XX', 'X...X'], A: ['.XXX.', 'X...X', 'XXXXX', 'X...X', 'X...X'], I: ['XXXXX', '..X..', '..X..', '..X..', 'XXXXX'], T: ['XXXXX', '..X..', '..X..', '..X..', '..X..'], O: ['.XXX.', 'X...X', 'X...X', 'X...X', '.XXX.'], L: ['X....', 'X....', 'X....', 'X....', 'XXXXX'], V: ['X...X', 'X...X', 'X...X', '.X.X.', '..X..'], R: ['XXXX.', 'X...X', 'XXXX.', 'X..X.', 'X...X'], Y: ['X...X', '.X.X.', '..X..', '..X..', '..X..'], D: ['XXXX.', 'X...X', 'X...X', 'X...X', 'XXXX.'], ' ': ['', '', '', '', ''] };
  const PIX = 24; // one art pixel = 24 screen pixels, so the picture is 45 x 80 art pixels
  const pixel = { custom: true, fps: 8, build() { return '<rect x="-300" y="-500" width="1680" height="3000" fill="#120a2e"/><g id="pxBg"></g><g id="pxD"></g><g id="pxT"></g>'; },
    frame(t, q) {
      cam(1.0, 0, 0, 0); const f = Math.floor(q * 8), r = (x, y, w, h, c) => '<rect x="' + (x * PIX) + '" y="' + (y * PIX) + '" width="' + (w * PIX) + '" height="' + (h * PIX) + '" fill="' + c + '" shape-rendering="crispEdges"/>';
      let bg = ''; const bands = ['#120a2e', '#1d0f48', '#2b1466', '#4a1f80', '#7a2b8f', '#b03c8a', '#e0566f', '#ff8a5c', '#ffc070'];
      bands.forEach((c, i) => { bg += r(0, i * 6, 45, 6, c); }); for (let i = 0; i < 26; i++) if ((f + i) % 5 || i % 2) bg += r(Math.floor(rn(i, 1) * 45), Math.floor(rn(i, 2) * 40), 1, 1, '#fff6d0');
      bg += r(30, 38, 7, 7, '#fff2b8') + r(29, 39, 9, 5, '#fff2b8') + r(31, 37, 5, 9, '#fff2b8');
      let x = -((f * 2) % 8) - 4; let i = 0; while (x < 46) { const w = 4 + Math.floor(rn(i, 1) * 5), h = 8 + Math.floor(rn(i, 2) * 12); bg += r(x, 56 - h, w, h, '#1b1038'); for (let wy = 56 - h + 2; wy < 55; wy += 3) for (let wx = x + 1; wx < x + w - 1; wx += 2) if (rn(wx * 7 + wy, i) < 0.4) bg += r(wx, wy, 1, 1, '#ffd36b'); x += w + 1; i++; }
      bg += r(0, 56, 45, 24, '#0e0722') + r(0, 56, 45, 1, '#e0566f'); for (let g = 0; g < 8; g++) bg += r(((g * 7 + f * 3) % 45), 60 + (g % 4) * 4, 3, 1, '#2b1466');
      document.getElementById('pxBg').innerHTML = bg;
      // procedural pixel Mujasauraus: shapes are ellipses on the art-pixel grid, each drawn with a dark outline first
      const cells = {}, paint = (cx, cy, rx, ry, c, ol) => { for (let gy = Math.floor(cy - ry - 2); gy <= cy + ry + 2; gy++) for (let gx = Math.floor(cx - rx - 2); gx <= cx + rx + 2; gx++) { const dx = (gx + 0.5 - cx) / rx, dy = (gy + 0.5 - cy) / ry, v = dx * dx + dy * dy; if (ol && v <= ((rx + 0.9) / rx) ** 2 * 1) { const dx2 = (gx + 0.5 - cx) / (rx + 0.9), dy2 = (gy + 0.5 - cy) / (ry + 0.9); if (dx2 * dx2 + dy2 * dy2 <= 1) cells[gx + ',' + gy] = '#2a1850'; } if (v <= 1) cells[gx + ',' + gy] = c; } };
      const hop = Math.round(-3 * Math.abs(Math.sin(q * 6))), cx = 22.5, by = 62 + hop;
      paint(cx + 8, by - 3, 4, 2.4, '#8c72f0', true); paint(cx - 3.5, by + 3, 2.6, 1.8, '#8c72f0', true); paint(cx + 3.5, by + 3, 2.6, 1.8, '#8c72f0', true);
      paint(cx, by - 5, 6.6, 6, '#a48cff', true); paint(cx, by - 4, 4.2, 4.2, '#fff3c4', false);
      const wave = f % 4 < 2 ? -9 : -7; paint(cx - 7.5, by - 5, 1.6, 2.6, '#8c72f0', true); paint(cx + 7.5, by + wave + 2, 1.6, 2.8, '#8c72f0', true);
      paint(cx, by - 14, 6.6, 6, '#a48cff', true);
      [[-4, -22], [0, -23], [4, -22]].forEach((s) => { cells[Math.round(cx + s[0]) + ',' + (by + s[1] + 5)] = '#3fe0c5'; cells[Math.round(cx + s[0]) + ',' + (by + s[1] + 6)] = '#3fe0c5'; });
      const blink = f % 9 === 4;
      [-3, 2].forEach((ex) => { for (let a = 0; a < 2; a++) for (let b = 0; b < (blink ? 1 : 3); b++) cells[Math.round(cx + ex) + a + ',' + (by - 16 + b + (blink ? 1 : 0))] = '#ffffff'; if (!blink) cells[Math.round(cx + ex) + 1 + ',' + (by - 15)] = '#16321f'; if (!blink) cells[Math.round(cx + ex) + 1 + ',' + (by - 14)] = '#16321f'; });
      cells[Math.round(cx - 6) + ',' + (by - 12)] = '#ff8fb0'; cells[Math.round(cx + 5) + ',' + (by - 12)] = '#ff8fb0';
      [-2, -1, 0, 1].forEach((m) => { cells[Math.round(cx + m) + ',' + (by - 11)] = '#2a1850'; }); cells[Math.round(cx - 3) + ',' + (by - 12)] = '#2a1850'; cells[Math.round(cx + 2) + ',' + (by - 12)] = '#2a1850';
      let d = ''; Object.keys(cells).forEach((k) => { const p = k.split(','); d += r(+p[0], +p[1], 1, 1, cells[k]); }); document.getElementById('pxD').innerHTML = d;
      // pixel title: 2x2-pixel letters, appears letter by letter
      const lines = [['NEW AI', 9], ['TOOL', 18], ['EVERY DAY', 27]]; let n = 0, tt = '', shown = Math.floor(q * 8 * 3.2);
      lines.forEach(([s, y]) => { const w = s.split('').reduce((a, ch) => a + (ch === ' ' ? 4 : 6), 0) - 1, x0 = Math.floor((45 - w) / 2); let x = x0; s.split('').forEach((ch) => { if (ch === ' ') { x += 4; return; } n++; if (n <= shown) GL[ch].forEach((row, ry) => row.split('').forEach((c, rx) => { if (c === 'X') tt += r(x + rx, y + ry + (n === shown ? -1 : 0), 1, 1, y === 27 ? '#ffd36b' : '#ffffff'); })); x += 6; }); });
      document.getElementById('pxT').innerHTML = tt;
    } };

  /* ---------- kinetic typography ---------- */
  const WORDS = [['NEW', '#ffd23f', '#111', 430], ['AI', '#ff4d8d', '#fff', 640], ['TOOL', '#3fe0c5', '#111', 330], ['EVERY', '#ffffff', '#e0405f', 290], ['DAY', '#6a3df0', '#ffd23f', 420]];
  const kinetic = { custom: true, fps: 0, build() { return D2 + '<rect id="kbg" x="-300" y="-500" width="1680" height="3000" fill="#ffd23f"/><g id="kw"><text id="kt" x="0" y="0" text-anchor="middle" font-family="Geist" font-weight="900" font-size="400" fill="#111">NEW</text></g><rect id="kbar" x="0" y="1080" width="0" height="26" rx="13" fill="#111"/><g id="kD">' + K.dino('mj') + '</g><path id="ks1" d="M0 -40 Q4 -4 40 0 Q4 4 0 40 Q-4 4 -40 0 Q-4 -4 0 -40Z" fill="#fff"/><path id="ks2" d="M0 -40 Q4 -4 40 0 Q4 4 0 40 Q-4 4 -40 0 Q-4 -4 0 -40Z" fill="#111"/>'; },
    frame(t, q) {
      const sl = 0.4, i = Math.min(4, Math.floor(t / sl)), lt = t - i * sl, w = WORDS[i], hit = Math.exp(-lt * 12);
      document.getElementById('kbg').setAttribute('fill', w[1]); const el = document.getElementById('kt'); el.textContent = w[0]; el.setAttribute('fill', w[2]); el.setAttribute('font-size', w[3]);
      const sc = 0.55 + 0.45 * E.back(lt / 0.2) + 0.03 * Math.sin(t * 5); E.put('kw', { x: 540, y: 900 + (i === 4 ? -80 : 0), s: sc, r: (i % 2 ? 4 : -4) * (1 - eo(lt / 0.25)), o: 1 });
      E.put('kbar', { sx: 1, x: 0, o: 0 }); document.getElementById('kbar').setAttribute('width', (880 * eo(lt / 0.3)).toFixed(0)); document.getElementById('kbar').setAttribute('x', 100); document.getElementById('kbar').setAttribute('fill', w[2]);
      cam(1.0 + 0.04 * hit, (Math.sin(t * 90) * 8) * hit, (Math.cos(t * 80) * 8) * hit, (Math.sin(t * 70)) * 0.6 * hit);
      E.put('ks1', { x: 220, y: 560 + 10 * Math.sin(t * 5), s: 0.8 + 0.5 * Math.abs(Math.sin(t * 6)), r: t * 80 }); E.put('ks2', { x: 880, y: 1260, s: 0.6 + 0.5 * Math.abs(Math.sin(t * 6 + 1)), r: -t * 80 });
      const dp = i === 4 ? pop(lt, 0.0, 0.35) : 0; E.dino('mj', { x: 540, y: 1700 - 300 * dp, s: 0.9 * dp, T: t, mood: 'happy', armL: 20, armR: 125 + 30 * Math.sin(t * 14), head: 4 * Math.sin(t * 8), wagA: 18, wag: 12 });
    } };

  Object.assign(STY, { board, cine, shadow, stick, pixel, kinetic });
})();
