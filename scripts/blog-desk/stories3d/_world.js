/* Shared 3D world for the story videos: renderer, night city, glass panels, pills, low-poly Mujasauraus. Imported by the story packs. */
import * as THREE from '/assets/vendor/three-0.184.0/three.module.min.js';
const W = 1080, H = 1920;
const clamp = (x, a, b) => Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, x));
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3), eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const back = (x) => { x = clamp(x); const c = 1.15; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const lerp = (a, b, p) => a + (b - a) * p, rn = (i, k) => { const x = Math.sin(i * 127.1 + (k || 0) * 311.7) * 43758.5453; return x - Math.floor(x); };
const pop = (t, a, d) => (t < a ? 0 : back((t - a) / (d || 0.5))), op = (t, a, d) => clamp((t - a) / (d || 0.2));
await document.fonts.load('900 60px Geist'); await document.fonts.ready;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.setPixelRatio(1); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
document.getElementById('gl').appendChild(renderer.domElement);
const scene = new THREE.Scene();
{ const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#04061a'); gr.addColorStop(0.45, '#0d1a56'); gr.addColorStop(0.8, '#234c93'); gr.addColorStop(1, '#4a86b8'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; scene.background = tx; }
scene.fog = new THREE.Fog(0x0d1a56, 22, 85);
scene.add(new THREE.HemisphereLight(0x9fb8ff, 0x0a0f30, 0.9));
const key = new THREE.DirectionalLight(0xffb070, 3.0); key.position.set(7, 9, 9); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 }); key.shadow.bias = -0.0005; scene.add(key);
const rim = new THREE.DirectionalLight(0x5ff5da, 2.4); rim.position.set(-8, 6, -7); scene.add(rim);
const fill = new THREE.PointLight(0x7a8cff, 40, 30); fill.position.set(-4, 4, 8); scene.add(fill);
const M = (c, e, r, ei) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: r === undefined ? 0.7 : r, metalness: 0, emissive: e || 0, emissiveIntensity: ei || 1 });
const mesh = (g, m, x, y, z) => { const o = new THREE.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; o.receiveShadow = true; return o; };
const FLOOR = 1.2;
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const glow = (col, s, x, y, z) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); sp.scale.set(s, s, 1); sp.position.set(x || 0, y || 0, z || 0); return sp; };
// ---- the night city and the platform (shared by every scene)
{ const plat = mesh(new THREE.CylinderGeometry(9, 7, 1.4, 10, 1), [M(0x16246e, 0x0a1450), M(0x1b2f8f, 0x0e1c6a), M(0x0f1850)], 0, FLOOR - 0.7, 0); scene.add(plat);
  const pts = []; for (const r of [2, 4, 6, 8]) for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, b = (i + 1) / 10 * Math.PI * 2; pts.push(Math.cos(a) * r, FLOOR + 0.02, Math.sin(a) * r, Math.cos(b) * r, FLOOR + 0.02, Math.sin(b) * r); } for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; pts.push(0, FLOOR + 0.02, 0, Math.cos(a) * 9, FLOOR + 0.02, Math.sin(a) * 9); }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); scene.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x5ff5da, transparent: true, opacity: 0.45 })));
  const wc = document.createElement('canvas'); wc.width = 128; wc.height = 256; const wg = wc.getContext('2d'); wg.fillStyle = '#000'; wg.fillRect(0, 0, 128, 256); for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) if (rn(x * 17 + y, 3) < 0.35) { wg.fillStyle = rn(x, y) < 0.2 ? '#5ff5da' : '#ffcf7a'; wg.fillRect(x * 16 + 3, y * 16 + 3, 10, 10); }
  for (let i = 0; i < 24; i++) { const a = (-165 + i * (150 / 23)) * Math.PI / 180, r = 34 + rn(i, 1) * 14, h = 9 + rn(i, 2) * 22, w = 3 + rn(i, 3) * 3; const tx = new THREE.CanvasTexture(wc); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 4))); tx.colorSpace = THREE.SRGBColorSpace; const m = new THREE.MeshStandardMaterial({ color: 0x0a1240, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.85, roughness: 0.8, flatShading: true }); const b = mesh(new THREE.BoxGeometry(w, h, w), m, Math.cos(a) * r, h / 2 - 2, Math.sin(a) * r); b.castShadow = false; scene.add(b); }
  const moon = mesh(new THREE.IcosahedronGeometry(3.4, 1), new THREE.MeshBasicMaterial({ color: 0xfff2c8, fog: false }), 17, 21, -58); scene.add(moon); scene.add(glow(0xffe8b0, 26, 17, 21, -57));
  const sp = new Float32Array(240); for (let i = 0; i < 80; i++) { sp[i * 3] = (rn(i, 1) - 0.5) * 120; sp[i * 3 + 1] = 12 + rn(i, 2) * 40; sp[i * 3 + 2] = -45 - rn(i, 3) * 30; } const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.3, fog: false })));
}
const dust = (() => { const n = 70, p = new Float32Array(n * 3); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); const o = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffe0a0, size: 0.14, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(o); return { o, n, p }; })();
// ---- UI slabs: a glass block with a canvas drawn face
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
const glass = (c, w, h, rad, acc) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(26,38,100,.95)'); g.addColorStop(1, 'rgba(10,16,48,.95)'); c.fillStyle = g; rr(c, 6, 6, w - 12, h - 12, rad); c.fill(); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,.2)'; c.stroke(); c.fillStyle = acc || '#5ff5da'; c.globalAlpha = 0.9; rr(c, rad * 1.1, 6, w - rad * 2.2, 5, 2.5); c.fill(); c.globalAlpha = 1; };
const tx = (c, s, x, y, size, col, al, st) => { c.font = `900 ${size}px Geist`; c.textAlign = al || 'center'; c.textBaseline = 'middle'; if (st) { c.lineWidth = size * 0.14; c.strokeStyle = st; c.lineJoin = 'round'; c.strokeText(s, x, y); } c.fillStyle = col; c.fillText(s, x, y); };
function ui(w, h, draw, o) {
  o = o || {}; const px = 200, cv = document.createElement('canvas'); cv.width = Math.round(w * px); cv.height = Math.round(h * px); const ctx = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const g = new THREE.Group(); if (!o.flat) { const b = mesh(new THREE.BoxGeometry(w + 0.14, h + 0.14, 0.18), M(o.edge || 0x131b52, o.em || 0x060a2c, 0.4), 0, 0, 0); g.add(b); }
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })); face.position.z = o.flat ? 0 : 0.1; g.add(face);
  g.userData.redraw = (st) => { ctx.clearRect(0, 0, cv.width, cv.height); draw(ctx, cv.width, cv.height, st); tex.needsUpdate = true; }; g.userData.redraw(); scene.add(g); g.visible = false; return g;
}
const chip = (txt, col, tcol, w, h, size) => ui(w || 3, h || 0.9, (c, cw, ch) => { c.fillStyle = 'rgba(10,16,48,.93)'; rr(c, 6, 6, cw - 12, ch - 12, (ch - 12) / 2); c.fill(); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,.24)'; c.stroke(); c.fillStyle = col; c.beginPath(); c.arc(ch * 0.5, ch / 2, ch * 0.13, 0, 7); c.fill(); let sz = Math.min(size || ch * 0.46, ch * 0.5); c.font = `800 ${sz}px Geist`; while (c.measureText(txt).width > cw - ch * 1.25 && sz > 20) { sz -= 2; c.font = `800 ${sz}px Geist`; } tx(c, txt, ch * 0.78 + (cw - ch * 0.78 - ch * 0.3) / 2, ch / 2 + 3, sz, '#f4f7ff'); }, { edge: 0x131b52 });
// ---- Mujasauraus in low poly
const mj = (() => {
  const g = new THREE.Group(), skin = M(0xa48cff, 0x1a1050, 0.65), belly = M(0xfff3c4, 0x332a10), teal = M(0x3fe0c5, 0x1fa890, 0.4), dark = M(0x16321f, 0, 0.3), white = M(0xffffff, 0x333333, 0.3), pink = M(0xff8fb0);
  const body = mesh(new THREE.IcosahedronGeometry(1.15, 1), skin, 0, 1.45, 0); body.scale.set(1.12, 1, 1); g.add(body); const bel = mesh(new THREE.IcosahedronGeometry(0.85, 1), belly, 0, 1.3, 0.78); bel.scale.set(1, 0.95, 0.62); g.add(bel);
  const head = new THREE.Group(); head.position.set(0, 3.15, 0.1); g.add(head); head.add(mesh(new THREE.IcosahedronGeometry(1.08, 1), skin)); head.add(mesh(new THREE.IcosahedronGeometry(0.55, 1), M(0xb9a6ff), 0, -0.3, 0.75));
  const eyes = [], brows = [];
  [-1, 1].forEach((s) => { const e = new THREE.Group(); e.position.set(s * 0.46, 0.12, 0.84); e.add(mesh(new THREE.IcosahedronGeometry(0.33, 1), white)); const pu = mesh(new THREE.IcosahedronGeometry(0.19, 1), dark, 0, -0.02, 0.28); e.add(pu); e.add(mesh(new THREE.IcosahedronGeometry(0.07, 0), white, 0.05, 0.1, 0.44)); head.add(e); eyes.push({ e, pu });
    const br = mesh(new THREE.BoxGeometry(0.5, 0.09, 0.09), dark, s * 0.46, 0.6, 1.0); head.add(br); brows.push(br);
    const ch = mesh(new THREE.IcosahedronGeometry(0.2, 0), pink, s * 0.78, -0.25, 0.7); ch.scale.set(1, 0.6, 0.4); head.add(ch); const hn = mesh(new THREE.ConeGeometry(0.2, 0.55, 5), M(0xfff3c4), s * 0.62, 0.98, 0.1); hn.rotation.z = -s * 0.5; head.add(hn); });
  [-0.4, 0, 0.4].forEach((x, i) => { const c = mesh(new THREE.ConeGeometry(0.2, 0.62 + (i === 1 ? 0.2 : 0), 5), teal, x, 1.1, -0.1); c.rotation.z = -x * 0.5; head.add(c); });
  const smile = mesh(new THREE.TorusGeometry(0.26, 0.06, 4, 8, Math.PI), dark, 0, -0.42, 1.3); smile.rotation.z = Math.PI; head.add(smile); const frown = mesh(new THREE.TorusGeometry(0.22, 0.06, 4, 8, Math.PI), dark, 0, -0.55, 1.3); head.add(frown);
  const mouthO = mesh(new THREE.IcosahedronGeometry(0.24, 1), M(0x5a1f3a), 0, -0.48, 1.3); head.add(mouthO);
  for (let k = 0; k < 5; k++) { const c = mesh(new THREE.ConeGeometry(0.2, 0.58, 5), teal, 0, 2.25 - k * 0.38, -0.95 - k * 0.12); c.rotation.x = -0.9 - k * 0.1; g.add(c); }
  const tail = new THREE.Group(); tail.position.set(0, 0.9, -0.9); const tc = mesh(new THREE.ConeGeometry(0.62, 2.1, 6), skin, 0, 0, -0.9); tc.rotation.x = -Math.PI / 2 - 0.25; tail.add(tc); tail.add(mesh(new THREE.ConeGeometry(0.16, 0.5, 5), teal, 0, 0.5, -1.0)); g.add(tail);
  const arm = (s) => { const a = new THREE.Group(); a.position.set(s * 1.2, 2.05, 0.2); a.add(mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.9, 6), skin, 0, -0.4, 0)); a.add(mesh(new THREE.IcosahedronGeometry(0.27, 1), skin, 0, -0.9, 0)); g.add(a); return a; };
  const armL = arm(-1), armR = arm(1);
  [-0.55, 0.55].forEach((x) => { g.add(mesh(new THREE.CylinderGeometry(0.4, 0.46, 0.8, 7), skin, x, 0.4, 0.1)); const f = mesh(new THREE.IcosahedronGeometry(0.5, 1), M(0x8c72f0), x, 0.1, 0.35); f.scale.set(1, 0.5, 1.2); g.add(f); });
  g.add(glow(0x7a5cff, 7, 0, 2.2, -1)); scene.add(g); g.visible = false;
  const BR = { calm: [0, 0, 0], happy: [0, 0, 0.05], worried: [0.4, -0.4, 0.15], shock: [0, 0, 0.3], curious: [0, -0.3, 0.2], smirk: [-0.2, 0.1, 0.1] };
  return { g, pose(T, o) {
    o = o || {}; const mood = o.mood || 'calm', s = o.s === undefined ? 1 : o.s, hop = (o.hop || 0) * Math.abs(Math.sin(T * Math.PI * 1.15)), land = Math.max(0, 1 - hop * 6) * (o.hop ? 1 : 0);
    g.position.set(o.x || 0, FLOOR + hop * 0.55, o.z || 0); g.scale.set(s * (1 + 0.06 * land), s * (1 - 0.08 * land), s * (1 + 0.06 * land)); g.rotation.y = (o.ry || 0) + Math.sin(T * 2.2) * 0.1; g.visible = s > 0.01;
    head.rotation.z = (o.head || 0) + Math.sin(T * 4.4) * 0.05; head.rotation.x = -0.05 + (o.nod || 0) + Math.sin(T * 3.7) * 0.03; armR.rotation.z = -(o.armR === undefined ? 0.3 : o.armR) + Math.sin(T * 12) * (o.wave || 0); armL.rotation.z = (o.armL === undefined ? 0.3 : o.armL); tail.rotation.y = Math.sin(T * 8) * 0.45;
    const blink = (T % 3.3) < 0.13 ? 0.1 : 1, br = BR[mood] || BR.calm; eyes.forEach((q, i) => { q.e.scale.y = blink * (mood === 'shock' ? 1.2 : 1); q.pu.position.x = (o.look || 0) * 0.1; q.pu.position.y = -0.02 + (o.lookY || 0) * 0.08; });
    brows[0].rotation.z = -br[0]; brows[1].rotation.z = br[0] + br[1]; brows.forEach((b) => { b.position.y = 0.6 + br[2]; });
    const talk = o.talk || 0, open = mood === 'shock' ? 0.8 : talk; mouthO.visible = open > 0.15; mouthO.scale.set(1, 0.3 + 1.0 * open, 0.6); const sm = !mouthO.visible && mood !== 'worried'; smile.visible = sm; frown.visible = !mouthO.visible && mood === 'worried';
  } };
})();
// magnifier prop
const mag = (() => { const g = new THREE.Group(); g.add(mesh(new THREE.TorusGeometry(0.55, 0.1, 5, 10), M(0xffc94a, 0x805010), 0, 0, 0)); const lens = mesh(new THREE.CircleGeometry(0.5, 10), new THREE.MeshBasicMaterial({ color: 0x9be8ff, transparent: true, opacity: 0.25 }), 0, 0, 0); g.add(lens); const h = mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.9, 5), M(0xffc94a), 0.55, -0.55, 0); h.rotation.z = Math.PI / 4; g.add(h); scene.add(g); g.visible = false; return g; })();
// ---- scenes
const SC = []; const cam = new THREE.PerspectiveCamera(36, W / H, 0.1, 200);
const env = (col) => { const m = [M(0xffffff), M(0xffffff), new THREE.MeshBasicMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = 300; c.height = 200; const g = c.getContext('2d'); g.fillStyle = col || '#f3f6ff'; g.fillRect(0, 0, 300, 200); g.strokeStyle = '#2a3aa0'; g.lineWidth = 8; g.strokeRect(4, 4, 292, 192); g.beginPath(); g.moveTo(4, 4); g.lineTo(150, 110); g.lineTo(296, 4); g.stroke(); const t = new THREE.CanvasTexture(g.canvas); t.colorSpace = THREE.SRGBColorSpace; return t; })(), toneMapped: false }), M(0xdde4ff), M(0xffffff), M(0xffffff)]; const b = mesh(new THREE.BoxGeometry(1.5, 0.12, 1.0), m); scene.add(b); b.visible = false; return b; };
const cone = (col, down) => { const c = mesh(new THREE.ConeGeometry(0.34, 0.6, 5), M(col, col, 0.4, 0.5), 0, 0, 0); if (down) c.rotation.x = Math.PI; scene.add(c); c.visible = false; return c; };
const pathCam = (t, d, keys) => { const u = clamp(t / d), i = Math.min(keys.length - 2, Math.max(0, keys.findIndex((k, j) => j < keys.length - 1 && u < keys[j + 1][0]))), a = keys[i < 0 ? 0 : i], b = keys[(i < 0 ? 0 : i) + 1], p = eio((u - a[0]) / Math.max(0.001, b[0] - a[0])); return { p: a[1].map((v, k) => lerp(v, b[1][k], p)), l: a[2].map((v, k) => lerp(v, b[2][k], p)) }; };
const TT = (i, o) => { const e = document.getElementById('ti' + i); if (!o) { e.style.opacity = 0; return; } e.textContent = o.text; e.style.fontSize = Math.round(o.size * 0.9) + 'px'; e.style.top = o.y + 'px'; e.style.fontWeight = 800; e.style.letterSpacing = '-0.015em'; const acc = o.col === '#ffe36b' ? 'linear-gradient(180deg,#ffe9a8,#ffb84d)' : o.col === '#5ff5da' ? 'linear-gradient(180deg,#b6fff0,#3fe0c5)' : ''; if (acc) { e.style.background = acc; e.style.webkitBackgroundClip = 'text'; e.style.backgroundClip = 'text'; e.style.color = 'transparent'; e.style.textShadow = 'none'; e.style.filter = 'drop-shadow(0 4px 14px rgba(0,0,0,.6))'; } else { e.style.background = 'none'; e.style.webkitBackgroundClip = 'initial'; e.style.backgroundClip = 'initial'; e.style.color = '#fff'; e.style.filter = 'none'; e.style.textShadow = '0 3px 0 rgba(4,8,36,.55), 0 10px 30px rgba(0,0,0,.6)'; } e.style.opacity = o.o === undefined ? 1 : o.o; e.style.transform = `scale(${(o.s === undefined ? 1 : o.s).toFixed(3)}) rotate(${((o.r || 0) * 0.4).toFixed(2)}deg)`; };
const GOLD = ['#ffe36b', '#ff8a3c', '#a8501a'], PINK = ['#ffffff', '#ff5f8f', '#a82a5a'], TEAL = ['#5ff5da', '#1f8fd8', '#0f4a98'];

export { THREE, W, H, clamp, eo, eio, back, lerp, rn, pop, op, renderer, scene, M, mesh, FLOOR, glow, rr, glass, tx, ui, chip, mj, mag, cam, pathCam, TT, GOLD, PINK, TEAL, dust, env, cone };
