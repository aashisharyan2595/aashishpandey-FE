import * as THREE from 'https://unpkg.com/three@0.184.0/build/three.module.js';

const L = 1400, Z0 = 20, NSTOP = 8;
export const zAt = t => Z0 - t * L;
export const roadX = z => 38 * Math.sin(z * 0.011) + 16 * Math.sin(z * 0.027 + 1.3);
export const roadY = z => 5 * Math.sin(z * 0.005 + 0.5) + 2.5 * Math.sin(z * 0.013);
const ZEND = zAt(1);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sstep = (a, b, v) => { const x = clamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;
const trailMix = z => sstep(0.465, 0.535, clamp((Z0 - z) / L, 0, 1));
const roadW = z => lerp(3.4, 1.9, trailMix(z));
function h2(x, y) { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return lerp(lerp(h2(xi, yi), h2(xi + 1, yi), u), lerp(h2(xi, yi + 1), h2(xi + 1, yi + 1), u), v); }
function fbm(x, y) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s / 0.9375; }
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);
const pick = a => a[Math.floor(rnd() * a.length)];

const ZL = zAt(7 / 8) - 16;
const LAKE = { x: roadX(ZL) + 66, z: ZL, r: 42 }; LAKE.y = roadY(ZL) - 1.3;
const FIRE = { x: roadX(ZEND - 11), z: ZEND - 11 };
const DZ2 = zAt(0.42), DESERT = { x: roadX(DZ2) + 150, z: DZ2 - 10, r: 48 };
const clearZones = [];
let hFast = null;

function H(x, z) {
  const rx = roadX(z), ry = roadY(clamp(z, ZEND - 40, Z0 + 140));
  const sl = (roadX(z + 0.5) - roadX(z - 0.5));
  let d = Math.abs(x - rx) / Math.sqrt(1 + sl * sl);
  if (z < ZEND - 55) d += (ZEND - 55 - z) * 1.1;
  let nat = (fbm(x * 0.012 + 5, z * 0.012) - 0.45) * 20 + (fbm(x * 0.05, z * 0.05) - 0.5) * 3;
  const m = sstep(45, 230, d); nat += m * m * 105 * (0.4 + fbm(x * 0.005 + 9, z * 0.005));
  let k = sstep(6, 28, d);
  const dc = Math.hypot(x - FIRE.x, z - FIRE.z); k = Math.min(k, sstep(13, 30, dc));
  let h = ry - 0.45 + k * nat;
  const dl = Math.hypot(x - LAKE.x, z - LAKE.z);
  if (dl < LAKE.r * 1.5) h = lerp(h, LAKE.y - 3.5, 1 - sstep(LAKE.r * 0.72, LAKE.r * 1.45, dl));
  const dd = Math.hypot(x - DESERT.x, z - DESERT.z);
  if (dd < DESERT.r * 1.4) { const dune = (fbm(x * 0.02 + 40, z * 0.02) - 0.5) * 7 + (fbm(x * 0.09, z * 0.09) - 0.5) * 1.6; h = lerp(h, ry - 1 + dune, 1 - sstep(DESERT.r * 0.75, DESERT.r * 1.35, dd)); }
  return h;
}
function frame(z) {
  const dx = roadX(z - 0.5) - roadX(z + 0.5), dy = roadY(z - 0.5) - roadY(z + 0.5);
  const f = new THREE.Vector3(dx, 0, -1).normalize();
  return { f, r: new THREE.Vector3(-f.z, 0, f.x), slope: dy };
}
function roadDist(x, z) {
  if (z < ZEND - 4 || z > Z0 + 150) return 1e9;
  let d = 1e9; for (let dz = -14; dz <= 14; dz += 1) { const zz = z + dz; if (zz < ZEND - 4) continue; d = Math.min(d, Math.hypot(x - roadX(zz), dz)); } return d;
}
function okSpot(x, z, minRoad) {
  if (roadDist(x, z) < minRoad) return false;
  if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 3) return false;
  if (Math.hypot(x - FIRE.x, z - FIRE.z) < 15) return false;
  for (const c of clearZones) if (Math.hypot(x - c.x, z - c.z) < c.r) return false;
  if (Math.hypot(x - DESERT.x, z - DESERT.z) < DESERT.r * 1.3) return false;
  return true;
}
function groundY(x, z) {
  let y = (hFast || H)(x, z);
  if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r * 1.4) y = Math.max(y, LAKE.y - 0.3);
  if (roadDist(x, z) < roadW(z) + 0.1) y = Math.max(y, roadY(clamp(z, ZEND - 6, Z0 + 140)) + 0.04);
  return y;
}
function glowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createWorld(host, opts = {}) {
  const lp = !!opts.lowPower;
  const GUIDE = [
    { t: 0.04, text: "I'm MujaSauros. I ride pillion and I know this road \u2014 follow the glowing notes along the way.", mood: 'curious' },
    { t: 0.3, text: "Docks and quiet code live in these hills. Keep going.", mood: 'curious' },
    { t: 0.5, text: 'The trail thins here \u2014 dirt roads mean fewer people, better views.', mood: 'thrilled' },
    { t: 0.68, text: 'Almost at the lake. I might jump off for a swim if you stop too long.', mood: 'playful' },
    { t: 0.85, text: 'Water ahead. Slow down, it\u2019s worth it.', mood: 'curious' },
    { t: 0.95, text: 'Fire\u2019s just up there. That\u2019s the end of the road \u2014 for now.', mood: 'sleepy' }
  ].map(g => ({ ...g, fired: false }));
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: !lp, powerPreference: 'high-performance' });
  } catch (e) { opts.onError && opts.onError(e); return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lp ? 1 : 2));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = !lp; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement; canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;outline:none';
  host.appendChild(canvas);

  // Post-process: vignette + grain + subtle color grade (cinematic still-frame look)
  const postRT = new THREE.WebGLRenderTarget(1, 1, { colorSpace: THREE.SRGBColorSpace, samples: lp ? 0 : 4 });
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postU = { map: { value: postRT.texture }, time: { value: 0 }, night: { value: 0 } };
  const postMat = new THREE.ShaderMaterial({ uniforms: postU, depthWrite: false, depthTest: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
    fragmentShader: `uniform sampler2D map; uniform float time,night; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
      void main(){ vec3 c=texture2D(map,vUv).rgb; c=pow(c,vec3(0.72))*1.12;
        float lum=dot(c,vec3(0.299,0.587,0.114)); c=mix(vec3(lum),c,1.16);
        vec2 ce=vUv-0.5; float vig=1.0-smoothstep(0.46,1.02,length(ce))*0.3; c*=vig;
        float g=(hash(vUv*vec2(1920.0,1080.0)+time)-0.5)*0.018; c+=g;
        c=mix(c,c*vec3(1.05,0.99,0.93),0.3*(1.0-night)); c=mix(c,c*vec3(0.95,0.98,1.06),0.28*night);
        c=(c-0.5)*1.12+0.5;
        gl_FragColor=vec4(c,1.0); }` });
  const postScene = new THREE.Scene(); postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));
  const resizePost = () => { const pr = renderer.getPixelRatio(); postRT.setSize(Math.max(1, host.clientWidth * pr), Math.max(1, host.clientHeight * pr)); };
  resizePost();

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe0976f, 50, 560);
  const camera = new THREE.PerspectiveCamera(52, host.clientWidth / host.clientHeight, 0.1, 4000);
  const GT = glowTex();
  const mk = (geo, mat, name) => { const m = new THREE.Mesh(geo, mat); m.name = name || ''; return m; };
  const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.9, metalness: 0, ...o });
  const glowSprite = (col, s, op = 1) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GT, color: col, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: op, fog: false })); sp.scale.setScalar(s); return sp; };
  const glows = []; // {sprite, base, night}

  // Sky
  const skyU = { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, moonDir: { value: new THREE.Vector3(0.74, 0.3, -0.6).normalize() }, night: { value: 0 }, time: { value: 0 } };
  const sky = mk(new THREE.SphereGeometry(1800, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 top,mid,hor,sunDir,moonDir; uniform float night,time; varying vec3 vD;
      float hs(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
      void main(){ vec3 d=normalize(vD); float h=d.y;
        vec3 c=mix(hor,mid,smoothstep(-0.03,0.2,h)); c=mix(c,top,smoothstep(0.18,0.75,h));
        float s=max(dot(d,normalize(sunDir)),0.); c+=vec3(1.,.62,.3)*(pow(s,900.)*3.+pow(s,14.)*.35)*(1.-night);
        float m=dot(d,moonDir); c=mix(c,vec3(.96,.95,.9),smoothstep(.99955,.9997,m)*night); c+=vec3(.35,.45,.8)*pow(max(m,0.),40.)*.35*night;
        vec3 p=d*260.; vec3 ce=floor(p); float r=hs(ce); vec3 fp=fract(p)-.5;
        float st=step(.992,r)*smoothstep(.22,.02,length(fp))*smoothstep(0.02,.35,h); st*=.6+.4*sin(time*2.+r*80.);
        c+=vec3(.9,.95,1.)*st*night*1.6;
        vec3 p2=d*560.; vec3 ce2=floor(p2); float r2=hs(ce2+vec3(11.3,4.7,9.1)); vec3 fp2=fract(p2)-.5;
        float st2=step(.986,r2)*smoothstep(.3,.03,length(fp2))*smoothstep(0.02,.35,h);
        c+=vec3(.85,.9,1.)*st2*night*0.5;
        float band=pow(max(1.0-abs(dot(d,normalize(vec3(0.32,0.5,0.8)))),0.0),3.5);
        c+=vec3(.55,.62,.78)*band*0.16*night;
        gl_FragColor=vec4(c,1.); }`
  }), 'sky');
  scene.add(sky);

  // Sun / moon flares
  const sunFlare = new THREE.Group(); sunFlare.name = 'sun-flare';
  const sunCore = glowSprite('#fff2d8', 26, 1); const sunRing = glowSprite('#ffb066', 60, 0.4); const sunStreak = glowSprite('#ffe6b8', 1, 0.22); sunStreak.scale.set(340, 5, 1); sunFlare.add(sunRing, sunCore, sunStreak); scene.add(sunFlare);
  const moonFlare = new THREE.Group(); moonFlare.name = 'moon-flare';
  const moonCore = glowSprite('#eaf2ff', 12, 1); const moonHalo = glowSprite('#9db4ff', 30, 0.3); moonFlare.add(moonHalo, moonCore); scene.add(moonFlare);
  const camFwd = new THREE.Vector3();

  // Lights
  const hemi = new THREE.HemisphereLight(0xffd6a8, 0x3b2f4a, 2.15); scene.add(hemi);
  const ambientFill = new THREE.AmbientLight(0xdfe8ff, 0.62); scene.add(ambientFill);
  const key = new THREE.DirectionalLight(0xffb070, 3.6); key.castShadow = !lp;
  key.shadow.mapSize.set(lp ? 1024 : 2048, lp ? 1024 : 2048); Object.assign(key.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 140 }); key.shadow.bias = -0.0004; key.shadow.radius = 2.2;
  scene.add(key); scene.add(key.target);

  // Studio-gradient environment map for realistic reflections on chrome/gloss/water
  if (!lp) {
    const pmrem = new THREE.PMREMGenerator(renderer); pmrem.compileEquirectangularShader();
    const envCanvas = document.createElement('canvas'); envCanvas.width = 16; envCanvas.height = 128;
    const ectx = envCanvas.getContext('2d'); const eg = ectx.createLinearGradient(0, 0, 0, 128);
    eg.addColorStop(0, '#bcd6ff'); eg.addColorStop(0.45, '#f2ddc4'); eg.addColorStop(0.62, '#caa77a'); eg.addColorStop(1, '#2a2018');
    ectx.fillStyle = eg; ectx.fillRect(0, 0, 16, 128);
    const envTex = new THREE.CanvasTexture(envCanvas); envTex.mapping = THREE.EquirectangularReflectionMapping; envTex.colorSpace = THREE.SRGBColorSpace;
    const envRT = pmrem.fromEquirectangular(envTex); scene.environment = envRT.texture; envTex.dispose(); pmrem.dispose();
  }

  // Terrain
  const TX0 = -300, TX1 = 300, TZ0 = 150, TZ1 = ZEND - 230;
  const sx = lp ? 90 : 150, sz = lp ? 270 : 440;
  let tg = new THREE.PlaneGeometry(TX1 - TX0, TZ0 - TZ1, sx, sz); tg.rotateX(-Math.PI / 2); tg.translate(0, 0, (TZ0 + TZ1) / 2);
  const cx = (TX1 - TX0) / sx, cz = (TZ0 - TZ1) / sz; let p = tg.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) + (h2(i, 3) - 0.5) * cx * 0.7, z = p.getZ(i) + (h2(i, 9) - 0.5) * cz * 0.7; p.setXYZ(i, x, H(x, z), z); }
  tg = tg.toNonIndexed(); tg.computeVertexNormals(); p = tg.attributes.position;
  const nrm = tg.attributes.normal; const col = new Float32Array(p.count * 3); const C = new THREE.Color();
  const GR = ['#5f7d3a', '#6b8a3f', '#52703a', '#7a9446', '#4a6a36'].map(c => new THREE.Color(c));
  const MOSS = ['#3c5a36', '#35513a', '#466638'].map(c => new THREE.Color(c));
  const ROCK = ['#6f6a66', '#5f5b58', '#7c766e'].map(c => new THREE.Color(c));
  const DIRT = ['#8a6a44', '#7b5d3b', '#94744a'].map(c => new THREE.Color(c));
  const HAZE = new THREE.Color('#b58a9a'), SAND = new THREE.Color('#a39068'), SNOW = new THREE.Color('#dfe3ee'), GRAVEL = new THREE.Color('#6a655f');
  for (let i = 0; i < p.count; i += 3) {
    const X = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, Y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, Z = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
    const ny = nrm.getY(i), rel = Y - roadY(clamp(Z, ZEND - 40, Z0 + 140)), dR = Math.abs(X - roadX(Z)), hh = h2(i, 77);
    const prog = clamp((Z0 - Z) / L, 0, 1), dl = Math.hypot(X - LAKE.x, Z - LAKE.z);
    const ddz = Math.hypot(X - DESERT.x, Z - DESERT.z);
    if (dl < LAKE.r * 1.25 && Y < LAKE.y + 0.9) C.copy(SAND);
    else if (ddz < DESERT.r * 1.3) { C.copy(SAND); C.lerp(new THREE.Color('#e8c07d'), 0.55); if (h2(i, 21) < 0.14) C.copy(ROCK[Math.floor(hh * 3)]).lerp(new THREE.Color('#b3703f'), 0.5); }
    else if (Z < ZEND - 40) C.copy(ROCK[Math.floor(hh * 3)]).multiplyScalar(0.85 + hh * 0.3);
    else if (dR < 5.8 && Z > ZEND - 26) { C.copy(DIRT[Math.floor(hh * 3)]); C.lerp(GRAVEL, 1 - trailMix(Z)); }
    else if (rel > 80 && ny > 0.6) C.copy(SNOW);
    else if (ny < 0.74 || rel > 50) C.copy(ROCK[Math.floor(hh * 3)]);
    else { C.copy(GR[Math.floor(hh * 5)]); if (h2(i, 5) < prog * 0.8) C.lerp(MOSS[Math.floor(hh * 3)], 0.7); }
    C.multiplyScalar(0.92 + h2(i, 13) * 0.16); { const l = (C.r + C.g + C.b) / 3; C.r = l + (C.r - l) * 1.14; C.g = l + (C.g - l) * 1.14; C.b = l + (C.b - l) * 1.14; }
    C.multiplyScalar(0.96 + fbm(X * 0.85 + 3, Z * 0.85) * 0.09);
    C.lerp(HAZE, clamp((Y - roadY(clamp(Z, ZEND, Z0))) / 150, 0, 0.38));
    for (let k = 0; k < 3; k++) { col[(i + k) * 3] = C.r; col[(i + k) * 3 + 1] = C.g; col[(i + k) * 3 + 2] = C.b; }
  }
  tg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const CH = 110, chunks = [];
  { const tp = tg.attributes.position.array, tn = tg.attributes.normal.array, tc = tg.attributes.color.array, B = new Map();
    for (let i = 0; i < tp.length; i += 9) { const k = Math.floor((TZ0 - (tp[i + 2] + tp[i + 5] + tp[i + 8]) / 3) / CH); let b = B.get(k); if (!b) B.set(k, b = { p: [], n: [], c: [] }); for (let j = 0; j < 9; j++) { b.p.push(tp[i + j]); b.n.push(tn[i + j]); b.c.push(tc[i + j]); } }
    const tmat = std(0xffffff, { vertexColors: true }); B.forEach(b => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3)); g.computeBoundingSphere(); const m = mk(g, tmat, 'terrain-chunk'); m.receiveShadow = !lp; scene.add(m); }); tg.dispose(); }
  { const HS = 3, HW = Math.floor((TX1 - TX0) / HS) + 2, HD = Math.floor((TZ0 - TZ1) / HS) + 2, HF = new Float32Array(HW * HD);
    for (let j = 0; j < HD; j++) for (let i = 0; i < HW; i++) HF[j * HW + i] = H(TX0 + i * HS, TZ1 + j * HS);
    hFast = (x, z) => { const gx = clamp((x - TX0) / HS, 0, HW - 1.001), gz = clamp((z - TZ1) / HS, 0, HD - 1.001), i = gx | 0, j = gz | 0, u = gx - i, v = gz - j, o = j * HW + i; return lerp(lerp(HF[o], HF[o + 1], u), lerp(HF[o + HW], HF[o + HW + 1], u), v); }; }

  // Road
  { const pos = [], idx = [], cols = [], ASP = new THREE.Color('#34313a'), DRT = new THREE.Color('#6e5236'), SH = new THREE.Color('#4a4038'), cc = new THREE.Color(); let n = 0;
    const OFF = [-1.15, -1, 0, 1, 1.15], DY = [-0.55, 0, 0, 0, -0.55];
    for (let z = Z0 + 140; z >= ZEND - 6; z -= 2) { const { r } = frame(z), x = roadX(z), y = roadY(z) + 0.04, w = roadW(z), m = trailMix(z);
      for (let k = 0; k < 5; k++) { const j = k === 2 ? (h2(n, 7) - 0.5) * 0.7 * m : 0, o = OFF[k] * w + (k === 0 ? -0.2 : k === 4 ? 0.2 : 0) + j; pos.push(x + r.x * o, y + DY[k] + (k === 2 ? 0.03 * m : 0), z + r.z * o);
        cc.copy(k === 0 || k === 4 ? SH : ASP).lerp(DRT, k === 0 || k === 4 ? m * 0.6 : m).multiplyScalar(1 + (h2(n, k + 5) - 0.5) * 0.2 * (0.3 + m)); cols.push(cc.r, cc.g, cc.b); }
      if (n) for (let c = 0; c < 4; c++) { const a = 5 * (n - 1) + c, b = 5 * n + c; idx.push(a, a + 1, b, a + 1, b + 1, b); } n++; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.setIndex(idx); g.computeVertexNormals();
    const road = mk(g, std('#ffffff', { vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }), 'road'); road.receiveShadow = !lp; scene.add(road);
    for (const sd of [-1, 1]) { const ep = [], ei = []; let q = 0; for (let z = Z0 + 140; z >= zAt(0.43); z -= 2) { const { r } = frame(z), x = roadX(z), y = roadY(z) + 0.07, w = roadW(z) - 0.3; ep.push(x + r.x * sd * w, y, z + r.z * sd * w, x + r.x * sd * (w + 0.13), y, z + r.z * sd * (w + 0.13)); if (q) ei.push(2 * q - 2, 2 * q - 1, 2 * q, 2 * q - 1, 2 * q + 1, 2 * q); q++; }
      const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.Float32BufferAttribute(ep, 3)); eg.setIndex(ei); scene.add(mk(eg, new THREE.MeshBasicMaterial({ color: '#e8dcc0', side: THREE.DoubleSide }), 'edge-line')); }
    { const pz = []; for (let z = Z0 + 120; z > zAt(0.4); z -= 14) pz.push(z);
      const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 1.2, 0.1).translate(0, 0.6, 0), std('#e9e4da'), pz.length * 2), refl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.11, 0.12, 0.11), new THREE.MeshBasicMaterial({ color: '#ff9a3a' }), pz.length * 2); posts.name = 'road-posts'; refl.name = 'reflectors'; const o = new THREE.Object3D(); let q = 0;
      pz.forEach(z => [-1, 1].forEach(sd => { const { r } = frame(z), w = roadW(z) + 1, x = roadX(z) + r.x * sd * w, zz = z + r.z * sd * w; o.position.set(x, roadY(z) - 0.4, zz); o.updateMatrix(); posts.setMatrixAt(q, o.matrix); o.position.y += 1.08; o.updateMatrix(); refl.setMatrixAt(q++, o.matrix); }));
      scene.add(posts, refl); }
    const zs = []; for (let z = Z0 + 130; z > zAt(0.37); z -= 8) zs.push(z);
    const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.02, 2.4), new THREE.MeshBasicMaterial({ color: '#ffffff' }), zs.length); dash.name = 'lane-dashes';
    const o = new THREE.Object3D(); zs.forEach((z, i) => { const { f } = frame(z); o.position.set(roadX(z), roadY(z) + 0.06, z); o.rotation.set(0, Math.atan2(-f.x, -f.z), 0); o.updateMatrix(); dash.setMatrixAt(i, o.matrix); dash.setColorAt(i, new THREE.Color(z < zAt(2 / NSTOP) + 24 ? '#f2c230' : '#d8c79c')); });
    scene.add(dash); }

  // Landmarks
  const sZ = i => zAt(i / NSTOP), side = [0, 1, -1, 1, -1, 1, -1, 1, 0];
  const at = (i, off, dz = 0) => { const z = sZ(i) + dz, x = roadX(z) + side[i] * off; return new THREE.Vector3(x, H(x, z), z); };
  const wood = std('#6b4a33'), darkWood = std('#3e2c22'), stone = std('#77716b'), warmBasic = new THREE.MeshBasicMaterial({ color: '#ffc36b', fog: false });
  const anim = [], progFx = [], typeQ = [];
  const worldType = (lines, z, opt = {}) => { const c = document.createElement('canvas'); c.width = 1024; c.height = opt.vertical ? 256 : 1024; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const draw = () => { const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.fillStyle = opt.color || 'rgba(246,236,218,.92)'; g.textAlign = 'center'; g.textBaseline = 'middle'; const n = lines.length;
      lines.forEach((l, i) => { g.save(); g.translate(512, c.height * (i + 0.5) / n); g.scale(1, opt.stretch || 2.7); g.font = (opt.font || 'italic 500') + ' ' + (opt.size || 124) + 'px "Cormorant Garamond", Georgia, serif'; if (opt.track) g.letterSpacing = opt.track; g.fillText(l, 0, 0); g.restore(); }); tex.needsUpdate = true; };
    draw(); typeQ.push(draw);
    const { f } = frame(z), yaw = Math.atan2(-f.x, -f.z), w = opt.w || roadW(z) * 1.85, d = opt.d || 12;
    const m = mk(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }), 'world-type');
    if (opt.vertical) { m.position.copy(opt.pos); m.rotation.set(0, yaw, 0); }
    else { const yN = roadY(z + d / 2), yF = roadY(z - d / 2); m.rotation.set(-Math.PI / 2 + Math.atan2(yF - yN, d), yaw, 0, 'YXZ'); m.position.set(roadX(z), roadY(z) + 0.1, z); m.renderOrder = 2; }
    scene.add(m); return m; };
  // 1 · ten lanterns, nine lit
  for (let k = 0; k < 10; k++) { const v = at(1, 5.4, 9 - k * 2.3); const post = mk(new THREE.CylinderGeometry(0.05, 0.06, 1.8, 6), darkWood, 'lantern-post'); post.position.set(v.x, v.y + 0.9, v.z); scene.add(post);
    const lit = k !== 9, darkM = std('#3a3430'); const lan = mk(new THREE.BoxGeometry(0.26, 0.32, 0.26), darkM, 'lantern'); lan.position.set(v.x, v.y + 1.95, v.z); scene.add(lan);
    if (lit) { const g = glowSprite('#ffb45a', 2.6, 0.9); g.position.copy(lan.position); scene.add(g); const gl = { s: g, base: 0.35, n: 0.95, on: 0 }; glows.push(gl); const th = 1 / NSTOP - 0.055 + 0.05 * (k / 8);
      progFx.push(tt => { const on = tt > th; lan.material = on ? warmBasic : darkM; gl.on += ((on ? 1 : 0) - gl.on) * 0.1; g.visible = gl.on > 0.02; g.scale.setScalar(2.6 * gl.on + 0.01); }); } }
  worldType(['Nine lanterns,', 'still burning.'], sZ(1) + 17);
  clearZones.push({ ...at(1, 7), r: 16 });
  // 2 · cairn + flag
  const solids = [];
  { const v = at(2, 8); for (let k = 0; k < 6; k++) { const s = mk(new THREE.DodecahedronGeometry(1, 0), stone, 'cairn-stone'); const sc = 1.1 - k * 0.15; s.scale.set(sc, sc * 0.45, sc); s.position.set(v.x, v.y + 0.3 + k * 0.62 * (1 - k * 0.04), v.z); s.rotation.y = k; s.castShadow = !lp; scene.add(s); }
    const pole = mk(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 5), darkWood, 'flag-pole'); pole.position.set(v.x, v.y + 4.4, v.z); scene.add(pole);
    const flag = mk(new THREE.BoxGeometry(0.02, 0.5, 0.8), std('#c8312e'), 'flag'); flag.position.set(v.x, v.y + 5.3, v.z - 0.42); scene.add(flag); anim.push(t => { flag.rotation.y = Math.sin(t * 2.2) * 0.25; });
    solids.push({ x: v.x, z: v.z, r: 1.3 });
    clearZones.push({ x: v.x, z: v.z, r: 7 }); }
  // 3 · great tree with 4 orbs (1× → 4×)
  { const v = at(3, 11); const tr = mk(new THREE.CylinderGeometry(0.35, 0.6, 7, 7), wood, 'nest-trunk'); tr.position.set(v.x, v.y + 3.5, v.z); scene.add(tr);
    const cr = mk(new THREE.IcosahedronGeometry(4.6, 0), std('#4f7a3a'), 'nest-crown'); cr.position.set(v.x, v.y + 8.6, v.z); cr.castShadow = !lp; scene.add(cr);
    [0.22, 0.32, 0.42, 0.55].forEach((r, k) => { const o = mk(new THREE.IcosahedronGeometry(r, 1), warmBasic, 'nest-orb'); const a = k * 1.6 + 0.4; o.position.set(v.x + Math.cos(a) * 3.4, v.y + 5.4 - k * 0.2, v.z + Math.sin(a) * 3.4); scene.add(o); const g = glowSprite('#ffcf7a', r * 9, 0.9); g.position.copy(o.position); scene.add(g); glows.push({ s: g, base: 0.3, n: 1 }); anim.push(t => { o.position.y = v.y + 5.4 - k * 0.2 + Math.sin(t * 1.3 + k) * 0.15; g.position.y = o.position.y; }); });
    const orbs = scene.children.filter(o => o.name === 'nest-orb'), og = glows.slice(-4);
    progFx.push(tt => { const g = sstep(3 / NSTOP - 0.06, 3 / NSTOP - 0.008, tt), s = 0.2 + 0.8 * g; tr.scale.setScalar(s); tr.position.y = v.y + 3.5 * s; cr.scale.setScalar(s); cr.position.y = v.y + 8.6 * s; orbs.forEach((o, k) => { const on = g > 0.55 + k * 0.12; o.visible = on; og[k].s.visible = on; }); });
    clearZones.push({ x: v.x, z: v.z, r: 8 }); }
  worldType(['100K → 400K'], sZ(3) + 17, { size: 150 });
  { const z = sZ(2) + 24, { f, r } = frame(z), w = roadW(z) + 0.8, y = roadY(z), yaw = Math.atan2(-f.x, -f.z), red = std('#b3202a'), white = std('#efe8dc');
    [-1, 1].forEach(sd => { const p = mk(new THREE.BoxGeometry(0.22, 4.8, 0.22), white, 'border-post'); p.position.set(roadX(z) + r.x * sd * w, y + 2, z + r.z * sd * w); p.castShadow = !lp; scene.add(p); });
    const bar = mk(new THREE.BoxGeometry(w * 2 + 0.5, 0.6, 0.18), red, 'border-bar'); bar.position.set(roadX(z), y + 4.2, z); bar.rotation.y = yaw; scene.add(bar);
    worldType(['CANADA'], z, { vertical: true, w: w * 1.5, d: w * 0.375, font: '600', size: 150, stretch: 1, track: '28px', color: '#fff6ea', pos: new THREE.Vector3(roadX(z) - f.x * 0.12, y + 4.2, z - f.z * 0.12) }); }
  worldType(['A flag in', 'new ground.'], sZ(2) + 11);
  // 4 · four standing stones
  [1.6, 2.3, 3.0, 3.8].forEach((h, k) => { const v = at(4, 7.5, 6 - k * 4); const s = mk(new THREE.BoxGeometry(0.9, h, 0.6, 1, 2, 1), stone, 'menhir'); s.position.set(v.x, v.y + h / 2 - 0.1, v.z); s.rotation.set(0, k * 0.4, (h2(k, 1) - 0.5) * 0.12); s.castShadow = !lp; scene.add(s); solids.push({ x: v.x, z: v.z, r: 0.6 });
  });
  clearZones.push({ ...at(4, 8), r: 14 });
  // 4 · the fork: the highway carries on straight, the trail turns off
  { const z0 = sZ(4) + 26, { f, r } = frame(z0), x0 = roadX(z0), pos = [], idx = [], cols = [], A = new THREE.Color('#34313a'), cc = new THREE.Color(); let n = 0;
    for (let s2 = 0; s2 <= 300; s2 += 4) { const cx = x0 + f.x * s2, cz = z0 + f.z * s2, lift = s2 < 30 ? 0.03 : 0.22;
      for (let k = -1; k <= 1; k += 2) { const x = cx + r.x * 3.4 * k, z = cz + r.z * 3.4 * k; pos.push(x, Math.max(H(x, z), s2 < 30 ? roadY(z0) : -1e9) + lift, z); cc.copy(A).multiplyScalar(0.9 + h2(n, k + 3) * 0.2); cols.push(cc.r, cc.g, cc.b); }
      if (n) idx.push(2 * n - 2, 2 * n - 1, 2 * n, 2 * n - 1, 2 * n + 1, 2 * n); clearZones.push({ x: cx, z: cz, r: 6.5 }); n++; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.setIndex(idx); g.computeVertexNormals();
    const hw = mk(g, std('#ffffff', { vertexColors: true, side: THREE.DoubleSide }), 'highway-continues'); hw.receiveShadow = !lp; scene.add(hw);
    const sx = x0 + f.x * 14 + r.x * 5.2, sz = z0 + f.z * 14 + r.z * 5.2, sy = H(sx, sz);
    const po = mk(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 5), darkWood, 'fork-sign-post'); po.position.set(sx, sy + 1.2, sz); scene.add(po);
    const bd = mk(new THREE.BoxGeometry(1.5, 0.4, 0.06), std('#2f6b4a'), 'fork-sign'); bd.position.set(sx, sy + 2.2, sz); bd.rotation.y = Math.atan2(-f.x, -f.z) + Math.PI / 2; scene.add(bd); }
  // 6 · workshop shed, blinking homelab rack, RC car
  { const v = at(6, 11); const shed = new THREE.Group(); shed.name = 'workshop'; shed.position.copy(v); shed.rotation.y = Math.atan2(-(roadX(v.z) - v.x), 0) * 0.4; solids.push({ x: v.x, z: v.z, r: 2 });
    const body = mk(new THREE.BoxGeometry(3.2, 2.4, 2.6), wood, 'shed'); body.position.y = 1.2; body.castShadow = !lp; shed.add(body);
    const roof = mk(new THREE.CylinderGeometry(1.9, 1.9, 3.6, 3), std('#8a3b2e'), 'roof'); roof.rotation.z = Math.PI / 2; roof.rotation.x = Math.PI / 2; roof.scale.set(1, 1, 0.55); roof.position.y = 2.9; shed.add(roof);
    const door = mk(new THREE.PlaneGeometry(0.9, 1.6), warmBasic, 'door-light'); door.position.set(side[6] * -1.61, 0.85, 0); door.rotation.y = -side[6] * Math.PI / 2; shed.add(door);
    const rack = mk(new THREE.BoxGeometry(0.6, 1.2, 0.6), std('#26262c'), 'rack'); rack.position.set(side[6] * -1.9, 0.6, 1.7); shed.add(rack);
    const leds = []; for (let k = 0; k < 6; k++) { const l = mk(new THREE.BoxGeometry(0.06, 0.04, 0.02), new THREE.MeshBasicMaterial({ color: k % 3 ? '#6dff9a' : '#ff5a4d' }), 'led'); l.position.set(side[6] * -1.9 + (k % 2) * 0.14 - 0.07, 0.3 + Math.floor(k / 2) * 0.3, 2.01); shed.add(l); leds.push(l); }
    anim.push(t => leds.forEach((l, k) => { l.visible = Math.sin(t * (3 + k) + k * 2) > -0.3; }));
    const car = new THREE.Group(); car.name = 'rc-car'; const cb = mk(new THREE.BoxGeometry(0.34, 0.12, 0.2), std('#2f7de1'), 'rc-body'); cb.position.y = 0.12; car.add(cb);
    [[-0.11, -0.1], [0.11, -0.1], [-0.11, 0.1], [0.11, 0.1]].forEach(([a, b]) => { const w = mk(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8), std('#111'), 'rc-wheel'); w.rotation.x = Math.PI / 2; w.position.set(a, 0.06, b); car.add(w); });
    shed.add(car); anim.push(t => { const a = t * 1.1; car.position.set(side[6] * -3.6 + Math.cos(a) * 1.6, 0, Math.sin(a) * 1.6); car.rotation.y = -a; });
    scene.add(shed); clearZones.push({ x: v.x, z: v.z, r: 8 }); }
  // 7 · vantage ledge
  { const v = new THREE.Vector3(LAKE.x - LAKE.r * 0.78, 0, LAKE.z + 6); v.y = H(v.x, v.z); const l = mk(new THREE.DodecahedronGeometry(2.2, 0), stone, 'vantage-rock'); l.scale.set(1.3, 0.5, 1); l.position.set(v.x, v.y + 0.3, v.z); scene.add(l); solids.push({ x: v.x, z: v.z, r: 1.6 }); }
  // 8 · campfire
  const fireLight = new THREE.PointLight('#ff8a3d', 0, 40, 1.4); const flames = [];
  { const f = new THREE.Group(); f.name = 'campfire'; f.position.set(FIRE.x, H(FIRE.x, FIRE.z), FIRE.z);
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; const s = mk(new THREE.DodecahedronGeometry(0.26, 1), stone, 'fire-stone'); s.position.set(Math.cos(a) * 0.95, 0.12, Math.sin(a) * 0.95); f.add(s); }
    for (let k = 0; k < 3; k++) { const lg = mk(new THREE.CylinderGeometry(0.09, 0.1, 1.3, 6), darkWood, 'fire-log'); lg.rotation.set(Math.PI / 2 - 0.35, k * 2.1, 0); lg.position.y = 0.25; f.add(lg); }
    ['#ff6a1f', '#ffa640', '#ffe28a'].forEach((c, k) => { const fl = mk(new THREE.ConeGeometry(0.42 - k * 0.1, 1.3 - k * 0.25, 5), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }), 'flame'); fl.position.y = 0.7 - k * 0.05; f.add(fl); flames.push(fl); });
    const g = glowSprite('#ff8a3d', 7, 0.9); g.position.y = 0.9; f.add(g); glows.push({ s: g, base: 0.6, n: 1 });
    fireLight.position.y = 1.4; f.add(fireLight);
    const bench = mk(new THREE.CylinderGeometry(0.24, 0.26, 2.6, 7), wood, 'log-bench'); bench.rotation.z = Math.PI / 2; bench.rotation.y = 0.3; bench.position.set(-0.4, 0.25, 2.8); f.add(bench);
    const tent = mk(new THREE.ConeGeometry(1.9, 2.3, 4), std('#c9a36a'), 'tent'); tent.position.set(4, 1.15, -2.5); tent.rotation.y = 0.5; tent.castShadow = !lp; f.add(tent);
    scene.add(f); }
  const embers = (() => { const n = 60, g = new THREE.BufferGeometry(), a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = FIRE.x; a[i * 3 + 1] = -99; a[i * 3 + 2] = FIRE.z; } g.setAttribute('position', new THREE.BufferAttribute(a, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffb35a', size: 0.14, map: GT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); pts.name = 'embers'; pts.frustumCulled = false; scene.add(pts); return { g, a, n, life: new Float32Array(n).map(() => Math.random() * 3) }; })();
  // Desert/canyon pocket — scenery only, off the free-ride area
  { const sandC = new THREE.Color('#e8c07d'), duneRock = std('#b3703f'), capRock = std('#e8c07d', { roughness: 0.85 });
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.4, rr = DESERT.r * 0.35 + rnd() * DESERT.r * 0.4, x = DESERT.x + Math.cos(a) * rr, z = DESERT.z + Math.sin(a) * rr, y = H(x, z);
      const h = 9 + rnd() * 15, rad = 4.5 + rnd() * 4; const mesa = mk(new THREE.CylinderGeometry(rad * 0.68, rad, h, 8), duneRock, 'mesa'); mesa.position.set(x, y + h / 2, z); mesa.rotation.y = rnd() * 6; mesa.castShadow = !lp; scene.add(mesa); solids.push({ x, z, r: rad * 0.7 });
      const cap = mk(new THREE.CylinderGeometry(rad * 0.7, rad * 0.7, 0.7, 8), capRock, 'mesa-cap'); cap.position.set(x, y + h + 0.35, z); scene.add(cap); }
    for (let k = 0; k < 10; k++) { const a = rnd() * Math.PI * 2, rr = rnd() * DESERT.r * 0.9, x = DESERT.x + Math.cos(a) * rr, z = DESERT.z + Math.sin(a) * rr, y = H(x, z), s = 0.6 + rnd() * 1.4;
      const b = mk(new THREE.DodecahedronGeometry(s, 0), duneRock, 'desert-boulder'); b.scale.y = 0.6; b.position.set(x, y + s * 0.25, z); b.rotation.set(rnd(), rnd() * 6, rnd()); b.castShadow = !lp; scene.add(b); solids.push({ x, z, r: s * 0.85 }); }
    clearZones.push({ x: DESERT.x, z: DESERT.z, r: DESERT.r * 0.32 }); }
  // Terminal ridge decoration — break up the world-edge wall past the campfire
  { for (let k = 0; k < 26; k++) { const z = ZEND - 40 - rnd() * 70, x = FIRE.x + (rnd() - 0.5) * 120, y = H(x, z), s = 1.2 + rnd() * 3.2;
      const b = mk(new THREE.DodecahedronGeometry(s, 0), stone, 'ridge-rock'); b.position.set(x, y + s * 0.3, z); b.rotation.set(rnd(), rnd() * 6, rnd()); b.castShadow = !lp; scene.add(b); solids.push({ x, z, r: s * 0.75 }); } }

  // Side trails off the main road
  function carveTrail(z0, sideSign, len, endThing) {
    const { f } = frame(z0); let ang = Math.atan2(-f.x, -f.z) + sideSign * 1.3, cx = roadX(z0), cz = z0;
    const pos = [], idx = [], cols = [], A = new THREE.Color('#8a6a44'), cc = new THREE.Color(); let n = 0;
    for (let s2 = 0; s2 <= len; s2 += 4) { const dx = Math.sin(ang), dz = Math.cos(ang); cx += dx * 4; cz += dz * 4; ang += sideSign * 0.05;
      const px = -dz, pz = dx; for (let k = -1; k <= 1; k += 2) { const x = cx + px * 2.1 * k, zz = cz + pz * 2.1 * k; pos.push(x, H(x, zz) + 0.13, zz); cc.copy(A).multiplyScalar(0.88 + h2(n, k + 3) * 0.24); cols.push(cc.r, cc.g, cc.b); }
      if (n) idx.push(2 * n - 2, 2 * n - 1, 2 * n, 2 * n - 1, 2 * n + 1, 2 * n); clearZones.push({ x: cx, z: cz, r: 4.6 }); n++; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.setIndex(idx); g.computeVertexNormals();
    const trail = mk(g, std('#ffffff', { vertexColors: true, side: THREE.DoubleSide }), 'side-trail'); trail.receiveShadow = !lp; scene.add(trail);
    endThing && endThing(cx, cz); return { x: cx, z: cz }; }
  carveTrail(zAt(0.22), -1, 62, (x, z) => { const y = H(x, z); const v = mk(new THREE.DodecahedronGeometry(2.4, 0), stone, 'trail-vantage'); v.scale.set(1.3, 0.5, 1); v.position.set(x, y + 0.3, z); v.castShadow = !lp; scene.add(v); solids.push({ x, z, r: 1.6 }); clearZones.push({ x, z, r: 6 }); });
  carveTrail(zAt(0.56), -1, 70, (x, z) => { for (let k = 0; k < 5; k++) { const a = k * 1.4, rx = x + Math.cos(a) * 2.4, rz = z + Math.sin(a) * 2.4, y = H(rx, rz); const blk = mk(new THREE.BoxGeometry(1.1 + rnd(), 0.8 + rnd() * 0.6, 1.1 + rnd()), stone, 'ruin-block'); blk.position.set(rx, y + 0.4, rz); blk.rotation.set(rnd() * 0.4, rnd() * 6, rnd() * 0.4 - 0.2); blk.castShadow = !lp; scene.add(blk); solids.push({ x: rx, z: rz, r: 1 }); } clearZones.push({ x, z, r: 7 }); });
  carveTrail(zAt(0.42), 1, 150, null);

  // signposts
  for (let i = 1; i < NSTOP; i++) { const v = at(i, -4.8 * (side[i] || 1), 3); const po = mk(new THREE.CylinderGeometry(0.06, 0.06, 1.7, 5), darkWood, 'sign-post'); po.position.set(v.x, v.y + 0.85, v.z); scene.add(po); const bd = mk(new THREE.BoxGeometry(0.9, 0.34, 0.05), wood, 'sign'); bd.position.set(v.x, v.y + 1.6, v.z); bd.rotation.y = 0.2; scene.add(bd); }

  // keep camera sightlines clear at every stop
  for (let i = 1; i <= NSTOP; i++) { const z = sZ(i), { f, r } = frame(z), cc = [0, 0.6, 0.6, 0.6, 0.55, 0.6, 0.6, 1.25, 0.35][i], sd = side[i] || 1;
    const a = cc * (i === 7 ? 1 : -sd), D = 6.8 + (i === 7 ? 1.4 : i === 8 ? 0.4 : 0) * 1.5;
    const cx = roadX(z) - f.x * Math.cos(a) * D - r.x * Math.sin(a) * D, cz = z - f.z * Math.cos(a) * D - r.z * Math.sin(a) * D;
    clearZones.push({ x: cx, z: cz, r: 13 }, { x: (cx + roadX(z)) / 2, z: (cz + z) / 2, r: 9 }); }
  // Notes (clickable wisps)
  const notes = (opts.notes || []).map((n, i) => { const z = zAt(n.t), x = roadX(z) + n.side * 7; const y = H(x, z);
    const rock = mk(new THREE.DodecahedronGeometry(0.9, 0), stone, 'note-rock'); rock.scale.set(1, 0.7, 1.1); rock.position.set(x, y + 0.3, z); scene.add(rock);
    const w = mk(new THREE.OctahedronGeometry(0.22, 0), new THREE.MeshBasicMaterial({ color: '#8ff7ff', fog: false }), 'wisp'); w.position.set(x, y + 1.9, z); scene.add(w);
    const g = glowSprite('#6ff0ff', 2.2); g.position.copy(w.position); scene.add(g); glows.push({ s: g, base: 0.7, n: 1 });
    const hit = mk(new THREE.SphereGeometry(1.5, 8, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), 'note-hit'); hit.position.set(x, y + 1.5, z); hit.userData.note = i; scene.add(hit);
    clearZones.push({ x, z, r: 3 });
    const txt = (opts.notes[i].text || '').split(' '), lines = []; let cur = ''; txt.forEach(wd => { if ((cur + ' ' + wd).trim().length > 26) { lines.push(cur.trim()); cur = wd; } else cur += ' ' + wd; }); if (cur.trim()) lines.push(cur.trim());
    const c = document.createElement('canvas'); c.width = 768; c.height = 96 + lines.length * 84; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const draw = () => { const g2 = c.getContext('2d'); g2.clearRect(0, 0, c.width, c.height); g2.fillStyle = 'rgba(111,240,255,.9)'; g2.font = '500 30px "JetBrains Mono", monospace'; g2.fillText('FIELD NOTE ' + String(i + 1).padStart(2, '0'), 8, 40); g2.fillStyle = '#f6ecda'; g2.font = 'italic 500 66px "Cormorant Garamond", Georgia, serif'; lines.forEach((l, k) => g2.fillText(l, 8, 118 + k * 84)); tex.needsUpdate = true; };
    draw(); typeQ.push(draw);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, fog: false })); sp.name = 'field-note'; const sw = 4.2; sp.scale.set(sw, sw * c.height / c.width, 1); sp.center.set(0, 0); sp.position.set(x + n.side * 0.6, y + 2.3, z); scene.add(sp);
    return { w, g, hit, y: y + 1.9, i, hov: 0, sp, rev: 0 }; });

  // Trees
  const windDirA = 0.6, wdx = Math.sin(windDirA), wdz = Math.cos(windDirA);
  const windTimeU = { value: 0 }, windAmtU = { value: 0 };
  function windify(mat, amp) {
    mat.onBeforeCompile = shader => { shader.uniforms.uTime = windTimeU; shader.uniforms.uWind = windAmtU;
      shader.vertexShader = 'uniform float uTime;\nuniform float uWind;\n' + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
  vec3 iwp = (instanceMatrix * vec4(0.0,0.0,0.0,1.0)).xyz;
#else
  vec3 iwp = vec3(0.0);
#endif
float phase = (iwp.x*${wdx.toFixed(3)} + iwp.z*${wdz.toFixed(3)}) * 0.045;
float wave = sin(uTime*0.85 - phase) * 0.6 + sin(uTime*1.7 - phase*1.6 + 1.3) * 0.4;
float sway = max(position.y, 0.0) * uWind * ${amp.toFixed(3)} * wave;
transformed.x += sway * ${wdx.toFixed(3)};
transformed.z += sway * ${wdz.toFixed(3)};
`); }; }
  const dummy = new THREE.Object3D();
  const NP = lp ? 1100 : 2600, NR = lp ? 350 : 900;
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.14, 0.24, 1, 5).translate(0, 0.5, 0), std('#5a3f2c'), NP + NR); trunks.name = 'tree-trunks';
  const pines = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 8).translate(0, 0.5, 0), std('#ffffff'), NP * 2); pines.name = 'pine-crowns'; windify(pines.material, 0.4);
  const rounds = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), std('#ffffff'), NR); rounds.name = 'round-crowns'; windify(rounds.material, 0.34);
  const PC = ['#2f5a3a', '#3a6b3f', '#27493a', '#446f3a', '#2c5236'].map(c => new THREE.Color(c)), RC = ['#5b7f35', '#6d8c3a', '#4d7536', '#7d8f3a'].map(c => new THREE.Color(c));
  const BIO = ['#39f3e0', '#6ff0ff', '#9dffc4', '#c8ff7a'].map(c => new THREE.Color(c)); const tbPos = [], tbCol = [];
  let ti = 0, pi = 0, ri = 0;
  const place = (isPine) => { for (let tries = 0; tries < 30; tries++) { const z = lerp(TZ0 - 20, TZ1 + 20, rnd()); const prog = clamp((Z0 - z) / L, 0, 1); if (rnd() > 0.4 + 0.6 * prog + 0.2) continue;
      const s = rnd() < 0.5 ? -1 : 1; const x = z < ZEND - 20 ? lerp(TX0 + 10, TX1 - 10, rnd()) : roadX(z) + s * (8.5 + Math.pow(rnd(), 1.5) * 230); if (x < TX0 + 5 || x > TX1 - 5 || !okSpot(x, z, 8)) continue;
      const y = H(x, z); if (y - roadY(clamp(z, ZEND, Z0)) > 70) continue; return [x, y, z]; } return null; };
  for (let k = 0; k < NP; k++) { const q = place(true); if (!q) continue; const [x, y, z] = q; const h = 6 + Math.pow(rnd(), 1.6) * 13, r = 1.4 + rnd() * 1.9, th = h * 0.28;
    solids.push({ x, z, r: 0.4 });
    dummy.position.set(x, y - 0.2, z); dummy.rotation.set(0, rnd() * 6, 0); dummy.scale.set(1, th + 0.2, 1); dummy.updateMatrix(); trunks.setMatrixAt(ti++, dummy.matrix);
    const c = PC[Math.floor(rnd() * PC.length)];
    dummy.position.set(x, y + th, z); dummy.scale.set(r, h * 0.62, r); dummy.updateMatrix(); pines.setMatrixAt(pi, dummy.matrix); pines.setColorAt(pi++, c);
    dummy.position.set(x, y + th + h * 0.38, z); dummy.scale.set(r * 0.68, h * 0.5, r * 0.68); dummy.rotation.y += 0.5; dummy.updateMatrix(); pines.setMatrixAt(pi, dummy.matrix); pines.setColorAt(pi++, c);
    if (rnd() < 0.08) { const bc = BIO[Math.floor(rnd() * BIO.length)], inten = 0.35 + rnd() * 1.2; tbPos.push(x, y + th + h * 0.3, z); tbCol.push(bc.r * inten, bc.g * inten, bc.b * inten); } }
  for (let k = 0; k < NR; k++) { const q = place(false); if (!q) continue; const [x, y, z] = q; const r = 1.6 + rnd() * 2.2, th = 1.6 + rnd() * 2.4;
    solids.push({ x, z, r: 0.45 });
    dummy.position.set(x, y - 0.2, z); dummy.rotation.set(0, rnd() * 6, 0); dummy.scale.set(1.2, th + r * 0.5, 1.2); dummy.updateMatrix(); trunks.setMatrixAt(ti++, dummy.matrix);
    dummy.position.set(x, y + th + r * 0.7, z); dummy.scale.set(r, r * (0.8 + rnd() * 0.4), r); dummy.rotation.set(rnd(), rnd() * 6, 0); dummy.updateMatrix(); rounds.setMatrixAt(ri, dummy.matrix); rounds.setColorAt(ri++, RC[Math.floor(rnd() * RC.length)]);
    if (rnd() < 0.08) { const bc = BIO[Math.floor(rnd() * BIO.length)], inten = 0.35 + rnd() * 1.2; tbPos.push(x, y + th + r * 0.7, z); tbCol.push(bc.r * inten, bc.g * inten, bc.b * inten); } }
  trunks.count = ti; pines.count = pi; rounds.count = ri;
  [trunks, pines, rounds].forEach(m => { m.castShadow = false; scene.add(m); });
  const treeGlowMat = new THREE.PointsMaterial({ size: 0.55, vertexColors: true, map: GT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
  const treeGlowGeo = new THREE.BufferGeometry(); treeGlowGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(tbPos), 3)); treeGlowGeo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(tbCol), 3));
  const treeGlow = new THREE.Points(treeGlowGeo, treeGlowMat); treeGlow.name = 'tree-bioluminescence'; treeGlow.frustumCulled = false; scene.add(treeGlow);

  // Rocks
  { const g = new THREE.IcosahedronGeometry(1, 0); const pp = g.attributes.position; for (let i = 0; i < pp.count; i++) { const k = Math.round(pp.getX(i) * 100) * 7 + Math.round(pp.getY(i) * 100) * 13 + Math.round(pp.getZ(i) * 100); const s = 0.75 + h2(k, 2) * 0.5; pp.setXYZ(i, pp.getX(i) * s, pp.getY(i) * s * 0.7, pp.getZ(i) * s); } g.computeVertexNormals();
    const N = lp ? 250 : 650, rocks = new THREE.InstancedMesh(g, std('#ffffff'), N); rocks.name = 'rocks'; let n = 0;
    for (let k = 0; k < N * 3 && n < N; k++) { const z = lerp(TZ0, ZEND + 10, rnd()), s = 0.3 + Math.pow(rnd(), 3) * 3, x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (4.2 + s * 1.3 + Math.pow(rnd(), 2) * 120); if (!okSpot(x, z, 3.8 + s * 1.3)) continue;
      dummy.position.set(x, H(x, z) + s * 0.1, z); dummy.rotation.set(rnd(), rnd() * 6, rnd()); dummy.scale.set(s, s, s); dummy.updateMatrix(); rocks.setMatrixAt(n, dummy.matrix); rocks.setColorAt(n++, ROCK[Math.floor(rnd() * 3)].clone().multiplyScalar(0.85 + rnd() * 0.3)); if (s > 1.15) solids.push({ x, z, r: s * 0.7 }); }
    rocks.count = n; scene.add(rocks); }

  // Bioluminescent flora
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  windify(glowMat, 0.65);
  const GC = ['#39f3e0', '#6ff0ff', '#9dffc4', '#39f3e0', '#c8ff7a'].map(c => new THREE.Color(c));
  { const NM = lp ? 260 : 700, NC = lp ? 400 : 1100;
    const caps = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2), glowMat, NM); caps.name = 'glow-mushrooms';
    const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.4, 1, 5).translate(0, 0.5, 0), std('#d9d2c2'), NM); stems.name = 'mushroom-stems';
    const crys = new THREE.InstancedMesh(new THREE.ConeGeometry(0.12, 1, 4).translate(0, 0.5, 0), glowMat, NC); crys.name = 'glow-grass';
    let m = 0, c = 0;
    while (m < NM || c < NC) { const z = lerp(zAt(0.52), ZEND - 20, Math.pow(rnd(), 0.8)), cxp = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (4 + Math.pow(rnd(), 1.4) * 34), gc = pick(GC); if (!okSpot(cxp, z, 5.5)) { if (rnd() < 0.02) break; continue; }
      const n = 3 + Math.floor(rnd() * 6);
      for (let j = 0; j < n; j++) { const x = cxp + (rnd() - 0.5) * 3, zz = z + (rnd() - 0.5) * 3; if (roadDist(x, zz) < 3.6) continue; const y = H(x, zz);
        if (rnd() < 0.45 && m < NM) { const s = 0.12 + rnd() * 0.3, h = s * (1.5 + rnd() * 2); dummy.position.set(x, y - 0.05, zz); dummy.rotation.set(0, 0, (rnd() - 0.5) * 0.3); dummy.scale.set(s * 0.4, h, s * 0.4); dummy.updateMatrix(); stems.setMatrixAt(m, dummy.matrix);
          dummy.position.set(x, y + h - 0.08, zz); dummy.scale.set(s, s * 0.7, s); dummy.updateMatrix(); caps.setMatrixAt(m, dummy.matrix); caps.setColorAt(m++, gc); }
        else if (c < NC) { dummy.position.set(x, y - 0.05, zz); dummy.rotation.set((rnd() - 0.5) * 0.5, rnd() * 6, (rnd() - 0.5) * 0.5); const s = 0.6 + rnd() * 1.4; dummy.scale.set(s, s * (0.8 + rnd()), s); dummy.updateMatrix(); crys.setMatrixAt(c, dummy.matrix); crys.setColorAt(c++, gc); } } }
    caps.count = stems.count = m; crys.count = c; scene.add(caps, stems, crys); }

  // Fallen logs — forest floor debris
  { const N = lp ? 70 : 170, logs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.24, 0.32, 1, 6), std('#4a3624', { roughness: 1 }), N); logs.name = 'fallen-logs'; let n = 0;
    for (let k = 0; k < N * 3 && n < N; k++) { const z = lerp(TZ0 - 20, ZEND + 20, rnd()), prog = clamp((Z0 - z) / L, 0, 1); if (rnd() > 0.3 + 0.55 * prog) continue;
      const x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (7 + Math.pow(rnd(), 1.3) * 100); if (!okSpot(x, z, 4.5)) continue;
      const len = 2.2 + rnd() * 4.4, rad = 0.4 + rnd() * 0.5, y = H(x, z), ang = rnd() * 6;
      dummy.position.set(x, y + rad * 0.55, z); dummy.rotation.set(0, ang, Math.PI / 2); dummy.scale.set(rad, len, rad); dummy.updateMatrix();
      logs.setMatrixAt(n, dummy.matrix); logs.setColorAt(n++, new THREE.Color('#4a3624').lerp(new THREE.Color('#5c6b3f'), rnd() * 0.4).multiplyScalar(0.85 + rnd() * 0.3)); }
    logs.count = n; logs.castShadow = !lp; scene.add(logs); }

  // Undergrowth — ferns & bushes for ground-level variety
  { const NB = lp ? 500 : 1400, bushes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), std('#3d5c2e'), NB); bushes.name = 'bushes'; windify(bushes.material, 0.22);
    const NF = lp ? 400 : 1100, ferns = new THREE.InstancedMesh(new THREE.ConeGeometry(0.5, 1, 5).translate(0, 0.5, 0), std('#4a6b34'), NF); ferns.name = 'ferns'; windify(ferns.material, 0.5);
    const BC = ['#3d5c2e', '#466b34', '#345228', '#4f7038'].map(c => new THREE.Color(c));
    let bi = 0, fi = 0;
    while (bi < NB || fi < NF) { const z = lerp(TZ0 - 20, ZEND + 10, rnd()), prog = clamp((Z0 - z) / L, 0, 1); if (rnd() > 0.4 + 0.5 * prog) { if (rnd() < 0.02) break; continue; }
      const x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (5 + Math.pow(rnd(), 1.4) * 90); if (!okSpot(x, z, 3)) continue; const y = H(x, z);
      if (rnd() < 0.45 && bi < NB) { const s = 0.4 + rnd() * 0.7; dummy.position.set(x, y + s * 0.55, z); dummy.rotation.set(rnd() * 0.2, rnd() * 6, rnd() * 0.2); dummy.scale.set(s, s * 0.75, s); dummy.updateMatrix(); bushes.setMatrixAt(bi, dummy.matrix); bushes.setColorAt(bi++, pick(BC)); }
      else if (fi < NF) { const s = 0.3 + rnd() * 0.5, h = s * (2 + rnd() * 1.5); dummy.position.set(x, y + h * 0.5, z); dummy.rotation.set(0, rnd() * 6, 0); dummy.scale.set(s, h, s); dummy.updateMatrix(); ferns.setMatrixAt(fi, dummy.matrix); ferns.setColorAt(fi++, pick(BC)); } }
    bushes.count = bi; ferns.count = fi; scene.add(bushes, ferns); }

  // Ground grass — dense low tufts across the forest floor
  { const N = lp ? 1400 : 4200, grass = new THREE.InstancedMesh(new THREE.ConeGeometry(0.14, 1, 3).translate(0, 0.5, 0), std('#4c6b30'), N); grass.name = 'ground-grass'; windify(grass.material, 0.6);
    const GRC = ['#4c6b30', '#557836', '#42602b', '#5f8038'].map(c => new THREE.Color(c));
    let n = 0;
    while (n < N) { const z = lerp(TZ0 - 20, ZEND + 10, rnd()), prog = clamp((Z0 - z) / L, 0, 1); if (rnd() > 0.45 + 0.45 * prog) { if (rnd() < 0.01) break; continue; }
      const cx = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (4.5 + Math.pow(rnd(), 1.4) * 95); if (!okSpot(cx, z, 2.5)) continue;
      const cnt = 3 + Math.floor(rnd() * 5), gc = pick(GRC);
      for (let j = 0; j < cnt && n < N; j++) { const x = cx + (rnd() - 0.5) * 2.4, zz = z + (rnd() - 0.5) * 2.4; if (roadDist(x, zz) < 2.6) continue; const y = H(x, zz), s = 0.5 + rnd() * 0.6, h = s * (1.3 + rnd());
        dummy.position.set(x, y + h * 0.5, zz); dummy.rotation.set(0, rnd() * 6, (rnd() - 0.5) * 0.3); dummy.scale.set(s, h, s); dummy.updateMatrix(); grass.setMatrixAt(n, dummy.matrix); grass.setColorAt(n++, gc); } }
    grass.count = n; scene.add(grass); }

  // Wildflower patches — color accents in clearings
  { const N = lp ? 500 : 1300, flowers = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), std('#ffffff', { roughness: 0.6 }), N); flowers.name = 'wildflowers';
    const FC = ['#e8556f', '#f0a83c', '#f4e04d', '#c95de0', '#6ec6e8'].map(c => new THREE.Color(c));
    let n = 0;
    while (n < N) { const z = lerp(TZ0 - 10, ZEND + 10, rnd()), prog = clamp((Z0 - z) / L, 0, 1); if (rnd() > 0.35 + 0.45 * prog) { if (rnd() < 0.02) break; continue; }
      const cx = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (5 + Math.pow(rnd(), 1.3) * 60); if (!okSpot(cx, z, 4)) continue;
      const fc = pick(FC), cnt = 4 + Math.floor(rnd() * 7);
      for (let j = 0; j < cnt && n < N; j++) { const x = cx + (rnd() - 0.5) * 4, zz = z + (rnd() - 0.5) * 4; if (roadDist(x, zz) < 3.2) continue; const y = H(x, zz), s = 0.09 + rnd() * 0.1;
        dummy.position.set(x, y + s, zz); dummy.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6); dummy.scale.set(s, s, s); dummy.updateMatrix(); flowers.setMatrixAt(n, dummy.matrix); flowers.setColorAt(n++, fc); } }
    flowers.count = n; scene.add(flowers); }

  // Mossy boulder outcrops — larger rock clusters for terrain variety
  { const mossRock = std('#6f766a', { roughness: 1 }), mossCap = std('#3f5c34', { roughness: 1 });
    for (let k = 0; k < 14; k++) { const z = lerp(TZ0 - 30, ZEND, rnd()); const x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (10 + rnd() * 70); if (!okSpot(x, z, 9)) continue;
      const n2 = 2 + Math.floor(rnd() * 3);
      for (let j = 0; j < n2; j++) { const ox = (rnd() - 0.5) * 4, oz = (rnd() - 0.5) * 4, s = 1.4 + rnd() * 2.4, yy = H(x + ox, z + oz);
        const b = mk(new THREE.DodecahedronGeometry(s, 0), mossRock, 'moss-boulder'); b.scale.y = 0.72 + rnd() * 0.3; b.position.set(x + ox, yy + s * 0.32, z + oz); b.rotation.set(rnd(), rnd() * 6, rnd()); b.castShadow = !lp; scene.add(b);
        if (rnd() < 0.6) { const cap = mk(new THREE.IcosahedronGeometry(s * 0.55, 0), mossCap, 'moss-cap'); cap.scale.y = 0.4; cap.position.set(x + ox, yy + s * 0.6, z + oz); scene.add(cap); }
        solids.push({ x: x + ox, z: z + oz, r: s * 0.7 }); } } }

  // Birch grove — canopy color variety near a forest clearing
  { const birchBark = std('#e8e4d8', { roughness: 0.8 }), birchLeaf = std('#d9c14a', { roughness: 0.9 });
    const gz = zAt(0.62), gx = roadX(gz) + 55;
    for (let k = 0; k < 16; k++) { const a = rnd() * Math.PI * 2, r = rnd() * 14, x = gx + Math.cos(a) * r, z = gz + Math.sin(a) * r; if (!okSpot(x, z, 3)) continue; const y = H(x, z), h = 5 + rnd() * 4;
      const trunk = mk(new THREE.CylinderGeometry(0.1, 0.16, h, 6), birchBark, 'birch-trunk'); trunk.position.set(x, y + h / 2, z); trunk.castShadow = !lp; scene.add(trunk);
      const leaf = mk(new THREE.IcosahedronGeometry(1.3 + rnd() * 0.7, 0), birchLeaf, 'birch-leaf'); leaf.position.set(x, y + h + 0.6, z); leaf.castShadow = !lp; scene.add(leaf);
      solids.push({ x, z, r: 0.35 }); }
    clearZones.push({ x: gx, z: gz, r: 4 }); }

  // Spatial chunking: split big instanced sets so frustum + distance culling can skip them
  { const m4 = new THREE.Matrix4(), c3 = new THREE.Color(), NAMES = ['tree-trunks', 'pine-crowns', 'round-crowns', 'rocks', 'glow-mushrooms', 'mushroom-stems', 'glow-grass', 'fallen-logs', 'bushes', 'ferns', 'wildflowers', 'ground-grass'];
    scene.children.filter(o => o.isInstancedMesh && NAMES.includes(o.name)).forEach(im => { const B = new Map();
      for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m4); const k = Math.floor((TZ0 - m4.elements[14]) / CH); let b = B.get(k); if (!b) B.set(k, b = []); b.push(i); }
      B.forEach(ids => { const n = new THREE.InstancedMesh(im.geometry, im.material, ids.length); n.name = im.name; n.castShadow = im.castShadow; ids.forEach((id, j) => { im.getMatrixAt(id, m4); n.setMatrixAt(j, m4); if (im.instanceColor) { im.getColorAt(id, c3); n.setColorAt(j, c3); } });
        n.computeBoundingSphere(); n.userData.cx = n.boundingSphere.center.x; n.userData.cz = n.boundingSphere.center.z; n.userData.r = n.boundingSphere.radius; scene.add(n); chunks.push(n); });
      scene.remove(im); }); }
  // Far mountains
  { const g = new THREE.ConeGeometry(1, 1, 7, 3); const pp = g.attributes.position; for (let i = 0; i < pp.count; i++) { const y = pp.getY(i); if (y < 0.49) { const k = Math.round(pp.getX(i) * 50) * 31 + Math.round(y * 50) * 7 + Math.round(pp.getZ(i) * 50); const s = 0.8 + h2(k, 4) * 0.45; pp.setX(i, pp.getX(i) * s); pp.setZ(i, pp.getZ(i) * s); } } g.computeVertexNormals();
    const N = 90, mts = new THREE.InstancedMesh(g, std('#ffffff'), N); mts.name = 'far-mountains';
    for (let k = 0; k < N; k++) { const back = k > 58; const z = back ? ZEND - 380 - rnd() * 280 : lerp(Z0 + 220, ZEND - 220, k / 58), s = rnd() < 0.5 ? -1 : 1, x = back ? (400 + rnd() * 500) * s : roadX(z) + s * (430 + rnd() * 340), h = back ? 220 + rnd() * 300 : 170 + rnd() * 300, r = Math.min(h * (0.95 + rnd() * 0.65), back ? 300 : Math.abs(x - roadX(z)) - 200);
      dummy.position.set(x, h / 2 - 30, z); dummy.rotation.set(0, rnd() * 6, 0); dummy.scale.set(r, h, r); dummy.updateMatrix(); mts.setMatrixAt(k, dummy.matrix); mts.setColorAt(k, new THREE.Color(back ? '#4a4f78' : '#5a5f82').multiplyScalar(0.85 + rnd() * 0.3)); }
    scene.add(mts);
    // snow caps on the tallest peaks
    const NC = 34, caps = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7).translate(0, 0.5, 0), std('#eef3fb', { roughness: 0.7 }), NC); caps.name = 'far-mountain-caps'; let ci = 0;
    for (let k = 0; k < N && ci < NC; k++) { const back = k > 58; if (!back || rnd() > 0.55) continue; mts.getMatrixAt(k, dummy.matrix); dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
      const h = dummy.scale.y, r = dummy.scale.x; dummy.position.y += h * 0.32; dummy.scale.set(r * 0.4, h * 0.26, r * 0.4); dummy.updateMatrix(); caps.setMatrixAt(ci++, dummy.matrix); }
    caps.count = ci; scene.add(caps); }

  // Clouds
  const cloudMat = std('#ffd9bd', { transparent: true, opacity: 0.92, roughness: 1 });
  const cloudGeo = new THREE.IcosahedronGeometry(1, 0);
  const clouds = []; const addCloud = (x, y, z, s) => { const g = new THREE.Group(); g.name = 'cloud'; const n = 4 + Math.floor(rnd() * 4); for (let k = 0; k < n; k++) { const m = mk(cloudGeo, cloudMat, 'cloud-puff'); const r = s * (0.5 + rnd() * 0.6); m.scale.set(r * 1.4, r * 0.8, r); m.position.set((k - n / 2) * s * 0.7 + rnd() * s * 0.4, rnd() * s * 0.3, (rnd() - 0.5) * s * 0.8); m.rotation.set(rnd(), rnd(), rnd()); g.add(m); } g.position.set(x, y, z); scene.add(g); clouds.push({ g, v: 1.2 + rnd() * 2.8, x0: x, y0: y, ph: rnd() * 6 }); return g; };
  for (let k = 0; k < (lp ? 18 : 34); k++) { const z = Z0 + 90 - rnd() * 260; addCloud(roadX(z) + (rnd() - 0.5) * 140, 60 + rnd() * 50, z, 7 + rnd() * 9); }
  for (let k = 0; k < (lp ? 16 : 30); k++) { const z = lerp(Z0, ZEND - 200, rnd()); addCloud((rnd() - 0.5) * 700, 150 + rnd() * 90, z, 18 + rnd() * 20); }

  // Ground fog banks — low drifting haze in valleys and canyon floor
  const fogPatches = [];
  for (let k = 0; k < (lp ? 8 : 16); k++) { const z = lerp(TZ0, ZEND + 20, rnd()), x = roadX(z) + (rnd() - 0.5) * 170, y = H(x, z) + 0.6;
    const fm = new THREE.SpriteMaterial({ map: GT, color: '#cfd9e6', transparent: true, opacity: 0.1, depthWrite: false, fog: false }); const m = new THREE.Sprite(fm); const s = 20 + rnd() * 26; m.scale.set(s, s * 0.4, 1); m.position.set(x, y, z); scene.add(m); fogPatches.push({ m, x0: x, z0: z, ph: rnd() * 10 }); }

  // Lake water
  const wU = { time: { value: 0 }, gust: { value: 0 }, rip: { value: Array.from({ length: 8 }, () => new THREE.Vector3(0, 0, -99)) }, deep: { value: new THREE.Color('#12305a') }, skyc: { value: new THREE.Color('#ffb067') }, moon: { value: skyU.moonDir.value }, night: skyU.night, fogColor: { value: new THREE.Color() }, fogNear: { value: 50 }, fogFar: { value: 560 } };
  const water = mk(new THREE.PlaneGeometry(LAKE.r * 3, LAKE.r * 3, lp ? 50 : 90, lp ? 50 : 90).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: wU, transparent: true,
    vertexShader: `uniform float time; uniform float gust; uniform vec3 rip[8]; varying vec3 vW;
      void main(){ vec4 w=modelMatrix*vec4(position,1.); float y=(sin(w.x*.25+time*.8)*.08+sin(w.z*.31-time*.6)*.08)*(0.7+0.7*gust);
        for(int i=0;i<8;i++){ float age=time-rip[i].z; if(age>0.&&age<6.){ float d=distance(w.xz,rip[i].xy); y+=sin(d*1.3-age*5.)*.45*exp(-age*.7)*exp(-d*.07)*smoothstep(age*6.+3.,age*6.,d);} }
        w.y+=y; vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform vec3 deep,skyc,moon,fogColor; uniform float night,fogNear,fogFar; varying vec3 vW;
      void main(){ vec3 n=normalize(cross(dFdx(vW),dFdy(vW))); if(n.y<0.) n=-n; vec3 v=normalize(cameraPosition-vW);
        float fr=pow(1.-max(dot(n,v),0.),3.); vec3 c=mix(deep,skyc,.35+fr*.65); vec3 r=reflect(-v,n);
        c+=vec3(.9,.95,1.)*pow(max(dot(r,moon),0.),60.)*1.6*night; c+=vec3(.2,.9,.9)*.06*night;
        float distC=length(cameraPosition-vW); float fogF=clamp((distC-fogNear)/max(1.0,fogFar-fogNear),0.0,1.0); c=mix(c,fogColor,fogF*0.9);
        gl_FragColor=vec4(c,.93); }` }), 'lake');
  water.position.set(LAKE.x, LAKE.y, LAKE.z); scene.add(water);
  let ripI = 0;

  // Waterfall feeding the lake
  const wfA = 2.05, wfX = LAKE.x + Math.cos(wfA) * LAKE.r * 1.02, wfZ = LAKE.z + Math.sin(wfA) * LAKE.r * 1.02, wfTop = LAKE.y + 22;
  { const cliffGeo = new THREE.IcosahedronGeometry(1, 1); const cp = cliffGeo.attributes.position; for (let i = 0; i < cp.count; i++) { const k = Math.round(cp.getX(i) * 60) * 13 + Math.round(cp.getY(i) * 60) * 7 + Math.round(cp.getZ(i) * 60); const s = 0.8 + h2(k, 3) * 0.5; cp.setXYZ(i, cp.getX(i) * s, cp.getY(i) * s, cp.getZ(i) * s); } cliffGeo.computeVertexNormals();
    for (let k = 0; k < 7; k++) { const a = (k / 6 - 0.5) * 1.5, rx = wfX + Math.sin(wfA + Math.PI / 2) * a * 5.5, rz = wfZ + Math.cos(wfA + Math.PI / 2) * a * 5.5, h = wfTop * (0.55 + 0.5 * (1 - Math.abs(a) / 0.8)) + rnd() * 4;
      const rk = mk(cliffGeo, stone, 'waterfall-cliff'); rk.position.set(rx, h * 0.5, rz); rk.scale.set(7 + rnd() * 2, h * 0.5, 6 + rnd() * 2); rk.rotation.y = rnd() * 6; rk.castShadow = !lp; scene.add(rk); solids.push({ x: rx, z: rz, r: 6 }); }
    clearZones.push({ x: wfX, z: wfZ, r: 20 });
    const wfU = { time: { value: 0 }, opacity: { value: 1 } };
    const cascade = mk(new THREE.PlaneGeometry(3.4, wfTop, 1, 24), new THREE.ShaderMaterial({ uniforms: wfU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform float time,opacity; varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453); }
        void main(){ float y=vUv.y; float flow=fract(y*7.0-time*1.8); float streak=hash(vec2(floor(vUv.x*24.0),floor(flow*10.0)));
          float foam=smoothstep(0.0,0.15,y)*smoothstep(1.0,0.8,y); float a=(0.55+0.45*streak)*foam*opacity;
          vec3 c=mix(vec3(0.75,0.88,0.98),vec3(1.0),smoothstep(0.0,0.08,y)*0.4);
          gl_FragColor=vec4(c,a); }` }), 'waterfall-cascade');
    cascade.position.set(wfX, wfTop / 2, wfZ); cascade.rotation.y = wfA + Math.PI / 2; scene.add(cascade);
    const mist = glowSprite('#dff4ff', 9, 0.5); mist.position.set(wfX, LAKE.y + 1.5, wfZ); scene.add(mist); glows.push({ s: mist, base: 0.35, n: 0.7 });
    anim.push(t => { wfU.time.value = t; mist.material.opacity = 0.4 + Math.sin(t * 3) * 0.08; mist.scale.setScalar(9 + Math.sin(t * 2) * 0.6); });
    worldType(['Falling water,', 'still lake.'], zAt(0.855)); }

  // Canyon pass — road flanked by rising rock walls
  { const cz0 = sZ(2) + 55, cz1 = sZ(3) - 45;
    for (let z = cz0; z > cz1; z -= 9) { const { f, r } = frame(z), prog = clamp((z - cz1) / (cz0 - cz1), 0, 1), rise = Math.sin(prog * Math.PI);
      [-1, 1].forEach(sd => { const w = roadW(z) + 6.5 + rnd() * 3, h = 14 + rise * 26 + rnd() * 6, x = roadX(z) + r.x * sd * w, zz = z + r.z * sd * w, y = H(x, zz);
        const rk = mk(new THREE.ConeGeometry(6 + rnd() * 3, h, 6, 1), stone, 'canyon-wall'); rk.position.set(x, y + h * 0.42, zz); rk.rotation.y = rnd() * 6; rk.scale.x = 0.6 + rnd() * 0.4; rk.castShadow = !lp; scene.add(rk); solids.push({ x, z: zz, r: 6.5 }); }); } }
  const SG = 8, solidGrid = new Map();
  solids.forEach((s, i) => { const key = Math.floor(s.x / SG) + ',' + Math.floor(s.z / SG); if (!solidGrid.has(key)) solidGrid.set(key, []); solidGrid.get(key).push(i); });
  function collideAt(x, z, extra) { const cx = Math.floor(x / SG), cz = Math.floor(z / SG); for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const arr = solidGrid.get((cx + dx) + ',' + (cz + dz)); if (!arr) continue; for (const i of arr) { const s = solids[i], ddx = x - s.x, ddz = z - s.z, rr = s.r + extra; if (ddx * ddx + ddz * ddz < rr * rr) return s; } } return null; }
  const bike = new THREE.Group(); bike.name = 'hness-350';
  const M = { gloss: new THREE.MeshPhysicalMaterial({ color: '#101014', flatShading: true, roughness: 0.16, metalness: 0.4, clearcoat: 0.9, clearcoatRoughness: 0.12, envMapIntensity: 1.4 }), red: new THREE.MeshPhysicalMaterial({ color: '#b3202a', flatShading: true, roughness: 0.18, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.3 }), chrome: std('#d4d7de', { roughness: 0.14, metalness: 0.65, envMapIntensity: 2 }), rubber: std('#17171a', { roughness: 0.92 }), engine: std('#3b3c42', { roughness: 0.5, metalness: 0.4, envMapIntensity: 1.3 }), seat: std('#1e1917', { roughness: 0.7 }) };
  const lamp = new THREE.MeshBasicMaterial({ color: '#eaf6ff' }), amber = new THREE.MeshBasicMaterial({ color: '#ffb23a' }), tail = new THREE.MeshBasicMaterial({ color: '#ff2a2a' }), screen = new THREE.MeshBasicMaterial({ color: '#6ff0ff' });
  const tube = (a, b, r, mat, name) => { const d = new THREE.Vector3().subVectors(b, a); const m = mk(new THREE.CylinderGeometry(r, r, d.length(), 8), mat, name); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); bike.add(m); return m; };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const wheels = [];
  [-0.72, 0.7].forEach((z, k) => { const w = new THREE.Group(); w.name = k ? 'rear-wheel' : 'front-wheel'; w.position.set(0, 0.36, z);
    const tyre = mk(new THREE.TorusGeometry(0.29, 0.075, 12, 32), M.rubber, 'tyre'); tyre.rotation.y = Math.PI / 2; w.add(tyre);
    const rim = mk(new THREE.CylinderGeometry(0.225, 0.225, 0.05, 28, 1, true), M.chrome, 'rim'); rim.rotation.z = Math.PI / 2; w.add(rim);
    for (let s = 0; s < 7; s++) { const sp = mk(new THREE.BoxGeometry(0.025, 0.44, 0.03), M.gloss, 'spoke'); sp.rotation.x = s / 7 * Math.PI; w.add(sp); }
    const hub = mk(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 16), M.chrome, 'hub'); hub.rotation.z = Math.PI / 2; w.add(hub);
    bike.add(w); wheels.push(w); });
  const fF = mk(new THREE.TorusGeometry(0.34, 0.05, 4, 12, Math.PI * 0.55), M.gloss, 'front-fender'); fF.rotation.y = Math.PI / 2; fF.rotation.x = 0; fF.position.set(0, 0.36, -0.72); fF.rotation.z = 0.35; bike.add(fF);
  const rF = mk(new THREE.TorusGeometry(0.36, 0.07, 4, 12, Math.PI * 0.6), M.gloss, 'rear-fender'); rF.rotation.y = Math.PI / 2; rF.position.set(0, 0.36, 0.7); rF.rotation.z = 1.1; bike.add(rF);
  [-0.09, 0.09].forEach(x => tube(V(x, 0.36, -0.72), V(x, 0.98, -0.5), 0.028, M.chrome, 'fork'));
  tube(V(0, 0.98, -0.5), V(0, 0.92, 0.35), 0.035, M.gloss, 'frame-top'); tube(V(0, 0.95, -0.46), V(0, 0.42, -0.2), 0.035, M.gloss, 'frame-down');
  tube(V(0, 0.42, -0.2), V(0, 0.4, 0.3), 0.03, M.gloss, 'frame-low');
  [-0.13, 0.13].forEach(x => { tube(V(x, 0.36, 0.7), V(x, 0.46, 0.05), 0.025, M.gloss, 'swingarm'); tube(V(x, 0.44, 0.64), V(x, 0.9, 0.44), 0.03, M.chrome, 'shock'); });
  const tank = mk(new THREE.SphereGeometry(1, 20, 16), M.gloss, 'tank'); tank.scale.set(0.17, 0.13, 0.3); tank.position.set(0, 0.99, -0.14); tank.castShadow = true; bike.add(tank);
  const stripe = mk(new THREE.SphereGeometry(1, 20, 16), M.red, 'tank-stripe'); stripe.scale.set(0.174, 0.045, 0.24); stripe.position.set(0, 0.99, -0.12); bike.add(stripe);
  const seat = mk(new THREE.BoxGeometry(0.26, 0.09, 0.62, 1, 1, 2), M.seat, 'seat'); seat.position.set(0, 0.93, 0.36); seat.rotation.x = -0.06; bike.add(seat);
  const eng = mk(new THREE.BoxGeometry(0.26, 0.3, 0.36), M.engine, 'engine'); eng.position.set(0, 0.56, -0.08); eng.castShadow = true; bike.add(eng);
  for (let k = 0; k < 4; k++) { const fin = mk(new THREE.BoxGeometry(0.3, 0.02, 0.26), M.engine, 'cyl-fin'); fin.position.set(0, 0.74 + k * 0.045, -0.2); fin.rotation.x = 0.35; bike.add(fin); }
  const cover = mk(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 20), M.chrome, 'engine-cover'); cover.rotation.z = Math.PI / 2; cover.position.set(0.14, 0.52, -0.04); bike.add(cover);
  const panel = mk(new THREE.BoxGeometry(0.2, 0.18, 0.24), M.gloss, 'side-panel'); panel.position.set(0, 0.74, 0.22); bike.add(panel);
  tube(V(0.12, 0.62, -0.3), V(0.16, 0.36, -0.05), 0.035, M.chrome, 'header-pipe'); tube(V(0.16, 0.36, -0.05), V(0.17, 0.44, 0.78), 0.05, M.chrome, 'exhaust');
  const hl = mk(new THREE.CylinderGeometry(0.105, 0.09, 0.12, 28), M.chrome, 'headlight-bucket'); hl.rotation.x = Math.PI / 2; hl.position.set(0, 0.95, -0.66); bike.add(hl);
  const lens = mk(new THREE.CircleGeometry(0.092, 28), lamp, 'headlight-lens'); lens.position.set(0, 0.95, -0.721); lens.rotation.y = Math.PI; bike.add(lens);
  [-0.17, 0.17].forEach(x => { const ind = mk(new THREE.SphereGeometry(0.03, 8, 6), amber, 'indicator'); ind.position.set(x, 0.92, -0.62); bike.add(ind); });
  tube(V(-0.38, 1.1, -0.42), V(0.38, 1.1, -0.42), 0.014, M.gloss, 'handlebar');
  [-0.36, 0.36].forEach(x => { tube(V(x * 0.98, 1.1, -0.42), V(x, 1.1, -0.42), 0.022, M.rubber, 'grip'); tube(V(x * 0.7, 1.1, -0.42), V(x * 0.8, 1.35, -0.38), 0.008, M.chrome, 'mirror-stem'); const mi = mk(new THREE.CylinderGeometry(0.05, 0.05, 0.015, 14), M.chrome, 'mirror'); mi.rotation.x = Math.PI / 2; mi.position.set(x * 0.8, 1.37, -0.38); bike.add(mi); });
  const wtc = mk(new THREE.CylinderGeometry(0.026, 0.026, 0.014, 18), M.gloss, 'pixel-watch'); wtc.rotation.x = Math.PI / 2 - 0.6; wtc.position.set(0, 1.14, -0.42); bike.add(wtc);
  const wsc = mk(new THREE.CircleGeometry(0.021, 18), screen, 'watch-screen'); wsc.position.set(0, 1.146, -0.414); wsc.rotation.x = -0.6 - Math.PI / 2 + Math.PI / 2; wsc.rotation.x = -0.97; bike.add(wsc);
  const tl = mk(new THREE.BoxGeometry(0.1, 0.05, 0.03), tail, 'taillight'); tl.position.set(0, 0.8, 0.98); bike.add(tl);
  const plate = mk(new THREE.BoxGeometry(0.14, 0.09, 0.015), std('#e9e4da'), 'license-plate'); plate.position.set(0, 0.72, 1.0); plate.rotation.x = -0.25; bike.add(plate);
  const discF = mk(new THREE.TorusGeometry(0.17, 0.012, 6, 20), M.chrome, 'brake-disc'); discF.rotation.y = Math.PI / 2; discF.position.set(-0.08, 0.36, -0.72); bike.add(discF);
  const caliper = mk(new THREE.BoxGeometry(0.04, 0.06, 0.08), M.engine, 'brake-caliper'); caliper.position.set(-0.14, 0.3, -0.72); bike.add(caliper);
  for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; const link = mk(new THREE.BoxGeometry(0.018, 0.018, 0.012), M.chrome, 'chain-link'); link.position.set(0.15, 0.36 + Math.sin(a) * 0.12, 0.35 + Math.cos(a) * 0.34); bike.add(link); }
  { const jacket = std('#3d4a3a', { roughness: 0.85 }), jeans = std('#2a3346', { roughness: 0.9 }), boot = std('#2a1f18'), helm = new THREE.MeshPhysicalMaterial({ color: '#18181c', flatShading: true, roughness: 0.16, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }), visor = std('#0d1a24', { roughness: 0.1, metalness: 0.6 }), skin = std('#b98a66'), glove = std('#1c1a18');
    const rider = new THREE.Group(); rider.name = 'rider'; bike.add(rider);
    const put = (geo, mat, name, p, rx = 0) => { const m = mk(geo, mat, name); m.position.copy(p); m.rotation.x = rx; rider.add(m); return m; };
    const limb = (a, b, r, mat, name) => { const d = new THREE.Vector3().subVectors(b, a); const m = mk(new THREE.CylinderGeometry(r * 0.85, r, d.length(), 10), mat, name); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); rider.add(m); return m; };
    put(new THREE.BoxGeometry(0.34, 0.16, 0.26), jeans, 'hips', V(0, 1.02, 0.3));
    put(new THREE.BoxGeometry(0.38, 0.5, 0.24, 1, 2, 1), jacket, 'torso', V(0, 1.3, 0.16), -0.55);
    put(new THREE.BoxGeometry(0.03, 0.46, 0.01), std('#20241f'), 'jacket-zip', V(0, 1.32, 0.04), -0.55);
    put(new THREE.BoxGeometry(0.3, 0.06, 0.24), std('#2c3628'), 'jacket-collar', V(0, 1.5, 0.1), -0.4);
    put(new THREE.BoxGeometry(0.3, 0.3, 0.16), std('#6b4a2e'), 'backpack', V(0, 1.36, 0.33), -0.55);
    put(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 6), skin, 'neck', V(0, 1.55, 0.02));
    const hel = put(new THREE.IcosahedronGeometry(0.15, 2), helm, 'helmet', V(0, 1.66, -0.02)); hel.scale.set(1, 1.05, 1.12);
    put(new THREE.BoxGeometry(0.22, 0.09, 0.05), visor, 'visor', V(0, 1.66, -0.17), 0.15);
    put(new THREE.BoxGeometry(0.04, 0.03, 0.3), std('#b3202a'), 'helmet-stripe', V(0, 1.81, -0.02));
    [-1, 1].forEach(s => { const sh = V(s * 0.19, 1.47, 0.06), el = V(s * 0.27, 1.27, -0.18), gr = V(s * 0.34, 1.12, -0.4);
      limb(sh, el, 0.055, jacket, 'upper-arm'); limb(el, gr, 0.048, jacket, 'forearm'); put(new THREE.BoxGeometry(0.08, 0.07, 0.1), glove, 'glove', gr);
      const hp = V(s * 0.12, 1.02, 0.28), kn = V(s * 0.21, 0.9, -0.12), ft = V(s * 0.19, 0.47, 0.02);
      limb(hp, kn, 0.075, jeans, 'thigh'); limb(kn, ft, 0.06, jeans, 'shin'); put(new THREE.BoxGeometry(0.1, 0.1, 0.22), boot, 'boot', V(s * 0.19, 0.44, -0.03));
      const peg = mk(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 6), M.chrome, 'footpeg'); peg.rotation.z = Math.PI / 2; peg.position.set(s * 0.17, 0.38, -0.02); bike.add(peg); }); }
  bike.traverse(o => { if (o.isMesh) o.castShadow = !lp; });
  const bikeRoot = new THREE.Group(); bikeRoot.add(bike); scene.add(bikeRoot);
  const head = new THREE.SpotLight('#eaf2ff', 0, 60, 0.42, 0.6, 1.1); head.position.set(0, 0.95, -0.75); const headT = new THREE.Object3D(); headT.position.set(0, 0, -14); bike.add(head, headT); head.target = headT;
  const headGlow = glowSprite('#dff0ff', 1.3, 0.8); headGlow.position.set(0, 0.95, -0.8); bike.add(headGlow);
  const tailGlow = glowSprite('#ff3030', 0.6, 0.7); tailGlow.position.set(0, 0.8, 1.0); bike.add(tailGlow);
  const beamU = { time: { value: 0 }, opacity: { value: 0 } };
  const beamMat = new THREE.ShaderMaterial({ uniforms: beamU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float time; uniform float opacity; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453); }
      void main(){
        float along = vUv.y; float edge = abs(vUv.x-0.5)*2.0;
        float fall = pow(1.0-clamp(along,0.0,1.0), 1.6) * (1.0-smoothstep(0.55,1.0,edge));
        float n = hash(vec2(floor(time*14.0), floor(vUv.y*10.0)));
        float flicker = 0.92 + 0.08*n;
        gl_FragColor = vec4(0.87,0.93,1.0, fall*opacity*flicker);
      }` });
  const beam = mk(new THREE.ConeGeometry(0.85, 3.4, 24, 1, true), beamMat, 'headlight-beam'); beam.rotation.x = -Math.PI / 2; beam.position.set(0, 0.95, -2.3); bike.add(beam);
  const watchGlow = glowSprite('#6ff0ff', 0.18, 0.9); watchGlow.position.set(0, 1.16, -0.41); bike.add(watchGlow);

  // MujaSauros — pillion dino guide
  const dnSkin = std('#4bc97a', { roughness: 0.4, metalness: 0.05 }), dnBelly = std('#fff3c4', { roughness: 0.5 }), dnDark = std('#16321f', { roughness: 0.4 }), dnRed = std('#ff5f6d', { roughness: 0.4 }), dnHorn = new THREE.MeshPhysicalMaterial({ color: '#ffd88c', flatShading: true, roughness: 0.22, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  const dino = new THREE.Group(); dino.name = 'mujasauros';
  const dBody = mk(new THREE.SphereGeometry(0.105, 18, 14), dnSkin, 'dino-body'); dBody.scale.set(1.15, 0.92, 1.35); dBody.position.set(0, 0.135, 0.02); dino.add(dBody);
  const dBelly = mk(new THREE.SphereGeometry(0.08, 16, 12), dnBelly, 'dino-belly'); dBelly.scale.set(1, 0.85, 1.1); dBelly.position.set(0, 0.075, 0.03); dino.add(dBelly);
  const dHead = new THREE.Group(); dHead.name = 'dino-head'; dHead.position.set(0, 0.225, -0.14); dino.add(dHead);
  const dSkull = mk(new THREE.SphereGeometry(0.09, 18, 16), dnSkin, 'dino-skull'); dSkull.scale.set(1.05, 0.95, 1); dHead.add(dSkull);
  const dSnout = mk(new THREE.BoxGeometry(0.09, 0.06, 0.05, 2, 2, 2), dnSkin, 'dino-snout'); dSnout.position.set(0, -0.02, -0.085); dHead.add(dSnout);
  const dJaw = new THREE.Group(); dJaw.name = 'dino-jaw'; dJaw.position.set(0, -0.05, -0.07); dHead.add(dJaw);
  const dJawMesh = mk(new THREE.BoxGeometry(0.075, 0.03, 0.045), dnBelly, 'dino-jaw-mesh'); dJawMesh.position.set(0, -0.008, -0.02); dJaw.add(dJawMesh);
  const dTongue = mk(new THREE.CircleGeometry(0.018, 8), dnRed, 'dino-tongue'); dTongue.position.set(0, -0.003, -0.045); dTongue.rotation.x = -Math.PI / 2; dJaw.add(dTongue);
  const dEars = [], dEyes = []; [-1, 1].forEach(s => {
    const eye = mk(new THREE.SphereGeometry(0.021, 10, 8), dnDark, 'dino-eye'); eye.position.set(s * 0.062, 0.02, -0.055); dHead.add(eye); dEyes.push(eye);
    const shine = mk(new THREE.SphereGeometry(0.006, 6, 6), std('#ffffff'), 'dino-eye-shine'); shine.position.set(s * 0.066, 0.026, -0.066); dHead.add(shine);
    const ear = mk(new THREE.ConeGeometry(0.022, 0.04, 6), dnSkin, 'dino-ear'); ear.position.set(s * 0.075, 0.075, 0.02); ear.rotation.z = s * 0.4; dHead.add(ear); dEars.push(ear); });
  const dBrowHorns = []; [-1, 1].forEach(s => { const h = mk(new THREE.ConeGeometry(0.02, 0.09, 7), dnHorn, 'dino-brow-horn'); h.position.set(s * 0.07, 0.08, -0.05); h.rotation.z = s * -0.45; h.rotation.x = -0.3; dHead.add(h); dBrowHorns.push(h); });
  const dNoseHorn = mk(new THREE.ConeGeometry(0.015, 0.04, 6), dnHorn, 'dino-nose-horn'); dNoseHorn.position.set(0, -0.01, -0.11); dNoseHorn.rotation.x = -1.9; dHead.add(dNoseHorn);
  const dFrill = mk(new THREE.CylinderGeometry(0.1, 0.11, 0.025, 12, 1, true, 0, Math.PI), dnSkin, 'dino-frill'); dFrill.rotation.y = Math.PI; dFrill.position.set(0, 0.09, 0.03); dHead.add(dFrill);
  const dSpikes = []; for (let i = 0; i < 5; i++) { const a = (i / 4 - 0.5) * Math.PI * 0.85; const sp = mk(new THREE.ConeGeometry(0.015, 0.035, 5), dnHorn, 'dino-spike'); sp.position.set(Math.sin(a) * 0.105, 0.115 + Math.cos(a * 0.5) * 0.01, 0.03 + Math.cos(a) * 0.03); sp.rotation.x = 0.5; sp.rotation.z = -a; dHead.add(sp); dSpikes.push(sp); }
  const dLegs = []; [[-0.075, -1], [0.075, -1], [-0.08, 1], [0.08, 1]].forEach(([x, zs]) => { const leg = mk(new THREE.CapsuleGeometry(0.028, 0.05, 6, 10), dnSkin, 'dino-leg'); leg.position.set(x, 0.028, zs * 0.09); dino.add(leg); dLegs.push({ m: leg, side: zs }); });
  const dTail = mk(new THREE.ConeGeometry(0.045, 0.11, 8), dnSkin, 'dino-tail'); dTail.rotation.x = Math.PI / 2 + 0.3; dTail.position.set(0, 0.12, 0.19); dino.add(dTail);
  for (let i = 0; i < 6; i++) { const p = i / 5, sp = mk(new THREE.ConeGeometry(0.013, 0.032, 5), dnHorn, 'dino-spine-spike'); sp.position.set(0, 0.2 - p * 0.02, -0.1 + p * 0.32); sp.rotation.x = -0.2; dino.add(sp); }
  dLegs && [-0.075, 0.075, -0.08, 0.08].forEach((x, i) => { const claw = mk(new THREE.ConeGeometry(0.01, 0.022, 5), dnHorn, 'dino-claw'); claw.position.set(x, 0.008, (i < 2 ? -1 : 1) * 0.09 - 0.03); claw.rotation.x = Math.PI / 2; dino.add(claw); });
  const dinoHit = mk(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), 'dino-hit'); dinoHit.position.set(0, 0.18, -0.04); dino.add(dinoHit);
  // Speech bubble above the head — replaces the old watch-face dialogue
  const dBubbleCanvas = document.createElement('canvas'); dBubbleCanvas.width = 480; dBubbleCanvas.height = 240;
  const dBubbleTex = new THREE.CanvasTexture(dBubbleCanvas); dBubbleTex.colorSpace = THREE.SRGBColorSpace;
  let dinoBubbleT = 0, dinoBubbleOp = 0;
  const dBubbleSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: dBubbleTex, transparent: true, depthWrite: false, opacity: 0, fog: false }));
  dBubbleSprite.name = 'dino-bubble'; dBubbleSprite.center.set(0.5, 0); dBubbleSprite.position.set(0, 0.43, -0.13); dino.add(dBubbleSprite);
  const drawDinoBubble = text => {
    const cx = dBubbleCanvas.getContext('2d'), W = dBubbleCanvas.width;
    const words = text.split(' '), lines = []; let cur = '';
    words.forEach(w => { if ((cur + ' ' + w).trim().length > 24) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; }); if (cur.trim()) lines.push(cur.trim());
    const padX = 26, padTop = 46, lineH = 38, tailH = 22, boxW = W, boxH = padTop + lines.length * lineH + 16, r = 22;
    cx.clearRect(0, 0, W, dBubbleCanvas.height);
    cx.beginPath();
    cx.moveTo(r, 4); cx.lineTo(boxW - r, 4); cx.quadraticCurveTo(boxW, 4, boxW, 4 + r); cx.lineTo(boxW, boxH - r);
    cx.quadraticCurveTo(boxW, boxH, boxW - r, boxH); cx.lineTo(boxW / 2 + 14, boxH); cx.lineTo(boxW / 2, boxH + tailH); cx.lineTo(boxW / 2 - 14, boxH);
    cx.lineTo(r, boxH); cx.quadraticCurveTo(0, boxH, 0, boxH - r); cx.lineTo(0, 4 + r); cx.quadraticCurveTo(0, 4, r, 4); cx.closePath();
    cx.fillStyle = 'rgba(10,13,32,.94)'; cx.fill(); cx.lineWidth = 2; cx.strokeStyle = 'rgba(159,224,110,.55)'; cx.stroke();
    cx.fillStyle = '#9fe06e'; cx.font = '500 20px "JetBrains Mono", monospace'; cx.textBaseline = 'alphabetic'; cx.fillText('MUJASAUROS', padX, 34);
    cx.fillStyle = '#f3fbe9'; cx.font = 'italic 500 28px "Cormorant Garamond", Georgia, serif';
    lines.forEach((l, i) => cx.fillText(l, padX, padTop + 24 + i * lineH));
    dBubbleTex.needsUpdate = true;
    dBubbleSprite.scale.set(1.35, 1.35 * (boxH + tailH) / boxW, 1);
  };
  const setDinoBubble = text => { drawDinoBubble(text); dinoBubbleT = 6.5; };
  bike.add(dino); dino.position.set(0, 0.95, 0.82); dino.scale.setScalar(1.6);
  dino.traverse(o => { o.frustumCulled = false; });
  const rider = bike.getObjectByName('rider');
  const logSeat = new THREE.Vector3(FIRE.x - 0.4, H(FIRE.x - 0.4, FIRE.z + 2.8) - 0.5, FIRE.z + 2.8);
  const logSeatYaw = Math.atan2(FIRE.x - logSeat.x, FIRE.z - logSeat.z) + Math.PI;
  let riderState = 'onBike', riderT = 0; const riderFrom = new THREE.Vector3();
  const dinoSeatPos = new THREE.Vector3(0, 0.95, 0.82), dinoSeatRot = new THREE.Euler(0, 0, 0);
  let dinoState = 'ride', dinoBreath = 0, dinoStand = 0, dinoAway = new THREE.Vector3(), dinoTarget = new THREE.Vector3(), dinoJumpT = 0, dinoRunPhase = 0, dinoSnapAt = 3 + Math.random() * 4, dinoSnapT = -1, dinoLookY = 0, dinoMood = 'curious', dinoJumpFrom = new THREE.Vector3(), dinoJumpTo = new THREE.Vector3(), dinoBaseY = 0, dinoReactT = -1, dinoFleeT = 0, dinoStuckT = 0, dinoSeekLake = false, dinoNoteCool = Object.create(null), curNight = 0, dinoCheckInT = 7, dinoSeekBike = false, dinoLingerT = 0, dinoChaseFF = false, dinoWagBoost = 0, dinoLandT = 0;
  // Roam target: a pet-like dino stays close — mostly chases nearby fireflies or sniffs field notes out of curiosity, otherwise wanders a short distance (avoids trees/rocks and the lake)
  function pickRoamTarget(originX, originZ) {
    dinoChaseFF = false;
    if (Math.random() < 0.3) {
      let bestI = -1, bestD = 6;
      for (let i = 0; i < FN; i++) { const dd = Math.hypot(ffp[i * 3] - originX, ffp[i * 3 + 2] - originZ); if (dd < bestD) { bestD = dd; bestI = i; } }
      if (bestI >= 0) { dinoTarget.set(ffp[bestI * 3], 0, ffp[bestI * 3 + 2]); dinoChaseFF = true; return; }
    }
    if (Math.random() < 0.4) {
      let bestI = -1, bestD = 8;
      for (let i = 0; i < notes.length; i++) { const n = notes[i], dd = Math.hypot(n.w.position.x - originX, n.w.position.z - originZ); if (dd < bestD && (dinoNoteCool[i] || 0) < performance.now()) { bestD = dd; bestI = i; } }
      if (bestI >= 0) { const n = notes[bestI], a2 = Math.random() * Math.PI * 2; dinoTarget.set(n.w.position.x + Math.cos(a2) * 1.3, 0, n.w.position.z + Math.sin(a2) * 1.3); return; }
    }
    for (let tries = 0; tries < 6; tries++) {
      const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random() * 3, x = originX + Math.cos(a) * r, z = originZ + Math.sin(a) * r;
      if (collideAt(x, z, 0.5)) continue;
      if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 2) continue;
      dinoTarget.set(x, 0, z); return;
    }
    dinoTarget.set(originX, 0, originZ);
  }
  // Local obstacle avoidance: deflects around a solid ahead instead of walking straight into it
  function dinoAvoid(px, pz, dirx, dirz) {
    if (!collideAt(px + dirx * 0.4, pz + dirz * 0.4, 0.35)) return [dirx, dirz];
    for (const ang of [0.6, -0.6, 1.15, -1.15]) {
      const ca = Math.cos(ang), sa = Math.sin(ang), ndx = dirx * ca - dirz * sa, ndz = dirx * sa + dirz * ca;
      if (!collideAt(px + ndx * 0.4, pz + ndz * 0.4, 0.35)) return [ndx, ndz];
    }
    return [0, 0];
  }
  let dinoRoamT = 0, rideStarted = false, holdActive = false, holdT = 0;

  // Wildlife — deer grazing in the forest, birds circling above the canopy
  const deerMat = std('#8a6c44'), deerBelly = std('#d8cdb0'), antlerMat = std('#4a3826');
  const deer = [];
  for (let k = 0; k < 8; k++) { let x = 0, z = 0, ok = false; for (let tries = 0; tries < 20; tries++) { z = lerp(zAt(0.12), zAt(0.9), rnd()); x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (14 + rnd() * 55); if (okSpot(x, z, 9)) { ok = true; break; } } if (!ok) continue;
    const y = H(x, z); const g = new THREE.Group(); g.name = 'deer'; g.position.set(x, y, z); g.rotation.y = rnd() * 6;
    const body = mk(new THREE.CapsuleGeometry(0.22, 0.5, 4, 8), deerMat, 'deer-body'); body.rotation.z = Math.PI / 2; body.position.set(0, 0.5, 0); body.castShadow = !lp; g.add(body);
    const neck = mk(new THREE.CylinderGeometry(0.08, 0.1, 0.35, 6), deerMat, 'deer-neck'); neck.position.set(0, 0.72, -0.32); neck.rotation.x = 0.6; g.add(neck);
    const head = mk(new THREE.BoxGeometry(0.14, 0.16, 0.24), deerMat, 'deer-head'); head.position.set(0, 0.92, -0.5); g.add(head);
    const legs = []; [[-0.11, -0.18], [0.11, -0.18], [-0.11, 0.18], [0.11, 0.18]].forEach(([lx, lz]) => { const leg = mk(new THREE.CylinderGeometry(0.035, 0.045, 0.42, 5), deerMat, 'deer-leg'); leg.position.set(lx, 0.24, lz); g.add(leg); legs.push(leg); });
    if (rnd() < 0.5) [-1, 1].forEach(s => { const a = mk(new THREE.ConeGeometry(0.02, 0.16, 4), antlerMat, 'deer-antler'); a.position.set(s * 0.05, 1.02, -0.52); a.rotation.x = -0.3; a.rotation.z = s * 0.3; g.add(a); });
    scene.add(g); deer.push({ g, legs, head, state: 'graze', t: rnd() * 4, phase: rnd() * 6, target: new THREE.Vector3() }); }
  const birdMat = std('#2e2c30'); const birds = [];
  for (let k = 0; k < 22; k++) { const g = new THREE.Group(); g.name = 'bird';
    const body = mk(new THREE.ConeGeometry(0.04, 0.14, 4), birdMat, 'bird-body'); body.rotation.x = Math.PI / 2; g.add(body);
    const wL = mk(new THREE.PlaneGeometry(0.16, 0.05), birdMat, 'bird-wing'); wL.position.set(-0.08, 0, 0); g.add(wL);
    const wR = mk(new THREE.PlaneGeometry(0.16, 0.05), birdMat, 'bird-wing'); wR.position.set(0.08, 0, 0); g.add(wR);
    scene.add(g); const cz = lerp(zAt(0.1), zAt(0.85), rnd()), cx = roadX(cz) + (rnd() - 0.5) * 90;
    birds.push({ g, wL, wR, cx, cz, r: 6 + rnd() * 10, h: 16 + rnd() * 10 + H(cx, cz), ph: rnd() * 6, spd: 0.3 + rnd() * 0.3, flap: rnd() * 10, scatter: 0 }); }

  // Butterflies — small fluttering accents near forest clearings
  const flyMat = new THREE.MeshBasicMaterial({ color: '#f2b56b', side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
  const BF = lp ? 12 : 26, flies2 = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.09, 0.06), flyMat, BF); flies2.name = 'butterflies'; flies2.frustumCulled = false;
  const flyDat = []; const BFC = ['#f2b56b', '#f6ecd8', '#9fe06e', '#e88a5a'].map(c => new THREE.Color(c));
  for (let k = 0; k < BF; k++) { const z = lerp(zAt(0.12), zAt(0.88), rnd()), x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (8 + rnd() * 40), y = H(x, z) + 0.6 + rnd() * 0.8;
    flies2.setColorAt(k, BFC[k % BFC.length]); flyDat.push({ x0: x, y0: y, z0: z, ph: rnd() * 10, spd: 0.6 + rnd() * 0.8 }); }
  scene.add(flies2);

  // Night owls — perched forest sentries, active after dark
  const owlMat = std('#5a4a3a'), owlBelly = std('#c9a878'), owlEye = new THREE.MeshBasicMaterial({ color: '#ffd35a' });
  const owls = [];
  for (let k = 0; k < 3; k++) { let x = 0, z = 0; for (let tries = 0; tries < 20; tries++) { z = lerp(zAt(0.15), zAt(0.8), rnd()); x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (10 + rnd() * 30); if (okSpot(x, z, 6)) break; }
    const y = H(x, z); const g = new THREE.Group(); g.name = 'owl'; g.position.set(x, y + 1.4, z);
    const body = mk(new THREE.SphereGeometry(0.13, 10, 8), owlMat, 'owl-body'); body.scale.set(1, 1.25, 0.9); g.add(body);
    const belly = mk(new THREE.SphereGeometry(0.09, 8, 6), owlBelly, 'owl-belly'); belly.position.set(0, -0.02, 0.09); g.add(belly);
    [-1, 1].forEach(s => { const ear = mk(new THREE.ConeGeometry(0.025, 0.06, 5), owlMat, 'owl-ear'); ear.position.set(s * 0.06, 0.19, 0.02); g.add(ear);
      const eye = mk(new THREE.SphereGeometry(0.028, 8, 6), owlEye, 'owl-eye'); eye.position.set(s * 0.05, 0.08, 0.11); g.add(eye); });
    const beak = mk(new THREE.ConeGeometry(0.02, 0.04, 5), std('#e8a83a'), 'owl-beak'); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.03, 0.13); g.add(beak);
    scene.add(g); owls.push({ g, ph: rnd() * 10, blinkAt: 2 + rnd() * 4 }); }

  // Lake fish jumps
  const fishMat = std('#b7c4cf', { roughness: 0.3, metalness: 0.2 });
  const fishJump = mk(new THREE.CapsuleGeometry(0.05, 0.16, 3, 6), fishMat, 'fish'); fishJump.visible = false; scene.add(fishJump);
  let fishT = 4 + Math.random() * 6, fishJumping = 0, fishFrom = new THREE.Vector3(), fishTo = new THREE.Vector3();
  const fishSplash = glowSprite('#dff4ff', 1.6, 0); scene.add(fishSplash);

  // New wildlife — rabbits, foxes, squirrels, mountain goats, a desert roadrunner: each an ownable silhouette with idle/wander/flee behavior
  const critters = [];
  function spawnCritter(kind, zRange, mat, opt) {
    for (let tries = 0; tries < 26; tries++) {
      const z = lerp(zRange[0], zRange[1], rnd()), x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (opt.minOff + rnd() * 45);
      if (!okSpot(x, z, opt.clear)) continue;
      const y = H(x, z); const g = new THREE.Group(); g.name = kind; g.position.set(x, y, z); g.rotation.y = rnd() * 6;
      const legs = []; opt.build(g, mat, legs);
      scene.add(g); critters.push({ g, legs, kind, state: 'idle', t: rnd() * 3, phase: rnd() * 6, target: new THREE.Vector3(), hop: !!opt.hop, wanderSpd: opt.wanderSpd, fleeSpd: opt.fleeSpd, fleeDist: opt.fleeDist, gait: opt.gait || 6 });
      return;
    }
  }
  const cM = { rabbit: std('#c9b896'), rabbitTail: std('#fbf3e2'), fox: std('#d9743a'), foxTip: std('#f6ecd8'), squirrel: std('#8a6a44'), squirrelTail: std('#d8cdb0'), goat: std('#d9d3c0'), goatHorn: std('#463a2c'), roadr: std('#6b5a3a'), roadrCrest: std('#2f2a1c'), roadrLeg: std('#c98a3a') };
  for (let k = 0; k < 14; k++) spawnCritter('rabbit', [zAt(0.08), zAt(0.92)], cM.rabbit, { hop: true, wanderSpd: 1.1, fleeSpd: 5.2, fleeDist: 6, clear: 5, minOff: 6,
    build: (g, mat, legs) => { const body = mk(new THREE.CapsuleGeometry(0.085, 0.1, 3, 6), mat, 'rabbit-body'); body.rotation.z = Math.PI / 2; body.position.y = 0.1; g.add(body);
      const head = mk(new THREE.SphereGeometry(0.065, 8, 6), mat, 'rabbit-head'); head.position.set(0, 0.17, -0.11); g.add(head);
      [-1, 1].forEach(s => { const ear = mk(new THREE.CapsuleGeometry(0.016, 0.11, 2, 4), mat, 'rabbit-ear'); ear.position.set(s * 0.028, 0.3, -0.12); ear.rotation.z = s * 0.12; g.add(ear); });
      const tail = mk(new THREE.SphereGeometry(0.04, 6, 6), cM.rabbitTail, 'rabbit-tail'); tail.position.set(0, 0.12, 0.12); g.add(tail);
      for (let i = 0; i < 4; i++) { const leg = mk(new THREE.CylinderGeometry(0.018, 0.022, 0.09, 5), mat, 'rabbit-leg'); leg.position.set((i % 2 ? 1 : -1) * 0.045, 0.045, i < 2 ? -0.05 : 0.05); g.add(leg); legs.push(leg); } } });
  for (let k = 0; k < 9; k++) spawnCritter('fox', [zAt(0.55), zAt(0.97)], cM.fox, { wanderSpd: 1.3, fleeSpd: 5.6, fleeDist: 7, clear: 6, minOff: 8,
    build: (g, mat, legs) => { const body = mk(new THREE.CapsuleGeometry(0.11, 0.22, 4, 8), mat, 'fox-body'); body.rotation.z = Math.PI / 2; body.position.y = 0.16; body.castShadow = !lp; g.add(body);
      const head = mk(new THREE.ConeGeometry(0.09, 0.2, 6), mat, 'fox-head'); head.rotation.x = Math.PI / 2; head.position.set(0, 0.22, -0.24); g.add(head);
      [-1, 1].forEach(s => { const ear = mk(new THREE.ConeGeometry(0.035, 0.08, 5), mat, 'fox-ear'); ear.position.set(s * 0.05, 0.32, -0.2); g.add(ear); });
      const tail = mk(new THREE.ConeGeometry(0.07, 0.42, 7), mat, 'fox-tail'); tail.rotation.x = Math.PI / 2 + 0.5; tail.position.set(0, 0.2, 0.32); g.add(tail);
      const tip = mk(new THREE.SphereGeometry(0.045, 6, 6), cM.foxTip, 'fox-tail-tip'); tip.position.set(0, 0.09, 0.52); g.add(tip);
      for (let i = 0; i < 4; i++) { const leg = mk(new THREE.CylinderGeometry(0.025, 0.03, 0.17, 5), mat, 'fox-leg'); leg.position.set((i % 2 ? 1 : -1) * 0.07, 0.09, i < 2 ? -0.1 : 0.1); g.add(leg); legs.push(leg); } } });
  for (let k = 0; k < 12; k++) spawnCritter('squirrel', [zAt(0.1), zAt(0.75)], cM.squirrel, { wanderSpd: 1.6, fleeSpd: 5.8, fleeDist: 5, clear: 4, minOff: 4, gait: 10,
    build: (g, mat, legs) => { const body = mk(new THREE.CapsuleGeometry(0.055, 0.08, 3, 6), mat, 'sq-body'); body.rotation.x = 0.5; body.position.y = 0.08; g.add(body);
      const head = mk(new THREE.SphereGeometry(0.045, 8, 6), mat, 'sq-head'); head.position.set(0, 0.13, -0.08); g.add(head);
      const tail = mk(new THREE.ConeGeometry(0.06, 0.26, 6), cM.squirrelTail, 'sq-tail'); tail.rotation.x = -1.3; tail.position.set(0, 0.2, 0.12); g.add(tail);
      for (let i = 0; i < 4; i++) { const leg = mk(new THREE.CylinderGeometry(0.014, 0.017, 0.07, 4), mat, 'sq-leg'); leg.position.set((i % 2 ? 1 : -1) * 0.035, 0.035, i < 2 ? -0.04 : 0.04); g.add(leg); legs.push(leg); } } });
  for (let k = 0; k < 7; k++) spawnCritter('goat', [sZ(2) + 60, sZ(3) - 55], cM.goat, { wanderSpd: 0.8, fleeSpd: 4.2, fleeDist: 8, clear: 7, minOff: 3, gait: 4,
    build: (g, mat, legs) => { const body = mk(new THREE.CapsuleGeometry(0.16, 0.26, 4, 8), mat, 'goat-body'); body.rotation.z = Math.PI / 2; body.position.y = 0.32; body.castShadow = !lp; g.add(body);
      const head = mk(new THREE.BoxGeometry(0.14, 0.16, 0.2), mat, 'goat-head'); head.position.set(0, 0.46, -0.28); g.add(head);
      [-1, 1].forEach(s => { const horn = mk(new THREE.ConeGeometry(0.025, 0.22, 6), cM.goatHorn, 'goat-horn'); horn.position.set(s * 0.06, 0.58, -0.32); horn.rotation.x = -0.7; horn.rotation.z = s * 0.3; g.add(horn); });
      for (let i = 0; i < 4; i++) { const leg = mk(new THREE.CylinderGeometry(0.032, 0.038, 0.32, 5), mat, 'goat-leg'); leg.position.set((i % 2 ? 1 : -1) * 0.1, 0.16, i < 2 ? -0.16 : 0.16); g.add(leg); legs.push(leg); } } });
  for (let k = 0; k < 8; k++) spawnCritter('roadrunner', [DESERT.z - DESERT.r, DESERT.z + DESERT.r], cM.roadr, { wanderSpd: 1.8, fleeSpd: 8, fleeDist: 7, clear: 4, minOff: 4, gait: 12,
    build: (g, mat, legs) => { const body = mk(new THREE.ConeGeometry(0.09, 0.32, 6), mat, 'rr-body'); body.rotation.x = Math.PI / 2 + 0.2; body.position.y = 0.24; g.add(body);
      const head = mk(new THREE.SphereGeometry(0.05, 8, 6), mat, 'rr-head'); head.position.set(0, 0.33, -0.2); g.add(head);
      const beak = mk(new THREE.ConeGeometry(0.015, 0.1, 5), cM.roadrCrest, 'rr-beak'); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.33, -0.29); g.add(beak);
      const crest = mk(new THREE.ConeGeometry(0.02, 0.08, 4), cM.roadrCrest, 'rr-crest'); crest.position.set(0, 0.4, -0.16); crest.rotation.x = -0.4; g.add(crest);
      const tail = mk(new THREE.PlaneGeometry(0.06, 0.3), mat, 'rr-tail'); tail.position.set(0, 0.28, 0.24); tail.rotation.x = 0.3; g.add(tail);
      [-1, 1].forEach(s => { const leg = mk(new THREE.CylinderGeometry(0.012, 0.014, 0.2, 4), cM.roadrLeg, 'rr-leg'); leg.position.set(s * 0.03, 0.1, 0); g.add(leg); legs.push(leg); }); } });

  // Fireflies
  const FN = lp ? 140 : 320; const ffg = new THREE.BufferGeometry(); const ffp = new Float32Array(FN * 3), ffv = new Float32Array(FN * 3);
  ffg.setAttribute('position', new THREE.BufferAttribute(ffp, 3));
  const ffm = new THREE.PointsMaterial({ color: '#e4ff8a', size: 0.32, map: GT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.4 });
  const flies = new THREE.Points(ffg, ffm); flies.name = 'fireflies'; flies.frustumCulled = false; scene.add(flies);
  let fliesInit = false;
  // Ambient world wind — curved wisps drifting the terrain, independent of rider speed
  const AWN = lp ? 30 : 60;
  const awMat = new THREE.MeshBasicMaterial({ color: '#f2ead2', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: true, side: THREE.DoubleSide });
  const awCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, -1), new THREE.Vector3(0.3, 0.05, -0.3), new THREE.Vector3(-0.22, -0.03, 0.35), new THREE.Vector3(0.1, 0, 1)]);
  const awStreaks = new THREE.InstancedMesh(new THREE.TubeGeometry(awCurve, 14, 0.02, 5, false), awMat, AWN); awStreaks.name = 'ambient-wind'; awStreaks.frustumCulled = false; scene.add(awStreaks);
  const awDat = Array.from({ length: AWN }, () => ({ x: (Math.random() - 0.5) * 100, z: (Math.random() - 0.5) * 100, t: Math.random() * 20, ph: Math.random() * 10, spd: 0.6 + Math.random() * 1.3, len: 1 + Math.random() * 2.2, curl: 0.6 + Math.random() * 1.4 }));
  const wind = new THREE.Group(); wind.name = 'wind'; scene.add(wind);
  const WN = lp ? 26 : 50, streakMat = new THREE.MeshBasicMaterial({ color: '#fff4e0', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const streaks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.016, 0.016, 1), streakMat, WN); streaks.name = 'wind-streaks'; streaks.frustumCulled = false; wind.add(streaks);
  const sdat = Array.from({ length: WN }, () => ({ x: (Math.random() - 0.5) * 7, y: 0.3 + Math.random() * 3.2, z: -30 + Math.random() * 36, l: 0.6 + Math.random() * 1.4 }));
  const LN = lp ? 16 : 36, leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, side: THREE.DoubleSide, roughness: 0.9 });
  const leaves = new THREE.InstancedMesh(new THREE.CircleGeometry(0.08, 3), leafMat, LN); leaves.name = 'wind-leaves'; leaves.frustumCulled = false; wind.add(leaves);
  const LC = ['#9bb04a', '#c98a3a', '#6f8f3a', '#d8b35a'].map(c => new THREE.Color(c));
  const ldat = Array.from({ length: LN }, (_, i) => { leaves.setColorAt(i, LC[i % 4]); return { x: (Math.random() - 0.5) * 9, y: Math.random() * 3, z: -24 + Math.random() * 30, r: Math.random() * 6, s: 0.6 + Math.random() }; });
  const wO = new THREE.Object3D();

  // Environment keys
  const K = [
    { t: 0, top: '#2a3a7c', mid: '#9a6f9a', hor: '#ffb067', fog: '#e29a72', hs: '#ffe0b8', hg: '#4d3f5f', hi: 1.7, ki: 2.6, kc: '#ffb070', cl: '#ffd9bd', fn: 60, ff: 620 },
    { t: 0.5, top: '#1a235e', mid: '#5c4789', hor: '#e8805f', fog: '#8e5f7c', hs: '#e0c0e6', hg: '#362d4c', hi: 1.4, ki: 1.7, kc: '#ff9a6a', cl: '#c89cb2', fn: 45, ff: 520 },
    { t: 0.76, top: '#0a1030', mid: '#18245a', hor: '#324a8c', fog: '#28356e', hs: '#96a8ec', hg: '#333f78', hi: 1.55, ki: 1.75, kc: '#a9bcff', cl: '#56629a', fn: 42, ff: 620 },
    { t: 1, top: '#0a0f2e', mid: '#1a2660', hor: '#384f92', fog: '#2b3970', hs: '#9cb0f0', hg: '#354080', hi: 1.6, ki: 1.8, kc: '#b3c3ff', cl: '#5a669e', fn: 42, ff: 620 }].map(k => ({ ...k, top: new THREE.Color(k.top), mid: new THREE.Color(k.mid), hor: new THREE.Color(k.hor), fog: new THREE.Color(k.fog), hs: new THREE.Color(k.hs), hg: new THREE.Color(k.hg), kc: new THREE.Color(k.kc), cl: new THREE.Color(k.cl) }));
  const envAt = t => { let i = 0; while (i < K.length - 2 && t > K[i + 1].t) i++; const a = K[i], b = K[i + 1], f = sstep(a.t, b.t, t); const o = {}; for (const k in a) o[k] = a[k].isColor ? a[k].clone().lerp(b[k], f) : lerp(a[k], b[k], f); return o; };
  const SUN = new THREE.Vector3(), MOON = skyU.moonDir.value;

  // Input
  let lastMouse = 0; const aimNDC = new THREE.Vector2(), projV = new THREE.Vector3(), headAim = new THREE.Vector3(0, 0, -14), gPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), gPt = new THREE.Vector3();
  let target = 0, t = 0, steer = 0, steerT = 0, keyDir = 0, mobile = !!opts.mobile;
  let vel = 0, yawOff = 0, pitchOff = 0, lastPan = 0, free = false, fx = 0, fz = 0, fh = 0, fs = 0, curSpeed = 0, lastFreeCb = 0, brakeSpd = 0, shake = 0, lastBX = 0, lastBZ = 0, lastYaw = 0, susY = null, susVel = 0, susFront = 0, susRear = 0, susFrontV = 0, susRearV = 0, stickX = 0, stickY = 0, airY = 0, airVel = 0, grounded = true; const keys = {}, touch = {};
  const mouse = new THREE.Vector2(0, 0), mouseW = new THREE.Vector3(), ray = new THREE.Raycaster();
  let down = null, lastRip = 0, hover = -1;
  const wPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -LAKE.y), wPt = new THREE.Vector3();
  const firePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), firePt = new THREE.Vector3();
  const fireHit = () => { const gy = hFast(FIRE.x, FIRE.z); firePlane.constant = -(gy + 0.5); ray.setFromCamera(mouse, camera); const p = ray.ray.intersectPlane(firePlane, firePt); return p && Math.hypot(p.x - FIRE.x, p.z - FIRE.z) < 3 ? p : null; };
  const waterHit = () => { ray.setFromCamera(mouse, camera); const p = ray.ray.intersectPlane(wPlane, wPt); return p && Math.hypot(p.x - LAKE.x, p.z - LAKE.z) < LAKE.r * 1.4 && camera.position.distanceTo(p) < 400 ? p : null; };
  // Adaptive quality tiers
  const maxTier = lp ? 2 : 3; let tier = lp ? 1 : 3, frameNo = 0, drawDist = 1, paused = false, forceLow = lp; const perf = { acc: 0, n: 0, prev: 0, cool: 0, good: 0 };
  const TIERS = [{ pr: 0.6, sh: false, dd: 0.6 }, { pr: 0.85, sh: false, dd: 0.8 }, { pr: 1.25, sh: true, dd: 1 }, { pr: 1.75, sh: true, dd: 1 }];
  renderer.shadowMap.autoUpdate = false;
  const setTier = k => { tier = k; const c = TIERS[k]; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, c.pr)); renderer.setSize(host.clientWidth, host.clientHeight); resizePost(); if (key.castShadow !== c.sh) key.castShadow = c.sh; renderer.shadowMap.needsUpdate = true; drawDist = c.dd; document.documentElement.classList.toggle('lite', k <= 1); awStreaks.visible = k > 0; opts.onTier && opts.onTier(k); };
  setTier(tier);
  const toNDC = e => { const r = canvas.getBoundingClientRect(); mouse.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
  const hitNote = () => { ray.setFromCamera(mouse, camera); const h = ray.intersectObjects(notes.map(n => n.hit)); return h.length ? h[0].object.userData.note : -1; };
  const hitDino = () => { ray.setFromCamera(mouse, camera); return ray.intersectObject(dinoHit, true).length > 0; };
  const startFlee = () => { const dx = dino.position.x - lastBX, dz = dino.position.z - lastBZ, d = Math.hypot(dx, dz) || 1, away = 3 + Math.random() * 3;
    dinoTarget.set(dino.position.x + dx / d * away, 0, dino.position.z + dz / d * away); dinoFleeT = 4.5 + Math.random() * 2.5; };
  const clickDino = () => { dinoReactT = 0.5; if (dinoState === 'roam') { dinoSeekLake = false; dinoSeekBike = false; dinoLingerT = 0; opts.onDino && opts.onDino('flee'); startFlee(); } else { opts.onDino && opts.onDino('poke'); } };
  const onDown = e => { down = { x: e.clientX, y: e.clientY, yo: yawOff, po: pitchOff, t: performance.now(), drag: false, pad: mobile && free && e.clientY > host.clientHeight * 0.5 && e.clientX < host.clientWidth * 0.55 }; };
  const onMove = e => { toNDC(e); if (e.pointerType !== 'touch') lastMouse = performance.now();
    if (down) { const dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.hypot(dx, dy) > 6) down.drag = true;
      if (down.drag && down.pad) { const R = 70; let ddx = dx, ddy = dy; const d = Math.hypot(ddx, ddy); if (d > R) { ddx = ddx / d * R; ddy = ddy / d * R; } stickX = clamp(ddx / R, -1, 1); stickY = clamp(-ddy / R, -1, 1); }
      else if (down.drag) { yawOff = down.yo - dx * 0.006; pitchOff = clamp(down.po + dy * 0.004, -0.3, 0.9); lastPan = performance.now(); } }
    const now = performance.now();
    if (e.target === canvas && now - lastRip > 90) { lastRip = now; const wp = waterHit(); if (wp) wU.rip.value[ripI++ % 8].set(wp.x, wp.z, wU.time.value); hover = hitNote(); canvas.style.cursor = hover >= 0 ? 'pointer' : fireHit() ? 'pointer' : hitDino() ? 'pointer' : down && down.drag ? 'grabbing' : 'grab'; } };
  const onUp = e => { if (down && down.pad) { stickX = 0; stickY = 0; }
    if (down && !down.drag && e.target === canvas && performance.now() - down.t < 500) { toNDC(e); const n = hitNote(); if (n >= 0) opts.onNote && opts.onNote(n, e.clientX, e.clientY); else if (hitDino()) clickDino(); else { const wp = waterHit(); if (wp) for (let k = 0; k < 3; k++) wU.rip.value[ripI++ % 8].set(wp.x + k * 0.01, wp.z, wU.time.value + k * 0.35); } } down = null; };
  const KM = { arrowleft: 'l', a: 'l', arrowright: 'r', d: 'r', arrowup: 'u', w: 'u', arrowdown: 'b', s: 'b', ' ': 'jump' };
  const onKey = e => { if (e.target && /input|textarea|select/i.test(e.target.tagName)) return; const m = KM[(e.key || '').toLowerCase()]; if (!m) return; if (!free && (m === 'u' || m === 'b' || m === 'jump')) return; keys[m] = e.type === 'keydown'; e.preventDefault(); };
  canvas.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
  const onResize = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h); resizePost(); camera.aspect = w / h; camera.fov = w < h ? 64 : 52; camera.updateProjectionMatrix(); };
  window.addEventListener('resize', onResize); onResize();
  if (typeof ResizeObserver !== 'undefined') { const ro = new ResizeObserver(onResize); ro.observe(host); }

  // Camera config per stop: orbit angle, look shift, lift
  const CAM = [[0, 0, 0], [0.6, 1, 0], [0.6, 1, 0], [0.6, 1, 0], [0.15, 0, 1.8], [0.6, 1, 0], [0.6, 1, 0], [1.25, 1, 1.4], [0.5, 0.15, -0.5]];
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  let introArmed = !opts.holdIntro, introStart = null, prevZ = zAt(0), last = performance.now(), running = true, raf = 0, readySent = false, lean = 0;
  const clock0 = performance.now();

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!running || paused) { perf.prev = 0; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now; const T = (now - clock0) / 1000;
    frameNo++; const fi = perf.prev ? now - perf.prev : 16; perf.prev = now;
    if (fi < 200) { perf.acc += fi; perf.n++; }
    if (perf.n >= 60) { const ms = perf.acc / perf.n; perf.acc = 0; perf.n = 0;
      if (now - perf.cool > 2500) { if (ms > 21 && tier > 0) { setTier(tier - 1); perf.cool = now; perf.good = 0; } else if (ms < 17.5) { if (++perf.good >= 5 && tier < (forceLow ? 0 : maxTier)) { setTier(tier + 1); perf.cool = now; perf.good = 0; } } else perf.good = 0; } }
    if (introStart === null && introArmed) introStart = now;
    const intro = introStart === null ? 0 : sstep(0, 1, (now - introStart) / 6500);
    { const gap = (target - t) * L, vmax = 34 + Math.max(0, Math.abs(gap) - 60) * 0.6, want = clamp(gap * 1.4, -vmax, vmax); vel += (want - vel) * (1 - Math.exp(-dt * 2.2)); t = clamp(t + vel * dt / L, 0, 1); if (Math.abs(gap) < 0.05 && Math.abs(vel) < 0.5) { t = target; vel = 0; } }
    if (!down && now - lastPan > 2500) { yawOff *= Math.exp(-dt * 1.2); pitchOff *= Math.exp(-dt * 1.2); }
    keyDir = clamp((keys.r || touch.r ? 1 : 0) - (keys.l || touch.l ? 1 : 0) + stickX, -1, 1);
    let bp, yaw, z, fr, spd, pitch;
    if (!free) {
      if (keyDir) steerT = clamp(steerT + keyDir * dt * 1.8, -1, 1); else steerT *= Math.exp(-dt * 0.35);
      const ps = steer; steer += (steerT - steer) * (1 - Math.exp(-dt * 5));
      z = zAt(t); fr = frame(z);
      bp = tmp.set(roadX(z), roadY(z) + 0.04, z).addScaledVector(fr.r, steer * (roadW(z) - 0.8));
      yaw = Math.atan2(-fr.f.x, -fr.f.z); pitch = Math.atan(fr.slope) * 0.8;
      const curv = (roadX(z - 3) - 2 * roadX(z) + roadX(z + 3));
      spd = Math.abs(prevZ - z) / Math.max(dt, 1e-3);
      lean += (clamp(-(steer - ps) / Math.max(dt, 1e-3) * 0.15 + curv * spd * 0.028, -0.52, 0.52) - lean) * (1 - Math.exp(-dt * 7));
      wheels.forEach(w => { w.rotation.x -= (prevZ - z) / 0.36; });
      fx = bp.x; fz = bp.z; fh = yaw; fs = 0;
    } else {
      const thr = clamp((keys.u || touch.u ? 1 : 0) - (keys.b || touch.b ? 1 : 0) + stickY, -1, 1);
      const accel = (thr > 0 ? (fs < 0 ? 20 : 12) : (fs > 0 ? 20 : 8)) * (1 - Math.min(0.6, Math.abs(fs) / 30));
      fs += thr * dt * accel; if (!thr) fs *= Math.exp(-dt * 0.85); fs = clamp(fs, -5, 24);
      const turnRate = 2.3 * clamp(1 - Math.abs(fs) / 42, 0.6, 1);
      fh -= keyDir * dt * turnRate * clamp(Math.abs(fs) / 2.2, 0.18, 1) * (fs < 0 ? -1 : 1);
      const dir = fs < 0 ? -1 : 1, nx = fx - Math.sin(fh) * fs * dt, nz = fz - Math.cos(fh) * fs * dt;
      const steep = roadDist(nx, nz) > roadW(nz) + 0.5 && hFast(fx - Math.sin(fh) * dir, fz - Math.cos(fh) * dir) - hFast(fx, fz) > 1.0;
      const hit = collideAt(nx, nz, 0.25);
      if (nx > TX0 + 25 && nx < TX1 - 25 && nz < TZ0 - 25 && nz > TZ1 + 25 && !steep && !hit) { fx = nx; fz = nz; } else { fs *= -0.3; shake = 1; opts.onBrake && opts.onBrake();
        if (hit) { const pdx = fx - hit.x, pdz = fz - hit.z, pl = Math.hypot(pdx, pdz) || 1, nx2 = pdx / pl, nz2 = pdz / pl, tx2 = -nz2, tz2 = nx2;
          const along = (nx - fx) * tx2 + (nz - fz) * tz2; fx += nx2 * 0.12 + tx2 * along * 0.6; fz += nz2 * 0.12 + tz2 * along * 0.6; } }
      z = fz; const gy0 = groundY(fx, fz);
      if ((keys.jump || touch.jump) && grounded) { airVel = 7.2; grounded = false; shake = Math.max(shake, 0.3); }
      if (!grounded) { airVel -= 20 * dt; airY += airVel * dt; if (airY <= 0) { airY = 0; airVel = 0; grounded = true; shake = Math.max(shake, 0.55); } }
      bp = tmp.set(fx, gy0 + airY, fz); yaw = fh;
      const ga = groundY(fx - Math.sin(fh) * 0.8, fz - Math.cos(fh) * 0.8), gb = groundY(fx + Math.sin(fh) * 0.8, fz + Math.cos(fh) * 0.8); pitch = Math.atan2(ga - gb, 1.6);
      lean += (clamp(keyDir * fs * 0.04, -0.52, 0.52) - lean) * (1 - Math.exp(-dt * 6));
      spd = Math.abs(fs); wheels.forEach(w => { w.rotation.x -= fs * dt / 0.36; });
      fr = { f: new THREE.Vector3(-Math.sin(fh), 0, -Math.cos(fh)), r: new THREE.Vector3(Math.cos(fh), 0, -Math.sin(fh)) };
      if (opts.onFree && T - lastFreeCb > 0.25) { lastFreeCb = T; opts.onFree(clamp((Z0 - fz) / L, 0, 1), fs); }
    }
    prevZ = z; lastYaw = yaw;
    if (susY === null) susY = bp.y;
    susVel += (bp.y - susY) * 300 * dt; susVel *= Math.max(0, 1 - dt * 12.5); susY += susVel * dt;
    const susTravel = clamp(bp.y - susY, -0.19, 0.25); susY = bp.y - susTravel;
    const groundYAhead = groundY(bp.x - Math.sin(yaw) * 0.75, bp.z - Math.cos(yaw) * 0.75), groundYBack = groundY(bp.x + Math.sin(yaw) * 0.65, bp.z + Math.cos(yaw) * 0.65);
    susFrontV += ((groundYAhead - bp.y) - susFront) * 250 * dt; susFrontV *= Math.max(0, 1 - dt * 14); susFront += susFrontV * dt; susFront = clamp(susFront, -0.16, 0.12);
    susRearV += ((groundYBack - bp.y) - susRear) * 250 * dt; susRearV *= Math.max(0, 1 - dt * 14); susRear += susRearV * dt; susRear = clamp(susRear, -0.16, 0.12);
    bp.y = susY;
    if (Math.abs(susTravel) > 0.04) shake = Math.max(shake, Math.min(1, Math.abs(susTravel) * 3.5));
    bikeRoot.position.copy(bp); bikeRoot.rotation.set(pitch + (susRear - susFront) * 0.4, yaw, 0, 'YXZ'); bike.rotation.z = -lean;
    lastBX = bp.x; lastBZ = bp.z;
    curSpeed += (Math.min(spd, 30) - curSpeed) * (1 - Math.exp(-dt * 3));
    const brakeAmt = clamp(Math.max(0, brakeSpd - curSpeed) * 6, 0, 1); brakeSpd = curSpeed;
    const tE = free ? clamp((Z0 - fz) / L, 0, 1) : t;

    // env
    const e = envAt(tE), night = sstep(0.42, 0.76, tE), glow = sstep(0.5, 0.86, tE);
    skyU.top.value.copy(e.top); skyU.mid.value.copy(e.mid); skyU.hor.value.copy(e.hor); skyU.night.value = night; skyU.time.value = T;
    SUN.set(-0.5, lerp(0.09, -0.14, sstep(0, 0.52, tE)), -0.86).normalize(); skyU.sunDir.value.copy(SUN);
    scene.fog.color.copy(e.fog); scene.fog.near = e.fn * drawDist; scene.fog.far = e.ff * drawDist;
    if (frameNo % 8 === 0) { const lim = scene.fog.far + 20, cp = camera.position; for (const c of chunks) c.visible = Math.hypot(c.userData.cx - cp.x, c.userData.cz - cp.z) - c.userData.r < lim; }
    hemi.color.copy(e.hs); hemi.groundColor.copy(e.hg); hemi.intensity = e.hi;
    const ld = tmp2.copy(SUN).lerp(MOON, sstep(0.42, 0.62, tE)); ld.y = Math.max(ld.y, 0.4); ld.normalize();
    key.color.copy(e.kc); key.intensity = e.ki; key.position.copy(bp).addScaledVector(ld, 60); key.target.position.copy(bp);
    cloudMat.color.copy(e.cl); wU.skyc.value.copy(e.hor).lerp(e.mid, 0.4); wU.time.value = T; wU.gust.value = windAmtU.value; wU.fogColor.value.copy(scene.fog.color); wU.fogNear.value = scene.fog.near; wU.fogFar.value = scene.fog.far;
    head.intensity = lerp(3, 30, night); headGlow.material.opacity = lerp(0.35, 0.95, night); beamU.opacity.value = lerp(0, 0.22, night); beamU.time.value = T;
    ambientFill.intensity = 0.6 + night * 0.2 + glow * 0.15;
    tailGlow.material.opacity = lerp(0.3, 0.8, night) + brakeAmt * 0.6; tailGlow.scale.setScalar(0.6 + brakeAmt * 0.5);

    // MujaSauros behavior
    { dinoBreath += dt;
      curNight = night;
      const mood = dinoFleeT > 0 ? 'scared' : night ? 'sleepy' : (curSpeed > 8 ? 'thrilled' : (dinoState !== 'ride' ? 'playful' : 'curious')); dinoMood = mood;
      const breathe = 1 + Math.sin(dinoBreath * (mood === 'sleepy' ? 1.6 : 3.2)) * (mood === 'sleepy' ? 0.02 : 0.045);
      dBody.scale.set(1.15, breathe * 0.92, breathe * 0.96 * 1.35 + 0.04);
      const earPerk = mood === 'thrilled' ? 0.15 : mood === 'sleepy' ? -0.4 : Math.sin(dinoBreath * 2) * 0.08;
      dEars.forEach((e, i) => { e.rotation.z = (i === 0 ? -1 : 1) * (0.4 - earPerk); });
      dHead.rotation.x = mood === 'sleepy' ? 0.5 : Math.sin(dinoBreath * 0.6) * 0.06;
      dTail.rotation.z = Math.sin(dinoBreath * (mood === 'thrilled' ? 5 : 2 + dinoWagBoost * 3)) * (mood === 'sleepy' ? 0.08 : 0.3 + dinoWagBoost * 0.4);
      dinoSnapT -= dt;
      if (dinoState === 'ride' || dinoState === 'roam') { dinoSnapAt -= dt; if (dinoSnapAt <= 0) { dinoSnapT = 0.35; dinoSnapAt = 3 + Math.random() * 5; } }
      const snapOpen = dinoSnapT > 0 ? Math.sin((0.35 - dinoSnapT) / 0.35 * Math.PI) : 0;
      dJaw.rotation.x = -snapOpen * 0.55; dTongue.visible = snapOpen > 0.4;
      dinoLookY += (Math.sin(dinoBreath * 0.4) * 0.5 - dinoLookY) * dt * 2; dHead.rotation.y = dinoLookY * (dinoState === 'ride' ? 0.5 : 0.15);
      let reactBounce = 0; if (dinoReactT > 0) { dinoReactT -= dt; const rp = clamp(dinoReactT / 0.5, 0, 1); reactBounce = Math.abs(Math.sin(rp * Math.PI * 3)) * rp; dHead.rotation.z = Math.sin(rp * Math.PI * 4) * 0.22 * rp; dEars.forEach(e => { e.rotation.x = -reactBounce * 0.3; }); }
      if (dinoState === 'ride') dBody.position.y = 0.135 + reactBounce * 0.03;
      if (dinoLandT > 0) { dinoLandT -= dt; const lp = Math.max(0, dinoLandT) / 0.3, sq = Math.sin(lp * Math.PI) * 0.3 * lp; dBody.scale.y *= 1 - sq; dBody.scale.x *= 1 + sq * 0.5; dBody.scale.z *= 1 + sq * 0.5; }

      if (dinoState === 'ride') {
        if (curSpeed > 1.0) rideStarted = true;
        if (rideStarted && curSpeed < 0.35) { dinoStand += dt; } else dinoStand = 0;
        if (dinoStand > 1.4) { dinoState = 'jumpoff'; dinoJumpT = 0; dinoRoamT = 0; scene.attach(dino); dino.getWorldPosition(dinoJumpFrom); dinoBaseY = groundY(bp.x, bp.z + 0.9); const atFireStop = !free && Math.round(t * NSTOP) === 8; const ro = atFireStop ? [FIRE.x, FIRE.z + 1.6] : [bp.x, bp.z + 1.1]; dinoSeekLake = !atFireStop && Math.hypot(bp.x - LAKE.x, bp.z - LAKE.z) < LAKE.r + 60; pickRoamTarget(ro[0], ro[1]); dinoJumpTo.set(bp.x + (Math.random() - 0.5) * 1.4, dinoBaseY, bp.z + 1.0 + Math.random() * 0.6); }
      } else if (dinoState === 'jumpoff') {
        dinoJumpT += dt / 0.55; const p = clamp(dinoJumpT, 0, 1), ease = p * p * (3 - 2 * p);
        dino.position.lerpVectors(dinoJumpFrom, dinoJumpTo, ease); dino.position.y += Math.sin(p * Math.PI) * 0.5;
        dino.rotation.y += dt * 8; dino.rotation.x = -Math.sin(p * Math.PI) * 0.6;
        if (p >= 1) { dinoState = 'roam'; dino.rotation.set(0, Math.random() * Math.PI * 2, 0); dinoCheckInT = 6 + Math.random() * 6; dinoLandT = 0.3;
          if (dinoSeekLake) { const ddx = dino.position.x - LAKE.x, ddz = dino.position.z - LAKE.z, dl = Math.hypot(ddx, ddz) || 1, edge = LAKE.r + 1.2; dinoTarget.set(LAKE.x + ddx / dl * edge, 0, LAKE.z + ddz / dl * edge); }
          else pickRoamTarget(dino.position.x, dino.position.z);
        }
      } else if (dinoState === 'roam') {
        const fleeing = dinoFleeT > 0; if (fleeing) dinoFleeT -= dt;
        dinoRoamT += dt;
        if (dinoLingerT > 0) {
          dinoLingerT -= dt; dinoWagBoost = Math.min(1, dinoWagBoost + dt * 3);
          dLegs.forEach(l => { l.m.rotation.x *= Math.exp(-dt * 6); });
          if (dinoLingerT <= 0) pickRoamTarget(dino.position.x, dino.position.z);
        } else {
        dinoWagBoost = Math.max(0, dinoWagBoost - dt * 2);
        if (frameNo % 5 === 0 && !fleeing) { let bi = -1, bd = 2.4; for (let i = 0; i < notes.length; i++) { const n = notes[i], dd = Math.hypot(n.w.position.x - dino.position.x, n.w.position.z - dino.position.z); if (dd < bd) { bd = dd; bi = i; } } if (bi >= 0 && (dinoNoteCool[bi] || 0) < performance.now()) { dinoNoteCool[bi] = performance.now() + 15000; dinoReactT = 0.5; dinoSnapT = 0.35; opts.onDino && opts.onDino('curious'); } }
        if (!fleeing && !dinoSeekLake && !dinoSeekBike) { dinoCheckInT -= dt; if (dinoCheckInT <= 0) { dinoSeekBike = true; const a3 = Math.random() * Math.PI * 2, r3 = 1.2 + Math.random() * 1.6; dinoTarget.set(bp.x + Math.cos(a3) * r3, 0, bp.z + Math.sin(a3) * r3); dinoCheckInT = 9999; } }
        const dBike = Math.hypot(bp.x - dino.position.x, bp.z - dino.position.z);
        if (!fleeing && dinoRoamT > 3.5 && curSpeed > 1.2 && dBike < 3.2) { dinoState = 'run'; }
        else if (fleeing && dBike < 1.7) { dinoState = 'run'; dinoFleeT = 0; }
        else { const dx = dinoTarget.x - dino.position.x, dz = dinoTarget.z - dino.position.z, d = Math.hypot(dx, dz);
          if (d < 0.25) {
            if (fleeing) startFlee();
            else if (dinoSeekLake) { dinoSeekLake = false; dinoReactT = 0.6; opts.onDino && opts.onDino('paddle'); pickRoamTarget(dino.position.x, dino.position.z); }
            else if (dinoSeekBike) { dinoSeekBike = false; dinoLingerT = 2.5 + Math.random() * 2.5; dinoCheckInT = 10 + Math.random() * 8; dinoReactT = 0.5; opts.onDino && opts.onDino('checkin'); }
            else pickRoamTarget(dino.position.x, dino.position.z);
          } else {
            const spdD = (fleeing ? 3.4 : dinoChaseFF ? 2.6 : 1.5) + reactBounce * 1.5, ux = dx / d, uz = dz / d;
            const [adx, adz] = dinoAvoid(dino.position.x, dino.position.z, ux, uz);
            if (!adx && !adz) { dinoStuckT += dt; if (dinoStuckT > 0.6) { dinoStuckT = 0; dinoSeekLake = false; dinoSeekBike = false; pickRoamTarget(dino.position.x, dino.position.z); } }
            else { dinoStuckT = 0; dino.position.x += adx * spdD * dt; dino.position.z += adz * spdD * dt; }
            dino.position.y = groundY(dino.position.x, dino.position.z) + Math.abs(Math.sin(dinoRunPhase * (fleeing ? 7.5 : 5.5))) * 0.05;
            const targetYaw = Math.atan2(-dx, -dz); let dyaw = targetYaw - dino.rotation.y; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw)); dino.rotation.y += dyaw * Math.min(1, dt * 6); dinoRunPhase += dt;
          }
          dLegs.forEach((l, i) => { l.m.rotation.x = Math.sin(dinoRunPhase * (fleeing ? 7.5 : 5.5) + (i % 2 ? Math.PI : 0)) * 0.5; });
        }
        }
      } else if (dinoState === 'run') {
        const dx = bp.x - dino.position.x, dz = bp.z - dino.position.z, d = Math.hypot(dx, dz) || 0.001;
        if (d < 1.5) { dinoState = 'jumpon'; dinoJumpT = 0; scene.attach(dino); dino.getWorldPosition(dinoJumpFrom); }
        else {
          const spdD = Math.min(16, 2.4 + d * 0.55);
          dino.position.x += dx / d * spdD * dt; dino.position.z += dz / d * spdD * dt;
          const legFreq = 7 + spdD * 0.9;
          dino.position.y = groundY(dino.position.x, dino.position.z) + Math.abs(Math.sin(dinoRunPhase * legFreq)) * 0.08;
          const targetYaw = Math.atan2(-dx, -dz); let dyaw = targetYaw - dino.rotation.y; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw)); dino.rotation.y += dyaw * Math.min(1, dt * 8); dinoRunPhase += dt;
          dLegs.forEach((l, i) => { l.m.rotation.x = Math.sin(dinoRunPhase * legFreq + (i % 2 ? Math.PI : 0)) * 0.7; });
          dTail.rotation.y = Math.sin(dinoRunPhase * legFreq) * 0.3;
        }
      } else if (dinoState === 'jumpon') {
        dinoJumpT += dt / 0.42; const p = clamp(dinoJumpT, 0, 1), ease = p * p * (3 - 2 * p);
        const worldSeatTarget = bike.localToWorld(dinoSeatPos.clone());
        dino.position.lerpVectors(dinoJumpFrom, worldSeatTarget, ease); dino.position.y += Math.sin(p * Math.PI) * 0.45;
        const jdx = worldSeatTarget.x - dinoJumpFrom.x, jdz = worldSeatTarget.z - dinoJumpFrom.z; if (Math.hypot(jdx, jdz) > 0.05) { const targetYaw2 = Math.atan2(-jdx, -jdz); let dy2 = targetYaw2 - dino.rotation.y; dy2 = Math.atan2(Math.sin(dy2), Math.cos(dy2)); dino.rotation.y += dy2 * Math.min(1, dt * 8); }
        if (p >= 1) { dinoState = 'ride'; bike.attach(dino); dino.position.copy(dinoSeatPos); dino.rotation.set(0, 0, 0); dinoStand = 0; dinoRoamT = 0; dinoLandT = 0.3; }
      }
    }
    for (let gi = 0; gi < GUIDE.length; gi++) { const g = GUIDE[gi]; if (!g.fired && tE >= g.t) { g.fired = true; setDinoBubble(g.text); } }
    if (dinoBubbleT > 0) dinoBubbleT -= dt;
    dinoBubbleOp += ((dinoBubbleT > 0 ? 1 : 0) - dinoBubbleOp) * (1 - Math.exp(-dt * (dinoBubbleT > 0 ? 8 : 3)));
    dBubbleSprite.material.opacity = dinoBubbleOp; dBubbleSprite.visible = dinoBubbleOp > 0.01;
    if (opts.onEnv && now - (opts._envAt || 0) > 220) { opts._envAt = now; opts.onEnv(night, glow, tE, dinoState !== 'ride'); }
    glowMat.color.setScalar(lerp(0.3, 1.35, glow));
    treeGlowMat.opacity = lerp(0.1, 0.85, glow);
    glows.forEach(g => { g.s.material.opacity = lerp(g.base, g.n, glow); });
    fireLight.intensity = (lerp(4, 22, night)) * (0.8 + Math.sin(T * 13) * 0.1 + Math.sin(T * 7.3) * 0.14 + Math.sin(T * 23.7) * 0.06) * sstep(0.8, 0.95, tE);
    fireLight.position.x = Math.sin(T * 9) * 0.05; fireLight.position.z = Math.cos(T * 7) * 0.05;
    flames.forEach((f, k) => { const flick = Math.sin(T * 9 + k) * 0.08 + Math.sin(T * 17 + k * 3) * 0.05; f.scale.set(1 + flick, 1 + Math.sin(T * 11 + k * 2) * 0.18 + Math.sin(T * 21 + k) * 0.08, 1 + flick); f.rotation.y = T * (1 + k) + Math.sin(T * 5 + k) * 0.3; f.position.x = Math.sin(T * 6 + k * 2) * 0.03; f.position.z = Math.cos(T * 6.4 + k * 2) * 0.03; });
    anim.forEach(fn => fn(T)); progFx.forEach(fn => fn(tE));
    deer.forEach(d => { const distBike = Math.hypot(bp.x - d.g.position.x, bp.z - d.g.position.z);
      if (distBike < 9 && d.state !== 'flee') { d.state = 'flee'; const dx = d.g.position.x - bp.x, dz = d.g.position.z - bp.z, dl = Math.hypot(dx, dz) || 1; d.target.set(d.g.position.x + dx / dl * 14, 0, d.g.position.z + dz / dl * 14); }
      if (d.state === 'flee') { const dx = d.target.x - d.g.position.x, dz = d.target.z - d.g.position.z, dl = Math.hypot(dx, dz);
        if (dl < 0.5 || distBike > 16) { d.state = 'graze'; d.t = 2 + rnd() * 3; } else { const sp = 5.5; d.g.position.x += dx / dl * sp * dt; d.g.position.z += dz / dl * sp * dt; d.g.position.y = H(d.g.position.x, d.g.position.z);
          const ty = Math.atan2(-dx, -dz); let dy = ty - d.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); d.g.rotation.y += dy * Math.min(1, dt * 8); d.phase += dt * 9; d.legs.forEach((l, i) => { l.rotation.x = Math.sin(d.phase + (i % 2 ? Math.PI : 0)) * 0.6; }); } }
      else if (d.state === 'graze') { d.head.rotation.x = 0.3 + Math.sin(T * 1.2 + d.phase) * 0.15; d.t -= dt; if (d.t <= 0) { d.state = 'walk'; const a = rnd() * Math.PI * 2, r = 2 + rnd() * 4; d.target.set(d.g.position.x + Math.cos(a) * r, 0, d.g.position.z + Math.sin(a) * r); } }
      else if (d.state === 'walk') { const dx = d.target.x - d.g.position.x, dz = d.target.z - d.g.position.z, dl = Math.hypot(dx, dz);
        if (dl < 0.3) { d.state = 'graze'; d.t = 3 + rnd() * 4; } else { const sp = 1.1; d.g.position.x += dx / dl * sp * dt; d.g.position.z += dz / dl * sp * dt; d.g.position.y = H(d.g.position.x, d.g.position.z);
          const ty = Math.atan2(-dx, -dz); let dy = ty - d.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); d.g.rotation.y += dy * Math.min(1, dt * 5); d.phase += dt * 4; d.legs.forEach((l, i) => { l.rotation.x = Math.sin(d.phase + (i % 2 ? Math.PI : 0)) * 0.4; }); } } });
    critters.forEach(c => {
      const distBike = Math.hypot(bp.x - c.g.position.x, bp.z - c.g.position.z), distDino = Math.hypot(dino.position.x - c.g.position.x, dino.position.z - c.g.position.z), threat = Math.min(distBike, distDino);
      if (threat < c.fleeDist && c.state !== 'flee') { c.state = 'flee'; const fromX = distBike < distDino ? bp.x : dino.position.x, fromZ = distBike < distDino ? bp.z : dino.position.z, dx = c.g.position.x - fromX, dz = c.g.position.z - fromZ, dl = Math.hypot(dx, dz) || 1; c.target.set(c.g.position.x + dx / dl * 10, 0, c.g.position.z + dz / dl * 10); }
      if (c.state === 'flee') { const dx = c.target.x - c.g.position.x, dz = c.target.z - c.g.position.z, dl = Math.hypot(dx, dz);
        if (dl < 0.4 || threat > c.fleeDist + 5) { c.state = 'idle'; c.t = 1.5 + rnd() * 2; } else { const [adx, adz] = dinoAvoid(c.g.position.x, c.g.position.z, dx / dl, dz / dl);
          c.g.position.x += adx * c.fleeSpd * dt; c.g.position.z += adz * c.fleeSpd * dt; c.g.position.y = H(c.g.position.x, c.g.position.z);
          const ty = Math.atan2(-adx, -adz); let dy = ty - c.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); c.g.rotation.y += dy * Math.min(1, dt * 8);
          c.phase += dt * c.gait; c.legs.forEach((l, i) => { l.rotation.x = Math.sin(c.phase + (i % 2 ? Math.PI : 0)) * (c.hop ? 0.9 : 0.6); });
          if (c.hop) c.g.position.y += Math.abs(Math.sin(c.phase)) * 0.06; } }
      else if (c.state === 'idle') { c.t -= dt; c.g.scale.setScalar(1 + Math.sin(T * 2.4 + c.phase) * 0.02);
        if (c.t <= 0) { c.g.scale.setScalar(1); c.state = 'walk'; const a = rnd() * Math.PI * 2, r = 1.5 + rnd() * (c.kind === 'goat' ? 5 : 3), nx = c.g.position.x + Math.cos(a) * r, nz = c.g.position.z + Math.sin(a) * r; if (!collideAt(nx, nz, 0.4)) c.target.set(nx, 0, nz); else c.t = 1; } }
      else if (c.state === 'walk') { const dx = c.target.x - c.g.position.x, dz = c.target.z - c.g.position.z, dl = Math.hypot(dx, dz);
        if (dl < 0.3) { c.state = 'idle'; c.t = 2 + rnd() * 3; } else { const [adx, adz] = dinoAvoid(c.g.position.x, c.g.position.z, dx / dl, dz / dl);
          c.g.position.x += adx * c.wanderSpd * dt; c.g.position.z += adz * c.wanderSpd * dt; c.g.position.y = H(c.g.position.x, c.g.position.z);
          const ty = Math.atan2(-adx, -adz); let dy = ty - c.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); c.g.rotation.y += dy * Math.min(1, dt * 5);
          c.phase += dt * c.gait * 0.6; c.legs.forEach((l, i) => { l.rotation.x = Math.sin(c.phase + (i % 2 ? Math.PI : 0)) * (c.hop ? 0.5 : 0.35); });
          if (c.hop) c.g.position.y += Math.abs(Math.sin(c.phase)) * 0.035; } }
    });
    birds.forEach(b => { b.ph += dt * b.spd; b.flap += dt * 14; const distB = Math.hypot(bp.x - b.cx, bp.z - b.cz); b.scatter += ((distB < 22 ? 1 : 0) - b.scatter) * dt * 2;
      const a = b.ph; const rr = b.r * (1 + b.scatter * 0.6); b.g.position.set(b.cx + Math.cos(a) * rr, b.h + b.scatter * 4 + Math.sin(a * 2) * 1.2, b.cz + Math.sin(a) * rr * 0.7); b.g.rotation.y = -a - Math.PI / 2; const flapA = Math.sin(b.flap * (1 + b.scatter * 0.8)) * 0.6; b.wL.rotation.z = flapA; b.wR.rotation.z = -flapA; });
    flies2.count = BF; flyDat.forEach((f, i) => { const tt = T * f.spd + f.ph; const x = f.x0 + Math.sin(tt) * 1.4 + Math.sin(tt * 2.3) * 0.4, y = f.y0 + Math.sin(tt * 1.7) * 0.35, z = f.z0 + Math.cos(tt * 0.8) * 1.4;
      dummy.position.set(x, y, z); dummy.rotation.set(0, T * 2 + i, Math.sin(T * 10 + i) * 0.5); dummy.updateMatrix(); flies2.setMatrixAt(i, dummy.matrix); }); flies2.instanceMatrix.needsUpdate = true; flyMat.opacity = lerp(0.15, 0.95, 1 - night * 0.7);
    owls.forEach(o => { const on = night > 0.3; o.g.visible = on; if (on) { o.ph += dt; o.g.rotation.y = Math.sin(o.ph * 0.3) * 0.4; o.blinkAt -= dt; const blink = o.blinkAt < 0.12 ? 0.15 : 1; o.g.children.forEach(c => { if (c.name === 'owl-eye') c.scale.y = blink; }); if (o.blinkAt < 0) o.blinkAt = 2.5 + Math.random() * 4; } });
    fishT -= dt; if (fishT <= 0 && fishJumping <= 0 && !free) { fishT = 5 + Math.random() * 9; fishJumping = 1; const a2 = Math.random() * Math.PI * 2, rr2 = Math.random() * LAKE.r * 0.7; fishFrom.set(LAKE.x + Math.cos(a2) * rr2, LAKE.y, LAKE.z + Math.sin(a2) * rr2); fishTo.set(fishFrom.x + Math.cos(a2) * 1.6, LAKE.y, fishFrom.z + Math.sin(a2) * 1.6); }
    if (fishJumping > 0) { fishJumping -= dt / 0.7; const p = clamp(1 - fishJumping, 0, 1); fishJump.visible = p < 1; fishJump.position.lerpVectors(fishFrom, fishTo, p); fishJump.position.y += Math.sin(p * Math.PI) * 0.9; fishJump.rotation.x = Math.cos(p * Math.PI) * 0.8; fishJump.rotation.y = Math.atan2(fishTo.x - fishFrom.x, fishTo.z - fishFrom.z);
      fishSplash.position.set(fishTo.x, LAKE.y + 0.1, fishTo.z); fishSplash.material.opacity = p > 0.85 ? 0.6 : fishSplash.material.opacity * Math.exp(-dt * 2); }
    else { fishJump.visible = false; fishSplash.material.opacity *= Math.exp(-dt * 2.5); }
    clouds.forEach(c => { c.g.position.x = c.x0 + ((T * c.v + c.ph * 80) % 520) - 260; c.g.position.y = c.y0 + Math.sin(T * 0.2 + c.ph) * 2; c.g.rotation.y = Math.sin(T * 0.05 + c.ph) * 0.2; });
    fogPatches.forEach(f => { f.m.position.x = f.x0 + Math.sin(T * 0.045 + f.ph) * 7; f.m.position.z = f.z0 + Math.cos(T * 0.038 + f.ph) * 7; f.m.material.opacity = 0.05 + 0.05 * Math.sin(T * 0.09 + f.ph) + night * 0.02; });
    windTimeU.value = T; windAmtU.value = clamp(0.35 + 0.35 * Math.sin(T * 0.11) + 0.25 * Math.sin(T * 0.27 + 2) + 0.15 * Math.sin(T * 0.6 + 4), 0, 1);
    { const g = windAmtU.value; awMat.opacity = clamp(g * 0.55, 0, 0.42); const perpx = -wdz, perpz = wdx;
      awDat.forEach((d, i) => { d.t += dt; const speed = (2.2 + d.spd * 3.2 * (0.4 + g)); d.x += wdx * dt * speed; d.z += wdz * dt * speed;
        if (d.x - bp.x > 55) d.x -= 110; if (d.x - bp.x < -55) d.x += 110; if (d.z - bp.z > 55) d.z -= 110; if (d.z - bp.z < -55) d.z += 110;
        const wob = Math.sin(d.t * 0.5 + d.ph) * d.curl, px = d.x + perpx * wob, pz = d.z + perpz * wob;
        const gy = hFast(px, pz) + 0.5 + Math.sin(T * 0.5 + d.ph) * 0.3, heading = Math.atan2(wdx, wdz) + Math.cos(d.t * 0.4 + d.ph) * 0.6;
        dummy.position.set(px, gy, pz); dummy.rotation.set(0, heading, 0); dummy.scale.set(1, 1, d.len * (0.5 + g * 1.6)); dummy.updateMatrix(); awStreaks.setMatrixAt(i, dummy.matrix); });
      awStreaks.instanceMatrix.needsUpdate = true; }
    { const useMouse = now - lastMouse < 4000; aimNDC.set(useMouse ? mouse.x : 0, useMouse ? mouse.y : -0.15);
      ray.setFromCamera(aimNDC, camera); gPlane.constant = -(bp.y + 0.2); const hitP = ray.ray.intersectPlane(gPlane, gPt);
      if (hitP) { const loc = bike.worldToLocal(gPt.clone()); loc.z = Math.min(loc.z, -4); const len = Math.hypot(loc.x, loc.z); if (len > 30) loc.multiplyScalar(30 / len); loc.y = 0.2; headAim.lerp(loc, 0.18); } headT.position.copy(headAim);
      notes.forEach(n => { projV.copy(n.sp.position); projV.y += 0.6; const dCam = camera.position.distanceTo(projV); projV.project(camera); const dS = projV.z < 1 ? Math.hypot(projV.x - aimNDC.x, (projV.y - aimNDC.y) * 0.8) : 9;
        const want = dCam < 48 ? sstep(0.42, 0.12, dS) : 0; n.rev += (want - n.rev) * (1 - Math.exp(-dt * (want > n.rev ? 5 : 1.5))); n.sp.material.opacity = n.rev; n.sp.visible = n.rev > 0.01; }); }
    notes.forEach(n => { n.hov += ((hover === n.i ? 1 : 0) - n.hov) * 0.15; n.w.position.y = n.y + Math.sin(T * 1.6 + n.i) * 0.18; n.w.rotation.y = T * 1.2; n.w.scale.setScalar(1 + n.hov * 0.6); n.g.position.y = n.w.position.y; n.g.scale.setScalar(2.2 + n.hov * 1.6 + Math.sin(T * 3 + n.i) * 0.2); });
    // embers
    if (tE > 0.8) { const fp = fireHit(); for (let i = 0; i < embers.n; i++) { embers.life[i] -= dt; if (embers.life[i] < 0) { embers.life[i] = 1.5 + Math.random() * 2; embers.a[i * 3] = FIRE.x + (Math.random() - 0.5) * 0.6; embers.a[i * 3 + 1] = hFast(FIRE.x, FIRE.z) + 0.6; embers.a[i * 3 + 2] = FIRE.z + (Math.random() - 0.5) * 0.6; } embers.a[i * 3 + 1] += dt * (0.8 + Math.sin(i) * 0.3); embers.a[i * 3] += Math.sin(T * 2 + i) * dt * 0.3;
      if (fp) { const dx = embers.a[i * 3] - fp.x, dz = embers.a[i * 3 + 2] - fp.z, d = Math.hypot(dx, dz); if (d < 1.3 && d > 0.001) { const push = (1.3 - d) * dt * 2.6; embers.a[i * 3] += dx / d * push; embers.a[i * 3 + 2] += dz / d * push; embers.a[i * 3 + 1] += dt * 1.4; } } }
      embers.g.attributes.position.needsUpdate = true; }

    // camera
    const si = free ? 0 : Math.round(t * NSTOP), dwell = free ? 0 : 1 - sstep(0.004, 0.045, Math.abs(t - si / NSTOP)); const cc = CAM[si] || CAM[0], sd = side[si] || 1;

    // Rider: sits on the log by the fire when parked at the campfire stop
    if (rider) { const atFire = !free && si === 8 && dwell > 0.9;
      if (riderState === 'onBike' && atFire) { riderState = 'toLog'; riderT = 0; scene.attach(rider); rider.getWorldPosition(riderFrom); }
      else if (riderState === 'sitting' && !atFire) { riderState = 'toBike'; riderT = 0; rider.getWorldPosition(riderFrom); }
      if (riderState === 'toLog' || riderState === 'toBike') { riderT = clamp(riderT + dt / 1.1, 0, 1); const ease = riderT * riderT * (3 - 2 * riderT);
        const dest = riderState === 'toLog' ? logSeat : bikeRoot.localToWorld(new THREE.Vector3(0, 0, 0));
        rider.position.lerpVectors(riderFrom, dest, ease); rider.position.y += Math.sin(ease * Math.PI) * 0.1;
        rider.rotation.y += dt * 3;
        if (riderT >= 1) { if (riderState === 'toLog') { rider.rotation.set(0, logSeatYaw, 0); riderState = 'sitting'; } else { bike.attach(rider); rider.position.set(0, 0, 0); rider.rotation.set(0, 0, 0); riderState = 'onBike'; } } }
    }
    const a = cc[0] * dwell * (si === 7 ? 1 : -sd) + (free ? 0 : steer * 0.12) + yawOff, D = (free ? 6.4 : 5.6) + dwell * 1.2 + cc[2] * dwell * 1.5;
    const back = tmp2.copy(fr.f).multiplyScalar(-Math.cos(a) * D).addScaledVector(fr.r, -Math.sin(a) * D);
    const chase = camPos.clone().copy(bp).add(back); chase.y = bp.y + 2.1 + cc[2] * dwell + pitchOff * D;
    const gy = hFast(chase.x, chase.z) + 1.2; if (chase.y < gy) chase.y = gy;
    const look = new THREE.Vector3().copy(bp).addScaledVector(fr.f, 2.5); look.y += 0.9;
    if (si === 7) look.lerp(new THREE.Vector3(LAKE.x, LAKE.y + 6, LAKE.z - 10), dwell * 0.35);
    if (si === 8) look.lerp(new THREE.Vector3(FIRE.x, hFast(FIRE.x, FIRE.z) + 1.1, FIRE.z), dwell * 0.4);
    // shift subject away from panel
    const camR = new THREE.Vector3().subVectors(look, chase).cross(new THREE.Vector3(0, 1, 0)).normalize();
    if (si === 8 && dwell > 0.3) { const orbR = 6.5, orbH = 3.0, ang = T * 0.12, fgy = hFast(FIRE.x, FIRE.z);
      const fireOrbitPos = new THREE.Vector3(FIRE.x + Math.cos(ang) * orbR, fgy + orbH, FIRE.z + Math.sin(ang) * orbR);
      const fireLook = new THREE.Vector3(FIRE.x, fgy + 1.1, FIRE.z);
      const w = sstep(0.3, 0.7, dwell); chase.lerp(fireOrbitPos, w); look.lerp(fireLook, w);
    } else if (mobile) look.y -= 0.9 * dwell * cc[1]; else look.addScaledVector(camR, 1.7 * dwell * cc[1]);
    // intro: descend through clouds
    if (intro < 1) { const ip = new THREE.Vector3(roadX(zAt(0)) + 30, 130, zAt(0) + 110); const e2 = intro * intro * (3 - 2 * intro); chase.lerp(ip, 1 - e2); const il = new THREE.Vector3(roadX(-120), 20, -140); look.lerp(il, 1 - sstep(0.2, 1, intro)); }
    shake *= Math.exp(-dt * 6); if (shake > 0.001) { chase.x += (Math.random() - 0.5) * 0.18 * shake; chase.y += (Math.random() - 0.5) * 0.12 * shake; }
    camera.position.lerp(chase, intro < 1 ? 1 : 1 - Math.exp(-dt * 7)); camLook.lerp(look, intro < 1 ? 1 : 1 - Math.exp(-dt * 8));
    camera.up.set(Math.sin(lean * 0.35), Math.cos(lean * 0.35), 0); camera.lookAt(camLook);
    sky.position.copy(camera.position);

    // flares
    camera.getWorldDirection(camFwd);
    const sunAlign = clamp(camFwd.dot(SUN), 0, 1), sunVis = Math.pow(sunAlign, 6) * (1 - night * 0.85);
    sunFlare.position.copy(camera.position).addScaledVector(SUN, 420); sunFlare.visible = sunVis > 0.01;
    sunCore.material.opacity = Math.min(1, sunVis * 2); sunRing.material.opacity = Math.min(1, sunVis); const sunSc = 1 + sunAlign * 0.6; sunCore.scale.setScalar(26 * sunSc * 1.4); sunRing.scale.setScalar(60 * sunSc * 1.3);
    sunStreak.material.opacity = sunVis * 0.5; sunStreak.scale.set(340 * sunSc, 4.5, 1);
    const moonAlign = clamp(camFwd.dot(MOON), 0, 1), moonVis = Math.pow(moonAlign, 5) * night;
    moonFlare.position.copy(camera.position).addScaledVector(MOON, 420); moonFlare.visible = moonVis > 0.01;
    moonCore.material.opacity = Math.min(1, moonVis * 0.7); moonHalo.material.opacity = Math.min(1, moonVis * 0.32); moonCore.scale.setScalar(12 * 0.65); moonHalo.scale.setScalar(30 * 0.65);

    // fireflies
    ray.setFromCamera(mouse, camera); mouseW.copy(ray.ray.origin).addScaledVector(ray.ray.direction, 9);
    const cen = tmp2.copy(bp).addScaledVector(fr.f, 8); cen.y += 1.5;
    if (!fliesInit) { for (let i = 0; i < FN; i++) { ffp[i * 3] = cen.x + (Math.random() - 0.5) * 50; ffp[i * 3 + 1] = cen.y + Math.random() * 6 - 1; ffp[i * 3 + 2] = cen.z + (Math.random() - 0.5) * 50; } fliesInit = true; }
    for (let i = 0; i < FN; i++) { const j = i * 3; const fol = false;
      if (fol) { const ox = mouseW.x + Math.sin(T * 1.3 + i) * 1.4, oy = mouseW.y + Math.cos(T * 1.7 + i * 2) * 0.9, oz = mouseW.z + Math.sin(T * 0.9 + i * 3) * 1.4; ffv[j] += (ox - ffp[j]) * dt * 1.6; ffv[j + 1] += (oy - ffp[j + 1]) * dt * 1.6; ffv[j + 2] += (oz - ffp[j + 2]) * dt * 1.6; }
      else { ffv[j] += Math.sin(T * 0.7 + i) * dt * 0.6; ffv[j + 1] += Math.cos(T * 0.9 + i * 1.3) * dt * 0.4; ffv[j + 2] += Math.sin(T * 0.8 + i * 2.1) * dt * 0.6; }
      ffv[j] *= 0.96; ffv[j + 1] *= 0.96; ffv[j + 2] *= 0.96; ffp[j] += ffv[j] * dt * 4; ffp[j + 1] += ffv[j + 1] * dt * 4; ffp[j + 2] += ffv[j + 2] * dt * 4;
      if (!fol) { if (ffp[j] - cen.x > 28) ffp[j] -= 56; if (ffp[j] - cen.x < -28) ffp[j] += 56; if (ffp[j + 2] - cen.z > 28) ffp[j + 2] -= 56; if (ffp[j + 2] - cen.z < -28) ffp[j + 2] += 56; const gy2 = hFast(ffp[j], ffp[j + 2]); if (ffp[j + 1] < gy2 + 0.3) ffp[j + 1] = gy2 + 0.3; if (ffp[j + 1] > gy2 + 7) ffp[j + 1] = gy2 + 7; } }
    ffg.attributes.position.needsUpdate = true; ffm.opacity = lerp(0.35, 1, glow); ffm.size = lerp(0.22, 0.34, glow);

    const gust = 1 + 0.22 * Math.sin(T * 0.55 + 2) + 0.12 * Math.sin(T * 1.9);
    const wAmt = clamp((curSpeed - 2) / 24, 0, 1) * gust;
    wind.position.copy(bp); wind.rotation.set(0, yaw, 0); wind.visible = wAmt > 0.01 && intro >= 1; streakMat.opacity = wAmt * 0.5;
    if (wind.visible) {
      sdat.forEach((s, i) => { s.z += dt * (curSpeed * 1.8 + 6); if (s.z > 8) { s.z = -30; s.x = (Math.random() - 0.5) * 7; s.y = 0.3 + Math.random() * 3.2; } wO.position.set(s.x, s.y, s.z); wO.rotation.set(0, 0, 0); wO.scale.set(1, 1, s.l * (0.4 + wAmt * 2.4)); wO.updateMatrix(); streaks.setMatrixAt(i, wO.matrix); }); streaks.instanceMatrix.needsUpdate = true;
      ldat.forEach((l, i) => { l.z += dt * (curSpeed * 1.2 + 2); l.r += dt * 4 * l.s; l.y += Math.sin(T * 2 + i) * dt * 0.5; if (l.z > 8) { l.z = -24; l.x = (Math.random() - 0.5) * 9; l.y = Math.random() * 3; } wO.position.set(l.x + Math.sin(T + i) * 0.3, 0.2 + l.y, l.z); wO.rotation.set(l.r, l.r * 0.7, l.r * 0.3); wO.scale.setScalar(wAmt * l.s * 1.4); wO.updateMatrix(); leaves.setMatrixAt(i, wO.matrix); }); leaves.instanceMatrix.needsUpdate = true;
    }
    if (key.castShadow && renderer.shadowMap.enabled && (frameNo % 2 === 1 || frameNo < 4)) renderer.shadowMap.needsUpdate = true;
    postU.time.value = T; postU.night.value = night;
    renderer.setRenderTarget(postRT); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(postScene, postCam);
    if (!readySent) { readySent = true; opts.onReady && opts.onReady(); }
  }
  raf = requestAnimationFrame(loop);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => typeQ.forEach(f => f()));
  const onVis = () => { running = !document.hidden; last = performance.now(); };
  document.addEventListener('visibilitychange', onVis);

  return {
    setTarget(v) { target = clamp(v, 0, 1); },
    setMobile(m) { mobile = m; },
    skipIntro() { introArmed = true; introStart = -1e9; },
    startIntro() { introArmed = true; },
    setFree(on) { free = !!on; fs = 0; stickX = 0; stickY = 0; airY = 0; airVel = 0; grounded = true; for (const k in keys) keys[k] = false; for (const k in touch) touch[k] = false; canvas.style.touchAction = free ? 'none' : 'pan-y'; if (free) introStart = -1e9; },
    setTouch(k, v) { touch[k] = !!v; },
    setStick(x, y) { stickX = clamp(x, -1, 1); stickY = clamp(y, -1, 1); },
    setPaused(p) { paused = !!p; last = performance.now(); },
    getTier() { return tier; },
    setForceLow(v) { forceLow = !!v; if (forceLow && tier > 0) setTier(0); },
    setHold(active) { if (active && !holdActive) holdT = t; holdActive = active; },
    callDino() { const wasSleepy = curNight && dinoState === 'roam'; if (dinoState === 'roam') { dinoFleeT = 0; dinoSeekLake = false; dinoSeekBike = false; dinoLingerT = 0; dinoState = 'run'; } else if (dinoState === 'jumpoff') { dinoState = 'run'; scene.attach(dino); } dinoReactT = wasSleepy ? 0.9 : 0.5; opts.onDino && opts.onDino('called'); },
    getState() { const distLake = Math.hypot(lastBX - LAKE.x, lastBZ - LAKE.z), water = clamp(1 - distLake / 70, 0, 1);
      const rx = Math.cos(lastYaw), rz = -Math.sin(lastYaw), distFire = Math.hypot(lastBX - FIRE.x, lastBZ - FIRE.z);
      const lakePan = clamp(((LAKE.x - lastBX) * rx + (LAKE.z - lastBZ) * rz) / Math.max(1, distLake), -1, 1), firePan = clamp(((FIRE.x - lastBX) * rx + (FIRE.z - lastBZ) * rz) / Math.max(1, distFire), -1, 1);
      return { t: free ? clamp((Z0 - fz) / L, 0, 1) : t, speed: curSpeed, trail: trailMix(free ? fz : zAt(t)), water, lakePan, lakeDist: distLake, firePan, fireDist: distFire }; },
    dispose() { cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); window.removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', onVis); renderer.dispose(); postRT.dispose(); canvas.remove(); }
  };
}
