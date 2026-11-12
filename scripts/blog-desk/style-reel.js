#!/usr/bin/env node
// Style clips: 2-second, 1080x1920 vertical clips of one tiny scene ("NEW AI TOOL / EVERY DAY" with Mujasauraus) in six different art styles, to pick a look for future videos.
//   node scripts/blog-desk/style-reel.js <outdir> [--only anime,paper,neon,flat,pop,ink] [--seconds 2]
// Every frame is a pure function of time, drawn by Playwright, assembled by ffmpeg. The "hand-made life" tricks live in each style: stepped frame rate (stop-motion, 8-12 fps), boiling lines,
// squash and stretch with anticipation, overlapping secondary motion, handheld camera sway, paper grain and imperfect edges.
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const ROOT = path.join(__dirname, '..', '..');
const b64 = (f, mime) => 'data:' + mime + ';base64,' + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : ''; };
const out = process.argv[2]; if (!out || out.startsWith('--')) { console.error('usage: style-reel.js <outdir> [--only a,b] [--seconds 2]'); process.exit(2); }
const SECONDS = +(arg('seconds') || 2), FPS = 30, N = Math.round(SECONDS * FPS);
const ONLY = (arg('only') || (arg('set') === '2' ? 'board,cine,shadow,stick,pixel,kinetic' : 'anime,paper,neon,flat,pop,ink')).split(',');
const sh = (c) => cp.execSync(c, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 }).toString();
const SRC = ['story-kit.js', 'anime-kit.js', 'story-engine.js'].map((f) => fs.readFileSync(path.join(__dirname, f), 'utf8')).join('\n');
const FONTS = `@font-face{font-family:Geist;font-weight:100 900;src:url(${b64('assets/vendor/fonts/geist-normal-latin.woff2', 'font/woff2')})}`;

const PAGE = `
const E = window.ENGINE, K = window.KIT, A = K.A, P = K.P, INK = A.INK, put = E.put, clamp = E.clamp, eo = E.eo, rn = E.rn, sin = Math.sin;
const sbk = (x) => { x = clamp(x); const c = 1.1; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const pop = (t, a, d) => (t < a ? 0 : sbk((t - a) / (d || 0.45)));
const squash = (t, a) => { const k = t - a; return k < 0 ? [1, 1] : [1 + 0.16 * Math.exp(-k * 7) * sin(k * 26), 1 - 0.16 * Math.exp(-k * 7) * sin(k * 26)]; };
const root = document.getElementById('world');
const FILT = '<defs>'
 + '<filter id="fPaper" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" operator="dilate" radius="10" result="d"/><feFlood flood-color="#fffaf0"/><feComposite in2="d" operator="in" result="w"/><feMerge result="m"><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge><feDropShadow dx="0" dy="16" stdDeviation="9" flood-color="#3a2210" flood-opacity=".4"/></filter>'
 + '<filter id="fCut" x="-10%" y="-10%" width="120%" height="130%"><feTurbulence id="tbC" type="fractalNoise" baseFrequency=".012" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="10"/><feDropShadow dx="0" dy="18" stdDeviation="10" flood-color="#3a2210" flood-opacity=".42"/></filter>'
 + '<filter id="fNeon" x="-30%" y="-30%" width="160%" height="160%"><feColorMatrix type="matrix" values=".33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 1 0" result="g"/><feComponentTransfer in="g" result="c"><feFuncR type="table" tableValues=".08 .95 .25"/><feFuncG type="table" tableValues=".0 .15 1"/><feFuncB type="table" tableValues=".25 .75 1"/></feComponentTransfer><feGaussianBlur in="c" stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="c"/></feMerge></filter>'
 + '<filter id="fGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
 + '<filter id="fPop" x="-25%" y="-25%" width="150%" height="150%"><feComponentTransfer in="SourceGraphic" result="p"><feFuncR type="discrete" tableValues="0 .3 .62 1"/><feFuncG type="discrete" tableValues="0 .3 .62 1"/><feFuncB type="discrete" tableValues="0 .3 .62 1"/></feComponentTransfer><feColorMatrix in="p" type="saturate" values="1.5" result="s"/><feMorphology in="SourceAlpha" operator="dilate" radius="9" result="d"/><feFlood flood-color="#111"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="s"/></feMerge><feDropShadow dx="12" dy="14" stdDeviation="0" flood-color="#111"/></filter>'
 + '<filter id="fWater" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence id="tbW" type="fractalNoise" baseFrequency=".022" numOctaves="2" seed="1" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="16" result="d"/><feColorMatrix in="d" type="saturate" values=".78" result="s"/><feComponentTransfer in="s"><feFuncR type="linear" slope=".92" intercept=".07"/><feFuncG type="linear" slope=".92" intercept=".07"/><feFuncB type="linear" slope=".92" intercept=".06"/></feComponentTransfer></filter>'
 + '<filter id="fWob" x="-10%" y="-20%" width="120%" height="140%"><feTurbulence id="tbT" type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7"/></filter>'
 + '<filter id="fTex" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="3" seed="9"/><feColorMatrix type="matrix" values="0 0 0 0 .35 0 0 0 0 .27 0 0 0 0 .18 0 0 0 .5 0"/></filter>'
 + '<pattern id="pHalf" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(18)"><circle cx="18" cy="18" r="9" fill="#ff4d4d" opacity=".55"/></pattern>'
 + '</defs>';
const T1 = (id, txt, size, col, sh, k) => A.title(id, txt, size, col, sh);
// every style: fps (0 = smooth), bg(), the title look, the dino wrapper filter, extra motion, and a camera sway
const STY = {
  anime: { fps: 0, filt: '', build() { return A.dusk() + A.burst('bs', '#ffe3f0', 34); }, title: (id, t, s) => A.title(id, t, s, '#fff', '#ff5f8f'), title2: (id, t, s) => A.title(id, t, s, '#ffe36b', '#ff5f8f'),
    extra(t, q) { put('bgA', { x: -30 * t }); put('bgB', { x: -60 * t }); put('bgC', { x: -100 * t }); put('bs', { x: 540, y: 1000, r: t * 8, s: 0.6 + 0.5 * eo((t - 0.25) / 0.5), o: t > 0.25 ? 0.5 * (1 - clamp((t - 0.4) / 0.6)) : 0 }); } },
  paper: { fps: 12, filt: 'url(#fPaper)', build() {
      const hill = (id, y, col, a) => '<g id="' + id + '" filter="url(#fCut)"><path d="M-80 ' + y + ' Q200 ' + (y - a) + ' 460 ' + y + ' T1000 ' + y + ' T1240 ' + (y - a / 2) + ' V2100 H-80Z" fill="' + col + '"/></g>';
      return '<rect x="-300" y="-500" width="1680" height="3000" fill="#f4e8cf"/><circle id="pSun" cx="760" cy="640" r="190" fill="#ffe08a" filter="url(#fCut)"/><g id="pCl" filter="url(#fCut)"><ellipse cx="260" cy="560" rx="170" ry="52" fill="#fff"/><ellipse cx="350" cy="520" rx="90" ry="50" fill="#fff"/><ellipse cx="880" cy="900" rx="150" ry="46" fill="#fff"/></g>' + hill('pl0', 1010, '#3aa6a0', 150) + hill('pl1', 1250, '#ff7a6b', 130) + hill('pl2', 1500, '#f4b942', 110) + hill('pl3', 1720, '#7a4fb0', 90)
        + '<rect x="-300" y="-500" width="1680" height="3000" filter="url(#fTex)" opacity=".5"/>'; },
    title: (id, t, s) => '<g id="' + id + '" filter="url(#fPaper)"><text id="' + id + 'a" x="0" y="0" text-anchor="middle" font-family="Geist" font-weight="900" font-size="' + s + '" fill="#ff5a4d">' + t + '</text></g>', title2: (id, t, s) => '<g id="' + id + '" filter="url(#fPaper)"><text id="' + id + 'a" x="0" y="0" text-anchor="middle" font-family="Geist" font-weight="900" font-size="' + s + '" fill="#2a6f9e">' + t + '</text></g>',
    extra(t, q) { [0, 1, 2, 3].forEach((i) => put('pl' + i, { x: 14 * sin(q * 2 + i) + (rn(Math.floor(q * 12), i) - 0.5) * 6 * (1 + i * 0.3), y: (rn(Math.floor(q * 12), i + 9) - 0.5) * 5 })); put('pSun', { y: -20 * eo(q / 0.8), r: q * 20, ox: 760, oy: 640 }); put('pCl', { x: -60 * q }); const e = document.getElementById('tbC'); if (e) e.setAttribute('seed', 1 + Math.floor(q * 12) % 5); } },
  neon: { fps: 0, filt: 'url(#fNeon)', build() {
      let st = ''; for (let i = 0; i < 9; i++) st += '<rect x="280" y="' + (780 + i * 36) + '" width="520" height="' + (4 + i * 3) + '" fill="#12002b"/>';
      return '<defs><linearGradient id="nBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0020"/><stop offset=".6" stop-color="#3a0a63"/><stop offset="1" stop-color="#ff3d9a"/></linearGradient><linearGradient id="nSun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe14a"/><stop offset="1" stop-color="#ff2d95"/></linearGradient></defs><rect x="-300" y="-500" width="1680" height="3000" fill="url(#nBg)"/><g id="nS"><circle cx="540" cy="880" r="270" fill="url(#nSun)"/>' + st + '</g>'
        + '<path d="M-60 1100 L120 960 L260 1060 L420 900 L560 1070 L700 940 L860 1080 L1000 930 L1140 1100Z" fill="#12002b" stroke="#2ff5ff" stroke-width="5" filter="url(#fGlow)"/><rect x="-300" y="1100" width="1680" height="1000" fill="#12002b"/><g id="nG" filter="url(#fGlow)" stroke="#ff3d9a" stroke-width="4" opacity=".9">' + Array.from({ length: 16 }, (_, i) => '<line x1="' + (540 + (i - 7.5) * 60) + '" y1="1100" x2="' + (540 + (i - 7.5) * 420) + '" y2="2000"/>').join('') + Array.from({ length: 10 }, (_, i) => '<line id="nh' + i + '" x1="-300" x2="1380" y1="1100" y2="1100"/>').join('') + '</g>'; },
    title: (id, t, s) => '<g id="' + id + '" filter="url(#fGlow)"><text id="' + id + 'a" x="0" y="0" text-anchor="middle" font-family="Geist" font-weight="900" font-style="italic" font-size="' + s + '" fill="none" stroke="#2ff5ff" stroke-width="7">' + t + '</text></g>', title2: (id, t, s) => '<g id="' + id + '" filter="url(#fGlow)"><text id="' + id + 'a" x="0" y="0" text-anchor="middle" font-family="Geist" font-weight="900" font-style="italic" font-size="' + s + '" fill="none" stroke="#ff3d9a" stroke-width="7">' + t + '</text></g>',
    extra(t, q) { for (let i = 0; i < 10; i++) { const d = ((q * 0.9 + i / 10) % 1); put('nh' + i, { y: 900 * d * d }); } put('nS', { y: -16 * eo(q / 0.8) + 6 * sin(q * 4) }); } },
  flat: { fps: 0, filt: '', dino: 'flat', build() {
      let st = ''; for (let i = 0; i < 40; i++) st += '<circle cx="' + (rn(i, 1) * 1080).toFixed(0) + '" cy="' + (rn(i, 2) * 1900).toFixed(0) + '" r="' + (1.5 + rn(i, 3) * 3).toFixed(1) + '" fill="#fff" opacity="' + (0.3 + rn(i, 4) * 0.6).toFixed(2) + '"/>';
      return '<defs><linearGradient id="fBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0f3d"/><stop offset="1" stop-color="#2a2f9a"/></linearGradient></defs><rect x="-300" y="-500" width="1680" height="3000" fill="url(#fBg)"/>' + st
        + '<g id="fP"><circle cx="220" cy="1500" r="360" fill="#ff6f6f"/><circle cx="130" cy="1400" r="70" fill="#e85a5a"/><circle cx="300" cy="1620" r="100" fill="#e85a5a"/><ellipse cx="220" cy="1500" rx="520" ry="90" fill="none" stroke="#ffd36b" stroke-width="16" transform="rotate(-18 220 1500)"/></g>'
        + '<g id="fM"><circle r="64" fill="#5ff5da"/><circle cx="-18" cy="-14" r="14" fill="#2fc9b0"/></g><g id="fH"><polygon points="0,-90 78,-45 78,45 0,90 -78,45 -78,-45" fill="#ffd36b"/><polygon points="0,-90 78,-45 0,0 -78,-45" fill="#fff0b0"/></g><g id="fT"><polygon points="0,-70 64,50 -64,50" fill="#ff6fb0"/></g>'; },
    title: (id, t, s) => '<g id="' + id + '"><text id="' + id + 'a" x="0" y="0" text-anchor="middle" font-family="Geist" font-weight="900" font-size="' + s + '" fill="#fff">' + t + '</text></g>', title2: (id, t, s) => '<g id="' + id + '"><text id="' + id + 'a" x="0" y="0" text-anchor="middle" font-family="Geist" font-weight="900" font-size="' + s + '" fill="#5ff5da">' + t + '</text></g>',
    extra(t, q) { put('fM', { x: 540 + 380 * Math.cos(q * 1.6 + 1), y: 800 + 150 * sin(q * 1.6 + 1), s: 0.9 + 0.1 * sin(q * 4) }); put('fH', { x: 880, y: 1100 + 14 * sin(q * 3), r: q * 40 }); put('fT', { x: 200, y: 900 + 14 * sin(q * 3 + 1), r: -q * 50 }); put('fP', { x: -12 * q }); } },
  pop: { fps: 12, filt: 'url(#fPop)', build() {
      return '<rect x="-300" y="-500" width="1680" height="3000" fill="#ffd23f"/><rect x="-300" y="-500" width="1680" height="3000" fill="url(#pHalf)"/>' + A.burst('bs', '#ff4d4d', 28) + '<g id="pB"><polygon points="' + Array.from({ length: 24 }, (_, i) => { const a = i / 24 * Math.PI * 2, r = i % 2 ? 250 : 400; return (Math.cos(a) * r).toFixed(0) + ',' + (Math.sin(a) * r).toFixed(0); }).join(' ') + '" fill="#fff" stroke="#111" stroke-width="12"/><text x="0" y="40" text-anchor="middle" font-family="Geist" font-weight="900" font-size="170" fill="#ff4d4d" stroke="#111" stroke-width="14" paint-order="stroke" transform="rotate(-8)">POW!</text></g><rect x="30" y="30" width="1020" height="1860" fill="none" stroke="#111" stroke-width="16"/>'; },
    title: (id, t, s) => '<g id="' + id + '"><text id="' + id + 'b" x="9" y="11" text-anchor="middle" font-family="Geist" font-weight="900" font-size="' + s + '" fill="#111" stroke="#111" stroke-width="16" stroke-linejoin="round">' + t + '</text><text id="' + id + 'a" x="0" y="0" text-anchor="middle" font-family="Geist" font-weight="900" font-size="' + s + '" fill="#fff" stroke="#111" stroke-width="10" stroke-linejoin="round" paint-order="stroke">' + t + '</text></g>', title2: (id, t, s) => '<g id="' + id + '"><text id="' + id + 'b" x="9" y="11" text-anchor="middle" font-family="Geist" font-weight="900" font-size="' + s + '" fill="#111" stroke="#111" stroke-width="16" stroke-linejoin="round">' + t + '</text><text id="' + id + 'a" x="0" y="0" text-anchor="middle" font-family="Geist" font-weight="900" font-size="' + s + '" fill="#ff4d4d" stroke="#111" stroke-width="10" stroke-linejoin="round" paint-order="stroke">' + t + '</text></g>',
    extra(t, q) { put('bs', { x: 540, y: 1000, r: Math.floor(q * 12) * 4, s: 1, o: 0.35 }); put('pB', { x: 840, y: 1010, s: t > 0.35 ? 0.55 * pop(t, 0.35, 0.3) * (1 + 0.04 * sin(q * 30)) : 0, r: 10, o: 1 }); } },
  ink: { fps: 8, filt: 'url(#fWater)', build() {
      const blob = (id, cx, cy, r, col) => '<g id="' + id + '" filter="url(#fWater)"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + col + '" opacity=".55"/></g>';
      return '<rect x="-300" y="-500" width="1680" height="3000" fill="#f4ecd8"/>' + blob('iA', 250, 620, 260, '#7fd0c8') + blob('iB', 860, 880, 220, '#ffb3a0') + blob('iC', 600, 420, 190, '#ffe08a') + blob('iD', 540, 1500, 420, '#b7a3e8')
        + '<path d="M-40 1300 Q180 1180 380 1290 T760 1270 T1120 1250" fill="none" stroke="#2a1850" stroke-width="7" stroke-linecap="round" filter="url(#fWob)"/><rect x="-300" y="-500" width="1680" height="3000" filter="url(#fTex)" opacity=".55"/>'; },
    title: (id, t, s) => '<g id="' + id + '" filter="url(#fWob)"><text id="' + id + 'a" x="0" y="0" text-anchor="middle" font-family="Geist" font-weight="800" font-style="italic" font-size="' + s + '" fill="#2a1850">' + t + '</text></g>', title2: (id, t, s) => '<g id="' + id + '" filter="url(#fWob)"><text id="' + id + 'a" x="0" y="0" text-anchor="middle" font-family="Geist" font-weight="800" font-style="italic" font-size="' + s + '" fill="#c2335f">' + t + '</text></g>',
    extra(t, q) { const k = Math.floor(q * 8); ['iA', 'iB', 'iC', 'iD'].forEach((id, i) => put(id, { x: 8 * sin(q + i) + (rn(k, i) - 0.5) * 10, y: 8 * sin(q * 1.3 + i) + (rn(k, i + 5) - 0.5) * 10 })); ['tbW', 'tbT'].forEach((id, i) => { const e = document.getElementById(id); if (e) e.setAttribute('seed', 1 + (k + i * 3) % 7); }); } },
};
window.__STY = STY; window.__pop = pop;
window.setup = (name) => { const s = STY[name]; if (s.custom) { root.innerHTML = FILT + s.build(); document.getElementById('cam').setAttribute('transform', ''); return; } root.innerHTML = FILT + s.build() + '<g id="dw" filter="' + s.filt + '">' + (s.dino === 'flat' ? K.dinoFlat('mj') : K.dino('mj')) + '</g>' + s.title('t1', 'NEW AI TOOL', 128) + s.title2('t2', 'EVERY DAY', 150) + A.spark('s1', '#fff', 34) + A.spark('s2', '#ffe36b', 26) + A.spark('s3', '#fff', 22); document.getElementById('dw').setAttribute('filter', s.filt || 'none'); };
window.frame = (name, t) => {
  const s = STY[name], q = s.fps ? Math.floor(t * s.fps) / s.fps : t, k = s.fps ? Math.floor(t * s.fps) : 0;
  if (s.custom) { s.frame(t, q); return; }
  const jit = s.fps ? (rn(k, 3) - 0.5) * 6 : 0;
  s.extra && s.extra(t, q);
  const ts = (a) => 1 + 0.28 * (1 - eo((q - a) / 0.3));
  put('t1', { x: 540 + jit, y: 540, s: ts(0.05), r: s.fps ? (rn(k, 5) - 0.5) * 3 : 0, o: 1 }); put('t2', { x: 540 + jit, y: 700, s: ts(0.2), r: s.fps ? (rn(k, 6) - 0.5) * 3 : 0, o: q >= 0.2 ? 1 : 0 });
  const p = pop(q, 0.3, 0.5), sq = squash(q, 0.62);
  E.dino('mj', { x: 540 + jit, y: 1330 - 30 * clamp((q - 0.2) / 0.3), s: 0.95 * p, T: q, mood: q < 0.9 ? 'curious' : 'happy', talk: 0, armL: 16 + 6 * sin(q * 9), armR: 120 + 30 * sin(q * 12), head: 4 * sin(q * 7), wagA: 20, wag: 12, bob: -14 * Math.abs(sin(q * 5)) });
  put('dw', { sx: sq[0], sy: sq[1], ox: 540, oy: 1330 });
  [['s1', 190, 760], ['s2', 900, 1040], ['s3', 820, 560]].forEach((a, i) => put(a[0], { x: a[1], y: a[2] + 16 * sin(q * 3 + i), s: 0.8 * pop(q, 0.6 + i * 0.12, 0.4) * (0.7 + 0.4 * Math.abs(sin(q * 5 + i))), r: q * 90 }));
  const sway = s.fps ? 0 : 1; document.getElementById('cam').setAttribute('transform', 'translate(' + (540 + sin(q * 2.3) * 5 * sway) + ' ' + (960 + sin(q * 1.7) * 4 * sway) + ') scale(' + (1.04 + 0.05 * (q / 2)) + ') translate(-540 -960)');
};`;
const EXTRA = fs.readFileSync(path.join(__dirname, 'style-pack2.js'), 'utf8');
const html = () => `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}*{margin:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#000}svg{display:block}</style></head><body><svg id="root" width="1080" height="1920" viewBox="0 0 1080 1920"><g id="cam"><g id="world"></g></g></svg><script>${SRC}</script><script>${PAGE}</script><script>${EXTRA}</script></body></html>`;

(async () => {
  let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(sh('npm root -g').trim() + '/playwright')); }
  const browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
  fs.mkdirSync(out, { recursive: true }); const res = [];
  for (const name of ONLY) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } }); page.on('pageerror', (e) => console.error('PAGE ERROR', name, e.message));
    await page.setContent(html()); await page.evaluate(() => document.fonts.ready); await page.evaluate((n) => window.setup(n), name);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'style-' + name + '-'));
    for (let i = 0; i < N; i++) { await page.evaluate(([n, t]) => window.frame(n, t), [name, i / FPS]); await page.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 90 }); }
    if (i0(name)) await page.screenshot({ path: path.join(out, `style-${name}-poster.jpg`), type: 'jpeg', quality: 90 });
    await page.close(); const o = path.join(out, `style-${name}.mp4`);
    sh(`ffmpeg -y -framerate ${FPS} -i "${path.join(dir, 'f%04d.jpg')}" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart "${o}"`); res.push(o); console.log('done', name);
  }
  await browser.close(); console.log(JSON.stringify(res));
})().catch((e) => { console.error(e); process.exit(1); });
function i0() { return true; }
