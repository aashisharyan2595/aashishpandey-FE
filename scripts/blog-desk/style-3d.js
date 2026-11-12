#!/usr/bin/env node
// Stylized 3D low-poly CGI clip: a flat-shaded Mujasauraus on a floating island, real 3D (three.js, already in assets/vendor), orbiting camera, soft shadows, drifting low-poly clouds.
//   node scripts/blog-desk/style-3d.js <outdir> [--seconds 2]
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os'), http = require('http');
const ROOT = path.join(__dirname, '..', '..');
const out = process.argv[2]; if (!out || out.startsWith('--')) { console.error('usage: style-3d.js <outdir>'); process.exit(2); }
const i = process.argv.indexOf('--seconds'), SECONDS = i > -1 ? +process.argv[i + 1] : 2, FPS = 30, N = Math.round(SECONDS * FPS);
const sh = (c) => cp.execSync(c, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 }).toString();
const font = fs.readFileSync(path.join(ROOT, 'assets/vendor/fonts/geist-normal-latin.woff2')).toString('base64');
const PAGE = `<!doctype html><html><head><meta charset="utf-8"><style>@font-face{font-family:Geist;font-weight:100 900;src:url(data:font/woff2;base64,${font})}
*{margin:0}html,body{width:1080px;height:1920px;overflow:hidden;background:#1a1040}canvas{display:block}
.t{position:absolute;left:0;right:0;text-align:center;font-family:Geist;font-weight:900;transform-origin:50% 50%;white-space:nowrap}
#t1{top:190px;font-size:150px;color:#fff;text-shadow:0 8px 0 #ff5f8f,0 16px 0 #c2335f,0 26px 30px rgba(0,0,0,.45)}
#t2{top:352px;font-size:168px;color:#ffe36b;text-shadow:0 8px 0 #ff8a3c,0 16px 0 #c2501f,0 26px 30px rgba(0,0,0,.45)}</style></head><body>
<div id="t1" class="t">NEW AI TOOL</div><div id="t2" class="t">EVERY DAY</div>
<script type="module">
import * as THREE from '/assets/vendor/three-0.184.0/three.module.min.js';
const W = 1080, H = 1920, rn = (i, k) => { const x = Math.sin(i * 127.1 + (k || 0) * 311.7) * 43758.5453; return x - Math.floor(x); };
const ease = (x) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3), clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const back = (x) => { x = clamp(x, 0, 1); const c = 1.4; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.setPixelRatio(1); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
{ const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#1a1050'); gr.addColorStop(0.5, '#6a3bb0'); gr.addColorStop(0.8, '#ff7aa8'); gr.addColorStop(1, '#ffd08a'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; scene.background = tx; }
scene.fog = new THREE.Fog(0x8a58c8, 22, 70);
scene.add(new THREE.HemisphereLight(0xffe2ff, 0x3a2a8e, 1.1));
const sun = new THREE.DirectionalLight(0xfff0d0, 2.6); sun.position.set(6, 12, 7); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 }); sun.shadow.bias = -0.0005; scene.add(sun);
const rim = new THREE.DirectionalLight(0x6ff0d6, 1.6); rim.position.set(-7, 5, -7); scene.add(rim);
const M = (c, e, r) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: r === undefined ? 0.75 : r, metalness: 0, emissive: e || 0x000000 });
const mesh = (g, m, x, y, z) => { const o = new THREE.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; o.receiveShadow = true; return o; };
// island: jittered low-poly cylinder, grass top, rock sides
{ const g = new THREE.CylinderGeometry(7, 5.2, 2.2, 9, 3); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < 1.05) { p.setX(i, p.getX(i) * (1 + (rn(i, 1) - 0.5) * 0.18)); p.setZ(i, p.getZ(i) * (1 + (rn(i, 2) - 0.5) * 0.18)); } if (y < 0.2) p.setY(i, y - rn(i, 3) * 0.9); } g.computeVertexNormals();
  const isl = mesh(g, [M(0x8a5fd0), M(0x4fd6a0), M(0x6a47b0)], 0, -1.1, 0); isl.receiveShadow = true; scene.add(isl); const under = mesh(new THREE.ConeGeometry(4.4, 3.6, 7), M(0x5a3aa0), 0, -4.3, 0); under.rotation.x = Math.PI; scene.add(under); }
const tree = (x, z, s) => { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.8, 5), M(0x7a4a2a), 0, 0.4, 0)); [[0.9, 1.3], [0.7, 2.0], [0.5, 2.6]].forEach(([r, y]) => g.add(mesh(new THREE.ConeGeometry(r, 1.1, 6), M(0x2fbf86), 0, y, 0))); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); return g; };
[[-4.6, -1.5, 1.1], [4.8, -2.4, 1.3], [-3.2, -4.2, 0.9], [3.6, 2.2, 0.8], [-5, 2.4, 0.9], [1.8, -4.8, 1.0]].forEach((t) => tree(...t));
[[-3, 3.4, 0.5], [3.2, -0.4, 0.4], [-1.6, -3.2, 0.35]].forEach(([x, z, s]) => { const r = mesh(new THREE.DodecahedronGeometry(1, 0), M(0xb9a6ff), x, 0.2, z); r.scale.set(s * 1.3, s, s * 1.1); scene.add(r); });
// Mujasauraus in low poly
const dn = new THREE.Group(), skin = M(0xa48cff, 0x120a30), belly = M(0xfff3c4), teal = M(0x3fe0c5, 0x1fa890, 0.4), dark = M(0x16321f, 0, 0.3), white = M(0xffffff, 0x222222, 0.3), pink = M(0xff8fb0);
const body = mesh(new THREE.IcosahedronGeometry(1.15, 1), skin, 0, 1.45, 0); body.scale.set(1.12, 1, 1); dn.add(body);
const bel = mesh(new THREE.IcosahedronGeometry(0.85, 1), belly, 0, 1.3, 0.78); bel.scale.set(1, 0.95, 0.62); dn.add(bel);
const head = new THREE.Group(); head.position.set(0, 3.15, 0.1); dn.add(head);
head.add(mesh(new THREE.IcosahedronGeometry(1.08, 1), skin, 0, 0, 0)); head.add(mesh(new THREE.IcosahedronGeometry(0.55, 1), M(0xb9a6ff), 0, -0.3, 0.75)).scale.set(1, 1, 1);
[-1, 1].forEach((s) => { head.add(mesh(new THREE.IcosahedronGeometry(0.33, 1), white, s * 0.46, 0.12, 0.84)); const pu = mesh(new THREE.IcosahedronGeometry(0.19, 1), dark, s * 0.46, 0.1, 1.12); head.add(pu); head.add(mesh(new THREE.IcosahedronGeometry(0.07, 0), white, s * 0.5, 0.2, 1.28)); const ch = mesh(new THREE.IcosahedronGeometry(0.2, 0), pink, s * 0.78, -0.25, 0.7); ch.scale.set(1, 0.6, 0.4); head.add(ch); const hn = mesh(new THREE.ConeGeometry(0.2, 0.55, 5), M(0xfff3c4), s * 0.62, 0.95, 0.1); hn.rotation.z = -s * 0.5; head.add(hn); });
[-0.4, 0, 0.4].forEach((x, i) => { const c = mesh(new THREE.ConeGeometry(0.2, 0.62 + (i === 1 ? 0.2 : 0), 5), teal, x, 1.1, -0.1); c.rotation.z = -x * 0.5; head.add(c); });
const mouth = mesh(new THREE.TorusGeometry(0.26, 0.06, 4, 8, Math.PI), dark, 0, -0.5, 1.3); mouth.rotation.z = Math.PI; head.add(mouth);
for (let k = 0; k < 5; k++) { const c = mesh(new THREE.ConeGeometry(0.2, 0.58, 5), teal, 0, 2.25 - k * 0.38, -0.95 - k * 0.12); c.rotation.x = -0.9 - k * 0.1; dn.add(c); }
const tail = new THREE.Group(); tail.position.set(0, 0.9, -0.9); const tc = mesh(new THREE.ConeGeometry(0.62, 2.1, 6), skin, 0, 0, -0.9); tc.rotation.x = -Math.PI / 2 - 0.25; tail.add(tc); const tt = mesh(new THREE.ConeGeometry(0.16, 0.5, 5), teal, 0, 0.5, -1.0); tail.add(tt); dn.add(tail);
const arm = (s) => { const g = new THREE.Group(); g.position.set(s * 1.2, 2.05, 0.2); const a = mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.9, 6), skin, 0, -0.4, 0); g.add(a); g.add(mesh(new THREE.IcosahedronGeometry(0.27, 1), skin, 0, -0.9, 0)); dn.add(g); return g; };
const armL = arm(-1), armR = arm(1);
[-0.55, 0.55].forEach((x) => { dn.add(mesh(new THREE.CylinderGeometry(0.4, 0.46, 0.8, 7), skin, x, 0.4, 0.1)); const f = mesh(new THREE.IcosahedronGeometry(0.5, 1), M(0x8c72f0), x, 0.1, 0.35); f.scale.set(1, 0.5, 1.2); dn.add(f); });
scene.add(dn);
// floating crystals and low-poly clouds
const cry = []; [[-4.2, 5.4, 1.5], [4.4, 6.4, -1], [-5, 3.6, -2.6], [5.2, 4.2, 2.2]].forEach(([x, y, z], i) => { const c = mesh(new THREE.OctahedronGeometry(0.55 + (i % 2) * 0.2, 0), M(i % 2 ? 0xff8fb0 : 0x6ff0d6, i % 2 ? 0x802040 : 0x108070, 0.2), x, y, z); c.scale.y = 1.5; scene.add(c); cry.push(c); });
const clouds = []; for (let i = 0; i < 6; i++) { const g = new THREE.Group(); for (let k = 0; k < 4; k++) { const b = mesh(new THREE.IcosahedronGeometry(1 + rn(i, k) * 0.7, 1), M(0xfff0f6, 0x442244, 1), k * 1.3 - 2, rn(i, k + 5) * 0.6, 0); b.scale.y = 0.65; g.add(b); } g.position.set(-14 + i * 6 + rn(i, 8) * 3, 1 + rn(i, 9) * 6 - 4, -12 - rn(i, 7) * 8); g.userData = { v: 0.4 + rn(i, 6) * 0.5 }; scene.add(g); clouds.push(g); }
{ const pts = new Float32Array(300); for (let i = 0; i < 100; i++) { pts[i * 3] = (rn(i, 1) - 0.5) * 90; pts[i * 3 + 1] = 6 + rn(i, 2) * 30; pts[i * 3 + 2] = -30 - rn(i, 3) * 30; } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pts, 3)); scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.25, fog: false }))); }
const cam = new THREE.PerspectiveCamera(36, W / H, 0.1, 200);
window.frame = (t) => {
  const hop = Math.abs(Math.sin(t * Math.PI * 1.15)), land = Math.max(0, 1 - hop * 6);
  dn.position.y = hop * 0.55; dn.scale.set(1 + 0.07 * land, 1 - 0.09 * land, 1 + 0.07 * land); dn.rotation.y = Math.sin(t * 2.2) * 0.12;
  const pop = back(t / 0.5); dn.scale.multiplyScalar(pop);
  head.rotation.z = Math.sin(t * 5) * 0.07; head.rotation.x = -0.05 + Math.sin(t * 4.3) * 0.03; armR.rotation.z = -2.5 + Math.sin(t * 12) * 0.45; armL.rotation.z = 0.35 + Math.sin(t * 5) * 0.05; tail.rotation.y = Math.sin(t * 9) * 0.5;
  cry.forEach((c, i) => { c.position.y += Math.sin(t * 3 + i) * 0.004; c.rotation.y = t * 1.6 + i; }); clouds.forEach((c) => { c.position.x += 0.01 * c.userData.v; });
  const a = -0.55 + 0.9 * (t / 2), r = 19 - 2.5 * ease(t / 1.6), hy = 4.6 - 0.6 * ease(t / 1.6);
  cam.position.set(Math.sin(a) * r + Math.sin(t * 2.1) * 0.05, hy + Math.sin(t * 1.7) * 0.05, Math.cos(a) * r); cam.lookAt(0, 1.7, 0);
  document.getElementById('t1').style.transform = 'scale(' + (0.4 + 0.6 * back((t - 0.05) / 0.35)).toFixed(3) + ') rotate(' + (-3 * (1 - ease(t / 0.4))).toFixed(2) + 'deg)'; document.getElementById('t2').style.transform = 'scale(' + (t > 0.2 ? 0.4 + 0.6 * back((t - 0.2) / 0.35) : 0).toFixed(3) + ')';
  renderer.render(scene, cam);
};
window.ready = true;
</script></body></html>`;
(async () => {
  const srv = http.createServer((req, res) => { if (req.url === '/') { res.setHeader('content-type', 'text/html'); return res.end(PAGE); } const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.statusCode = 404; return res.end(); } res.setHeader('content-type', f.endsWith('.js') ? 'text/javascript' : 'application/octet-stream'); fs.createReadStream(f).pipe(res); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port;
  let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(sh('npm root -g').trim() + '/playwright')); }
  const browser = await chromium.launch(Object.assign({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] }, fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}));
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } }); page.on('pageerror', (e) => console.error('PAGE ERROR', e.message)); page.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/`); await page.waitForFunction(() => window.ready, null, { timeout: 60000 }); await page.evaluate(() => document.fonts.ready);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'style3d-')); fs.mkdirSync(out, { recursive: true });
  for (let k = 0; k < N; k++) { await page.evaluate((t) => window.frame(t), k / FPS); await page.screenshot({ path: path.join(dir, `f${String(k).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 }); }
  await page.screenshot({ path: path.join(out, 'style-3d-poster.jpg'), type: 'jpeg', quality: 92 });
  await browser.close(); srv.close();
  sh(`ffmpeg -y -framerate ${FPS} -i "${path.join(dir, 'f%04d.jpg')}" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart "${path.join(out, 'style-3d.mp4')}"`); console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });
