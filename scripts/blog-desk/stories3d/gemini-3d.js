/* 3D story pack (browser module): "The AI that can't write" as a cinematic low-poly 3D film. Real three.js: flat-shaded Mujasauraus, glass UI slabs, a night city, an eased dolly camera with handheld sway,
   teal-and-orange grade, letterbox, film grain. Every frame is a pure function of time. story3d.js drives it: boot(cfg) picks a scene, draw(t) paints, sfxList() lists sound effects. */
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

/* 1 HOOK */
{ const g = new THREE.Group(); scene.add(g);
  const orb = new THREE.Group(); orb.add(mesh(new THREE.IcosahedronGeometry(1.5, 1), M(0x5a3fd0, 0x3a22a0, 0.4, 0.8))); const wf = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.85, 1)), new THREE.LineBasicMaterial({ color: 0x5ff5da })); orb.add(wf); orb.add(glow(0x7a5cff, 8, 0, 0, 0));
  const ai = ui(1.8, 1, (c, w, h) => tx(c, 'AI', w / 2, h / 2 + 4, h * 0.82, '#fff', 'center', '#2a1a6e'), { flat: true }); ai.position.set(0, 0, 1.7); orb.add(ai); ai.visible = true; g.add(orb);
  const pc = new THREE.Group(); pc.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.2, 6), M(0xffc94a, 0x805010), 0, 0, 0)); pc.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.4, 6), M(0xff5f8f), 0, 1.3, 0)); pc.add(mesh(new THREE.ConeGeometry(0.16, 0.4, 6), M(0xf3d2a2), 0, -1.3, 0)); pc.rotation.z = 0.7; pc.position.set(1.7, 4.4, 1.0); g.add(pc);
  const xs = [0.785, -0.785].map((r) => { const b = mesh(new THREE.BoxGeometry(0.32, 3.8, 0.3), M(0xff3d6e, 0xff3d6e, 0.4, 0.9), 0, 0, 0); b.rotation.z = r; b.position.set(0, 3.6, 2.2); g.add(b); return b; });
  const cards = [['YES?', '#ffffff'], ['NO?', '#ffe36b'], ['URGENT?', '#5ff5da']].map(([s, c]) => { const k = chip(s, c, '#0b0e2b', 2.0, 0.8); g.add(k); return k; });
  SC.push({ g, nodes: [orb, pc, ...xs, ...cards], cam: (t, d) => pathCam(t, d, [[0, [0.3, 4.6, 17], [0, 3.4, 0]], [0.5, [-0.4, 4.2, 13.5], [0, 3.5, 0]], [1, [0.4, 4.0, 11.5], [0, 3.6, 0]]]),
    draw(t, C) { const tw = C.W(/write/i, 0.55), ty = C.W(/yes/i, 0.7); orb.visible = pc.visible = true; xs.forEach((x) => { x.visible = true; }); orb.position.set(0, 3.7 + Math.sin(C.T * 1.6) * 0.1, 0); orb.rotation.y = 0; wf.rotation.y = -C.T * 0.8; wf.rotation.x = C.T * 0.3; pc.rotation.z = 0.7 + Math.sin(C.T * 2) * 0.05; xs.forEach((x) => { x.scale.setScalar(pop(t, tw, 0.35) || 0.0001); }); const sh = t > tw ? Math.exp(-(t - tw) * 8) : 0;
      cards.forEach((k, i) => { const a = ty + i * 0.3; k.visible = t >= a; k.position.set([-1.9, 2.2, 1.5][i], [2.4, 3.0, 1.9][i] + Math.sin(C.T * 1.8 + i) * 0.08, 1.4 - i * 0.3); k.scale.setScalar(pop(t, a, 0.5) || 0.0001); k.rotation.z = [0.08, -0.06, 0.04][i]; });
      TT(0, { text: 'AI THAT', size: 190, y: 160, s: 1 + 0.3 * (1 - eo(t / 0.35)), sh1: PINK[1], sh2: PINK[2] }); TT(1, { text: "CAN'T WRITE", size: 136, y: 340, col: GOLD[0], s: 1 + 0.3 * (1 - eo((t - 0.08) / 0.35)), sh1: GOLD[1], sh2: GOLD[2] }); TT(2, null); C.shake = sh * 0.25; },
    sfx(C) { return [{ t: 0.02, type: 'thump', v: 0.9 }, { t: C.W(/write/i, 0.55), type: 'thump', v: 0.8 }, { t: C.W(/yes/i, 0.7), type: 'pop', v: 0.5 }]; } }); }

/* 2 SETUP */
{ const g = new THREE.Group(), N = 14, ev = Array.from({ length: N }, () => { const e = env(); g.add(e); return e; });
  const tags = [['ANGRY?', '#ff5f8f', '#fff', 2.4], ['URGENT?', '#ffc94a', '#0b0e2b', 2.6], ['WHO HANDLES IT?', '#5ff5da', '#0b0e2b', 3.9]].map(([s, c, t, w]) => { const k = chip(s, c, t, w, 0.85, 120); g.add(k); return k; });
  SC.push({ g, nodes: [...ev, ...tags], cam: (t, d) => pathCam(t, d, [[0, [0.2, 4.4, 14.5], [0, 3.2, 0]], [1, [-0.3, 4.2, 12.5], [0, 3.2, 0]]]),
    draw(t, C) { const th = C.W(/thousand/i, 0.1), a1 = C.W(/angry/i, 0.45), a2 = C.W(/urgent/i, 0.6), a3 = C.W(/handle|who/i, 0.78), t0 = th + 0.1, t1 = Math.max(t0 + 1.2, a1 - 0.2);
      ev.forEach((e, i) => { const ti = t0 + (t1 - t0) * i / (N - 1), p = clamp((t - ti) / 0.7), tgt = [(rn(i, 1) - 0.5) * 1.6, FLOOR + 0.12 * (1 + Math.floor(i / 3)) + 0.06, (rn(i, 2) - 0.5) * 1.2]; e.visible = p > 0; e.position.set(lerp((i % 2 ? 4 : -4), tgt[0], eo(p)), lerp(9, tgt[1], eo(p) * eo(p)) + Math.sin(p * Math.PI) * 0.8, lerp(-2, tgt[2], eo(p))); e.rotation.set(0, (rn(i, 3) - 0.5) * 1.4 + (1 - p) * 3, (1 - p) * (i % 2 ? 1 : -1)); });
      [[a1, -1.0, 5.2], [a2, 1.2, 4.3], [a3, 0, 3.4]].forEach(([a, x, y], i) => { tags[i].visible = t >= a; tags[i].position.set(x, y + Math.sin(C.T * 1.7 + i) * 0.08, 1.6); tags[i].scale.setScalar(pop(t, a, 0.5) || 0.0001); tags[i].rotation.z = [0.06, -0.05, 0.03][i]; });
      const n = Math.round(1000 * C.tw(t, th, th + 1.2)); TT(0, { text: n.toLocaleString('en-US'), size: 200, y: 150, col: GOLD[0], s: pop(t, th, 0.5), o: op(t, th), sh1: GOLD[1], sh2: GOLD[2] }); TT(1, { text: 'SUPPORT EMAILS', size: 84, y: 360, s: pop(t, th + 0.2, 0.5), o: op(t, th + 0.2), sh1: TEAL[1], sh2: TEAL[2] }); TT(2, null); },
    sfx(C) { const th = C.W(/thousand/i, 0.1); return [{ t: th, type: 'swell', v: 0.5 }, { t: C.W(/angry/i, 0.45), type: 'pop', v: 0.5 }, { t: C.W(/urgent/i, 0.6), type: 'pop', v: 0.5 }, { t: C.W(/handle|who/i, 0.78), type: 'pop', v: 0.5 }]; } }); }

/* 3 THE OLD WAY */
{ const g = new THREE.Group(), em = env(), a1 = cone(0x5ff5da, true), a2 = cone(0xff5f8f, true); g.add(em, a1, a2);
  const bot = new THREE.Group(); { const hd = mesh(new THREE.IcosahedronGeometry(0.9, 1), M(0xe9eeff, 0x202a60, 0.4), 0, 0, 0); hd.scale.set(1.15, 1, 1); bot.add(hd); bot.add(mesh(new THREE.BoxGeometry(1.5, 0.7, 0.3), M(0x171d63, 0x0a0f40), 0, 0, 0.82)); [-0.35, 0.35].forEach((x) => bot.add(mesh(new THREE.IcosahedronGeometry(0.16, 1), M(0x5ff5da, 0x5ff5da, 0.3, 1.5), x, 0.05, 0.98))); bot.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 5), M(0x7d8be0), 0, 1.15, 0)); bot.add(mesh(new THREE.IcosahedronGeometry(0.14, 0), M(0xffc94a, 0x805010), 0, 1.45, 0)); bot.add(glow(0x5ff5da, 4.5, 0, 0, 0)); g.add(bot); }
  const para = ui(4.4, 1.6, (c, w, h) => { glass(c, w, h, 40, '#ff8a4c'); for (let i = 0; i < 6; i++) { c.fillStyle = 'rgba(255,255,255,.3)'; rr(c, 60, 70 + i * 46, i % 4 === 3 ? w * 0.4 : w - 120, 18, 9); c.fill(); } }); g.add(para);
  const slow = chip('SLOW', '#ff5f8f', '#fff', 1.9, 0.8, 110), messy = chip('MESSY', '#ff8a4c', '#0b0e2b', 2.2, 0.8, 110); g.add(slow, messy);
  SC.push({ g, nodes: [em, a1, a2, bot, para, slow, messy], usesMuja: true, cam: (t, d) => pathCam(t, d, [[0, [0, 4.0, 14.5], [0, 3.3, 0]], [1, [0.5, 3.6, 12.2], [0.3, 3.0, 0]]]),
    draw(t, C) { const te = C.W(/chatbot/i, 0.12), tp = C.W(/paragraph/i, 0.3), td = C.W(/dig|code/i, 0.58), ts = C.W(/slow/i, 0.85);
      em.visible = true; em.position.set(0, 5.5, 0); em.scale.setScalar(0.5 * pop(t, 0, 0.5) || 0.0001); em.rotation.y = Math.sin(C.T) * 0.2; a1.visible = t > te - 0.1; a1.position.set(0, 4.7 + Math.sin(C.T * 5) * 0.06, 0); a1.scale.setScalar(pop(t, te - 0.1, 0.3) || 0.0001);
      bot.visible = true; bot.position.set(0, 3.7 + Math.sin(C.T * 1.7) * 0.08, 0); bot.scale.setScalar(0.62 * (pop(t, te, 0.5) || 0.0001)); a2.visible = t > tp - 0.1; a2.position.set(0, 2.95 + Math.sin(C.T * 5) * 0.06, 0); a2.scale.setScalar(pop(t, tp - 0.1, 0.3) || 0.0001);
      para.visible = true; para.position.set(-0.2, 2.1, 0.8); para.scale.setScalar(pop(t, tp, 0.5) || 0.0001);
      slow.visible = t > ts; slow.position.set(1.7, 4.7, 1.3); slow.rotation.z = -0.1; slow.scale.setScalar(pop(t, ts, 0.4) || 0.0001); messy.visible = t > ts + 0.5; messy.position.set(-1.5, 3.0, 1.9); messy.rotation.z = 0.08; messy.scale.setScalar(pop(t, ts + 0.5, 0.4) || 0.0001);
      mj.pose(C.T, { x: 2.2, z: 3.0, s: 0.46 * (pop(t, td - 0.1, 0.6) || 0.0001), ry: -0.5, mood: t < ts ? 'curious' : 'worried', talk: C.speak(t), look: -0.8, armR: 1.3, wave: 0, armL: 0.5 });
      mag.visible = t >= td; mag.scale.setScalar(0.8 * (pop(t, td, 0.4) || 0.0001)); mag.position.set(-1.2 + 2.2 * (Math.sin(C.T * 1.5) + 1) / 2, 2.1 + 0.15 * Math.sin(C.T * 3), 1.7); TT(0, null); TT(1, null); TT(2, null); },
    sfx(C) { return [{ t: C.W(/chatbot/i, 0.12), type: 'pop', v: 0.5 }, { t: C.W(/paragraph/i, 0.3), type: 'swell', v: 0.45 }, { t: C.W(/dig|code/i, 0.58), type: 'tick', v: 0.6 }, { t: C.W(/slow/i, 0.85), type: 'thump', v: 0.6 }]; } }); }

/* 4 THE NEW WAY */
{ const g = new THREE.Group(), vals = { a: 0, u: 0, team: 0 };
  const panel = ui(4.6, 3.0, (c, w, h, st) => { st = st || { a: 0, u: 0, team: 0 }; glass(c, w, h, 44, '#5ff5da'); const rows = [['Angry', st.a, '#ff5f8f'], ['Urgent', st.u, '#ffc94a']]; rows.forEach(([n, v, col], i) => { const y = 160 + i * 200; tx(c, n, 70, y, 70, '#f2f5ff', 'left'); c.fillStyle = 'rgba(255,255,255,.14)'; rr(c, 360, y - 36, 400, 72, 36); c.fill(); if (v > 0.01) { c.fillStyle = col; rr(c, 360, y - 36, Math.max(72, 400 * v), 72, 36); c.fill(); } tx(c, Math.round(v * 100) + '%', w - 60, y, 70, '#ffffff', 'right'); }); tx(c, 'Team', 70, 560, 70, '#f2f5ff', 'left'); if (st.team > 0.01) { c.save(); c.translate(560, 560); c.scale(st.team, st.team); c.fillStyle = '#3fe0c5'; rr(c, -200, -42, 400, 84, 42); c.fill(); tx(c, 'Billing', 0, 4, 66, '#0b0e2b'); c.restore(); } }); g.add(panel);
  const ex = chip('EXAMPLE', '#9b7bff', '#fff', 2.0, 0.65, 90); g.add(ex);
  SC.push({ g, nodes: [panel, ex], cam: (t, d) => pathCam(t, d, [[0, [0.4, 4.4, 13.5], [0, 3.6, 0]], [1, [-0.3, 4.0, 11.2], [0, 3.6, 0]]]),
    draw(t, C) { const tn = C.W(/numbers|sends/i, 0.5), tb = C.W(/ninety|angry/i, 0.75); panel.visible = true; panel.position.set(0, 3.5, 0.6); panel.rotation.y = Math.sin(C.T * 0.8) * 0.06; panel.scale.setScalar(pop(t, tn - 0.3, 0.6) || 0.0001);
      panel.userData.redraw({ a: 0.94 * C.tw(t, tb, tb + 0.9), u: 0.81 * C.tw(t, tb + 0.4, tb + 1.3), team: pop(t, tb + 0.9, 0.4) });
      ex.visible = t >= tn; ex.position.set(1.6, 5.35, 1.0); ex.rotation.z = -0.1; ex.scale.setScalar(pop(t, tn, 0.4) || 0.0001);
      TT(0, { text: 'NUMBERS,', size: 118, y: 165, s: pop(t, 0.1, 0.5), o: op(t, 0.1), sh1: PINK[1], sh2: PINK[2] }); TT(1, { text: 'NOT PARAGRAPHS', size: 100, y: 305, col: GOLD[0], s: pop(t, 0.25, 0.5), o: op(t, 0.25), sh1: GOLD[1], sh2: GOLD[2] }); TT(2, null); },
    sfx(C) { const tb = C.W(/ninety|angry/i, 0.75); return [{ t: C.W(/numbers|sends/i, 0.5), type: 'ding', v: 0.6 }, { t: tb, type: 'tick', v: 0.7 }, { t: tb + 0.5, type: 'tick', v: 0.7 }, { t: tb + 1.0, type: 'sparkle', v: 0.6 }]; } }); }

/* 5 WHAT IT CAN DO */
{ const g = new THREE.Group(), sl = [['YES or NO', '#dff7f0'], ['PICK ONE', '#dbe6ff'], ['SCORE IT', '#ffe7d4']].map(([s, col], i) => { const k = ui(4.3, 0.95, (c, w, h) => { glass(c, w, h, 46, ['#3fe0c5', '#5b8cff', '#ff8a4c'][i]); if (i === 0) { c.fillStyle = '#3fe0c5'; rr(c, 60, h / 2 - 34, 130, 68, 34); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(156, h / 2, 26, 0, 7); c.fill(); } if (i === 1) { c.fillStyle = 'rgba(255,255,255,.35)'; rr(c, 60, h / 2 - 30, 130, 20, 10); c.fill(); c.fillStyle = '#5b8cff'; rr(c, 60, h / 2 + 6, 130, 22, 11); c.fill(); } if (i === 2) { c.fillStyle = 'rgba(255,255,255,.35)'; rr(c, 60, h / 2 - 8, 140, 16, 8); c.fill(); c.fillStyle = '#ff8a4c'; c.beginPath(); c.arc(150, h / 2, 26, 0, 7); c.fill(); } tx(c, s, w / 2 + 90, h / 2 + 4, 70, '#f4f7ff'); }); g.add(k); return k; });
  const cnt = ui(4.3, 1.9, (c, w, h) => { glass(c, w, h, 50, '#ffc94a'); tx(c, '1,000', w / 2, h * 0.38, 190, '#ffe36b', 'center', '#2a1a6e'); tx(c, 'QUESTIONS IN ONE CALL', w / 2, h * 0.82, 52, '#fff'); }); g.add(cnt);
  const med = ['TEXT', 'IMAGES', 'AUDIO', 'VIDEO', 'PDFs'].map((s, i) => { const k = chip(s, ['#5ff5da', '#ff5f8f', '#ffc94a', '#5b8cff', '#ff8a4c'][i], '#0b0e2b', 1.35, 0.6, 70); g.add(k); return k; });
  SC.push({ g, nodes: [...sl, cnt, ...med], cam: (t, d) => pathCam(t, d, [[0, [0, 4.2, 13.8], [0, 3.4, 0]], [1, [0.2, 3.8, 11.8], [0, 3.4, 0]]]),
    draw(t, C) { const ty = C.W(/yes/i, 0.05), tp = C.W(/pick/i, 0.3), ts = C.W(/score/i, 0.5), tt = C.W(/thousand/i, 0.72), tx0 = C.W(/text/i, 0.88), out = eo((t - tt + 0.15) / 0.4);
      [[ty, 4.9], [tp, 3.85], [ts, 2.8]].forEach(([a, y], i) => { const k = sl[i]; k.visible = t >= a && out < 1; k.position.set(-0.8 * (1 - eo((t - a) / 0.5)) + 1.5 * out * (i % 2 ? 1 : -1), y + Math.sin(C.T * 1.6 + i) * 0.05, 0.8); k.rotation.y = (1 - eo((t - a) / 0.5)) * 0.6; k.scale.setScalar((pop(t, a, 0.5) || 0.0001) * (1 - 0.4 * out)); });
      cnt.visible = t >= tt; cnt.position.set(0, 4.5, 1.0); cnt.scale.setScalar(pop(t, tt, 0.5) || 0.0001); cnt.rotation.y = Math.sin(C.T * 0.9) * 0.05;
      [[-1.5, 2.65], [0, 2.65], [1.5, 2.65], [-0.75, 1.9], [0.75, 1.9]].forEach((p, i) => { const a = tx0 + i * 0.2, k = med[i]; k.visible = t >= a; k.position.set(p[0], p[1] + Math.sin(C.T * 1.8 + i) * 0.04, 1.4); k.scale.setScalar(pop(t, a, 0.4) || 0.0001); }); TT(0, null); TT(1, null); TT(2, null); },
    sfx(C) { const x = C.W(/text/i, 0.88); return [{ t: C.W(/yes/i, 0.05), type: 'pop', v: 0.6 }, { t: C.W(/pick/i, 0.3), type: 'pop', v: 0.6 }, { t: C.W(/score/i, 0.5), type: 'pop', v: 0.6 }, { t: C.W(/thousand/i, 0.72), type: 'swell', v: 0.6 }, { t: x, type: 'pop', v: 0.4 }, { t: x + 0.4, type: 'pop', v: 0.4 }, { t: x + 0.8, type: 'pop', v: 0.4 }]; } }); }

/* 6 THE NUMBERS */
{ const g = new THREE.Group(), sw = new THREE.Group(); sw.add(mesh(new THREE.TorusGeometry(1.1, 0.2, 5, 12), M(0x9aa8f5, 0x2a3aa0, 0.4), 0, 0, 0)); sw.add(mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.2, 12), M(0xf3f6ff, 0x222a60, 0.5), 0, 0, 0)).rotation.x = Math.PI / 2; sw.add(mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.36, 6), M(0x9aa8f5), 0, 1.35, 0)); const hand = new THREE.Group(); hand.add(mesh(new THREE.BoxGeometry(0.1, 0.85, 0.08), M(0xff5f8f, 0xff5f8f, 0.4, 0.6), 0, 0.4, 0.2)); hand.position.z = 0.1; sw.add(hand); for (let i = 0; i < 12; i++) { const m = mesh(new THREE.BoxGeometry(0.06, i % 3 ? 0.14 : 0.24, 0.06), M(0x0b0e2b), Math.sin(i / 12 * Math.PI * 2) * 0.82, Math.cos(i / 12 * Math.PI * 2) * 0.82, 0.14); m.rotation.z = -i / 12 * Math.PI * 2; sw.add(m); } sw.add(glow(0x5ff5da, 4.5, 0, 0, -0.2)); g.add(sw);
  const coin = new THREE.Group(); coin.add(mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.24, 10), M(0xffcf4a, 0x8a5a10, 0.3, 0.7), 0, 0, 0)).rotation.x = Math.PI / 2; const cf = ui(1.3, 1.3, (c, w, h) => tx(c, '$', w / 2, h / 2 + 6, h * 0.8, '#c97b0a'), { flat: true }); cf.position.z = 0.16; coin.add(cf); cf.visible = true; coin.add(glow(0xffcf4a, 4.5, 0, 0, -0.2)); g.add(coin);
  const c1 = ui(2.4, 1.3, (c, w, h) => { glass(c, w, h, 40, '#5ff5da'); tx(c, '0.25s', w / 2, h * 0.4, 130, '#5ff5da'); tx(c, 'about, per Google', w / 2, h * 0.8, 44, '#fff'); }), c2 = ui(2.4, 1.3, (c, w, h) => { glass(c, w, h, 40, '#ffc94a'); tx(c, '$0.10', w / 2, h * 0.4, 130, '#ffe36b'); tx(c, 'per million input tokens', w / 2, h * 0.8, 38, '#fff'); }), fr = chip('OUTPUT: FREE', '#ff5f8f', '#fff', 3.8, 0.85, 90); g.add(c1, c2, fr);
  SC.push({ g, nodes: [sw, coin, c1, c2, fr], cam: (t, d) => pathCam(t, d, [[0, [0, 4.0, 14.0], [0, 3.4, 0]], [0.5, [-1.0, 4.0, 11.6], [-0.7, 3.4, 0]], [1, [0.9, 3.9, 11.6], [0.7, 3.4, 0]]]),
    draw(t, C) { const tq = C.W(/quarter/i, 0.18), tc = C.W(/ten|cents/i, 0.55), tf = C.W(/output|free|nothing/i, 0.82);
      sw.visible = true; sw.position.set(-1.2, 4.1 + Math.sin(C.T * 1.5) * 0.06, 0); sw.scale.setScalar(0.85 * (pop(t, tq - 0.2, 0.6) || 0.0001)); hand.rotation.z = -Math.PI * 0.5 * eo((t - tq) / 0.7); sw.rotation.y = Math.sin(C.T * 0.9) * 0.2;
      coin.visible = true; coin.position.set(1.2, 4.1 + Math.sin(C.T * 1.5 + 1) * 0.06, 0); coin.scale.setScalar(0.85 * (pop(t, tc - 0.2, 0.6) || 0.0001)); coin.rotation.y = C.T * 2.2;
      c1.visible = t >= tq + 0.2; c1.position.set(-1.1, 2.5, 1.2); c1.scale.setScalar(0.78 * (pop(t, tq + 0.2, 0.4) || 0.0001)); c2.visible = t >= tc + 0.2; c2.position.set(1.1, 2.5, 1.2); c2.scale.setScalar(0.78 * (pop(t, tc + 0.2, 0.4) || 0.0001));
      fr.visible = t >= tf; fr.position.set(0, 5.6, 1.0); fr.rotation.z = -0.05; fr.scale.setScalar(pop(t, tf, 0.4) || 0.0001); TT(0, null); TT(1, null); TT(2, null); },
    sfx(C) { const tq = C.W(/quarter/i, 0.18), tc = C.W(/ten|cents/i, 0.55); return [{ t: tq, type: 'whoosh', v: 0.5 }, { t: tq + 0.7, type: 'ding', v: 0.6 }, { t: tc, type: 'sparkle', v: 0.7 }, { t: C.W(/output|free|nothing/i, 0.82), type: 'pop', v: 0.6 }]; } }); }

/* 7 THE CATCH */
{ const g = new THREE.Group(), hd = chip("GOOGLE'S OWN TESTS", '#5ff5da', '#0b0e2b', 4.4, 0.8, 56); g.add(hd);
  const bar = (col) => { const b = mesh(new THREE.BoxGeometry(1, 0.55, 0.55), M(col, col, 0.4, 0.5), 0, 0, 0); g.add(b); return b; };
  const bg = bar(0x3fe0c5), bj = bar(0xff8a4c), lg = ui(2.4, 0.6, (c, w, h) => tx(c, 'GEMINI', 10, h / 2, 76, '#fff', 'left', '#0b0e2b')), lj = ui(2.4, 0.6, (c, w, h) => tx(c, 'JEV', 10, h / 2, 76, '#fff', 'left', '#0b0e2b')); g.add(lg, lj); [lg, lj].forEach((x) => { x.visible = true; });
  const vg = ui(1, 0.8, (c, w, h, s) => tx(c, String(s === undefined ? 0 : s), w / 2, h / 2, h * 0.95, '#fff', 'center', '#0b0e2b'), { flat: true }), vj = ui(1, 0.8, (c, w, h, s) => tx(c, String(s === undefined ? 0 : s), w / 2, h / 2, h * 0.95, '#fff', 'center', '#0b0e2b'), { flat: true }); g.add(vg, vj); vg.visible = vj.visible = true;
  const lab = ui(4.4, 0.5, (c, w, h) => tx(c, 'WINS OUT OF 9 BENCHMARKS', w / 2, h / 2, 50, '#9fb4ff'), { flat: true }); g.add(lab); lab.visible = true;
  SC.push({ g, nodes: [hd, bg, bj, lg, lj, vg, vj, lab], usesMuja: true, cam: (t, d) => pathCam(t, d, [[0, [0, 4.2, 14.5], [0, 3.6, 0]], [1, [0.4, 3.9, 12.0], [0.2, 3.5, 0]]]),
    draw(t, C) { const tg = C.W(/Google/i, 0.2), ts = C.W(/seven|leads/i, 0.5), tj = C.W(/rival|Jev/i, 0.68), gv = 7 * C.tw(t, ts, ts + 0.9), jv = 2 * C.tw(t, tj, tj + 0.7), L = 3.4;
      [lg, lj, vg, vj, lab].forEach((x) => { x.visible = true; }); hd.visible = true; hd.position.set(0, 5.35, 1.0); hd.scale.setScalar(pop(t, tg, 0.5) || 0.0001); [bg, bj].forEach((b, i) => { const v = i ? jv : gv, w = Math.max(0.001, L * v / 9); b.visible = true; b.scale.set(w, 1, 1); b.position.set(-L / 2 + w / 2, i ? 2.7 : 3.7, 0.6); });
      lg.position.set(-0.5, 4.3, 0.9); lj.position.set(-0.5, 3.3, 0.9); vg.position.set(L / 2 + 0.45, 3.7, 1.0); vj.position.set(L / 2 + 0.45, 2.7, 1.0); vg.userData.redraw(Math.round(gv)); vj.userData.redraw(Math.round(jv)); lab.position.set(0, 1.95, 1.2);
      [hd, lg, lj, vg, vj, lab].forEach((x) => x.scale.setScalar(pop(t, 0.2, 0.5) || 0.0001));
      mj.pose(C.T, { x: 2.3, z: 2.0, s: 0.34 * (pop(t, tg, 0.6) || 0.0001), ry: -0.5, mood: t < tj ? 'curious' : 'smirk', talk: C.speak(t), look: -0.7, lookY: -0.3, armR: 1.4, armL: 0.4 });
      mag.visible = t >= tg + 0.2; mag.scale.setScalar(0.9 * (pop(t, tg + 0.2, 0.4) || 0.0001)); mag.position.set(0.4 + 0.5 * Math.sin(C.T * 1.2), 2.2 + 0.15 * Math.sin(C.T * 2), 1.6);
      TT(0, { text: 'THE CATCH', size: 150, y: 190, col: GOLD[0], s: pop(t, 0.05, 0.5), r: -3, sh1: GOLD[1], sh2: GOLD[2] }); TT(1, null); TT(2, null); },
    sfx(C) { return [{ t: 0.1, type: 'thump', v: 0.8 }, { t: C.W(/Google/i, 0.2), type: 'ding', v: 0.5 }, { t: C.W(/seven|leads/i, 0.5), type: 'tick', v: 0.6 }, { t: C.W(/rival|Jev/i, 0.68), type: 'tick', v: 0.6 }]; } }); }

/* 8 WHO IT IS FOR */
{ const g = new THREE.Group(), mk = (title, col, tcol, items, good, h) => ui(4.5, h, (c, w, ch, st) => { glass(c, w, ch, 50, tcol); tx(c, title, w / 2, 90, 70, tcol); items.forEach((s, i) => { const y = 200 + i * 100, on = !st || st[i]; c.globalAlpha = on ? 1 : 0; c.fillStyle = good ? '#3fe0c5' : '#ff5f8f'; c.beginPath(); c.arc(90, y, 30, 0, 7); c.fill(); c.strokeStyle = '#0b0e2b'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); if (good) { c.moveTo(76, y); c.lineTo(86, y + 12); c.lineTo(106, y - 14); } else { c.moveTo(78, y - 12); c.lineTo(102, y + 12); c.moveTo(102, y - 12); c.lineTo(78, y + 12); } c.stroke(); tx(c, s, 150, y + 4, 44, '#f2f5ff', 'left'); c.globalAlpha = 1; }); });
  const good = mk('GREAT WHEN', '#e4fbf4', '#5ff5da', ['One small decision, repeated', 'Audio, video and PDF inputs'], true, 2.1), bad = mk('SKIP IT FOR', '#ffe8ee', '#ff7a9e', ['Writing text', 'The lowest price', 'Hosting it yourself'], false, 2.5); g.add(good, bad);
  SC.push({ g, nodes: [good, bad], cam: (t, d) => pathCam(t, d, [[0, [0, 4.2, 14.2], [0, 3.4, 0]], [1, [0.3, 3.8, 12.0], [0, 3.3, 0]]]),
    draw(t, C) { const tg = C.W(/same|small|great|use/i, 0.05), tn = C.W(/skip/i, 0.5), t1 = C.W(/writing/i, 0.62), t2 = C.W(/lowest|price/i, 0.75), t3 = C.W(/servers|own|host/i, 0.88);
      good.visible = true; good.position.set(0, 4.75, 0.8); good.scale.setScalar(pop(t, tg, 0.5) || 0.0001); good.userData.redraw([t >= tg + 0.3, t >= tg + 0.8]); bad.visible = true; bad.position.set(0, 2.5, 0.8); bad.scale.setScalar(pop(t, tn, 0.5) || 0.0001); bad.userData.redraw([t >= t1, t >= t2, t >= t3]);
      good.rotation.y = Math.sin(C.T * 0.8) * 0.05; bad.rotation.y = -Math.sin(C.T * 0.8) * 0.05; TT(0, null); TT(1, null); TT(2, null); },
    sfx(C) { return [{ t: C.W(/same|small|great|use/i, 0.05), type: 'ding', v: 0.5 }, { t: C.W(/skip/i, 0.5), type: 'thump', v: 0.6 }, { t: C.W(/writing/i, 0.62), type: 'pop', v: 0.4 }, { t: C.W(/lowest|price/i, 0.75), type: 'pop', v: 0.4 }, { t: C.W(/servers|own|host/i, 0.88), type: 'pop', v: 0.4 }]; } }); }

/* 9 SIGN-OFF */
{ const g = new THREE.Group(), url = chip('aashishpandey.com/blog', '#5ff5da', '#0b0e2b', 4.4, 0.9, 58), fol = chip('FOLLOW', '#ff5f8f', '#fff', 2.6, 0.9, 110); g.add(url, fol);
  const hearts = Array.from({ length: 6 }, (_, i) => { const m = mesh(new THREE.IcosahedronGeometry(0.22, 0), M(0xff5f8f, 0xff5f8f, 0.4, 0.8)); m.scale.set(1, 0.9, 0.5); scene.add(m); m.visible = false; return m; });
  const gems = Array.from({ length: 5 }, (_, i) => { const m = mesh(new THREE.OctahedronGeometry(0.3, 0), M(i % 2 ? 0xffe36b : 0x5ff5da, i % 2 ? 0x806010 : 0x108070, 0.2)); m.scale.y = 1.5; scene.add(m); m.visible = false; return m; });
  SC.push({ g, nodes: [url, fol, ...hearts, ...gems], usesMuja: true, cam: (t, d) => pathCam(t, d, [[0, [0, 4.0, 13.5], [0, 3.2, 0]], [1, [0, 3.8, 11.5], [0, 3.2, 0]]]),
    draw(t, C) { const tb = C.W(/blog|sources/i, 0.1), tf = C.W(/follow/i, 0.35), tn = C.W(/new|tool/i, 0.55);
      url.visible = true; url.position.set(0, 4.2, 1.0); url.scale.setScalar(pop(t, tb, 0.5) || 0.0001); fol.visible = t >= tf; fol.position.set(-0.8, 3.45, 1.2); fol.scale.setScalar((pop(t, tf, 0.5) || 0.0001) * (1 + 0.03 * Math.sin(C.T * 6)));
      hearts.forEach((h, i) => { const a = tf + 0.3 + i * 0.16, p = clamp((t - a) / 1.5); h.visible = p > 0 && p < 1; h.position.set(0.9 + (i - 2.5) * 0.45 + Math.sin(C.T * 3 + i) * 0.2, 4.4 + p * 2.2, 1.5); h.rotation.y = C.T * 3; h.scale.setScalar(1.2 * (1 - 0.4 * p)); });
      gems.forEach((m, i) => { m.visible = t > 0.4; m.position.set([-2.2, 2.3, -1.8, 1.9, 0.2][i], [2.6, 3.0, 4.6, 3.2, 2.4][i] + Math.sin(C.T * 1.6 + i) * 0.15, [1, 1.5, 0.2, 0.8, 0][i]); m.rotation.y = C.T * 1.8 + i; });
      mj.pose(C.T, { x: 1.0, z: 2.0, s: 0.42 * (pop(t, 0.1, 0.8) || 0.0001), mood: 'happy', talk: C.speak(t), armR: 2.5, wave: 0.45, armL: 0.25, head: 0, hop: 0.6 });
      TT(0, { text: 'A NEW AI TOOL', size: 104, y: 170, s: pop(t, tn, 0.5), o: op(t, tn), sh1: TEAL[1], sh2: TEAL[2] }); TT(1, { text: 'EVERY DAY', size: 150, y: 310, col: GOLD[0], s: pop(t, tn + 0.2, 0.5), o: op(t, tn + 0.2), sh1: GOLD[1], sh2: GOLD[2] }); TT(2, null); },
    sfx(C) { return [{ t: C.W(/blog|sources/i, 0.1), type: 'pop', v: 0.5 }, { t: C.W(/follow/i, 0.35), type: 'ding', v: 0.6 }, { t: C.W(/new|tool/i, 0.55), type: 'sparkle', v: 0.6 }]; } }); }

SC.forEach((s) => scene.add(s.g));
// ---- driver
let CFG, S, C; const dip = document.getElementById('dip'), barI = document.querySelector('.bar i'), capEl = document.querySelector('.cap'), mkC = (cfg) => { const words = cfg.words; return { d: cfg.dur, T0: cfg.T0, words, shake: 0, W: (re, frac) => { const w = words.find((x) => re.test(x.w.replace(/[^\w'-]/g, ''))); return w ? w.t0 : (frac || 0) * cfg.dur; }, speak: (t) => { const w = words.find((x) => t >= x.t0 && t < x.t1); return w ? 0.55 + 0.45 * Math.abs(Math.sin(t * 17)) : 0; }, tw: (t, a, b) => eo((t - a) / Math.max(0.001, b - a)) }; };
window.boot = (cfg) => { CFG = cfg; S = SC[cfg.sceneIndex]; C = mkC(cfg); SC.forEach((s) => { s.nodes.forEach((n) => { n.visible = false; }); }); mj.g.visible = false; mag.visible = false; hearts_off(); };
const hearts_off = () => {};
window.sfxList = () => S.sfx(C);
window.draw = (t, opts) => {
  opts = opts || {}; const d = CFG.dur, T = CFG.T0 + t; C.T = T; C.shake = 0;
  S.nodes.forEach((n) => { n.visible = n.visible; });
  // every node starts hidden each frame so a scene only shows what it asks for
  S.draw(t, C);
  const k = pathCam(t, d, [[0, [0, 4, 14], [0, 3, 0]], [1, [0, 4, 14], [0, 3, 0]]]), cm = S.cam(t, d), sh = C.shake;
  const ZM = 1.38, ly = cm.l[1] - 0.55, px = cm.l[0] + (cm.p[0] - cm.l[0]) * ZM, py = ly + (cm.p[1] - cm.l[1]) * ZM + 0.3, pz = cm.l[2] + (cm.p[2] - cm.l[2]) * ZM; cam.position.set(px + Math.sin(T * 1.9) * 0.06 + Math.sin(T * 63) * sh, py + Math.sin(T * 1.4) * 0.05 + Math.cos(T * 71) * sh, pz); cam.lookAt(cm.l[0], ly, cm.l[2]); cam.rotation.z += Math.sin(T * 1.1) * 0.004;
  const p = dust.p; for (let i = 0; i < dust.n; i++) { p[i * 3] = (rn(i, 1) - 0.5) * 16 + Math.sin(T * 0.4 + i) * 0.6; p[i * 3 + 1] = FLOOR + ((rn(i, 2) * 9 + T * (0.15 + rn(i, 4) * 0.2)) % 9); p[i * 3 + 2] = (rn(i, 3) - 0.5) * 10; } dust.o.geometry.attributes.position.needsUpdate = true;
  renderer.render(scene, cam);
  // dip to black between scenes, progress bar and captions
  const dd = 0.3; let o = 0; if (!CFG.first && t < dd) o = 1 - eo(t / dd); else if (!CFG.last && t > d - dd) o = eo((t - (d - dd)) / dd); dip.style.opacity = o;
  barI.style.width = ((CFG.p0 + (CFG.p1 - CFG.p0) * clamp(t / d)) * 100).toFixed(2) + '%';
  const ch = CFG.chunks.find((c) => t >= c.t0 && t < c.t1) || CFG.chunks[CFG.chunks.length - 1];
  if (opts.noCaption || !ch) capEl.style.opacity = 0; else { capEl.style.opacity = 1; const html = ch.words.map((w) => { const on = t >= w.t0 && t < w.t1; return `<span class="cw" style="${on ? `transform:scale(1.08);color:#5ff5da` : ''}">${w.w}</span>`; }).join(' '); if (capEl.dataset.h !== html) { capEl.dataset.h = html; capEl.innerHTML = html; } const pp = back((t - ch.t0) / 0.26); capEl.style.transform = `translateY(${((1 - pp) * 24).toFixed(1)}px) scale(${(0.94 + 0.06 * pp).toFixed(3)})`; }
};
window.DBG = () => { const o = []; scene.traverse((n) => { if (n.isMesh && n.parent !== scene) { let v = true, q = n; while (q) { if (!q.visible) v = false; q = q.parent; } if (v) { const w = new THREE.Vector3(); n.getWorldPosition(w); o.push(n.geometry.type + ' ' + w.toArray().map((x) => x.toFixed(1)).join(',')); } } }); return { cam: cam.position.toArray(), n: o.length, sample: o.slice(0, 8) }; };
window.ready = true;
