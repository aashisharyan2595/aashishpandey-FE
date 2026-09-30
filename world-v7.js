import * as THREE from 'https://unpkg.com/three@0.184.0/build/three.module.js';

const L = 1575, Z0 = 20, NSTOP = 9;
export const zAt = t => Z0 - t * L;
const SEG = L / NSTOP, warpS = s => s <= 3.5 ? s : s <= 4 ? 3.5 + (s - 3.5) * 3 : s + 1, unwarpS = u => u <= 3.5 ? u : u <= 5 ? 3.5 + (u - 3.5) / 3 : u - 1;
const zW = f => Z0 - warpS(f * 8) * SEG, fO = z => Math.max(0, Math.min(1, unwarpS((Z0 - z) / SEG) / 8));
export const roadX = z => 38 * Math.sin(z * 0.011) + 16 * Math.sin(z * 0.027 + 1.3);
export const roadY = z => 5 * Math.sin(z * 0.005 + 0.5) + 2.5 * Math.sin(z * 0.013);
const ZEND = zAt(1);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sstep = (a, b, v) => { const x = clamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;
const trailMix = z => sstep(0.465, 0.535, fO(z));
const roadW = z => lerp(3.4, 1.9, trailMix(z));
function h2(x, y) { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return lerp(lerp(h2(xi, yi), h2(xi + 1, yi), u), lerp(h2(xi, yi + 1), h2(xi + 1, yi + 1), u), v); }
function fbm(x, y) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s / 0.9375; }
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);
const pick = a => a[Math.floor(rnd() * a.length)];

const ZL = zW(7 / 8) - 16;
const LAKE = { x: roadX(ZL) + 66, z: ZL, r: 42 }; LAKE.y = roadY(ZL) - 1.3;
const FIRE = { x: roadX(ZEND - 11), z: ZEND - 11 };
const DZ2 = zW(0.42), DESERT = { x: roadX(DZ2) + 150, z: DZ2 - 10, r: 48 };
const clearZones = [];
let hFast = null;
// ===== Expanded map regions (off the story road, visible from it) =====
const coastX = z => -330 + 28 * Math.sin(z * 0.012) + 12 * Math.sin(z * 0.031 + 1);
const riverX = z => roadX(z) - 125 + 16 * Math.sin(z * 0.018 + 0.7);
const zM = zW(0.16), zU = zW(0.64), zRc = zW(0.43), zLH = zW(0.93), zPier = zW(0.86);
const MEADOW = { x: roadX(zM) + 125, z: zM, r: 58 }, RUINS = { x: roadX(zU) + 118, z: zU, r: 44 };
const RIV = { zHi: zW(0.27), zLo: zW(0.52) }, COAST = { zHi: zW(0.67), zLo: ZEND - 30 };
const SEA_Y = roadY(zW(0.82)) - 6;
const CORR = [[roadX(zM + 8) + 4, zM + 8, MEADOW.x - 45, MEADOW.z, 13], [roadX(zU + 8) + 4, zU + 8, RUINS.x - 30, RUINS.z, 12], [roadX(zRc) - 4, zRc, riverX(zRc) + 12, zRc, 12]];
const PIER = { x0: coastX(zPier) - 26, x1: coastX(zPier) + 5, z: zPier, w: 1.5, y: SEA_Y + 1.3 };
const onPier = (x, z) => x > PIER.x0 && x < PIER.x1 && Math.abs(z - PIER.z) < PIER.w;
const LH = { x: coastX(zLH) + 16, z: zLH };
const SECRET_POS = { meadow: { x: MEADOW.x + 3.2, z: MEADOW.z + 3.4 }, river: { x: riverX(zRc) - 10, z: zRc - 3 }, ruins: { x: RUINS.x + 3.2, z: RUINS.z + 0.5 }, pier: { x: PIER.x0 + 1.6, z: PIER.z, y: PIER.y }, lighthouse: { x: LH.x + 4, z: LH.z + 3.5 } };
function waterAt(x, z) {
  const g = (hFast || H)(x, z);
  if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r * 1.3 && g < LAKE.y) return LAKE.y;
  if (zBand(z, RIV.zHi, RIV.zLo, 1) > 0.5 && Math.abs(x - riverX(z)) < 7) { const wy = roadY(z) - 2.2; if (g < wy) return wy; }
  if (zBand(z, COAST.zHi, COAST.zLo, 1) > 0.5 && x < coastX(z) + 12 && g < SEA_Y) return SEA_Y;
  for (const P of WPOOLS) { const dp = Math.hypot(x - P.x, z - P.z); if (dp < P.r * 1.4 && g < P.y) return P.y; }
  { const q = streamQ(x, z); if (q && q.d < 2.8) { const wy = streamWY(q.t); if (wy !== null && g < wy) return wy; } }
  { const q = stream2Q(x, z); if (q && q.d < 2.6) { const wy = stream2WY(q.S, q.t); if (wy !== null && g < wy) return wy; } }
  if (Math.abs(x - SPRINGS.x) < 200 && Math.abs(z - SPRINGS.z) < 200) for (const P of SPOOLS) if (P.y !== null && Math.hypot(x - P.x, z - P.z) < P.r && g < P.y) return P.y;
  { const pf = fieldAt(x, z); if (pf && pf.f.type === 'paddy' && pf.out < -0.5 && pf.f.y !== null && g < pf.f.y) return pf.f.y; }
  return null;
}
let WF2 = null;
function wf2Path() {
  if (WF2) return WF2;
  const zF = zW(0.35), rX = riverX(zF), rY = roadY(zF) - 2.2; let sx = rX - 60, best = -1e9;
  for (let d = 40; d <= 240; d += 4) { const x = rX - d, h = H(x, zF) - roadY(zF); if (h > best) { best = h; sx = x; } if (h > 84) break; }
  const pts = [], NP = 72, jx = rX - 5.5;
  for (let i = 0; i <= NP; i++) { const u = i / NP, x = lerp(sx + 3, jx, u), z = zF + Math.sin(u * Math.PI * 1.6) * 7 * (1 - u); pts.push({ x, z, y: Math.max(H(x, z), rY) + 0.45 }); }
  WF2 = { zF, sx, sy: H(sx, zF), rY, jx, jz: zF, pts };
  return WF2;
}
const zBand = (z, zHi, zLo, e) => sstep(zLo - e, zLo + e, z) * (1 - sstep(zHi - e, zHi + e, z));
function segD(px, pz, ax, az, bx, bz) { const vx = bx - ax, vz = bz - az, t = clamp(((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz), 0, 1); return Math.hypot(px - ax - vx * t, pz - az - vz * t); }
clearZones.push({ x: MEADOW.x, z: MEADOW.z, r: 30 }, { x: RUINS.x, z: RUINS.z, r: 28 }, { x: LH.x, z: LH.z, r: 12 }, { x: (PIER.x0 + PIER.x1) / 2, z: PIER.z, r: 16 });

// ===== v4 · Open world: jungle, savanna and a cherry-blossom valley, reached by optional side roads =====
const yAtZ = z => roadY(clamp(z, ZEND - 40, Z0 + 140));
const zJ = zW(0.25), zS = zW(0.76);
const NREG = [
  { id: 'jungle', x: 650, z: zJ - 20, sx: 190, sz: 200, lift: 1.5 },
  { id: 'savanna', x: 720, z: zS + 10, sx: 250, sz: 230, lift: 0.8 },
  { id: 'blossom', x: 40, z: 570, sx: 200, sz: 190, lift: 3 }];
NREG.forEach(R => { R.base = yAtZ(R.z) + R.lift; });
const [JUNGLE, SAVANNA, BLOSSOM] = NREG;
const regW = (R, x, z) => 1 - sstep(0.8, 1.3, Math.hypot((x - R.x) / R.sx, (z - R.z) / R.sz));
function regRelief(R, x, z) {
  if (R.relief) return R.relief(x, z);
  if (R === JUNGLE) return (fbm(x * 0.011 + 70, z * 0.011) - 0.5) * 16 + (fbm(x * 0.05 + 3, z * 0.05) - 0.5) * 3;
  if (R === SAVANNA) return (fbm(x * 0.006 + 20, z * 0.006) - 0.5) * 9 + (fbm(x * 0.03, z * 0.03 + 8) - 0.5) * 2;
  return (fbm(x * 0.009 + 40, z * 0.009 + 5) - 0.5) * 14 + (fbm(x * 0.045, z * 0.045) - 0.5) * 2.5;
}
const JPOOL = { x: JUNGLE.x + 95, z: JUNGLE.z + 30, r: 13, dx: 1, dz: 0, h: 18, w: 26 };
const BPOOL = { x: BLOSSOM.x - 40, z: BLOSSOM.z + 95, r: 12, dx: 0, dz: 1, h: 14, w: 24 };
const LAGOON = { x: SAVANNA.x + 30, z: SAVANNA.z - 40, r: 36 };
JPOOL.y = JUNGLE.base + regRelief(JUNGLE, JPOOL.x, JPOOL.z) - 0.6; BPOOL.y = BLOSSOM.base + regRelief(BLOSSOM, BPOOL.x, BPOOL.z) - 0.6; LAGOON.y = SAVANNA.base + regRelief(SAVANNA, LAGOON.x, LAGOON.z) - 0.4;
const CLIFFS = [JPOOL, BPOOL], WPOOLS = [JPOOL, BPOOL, LAGOON];
const SROADS = [
  { R: JUNGLE, pts: [[roadX(zJ) + 3, zJ], [150, zJ - 22], [300, zJ + 12], [440, zJ - 10], [JUNGLE.x - 70, JUNGLE.z]] },
  { R: SAVANNA, pts: [[roadX(zS) + 3, zS], [170, zS + 26], [330, zS - 12], [480, zS + 14], [SAVANNA.x - 80, SAVANNA.z]] },
  { R: BLOSSOM, pts: [[roadX(150) - 1, 150], [roadX(150) - 6, 250], [BLOSSOM.x - 5, 370], [BLOSSOM.x, BLOSSOM.z - 70]] }];
SROADS.forEach(S => { let L0 = 0; S.cum = [0]; for (let i = 1; i < S.pts.length; i++) { L0 += Math.hypot(S.pts[i][0] - S.pts[i - 1][0], S.pts[i][1] - S.pts[i - 1][1]); S.cum.push(L0); } S.len = L0;
  S.y0 = yAtZ(S.pts[0][1]) - 0.3; const e = S.pts[S.pts.length - 1]; S.y1 = S.R.base + regRelief(S.R, e[0], e[1]);
  const xs = S.pts.map(p => p[0]), zs = S.pts.map(p => p[1]); S.bx0 = Math.min(...xs) - 70; S.bx1 = Math.max(...xs) + 70; S.bz0 = Math.min(...zs) - 70; S.bz1 = Math.max(...zs) + 70; });
function roadQ(S, x, z) { let bd = 1e9, bu = 0;
  for (let i = 1; i < S.pts.length; i++) { const a = S.pts[i - 1], b = S.pts[i], vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz, t = clamp(((x - a[0]) * vx + (z - a[1]) * vz) / l2, 0, 1), d = Math.hypot(x - a[0] - vx * t, z - a[1] - vz * t); if (d < bd) { bd = d; bu = (S.cum[i - 1] + t * Math.sqrt(l2)) / S.len; } }
  return { d: bd, u: bu, y: lerp(S.y0, S.y1, sstep(0.04, 0.96, bu)) }; }
function sroadD(x, z) { let d = 1e9; for (const S of SROADS) if (x > S.bx0 && x < S.bx1 && z > S.bz0 && z < S.bz1) d = Math.min(d, roadQ(S, x, z).d); return d; }
// ===== v5 · Snow Peak (east of the blossom junction), frozen lake, glacier + ice cave, a prayer-flag trail, and a stream + bridge on the blossom road =====
const coreOut = (x, z) => Math.max(0, x - 300, -460 - x, z - 150);
const PEAK = { x: 480, z: 190, ph: 118, rE: 150, rW: 360, rN: 190, rS: 170 }; PEAK.base = yAtZ(PEAK.z) + 4;
function peakR(x, z) { const dx = x - PEAK.x, dz = z - PEAK.z; return Math.hypot(dx / (dx < 0 ? PEAK.rW : PEAK.rE), dz / (dz < 0 ? PEAK.rS : PEAK.rN)); }
function peakH(x, z) { const r = peakR(x, z); if (r >= 1) return 0; const t = 1 - r, pr = Math.pow(t * t * (3 - 2 * t), 1.25);
  const h = PEAK.ph * pr + (fbm(x * 0.018 + 11, z * 0.018 + 3) - 0.5) * 26 * sstep(0.08, 0.35, r) * (1 - sstep(0.75, 1, r));
  return lerp(h, PEAK.ph, 1 - sstep(7, 15, Math.hypot(x - PEAK.x, z - PEAK.z))); }
const FLAKE = { x: 250, z: 300, r: 34, y: null };
const CDIR = (() => { const dx = PEAK.x - 452, dz = PEAK.z - 370, l = Math.hypot(dx, dz); return { x: dx / l, z: dz / l }; })();
const CAVE = { x: 452, z: 370, len: 15, R: 4.3, y: null }; CAVE.cx = CAVE.x + CDIR.x * CAVE.len / 2; CAVE.cz = CAVE.z + CDIR.z * CAVE.len / 2;
let v5Raw = false;
function flakeY() { if (FLAKE.y === null) { v5Raw = true; let m = 1e9; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; m = Math.min(m, H(FLAKE.x + Math.cos(a) * FLAKE.r * 1.3, FLAKE.z + Math.sin(a) * FLAKE.r * 1.3)); } v5Raw = false; FLAKE.y = m - 0.8; } return FLAKE.y; }
function caveY() { if (CAVE.y === null) { v5Raw = true; CAVE.y = H(CAVE.cx, CAVE.cz) + 0.3; v5Raw = false; } return CAVE.y; }
const TRAIL = { pts: [[25.5, 181], [100, 206], [175, 246], [214, 262], [252, 258], [290, 230], [330, 205], [380, 195], [430, 192], [PEAK.x - 4, PEAK.z]] };
{ const xs = TRAIL.pts.map(p => p[0]), zs = TRAIL.pts.map(p => p[1]); TRAIL.bx0 = Math.min(...xs) - 30; TRAIL.bx1 = Math.max(...xs) + 30; TRAIL.bz0 = Math.min(...zs) - 30; TRAIL.bz1 = Math.max(...zs) + 30; }
function trailD(x, z) { if (x < TRAIL.bx0 || x > TRAIL.bx1 || z < TRAIL.bz0 || z > TRAIL.bz1) return 1e9; const P = TRAIL.pts; let d = 1e9; for (let i = 1; i < P.length; i++) d = Math.min(d, segD(x, z, P[i - 1][0], P[i - 1][1], P[i][0], P[i][1])); return d; }
function snowAt(X, Y, Z) { const pr = peakR(X, Z); let s = 0; if (pr < 1.05) { const sl = lerp(22, 70, sstep(0.3, 1.05, pr)); s = sstep(sl - 4, sl + 4, Y - PEAK.base); }
  const dl = Math.hypot(X - FLAKE.x, Z - FLAKE.z); if (dl < FLAKE.r * 2.4) s = Math.max(s, 1 - sstep(FLAKE.r * 2, FLAKE.r * 2.4, dl));
  const dc = Math.hypot(X - CAVE.cx, Z - CAVE.cz); if (dc < 36) s = Math.max(s, 1 - sstep(28, 36, dc)); return s; }
const BSR = SROADS[2];
function bAt(u) { const L1 = u * BSR.len; let i = 1; while (i < BSR.pts.length - 1 && BSR.cum[i] < L1) i++; const a = BSR.pts[i - 1], b = BSR.pts[i], f = clamp((L1 - BSR.cum[i - 1]) / (BSR.cum[i] - BSR.cum[i - 1]), 0, 1), dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), (b[0] - a[0]) / dl, (b[1] - a[1]) / dl]; }
const BRIDGE = (() => { const [x, z, dx, dz] = bAt(0.36); return { x, z, dx, dz, len: 11, w: 2.3 }; })(); BRIDGE.y = roadQ(BSR, BRIDGE.x, BRIDGE.z).y + 0.22;
const bridgeLoc = (x, z) => { const ox = x - BRIDGE.x, oz = z - BRIDGE.z; return [ox * BRIDGE.dx + oz * BRIDGE.dz, ox * BRIDGE.dz - oz * BRIDGE.dx]; };
const bridgeY = a => BRIDGE.y + 0.5 * Math.cos(clamp(a / (BRIDGE.len / 2), -1, 1) * Math.PI / 2);
const STREAM = { pts: [], wy: null };
for (let i = 0; i <= 24; i++) { const s = (i / 24 - 0.5) * 96, w = Math.sin((i - 12) * 0.7) * 3.5; STREAM.pts.push([BRIDGE.x + BRIDGE.dz * s + BRIDGE.dx * w, BRIDGE.z - BRIDGE.dx * s + BRIDGE.dz * w]); }
{ const xs = STREAM.pts.map(p => p[0]), zs = STREAM.pts.map(p => p[1]); STREAM.bx0 = Math.min(...xs) - 8; STREAM.bx1 = Math.max(...xs) + 8; STREAM.bz0 = Math.min(...zs) - 8; STREAM.bz1 = Math.max(...zs) + 8; }
function streamQ(x, z) { if (x < STREAM.bx0 || x > STREAM.bx1 || z < STREAM.bz0 || z > STREAM.bz1) return null; const P = STREAM.pts; let bd = 1e9, bt = 0;
  for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz, t = clamp(((x - a[0]) * vx + (z - a[1]) * vz) / l2, 0, 1), d = Math.hypot(x - a[0] - vx * t, z - a[1] - vz * t); if (d < bd) { bd = d; bt = (i - 1 + t) / (P.length - 1); } }
  return { d: bd, t: bt }; }
const streamD = (x, z) => { const q = streamQ(x, z); return q ? q.d : 1e9; };
const streamF = t => sstep(0, 0.1, t) * (1 - sstep(0.9, 1, t));
function streamWY(t) { if (!STREAM.wy) STREAM.wy = STREAM.pts.map((p, i) => H(p[0], p[1]) + 1.1 * streamF(i / (STREAM.pts.length - 1))); if (streamF(t) < 0.05) return null; const f = t * (STREAM.pts.length - 1), i = Math.min(STREAM.pts.length - 2, Math.floor(f)); return lerp(STREAM.wy[i], STREAM.wy[i + 1], f - i); }
const GATES = [0.055, 0.44, 0.475, 0.51, 0.545, 0.58];
// ===== v6 · Four lived-in zones — farmland (NW), tea estate (E), hot springs (NE), red-rock canyon (far E) — with spurs, a ridge loop, streams and ponds =====
const zoneAdd = (id, x, z, sx, sz, lift, relief) => { const R = { id, x, z, sx, sz, lift, relief }; R.base = yAtZ(z) + lift; NREG.push(R); return R; };
const FARM = zoneAdd('farm', -380, 520, 220, 230, 1.5, (x, z) => (fbm(x * 0.006 + 90, z * 0.006 + 17) - 0.5) * 7 + (fbm(x * 0.03, z * 0.03 + 5) - 0.5) * 0.8);
const TEA = zoneAdd('tea', 740, -770, 210, 150, 6, (x, z) => { const h = (fbm(x * 0.011 + 130, z * 0.011 + 40) - 0.5) * 30 + (fbm(x * 0.04 + 3, z * 0.04) - 0.5) * 3, st = 1.8, q = h / st, f = q - Math.floor(q); return lerp(h, (Math.floor(q) + sstep(0.62, 1, f)) * st, 0.4); });
const SPR_D = { x: 0.55, z: 0.83 };
const SPRINGS = zoneAdd('springs', 870, 540, 170, 190, 2, (x, z) => 30 * sstep(-0.9, 0.9, ((x - 870) * SPR_D.x + (z - 540) * SPR_D.z) / 170) + (fbm(x * 0.02 + 50, z * 0.02 + 9) - 0.5) * 8);
const canyonX = z => 975 + 20 * Math.sin(z * 0.016) - 10 * Math.sin(z * 0.041);
const CANYON = zoneAdd('canyon', 975, -120, 120, 250, 1, (x, z) => { const d = Math.abs(x - canyonX(z)); return 27 * sstep(6, 15, d) + (fbm(x * 0.03 + 7, z * 0.03 + 2) - 0.5) * 5 * sstep(12, 30, d) + (fbm(x * 0.08, z * 0.08) - 0.5) * 0.8; });
function polyQ(P, x, z) { let bd = 1e9, bt = 0; for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz || 1, t = clamp(((x - a[0]) * vx + (z - a[1]) * vz) / l2, 0, 1), d = Math.hypot(x - a[0] - vx * t, z - a[1] - vz * t); if (d < bd) { bd = d; bt = (i - 1 + t) / (P.length - 1); } } return { d: bd, t: bt }; }
const bboxOf = (P, m) => { const xs = P.map(p => p[0]), zs = P.map(p => p[1]); return { bx0: Math.min(...xs) - m, bx1: Math.max(...xs) + m, bz0: Math.min(...zs) - m, bz1: Math.max(...zs) + m }; };
const inBB = (B, x, z) => x > B.bx0 && x < B.bx1 && z > B.bz0 && z < B.bz1;
const addSpur = (R, pts, y0) => { const S = { R, pts }; let L0 = 0; S.cum = [0]; for (let i = 1; i < pts.length; i++) { L0 += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); S.cum.push(L0); } S.len = L0; S.y0 = y0; const e = pts[pts.length - 1]; S.y1 = R.base + regRelief(R, e[0], e[1]); Object.assign(S, bboxOf(pts, 70)); SROADS.push(S); return S; };
{ const [fx0, fz0, fdx, fdz] = bAt(0.30); addSpur(FARM, [[fx0 - fdz * 2.6, fz0 + fdx * 2.6], [-80, 300], [-190, 370], [-270, 430], [FARM.x + 60, FARM.z - 40]], roadQ(BSR, fx0, fz0).y - 0.1); }
addSpur(TEA, [[roadX(-930) + 3, -930], [170, -905], [330, -950], [480, -880], [TEA.x - 90, TEA.z]], yAtZ(-930) - 0.3);
addSpur(CANYON, [[JUNGLE.x - 70, JUNGLE.z], [700, -395], [820, -420], [930, -410], [canyonX(-365), -365]], SROADS[0].y1);
const LOOP = { pts: [[FARM.x + 60, FARM.z - 40], [-305, 600], [-240, 690], [-120, 752], [40, 770], [180, 742], [300, 665], [430, 592], [560, 562], [690, 560], [852, 576], [819, 526], [790, 473], [835, 400], [900, 330], [962, 230], [canyonX(150), 150], [canyonX(60), 60], [canyonX(-40), -40], [canyonX(-140), -140], [canyonX(-240), -240], [canyonX(-330), -330], [canyonX(-395), -395], [940, -480], [900, -560], [860, -640], [800, -700], [720, -748], [TEA.x - 90, TEA.z]] };
Object.assign(LOOP, bboxOf(LOOP.pts, 30));
function loopD(x, z) { if (!inBB(LOOP, x, z)) return 1e9; const P = LOOP.pts; let d = 1e9; for (let i = 1; i < P.length; i++) d = Math.min(d, segD(x, z, P[i - 1][0], P[i - 1][1], P[i][0], P[i][1])); return d; }
// Springs: ten travertine pools stepping down the slope
const SPOOLS = []; for (let i = 0; i < 10; i++) { const s = 50 - i * 16, L = Math.sin(i * 1.3) * 14, r = 4 + h2(i, 321) * 3; SPOOLS.push({ x: SPRINGS.x + SPR_D.x * s - SPR_D.z * L, z: SPRINGS.z + SPR_D.z * s + SPR_D.x * L, r, y: null }); }
function spoolY(P) { if (P.y === null) { v5Raw = true; P.y = H(P.x, P.z) - 0.3; v5Raw = false; } return P.y; }
// Ponds (rendered with the lake shader via WPOOLS)
const FPOND = { x: -370, z: 590, r: 14, y: null }, SPOND = { x: 760, z: 400, r: 12, y: null }, TPOND = { x: 660, z: -870, r: 12, y: null }, PONDS = [FPOND, SPOND, TPOND];
function pondY(P) { if (P.y === null) { v5Raw = true; let m = 1e9; for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; m = Math.min(m, H(P.x + Math.cos(a) * P.r * 1.3, P.z + Math.sin(a) * P.r * 1.3)); } v5Raw = false; P.y = m - 0.4; } return P.y; }
WPOOLS.push(...PONDS);
// Streams linking hills to ponds
function mkStream(ctrl, amp, k) { const P = []; let acc = 0, tot = 0; for (let i = 1; i < ctrl.length; i++) tot += Math.hypot(ctrl[i][0] - ctrl[i - 1][0], ctrl[i][1] - ctrl[i - 1][1]);
  for (let i = 1; i < ctrl.length; i++) { const a = ctrl[i - 1], b = ctrl[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 4)), px = -(b[1] - a[1]) / L, pz = (b[0] - a[0]) / L;
    for (let j = i === 1 ? 0 : 1; j <= n; j++) { const f = j / n, s = acc + f * L, w = Math.sin(s * 0.045 + k) * amp * Math.sin(Math.PI * s / tot); P.push([lerp(a[0], b[0], f) + px * w, lerp(a[1], b[1], f) + pz * w]); } acc += L; }
  return { pts: P, wy: null, ...bboxOf(P, 8) }; }
const STREAMS2 = [mkStream([[-600, 720], [-540, 668], [-470, 628], [FPOND.x - 6, FPOND.z + 8]], 5, 1), mkStream([[SPOOLS[9].x - 4, SPOOLS[9].z - 5], [790, 430], [SPOND.x + 6, SPOND.z + 6]], 3, 2), mkStream([[905, -650], [840, -700], [760, -820], [TPOND.x + 7, TPOND.z + 7]], 5, 3)];
function stream2Q(x, z) { let best = null; for (const S of STREAMS2) { if (!inBB(S, x, z)) continue; const q = polyQ(S.pts, x, z); if (!best || q.d < best.d) best = { d: q.d, t: q.t, S }; } return best; }
const stream2D = (x, z) => { const q = stream2Q(x, z); return q ? q.d : 1e9; };
function stream2WY(S, t) { if (!S.wy) S.wy = S.pts.map((p, i) => H(p[0], p[1]) + 0.95 * streamF(i / (S.pts.length - 1))); if (streamF(t) < 0.05) return null; const f = t * (S.pts.length - 1), i = Math.min(S.pts.length - 2, Math.floor(f)); return lerp(S.wy[i], S.wy[i + 1], f - i); }
// Flat pads for buildings
const YARD = { x: -285, z: 505 }, MILL = { x: -250, z: 565 }, FACT = { x: 650, z: -744 }, PAV = { x: SPOOLS[0].x - SPR_D.z * 13, z: SPOOLS[0].z + SPR_D.x * 13 };
const PADS = [{ ...YARD, r0: 20, r1: 30, y: null }, { ...MILL, r0: 6, r1: 12, y: null }, { ...FACT, r0: 18, r1: 28, y: null }, { ...PAV, r0: 5, r1: 10, y: null }];
function padY(P) { if (P.y === null) { v5Raw = true; P.y = H(P.x, P.z); v5Raw = false; } return P.y; }
// Farm fields on a rotated grid
const FROT = 0.35, FCW = 40, FCH = 30, FHW = 18, FHH = 13, FGRID = new Map(), FIELDS = [];
const farmLoc = (x, z) => { const ox = x - FARM.x, oz = z - FARM.z, c = Math.cos(FROT), s = Math.sin(FROT); return [ox * c + oz * s, -ox * s + oz * c]; };
const farmWorld = (u, v) => { const c = Math.cos(FROT), s = Math.sin(FROT); return [FARM.x + u * c - v * s, FARM.z + u * s + v * c]; };
{ let crop = false; for (let i = -5; i <= 5; i++) for (let j = -7; j <= 7; j++) { const u = i * FCW, v = j * FCH, [x, z] = farmWorld(u, v); if (regW(FARM, x, z) < 0.8) continue;
    if (Math.hypot(x - YARD.x, z - YARD.z) < 50 || Math.hypot(x - MILL.x, z - MILL.z) < 30 || Math.hypot(x - FPOND.x, z - FPOND.z) < 36) continue;
    const near = sroadD(x, z) < 24 || loopD(x, z) < 22 || stream2D(x, z) < 22, hs = h2(i + 50, j + 90);
    let type = hs < 0.22 ? 'mustard' : hs < 0.42 ? 'paddy' : hs < 0.56 ? 'lavender' : hs < 0.76 ? 'wheat' : hs < 0.88 ? 'plough' : 'pasture'; if (near && type === 'paddy') type = 'wheat';
    const f = { i, j, u, v, x, z, type, y: null }; if (type === 'wheat' && !near && !crop) { f.crop = true; crop = true; } FIELDS.push(f); FGRID.set(i * 100 + j, f); } }
function fieldAt(x, z) { if (Math.abs(x - FARM.x) > 280 || Math.abs(z - FARM.z) > 280) return null; const [u, v] = farmLoc(x, z), f = FGRID.get(Math.round(u / FCW) * 100 + Math.round(v / FCH)); if (!f) return null; return { f, u, v, out: Math.max(Math.abs(u - f.u) - FHW, Math.abs(v - f.v) - FHH) }; }
function fieldY(f) { if (f.y === null) { v5Raw = true; f.y = H(f.x, f.z); v5Raw = false; } return f.y; }
function v6Prep() { PONDS.forEach(pondY); SPOOLS.forEach(spoolY); PADS.forEach(padY); FIELDS.forEach(f => { if (f.type === 'paddy') fieldY(f); }); }
// Zone ground colours (used by the streamed terrain tiles)
const ZC = { mus: new THREE.Color('#a0a83e'), pad: new THREE.Color('#566a3a'), lav: new THREE.Color('#7a7086'), wht: new THREE.Color('#b89a52'), plA: new THREE.Color('#6e5238'), pas: new THREE.Color('#78a448'), lane: new THREE.Color('#9a7c52'), bund: new THREE.Color('#7a8a44'),
  tea: new THREE.Color('#3f6a2c'), teaS: new THREE.Color('#8a4e30'), trv: new THREE.Color('#ece5d6'), trv2: new THREE.Color('#d8c8a8'), trvO: new THREE.Color('#c8864a'), mapleG: new THREE.Color('#7a6a3a'),
  cr: ['#b0502e', '#c8703a', '#9a4028', '#d8a070', '#b86038'].map(c => new THREE.Color(c)), bed: new THREE.Color('#d6c4a0'), bed2: new THREE.Color('#bfa882') };
function zoneCol(C, X, Y, Z, ny, hh) {
  const wf = regW(FARM, X, Z); if (wf > 0.3) { const q = fieldAt(X, Z); let c = null; if (q) { const t = q.f.type; if (q.out < 0) c = t === 'mustard' ? ZC.mus : t === 'paddy' ? ZC.pad : t === 'lavender' ? ZC.lav : t === 'wheat' ? ZC.wht : t === 'plough' ? ZC.plA : ZC.pas; else if (q.out < 3) c = t === 'paddy' ? ZC.bund : ZC.lane; }
    if (c && ny > 0.55) C.lerp(c, clamp((wf - 0.3) * 2, 0, 1)); }
  const wt = regW(TEA, X, Z); if (wt > 0.3 && ny > 0.5) C.lerp(hh < 0.12 ? ZC.teaS : ZC.tea, clamp((wt - 0.3) * 2, 0, 0.9));
  const ws = regW(SPRINGS, X, Z); if (ws > 0.2) { let dm = 1e9; for (const P of SPOOLS) dm = Math.min(dm, Math.hypot(X - P.x, Z - P.z) - P.r); if (dm < 16) { C.copy(ZC.trv).lerp(ZC.trv2, hh * 0.8); if (vnoise(X * 0.15, Z * 0.15) > 0.72) C.lerp(ZC.trvO, 0.55); } else if (ny > 0.6 && hh < 0.25) C.lerp(ZC.mapleG, 0.5 * ws); }
  const wc = regW(CANYON, X, Z); if (wc > 0.25) { const d = Math.abs(X - canyonX(Z)); let c; if (d < 8.5 && Y - CANYON.base < 3) c = hh < 0.5 ? ZC.bed : ZC.bed2; else { const b = Math.floor((Y - CANYON.base) / 3.2 + vnoise(X * 0.05, Z * 0.05) * 0.8); c = ZC.cr[((b % 5) + 5) % 5]; } C.lerp(c, clamp((wc - 0.25) * 2.2, 0, 1)); } }

const V4_NAMES = ['jungle-trunks', 'jungle-crowns', 'jungle-leaves', 'jungle-ferns', 'jungle-grass', 'jungle-shroom-stems', 'jungle-shroom-caps', 'jungle-vines', 'jungle-rocks', 'acacia-trunks', 'acacia-crowns', 'baobab-trunks', 'baobab-crowns', 'savanna-grass', 'termite-mounds', 'kopje-rocks', 'lagoon-reeds', 'cherry-trunks', 'cherry-crowns', 'blossom-grass', 'blossom-flowers', 'petal-carpet', 'ao-blobs', 'bamboo-stalks', 'bamboo-leaves', 'prayer-flags', 'flag-poles', 'cairn-stones', 'seracs', 'icicles', 'stream-rocks', 'mustard-flowers', 'lavender-rows', 'wheat', 'paddy-shoots', 'furrows', 'stone-walls', 'tea-hedges', 'silver-oak-trunks', 'silver-oak-crowns', 'maple-trunks', 'maple-crowns', 'maple-leaves', 'spring-rocks', 'hoodoo-parts', 'hoodoo-caps', 'canyon-boulders', 'canyon-shrubs', 'meadow-drifts', 'fence-posts', 'fence-rails', 'loop-posts', 'loop-bands'];
const V4_DETAIL = { 'mustard-flowers': 170, 'lavender-rows': 170, 'wheat': 170, 'paddy-shoots': 140, 'furrows': 160, 'stone-walls': 200, 'tea-hedges': 220, 'maple-leaves': 120, 'canyon-shrubs': 170, 'meadow-drifts': 150, 'fence-rails': 180, 'bamboo-leaves': 200, 'prayer-flags': 230, 'icicles': 150, 'ground-grass': 150, 'tall-grass': 170, 'wildflowers': 160, 'dandelion-stems': 120, 'dandelion-heads': 120, 'fallen-leaves': 110, 'shells': 90, 'dune-grass': 160, 'ferns': 200, 'glow-grass': 150, 'jungle-grass': 150, 'jungle-ferns': 190, 'jungle-leaves': 200, 'jungle-shroom-stems': 110, 'jungle-shroom-caps': 160, 'jungle-vines': 200, 'savanna-grass': 170, 'lagoon-reeds': 160, 'blossom-grass': 150, 'blossom-flowers': 140, 'petal-carpet': 120, 'ao-blobs': 190 };
const V4_LODD = { 'tree-trunks': 140, 'pine-crowns': 170, 'round-crowns': 170, 'jungle-trunks': 150, 'jungle-crowns': 190, 'acacia-crowns': 200, 'cherry-crowns': 180 };
let LODG = null;
function v4LodGeo(name) { if (!LODG) LODG = { 'tree-trunks': new THREE.CylinderGeometry(0.14, 0.24, 1, 3).translate(0, 0.5, 0), 'pine-crowns': new THREE.ConeGeometry(1, 1, 4).translate(0, 0.5, 0), 'round-crowns': new THREE.IcosahedronGeometry(1, 0), 'jungle-trunks': new THREE.CylinderGeometry(0.3, 0.55, 1, 4).translate(0, 0.5, 0), 'jungle-crowns': new THREE.IcosahedronGeometry(1, 0), 'acacia-crowns': new THREE.CylinderGeometry(1, 0.8, 1, 5), 'cherry-crowns': new THREE.IcosahedronGeometry(1, 0) }; return LODG[name] || null; }

// World bounds: the terrain mesh spans this box; a rising snow ridge rims it and a soft boundary keeps the bike inside
const CORE = { x0: -460, x1: 300, z0: 150 }, WB = { x0: -700, x1: 1150, z0: 900 };
const RIM = 120, SOFT_IN = 105, SOFT_OUT = 48;
function edgeInfo(x, z) {
  const z1 = ZEND - 230, c = [[x - WB.x0, -1, 0], [WB.x1 - x, 1, 0], [WB.z0 - z, 0, 1], [z - z1, 0, -1]];
  let b = c[0]; for (const e of c) if (e[0] < b[0]) b = e; return { e: b[0], ox: b[1], oz: b[2] };
}
function H(x, z) {
  const rx = roadX(z), ry = roadY(clamp(z, ZEND - 40, Z0 + 140));
  const sl = (roadX(z + 0.5) - roadX(z - 0.5));
  let d = Math.abs(x - rx) / Math.sqrt(1 + sl * sl);
  if (z < ZEND - 55) d += (ZEND - 55 - z) * 1.1;
  let nat = (fbm(x * 0.012 + 5, z * 0.012) - 0.45) * 20 + (fbm(x * 0.05, z * 0.05) - 0.5) * 3;
  const m = sstep(45, 230, d); nat += m * m * 105 * (0.4 + fbm(x * 0.005 + 9, z * 0.005)) * (1 - 0.7 * sstep(0, 140, coreOut(x, z)));
  let k = sstep(6, 28, d);
  const dc = Math.hypot(x - FIRE.x, z - FIRE.z); k = Math.min(k, sstep(13, 30, dc));
  let h = ry - 0.45 + k * nat;
  const dl = Math.hypot(x - LAKE.x, z - LAKE.z);
  if (dl < LAKE.r * 1.5) h = lerp(h, LAKE.y - 3.5, 1 - sstep(LAKE.r * 0.72, LAKE.r * 1.45, dl));
  const dd = Math.hypot(x - DESERT.x, z - DESERT.z);
  if (dd < DESERT.r * 1.4) { const dune = (fbm(x * 0.02 + 40, z * 0.02) - 0.5) * 7 + (fbm(x * 0.09, z * 0.09) - 0.5) * 1.6; h = lerp(h, ry - 1 + dune, 1 - sstep(DESERT.r * 0.75, DESERT.r * 1.35, dd)); }
  // regions
  const k2 = sstep(6, 28, d), g2 = fbm(x * 0.03 + 2, z * 0.03) - 0.5; let carve = 0;
  { const dm = Math.hypot((x - MEADOW.x) * 0.8, z - MEADOW.z), mm = (1 - sstep(MEADOW.r, MEADOW.r * 1.7, dm)) * k2; if (mm > 0) h = lerp(h, ry - 0.2 + g2 * 5 + Math.sin(x * 0.05) * Math.cos(z * 0.04) * 1.2, mm); }
  { const du = Math.hypot(x - RUINS.x, z - RUINS.z), um = (1 - sstep(RUINS.r, RUINS.r * 1.6, du)) * k2; if (um > 0) h = lerp(h, ry + 0.4 + g2 * 2.5 * sstep(14, 30, du), um); }
  { const zb = zBand(z, RIV.zHi, RIV.zLo, 40); if (zb > 0) { const dr = Math.abs(x - riverX(z)), vm = (1 - sstep(32, 64, dr)) * zb * k2; if (vm > 0) h = lerp(h, ry - 0.6 + g2 * 2.5 * sstep(8, 20, dr), vm); carve = 3.1 * (1 - sstep(3.5, 8.5, dr)) * zb; } }
  { const zb = zBand(z, COAST.zHi, COAST.zLo, 60); if (zb > 0) { const rxz = roadX(z), cm = sstep(40, 110, rxz - x) * zb; if (cm > 0) { const cxz = coastX(z), up = x - cxz;
      let tgt = up < 0 ? SEA_Y + 0.6 + Math.max(up * 0.12, -6) : SEA_Y + 0.6 + Math.min(up * 0.06, 2);
      tgt = lerp(tgt, lerp(SEA_Y + 2.6, ry - 0.45, sstep(cxz + 60, rxz - 50, x)) + g2 * 7 * sstep(20, 90, up), sstep(20, 110, up)); h = lerp(h, tgt, cm); } } }
  { let cr = 0; for (const c of CORR) cr = Math.max(cr, 1 - sstep(c[4] * 0.5, c[4] * 1.2, segD(x, z, c[0], c[1], c[2], c[3]))); cr *= k2; if (cr > 0) h = lerp(h, ry - 0.3 + g2 * 1.5, cr); }
  for (const R of NREG) { const m = regW(R, x, z); if (m > 0) h = lerp(h, R.base + regRelief(R, x, z), m * k2); }
  { const dL = Math.hypot(x - LAGOON.x, z - LAGOON.z); if (dL < LAGOON.r * 1.6) h = lerp(h, LAGOON.y - 0.25 - 3.4 * (1 - sstep(LAGOON.r * 0.1, LAGOON.r * 0.85, dL)), 1 - sstep(LAGOON.r * 0.8, LAGOON.r * 1.55, dL)); }
  for (const P of CLIFFS) { const ox = x - P.x, oz = z - P.z; if (Math.abs(ox) > 150 || Math.abs(oz) > 150) continue; const dp = Math.hypot(ox, oz);
    if (dp < P.r * 1.6) h = lerp(h, P.y - 2.2, 1 - sstep(P.r * 0.7, P.r * 1.5, dp));
    const s = ox * P.dx + oz * P.dz, t = Math.abs(-ox * P.dz + oz * P.dx); h += P.h * sstep(P.r + 2, P.r + 8, s) * (1 - sstep(P.w, P.w + 24, t));
    if (s > P.r + 6 && s < P.r + 95) carve = Math.max(carve, 1.1 * (1 - sstep(1.4, 3.6, t)) * sstep(P.r + 6, P.r + 11, s) * (1 - sstep(P.r + 85, P.r + 95, s))); }
  { const g5 = sstep(0, 30, coreOut(x, z)); if (g5 > 0) { if (peakR(x, z) < 1) h = lerp(h, Math.max(h, PEAK.base + peakH(x, z)), g5);
      if (!v5Raw) { const dl = Math.hypot(x - FLAKE.x, z - FLAKE.z); if (dl < FLAKE.r * 1.7) h = lerp(h, flakeY() - 0.5, (1 - sstep(FLAKE.r * 0.85, FLAKE.r * 1.65, dl)) * g5);
        const dc = Math.hypot(x - CAVE.cx, z - CAVE.cz); if (dc < 21) h = lerp(h, caveY() - 0.3, (1 - sstep(11, 20, dc)) * g5); }
      const sq = streamQ(x, z); if (sq && sq.d < 5) carve = Math.max(carve, 1.9 * (1 - sstep(1.4, 4, sq.d)) * streamF(sq.t));
      const s2 = stream2Q(x, z); if (s2 && s2.d < 5) carve = Math.max(carve, 1.6 * (1 - sstep(1.2, 3.6, s2.d)) * streamF(s2.t));
      if (!v5Raw) { for (const P of PADS) { const d = Math.hypot(x - P.x, z - P.z); if (d < P.r1) h = lerp(h, padY(P), 1 - sstep(P.r0, P.r1, d)); }
        for (const P of PONDS) { const dL = Math.hypot(x - P.x, z - P.z); if (dL < P.r * 1.6) h = lerp(h, pondY(P) - 0.25 - 2.2 * (1 - sstep(P.r * 0.1, P.r * 0.85, dL)), 1 - sstep(P.r * 0.8, P.r * 1.55, dL)); }
        if (Math.abs(x - SPRINGS.x) < 200 && Math.abs(z - SPRINGS.z) < 200) for (const P of SPOOLS) { const dl = Math.hypot(x - P.x, z - P.z); if (dl > P.r + 4) continue; const py = spoolY(P); if (dl < P.r) h = py - 0.75 + 0.6 * sstep(P.r * 0.5, P.r, dl); else { const lip = py + 0.18 - (dl - P.r) * 0.9; if (lip > h) h = lip; } }
        const pf = fieldAt(x, z); if (pf && pf.f.type === 'paddy' && pf.out < 2.5) { const py = fieldY(pf.f); h = lerp(h, py - 0.15, 1 - sstep(-0.5, 2.5, pf.out)); if (pf.out > -1 && pf.out < 0.3) h = Math.max(h, py + 0.2); } } } }
  for (const S of SROADS) { if (x < S.bx0 || x > S.bx1 || z < S.bz0 || z > S.bz1) continue; const q = roadQ(S, x, z); if (q.d < 58) h = lerp(h, q.y + g2 * 1.2 * sstep(5, 25, q.d), 1 - sstep(6, 55, q.d)); }
  { const ei = edgeInfo(x, z), sea = ei.ox < 0 ? zBand(z, COAST.zHi - 80, COAST.zLo, 60) : 0;
    if (ei.e < RIM && sea < 1) { const t = 1 - Math.max(0, ei.e) / RIM, ridge = t * t * (150 + fbm(x * 0.02 + 3, z * 0.02 + 7) * 70) + t * (fbm(x * 0.07, z * 0.07) - 0.5) * 12; h += ridge * k * (1 - sea); } }
  return h - carve;
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
  { const w = wf2Path(); if (Math.hypot(x - w.sx, z - w.zF) < 16) return false; for (let i = 0; i < w.pts.length; i += 3) if (Math.hypot(x - w.pts[i].x, z - w.pts[i].z) < 6) return false; }
  if (Math.hypot(x - FIRE.x, z - FIRE.z) < 15) return false;
  for (const c of clearZones) if (Math.hypot(x - c.x, z - c.z) < c.r) return false;
  if (Math.hypot(x - DESERT.x, z - DESERT.z) < DESERT.r * 1.3) return false;
  if (zBand(z, COAST.zHi, COAST.zLo, 1) > 0.5 && x < coastX(z) + 6) return false;
  if (zBand(z, RIV.zHi, RIV.zLo, 1) > 0.5 && Math.abs(x - riverX(z)) < 7.5) return false;
  for (const P of WPOOLS) if (Math.hypot(x - P.x, z - P.z) < P.r * 1.3 + 2) return false;
  if (sroadD(x, z) < 5) return false;
  return true;
}
function groundY(x, z) {
  let y = (hFast || H)(x, z);
  if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r * 1.4) y = Math.max(y, LAKE.y - 0.3);
  if (roadDist(x, z) < roadW(z) + 0.1) y = Math.max(y, roadY(clamp(z, ZEND - 6, Z0 + 140)) + 0.04);
  { const w = waterAt(x, z); if (w !== null) y = Math.max(y, w - 0.35); }
  if (onPier(x, z)) y = Math.max(y, PIER.y);
  if (FLAKE.y !== null && Math.abs(x - FLAKE.x) < FLAKE.r && Math.abs(z - FLAKE.z) < FLAKE.r && Math.hypot(x - FLAKE.x, z - FLAKE.z) < FLAKE.r) y = Math.max(y, FLAKE.y);
  if (Math.abs(x - BRIDGE.x) < 9 && Math.abs(z - BRIDGE.z) < 9) { const [a, b] = bridgeLoc(x, z); if (Math.abs(a) < BRIDGE.len / 2 && Math.abs(b) < BRIDGE.w + 0.3) y = Math.max(y, bridgeY(a)); }
  return y;
}
function glowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}


// v7: cooperative yielding while the world is built. Only yields if more than ~10 ms of work has passed since the last yield.
let __yt = 0;
const __y = () => { const n = performance.now(); if (n - __yt < 10) return null; return (typeof scheduler !== 'undefined' && scheduler.yield ? scheduler.yield() : new Promise(r => setTimeout(r, 0))).then(() => { __yt = performance.now(); }); };
export async function createWorld(host, opts = {}) {
  const lp = !!opts.lowPower; let terrMat = null, roadMat = null;
  // Height fog + sun/moon scattering, injected into every built-in fog-enabled material
  const FOGU = { uFogBase: { value: 0 }, uFogFall: { value: 0.085 }, uFogAmt: { value: 0.5 }, uSunAmt: { value: 0.5 }, uSunDir: { value: new THREE.Vector3(0, 0.1, -1) }, uSunCol: { value: new THREE.Color('#ffc08a') }, uFogHaze: { value: new THREE.Color('#d8c0c8') } };
  const TERU = { uRimCol: { value: new THREE.Color('#ffb067') }, uRimAmt: { value: 0.18 } };
  const SUNCOL = new THREE.Color('#ffbf86'), MOONCOL = new THREE.Color('#9fb6ff'), HAZE_D = new THREE.Color('#ecd6d8'), HAZE_N = new THREE.Color('#7f93cc');
  if (!THREE.ShaderChunk.fog_vertex.includes('vFogWorld')) {
    THREE.ShaderChunk.fog_pars_vertex = '#ifdef USE_FOG\n varying float vFogDepth;\n varying vec3 vFogWorld;\n#endif\n';
    THREE.ShaderChunk.fog_vertex = '#ifdef USE_FOG\n vFogDepth = - mvPosition.z;\n vFogWorld = (mvPosition.xyz - viewMatrix[3].xyz) * mat3(viewMatrix);\n#endif\n';
    THREE.ShaderChunk.fog_pars_fragment = '#ifdef USE_FOG\n uniform vec3 fogColor;\n varying float vFogDepth;\n varying vec3 vFogWorld;\n uniform float uFogBase, uFogFall, uFogAmt, uSunAmt;\n uniform vec3 uSunDir, uSunCol, uFogHaze;\n #ifdef FOG_EXP2\n  uniform float fogDensity;\n #else\n  uniform float fogNear;\n  uniform float fogFar;\n #endif\n#endif\n';
    THREE.ShaderChunk.fog_fragment = `#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
  #else
    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
  #endif
  vec3 fogV = normalize( vFogWorld - cameraPosition );
  float hgt = exp( - max( vFogWorld.y - uFogBase, 0.0 ) * uFogFall ) * ( 1.0 - exp( - vFogDepth * 0.016 ) ) * uFogAmt;
  float sct = pow( max( dot( fogV, uSunDir ), 0.0 ), 6.0 ) * uSunAmt;
  vec3 fc = mix( fogColor, uSunCol, sct );
  fc = mix( fc, uFogHaze, hgt * ( 1.0 - fogFactor ) );
  gl_FragColor.rgb = mix( gl_FragColor.rgb, fc, clamp( max( fogFactor, hgt * 0.8 ), 0.0, 1.0 ) );
#endif
`;
  }
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
    renderer = new THREE.WebGLRenderer({ antialias: !lp, powerPreference: 'high-performance', preserveDrawingBuffer: (() => { try { return sessionStorage.getItem('apCapture') === '1'; } catch (e) { return false; } })() });
  } catch (e) { opts.onError && opts.onError(e); return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lp ? 1.5 : 2));
  await __y(); renderer.setSize(host.clientWidth, host.clientHeight);
  await __y(); renderer.toneMapping = THREE.ACESFilmicToneMapping; await __y(); renderer.toneMappingExposure = 1.3;
  await __y(); renderer.outputColorSpace = THREE.SRGBColorSpace;
  await __y(); renderer.shadowMap.enabled = !lp; await __y(); renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  await __y(); const canvas = renderer.domElement; await __y(); canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;outline:none';
  await __y(); host.appendChild(canvas);

  // Post-process: vignette + grain + subtle color grade (cinematic still-frame look)
  await __y(); const postRT = new THREE.WebGLRenderTarget(1, 1, { colorSpace: THREE.SRGBColorSpace, samples: lp || opts.mobile ? 0 : 4 });
  await __y(); const BL = { a: new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false }), b: new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false }) };
  await __y(); const FSVS = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }';
  await __y(); const brightMat = new THREE.ShaderMaterial({ uniforms: { map: { value: postRT.texture }, texel: { value: new THREE.Vector2() }, thresh: { value: 0.6 } }, depthWrite: false, depthTest: false, vertexShader: FSVS,
    fragmentShader: `uniform sampler2D map; uniform vec2 texel; uniform float thresh; varying vec2 vUv;
      void main(){ vec2 o=texel*1.5; vec3 c=(texture2D(map,vUv+vec2(-o.x,-o.y)).rgb+texture2D(map,vUv+vec2(o.x,-o.y)).rgb+texture2D(map,vUv+vec2(-o.x,o.y)).rgb+texture2D(map,vUv+o).rgb)*.25;
        float l=max(max(c.r,c.g),c.b); float k=smoothstep(thresh,thresh+.3,l); float sat=l-min(min(c.r,c.g),c.b);
        gl_FragColor=vec4(c*k*(.45+1.1*sat),1.); }` });
  await __y(); const blurMat = new THREE.ShaderMaterial({ uniforms: { map: { value: null }, dir: { value: new THREE.Vector2() } }, depthWrite: false, depthTest: false, vertexShader: FSVS,
    fragmentShader: `uniform sampler2D map; uniform vec2 dir; varying vec2 vUv;
      void main(){ vec3 c=texture2D(map,vUv).rgb*.227; c+=(texture2D(map,vUv+dir*1.385).rgb+texture2D(map,vUv-dir*1.385).rgb)*.316; c+=(texture2D(map,vUv+dir*3.231).rgb+texture2D(map,vUv-dir*3.231).rgb)*.07; gl_FragColor=vec4(c,1.); }` });
  await __y(); const fsq = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), brightMat), fsScene = new THREE.Scene(); await __y(); fsq.frustumCulled = false; await __y(); fsScene.add(fsq);
  await __y(); const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  await __y(); const postU = { map: { value: postRT.texture }, time: { value: 0 }, night: { value: 0 }, bloom: { value: BL.a.texture }, bloomAmt: { value: 0 }, focus: { value: 0 }, texelF: { value: new THREE.Vector2() } };
  await __y(); const postMat = new THREE.ShaderMaterial({ uniforms: postU, depthWrite: false, depthTest: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
    fragmentShader: `uniform sampler2D map,bloom; uniform float time,night,bloomAmt,focus; uniform vec2 texelF; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
      void main(){ vec3 c=texture2D(map,vUv).rgb;
        if(focus>0.001){ vec2 dd=vUv-vec2(.5,.47); float fa=smoothstep(.14,.6,length(dd*vec2(1.3,1.)))*focus;
          if(fa>0.002){ vec2 r=texelF*(1.5+fa*4.5); vec3 acc=c; acc+=texture2D(map,vUv+vec2(r.x,0.)).rgb; acc+=texture2D(map,vUv-vec2(r.x,0.)).rgb; acc+=texture2D(map,vUv+vec2(0.,r.y)).rgb; acc+=texture2D(map,vUv-vec2(0.,r.y)).rgb;
            acc+=texture2D(map,vUv+r*.7).rgb; acc+=texture2D(map,vUv-r*.7).rgb; acc+=texture2D(map,vUv+vec2(r.x,-r.y)*.7).rgb; acc+=texture2D(map,vUv+vec2(-r.x,r.y)*.7).rgb; c=mix(c,acc/9.,smoothstep(0.,.35,fa)); } }
        c+=texture2D(bloom,vUv).rgb*bloomAmt;
        c=pow(c,vec3(0.72))*1.12;
        float lum=dot(c,vec3(0.299,0.587,0.114)); c=mix(vec3(lum),c,1.16);
        vec2 ce=vUv-0.5; float vig=1.0-smoothstep(0.46,1.02,length(ce))*0.3; c*=vig;
        float g=(hash(vUv*vec2(1920.0,1080.0)+time)-0.5)*0.018; c+=g;
        c=mix(c,c*vec3(1.05,0.99,0.93),0.3*(1.0-night)); c=mix(c,c*vec3(0.95,0.98,1.06),0.28*night);
        c=(c-0.5)*1.12+0.5;
        gl_FragColor=vec4(c,1.0); }` });
  await __y(); const postScene = new THREE.Scene(); await __y(); postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));
  await __y(); const resizePost = () => { const pr = renderer.getPixelRatio(), W = Math.max(1, host.clientWidth * pr), Hh = Math.max(1, host.clientHeight * pr); postRT.setSize(W, Hh); const bw = Math.max(1, Math.floor(W / 4)), bh = Math.max(1, Math.floor(Hh / 4)); BL.a.setSize(bw, bh); BL.b.setSize(bw, bh); brightMat.uniforms.texel.value.set(1 / W, 1 / Hh); postU.texelF.value.set(1 / W, 1 / Hh); };
  await __y(); const blurPass = (src, dst, dx, dy, k) => { blurMat.uniforms.map.value = src.texture; blurMat.uniforms.dir.value.set(dx * k / src.width, dy * k / src.height); fsq.material = blurMat; renderer.setRenderTarget(dst); renderer.render(fsScene, postCamB); };
  await __y(); const postCamB = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  await __y(); resizePost();

  await __y(); v6Prep();
  await __y(); const scene = new THREE.Scene();
  await __y(); scene.matrixWorldAutoUpdate = false; // v7: world matrices are updated by updateRoots() in the frame loop, skipping hidden and static roots
  await __y(); if (/[?&]perf\b/.test(location.search)) window.__apW = { renderer, scene, get lowPower() { return lp; } };
  await __y(); scene.fog = new THREE.Fog(0xe0976f, 50, 560);
  await __y(); const camera = new THREE.PerspectiveCamera(52, host.clientWidth / host.clientHeight, 0.1, 4000);
  await __y(); const GT = glowTex();
  await __y(); const mk = (geo, mat, name) => { const m = new THREE.Mesh(geo, mat); m.name = name || ''; return m; };
  await __y(); const std = lp ? (c, o = {}) => { const { roughness, metalness, envMapIntensity, ...rest } = o; const m = new THREE.MeshLambertMaterial({ color: c, flatShading: true, ...rest }); m.roughness = roughness === undefined ? 0.9 : roughness; m.metalness = metalness || 0; return m; }
    : (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.9, metalness: 0, ...o });
  await __y(); const glowSprite = (col, s, op = 1) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GT, color: col, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: op, fog: false })); sp.scale.setScalar(s); return sp; };
  await __y(); const glows = []; // {sprite, base, night}

  // Sky
  await __y(); const skyU = { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, moonDir: { value: new THREE.Vector3(0.74, 0.3, -0.6).normalize() }, night: { value: 0 }, time: { value: 0 } };
  await __y(); const sky = mk(new THREE.SphereGeometry(1800, 32, 16), new THREE.ShaderMaterial({
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
  await __y(); scene.add(sky);

  // Sun / moon flares
  await __y(); const sunFlare = new THREE.Group(); await __y(); sunFlare.name = 'sun-flare';
  await __y(); const sunCore = glowSprite('#fff2d8', 26, 1); await __y(); const sunRing = glowSprite('#ffb066', 60, 0.4); await __y(); const sunStreak = glowSprite('#ffe6b8', 1, 0.22); await __y(); sunStreak.scale.set(340, 5, 1); await __y(); sunFlare.add(sunRing, sunCore, sunStreak); await __y(); scene.add(sunFlare);
  await __y(); const moonFlare = new THREE.Group(); await __y(); moonFlare.name = 'moon-flare';
  await __y(); const moonCore = glowSprite('#eaf2ff', 12, 1); await __y(); const moonHalo = glowSprite('#9db4ff', 30, 0.3); await __y(); moonFlare.add(moonHalo, moonCore); await __y(); scene.add(moonFlare);
  await __y(); const camFwd = new THREE.Vector3();

  // Lights
  await __y(); const hemi = new THREE.HemisphereLight(0xffd6a8, 0x3b2f4a, 2.15); await __y(); scene.add(hemi);
  await __y(); const ambientFill = new THREE.AmbientLight(0xdfe8ff, 0.62); await __y(); scene.add(ambientFill);
  await __y(); const key = new THREE.DirectionalLight(0xffb070, 3.6); await __y(); key.castShadow = !lp;
  await __y(); key.shadow.mapSize.set(lp ? 1024 : 2048, lp ? 1024 : 2048); await __y(); Object.assign(key.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 140 }); await __y(); key.shadow.bias = -0.0004; await __y(); key.shadow.radius = 2.2;
  await __y(); scene.add(key); await __y(); scene.add(key.target);

  // Studio-gradient environment map for realistic reflections on chrome/gloss/water
  await __y(); if (!lp) {
    const pmrem = new THREE.PMREMGenerator(renderer); pmrem.compileEquirectangularShader();
    const envCanvas = document.createElement('canvas'); envCanvas.width = 16; envCanvas.height = 128;
    const ectx = envCanvas.getContext('2d'); const eg = ectx.createLinearGradient(0, 0, 0, 128);
    eg.addColorStop(0, '#bcd6ff'); eg.addColorStop(0.45, '#f2ddc4'); eg.addColorStop(0.62, '#caa77a'); eg.addColorStop(1, '#2a2018');
    ectx.fillStyle = eg; ectx.fillRect(0, 0, 16, 128);
    const envTex = new THREE.CanvasTexture(envCanvas); envTex.mapping = THREE.EquirectangularReflectionMapping; envTex.colorSpace = THREE.SRGBColorSpace;
    const envRT = pmrem.fromEquirectangular(envTex); scene.environment = envRT.texture; envTex.dispose(); pmrem.dispose();
  }

  // Terrain
  await __y(); const TX0 = CORE.x0, TX1 = CORE.x1, TZ0 = CORE.z0, TZ1 = ZEND - 230;
  await __y(); const sx = lp ? 115 : 190, sz = lp ? 270 : 440;
  await __y(); let tg = new THREE.PlaneGeometry(TX1 - TX0, TZ0 - TZ1, sx, sz); await __y(); tg.rotateX(-Math.PI / 2); await __y(); tg.translate((TX0 + TX1) / 2, 0, (TZ0 + TZ1) / 2);
  await __y(); const cx = (TX1 - TX0) / sx, cz = (TZ0 - TZ1) / sz; await __y(); let p = tg.attributes.position;
  await __y(); for (let i = 0; i < p.count; i++) { const bx = p.getX(i), bz = p.getZ(i), eV = bx < TX0 + 0.5 || bx > TX1 - 0.5 || bz > TZ0 - 0.5 || bz < TZ1 + 0.5, x = eV ? bx : bx + (h2(i, 3) - 0.5) * cx * 0.7, z = eV ? bz : bz + (h2(i, 9) - 0.5) * cz * 0.7; p.setXYZ(i, x, H(x, z), z); }
  await __y(); tg = tg.toNonIndexed(); await __y(); tg.computeVertexNormals(); await __y(); p = tg.attributes.position;
  await __y(); const nrm = tg.attributes.normal; await __y(); const col = new Float32Array(p.count * 3); await __y(); const C = new THREE.Color();
  await __y(); const GR = ['#5f7d3a', '#6b8a3f', '#52703a', '#7a9446', '#4a6a36'].map(c => new THREE.Color(c));
  await __y(); const MOSS = ['#3c5a36', '#35513a', '#466638'].map(c => new THREE.Color(c));
  await __y(); const ROCK = ['#6f6a66', '#5f5b58', '#7c766e'].map(c => new THREE.Color(c));
  await __y(); const DIRT = ['#8a6a44', '#7b5d3b', '#94744a'].map(c => new THREE.Color(c));
  await __y(); const HAZE = new THREE.Color('#b58a9a'), SAND = new THREE.Color('#a39068'), SNOW = new THREE.Color('#dfe3ee'), GRAVEL = new THREE.Color('#6a655f');
  await __y(); const BEACH = new THREE.Color('#dcc896'), WETSAND = new THREE.Color('#a8946a'), RIVBED = new THREE.Color('#5a5440'), PAVE = new THREE.Color('#9a948a'), MEAD = ['#7fa447', '#8cb04d', '#739a40'].map(c => new THREE.Color(c));
  await __y(); for (let i = 0; i < p.count; i += 3) {
    const X = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, Y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, Z = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
    const ny = nrm.getY(i), rel = Y - roadY(clamp(Z, ZEND - 40, Z0 + 140)), dR = Math.abs(X - roadX(Z)), hh = h2(i, 77);
    const prog = fO(Z), dl = Math.hypot(X - LAKE.x, Z - LAKE.z);
    const ddz = Math.hypot(X - DESERT.x, Z - DESERT.z);
    if (dl < LAKE.r * 1.25 && Y < LAKE.y + 0.9) C.copy(SAND);
    else if (ddz < DESERT.r * 1.3) { C.copy(SAND); C.lerp(new THREE.Color('#e8c07d'), 0.55); if (h2(i, 21) < 0.14) C.copy(ROCK[Math.floor(hh * 3)]).lerp(new THREE.Color('#b3703f'), 0.5); }
    else if (Z < ZEND - 40) C.copy(ROCK[Math.floor(hh * 3)]).multiplyScalar(0.85 + hh * 0.3);
    else if (dR < 5.8 && Z > ZEND - 26) { C.copy(DIRT[Math.floor(hh * 3)]); C.lerp(GRAVEL, 1 - trailMix(Z)); }
    else if (rel > 80 && ny > 0.6) C.copy(SNOW);
    else if (ny < 0.74 || rel > 50) C.copy(ROCK[Math.floor(hh * 3)]);
    else { C.copy(GR[Math.floor(hh * 5)]); if (h2(i, 5) < prog * 0.8) C.lerp(MOSS[Math.floor(hh * 3)], 0.7); }
    if (zBand(Z, COAST.zHi, COAST.zLo, 20) > 0.5 && X < roadX(Z) - 40 && Y < SEA_Y + 2.4) C.copy(Y < SEA_Y + 0.5 ? WETSAND : BEACH).multiplyScalar(0.94 + hh * 0.12);
    else if (zBand(Z, RIV.zHi, RIV.zLo, 10) > 0.5 && Math.abs(X - riverX(Z)) < 9) C.copy(Y < roadY(Z) - 2 ? RIVBED : MOSS[Math.floor(hh * 3)]);
    else if (Math.hypot((X - MEADOW.x) * 0.8, Z - MEADOW.z) < MEADOW.r * 1.2 && ny > 0.8) C.copy(MEAD[Math.floor(hh * 3)]);
    else if (Math.hypot(X - RUINS.x, Z - RUINS.z) < 16) C.copy(PAVE).multiplyScalar(0.85 + hh * 0.3);
    C.multiplyScalar(0.92 + h2(i, 13) * 0.16); { const l = (C.r + C.g + C.b) / 3; C.r = l + (C.r - l) * 1.14; C.g = l + (C.g - l) * 1.14; C.b = l + (C.b - l) * 1.14; }
    C.multiplyScalar(0.96 + fbm(X * 0.85 + 3, Z * 0.85) * 0.09);
    C.offsetHSL((vnoise(X * 0.02 + 31, Z * 0.02) - 0.5) * 0.045, (vnoise(X * 0.045 + 7, Z * 0.045) - 0.5) * 0.1, (vnoise(X * 0.13 + 17, Z * 0.13) - 0.5) * 0.05);
    C.lerp(HAZE, clamp((Y - roadY(clamp(Z, ZEND, Z0))) / 150, 0, 0.38));
    for (let k = 0; k < 3; k++) { col[(i + k) * 3] = C.r; col[(i + k) * 3 + 1] = C.g; col[(i + k) * 3 + 2] = C.b; }
  }
  await __y(); tg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  await __y(); const CH = 110, chunks = [];
  await __y(); { const tp = tg.attributes.position.array, tn = tg.attributes.normal.array, tc = tg.attributes.color.array, B = new Map();
    for (let i = 0; i < tp.length; i += 9) { const k = Math.floor((TZ0 - (tp[i + 2] + tp[i + 5] + tp[i + 8]) / 3) / CH); let b = B.get(k); if (!b) B.set(k, b = { p: [], n: [], c: [] }); for (let j = 0; j < 9; j++) { b.p.push(tp[i + j]); b.n.push(tn[i + j]); b.c.push(tc[i + j]); } }
    const tmat = std(0xffffff, { vertexColors: true }); terrMat = tmat;
    tmat.onBeforeCompile = sh => { Object.assign(sh.uniforms, TERU);
      sh.vertexShader = 'attribute vec3 bary;\nvarying vec3 vBary;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vBary = bary;');
      sh.fragmentShader = 'varying vec3 vBary;\nuniform vec3 uRimCol;\nuniform float uRimAmt;\n' + sh.fragmentShader.replace('#include <fog_fragment>', `{ float eB = min(min(vBary.x, vBary.y), vBary.z); float eW = fwidth(eB); float edge = (1.0 - smoothstep(0.0, eW * 1.6, eB)) * (1.0 - smoothstep(18.0, 60.0, length(vViewPosition)));
        vec3 nV = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition))); float rim = pow(1.0 - clamp(abs(dot(nV, normalize(vViewPosition))), 0.0, 1.0), 4.0);
        gl_FragColor.rgb += uRimCol * rim * uRimAmt + gl_FragColor.rgb * edge * 0.055; }
#include <fog_fragment>`); };
    tmat.customProgramCacheKey = () => 'terrain-rim-v1';
    B.forEach(b => { const g = new THREE.BufferGeometry(); { const nv = b.p.length / 3, ba = new Float32Array(nv * 3); for (let v = 0; v < nv; v++) ba[v * 3 + (v % 3)] = 1; g.setAttribute('bary', new THREE.BufferAttribute(ba, 3)); } g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3)); g.computeBoundingSphere(); const m = mk(g, tmat, 'terrain-chunk'); m.receiveShadow = !lp; scene.add(m); }); tg.dispose(); }
  await __y(); { const HS = 3, HW = Math.floor((TX1 - TX0) / HS) + 2, HD = Math.floor((TZ0 - TZ1) / HS) + 2, HF = new Float32Array(HW * HD);
    for (let j = 0; j < HD; j++) for (let i = 0; i < HW; i++) HF[j * HW + i] = H(TX0 + i * HS, TZ1 + j * HS);
    const OB = 64, OS = 4, ON = OB / OS + 1, oBlocks = new Map();
    const hOut = (x, z) => { x = clamp(x, WB.x0, WB.x1); z = clamp(z, ZEND - 230, WB.z0); const bi = Math.floor(x / OB), bj = Math.floor(z / OB), key = bi * 100003 + bj; let b = oBlocks.get(key); if (!b) { b = new Float32Array(ON * ON); for (let j = 0; j < ON; j++) for (let i = 0; i < ON; i++) b[j * ON + i] = H(bi * OB + i * OS, bj * OB + j * OS); oBlocks.set(key, b); } const gx = (x - bi * OB) / OS, gz = (z - bj * OB) / OS, i = Math.min(ON - 2, gx | 0), j = Math.min(ON - 2, gz | 0), u = gx - i, v = gz - j, o = j * ON + i; return lerp(lerp(b[o], b[o + 1], u), lerp(b[o + ON], b[o + ON + 1], u), v); };
    hFast = (x, z) => { if (x < TX0 || x > TX1 || z > TZ0 || z < TZ1) return hOut(x, z); const gx = clamp((x - TX0) / HS, 0, HW - 1.001), gz = clamp((z - TZ1) / HS, 0, HD - 1.001), i = gx | 0, j = gz | 0, u = gx - i, v = gz - j, o = j * HW + i; return lerp(lerp(HF[o], HF[o + 1], u), lerp(HF[o + HW], HF[o + HW + 1], u), v); }; }

  // Road
  await __y(); { const pos = [], idx = [], cols = [], ASP = new THREE.Color('#34313a'), DRT = new THREE.Color('#6e5236'), SH = new THREE.Color('#4a4038'), cc = new THREE.Color(); let n = 0;
    const OFF = [-1.15, -1, 0, 1, 1.15], DY = [-0.55, 0, 0, 0, -0.55];
    for (let z = Z0 + 140; z >= ZEND - 6; z -= 2) { const { r } = frame(z), x = roadX(z), y = roadY(z) + 0.04, w = roadW(z), m = trailMix(z);
      for (let k = 0; k < 5; k++) { const j = k === 2 ? (h2(n, 7) - 0.5) * 0.7 * m : 0, o = OFF[k] * w + (k === 0 ? -0.2 : k === 4 ? 0.2 : 0) + j; pos.push(x + r.x * o, y + DY[k] + (k === 2 ? 0.03 * m : 0), z + r.z * o);
        cc.copy(k === 0 || k === 4 ? SH : ASP).lerp(DRT, k === 0 || k === 4 ? m * 0.6 : m).multiplyScalar(1 + (h2(n, k + 5) - 0.5) * 0.2 * (0.3 + m)); cols.push(cc.r, cc.g, cc.b); }
      if (n) for (let c = 0; c < 4; c++) { const a = 5 * (n - 1) + c, b = 5 * n + c; idx.push(a, a + 1, b, a + 1, b + 1, b); } n++; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.setIndex(idx); g.computeVertexNormals();
    const road = mk(g, std('#ffffff', { vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }), 'road'); roadMat = road.material; road.receiveShadow = !lp; scene.add(road);
    for (const sd of [-1, 1]) { const ep = [], ei = []; let q = 0; for (let z = Z0 + 140; z >= zW(0.43); z -= 2) { const { r } = frame(z), x = roadX(z), y = roadY(z) + 0.07, w = roadW(z) - 0.3; ep.push(x + r.x * sd * w, y, z + r.z * sd * w, x + r.x * sd * (w + 0.13), y, z + r.z * sd * (w + 0.13)); if (q) ei.push(2 * q - 2, 2 * q - 1, 2 * q, 2 * q - 1, 2 * q + 1, 2 * q); q++; }
      const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.Float32BufferAttribute(ep, 3)); eg.setIndex(ei); scene.add(mk(eg, new THREE.MeshBasicMaterial({ color: '#e8dcc0', side: THREE.DoubleSide }), 'edge-line')); }
    { const pz = []; for (let z = Z0 + 120; z > zW(0.4); z -= 14) pz.push(z);
      const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 1.2, 0.1).translate(0, 0.6, 0), std('#e9e4da'), pz.length * 2), refl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.11, 0.12, 0.11), new THREE.MeshBasicMaterial({ color: '#ff9a3a' }), pz.length * 2); posts.name = 'road-posts'; refl.name = 'reflectors'; const o = new THREE.Object3D(); let q = 0;
      pz.forEach(z => [-1, 1].forEach(sd => { const { r } = frame(z), w = roadW(z) + 1, x = roadX(z) + r.x * sd * w, zz = z + r.z * sd * w; o.position.set(x, roadY(z) - 0.4, zz); o.updateMatrix(); posts.setMatrixAt(q, o.matrix); o.position.y += 1.08; o.updateMatrix(); refl.setMatrixAt(q++, o.matrix); }));
      scene.add(posts, refl); }
    const zs = []; for (let z = Z0 + 130; z > zW(0.37); z -= 8) zs.push(z);
    const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.02, 2.4), new THREE.MeshBasicMaterial({ color: '#ffffff' }), zs.length); dash.name = 'lane-dashes';
    const o = new THREE.Object3D(); zs.forEach((z, i) => { const { f } = frame(z); o.position.set(roadX(z), roadY(z) + 0.06, z); o.rotation.set(0, Math.atan2(-f.x, -f.z), 0); o.updateMatrix(); dash.setMatrixAt(i, o.matrix); dash.setColorAt(i, new THREE.Color(z < zW(2 / NSTOP) + 24 ? '#f2c230' : '#d8c79c')); });
    scene.add(dash); }

  // Landmarks
  await __y(); const sZ = i => zAt(i / NSTOP), side = [0, 1, -1, 1, -1, -1, 1, -1, 1, 0];
  await __y(); const at = (i, off, dz = 0) => { const z = sZ(i) + dz, x = roadX(z) + side[i] * off; return new THREE.Vector3(x, H(x, z), z); };
  await __y(); const wood = std('#6b4a33'), darkWood = std('#3e2c22'), stone = std('#77716b'), warmBasic = new THREE.MeshBasicMaterial({ color: '#ffc36b', fog: false });
  await __y(); const anim = [], progFx = [], typeQ = [];
  await __y(); const worldType = (lines, z, opt = {}) => { const c = document.createElement('canvas'); c.width = 1024; c.height = opt.vertical ? 256 : 1024; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const draw = () => { const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.fillStyle = opt.color || 'rgba(246,236,218,.92)'; g.textAlign = 'center'; g.textBaseline = 'middle'; const n = lines.length;
      lines.forEach((l, i) => { g.save(); g.translate(512, c.height * (i + 0.5) / n); g.scale(1, opt.stretch || 2.7); g.font = (opt.font || 'italic 500') + ' ' + (opt.size || 124) + 'px "Cormorant Garamond", Georgia, serif'; if (opt.track) g.letterSpacing = opt.track; g.fillText(l, 0, 0); g.restore(); }); tex.needsUpdate = true; };
    draw(); typeQ.push(draw);
    const { f } = frame(z), yaw = Math.atan2(-f.x, -f.z), w = opt.w || roadW(z) * 1.85, d = opt.d || 12;
    const m = mk(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }), 'world-type');
    if (opt.vertical) { m.position.copy(opt.pos); m.rotation.set(0, yaw, 0); }
    else { const yN = roadY(z + d / 2), yF = roadY(z - d / 2); m.rotation.set(-Math.PI / 2 + Math.atan2(yF - yN, d), yaw, 0, 'YXZ'); m.position.set(roadX(z), roadY(z) + 0.1, z); m.renderOrder = 2; }
    scene.add(m); return m; };
  // 1 · ten lanterns, nine lit
  await __y(); for (let k = 0; k < 10; k++) { const v = at(1, 5.4, 9 - k * 2.3); const post = mk(new THREE.CylinderGeometry(0.05, 0.06, 1.8, 6), darkWood, 'lantern-post'); post.position.set(v.x, v.y + 0.9, v.z); scene.add(post);
    const lit = k !== 9, darkM = std('#3a3430'); const lan = mk(new THREE.BoxGeometry(0.26, 0.32, 0.26), darkM, 'lantern'); lan.position.set(v.x, v.y + 1.95, v.z); scene.add(lan);
    if (lit) { const g = glowSprite('#ffb45a', 2.6, 0.9); g.position.copy(lan.position); scene.add(g); const gl = { s: g, base: 0.35, n: 0.95, on: 0 }; glows.push(gl); const th = 1 / NSTOP - 0.055 + 0.05 * (k / 8);
      progFx.push(tt => { const on = tt > th; lan.material = on ? warmBasic : darkM; gl.on += ((on ? 1 : 0) - gl.on) * 0.1; g.visible = gl.on > 0.02; g.scale.setScalar(2.6 * gl.on + 0.01); }); } }
  await __y(); worldType(['Nine lanterns,', 'still burning.'], sZ(1) + 17);
  await __y(); clearZones.push({ ...at(1, 7), r: 16 });
  // 2 · cairn + flag
  await __y(); const solids = [];
  await __y(); { const v = at(2, 8); for (let k = 0; k < 6; k++) { const s = mk(new THREE.DodecahedronGeometry(1, 0), stone, 'cairn-stone'); const sc = 1.1 - k * 0.15; s.scale.set(sc, sc * 0.45, sc); s.position.set(v.x, v.y + 0.3 + k * 0.62 * (1 - k * 0.04), v.z); s.rotation.y = k; s.castShadow = !lp; scene.add(s); }
    const pole = mk(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 5), darkWood, 'flag-pole'); pole.position.set(v.x, v.y + 4.4, v.z); scene.add(pole);
    const flag = mk(new THREE.BoxGeometry(0.02, 0.5, 0.8), std('#c8312e'), 'flag'); flag.position.set(v.x, v.y + 5.3, v.z - 0.42); scene.add(flag); anim.push(t => { flag.rotation.y = Math.sin(t * 2.2) * 0.25; });
    solids.push({ x: v.x, z: v.z, r: 1.3 });
    clearZones.push({ x: v.x, z: v.z, r: 7 }); }
  // 3 · great tree with 4 orbs (1× → 4×)
  await __y(); { const v = at(3, 11); const tr = mk(new THREE.CylinderGeometry(0.35, 0.6, 7, 7), wood, 'nest-trunk'); tr.position.set(v.x, v.y + 3.5, v.z); scene.add(tr);
    const cr = mk(new THREE.IcosahedronGeometry(4.6, 0), std('#4f7a3a'), 'nest-crown'); cr.position.set(v.x, v.y + 8.6, v.z); cr.castShadow = !lp; scene.add(cr);
    [0.22, 0.32, 0.42, 0.55].forEach((r, k) => { const o = mk(new THREE.IcosahedronGeometry(r, 1), warmBasic, 'nest-orb'); const a = k * 1.6 + 0.4; o.position.set(v.x + Math.cos(a) * 3.4, v.y + 5.4 - k * 0.2, v.z + Math.sin(a) * 3.4); scene.add(o); const g = glowSprite('#ffcf7a', r * 9, 0.9); g.position.copy(o.position); scene.add(g); glows.push({ s: g, base: 0.3, n: 1 }); anim.push(t => { o.position.y = v.y + 5.4 - k * 0.2 + Math.sin(t * 1.3 + k) * 0.15; g.position.y = o.position.y; }); });
    const orbs = scene.children.filter(o => o.name === 'nest-orb'), og = glows.slice(-4);
    progFx.push(tt => { const g = sstep(3 / NSTOP - 0.06, 3 / NSTOP - 0.008, tt), s = 0.2 + 0.8 * g; tr.scale.setScalar(s); tr.position.y = v.y + 3.5 * s; cr.scale.setScalar(s); cr.position.y = v.y + 8.6 * s; orbs.forEach((o, k) => { const on = g > 0.55 + k * 0.12; o.visible = on; og[k].s.visible = on; }); });
    clearZones.push({ x: v.x, z: v.z, r: 8 }); }
  await __y(); worldType(['100K → 400K'], sZ(3) + 17, { size: 150 });
  await __y(); { const z = sZ(2) + 24, { f, r } = frame(z), w = roadW(z) + 0.8, y = roadY(z), yaw = Math.atan2(-f.x, -f.z), red = std('#b3202a'), white = std('#efe8dc');
    [-1, 1].forEach(sd => { const p = mk(new THREE.BoxGeometry(0.22, 4.8, 0.22), white, 'border-post'); p.position.set(roadX(z) + r.x * sd * w, y + 2, z + r.z * sd * w); p.castShadow = !lp; scene.add(p); });
    const gate = new THREE.Group(); gate.name = 'border-gate'; gate.position.set(roadX(z) - r.x * w, y + 4.2, z - r.z * w); gate.rotation.y = yaw; scene.add(gate);
    const bar = mk(new THREE.BoxGeometry(w * 2 + 0.5, 0.6, 0.18), red, 'border-bar'); bar.position.x = w; gate.add(bar);
    const canadaSign = worldType(['CANADA'], z, { vertical: true, w: w * 1.5, d: w * 0.375, font: '600', size: 150, stretch: 1, track: '28px', color: '#fff6ea', pos: new THREE.Vector3(roadX(z) - f.x * 0.12, y + 4.2, z - f.z * 0.12) });
    progFx.push(tt => { const lift = sstep(2 / NSTOP - 0.04, 2 / NSTOP - 0.022, tt); gate.rotation.z = lift * 1.35; canadaSign.material.opacity = 1 - lift; canadaSign.visible = lift < 0.99; }); }
  await __y(); worldType(['A flag in', 'new ground.'], sZ(2) + 11);
  // 4 · CEAT Specialty: a giant off-highway tyre that never stops turning, plus a stack of spares
  await __y(); { const v = at(4, 9.5), rub = std('#1c1c20', { roughness: 0.92 }), rim = std('#e0a526', { roughness: 0.45, metalness: 0.3 }), hub = std('#3a3a40', { roughness: 0.5, metalness: 0.4 });
    const yaw = Math.atan2(roadX(v.z) - v.x, 0) * 0.35 + Math.PI / 2;
    const tyre = new THREE.Group(); tyre.name = 'ceat-tyre'; tyre.position.set(v.x, v.y + 3.05, v.z); tyre.rotation.y = yaw; scene.add(tyre);
    const spin = new THREE.Group(); tyre.add(spin);
    const body = mk(new THREE.TorusGeometry(2.2, 0.85, 14, 40), rub, 'tyre-body'); body.castShadow = !lp; spin.add(body);
    for (let k = 0; k < 30; k++) { const a = k / 30 * Math.PI * 2; [-1, 1].forEach(sd => { const lug = mk(new THREE.BoxGeometry(0.34, 0.26, 0.62), rub, 'tyre-lug'); lug.position.set(Math.cos(a) * 3.02, Math.sin(a) * 3.02, sd * 0.36); lug.rotation.set(0, 0, a); lug.rotation.y = sd * 0.5; spin.add(lug); }); }
    const rimM = mk(new THREE.CylinderGeometry(1.45, 1.45, 1.2, 28, 1, true), rim, 'tyre-rim'); rimM.rotation.x = Math.PI / 2; rimM.material.side = THREE.DoubleSide; spin.add(rimM);
    const disc = mk(new THREE.CylinderGeometry(1.4, 1.4, 0.12, 28), rim, 'tyre-disc'); disc.rotation.x = Math.PI / 2; spin.add(disc);
    const hb = mk(new THREE.CylinderGeometry(0.45, 0.45, 0.5, 14), hub, 'tyre-hub'); hb.rotation.x = Math.PI / 2; spin.add(hb);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, b = mk(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 6), hub, 'tyre-bolt'); b.rotation.x = Math.PI / 2; b.position.set(Math.cos(a) * 0.85, Math.sin(a) * 0.85, 0.12); spin.add(b); }
    anim.push(t => { spin.rotation.z = -t * 0.35; });
    const cradle = mk(new THREE.BoxGeometry(5.2, 0.5, 2.2), std('#4a4640'), 'tyre-cradle'); cradle.position.set(v.x, v.y + 0.2, v.z); cradle.rotation.y = yaw; scene.add(cradle);
    const sv = at(4, 15, -6); [0, 1, 2].forEach(k => { const t2 = mk(new THREE.TorusGeometry(1.25, 0.5, 10, 28), rub, 'tyre-stack'); t2.rotation.x = Math.PI / 2; t2.rotation.z = k * 0.5; t2.position.set(sv.x, sv.y + 0.5 + k * 0.98, sv.z); t2.castShadow = !lp; scene.add(t2); });
    solids.push({ x: v.x, z: v.z, r: 3.4 }, { x: sv.x, z: sv.z, r: 2 }); clearZones.push({ x: v.x, z: v.z, r: 14 }, { x: sv.x, z: sv.z, r: 5 }); }
  await __y(); worldType(['Handed over,', 'never down.'], sZ(4) + 17);
  await __y(); const faceRoad = v => Math.atan2(roadX(v.z) - v.x, 0);
  await __y(); const glassM = () => std('#dff1fb', { transparent: true, opacity: 0.28, roughness: 0.08, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide, flatShading: false });
  // 1 · Liquid I.V.: a giant glass of water with a stick pack tipping powder in, bubbles rising
  await __y(); { const v = at(1, -11), g = new THREE.Group(); g.name = 'liv-glass'; g.position.copy(v); g.rotation.y = faceRoad(v); scene.add(g);
    const glass = mk(new THREE.CylinderGeometry(1.7, 1.5, 4.2, 32, 1, true), glassM(), 'liv-glass-wall'); glass.position.y = 2.1; g.add(glass);
    const base = mk(new THREE.CylinderGeometry(1.5, 1.5, 0.18, 32), glassM(), 'liv-glass-base'); base.position.y = 0.09; g.add(base);
    const water = mk(new THREE.CylinderGeometry(1.6, 1.46, 3.3, 32), std('#3aa7e0', { transparent: true, opacity: 0.55, roughness: 0.15, flatShading: false }), 'liv-water'); water.position.y = 1.8; g.add(water);
    const packW = std('#f7f4ee', { roughness: 0.5 }), packB = std('#1f5fd1', { roughness: 0.45 }), packY = std('#ffcf3a', { roughness: 0.45 });
    const makePack = () => { const p = new THREE.Group(); const b = mk(new THREE.BoxGeometry(0.95, 2.7, 0.14), packW, 'liv-pack'); p.add(b); const band = mk(new THREE.BoxGeometry(0.97, 0.9, 0.16), packB, 'liv-pack-band'); band.position.y = 0.2; p.add(band); const tip = mk(new THREE.BoxGeometry(0.97, 0.22, 0.16), packY, 'liv-pack-tip'); tip.position.y = -1.24; p.add(tip); p.traverse(o => { if (o.isMesh) o.castShadow = !lp; }); return p; };
    const pack = makePack(); pack.position.set(0.55, 6.3, 0); pack.rotation.z = Math.PI * 0.86; g.add(pack);
    const dust = [], DN = lp ? 6 : 12, dM = new THREE.MeshBasicMaterial({ color: '#fff2c4' });
    for (let k = 0; k < DN; k++) { const d = mk(new THREE.IcosahedronGeometry(0.06, 0), dM, 'liv-powder'); g.add(d); dust.push(d); }
    const bubbles = [], BN = lp ? 8 : 18, bM = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.7, roughness: 0.1 });
    for (let k = 0; k < BN; k++) { const b = mk(new THREE.IcosahedronGeometry(0.07 + h2(k, 31) * 0.1, 1), bM, 'liv-bubble'); g.add(b); bubbles.push({ b, a: h2(k, 7) * 6.28, r: 0.2 + h2(k, 13) * 1.1, sp: 0.18 + h2(k, 17) * 0.25, ph: h2(k, 23) }); }
    anim.push(t => { pack.rotation.z = Math.PI * 0.86 + Math.sin(t * 0.9) * 0.08; pack.position.y = 6.3 + Math.sin(t * 0.7) * 0.12;
      dust.forEach((d, k) => { const u = (t * 0.7 + k / DN) % 1; d.position.set(0.25 + Math.sin(k * 3.1) * 0.08, 5.1 - u * 1.7, Math.cos(k * 2.3) * 0.08); });
      bubbles.forEach(o => { const u = (t * o.sp + o.ph) % 1; o.b.position.set(Math.cos(o.a + t * 0.4) * o.r, 0.3 + u * 3.1, Math.sin(o.a + t * 0.4) * o.r); o.b.scale.setScalar(0.6 + u * 0.6); }); });
    [0, 1, 2].forEach(k => { const sp = makePack(); sp.rotation.x = -Math.PI / 2; sp.rotation.z = k * 0.35 - 0.3; sp.position.set(2.9, 0.1 + k * 0.16, 1.2 - k * 0.3); g.add(sp); });
    const wg = glowSprite('#7fd0ff', 5, 0.35); wg.position.set(v.x, v.y + 2, v.z); scene.add(wg); glows.push({ s: wg, base: 0.12, n: 0.45 });
    solids.push({ x: v.x, z: v.z, r: 2.2 }); clearZones.push({ x: v.x, z: v.z, r: 9 }); }
  // 2 · Talenti: a giant clear gelato jar, three layers, the lid spinning above it
  await __y(); { const v = at(2, -11), g = new THREE.Group(); g.name = 'talenti-jar'; g.position.copy(v); g.rotation.y = faceRoad(v); scene.add(g);
    const jar = mk(new THREE.CylinderGeometry(1.8, 1.8, 3.8, 32, 1, true), glassM(), 'jar-wall'); jar.position.y = 1.9; g.add(jar);
    const layers = ['#6b4330', '#e38fa8', '#f3e2bf'];
    layers.forEach((c, k) => { const l = mk(new THREE.CylinderGeometry(1.7, 1.7, 1.05, 32), std(c, { roughness: 0.75, flatShading: false }), 'jar-gelato'); l.position.y = 0.55 + k * 1.05; g.add(l); });
    const top = mk(new THREE.SphereGeometry(1.7, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), std('#f3e2bf', { roughness: 0.8 }), 'jar-scoop'); top.scale.y = 0.35; top.position.y = 3.2; g.add(top);
    [0, 1, 2].forEach(k => { const s = mk(new THREE.TorusGeometry(0.55 - k * 0.14, 0.12, 6, 18), std(k % 2 ? '#e38fa8' : '#6b4330', { roughness: 0.7 }), 'jar-swirl'); s.rotation.x = Math.PI / 2; s.position.y = 3.62 + k * 0.1; g.add(s); });
    const spoon = new THREE.Group(); spoon.position.set(0.7, 3.6, 0.2); g.add(spoon);
    const sh = mk(new THREE.BoxGeometry(0.16, 2.4, 0.06), std('#d8d4cc', { roughness: 0.3, metalness: 0.6 }), 'jar-spoon'); sh.position.y = 1; spoon.add(sh);
    const lid = new THREE.Group(); g.add(lid);
    const lb = mk(new THREE.CylinderGeometry(1.9, 1.9, 0.5, 32), std('#1d1c22', { roughness: 0.4 }), 'jar-lid'); lb.castShadow = !lp; lid.add(lb);
    const lt = mk(new THREE.CylinderGeometry(1.2, 1.2, 0.06, 32), std('#d9b25e', { roughness: 0.35, metalness: 0.4 }), 'jar-lid-label'); lt.position.y = 0.28; lid.add(lt);
    for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, r = mk(new THREE.BoxGeometry(0.08, 0.4, 0.08), std('#2a2930'), 'jar-lid-rib'); r.position.set(Math.cos(a) * 1.92, 0, Math.sin(a) * 1.92); lid.add(r); }
    anim.push(t => { lid.position.y = 5.3 + Math.sin(t * 1.1) * 0.25; lid.rotation.y = t * 0.6; lid.rotation.z = Math.sin(t * 0.8) * 0.08; spoon.rotation.z = -0.35 + Math.sin(t * 1.4) * 0.05; });
    [0, 1].forEach(k => { const s = new THREE.Group(); s.position.set(3.2, 0.7 + k * 1.45, -1.1 + k * 0.1); s.rotation.y = k * 0.4; g.add(s);
      const w = mk(new THREE.CylinderGeometry(0.62, 0.62, 1.1, 20), std(layers[k + 1], { roughness: 0.6 }), 'jar-mini'); s.add(w);
      const l = mk(new THREE.CylinderGeometry(0.66, 0.66, 0.24, 20), std('#1d1c22', { roughness: 0.4 }), 'jar-mini-lid'); l.position.y = 0.66; s.add(l); w.castShadow = !lp; });
    solids.push({ x: v.x, z: v.z, r: 2.3 }); clearZones.push({ x: v.x, z: v.z, r: 9 }); }
  // 3 · StoryNest: a giant open storybook on a lectern, a page that keeps turning, sparks drifting up
  await __y(); { const v = at(3, -10), g = new THREE.Group(); g.name = 'storynest-book'; g.position.copy(v); g.rotation.y = faceRoad(v); scene.add(g);
    const plinth = mk(new THREE.BoxGeometry(2.4, 2.2, 1.6), stone, 'book-plinth'); plinth.position.y = 1.1; plinth.castShadow = !lp; g.add(plinth);
    const book = new THREE.Group(); book.position.set(0, 2.55, 0); book.rotation.x = -0.55; g.add(book);
    const cover = std('#8b3a2e', { roughness: 0.7 }), paper = std('#f4ecd8', { roughness: 0.95 });
    [-1, 1].forEach(sd => { const h = new THREE.Group(); h.rotation.y = sd * -0.16; book.add(h);
      const c = mk(new THREE.BoxGeometry(2.5, 3.3, 0.12), cover, 'book-cover'); c.position.set(sd * 1.25, 0, 0); c.castShadow = !lp; h.add(c);
      const p = mk(new THREE.BoxGeometry(2.35, 3.1, 0.34), paper, 'book-pages'); p.position.set(sd * 1.2, 0, 0.23); h.add(p);
      for (let k = 0; k < 6; k++) { const ln = mk(new THREE.BoxGeometry(1.5 - (k % 3) * 0.25, 0.07, 0.01), std('#8c8070'), 'book-line'); ln.position.set(sd * 1.2, 1 - k * 0.38, 0.41); h.add(ln); } });
    const pivot = new THREE.Group(); pivot.position.z = 0.42; book.add(pivot);
    const leaf = mk(new THREE.BoxGeometry(2.3, 3.05, 0.02), std('#fbf5e6', { roughness: 0.95, side: THREE.DoubleSide }), 'book-leaf'); leaf.position.x = 1.15; pivot.add(leaf);
    const sparks = [], SN = lp ? 4 : 8;
    for (let k = 0; k < SN; k++) { const s = glowSprite('#ffd98a', 0.9, 0.9); scene.add(s); sparks.push({ s, a: h2(k, 41) * 6.28, ph: h2(k, 43) }); }
    const bp = new THREE.Vector3();
    anim.push(t => { const u = (t * 0.22) % 1; pivot.rotation.y = -sstep(0.15, 0.6, u) * Math.PI; pivot.rotation.z = Math.sin(sstep(0.15, 0.6, u) * Math.PI) * 0.06;
      book.getWorldPosition(bp); sparks.forEach(o => { const w = (t * 0.18 + o.ph) % 1; o.s.position.set(bp.x + Math.cos(o.a + t * 0.5) * (0.6 + w * 1.4), bp.y + 0.6 + w * 5, bp.z + Math.sin(o.a + t * 0.5) * (0.6 + w * 1.4)); o.s.scale.setScalar(0.05 + Math.sin(w * Math.PI) * 0.9); }); });
    solids.push({ x: v.x, z: v.z, r: 1.8 }); clearZones.push({ x: v.x, z: v.z, r: 8 }); }
  // Wind farm on the ridge — variety for the long highway stretch
  await __y(); { const tw = std('#eceae4', { roughness: 0.6 }), rotors = [];
    for (let k = 0; k < 7; k++) { const z = lerp(sZ(3) - 40, sZ(5) + 50, k / 6), sd = 1, x = roadX(z) + sd * (48 + (k % 3) * 22 + h2(k, 3) * 14), y = H(x, z);
      if (Math.abs(x - LAKE.x) < LAKE.r + 10 && Math.abs(z - LAKE.z) < LAKE.r + 10) continue;
      const hgt = 20 + h2(k, 5) * 6; const tower = mk(new THREE.CylinderGeometry(0.35, 0.7, hgt, 10), tw, 'turbine-tower'); tower.position.set(x, y + hgt / 2, z); tower.castShadow = !lp; scene.add(tower);
      const head = new THREE.Group(); head.name = 'turbine-head'; head.position.set(x, y + hgt, z); head.rotation.y = Math.atan2(roadX(z) - x, 0) * 0.4 - Math.PI / 2; scene.add(head);
      const nac = mk(new THREE.BoxGeometry(0.9, 0.8, 2.2), tw, 'turbine-nacelle'); nac.position.z = -0.3; head.add(nac);
      const rot = new THREE.Group(); rot.position.set(0, 0, 0.95); head.add(rot); rot.add(mk(new THREE.SphereGeometry(0.4, 10, 8), tw, 'turbine-hub'));
      for (let b = 0; b < 3; b++) { const bl = mk(new THREE.BoxGeometry(0.42, 9, 0.12), tw, 'turbine-blade'); bl.geometry.translate(0, 4.6, 0); bl.rotation.z = b * Math.PI * 2 / 3; rot.add(bl); }
      rotors.push({ rot, sp: 0.5 + h2(k, 9) * 0.35, ph: k }); solids.push({ x, z, r: 1.2 }); clearZones.push({ x, z, r: 6 }); }
    anim.push(t => rotors.forEach(r => { r.rot.rotation.z = t * r.sp + r.ph; })); }
  // 5 · four standing stones
  await __y(); [1.6, 2.3, 3.0, 3.8].forEach((h, k) => { const v = at(5, 7.5, 6 - k * 4); const s = mk(new THREE.BoxGeometry(0.9, h, 0.6, 1, 2, 1), stone, 'menhir'); s.position.set(v.x, v.y + h / 2 - 0.1, v.z); s.rotation.set(0, k * 0.4, (h2(k, 1) - 0.5) * 0.12); s.castShadow = !lp; scene.add(s); solids.push({ x: v.x, z: v.z, r: 0.6 });
    { const rg = glowSprite('#7ff3e1', 1.5, 0); rg.position.set(v.x - Math.sign(v.x - roadX(v.z)) * 0.5, v.y + h * 0.62, v.z); rg.visible = false; scene.add(rg); progFx.push(tt => { const on = sstep(5 / NSTOP - 0.016 + k * 0.003, 5 / NSTOP - 0.006 + k * 0.0015, tt); rg.material.opacity = on * 0.8; rg.visible = on > 0.01; }); }
  });
  await __y(); clearZones.push({ ...at(5, 8), r: 14 });
  // 4 · the fork: the highway carries on straight, the trail turns off
  await __y(); { const z0 = sZ(5) + 26, { f, r } = frame(z0), x0 = roadX(z0), pos = [], idx = [], cols = [], A = new THREE.Color('#34313a'), cc = new THREE.Color(); let n = 0;
    for (let s2 = 0; s2 <= 300; s2 += 4) { const cx = x0 + f.x * s2, cz = z0 + f.z * s2, lift = s2 < 30 ? 0.03 : 0.22;
      for (let k = -1; k <= 1; k += 2) { const x = cx + r.x * 3.4 * k, z = cz + r.z * 3.4 * k; pos.push(x, Math.max(H(x, z), s2 < 30 ? roadY(z0) : -1e9) + lift, z); cc.copy(A).multiplyScalar(0.9 + h2(n, k + 3) * 0.2); cols.push(cc.r, cc.g, cc.b); }
      if (n) idx.push(2 * n - 2, 2 * n - 1, 2 * n, 2 * n - 1, 2 * n + 1, 2 * n); clearZones.push({ x: cx, z: cz, r: 6.5 }); n++; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.setIndex(idx); g.computeVertexNormals();
    const hw = mk(g, std('#ffffff', { vertexColors: true, side: THREE.DoubleSide }), 'highway-continues'); hw.receiveShadow = !lp; scene.add(hw);
    const sx = x0 + f.x * 14 + r.x * 5.2, sz = z0 + f.z * 14 + r.z * 5.2, sy = H(sx, sz);
    const po = mk(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 5), darkWood, 'fork-sign-post'); po.position.set(sx, sy + 1.2, sz); scene.add(po);
    const bd = mk(new THREE.BoxGeometry(1.5, 0.4, 0.06), std('#2f6b4a'), 'fork-sign'); bd.position.set(sx, sy + 2.2, sz); bd.rotation.y = Math.atan2(-f.x, -f.z) + Math.PI / 2; scene.add(bd); }
  // 6 · workshop shed, blinking homelab rack, RC car
  await __y(); { const v = at(7, 11); const shed = new THREE.Group(); shed.name = 'workshop'; shed.position.copy(v); shed.rotation.y = Math.atan2(-(roadX(v.z) - v.x), 0) * 0.4; solids.push({ x: v.x, z: v.z, r: 2 });
    const body = mk(new THREE.BoxGeometry(3.2, 2.4, 2.6), wood, 'shed'); body.position.y = 1.2; body.castShadow = !lp; shed.add(body);
    const roof = mk(new THREE.CylinderGeometry(1.9, 1.9, 3.6, 3), std('#8a3b2e'), 'roof'); roof.rotation.z = Math.PI / 2; roof.rotation.x = Math.PI / 2; roof.scale.set(1, 1, 0.55); roof.position.y = 2.9; shed.add(roof);
    const door = mk(new THREE.PlaneGeometry(0.9, 1.6), warmBasic, 'door-light'); door.position.set(side[7] * -1.61, 0.85, 0); door.rotation.y = -side[7] * Math.PI / 2; shed.add(door);
    const rack = mk(new THREE.BoxGeometry(0.6, 1.2, 0.6), std('#26262c'), 'rack'); rack.position.set(side[7] * -1.9, 0.6, 1.7); shed.add(rack);
    const leds = []; for (let k = 0; k < 6; k++) { const l = mk(new THREE.BoxGeometry(0.06, 0.04, 0.02), new THREE.MeshBasicMaterial({ color: k % 3 ? '#6dff9a' : '#ff5a4d' }), 'led'); l.position.set(side[7] * -1.9 + (k % 2) * 0.14 - 0.07, 0.3 + Math.floor(k / 2) * 0.3, 2.01); shed.add(l); leds.push(l); }
    anim.push(t => leds.forEach((l, k) => { l.visible = Math.sin(t * (3 + k) + k * 2) > -0.3; }));
    const car = new THREE.Group(); car.name = 'rc-car'; const cb = mk(new THREE.BoxGeometry(0.34, 0.12, 0.2), std('#2f7de1'), 'rc-body'); cb.position.y = 0.12; car.add(cb);
    [[-0.11, -0.1], [0.11, -0.1], [-0.11, 0.1], [0.11, 0.1]].forEach(([a, b]) => { const w = mk(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8), std('#111'), 'rc-wheel'); w.rotation.x = Math.PI / 2; w.position.set(a, 0.06, b); car.add(w); });
    shed.add(car); anim.push(t => { const a = t * 1.1; car.position.set(side[7] * -3.6 + Math.cos(a) * 1.6, 0, Math.sin(a) * 1.6); car.rotation.y = -a; });
    scene.add(shed); clearZones.push({ x: v.x, z: v.z, r: 8 }); }
  // 7 · vantage ledge
  await __y(); { const v = new THREE.Vector3(LAKE.x - LAKE.r * 0.78, 0, LAKE.z + 6); v.y = H(v.x, v.z); const l = mk(new THREE.DodecahedronGeometry(2.2, 0), stone, 'vantage-rock'); l.scale.set(1.3, 0.5, 1); l.position.set(v.x, v.y + 0.3, v.z); scene.add(l); solids.push({ x: v.x, z: v.z, r: 1.6 }); }
  // 8 · campfire
  await __y(); const fireLight = new THREE.PointLight('#ff8a3d', 0, 40, 1.4); await __y(); const flames = [];
  await __y(); { const f = new THREE.Group(); f.name = 'campfire'; f.position.set(FIRE.x, H(FIRE.x, FIRE.z), FIRE.z);
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; const s = mk(new THREE.DodecahedronGeometry(0.26, 1), stone, 'fire-stone'); s.position.set(Math.cos(a) * 0.95, 0.12, Math.sin(a) * 0.95); f.add(s); }
    for (let k = 0; k < 3; k++) { const lg = mk(new THREE.CylinderGeometry(0.09, 0.1, 1.3, 6), darkWood, 'fire-log'); lg.rotation.set(Math.PI / 2 - 0.35, k * 2.1, 0); lg.position.y = 0.25; f.add(lg); }
    ['#ff6a1f', '#ffa640', '#ffe28a'].forEach((c, k) => { const fl = mk(new THREE.ConeGeometry(0.42 - k * 0.1, 1.3 - k * 0.25, 5), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }), 'flame'); fl.position.y = 0.7 - k * 0.05; f.add(fl); flames.push(fl); });
    const g = glowSprite('#ff8a3d', 7, 0.9); g.position.y = 0.9; f.add(g); glows.push({ s: g, base: 0.6, n: 1 });
    fireLight.position.y = 1.4; f.add(fireLight);
    const bench = mk(new THREE.CylinderGeometry(0.24, 0.26, 2.6, 7), wood, 'log-bench'); bench.rotation.z = Math.PI / 2; bench.rotation.y = 0.3; bench.position.set(-0.4, 0.25, 2.8); f.add(bench);
    const tent = mk(new THREE.ConeGeometry(1.9, 2.3, 4), std('#c9a36a'), 'tent'); tent.position.set(4, 1.15, -2.5); tent.rotation.y = 0.5; tent.castShadow = !lp; f.add(tent);
    scene.add(f); }
  await __y(); const embers = (() => { const n = 60, g = new THREE.BufferGeometry(), a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = FIRE.x; a[i * 3 + 1] = -99; a[i * 3 + 2] = FIRE.z; } g.setAttribute('position', new THREE.BufferAttribute(a, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffb35a', size: 0.14, map: GT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); pts.name = 'embers'; pts.frustumCulled = false; scene.add(pts); return { g, a, n, life: new Float32Array(n).map(() => Math.random() * 3) }; })();
  // Desert/canyon pocket — scenery only, off the free-ride area
  await __y(); { const sandC = new THREE.Color('#e8c07d'), duneRock = std('#b3703f'), capRock = std('#e8c07d', { roughness: 0.85 });
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.4, rr = DESERT.r * 0.35 + rnd() * DESERT.r * 0.4, x = DESERT.x + Math.cos(a) * rr, z = DESERT.z + Math.sin(a) * rr, y = H(x, z);
      const h = 9 + rnd() * 15, rad = 4.5 + rnd() * 4; const mesa = mk(new THREE.CylinderGeometry(rad * 0.68, rad, h, 8), duneRock, 'mesa'); mesa.position.set(x, y + h / 2, z); mesa.rotation.y = rnd() * 6; mesa.castShadow = !lp; scene.add(mesa); solids.push({ x, z, r: rad * 0.7 });
      const cap = mk(new THREE.CylinderGeometry(rad * 0.7, rad * 0.7, 0.7, 8), capRock, 'mesa-cap'); cap.position.set(x, y + h + 0.35, z); scene.add(cap); }
    for (let k = 0; k < 10; k++) { const a = rnd() * Math.PI * 2, rr = rnd() * DESERT.r * 0.9, x = DESERT.x + Math.cos(a) * rr, z = DESERT.z + Math.sin(a) * rr, y = H(x, z), s = 0.6 + rnd() * 1.4;
      const b = mk(new THREE.DodecahedronGeometry(s, 0), duneRock, 'desert-boulder'); b.scale.y = 0.6; b.position.set(x, y + s * 0.25, z); b.rotation.set(rnd(), rnd() * 6, rnd()); b.castShadow = !lp; scene.add(b); solids.push({ x, z, r: s * 0.85 }); }
    clearZones.push({ x: DESERT.x, z: DESERT.z, r: DESERT.r * 0.32 }); }
  // Terminal ridge decoration — break up the world-edge wall past the campfire
  await __y(); { for (let k = 0; k < 26; k++) { const z = ZEND - 40 - rnd() * 70, x = FIRE.x + (rnd() - 0.5) * 120, y = H(x, z), s = 1.2 + rnd() * 3.2;
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
  await __y(); carveTrail(zW(0.22), -1, 62, (x, z) => { const y = H(x, z); const v = mk(new THREE.DodecahedronGeometry(2.4, 0), stone, 'trail-vantage'); v.scale.set(1.3, 0.5, 1); v.position.set(x, y + 0.3, z); v.castShadow = !lp; scene.add(v); solids.push({ x, z, r: 1.6 }); clearZones.push({ x, z, r: 6 }); });
  await __y(); carveTrail(zW(0.56), -1, 70, (x, z) => { for (let k = 0; k < 5; k++) { const a = k * 1.4, rx = x + Math.cos(a) * 2.4, rz = z + Math.sin(a) * 2.4, y = H(rx, rz); const blk = mk(new THREE.BoxGeometry(1.1 + rnd(), 0.8 + rnd() * 0.6, 1.1 + rnd()), stone, 'ruin-block'); blk.position.set(rx, y + 0.4, rz); blk.rotation.set(rnd() * 0.4, rnd() * 6, rnd() * 0.4 - 0.2); blk.castShadow = !lp; scene.add(blk); solids.push({ x: rx, z: rz, r: 1 }); } clearZones.push({ x, z, r: 7 }); });
  await __y(); carveTrail(zW(0.42), 1, 150, null);

  // signposts
  await __y(); for (let i = 1; i < NSTOP; i++) { const v = at(i, -4.8 * (side[i] || 1), 3); const po = mk(new THREE.CylinderGeometry(0.06, 0.06, 1.7, 5), darkWood, 'sign-post'); po.position.set(v.x, v.y + 0.85, v.z); scene.add(po); const bd = mk(new THREE.BoxGeometry(0.9, 0.34, 0.05), wood, 'sign'); bd.position.set(v.x, v.y + 1.6, v.z); bd.rotation.y = 0.2; scene.add(bd); }

  // keep camera sightlines clear at every stop
  await __y(); for (let i = 1; i <= NSTOP; i++) { const z = sZ(i), { f, r } = frame(z), cc = [0, 0.6, 0.6, 0.6, 0.6, 0.55, 0.6, 0.6, 1.25, 0.35][i], sd = side[i] || 1;
    const a = cc * (i === 8 ? 1 : -sd), D = 6.8 + (i === 8 ? 1.4 : i === 9 ? 0.4 : 0) * 1.5;
    const cx = roadX(z) - f.x * Math.cos(a) * D - r.x * Math.sin(a) * D, cz = z - f.z * Math.cos(a) * D - r.z * Math.sin(a) * D;
    clearZones.push({ x: cx, z: cz, r: 13 }, { x: (cx + roadX(z)) / 2, z: (cz + z) / 2, r: 9 }); }
  // Notes (clickable wisps)
  await __y(); const notes = (opts.notes || []).map((n, i) => { const sp0 = n.region && SECRET_POS[n.region]; const z = sp0 ? sp0.z : zW(n.t), x = sp0 ? sp0.x : roadX(z) + n.side * 7; const y = sp0 && sp0.y != null ? sp0.y : H(x, z);
    const rock = mk(new THREE.DodecahedronGeometry(0.9, 0), stone, 'note-rock'); rock.scale.set(1, 0.7, 1.1); rock.position.set(x, y + 0.3, z); scene.add(rock);
    const w = mk(new THREE.OctahedronGeometry(0.22, 0), new THREE.MeshBasicMaterial({ color: '#8ff7ff', fog: false }), 'wisp'); w.position.set(x, y + 1.9, z); scene.add(w);
    const g = glowSprite('#6ff0ff', 2.2); g.position.copy(w.position); scene.add(g); glows.push({ s: g, base: 0.7, n: 1 });
    const hit = mk(new THREE.SphereGeometry(1.5, 8, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), 'note-hit'); hit.position.set(x, y + 1.5, z); hit.userData.note = i; scene.add(hit);
    clearZones.push({ x, z, r: 3 });
    const txt = (opts.notes[i].text || '').split(' '), lines = []; let cur = ''; txt.forEach(wd => { if ((cur + ' ' + wd).trim().length > 26) { lines.push(cur.trim()); cur = wd; } else cur += ' ' + wd; }); if (cur.trim()) lines.push(cur.trim());
    const c = document.createElement('canvas'); c.width = 768; c.height = 96 + lines.length * 84; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const draw = () => { const g2 = c.getContext('2d'); g2.clearRect(0, 0, c.width, c.height); g2.fillStyle = 'rgba(111,240,255,.9)'; g2.font = '500 30px "JetBrains Mono", monospace'; g2.fillText(n.region ? 'SECRET ' + String(n.sn || 1).padStart(2, '0') : 'FIELD NOTE ' + String(i + 1).padStart(2, '0'), 8, 40); g2.fillStyle = '#f6ecda'; g2.font = 'italic 500 66px "Cormorant Garamond", Georgia, serif'; lines.forEach((l, k) => g2.fillText(l, 8, 118 + k * 84)); tex.needsUpdate = true; };
    draw(); typeQ.push(draw);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, fog: false })); sp.name = 'field-note'; const sw = 4.2; sp.scale.set(sw, sw * c.height / c.width, 1); sp.center.set(0, 0); sp.position.set(x + n.side * 0.6, y + 2.3, z); scene.add(sp);
    return { w, g, hit, y: y + 1.9, i, hov: 0, sp, rev: 0 }; });

  await __y(); const deferred = []; await __y(); let deferBusy = false;
  // Trees
  await __y(); const windDirA = 0.6, wdx = Math.sin(windDirA), wdz = Math.cos(windDirA);
  await __y(); const windTimeU = { value: 0 }, windAmtU = { value: 0 }, gustPosU = { value: -1e5 }, gustAmtU = { value: 0 }, bikePU = { value: new THREE.Vector3(0, -999, 0) };
  function windify(mat, amp, part = 0) { mat.customProgramCacheKey = () => 'wind|' + amp + '|' + part;
    mat.onBeforeCompile = shader => { shader.uniforms.uTime = windTimeU; shader.uniforms.uWind = windAmtU; shader.uniforms.uGustPos = gustPosU; shader.uniforms.uGustAmt = gustAmtU; shader.uniforms.uBikeP = bikePU;
      shader.vertexShader = 'uniform float uTime;\nuniform float uWind;\nuniform float uGustPos;\nuniform float uGustAmt;\nuniform vec3 uBikeP;\n' + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
  vec3 iwp = (instanceMatrix * vec4(0.0,0.0,0.0,1.0)).xyz;
#else
  vec3 iwp = vec3(0.0);
#endif
float along = iwp.x*${wdx.toFixed(3)} + iwp.z*${wdz.toFixed(3)};
float rn1 = fract(sin(dot(iwp.xz, vec2(12.9898, 78.233))) * 43758.5453);
float frq = 0.65 + rn1 * 0.75;
float gustW = smoothstep(0.4, 1.0, sin(along * 0.02 - uTime * 0.6) * 0.5 + 0.5) * (0.6 + 0.4 * sin(uTime * 0.13 + along * 0.004));
float wave = sin(uTime * frq + rn1 * 6.283) * 0.5 + sin(uTime * frq * 2.3 + rn1 * 11.0) * 0.18 + gustW * 0.95;
float gFront = exp(-pow((along - uGustPos) / 11.0, 2.0)) * uGustAmt;
wave += gFront * 1.4;
float hY = max(position.y, 0.0);
float sway = hY * (uWind + gFront * 0.9) * ${amp.toFixed(3)} * wave;
float crs = hY * uWind * ${amp.toFixed(3)} * 0.22 * sin(uTime * frq * 1.4 + rn1 * 3.0);
transformed.x += sway * ${wdx.toFixed(3)} - crs * ${wdz.toFixed(3)};
transformed.z += sway * ${wdz.toFixed(3)} + crs * ${wdx.toFixed(3)};
{ vec2 dB = iwp.xz - uBikeP.xz; float dBL = length(dB); float pt = ${part.toFixed(2)} * (1.0 - smoothstep(0.3, 2.4, dBL)) * hY; transformed.xz += (dB / max(dBL, 0.001)) * pt * 0.85; transformed.y -= pt * 0.3; }
`); }; }
  await __y(); const dummy = new THREE.Object3D();
  await __y(); const NP = lp ? 1100 : 2600, NR = lp ? 350 : 900;
  await __y(); const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.14, 0.24, 1, 5).translate(0, 0.5, 0), std('#5a3f2c'), NP + NR); await __y(); trunks.name = 'tree-trunks';
  await __y(); const pines = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 8).translate(0, 0.5, 0), std('#ffffff'), NP * 2); await __y(); pines.name = 'pine-crowns'; await __y(); windify(pines.material, 0.4);
  await __y(); const rounds = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), std('#ffffff'), NR); await __y(); rounds.name = 'round-crowns'; await __y(); windify(rounds.material, 0.34);
  await __y(); const PC = ['#2f5a3a', '#3a6b3f', '#27493a', '#446f3a', '#2c5236'].map(c => new THREE.Color(c)), RC = ['#5b7f35', '#6d8c3a', '#4d7536', '#7d8f3a'].map(c => new THREE.Color(c));
  await __y(); const BIO = ['#39f3e0', '#6ff0ff', '#9dffc4', '#c8ff7a'].map(c => new THREE.Color(c)); await __y(); const tbPos = [], tbCol = [];
  await __y(); let ti = 0, pi = 0, ri = 0;
  await __y(); const place = (isPine) => { for (let tries = 0; tries < 30; tries++) { const z = lerp(TZ0 - 20, TZ1 + 20, rnd()); const prog = fO(z); if (rnd() > 0.4 + 0.6 * prog + 0.2) continue;
      const s = rnd() < 0.5 ? -1 : 1; const x = z < ZEND - 20 ? lerp(TX0 + 10, TX1 - 10, rnd()) : roadX(z) + s * (8.5 + Math.pow(rnd(), 1.5) * 230); if (x < TX0 + 5 || x > TX1 - 5 || !okSpot(x, z, 8)) continue;
      const y = H(x, z); if (y - roadY(clamp(z, ZEND, Z0)) > 70) continue; return [x, y, z]; } return null; };
  await __y(); for (let k = 0; k < NP; k++) { const q = place(true); if (!q) continue; const [x, y, z] = q; const h = 6 + Math.pow(rnd(), 1.6) * 13, r = 1.4 + rnd() * 1.9, th = h * 0.28;
    solids.push({ x, z, r: 0.4 });
    dummy.position.set(x, y - 0.2, z); dummy.rotation.set(0, rnd() * 6, 0); dummy.scale.set(1, th + 0.2, 1); dummy.updateMatrix(); trunks.setMatrixAt(ti++, dummy.matrix);
    const c = PC[Math.floor(rnd() * PC.length)];
    dummy.position.set(x, y + th, z); dummy.scale.set(r, h * 0.62, r); dummy.updateMatrix(); pines.setMatrixAt(pi, dummy.matrix); pines.setColorAt(pi++, c);
    dummy.position.set(x, y + th + h * 0.38, z); dummy.scale.set(r * 0.68, h * 0.5, r * 0.68); dummy.rotation.y += 0.5; dummy.updateMatrix(); pines.setMatrixAt(pi, dummy.matrix); pines.setColorAt(pi++, c);
    if (rnd() < 0.08) { const bc = BIO[Math.floor(rnd() * BIO.length)], inten = 0.35 + rnd() * 1.2; tbPos.push(x, y + th + h * 0.3, z); tbCol.push(bc.r * inten, bc.g * inten, bc.b * inten); } }
  await __y(); for (let k = 0; k < NR; k++) { const q = place(false); if (!q) continue; const [x, y, z] = q; const r = 1.6 + rnd() * 2.2, th = 1.6 + rnd() * 2.4;
    solids.push({ x, z, r: 0.45 });
    dummy.position.set(x, y - 0.2, z); dummy.rotation.set(0, rnd() * 6, 0); dummy.scale.set(1.2, th + r * 0.5, 1.2); dummy.updateMatrix(); trunks.setMatrixAt(ti++, dummy.matrix);
    dummy.position.set(x, y + th + r * 0.7, z); dummy.scale.set(r, r * (0.8 + rnd() * 0.4), r); dummy.rotation.set(rnd(), rnd() * 6, 0); dummy.updateMatrix(); rounds.setMatrixAt(ri, dummy.matrix); rounds.setColorAt(ri++, RC[Math.floor(rnd() * RC.length)]);
    if (rnd() < 0.08) { const bc = BIO[Math.floor(rnd() * BIO.length)], inten = 0.35 + rnd() * 1.2; tbPos.push(x, y + th + r * 0.7, z); tbCol.push(bc.r * inten, bc.g * inten, bc.b * inten); } }
  await __y(); trunks.count = ti; await __y(); pines.count = pi; await __y(); rounds.count = ri;
  await __y(); [trunks, pines, rounds].forEach(m => { m.castShadow = false; scene.add(m); });
  await __y(); const treeGlowMat = new THREE.PointsMaterial({ size: 0.55, vertexColors: true, map: GT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
  await __y(); const treeGlowGeo = new THREE.BufferGeometry(); await __y(); treeGlowGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(tbPos), 3)); await __y(); treeGlowGeo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(tbCol), 3));
  await __y(); const treeGlow = new THREE.Points(treeGlowGeo, treeGlowMat); await __y(); treeGlow.name = 'tree-bioluminescence'; await __y(); treeGlow.frustumCulled = false; await __y(); scene.add(treeGlow);

  // Rocks
  await __y(); { const g = new THREE.IcosahedronGeometry(1, 0); const pp = g.attributes.position; for (let i = 0; i < pp.count; i++) { const k = Math.round(pp.getX(i) * 100) * 7 + Math.round(pp.getY(i) * 100) * 13 + Math.round(pp.getZ(i) * 100); const s = 0.75 + h2(k, 2) * 0.5; pp.setXYZ(i, pp.getX(i) * s, pp.getY(i) * s * 0.7, pp.getZ(i) * s); } g.computeVertexNormals();
    const N = lp ? 250 : 650, rocks = new THREE.InstancedMesh(g, std('#ffffff'), N); rocks.name = 'rocks'; let n = 0;
    for (let k = 0; k < N * 3 && n < N; k++) { const z = lerp(TZ0, ZEND + 10, rnd()), s = 0.3 + Math.pow(rnd(), 3) * 3, x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (4.2 + s * 1.3 + Math.pow(rnd(), 2) * 120); if (!okSpot(x, z, 3.8 + s * 1.3)) continue;
      dummy.position.set(x, H(x, z) + s * 0.1, z); dummy.rotation.set(rnd(), rnd() * 6, rnd()); dummy.scale.set(s, s, s); dummy.updateMatrix(); rocks.setMatrixAt(n, dummy.matrix); rocks.setColorAt(n++, ROCK[Math.floor(rnd() * 3)].clone().multiplyScalar(0.85 + rnd() * 0.3)); if (s > 1.15) solids.push({ x, z, r: s * 0.7 }); }
    rocks.count = n; scene.add(rocks); }

  // Bioluminescent flora
  await __y(); const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  await __y(); windify(glowMat, 0.65);
  await __y(); const GC = ['#39f3e0', '#6ff0ff', '#9dffc4', '#39f3e0', '#c8ff7a'].map(c => new THREE.Color(c));
  await __y(); deferred.push(() => { const NM = lp ? 260 : 700, NC = lp ? 400 : 1100;
    const caps = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2), glowMat, NM); caps.name = 'glow-mushrooms';
    const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.4, 1, 5).translate(0, 0.5, 0), std('#d9d2c2'), NM); stems.name = 'mushroom-stems';
    const crys = new THREE.InstancedMesh(new THREE.ConeGeometry(0.12, 1, 4).translate(0, 0.5, 0), glowMat, NC); crys.name = 'glow-grass';
    let m = 0, c = 0;
    while (m < NM || c < NC) { const z = lerp(zW(0.52), ZEND - 20, Math.pow(rnd(), 0.8)), cxp = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (4 + Math.pow(rnd(), 1.4) * 34), gc = pick(GC); if (!okSpot(cxp, z, 5.5)) { if (rnd() < 0.02) break; continue; }
      const n = 3 + Math.floor(rnd() * 6);
      for (let j = 0; j < n; j++) { const x = cxp + (rnd() - 0.5) * 3, zz = z + (rnd() - 0.5) * 3; if (roadDist(x, zz) < 3.6) continue; const y = H(x, zz);
        if (rnd() < 0.45 && m < NM) { const s = 0.12 + rnd() * 0.3, h = s * (1.5 + rnd() * 2); dummy.position.set(x, y - 0.05, zz); dummy.rotation.set(0, 0, (rnd() - 0.5) * 0.3); dummy.scale.set(s * 0.4, h, s * 0.4); dummy.updateMatrix(); stems.setMatrixAt(m, dummy.matrix);
          dummy.position.set(x, y + h - 0.08, zz); dummy.scale.set(s, s * 0.7, s); dummy.updateMatrix(); caps.setMatrixAt(m, dummy.matrix); caps.setColorAt(m++, gc); }
        else if (c < NC) { dummy.position.set(x, y - 0.05, zz); dummy.rotation.set((rnd() - 0.5) * 0.5, rnd() * 6, (rnd() - 0.5) * 0.5); const s = 0.6 + rnd() * 1.4; dummy.scale.set(s, s * (0.8 + rnd()), s); dummy.updateMatrix(); crys.setMatrixAt(c, dummy.matrix); crys.setColorAt(c++, gc); } } }
    caps.count = stems.count = m; crys.count = c; scene.add(caps, stems, crys); });

  // Fallen logs — forest floor debris
  await __y(); deferred.push(() => { const N = lp ? 70 : 170, logs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.24, 0.32, 1, 6), std('#4a3624', { roughness: 1 }), N); logs.name = 'fallen-logs'; let n = 0;
    for (let k = 0; k < N * 3 && n < N; k++) { const z = lerp(TZ0 - 20, ZEND + 20, rnd()), prog = fO(z); if (rnd() > 0.3 + 0.55 * prog) continue;
      const x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (7 + Math.pow(rnd(), 1.3) * 100); if (!okSpot(x, z, 4.5)) continue;
      const len = 2.2 + rnd() * 4.4, rad = 0.4 + rnd() * 0.5, y = H(x, z), ang = rnd() * 6;
      dummy.position.set(x, y + rad * 0.55, z); dummy.rotation.set(0, ang, Math.PI / 2); dummy.scale.set(rad, len, rad); dummy.updateMatrix();
      logs.setMatrixAt(n, dummy.matrix); logs.setColorAt(n++, new THREE.Color('#4a3624').lerp(new THREE.Color('#5c6b3f'), rnd() * 0.4).multiplyScalar(0.85 + rnd() * 0.3)); }
    logs.count = n; logs.castShadow = !lp; scene.add(logs); });

  // Undergrowth — ferns & bushes for ground-level variety
  await __y(); deferred.push(() => { const NB = lp ? 500 : 1400, bushes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), std('#3d5c2e'), NB); bushes.name = 'bushes'; windify(bushes.material, 0.22);
    const NF = lp ? 400 : 1100, ferns = new THREE.InstancedMesh(new THREE.ConeGeometry(0.5, 1, 5).translate(0, 0.5, 0), std('#4a6b34'), NF); ferns.name = 'ferns'; windify(ferns.material, 0.5);
    const BC = ['#3d5c2e', '#466b34', '#345228', '#4f7038'].map(c => new THREE.Color(c));
    let bi = 0, fi = 0;
    while (bi < NB || fi < NF) { const z = lerp(TZ0 - 20, ZEND + 10, rnd()), prog = fO(z); if (rnd() > 0.4 + 0.5 * prog) { if (rnd() < 0.02) break; continue; }
      const x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (5 + Math.pow(rnd(), 1.4) * 90); if (!okSpot(x, z, 3)) continue; const y = H(x, z);
      if (rnd() < 0.45 && bi < NB) { const s = 0.4 + rnd() * 0.7; dummy.position.set(x, y + s * 0.55, z); dummy.rotation.set(rnd() * 0.2, rnd() * 6, rnd() * 0.2); dummy.scale.set(s, s * 0.75, s); dummy.updateMatrix(); bushes.setMatrixAt(bi, dummy.matrix); bushes.setColorAt(bi++, pick(BC)); }
      else if (fi < NF) { const s = 0.3 + rnd() * 0.5, h = s * (2 + rnd() * 1.5); dummy.position.set(x, y + h * 0.5, z); dummy.rotation.set(0, rnd() * 6, 0); dummy.scale.set(s, h, s); dummy.updateMatrix(); ferns.setMatrixAt(fi, dummy.matrix); ferns.setColorAt(fi++, pick(BC)); } }
    bushes.count = bi; ferns.count = fi; scene.add(bushes, ferns); });

  // Ground grass — dense low tufts across the forest floor
  await __y(); deferred.push(() => { const N = lp ? 1400 : 4200, grass = new THREE.InstancedMesh(new THREE.ConeGeometry(0.14, 1, 3).translate(0, 0.5, 0), std('#4c6b30'), N); grass.name = 'ground-grass'; windify(grass.material, 0.6);
    const GRC = ['#4c6b30', '#557836', '#42602b', '#5f8038'].map(c => new THREE.Color(c));
    let n = 0;
    while (n < N) { const z = lerp(TZ0 - 20, ZEND + 10, rnd()), prog = fO(z); if (rnd() > 0.45 + 0.45 * prog) { if (rnd() < 0.01) break; continue; }
      const cx = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (4.5 + Math.pow(rnd(), 1.4) * 95); if (!okSpot(cx, z, 2.5)) continue;
      const cnt = 3 + Math.floor(rnd() * 5), gc = pick(GRC);
      for (let j = 0; j < cnt && n < N; j++) { const x = cx + (rnd() - 0.5) * 2.4, zz = z + (rnd() - 0.5) * 2.4; if (roadDist(x, zz) < 2.6) continue; const y = H(x, zz), s = 0.5 + rnd() * 0.6, h = s * (1.3 + rnd());
        dummy.position.set(x, y + h * 0.5, zz); dummy.rotation.set(0, rnd() * 6, (rnd() - 0.5) * 0.3); dummy.scale.set(s, h, s); dummy.updateMatrix(); grass.setMatrixAt(n, dummy.matrix); grass.setColorAt(n++, gc); } }
    grass.count = n; scene.add(grass); });

  // Wildflower patches — color accents in clearings
  await __y(); deferred.push(() => { const N = lp ? 500 : 1300, flowers = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), std('#ffffff', { roughness: 0.6 }), N); flowers.name = 'wildflowers';
    const FC = ['#e8556f', '#f0a83c', '#f4e04d', '#c95de0', '#6ec6e8'].map(c => new THREE.Color(c));
    let n = 0;
    while (n < N) { const z = lerp(TZ0 - 10, ZEND + 10, rnd()), prog = fO(z); if (rnd() > 0.35 + 0.45 * prog) { if (rnd() < 0.02) break; continue; }
      const cx = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (5 + Math.pow(rnd(), 1.3) * 60); if (!okSpot(cx, z, 4)) continue;
      const fc = pick(FC), cnt = 4 + Math.floor(rnd() * 7);
      for (let j = 0; j < cnt && n < N; j++) { const x = cx + (rnd() - 0.5) * 4, zz = z + (rnd() - 0.5) * 4; if (roadDist(x, zz) < 3.2) continue; const y = H(x, zz), s = 0.04 + rnd() * 0.05;
        dummy.position.set(x, y + 0.2 + rnd() * 0.2, zz); dummy.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6); dummy.scale.set(s, s, s); dummy.updateMatrix(); flowers.setMatrixAt(n, dummy.matrix); flowers.setColorAt(n++, fc); } }
    flowers.count = n; scene.add(flowers); });

  // Mossy boulder outcrops — larger rock clusters for terrain variety
  await __y(); { const mossRock = std('#6f766a', { roughness: 1 }), mossCap = std('#3f5c34', { roughness: 1 });
    for (let k = 0; k < 14; k++) { const z = lerp(TZ0 - 30, ZEND, rnd()); const x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (10 + rnd() * 70); if (!okSpot(x, z, 9)) continue;
      const n2 = 2 + Math.floor(rnd() * 3);
      for (let j = 0; j < n2; j++) { const ox = (rnd() - 0.5) * 4, oz = (rnd() - 0.5) * 4, s = 1.4 + rnd() * 2.4, yy = H(x + ox, z + oz);
        const b = mk(new THREE.DodecahedronGeometry(s, 0), mossRock, 'moss-boulder'); b.scale.y = 0.72 + rnd() * 0.3; b.position.set(x + ox, yy + s * 0.32, z + oz); b.rotation.set(rnd(), rnd() * 6, rnd()); b.castShadow = !lp; scene.add(b);
        if (rnd() < 0.6) { const cap = mk(new THREE.IcosahedronGeometry(s * 0.55, 0), mossCap, 'moss-cap'); cap.scale.y = 0.4; cap.position.set(x + ox, yy + s * 0.6, z + oz); scene.add(cap); }
        solids.push({ x: x + ox, z: z + oz, r: s * 0.7 }); } } }

  // Birch grove — canopy color variety near a forest clearing
  await __y(); { const birchBark = std('#e8e4d8', { roughness: 0.8 }), birchLeaf = std('#d9c14a', { roughness: 0.9 });
    const gz = zW(0.62), gx = roadX(gz) + 55;
    for (let k = 0; k < 16; k++) { const a = rnd() * Math.PI * 2, r = rnd() * 14, x = gx + Math.cos(a) * r, z = gz + Math.sin(a) * r; if (!okSpot(x, z, 3)) continue; const y = H(x, z), h = 5 + rnd() * 4;
      const trunk = mk(new THREE.CylinderGeometry(0.1, 0.16, h, 6), birchBark, 'birch-trunk'); trunk.position.set(x, y + h / 2, z); trunk.castShadow = !lp; scene.add(trunk);
      const leaf = mk(new THREE.IcosahedronGeometry(1.3 + rnd() * 0.7, 0), birchLeaf, 'birch-leaf'); leaf.position.set(x, y + h + 0.6, z); leaf.castShadow = !lp; scene.add(leaf);
      solids.push({ x, z, r: 0.35 }); }
    clearZones.push({ x: gx, z: gz, r: 4 }); }

  // v7: static objects never move, so stop recomputing their world matrix every frame
  await __y(); const freeze = o => { o.matrixAutoUpdate = false; o.userData.apStatic = true; o.updateMatrix(); o.updateMatrixWorld(true); };

  // v7: merge helpers. mergeKids() folds the plain child meshes of one group into a single mesh (same material). mergeStatic() batches
  // scenery that never moves (each kind is created once, nothing else refers to it) into one mesh per material and map cell.
  await __y(); const bakeMerge = (list, name) => {
    const g0 = list[0].geometry, names = Object.keys(g0.attributes);
    if (list.some(o => { const a = Object.keys(o.geometry.attributes); return a.length !== names.length || a.some(n => !g0.attributes[n] || !(o.geometry.attributes[n].array instanceof Float32Array)); })) return null;
    const geos = list.map(o => { const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); o.updateMatrix(); g.applyMatrix4(o.matrix); return g; });
    let nv = 0; geos.forEach(g => { nv += g.attributes.position.count; });
    const mg = new THREE.BufferGeometry();
    names.forEach(n => { const a0 = geos[0].attributes[n], arr = new Float32Array(nv * a0.itemSize); let off = 0; geos.forEach(g => { arr.set(g.attributes[n].array, off); off += g.attributes[n].array.length; }); mg.setAttribute(n, new THREE.BufferAttribute(arr, a0.itemSize, a0.normalized)); });
    mg.computeBoundingSphere(); geos.forEach(g => g.dispose());
    const m = new THREE.Mesh(mg, list[0].material); m.name = name; m.castShadow = list[0].castShadow; m.receiveShadow = list[0].receiveShadow; return m; };
  await __y(); const mergeKids = (grp, name) => { const kids = grp.children.filter(c => c.isMesh && !c.isInstancedMesh && !Array.isArray(c.material)); if (kids.length < 2 || kids.some(k => k.material !== kids[0].material)) return;
    const m = bakeMerge(kids, name); if (!m) return; kids.forEach(k => grp.remove(k)); grp.add(m); };
  await __y(); const STATIC_MERGE = /^(canyon-wall|ridge-rock|moss-boulder|moss-cap|shore-rock|birch-trunk|birch-leaf|pier-post|ruin-column)$/;
  await __y(); const mergeStatic = () => { const B = new Map();
    scene.children.forEach(o => { if (!o.isMesh || o.isInstancedMesh || o.userData.apMerged || !STATIC_MERGE.test(o.name) || Array.isArray(o.material) || o.geometry.morphAttributes.position) return;
      const k = o.material.uuid + '|' + Math.floor((o.position.x + 2000) / CH) + '|' + Math.floor((TZ0 - o.position.z) / CH) + '|' + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0); let b = B.get(k); if (!b) B.set(k, b = []); b.push(o); });
    B.forEach(list => { if (list.length < 2) return; const m = bakeMerge(list, list[0].name + '-merged'); if (!m) return;
      list.forEach(o => scene.remove(o)); const bs = m.geometry.boundingSphere; m.userData.apMerged = true; m.userData.chunked = true; m.userData.cx = bs.center.x; m.userData.cz = bs.center.z; m.userData.r = bs.radius;
      scene.add(m); chunks.push(m); freeze(m); }); };
  // Spatial chunking: split big instanced sets so frustum + distance culling can skip them
  await __y(); const chunkify = () => { const m4 = new THREE.Matrix4(), c3 = new THREE.Color(), NAMES = ['tree-trunks', 'pine-crowns', 'round-crowns', 'rocks', 'glow-mushrooms', 'mushroom-stems', 'glow-grass', 'fallen-logs', 'bushes', 'ferns', 'wildflowers', 'ground-grass', 'fallen-leaves', 'tree-stumps', 'stump-tops', 'vines', 'tall-grass', 'dandelion-stems', 'dandelion-heads', 'dune-grass', 'shells', 'dry-shrubs', 'frost-pine-trunks', 'frost-pines', 'ice-crystals', ...V4_NAMES];
    scene.children.filter(o => o.isInstancedMesh && !o.userData.chunked && NAMES.includes(o.name)).forEach(im => { const B = new Map();
      for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m4); const k = Math.floor((TZ0 - m4.elements[14]) / CH) * 1000 + Math.floor((m4.elements[12] + 2000) / CH); let b = B.get(k); if (!b) B.set(k, b = []); b.push(i); }
      B.forEach(ids => { const n = new THREE.InstancedMesh(im.geometry, im.material, ids.length); n.name = im.name; n.castShadow = im.castShadow; ids.forEach((id, j) => { im.getMatrixAt(id, m4); n.setMatrixAt(j, m4); if (im.instanceColor) { im.getColorAt(id, c3); n.setColorAt(j, c3); } });
        n.computeBoundingSphere(); n.userData.chunked = true; n.userData.cx = n.boundingSphere.center.x; n.userData.cz = n.boundingSphere.center.z; n.userData.r = n.boundingSphere.radius; scene.add(n); chunks.push(n); v4Chunk(n); freeze(n); if (n.userData.lo) freeze(n.userData.lo); });
      scene.remove(im); }); mergeStatic(); };
  await __y(); chunkify();
  // Far mountains
  await __y(); { const g = new THREE.ConeGeometry(1, 1, 7, 3); const pp = g.attributes.position; for (let i = 0; i < pp.count; i++) { const y = pp.getY(i); if (y < 0.49) { const k = Math.round(pp.getX(i) * 50) * 31 + Math.round(y * 50) * 7 + Math.round(pp.getZ(i) * 50); const s = 0.8 + h2(k, 4) * 0.45; pp.setX(i, pp.getX(i) * s); pp.setZ(i, pp.getZ(i) * s); } } g.computeVertexNormals();
    const N = 90, mts = new THREE.InstancedMesh(g, std('#ffffff'), N); mts.name = 'far-mountains';
    for (let k = 0; k < N; k++) { const back = k > 58; const z = back ? ZEND - 380 - rnd() * 280 : lerp(Z0 + 220, ZEND - 220, k / 58), s = rnd() < 0.5 ? -1 : 1, x = back ? (400 + rnd() * 500) * s : roadX(z) + s * (s < 0 ? 900 + rnd() * 420 : 1300 + rnd() * 340), h = back ? 220 + rnd() * 300 : 170 + rnd() * 300, r = Math.min(h * (0.95 + rnd() * 0.65), back ? Math.min(300, ZEND - 240 - z) : Math.abs(x - roadX(z)) - (s < 0 ? 780 : 1120));
      dummy.position.set(x, h / 2 - 30, z); dummy.rotation.set(0, rnd() * 6, 0); dummy.scale.set(r, h, r); dummy.updateMatrix(); mts.setMatrixAt(k, dummy.matrix); mts.setColorAt(k, new THREE.Color(back ? '#4a4f78' : '#5a5f82').multiplyScalar(0.85 + rnd() * 0.3)); }
    scene.add(mts);
    // snow caps on the tallest peaks
    const NC = 34, caps = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7).translate(0, 0.5, 0), std('#eef3fb', { roughness: 0.7 }), NC); caps.name = 'far-mountain-caps'; let ci = 0;
    for (let k = 0; k < N && ci < NC; k++) { const back = k > 58; if (!back || rnd() > 0.55) continue; mts.getMatrixAt(k, dummy.matrix); dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
      const h = dummy.scale.y, r = dummy.scale.x; dummy.position.y += h * 0.32; dummy.scale.set(r * 0.4, h * 0.26, r * 0.4); dummy.updateMatrix(); caps.setMatrixAt(ci++, dummy.matrix); }
    caps.count = ci; scene.add(caps); }

  // Clouds
  await __y(); const cloudMat = std('#ffd9bd', { transparent: true, opacity: 0.92, roughness: 1 });
  await __y(); const cloudGeo = new THREE.IcosahedronGeometry(1, 0);
  await __y(); const clouds = []; await __y(); const addCloud = (x, y, z, s) => { const g = new THREE.Group(); g.name = 'cloud'; const n = 4 + Math.floor(rnd() * 4); for (let k = 0; k < n; k++) { const m = mk(cloudGeo, cloudMat, 'cloud-puff'); const r = s * (0.5 + rnd() * 0.6); m.scale.set(r * 1.4, r * 0.8, r); m.position.set((k - n / 2) * s * 0.7 + rnd() * s * 0.4, rnd() * s * 0.3, (rnd() - 0.5) * s * 0.8); m.rotation.set(rnd(), rnd(), rnd()); g.add(m); } mergeKids(g, 'cloud-puffs'); g.position.set(x, y, z); scene.add(g); clouds.push({ g, v: 1.2 + rnd() * 2.8, x0: x, y0: y, ph: rnd() * 6 }); return g; };
  await __y(); for (let k = 0; k < (lp ? 18 : 34); k++) { const z = Z0 + 90 - rnd() * 260; addCloud(roadX(z) + (rnd() - 0.5) * 140, 60 + rnd() * 50, z, 7 + rnd() * 9); }
  await __y(); for (let k = 0; k < (lp ? 16 : 30); k++) { const z = lerp(Z0, ZEND - 200, rnd()); addCloud((rnd() - 0.5) * 700, 150 + rnd() * 90, z, 18 + rnd() * 20); }

  // Ground fog banks — low drifting haze in valleys and canyon floor
  await __y(); const fogPatches = [];
  await __y(); for (let k = 0; k < (lp ? 8 : 16); k++) { const z = lerp(TZ0, ZEND + 20, rnd()), x = roadX(z) + (rnd() - 0.5) * 170, y = H(x, z) + 0.6;
    const fm = new THREE.SpriteMaterial({ map: GT, color: '#cfd9e6', transparent: true, opacity: 0.1, depthWrite: false, fog: false }); const m = new THREE.Sprite(fm); const s = 20 + rnd() * 26; m.scale.set(s, s * 0.4, 1); m.position.set(x, y, z); scene.add(m); fogPatches.push({ m, x0: x, z0: z, ph: rnd() * 10 }); }

  // Lake water
  await __y(); const LS = LAKE.r * 3, SHN = 96, shoreData = new Uint8Array(SHN * SHN * 4);
  await __y(); for (let j = 0; j < SHN; j++) for (let i = 0; i < SHN; i++) { const x = LAKE.x - LS / 2 + (i + 0.5) / SHN * LS, z = LAKE.z - LS / 2 + (j + 0.5) / SHN * LS, o = (j * SHN + i) * 4; shoreData[o] = Math.round(clamp((LAKE.y - H(x, z)) / 4, 0, 1) * 255); shoreData[o + 3] = 255; }
  await __y(); const shoreTex = new THREE.DataTexture(shoreData, SHN, SHN); await __y(); shoreTex.magFilter = shoreTex.minFilter = THREE.LinearFilter; await __y(); shoreTex.needsUpdate = true;
  await __y(); const wU = { skyTop: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, shore: { value: shoreTex }, lakeO: { value: new THREE.Vector3(LAKE.x - LS / 2, LAKE.z - LS / 2, LS) }, lakeC: { value: new THREE.Vector3(LAKE.x, LAKE.z, LAKE.r) }, time: { value: 0 }, gust: { value: 0 }, rip: { value: Array.from({ length: 8 }, () => new THREE.Vector3(0, 0, -99)) }, deep: { value: new THREE.Color('#12305a') }, skyc: { value: new THREE.Color('#ffb067') }, moon: { value: skyU.moonDir.value }, night: skyU.night, fogColor: { value: new THREE.Color() }, fogNear: { value: 50 }, fogFar: { value: 560 } };
  await __y(); const water = mk(new THREE.PlaneGeometry(LAKE.r * 3, LAKE.r * 3, lp ? 50 : 90, lp ? 50 : 90).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: wU, transparent: true,
    vertexShader: `uniform float time; uniform float gust; uniform vec3 rip[8]; varying vec3 vW;
      void main(){ vec4 w=modelMatrix*vec4(position,1.); float y=(sin(w.x*.25+time*.8)*.08+sin(w.z*.31-time*.6)*.08+sin(dot(w.xz,vec2(.13,.21))*1.7+time*1.3)*.035+sin(dot(w.xz,vec2(-.29,.11))*2.3-time*1.7)*.025)*(0.7+0.7*gust);
        for(int i=0;i<8;i++){ float age=time-rip[i].z; if(age>0.&&age<6.){ float d=distance(w.xz,rip[i].xy); y+=sin(d*1.3-age*5.)*.45*exp(-age*.7)*exp(-d*.07)*smoothstep(age*6.+3.,age*6.,d);} }
        w.y+=y; vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform vec3 deep,skyc,moon,fogColor,skyTop,sunDir,lakeO,lakeC; uniform float night,fogNear,fogFar,time; uniform sampler2D shore; varying vec3 vW;
      float hs(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hs(i),hs(i+vec2(1.,0.)),f.x),mix(hs(i+vec2(0.,1.)),hs(i+vec2(1.,1.)),f.x),f.y); }
      float hh(vec2 q){ return vn(q+time*.35)+vn(q*2.3-time*.5)*.5; }
      void main(){ float lk=length(vW.xz-lakeC.xy)/lakeC.z; if(lk>1.4) discard; vec3 n=normalize(cross(dFdx(vW),dFdy(vW))); if(n.y<0.) n=-n;
        vec2 q=vW.xz*.9; float h0=hh(q); n=normalize(n+vec3(h0-hh(q+vec2(.08,0.)),0.,h0-hh(q+vec2(0.,.08)))*.8);
        vec3 v=normalize(cameraPosition-vW); float fr=pow(1.-max(dot(n,v),0.),4.)*.85+.1; vec3 r=reflect(-v,n);
        vec3 skyR=mix(skyc,skyTop,smoothstep(0.02,0.5,r.y));
        float depth=texture2D(shore,(vW.xz-lakeO.xy)/lakeO.z).r;
        vec3 shallow=mix(deep*1.9+vec3(.03,.1,.09),deep,smoothstep(0.02,0.35,depth));
        vec3 c=mix(shallow,skyR,fr);
        float mr=max(dot(r,moon),0.); c+=vec3(.92,.95,1.)*(pow(mr,420.)*3.+pow(mr,40.)*.3)*night;
        float sr=max(dot(r,normalize(sunDir)),0.); c+=vec3(1.,.72,.45)*(pow(sr,320.)*2.4+pow(sr,24.)*.2)*(1.-night);
        c+=vec3(1.,.93,.8)*step(.93,hs(floor(vW.xz*5.)+floor(time*4.)))*pow(sr,5.)*.9*(1.-night)*(1.-smoothstep(20.,90.,length(cameraPosition-vW)));
        c+=vec3(.2,.9,.9)*.05*night;
        float fn=vn(vW.xz*1.8+vec2(time*.2,-time*.15)); float nearS=smoothstep(.12,0.,depth); float band=smoothstep(.5,.92,sin(depth*70.-time*1.4+fn*3.)*.5+.5);
        float foam=clamp(nearS*(.4+.6*band)*smoothstep(.2,.6,fn+nearS*.5),0.,1.);
        c=mix(c,vec3(.94,.96,.98)*(1.-night*.55),foam*.85);
        float distC=length(cameraPosition-vW); float fogF=clamp((distC-fogNear)/max(1.0,fogFar-fogNear),0.0,1.0); c=mix(c,fogColor,fogF*0.9);
        gl_FragColor=vec4(c,mix(.93,.98,foam)*(1.-smoothstep(1.3,1.4,lk))); }` }), 'lake');
  await __y(); water.position.set(LAKE.x, LAKE.y, LAKE.z); await __y(); scene.add(water);
  await __y(); let ripI = 0;

  // Waterfall feeding the lake
  await __y(); const wfA = 2.05, wfX = LAKE.x + Math.cos(wfA) * LAKE.r * 1.02, wfZ = LAKE.z + Math.sin(wfA) * LAKE.r * 1.02, wfTop = LAKE.y + 22;
  await __y(); { const cliffGeo = new THREE.IcosahedronGeometry(1, 1); const cp = cliffGeo.attributes.position; for (let i = 0; i < cp.count; i++) { const k = Math.round(cp.getX(i) * 60) * 13 + Math.round(cp.getY(i) * 60) * 7 + Math.round(cp.getZ(i) * 60); const s = 0.8 + h2(k, 3) * 0.5; cp.setXYZ(i, cp.getX(i) * s, cp.getY(i) * s, cp.getZ(i) * s); } cliffGeo.computeVertexNormals();
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
    worldType(['Falling water,', 'still lake.'], zW(0.855)); }

  // Snowmelt waterfall: off the snow-capped hill west of the river, down the slope and into the river
  await __y(); const rivRip = Array.from({ length: 8 }, () => new THREE.Vector3(0, 0, -99)); await __y(); let rivI = 0; await __y(); const WFJ = new THREE.Vector3(0, 0, 0.001);
  await __y(); { const w = wf2Path(), P = w.pts, pos = [], uv = [], stp = [], idx = []; let acc = 0;
    for (let i = 0; i < P.length; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dx = b.x - a.x, dz = b.z - a.z, dl = Math.hypot(dx, dz) || 1, px = -dz / dl, pz = dx / dl;
      if (i) acc += Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y, P[i].z - P[i - 1].z); const hw = lerp(1.1, 2.6, i / (P.length - 1)), sl = clamp(Math.abs(b.y - a.y) / dl, 0, 1.5) / 1.5;
      pos.push(P[i].x - px * hw, P[i].y, P[i].z - pz * hw, P[i].x + px * hw, P[i].y, P[i].z + pz * hw); uv.push(0, acc, 1, acc); stp.push(sl, sl);
      if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aSteep', new THREE.Float32BufferAttribute(stp, 1)); g.setIndex(idx);
    const sU = { time: wU.time, night: wU.night, fogColor: wU.fogColor, fogNear: wU.fogNear, fogFar: wU.fogFar };
    const streamMat = new THREE.ShaderMaterial({ uniforms: sU, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide,
      vertexShader: 'attribute float aSteep; varying vec2 vUv; varying float vS; varying vec3 vW; void main(){ vUv=uv; vS=aSteep; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
      fragmentShader: `uniform float time,night,fogNear,fogFar; uniform vec3 fogColor; varying vec2 vUv; varying float vS; varying vec3 vW;
        float hs(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453); }
        void main(){ float ax=abs(vUv.x-.5); float f=fract(vUv.y*.32-time*(1.4+vS*2.2)); float st=hs(vec2(floor(vUv.x*14.),floor(f*9.)+floor(vUv.y*.32-time*(1.4+vS*2.2))));
          float fl=sin(vUv.y*2.4-time*6.+vUv.x*9.)*.5+.5; float foam=clamp(vS*1.1+st*.35+fl*.2+smoothstep(.32,.5,ax)*.6,0.,1.);
          vec3 c=mix(vec3(.12,.3,.36),vec3(.9,.95,.99),foam)*(1.-night*.55)+vec3(.2,.9,.9)*.04*night;
          float distC=length(cameraPosition-vW); c=mix(c,fogColor,clamp((distC-fogNear)/max(1.,fogFar-fogNear),0.,1.)*.9);
          gl_FragColor=vec4(c,(.72+.25*foam)*smoothstep(.5,.4,ax)); }` });
    const stream = mk(g, streamMat, 'snowmelt-stream'); stream.renderOrder = 2; scene.add(stream);
    // snow-capped cliff and the plunge at the top
    const cg = new THREE.IcosahedronGeometry(1, 1), snowM = std('#eef3fb', { roughness: 0.7 }); const topH = 16;
    for (let k = 0; k < 6; k++) { const a = (k / 5 - 0.5) * 2.2, rx = w.sx - 3 - Math.abs(a) * 1.5, rz = w.zF + a * 4.2, gy = H(rx, rz), hh = topH * (0.75 + 0.35 * (1 - Math.abs(a) / 1.1)) + rnd() * 3;
      const rk = mk(cg, stone, 'snowmelt-cliff'); rk.position.set(rx, gy + hh * 0.45, rz); rk.scale.set(5 + rnd() * 2, hh * 0.55, 4.5 + rnd() * 1.5); rk.rotation.y = rnd() * 6; rk.castShadow = !lp; scene.add(rk); solids.push({ x: rx, z: rz, r: 4.5 });
      const cap = mk(cg, snowM, 'snowmelt-cliff-snow'); cap.position.set(rx, gy + hh * 0.95, rz); cap.scale.set(3.6 + rnd(), 1.4, 3.2 + rnd()); cap.rotation.y = rnd() * 6; scene.add(cap); }
    const pU = { time: wU.time, night: wU.night };
    const plunge = mk(new THREE.PlaneGeometry(3.2, topH, 1, 16), new THREE.ShaderMaterial({ uniforms: pU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `uniform float time,night; varying vec2 vUv; float hash(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453); }
        void main(){ float y=vUv.y; float fl=fract(y*6.-time*2.); float st=hash(vec2(floor(vUv.x*20.),floor(fl*10.)+floor(y*6.-time*2.)));
          float edge=smoothstep(0.,.18,vUv.x)*smoothstep(1.,.82,vUv.x); float a=(.55+.45*st)*edge*smoothstep(0.,.1,y)*smoothstep(1.,.9,y);
          gl_FragColor=vec4(vec3(.82,.91,.99)*(1.-night*.5),a); }` }), 'snowmelt-plunge');
    plunge.position.set(w.sx + 1.2, w.sy + topH / 2, w.zF); plunge.rotation.y = Math.PI / 2; scene.add(plunge);
    const mistTop = glowSprite('#e6f5ff', 7, 0.4); mistTop.position.set(w.sx + 2.5, w.sy + 1.2, w.zF); scene.add(mistTop);
    const mistJ = glowSprite('#e6f5ff', 8, 0.35); mistJ.position.set(w.jx + 2, w.rY + 1, w.jz); scene.add(mistJ);
    glows.push({ s: mistTop, base: 0.3, n: 0.7 }, { s: mistJ, base: 0.3, n: 0.7 });
    WFJ.set(w.jx + 3, w.jz, 6);
    anim.push(t => { mistTop.material.opacity = 0.34 + Math.sin(t * 2.6) * 0.07; mistJ.material.opacity = 0.3 + Math.sin(t * 3.1 + 1) * 0.07; mistJ.scale.setScalar(8 + Math.sin(t * 2) * 0.6); }); }

  // ===== Expanded map: meadow, river valley, ruins, coast =====
  await __y(); const lhBeam = { v: 0 };
  await __y(); { const stoneR = std('#9a9284'), mossM = std('#4f6b3a', { roughness: 1 });
    // Meadow — a lone great oak, drifting light motes, deep wildflowers
    { const y = H(MEADOW.x, MEADOW.z); const tr = mk(new THREE.CylinderGeometry(0.55, 0.95, 6.5, 8), wood, 'meadow-oak-trunk'); tr.position.set(MEADOW.x, y + 3.1, MEADOW.z); tr.castShadow = !lp; scene.add(tr);
      const leaf = std('#6f9a3e'); [[0, 7.8, 0, 4.4], [2.6, 7, 1.2, 3.2], [-2.4, 7.2, -1, 3.4], [0.6, 9.4, -1.6, 3]].forEach(([ox, oy, oz, r], k) => { const c = mk(new THREE.IcosahedronGeometry(r, 1), leaf, 'meadow-oak-crown'); c.position.set(MEADOW.x + ox, y + oy, MEADOW.z + oz); c.rotation.set(k, k * 2, 0); c.castShadow = !lp; scene.add(c); });
      solids.push({ x: MEADOW.x, z: MEADOW.z, r: 1.1 });
      for (let k = 0; k < 16; k++) { const g = glowSprite(pick(['#c8ff7a', '#9dffc4', '#fff2b0']), 0.5, 0); const a = rnd() * 6.28, rr = 6 + rnd() * 34, bx = MEADOW.x + Math.cos(a) * rr, bz = MEADOW.z + Math.sin(a) * rr, by = H(bx, bz) + 0.8 + rnd() * 1.6, ph = rnd() * 6; g.position.set(bx, by, bz); scene.add(g); glows.push({ s: g, base: 0.04, n: 0.9 }); anim.push(t => { g.position.set(bx + Math.sin(t * 0.3 + ph) * 1.5, by + Math.sin(t * 0.7 + ph) * 0.4, bz + Math.cos(t * 0.25 + ph) * 1.5); }); }
      deferred.push(() => { const N = lp ? 1400 : 3400, fl = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), std('#ffffff', { roughness: 0.6 }), N); fl.name = 'wildflowers'; const FCm = ['#e8556f', '#f0a83c', '#f4e04d', '#c95de0', '#6ec6e8', '#fff6ea'].map(c => new THREE.Color(c)); let n = 0;
        for (let k = 0; k < N * 2 && n < N; k++) { const a = rnd() * 6.28, rr = Math.sqrt(rnd()) * MEADOW.r * 1.15, x = MEADOW.x + Math.cos(a) * rr / 0.8, z = MEADOW.z + Math.sin(a) * rr; if (Math.hypot(x - MEADOW.x, z - MEADOW.z) < 2) continue; const sc = 0.035 + rnd() * 0.045; dummy.position.set(x, H(x, z) + 0.22 + rnd() * 0.25, z); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(sc); dummy.updateMatrix(); fl.setMatrixAt(n, dummy.matrix); fl.setColorAt(n++, FCm[Math.floor(Math.pow(rnd(), 1.3) * FCm.length)]); }
        fl.count = n; scene.add(fl);
        const NG = lp ? 900 : 2400, tg2 = new THREE.InstancedMesh(new THREE.ConeGeometry(0.12, 1, 3).translate(0, 0.5, 0), std('#6f9a3a'), NG); tg2.name = 'ground-grass'; windify(tg2.material, 0.7); const GM = ['#6f9a3a', '#7faa42', '#5f8a34'].map(c => new THREE.Color(c)); let q = 0;
        for (let k = 0; k < NG; k++) { const a = rnd() * 6.28, rr = Math.sqrt(rnd()) * MEADOW.r * 1.2, x = MEADOW.x + Math.cos(a) * rr / 0.8, z = MEADOW.z + Math.sin(a) * rr, hh = 0.7 + rnd() * 0.9; if (Math.hypot(x - MEADOW.x, z - MEADOW.z) < 1.5) continue; dummy.position.set(x, H(x, z) - 0.05, z); dummy.rotation.set(0, rnd() * 6, (rnd() - 0.5) * 0.3); dummy.scale.set(0.6, hh, 0.6); dummy.updateMatrix(); tg2.setMatrixAt(q, dummy.matrix); tg2.setColorAt(q++, pick(GM)); }
        tg2.count = q; scene.add(tg2); }); }
    // River valley — flowing water, reeds, stepping stones
    { const pos = [], uv = [], idx = []; let n = 0; const W2 = 7;
      for (let z = RIV.zHi + 30; z >= RIV.zLo - 30; z -= 3) { const x = riverX(z), sl = riverX(z - 1.5) - riverX(z + 1.5), ln = Math.hypot(sl, 3), px = 3 / ln, pz = sl / ln, y = roadY(z) - 2.2;
        pos.push(x - px * W2, y, z - pz * W2, x + px * W2, y, z + pz * W2); uv.push(0, n * 0.04, 1, n * 0.04); if (n) idx.push(2 * n - 2, 2 * n - 1, 2 * n, 2 * n - 1, 2 * n + 1, 2 * n); n++; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const rivMat = new THREE.ShaderMaterial({ uniforms: { rrp: { value: rivRip }, wfJ: { value: WFJ }, time: wU.time, night: wU.night, skyc: wU.skyc, skyTop: wU.skyTop, moon: wU.moon, fogColor: wU.fogColor, fogNear: wU.fogNear, fogFar: wU.fogFar }, transparent: true, depthWrite: false,
        vertexShader: 'varying vec3 vW; varying vec2 vUv; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
        fragmentShader: `uniform float time,night,fogNear,fogFar; uniform vec3 skyc,skyTop,moon,fogColor,wfJ; uniform vec3 rrp[8]; varying vec3 vW; varying vec2 vUv;
          void main(){ float ax=abs(vUv.x-.5); float fl=sin(vUv.y*260.-time*3.2+sin(vUv.x*11.+time*.7)*2.2)*.5+.5; float fl2=sin(vUv.y*90.-time*2.1+vUv.x*6.)*.5+.5;
            vec3 v=normalize(cameraPosition-vW); float fr=pow(1.-max(v.y,0.),3.);
            vec3 c=mix(vec3(.05,.2,.24),mix(skyc,skyTop,.4),.25+fr*.6); c+=vec3(.7,.85,.9)*smoothstep(.82,1.,fl*fl2)*.18;
            c+=vec3(.9,.95,1.)*pow(max(dot(reflect(-v,vec3(0.,1.,0.)),moon),0.),60.)*.8*night; c+=vec3(.2,.9,.9)*.05*night;
            float foam=smoothstep(.36,.43,ax)*(.6+.4*fl); float rg=0.; for(int i=0;i<8;i++){ float age=time-rrp[i].z; if(age>0.&&age<4.){ float d=distance(vW.xz,rrp[i].xy); rg+=smoothstep(.45,0.,abs(d-age*2.4))*exp(-age*.9); } } rg+=smoothstep(wfJ.z,0.,distance(vW.xz,wfJ.xy))*(.45+.55*fl); foam=clamp(foam+rg*.85,0.,1.); c=mix(c,vec3(.92,.95,.97)*(1.-night*.5),foam*.7);
            float distC=length(cameraPosition-vW); c=mix(c,fogColor,clamp((distC-fogNear)/max(1.,fogFar-fogNear),0.,1.)*.9);
            gl_FragColor=vec4(c,.9*smoothstep(.5,.44,ax)); }` });
      const river = mk(g, rivMat, 'river'); river.renderOrder = 1; scene.add(river);
      for (let k = 0; k < 6; k++) { const x = riverX(zRc) + 5 - k * 2, st = mk(new THREE.DodecahedronGeometry(0.8, 0), stone, 'stepping-stone'); st.scale.set(1, 0.45, 1); st.position.set(x, roadY(zRc) - 2.3, zRc - 3 + (k % 2) * 0.8); st.rotation.y = k; scene.add(st); }
      const NRd = lp ? 160 : 420, reeds = new THREE.InstancedMesh(new THREE.ConeGeometry(0.05, 1, 3).translate(0, 0.5, 0), std('#6b7f3a'), NRd); reeds.name = 'reeds'; windify(reeds.material, 0.8); let q = 0;
      for (let k = 0; k < NRd; k++) { const z = lerp(RIV.zHi, RIV.zLo, rnd()), sd2 = rnd() < 0.5 ? -1 : 1, x = riverX(z) + sd2 * (5.6 + rnd() * 3.2); if (Math.abs(z - zRc) < 5) continue; const hh = 1.1 + rnd() * 1.1; dummy.position.set(x, H(x, z) - 0.05, z); dummy.rotation.set((rnd() - 0.5) * 0.2, rnd() * 6, (rnd() - 0.5) * 0.2); dummy.scale.set(1, hh, 1); dummy.updateMatrix(); reeds.setMatrixAt(q, dummy.matrix); reeds.setColorAt(q++, new THREE.Color(pick(['#6b7f3a', '#7a8a42', '#5d7034']))); }
      reeds.count = q; scene.add(reeds); }
    // Ruins — a ring of columns, an arch facing the road, broken walls, a glowing altar
    { const cy = H(RUINS.x, RUINS.z), col = std('#a39b8c'), cap = std('#b3ab9c');
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, x = RUINS.x + Math.cos(a) * 12, z = RUINS.z + Math.sin(a) * 12, y = H(x, z), broken = h2(k, 41) < 0.45, hgt = broken ? 1.2 + h2(k, 42) * 2.6 : 6.2;
        const c = mk(new THREE.CylinderGeometry(0.5, 0.58, hgt, 10), col, 'ruin-column'); c.position.set(x, y + hgt / 2 - 0.1, z); c.rotation.z = broken ? (h2(k, 43) - 0.5) * 0.12 : 0; c.castShadow = !lp; scene.add(c); solids.push({ x, z, r: 0.7 });
        if (!broken) { const cp = mk(new THREE.BoxGeometry(1.5, 0.4, 1.5), cap, 'ruin-capital'); cp.position.set(x, y + hgt, z); cp.castShadow = !lp; scene.add(cp); if (k % 3 === 0) { const gs = glowSprite('#7ff3e1', 1.3, 0.1); gs.position.set(x - Math.cos(a) * 0.62, y + 3.4, z - Math.sin(a) * 0.62); scene.add(gs); glows.push({ s: gs, base: 0.08, n: 0.85 }); } }
        else if (h2(k, 44) < 0.6) { const fp = mk(new THREE.CylinderGeometry(0.5, 0.5, 2.4, 10), col, 'ruin-fallen'); fp.rotation.set(0, a + 1.2, Math.PI / 2); fp.position.set(x + Math.cos(a) * 2.2, y + 0.4, z + Math.sin(a) * 2.2); scene.add(fp); } }
      { const ax = RUINS.x - 19, az = RUINS.z; [-2.2, 2.2].forEach(o => { const p = mk(new THREE.BoxGeometry(1.1, 5.4, 1.1), col, 'ruin-arch-pillar'); p.position.set(ax, H(ax, az + o) + 2.6, az + o); p.castShadow = !lp; scene.add(p); solids.push({ x: ax, z: az + o, r: 0.8 }); });
        const lin = mk(new THREE.BoxGeometry(1.3, 0.9, 5.8), cap, 'ruin-arch-lintel'); lin.position.set(ax, H(ax, az) + 5.7, az); lin.castShadow = !lp; scene.add(lin); }
      for (let k = 0; k < 7; k++) { const a = 0.6 + k * 0.72, x = RUINS.x + Math.cos(a) * 22, z = RUINS.z + Math.sin(a) * 22, len = 3 + h2(k, 51) * 4, hgt = 0.8 + h2(k, 52) * 2; const w = mk(new THREE.BoxGeometry(len, hgt, 0.7), stoneR, 'ruin-wall'); w.position.set(x, H(x, z) + hgt / 2 - 0.1, z); w.rotation.y = -a + Math.PI / 2; w.castShadow = !lp; scene.add(w); solids.push({ x, z, r: len * 0.45 });
        if (h2(k, 53) < 0.6) { const m2 = mk(new THREE.BoxGeometry(len * 0.8, 0.18, 0.8), mossM, 'ruin-moss'); m2.position.set(x, H(x, z) + hgt - 0.02, z); m2.rotation.y = w.rotation.y; scene.add(m2); } }
      const altar = mk(new THREE.BoxGeometry(2.2, 1, 1.3), cap, 'ruin-altar'); altar.position.set(RUINS.x, cy + 0.4, RUINS.z); altar.castShadow = !lp; scene.add(altar); solids.push({ x: RUINS.x, z: RUINS.z, r: 1.1 });
      const ag = glowSprite('#9dffc4', 3.2, 0.1); ag.position.set(RUINS.x, cy + 1.3, RUINS.z); scene.add(ag); glows.push({ s: ag, base: 0.1, n: 0.7 }); }
    // Coast — open sea, a lighthouse with a sweeping beam, a pier, driftwood
    { const SS = 600, SN = 128, sd = new Uint8Array(SN * SN * 4), sx0 = -850, sz0 = (COAST.zHi + COAST.zLo) / 2 - SS / 2;
      for (let j = 0; j < SN; j++) for (let i = 0; i < SN; i++) { const x = sx0 + (i + 0.5) / SN * SS, z = sz0 + (j + 0.5) / SN * SS, o = (j * SN + i) * 4; sd[o] = Math.round(clamp((SEA_Y - H(x, z)) / 4, 0, 1) * 255); sd[o + 3] = 255; }
      const seaTex = new THREE.DataTexture(sd, SN, SN); seaTex.magFilter = seaTex.minFilter = THREE.LinearFilter; seaTex.needsUpdate = true;
      const seaMat = water.material.clone(); seaMat.uniforms = { ...wU, lakeC: { value: new THREE.Vector3(0, 0, 1e9) }, shore: { value: seaTex }, lakeO: { value: new THREE.Vector3(sx0, sz0, SS) } };
      const sea = mk(new THREE.PlaneGeometry(1250, 1500, 90, 90).rotateX(-Math.PI / 2), seaMat, 'sea'); sea.position.set(-875, SEA_Y, (COAST.zHi + COAST.zLo) / 2 - 200); scene.add(sea);
      const ly = H(LH.x, LH.z), white = std('#efe9dc'), redM = std('#b3202a'), R = hy => 1.8 - hy / 12 * 0.55 + 0.03;
      const base = mk(new THREE.CylinderGeometry(2.6, 3, 1.4, 12), stone, 'lighthouse-base'); base.position.set(LH.x, ly + 0.5, LH.z); scene.add(base);
      const tower = mk(new THREE.CylinderGeometry(1.25, 1.8, 12, 16), white, 'lighthouse-tower'); tower.position.set(LH.x, ly + 7, LH.z); tower.castShadow = !lp; scene.add(tower);
      [4.5, 8.5].forEach(hy => { const b = mk(new THREE.CylinderGeometry(R(hy + 0.6), R(hy - 0.6), 1.2, 16), redM, 'lighthouse-band'); b.position.set(LH.x, ly + 1 + hy, LH.z); scene.add(b); });
      const lamp = mk(new THREE.CylinderGeometry(1, 1, 1.5, 12), warmBasic, 'lighthouse-lamp'); lamp.position.set(LH.x, ly + 13.8, LH.z); scene.add(lamp);
      const capC = mk(new THREE.ConeGeometry(1.4, 1.6, 12), redM, 'lighthouse-cap'); capC.position.set(LH.x, ly + 15.3, LH.z); scene.add(capC);
      const lg = glowSprite('#ffe2a0', 6, 0.3); lg.position.set(LH.x, ly + 13.8, LH.z); scene.add(lg); glows.push({ s: lg, base: 0.25, n: 1 });
      const beamM = new THREE.MeshBasicMaterial({ color: '#fff0c8', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
      const lb = new THREE.Group(); lb.name = 'lighthouse-beam'; lb.position.set(LH.x, ly + 13.8, LH.z); scene.add(lb);
      [0, Math.PI].forEach(r0 => { const cone = mk(new THREE.ConeGeometry(5, 70, 20, 1, true).translate(0, -35, 0), beamM, 'lighthouse-beam-cone'); cone.rotation.set(0, r0, Math.PI / 2); const g0 = new THREE.Group(); g0.rotation.y = r0; g0.add(cone); cone.rotation.set(0, 0, Math.PI / 2); lb.add(g0); });
      anim.push(t => { lb.rotation.y = t * 0.55; beamM.opacity = lhBeam.v; lb.visible = lhBeam.v > 0.005; });
      solids.push({ x: LH.x, z: LH.z, r: 3 });
      const pl = PIER.x1 - PIER.x0, deck = mk(new THREE.BoxGeometry(pl, 0.2, PIER.w * 2), wood, 'pier-deck'); deck.position.set((PIER.x0 + PIER.x1) / 2, PIER.y - 0.1, PIER.z); deck.receiveShadow = !lp; scene.add(deck);
      for (let k = 0; k <= 6; k++) [-1, 1].forEach(s2 => { const post = mk(new THREE.CylinderGeometry(0.12, 0.12, 5, 6), darkWood, 'pier-post'); post.position.set(PIER.x0 + k / 6 * pl, PIER.y - 2.4, PIER.z + s2 * (PIER.w - 0.1)); scene.add(post); });
      const pPost = mk(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 5), darkWood, 'pier-lamp-post'); pPost.position.set(PIER.x0 + 0.6, PIER.y + 0.8, PIER.z + 1.2); scene.add(pPost);
      const pLamp = glowSprite('#ffc36b', 1.6, 0.4); pLamp.position.set(PIER.x0 + 0.6, PIER.y + 1.6, PIER.z + 1.2); scene.add(pLamp); glows.push({ s: pLamp, base: 0.2, n: 0.95 });
      const dwM = std('#b9a488');
      for (let k = 0; k < 10; k++) { const z = lerp(COAST.zHi - 40, COAST.zLo + 40, rnd()), x = coastX(z) + 3 + rnd() * 10; if (Math.abs(z - PIER.z) < 5) continue; const dw = mk(new THREE.CylinderGeometry(0.14, 0.2, 2 + rnd() * 2.5, 6), dwM, 'driftwood'); dw.rotation.set(0, rnd() * 6, Math.PI / 2); dw.position.set(x, H(x, z) + 0.15, z); scene.add(dw); }
      for (let k = 0; k < 16; k++) { const z = lerp(COAST.zHi - 40, COAST.zLo + 40, rnd()), x = coastX(z) - 4 + rnd() * 6, sc = 0.6 + rnd() * 1.8; if (Math.abs(z - PIER.z) < 4) continue; const rk = mk(new THREE.DodecahedronGeometry(sc, 0), stone, 'shore-rock'); rk.position.set(x, H(x, z) + sc * 0.2, z); rk.rotation.set(rnd(), rnd() * 6, rnd()); scene.add(rk); if (sc > 1.2) solids.push({ x, z, r: sc * 0.7 }); } } }
  // Canyon pass — road flanked by rising rock walls
  await __y(); { const cz0 = sZ(2) + 55, cz1 = sZ(3) - 45;
    for (let z = cz0; z > cz1; z -= 9) { const { f, r } = frame(z), prog = clamp((z - cz1) / (cz0 - cz1), 0, 1), rise = Math.sin(prog * Math.PI);
      [-1, 1].forEach(sd => { const w = roadW(z) + 6.5 + rnd() * 3, h = 14 + rise * 26 + rnd() * 6, x = roadX(z) + r.x * sd * w, zz = z + r.z * sd * w, y = H(x, zz);
        const rk = mk(new THREE.ConeGeometry(6 + rnd() * 3, h, 6, 1), stone, 'canyon-wall'); rk.position.set(x, y + h * 0.42, zz); rk.rotation.y = rnd() * 6; rk.scale.x = 0.6 + rnd() * 0.4; rk.castShadow = !lp; scene.add(rk); solids.push({ x, z: zz, r: 6.5 }); }); } }
  await __y(); const SG = 8, solidGrid = new Map();
  await __y(); solids.forEach((s, i) => { const key = Math.floor(s.x / SG) + ',' + Math.floor(s.z / SG); if (!solidGrid.has(key)) solidGrid.set(key, []); solidGrid.get(key).push(i); });
  function collideAt(x, z, extra) { const cx = Math.floor(x / SG), cz = Math.floor(z / SG); for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const arr = solidGrid.get((cx + dx) + ',' + (cz + dz)); if (!arr) continue; for (const i of arr) { const s = solids[i], ddx = x - s.x, ddz = z - s.z, rr = s.r + extra; if (ddx * ddx + ddz * ddz < rr * rr) return s; } } return null; }
  await __y(); const bike = new THREE.Group(); await __y(); bike.name = 'hness-350';
  await __y(); const M = { gloss: new THREE.MeshPhysicalMaterial({ color: '#101014', flatShading: false, roughness: 0.16, metalness: 0.4, clearcoat: 0.9, clearcoatRoughness: 0.12, envMapIntensity: 1.4 }), red: new THREE.MeshPhysicalMaterial({ color: '#b3202a', flatShading: false, roughness: 0.18, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.3 }), chrome: std('#d4d7de', { flatShading: false, roughness: 0.14, metalness: 0.65, envMapIntensity: 2 }), rubber: std('#17171a', { flatShading: false, roughness: 0.92 }), engine: std('#3b3c42', { flatShading: false, roughness: 0.5, metalness: 0.4, envMapIntensity: 1.3 }), seat: std('#1e1917', { flatShading: false, roughness: 0.7 }) };
  await __y(); const lamp = new THREE.MeshBasicMaterial({ color: '#eaf6ff' }), amber = new THREE.MeshBasicMaterial({ color: '#ffb23a' }), tail = new THREE.MeshBasicMaterial({ color: '#ff2a2a' }), screen = new THREE.MeshBasicMaterial({ color: '#6ff0ff' });
  await __y(); const tube = (a, b, r, mat, name) => { const d = new THREE.Vector3().subVectors(b, a); const m = mk(new THREE.CylinderGeometry(r, r, d.length(), 14), mat, name); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); bike.add(m); return m; };
  await __y(); const V = (x, y, z) => new THREE.Vector3(x, y, z);
  await __y(); const wheels = [];
  await __y(); const mergeG = parts => { const P = [], N = []; parts.forEach(([g0, m4]) => { const q = g0.index ? g0.toNonIndexed() : g0.clone(); q.applyMatrix4(m4); P.push(q.attributes.position.array); N.push(q.attributes.normal.array); }); const len = P.reduce((a, b) => a + b.length, 0), pa = new Float32Array(len), na = new Float32Array(len); let o = 0; P.forEach((p, i) => { pa.set(p, o); na.set(N[i], o); o += p.length; }); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pa, 3)); g.setAttribute('normal', new THREE.BufferAttribute(na, 3)); return g; };
  await __y(); const M4 = (x, y, z, rx = 0, ry = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1));
  await __y(); const tubeM4 = (a, b) => { const d = new THREE.Vector3().subVectors(b, a), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); return [d.length(), new THREE.Matrix4().compose(a.clone().addScaledVector(d, 0.5), q, new THREE.Vector3(1, 1, 1))]; };
  await __y(); [-0.72, 0.7].forEach((z, k) => { const w = new THREE.Group(); w.name = k ? 'rear-wheel' : 'front-wheel'; w.position.set(0, 0.36, z);
    const tyre = mk(new THREE.TorusGeometry(0.29, 0.078, 16, 56), M.rubber, 'tyre'); tyre.rotation.y = Math.PI / 2; w.add(tyre);
    { const parts = []; for (let s = 0; s < 40; s++) { const a = s / 40 * Math.PI * 2; parts.push([new THREE.BoxGeometry(0.1, 0.02, 0.03), M4(0, Math.sin(a) * 0.364, Math.cos(a) * 0.364, Math.PI / 2 - a)]); } w.add(mk(mergeG(parts), M.rubber, 'tread')); }
    const rim = mk(new THREE.TorusGeometry(0.228, 0.016, 8, 48), M.chrome, 'rim'); rim.rotation.y = Math.PI / 2; w.add(rim);
    const rimIn = mk(new THREE.CylinderGeometry(0.222, 0.222, 0.05, 48, 1, true), M.chrome, 'rim-band'); rimIn.rotation.z = Math.PI / 2; w.add(rimIn);
    { const parts = []; for (let s = 0; s < 32; s++) { const a = s / 32 * Math.PI * 2, sd = s % 2 ? 1 : -1, hubP = new THREE.Vector3(sd * 0.05, Math.sin(a + sd * 0.3) * 0.05, Math.cos(a + sd * 0.3) * 0.05), rimP = new THREE.Vector3(sd * 0.012, Math.sin(a) * 0.218, Math.cos(a) * 0.218); const [l, m4] = tubeM4(hubP, rimP); parts.push([new THREE.CylinderGeometry(0.0035, 0.0035, l, 4), m4]); } w.add(mk(mergeG(parts), M.chrome, 'spokes')); }
    const hub = mk(new THREE.CylinderGeometry(0.065, 0.065, 0.16, 20), M.engine, 'hub'); hub.rotation.z = Math.PI / 2; w.add(hub);
    [-1, 1].forEach(sd => { const fl = mk(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 24), M.chrome, 'hub-flange'); fl.rotation.z = Math.PI / 2; fl.position.x = sd * 0.05; w.add(fl); });
    if (!k) { const disc = mk(new THREE.CylinderGeometry(0.15, 0.15, 0.008, 36), M.chrome, 'brake-disc'); disc.rotation.z = Math.PI / 2; disc.position.x = -0.082; w.add(disc); }
    else { const drum = mk(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 24), M.engine, 'drum-brake'); drum.rotation.z = Math.PI / 2; drum.position.x = -0.07; w.add(drum); const spr = mk(new THREE.CylinderGeometry(0.12, 0.12, 0.012, 28), M.chrome, 'sprocket'); spr.rotation.z = Math.PI / 2; spr.position.x = 0.15; w.add(spr); }
    bike.add(w); wheels.push(w); });
  await __y(); const fF = mk(new THREE.TorusGeometry(0.345, 0.055, 8, 28, Math.PI * 0.62), M.gloss, 'front-fender'); await __y(); fF.rotation.y = Math.PI / 2; await __y(); fF.rotation.z = 0.3; await __y(); fF.scale.set(1, 1, 1.35); await __y(); fF.position.set(0, 0.36, -0.72); await __y(); bike.add(fF);
  await __y(); const rF = mk(new THREE.TorusGeometry(0.37, 0.075, 8, 28, Math.PI * 0.62), M.gloss, 'rear-fender'); await __y(); rF.rotation.y = Math.PI / 2; await __y(); rF.rotation.z = 1.1; await __y(); rF.scale.set(1, 1, 1.25); await __y(); rF.position.set(0, 0.36, 0.7); await __y(); bike.add(rF);
  await __y(); [-1, 1].forEach(sd => tube(V(sd * 0.16, 0.5, 0.62), V(sd * 0.15, 0.78, 0.86), 0.01, M.chrome, 'fender-stay'));
  await __y(); [-0.09, 0.09].forEach(x => { tube(V(x, 0.36, -0.72), V(x, 0.72, -0.6), 0.03, M.chrome, 'fork'); tube(V(x, 0.7, -0.595), V(x, 1.0, -0.49), 0.037, M.gloss, 'fork-cover'); });
  await __y(); const clamp1 = mk(new THREE.BoxGeometry(0.26, 0.04, 0.09), M.chrome, 'triple-clamp'); await __y(); clamp1.position.set(0, 1.0, -0.49); await __y(); clamp1.rotation.x = -0.34; await __y(); bike.add(clamp1);
  await __y(); tube(V(0, 0.98, -0.5), V(0, 0.92, 0.35), 0.035, M.gloss, 'frame-top'); await __y(); tube(V(0, 0.95, -0.46), V(0, 0.42, -0.2), 0.035, M.gloss, 'frame-down');
  await __y(); tube(V(0, 0.42, -0.2), V(0, 0.4, 0.3), 0.03, M.gloss, 'frame-low'); await __y(); [-0.1, 0.1].forEach(x => tube(V(x, 0.42, 0.28), V(x, 0.9, 0.62), 0.02, M.gloss, 'subframe'));
  await __y(); [-0.13, 0.13].forEach(x => { tube(V(x, 0.36, 0.7), V(x, 0.46, 0.05), 0.025, M.gloss, 'swingarm'); const a = V(x, 0.44, 0.64), b = V(x, 0.9, 0.44); tube(a, b, 0.018, M.chrome, 'shock');
    const ax = b.clone().sub(a), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), ax.clone().normalize()), parts = [];
    for (let k = 0; k < 9; k++) parts.push([new THREE.TorusGeometry(0.034, 0.007, 6, 18), new THREE.Matrix4().compose(a.clone().addScaledVector(ax, 0.22 + k * 0.065), q, new THREE.Vector3(1, 1, 1))]); bike.add(mk(mergeG(parts), M.red, 'shock-spring')); });
  await __y(); const tankG = new THREE.SphereGeometry(1, 36, 26); await __y(); { const tp = tankG.attributes.position; for (let i = 0; i < tp.count; i++) { let x = tp.getX(i), y = tp.getY(i); const z = tp.getZ(i), rear = Math.max(0, z); x *= 1 - rear * 0.28 - (Math.abs(y) < 0.35 && z > 0.05 ? 0.16 * (1 - Math.abs(y) / 0.35) * Math.min(1, (z - 0.05) * 3) : 0); y *= 1 - rear * 0.18; if (y < -0.55) y = -0.55 - (y + 0.55) * 0.35; tp.setXYZ(i, x, y, z); } tankG.computeVertexNormals(); }
  await __y(); const tank = mk(tankG, M.gloss, 'tank'); await __y(); tank.scale.set(0.18, 0.14, 0.31); await __y(); tank.position.set(0, 0.99, -0.14); await __y(); tank.castShadow = true; await __y(); bike.add(tank);
  await __y(); const stripe = mk(tankG, M.red, 'tank-stripe'); await __y(); stripe.scale.set(0.183, 0.048, 0.25); await __y(); stripe.position.set(0, 0.995, -0.12); await __y(); bike.add(stripe);
  await __y(); const fcap = mk(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 20), M.chrome, 'fuel-cap'); await __y(); fcap.position.set(0, 1.13, -0.2); await __y(); bike.add(fcap);
  await __y(); [-1, 1].forEach(sd => { const b = mk(new THREE.CircleGeometry(0.034, 20), M.chrome, 'tank-badge'); b.position.set(sd * 0.176, 0.99, -0.17); b.rotation.y = sd * Math.PI / 2; bike.add(b); });
  await __y(); const seat = mk(new THREE.CapsuleGeometry(0.12, 0.42, 8, 20), M.seat, 'seat'); await __y(); seat.rotation.x = Math.PI / 2 - 0.06; await __y(); seat.scale.set(1.08, 1, 0.42); await __y(); seat.position.set(0, 0.95, 0.38); await __y(); bike.add(seat);
  await __y(); const pan = mk(new THREE.BoxGeometry(0.22, 0.03, 0.56), M.engine, 'seat-pan'); await __y(); pan.position.set(0, 0.9, 0.38); await __y(); bike.add(pan);
  await __y(); const eng = mk(new THREE.CapsuleGeometry(0.15, 0.1, 8, 20), M.engine, 'engine'); await __y(); eng.rotation.z = Math.PI / 2; await __y(); eng.scale.set(1, 0.65, 1.25); await __y(); eng.position.set(0, 0.52, -0.06); await __y(); eng.castShadow = true; await __y(); bike.add(eng);
  await __y(); const gbox = mk(new THREE.BoxGeometry(0.22, 0.2, 0.2), M.engine, 'gearbox'); await __y(); gbox.position.set(0, 0.5, 0.16); await __y(); bike.add(gbox);
  await __y(); const barrel = mk(new THREE.CylinderGeometry(0.085, 0.095, 0.24, 24), M.engine, 'cylinder'); await __y(); barrel.position.set(0, 0.74, -0.16); await __y(); barrel.rotation.x = -0.35; await __y(); bike.add(barrel);
  await __y(); { const parts = []; for (let k = 0; k < 7; k++) parts.push([new THREE.CylinderGeometry(0.13, 0.13, 0.012, 24), M4(0, -0.1 + k * 0.032, 0)]); const fins = mk(mergeG(parts), M.engine, 'cyl-fins'); fins.position.copy(barrel.position); fins.rotation.x = -0.35; bike.add(fins); }
  await __y(); const headC = mk(new THREE.BoxGeometry(0.2, 0.08, 0.2), M.chrome, 'cyl-head'); await __y(); headC.position.set(0, 0.88, -0.21); await __y(); headC.rotation.x = -0.35; await __y(); bike.add(headC);
  await __y(); [-1, 1].forEach(sd => { const cv = mk(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 28), M.chrome, 'engine-cover'); cv.rotation.z = Math.PI / 2; cv.position.set(sd * 0.14, 0.52, -0.04); bike.add(cv); });
  await __y(); const panel = mk(new THREE.CapsuleGeometry(0.08, 0.1, 6, 12), M.gloss, 'side-panel'); await __y(); panel.rotation.x = Math.PI / 2; await __y(); panel.scale.set(1.3, 1, 1.1); await __y(); panel.position.set(0, 0.74, 0.22); await __y(); bike.add(panel);
  await __y(); { const hp = new THREE.CatmullRomCurve3([V(0.05, 0.8, -0.3), V(0.12, 0.62, -0.36), V(0.16, 0.4, -0.22), V(0.17, 0.36, 0.1), V(0.17, 0.4, 0.4)]); bike.add(mk(new THREE.TubeGeometry(hp, 40, 0.028, 12), M.chrome, 'header-pipe')); }
  await __y(); const muff = mk(new THREE.CylinderGeometry(0.058, 0.05, 0.5, 24), M.chrome, 'exhaust'); await __y(); muff.rotation.x = Math.PI / 2 - 0.12; await __y(); muff.position.set(0.17, 0.44, 0.62); await __y(); bike.add(muff);
  await __y(); const muffEnd = mk(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16), M.engine, 'exhaust-tip'); await __y(); muffEnd.rotation.x = Math.PI / 2 - 0.12; await __y(); muffEnd.position.set(0.17, 0.47, 0.875); await __y(); bike.add(muffEnd);
  await __y(); const hl = mk(new THREE.CylinderGeometry(0.105, 0.09, 0.13, 32), M.chrome, 'headlight-bucket'); await __y(); hl.rotation.x = Math.PI / 2; await __y(); hl.position.set(0, 0.95, -0.66); await __y(); bike.add(hl);
  await __y(); const hring = mk(new THREE.TorusGeometry(0.1, 0.012, 8, 36), M.chrome, 'headlight-ring'); await __y(); hring.position.set(0, 0.95, -0.726); await __y(); bike.add(hring);
  await __y(); const lens = mk(new THREE.SphereGeometry(0.19, 32, 6, 0, Math.PI * 2, 0, 0.52), lamp, 'headlight-lens'); await __y(); lens.rotation.x = -Math.PI / 2; await __y(); lens.position.set(0, 0.95, -0.561); await __y(); bike.add(lens);
  await __y(); const speedo = mk(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 24), M.chrome, 'speedo'); await __y(); speedo.rotation.x = Math.PI / 2 - 0.7; await __y(); speedo.position.set(0.1, 1.07, -0.53); await __y(); bike.add(speedo);
  await __y(); [-0.17, 0.17].forEach(x => { const ind = mk(new THREE.SphereGeometry(0.03, 14, 10), amber, 'indicator'); ind.scale.set(1, 1, 1.3); ind.position.set(x, 0.92, -0.62); bike.add(ind); tube(V(x * 0.55, 0.93, -0.6), V(x, 0.92, -0.62), 0.008, M.chrome, 'indicator-stem'); });
  await __y(); { const hb = new THREE.CatmullRomCurve3([V(-0.38, 1.1, -0.42), V(-0.2, 1.1, -0.44), V(0, 1.08, -0.46), V(0.2, 1.1, -0.44), V(0.38, 1.1, -0.42)]); bike.add(mk(new THREE.TubeGeometry(hb, 40, 0.013, 10), M.chrome, 'handlebar')); }
  await __y(); const mirrorG = std('#9fb2c8', { metalness: 1, roughness: 0.05, flatShading: false });
  await __y(); [-0.36, 0.36].forEach(x => { tube(V(x * 0.8, 1.1, -0.425), V(x * 1.05, 1.1, -0.42), 0.024, M.rubber, 'grip'); tube(V(x * 0.72, 1.12, -0.44), V(x * 0.98, 1.1, -0.5), 0.007, M.chrome, 'lever');
    tube(V(x * 0.7, 1.1, -0.42), V(x * 0.8, 1.35, -0.38), 0.008, M.chrome, 'mirror-stem'); const mi = mk(new THREE.CylinderGeometry(0.05, 0.05, 0.015, 24), M.chrome, 'mirror'); mi.rotation.x = Math.PI / 2; mi.position.set(x * 0.8, 1.37, -0.38); bike.add(mi);
    const mg = mk(new THREE.CircleGeometry(0.043, 24), mirrorG, 'mirror-glass'); mg.position.set(x * 0.8, 1.37, -0.371); bike.add(mg); });
  await __y(); const wtc = mk(new THREE.CylinderGeometry(0.026, 0.026, 0.014, 18), M.gloss, 'pixel-watch'); await __y(); wtc.rotation.x = Math.PI / 2 - 0.6; await __y(); wtc.position.set(0, 1.14, -0.42); await __y(); bike.add(wtc);
  await __y(); const wsc = mk(new THREE.CircleGeometry(0.021, 18), screen, 'watch-screen'); await __y(); wsc.position.set(0, 1.146, -0.414); await __y(); wsc.rotation.x = -0.6 - Math.PI / 2 + Math.PI / 2; await __y(); wsc.rotation.x = -0.97; await __y(); bike.add(wsc);
  await __y(); const tl = mk(new THREE.CylinderGeometry(0.05, 0.05, 0.035, 20), tail, 'taillight'); await __y(); tl.rotation.x = Math.PI / 2; await __y(); tl.position.set(0, 0.8, 0.98); await __y(); bike.add(tl);
  await __y(); const plate = mk(new THREE.BoxGeometry(0.14, 0.09, 0.015), std('#e9e4da'), 'license-plate'); await __y(); plate.position.set(0, 0.72, 1.0); await __y(); plate.rotation.x = -0.25; await __y(); bike.add(plate);
  await __y(); { const gr = new THREE.CatmullRomCurve3([V(-0.12, 0.92, 0.5), V(-0.13, 0.95, 0.72), V(0, 0.96, 0.82), V(0.13, 0.95, 0.72), V(0.12, 0.92, 0.5)]); bike.add(mk(new THREE.TubeGeometry(gr, 30, 0.012, 8), M.chrome, 'grab-rail')); }
  await __y(); [-0.13, 0.13].forEach(x => { const ind = mk(new THREE.SphereGeometry(0.026, 12, 8), amber, 'indicator-rear'); ind.position.set(x, 0.82, 0.94); bike.add(ind); });
  await __y(); const caliper = mk(new THREE.BoxGeometry(0.04, 0.07, 0.09), M.red, 'brake-caliper'); await __y(); caliper.position.set(-0.1, 0.3, -0.64); await __y(); bike.add(caliper);
  await __y(); { const parts = []; for (let i = 0; i < 44; i++) { const a = i / 44 * Math.PI * 2; parts.push([new THREE.BoxGeometry(0.018, 0.012, 0.022), M4(0.15, 0.36 + Math.sin(a) * 0.12, 0.35 + Math.cos(a) * 0.34, -a)]); } bike.add(mk(mergeG(parts), M.chrome, 'chain')); }
  await __y(); const fspr = mk(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 20), M.chrome, 'front-sprocket'); await __y(); fspr.rotation.z = Math.PI / 2; await __y(); fspr.position.set(0.15, 0.4, 0.0); await __y(); bike.add(fspr);
  await __y(); { const plaidTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#1d2a4a'; g.fillRect(0, 0, 128, 128);
      g.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 128; i += 4) g.fillRect(0, i, 128, 1);
      g.fillStyle = 'rgba(92,124,190,.55)'; g.fillRect(0, 30, 128, 2); g.fillRect(30, 0, 2, 128); g.fillStyle = 'rgba(92,124,190,.28)'; g.fillRect(0, 94, 128, 1); g.fillRect(94, 0, 1, 128);
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; })();
    const paisleyTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#1f5f6b'; g.fillRect(0, 0, 128, 128);
      const cols = ['#c8612d', '#e7a34a', '#7a2f3a', '#3d8fa0', '#f1d9a8']; let sd = 7; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 34; i++) { g.fillStyle = cols[i % cols.length]; g.beginPath(); g.ellipse(r() * 128, r() * 128, 4 + r() * 10, 2 + r() * 5, r() * 3, 0, Math.PI * 2); g.fill(); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const sm = (c, o = {}) => std(c, { flatShading: false, ...o }); const suit = sm('#ffffff', { map: plaidTex, roughness: 0.78 }), lining = sm('#ffffff', { map: paisleyTex, roughness: 0.5, side: THREE.BackSide }), shirt = sm('#eef0f2', { roughness: 0.7 }), tie = sm('#1a2238', { roughness: 0.55 }),
      chrome = new THREE.MeshPhysicalMaterial({ color: '#e4e8ee', metalness: lp ? 0.75 : 1, roughness: lp ? 0.22 : 0.06, clearcoat: 1, clearcoatRoughness: 0.04 }),
      mirror = new THREE.MeshPhysicalMaterial({ color: '#b9c2cf', metalness: 1, roughness: 0.02, clearcoat: 1, iridescence: lp ? 0 : 0.35, iridescenceIOR: 1.6 }),
      gloss = new THREE.MeshPhysicalMaterial({ color: '#0b0b0e', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 }), glove = sm('#111013', { roughness: 0.42, metalness: 0.05 }),
      shoe = new THREE.MeshPhysicalMaterial({ color: '#08080a', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.03 });
    const rider = new THREE.Group(); rider.name = 'rider'; bike.add(rider);
    const put = (geo, mat, name, p, rx = 0, par = rider) => { const m = mk(geo, mat, name); m.position.copy(p); m.rotation.x = rx; par.add(m); return m; };
    const limb = (a, b, r, mat, name, r2 = r * 0.85) => { const d = new THREE.Vector3().subVectors(b, a); const m = mk(new THREE.CylinderGeometry(r2, r, d.length(), 20), mat, name); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); rider.add(m); return m; };
    const ball = (r, mat, name, p) => put(new THREE.SphereGeometry(r, 22, 16), mat, name, p);
    put(new THREE.CapsuleGeometry(0.15, 0.1, 6, 16), suit, 'hips', V(0, 1.03, 0.3), Math.PI / 2).scale.set(1.1, 1, 0.9);
    const torso = put(new THREE.CapsuleGeometry(0.16, 0.28, 8, 20), suit, 'torso', V(0, 1.3, 0.15), -0.55); torso.scale.set(1.18, 1, 0.74);
    put(new THREE.PlaneGeometry(0.13, 0.26), shirt, 'shirt-front', V(0, 0.08, -0.162), 0, torso).scale.set(1 / 1.18, 1, 1);
    const tieM = put(new THREE.BoxGeometry(0.038, 0.24, 0.006), tie, 'tie', V(0, 0.06, -0.166), 0, torso); tieM.scale.set(1 / 1.18, 1, 1 / 0.74);
    put(new THREE.BoxGeometry(0.018, 0.004, 0.008), M.chrome, 'tie-bar', V(0, 0.08, -0.172), 0, torso);
    [-1, 1].forEach(sd => { const lap = put(new THREE.BoxGeometry(0.05, 0.25, 0.012), suit, 'lapel', V(sd * 0.078, 0.07, -0.168), 0, torso); lap.rotation.z = sd * 0.28; lap.scale.x = 1 / 1.18;
      const ln = put(new THREE.PlaneGeometry(0.03, 0.2), lining, 'lining-flash', V(sd * 0.1, 0.02, -0.164), 0, torso); ln.rotation.y = sd * 0.5; ln.scale.x = 1 / 1.18; });
    const hem = put(new THREE.CylinderGeometry(0.19, 0.235, 0.2, 24, 1, true), suit, 'jacket-hem', V(0, 1.1, 0.24), -0.35); hem.scale.z = 0.8;
    const hemIn = put(new THREE.CylinderGeometry(0.187, 0.232, 0.2, 24, 1, true), lining, 'jacket-lining', V(0, 1.1, 0.24), -0.35); hemIn.scale.z = 0.8;
    put(new THREE.CylinderGeometry(0.06, 0.068, 0.07, 16), shirt, 'collar', V(0, 1.535, 0.02), -0.3);
    const hel = ball(0.155, chrome, 'helmet', V(0, 1.665, -0.02)); hel.scale.set(0.98, 1.02, 1.14);
    const vis = put(new THREE.SphereGeometry(0.158, 28, 12, Math.PI * 1.5 - 0.95, 1.9, 1.02, 0.62), mirror, 'visor', V(0, 1.665, -0.02)); vis.scale.set(0.98, 1.02, 1.14);
    const chin = put(new THREE.SphereGeometry(0.157, 24, 10, Math.PI * 1.5 - 1.05, 2.1, 1.66, 0.72), gloss, 'chin-bar', V(0, 1.665, -0.02)); chin.scale.set(0.98, 1.02, 1.14);
    put(new THREE.BoxGeometry(0.12, 0.022, 0.07), gloss, 'helmet-spoiler', V(0, 1.79, 0.13), -0.35);
    [-1, 1].forEach(sd => { const pod = put(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 14), gloss, 'visor-pivot', V(sd * 0.152, 1.66, -0.06)); pod.rotation.z = Math.PI / 2; });
    [-1, 1].forEach(s => { const sh = V(s * 0.2, 1.47, 0.06), el = V(s * 0.28, 1.27, -0.18), wr = V(s * 0.335, 1.13, -0.37), gr = V(s * 0.34, 1.12, -0.41);
      ball(0.068, suit, 'shoulder', sh); limb(sh, el, 0.062, suit, 'upper-arm', 0.056); ball(0.056, suit, 'elbow', el); limb(el, wr, 0.056, suit, 'forearm', 0.05);
      limb(V(s * 0.333, 1.135, -0.36), V(s * 0.336, 1.128, -0.385), 0.047, shirt, 'shirt-cuff');
      const gl = ball(0.048, glove, 'glove', gr); gl.scale.set(0.95, 0.8, 1.35);
      const hp = V(s * 0.11, 1.02, 0.28), kn = V(s * 0.2, 0.9, -0.12), an = V(s * 0.19, 0.5, 0.0);
      limb(hp, kn, 0.082, suit, 'thigh', 0.068); ball(0.068, suit, 'knee', kn); limb(kn, an, 0.066, suit, 'trouser', 0.06);
      const sho = put(new THREE.CapsuleGeometry(0.05, 0.13, 6, 14), shoe, 'shoe', V(s * 0.19, 0.44, -0.05), Math.PI / 2); sho.scale.set(0.95, 1, 0.72);
      const peg = mk(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 6), M.chrome, 'footpeg'); peg.rotation.z = Math.PI / 2; peg.position.set(s * 0.17, 0.38, -0.02); bike.add(peg); put(new THREE.BoxGeometry(0.1, 0.025, 0.25), gloss, 'boot-sole', V(s * 0.19, 0.4, -0.06)); const knk = ball(0.03, glove, 'knuckles', V(s * 0.345, 1.145, -0.44)); knk.scale.set(1.4, 0.7, 1); });
    const hs2 = put(new THREE.TorusGeometry(0.153, 0.009, 6, 40, Math.PI), gloss, 'helmet-stripe', V(0, 1.665, -0.02)); hs2.rotation.y = Math.PI / 2; hs2.scale.set(1.14, 1.02, 0.98); }
  await __y(); bike.traverse(o => { if (o.isMesh) o.castShadow = !lp; });
  await __y(); const bikeRoot = new THREE.Group(); await __y(); bikeRoot.add(bike); await __y(); scene.add(bikeRoot);
  await __y(); const head = new THREE.SpotLight('#eaf2ff', 0, 60, 0.42, 0.6, 1.1); await __y(); head.position.set(0, 0.95, -0.75); await __y(); const headT = new THREE.Object3D(); await __y(); headT.position.set(0, 0, -14); await __y(); bike.add(head, headT); await __y(); head.target = headT;
  await __y(); const headGlow = glowSprite('#dff0ff', 1.3, 0.8); await __y(); headGlow.position.set(0, 0.95, -0.8); await __y(); bike.add(headGlow);
  await __y(); const poolTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 84, 2, 32, 84, 62); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.42)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  await __y(); const pool = mk(new THREE.PlaneGeometry(3.4, 8), new THREE.MeshBasicMaterial({ map: poolTex, color: '#e6f0ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6 }), 'headlight-pool'); await __y(); pool.rotation.x = -Math.PI / 2; await __y(); pool.position.set(0, 0.07, -5.6); await __y(); pool.renderOrder = 3; await __y(); bikeRoot.add(pool);
  await __y(); const buddies = []; await __y(); if (!lp && !opts.mobile) for (let k = 0; k < 2; k++) { const l = new THREE.PointLight('#d6ff8a', 0, 7, 2); const sp = glowSprite('#e4ff8a', 0.45, 0); scene.add(l, sp); buddies.push({ l, s: sp, ph: k * 2.7 + 0.5 }); }
  await __y(); const star = glowSprite('#eef4ff', 1, 0); await __y(); star.scale.set(26, 0.55, 1); await __y(); star.visible = false; await __y(); scene.add(star); await __y(); const starA = new THREE.Vector3(), starR = new THREE.Vector3(), starBase = new THREE.Vector3();
  await __y(); const tailGlow = glowSprite('#ff3030', 0.6, 0.7); await __y(); tailGlow.position.set(0, 0.8, 1.0); await __y(); bike.add(tailGlow);
  await __y(); const beamU = { time: { value: 0 }, opacity: { value: 0 } };
  await __y(); const beamMat = new THREE.ShaderMaterial({ uniforms: beamU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
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
  await __y(); const beam = mk(new THREE.ConeGeometry(0.85, 3.4, 24, 1, true), beamMat, 'headlight-beam'); await __y(); beam.rotation.x = -Math.PI / 2; await __y(); beam.position.set(0, 0.95, -2.3); await __y(); bike.add(beam);
  await __y(); const watchGlow = glowSprite('#6ff0ff', 0.18, 0.9); await __y(); watchGlow.position.set(0, 1.16, -0.41); await __y(); bike.add(watchGlow);

  // MujaSauros — pillion dino guide
  await __y(); const dnSkin = std('#4bc97a', { roughness: 0.4, metalness: 0.05 }), dnBelly = std('#fff3c4', { roughness: 0.5 }), dnDark = std('#16321f', { roughness: 0.4 }), dnRed = std('#ff5f6d', { roughness: 0.4 }), dnHorn = new THREE.MeshPhysicalMaterial({ color: '#ffd88c', flatShading: true, roughness: 0.22, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  await __y(); const dino = new THREE.Group(); await __y(); dino.name = 'mujasauros';
  await __y(); const dBody = mk(new THREE.SphereGeometry(0.105, 18, 14), dnSkin, 'dino-body'); await __y(); dBody.scale.set(1.15, 0.92, 1.35); await __y(); dBody.position.set(0, 0.135, 0.02); await __y(); dino.add(dBody);
  await __y(); const dBelly = mk(new THREE.SphereGeometry(0.08, 16, 12), dnBelly, 'dino-belly'); await __y(); dBelly.scale.set(1, 0.85, 1.1); await __y(); dBelly.position.set(0, 0.075, 0.03); await __y(); dino.add(dBelly);
  await __y(); const dHead = new THREE.Group(); await __y(); dHead.name = 'dino-head'; await __y(); dHead.position.set(0, 0.225, -0.14); await __y(); dino.add(dHead);
  await __y(); const dSkull = mk(new THREE.SphereGeometry(0.09, 18, 16), dnSkin, 'dino-skull'); await __y(); dSkull.scale.set(1.05, 0.95, 1); await __y(); dHead.add(dSkull);
  await __y(); const dSnout = mk(new THREE.BoxGeometry(0.09, 0.06, 0.05, 2, 2, 2), dnSkin, 'dino-snout'); await __y(); dSnout.position.set(0, -0.02, -0.085); await __y(); dHead.add(dSnout);
  await __y(); const dJaw = new THREE.Group(); await __y(); dJaw.name = 'dino-jaw'; await __y(); dJaw.position.set(0, -0.05, -0.07); await __y(); dHead.add(dJaw);
  await __y(); const dJawMesh = mk(new THREE.BoxGeometry(0.075, 0.03, 0.045), dnBelly, 'dino-jaw-mesh'); await __y(); dJawMesh.position.set(0, -0.008, -0.02); await __y(); dJaw.add(dJawMesh);
  await __y(); const dTongue = mk(new THREE.CircleGeometry(0.018, 8), dnRed, 'dino-tongue'); await __y(); dTongue.position.set(0, -0.003, -0.045); await __y(); dTongue.rotation.x = -Math.PI / 2; await __y(); dJaw.add(dTongue);
  await __y(); const dEars = [], dEyes = []; await __y(); [-1, 1].forEach(s => {
    const eye = mk(new THREE.SphereGeometry(0.021, 10, 8), dnDark, 'dino-eye'); eye.position.set(s * 0.062, 0.02, -0.055); dHead.add(eye); dEyes.push(eye);
    const shine = mk(new THREE.SphereGeometry(0.006, 6, 6), std('#ffffff'), 'dino-eye-shine'); shine.position.set(s * 0.066, 0.026, -0.066); dHead.add(shine);
    const ear = mk(new THREE.ConeGeometry(0.022, 0.04, 6), dnSkin, 'dino-ear'); ear.position.set(s * 0.075, 0.075, 0.02); ear.rotation.z = s * 0.4; dHead.add(ear); dEars.push(ear); });
  await __y(); const dBrowHorns = []; await __y(); [-1, 1].forEach(s => { const h = mk(new THREE.ConeGeometry(0.02, 0.09, 7), dnHorn, 'dino-brow-horn'); h.position.set(s * 0.07, 0.08, -0.05); h.rotation.z = s * -0.45; h.rotation.x = -0.3; dHead.add(h); dBrowHorns.push(h); });
  await __y(); const dNoseHorn = mk(new THREE.ConeGeometry(0.015, 0.04, 6), dnHorn, 'dino-nose-horn'); await __y(); dNoseHorn.position.set(0, -0.01, -0.11); await __y(); dNoseHorn.rotation.x = -1.9; await __y(); dHead.add(dNoseHorn);
  await __y(); const dFrill = mk(new THREE.CylinderGeometry(0.1, 0.11, 0.025, 12, 1, true, 0, Math.PI), dnSkin, 'dino-frill'); await __y(); dFrill.rotation.y = Math.PI; await __y(); dFrill.position.set(0, 0.09, 0.03); await __y(); dHead.add(dFrill);
  await __y(); const dSpikes = []; await __y(); for (let i = 0; i < 5; i++) { const a = (i / 4 - 0.5) * Math.PI * 0.85; const sp = mk(new THREE.ConeGeometry(0.015, 0.035, 5), dnHorn, 'dino-spike'); sp.position.set(Math.sin(a) * 0.105, 0.115 + Math.cos(a * 0.5) * 0.01, 0.03 + Math.cos(a) * 0.03); sp.rotation.x = 0.5; sp.rotation.z = -a; dHead.add(sp); dSpikes.push(sp); }
  await __y(); const dLegs = []; await __y(); [[-0.075, -1], [0.075, -1], [-0.08, 1], [0.08, 1]].forEach(([x, zs]) => { const leg = mk(new THREE.CapsuleGeometry(0.028, 0.05, 6, 10), dnSkin, 'dino-leg'); leg.position.set(x, 0.028, zs * 0.09); dino.add(leg); dLegs.push({ m: leg, side: zs }); });
  await __y(); const dTail = mk(new THREE.ConeGeometry(0.045, 0.11, 8), dnSkin, 'dino-tail'); await __y(); dTail.rotation.x = Math.PI / 2 + 0.3; await __y(); dTail.position.set(0, 0.12, 0.19); await __y(); dino.add(dTail);
  await __y(); for (let i = 0; i < 6; i++) { const p = i / 5, sp = mk(new THREE.ConeGeometry(0.013, 0.032, 5), dnHorn, 'dino-spine-spike'); sp.position.set(0, 0.2 - p * 0.02, -0.1 + p * 0.32); sp.rotation.x = -0.2; dino.add(sp); }
  await __y(); dLegs && [-0.075, 0.075, -0.08, 0.08].forEach((x, i) => { const claw = mk(new THREE.ConeGeometry(0.01, 0.022, 5), dnHorn, 'dino-claw'); claw.position.set(x, 0.008, (i < 2 ? -1 : 1) * 0.09 - 0.03); claw.rotation.x = Math.PI / 2; dino.add(claw); });
  await __y(); const dinoHit = mk(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), 'dino-hit'); await __y(); dinoHit.position.set(0, 0.18, -0.04); await __y(); dino.add(dinoHit);
  // Speech bubble above the head — replaces the old watch-face dialogue
  await __y(); const dBubbleCanvas = document.createElement('canvas'); await __y(); const BS = 3; await __y(); dBubbleCanvas.width = 480 * BS; await __y(); dBubbleCanvas.height = 240 * BS;
  await __y(); const dBubbleTex = new THREE.CanvasTexture(dBubbleCanvas); await __y(); dBubbleTex.colorSpace = THREE.SRGBColorSpace; await __y(); dBubbleTex.anisotropy = renderer.capabilities.getMaxAnisotropy(); await __y(); dBubbleTex.minFilter = THREE.LinearMipmapLinearFilter;
  await __y(); let dinoBubbleT = 0, dinoBubbleOp = 0;
  await __y(); const dBubbleSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: dBubbleTex, transparent: true, depthWrite: false, depthTest: false, opacity: 0, fog: false, toneMapped: false }));
  await __y(); dBubbleSprite.name = 'dino-bubble'; await __y(); dBubbleSprite.renderOrder = 999; await __y(); dBubbleSprite.center.set(0.5, 0); await __y(); dBubbleSprite.position.set(0, 0.43, -0.13); await __y(); dino.add(dBubbleSprite);
  await __y(); const drawDinoBubble = text => {
    const cx = dBubbleCanvas.getContext('2d'), W = 480; cx.setTransform(BS, 0, 0, BS, 0, 0);
    const words = text.split(' '), lines = []; let cur = '';
    words.forEach(w => { if ((cur + ' ' + w).trim().length > 30) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; }); if (cur.trim()) lines.push(cur.trim());
    const padX = 24, padTop = 44, lineH = 34, tailH = 18, boxW = W - 2, boxH = padTop + lines.length * lineH + 18, r = 18;
    cx.clearRect(0, 0, W, 240); cx.save(); cx.translate(1, 0);
    cx.beginPath();
    cx.moveTo(r, 4); cx.lineTo(boxW - r, 4); cx.quadraticCurveTo(boxW, 4, boxW, 4 + r); cx.lineTo(boxW, boxH - r);
    cx.quadraticCurveTo(boxW, boxH, boxW - r, boxH); cx.lineTo(boxW / 2 + 14, boxH); cx.lineTo(boxW / 2, boxH + tailH); cx.lineTo(boxW / 2 - 14, boxH);
    cx.lineTo(r, boxH); cx.quadraticCurveTo(0, boxH, 0, boxH - r); cx.lineTo(0, 4 + r); cx.quadraticCurveTo(0, 4, r, 4); cx.closePath();
    cx.fillStyle = '#0b0f24'; cx.fill(); cx.lineWidth = 1.5; cx.strokeStyle = '#9fe06e'; cx.stroke();
    cx.fillStyle = '#9fe06e'; cx.font = '600 15px "JetBrains Mono", monospace'; cx.textBaseline = 'alphabetic'; if ('letterSpacing' in cx) cx.letterSpacing = '2px'; cx.fillText('MUJASAUROS', padX, 32); if ('letterSpacing' in cx) cx.letterSpacing = '0px';
    cx.fillStyle = '#ffffff'; cx.font = '500 24px system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';
    lines.forEach((l, i) => cx.fillText(l, padX, padTop + 26 + i * lineH)); cx.restore();
    dBubbleTex.needsUpdate = true;
    dBubbleSprite.scale.set(1.35, 1.35 * (boxH + tailH) / boxW, 1);
  };
  await __y(); const setDinoBubble = text => { drawDinoBubble(text); dinoBubbleT = 6.5; };
  await __y(); bike.add(dino); await __y(); dino.position.set(0, 0.95, 0.82); await __y(); dino.scale.setScalar(1.6);
  await __y(); dino.traverse(o => { o.frustumCulled = false; });
  await __y(); const rider = bike.getObjectByName('rider');
  await __y(); const logSeat = new THREE.Vector3(FIRE.x - 0.4, H(FIRE.x - 0.4, FIRE.z + 2.8) - 0.5, FIRE.z + 2.8);
  await __y(); const logSeatYaw = Math.atan2(FIRE.x - logSeat.x, FIRE.z - logSeat.z) + Math.PI;
  await __y(); let riderState = 'onBike', riderT = 0; await __y(); const riderFrom = new THREE.Vector3();
  await __y(); const dinoSeatPos = new THREE.Vector3(0, 0.95, 0.82), dinoSeatRot = new THREE.Euler(0, 0, 0);
  await __y(); let dinoState = 'ride', dinoBreath = 0, dinoStand = 0, dinoAway = new THREE.Vector3(), dinoTarget = new THREE.Vector3(), dinoJumpT = 0, dinoRunPhase = 0, dinoSnapAt = 3 + Math.random() * 4, dinoSnapT = -1, dinoLookY = 0, dinoMood = 'curious', dinoJumpFrom = new THREE.Vector3(), dinoJumpTo = new THREE.Vector3(), dinoBaseY = 0, dinoReactT = -1, dinoFleeT = 0, dinoStuckT = 0, dinoSeekLake = false, dinoNoteCool = Object.create(null), curNight = 0, dinoCheckInT = 7, dinoSeekBike = false, dinoLingerT = 0, dinoChaseFF = false, dinoWagBoost = 0, dinoLandT = 0;
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
  await __y(); let dinoRoamT = 0, rideStarted = false, holdActive = false, holdT = 0;

  // Wildlife — deer grazing in the forest, birds circling above the canopy
  await __y(); const deerMat = std('#8a6c44'), deerBelly = std('#d8cdb0'), antlerMat = std('#4a3826');
  await __y(); const deer = [];
  await __y(); for (let k = 0; k < 8; k++) { let x = 0, z = 0, ok = false; for (let tries = 0; tries < 20; tries++) { z = lerp(zW(0.12), zW(0.9), rnd()); x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (14 + rnd() * 55); if (okSpot(x, z, 9)) { ok = true; break; } } if (!ok) continue;
    const y = H(x, z); const g = new THREE.Group(); g.name = 'deer'; g.position.set(x, y, z); g.rotation.y = rnd() * 6;
    const body = mk(new THREE.CapsuleGeometry(0.22, 0.5, 4, 8), deerMat, 'deer-body'); body.rotation.z = Math.PI / 2; body.position.set(0, 0.5, 0); body.castShadow = !lp; g.add(body);
    const neck = mk(new THREE.CylinderGeometry(0.08, 0.1, 0.35, 6), deerMat, 'deer-neck'); neck.position.set(0, 0.72, -0.32); neck.rotation.x = 0.6; g.add(neck);
    const head = mk(new THREE.BoxGeometry(0.14, 0.16, 0.24), deerMat, 'deer-head'); head.position.set(0, 0.92, -0.5); g.add(head);
    const legs = []; [[-0.11, -0.18], [0.11, -0.18], [-0.11, 0.18], [0.11, 0.18]].forEach(([lx, lz]) => { const leg = mk(new THREE.CylinderGeometry(0.035, 0.045, 0.42, 5), deerMat, 'deer-leg'); leg.position.set(lx, 0.24, lz); g.add(leg); legs.push(leg); });
    if (rnd() < 0.5) [-1, 1].forEach(s => { const a = mk(new THREE.ConeGeometry(0.02, 0.16, 4), antlerMat, 'deer-antler'); a.position.set(s * 0.05, 1.02, -0.52); a.rotation.x = -0.3; a.rotation.z = s * 0.3; g.add(a); });
    scene.add(g); deer.push({ g, legs, head, state: 'graze', t: rnd() * 4, phase: rnd() * 6, target: new THREE.Vector3() }); }
  await __y(); const birdMat = std('#2e2c30'); await __y(); const birds = [];
  await __y(); for (let k = 0; k < 22; k++) { const g = new THREE.Group(); g.name = 'bird';
    const body = mk(new THREE.ConeGeometry(0.04, 0.14, 4), birdMat, 'bird-body'); body.rotation.x = Math.PI / 2; g.add(body);
    const wL = mk(new THREE.PlaneGeometry(0.16, 0.05), birdMat, 'bird-wing'); wL.position.set(-0.08, 0, 0); g.add(wL);
    const wR = mk(new THREE.PlaneGeometry(0.16, 0.05), birdMat, 'bird-wing'); wR.position.set(0.08, 0, 0); g.add(wR);
    scene.add(g); const cz = lerp(zW(0.1), zW(0.85), rnd()), cx = roadX(cz) + (rnd() - 0.5) * 90;
    birds.push({ g, wL, wR, cx, cz, r: 6 + rnd() * 10, h: 16 + rnd() * 10 + H(cx, cz), ph: rnd() * 6, spd: 0.3 + rnd() * 0.3, flap: rnd() * 10, scatter: 0 }); }

  // Butterflies — small fluttering accents near forest clearings
  await __y(); const flyMat = new THREE.MeshBasicMaterial({ color: '#f2b56b', side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
  await __y(); const BF = lp ? 12 : 26, flies2 = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.09, 0.06), flyMat, BF); await __y(); flies2.name = 'butterflies'; await __y(); flies2.frustumCulled = false;
  await __y(); const flyDat = []; await __y(); const BFC = ['#f2b56b', '#f6ecd8', '#9fe06e', '#e88a5a'].map(c => new THREE.Color(c));
  await __y(); for (let k = 0; k < BF; k++) { const z = lerp(zW(0.12), zW(0.88), rnd()), x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (8 + rnd() * 40), y = H(x, z) + 0.6 + rnd() * 0.8;
    flies2.setColorAt(k, BFC[k % BFC.length]); flyDat.push({ x0: x, y0: y, z0: z, ph: rnd() * 10, spd: 0.6 + rnd() * 0.8 }); }
  await __y(); scene.add(flies2);

  // Night owls — perched forest sentries, active after dark
  await __y(); const owlMat = std('#5a4a3a'), owlBelly = std('#c9a878'), owlEye = new THREE.MeshBasicMaterial({ color: '#ffd35a' });
  await __y(); const owls = [];
  await __y(); for (let k = 0; k < 3; k++) { let x = 0, z = 0; for (let tries = 0; tries < 20; tries++) { z = lerp(zW(0.15), zW(0.8), rnd()); x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (10 + rnd() * 30); if (okSpot(x, z, 6)) break; }
    const y = H(x, z); const g = new THREE.Group(); g.name = 'owl'; g.position.set(x, y + 1.4, z);
    const body = mk(new THREE.SphereGeometry(0.13, 10, 8), owlMat, 'owl-body'); body.scale.set(1, 1.25, 0.9); g.add(body);
    const belly = mk(new THREE.SphereGeometry(0.09, 8, 6), owlBelly, 'owl-belly'); belly.position.set(0, -0.02, 0.09); g.add(belly);
    [-1, 1].forEach(s => { const ear = mk(new THREE.ConeGeometry(0.025, 0.06, 5), owlMat, 'owl-ear'); ear.position.set(s * 0.06, 0.19, 0.02); g.add(ear);
      const eye = mk(new THREE.SphereGeometry(0.028, 8, 6), owlEye, 'owl-eye'); eye.position.set(s * 0.05, 0.08, 0.11); g.add(eye); });
    const beak = mk(new THREE.ConeGeometry(0.02, 0.04, 5), std('#e8a83a'), 'owl-beak'); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.03, 0.13); g.add(beak);
    scene.add(g); owls.push({ g, ph: rnd() * 10, blinkAt: 2 + rnd() * 4 }); }

  // Lake fish jumps
  await __y(); const fishMat = std('#b7c4cf', { roughness: 0.3, metalness: 0.2 });
  await __y(); const fishJump = mk(new THREE.CapsuleGeometry(0.05, 0.16, 3, 6), fishMat, 'fish'); await __y(); fishJump.visible = false; await __y(); scene.add(fishJump);
  await __y(); let fishT = 4 + Math.random() * 6, fishJumping = 0, fishFrom = new THREE.Vector3(), fishTo = new THREE.Vector3();
  await __y(); const fishSplash = glowSprite('#dff4ff', 1.6, 0); await __y(); scene.add(fishSplash);
  await __y(); const rfBody = std('#8fa6b6', { roughness: 0.3, metalness: 0.3 }), rfFin = std('#5f7482', { roughness: 0.5 }), rFish = [];
  await __y(); for (let k = 0; k < 4; k++) { const g = new THREE.Group(); g.name = 'river-fish';
    const body = mk(new THREE.CapsuleGeometry(0.07, 0.26, 4, 10).rotateX(Math.PI / 2), rfBody, 'river-fish-body'); body.scale.set(0.8, 1, 1); g.add(body);
    const tail = mk(new THREE.ConeGeometry(0.08, 0.14, 4).rotateX(Math.PI / 2), rfFin, 'river-fish-tail'); tail.scale.set(0.25, 1, 1); tail.position.z = -0.24; g.add(tail);
    const fin = mk(new THREE.ConeGeometry(0.035, 0.1, 3), rfFin, 'river-fish-fin'); fin.position.set(0, 0.08, 0.02); fin.scale.set(0.3, 1, 1); g.add(fin);
    g.visible = false; scene.add(g); rFish.push({ g, tail, wait: 1 + k * 1.3 + Math.random() * 2, p: -1, dur: 0.8, hgt: 1, from: new THREE.Vector3(), to: new THREE.Vector3() }); }

  // New wildlife — rabbits, foxes, squirrels, mountain goats, a desert roadrunner: each an ownable silhouette with idle/wander/flee behavior
  await __y(); const critters = [];
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
  await __y(); const cM = { rabbit: std('#c9b896'), rabbitTail: std('#fbf3e2'), fox: std('#d9743a'), foxTip: std('#f6ecd8'), squirrel: std('#8a6a44'), squirrelTail: std('#d8cdb0'), goat: std('#d9d3c0'), goatHorn: std('#463a2c'), roadr: std('#6b5a3a'), roadrCrest: std('#2f2a1c'), roadrLeg: std('#c98a3a') };
  await __y(); for (let k = 0; k < 14; k++) spawnCritter('rabbit', [zW(0.08), zW(0.92)], cM.rabbit, { hop: true, wanderSpd: 1.1, fleeSpd: 5.2, fleeDist: 6, clear: 5, minOff: 6,
    build: (g, mat, legs) => { const body = mk(new THREE.CapsuleGeometry(0.085, 0.1, 3, 6), mat, 'rabbit-body'); body.rotation.z = Math.PI / 2; body.position.y = 0.1; g.add(body);
      const head = mk(new THREE.SphereGeometry(0.065, 8, 6), mat, 'rabbit-head'); head.position.set(0, 0.17, -0.11); g.add(head);
      [-1, 1].forEach(s => { const ear = mk(new THREE.CapsuleGeometry(0.016, 0.11, 2, 4), mat, 'rabbit-ear'); ear.position.set(s * 0.028, 0.3, -0.12); ear.rotation.z = s * 0.12; g.add(ear); });
      const tail = mk(new THREE.SphereGeometry(0.04, 6, 6), cM.rabbitTail, 'rabbit-tail'); tail.position.set(0, 0.12, 0.12); g.add(tail);
      for (let i = 0; i < 4; i++) { const leg = mk(new THREE.CylinderGeometry(0.018, 0.022, 0.09, 5), mat, 'rabbit-leg'); leg.position.set((i % 2 ? 1 : -1) * 0.045, 0.045, i < 2 ? -0.05 : 0.05); g.add(leg); legs.push(leg); } } });
  await __y(); for (let k = 0; k < 9; k++) spawnCritter('fox', [zW(0.55), zW(0.97)], cM.fox, { wanderSpd: 1.3, fleeSpd: 5.6, fleeDist: 7, clear: 6, minOff: 8,
    build: (g, mat, legs) => { const body = mk(new THREE.CapsuleGeometry(0.11, 0.22, 4, 8), mat, 'fox-body'); body.rotation.z = Math.PI / 2; body.position.y = 0.16; body.castShadow = !lp; g.add(body);
      const head = mk(new THREE.ConeGeometry(0.09, 0.2, 6), mat, 'fox-head'); head.rotation.x = Math.PI / 2; head.position.set(0, 0.22, -0.24); g.add(head);
      [-1, 1].forEach(s => { const ear = mk(new THREE.ConeGeometry(0.035, 0.08, 5), mat, 'fox-ear'); ear.position.set(s * 0.05, 0.32, -0.2); g.add(ear); });
      const tail = mk(new THREE.ConeGeometry(0.07, 0.42, 7), mat, 'fox-tail'); tail.rotation.x = Math.PI / 2 + 0.5; tail.position.set(0, 0.2, 0.32); g.add(tail);
      const tip = mk(new THREE.SphereGeometry(0.045, 6, 6), cM.foxTip, 'fox-tail-tip'); tip.position.set(0, 0.09, 0.52); g.add(tip);
      for (let i = 0; i < 4; i++) { const leg = mk(new THREE.CylinderGeometry(0.025, 0.03, 0.17, 5), mat, 'fox-leg'); leg.position.set((i % 2 ? 1 : -1) * 0.07, 0.09, i < 2 ? -0.1 : 0.1); g.add(leg); legs.push(leg); } } });
  await __y(); for (let k = 0; k < 12; k++) spawnCritter('squirrel', [zW(0.1), zW(0.75)], cM.squirrel, { wanderSpd: 1.6, fleeSpd: 5.8, fleeDist: 5, clear: 4, minOff: 4, gait: 10,
    build: (g, mat, legs) => { const body = mk(new THREE.CapsuleGeometry(0.055, 0.08, 3, 6), mat, 'sq-body'); body.rotation.x = 0.5; body.position.y = 0.08; g.add(body);
      const head = mk(new THREE.SphereGeometry(0.045, 8, 6), mat, 'sq-head'); head.position.set(0, 0.13, -0.08); g.add(head);
      const tail = mk(new THREE.ConeGeometry(0.06, 0.26, 6), cM.squirrelTail, 'sq-tail'); tail.rotation.x = -1.3; tail.position.set(0, 0.2, 0.12); g.add(tail);
      for (let i = 0; i < 4; i++) { const leg = mk(new THREE.CylinderGeometry(0.014, 0.017, 0.07, 4), mat, 'sq-leg'); leg.position.set((i % 2 ? 1 : -1) * 0.035, 0.035, i < 2 ? -0.04 : 0.04); g.add(leg); legs.push(leg); } } });
  await __y(); for (let k = 0; k < 7; k++) spawnCritter('goat', [sZ(2) + 60, sZ(3) - 55], cM.goat, { wanderSpd: 0.8, fleeSpd: 4.2, fleeDist: 8, clear: 7, minOff: 3, gait: 4,
    build: (g, mat, legs) => { const body = mk(new THREE.CapsuleGeometry(0.16, 0.26, 4, 8), mat, 'goat-body'); body.rotation.z = Math.PI / 2; body.position.y = 0.32; body.castShadow = !lp; g.add(body);
      const head = mk(new THREE.BoxGeometry(0.14, 0.16, 0.2), mat, 'goat-head'); head.position.set(0, 0.46, -0.28); g.add(head);
      [-1, 1].forEach(s => { const horn = mk(new THREE.ConeGeometry(0.025, 0.22, 6), cM.goatHorn, 'goat-horn'); horn.position.set(s * 0.06, 0.58, -0.32); horn.rotation.x = -0.7; horn.rotation.z = s * 0.3; g.add(horn); });
      for (let i = 0; i < 4; i++) { const leg = mk(new THREE.CylinderGeometry(0.032, 0.038, 0.32, 5), mat, 'goat-leg'); leg.position.set((i % 2 ? 1 : -1) * 0.1, 0.16, i < 2 ? -0.16 : 0.16); g.add(leg); legs.push(leg); } } });
  await __y(); for (let k = 0; k < 8; k++) spawnCritter('roadrunner', [DESERT.z - DESERT.r, DESERT.z + DESERT.r], cM.roadr, { wanderSpd: 1.8, fleeSpd: 8, fleeDist: 7, clear: 4, minOff: 4, gait: 12,
    build: (g, mat, legs) => { const body = mk(new THREE.ConeGeometry(0.09, 0.32, 6), mat, 'rr-body'); body.rotation.x = Math.PI / 2 + 0.2; body.position.y = 0.24; g.add(body);
      const head = mk(new THREE.SphereGeometry(0.05, 8, 6), mat, 'rr-head'); head.position.set(0, 0.33, -0.2); g.add(head);
      const beak = mk(new THREE.ConeGeometry(0.015, 0.1, 5), cM.roadrCrest, 'rr-beak'); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.33, -0.29); g.add(beak);
      const crest = mk(new THREE.ConeGeometry(0.02, 0.08, 4), cM.roadrCrest, 'rr-crest'); crest.position.set(0, 0.4, -0.16); crest.rotation.x = -0.4; g.add(crest);
      const tail = mk(new THREE.PlaneGeometry(0.06, 0.3), mat, 'rr-tail'); tail.position.set(0, 0.28, 0.24); tail.rotation.x = 0.3; g.add(tail);
      [-1, 1].forEach(s => { const leg = mk(new THREE.CylinderGeometry(0.012, 0.014, 0.2, 4), cM.roadrLeg, 'rr-leg'); leg.position.set(s * 0.03, 0.1, 0); g.add(leg); legs.push(leg); }); } });

  // Fireflies
  await __y(); const FN = lp ? 140 : 320; await __y(); const ffg = new THREE.BufferGeometry(); await __y(); const ffp = new Float32Array(FN * 3), ffv = new Float32Array(FN * 3);
  await __y(); ffg.setAttribute('position', new THREE.BufferAttribute(ffp, 3));
  await __y(); const ffm = new THREE.PointsMaterial({ color: '#e4ff8a', size: 0.32, map: GT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.4 });
  await __y(); const flies = new THREE.Points(ffg, ffm); await __y(); flies.name = 'fireflies'; await __y(); flies.frustumCulled = false; await __y(); scene.add(flies);
  await __y(); let fliesInit = false;
  // Ambient world wind — curved wisps drifting the terrain, independent of rider speed
  await __y(); const AWN = lp ? 30 : 60;
  await __y(); const awMat = new THREE.MeshBasicMaterial({ color: '#f2ead2', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: true, side: THREE.DoubleSide });
  await __y(); const awCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, -1), new THREE.Vector3(0.3, 0.05, -0.3), new THREE.Vector3(-0.22, -0.03, 0.35), new THREE.Vector3(0.1, 0, 1)]);
  await __y(); const awStreaks = new THREE.InstancedMesh(new THREE.TubeGeometry(awCurve, 14, 0.02, 5, false), awMat, AWN); await __y(); awStreaks.name = 'ambient-wind'; await __y(); awStreaks.frustumCulled = false; await __y(); scene.add(awStreaks);
  await __y(); const awDat = Array.from({ length: AWN }, () => ({ x: (Math.random() - 0.5) * 100, z: (Math.random() - 0.5) * 100, t: Math.random() * 20, ph: Math.random() * 10, spd: 0.6 + Math.random() * 1.3, len: 1 + Math.random() * 2.2, curl: 0.6 + Math.random() * 1.4 }));
  await __y(); const wind = new THREE.Group(); await __y(); wind.name = 'wind'; await __y(); scene.add(wind);
  await __y(); const WN = lp ? 26 : 50, streakMat = new THREE.MeshBasicMaterial({ color: '#fff4e0', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  await __y(); const streaks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.016, 0.016, 1), streakMat, WN); await __y(); streaks.name = 'wind-streaks'; await __y(); streaks.frustumCulled = false; await __y(); wind.add(streaks);
  await __y(); const sdat = Array.from({ length: WN }, () => ({ x: (Math.random() - 0.5) * 7, y: 0.3 + Math.random() * 3.2, z: -30 + Math.random() * 36, l: 0.6 + Math.random() * 1.4 }));
  await __y(); const LN = lp ? 16 : 36, leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, side: THREE.DoubleSide, roughness: 0.9 });
  await __y(); const leaves = new THREE.InstancedMesh(new THREE.CircleGeometry(0.08, 3), leafMat, LN); await __y(); leaves.name = 'wind-leaves'; await __y(); leaves.frustumCulled = false; await __y(); wind.add(leaves);
  await __y(); const LC = ['#9bb04a', '#c98a3a', '#6f8f3a', '#d8b35a'].map(c => new THREE.Color(c));
  await __y(); const ldat = Array.from({ length: LN }, (_, i) => { leaves.setColorAt(i, LC[i % 4]); return { x: (Math.random() - 0.5) * 9, y: Math.random() * 3, z: -24 + Math.random() * 30, r: Math.random() * 6, s: 0.6 + Math.random() }; });
  await __y(); const wO = new THREE.Object3D();

  // Environment keys
  await __y(); const K = [
    { t: 0, top: '#2a3a7c', mid: '#9a6f9a', hor: '#ffb067', fog: '#e29a72', hs: '#ffe0b8', hg: '#4d3f5f', hi: 1.7, ki: 2.6, kc: '#ffb070', cl: '#ffd9bd', fn: 60, ff: 620 },
    { t: 0.5, top: '#1a235e', mid: '#5c4789', hor: '#e8805f', fog: '#8e5f7c', hs: '#e0c0e6', hg: '#362d4c', hi: 1.4, ki: 1.7, kc: '#ff9a6a', cl: '#c89cb2', fn: 45, ff: 520 },
    { t: 0.76, top: '#0a1030', mid: '#18245a', hor: '#324a8c', fog: '#28356e', hs: '#96a8ec', hg: '#333f78', hi: 1.55, ki: 1.75, kc: '#a9bcff', cl: '#56629a', fn: 42, ff: 620 },
    { t: 1, top: '#0a0f2e', mid: '#1a2660', hor: '#384f92', fog: '#2b3970', hs: '#9cb0f0', hg: '#354080', hi: 1.6, ki: 1.8, kc: '#b3c3ff', cl: '#5a669e', fn: 42, ff: 620 }].map(k => ({ ...k, top: new THREE.Color(k.top), mid: new THREE.Color(k.mid), hor: new THREE.Color(k.hor), fog: new THREE.Color(k.fog), hs: new THREE.Color(k.hs), hg: new THREE.Color(k.hg), kc: new THREE.Color(k.kc), cl: new THREE.Color(k.cl) }));
  await __y(); const envAt = t => { let i = 0; while (i < K.length - 2 && t > K[i + 1].t) i++; const a = K[i], b = K[i + 1], f = sstep(a.t, b.t, t); const o = {}; for (const k in a) o[k] = a[k].isColor ? a[k].clone().lerp(b[k], f) : lerp(a[k], b[k], f); return o; };
  await __y(); const SUN = new THREE.Vector3(), MOON = skyU.moonDir.value;

  // Input
  await __y(); let lastMouse = 0; await __y(); const aimNDC = new THREE.Vector2(), projV = new THREE.Vector3(), headAim = new THREE.Vector3(0, 0, -14), gPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), gPt = new THREE.Vector3();
  await __y(); let target = 0, t = 0, steer = 0, steerT = 0, keyDir = 0, mobile = !!opts.mobile;
  await __y(); let reduceMotion = false;
  await __y(); let vel = 0, yawOff = 0, pitchOff = 0, lastPan = 0, free = false, fx = 0, fz = 0, fh = 0, fs = 0, curSpeed = 0, lastFreeCb = 0, brakeSpd = 0, shake = 0, lastBX = 0, lastBZ = 0, lastYaw = 0, susY = null, susVel = 0, susFront = 0, susRear = 0, susFrontV = 0, susRearV = 0, stickX = 0, stickY = 0, airY = 0, airVel = 0, grounded = true; await __y(); const keys = {}, touch = {};
  await __y(); const mouse = new THREE.Vector2(0, 0), mouseW = new THREE.Vector3(), ray = new THREE.Raycaster();
  await __y(); let down = null, lastRip = 0, hover = -1;
  await __y(); const wPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -LAKE.y), wPt = new THREE.Vector3();
  await __y(); const firePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), firePt = new THREE.Vector3();
  await __y(); const fireHit = () => { const gy = hFast(FIRE.x, FIRE.z); firePlane.constant = -(gy + 0.5); ray.setFromCamera(mouse, camera); const p = ray.ray.intersectPlane(firePlane, firePt); return p && Math.hypot(p.x - FIRE.x, p.z - FIRE.z) < 3 ? p : null; };
  await __y(); const waterHit = () => { ray.setFromCamera(mouse, camera); const p = ray.ray.intersectPlane(wPlane, wPt); return p && Math.hypot(p.x - LAKE.x, p.z - LAKE.z) < LAKE.r * 1.4 && camera.position.distanceTo(p) < 400 ? p : null; };
  // ===== Life: flock2, gulls, butterflies, rabbits2, owls2, leaping fish, dust2 =====
  await __y(); const vGeo2 = new THREE.BufferGeometry(); await __y(); vGeo2.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 1, 0.05, 0, 0, -0.22, 0, 0, 0.18, 0.5, 1, 0.05, 0, 0, 0.18, 0, 0, -0.22], 3)); await __y(); vGeo2.computeVertexNormals();
  await __y(); const NBPF2 = lp ? 7 : 13, flock2 = new THREE.InstancedMesh(vGeo2, new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide }), NBPF2 * 4); await __y(); flock2.name = 'flock2'; await __y(); flock2.frustumCulled = false; await __y(); scene.add(flock2);
  await __y(); const bdat2 = Array.from({ length: NBPF2 * 4 }, (_, i) => ({ f: Math.floor(i / NBPF2), ph: Math.random() * 10, ff: 7 + Math.random() * 3, p: new THREE.Vector3(), q: new THREE.Vector3() }));
  await __y(); bdat2.forEach((b, i) => flock2.setColorAt(i, new THREE.Color(b.f === 3 ? '#f4f1ea' : '#2a2430')));
  await __y(); const NBF2 = lp ? 20 : 46, flutter2 = new THREE.InstancedMesh(vGeo2, new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide }), NBF2); await __y(); flutter2.name = 'butterflies'; await __y(); flutter2.frustumCulled = false; await __y(); scene.add(flutter2);
  await __y(); const BFC2 = ['#ffd24a', '#ff8a3d', '#7fd6ff', '#f5f0ff', '#ff6fae', '#b8ff6a'].map(c => new THREE.Color(c));
  await __y(); const bfd2 = Array.from({ length: NBF2 }, (_, i) => { flutter2.setColorAt(i, BFC2[i % BFC2.length]); return { a: new THREE.Vector3(1e5, 0, 1e5), ph: Math.random() * 10, r: 0.8 + Math.random() * 1.6, p: new THREE.Vector3(), q: new THREE.Vector3() }; });
  await __y(); const rabbits2 = []; await __y(); { const fur2 = std('#8a7a68'), tailM2 = std('#f2ece2'), inner2 = std('#d9a79a');
    const homes2 = []; for (let k = 0; k < 7; k++) { const a = k * 0.9, r = 12 + (k % 3) * 9; homes2.push([MEADOW.x + Math.cos(a) * r, MEADOW.z + Math.sin(a) * r]); }
    for (let k = 0; k < 7; k++) { const z = zW(0.05 + k * 0.06), sd2 = k % 2 ? 1 : -1; homes2.push([roadX(z) + sd2 * (9 + (k % 3) * 4), z]); }
    homes2.forEach(([hx, hz], k) => { const g = new THREE.Group(); g.name = 'rabbit'; const body = mk(new THREE.SphereGeometry(0.18, 8, 6), fur2, 'rabbit-body'); body.scale.set(1, 0.85, 1.3); body.position.y = 0.17; g.add(body);
      const head = mk(new THREE.SphereGeometry(0.11, 8, 6), fur2, 'rabbit-head'); head.position.set(0, 0.32, -0.2); g.add(head);
      [-0.045, 0.045].forEach(ex => { const ear = mk(new THREE.BoxGeometry(0.035, 0.16, 0.05), fur2, 'rabbit-ear'); ear.position.set(ex, 0.47, -0.19); ear.rotation.z = ex * 3; g.add(ear); const ie = mk(new THREE.BoxGeometry(0.02, 0.12, 0.01), inner2, 'rabbit-ear-inner2'); ie.position.set(ex, 0.47, -0.22); ie.rotation.z = ex * 3; g.add(ie); });
      const tail = mk(new THREE.SphereGeometry(0.055, 6, 4), tailM2, 'rabbit-tail'); tail.position.set(0, 0.2, 0.24); g.add(tail);
      g.position.set(hx, H(hx, hz), hz); scene.add(g); rabbits2.push({ g, hx, hz, from: g.position.clone(), to: g.position.clone(), u: 1, wait: Math.random() * 2, dur: 0.4 }); }); }
  await __y(); const owls2 = []; await __y(); for (let k = 0; k < (lp ? 8 : 16); k++) { const z = zW(0.55 + rnd() * 0.33), x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (9 + rnd() * 22), y = H(x, z) + 4.5 + rnd() * 3; const pair = [-0.09, 0.09].map(o => { const e = glowSprite('#ffd36b', 0.16, 0); e.position.set(x + o, y, z); scene.add(e); return e; }); owls2.push({ pair, ph: rnd() * 10 }); }
  await __y(); const fishM2 = std('#b8c4cc', { roughness: 0.3, metalness: 0.6 }), fishes2 = []; await __y(); for (let k = 0; k < 3; k++) { const f = mk(new THREE.OctahedronGeometry(0.2, 0), fishM2, 'fish'); f.scale.set(0.5, 0.6, 1.6); f.visible = false; scene.add(f); const sp = glowSprite('#e6f4ff', 1.4, 0); scene.add(sp); fishes2.push({ f, sp, t: -Math.random() * 4, x: 0, z: 0, y: 0, dx: 0, dz: 0, spl: 0 }); }
  await __y(); const DN2 = lp ? 120 : 260, dPos2 = new Float32Array(DN2 * 3).fill(-999), dVel2 = new Float32Array(DN2 * 3), dLife2 = new Float32Array(DN2).fill(1), dCol2 = new Float32Array(DN2 * 3); await __y(); let dI2 = 0;
  await __y(); const dGeo2 = new THREE.BufferGeometry(); await __y(); dGeo2.setAttribute('position', new THREE.BufferAttribute(dPos2, 3)); await __y(); dGeo2.setAttribute('aLife', new THREE.BufferAttribute(dLife2, 1)); await __y(); dGeo2.setAttribute('aCol', new THREE.BufferAttribute(dCol2, 3));
  await __y(); const dU2 = { map: { value: GT }, uScale: { value: 1 } };
  await __y(); const dust2 = new THREE.Points(dGeo2, new THREE.ShaderMaterial({ uniforms: dU2, transparent: true, depthWrite: false,
    vertexShader: 'uniform float uScale; attribute float aLife; attribute vec3 aCol; varying float vL; varying vec3 vC; void main(){ vL=aLife; vC=aCol; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=(30.+aLife*150.)*uScale/max(1.,-mv.z); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'uniform sampler2D map; varying float vL; varying vec3 vC; void main(){ float a=texture2D(map,gl_PointCoord).a*(1.-vL)*.5; if(a<.01) discard; gl_FragColor=vec4(vC,a); }' })); await __y(); dust2.name = 'dust2'; await __y(); dust2.frustumCulled = false; await __y(); scene.add(dust2);
  await __y(); const dG2 = new Float32Array(DN2).fill(0.6), SPRAY = new THREE.Color('#dcefff');
  await __y(); const DCOL2 = [new THREE.Color('#b8b0a4'), new THREE.Color('#9a7c58'), new THREE.Color('#e2cc98'), new THREE.Color('#e8e8ec')];
  function spawnDust(n, x, z, kind) { const c = DCOL2[kind] || DCOL2[1], y = groundY(x, z) + 0.15; for (let k = 0; k < n; k++) { const i = dI2++ % DN2, j = i * 3; dG2[i] = 0.6; dPos2[j] = x + (Math.random() - 0.5) * 0.4; dPos2[j + 1] = y; dPos2[j + 2] = z + (Math.random() - 0.5) * 0.4; dVel2[j] = (Math.random() - 0.5) * 2.2; dVel2[j + 1] = 0.6 + Math.random() * 1.4; dVel2[j + 2] = (Math.random() - 0.5) * 2.2; dLife2[i] = 0; dCol2[j] = c.r; dCol2[j + 1] = c.g; dCol2[j + 2] = c.b; } }
  function spawnSpray(n, x, y, z, pw, dx, dz) { dx = dx || 0; dz = dz || 0; for (let k = 0; k < n; k++) { const i = dI2++ % DN2, j = i * 3; dG2[i] = 9;
      dPos2[j] = x + (Math.random() - 0.5) * 0.5; dPos2[j + 1] = y + 0.05; dPos2[j + 2] = z + (Math.random() - 0.5) * 0.5;
      dVel2[j] = (Math.random() - 0.5) * 2.4 * pw + dx; dVel2[j + 1] = (1.4 + Math.random() * 2.4) * pw; dVel2[j + 2] = (Math.random() - 0.5) * 2.4 * pw + dz;
      dLife2[i] = 0.25; dCol2[j] = SPRAY.r; dCol2[j + 1] = SPRAY.g; dCol2[j + 2] = SPRAY.b; } }
  function addRipple(x, z) { const t0 = wU.time.value; if (zBand(z, RIV.zHi, RIV.zLo, 1) > 0.5 && Math.abs(x - riverX(z)) < 8) rivRip[rivI++ % 8].set(x, z, t0); else wU.rip.value[ripI++ % 8].set(x, z, t0); }
  await __y(); let inWater = false, wakeT = 0, wasGrounded = true;
  await __y(); const cV3 = new THREE.Vector3(), cV2 = new THREE.Vector3();
  await __y(); const fogHook = m => { if (!m || !m.fog || m.isShaderMaterial || m.userData.fogHooked) return; m.userData.fogHooked = true; const prev = m.onBeforeCompile, k0 = m.customProgramCacheKey(); m.onBeforeCompile = (sh, r) => { prev && prev.call(m, sh, r); Object.assign(sh.uniforms, FOGU); }; m.customProgramCacheKey = () => k0 + '|fogv1'; };
  await __y(); const hookAll = () => scene.traverse(o => { if (!o.material) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(fogHook); });
  await __y(); hookAll();
  // ===== v3 · Living world: day clock, weather, gusts, regional flora + fauna, tyre tracks, seasons =====
  await __y(); const QS = new URLSearchParams(location.search);
  await __y(); let alarmR = 6, quietBike = true, gustNear = 0;
  await __y(); const SC = c => new THREE.Color(c), TC = new THREE.Color();
  await __y(); const addSolid = (x, z, r) => { const i = solids.push({ x, z, r }) - 1, k = Math.floor(x / SG) + ',' + Math.floor(z / SG); if (!solidGrid.has(k)) solidGrid.set(k, []); solidGrid.get(k).push(i); };
  await __y(); const inst = (geo, mat, n, name) => { const m = new THREE.InstancedMesh(geo, mat, Math.max(1, n)); m.name = name; m.castShadow = false; m.receiveShadow = !lp; return m; };
  await __y(); const putI = (m, i, x, y, z, ry, sx, sy, sz, col, rx = 0, rz = 0) => { dummy.rotation.order = 'XYZ'; dummy.position.set(x, y, z); dummy.rotation.set(rx, ry, rz); dummy.scale.set(sx, sy, sz); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); if (col) m.setColorAt(i, TC.set(col)); };
  await __y(); const CZ0 = typeof sZ === 'function' ? sZ(2) + 55 : 1e9, CZ1 = typeof sZ === 'function' ? sZ(3) - 45 : 1e9;

  // ---- regions (weights drive weather + ambient audio)
  await __y(); const REG = { id: 'road', w: { forest: 0, meadow: 0, coast: 0, canyon: 0, snow: 0, lake: 0, river: 0, ruins: 0, jungle: 0, savanna: 0, blossom: 0 } };
  function regionAt(x, z) { const w = REG.w, prog = fO(z);
    w.canyon = Math.max(1 - sstep(DESERT.r * 0.9, DESERT.r * 1.6, Math.hypot(x - DESERT.x, z - DESERT.z)), CZ0 < 1e8 ? zBand(z, CZ0, CZ1, 15) * (1 - sstep(12, 34, Math.abs(x - roadX(z)))) : 0);
    w.coast = zBand(z, COAST.zHi, COAST.zLo, 30) * (1 - sstep(30, 100, x - coastX(z)));
    w.meadow = 1 - sstep(MEADOW.r * 0.8, MEADOW.r * 1.5, Math.hypot((x - MEADOW.x) * 0.8, z - MEADOW.z));
    w.lake = 1 - sstep(LAKE.r * 1.05, LAKE.r * 2.2, Math.hypot(x - LAKE.x, z - LAKE.z));
    w.river = zBand(z, RIV.zHi, RIV.zLo, 20) * (1 - sstep(12, 45, Math.abs(x - riverX(z))));
    w.ruins = 1 - sstep(RUINS.r * 0.7, RUINS.r * 1.4, Math.hypot(x - RUINS.x, z - RUINS.z));
    w.snow = Math.max(1 - sstep(RIM * 0.45, RIM * 1.05, edgeInfo(x, z).e), sstep(38, 70, hFast(x, z) - roadY(clamp(z, ZEND, Z0))));
    w.snow = Math.max(w.snow, 1 - sstep(0.5, 0.85, peakR(x, z)), snowAt(x, hFast(x, z), z) * 0.8);
    w.meadow = Math.max(w.meadow, regW(FARM, x, z) * 0.9, regW(SPRINGS, x, z) * 0.5); w.river = Math.max(w.river, regW(SPRINGS, x, z) * 0.6); w.canyon = Math.max(w.canyon, regW(CANYON, x, z));
    w.jungle = regW(JUNGLE, x, z); w.savanna = regW(SAVANNA, x, z); w.blossom = regW(BLOSSOM, x, z);
    let m = 0; for (const k in w) if (k !== 'forest') m = Math.max(m, w[k]);
    w.forest = sstep(0.5, 0.56, prog) * (1 - sstep(0.9, 0.95, prog)) * (1 - m);
    w.forest = Math.max(w.forest, regW(TEA, x, z) * 0.7); let best = 'road', bv = 0.35; for (const k in w) if (w[k] > bv) { bv = w[k]; best = k; } REG.id = best; w.forest = Math.max(w.forest, w.jungle * 0.9); w.meadow = Math.max(w.meadow, w.savanna * 0.8, w.blossom * 0.55); w.river = Math.max(w.river, w.blossom * 0.3, w.jungle * 0.25); }

  // ---- seasons: palette swaps over the instanced flora (random per visitor session)
  await __y(); let season = (opts.season || QS.get('season') || '').toLowerCase();
  await __y(); if (!['summer', 'spring', 'autumn', 'winter'].includes(season)) { try { season = sessionStorage.getItem('ap-season') || ''; } catch (e) {} if (!season) { const r = Math.random(); season = r < 0.4 ? 'summer' : r < 0.65 ? 'spring' : r < 0.88 ? 'autumn' : 'winter'; } try { sessionStorage.setItem('ap-season', season); } catch (e) {} }
  await __y(); let seasonDirty = true, lastDefLen = -1;
  await __y(); const AUT = ['#c8561e', '#d98a2a', '#b8341e', '#e0b040', '#9a6a2a', '#8a9a3a'].map(SC), BLOSSC = SC('#f2b8cc'), SPRINGC = SC('#96cc5a'), SNOWC = SC('#e8eef4'), BARE = SC('#7a6a5c'), GOLD = SC('#c8a24a'), FERNA = SC('#b8862e'), WARMC = SC('#5a5a2a');
  await __y(); const SGROUP = { 'round-crowns': 'decid', 'bushes': 'decid', 'birch-leaf': 'decid', 'vines': 'decid', 'pine-crowns': 'conifer', 'ferns': 'fern', 'ground-grass': 'grass', 'tall-grass': 'grass', 'wildflowers': 'flower', 'dandelion-heads': 'flower', 'fallen-leaves': 'leaves' };
  await __y(); const recolor = (g, c, i) => { const h = h2(i, 911);
    if (season === 'spring') { if (g === 'decid' && h < 0.2) c.lerp(BLOSSC, 0.85); else if (g === 'flower') c.offsetHSL(0, 0.1, 0.05); else c.lerp(SPRINGC, g === 'conifer' ? 0.15 : 0.35); }
    else if (season === 'autumn') { if (g === 'decid' || g === 'leaves') c.lerp(AUT[Math.floor(h * AUT.length)], g === 'leaves' ? 0.9 : 0.75); else if (g === 'fern') c.lerp(FERNA, 0.6); else if (g === 'grass') c.lerp(GOLD, 0.55); else if (g === 'conifer') c.lerp(WARMC, 0.15); else if (g === 'flower') c.lerp(AUT[1], 0.4); }
    else if (season === 'winter') { if (g === 'decid') c.lerp(BARE, 0.6).lerp(SNOWC, 0.3 + h * 0.25); else if (g === 'leaves') c.lerp(BARE, 0.5).lerp(SNOWC, 0.4); else c.lerp(SNOWC, g === 'conifer' ? 0.35 + h * 0.2 : 0.55); } };
  await __y(); const applySeason = () => { const c = new THREE.Color(), seen = new Set();
    scene.children.forEach(o => { const g = SGROUP[o.name]; if (!g) return;
      if (o.isInstancedMesh && o.instanceColor) { const a = o.instanceColor.array; if (!o.userData.baseCol) o.userData.baseCol = a.slice(); const b = o.userData.baseCol, off = Math.floor(Math.abs(o.userData.cx || 0));
        for (let i = 0; i < o.count; i++) { c.setRGB(b[i * 3], b[i * 3 + 1], b[i * 3 + 2]); recolor(g, c, i + off); a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } o.instanceColor.needsUpdate = true; }
      else if (o.material && o.material.color && !seen.has(o.material)) { seen.add(o.material); const m = o.material; if (!m.userData.baseCol) m.userData.baseCol = m.color.clone(); c.copy(m.userData.baseCol); recolor(g, c, 7); m.color.copy(c); } });
    if (terrMat) terrMat.userData.baseC = SC(season === 'autumn' ? '#f6e8d0' : season === 'spring' ? '#f2fff0' : season === 'winter' ? '#f0f4fa' : '#ffffff'); };

  // ---- day clock (free-ride): dawn → noon → golden → night, ~7 min per day
  await __y(); const DAYN = { midnight: 0, dawn: 0.265, morning: 0.36, noon: 0.5, afternoon: 0.63, golden: 0.74, dusk: 0.8, night: 0.95 };
  await __y(); let dayOn = opts.dayClock !== false, dayPh = -1, dayMix = 0, dayForce = null;
  await __y(); { const q = QS.get('day'); if (q != null && q !== '') dayForce = q in DAYN ? DAYN[q] : clamp(parseFloat(q) || 0, 0, 1); }
  await __y(); const DAY_LEN = (opts.dayMinutes || parseFloat(QS.get('daymin')) || 7) * 60;
  await __y(); const DKC = ['top', 'mid', 'hor', 'fog', 'hs', 'hg', 'kc', 'cl'];
  await __y(); const DK = [
    { p: 0.00, top: '#070b22', mid: '#141d4a', hor: '#26336a', fog: '#1e2856', hs: '#8a9ce0', hg: '#2b3466', hi: 1.55, ki: 1.7, kc: '#a9bcff', cl: '#4a5488', fn: 40, ff: 580 },
    { p: 0.19, top: '#1c2658', mid: '#5a4c86', hor: '#c9868a', fog: '#8a7090', hs: '#c8b4dc', hg: '#3a3552', hi: 1.45, ki: 1.5, kc: '#ffb89a', cl: '#b89ab4', fn: 30, ff: 440 },
    { p: 0.265, top: '#3a5596', mid: '#b99ab6', hor: '#ffc48e', fog: '#e9bfa6', hs: '#ffe4cc', hg: '#4f4a5c', hi: 1.55, ki: 2.3, kc: '#ffc48e', cl: '#ffe1cf', fn: 36, ff: 500 },
    { p: 0.36, top: '#3d6fc0', mid: '#8fb2e0', hor: '#e8e2d6', fog: '#c4d2dc', hs: '#e6f0ff', hg: '#566648', hi: 1.55, ki: 2.6, kc: '#fff0d8', cl: '#ffffff', fn: 70, ff: 700 },
    { p: 0.50, top: '#3a6cc4', mid: '#88b0e4', hor: '#dfe8ee', fog: '#bccfdf', hs: '#e8f2ff', hg: '#5a6a48', hi: 1.6, ki: 2.8, kc: '#fff6e8', cl: '#ffffff', fn: 80, ff: 720 },
    { p: 0.64, top: '#3f66b0', mid: '#98acd6', hor: '#f0d8b8', fog: '#d0c8c0', hs: '#f4ead8', hg: '#5a5a48', hi: 1.6, ki: 2.7, kc: '#ffe2b8', cl: '#fff4e6', fn: 70, ff: 680 },
    { p: 0.74, top: '#2a3a7c', mid: '#9a6f9a', hor: '#ffb067', fog: '#e29a72', hs: '#ffe0b8', hg: '#4d3f5f', hi: 1.7, ki: 2.6, kc: '#ffb070', cl: '#ffd9bd', fn: 60, ff: 620 },
    { p: 0.80, top: '#1a235e', mid: '#5c4789', hor: '#e8805f', fog: '#8e5f7c', hs: '#e0c0e6', hg: '#362d4c', hi: 1.4, ki: 1.7, kc: '#ff9a6a', cl: '#c89cb2', fn: 45, ff: 520 },
    { p: 0.88, top: '#0a1030', mid: '#18245a', hor: '#324a8c', fog: '#28356e', hs: '#96a8ec', hg: '#333f78', hi: 1.55, ki: 1.75, kc: '#a9bcff', cl: '#56629a', fn: 42, ff: 620 },
    { p: 1.00, top: '#070b22', mid: '#141d4a', hor: '#26336a', fog: '#1e2856', hs: '#8a9ce0', hg: '#2b3466', hi: 1.55, ki: 1.7, kc: '#a9bcff', cl: '#4a5488', fn: 40, ff: 580 }
  ].map(k => { const o = { ...k }; DKC.forEach(c => { o[c] = SC(k[c]); }); return o; });
  await __y(); const mixEnv = (a, b, f) => { const o = {}; for (const k in a) o[k] = a[k] && a[k].isColor ? a[k].clone().lerp(b[k], f) : lerp(a[k], b[k] === undefined ? a[k] : b[k], f); return o; };
  await __y(); const dayAt = p => { let i = 0; while (i < DK.length - 2 && p > DK[i + 1].p) i++; const a = DK[i], b = DK[i + 1], o = mixEnv(a, b, sstep(a.p, b.p, p));
    const ang = (p - 0.25) * Math.PI * 2, nt = p < 0.5 ? 1 - sstep(0.19, 0.3, p) : sstep(0.76, 0.9, p);
    return { e: o, night: nt, glow: sstep(0.2, 0.85, nt), sx: 0.5 * Math.cos(ang), sy: Math.max(-0.3, Math.sin(ang) * 0.95) }; };

  // ---- weather: region-tied rain / drizzle / snow / dust, rare ridge thunderstorms, morning mist
  await __y(); const WX = { target: 0, next: 25 + Math.random() * 40, storm: false, stormAmt: 0, rain: 0, drizzle: 0, snow: 0, dust: 0, oc: 0, wet: 0, mist: 0, flash: 0, nextBolt: 3, boltT: 0, ripT: 0, snowCover: 0, force: QS.get('weather') || null };
  await __y(); const wxKind = () => { const f = WX.force; if (f && f !== 'auto' && f !== 'storm') return f; const r = REG.id; if (r === 'canyon' || r === 'savanna') return 'dust'; if (r === 'jungle') return 'rain'; if (r === 'snow') return 'snow'; if (season === 'winter' && r !== 'coast') return 'snow'; if (r === 'forest') return 'drizzle'; return 'rain'; };
  function wxTick(dt) { const f = WX.force;
    if (f && f !== 'auto') { WX.target = f === 'clear' || f === 'mist' ? 0 : 1; WX.storm = f === 'storm'; }
    else { WX.next -= dt; if (WX.next <= 0) { if (WX.target > 0) { WX.target = 0; WX.next = 70 + Math.random() * 110; } else { WX.target = 0.55 + Math.random() * 0.45; WX.next = 45 + Math.random() * 75; WX.storm = free && Math.random() < 0.22; } } }
    const cap = free || f ? 1 : 0.4, k = wxKind(), T0 = Math.min(WX.target, cap), ease = 1 - Math.exp(-dt / 6);
    WX.rain += ((k === 'rain' ? T0 : 0) - WX.rain) * ease; WX.drizzle += ((k === 'drizzle' ? T0 * 0.6 : 0) - WX.drizzle) * ease; WX.snow += ((k === 'snow' ? T0 : 0) - WX.snow) * ease; WX.dust += ((k === 'dust' ? T0 : 0) - WX.dust) * ease;
    WX.stormAmt += (((WX.storm && (free || f)) ? WX.rain : 0) - WX.stormAmt) * ease;
    WX.oc = clamp(WX.rain + WX.drizzle * 0.8 + WX.snow * 0.7 + WX.stormAmt * 0.4, 0, 1.2);
    const wetT = clamp(WX.rain + WX.drizzle * 0.7, 0, 1); WX.wet += (wetT - WX.wet) * (1 - Math.exp(-dt / (wetT > WX.wet ? 18 : 60)));
    WX.snowCover += (WX.snow - WX.snowCover) * (1 - Math.exp(-dt / 40));
    const mistT = f === 'mist' ? 1 : (dayPh >= 0 ? dayMix * sstep(0.17, 0.22, dayPh) * (1 - sstep(0.3, 0.37, dayPh)) : 0) + WX.drizzle * 0.4;
    WX.mist += (mistT - WX.mist) * (1 - Math.exp(-dt / 5)); WX.flash *= Math.exp(-dt * 7); }
  await __y(); const WXC = { tD: SC('#6f7c8c'), tN: SC('#10141f'), hD: SC('#a9b1ba'), hN: SC('#2a3040'), fD: SC('#9aa3ad'), fN: SC('#232a3a'), cD: SC('#8a929c'), cN: SC('#2c3242'), dust: SC('#c9a26a'), dustN: SC('#4a3a2a'), mistD: SC('#d8dde2'), mistN: SC('#3a4260'), white: SC('#e8eeff') };
  await __y(); const wc = new THREE.Color();
  function wxEnv(e, night) { const oc = Math.min(1, WX.oc) * 0.75, du = WX.dust, mi = WX.mist;
    if (oc > 0.002) { e.top.lerp(wc.copy(WXC.tD).lerp(WXC.tN, night), oc * 0.7); e.mid.lerp(wc.copy(WXC.hD).lerp(WXC.hN, night), oc * 0.7); e.hor.lerp(wc.copy(WXC.hD).lerp(WXC.hN, night), oc * 0.6); e.fog.lerp(wc.copy(WXC.fD).lerp(WXC.fN, night), oc * 0.65); e.cl.lerp(wc.copy(WXC.cD).lerp(WXC.cN, night), oc * 0.8); e.ki *= 1 - oc * 0.5; e.kc.lerp(WXC.hD, oc * 0.4); e.fn *= 1 - oc * 0.6; e.ff *= 1 - oc * 0.45; }
    if (du > 0.002) { wc.copy(WXC.dust).lerp(WXC.dustN, night); e.fog.lerp(wc, du * 0.85); e.hor.lerp(wc, du * 0.7); e.mid.lerp(wc, du * 0.35); e.kc.lerp(wc, du * 0.4); e.fn *= 1 - du * 0.85; e.ff *= 1 - du * 0.75; }
    if (mi > 0.002) { wc.copy(WXC.mistD).lerp(WXC.mistN, night); e.fog.lerp(wc, mi * 0.5); e.fn *= 1 - mi * 0.7; e.ff *= 1 - mi * 0.4; }
    if (WX.flash > 0.01) { e.hi += WX.flash * 2.5; e.hs.lerp(WXC.white, Math.min(1, WX.flash)); e.top.lerp(WXC.white, WX.flash * 0.25); } }

  // precipitation particles (world-space, wrapped around the camera)
  await __y(); const RN = lp ? 500 : 1300, rP = new Float32Array(RN * 3); await __y(); let rInit = false;
  await __y(); const rainMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 1, 0.012), new THREE.MeshBasicMaterial({ color: '#c8d6e6', transparent: true, opacity: 0.3, depthWrite: false }), RN); await __y(); rainMesh.name = 'rain'; await __y(); rainMesh.frustumCulled = false; await __y(); rainMesh.count = 0; await __y(); scene.add(rainMesh);
  await __y(); const mkPts = (n, col, size, name) => { const g = new THREE.BufferGeometry(), a = new Float32Array(n * 3); g.setAttribute('position', new THREE.BufferAttribute(a, 3)); const m = new THREE.PointsMaterial({ color: col, size, map: GT, transparent: true, depthWrite: false, opacity: 0 }); const p = new THREE.Points(g, m); p.name = name; p.frustumCulled = false; p.visible = false; scene.add(p); return { p, a, g, m, n, init: false }; };
  await __y(); const snowP = mkPts(lp ? 500 : 1400, '#ffffff', 0.16, 'snowfall'), dustP = mkPts(lp ? 300 : 800, '#d8b27a', 0.9, 'dust-storm'), DUSTD = SC('#d8b27a'), DUSTN = SC('#5a4a38');
  await __y(); const seedPts = (P, cp, R, H0) => { for (let i = 0; i < P.n; i++) { P.a[i * 3] = cp.x + (Math.random() - 0.5) * 2 * R; P.a[i * 3 + 1] = cp.y - 2 + Math.random() * H0; P.a[i * 3 + 2] = cp.z + (Math.random() - 0.5) * 2 * R; } P.init = true; };
  await __y(); const wrapXZ = (a, j, cp, R) => { if (a[j] - cp.x > R) a[j] -= 2 * R; else if (a[j] - cp.x < -R) a[j] += 2 * R; if (a[j + 2] - cp.z > R) a[j + 2] -= 2 * R; else if (a[j + 2] - cp.z < -R) a[j + 2] += 2 * R; };
  function precipTick(dt, T, bp, night) { const cp = camera.position, R = 22;
    const rAmt = clamp(WX.rain + WX.drizzle * 0.5, 0, 1), rn = Math.round(RN * rAmt); rainMesh.count = rn; rainMesh.visible = rn > 0;
    if (rn > 0) { if (!rInit) { for (let i = 0; i < RN; i++) { rP[i * 3] = cp.x + (Math.random() - 0.5) * 2 * R; rP[i * 3 + 1] = cp.y - 4 + Math.random() * 24; rP[i * 3 + 2] = cp.z + (Math.random() - 0.5) * 2 * R; } rInit = true; }
      const heavy = WX.rain / Math.max(0.01, rAmt), sp = lerp(10, 22, heavy), len = lerp(0.35, 0.85, heavy), wv = 2 + WX.stormAmt * 6 + gustNear * 4, wx = wdx * wv, wz = wdz * wv, tilt = Math.atan2(wv, sp);
      rainMesh.material.opacity = 0.16 + 0.2 * rAmt; rainMesh.material.color.setScalar(lerp(0.85, 0.45, night));
      for (let i = 0; i < rn; i++) { const j = i * 3; rP[j] += wx * dt; rP[j + 1] -= sp * dt; rP[j + 2] += wz * dt; wrapXZ(rP, j, cp, R);
        if (rP[j + 1] < hFast(rP[j], rP[j + 2]) || rP[j + 1] > cp.y + 22) { if (Math.random() < 0.012 && Math.hypot(rP[j] - bp.x, rP[j + 2] - bp.z) < 12) spawnSpray(1, rP[j], groundY(rP[j], rP[j + 2]), rP[j + 2], 0.22); rP[j + 1] = cp.y + 12 + Math.random() * 9; }
        dummy.rotation.order = 'XYZ'; dummy.position.set(rP[j], rP[j + 1], rP[j + 2]); dummy.rotation.set(-tilt * wdz, 0, tilt * wdx); dummy.scale.set(1, len, 1); dummy.updateMatrix(); rainMesh.setMatrixAt(i, dummy.matrix); }
      rainMesh.instanceMatrix.needsUpdate = true;
      WX.ripT -= dt; if (rAmt > 0.15 && WX.ripT <= 0) { WX.ripT = lerp(0.35, 0.06, rAmt); for (let k = 0; k < 2; k++) { const a = Math.random() * 6.28, r = 3 + Math.random() * 24, x = cp.x + Math.cos(a) * r, z = cp.z + Math.sin(a) * r; if (waterAt(x, z) !== null) addRipple(x, z); } } }
    { const P = snowP, sA = WX.snow; P.p.visible = sA > 0.01; if (P.p.visible) { if (!P.init) seedPts(P, cp, 25, 20); P.m.opacity = clamp(sA * 1.1, 0, 0.9); const act = Math.round(P.n * sA), a = P.a; P.g.setDrawRange(0, act); const g = 1 + gustNear * 5;
      for (let i = 0; i < act; i++) { const j = i * 3; a[j] += (wdx * g + Math.sin(T * 0.8 + i) * 0.4) * dt; a[j + 1] -= (1.1 + (i % 5) * 0.12) * dt; a[j + 2] += (wdz * g + Math.cos(T * 0.7 + i * 1.3) * 0.4) * dt; wrapXZ(a, j, cp, 25); if (a[j + 1] < hFast(a[j], a[j + 2]) || a[j + 1] > cp.y + 22) a[j + 1] = cp.y + 10 + Math.random() * 9; }
      P.g.attributes.position.needsUpdate = true; } }
    { const P = dustP, dA = WX.dust; P.p.visible = dA > 0.01; if (P.p.visible) { if (!P.init) seedPts(P, cp, 25, 6); P.m.opacity = clamp(dA * 0.55, 0, 0.5); P.m.color.copy(DUSTD).lerp(DUSTN, night); const a = P.a, v = 9 + gustNear * 8;
      for (let i = 0; i < P.n; i++) { const j = i * 3; a[j] += wdx * v * dt; a[j + 2] += wdz * v * dt; a[j + 1] += Math.sin(T * 1.3 + i) * 0.6 * dt; wrapXZ(a, j, cp, 25); const g = hFast(a[j], a[j + 2]); if (a[j + 1] < g + 0.1 || a[j + 1] > g + 7) a[j + 1] = g + 0.2 + Math.random() * 5; }
      P.g.attributes.position.needsUpdate = true; } } }

  // lightning over the nearest ridge; thunder is dispatched to the audio score after the sound-travel delay
  await __y(); const boltG = new THREE.BufferGeometry(); await __y(); boltG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(18 * 3), 3));
  await __y(); const bolt = new THREE.Line(boltG, new THREE.LineBasicMaterial({ color: '#eef4ff', transparent: true, opacity: 0, fog: false, depthWrite: false })); await __y(); bolt.name = 'lightning'; await __y(); bolt.frustumCulled = false; await __y(); scene.add(bolt);
  await __y(); const boltGlow = glowSprite('#cfe0ff', 90, 0); await __y(); scene.add(boltGlow);
  function strike(bp) { const ei = edgeInfo(bp.x, bp.z), d = clamp(ei.e + 40, 90, 220), side = Math.random() - 0.5;
    const tx = bp.x + ei.ox * d - ei.oz * side * 140, tz = bp.z + ei.oz * d + ei.ox * side * 140, gy = hFast(tx, tz), top = gy + 190, a = boltG.attributes.position.array, x0 = tx + (Math.random() - 0.5) * 30, z0 = tz + (Math.random() - 0.5) * 30;
    for (let i = 0; i < 18; i++) { const u = i / 17, jit = 11 * (1 - u * 0.6); a[i * 3] = lerp(x0, tx, u) + (Math.random() - 0.5) * jit; a[i * 3 + 1] = lerp(top, gy, u); a[i * 3 + 2] = lerp(z0, tz, u) + (Math.random() - 0.5) * jit; }
    boltG.attributes.position.needsUpdate = true; WX.flash = 1; WX.boltT = 0.32; boltGlow.position.set(tx, gy + 70, tz); boltGlow.material.opacity = 0.9; setTimeout(() => { WX.flash = Math.max(WX.flash, 0.7); }, 140);
    const dist = Math.hypot(tx - bp.x, tz - bp.z), rx = Math.cos(lastYaw), rz = -Math.sin(lastYaw), pan = clamp(((tx - bp.x) * rx + (tz - bp.z) * rz) / Math.max(1, dist), -1, 1);
    setTimeout(() => window.dispatchEvent(new CustomEvent('ap:thunder', { detail: { power: clamp(1.4 - dist / 400, 0.3, 1), pan } })), Math.min(4500, dist / 340 * 1000)); }

  // ---- wind gusts: a front that sweeps across the ground along the wind direction
  await __y(); const GU = { t: -1, next: 8 + Math.random() * 12, start: 0, str: 0, dur: 12, heard: false };
  function gustTick(dt, bp) { const along = bp.x * wdx + bp.z * wdz; GU.next -= dt; gustNear *= Math.exp(-dt * 2);
    if (GU.t < 0 && GU.next <= 0) { GU.t = 0; GU.str = clamp(0.55 + Math.random() * 0.55 + WX.stormAmt * 0.5 + WX.dust * 0.4, 0, 1.6); GU.start = along - 75; GU.next = lerp(16, 6, clamp(WX.stormAmt + WX.dust, 0, 1)) + Math.random() * 18; GU.heard = false; }
    if (GU.t >= 0) { GU.t += dt; const u = GU.t / GU.dur, pos = GU.start + GU.t * 13; gustPosU.value = pos; gustAmtU.value = GU.str * Math.pow(Math.sin(clamp(u, 0, 1) * Math.PI), 0.4);
      const dF = along - pos; gustNear = Math.max(gustNear, Math.exp(-(dF * dF) / 200) * GU.str);
      if (!GU.heard && dF < 32 && dF > 0) { GU.heard = true; window.dispatchEvent(new CustomEvent('ap:gust', { detail: { power: GU.str } })); }
      if (Math.abs(dF) < 40 && Math.random() < dt * 30 * GU.str) { const off = (Math.random() - 0.5) * 30, x = bp.x - dF * wdx - wdz * off, z = bp.z - dF * wdz + wdx * off, sandy = REG.w.canyon > 0.4 || REG.w.coast > 0.5;
        if (sandy) spawnDust(1, x, z, 2); else if (season === 'winter' || WX.snowCover > 0.4) spawnDust(1, x, z, 3); }
      if (u >= 1) { GU.t = -1; gustAmtU.value = 0; } } }

  // ---- tyre tracks: fading decals on sand, dirt, mud and snow
  await __y(); const TRN = lp ? 400 : 1000, trGeo = new THREE.PlaneGeometry(0.13, 0.36).rotateX(-Math.PI / 2), trBorn = new Float32Array(TRN).fill(-1e4), trCol = new Float32Array(TRN * 3);
  await __y(); trGeo.setAttribute('aBorn', new THREE.InstancedBufferAttribute(trBorn, 1)); await __y(); trGeo.setAttribute('aCol', new THREE.InstancedBufferAttribute(trCol, 3));
  await __y(); const trU = { uTime: { value: 0 } };
  await __y(); const tracks = new THREE.InstancedMesh(trGeo, new THREE.ShaderMaterial({ uniforms: trU, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    vertexShader: 'attribute float aBorn; attribute vec3 aCol; uniform float uTime; varying float vA; varying vec3 vC; varying vec2 vU; void main(){ vU = uv; vC = aCol; vA = clamp(1.0 - (uTime - aBorn) / 50.0, 0.0, 1.0); gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying float vA; varying vec3 vC; varying vec2 vU; void main(){ float e = smoothstep(0.0, 0.3, vU.x) * smoothstep(1.0, 0.7, vU.x); float a = vA * e * 0.6; if (a < 0.01) discard; gl_FragColor = vec4(vC, a); }' }), TRN);
  await __y(); tracks.name = 'tyre-tracks'; await __y(); tracks.frustumCulled = false; await __y(); for (let i = 0; i < TRN; i++) putI(tracks, i, 0, -999, 0, 0, 1, 1, 1); await __y(); scene.add(tracks);
  await __y(); const TRK = { sand: SC('#6e5a3e'), dirt: SC('#3a2d22'), snow: SC('#8e9aae'), mud: SC('#2a2018') }; await __y(); let trI = 0, trD = 0;
  function tracksTick(dt, T, bp, fr) { trU.uTime.value = T; if (!grounded || curSpeed < 0.6) return; trD += curSpeed * dt; if (trD < 0.3) return; trD = 0;
    const rx = bp.x - fr.f.x * 0.62, rz = bp.z - fr.f.z * 0.62; if (waterAt(rx, rz) !== null) return;
    const sandy = (zBand(rz, COAST.zHi, COAST.zLo, 1) > 0.5 && rx < coastX(rz) + 30) || Math.hypot(rx - DESERT.x, rz - DESERT.z) < DESERT.r * 1.2, onRd = roadDist(rx, rz) < roadW(rz) + 0.2; let c = null;
    if (sandy) c = TRK.sand; else if (onRd) { if (trailMix(rz) > 0.5) c = WX.wet > 0.3 ? TRK.mud : TRK.dirt; } else c = (season === 'winter' || REG.w.snow > 0.5 || WX.snowCover > 0.4) ? TRK.snow : WX.wet > 0.3 ? TRK.mud : TRK.dirt;
    if (!c) return; const i = trI++ % TRN, ga = groundY(rx + fr.f.x * 0.3, rz + fr.f.z * 0.3), gb = groundY(rx - fr.f.x * 0.3, rz - fr.f.z * 0.3);
    dummy.position.set(rx, groundY(rx, rz) + 0.035, rz); dummy.rotation.set(Math.atan2(ga - gb, 0.6), Math.atan2(-fr.f.x, -fr.f.z), 0, 'YXZ'); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); tracks.setMatrixAt(i, dummy.matrix); dummy.rotation.order = 'XYZ'; tracks.instanceMatrix.needsUpdate = true;
    trBorn[i] = T; trCol[i * 3] = c.r; trCol[i * 3 + 1] = c.g; trCol[i * 3 + 2] = c.b; trGeo.attributes.aBorn.needsUpdate = true; trGeo.attributes.aCol.needsUpdate = true; }

  // ---- regional flora (deferred so the first frame stays fast)
  await __y(); deferred.push(() => {
    const n = lp ? 0.45 : 1, zF0 = zW(0.53), zF1 = zW(0.9);
    { const N = Math.round(2600 * n), lv = inst(new THREE.CircleGeometry(0.1, 4).rotateX(-Math.PI / 2), std('#ffffff', { roughness: 0.95, side: THREE.DoubleSide }), N, 'fallen-leaves'), LVC = ['#6d5a2e', '#8a6a2c', '#5e6b2a', '#a0742e', '#7a5a2a']; let k = 0;
      for (let tr = 0; tr < N && k < N; tr++) { const z = lerp(zF0, zF1, rnd()), x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (3.5 + rnd() * 45); if (!okSpot(x, z, 3.2)) continue;
        for (let j = 0; j < 6 && k < N; j++) { const xx = x + (rnd() - 0.5) * 2.4, zz = z + (rnd() - 0.5) * 2.4; putI(lv, k++, xx, H(xx, zz) + 0.03, zz, rnd() * 6, 0.7 + rnd() * 0.8, 1, 1 + rnd() * 0.6, pick(LVC), (rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.3); } } lv.count = k; scene.add(lv); }
    { const N = lp ? 24 : 55, st = inst(new THREE.CylinderGeometry(0.26, 0.34, 1, 8).translate(0, 0.5, 0), std('#6a4c32'), N, 'tree-stumps'), top = inst(new THREE.CylinderGeometry(0.25, 0.25, 0.02, 8), std('#c8a878'), N, 'stump-tops'); let k = 0;
      for (let tr = 0; tr < N * 6 && k < N; tr++) { const z = lerp(zF0, zF1, rnd()), x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (5 + rnd() * 40); if (!okSpot(x, z, 4) || collideAt(x, z, 0.6)) continue; const y = H(x, z) - 0.05, h = 0.3 + rnd() * 0.35, s = 0.8 + rnd() * 0.6;
        putI(st, k, x, y, z, rnd() * 6, s, h, s); putI(top, k, x, y + h + 0.005, z, 0, s * 0.96, 1, s * 0.96); k++; addSolid(x, z, 0.35 * s); } st.count = top.count = k; scene.add(st, top); }
    { const cap = lp ? 300 : 800, vm = inst(new THREE.CylinderGeometry(0.018, 0.01, 1, 3).translate(0, -0.5, 0), std('#4f6e2c'), cap, 'vines'), m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); let k = 0;
      scene.children.forEach(o => { if (o.name !== 'round-crowns' || !o.isInstancedMesh) return; for (let i = 0; i < o.count && k < cap; i++) { o.getMatrixAt(i, m4); m4.decompose(p, q, s); const pr = fO(p.z); if (pr < 0.55 || pr > 0.9 || rnd() > 0.3) continue;
        const nv = 2 + Math.floor(rnd() * 3); for (let j = 0; j < nv && k < cap; j++) { const a = rnd() * 6.28, rr = s.x * (0.55 + rnd() * 0.3); putI(vm, k++, p.x + Math.cos(a) * rr, p.y - s.y * 0.25, p.z + Math.sin(a) * rr, 0, 1, 1.2 + rnd() * 2.2, 1, rnd() < 0.5 ? '#4f6e2c' : '#5f7e34', (rnd() - 0.5) * 0.15, (rnd() - 0.5) * 0.15); } } });
      vm.count = k; scene.add(vm); } });
  await __y(); deferred.push(() => {
    const n = lp ? 0.45 : 1, mEll = () => { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * MEADOW.r * 1.1; return [MEADOW.x + Math.cos(a) * r / 0.8, MEADOW.z + Math.sin(a) * r]; };
    { const N = Math.round(4200 * n), mat = std('#ffffff', { roughness: 0.85 }); windify(mat, 0.5, 1); const tg = inst(new THREE.ConeGeometry(0.035, 1, 3).translate(0, 0.5, 0), mat, N, 'tall-grass'), TGC = ['#86a84a', '#9ab452', '#7a9a40', '#a8b85a', '#b0b060']; let k = 0;
      for (let tr = 0; tr < N * 2 && k < N; tr++) { const [x, z] = mEll(); if (Math.hypot(x - MEADOW.x, z - MEADOW.z) < 7 || Math.hypot(x - SECRET_POS.meadow.x, z - SECRET_POS.meadow.z) < 2.5 || roadDist(x, z) < 4 || collideAt(x, z, 0.2)) continue;
        putI(tg, k++, x, H(x, z) - 0.03, z, 0, 1, 0.6 + rnd() * 0.7, 1, pick(TGC)); } tg.count = k; scene.add(tg); }
    { const N = lp ? 140 : 320, stems = inst(new THREE.CylinderGeometry(0.007, 0.01, 1, 3).translate(0, 0.5, 0), std('#6a8a3a'), N, 'dandelion-stems'), heads = inst(new THREE.SphereGeometry(0.05, 7, 5), std('#ffffff', { roughness: 0.7 }), N, 'dandelion-heads'); let k = 0;
      for (let tr = 0; tr < N * 3 && k < N; tr++) { let x, z; if (rnd() < 0.65) [x, z] = mEll(); else { z = zW(0.03 + rnd() * 0.3); x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (4 + rnd() * 16); }
        if (roadDist(x, z) < 3.6 || collideAt(x, z, 0.2) || waterAt(x, z) !== null) continue; const y = H(x, z), h = 0.25 + rnd() * 0.3, puff = rnd() < 0.55;
        putI(stems, k, x, y, z, 0, 1, h, 1); putI(heads, k, x, y + h, z, rnd() * 6, puff ? 1 : 0.75, puff ? 1 : 0.5, puff ? 1 : 0.75, puff ? '#f4f2ea' : '#f2cf2e'); k++; } stems.count = heads.count = k; scene.add(stems, heads); }
    { const N = lp ? 40 : 80, st = inst(new THREE.CylinderGeometry(0.018, 0.026, 1, 5).translate(0, 0.5, 0), std('#5a7a2e'), N, 'sunflower-stems'), disc = inst(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 10).rotateX(Math.PI / 2), std('#4a3218'), N, 'sunflower-discs'), pet = inst(new THREE.CylinderGeometry(0.21, 0.21, 0.02, 10).rotateX(Math.PI / 2), std('#f2b81e', { roughness: 0.7 }), N, 'sunflower-petals');
      const pcx = MEADOW.x + Math.cos(2.2) * MEADOW.r * 0.6 / 0.8, pcz = MEADOW.z + Math.sin(2.2) * MEADOW.r * 0.6, face = new THREE.Vector3(-0.5, 0.35, -0.86).normalize(); let k = 0;
      for (let tr = 0; tr < N * 3 && k < N; tr++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 9, x = pcx + Math.cos(a) * r, z = pcz + Math.sin(a) * r; if (roadDist(x, z) < 4 || collideAt(x, z, 0.3)) continue; const y = H(x, z), h = 1.3 + rnd() * 0.6;
        putI(st, k, x, y, z, 0, 1, h, 1); dummy.position.set(x, y + h, z); dummy.scale.setScalar(0.85 + rnd() * 0.3); dummy.lookAt(x + face.x + (rnd() - 0.5) * 0.4, y + h + face.y, z + face.z); dummy.updateMatrix(); disc.setMatrixAt(k, dummy.matrix); dummy.translateZ(-0.02); dummy.updateMatrix(); pet.setMatrixAt(k, dummy.matrix); k++; }
      st.count = disc.count = pet.count = k; scene.add(st, disc, pet); } });
  await __y(); deferred.push(() => {
    const n = lp ? 0.45 : 1;
    { const NPm = lp ? 9 : 16, seg = inst(new THREE.CylinderGeometry(0.12, 0.16, 1, 6).translate(0, 0.5, 0), std('#8a6e4a'), NPm * 6, 'palm-trunks'), fm = std('#ffffff', { side: THREE.DoubleSide }); windify(fm, 0.3);
      const frd = inst(new THREE.ConeGeometry(0.32, 1, 4).translate(0, 0.5, 0), fm, NPm * 7, 'palm-fronds'), up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3(); let si = 0, fi = 0, np = 0;
      for (let tr = 0; tr < 240 && np < NPm; tr++) { const z = lerp(COAST.zHi - 30, COAST.zLo + 30, rnd()), x = coastX(z) + 8 + rnd() * 26; if (Math.abs(z - PIER.z) < 8 || H(x, z) < SEA_Y + 0.6 || roadDist(x, z) < 6 || collideAt(x, z, 1) || Math.hypot(x - LH.x, z - LH.z) < 10) continue;
        let px = x, py = H(x, z) - 0.1, pz = z; const lean = 0.08 + rnd() * 0.12, la = rnd() * 6.28, sl = 0.95 + rnd() * 0.3;
        for (let s = 0; s < 6; s++) { const tilt = lean * (s + 1) * 0.6; dir.set(Math.sin(tilt) * Math.cos(la), Math.cos(tilt), Math.sin(tilt) * Math.sin(la)).normalize(); dummy.position.set(px, py, pz); dummy.quaternion.setFromUnitVectors(up, dir); dummy.scale.set(1 - s * 0.06, sl, 1 - s * 0.06); dummy.updateMatrix(); seg.setMatrixAt(si++, dummy.matrix); px += dir.x * sl; py += dir.y * sl; pz += dir.z * sl; }
        for (let f = 0; f < 7; f++) { dummy.position.set(px, py, pz); dummy.rotation.set(1.25 + rnd() * 0.5, f / 7 * 6.28 + rnd() * 0.3, 0, 'YXZ'); dummy.scale.set(1, 2.4 + rnd() * 0.6, 0.18); dummy.updateMatrix(); frd.setMatrixAt(fi, dummy.matrix); frd.setColorAt(fi++, TC.set(rnd() < 0.3 ? '#6a8a3a' : '#4f7a32')); dummy.rotation.order = 'XYZ'; }
        addSolid(x, z, 0.35); np++; }
      seg.count = si; frd.count = fi; scene.add(seg, frd); }
    { const N = Math.round(1100 * n), m = std('#ffffff'); windify(m, 0.55); const dg = inst(new THREE.ConeGeometry(0.04, 1, 3).translate(0, 0.5, 0), m, N, 'dune-grass'), C2 = ['#b8b070', '#a8a060', '#c8c088', '#9a9a58']; let k = 0;
      for (let tr = 0; tr < N && k < N; tr++) { const cz = lerp(COAST.zHi - 20, COAST.zLo + 20, rnd()), cx = coastX(cz) + 5 + rnd() * 40; if (H(cx, cz) < SEA_Y + 0.9 || Math.abs(cz - PIER.z) < 3 || roadDist(cx, cz) < 3) continue;
        for (let j = 0; j < 7 && k < N; j++) { const x = cx + (rnd() - 0.5) * 0.7, z = cz + (rnd() - 0.5) * 0.7; putI(dg, k++, x, H(x, z) - 0.02, z, 0, 1, 0.4 + rnd() * 0.5, 1, pick(C2), (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.5); } } dg.count = k; scene.add(dg); }
    { const N = lp ? 100 : 220, sh = inst(new THREE.SphereGeometry(0.05, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2), std('#ffffff', { roughness: 0.5 }), N, 'shells'), C3 = ['#f4e6d6', '#e8c8b8', '#f0d0a8', '#ffffff', '#d8b8c8']; let k = 0;
      for (let tr = 0; tr < N * 4 && k < N; tr++) { const z = lerp(COAST.zHi - 20, COAST.zLo + 20, rnd()), x = coastX(z) - 2 + rnd() * 9, y = H(x, z); if (y < SEA_Y + 0.08 || onPier(x, z)) continue; putI(sh, k++, x, y, z, rnd() * 6, 0.6 + rnd() * 0.8, 0.5, 0.8 + rnd() * 0.6, pick(C3)); } sh.count = k; scene.add(sh); }
    { const inDesert = (x, z) => Math.hypot(x - DESERT.x, z - DESERT.z) < DESERT.r * 1.25 && roadDist(x, z) > 4 && !collideAt(x, z, 0.8) && waterAt(x, z) === null;
      const NC = lp ? 22 : 40, cac = inst(new THREE.CapsuleGeometry(0.2, 1, 4, 8).translate(0, 0.7, 0), std('#ffffff'), NC * 3, 'cacti'); let k = 0, nc = 0;
      for (let tr = 0; tr < NC * 6 && nc < NC; tr++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * DESERT.r * 1.2, x = DESERT.x + Math.cos(a) * r, z = DESERT.z + Math.sin(a) * r; if (!inDesert(x, z)) continue; const y = H(x, z) - 0.1, h = 1.2 + rnd() * 1.6, ry = rnd() * 6;
        putI(cac, k++, x, y, z, ry, 1, h, 1, rnd() < 0.5 ? '#5f7a3e' : '#6a8446'); const na = rnd() < 0.3 ? 0 : rnd() < 0.6 ? 1 : 2;
        for (let j = 0; j < na; j++) { const s = j ? -1 : 1; putI(cac, k++, x + Math.cos(ry) * s * 0.28, y + h * (0.45 + rnd() * 0.3), z - Math.sin(ry) * s * 0.28, ry, 0.6, 0.45 + rnd() * 0.25, 0.6, '#5f7a3e'); }
        addSolid(x, z, 0.4); nc++; } cac.count = k; scene.add(cac);
      const NS = lp ? 70 : 160, shr = inst(new THREE.IcosahedronGeometry(1, 0), std('#ffffff'), NS, 'dry-shrubs'), C4 = ['#8a7448', '#9a8050', '#7a6440', '#a08a5a']; let q = 0;
      for (let tr = 0; tr < NS * 4 && q < NS; tr++) { let x, z; if (rnd() < 0.7 || CZ0 > 1e8) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * DESERT.r * 1.25; x = DESERT.x + Math.cos(a) * r; z = DESERT.z + Math.sin(a) * r; if (!inDesert(x, z)) continue; } else { z = lerp(CZ0, CZ1, rnd()); x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (3.5 + rnd() * 3); if (collideAt(x, z, 0.3)) continue; }
        const s = 0.25 + rnd() * 0.35; putI(shr, q++, x, H(x, z) + s * 0.4, z, rnd() * 6, s, s * 0.7, s, pick(C4)); } shr.count = q; scene.add(shr); } });
  await __y(); deferred.push(() => {
    const n = lp ? 0.45 : 1, inBand = (x, z, a, b) => { const e = edgeInfo(x, z).e; return e > RIM * a && e < RIM * b && hFast(x, z) > SEA_Y + 4 && z < WB.z0 - 10; };
    { const N = Math.round(320 * n), tr2 = inst(new THREE.CylinderGeometry(0.14, 0.24, 1, 5).translate(0, 0.5, 0), std('#4a3a2e'), N, 'frost-pine-trunks'), cr = inst(new THREE.ConeGeometry(1, 1, 8).translate(0, 0.5, 0), std('#ffffff'), N * 2, 'frost-pines'); let k = 0;
      for (let t = 0; t < N * 8 && k < N; t++) { const x = lerp(WB.x0, WB.x1, rnd()), z = lerp(ZEND - 230, WB.z0, rnd()); if (!inBand(x, z, 0.5, 1.02) || roadDist(x, z) < 8) continue; const y = hFast(x, z) - 0.2, h = 4 + rnd() * 5, r = 1 + rnd() * 0.8, th = h * 0.18, c = TC.set('#3e5a48').lerp(SNOWC, 0.55 + rnd() * 0.3).clone();
        putI(tr2, k, x, y, z, 0, 1, th + 0.2, 1); putI(cr, k * 2, x, y + th, z, rnd() * 6, r, h * 0.62, r); cr.setColorAt(k * 2, c); putI(cr, k * 2 + 1, x, y + th + h * 0.38, z, rnd() * 6, r * 0.68, h * 0.5, r * 0.68); cr.setColorAt(k * 2 + 1, c.lerp(SNOWC, 0.3)); k++; }
      tr2.count = k; cr.count = k * 2; scene.add(tr2, cr); }
    { const N = Math.round(220 * n), ic = inst(new THREE.OctahedronGeometry(0.3, 0), std('#bfe6ff', { roughness: 0.15, metalness: 0.1, emissive: '#274a66', emissiveIntensity: 0.7 }), N, 'ice-crystals'); let k = 0;
      for (let t = 0; t < N * 6 && k < N; t++) { const x = lerp(WB.x0, WB.x1, rnd()), z = lerp(ZEND - 230, WB.z0, rnd()); if (!inBand(x, z, 0.55, 0.98) || roadDist(x, z) < 6) continue; const y = hFast(x, z), nn = 3 + Math.floor(rnd() * 3);
        for (let j = 0; j < nn && k < N; j++) { const s = 0.5 + rnd() * 1.1; putI(ic, k++, x + (rnd() - 0.5) * 1.2, y + s * 0.3, z + (rnd() - 0.5) * 1.2, rnd() * 6, s * 0.5, s * 1.6, s * 0.5, rnd() < 0.5 ? '#cfefff' : '#a8d8f8', (rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.6); } } ic.count = k; scene.add(ic); } });

  // ---- lake flora (built now: frogs sit on the pads)
  await __y(); const lilies = [];
  await __y(); { const N = lp ? 35 : 70, pads = inst(new THREE.CylinderGeometry(0.35, 0.35, 0.02, 12), std('#ffffff', { roughness: 0.6 }), N, 'lily-pads'), fl = inst(new THREE.SphereGeometry(0.08, 7, 5), std('#ffffff', { roughness: 0.5 }), N, 'lily-flowers'); let k = 0, q = 0;
    for (let t = 0; t < N * 5 && k < N; t++) { const a = rnd() * 6.28, r = LAKE.r * (0.55 + rnd() * 0.37), x = LAKE.x + Math.cos(a) * r, z = LAKE.z + Math.sin(a) * r; if (hFast(x, z) > LAKE.y - 0.3) continue; const s = 0.7 + rnd() * 0.8;
      putI(pads, k++, x, LAKE.y + 0.035, z, rnd() * 6, s, 1, s, rnd() < 0.5 ? '#4f7a36' : '#5f8a3e'); lilies.push({ x, z, s }); if (rnd() < 0.3) putI(fl, q++, x + 0.1, LAKE.y + 0.09, z, 0, 1, 0.7, 1, rnd() < 0.6 ? '#f4a6c0' : '#fff4f0'); }
    pads.count = k; fl.count = Math.max(0, q); scene.add(pads, fl); }
  await __y(); { const N = lp ? 160 : 360, rd = inst(new THREE.CylinderGeometry(0.012, 0.02, 1, 3).translate(0, 0.5, 0), std('#7a8a48'), N, 'lake-reeds'), ct = inst(new THREE.CapsuleGeometry(0.03, 0.12, 2, 5), std('#5a3a22'), N, 'cattails'); let k = 0, q = 0;
    for (let t = 0; t < N * 8 && k < N; t++) { const a = rnd() * 6.28, r = LAKE.r * (0.92 + rnd() * 0.22), x = LAKE.x + Math.cos(a) * r, z = LAKE.z + Math.sin(a) * r, g = hFast(x, z); if (g < LAKE.y - 0.6 || g > LAKE.y + 0.5 || roadDist(x, z) < 3) continue; const h = 0.9 + rnd() * 0.9, y = Math.min(g, LAKE.y - 0.1);
      putI(rd, k++, x, y, z, 0, 1, h, 1, null, (rnd() - 0.5) * 0.2, (rnd() - 0.5) * 0.2); if (rnd() < 0.4) putI(ct, q++, x, y + h - 0.05, z, 0, 1, 1, 1); }
    rd.count = k; ct.count = Math.max(0, q); scene.add(rd, ct); }

  // ---- tumbleweeds rolling downwind through the canyon pocket
  await __y(); const tumM = std('#a08050', { wireframe: true }), tumbles = [];
  await __y(); const resetTumble = (t, any) => { const r = any ? Math.random() * DESERT.r : DESERT.r * 1.1, a = Math.random() * 6.28, off = (Math.random() - 0.5) * DESERT.r * 1.4;
    t.x = any ? DESERT.x + Math.cos(a) * r : DESERT.x - wdx * r - wdz * off; t.z = any ? DESERT.z + Math.sin(a) * r : DESERT.z - wdz * r + wdx * off; t.y = hFast(t.x, t.z) + 0.42; t.vy = 0; };
  await __y(); for (let k = 0; k < 6; k++) { const m = mk(new THREE.IcosahedronGeometry(0.42, 1), tumM, 'tumbleweed'); m.add(mk(new THREE.IcosahedronGeometry(0.28, 0), tumM, 'tumbleweed-core')); scene.add(m); const t = { m, spd: 2.5 + Math.random() * 2 }; resetTumble(t, true); tumbles.push(t); }

  // ---- fauna
  await __y(); for (let k = 0; k < 4; k++) spawnCritter('boar', [zW(0.6), zW(0.9)], std('#4a3a30'), { wanderSpd: 0.9, fleeSpd: 5, fleeDist: 8, clear: 6, minOff: 10, gait: 9,
    build: (g, mat, legs) => { const body = mk(new THREE.CapsuleGeometry(0.2, 0.38, 4, 8), mat, 'boar-body'); body.rotation.x = Math.PI / 2; body.position.y = 0.34; body.castShadow = !lp; g.add(body);
      const ridge = mk(new THREE.BoxGeometry(0.06, 0.08, 0.5), std('#2a2018'), 'boar-bristles'); ridge.position.set(0, 0.55, 0); g.add(ridge);
      const head = mk(new THREE.BoxGeometry(0.2, 0.2, 0.24), mat, 'boar-head'); head.position.set(0, 0.34, -0.38); g.add(head);
      const snout = mk(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8), std('#7a5a4a'), 'boar-snout'); snout.rotation.x = Math.PI / 2; snout.position.set(0, 0.3, -0.53); g.add(snout);
      [-1, 1].forEach(s => { const tusk = mk(new THREE.ConeGeometry(0.012, 0.07, 4), std('#efe6d0'), 'boar-tusk'); tusk.position.set(s * 0.06, 0.27, -0.5); tusk.rotation.x = -0.6; g.add(tusk); const ear = mk(new THREE.ConeGeometry(0.035, 0.08, 4), mat, 'boar-ear'); ear.position.set(s * 0.07, 0.47, -0.32); g.add(ear); });
      for (let i = 0; i < 4; i++) { const leg = mk(new THREE.CylinderGeometry(0.04, 0.045, 0.22, 5), mat, 'boar-leg'); leg.position.set((i % 2 ? 1 : -1) * 0.1, 0.11, i < 2 ? -0.2 : 0.2); g.add(leg); legs.push(leg); } } });
  await __y(); { const crabM = std('#c8502e'), crabD = std('#8a2e1a');
    for (let k = 0; k < 9; k++) { let x = 0, z = 0, ok = false; for (let tr = 0; tr < 30 && !ok; tr++) { z = PIER.z + (rnd() - 0.5) * 50; x = coastX(z) + rnd() * 9; ok = H(x, z) > SEA_Y + 0.12 && !onPier(x, z) && Math.abs(z - PIER.z) > 2; } if (!ok) continue;
      const g = new THREE.Group(); g.name = 'crab'; const body = mk(new THREE.SphereGeometry(0.1, 8, 6), crabM, 'crab-body'); body.scale.set(0.8, 0.45, 1.2); body.position.y = 0.07; g.add(body);
      [-1, 1].forEach(s => { const cl = mk(new THREE.SphereGeometry(0.045, 6, 5), crabM, 'crab-claw'); cl.scale.set(1.3, 0.8, 0.8); cl.position.set(0.13, 0.07, s * 0.1); g.add(cl); const e = mk(new THREE.SphereGeometry(0.014, 5, 4), crabD, 'crab-eye'); e.position.set(0.08, 0.13, s * 0.03); g.add(e); });
      const legs = []; for (let i = 0; i < 6; i++) { const s = i < 3 ? -1 : 1, leg = mk(new THREE.CylinderGeometry(0.008, 0.01, 0.12, 4), crabD, 'crab-leg'); leg.position.set(-0.04 + (i % 3) * 0.04, 0.04, s * 0.12); leg.rotation.x = s * 0.9; g.add(leg); legs.push(leg); }
      g.position.set(x, H(x, z), z); g.rotation.y = rnd() * 6; g.scale.setScalar(1.5); scene.add(g);
      critters.push({ g, legs, kind: 'crab', state: 'idle', t: rnd() * 3, phase: rnd() * 6, target: new THREE.Vector3(), hop: false, wanderSpd: 0.6, fleeSpd: 3.2, fleeDist: 4, gait: 18 }); } }
  await __y(); { const lizM = std('#9a8a52'), lizD = std('#6a5a32');
    critters.filter(c => c.kind === 'roadrunner').forEach(rr => { for (let tr = 0; tr < 10; tr++) { const a = rnd() * 6.28, r = 3 + rnd() * 5, x = rr.g.position.x + Math.cos(a) * r, z = rr.g.position.z + Math.sin(a) * r; if (collideAt(x, z, 0.3) || waterAt(x, z) !== null || roadDist(x, z) < 2) continue;
      const g = new THREE.Group(); g.name = 'lizard'; const body = mk(new THREE.CapsuleGeometry(0.035, 0.14, 3, 6), lizM, 'lizard-body'); body.rotation.x = Math.PI / 2; body.position.y = 0.035; g.add(body);
      const head = mk(new THREE.SphereGeometry(0.03, 6, 5), lizM, 'lizard-head'); head.scale.set(1, 0.7, 1.4); head.position.set(0, 0.04, -0.12); g.add(head);
      const tail = mk(new THREE.ConeGeometry(0.025, 0.2, 5), lizD, 'lizard-tail'); tail.rotation.x = Math.PI / 2; tail.position.set(0, 0.03, 0.18); g.add(tail);
      const legs = []; for (let i = 0; i < 4; i++) { const leg = mk(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 3), lizD, 'lizard-leg'); leg.rotation.z = (i % 2 ? 1 : -1) * 1.1; leg.position.set((i % 2 ? 1 : -1) * 0.04, 0.02, i < 2 ? -0.05 : 0.05); g.add(leg); legs.push(leg); }
      g.position.set(x, H(x, z), z); g.rotation.y = rnd() * 6; g.scale.setScalar(1.6); scene.add(g);
      critters.push({ g, legs, kind: 'lizard', state: 'idle', t: rnd() * 3, phase: rnd() * 6, target: new THREE.Vector3(), hop: false, wanderSpd: 0.9, fleeSpd: 6.5, fleeDist: 3.2, gait: 20 }); rr.nextChase = 6 + rnd() * 10; break; } }); }
  await __y(); const lizards = critters.filter(c => c.kind === 'lizard'), runners = critters.filter(c => c.kind === 'roadrunner');
  await __y(); const faceTo = (g, dx, dz, k) => { const ty = Math.atan2(-dx, -dz); let dy = ty - g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); g.rotation.y += dy * k; };
  function chaseTick(dt) { for (const rr of runners) { if (Math.hypot(rr.g.position.x - camera.position.x, rr.g.position.z - camera.position.z) > 160) continue;
      if (rr.state === 'idle' || rr.state === 'walk') { rr.nextChase = (rr.nextChase || 8) - dt; if (rr.nextChase <= 0) { rr.nextChase = 9 + Math.random() * 12; let best = null, bd = 16; for (const l of lizards) { const d = Math.hypot(l.g.position.x - rr.g.position.x, l.g.position.z - rr.g.position.z); if (d < bd) { bd = d; best = l; } } if (best) { rr.state = 'chase'; rr.prey = best; rr.t = 3.5 + Math.random() * 2; } } }
      if (rr.state !== 'chase') { if (rr.prey && rr.prey.state === 'chased') { rr.prey.state = 'idle'; rr.prey.t = 1; } continue; }
      const pl = rr.prey, p = pl.g.position, dx = p.x - rr.g.position.x, dz = p.z - rr.g.position.z, d = Math.hypot(dx, dz) || 1; rr.t -= dt;
      if (rr.t <= 0 || d < 0.35) { rr.state = 'idle'; rr.t = 1.5 + Math.random() * 2; if (pl.state === 'chased') { pl.state = 'idle'; pl.t = 1; } continue; }
      const [ax, az] = dinoAvoid(rr.g.position.x, rr.g.position.z, dx / d, dz / d); rr.g.position.x += ax * 6.2 * dt; rr.g.position.z += az * 6.2 * dt; rr.g.position.y = H(rr.g.position.x, rr.g.position.z); faceTo(rr.g, ax, az, Math.min(1, dt * 10));
      rr.phase += dt * rr.gait * 1.4; rr.legs.forEach((l, i) => { l.rotation.x = Math.sin(rr.phase + (i % 2 ? Math.PI : 0)) * 0.9; });
      if (d < 5 && (pl.state === 'idle' || pl.state === 'walk' || pl.state === 'chased')) { pl.state = 'chased'; const zig = Math.sin(performance.now() * 0.006 + pl.phase) * 0.7, ex = dx / d - dz / d * zig, ez = dz / d + dx / d * zig, el = Math.hypot(ex, ez) || 1, [bx, bz] = dinoAvoid(p.x, p.z, ex / el, ez / el);
        p.x += bx * 5.6 * dt; p.z += bz * 5.6 * dt; p.y = H(p.x, p.z); faceTo(pl.g, bx, bz, Math.min(1, dt * 12)); pl.phase += dt * pl.gait; pl.legs.forEach((l, i) => { l.rotation.x = Math.sin(pl.phase + (i % 2 ? Math.PI : 0)) * 0.8; }); } } }

  // frogs on the lake shore + lily pads
  await __y(); const frogM = std('#4f8a3a'), frogB = std('#c8d27a'), frogE = std('#1a1a12'), frogs = [];
  await __y(); for (let k = 0; k < 9; k++) { const g = new THREE.Group(); g.name = 'frog';
    const body = mk(new THREE.SphereGeometry(0.075, 8, 6), frogM, 'frog-body'); body.scale.set(1, 0.6, 1.25); body.position.y = 0.045; g.add(body);
    const belly = mk(new THREE.SphereGeometry(0.06, 8, 6), frogB, 'frog-belly'); belly.scale.set(1, 0.45, 1.1); belly.position.set(0, 0.03, -0.01); g.add(belly);
    [-1, 1].forEach(s => { const e = mk(new THREE.SphereGeometry(0.02, 6, 5), frogM, 'frog-eye'); e.position.set(s * 0.035, 0.085, -0.05); g.add(e); const p = mk(new THREE.SphereGeometry(0.011, 5, 4), frogE, 'frog-pupil'); p.position.set(s * 0.04, 0.09, -0.066); g.add(p);
      const leg = mk(new THREE.CapsuleGeometry(0.018, 0.07, 2, 4), frogM, 'frog-leg'); leg.rotation.x = Math.PI / 2; leg.position.set(s * 0.06, 0.02, 0.06); g.add(leg); });
    g.scale.setScalar(1.6); g.visible = false; scene.add(g); frogs.push({ g, belly, st: 'hide', t: Math.random() * 3, ph: Math.random() * 6, from: new THREE.Vector3(), to: new THREE.Vector3(), u: 0, leap: false }); }
  await __y(); const frogSpot = () => { if (lilies.length && Math.random() < 0.3) { const l = lilies[Math.floor(Math.random() * lilies.length)]; return { x: l.x, y: LAKE.y + 0.05, z: l.z }; }
    for (let t = 0; t < 20; t++) { const a = Math.random() * 6.28, r = LAKE.r * (0.95 + Math.random() * 0.17), x = LAKE.x + Math.cos(a) * r, z = LAKE.z + Math.sin(a) * r, g = hFast(x, z); if (g > LAKE.y - 0.05 && g < LAKE.y + 0.7) return { x, y: g, z }; } return null; };
  function frogTick(dt, T, bp) { if (Math.hypot(camera.position.x - LAKE.x, camera.position.z - LAKE.z) > 220) return;
    for (const f of frogs) { const g = f.g;
      if (f.st === 'hide') { f.t -= dt; if (f.t <= 0) { const s = frogSpot(); if (s && Math.hypot(s.x - bp.x, s.z - bp.z) > 14) { g.position.set(s.x, s.y, s.z); g.rotation.set(0, Math.atan2(-(LAKE.x - s.x), -(LAKE.z - s.z)), 0); f.st = 'sit'; f.t = 2 + Math.random() * 4; g.visible = true; } else f.t = 2; } continue; }
      if (f.st === 'sit') { f.belly.scale.y = 0.45 + Math.max(0, Math.sin(T * 7 + f.ph)) * 0.25; const d = Math.min(Math.hypot(bp.x - g.position.x, bp.z - g.position.z), Math.hypot(dino.position.x - g.position.x, dino.position.z - g.position.z));
        if (d < 2.5 + curSpeed * 0.35 + boostAmt * 3) { f.from.copy(g.position); const dx = LAKE.x - g.position.x, dz = LAKE.z - g.position.z, dl = Math.hypot(dx, dz) || 1; f.to.set(g.position.x + dx / dl * 1.8, LAKE.y - 0.1, g.position.z + dz / dl * 1.8); f.st = 'jump'; f.leap = true; f.u = 0; }
        else { f.t -= dt; if (f.t <= 0) { const s = frogSpot(); if (s && Math.hypot(s.x - g.position.x, s.z - g.position.z) < 6) { f.from.copy(g.position); f.to.set(s.x, s.y, s.z); f.st = 'jump'; f.leap = false; f.u = 0; } else f.t = 2 + Math.random() * 5; } }
        if (f.st === 'jump') faceTo(g, f.to.x - f.from.x, f.to.z - f.from.z, 1); continue; }
      if (f.st === 'jump') { f.u = Math.min(1, f.u + dt / 0.45); g.position.lerpVectors(f.from, f.to, f.u); g.position.y += Math.sin(f.u * Math.PI) * 0.35; g.rotation.x = -Math.cos(f.u * Math.PI) * 0.5;
        if (f.u >= 1) { g.rotation.x = 0; if (f.leap) { spawnSpray(6, f.to.x, LAKE.y, f.to.z, 0.5); addRipple(f.to.x, f.to.z); g.visible = false; f.st = 'hide'; f.t = 8 + Math.random() * 12; } else { f.st = 'sit'; f.t = 2 + Math.random() * 5; } } } } }

  // heron wading the river shallows
  await __y(); const heron = (() => { const zH = lerp(RIV.zHi, RIV.zLo, 0.3), gM = std('#8e98a0'), wM = std('#dfe4e8'), bM = std('#d8a830'), lM = std('#c8a048'), g = new THREE.Group(); g.name = 'heron';
    const body = mk(new THREE.SphereGeometry(0.2, 10, 8), gM, 'heron-body'); body.scale.set(0.9, 0.95, 1.9); body.position.y = 1.0; g.add(body);
    const neck = new THREE.Group(); neck.position.set(0, 1.05, -0.3); g.add(neck);
    const nk = mk(new THREE.CylinderGeometry(0.03, 0.045, 0.46, 6), wM, 'heron-neck'); nk.position.set(0, 0.22, -0.05); nk.rotation.x = -0.3; neck.add(nk);
    const hd = mk(new THREE.SphereGeometry(0.055, 8, 6), wM, 'heron-head'); hd.position.set(0, 0.46, -0.12); neck.add(hd);
    const bk = mk(new THREE.ConeGeometry(0.018, 0.22, 5), bM, 'heron-beak'); bk.rotation.x = -Math.PI / 2; bk.position.set(0, 0.45, -0.27); neck.add(bk);
    const legs = [-1, 1].map(s => { const l = mk(new THREE.CylinderGeometry(0.012, 0.012, 0.85, 4), lM, 'heron-leg'); l.position.set(s * 0.05, 0.43, 0.02); g.add(l); return l; });
    const wings = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * 0.12, 1.05, 0); const w = mk(new THREE.BoxGeometry(0.9, 0.02, 0.36).translate(s * 0.45, 0, 0), gM, 'heron-wing'); p.add(w); p.scale.x = 0.25; g.add(p); return p; });
    g.scale.setScalar(1.1); scene.add(g);
    const place = z => { const wy = roadY(z) - 2.2, x = riverX(z) + 5.3; g.position.set(x, Math.max(H(x, z), wy - 0.4), z); };
    place(zH); return { g, neck, legs, wings, place, st: 'stand', t: 4, strike: -1, from: new THREE.Vector3(), to: new THREE.Vector3(), u: 0, dur: 1 }; })();
  function heronTick(dt, T, bp) { const h = heron, g = h.g; if (Math.hypot(camera.position.x - g.position.x, camera.position.z - g.position.z) > 300) return;
    const d = Math.min(Math.hypot(bp.x - g.position.x, bp.z - g.position.z), Math.hypot(dino.position.x - g.position.x, dino.position.z - g.position.z) * 2.5);
    if (h.st === 'stand') { h.neck.rotation.y = Math.sin(T * 0.3) * 0.4; h.t -= dt;
      if (h.strike >= 0) { h.strike += dt / 0.5; h.neck.rotation.x = -Math.sin(Math.min(1, h.strike) * Math.PI) * 1.1; if (h.strike > 0.5 && !h.splashed) { h.splashed = true; const p = h.neck.localToWorld(new THREE.Vector3(0, 0.45, -0.35)); spawnSpray(4, p.x, roadY(p.z) - 2.2, p.z, 0.35); addRipple(p.x, p.z); } if (h.strike >= 1) { h.strike = -1; h.neck.rotation.x = 0; } }
      else if (h.t <= 0) { h.strike = 0; h.splashed = false; h.t = 5 + Math.random() * 6; }
      if (d < 10 + curSpeed * 0.6 + boostAmt * 5) { const sg = g.position.z - bp.z >= 0 ? 1 : -1; let zt = g.position.z + sg * 70; if (zt > RIV.zHi - 10 || zt < RIV.zLo + 10) zt = g.position.z - sg * 70; zt = clamp(zt, RIV.zLo + 10, RIV.zHi - 10);
        h.from.copy(g.position); h.to.set(riverX(zt) + 5.3, 0, zt); h.to.y = Math.max(H(h.to.x, zt), roadY(zt) - 2.6); h.dur = Math.max(3, h.from.distanceTo(h.to) / 9); h.u = 0; h.st = 'fly'; h.neck.rotation.x = 0.3; } }
    else { h.u = Math.min(1, h.u + dt / h.dur); const e = h.u * h.u * (3 - 2 * h.u); g.position.lerpVectors(h.from, h.to, e); g.position.y += Math.sin(h.u * Math.PI) * 6; faceTo(g, h.to.x - h.from.x, h.to.z - h.from.z, Math.min(1, dt * 4));
      const spread = Math.min(1, Math.sin(h.u * Math.PI) * 4), flap = (h.u < 0.3 || h.u > 0.8 ? Math.sin(T * 9) * 0.6 : Math.sin(T * 3) * 0.12); h.wings.forEach((w, i) => { w.scale.x = lerp(0.25, 1, spread); w.rotation.z = (i ? -1 : 1) * flap * spread; }); h.legs.forEach(l => { l.rotation.x = 1.1 * spread; });
      if (h.u >= 1) { h.st = 'stand'; h.t = 3; h.neck.rotation.x = 0; h.wings.forEach(w => { w.scale.x = 0.25; w.rotation.z = 0; }); h.legs.forEach(l => { l.rotation.x = 0; }); } } }

  // eagles soaring over the ridges
  await __y(); const eagles = [0.22, 0.5, 0.78].map((pz, k) => { const eM = std('#4a3422'), hM = std('#f2efe6'), g = new THREE.Group(); g.name = 'eagle';
    const body = mk(new THREE.ConeGeometry(0.16, 0.9, 6), eM, 'eagle-body'); body.rotation.x = -Math.PI / 2; g.add(body);
    const head = mk(new THREE.SphereGeometry(0.1, 8, 6), hM, 'eagle-head'); head.position.set(0, 0.03, -0.48); g.add(head);
    const beak = mk(new THREE.ConeGeometry(0.03, 0.1, 5), std('#e0b03a'), 'eagle-beak'); beak.rotation.x = -Math.PI / 2; beak.position.set(0, 0.01, -0.6); g.add(beak);
    const tail = mk(new THREE.BoxGeometry(0.3, 0.02, 0.3), hM, 'eagle-tail'); tail.position.set(0, 0, 0.5); g.add(tail);
    const wings = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * 0.08, 0.02, -0.05); p.add(mk(new THREE.BoxGeometry(1.2, 0.03, 0.36).translate(s * 0.6, 0, 0), eM, 'eagle-wing')); g.add(p); return p; });
    g.scale.setScalar(1.5); scene.add(g); const zc = zW(pz), cx = roadX(zc) + (k % 2 ? 1 : -1) * 170;
    return { g, wings, cx, cz: zc, r: 45 + k * 12, h: Math.max(hFast(cx, zc), roadY(zc)) + 45, ph: k * 2, spd: 0.12 + k * 0.02, dive: -1, nextDive: 15 + Math.random() * 25, flapT: 0, px: 0, pz: 0 }; });
  function eagleTick(dt, T) { for (const e of eagles) { e.ph += dt * e.spd; e.nextDive -= dt; if (e.dive < 0 && e.nextDive <= 0) { e.dive = 0; e.nextDive = 20 + Math.random() * 25; }
      let off = 0; if (e.dive >= 0) { e.dive += dt / 5; off = Math.sin(Math.min(1, e.dive) * Math.PI) * 28; if (e.dive >= 1) e.dive = -1; }
      const x = e.cx + Math.cos(e.ph) * e.r, z = e.cz + Math.sin(e.ph) * e.r; e.g.position.set(x, e.h + Math.sin(e.ph * 2.3) * 3 - off, z); faceTo(e.g, x - e.px, z - e.pz, 1); e.px = x; e.pz = z; e.g.rotation.z = 0.3;
      e.flapT -= dt; if (e.flapT < -8 - Math.random() * 4) e.flapT = 1.5; const fl = e.flapT > 0 ? Math.sin(T * 5) * 0.5 : 0.12; e.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * fl; }); } }

  // fox den with playful cubs that bolt inside when you come close
  await __y(); const buildFox = sc => { const g = new THREE.Group(); g.name = 'fox'; const legs = [], mat = cM.fox;
    const body = mk(new THREE.CapsuleGeometry(0.11, 0.22, 4, 8), mat, 'fox-body'); body.rotation.z = Math.PI / 2; body.position.y = 0.16; g.add(body);
    const head = mk(new THREE.ConeGeometry(0.09, 0.2, 6), mat, 'fox-head'); head.rotation.x = Math.PI / 2; head.position.set(0, 0.22, -0.24); g.add(head);
    [-1, 1].forEach(s => { const ear = mk(new THREE.ConeGeometry(0.035, 0.08, 5), mat, 'fox-ear'); ear.position.set(s * 0.05, 0.32, -0.2); g.add(ear); });
    const tail = mk(new THREE.ConeGeometry(0.07, 0.42, 7), mat, 'fox-tail'); tail.rotation.x = Math.PI / 2 + 0.5; tail.position.set(0, 0.2, 0.32); g.add(tail);
    const tip = mk(new THREE.SphereGeometry(0.045, 6, 6), cM.foxTip, 'fox-tail-tip'); tip.position.set(0, 0.09, 0.52); g.add(tip);
    for (let i = 0; i < 4; i++) { const leg = mk(new THREE.CylinderGeometry(0.025, 0.03, 0.17, 5), mat, 'fox-leg'); leg.position.set((i % 2 ? 1 : -1) * 0.07, 0.09, i < 2 ? -0.1 : 0.1); g.add(leg); legs.push(leg); }
    g.scale.setScalar(sc); scene.add(g); return { g, legs, ph: Math.random() * 6 }; };
  await __y(); const den = (() => { let x = 0, z = 0, ok = false; for (let tr = 0; tr < 40 && !ok; tr++) { z = zW(0.66 + rnd() * 0.12); x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (12 + rnd() * 8); ok = okSpot(x, z, 8) && !collideAt(x, z, 3); } if (!ok) return null;
    const g = new THREE.Group(); g.name = 'fox-den'; g.position.set(x, H(x, z) - 0.05, z); g.rotation.y = Math.atan2(-(roadX(z) - x), 0);
    const mound = mk(new THREE.SphereGeometry(1.2, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), std('#6a5238'), 'den-mound'); mound.scale.set(1, 0.55, 1); g.add(mound);
    const hole = mk(new THREE.CircleGeometry(0.34, 14), new THREE.MeshBasicMaterial({ color: '#140e0a' }), 'den-hole'); hole.position.set(0, 0.28, -1.1); hole.rotation.set(0.5, Math.PI, 0); g.add(hole);
    const apron = mk(new THREE.CircleGeometry(1, 12), std('#7a5e40'), 'den-apron'); apron.rotation.x = -Math.PI / 2; apron.position.set(0, 0.03, -1.5); g.add(apron);
    scene.add(g); addSolid(x, z, 1.1); clearZones.push({ x, z, r: 3 });
    const ent = g.localToWorld(new THREE.Vector3(0, 0, -1.3)), play = g.localToWorld(new THREE.Vector3(0, 0, -2.7)), ms = g.localToWorld(new THREE.Vector3(0.9, 0, -1.6));
    const mom = buildFox(1); mom.g.position.set(ms.x, H(ms.x, ms.z), ms.z); mom.g.rotation.y = g.rotation.y;
    return { g, ent, play, mom, cubs: [0, 1, 2].map(() => { const c = buildFox(0.5); c.g.position.set(play.x, H(play.x, play.z), play.z); return c; }), hideT: 0 }; })();
  function denTick(dt, T, bp) { if (!den || Math.hypot(camera.position.x - den.ent.x, camera.position.z - den.ent.z) > 160) return;
    const dB = Math.hypot(bp.x - den.ent.x, bp.z - den.ent.z), dD = Math.hypot(dino.position.x - den.ent.x, dino.position.z - den.ent.z);
    if (dB < 7 + curSpeed * 0.5 + boostAmt * 4 || dD < 3) den.hideT = 6; else if (den.hideT > 0 && dB > 14) den.hideT -= dt;
    const hide = den.hideT > 0;
    den.cubs.forEach((c, i) => { const p = c.g.position; let tx, tz, sp;
      if (hide) { tx = den.ent.x; tz = den.ent.z; sp = 4.5; } else { if (!c.g.visible) { c.g.visible = true; p.set(den.ent.x, H(den.ent.x, den.ent.z), den.ent.z); } const a = T * 1.4 * (i % 2 ? 1 : -1) + i * 2.1 + Math.sin(T * 0.8 + i) * 0.9, r = 0.9 + Math.sin(T * 0.6 + i * 1.7) * 0.5; tx = den.play.x + Math.cos(a) * r; tz = den.play.z + Math.sin(a) * r; sp = 3; }
      const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
      if (hide && d < 0.3) { c.g.visible = false; return; }
      if (d > 0.02) { const st = Math.min(sp * dt, d); p.x += dx / d * st; p.z += dz / d * st; faceTo(c.g, dx, dz, Math.min(1, dt * 8)); c.ph += dt * 14; c.legs.forEach((l, j) => { l.rotation.x = Math.sin(c.ph + (j % 2 ? Math.PI : 0)) * 0.6; }); }
      p.y = H(p.x, p.z) + Math.abs(Math.sin(c.ph * 0.5)) * 0.04; });
    const m = den.mom.g; if (dB < 25) faceTo(m, bp.x - m.position.x, bp.z - m.position.z, Math.min(1, dt * 3)); else faceTo(m, den.play.x - m.position.x, den.play.z - m.position.z, Math.min(1, dt * 1.5)); m.scale.setScalar(hide ? 1.06 : 1); }

  function tumbleTick(dt) { if (Math.hypot(camera.position.x - DESERT.x, camera.position.z - DESERT.z) > 280) return;
    for (const t of tumbles) { const sp = t.spd * (0.6 + windAmtU.value * 0.6 + gustNear * 1.5 + WX.dust * 1.2); t.x += wdx * sp * dt; t.z += wdz * sp * dt; t.vy -= 9.8 * dt; t.y += t.vy * dt; const g = hFast(t.x, t.z) + 0.42; if (t.y < g) { t.y = g; t.vy = 1.2 + Math.random() * 2.2 * (0.5 + gustNear); }
      t.m.position.set(t.x, t.y, t.z); t.m.rotation.x += wdz * sp * dt / 0.42; t.m.rotation.z -= wdx * sp * dt / 0.42;
      if (Math.hypot(t.x - DESERT.x, t.z - DESERT.z) > DESERT.r * 1.35) resetTumble(t, false); } }

  await __y(); const SPOTTED = new Set(opts.spotted || []); await __y(); let airT = 0;
  function spotTick(dt, bp) {
    if (!grounded) airT += dt; else if (airT > 0) { if (free && airT > 0.45 && opts.onTrick) opts.onTrick({ air: +airT.toFixed(2), speed: Math.round(curSpeed * 6) }); airT = 0; }
    if (frameNo % 20 !== 0 || curSpeed > 6 || !opts.onSpot) return;
    const near = (p, r) => Math.hypot(p.x - bp.x, p.z - bp.z) < r, hit = k => { if (!SPOTTED.has(k)) { SPOTTED.add(k); opts.onSpot(k); } };
    for (const d of deer) if (near(d.g.position, 16)) { hit('deer'); break; }
    for (const c of critters) if (c.g.visible !== false && near(c.g.position, 10)) hit(c.kind);
    for (const r of rabbits2) if (near(r.g.position, 10)) { hit('rabbit'); break; }
    for (const f of frogs) if (f.g.visible && near(f.g.position, 8)) { hit('frog'); break; }
    if (near(heron.g.position, 22)) hit('heron');
    for (const e of eagles) if (near(e.g.position, 90)) { hit('eagle'); break; }
    for (const o of owls) if (o.g.visible && near(o.g.position, 18)) { hit('owl'); break; }
    if (den && den.cubs.some(c => c.g.visible && near(c.g.position, 12))) hit('fox cubs'); }
  function lifeTick(dt, T, bp, fr, night) { spotTick(dt, bp); v4Tick(dt, T, bp, night);
    alarmR = 4 + curSpeed * 0.7 + boostAmt * 7 + (grounded ? 0 : 2); quietBike = curSpeed < 2.5; bikePU.value.copy(bp);
    if (frameNo % 10 === 0) regionAt(bp.x, bp.z);
    if (seasonDirty || deferred.length !== lastDefLen) { lastDefLen = deferred.length; seasonDirty = false; applySeason(); }
    gustTick(dt, bp); windAmtU.value = clamp(windAmtU.value + WX.stormAmt * 0.35 + WX.dust * 0.3, 0, 1.3); awMat.opacity = Math.max(awMat.opacity, gustNear * 0.45);
    precipTick(dt, T, bp, night);
    if (WX.stormAmt > 0.4) { WX.nextBolt -= dt; if (WX.nextBolt <= 0) { WX.nextBolt = 5 + Math.random() * 11; strike(bp); } }
    WX.boltT -= dt; bolt.material.opacity = WX.boltT > 0 ? (Math.random() < 0.7 ? 1 : 0.25) : bolt.material.opacity * Math.exp(-dt * 20); bolt.visible = bolt.material.opacity > 0.01; boltGlow.material.opacity *= Math.exp(-dt * 6);
    if (terrMat) { const b = terrMat.userData.baseC || SC('#ffffff'); terrMat.color.copy(b).multiplyScalar(1 - WX.wet * 0.2); terrMat.roughness = lerp(0.9, 0.55, WX.wet); const sc = Math.max(season === 'winter' ? 0.6 : 0, WX.snowCover); terrMat.emissive.setRGB(0.1, 0.11, 0.13).multiplyScalar(sc * (1 - night * 0.75)); }
    if (roadMat) { roadMat.color.setScalar(1 - WX.wet * 0.28); roadMat.roughness = lerp(0.9, 0.2, WX.wet); roadMat.metalness = WX.wet * 0.2; }
    if (WX.mist > 0.01) fogPatches.forEach(f => { f.m.material.opacity += WX.mist * 0.14; });
    tracksTick(dt, T, bp, fr); chaseTick(dt); frogTick(dt, T, bp); heronTick(dt, T, bp); eagleTick(dt, T); denTick(dt, T, bp); tumbleTick(dt);
    for (const o of owls) { if (!o.g.visible) continue; const dxo = bp.x - o.g.position.x, dzo = bp.z - o.g.position.z; if (Math.hypot(dxo, dzo) < 40) { const ty = Math.atan2(dxo, dzo); let dy = ty - o.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); o.g.rotation.y += dy * Math.min(1, dt * 2.5); } }
  }

  // ===== v4 · streamed terrain tiles, side roads, new regions, life and light =====
  function warmUp() { try { if (renderer.compileAsync) renderer.compileAsync(scene, camera).catch(() => {}); else renderer.compile(scene, camera); } catch (e) {} }
  function v4Chunk(n) { const dd = V4_DETAIL[n.name]; if (dd) n.userData.dd = dd; const lg = v4LodGeo(n.name); if (!lg) return;
    const lo = new THREE.InstancedMesh(lg, n.material, n.count); lo.name = n.name + '-lod'; lo.instanceMatrix = n.instanceMatrix; if (n.instanceColor) lo.instanceColor = n.instanceColor; lo.computeBoundingSphere(); lo.visible = false; lo.castShadow = false; lo.receiveShadow = false; scene.add(lo); n.userData.lo = lo; n.userData.lodD = V4_LODD[n.name] || 150; }
  await __y(); const JG = ['#3d6a2c', '#47782f', '#335c28', '#52803a'].map(SC), SV = ['#b89a52', '#c6a95e', '#a68a48', '#bda25a'].map(SC), BG = ['#86b45a', '#94c066', '#7aa84e'].map(SC), PINKG = SC('#e6b2c6'), MUD = SC('#6e5a3c');
  function tileCol(C, X, Y, Z, ny, hh) {
    const rel = Y - yAtZ(Z);
    if (rel > 80 && ny > 0.6) C.copy(SNOW); else if (ny < 0.72 || rel > 55) C.copy(ROCK[Math.floor(hh * 3)]); else C.copy(GR[Math.floor(hh * 5)]);
    { const sn = snowAt(X, Y, Z) + (hh - 0.5) * 0.3; if (sn > 0.5 && ny > 0.5) C.copy(hh < 0.08 ? ROCK[1] : SNOW); }
    zoneCol(C, X, Y, Z, ny, hh);
    if (ny > 0.7 && rel < 55) { const wj = regW(JUNGLE, X, Z), ws = regW(SAVANNA, X, Z), wb = regW(BLOSSOM, X, Z);
      if (wj > 0.02) C.lerp(JG[Math.floor(hh * 4)], wj); if (ws > 0.02) C.lerp(SV[Math.floor(hh * 4)], ws); if (wb > 0.02) { C.lerp(BG[Math.floor(hh * 3)], wb); if (hh < 0.05) C.lerp(PINKG, 0.4 * wb); }
      for (const P of WPOOLS) { const d = Math.hypot(X - P.x, Z - P.z); if (d < P.r * 1.3) C.lerp(Y < P.y + 0.35 ? MUD : SAND, 0.8); }
      if (sroadD(X, Z) < 3.6) C.copy(DIRT[Math.floor(hh * 3)]); }
    if (X < coastX(Z) + 14 && Y < SEA_Y + 2.4) C.copy(Y < SEA_Y + 0.5 ? WETSAND : BEACH);
    C.multiplyScalar(0.92 + hh * 0.16); { const l = (C.r + C.g + C.b) / 3; C.r = l + (C.r - l) * 1.14; C.g = l + (C.g - l) * 1.14; C.b = l + (C.b - l) * 1.14; }
    C.offsetHSL((vnoise(X * 0.02 + 31, Z * 0.02) - 0.5) * 0.045, (vnoise(X * 0.045 + 7, Z * 0.045) - 0.5) * 0.1, (vnoise(X * 0.13 + 17, Z * 0.13) - 0.5) * 0.05);
    C.lerp(HAZE, clamp(rel / 150, 0, 0.38)); }
  // Terrain beyond the core box is streamed in 160 m tiles: a coarse pass everywhere, a fine pass near the rider, built a few rows per frame
  await __y(); const tiles = [], TCOL = new THREE.Color();
  await __y(); [[WB.x0, TX0, TZ1, TZ0], [TX1, WB.x1, TZ1, TZ0], [WB.x0, WB.x1, TZ0, WB.z0]].forEach(([x0, x1, z0, z1]) => { const nx = Math.ceil((x1 - x0) / 160), nz = Math.ceil((z1 - z0) / 160), wx = (x1 - x0) / nx, wz = (z1 - z0) / nz;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const t = { x0: x0 + i * wx, x1: x0 + (i + 1) * wx, z0: z0 + j * wz, z1: z0 + (j + 1) * wz, lo: null, hi: null }; t.cx = (t.x0 + t.x1) / 2; t.cz = (t.z0 + t.z1) / 2; t.r = Math.hypot(wx, wz) / 2; tiles.push(t); } });
  await __y(); const tileJob = (t, cell) => { const nx = Math.max(2, Math.round((t.x1 - t.x0) / cell)), nz = Math.max(2, Math.round((t.z1 - t.z0) / cell)); return { t, cell, nx, nz, W: nx + 1, hs: new Float32Array((nx + 1) * (nz + 1)), j: 0 }; };
  await __y(); const tileStep = (J, budget) => { const t0 = performance.now(), t = J.t; while (J.j <= J.nz && performance.now() - t0 < budget) { const zz = lerp(t.z0, t.z1, J.j / J.nz); for (let i = 0; i <= J.nx; i++) J.hs[J.j * J.W + i] = H(lerp(t.x0, t.x1, i / J.nx), zz); J.j++; } return J.j > J.nz; };
  function tileBuild(J) { const { t, nx, nz, W, hs } = J, P = [], Cl = [], X = i => lerp(t.x0, t.x1, i / nx), Z = j => lerp(t.z0, t.z1, j / nz);
    const tri = (ax, ay, az, bx, by, bz, cx, cy, cz, sk) => { P.push(ax, ay, az, bx, by, bz, cx, cy, cz);
      const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az, nX = uy * vz - uz * vy, nY = uz * vx - ux * vz, nZ = ux * vy - uy * vx, nl = Math.hypot(nX, nY, nZ) || 1;
      const mx = (ax + bx + cx) / 3, my = (ay + by + cy) / 3, mz = (az + bz + cz) / 3; tileCol(TCOL, mx, my, mz, sk ? 0.3 : Math.abs(nY / nl), h2(Math.floor(mx * 3.1), Math.floor(mz * 2.7)));
      for (let k = 0; k < 3; k++) Cl.push(TCOL.r, TCOL.g, TCOL.b); };
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = hs[j * W + i], b = hs[j * W + i + 1], c = hs[(j + 1) * W + i], d = hs[(j + 1) * W + i + 1];
      tri(X(i), a, Z(j), X(i), c, Z(j + 1), X(i + 1), b, Z(j)); tri(X(i + 1), b, Z(j), X(i), c, Z(j + 1), X(i + 1), d, Z(j + 1)); }
    const skirt = (x1, y1, z1, x2, y2, z2) => { tri(x1, y1, z1, x2, y2, z2, x2, y2 - 7, z2, true); tri(x1, y1, z1, x2, y2 - 7, z2, x1, y1 - 7, z1, true); tri(x1, y1, z1, x2, y2 - 7, z2, x2, y2, z2, true); tri(x1, y1, z1, x1, y1 - 7, z1, x2, y2 - 7, z2, true); };
    for (let i = 0; i < nx; i++) { skirt(X(i), hs[i], Z(0), X(i + 1), hs[i + 1], Z(0)); skirt(X(i), hs[nz * W + i], Z(nz), X(i + 1), hs[nz * W + i + 1], Z(nz)); }
    for (let j = 0; j < nz; j++) { skirt(X(0), hs[j * W], Z(j), X(0), hs[(j + 1) * W], Z(j + 1)); skirt(X(nx), hs[j * W + nx], Z(j), X(nx), hs[(j + 1) * W + nx], Z(j + 1)); }
    const g = new THREE.BufferGeometry(), nv = P.length / 3, ba = new Float32Array(nv * 3); for (let v = 0; v < nv; v++) ba[v * 3 + (v % 3)] = 1;
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cl, 3)); g.setAttribute('bary', new THREE.BufferAttribute(ba, 3)); g.computeVertexNormals(); g.computeBoundingSphere();
    const m = mk(g, terrMat, 'terrain-tile'); m.receiveShadow = !lp && J.cell < 10; scene.add(m); freeze(m); return m; }
  await __y(); const FINE = lp ? 8 : 5, COARSE = lp ? 20 : 16; await __y(); let tileQ = null, tilesReady = false, fineJob = null;
  function tileTick(cp) {
    if (!tileQ) tileQ = tiles.slice().sort((a, b) => Math.hypot(a.cx - cp.x, a.cz - cp.z) - Math.hypot(b.cx - cp.x, b.cz - cp.z));
    if (tileQ.length) { const t0 = performance.now(); while (tileQ.length && performance.now() - t0 < 5) { const J = tileJob(tileQ.shift(), COARSE); tileStep(J, 1e9); J.t.lo = tileBuild(J); } if (!tileQ.length && !tilesReady) { tilesReady = true; hookAll(); warmUp(); } return; }
    if (fineJob) { if (tileStep(fineJob, 3)) { const t = fineJob.t; t.hi = tileBuild(fineJob); if (t.lo) t.lo.visible = false; fineJob = null; } return; }
    if (frameNo % 6 === 0) { const fineR = (lp ? 170 : 260) * (0.6 + 0.4 * drawDist), lim = scene.fog.far + 60; let best = null, bd = 1e9;
      for (const t of tiles) { const d = Math.hypot(t.cx - cp.x, t.cz - cp.z) - t.r;
        if (t.hi && d > fineR * 1.8) { scene.remove(t.hi); t.hi.geometry.dispose(); t.hi = null; }
        if (!t.hi && d < fineR && d < bd) { bd = d; best = t; }
        const hiOn = !!t.hi && d < fineR * 1.15; if (t.hi) t.hi.visible = hiOn && d < lim; if (t.lo) t.lo.visible = !hiOn && d < lim; }
      if (best) fineJob = tileJob(best, FINE); } }
  await __y(); const polyAt = (S, u) => { const L1 = u * S.len; let i = 1; while (i < S.pts.length - 1 && S.cum[i] < L1) i++; const a = S.pts[i - 1], b = S.pts[i], f = clamp((L1 - S.cum[i - 1]) / (S.cum[i] - S.cum[i - 1]), 0, 1), dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), (b[0] - a[0]) / dl, (b[1] - a[1]) / dl]; };
  // Side roads: dirt ribbons into the new regions, each with a signpost at the junction
  await __y(); { const rm = std('#ffffff', { vertexColors: true, side: THREE.DoubleSide }), RDC = [SC('#8a6a44'), SC('#7b5d3b'), SC('#94744a')], LBL = ['JUNGLE', 'SAVANNA', 'BLOSSOM VALLEY', 'FARMS', 'TEA ESTATE', 'RED CANYON'];
    SROADS.forEach((S, si) => { const pos = [], cols = [], idx = [], sp = new THREE.CatmullRomCurve3(S.pts.map(p => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal').getSpacedPoints(Math.ceil(S.len / 3));
      for (let k = 0; k < sp.length; k++) { const p = sp[k], q = sp[Math.min(sp.length - 1, k + 1)], o = sp[Math.max(0, k - 1)], dx = q.x - o.x, dz = q.z - o.z, dl = Math.hypot(dx, dz) || 1, px = -dz / dl, pz = dx / dl, w = k < 3 ? 2.2 + k * 0.1 : 2.4;
        for (const sd of [-1, 1]) { const x = p.x + px * w * sd, z = p.z + pz * w * sd; pos.push(x, H(x, z) + 0.12, z); const c = RDC[Math.floor(h2(k, sd + 5) * 3)]; cols.push(c.r, c.g, c.b); }
        if (k) idx.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k - 1, 2 * k + 1, 2 * k); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.setIndex(idx); g.computeVertexNormals();
      const road = mk(g, rm, 'side-road'); road.receiveShadow = !lp; scene.add(road);
      const face = txt => { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g2 = c.getContext('2d'); g2.fillStyle = '#2f5a45'; g2.fillRect(0, 0, 512, 128); g2.strokeStyle = '#e9dcc0'; g2.lineWidth = 6; g2.strokeRect(8, 8, 496, 112); g2.fillStyle = '#f3ead9'; g2.font = '600 46px "JetBrains Mono", monospace'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText(txt, 256, 66); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }); };
      const p = sp[4], q = sp[9], dx = q.x - p.x, dz = q.z - p.z, dl = Math.hypot(dx, dz) || 1, sx = p.x - dz / dl * 4.2, sz = p.z + dx / dl * 4.2, sy = H(sx, sz), yaw = Math.atan2(dx, dz) - Math.PI / 2;
      const post = mk(new THREE.CylinderGeometry(0.08, 0.09, 2.6, 8), darkWood, 'region-sign-post'); post.position.set(sx, sy + 1.3, sz); scene.add(post);
      [[LBL[si] + ' →', 0], ['← ' + LBL[si], Math.PI]].forEach(([tx, r]) => { const b = mk(new THREE.PlaneGeometry(2.3, 0.58), face(tx), 'region-sign'); b.position.set(sx, sy + 2.3, sz); b.rotation.y = yaw + r; b.translateZ(0.03); scene.add(b); }); addSolid(sx, sz, 0.3); }); }
  // Pools (lagoon + two waterfall plunge pools) share the lake shader
  await __y(); WPOOLS.forEach(P => { const S2 = P.r * 3, N2 = 40, sd = new Uint8Array(N2 * N2 * 4);
    for (let j = 0; j < N2; j++) for (let i = 0; i < N2; i++) { const x = P.x - S2 / 2 + (i + 0.5) / N2 * S2, z = P.z - S2 / 2 + (j + 0.5) / N2 * S2, o = (j * N2 + i) * 4; sd[o] = Math.round(clamp((P.y - H(x, z)) / 4, 0, 1) * 255); sd[o + 3] = 255; }
    const tex = new THREE.DataTexture(sd, N2, N2); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
    const mat = water.material.clone(); mat.uniforms = { ...wU, shore: { value: tex }, lakeO: { value: new THREE.Vector3(P.x - S2 / 2, P.z - S2 / 2, S2) }, lakeC: { value: new THREE.Vector3(P.x, P.z, P.r) } };
    const m = mk(new THREE.PlaneGeometry(S2, S2, lp ? 16 : 32, lp ? 16 : 32).rotateX(-Math.PI / 2), mat, 'pool'); m.position.set(P.x, P.y, P.z); scene.add(m); });
  // Waterfalls off the plateau lips, with a stream feeding each one
  await __y(); const fallMat = new THREE.ShaderMaterial({ uniforms: { time: wU.time, night: skyU.night }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float time, night; varying vec2 vUv; varying vec3 vW;
      float hs(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hs(i),hs(i+vec2(1.,0.)),f.x),mix(hs(i+vec2(0.,1.)),hs(i+vec2(1.,1.)),f.x),f.y); }
      void main(){ float s=vn(vec2(vUv.x*14.,vUv.y*5.+time*2.6))*.6+vn(vec2(vUv.x*34.,vUv.y*12.+time*4.2))*.4;
        float edge=smoothstep(0.,.14,vUv.x)*smoothstep(1.,.86,vUv.x);
        vec3 c=mix(vec3(.5,.68,.8),vec3(.97,.99,1.),smoothstep(.35,.78,s)); c*=mix(1.,.32,night);
        float dC=length(cameraPosition-vW); gl_FragColor=vec4(c,edge*(.55+.4*s)*(1.-smoothstep(260.,520.,dC))); }` });
  await __y(); const mists = [];
  await __y(); CLIFFS.forEach(P => { const lipS = P.r + 5.5, topY = H(P.x + P.dx * (P.r + 11), P.z + P.dz * (P.r + 11)) + 0.5, hgt = topY - P.y + 0.3, wid = 4.2;
    const g = new THREE.PlaneGeometry(wid, hgt, 1, 14), pp = g.attributes.position; for (let i = 0; i < pp.count; i++) { const v = (pp.getY(i) + hgt / 2) / hgt; pp.setZ(i, (1 - v) * (1 - v) * 3.2); } g.computeVertexNormals();
    const fall = mk(g, fallMat, 'waterfall-v4'); fall.position.set(P.x + P.dx * lipS, P.y + hgt / 2 - 0.3, P.z + P.dz * lipS); fall.rotation.y = Math.atan2(-P.dx, -P.dz); scene.add(fall);
    const pos = [], uvs = [], idx = [], NS = 30, px = -P.dz, pz = P.dx;
    for (let k = 0; k <= NS; k++) { const s = lerp(P.r + 7.5, P.r + 90, k / NS), cx = P.x + P.dx * s, cz = P.z + P.dz * s, y = H(cx, cz) + 0.55;
      for (const sd of [-1, 1]) { pos.push(cx + px * 1.7 * sd, y, cz + pz * 1.7 * sd); uvs.push(sd < 0 ? 0 : 1, k / NS * 6); }
      if (k) idx.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k - 1, 2 * k + 1, 2 * k); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); sg.setIndex(idx); sg.computeVertexNormals(); scene.add(mk(sg, fallMat, 'stream-v4'));
    for (let k = 0; k < 3; k++) { const s = glowSprite('#eaf6ff', 5 + k * 1.5, 0.3); s.position.set(P.x + P.dx * (P.r + 2 - k * 1.2) + (k - 1) * 1.2 * P.dz, P.y + 0.8 + k * 0.6, P.z + P.dz * (P.r + 2 - k * 1.2) - (k - 1) * 1.2 * P.dx); scene.add(s); mists.push({ s, ph: k * 2.1, b: 5 + k * 1.5 }); } });
  // Regional flora (deferred, one region per idle slot)
  await __y(); const steep = (x, z) => Math.hypot(hFast(x + 1.5, z) - hFast(x - 1.5, z), hFast(x, z + 1.5) - hFast(x, z - 1.5)) / 3 > 0.55;
  await __y(); const inReg = (R, f = 1, clr = 4.5) => { for (let t = 0; t < 40; t++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * f, x = R.x + Math.cos(a) * r * R.sx, z = R.z + Math.sin(a) * r * R.sz;
      if (regW(R, x, z) < 0.55 || sroadD(x, z) < clr || waterAt(x, z) !== null) continue; let bad = false;
      for (const P of WPOOLS) if (Math.hypot(x - P.x, z - P.z) < P.r * 1.25 + 2) bad = true;
      for (const P of CLIFFS) { const ox = x - P.x, oz = z - P.z, s = ox * P.dx + oz * P.dz; if (s > P.r && s < P.r + 96 && Math.abs(-ox * P.dz + oz * P.dx) < 4.5) bad = true; }
      if (!bad) return [x, z]; } return null; };
  await __y(); const putY = (m, i, x, y, z, yaw, tilt, sx, sy, sz, col) => { dummy.position.set(x, y, z); dummy.rotation.set(tilt, yaw, 0, 'YXZ'); dummy.scale.set(sx, sy, sz); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); if (col) m.setColorAt(i, TC.set(col)); dummy.rotation.order = 'XYZ'; };
  await __y(); const shroomMat = std('#ffffff', { emissive: '#3ff0d8', emissiveIntensity: 0.25, roughness: 0.5, flatShading: false });
  await __y(); const grassPatch = (R, name, N, amp, GC, spread, hMin, hVar) => { const gm = std('#ffffff'); windify(gm, amp, 1); const gg = inst(new THREE.ConeGeometry(0.042, 1, 3).translate(0, 0.5, 0), gm, N, name); let k = 0;
    for (let i = 0; i < N && k < N; i++) { const q = inReg(R, 1, 3); if (!q) continue; const [cx, cz] = q; for (let j = 0; j < 8 && k < N; j++) { const x = cx + (rnd() - 0.5) * spread, z = cz + (rnd() - 0.5) * spread; putI(gg, k++, x, hFast(x, z) - 0.03, z, 0, 1, hMin + rnd() * hVar, 1, pick(GC), (rnd() - 0.5) * 0.45, (rnd() - 0.5) * 0.45); } }
    gg.count = k; scene.add(gg); };
  await __y(); deferred.push(() => { const n = lp ? 0.5 : 1, R = JUNGLE, JC = ['#2f5e2a', '#3a6e30', '#2a5226', '#467a34', '#355f2c'];
    { const NT = Math.round(320 * n), tr = inst(new THREE.CylinderGeometry(0.3, 0.55, 1, 7).translate(0, 0.5, 0), std('#5a4232'), NT, 'jungle-trunks'), cm = std('#ffffff'); windify(cm, 0.16);
      const cr = inst(new THREE.IcosahedronGeometry(1, 1), cm, NT * 3, 'jungle-crowns'), vm = inst(new THREE.CylinderGeometry(0.02, 0.012, 1, 3).translate(0, -0.5, 0), std('#4a6a2a'), NT * 3, 'jungle-vines'); let k = 0, c = 0, v = 0;
      for (let i = 0; i < NT * 3 && k < NT; i++) { const q = inReg(R, 0.98); if (!q) continue; const [x, z] = q; if (collideAt(x, z, 1.4) || steep(x, z)) continue; const y = hFast(x, z) - 0.3, h = 11 + rnd() * 12, s = 0.9 + rnd() * 0.6;
        putI(tr, k, x, y, z, rnd() * 6, s, h, s);
        for (let j = 0; j < 3; j++) { const a = rnd() * 6.28, o = j ? 2 + rnd() * 1.6 : 0, cs = (j ? 3.2 : 4.6) + rnd() * 1.8, cx = x + Math.cos(a) * o, cy = y + h - j * 1.5 + rnd() * 0.6, cz = z + Math.sin(a) * o; putI(cr, c++, cx, cy, cz, rnd() * 6, cs, cs * 0.46, cs, pick(JC));
          if (rnd() < 0.7) putI(vm, v++, cx + Math.cos(a + 2) * cs * 0.7, cy - cs * 0.2, cz + Math.sin(a + 2) * cs * 0.7, 0, 1, 2 + rnd() * 5, 1); }
        addSolid(x, z, 0.55 * s); k++; }
      tr.count = k; cr.count = c; vm.count = v; tr.castShadow = !lp; scene.add(tr, cr, vm); }
    { const NB = Math.round(240 * n), lm = std('#ffffff', { side: THREE.DoubleSide }); windify(lm, 0.45);
      const lv = inst(new THREE.PlaneGeometry(0.75, 2.3, 1, 3).translate(0, 1.15, 0), lm, NB * 6, 'jungle-leaves'), LC = ['#3f7a2e', '#4d8a34', '#5a9a3a', '#356a28']; let q2 = 0;
      for (let i = 0; i < NB * 3 && q2 < NB * 6; i++) { const q = inReg(R, 1); if (!q) continue; const [x, z] = q; if (collideAt(x, z, 0.5)) continue; const y = hFast(x, z) - 0.05, s = 0.8 + rnd() * 0.9, col = pick(LC);
        for (let j = 0; j < 6; j++) putY(lv, q2++, x, y, z, j / 6 * 6.28 + rnd() * 0.4, 0.5 + rnd() * 0.5, s, s * (0.8 + rnd() * 0.4), s, col); }
      lv.count = q2; scene.add(lv); }
    { const NF = Math.round(900 * n), fm = std('#ffffff', { side: THREE.DoubleSide }); windify(fm, 0.3);
      const fr = inst(new THREE.ConeGeometry(0.5, 1, 5, 1, true).rotateX(Math.PI).translate(0, 0.5, 0), fm, NF, 'jungle-ferns'), FC = ['#3a6e2c', '#467a30', '#2f5e26']; let k = 0;
      for (let i = 0; i < NF * 2 && k < NF; i++) { const q = inReg(R, 1, 3); if (!q) continue; const [x, z] = q, s = 0.6 + rnd() * 0.8; putI(fr, k++, x, hFast(x, z) - 0.05, z, rnd() * 6, s * 1.4, s * 0.7, s * 1.4, pick(FC)); } fr.count = k; scene.add(fr); }
    grassPatch(R, 'jungle-grass', Math.round(3600 * n), 0.5, ['#4f8a34', '#5a9a3a', '#447a2e', '#62a040'], 1.2, 0.5, 0.8);
    { const NM = Math.round(260 * n), st = inst(new THREE.CylinderGeometry(0.03, 0.045, 1, 6).translate(0, 0.5, 0), std('#e8e0d0'), NM, 'jungle-shroom-stems'), cp = inst(new THREE.SphereGeometry(0.18, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), shroomMat, NM, 'jungle-shroom-caps'); let k = 0;
      for (let i = 0; i < NM && k < NM; i++) { const q = inReg(R, 1, 3); if (!q) continue; const [cx, cz] = q, nn = 3 + Math.floor(rnd() * 4);
        for (let j = 0; j < nn && k < NM; j++) { const x = cx + (rnd() - 0.5) * 1.6, z = cz + (rnd() - 0.5) * 1.6, y = hFast(x, z) - 0.02, h = 0.12 + rnd() * 0.3, s = 0.6 + rnd() * 0.9;
          putI(st, k, x, y, z, 0, s, h, s); putI(cp, k, x, y + h, z, rnd() * 6, s, s * 0.8, s, pick(['#9dfff0', '#6ff0ff', '#c8ff9a', '#ffd0f6'])); k++; } }
      st.count = cp.count = k; scene.add(st, cp); }
    { const NR = Math.round(140 * n), rk = inst(new THREE.DodecahedronGeometry(1, 0), std('#ffffff'), NR, 'jungle-rocks'); let k = 0;
      for (let i = 0; i < NR * 2 && k < NR; i++) { const q = inReg(R, 1); if (!q) continue; const [x, z] = q, s = 0.5 + rnd() * 1.6; putI(rk, k++, x, hFast(x, z) + s * 0.2, z, rnd() * 6, s, s * 0.7, s * 1.1, rnd() < 0.6 ? '#4f6a44' : '#6a6a5c', rnd(), rnd()); if (s > 1) addSolid(x, z, s * 0.8); }
      rk.count = k; scene.add(rk); } });
  await __y(); deferred.push(() => { const n = lp ? 0.5 : 1, R = SAVANNA;
    { const NA = Math.round(110 * n), tr = inst(new THREE.CylinderGeometry(0.1, 0.18, 1, 6).translate(0, 0.5, 0), std('#5a4630'), NA * 3, 'acacia-trunks'), cm = std('#ffffff'); windify(cm, 0.12);
      const cr = inst(new THREE.CylinderGeometry(1, 0.8, 1, 9), cm, NA * 2, 'acacia-crowns'), AC = ['#5f7a36', '#6b8a3c', '#56702f', '#7a8a40']; let k = 0, t = 0, c = 0;
      for (let i = 0; i < NA * 4 && k < NA; i++) { const q = inReg(R, 0.95, 6); if (!q) continue; const [x, z] = q; if (collideAt(x, z, 3)) continue; const y = hFast(x, z) - 0.1, h = 3.5 + rnd() * 2.5, a = rnd() * 6.28;
        putI(tr, t++, x, y, z, a, 1.3, h, 1.3, null, (rnd() - 0.5) * 0.2, 0); for (const sd of [-1, 1]) putI(tr, t++, x, y + h * 0.75, z, a, 0.7, h * 0.55, 0.7, null, 0, sd * 0.6);
        const cs = 3.5 + rnd() * 2.8; putI(cr, c++, x, y + h + 0.9, z, a, cs, 0.7 + rnd() * 0.4, cs * (0.8 + rnd() * 0.3), pick(AC)); putI(cr, c++, x + Math.cos(a) * cs * 0.4, y + h + 1.5, z + Math.sin(a) * cs * 0.4, a, cs * 0.55, 0.5, cs * 0.5, pick(AC));
        addSolid(x, z, 0.35); k++; }
      tr.count = t; cr.count = c; tr.castShadow = !lp; scene.add(tr, cr); }
    { const NBb = lp ? 8 : 14, tr = inst(new THREE.CylinderGeometry(0.75, 1.1, 1, 10).translate(0, 0.5, 0), std('#8a7866'), NBb, 'baobab-trunks'), br = inst(new THREE.CylinderGeometry(0.06, 0.14, 1, 5).translate(0, 0.5, 0), std('#7a6858'), NBb * 7, 'baobab-branches'), bc = inst(new THREE.IcosahedronGeometry(1, 0), std('#ffffff'), NBb * 7, 'baobab-crowns'); let k = 0, b = 0;
      for (let i = 0; i < NBb * 6 && k < NBb; i++) { const q = inReg(R, 0.85, 8); if (!q) continue; const [x, z] = q; if (collideAt(x, z, 4)) continue; const y = hFast(x, z) - 0.2, h = 6 + rnd() * 3, s = 1 + rnd() * 0.5;
        putI(tr, k, x, y, z, rnd() * 6, s, h, s);
        for (let j = 0; j < 7; j++) { const a = j / 7 * 6.28 + rnd() * 0.5, l = 1.6 + rnd() * 1.4, tl = 0.7 + rnd() * 0.4; putI(br, b, x, y + h - 0.2, z, a, 1, l, 1, null, 0, tl);
          putI(bc, b, x - l * Math.sin(tl) * Math.cos(a), y + h - 0.2 + l * Math.cos(tl), z + l * Math.sin(tl) * Math.sin(a), rnd() * 6, 0.7 + rnd() * 0.4, 0.5, 0.7 + rnd() * 0.4, rnd() < 0.5 ? '#6a8a3c' : '#7a9444'); b++; }
        addSolid(x, z, 1.2 * s); k++; }
      tr.count = k; br.count = bc.count = b; tr.castShadow = !lp; scene.add(tr, br, bc); }
    grassPatch(R, 'savanna-grass', Math.round(6500 * n), 0.6, ['#c8a860', '#b89a52', '#d4b870', '#a88a48', '#bfae6a'], 1.4, 0.6, 0.9);
    { const NT2 = lp ? 14 : 28, tm = inst(new THREE.ConeGeometry(1, 1, 7, 2).translate(0, 0.5, 0), std('#b0703e'), NT2, 'termite-mounds'); let k = 0;
      for (let i = 0; i < NT2 * 3 && k < NT2; i++) { const q = inReg(R, 1, 5); if (!q) continue; const [x, z] = q, s = 0.5 + rnd() * 0.5; putI(tm, k++, x, hFast(x, z) - 0.2, z, rnd() * 6, s, 1.4 + rnd() * 1.6, s); addSolid(x, z, s * 0.8); } tm.count = k; scene.add(tm); }
    { const NK = lp ? 10 : 18, rk = inst(new THREE.DodecahedronGeometry(1, 0), std('#ffffff'), NK * 6, 'kopje-rocks'); let k = 0;
      for (let i = 0; i < NK * 3 && k < NK * 6; i++) { const q = inReg(R, 0.9, 8); if (!q) continue; const [cx, cz] = q; for (let j = 0; j < 6; j++) { const x = cx + (rnd() - 0.5) * 7, z = cz + (rnd() - 0.5) * 7, s = 1 + rnd() * 2.4; putI(rk, k++, x, hFast(x, z) + s * 0.3, z, rnd() * 6, s * 1.2, s * 0.8, s, rnd() < 0.5 ? '#a08a70' : '#8a7a66', rnd() * 0.4, rnd() * 0.4); addSolid(x, z, s); } }
      rk.count = k; scene.add(rk); }
    { const NRd = lp ? 200 : 420, rd = inst(new THREE.CylinderGeometry(0.014, 0.022, 1, 3).translate(0, 0.5, 0), std('#8a9a4a'), NRd, 'lagoon-reeds'); let k = 0;
      for (let i = 0; i < NRd * 6 && k < NRd; i++) { const a = rnd() * 6.28, r = LAGOON.r * (0.85 + rnd() * 0.35), x = LAGOON.x + Math.cos(a) * r, z = LAGOON.z + Math.sin(a) * r, g = hFast(x, z); if (g < LAGOON.y - 0.5 || g > LAGOON.y + 0.6) continue; putI(rd, k++, x, Math.min(g, LAGOON.y - 0.05), z, 0, 1, 1 + rnd() * 1.1, 1, null, (rnd() - 0.5) * 0.2, (rnd() - 0.5) * 0.2); }
      rd.count = k; scene.add(rd); } });
  await __y(); deferred.push(() => { const n = lp ? 0.5 : 1, R = BLOSSOM, PK = ['#f4b8cc', '#f8c8d8', '#eea8c0', '#fbe0ea', '#f2a6c2'], CT = [];
    { const NT = Math.round(200 * n), tr = inst(new THREE.CylinderGeometry(0.16, 0.3, 1, 7).translate(0, 0.5, 0), std('#4a3230'), NT * 3, 'cherry-trunks'), cm = std('#ffffff'); windify(cm, 0.22);
      const cr = inst(new THREE.IcosahedronGeometry(1, 1), cm, NT * 4, 'cherry-crowns'); let k = 0, t = 0, c = 0;
      for (let i = 0; i < NT * 3 && k < NT; i++) { const q = inReg(R, 0.95); if (!q) continue; const [x, z] = q; if (collideAt(x, z, 2) || steep(x, z)) continue; const y = hFast(x, z) - 0.15, h = 2.6 + rnd() * 1.8, a = rnd() * 6.28;
        putI(tr, t++, x, y, z, a, 1, h, 1, null, (rnd() - 0.5) * 0.2, 0); for (const sd of [-1, 1]) putI(tr, t++, x, y + h * 0.8, z, a, 0.55, h * 0.6, 0.55, null, 0, sd * 0.7);
        for (let j = 0; j < 4; j++) { const b = rnd() * 6.28, o = j ? 1.3 + rnd() * 0.9 : 0, cs = (j ? 1.6 : 2.3) + rnd() * 0.8; putI(cr, c++, x + Math.cos(b) * o, y + h + 0.9 + rnd() * 0.8 - (j ? 0.4 : 0), z + Math.sin(b) * o, rnd() * 6, cs, cs * 0.7, cs, pick(PK)); }
        addSolid(x, z, 0.3); CT.push([x, z]); k++; }
      tr.count = t; cr.count = c; tr.castShadow = !lp; scene.add(tr, cr); }
    grassPatch(R, 'blossom-grass', Math.round(4200 * n), 0.5, ['#86b45a', '#94c066', '#7aa84e', '#a0c870'], 1.2, 0.35, 0.55);
    { const NFl = Math.round(1800 * n), fl = inst(new THREE.SphereGeometry(0.045, 6, 4), std('#ffffff', { roughness: 0.6 }), NFl, 'blossom-flowers'), FC = ['#ffffff', '#f7c6d8', '#f2e27a', '#e8a0c0', '#c8b8f0']; let k = 0;
      for (let i = 0; i < NFl && k < NFl; i++) { const q = inReg(R, 1, 3); if (!q) continue; const [cx, cz] = q, col = pick(FC); for (let j = 0; j < 10 && k < NFl; j++) { const x = cx + (rnd() - 0.5) * 2.4, z = cz + (rnd() - 0.5) * 2.4; putI(fl, k++, x, hFast(x, z) + 0.14 + rnd() * 0.18, z, 0, 1, 0.6, 1, col); } }
      fl.count = k; scene.add(fl); }
    { const NPc = Math.round(2600 * n), pc = inst(new THREE.CircleGeometry(0.07, 5).rotateX(-Math.PI / 2), std('#ffffff', { roughness: 0.8, side: THREE.DoubleSide }), NPc, 'petal-carpet'); let k = 0;
      for (let i = 0; i < NPc && k < NPc && CT.length; i++) { const [tx, tz] = CT[i % CT.length], a = rnd() * 6.28, r = Math.sqrt(rnd()) * 3.2, x = tx + Math.cos(a) * r, z = tz + Math.sin(a) * r; putI(pc, k++, x, hFast(x, z) + 0.03, z, rnd() * 6, 0.8 + rnd() * 0.6, 1, 0.8 + rnd() * 0.6, pick(PK)); }
      pc.count = k; scene.add(pc); }
    { const stoneM = std('#9a948a'), roofM = std('#5a5650'), S = SROADS[2];
      for (let k = 0; k < (lp ? 6 : 10); k++) { const [x0, z0, dx, dz] = polyAt(S, 0.62 + k / 10 * 0.36), sd = k % 2 ? 1 : -1, x = x0 - dz * 3.8 * sd, z = z0 + dx * 3.8 * sd, y = hFast(x, z), grp = new THREE.Group(); grp.name = 'stone-lantern'; grp.position.set(x, y, z);
        const add = (geo, mat, py, ry = 0) => { const m = mk(geo, mat, 'stone-lantern-part'); m.position.y = py; m.rotation.y = ry; m.castShadow = !lp; grp.add(m); };
        add(new THREE.BoxGeometry(0.5, 0.2, 0.5), stoneM, 0.1); add(new THREE.CylinderGeometry(0.1, 0.12, 0.8, 8), stoneM, 0.6); add(new THREE.BoxGeometry(0.36, 0.3, 0.36), warmBasic, 1.15); add(new THREE.ConeGeometry(0.4, 0.24, 4), roofM, 1.42, Math.PI / 4); add(new THREE.SphereGeometry(0.06, 8, 6), roofM, 1.58);
        scene.add(grp); const gl = glowSprite('#ffc36b', 1.6, 0.8); gl.position.set(x, y + 1.15, z); scene.add(gl); glows.push({ s: gl, base: 0.12, n: 0.95 }); addSolid(x, z, 0.35); } } });
  // Contact shadows: soft dark blobs under trunks and boulders (cheap ambient occlusion)
  await __y(); deferred.push(() => { const bc = document.createElement('canvas'); bc.width = bc.height = 64; const g2 = bc.getContext('2d'), gr = g2.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 64, 64);
    const mat = new THREE.MeshBasicMaterial({ color: '#000000', alphaMap: new THREE.CanvasTexture(bc), transparent: true, opacity: 0.42, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const FIX = { 'tree-trunks': 3.4, 'jungle-trunks': 6, 'baobab-trunks': 5, 'cherry-trunks': 3.2, 'frost-pine-trunks': 2.8, 'acacia-trunks': 5 }, SCL = { 'rocks': 2, 'kopje-rocks': 1.7, 'jungle-rocks': 1.7 };
    const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), nrm = new THREE.Vector3(), list = [];
    scene.children.forEach(o => { if (!o.isInstancedMesh) return; const f = FIX[o.name], k = SCL[o.name]; if (!f && !k) return;
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); m4.decompose(p, q, s); if ((o.name === 'acacia-trunks' && s.x < 1) || (o.name === 'cherry-trunks' && s.x < 0.9)) continue; list.push(p.x, p.z, f ? f : k * s.x); } });
    const N = list.length / 3, ao = inst(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mat, N, 'ao-blobs'); ao.receiveShadow = false;
    for (let i = 0; i < N; i++) { const x = list[i * 3], z = list[i * 3 + 1], r = list[i * 3 + 2]; nrm.set(-(hFast(x + 1, z) - hFast(x - 1, z)) / 2, 1, -(hFast(x, z + 1) - hFast(x, z - 1)) / 2).normalize();
      dummy.position.set(x, hFast(x, z) + 0.07, z); dummy.quaternion.setFromUnitVectors(up, nrm); dummy.scale.set(r, 1, r); dummy.updateMatrix(); ao.setMatrixAt(i, dummy.matrix); }
    scene.add(ao); });
  // God rays: soft additive shafts through the jungle, forest and blossom canopy, aimed along the sun
  await __y(); const shaftU = { op: { value: 0 }, time: wU.time, col: { value: new THREE.Color('#ffe8c0') } };
  await __y(); const shaftMat = new THREE.ShaderMaterial({ uniforms: shaftU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: `varying float vA; varying vec3 vN; varying vec3 vV; varying float vD; void main(){ vA=uv.y; mat4 mm=modelMatrix*instanceMatrix; vec4 w=mm*vec4(position,1.); vN=normalize(mat3(mm)*normal); vV=cameraPosition-w.xyz; vD=length(vV); vV/=max(vD,.001); gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float op, time; uniform vec3 col; varying float vA; varying vec3 vN; varying vec3 vV; varying float vD;
      void main(){ float f=pow(abs(dot(normalize(vN),vV)),2.); float a=f*smoothstep(0.,.3,vA)*(1.-smoothstep(.55,1.,vA))*op*smoothstep(3.,14.,vD)*(1.-smoothstep(110.,240.,vD))*(.75+.25*sin(time*.6+vA*5.)); gl_FragColor=vec4(col*a,a); }` });
  await __y(); const SH_N = lp ? 24 : 56, shafts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.8, 2.4, 24, 10, 1, true).translate(0, 12, 0), shaftMat, SH_N); await __y(); shafts.name = 'light-shafts'; await __y(); shafts.frustumCulled = false; await __y(); const shaftP = [];
  await __y(); for (let k = 0; k < SH_N * 3 && shaftP.length < SH_N; k++) { let q = null; const r = k % 3; if (r === 0) q = inReg(JUNGLE, 0.9); else if (r === 1) q = inReg(BLOSSOM, 0.8); else { const z = lerp(zW(0.56), zW(0.88), rnd()), x = roadX(z) + (rnd() < 0.5 ? -1 : 1) * (9 + rnd() * 26); if (okSpot(x, z, 6)) q = [x, z]; } if (q) shaftP.push(new THREE.Vector3(q[0], hFast(q[0], q[1]) - 0.5, q[1])); }
  await __y(); shafts.count = shaftP.length; await __y(); scene.add(shafts);
  await __y(); const UPV = new THREE.Vector3(0, 1, 0), shQ = new THREE.Quaternion(), sunTmp = new THREE.Vector3();
  await __y(); const updShafts = () => { sunTmp.copy(SUN); sunTmp.y = Math.max(sunTmp.y, 0.35); shQ.setFromUnitVectors(UPV, sunTmp.normalize()); shaftP.forEach((p, i) => { dummy.position.copy(p); dummy.quaternion.copy(shQ); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); shafts.setMatrixAt(i, dummy.matrix); }); shafts.instanceMatrix.needsUpdate = true; };
  // New fauna
  await __y(); const furTex = (base, dark, tiger) => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, 256, 128); let sd = tiger ? 5 : 9; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647; g.strokeStyle = dark;
    if (tiger) for (let i = 0; i < 20; i++) { const y = 4 + i * 6.2 + r() * 2; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 256; x += 16) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 3); g.lineWidth = 1.5 + r() * 2.5; g.stroke(); }
    else for (let i = 0; i < 90; i++) { g.lineWidth = 1.6; g.beginPath(); g.arc(r() * 256, r() * 128, 2.5 + r() * 3, 0, 5 + r()); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  await __y(); const sm2 = (c, o = {}) => std(c, { flatShading: false, ...o });
  await __y(); const FM = { tiger: sm2('#ffffff', { map: furTex('#d9822e', '#1b130e', true), roughness: 0.85 }), leopard: sm2('#ffffff', { map: furTex('#d8b060', '#2a1f14', false), roughness: 0.85 }), cream: sm2('#f2e8d8'), nose: sm2('#2a1c1c'), eye: new THREE.MeshBasicMaterial({ color: '#d8c040' }),
    peacock: sm2('#1f58b8', { roughness: 0.35, metalness: 0.3 }), peaNeck: sm2('#1a7fb0', { roughness: 0.3, metalness: 0.35 }), peaWing: sm2('#8a7a5a'), peaLeg: sm2('#b8a890'), seal: sm2('#6d6a68', { roughness: 0.4 }), sealD: sm2('#4a4644'), flam: sm2('#f28aa0', { roughness: 0.7 }), flamD: sm2('#c85070'), black: sm2('#141214'), legO: sm2('#e07898') };
  await __y(); const featherMat = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 256, 0, 0); gr.addColorStop(0, 'rgba(90,120,40,0)'); gr.addColorStop(0.2, '#4f7a2e'); gr.addColorStop(1, '#2f7a5a'); g.fillStyle = gr; g.beginPath(); g.ellipse(32, 128, 26, 126, 0, 0, Math.PI * 2); g.fill();
    [['#d8a030', 20], ['#1a8a6a', 14], ['#1f4fa0', 9], ['#0a1430', 5]].forEach(([c2, r]) => { g.fillStyle = c2; g.beginPath(); g.ellipse(32, 44, r, r * 1.3, 0, 0, Math.PI * 2); g.fill(); });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.2 }); })();
  await __y(); const bigCat = (mat, s) => (g, _m, legs) => { const body = mk(new THREE.CapsuleGeometry(0.27 * s, 0.95 * s, 8, 16), mat, 'cat-body'); body.rotation.x = Math.PI / 2; body.position.y = 0.72 * s; g.add(body);
    const belly = mk(new THREE.CapsuleGeometry(0.2 * s, 0.7 * s, 6, 12), FM.cream, 'cat-belly'); belly.rotation.x = Math.PI / 2; belly.position.y = 0.62 * s; g.add(belly);
    const head = mk(new THREE.SphereGeometry(0.23 * s, 18, 14), mat, 'cat-head'); head.scale.set(1, 0.9, 1.05); head.position.set(0, 0.9 * s, -0.8 * s); g.add(head);
    const muz = mk(new THREE.SphereGeometry(0.12 * s, 14, 10), FM.cream, 'cat-muzzle'); muz.scale.set(1.25, 0.8, 1); muz.position.set(0, 0.83 * s, -0.98 * s); g.add(muz);
    const nose = mk(new THREE.SphereGeometry(0.035 * s, 8, 6), FM.nose, 'cat-nose'); nose.position.set(0, 0.88 * s, -1.09 * s); g.add(nose);
    [-1, 1].forEach(sd => { const ear = mk(new THREE.SphereGeometry(0.07 * s, 10, 8), mat, 'cat-ear'); ear.scale.set(1, 1, 0.5); ear.position.set(sd * 0.15 * s, 1.08 * s, -0.74 * s); g.add(ear);
      const eye = mk(new THREE.SphereGeometry(0.028 * s, 8, 6), FM.eye, 'cat-eye'); eye.position.set(sd * 0.09 * s, 0.96 * s, -0.99 * s); g.add(eye); });
    g.add(mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, 0.82, 0.62), V(0, 0.62, 1.0), V(0, 0.42, 1.3), V(0, 0.55, 1.62)].map(v => v.multiplyScalar(s))), 12, 0.05 * s, 8), mat, 'cat-tail'));
    for (let i = 0; i < 4; i++) { const leg = mk(new THREE.CapsuleGeometry(0.075 * s, 0.46 * s, 4, 10), mat, 'cat-leg'); leg.position.set((i % 2 ? 1 : -1) * 0.16 * s, 0.33 * s, (i < 2 ? -0.46 : 0.46) * s); g.add(leg); legs.push(leg);
      const paw = mk(new THREE.SphereGeometry(0.08 * s, 10, 8), FM.cream, 'cat-paw'); paw.scale.set(1, 0.6, 1.2); paw.position.set(0, -0.3 * s, -0.03 * s); leg.add(paw); } };
  await __y(); const setFan = (g, a) => { g.userData.fan.rotation.x = lerp(1.35, 0.25, a); g.userData.fs.forEach((p, i) => { p.rotation.z = (i / 14 - 0.5) * lerp(0.35, 2.9, a); }); };
  await __y(); const buildPeacock = (g, _m, legs) => { const body = mk(new THREE.SphereGeometry(0.17, 16, 12), FM.peacock, 'pea-body'); body.scale.set(0.85, 0.9, 1.35); body.position.y = 0.5; g.add(body);
    const wing = mk(new THREE.SphereGeometry(0.16, 12, 8), FM.peaWing, 'pea-wing'); wing.scale.set(0.95, 0.7, 1.2); wing.position.set(0, 0.52, 0.06); g.add(wing);
    const neck = mk(new THREE.CylinderGeometry(0.045, 0.07, 0.36, 10), FM.peaNeck, 'pea-neck'); neck.position.set(0, 0.72, -0.16); neck.rotation.x = -0.35; g.add(neck);
    const head = mk(new THREE.SphereGeometry(0.06, 12, 10), FM.peacock, 'pea-head'); head.position.set(0, 0.9, -0.24); g.add(head);
    const beak = mk(new THREE.ConeGeometry(0.018, 0.07, 6), FM.peaLeg, 'pea-beak'); beak.rotation.x = -Math.PI / 2; beak.position.set(0, 0.89, -0.31); g.add(beak);
    for (let i = 0; i < 5; i++) { const cr = mk(new THREE.CylinderGeometry(0.004, 0.004, 0.09, 3), FM.peaNeck, 'pea-crest'); cr.position.set((i - 2) * 0.012, 0.98, -0.22); cr.rotation.x = 0.3; g.add(cr); const tip = mk(new THREE.SphereGeometry(0.012, 6, 4), FM.peaNeck, 'pea-crest-tip'); tip.position.set((i - 2) * 0.012, 1.025, -0.21); g.add(tip); }
    [-1, 1].forEach(sd => { const leg = mk(new THREE.CylinderGeometry(0.012, 0.014, 0.36, 6), FM.peaLeg, 'pea-leg'); leg.position.set(sd * 0.06, 0.2, 0); g.add(leg); legs.push(leg); });
    const fan = new THREE.Group(); fan.position.set(0, 0.52, 0.2); g.add(fan); const fs = [];
    for (let i = 0; i < 15; i++) { const piv = new THREE.Group(); fan.add(piv); piv.add(mk(new THREE.PlaneGeometry(0.22, 1.2).translate(0, 0.6, 0), featherMat, 'pea-feather')); fs.push(piv); }
    g.userData.fan = fan; g.userData.fs = fs; g.userData.fanA = 0; setFan(g, 0); };
  await __y(); const buildSeal = (g, _m, legs) => { const body = mk(new THREE.CapsuleGeometry(0.24, 0.85, 8, 16), FM.seal, 'seal-body'); body.rotation.x = Math.PI / 2 - 0.12; body.position.y = 0.24; g.add(body);
    const head = mk(new THREE.SphereGeometry(0.17, 16, 12), FM.seal, 'seal-head'); head.scale.set(1, 0.95, 1.15); head.position.set(0, 0.46, -0.66); g.add(head);
    const snout = mk(new THREE.SphereGeometry(0.08, 12, 8), FM.sealD, 'seal-snout'); snout.position.set(0, 0.42, -0.82); g.add(snout);
    [-1, 1].forEach(sd => { const e = mk(new THREE.SphereGeometry(0.026, 8, 6), FM.black, 'seal-eye'); e.position.set(sd * 0.08, 0.52, -0.78); g.add(e);
      const fl = mk(new THREE.BoxGeometry(0.06, 0.03, 0.26), FM.sealD, 'seal-flipper'); fl.position.set(sd * 0.26, 0.08, -0.3); fl.rotation.y = sd * 0.5; g.add(fl); legs.push(fl); });
    const tl = mk(new THREE.BoxGeometry(0.34, 0.03, 0.16), FM.sealD, 'seal-tail'); tl.position.set(0, 0.06, 0.68); g.add(tl); };
  await __y(); const buildFlamingo = (g, _m, legs) => { const body = mk(new THREE.SphereGeometry(0.17, 16, 12), FM.flam, 'fl-body'); body.scale.set(0.85, 0.75, 1.4); body.position.y = 0.95; g.add(body);
    g.add(mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, 1.0, -0.16), V(0, 1.2, -0.12), V(0, 1.34, -0.04), V(0, 1.46, -0.14), V(0, 1.44, -0.26)]), 16, 0.026, 8), FM.flam, 'fl-neck'));
    const head = mk(new THREE.SphereGeometry(0.048, 12, 10), FM.flam, 'fl-head'); head.position.set(0, 1.45, -0.28); g.add(head);
    const beak = mk(new THREE.ConeGeometry(0.02, 0.1, 8), FM.black, 'fl-beak'); beak.rotation.x = -Math.PI / 2 - 0.9; beak.position.set(0, 1.41, -0.33); g.add(beak);
    const tl = mk(new THREE.ConeGeometry(0.07, 0.16, 8), FM.flamD, 'fl-tail'); tl.rotation.x = Math.PI / 2; tl.position.set(0, 0.97, 0.24); g.add(tl);
    const L1 = mk(new THREE.CylinderGeometry(0.011, 0.011, 0.9, 6), FM.legO, 'fl-leg'); L1.position.set(0.04, 0.45, 0.02); g.add(L1); legs.push(L1);
    const L2 = mk(new THREE.CylinderGeometry(0.011, 0.011, 0.45, 6), FM.legO, 'fl-leg-up'); L2.position.set(-0.04, 0.72, 0.05); L2.rotation.x = 0.9; g.add(L2); };
  function spawnIn(kind, n, pickXZ, build, opt) { for (let k = 0; k < n; k++) for (let t = 0; t < 30; t++) { const q = pickXZ(); if (!q) continue; const [x, z] = q; if (collideAt(x, z, 0.6)) continue;
      const g = new THREE.Group(); g.name = kind; g.position.set(x, hFast(x, z), z); g.rotation.y = rnd() * 6; const legs = []; build(g, null, legs); g.traverse(o => { if (o.isMesh) o.castShadow = !lp && !!opt.shadow; }); scene.add(g);
      critters.push({ g, legs, kind, state: 'idle', t: rnd() * 3, phase: rnd() * 6, target: new THREE.Vector3(), hop: false, wanderSpd: opt.wanderSpd, fleeSpd: opt.fleeSpd, fleeDist: opt.fleeDist, gait: opt.gait || 6 }); break; } }
  await __y(); spawnIn('tiger', 3, () => inReg(JUNGLE, 0.8), bigCat(FM.tiger, 1), { wanderSpd: 0.9, fleeSpd: 5.5, fleeDist: 9, gait: 5, shadow: true });
  await __y(); spawnIn('leopard', 3, () => inReg(SAVANNA, 0.85), bigCat(FM.leopard, 0.8), { wanderSpd: 1.1, fleeSpd: 7, fleeDist: 10, gait: 6, shadow: true });
  await __y(); spawnIn('peacock', 5, () => inReg(BLOSSOM, 0.85), buildPeacock, { wanderSpd: 0.7, fleeSpd: 3.5, fleeDist: 6, gait: 8 });
  await __y(); spawnIn('peacock', 3, () => inReg(JUNGLE, 0.9), buildPeacock, { wanderSpd: 0.7, fleeSpd: 3.5, fleeDist: 6, gait: 8 });
  await __y(); spawnIn('seal', 6, () => { const z = LH.z + (rnd() - 0.5) * 90, x = coastX(z) + rnd() * 7, y = hFast(x, z); return y > SEA_Y + 0.15 && y < SEA_Y + 1.6 && !onPier(x, z) ? [x, z] : null; }, buildSeal, { wanderSpd: 0.3, fleeSpd: 1.3, fleeDist: 6, gait: 5 });
  await __y(); spawnIn('flamingo', lp ? 9 : 16, () => { const a = rnd() * 6.28, r = LAGOON.r * (0.55 + rnd() * 0.4), x = LAGOON.x + Math.cos(a) * r, z = LAGOON.z + Math.sin(a) * r, d = LAGOON.y - hFast(x, z); return d > 0.05 && d < 0.6 ? [x, z] : null; }, buildFlamingo, { wanderSpd: 0.35, fleeSpd: 2.6, fleeDist: 8, gait: 3 });
  await __y(); const peacocks = critters.filter(c => c.kind === 'peacock');
  // Murmurations over the new regions
  await __y(); const FLK = [{ R: SAVANNA, n: lp ? 26 : 50 }, { R: JUNGLE, n: lp ? 18 : 34 }, { R: BLOSSOM, n: lp ? 16 : 30 }], FLN = FLK.reduce((a, f) => a + f.n, 0);
  await __y(); const flockV4 = new THREE.InstancedMesh(vGeo2, new THREE.MeshBasicMaterial({ color: '#2a2430', side: THREE.DoubleSide }), FLN); await __y(); flockV4.name = 'flock-v4'; await __y(); flockV4.frustumCulled = false; await __y(); scene.add(flockV4);
  await __y(); const fbd = []; await __y(); FLK.forEach((f, fi) => { f.sc = 0; for (let i = 0; i < f.n; i++) fbd.push({ a: rnd() * 6.28, b: rnd() * 6.28, r: 3 + rnd() * 9, sp: 0.6 + rnd() * 0.8, ph: rnd() * 10 }); });
  // Fish schools (lake, lagoon, plunge pools, koi in the blossom pond)
  await __y(); const FSC = [{ x: LAKE.x, z: LAKE.z, y: LAKE.y, r: LAKE.r * 0.5, n: lp ? 10 : 18, c: '#c8d0d8' }, { x: LAKE.x + 10, z: LAKE.z - 12, y: LAKE.y, r: LAKE.r * 0.3, n: lp ? 8 : 14, c: '#e0904a' }, { x: LAGOON.x, z: LAGOON.z, y: LAGOON.y, r: LAGOON.r * 0.35, n: lp ? 8 : 14, c: '#b8c8c0' }, { x: JPOOL.x, z: JPOOL.z, y: JPOOL.y, r: JPOOL.r * 0.45, n: 8, c: '#f0a040' }, { x: BPOOL.x, z: BPOOL.z, y: BPOOL.y, r: BPOOL.r * 0.45, n: 9, c: '#f06a3a' }];
  await __y(); const FSN = FSC.reduce((a, f) => a + f.n, 0), fish = new THREE.InstancedMesh(new THREE.ConeGeometry(0.07, 0.3, 6).rotateX(-Math.PI / 2), sm2('#ffffff', { metalness: 0.4, roughness: 0.35 }), FSN); await __y(); fish.name = 'fish-schools'; await __y(); fish.frustumCulled = false; await __y(); scene.add(fish);
  await __y(); const fsd = []; await __y(); FSC.forEach(S => { for (let i = 0; i < S.n; i++) { fish.setColorAt(fsd.length, TC.set(S.c).multiplyScalar(0.85 + rnd() * 0.3)); fsd.push({ S, a: rnd() * 6.28, r: S.r * (0.3 + rnd() * 0.7), w: (0.25 + rnd() * 0.3) * (rnd() < 0.5 ? -1 : 1), d: 0.3 + rnd() * 0.4, ph: rnd() * 6 }); } });
  // Dragonflies over water, bees around flowers, bats at night, falling petals in the valley
  await __y(); const DFH = []; await __y(); for (let k = 0; k < 8; k++) { const a = rnd() * 6.28; DFH.push({ x: LAKE.x + Math.cos(a) * LAKE.r * 0.95, z: LAKE.z + Math.sin(a) * LAKE.r * 0.95, y: LAKE.y }); }
  await __y(); for (let k = 0; k < 6; k++) { const a = rnd() * 6.28; DFH.push({ x: LAGOON.x + Math.cos(a) * LAGOON.r * 0.9, z: LAGOON.z + Math.sin(a) * LAGOON.r * 0.9, y: LAGOON.y }); }
  await __y(); CLIFFS.forEach(P => { for (let k = 0; k < 3; k++) { const a = rnd() * 6.28; DFH.push({ x: P.x + Math.cos(a) * P.r, z: P.z + Math.sin(a) * P.r, y: P.y }); } });
  await __y(); for (let k = 0; k < 5; k++) { const z = lerp(RIV.zHi, RIV.zLo, rnd()); DFH.push({ x: riverX(z) + (rnd() - 0.5) * 6, z, y: roadY(z) - 2.2 }); }
  await __y(); const DFN = DFH.length, dfBody = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.008, 0.2, 5).rotateX(Math.PI / 2), sm2('#2a8aa0', { metalness: 0.5, roughness: 0.3 }), DFN), dfWing = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.34, 0.05).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#e8f4ff', transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }), DFN * 2);
  await __y(); dfBody.name = 'dragonflies'; await __y(); dfWing.name = 'dragonfly-wings'; await __y(); dfBody.frustumCulled = dfWing.frustumCulled = false; await __y(); scene.add(dfBody, dfWing);
  await __y(); const dfd = DFH.map(h => ({ h, p: new THREE.Vector3(h.x, h.y + 0.8, h.z), tg: new THREE.Vector3(h.x, h.y + 0.8, h.z), t: rnd() * 2, yaw: 0 }));
  await __y(); const BEEN = lp ? 18 : 36, bees = new THREE.InstancedMesh(new THREE.SphereGeometry(0.028, 6, 4).scale(1, 1, 1.5), sm2('#e8b820'), BEEN); await __y(); bees.name = 'bees'; await __y(); bees.frustumCulled = false; await __y(); scene.add(bees);
  await __y(); const beeH = []; await __y(); for (let k = 0; k < BEEN; k++) { let q = k % 3 ? inReg(BLOSSOM, 0.9) : [MEADOW.x + (rnd() - 0.5) * 50, MEADOW.z + (rnd() - 0.5) * 50]; if (!q) q = [BLOSSOM.x, BLOSSOM.z]; beeH.push({ x: q[0], z: q[1], y: hFast(q[0], q[1]) + 0.5, ph: rnd() * 10 }); }
  await __y(); const BATN = lp ? 16 : 32, bats = new THREE.InstancedMesh(vGeo2, new THREE.MeshBasicMaterial({ color: '#141018', side: THREE.DoubleSide }), BATN); await __y(); bats.name = 'bats'; await __y(); bats.frustumCulled = false; await __y(); scene.add(bats);
  await __y(); const batH = []; await __y(); for (let k = 0; k < BATN; k++) { const m = k % 3; let q = m === 0 ? inReg(JUNGLE, 0.8) : m === 1 ? [RUINS.x + (rnd() - 0.5) * 40, RUINS.z + (rnd() - 0.5) * 40] : inReg(BLOSSOM, 0.8); if (!q) q = [RUINS.x, RUINS.z]; batH.push({ x: q[0], z: q[1], y: hFast(q[0], q[1]) + 7 + rnd() * 6, ph: rnd() * 10, r: 4 + rnd() * 8, sp: 1.2 + rnd() * 1.2 }); }
  await __y(); const PN = lp ? 120 : 260, petA = new Float32Array(PN * 3), petG = new THREE.BufferGeometry(); await __y(); petG.setAttribute('position', new THREE.BufferAttribute(petA, 3));
  await __y(); const petals = new THREE.Points(petG, new THREE.PointsMaterial({ color: '#f8c0d4', size: 0.11, map: GT, transparent: true, depthWrite: false, opacity: 0.9 })); await __y(); petals.name = 'petals-air'; await __y(); petals.frustumCulled = false; await __y(); petals.visible = false; await __y(); scene.add(petals); await __y(); let petInit = false;
  await __y(); hookAll(); await __y(); updShafts();
  await __y(); const hideI = (m, i) => { dummy.position.set(0, -999, 0); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(0.0001); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); };
  // ===== v5 · Snow Peak highlands, frozen lake, glacier + ice cave, foothill forests, and the Blossom road =====
  await __y(); let iceOn = false, iceSpin = 0; await __y(); const STAMPED = new Set(opts.stamps || []);
  await __y(); const stamp = k => { if (STAMPED.has(k)) return; STAMPED.add(k); opts.onStamp && opts.onStamp(k); };
  await __y(); const spot5 = k => { if (!SPOTTED.has(k)) { SPOTTED.add(k); opts.onSpot && opts.onSpot(k); } };
  await __y(); flakeY(); await __y(); caveY();
  await __y(); const CD = CDIR, CP = { x: -CDIR.z, z: CDIR.x }, CR = CAVE.R, CLEN = CAVE.len, cvY = CAVE.y;
  await __y(); const drape = (pts, o) => { const w = o.w ?? 1.2, yo = o.yo ?? 0.15, nc = o.nc || 1, bulge = o.bulge || 0, step = o.step || 2.5;
    const cv = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal'), L = cv.getLength(), P = cv.getSpacedPoints(Math.max(2, Math.ceil(L / step))), NP = P.length, W = nc + 1, pos = [], cols = [], uvs = [], idx = [];
    for (let k = 0; k < NP; k++) { const p = P[k], q = P[Math.min(NP - 1, k + 1)], b = P[Math.max(0, k - 1)], dx = q.x - b.x, dz = q.z - b.z, dl = Math.hypot(dx, dz) || 1, px = -dz / dl, pz = dx / dl, u = k / (NP - 1), ww = typeof w === 'function' ? w(u) : w;
      for (let c = 0; c <= nc; c++) { const s = c / nc * 2 - 1, x = p.x + px * ww * s, z = p.z + pz * ww * s, y = H(x, z) + yo + bulge * (1 - s * s); pos.push(x, y, z); uvs.push(c / nc, u * L / 8); const cc = o.col ? o.col(x, y, z, u, s, k) : TC.set('#ffffff'); cols.push(cc.r, cc.g, cc.b); }
      if (k) for (let c = 0; c < nc; c++) { const a = (k - 1) * W + c, d = k * W + c; idx.push(a, d, a + 1, a + 1, d, d + 1); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere(); return { g, cv, L }; };
  await __y(); const signMat = txt => { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g2 = c.getContext('2d'); g2.fillStyle = '#2f5a45'; g2.fillRect(0, 0, 512, 128); g2.strokeStyle = '#e9dcc0'; g2.lineWidth = 6; g2.strokeRect(8, 8, 496, 112); g2.fillStyle = '#f3ead9'; g2.font = '600 44px "JetBrains Mono", monospace'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText(txt, 256, 66); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }); };
  await __y(); const addSign = (x, z, yaw, txt, arrows = true) => { const y = H(x, z), post = mk(new THREE.CylinderGeometry(0.08, 0.09, 2.6, 8), darkWood, 'peak-sign-post'); post.position.set(x, y + 1.3, z); scene.add(post);
    [[arrows ? txt + ' →' : txt, 0], [arrows ? '← ' + txt : txt, Math.PI]].forEach(([t, r]) => { const b = mk(new THREE.PlaneGeometry(2.3, 0.58), signMat(t), 'peak-sign'); b.position.set(x, y + 2.3, z); b.rotation.y = yaw + r; b.translateZ(0.03); scene.add(b); }); addSolid(x, z, 0.3); };
  await __y(); const SUM = { x: PEAK.x, z: PEAK.z }; await __y(); SUM.y = H(SUM.x, SUM.z);

  // Trail: dirt at the bottom turning to packed snow, a signpost where it leaves the blossom road
  await __y(); const trailCv = (() => { const DC = SC('#8a6a44'), PS = SC('#dde4ec'), c2 = new THREE.Color();
    const { g, cv } = drape(TRAIL.pts, { w: 1.25, yo: 0.14, col: (x, y, z, u, s, k) => c2.copy(DC).lerp(PS, clamp(snowAt(x, y, z) * 1.6, 0, 1)).multiplyScalar(0.94 + h2(k, s > 0 ? 3 : 4) * 0.1) });
    const m = mk(g, std('#ffffff', { vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }), 'peak-trail'); m.receiveShadow = !lp; scene.add(m);
    const p0 = cv.getPointAt(0.012), t0 = cv.getTangentAt(0.012); addSign(p0.x + t0.z * 3.4, p0.z - t0.x * 3.4, Math.atan2(t0.x, t0.z) - Math.PI / 2, 'SNOW PEAK');
    return cv; })();

  // Prayer flags: a zig-zag line strung over the trail, radial lines off the summit pole, one across the cave mouth
  await __y(); const FLAGC = ['#2f6fd0', '#f4f1e8', '#d8412f', '#3f9a4a', '#f2c230'].map(SC), flagLines = [], poles = [];
  await __y(); { const L = trailCv.getLength(), NPo = Math.floor(L / 22); let prev = null;
    for (let i = 1; i <= NPo; i++) { const u = i / NPo * 0.985, p = trailCv.getPointAt(u), t = trailCv.getTangentAt(u), sd = i % 2 ? 1 : -1, x = p.x - t.z * 3.1 * sd, z = p.z + t.x * 3.1 * sd, y = H(x, z), top = new THREE.Vector3(x, y + 4.3, z); poles.push([x, y, z, 4.4]); if (prev) flagLines.push([prev, top, 0.7]); prev = top; } }
  await __y(); { const top = new THREE.Vector3(SUM.x, SUM.y + 6.2, SUM.z); poles.push([SUM.x, SUM.y, SUM.z, 7.4]);
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + 0.2, x = SUM.x + Math.cos(a) * 12, z = SUM.z + Math.sin(a) * 12, y = H(x, z); poles.push([x, y, z, 2.8]); flagLines.push([top, new THREE.Vector3(x, y + 2.7, z), 0.4]); } }
  await __y(); { const e = [-1, 1].map(sd => { const x = CAVE.x - CD.x * 1.5 + CP.x * (CR + 1.6) * sd, z = CAVE.z - CD.z * 1.5 + CP.z * (CR + 1.6) * sd, y = H(x, z); poles.push([x, y, z, 5.6]); return new THREE.Vector3(x, y + 5.5, z); }); flagLines.push([e[0], e[1], 0.6]); }
  await __y(); { const pm = inst(new THREE.CylinderGeometry(0.05, 0.07, 1, 6).translate(0, 0.5, 0), darkWood, poles.length, 'flag-poles');
    poles.forEach((p, i) => { putI(pm, i, p[0], p[1] - 0.2, p[2], 0, 1, p[3] + 0.2, 1); addSolid(p[0], p[2], 0.12); }); scene.add(pm);
    let NF = 0; flagLines.forEach(l => { l.n = Math.max(2, Math.floor(l[0].distanceTo(l[1]) / 0.62)); NF += l.n; });
    const fm = std('#ffffff', { side: THREE.DoubleSide }); fm.customProgramCacheKey = () => 'pflag-v5';
    fm.onBeforeCompile = sh => { sh.uniforms.uT = windTimeU; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  { float fw = clamp(-position.y / 0.42, 0., 1.); vec4 ip = instanceMatrix[3]; transformed.z += sin(uT * 7.0 + ip.x * 1.3 + ip.z * 0.9 + position.x * 5.0) * fw * 0.16; }'); };
    const fl = inst(new THREE.PlaneGeometry(0.34, 0.42).translate(0, -0.21, 0), fm, NF + 1, 'prayer-flags'), lpos = []; let k = 0;
    flagLines.forEach((l, li) => { const [a, b, sag] = l, yaw = Math.atan2(-(b.z - a.z), b.x - a.x); let pv = a.clone();
      for (let s = 1; s <= 16; s++) { const t = s / 16, p = new THREE.Vector3().lerpVectors(a, b, t); p.y -= sag * 4 * t * (1 - t); lpos.push(pv.x, pv.y, pv.z, p.x, p.y, p.z); pv = p; }
      for (let i = 0; i < l.n; i++) { const t = (i + 0.5) / l.n; putI(fl, k++, lerp(a.x, b.x, t), lerp(a.y, b.y, t) - sag * 4 * t * (1 - t), lerp(a.z, b.z, t), yaw, 1, 1, 1, FLAGC[(i + li) % 5]); } });
    fl.count = k; scene.add(fl);
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lpos, 3)); const ln = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#3a3430' })); ln.name = 'flag-strings'; scene.add(ln);
    const big = inst(new THREE.PlaneGeometry(1.7, 1.05).translate(0.85, -0.52, 0), fm, 1, 'summit-flag'); putI(big, 0, SUM.x, SUM.y + 7.1, SUM.z, 0.6, 1, 1, 1, '#f2b56b'); scene.add(big); }
  await __y(); { const gl = glowSprite('#ffd08a', 4, 0.8); gl.position.set(SUM.x, SUM.y + 6.4, SUM.z); scene.add(gl); glows.push({ s: gl, base: 0.1, n: 0.9 });
    const t = trailCv.getTangentAt(0.99); addSign(SUM.x - t.x * 5 + t.z * 3, SUM.z - t.z * 5 - t.x * 3, Math.atan2(t.x, t.z) - Math.PI / 2, 'SNOW PEAK', false); }

  // Cairns along the trail, on the summit, and on a few foothill crests
  await __y(); { const spots = [[SUM.x + 3.5, SUM.z + 2.5, 1.3]];
    for (let i = 1; i < 16; i++) { const u = i / 16, p = trailCv.getPointAt(u), t = trailCv.getTangentAt(u), sd = i % 2 ? -1 : 1; spots.push([p.x - t.z * 4.8 * sd, p.z + t.x * 4.8 * sd, 0.75 + rnd() * 0.35]); }
    for (let i = 0, n = 0; i < 400 && n < 22; i++) { const x = lerp(300, 1100, rnd()), z = lerp(-1500, 850, rnd()); if (coreOut(x, z) < 20 || edgeInfo(x, z).e < RIM || NREG.some(R => regW(R, x, z) > 0.1) || sroadD(x, z) < 8) continue;
      const y = H(x, z); if ([[14, 0], [-14, 0], [0, 14], [0, -14]].some(([a, b]) => H(x + a, z + b) > y - 0.8)) continue; spots.push([x, z, 0.9 + rnd() * 0.4]); n++; }
    const cm = inst(new THREE.DodecahedronGeometry(1, 0), std('#ffffff'), spots.length * 6, 'cairn-stones'); let k = 0;
    spots.forEach(([x, z, s]) => { let y = H(x, z) - 0.1; for (let j = 0; j < 6; j++) { const sc = s * (1.05 - j * 0.14); putI(cm, k++, x + (rnd() - 0.5) * 0.12, y + sc * 0.3, z + (rnd() - 0.5) * 0.12, rnd() * 6, sc, sc * 0.42, sc * 0.9, pick(['#8a857e', '#77716b', '#9a948a', '#6f6a66'])); y += sc * 0.6; } addSolid(x, z, s * 0.9); });
    cm.count = k; scene.add(cm); }

  // Frozen lake: glassy ice with cracks and wind-packed snow; the bike slides on it
  await __y(); { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'), gr = g.createRadialGradient(256, 256, 20, 256, 256, 256); gr.addColorStop(0, '#94c2de'); gr.addColorStop(0.7, '#bcdaeb'); gr.addColorStop(1, '#e6f1f8'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    let sd = 7; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.15 + r() * 0.3) + ')'; g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 60, 8 + r() * 26, r() * 3, 0, 6.3); g.fill(); }
    g.lineCap = 'round'; for (let i = 0; i < 46; i++) { let x = r() * 512, y = r() * 512, a = r() * 6.28; g.strokeStyle = i % 3 ? 'rgba(255,255,255,.6)' : 'rgba(50,100,140,.35)'; g.lineWidth = 0.6 + r() * 1.6; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 7; s++) { a += (r() - 0.5) * 1.3; x += Math.cos(a) * (10 + r() * 22); y += Math.sin(a) * (10 + r() * 22); g.lineTo(x, y); } g.stroke(); }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const ice = mk(new THREE.CircleGeometry(FLAKE.r + 0.8, 64).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.3 }), 'frozen-lake'); ice.position.set(FLAKE.x, FLAKE.y + 0.02, FLAKE.z); ice.receiveShadow = !lp; scene.add(ice);
    const rim = mk(new THREE.TorusGeometry(FLAKE.r + 1.2, 1.4, 6, 64).rotateX(Math.PI / 2), std('#eef3fb', { roughness: 0.85 }), 'frozen-lake-drift'); rim.scale.y = 0.3; rim.position.set(FLAKE.x, FLAKE.y - 0.05, FLAKE.z); scene.add(rim); }

  // Glacier down the north face, seracs, and an ice cave at its toe
  await __y(); const glCv = (() => { const c2 = new THREE.Color(), A = SC('#e6f3fb'), B = SC('#a9d3ec'), Cr = SC('#5f93b8'), GL = [[PEAK.x + 6, PEAK.z + 34], [PEAK.x - 2, PEAK.z + 80], [PEAK.x - 14, PEAK.z + 125], [CAVE.x + CD.x * 40, CAVE.z + CD.z * 40], [CAVE.x + CD.x * 19, CAVE.z + CD.z * 19]];
    const { g, cv } = drape(GL, { w: u => lerp(12, 8, u), yo: 0.3, nc: 8, bulge: 1.6, step: 3, col: (x, y, z, u, s, k) => { c2.copy(A).lerp(B, vnoise(x * 0.08, z * 0.08) * 0.8 + Math.abs(s) * 0.2); if (h2(k, Math.floor((s + 1) * 4)) < 0.1 || (k % 9 === 0 && Math.abs(s) < 0.8)) c2.lerp(Cr, 0.7); return c2; } });
    const m = mk(g, std('#ffffff', { vertexColors: true, roughness: 0.28, metalness: 0.05, emissive: '#10283a', emissiveIntensity: 0.2 }), 'glacier'); m.receiveShadow = !lp; scene.add(m); return cv; })();
  await __y(); const iceM = new THREE.MeshStandardMaterial({ color: '#8fcbea', emissive: '#2a78a8', emissiveIntensity: 0.55, roughness: 0.15, metalness: 0.05, side: THREE.DoubleSide, flatShading: true });
  await __y(); { const tg = new THREE.CylinderGeometry(CR, CR, CLEN, 18, 6, true, Math.PI / 2, Math.PI).rotateX(Math.PI / 2).translate(0, 0, CLEN / 2), pa = tg.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); if (y < 0.3) continue; const f = 1 + (h2(Math.round(x * 3 + 50), Math.round(z * 3 + y * 7)) - 0.5) * 0.14; pa.setXYZ(i, x * f, y * f, z); } tg.computeVertexNormals();
    const tun = mk(tg, iceM, 'ice-cave'); tun.position.set(CAVE.x, cvY - 0.1, CAVE.z); tun.rotation.y = Math.atan2(CD.x, CD.z); scene.add(tun);
    const back = mk(new THREE.CircleGeometry(CR, 18, 0, Math.PI), iceM, 'ice-cave-back'); back.position.set(CAVE.x + CD.x * CLEN, cvY - 0.1, CAVE.z + CD.z * CLEN); back.rotation.y = Math.atan2(CD.x, CD.z); scene.add(back);
    const cg = glowSprite('#7fd8ff', 8, 0.5); cg.position.set(CAVE.x + CD.x * CLEN * 0.55, cvY + 2.2, CAVE.z + CD.z * CLEN * 0.55); scene.add(cg); glows.push({ s: cg, base: 0.25, n: 0.7 });
    for (let a = 0.6; a < CLEN; a += 1.6) for (const sd of [-1, 1]) addSolid(CAVE.x + CD.x * a + CP.x * (CR + 0.1) * sd, CAVE.z + CD.z * a + CP.z * (CR + 0.1) * sd, 0.7);
    for (let s = -3; s <= 3; s += 1.5) addSolid(CAVE.x + CD.x * (CLEN + 0.4) + CP.x * s, CAVE.z + CD.z * (CLEN + 0.4) + CP.z * s, 0.8);
    const icM = std('#ffffff', { roughness: 0.15, emissive: '#3a8ab8', emissiveIntensity: 0.35 }), ic = inst(new THREE.ConeGeometry(0.09, 0.8, 5).rotateX(Math.PI).translate(0, -0.4, 0), icM, 90, 'icicles'); let k = 0;
    for (let a = 0.3; a < CLEN - 0.5 && k < 90; a += 1.1) for (let j = 0; j < 4 && k < 90; j++) { const th = (rnd() - 0.5) * 1.8, rr = CR - 0.15, lx = Math.sin(th) * rr, ly = Math.cos(th) * rr, s = 0.5 + rnd() * 1.1;
      putI(ic, k++, CAVE.x + CD.x * a + CP.x * lx, cvY - 0.1 + ly, CAVE.z + CD.z * a + CP.z * lx, 0, s, s, s, pick(['#e8f6ff', '#bfe4f6', '#a8d8f0'])); }
    ic.count = k; scene.add(ic);
    const serM = std('#ffffff', { roughness: 0.18, emissive: '#1b4460', emissiveIntensity: 0.18 }), SER = ['#d8eef9', '#b7ddf1', '#c9e6f5', '#9fd0ea'], ser = inst(new THREE.IcosahedronGeometry(1, 0), serM, 140, 'seracs'); let q = 0;
    for (let a = 1.5; a < CLEN + 3; a += 2.4) for (const th of [-1.25, -0.65, 0, 0.65, 1.25]) { const s = 1.8 + rnd() * 1.4, rr = CR + s * 0.7, lx = Math.sin(th) * rr, ly = Math.cos(th) * rr; putI(ser, q++, CAVE.x + CD.x * a + CP.x * lx, cvY + ly - 0.4, CAVE.z + CD.z * a + CP.z * lx, rnd() * 6, s * 1.2, s * 0.9, s, pick(SER), rnd() * 0.5, rnd() * 0.5); }
    for (const sd of [-1, 1]) for (let j = 0; j < 3; j++) { const s = 1.4 + rnd() * 1.2, x = CAVE.x - CD.x * (0.5 + j * 1.2) + CP.x * (CR + 1.2 + j * 1.4) * sd, z = CAVE.z - CD.z * (0.5 + j * 1.2) + CP.z * (CR + 1.2 + j * 1.4) * sd; putI(ser, q++, x, H(x, z) + s * 0.4, z, rnd() * 6, s, s * 1.3, s, pick(SER)); addSolid(x, z, s * 0.8); }
    for (let i = 0; i < 70 && q < 140; i++) { const u = rnd(), p = glCv.getPointAt(u), t = glCv.getTangentAt(u), sd = rnd() < 0.5 ? -1 : 1, off = lerp(12, 8, u) * (0.8 + rnd() * 0.35) * sd, x = p.x - t.z * off, z = p.z + t.x * off, s = 1 + rnd() * 2.2; putI(ser, q++, x, H(x, z) + s * 0.3, z, rnd() * 6, s * 1.3, s, s, pick(SER), rnd() * 0.6, rnd() * 0.6); }
    ser.count = q; ser.castShadow = !lp; scene.add(ser); }
  // The yeti: only at night, at the back of the cave, and only once per night
  await __y(); const yeti = new THREE.Group(); await __y(); yeti.name = 'yeti'; await __y(); let yetiArm = null, yetiT = 0, yetiGone = 0;
  await __y(); { const fur = sm2('#e9eef2', { roughness: 1 }), face = sm2('#6a7a88'), eyeM = new THREE.MeshBasicMaterial({ color: '#9ff7ff', fog: false });
    const body = mk(new THREE.CapsuleGeometry(0.55, 0.9, 6, 12), fur, 'yeti-body'); body.position.y = 1.15; yeti.add(body);
    const head = mk(new THREE.SphereGeometry(0.42, 14, 10), fur, 'yeti-head'); head.position.set(0, 2.15, 0.05); yeti.add(head);
    const fc = mk(new THREE.SphereGeometry(0.26, 12, 8), face, 'yeti-face'); fc.scale.set(1, 0.85, 0.5); fc.position.set(0, 2.1, -0.3); yeti.add(fc);
    [-1, 1].forEach(s => { const e = mk(new THREE.SphereGeometry(0.05, 8, 6), eyeM, 'yeti-eye'); e.position.set(s * 0.1, 2.17, -0.42); yeti.add(e);
      const piv = new THREE.Group(); piv.position.set(s * 0.62, 1.75, 0); piv.rotation.z = s * 0.25; yeti.add(piv); const arm = mk(new THREE.CapsuleGeometry(0.17, 0.8, 4, 8), fur, 'yeti-arm'); arm.position.y = -0.5; piv.add(arm); if (s > 0) yetiArm = piv;
      const leg = mk(new THREE.CapsuleGeometry(0.2, 0.5, 4, 8), fur, 'yeti-leg'); leg.position.set(s * 0.28, 0.4, 0); yeti.add(leg); });
    const a = CLEN - 2.4; yeti.position.set(CAVE.x + CD.x * a, cvY - 0.1, CAVE.z + CD.z * a); yeti.rotation.y = Math.atan2(CD.x, CD.z); yeti.visible = false; scene.add(yeti); }

  // Snowmen (ride into one), a sled, ski tracks down the south face
  await __y(); const snowmen = [];
  await __y(); { const snowM = std('#f4f7fb', { roughness: 0.9, flatShading: false }), coal = std('#1a1a1c'), carrot = std('#e2742a'), stickM = std('#4a3426'), scarfM = std('#c8402a');
    const addSnowman = (x, z, s = 1) => { const y = H(x, z), g = new THREE.Group(); g.name = 'snowman'; g.position.set(x, y - 0.1, z); g.rotation.y = rnd() * 6; const body = new THREE.Group(); g.add(body);
      const ball = (r, yy, par) => { const m = mk(new THREE.SphereGeometry(r, 16, 12), snowM, 'snowman-ball'); m.position.y = yy; m.castShadow = !lp; par.add(m); return m; };
      ball(0.62 * s, 0.55 * s, body); ball(0.45 * s, 1.35 * s, body);
      for (let i = 0; i < 3; i++) { const b = mk(new THREE.SphereGeometry(0.04 * s, 6, 4), coal, 'snowman-button'); b.position.set(0, (1.2 + i * 0.16) * s, -0.43 * s); body.add(b); }
      [-1, 1].forEach(sd => { const arm = mk(new THREE.CylinderGeometry(0.02 * s, 0.03 * s, 0.9 * s, 5), stickM, 'snowman-arm'); arm.position.set(sd * 0.7 * s, 1.5 * s, 0); arm.rotation.z = sd * -1.0; body.add(arm); });
      const sc = mk(new THREE.TorusGeometry(0.3 * s, 0.07 * s, 6, 16), scarfM, 'snowman-scarf'); sc.rotation.x = Math.PI / 2; sc.position.y = 1.7 * s; body.add(sc);
      const hy = 1.95 * s, head = new THREE.Group(); head.position.y = hy; g.add(head); ball(0.32 * s, 0, head);
      const nose = mk(new THREE.ConeGeometry(0.05 * s, 0.3 * s, 8), carrot, 'snowman-nose'); nose.rotation.x = -Math.PI / 2; nose.position.set(0, 0, -0.42 * s); head.add(nose);
      [-1, 1].forEach(sd => { const e = mk(new THREE.SphereGeometry(0.035 * s, 6, 4), coal, 'snowman-eye'); e.position.set(sd * 0.11 * s, 0.09 * s, -0.28 * s); head.add(e); });
      const hat = mk(new THREE.CylinderGeometry(0.2 * s, 0.2 * s, 0.32 * s, 14), coal, 'snowman-hat'); hat.position.y = 0.36 * s; head.add(hat); const brim = mk(new THREE.CylinderGeometry(0.3 * s, 0.3 * s, 0.03 * s, 16), coal, 'snowman-brim'); brim.position.y = 0.22 * s; head.add(brim);
      scene.add(g); snowmen.push({ g, body, head, hy, s, x, z, hit: false, t: 0 }); };
    addSnowman(SUM.x - 6, SUM.z + 5, 1.1); addSnowman(FLAKE.x + FLAKE.r + 5, FLAKE.z - 6); addSnowman(CAVE.x - CD.x * 8 + CP.x * 9, CAVE.z - CD.z * 8 + CP.z * 9, 0.9);
    { const p = trailCv.getPointAt(0.66), t = trailCv.getTangentAt(0.66); addSnowman(p.x + t.z * 6, p.z - t.x * 6, 0.85); }
    const sled = new THREE.Group(); sled.name = 'sled'; { const x = FLAKE.x + FLAKE.r + 7.5, z = FLAKE.z - 3.5; sled.position.set(x, H(x, z) + 0.05, z); sled.rotation.y = 0.8;
      const deck = mk(new THREE.BoxGeometry(0.55, 0.06, 1.2), std('#a0402a'), 'sled-deck'); deck.position.y = 0.22; sled.add(deck);
      [-1, 1].forEach(sd => { const run = mk(new THREE.BoxGeometry(0.04, 0.04, 1.3), std('#2a2a2e', { metalness: 0.6, roughness: 0.4 }), 'sled-runner'); run.position.set(sd * 0.24, 0.03, 0); sled.add(run); const tip = mk(new THREE.BoxGeometry(0.04, 0.04, 0.3), run.material, 'sled-tip'); tip.position.set(sd * 0.24, 0.12, -0.72); tip.rotation.x = 0.9; sled.add(tip);
        for (const zz of [-0.4, 0.4]) { const leg = mk(new THREE.BoxGeometry(0.04, 0.18, 0.04), deck.material, 'sled-leg'); leg.position.set(sd * 0.24, 0.12, zz); sled.add(leg); } }); scene.add(sled); }
    const tm = std('#ffffff', { vertexColors: true, polygonOffset: true, polygonOffsetFactor: -3, roughness: 1 }), tc = SC('#aab8ca');
    for (let j = 0; j < 3; j++) { const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([SUM.x + 4 + j * 5 + Math.sin(t * 9 + j * 2) * 9 * t - t * 30, SUM.z - 8 - t * 140]); }
      for (const off of [-0.2, 0.2]) { const { g } = drape(pts.map(p => [p[0] + off, p[1]]), { w: 0.06, yo: 0.12, step: 1.5, col: () => tc }); scene.add(mk(g, tm, 'ski-tracks')); } } }

  // Aurora curtains to the north at night, strongest up in the snow
  await __y(); const auroraU = { time: wU.time, amt: { value: 0 } }, aur = new THREE.Group(); await __y(); aur.name = 'aurora'; await __y(); aur.visible = false;
  await __y(); { const am = new THREE.ShaderMaterial({ uniforms: auroraU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: `uniform float time; varying vec2 vUv; void main(){ vUv = uv; vec3 p = position; p.z += sin(p.x * 0.012 + time * 0.15) * 40.0 + sin(p.x * 0.031 - time * 0.22) * 16.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
      fragmentShader: `uniform float time, amt; varying vec2 vUv; float hs(float n){ return fract(sin(n) * 43758.5453); } float n1(float x){ float i = floor(x), f = fract(x); f = f*f*(3.-2.*f); return mix(hs(i), hs(i+1.), f); }
        void main(){ float x = vUv.x * 60.; float rays = n1(x * 1.7 + time * 0.4) * .6 + n1(x * 5.3 - time * 0.7) * .4; float base = smoothstep(0., .12, vUv.y) * (1. - smoothstep(.35, 1., vUv.y));
          float band = .55 + .45 * sin(vUv.x * 9. + time * .3 + n1(x * .3) * 3.); vec3 c = mix(vec3(.2, 1., .55), vec3(.55, .3, 1.), smoothstep(.3, .9, vUv.y));
          float a = base * rays * band * amt * smoothstep(0., .08, vUv.x) * smoothstep(1., .92, vUv.x); gl_FragColor = vec4(c * a, a); }` });
    [[0, 0, 900, 150], [160, 130, 700, 120]].forEach(([ox, oz, w, h]) => { const m = mk(new THREE.PlaneGeometry(w, h, 90, 1), am, 'aurora-curtain'); m.position.set(ox, 0, oz); m.frustumCulled = false; aur.add(m); }); scene.add(aur); }
  // Eagles circling the summit
  await __y(); const eagM = new THREE.MeshBasicMaterial({ color: '#2a2018', side: THREE.DoubleSide }), eag = [];
  await __y(); for (let k = 0; k < 3; k++) { const m = mk(vGeo2, eagM, 'peak-eagle'); m.scale.setScalar(3.2); scene.add(m); eag.push({ m, r: 30 + k * 16, h: 38 + k * 14, sp: 0.16 + k * 0.05, ph: k * 2.1 }); }

  // Highland wildlife: yaks, snow leopards, marmots
  await __y(); FM.snowLeo = sm2('#ffffff', { map: furTex('#dcd8cc', '#4a4a48', false), roughness: 0.9 });
  await __y(); const inPeak = (r0, r1) => { const a = rnd() * 6.283, r = lerp(r0, r1, rnd()), ca = Math.cos(a), sa = Math.sin(a), x = PEAK.x + ca * r * (ca < 0 ? PEAK.rW : PEAK.rE), z = PEAK.z + sa * r * (sa < 0 ? PEAK.rS : PEAK.rN);
    if (Math.hypot(x - FLAKE.x, z - FLAKE.z) < FLAKE.r + 4 || Math.hypot(x - CAVE.cx, z - CAVE.cz) < 18 || steep(x, z) || trailD(x, z) < 2.5) return null; return [x, z]; };
  await __y(); const YM = { fur: sm2('#3b2c22', { roughness: 0.95 }), dark: sm2('#241a14', { roughness: 0.95 }), horn: sm2('#e8e0cc'), nose: sm2('#1a1412') };
  await __y(); const buildYak = (g, _m, legs) => { const body = mk(new THREE.CapsuleGeometry(0.42, 0.9, 6, 14), YM.fur, 'yak-body'); body.rotation.x = Math.PI / 2; body.position.y = 0.95; g.add(body);
    const hump = mk(new THREE.SphereGeometry(0.42, 14, 10), YM.fur, 'yak-hump'); hump.scale.set(0.9, 0.8, 1.1); hump.position.set(0, 1.28, -0.35); g.add(hump);
    const skirt = mk(new THREE.CylinderGeometry(0.46, 0.56, 0.5, 14, 1, true), YM.dark, 'yak-skirt'); skirt.scale.set(1, 1, 1.9); skirt.position.y = 0.62; g.add(skirt);
    const head = mk(new THREE.SphereGeometry(0.25, 14, 10), YM.dark, 'yak-head'); head.scale.set(0.9, 1, 1.25); head.position.set(0, 0.92, -0.98); g.add(head);
    const snout = mk(new THREE.SphereGeometry(0.14, 10, 8), YM.nose, 'yak-snout'); snout.position.set(0, 0.8, -1.2); g.add(snout);
    [-1, 1].forEach(sd => g.add(mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(sd * 0.16, 1.05, -0.95), V(sd * 0.38, 1.12, -0.95), V(sd * 0.44, 1.32, -1.02), V(sd * 0.36, 1.45, -1.08)]), 10, 0.035, 6), YM.horn, 'yak-horn')));
    for (let i = 0; i < 4; i++) { const leg = mk(new THREE.CylinderGeometry(0.09, 0.08, 0.6, 8), YM.dark, 'yak-leg'); leg.position.set((i % 2 ? 1 : -1) * 0.24, 0.3, i < 2 ? -0.5 : 0.5); g.add(leg); legs.push(leg); }
    const tail = mk(new THREE.CylinderGeometry(0.03, 0.08, 0.6, 6), YM.dark, 'yak-tail'); tail.position.set(0, 0.95, 0.92); tail.rotation.x = 0.4; g.add(tail); };
  await __y(); const MM = { fur: sm2('#9a6a3e', { roughness: 0.95 }), belly: sm2('#c8a070'), dark: sm2('#3a2818') };
  await __y(); const buildMarmot = (g, _m, legs) => { const body = mk(new THREE.CapsuleGeometry(0.13, 0.22, 6, 10), MM.fur, 'marmot-body'); body.rotation.x = Math.PI / 2 - 0.5; body.position.y = 0.2; g.add(body);
    const head = mk(new THREE.SphereGeometry(0.1, 12, 10), MM.fur, 'marmot-head'); head.position.set(0, 0.34, -0.16); g.add(head);
    const muz = mk(new THREE.SphereGeometry(0.05, 8, 6), MM.belly, 'marmot-muzzle'); muz.position.set(0, 0.31, -0.25); g.add(muz);
    [-1, 1].forEach(sd => { const e = mk(new THREE.SphereGeometry(0.014, 6, 4), FM.black, 'marmot-eye'); e.position.set(sd * 0.05, 0.37, -0.24); g.add(e); const ear = mk(new THREE.SphereGeometry(0.025, 6, 4), MM.dark, 'marmot-ear'); ear.position.set(sd * 0.07, 0.42, -0.14); g.add(ear); });
    const tail = mk(new THREE.CapsuleGeometry(0.04, 0.12, 4, 6), MM.dark, 'marmot-tail'); tail.position.set(0, 0.08, 0.22); tail.rotation.x = 1.2; g.add(tail);
    for (let i = 0; i < 4; i++) { const leg = mk(new THREE.CylinderGeometry(0.025, 0.025, 0.1, 5), MM.dark, 'marmot-leg'); leg.position.set((i % 2 ? 1 : -1) * 0.07, 0.05, i < 2 ? -0.08 : 0.1); g.add(leg); legs.push(leg); } };
  await __y(); spawnIn('yak', lp ? 4 : 6, () => inPeak(0.62, 0.95), buildYak, { wanderSpd: 0.5, fleeSpd: 2.8, fleeDist: 7, gait: 3.5, shadow: true });
  await __y(); spawnIn('yak', 3, () => { const a = rnd() * 6.28, r = FLAKE.r * (1.3 + rnd() * 0.6), x = FLAKE.x + Math.cos(a) * r, z = FLAKE.z + Math.sin(a) * r; return trailD(x, z) < 3 ? null : [x, z]; }, buildYak, { wanderSpd: 0.5, fleeSpd: 2.8, fleeDist: 7, gait: 3.5, shadow: true });
  await __y(); spawnIn('snow leopard', 2, () => inPeak(0.2, 0.5), bigCat(FM.snowLeo, 0.72), { wanderSpd: 0.9, fleeSpd: 6.5, fleeDist: 11, gait: 6, shadow: true });
  await __y(); spawnIn('marmot', lp ? 5 : 10, () => inPeak(0.45, 0.92), buildMarmot, { wanderSpd: 0.6, fleeSpd: 4.5, fleeDist: 7, gait: 10 });

  // Blossom road wildlife: cranes at the stream and koi pond, deer under the trees
  await __y(); const CRM = { white: sm2('#f4f2ee', { roughness: 0.7 }), red: sm2('#d0302a'), leg: sm2('#3a3a3a'), beak: sm2('#6a6a58') };
  await __y(); const buildCrane = (g, _m, legs) => { const body = mk(new THREE.SphereGeometry(0.2, 16, 12), CRM.white, 'crane-body'); body.scale.set(0.8, 0.75, 1.45); body.position.y = 1.0; g.add(body);
    const tl = mk(new THREE.ConeGeometry(0.12, 0.3, 8), FM.black, 'crane-tail'); tl.rotation.x = Math.PI / 2 + 0.3; tl.position.set(0, 0.98, 0.32); g.add(tl);
    g.add(mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, 1.06, -0.2), V(0, 1.3, -0.28), V(0, 1.5, -0.3), V(0, 1.62, -0.36)]), 16, 0.028, 8), FM.black, 'crane-neck'));
    const head = mk(new THREE.SphereGeometry(0.05, 12, 10), CRM.white, 'crane-head'); head.position.set(0, 1.64, -0.38); g.add(head);
    const crown = mk(new THREE.SphereGeometry(0.03, 8, 6), CRM.red, 'crane-crown'); crown.position.set(0, 1.685, -0.37); g.add(crown);
    const beak = mk(new THREE.ConeGeometry(0.015, 0.14, 6), CRM.beak, 'crane-beak'); beak.rotation.x = -Math.PI / 2 - 0.2; beak.position.set(0, 1.63, -0.48); g.add(beak);
    [-1, 1].forEach(sd => { const leg = mk(new THREE.CylinderGeometry(0.012, 0.012, 0.9, 6), CRM.leg, 'crane-leg'); leg.position.set(sd * 0.05, 0.45, 0.02); g.add(leg); legs.push(leg); }); };
  await __y(); const DM = { fur: sm2('#a0723e'), belly: sm2('#e8dcc4'), antler: sm2('#6a5238') };
  await __y(); const buildDeer = (g, _m, legs) => { const body = mk(new THREE.CapsuleGeometry(0.2, 0.6, 6, 12), DM.fur, 'deer5-body'); body.rotation.x = Math.PI / 2; body.position.y = 0.85; g.add(body);
    const neck = mk(new THREE.CylinderGeometry(0.07, 0.1, 0.45, 8), DM.fur, 'deer5-neck'); neck.position.set(0, 1.1, -0.42); neck.rotation.x = -0.5; g.add(neck);
    const head = mk(new THREE.SphereGeometry(0.12, 12, 10), DM.fur, 'deer5-head'); head.scale.set(0.85, 0.9, 1.5); head.position.set(0, 1.33, -0.55); g.add(head);
    const nose = mk(new THREE.SphereGeometry(0.03, 6, 4), FM.black, 'deer5-nose'); nose.position.set(0, 1.3, -0.72); g.add(nose);
    [-1, 1].forEach(sd => { const ear = mk(new THREE.ConeGeometry(0.04, 0.14, 6), DM.fur, 'deer5-ear'); ear.position.set(sd * 0.09, 1.45, -0.5); ear.rotation.z = sd * -0.6; g.add(ear);
      const an = mk(new THREE.CylinderGeometry(0.012, 0.02, 0.3, 5), DM.antler, 'deer5-antler'); an.position.set(sd * 0.06, 1.55, -0.52); an.rotation.z = sd * -0.35; g.add(an); });
    const tail = mk(new THREE.SphereGeometry(0.06, 8, 6), DM.belly, 'deer5-tail'); tail.position.set(0, 0.95, 0.5); g.add(tail);
    for (let i = 0; i < 4; i++) { const leg = mk(new THREE.CylinderGeometry(0.035, 0.03, 0.8, 6), DM.fur, 'deer5-leg'); leg.position.set((i % 2 ? 1 : -1) * 0.1, 0.4, i < 2 ? -0.28 : 0.3); g.add(leg); legs.push(leg); } };
  await __y(); spawnIn('crane', lp ? 3 : 5, () => { const t = lerp(0.6, 0.9, rnd()), f = t * (STREAM.pts.length - 1), i = Math.floor(f), p = STREAM.pts[i], sd = rnd() < 0.5 ? -1 : 1; const x = p[0] + BRIDGE.dx * 3 * sd + (rnd() - 0.5), z = p[1] + BRIDGE.dz * 3 * sd; return sroadD(x, z) < 6 ? null : [x, z]; }, buildCrane, { wanderSpd: 0.3, fleeSpd: 2.4, fleeDist: 7, gait: 3 });
  await __y(); spawnIn('crane', 3, () => { const a = rnd() * 6.28, r = BPOOL.r * (1.15 + rnd() * 0.3); return [BPOOL.x + Math.cos(a) * r, BPOOL.z + Math.sin(a) * r]; }, buildCrane, { wanderSpd: 0.3, fleeSpd: 2.4, fleeDist: 7, gait: 3 });
  await __y(); spawnIn('deer', lp ? 3 : 5, () => { const u = lerp(0.3, 0.7, rnd()), [x0, z0, dx, dz] = bAt(u), off = (rnd() < 0.5 ? -1 : 1) * (9 + rnd() * 16), x = x0 - dz * off, z = z0 + dx * off; return streamD(x, z) < 4 ? null : [x, z]; }, buildDeer, { wanderSpd: 0.8, fleeSpd: 6, fleeDist: 12, gait: 5, shadow: true });

  // Foothill forests: clumps of pine and broadleaf across the outer land, snow-dusted near the peak (deferred in bands)
  await __y(); const TREE_OK = (x, z) => coreOut(x, z) > 14 && edgeInfo(x, z).e > RIM * 0.92 && NREG.every(R => regW(R, x, z) < 0.12) && loopD(x, z) > 5 && stream2D(x, z) > 6 && PONDS.every(P => Math.hypot(x - P.x, z - P.z) > P.r * 1.7) && peakR(x, z) > 0.5 && Math.hypot(x - FLAKE.x, z - FLAKE.z) > FLAKE.r * 1.9 && Math.hypot(x - CAVE.cx, z - CAVE.cz) > 28 && sroadD(x, z) > 7 && trailD(x, z) > 6 && streamD(x, z) > 6;
  await __y(); const PCOL = ['#2f5a34', '#35633a', '#2a5030', '#3d6a3c'].map(SC), RCOL = ['#4f7a34', '#5a8a3a', '#46702e', '#6a8a3a'].map(SC), FROST = SC('#e8eef4');
  await __y(); const forestJob = (x0, x1, z0, z1, N0) => () => { const N = Math.round(N0 * (lp ? 0.5 : 1)), pineM = std('#ffffff'), rndM = std('#ffffff'); windify(pineM, 0.1); windify(rndM, 0.14);
    const tr = inst(new THREE.CylinderGeometry(0.14, 0.24, 1, 5).translate(0, 0.5, 0), std('#4a3a2e'), N, 'tree-trunks'), pc = inst(new THREE.ConeGeometry(1, 1, 7).translate(0, 0.5, 0), pineM, N * 2, 'pine-crowns'), rc = inst(new THREE.IcosahedronGeometry(1, 1), rndM, N * 2, 'round-crowns'), c = new THREE.Color(); let k = 0, p = 0, r = 0;
    for (let t = 0; t < N * 3 && k < N; t++) { const cx = lerp(x0, x1, rnd()), cz = lerp(z0, z1, rnd()); if (fbm(cx * 0.007 + 71, cz * 0.007 + 13) < 0.5 && rnd() > 0.12) continue; if (!TREE_OK(cx, cz)) continue;
      const nc = 3 + Math.floor(rnd() * 6), pinePref = peakR(cx, cz) < 0.85 ? 0.85 : 0.45;
      for (let j = 0; j < nc && k < N; j++) { const x = cx + (rnd() - 0.5) * 22, z = cz + (rnd() - 0.5) * 22; if (!TREE_OK(x, z) || collideAt(x, z, 1.6)) continue; const y = H(x, z); if (y < SEA_Y + 3 || waterAt(x, z) !== null) continue;
        if (Math.hypot(H(x + 1.5, z) - H(x - 1.5, z), H(x, z + 1.5) - H(x, z - 1.5)) / 3 > 0.6) continue; const frost = sstep(0.72, 0.55, peakR(x, z));
        if (rnd() < pinePref) { const th = 1 + rnd() * 0.8, h = 5 + rnd() * 5, rr = 1.3 + rnd() * 0.8; putI(tr, k, x, y - 0.2, z, 0, 1, th + 0.2, 1); c.copy(pick(PCOL)).lerp(FROST, frost * 0.6); putI(pc, p++, x, y + th - 0.2, z, rnd() * 6, rr, h * 0.62, rr, c); putI(pc, p++, x, y + th - 0.2 + h * 0.38, z, rnd() * 6, rr * 0.68, h * 0.62, rr * 0.68, c); }
        else { const th = 2.2 + rnd() * 1.6, cs = 1.6 + rnd() * 1.2; putI(tr, k, x, y - 0.2, z, 0, 1.2, th + 0.4, 1.2); c.copy(pick(RCOL)); putI(rc, r++, x, y + th + cs * 0.4, z, rnd() * 6, cs, cs * 0.85, cs, c); if (rnd() < 0.6) putI(rc, r++, x + (rnd() - 0.5) * 1.4, y + th + cs * 0.9, z + (rnd() - 0.5) * 1.4, rnd() * 6, cs * 0.7, cs * 0.6, cs * 0.7, c); }
        addSolid(x, z, 0.35); k++; } }
    tr.count = k; pc.count = p; rc.count = r; tr.castShadow = !lp; scene.add(tr, pc, rc); };
  await __y(); deferred.push(forestJob(300, WB.x1, -300, 150, 260), forestJob(300, WB.x1, 150, WB.z0, 300), forestJob(WB.x0, 300, 150, WB.z0, 240), forestJob(300, WB.x1, ZEND - 230, -300, 300), forestJob(WB.x0, CORE.x0, ZEND - 230, 150, 80));

  // Blossom road: cherry trees thickening toward the valley, a bamboo stretch, a stream + bridge, gates, fallen petals
  await __y(); deferred.push(() => { const n = lp ? 0.5 : 1, PK = ['#f4b8cc', '#f8c8d8', '#eea8c0', '#fbe0ea', '#f2a6c2'], CT = [];
    { const NT = Math.round(150 * n), tr = inst(new THREE.CylinderGeometry(0.16, 0.3, 1, 7).translate(0, 0.5, 0), std('#4a3230'), NT * 3, 'cherry-trunks'), cm = std('#ffffff'); windify(cm, 0.22);
      const cr = inst(new THREE.IcosahedronGeometry(1, 1), cm, NT * 4, 'cherry-crowns'); let k = 0, t = 0, c = 0;
      for (let i = 0; i < NT * 5 && k < NT; i++) { const u = lerp(0.03, 0.66, Math.pow(rnd(), 0.55)), off = (rnd() < 0.5 ? -1 : 1) * (5 + rnd() * 24);
        if (u > 0.11 && u < 0.34 && Math.abs(off) < 26 && rnd() < 0.85) continue;
        const [x0, z0, dx, dz] = bAt(u), x = x0 - dz * off, z = z0 + dx * off; if (sroadD(x, z) < 4.5 || trailD(x, z) < 4 || streamD(x, z) < 4 || collideAt(x, z, 2)) continue;
        const y = H(x, z) - 0.15, h = 2.6 + rnd() * 1.8, a = rnd() * 6.28;
        putI(tr, t++, x, y, z, a, 1, h, 1, null, (rnd() - 0.5) * 0.2, 0); for (const sd of [-1, 1]) putI(tr, t++, x, y + h * 0.8, z, a, 0.55, h * 0.6, 0.55, null, 0, sd * 0.7);
        for (let j = 0; j < 4; j++) { const b = rnd() * 6.28, o = j ? 1.3 + rnd() * 0.9 : 0, cs = (j ? 1.6 : 2.3) + rnd() * 0.8; putI(cr, c++, x + Math.cos(b) * o, y + h + 0.9 + rnd() * 0.8 - (j ? 0.4 : 0), z + Math.sin(b) * o, rnd() * 6, cs, cs * 0.7, cs, pick(PK)); }
        addSolid(x, z, 0.3); CT.push([x, z]); k++; }
      tr.count = t; cr.count = c; tr.castShadow = !lp; scene.add(tr, cr); }
    { const NPc = Math.round(2400 * n), pc = inst(new THREE.CircleGeometry(0.07, 5).rotateX(-Math.PI / 2), std('#ffffff', { roughness: 0.8, side: THREE.DoubleSide }), NPc, 'petal-carpet'); let k = 0;
      for (let i = 0; i < NPc && k < NPc; i++) { let x, z, y; if (i % 3 === 0 || !CT.length) { const u = lerp(0.3, 1, rnd()), [x0, z0, dx, dz] = bAt(u), off = (rnd() - 0.5) * 7; x = x0 - dz * off; z = z0 + dx * off; y = H(x, z) + 0.15; } else { const [tx, tz] = CT[i % CT.length], a = rnd() * 6.28, r = Math.sqrt(rnd()) * 3.2; x = tx + Math.cos(a) * r; z = tz + Math.sin(a) * r; y = H(x, z) + 0.03; }
        if (streamD(x, z) < 2.4) continue; putI(pc, k++, x, y, z, rnd() * 6, 0.8 + rnd() * 0.6, 1, 0.8 + rnd() * 0.6, pick(PK)); }
      pc.count = k; scene.add(pc); }
    { const NB = Math.round(700 * n), bg = new THREE.CylinderGeometry(0.055, 0.07, 1, 6, 20, false).translate(0, 0.5, 0); { const pa = bg.attributes.position, ca = new Float32Array(pa.count * 3); for (let i = 0; i < pa.count; i++) { const v = Math.round(pa.getY(i) * 20) % 2 ? 1 : 0.76; ca[i * 3] = ca[i * 3 + 1] = ca[i * 3 + 2] = v; } bg.setAttribute('color', new THREE.BufferAttribute(ca, 3)); }
      const bm = std('#ffffff', { vertexColors: true }), st = inst(bg, bm, NB, 'bamboo-stalks'), lm = std('#ffffff', { side: THREE.DoubleSide }); windify(lm, 0.35); const lv = inst(new THREE.PlaneGeometry(0.14, 0.8).translate(0, 0.4, 0), lm, NB * 5, 'bamboo-leaves');
      const BC = ['#6f9a3a', '#7aa844', '#5f8a34', '#8aa84a', '#9aa650'], LC = ['#5a8a34', '#6a9a3c', '#4f7a2e', '#7aa846']; let k = 0, q = 0;
      for (let i = 0; i < NB && k < NB; i++) { const u = lerp(0.115, 0.335, rnd()), sd = rnd() < 0.5 ? -1 : 1, off = sd * (3.4 + Math.pow(rnd(), 1.6) * 20), [x0, z0, dx, dz] = bAt(u), cx = x0 - dz * off, cz = z0 + dx * off;
        if (streamD(cx, cz) < 4 || trailD(cx, cz) < 3.5 || GATES.some(g => Math.abs(u - g) * BSR.len < 3 && Math.abs(off) < 5)) continue; const nn = 4 + Math.floor(rnd() * 6), lean = 0.06 + (1 - Math.min(1, (Math.abs(off) - 3.4) / 12)) * 0.16, lx = dz * sd, lz = -dx * sd;
        for (let j = 0; j < nn && k < NB; j++) { const x = cx + (rnd() - 0.5) * 1.4, z = cz + (rnd() - 0.5) * 1.4; if (sroadD(x, z) < 3.1) continue; const y = H(x, z) - 0.1, h = 6 + rnd() * 5, s = 0.8 + rnd() * 0.5, a = lean * (0.7 + rnd() * 0.6);
          putI(st, k++, x, y, z, 0, s, h, s, pick(BC), a * lz, -a * lx);
          for (let m = 0; m < 5; m++) { const f = 0.55 + m * 0.09 + rnd() * 0.04; putY(lv, q++, x + lx * a * h * f, y + h * f * Math.cos(a), z + lz * a * h * f, rnd() * 6.28, 1.9 + rnd() * 0.5, 1, 1 + rnd() * 0.3, 1, pick(LC)); } }
        addSolid(cx, cz, 0.6); }
      st.count = k; lv.count = q; scene.add(st, lv); } });
  await __y(); { const verm = std('#c8402a', { roughness: 0.6 }), blk = std('#231c1c');
    GATES.forEach(u => { const [x, z, dx, dz] = bAt(u), g = new THREE.Group(); g.name = 'blossom-gate'; g.position.set(x, roadQ(BSR, x, z).y, z); g.rotation.y = Math.atan2(dx, dz);
      const add = (geo, mat, px, py, rz = 0) => { const m = mk(geo, mat, 'gate-part'); m.position.set(px, py, 0); m.rotation.z = rz; m.castShadow = !lp; g.add(m); };
      for (const sd of [-1, 1]) { add(new THREE.CylinderGeometry(0.2, 0.24, 4.6, 12), verm, sd * 3.4, 2.3); add(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 12), blk, sd * 3.4, 0.2); add(new THREE.BoxGeometry(0.9, 0.22, 0.5), blk, sd * 4.55, 4.86, sd * 0.28); addSolid(x + dz * 3.4 * sd, z - dx * 3.4 * sd, 0.3); }
      add(new THREE.BoxGeometry(8, 0.26, 0.22), verm, 0, 3.55); add(new THREE.BoxGeometry(0.2, 0.8, 0.18), verm, 0, 4.1); add(new THREE.BoxGeometry(8.6, 0.32, 0.42), verm, 0, 4.6); add(new THREE.BoxGeometry(8.8, 0.14, 0.5), blk, 0, 4.82);
      scene.add(g); }); }
  await __y(); { const wd = std('#7a5236'), rail = std('#b8452e', { roughness: 0.6 }), B = BRIDGE, g = new THREE.Group(); g.name = 'blossom-bridge'; g.position.set(B.x, 0, B.z); g.rotation.y = Math.atan2(B.dx, B.dz); scene.add(g);
    const NPL = 14, slope = a => -0.5 * Math.sin(clamp(a / (B.len / 2), -1, 1) * Math.PI / 2) * (Math.PI / 2) / (B.len / 2);
    for (let i = 0; i < NPL; i++) { const a = (i + 0.5) / NPL * B.len - B.len / 2, pl = mk(new THREE.BoxGeometry(B.w * 2 + 0.3, 0.14, B.len / NPL * 0.94), wd, 'bridge-plank'); pl.position.set(0, bridgeY(a) - 0.07, a); pl.rotation.x = -Math.atan(slope(a)); pl.receiveShadow = !lp; g.add(pl); }
    for (const sd of [-1, 1]) { const xs = sd * (B.w + 0.12); let prev = null;
      for (let i = 0; i <= 7; i++) { const a = i / 7 * B.len - B.len / 2, y = bridgeY(a), post = mk(new THREE.BoxGeometry(0.14, 1.0, 0.14), rail, 'bridge-post'); post.position.set(xs, y + 0.45, a); g.add(post); const top = new THREE.Vector3(xs, y + 0.95, a);
        if (prev) { const d = top.clone().sub(prev), r2 = mk(new THREE.BoxGeometry(0.1, 0.1, d.length()), rail, 'bridge-rail'); r2.position.copy(prev).addScaledVector(d, 0.5); r2.rotation.x = -Math.atan2(d.y, d.z); g.add(r2); } prev = top; }
      const beam = mk(new THREE.BoxGeometry(0.2, 0.3, B.len), wd, 'bridge-beam'); beam.position.set(sd * (B.w - 0.3), B.y - 0.1, 0); g.add(beam); } }
  await __y(); { const P = STREAM.pts, pos = [], uvs = [], al = [], idx = []; let acc = 0;
    for (let i = 0; i < P.length; i++) { const t = i / (P.length - 1), q = P[Math.min(P.length - 1, i + 1)], o = P[Math.max(0, i - 1)], dx = q[0] - o[0], dz = q[1] - o[1], dl = Math.hypot(dx, dz) || 1, px = -dz / dl, pz = dx / dl, y = STREAM.wy ? STREAM.wy[i] : (streamWY(0.5), STREAM.wy[i]);
      if (i) acc += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); for (const sd of [-1, 1]) { pos.push(P[i][0] + px * 2.2 * sd, y, P[i][1] + pz * 2.2 * sd); uvs.push(sd < 0 ? 0 : 1, acc / 6); al.push(streamF(t)); }
      if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setAttribute('al', new THREE.Float32BufferAttribute(al, 1)); g.setIndex(idx);
    const sm = new THREE.ShaderMaterial({ uniforms: { time: wU.time, night: skyU.night }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: `attribute float al; varying vec2 vUv; varying float vAl; void main(){ vUv = uv; vAl = al; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: `uniform float time, night; varying vec2 vUv; varying float vAl; float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(hs(i), hs(i+vec2(1.,0.)), f.x), mix(hs(i+vec2(0.,1.)), hs(i+vec2(1.,1.)), f.x), f.y); }
        void main(){ float s = vn(vec2(vUv.x * 6., vUv.y * 1.2 - time * 1.4)) * .6 + vn(vec2(vUv.x * 14., vUv.y * 3. - time * 2.2)) * .4; vec3 c = mix(vec3(.28, .48, .56), vec3(.8, .92, .96), smoothstep(.55, .85, s)); c *= mix(1., .35, night);
          float e = smoothstep(0., .2, vUv.x) * smoothstep(1., .8, vUv.x); gl_FragColor = vec4(c, e * vAl * (.62 + .3 * s)); }` });
    const m = mk(g, sm, 'blossom-stream'); m.renderOrder = 2; scene.add(m);
    const rk = inst(new THREE.DodecahedronGeometry(1, 0), std('#ffffff'), 30, 'stream-rocks'); let k = 0;
    for (const t of [0.06, 0.94]) for (let j = 0; j < 9; j++) { const f = t * (P.length - 1), i = Math.round(f), x = P[i][0] + (rnd() - 0.5) * 6, z = P[i][1] + (rnd() - 0.5) * 6, s = 0.4 + rnd() * 0.9; putI(rk, k++, x, H(x, z) + s * 0.2, z, rnd() * 6, s * 1.2, s * 0.7, s, pick(['#7a7a70', '#6a6c62', '#8a8878']), rnd(), rnd()); }
    for (let j = 0; j < 10; j++) { const t = rnd(), f = t * (P.length - 1), i = Math.round(f), sd = rnd() < 0.5 ? -1 : 1, x = P[i][0] + BRIDGE.dx * 3.4 * sd, z = P[i][1] + BRIDGE.dz * 3.4 * sd, s = 0.3 + rnd() * 0.4; if (sroadD(x, z) < 4) continue; putI(rk, k++, x, H(x, z) + s * 0.2, z, rnd() * 6, s * 1.3, s * 0.6, s, '#5f6a58', rnd(), rnd()); }
    rk.count = k; scene.add(rk); }
  await __y(); const petalW = (x, z) => { if (x < BSR.bx0 || x > BSR.bx1 || z < BSR.bz0 || z > BSR.bz1) return 0; const q = roadQ(BSR, x, z); return (1 - sstep(18, 40, q.d)) * sstep(0.26, 0.42, q.u) * 0.85; };
  await __y(); let gateNext = 0, gateT0 = 0, gateLastU = -1; await __y(); const GRUN = GATES.slice(1);

  // ===== v6 · Zones: farmland, tea estate, hot springs, red-rock canyon; ridge loop; streams; wildflowers; butterflies; herds =====
  await __y(); const colGeo = (g, fn) => { const pa = g.attributes.position, ca = new Float32Array(pa.count * 3), c = new THREE.Color(); for (let i = 0; i < pa.count; i++) { fn(c, pa.getX(i), pa.getY(i), pa.getZ(i)); ca[i * 3] = c.r; ca[i * 3 + 1] = c.g; ca[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(ca, 3)); return g; };
  await __y(); const vcM = (o = {}) => std('#ffffff', { vertexColors: true, ...o });
  await __y(); const clearOf = (x, z, r = 3) => sroadD(x, z) > r + 1.5 && loopD(x, z) > r && trailD(x, z) > r && stream2D(x, z) > r && streamD(x, z) > r && waterAt(x, z) === null;
  await __y(); const prism = (w, h, d, mat, name) => { const m = mk(new THREE.CylinderGeometry(1, 1, d, 3).rotateX(-Math.PI / 2), mat, name); m.scale.set(w / 1.732, h / 1.5, 1); return m; };
  await __y(); const smokeM = () => new THREE.SpriteMaterial({ map: GT, color: '#d8d4cc', transparent: true, depthWrite: false, opacity: 0.3 });
  await __y(); const smokes = [], steams = [];
  await __y(); const addSmoke = (x, y, z, n, col) => { for (let i = 0; i < n; i++) { const s = new THREE.Sprite(smokeM()); if (col) s.material.color.set(col); s.position.set(x, y, z); scene.add(s); smokes.push({ s, x, y, z, ph: i / n, n }); } };
  await __y(); const waterStrip = (pts, w, yAt, name) => { const pos = [], uvs = [], al = [], idx = []; let acc = 0; const N = pts.length;
    for (let i = 0; i < N; i++) { const t = i / (N - 1), q = pts[Math.min(N - 1, i + 1)], o = pts[Math.max(0, i - 1)], dx = q[0] - o[0], dz = q[1] - o[1], dl = Math.hypot(dx, dz) || 1, px = -dz / dl, pz = dx / dl, y = yAt(i, t);
      if (i) acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); for (const sd of [-1, 1]) { pos.push(pts[i][0] + px * w * sd, y, pts[i][1] + pz * w * sd); uvs.push(sd < 0 ? 0 : 1, acc / 6); al.push(streamF(t)); }
      if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setAttribute('al', new THREE.Float32BufferAttribute(al, 1)); g.setIndex(idx);
    const sm = new THREE.ShaderMaterial({ uniforms: { time: wU.time, night: skyU.night }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: `attribute float al; varying vec2 vUv; varying float vAl; void main(){ vUv = uv; vAl = al; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: `uniform float time, night; varying vec2 vUv; varying float vAl; float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(hs(i), hs(i+vec2(1.,0.)), f.x), mix(hs(i+vec2(0.,1.)), hs(i+vec2(1.,1.)), f.x), f.y); }
        void main(){ float s = vn(vec2(vUv.x * 6., vUv.y * 1.2 - time * 1.4)) * .6 + vn(vec2(vUv.x * 14., vUv.y * 3. - time * 2.2)) * .4; vec3 c = mix(vec3(.28, .48, .56), vec3(.8, .92, .96), smoothstep(.55, .85, s)); c *= mix(1., .35, night);
          float e = smoothstep(0., .2, vUv.x) * smoothstep(1., .8, vUv.x); gl_FragColor = vec4(c, e * vAl * (.62 + .3 * s)); }` });
    const m = mk(g, sm, name); m.renderOrder = 2; scene.add(m); return m; };
  await __y(); STREAMS2.forEach((S, i) => { stream2WY(S, 0.5); waterStrip(S.pts, 1.9, j => S.wy[j], 'zone-stream'); });

  // Ridge loop: a narrow draped track whose surface changes with the zone it crosses; marker posts + signs at both ends
  await __y(); const loopCv = (() => { const c2 = new THREE.Color(), CB = [[FARM, SC('#8a6a44')], [BLOSSOM, SC('#b89a8a')], [SPRINGS, SC('#d8cdb8')], [CANYON, SC('#b0603a')], [TEA, SC('#94502e')]], DEF = SC('#7e6446');
    const { g, cv } = drape(LOOP.pts, { w: 1.15, yo: 0.14, step: 3, col: (x, y, z, u, s, k) => { c2.copy(DEF); for (const [R, c] of CB) { const w = regW(R, x, z); if (w > 0) c2.lerp(c, clamp(w * 1.4, 0, 1)); } if (snowAt(x, y, z) > 0.5) c2.lerp(SC('#dde4ec'), 0.8); return c2.multiplyScalar(0.93 + h2(k, s > 0 ? 7 : 8) * 0.12); } });
    const m = mk(g, std('#ffffff', { vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }), 'ridge-loop'); m.receiveShadow = !lp; scene.add(m); return cv; })();
  await __y(); { const L = loopCv.getLength(), n = Math.floor(L / 70), pm = inst(new THREE.CylinderGeometry(0.09, 0.11, 1.3, 6).translate(0, 0.65, 0), darkWood, n, 'loop-posts'), bm = inst(new THREE.CylinderGeometry(0.115, 0.115, 0.16, 8), std('#ffffff'), n, 'loop-bands'); let k = 0;
    for (let i = 1; i < n; i++) { const u = i / n, p = loopCv.getPointAt(u), t = loopCv.getTangentAt(u), x = p.x + t.z * 2.1, z = p.z - t.x * 2.1, y = H(x, z); putI(pm, k, x, y - 0.1, z, 0, 1, 1, 1); putI(bm, k, x, y + 1.05, z, 0, 1, 1, 1, '#f2b56b'); addSolid(x, z, 0.15); k++; }
    pm.count = bm.count = k; scene.add(pm, bm);
    for (const u of [0.004, 0.996]) { const p = loopCv.getPointAt(u), t = loopCv.getTangentAt(u), s = u < 0.5 ? 1 : -1; addSign(p.x + t.z * 3.2, p.z - t.x * 3.2, Math.atan2(t.x * s, t.z * s) - Math.PI / 2, 'RIDGE LOOP'); }
    { const p = loopCv.getPointAt(0.52), t = loopCv.getTangentAt(0.52); addSign(p.x + t.z * 3.2, p.z - t.x * 3.2, Math.atan2(t.x, t.z) - Math.PI / 2, 'RED CANYON'); } }

  // ---------- FARMLAND ----------
  await __y(); const FW = { wall: std('#ece4d2'), roof: std('#a8452e'), wood: std('#7a5236'), barn: std('#9a2e22'), stone: std('#8a847a'), hay: std('#d8b860'), dark: std('#2a2420'), white: std('#f2eee4'), grey: std('#5a5854'), sail: std('#efe6d2', { side: THREE.DoubleSide }) };
  await __y(); const grp = (x, z, yaw, name, pad) => { const g = new THREE.Group(); g.name = name; g.position.set(x, pad ? pad : H(x, z) - 0.05, z); g.rotation.y = yaw; scene.add(g); return g; };
  await __y(); const bx = (g, w, h, d, mat, x, y, z, name = 'bldg') => { const m = mk(new THREE.BoxGeometry(w, h, d), mat, name); m.position.set(x, y, z); m.castShadow = !lp; m.receiveShadow = !lp; g.add(m); return m; };
  await __y(); const yardY = PADS[0].y, fyaw = -FROT;
  await __y(); { const g = grp(YARD.x, YARD.z, fyaw, 'farmhouse', yardY - 0.05);
    bx(g, 6.5, 4.2, 9, FW.wall, 0, 2.1, 0); const r = prism(7.6, 2.6, 9.8, FW.roof, 'farm-roof'); r.position.set(0, 4.2 + 2.6 / 3, 0); r.castShadow = !lp; g.add(r);
    bx(g, 0.8, 2.4, 0.8, FW.stone, 1.8, 5.8, 2.6); bx(g, 1.1, 2, 0.08, FW.wood, 3.26, 1, 0).rotation.y = Math.PI / 2;
    for (const z of [-3, -1.2, 1.8, 3.4]) { bx(g, 0.06, 0.9, 0.8, FW.dark, 3.26, 2.6, z); bx(g, 0.06, 0.9, 0.8, FW.dark, -3.26, 2.6, z); }
    bx(g, 2.4, 0.15, 3.6, FW.wood, 4.5, 2.6, 0).rotation.z = -0.25; for (const z of [-1.6, 1.6]) bx(g, 0.14, 2.4, 0.14, FW.wood, 5.5, 1.2, z);
    const wp = new THREE.Vector3(1.8, 7, 2.6).applyAxisAngle(new THREE.Vector3(0, 1, 0), fyaw).add(g.position); addSmoke(wp.x, wp.y, wp.z, 6);
    const b = grp(YARD.x + Math.cos(FROT) * -15 - Math.sin(FROT) * 8, YARD.z + Math.sin(FROT) * -15 + Math.cos(FROT) * 8, fyaw, 'barn', yardY - 0.05);
    bx(b, 8, 5, 11, FW.barn, 0, 2.5, 0); const br = prism(9, 3.4, 11.6, FW.grey, 'barn-roof'); br.position.set(0, 5 + 3.4 / 3, 0); b.add(br);
    bx(b, 0.1, 3.6, 3.2, FW.white, 4.02, 1.8, 0); for (const s of [-1, 1]) { const x = bx(b, 0.12, 4.6, 0.18, FW.white, 4.06, 1.8, 0); x.rotation.x = s * 0.72; } bx(b, 0.1, 1.2, 1.2, FW.dark, 4.02, 4.4, 0);
    [[-18, -6], [-20, -2], [-22, 3], [-19, 12], [-23, 9]].forEach(([u, v], i) => { const [x, z] = farmWorld(u + (YARD.x - FARM.x) * Math.cos(FROT) + (YARD.z - FARM.z) * Math.sin(FROT), v - (YARD.x - FARM.x) * Math.sin(FROT) + (YARD.z - FARM.z) * Math.cos(FROT)), y = H(x, z) - 0.1;
      const c = mk(new THREE.CylinderGeometry(1.3, 1.4, 1.5, 12), FW.hay, 'haystack'); c.position.set(x, y + 0.75, z); c.castShadow = !lp; scene.add(c); const t = mk(new THREE.ConeGeometry(1.35, 1.4, 12), FW.hay, 'haystack-top'); t.position.set(x, y + 2.2, z); scene.add(t); addSolid(x, z, 1.3); });
    { const w = grp(YARD.x + Math.cos(FROT) * 8 - Math.sin(FROT) * -9, YARD.z + Math.sin(FROT) * 8 + Math.cos(FROT) * -9, 0, 'well', yardY - 0.05); const ring = mk(new THREE.CylinderGeometry(0.9, 0.95, 0.9, 14, 1, true), FW.stone, 'well-ring'); ring.material = std('#8a847a', { side: THREE.DoubleSide }); ring.position.y = 0.45; w.add(ring);
      for (const s of [-1, 1]) bx(w, 0.12, 2.2, 0.12, FW.wood, s * 0.85, 1.1, 0); const wr = prism(2.2, 0.8, 1.4, FW.roof, 'well-roof'); wr.rotation.y = Math.PI / 2; wr.position.y = 2.45; w.add(wr); addSolid(w.position.x, w.position.z, 1); }
    { const c = grp(YARD.x + Math.cos(FROT) * -6 - Math.sin(FROT) * 14, YARD.z + Math.sin(FROT) * -6 + Math.cos(FROT) * 14, 0.9, 'cart', yardY - 0.05); bx(c, 1.6, 0.5, 2.6, FW.wood, 0, 0.9, 0); for (const s of [-1, 1]) { const wh = mk(new THREE.TorusGeometry(0.55, 0.07, 6, 16), FW.dark, 'cart-wheel'); wh.rotation.y = Math.PI / 2; wh.position.set(s * 0.9, 0.55, 0.2); c.add(wh); } bx(c, 0.1, 0.1, 2, FW.wood, 0, 0.7, -2); }
    // fence around the yard
    { const posts = [], hw = 20, hd = 17, fp = inst(new THREE.BoxGeometry(0.16, 1.2, 0.16).translate(0, 0.6, 0), FW.wood, 200, 'fence-posts'), fr = inst(new THREE.BoxGeometry(1, 0.1, 0.07), FW.wood, 400, 'fence-rails'); let a = 0, b2 = 0;
      const edge = (u0, v0, u1, v1) => { const L = Math.hypot(u1 - u0, v1 - v0), n = Math.round(L / 2.5); let prev = null; for (let i = 0; i <= n; i++) { const u = lerp(u0, u1, i / n), v = lerp(v0, v1, i / n), [x, z] = [YARD.x + u * Math.cos(FROT) - v * Math.sin(FROT), YARD.z + u * Math.sin(FROT) + v * Math.cos(FROT)];
          if (!clearOf(x, z, 1.5)) { prev = null; continue; } const y = H(x, z); putI(fp, a++, x, y - 0.1, z, fyaw, 1, 1, 1); if (prev) { const dx = x - prev[0], dz = z - prev[1], d = Math.hypot(dx, dz), yw = Math.atan2(-dz, dx); for (const hh of [0.55, 0.95]) putI(fr, b2++, (x + prev[0]) / 2, (y + prev[2]) / 2 + hh, (z + prev[1]) / 2, yw, d, 1, 1); } prev = [x, z, y]; addSolid(x, z, 0.12); } };
      edge(-hw, -hd, hw, -hd); edge(hw, -hd, hw, hd); edge(hw, hd, -hw, hd); edge(-hw, hd, -hw, -hd); fp.count = a; fr.count = b2; scene.add(fp, fr); } }
  // windmill
  await __y(); const sails = new THREE.Group();
  await __y(); { const g = grp(MILL.x, MILL.z, 0.9, 'windmill', PADS[1].y - 0.1); const tw = mk(new THREE.CylinderGeometry(2.1, 3.0, 10, 14), std('#d8d0c0'), 'mill-tower'); tw.position.y = 5; tw.castShadow = !lp; g.add(tw);
    const cap = mk(new THREE.ConeGeometry(2.6, 2.6, 14), std('#4a3a30'), 'mill-cap'); cap.position.y = 11.2; g.add(cap); bx(g, 1.2, 2, 0.1, FW.wood, 0, 1, 2.95); bx(g, 0.7, 0.9, 0.1, FW.dark, 0, 6, 2.55);
    sails.position.set(0, 10, 2.6); g.add(sails); const hub = mk(new THREE.CylinderGeometry(0.35, 0.35, 0.6, 10), FW.dark, 'mill-hub'); hub.rotation.x = Math.PI / 2; sails.add(hub);
    for (let k = 0; k < 4; k++) { const arm = new THREE.Group(); arm.rotation.z = k * Math.PI / 2; sails.add(arm); bx(arm, 0.2, 7.6, 0.16, FW.wood, 0, 3.9, 0.2); const sl = mk(new THREE.PlaneGeometry(1.5, 5.6), FW.sail, 'mill-sail'); sl.position.set(0.85, 4.6, 0.25); arm.add(sl);
      for (let j = 0; j < 5; j++) bx(arm, 1.6, 0.06, 0.06, FW.wood, 0.8, 2.2 + j * 1.2, 0.28); }
    addSolid(MILL.x, MILL.z, 3.1); }
  // scarecrow (first mustard field)
  await __y(); { const f = FIELDS.find(q => q.type === 'mustard'); if (f) { const g = grp(f.x, f.z, fyaw + 0.4, 'scarecrow'); bx(g, 0.1, 2.4, 0.1, FW.wood, 0, 1.2, 0); bx(g, 1.8, 0.08, 0.08, FW.wood, 0, 1.75, 0); bx(g, 0.7, 0.8, 0.3, std('#5a7a9a'), 0, 1.55, 0);
    const hd = mk(new THREE.SphereGeometry(0.22, 10, 8), std('#c8a870'), 'scarecrow-head'); hd.position.y = 2.2; g.add(hd); const brim = mk(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 14), FW.hay, 'scarecrow-brim'); brim.position.y = 2.36; g.add(brim); const top = mk(new THREE.ConeGeometry(0.22, 0.3, 12), FW.hay, 'scarecrow-hat'); top.position.y = 2.52; g.add(top); addSolid(f.x, f.z, 0.3); } }
  // fields (deferred): mustard, lavender rows, wheat (one with a crop circle), paddies with water + shoots, ploughed furrows, stone walls
  await __y(); const CROP = FIELDS.find(f => f.crop);
  await __y(); deferred.push(() => { const n = lp ? 0.5 : 1, cf = Math.cos(FROT), sf = Math.sin(FROT);
    const cnt = t => FIELDS.filter(f => f.type === t).length;
    const mM = vcM(); windify(mM, 0.12); const mus = inst(colGeo(new THREE.IcosahedronGeometry(1, 0), (c, x, y) => c.set(y > 0.25 ? '#ecc830' : y > -0.3 ? '#b8b43a' : '#5a7a2e')), mM, Math.round(cnt('mustard') * 460 * n), 'mustard-flowers');
    const lav = inst(colGeo(new THREE.IcosahedronGeometry(1, 0), (c, x, y) => c.set(y > 0.1 ? '#8a6ab8' : '#6a7a5a')), vcM(), Math.round(cnt('lavender') * 640 * n), 'lavender-rows');
    const wM = vcM(); windify(wM, 0.35, 1); const wht = inst(colGeo(new THREE.ConeGeometry(0.07, 1, 3).translate(0, 0.5, 0), (c, x, y) => c.set(y > 0.7 ? '#ecd48a' : '#b89848')), wM, cnt('wheat') * 90, 'wheat'); const wheatM = vcM({ flatShading: false, roughness: 0.95 }), fY0 = 0;
    const shM = std('#ffffff'); windify(shM, 0.2, 1); const sho = inst(new THREE.ConeGeometry(0.06, 1, 3).translate(0, 0.5, 0), shM, Math.round(cnt('paddy') * 520 * n), 'paddy-shoots');
    const fur = inst(new THREE.BoxGeometry(1, 1, 1), std('#5a4230'), cnt('plough') * 110, 'furrows');
    const stn = inst(new THREE.DodecahedronGeometry(1, 0), std('#ffffff'), 3200, 'stone-walls');
    const padM = std('#86a6b4', { roughness: 0.06, metalness: 0.35, transparent: true, opacity: 0.78, flatShading: false });
    const K = { mus: 0, lav: 0, wht: 0, sho: 0, fur: 0, stn: 0 };
    const wpt = (f, a, b) => [f.x + a * cf - b * sf, f.z + a * sf + b * cf];
    for (const f of FIELDS) { const sp = f.type;
      if (sp === 'mustard') for (let a = -FHW + 0.8; a < FHW; a += 1.6 / Math.sqrt(n)) for (let b = -FHH + 0.6; b < FHH; b += 1.3) { if (K.mus >= mus.count) break; const [x, z] = wpt(f, a + (h2(a * 9, b * 7) - 0.5) * 0.5, b); if (!clearOf(x, z, 2)) continue; const s = 0.36 + h2(a * 3, b * 5) * 0.14; putI(mus, K.mus++, x, hFast(x, z) + 0.3, z, h2(a, b) * 6, s, s * 1.1, s, TC.setHSL(0.14, 0.2, 0.9 + h2(b, a) * 0.1)); }
      if (sp === 'lavender') for (let b = -FHH + 0.9; b < FHH; b += 1.8) for (let a = -FHW + 0.5; a < FHW; a += 0.85 / Math.sqrt(n)) { if (K.lav >= lav.count) break; const [x, z] = wpt(f, a, b); if (!clearOf(x, z, 2)) continue; putI(lav, K.lav++, x, hFast(x, z) + 0.22, z, fyaw, 0.55, 0.42, 0.5, TC.setHSL(0.75, 0.15, 0.85 + h2(a * 5, b) * 0.15)); }
      if (sp === 'wheat') { const NU = 36, NV = 26, g = new THREE.PlaneGeometry(FHW * 2, FHH * 2, NU, NV).rotateX(-Math.PI / 2), pa = g.attributes.position, ca = new Float32Array(pa.count * 3), c = new THREE.Color();
        for (let i = 0; i < pa.count; i++) { const la = pa.getX(i), lb = -pa.getZ(i), [x, z] = wpt(f, la, lb), gy = hFast(x, z), edge = Math.min(FHW - Math.abs(la), FHH - Math.abs(lb)); let hgt = 0.78 * sstep(0, 1.4, edge) + (vnoise(x * 0.4, z * 0.4) - 0.5) * 0.12;
          if (f.crop) { const dc = Math.hypot(la, lb); if (dc < 3 || (dc > 6 && dc < 7.4) || (dc > 10 && dc < 11)) hgt = 0.06; } if (!clearOf(x, z, 1.2)) hgt = 0.04;
          pa.setXYZ(i, x - f.x, gy + hgt - fY0, z - f.z); c.set('#d8b85e').offsetHSL((vnoise(x * 0.15, z * 0.15) - 0.5) * 0.03, 0, (vnoise(x * 0.5 + 9, z * 0.5) - 0.5) * 0.14); if (hgt < 0.1) c.set('#9a8448'); ca[i * 3] = c.r; ca[i * 3 + 1] = c.g; ca[i * 3 + 2] = c.b; }
        g.setAttribute('color', new THREE.BufferAttribute(ca, 3)); g.computeVertexNormals(); const m = mk(g, wheatM, 'wheat-field'); m.position.set(f.x, fY0, f.z); m.receiveShadow = !lp; scene.add(m);
        for (let e = 0; e < 90 && K.wht < wht.count; e++) { const t = e / 90, per = 2 * (FHW + FHH), d = t * per * 2; let la, lb; const dd = d % per; if (dd < FHW * 2) { la = -FHW + dd; lb = e % 2 ? FHH : -FHH; } else { lb = -FHH + (dd - FHW * 2) * FHH / FHH % (FHH * 2); la = e % 2 ? FHW : -FHW; }
          const [x, z] = wpt(f, la, lb); if (!clearOf(x, z, 1.2)) continue; putI(wht, K.wht++, x, hFast(x, z) - 0.05, z, h2(e, f.i) * 6, 0.8, 0.8 + h2(f.j, e) * 0.3, 0.8, TC.setHSL(0.12, 0.1, 0.9)); } }
      if (sp === 'paddy') { const wp = mk(new THREE.PlaneGeometry(FHW * 2 - 0.6, FHH * 2 - 0.6).rotateX(-Math.PI / 2), padM, 'paddy-water'); wp.position.set(f.x, f.y + 0.03, f.z); wp.rotation.y = fyaw; wp.receiveShadow = !lp; scene.add(wp);
        for (let a = -FHW + 1; a < FHW - 0.5; a += 1.3 / Math.sqrt(n)) for (let b = -FHH + 1; b < FHH - 0.5; b += 1.3) { if (K.sho >= sho.count) break; const [x, z] = wpt(f, a, b); putI(sho, K.sho++, x, f.y - 0.1, z, h2(a, b) * 6, 1, 0.45 + h2(b * 3, a) * 0.3, 1, pick(['#6a9a3a', '#7aaa44', '#5a8a30']), (h2(a, b * 2) - 0.5) * 0.3, (h2(a * 2, b) - 0.5) * 0.3); } }
      if (sp === 'plough') for (let b = -FHH + 0.6; b < FHH; b += 1.1) for (let a = -FHW + 3; a < FHW; a += 6) { const [x, z] = wpt(f, a, b); if (!clearOf(x, z, 2)) continue; putI(fur, K.fur++, x, hFast(x, z) + 0.02, z, fyaw, 6, 0.22, 0.5); }
      if (sp === 'pasture' || h2(f.i + 7, f.j + 3) < 0.28) { const per = [[-FHW - 1.5, -FHH - 1.5, FHW + 1.5, -FHH - 1.5], [FHW + 1.5, -FHH - 1.5, FHW + 1.5, FHH + 1.5], [FHW + 1.5, FHH + 1.5, -FHW - 1.5, FHH + 1.5], [-FHW - 1.5, FHH + 1.5, -FHW - 1.5, -FHH - 1.5]];
        for (const [a0, b0, a1, b1] of per) { const L = Math.hypot(a1 - a0, b1 - b0), m2 = Math.round(L / 0.95); for (let i = 0; i < m2; i++) { if (K.stn >= 3190) break; const t = (i + 0.5) / m2, [x, z] = wpt(f, lerp(a0, a1, t), lerp(b0, b1, t)); if (!clearOf(x, z, 1.8)) continue; const y = hFast(x, z), c = pick(['#8a857e', '#9a948a', '#77716b']);
          putI(stn, K.stn++, x, y + 0.22, z, fyaw + (h2(i, f.i) - 0.5) * 0.6, 0.55, 0.4, 0.45, c); if (i % 2 === 0) { putI(stn, K.stn++, x, y + 0.6, z, fyaw + h2(f.j, i), 0.42, 0.3, 0.38, c); addSolid(x, z, 0.5); } } } } }
    mus.count = K.mus; lav.count = K.lav; wht.count = K.wht; sho.count = K.sho; fur.count = K.fur; stn.count = K.stn; scene.add(mus, lav, wht, sho, fur, stn);
    // hedgerow trees at some field corners
    { const tr = inst(new THREE.CylinderGeometry(0.16, 0.28, 1, 6).translate(0, 0.5, 0), std('#4a3a2e'), 80, 'tree-trunks'), rm = std('#ffffff'); windify(rm, 0.14); const rc = inst(new THREE.IcosahedronGeometry(1, 1), rm, 160, 'round-crowns'); let k = 0, c = 0;
      for (const f of FIELDS) { if (h2(f.i * 3, f.j * 5) > 0.45 || k >= 80) continue; const [x, z] = wpt(f, FHW + 2, FHH + 1.5); if (!clearOf(x, z, 3) || collideAt(x, z, 2)) continue; const y = H(x, z), th = 2.6 + rnd() * 1.5, cs = 2 + rnd() * 1.4, col = pick(['#4f7a34', '#5a8a3a', '#46702e']);
        putI(tr, k++, x, y - 0.2, z, 0, 1.2, th + 0.4, 1.2); putI(rc, c++, x, y + th + cs * 0.4, z, rnd() * 6, cs, cs * 0.85, cs, col); putI(rc, c++, x + 0.8, y + th + cs, z - 0.5, rnd() * 6, cs * 0.7, cs * 0.6, cs * 0.7, col); addSolid(x, z, 0.4); }
      tr.count = k; rc.count = c; tr.castShadow = !lp; scene.add(tr, rc); } });
  // crows over the fields
  await __y(); const CRN = lp ? 14 : 26, crows = new THREE.InstancedMesh(vGeo2, new THREE.MeshBasicMaterial({ color: '#141214', side: THREE.DoubleSide }), CRN); await __y(); crows.name = 'crows'; await __y(); crows.frustumCulled = false; await __y(); scene.add(crows);
  await __y(); const crd = Array.from({ length: CRN }, () => ({ a: rnd() * 6.28, r: 6 + rnd() * 14, sp: 0.5 + rnd() * 0.6, ph: rnd() * 10, h: 6 + rnd() * 8 })); await __y(); let crowSc = 0;
  // farm animals: cows + sheep in slow-moving herds
  await __y(); const cowTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#f2eee6'; g.fillRect(0, 0, 256, 128); let sd = 3; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647; g.fillStyle = '#2a2420'; for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(r() * 256, r() * 128, 10 + r() * 26, 8 + r() * 18, r() * 3, 0, 6.3); g.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  await __y(); const CWM = { hide: sm2('#ffffff', { map: cowTex, roughness: 0.85 }), dark: sm2('#2a2420'), pink: sm2('#e8a8a0'), horn: sm2('#e8e0cc') };
  await __y(); const buildCow = (g, _m, legs) => { const body = mk(new THREE.CapsuleGeometry(0.36, 0.95, 6, 14), CWM.hide, 'cow-body'); body.rotation.x = Math.PI / 2; body.position.y = 0.95; g.add(body);
    const head = mk(new THREE.BoxGeometry(0.34, 0.36, 0.5), CWM.hide, 'cow-head'); head.position.set(0, 1.12, -0.95); head.rotation.x = 0.35; g.add(head);
    const muz = mk(new THREE.BoxGeometry(0.3, 0.2, 0.18), CWM.pink, 'cow-muzzle'); muz.position.set(0, 0.98, -1.18); muz.rotation.x = 0.35; g.add(muz);
    [-1, 1].forEach(sd => { const ear = mk(new THREE.BoxGeometry(0.18, 0.05, 0.1), CWM.dark, 'cow-ear'); ear.position.set(sd * 0.24, 1.24, -0.88); g.add(ear); const horn = mk(new THREE.ConeGeometry(0.03, 0.14, 6), CWM.horn, 'cow-horn'); horn.position.set(sd * 0.13, 1.36, -0.86); horn.rotation.z = sd * -0.5; g.add(horn); });
    const ud = mk(new THREE.SphereGeometry(0.14, 10, 8), CWM.pink, 'cow-udder'); ud.position.set(0, 0.6, 0.3); g.add(ud);
    const tail = mk(new THREE.CylinderGeometry(0.02, 0.03, 0.7, 5), CWM.hide, 'cow-tail'); tail.position.set(0, 0.8, 0.85); tail.rotation.x = 0.2; g.add(tail);
    for (let i = 0; i < 4; i++) { const leg = mk(new THREE.CylinderGeometry(0.07, 0.06, 0.65, 8), CWM.hide, 'cow-leg'); leg.position.set((i % 2 ? 1 : -1) * 0.2, 0.33, i < 2 ? -0.48 : 0.5); g.add(leg); legs.push(leg); } };
  await __y(); const SHM = { wool: sm2('#efe9dc', { roughness: 1 }), face: sm2('#26221e') };
  await __y(); const buildSheep = (g, _m, legs) => { const body = mk(new THREE.IcosahedronGeometry(0.42, 1), SHM.wool, 'sheep-body'); body.scale.set(0.85, 0.75, 1.15); body.position.y = 0.62; g.add(body);
    const head = mk(new THREE.SphereGeometry(0.15, 10, 8), SHM.face, 'sheep-head'); head.scale.set(0.85, 1, 1.3); head.position.set(0, 0.74, -0.52); g.add(head);
    const cap = mk(new THREE.IcosahedronGeometry(0.13, 1), SHM.wool, 'sheep-cap'); cap.position.set(0, 0.86, -0.46); g.add(cap);
    [-1, 1].forEach(sd => { const ear = mk(new THREE.BoxGeometry(0.14, 0.04, 0.06), SHM.face, 'sheep-ear'); ear.position.set(sd * 0.15, 0.8, -0.5); g.add(ear); });
    for (let i = 0; i < 4; i++) { const leg = mk(new THREE.CylinderGeometry(0.035, 0.03, 0.4, 5), SHM.face, 'sheep-leg'); leg.position.set((i % 2 ? 1 : -1) * 0.15, 0.2, i < 2 ? -0.25 : 0.28); g.add(leg); legs.push(leg); } };
  await __y(); const herds = [];
  await __y(); const herdSpawn = (kind, n, cx, cz, rx, rz, build, opt) => { const Hd = { x: cx, z: cz, cx, cz, rx, rz, ph: rnd() * 6 }; herds.push(Hd); const n0 = critters.length;
    spawnIn(kind, n, () => { const x = cx + (rnd() - 0.5) * rx, z = cz + (rnd() - 0.5) * rz; return clearOf(x, z, 1.5) ? [x, z] : null; }, build, opt);
    critters.slice(n0).forEach(c => { c.herd = Hd; c.hox = (rnd() - 0.5) * 16; c.hoz = (rnd() - 0.5) * 16; }); };
  await __y(); { const past = FIELDS.filter(f => f.type === 'pasture'); const p0 = past[0] || FIELDS[0], p1 = past[1] || FIELDS[FIELDS.length - 1];
    herdSpawn('cow', lp ? 4 : 7, p0.x, p0.z, 40, 30, buildCow, { wanderSpd: 0.45, fleeSpd: 2.6, fleeDist: 6, gait: 3.2, shadow: true });
    herdSpawn('sheep', lp ? 6 : 12, -520, 660, 50, 40, buildSheep, { wanderSpd: 0.5, fleeSpd: 3.4, fleeDist: 7, gait: 6 });
    herdSpawn('sheep', lp ? 3 : 6, p1.x, p1.z, 30, 24, buildSheep, { wanderSpd: 0.5, fleeSpd: 3.4, fleeDist: 7, gait: 6 }); }

  // ---------- TEA ESTATE ----------
  await __y(); const TW = { wall: std('#e8e2d4'), brick: std('#9a4a34'), metal: std('#8a9098', { metalness: 0.4, roughness: 0.5 }), wood: std('#6a4a32'), sack: std('#c8b490'), dark: std('#2a2624') };
  await __y(); const tinTex = col => { const c = document.createElement('canvas'); c.width = 32; c.height = 256; const g = c.getContext('2d'); for (let i = 0; i < 32; i++) { g.fillStyle = i % 2 ? col : '#ffffff22'; g.fillRect(0, i * 8, 32, 8); } g.globalCompositeOperation = 'multiply'; g.fillStyle = col; g.fillRect(0, 0, 32, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 3); return t; };
  await __y(); const fdx = 0.84, fdz = 0.54, fyawT = Math.atan2(-fdz, fdx), fY = PADS[2].y, FP = { x: -fdz, z: fdx };
  await __y(); { const g = grp(FACT.x, FACT.z, fyawT, 'tea-factory', fY - 0.05); bx(g, 26, 7, 9, TW.wall, 0, 3.5, 0);
    const rf = prism(10.2, 2.4, 26.8, std('#ffffff', { map: tinTex('#b04a32') }), 'factory-roof'); rf.rotation.y = Math.PI / 2; rf.position.y = 7 + 0.8; rf.castShadow = !lp; g.add(rf);
    const win = inst(new THREE.BoxGeometry(1.1, 1.3, 0.08), TW.dark, 44, 'factory-windows'); let k = 0; for (const zs of [-4.54, 4.54]) for (let i = 0; i < 11; i++) for (const yy of [2.4, 5.2]) { dummy.position.set(-11 + i * 2.2, yy, zs); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); win.setMatrixAt(k++, dummy.matrix); } win.count = k; g.add(win);
    const ch = mk(new THREE.CylinderGeometry(0.6, 0.8, 15, 12), TW.brick, 'factory-chimney'); ch.position.set(12, 7.5, -2); g.add(ch); { const wp = new THREE.Vector3(12, 15.5, -2).applyAxisAngle(new THREE.Vector3(0, 1, 0), fyawT).add(g.position); addSmoke(wp.x, wp.y, wp.z, 7, '#c8c4bc'); }
    const sg = mk(new THREE.PlaneGeometry(5, 1.25), signMat('TEA FACTORY'), 'factory-sign'); sg.position.set(0, 6.1, 4.56); g.add(sg);
    bx(g, 5, 1.2, 3, TW.wood, -8, 0.6, 6.4); const sk = inst(new THREE.BoxGeometry(0.9, 0.5, 0.6), TW.sack, 18, 'tea-sacks'); for (let i = 0; i < 18; i++) { dummy.position.set(-10 + (i % 6) * 0.95, 1.45 + Math.floor(i / 6) * 0.5, 6 + (i % 2) * 0.3); dummy.rotation.set(0, (i % 3) * 0.1, 0); dummy.updateMatrix(); sk.setMatrixAt(i, dummy.matrix); } g.add(sk);
    for (let i = 0; i < 3; i++) { bx(g, 8, 0.25, 1.6, TW.wood, 4 + (i % 2), 1.1, 7 + i * 2.2); bx(g, 7.8, 0.12, 1.5, std('#5a8a34'), 4 + (i % 2), 1.3, 7 + i * 2.2); for (const s of [-1, 1]) bx(g, 0.12, 1.1, 0.12, TW.wood, 4 + (i % 2) + s * 3.8, 0.55, 7 + i * 2.2); }
    { const tk = new THREE.Group(); tk.position.set(-15, 0, -8); g.add(tk); const t = mk(new THREE.CylinderGeometry(1.4, 1.4, 2.2, 14), TW.metal, 'water-tank'); t.position.y = 6.2; tk.add(t); for (let i = 0; i < 4; i++) { const l = mk(new THREE.CylinderGeometry(0.08, 0.08, 5.2, 5), TW.wood, 'tank-leg'); l.position.set((i % 2 ? 1 : -1) * 1, 2.6, (i < 2 ? 1 : -1) * 1); tk.add(l); } }
    for (let i = -12; i <= 12; i += 4) addSolid(FACT.x + fdx * i, FACT.z + fdz * i, 4.4);
    // workers' cottages
    ['#e8c8a0', '#b8d8d0', '#e8b8b8', '#d8d0a0'].forEach((c, i) => { const o = -9 + i * 6, x = FACT.x + fdx * o - FP.x * 17, z = FACT.z + fdz * o - FP.z * 17, hg = grp(x, z, fyawT, 'tea-cottage', PADS[2].y - 0.05); bx(hg, 4.4, 3, 4, std(c), 0, 1.5, 0);
      const r = prism(5, 1.6, 4.6, std('#ffffff', { map: tinTex(i % 2 ? '#8a9098' : '#b04a32') }), 'cottage-roof'); r.position.y = 3.5; hg.add(r); bx(hg, 1, 1.9, 0.08, TW.wood, 0, 0.95, -2.02); bx(hg, 0.8, 0.8, 0.08, TW.dark, 1.3, 1.8, -2.02); addSolid(x, z, 2.6); }); }
  // chai stall
  await __y(); const STALL = { x: FACT.x + fdx * 13 - FP.x * 9, z: FACT.z + fdz * 13 - FP.z * 9 };
  await __y(); { const g = grp(STALL.x, STALL.z, fyawT + Math.PI, 'chai-stall', PADS[2].y - 0.05); bx(g, 2.4, 2.2, 1.8, std('#2a8a8a'), 0, 1.1, 0); bx(g, 2.6, 0.1, 0.7, TW.wood, 0, 1.1, -1.2);
    const aw = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 32; const x2 = c.getContext('2d'); for (let i = 0; i < 8; i++) { x2.fillStyle = i % 2 ? '#f2eee4' : '#c8402a'; x2.fillRect(i * 16, 0, 16, 32); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return std('#ffffff', { map: t, side: THREE.DoubleSide }); })();
    const awn = mk(new THREE.PlaneGeometry(3, 1.4), aw, 'stall-awning'); awn.position.set(0, 2.3, -1.1); awn.rotation.x = -1.1; g.add(awn);
    const ket = mk(new THREE.SphereGeometry(0.18, 12, 8), std('#b8b0a0', { metalness: 0.7, roughness: 0.3, flatShading: false }), 'stall-kettle'); ket.position.set(0.6, 1.33, -1.2); g.add(ket);
    const sgn = mk(new THREE.PlaneGeometry(1.6, 0.4), signMat('CHAI'), 'stall-sign'); sgn.position.set(0, 2.6, -0.92); g.add(sgn);
    for (const s of [-1, 1]) bx(g, 1.8, 0.4, 0.4, TW.wood, s * 2.2, 0.35, -2.4); const gl = glowSprite('#ffc36b', 3, 0.7); gl.position.set(STALL.x, PADS[2].y + 2, STALL.z); scene.add(gl); glows.push({ s: gl, base: 0.1, n: 0.9 }); addSolid(STALL.x, STALL.z, 1.3); }
  // landmark silver oaks with hornbills; the rest are deferred
  await __y(); const soakM = std('#6a6a5a'), soakC = std('#ffffff'); await __y(); windify(soakC, 0.1);
  await __y(); const HBM = { black: sm2('#161416'), white: sm2('#f2efe8'), bill: sm2('#e8b830'), casque: sm2('#e8942a') };
  await __y(); const buildHornbill = () => { const g = new THREE.Group(); g.name = 'hornbill'; const b = mk(new THREE.SphereGeometry(0.26, 12, 10), HBM.black, 'hb-body'); b.scale.set(0.8, 0.8, 1.4); g.add(b);
    const be = mk(new THREE.SphereGeometry(0.2, 10, 8), HBM.white, 'hb-belly'); be.position.set(0, -0.08, 0.08); be.scale.set(0.8, 0.7, 1.1); g.add(be);
    const tl = mk(new THREE.BoxGeometry(0.2, 0.04, 0.7), HBM.white, 'hb-tail'); tl.position.set(0, 0, 0.62); g.add(tl); const hd = mk(new THREE.SphereGeometry(0.13, 10, 8), HBM.black, 'hb-head'); hd.position.set(0, 0.16, -0.36); g.add(hd);
    const bl = mk(new THREE.ConeGeometry(0.06, 0.46, 8), HBM.bill, 'hb-bill'); bl.rotation.x = -Math.PI / 2 - 0.35; bl.position.set(0, 0.08, -0.62); g.add(bl); const cq = mk(new THREE.BoxGeometry(0.07, 0.08, 0.26), HBM.casque, 'hb-casque'); cq.position.set(0, 0.24, -0.5); g.add(cq);
    const wings = [-1, 1].map(s => { const pv = new THREE.Group(); pv.position.set(s * 0.18, 0.05, 0); g.add(pv); const w = mk(new THREE.PlaneGeometry(0.9, 0.5).translate(s * 0.45, 0, 0).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#161416', side: THREE.DoubleSide }), 'hb-wing'); pv.add(w); return pv; }); g.userData.wings = wings; return g; };
  await __y(); const hbPerch = [], hbFly = [];
  await __y(); { const tr = inst(new THREE.CylinderGeometry(0.12, 0.24, 1, 6).translate(0, 0.5, 0), soakM, 6, 'silver-oak-trunks'), cr = inst(new THREE.IcosahedronGeometry(1, 0), soakC, 36, 'silver-oak-crowns'); let k = 0, c = 0;
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + 0.4, x = FACT.x + Math.cos(a) * 34, z = FACT.z + Math.sin(a) * 34; if (!clearOf(x, z, 3)) continue; const y = H(x, z), h = 14 + rnd() * 3; putI(tr, k++, x, y - 0.2, z, 0, 1, h, 1);
      for (let j = 0; j < 6; j++) { const f = 0.55 + j * 0.08, ang = j * 2.3; putI(cr, c++, x + Math.cos(ang) * 1.2, y + h * f, z + Math.sin(ang) * 1.2, rnd() * 6, 1.3 + rnd() * 0.5, 0.8, 1.3 + rnd() * 0.5, pick(['#6f8456', '#7d9160', '#8a9a6a'])); }
      addSolid(x, z, 0.35); if (hbPerch.length < 4) { const hb = buildHornbill(); hb.position.set(x + 0.3, y + h + 0.5, z); hb.rotation.y = rnd() * 6; hb.userData.wings.forEach((w, s) => w.rotation.z = (s ? -1 : 1) * 0.1); scene.add(hb); hbPerch.push({ g: hb, y0: hb.position.y }); } }
    tr.count = k; cr.count = c; tr.castShadow = !lp; scene.add(tr, cr);
    for (let i = 0; i < 3; i++) { const hb = buildHornbill(); hb.scale.setScalar(1.2); scene.add(hb); hbFly.push({ g: hb, ph: i * 2.1, r: 50 + i * 25, sp: 0.07 + i * 0.02 }); } }
  // tea hedges along the contours, silver oaks across the estate (deferred)
  await __y(); deferred.push(() => { const N = lp ? 2600 : 5200, hg = inst(new THREE.IcosahedronGeometry(1, 1), std('#ffffff', { roughness: 0.8, flatShading: false }), N, 'tea-hedges'), TC2 = ['#4f8a2e', '#5a9a34', '#467e2a', '#66a83c', '#3f7426']; let k = 0;
    const nearB = (x, z) => Math.hypot(x - FACT.x, z - FACT.z) < 30 || Math.hypot(x - TPOND.x, z - TPOND.z) < TPOND.r * 1.6;
    for (let gx = 0; gx < TEA.sx * 2 && k < N; gx += 2) for (let gz = 0; gz < TEA.sz * 2 && k < N; gz += 2) { const x = TEA.x - TEA.sx + gx + (h2(gx, gz + 7) - 0.5) * 1.2, z = TEA.z - TEA.sz + gz + (h2(gx + 3, gz) - 0.5) * 1.2; if (regW(TEA, x, z) < 0.62) continue;
      const y = hFast(x, z), gxv = hFast(x + 1, z) - hFast(x - 1, z), gzv = hFast(x, z + 1) - hFast(x, z - 1), sl = Math.hypot(gxv, gzv) / 2, flat = sl < 0.07;
      const band = flat ? ((((x - TEA.x) * 0.8 + (z - TEA.z) * 0.6) / 2.2) % 1 + 1) % 1 < 0.45 : (((y - TEA.base) / 1.5) % 1 + 1) % 1 < 0.42;
      if (!band || sl > 0.7 || nearB(x, z) || !clearOf(x, z, 2.2)) continue; const yaw = flat ? Math.atan2(-0.8, -0.6) : Math.atan2(-gxv, -gzv);
      putI(hg, k++, x, y + 0.2, z, yaw, 1.2, 0.5, 0.55, pick(TC2)); }
    hg.count = k; scene.add(hg);
    const NT = lp ? 60 : 130, tr = inst(new THREE.CylinderGeometry(0.12, 0.22, 1, 6).translate(0, 0.5, 0), soakM, NT, 'silver-oak-trunks'), cr = inst(new THREE.IcosahedronGeometry(1, 0), soakC, NT * 5, 'silver-oak-crowns'); let t = 0, c = 0;
    for (let i = 0; i < NT * 4 && t < NT; i++) { const q = inReg(TEA, 0.95, 4); if (!q) continue; const [x, z] = q; if (nearB(x, z) || collideAt(x, z, 6) || !clearOf(x, z, 3)) continue; const y = H(x, z), h = 11 + rnd() * 6; putI(tr, t++, x, y - 0.2, z, 0, 1, h, 1);
      for (let j = 0; j < 5; j++) { const f = 0.55 + j * 0.09, ang = j * 2.3 + rnd(); putI(cr, c++, x + Math.cos(ang) * 1.1, y + h * f, z + Math.sin(ang) * 1.1, rnd() * 6, 1.1 + rnd() * 0.6, 0.7, 1.1 + rnd() * 0.6, pick(['#6f8456', '#7d9160', '#8a9a6a', '#62784c'])); } addSolid(x, z, 0.3); }
    tr.count = t; cr.count = c; tr.castShadow = !lp; scene.add(tr, cr); });
  // gaur
  await __y(); const GAM = { hide: sm2('#2a1e18', { roughness: 0.8 }), sock: sm2('#e8e2cc'), horn: sm2('#c8c0a0'), muz: sm2('#6a5a4a') };
  await __y(); const buildGaur = (g, _m, legs) => { const body = mk(new THREE.CapsuleGeometry(0.55, 1.3, 6, 14), GAM.hide, 'gaur-body'); body.rotation.x = Math.PI / 2; body.position.y = 1.35; g.add(body);
    const hump = mk(new THREE.SphereGeometry(0.55, 14, 10), GAM.hide, 'gaur-hump'); hump.scale.set(0.8, 0.9, 1.2); hump.position.set(0, 1.8, -0.45); g.add(hump);
    const head = mk(new THREE.BoxGeometry(0.46, 0.5, 0.7), GAM.hide, 'gaur-head'); head.position.set(0, 1.35, -1.4); head.rotation.x = 0.5; g.add(head);
    const muz = mk(new THREE.BoxGeometry(0.4, 0.26, 0.24), GAM.muz, 'gaur-muzzle'); muz.position.set(0, 1.08, -1.66); muz.rotation.x = 0.5; g.add(muz);
    [-1, 1].forEach(sd => g.add(mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(sd * 0.2, 1.62, -1.3), V(sd * 0.42, 1.7, -1.3), V(sd * 0.46, 1.9, -1.36), V(sd * 0.34, 2.02, -1.42)]), 10, 0.045, 6), GAM.horn, 'gaur-horn')));
    for (let i = 0; i < 4; i++) { const leg = mk(new THREE.CylinderGeometry(0.13, 0.11, 1.0, 8), GAM.hide, 'gaur-leg'); leg.position.set((i % 2 ? 1 : -1) * 0.3, 0.5, i < 2 ? -0.7 : 0.7); g.add(leg); legs.push(leg); const sk = mk(new THREE.CylinderGeometry(0.115, 0.1, 0.4, 8), GAM.sock, 'gaur-sock'); sk.position.y = -0.3; leg.add(sk); }
    const tail = mk(new THREE.CylinderGeometry(0.03, 0.05, 0.8, 5), GAM.hide, 'gaur-tail'); tail.position.set(0, 1.2, 1.25); tail.rotation.x = 0.25; g.add(tail); };
  await __y(); herdSpawn('gaur', lp ? 2 : 4, 830, -720, 60, 40, buildGaur, { wanderSpd: 0.5, fleeSpd: 4, fleeDist: 12, gait: 3, shadow: true });

  // ---------- HOT SPRINGS ----------
  await __y(); { const pm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.9, emissive: '#0a4a58', emissiveIntensity: 0.35 });
    const lips = inst(new THREE.TorusGeometry(1, 0.07, 6, 32).rotateX(Math.PI / 2), std('#f0ead8', { roughness: 0.6 }), SPOOLS.length, 'spring-lips');
    SPOOLS.forEach((P, i) => { const g = colGeo(new THREE.CircleGeometry(P.r - 0.05, 32).rotateX(-Math.PI / 2), (c, x, y, z) => c.set('#1f9fb8').lerp(TC.set('#a8ece2'), Math.min(1, Math.hypot(x, z) / P.r) ** 1.5)); const w = mk(g, pm, 'spring-pool'); w.position.set(P.x, P.y, P.z); w.renderOrder = 1; scene.add(w);
      putI(lips, i, P.x, P.y + 0.02, P.z, 0, P.r + 0.2, 0.9, P.r + 0.2);
      for (let s = 0; s < 3; s++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GT, color: '#ffffff', transparent: true, depthWrite: false, opacity: 0.2 })); scene.add(sp); steams.push({ s: sp, P, ph: s / 3 + i * 0.13, ox: (h2(i, s) - 0.5) * P.r, oz: (h2(s, i) - 0.5) * P.r }); }
      if (i < SPOOLS.length - 1) { const Q = SPOOLS[i + 1], dx = Q.x - P.x, dz = Q.z - P.z, dl = Math.hypot(dx, dz), a = [P.x + dx / dl * (P.r - 0.5), P.z + dz / dl * (P.r - 0.5)], b = [Q.x - dx / dl * (Q.r - 0.5), Q.z - dz / dl * (Q.r - 0.5)], pts = [];
        for (let k = 0; k <= 8; k++) pts.push([lerp(a[0], b[0], k / 8), lerp(a[1], b[1], k / 8)]); waterStrip(pts, 0.7, (k, t) => lerp(P.y, Q.y, t) + 0.12, 'spring-cascade'); } });
    scene.add(lips);
    // pavilion by the top pool
    { const g = grp(PAV.x, PAV.z, Math.atan2(SPR_D.x, SPR_D.z), 'spring-pavilion', PADS[3].y - 0.05); const dw = std('#3a2c24'); bx(g, 5.2, 0.3, 5.2, std('#6a4a32'), 0, 0.15, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, 0.2, 3, 0.2, dw, sx * 2.3, 1.6, sz * 2.3);
      const rf = mk(new THREE.ConeGeometry(4.2, 1.8, 4), dw, 'pavilion-roof'); rf.rotation.y = Math.PI / 4; rf.position.y = 4; rf.castShadow = !lp; g.add(rf); bx(g, 3, 0.35, 0.8, std('#6a4a32'), 0, 0.6, 1.6);
      for (const s of [-1, 1]) { const lanM = mk(new THREE.BoxGeometry(0.3, 0.4, 0.3), new THREE.MeshBasicMaterial({ color: '#ffc36b', fog: false }), 'pavilion-lantern'); lanM.position.set(s * 2.3, 2.7, -2.3); g.add(lanM); const gl = glowSprite('#ffc36b', 2.4, 0.8); gl.position.copy(lanM.getWorldPosition(new THREE.Vector3())); scene.add(gl); glows.push({ s: gl, base: 0.12, n: 0.95 }); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) addSolid(PAV.x + sx * 2.3, PAV.z + sz * 2.3, 0.25); } }
  // bathing macaques + roaming troop
  await __y(); const MQ = { fur: sm2('#9a8a78', { roughness: 1 }), face: sm2('#d86a5a'), dark: sm2('#3a2a24') };
  await __y(); const buildMacaque = (g, _m, legs) => { const b = mk(new THREE.SphereGeometry(0.26, 12, 10), MQ.fur, 'mq-body'); b.scale.set(0.9, 1.1, 0.9); b.position.y = 0.45; g.add(b);
    const hd = mk(new THREE.SphereGeometry(0.16, 12, 10), MQ.fur, 'mq-head'); hd.position.set(0, 0.8, -0.08); g.add(hd); const fc = mk(new THREE.SphereGeometry(0.1, 10, 8), MQ.face, 'mq-face'); fc.scale.set(1, 0.9, 0.4); fc.position.set(0, 0.78, -0.2); g.add(fc);
    [-1, 1].forEach(s => { const e = mk(new THREE.SphereGeometry(0.018, 6, 4), MQ.dark, 'mq-eye'); e.position.set(s * 0.04, 0.81, -0.24); g.add(e); const ear = mk(new THREE.SphereGeometry(0.04, 6, 4), MQ.face, 'mq-ear'); ear.position.set(s * 0.15, 0.82, -0.06); g.add(ear); });
    for (let i = 0; i < 4; i++) { const l = mk(new THREE.CylinderGeometry(0.05, 0.04, 0.3, 6), MQ.fur, 'mq-leg'); l.position.set((i % 2 ? 1 : -1) * 0.12, 0.15, i < 2 ? -0.12 : 0.14); g.add(l); legs.push(l); } };
  await __y(); const bathers = [];
  await __y(); SPOOLS.slice(1, 8).forEach((P, i) => { const g = new THREE.Group(); g.name = 'macaque-bathing'; const a = h2(i, 77) * 6.28, r = P.r * 0.55; g.position.set(P.x + Math.cos(a) * r, P.y, P.z + Math.sin(a) * r); g.rotation.y = rnd() * 6;
    const sh = mk(new THREE.SphereGeometry(0.24, 12, 8), MQ.fur, 'mq-shoulders'); sh.scale.set(1.1, 0.7, 0.9); sh.position.y = 0.02; g.add(sh); const hd = mk(new THREE.SphereGeometry(0.16, 12, 10), MQ.fur, 'mq-head'); hd.position.y = 0.26; g.add(hd);
    const fc = mk(new THREE.SphereGeometry(0.1, 10, 8), MQ.face, 'mq-face'); fc.scale.set(1, 0.9, 0.4); fc.position.set(0, 0.24, -0.12); g.add(fc); const cap = mk(new THREE.SphereGeometry(0.08, 8, 6), SC ? std('#f4f4f0') : MQ.fur, 'mq-snowcap'); cap.scale.set(1, 0.4, 1); cap.position.y = 0.4; if (i % 2 === 0) g.add(cap);
    scene.add(g); bathers.push({ g, y0: P.y, ph: rnd() * 6 }); });
  await __y(); spawnIn('macaque', lp ? 3 : 6, () => { const q = inReg(SPRINGS, 0.7, 3); if (!q) return null; for (const P of SPOOLS) if (Math.hypot(q[0] - P.x, q[1] - P.z) < P.r + 1.5) return null; return q; }, buildMacaque, { wanderSpd: 0.8, fleeSpd: 4.5, fleeDist: 6, gait: 9 });
  // red maples, fallen leaves, mossy boulders (deferred)
  await __y(); deferred.push(() => { const N = lp ? 35 : 70, tr = inst(new THREE.CylinderGeometry(0.14, 0.26, 1, 6).translate(0, 0.5, 0), std('#4a3228'), N * 3, 'maple-trunks'), cm = std('#ffffff'); windify(cm, 0.18); const cr = inst(new THREE.IcosahedronGeometry(1, 1), cm, N * 6, 'maple-crowns');
    const MC = ['#c8342a', '#d8502a', '#e0782a', '#b82a3a', '#e89a3a'], TREES = []; let t = 0, c = 0, k = 0;
    const poolClear = (x, z, m) => SPOOLS.every(P => Math.hypot(x - P.x, z - P.z) > P.r + m) && Math.hypot(x - PAV.x, z - PAV.z) > 8;
    for (let i = 0; i < N * 5 && k < N; i++) { const q = inReg(SPRINGS, 0.95, 4); if (!q) continue; const [x, z] = q; if (!poolClear(x, z, 6) || collideAt(x, z, 2.5) || !clearOf(x, z, 3) || steep(x, z)) continue; const y = H(x, z) - 0.15, h = 2.6 + rnd() * 1.8, a = rnd() * 6.28;
      putI(tr, t++, x, y, z, a, 1, h, 1, null, (rnd() - 0.5) * 0.25, 0); for (const sd of [-1, 1]) putI(tr, t++, x, y + h * 0.7, z, a, 0.55, h * 0.7, 0.55, null, 0, sd * 0.8);
      const col = pick(MC); for (let j = 0; j < 6; j++) { const b = rnd() * 6.28, o = j ? 1.4 + rnd() * 1.1 : 0, cs = (j ? 1.4 : 2.1) + rnd() * 0.7; putI(cr, c++, x + Math.cos(b) * o, y + h + 0.7 + rnd() * 0.9 - (j ? 0.5 : 0), z + Math.sin(b) * o, rnd() * 6, cs, cs * 0.55, cs, TC.set(col).offsetHSL((rnd() - 0.5) * 0.03, 0, (rnd() - 0.5) * 0.08)); }
      addSolid(x, z, 0.32); TREES.push([x, z, col]); k++; }
    tr.count = t; cr.count = c; tr.castShadow = !lp; scene.add(tr, cr);
    const NL = lp ? 900 : 2200, lv = inst(new THREE.CircleGeometry(0.09, 5).rotateX(-Math.PI / 2), std('#ffffff', { side: THREE.DoubleSide }), NL, 'maple-leaves'); let q2 = 0;
    for (let i = 0; i < NL && TREES.length; i++) { const [tx, tz, col] = TREES[i % TREES.length], a = rnd() * 6.28, r = Math.sqrt(rnd()) * 4.2, x = tx + Math.cos(a) * r, z = tz + Math.sin(a) * r; if (!poolClear(x, z, 0.5)) continue; putI(lv, q2++, x, hFast(x, z) + 0.03, z, rnd() * 6, 0.8 + rnd() * 0.6, 1, 0.8 + rnd() * 0.6, TC.set(col).offsetHSL(0, 0, (rnd() - 0.5) * 0.1)); }
    lv.count = q2; scene.add(lv);
    const rk = inst(new THREE.DodecahedronGeometry(1, 0), std('#ffffff'), 50, 'spring-rocks'); let r2 = 0;
    for (let i = 0; i < 150 && r2 < 50; i++) { const q = inReg(SPRINGS, 0.9, 3); if (!q || !poolClear(q[0], q[1], 1.5)) continue; const s = 0.5 + rnd() * 1.4; putI(rk, r2++, q[0], hFast(q[0], q[1]) + s * 0.2, q[1], rnd() * 6, s * 1.2, s * 0.7, s, rnd() < 0.5 ? '#6a7a5a' : '#8a8478', rnd(), rnd()); if (s > 1) addSolid(q[0], q[1], s * 0.8); }
    rk.count = r2; scene.add(rk); });

  // ---------- RED-ROCK CANYON ----------
  await __y(); const RRM = std('#ffffff', { roughness: 0.95 }), RCOLS = ['#b0502e', '#c8703a', '#9a4028', '#d8a070', '#b86038'];
  await __y(); const floorY = z => CANYON.base + regRelief(CANYON, canyonX(z), z);
  await __y(); const ARCH = { z: -60 }; await __y(); ARCH.x = canyonX(ARCH.z);
  await __y(); { const tg = new THREE.TorusGeometry(10.5, 2.3, 8, 28, Math.PI), pa = tg.attributes.position; for (let i = 0; i < pa.count; i++) { const f = 1 + (h2(Math.round(pa.getX(i) * 4 + 99), Math.round(pa.getY(i) * 4 + pa.getZ(i) * 9)) - 0.5) * 0.12; pa.setXYZ(i, pa.getX(i) * f, pa.getY(i) * f, pa.getZ(i) * f); } tg.computeVertexNormals();
    colGeo(tg, (c, x, y) => c.set(RCOLS[((Math.floor(y / 2.4) % 5) + 5) % 5]));
    const a = mk(tg, vcM({ roughness: 0.95 }), 'canyon-arch'); a.position.set(ARCH.x, floorY(ARCH.z) - 1.2, ARCH.z); a.castShadow = !lp; a.receiveShadow = !lp; scene.add(a); for (const s of [-1, 1]) addSolid(ARCH.x + s * 10.5, ARCH.z, 2.6);
    const px = canyonX(40) - 42, pz = 40, g2 = new THREE.TorusGeometry(6, 1.6, 8, 22, Math.PI); colGeo(g2, (c, x, y) => c.set(RCOLS[((Math.floor(y / 1.8) % 5) + 5) % 5])); const b = mk(g2, vcM({ roughness: 0.95 }), 'plateau-arch'); b.position.set(px, H(px, pz) - 1, pz); b.rotation.y = 0.6; b.castShadow = !lp; scene.add(b);
    for (const s of [-1, 1]) addSolid(px + Math.cos(0.6) * 6 * s, pz - Math.sin(0.6) * 6 * s, 1.8); }
  // hoodoos, dead snags, boulders, shrubs (deferred)
  await __y(); const snagTops = [];
  await __y(); { const sn = inst(new THREE.CylinderGeometry(0.08, 0.18, 1, 5).translate(0, 0.5, 0), std('#8a7a6a'), 60, 'snag-parts'); let k = 0;
    for (let i = 0; i < 60 && k < 56; i++) { const z = lerp(-340, 110, rnd()), side = rnd() < 0.5 ? -1 : 1, onFloor = rnd() < 0.5, x = canyonX(z) + side * (onFloor ? 3 + rnd() * 2.5 : 22 + rnd() * 50); if (regW(CANYON, x, z) < 0.6 || loopD(x, z) < 3 || collideAt(x, z, 2)) continue; const y = H(x, z) - 0.1, h = 3 + rnd() * 3, lean = (rnd() - 0.5) * 0.3;
      putI(sn, k++, x, y, z, rnd() * 6, 1, h, 1, null, lean, 0); for (let j = 0; j < 3; j++) putI(sn, k++, x, y + h * (0.55 + j * 0.13), z, j * 2.1 + rnd(), 0.5, 1.4 + rnd(), 0.5, null, 0, (j % 2 ? 1 : -1) * (0.8 + rnd() * 0.4)); addSolid(x, z, 0.25); if (snagTops.length < 2 && !onFloor) snagTops.push([x, y + h, z]); }
    sn.count = k; scene.add(sn); }
  await __y(); deferred.push(() => { const n = lp ? 0.6 : 1, hp = inst(new THREE.CylinderGeometry(1, 1, 1, 7), RRM, Math.round(260 * n), 'hoodoo-parts'), hc = inst(new THREE.DodecahedronGeometry(1, 0), std('#5a3a2a'), Math.round(60 * n), 'hoodoo-caps'); let k = 0, c = 0;
    for (let i = 0; i < 300 && c < hc.count; i++) { const z = lerp(-360, 120, rnd()), side = rnd() < 0.5 ? -1 : 1, floor = rnd() < 0.25, x = canyonX(z) + side * (floor ? 5.5 + rnd() * 1.5 : 18 + rnd() * 70); if (regW(CANYON, x, z) < (floor ? 0.5 : 0.7) || loopD(x, z) < 3.5 || sroadD(x, z) < 5 || collideAt(x, z, 2.5) || Math.abs(z - ARCH.z) < 14) continue;
      let y = H(x, z) - 0.3, r = 0.9 + rnd() * 0.9; const segs = 3 + Math.floor(rnd() * 3); for (let j = 0; j < segs && k < hp.count; j++) { const hh = 1.6 + rnd() * 1.4; putI(hp, k++, x + (rnd() - 0.5) * 0.2, y + hh / 2, z + (rnd() - 0.5) * 0.2, rnd() * 6, r, hh, r, RCOLS[(j + i) % 5]); y += hh * 0.92; r *= j % 2 ? 1.08 : 0.72; }
      putI(hc, c++, x, y + 0.2, z, rnd() * 6, r * 1.9, 0.55, r * 1.9, '#5a3a2a'); addSolid(x, z, 1.3); }
    hp.count = k; hc.count = c; hp.castShadow = !lp; scene.add(hp, hc);
    const bo = inst(new THREE.DodecahedronGeometry(1, 1), RRM, Math.round(90 * n), 'canyon-boulders'); let b = 0;
    for (let i = 0; i < 400 && b < bo.count; i++) { const z = lerp(-380, 130, rnd()), x = canyonX(z) + (rnd() - 0.5) * (rnd() < 0.6 ? 11 : 110); if (regW(CANYON, x, z) < 0.5 || loopD(x, z) < 2.5 || sroadD(x, z) < 4 || collideAt(x, z, 1)) continue; const s = 0.4 + rnd() * rnd() * 2.6;
      putI(bo, b++, x, H(x, z) + s * 0.2, z, rnd() * 6, s * 1.2, s * 0.75, s, pick(RCOLS), rnd(), rnd()); if (s > 1) addSolid(x, z, s * 0.9); } bo.count = b; scene.add(bo);
    const sh = inst(new THREE.IcosahedronGeometry(1, 0), std('#ffffff'), Math.round(220 * n), 'canyon-shrubs'); let s2 = 0;
    for (let i = 0; i < 700 && s2 < sh.count; i++) { const z = lerp(-380, 130, rnd()), x = canyonX(z) + (rnd() - 0.5) * 140; if (regW(CANYON, x, z) < 0.45 || !clearOf(x, z, 1.5)) continue; const s = 0.3 + rnd() * 0.5; putI(sh, s2++, x, H(x, z) + s * 0.25, z, rnd() * 6, s, s * 0.7, s, pick(['#8a8a5a', '#9a9468', '#7a7a4e'])); } sh.count = s2; scene.add(sh); });
  // vultures: circling + perched
  await __y(); const vuM = new THREE.MeshBasicMaterial({ color: '#241c18', side: THREE.DoubleSide }), vult = [];
  await __y(); for (let k = 0; k < 4; k++) { const m = mk(vGeo2, vuM, 'vulture'); m.scale.setScalar(3.8); scene.add(m); vult.push({ m, r: 40 + k * 18, h: 45 + k * 10, sp: 0.1 + k * 0.03, ph: k * 1.7, cz: -60 - k * 60 }); }
  await __y(); snagTops.forEach(([x, y, z]) => { const g = new THREE.Group(); g.name = 'vulture-perched'; const b = mk(new THREE.SphereGeometry(0.34, 10, 8), sm2('#3a2a22'), 'vu-body'); b.scale.set(0.9, 1.1, 1.3); g.add(b); const ruff = mk(new THREE.TorusGeometry(0.16, 0.07, 6, 12), sm2('#d8d0c0'), 'vu-ruff'); ruff.rotation.x = Math.PI / 2; ruff.position.set(0, 0.3, -0.2); g.add(ruff);
    const hd = mk(new THREE.SphereGeometry(0.11, 8, 6), sm2('#c87a6a'), 'vu-head'); hd.position.set(0, 0.46, -0.3); g.add(hd); const bk = mk(new THREE.ConeGeometry(0.04, 0.14, 6), sm2('#d8c8a0'), 'vu-beak'); bk.rotation.x = -Math.PI / 2 - 0.5; bk.position.set(0, 0.42, -0.42); g.add(bk); g.position.set(x, y + 0.3, z); g.rotation.y = rnd() * 6; scene.add(g); });
  // canyon lizards
  await __y(); { const lizM = std('#a0583a'), lizD = std('#6a3a24');
    for (let i = 0; i < (lp ? 5 : 10); i++) { const z = lerp(-340, 100, rnd()), x = canyonX(z) + (rnd() - 0.5) * 12; if (loopD(x, z) < 1.5) continue; const g = new THREE.Group(); g.name = 'lizard';
      const body = mk(new THREE.CapsuleGeometry(0.035, 0.14, 3, 6), lizM, 'lizard-body'); body.rotation.x = Math.PI / 2; body.position.y = 0.035; g.add(body); const head = mk(new THREE.SphereGeometry(0.03, 6, 5), lizM, 'lizard-head'); head.scale.set(1, 0.7, 1.4); head.position.set(0, 0.04, -0.12); g.add(head);
      const tail = mk(new THREE.ConeGeometry(0.025, 0.2, 5), lizD, 'lizard-tail'); tail.rotation.x = Math.PI / 2; tail.position.set(0, 0.03, 0.18); g.add(tail); const legs = []; for (let j = 0; j < 4; j++) { const leg = mk(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 3), lizD, 'lizard-leg'); leg.rotation.z = (j % 2 ? 1 : -1) * 1.1; leg.position.set((j % 2 ? 1 : -1) * 0.04, 0.02, j < 2 ? -0.05 : 0.05); g.add(leg); legs.push(leg); }
      g.position.set(x, H(x, z), z); g.rotation.y = rnd() * 6; g.scale.setScalar(1.8); scene.add(g); critters.push({ g, legs, kind: 'lizard', state: 'idle', t: rnd() * 3, phase: rnd() * 6, target: new THREE.Vector3(), hop: false, wanderSpd: 0.9, fleeSpd: 6.5, fleeDist: 3.2, gait: 20 }); } }

  // ---------- Across the foothills: wildflower drifts by season, butterflies ----------
  await __y(); const bfHomes = [];
  await __y(); deferred.push(() => { const SEAS = { spring: ['#f6f2ea', '#f2c6d8', '#c8b8f0', '#f2e27a'], summer: ['#f2cf2e', '#5a8ae0', '#f07a3a', '#ffffff'], autumn: ['#c86a2a', '#b84a8a', '#e0a040', '#8a5ac8'], winter: ['#e8eef4', '#c8d4e0'] }, pal = SEAS[season] || SEAS.summer, N = Math.round((lp ? 1800 : 4200) * (season === 'winter' ? 0.35 : 1));
    const fl = inst(new THREE.IcosahedronGeometry(0.075, 0), std('#ffffff', { roughness: 0.6 }), N, 'meadow-drifts'); let k = 0;
    for (let t = 0; t < 4000 && k < N; t++) { const cx = lerp(WB.x0, WB.x1, rnd()), cz = lerp(ZEND - 230, WB.z0, rnd()); if (coreOut(cx, cz) < 14 || edgeInfo(cx, cz).e < RIM || fbm(cx * 0.01 + 300, cz * 0.01) < 0.55 || regW(TEA, cx, cz) > 0.3 || regW(CANYON, cx, cz) > 0.3 || regW(JUNGLE, cx, cz) > 0.4 || peakR(cx, cz) < 0.62 || steep(cx, cz) || !clearOf(cx, cz, 3)) continue;
      const q = fieldAt(cx, cz); if (q && q.out < 1) continue; const c1 = pick(pal), c2 = pick(pal); if (bfHomes.length < 60 && rnd() < 0.3) bfHomes.push([cx, cz]);
      for (let j = 0; j < 24 && k < N; j++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 3.6, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; putI(fl, k++, x, hFast(x, z) + 0.16 + rnd() * 0.14, z, 0, 1, 0.7, 1, rnd() < 0.7 ? c1 : c2); } }
    fl.count = k; scene.add(fl); });
  await __y(); FIELDS.forEach(f => { if ((f.type === 'mustard' || f.type === 'lavender') && bfHomes.length < 40) bfHomes.push([f.x, f.z]); });
  await __y(); for (let i = 0; i < 8; i++) { const q = inReg(SPRINGS, 0.8, 3); if (q) bfHomes.push(q); const q2 = inReg(TEA, 0.9, 3); if (q2) bfHomes.push(q2); }
  await __y(); for (let i = 0; i < 6; i++) { const [x, z, dx, dz] = bAt(0.35 + i * 0.1); bfHomes.push([x - dz * 7, z + dx * 7]); }
  await __y(); const BFN = lp ? 36 : 80, bfW = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.13, 0.1).translate(0.065, 0, 0).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide }), BFN * 2); await __y(); bfW.name = 'butterflies'; await __y(); bfW.frustumCulled = false; await __y(); scene.add(bfW);
  await __y(); const bfd = Array.from({ length: BFN }, (_, i) => { const h = bfHomes[i % Math.max(1, bfHomes.length)] || [FARM.x, FARM.z], c = pick(['#f2b030', '#f2f0e8', '#5a9ae8', '#e86a2a', '#f2d84a', '#b87ae0']); bfW.setColorAt(i * 2, TC.set(c)); bfW.setColorAt(i * 2 + 1, TC.set(c)); return { x: h[0] + (rnd() - 0.5) * 6, z: h[1] + (rnd() - 0.5) * 6, ph: rnd() * 10, sp: 0.6 + rnd() * 0.6 }; });

  // ---------- tick ----------
  await __y(); const zSeen = new Set(); await __y(); let chaiT = 0, soakT = 0; await __y(); const BIGP = SPOOLS.reduce((a, b) => (b.r > a.r ? b : a));
  function v6Tick(dt, T, bp, night) { const cp = camera.position, near = (x, z, r) => Math.abs(cp.x - x) + Math.abs(cp.z - z) < r;
    for (const Hd of herds) { Hd.x = Hd.cx + Math.cos(T * 0.012 + Hd.ph) * Hd.rx * 0.6; Hd.z = Hd.cz + Math.sin(T * 0.009 + Hd.ph * 1.3) * Hd.rz * 0.6; }
    if (near(MILL.x, MILL.z, 500)) sails.rotation.z -= dt * (0.35 + 0.25 * windAmtU.value);
    for (const s of smokes) { const on = near(s.x, s.z, 450); s.s.visible = on; if (!on) continue; const t = (T * 0.18 + s.ph) % 1; s.s.position.set(s.x + t * 2.5 * wdx, s.y + t * 7, s.z + t * 2.5 * wdz); s.s.scale.setScalar(0.8 + t * 3.2); s.s.material.opacity = 0.32 * Math.sin(t * Math.PI); }
    const spNear = near(SPRINGS.x, SPRINGS.z, 420); for (const s of steams) { s.s.visible = spNear; if (!spNear) continue; const t = (T * 0.22 + s.ph) % 1; s.s.position.set(s.P.x + s.ox + t * wdx * 1.5, s.P.y + 0.3 + t * 3.2, s.P.z + s.oz + t * wdz * 1.5); s.s.scale.setScalar(1.5 + t * 3); s.s.material.opacity = 0.22 * Math.sin(t * Math.PI) * (0.6 + 0.4 * (1 - WX.oc * 0.5)); }
    if (spNear) for (const b of bathers) { b.g.position.y = b.y0 + Math.sin(T * 0.9 + b.ph) * 0.03; b.g.rotation.y += Math.sin(T * 0.3 + b.ph) * dt * 0.2; }
    { const on = near(FARM.x, FARM.z, 700); crows.visible = on; if (on) { const cx = FARM.x + Math.cos(T * 0.03) * 90, cz = FARM.z + Math.sin(T * 0.025) * 80; crowSc += ((Math.hypot(bp.x - cx, bp.z - cz) < 45 ? 1 : 0) - crowSc) * 0.05;
      crd.forEach((b, i) => { const t2 = T * b.sp + b.ph, rr = b.r * (1 + crowSc * 1.6); dummy.position.set(cx + Math.cos(t2 + b.a) * rr, H(cx, cz) + b.h + crowSc * 10 + Math.sin(t2 * 1.4) * 2, cz + Math.sin(t2 + b.a) * rr * 0.8); dummy.rotation.set(0, -(t2 + b.a) + Math.PI, 0.25); dummy.scale.set(0.8, 0.3 + 0.7 * Math.abs(Math.sin(T * 11 + b.ph)), 0.8); dummy.updateMatrix(); crows.setMatrixAt(i, dummy.matrix); }); crows.instanceMatrix.needsUpdate = true;
      if (frameNo % 20 === 0 && Math.hypot(bp.x - cx, bp.z - cz) < 60 && curSpeed < 8) spot5('crow'); } }
    { const on = near(TEA.x, TEA.z, 650); hbFly.forEach(h => { h.g.visible = on; if (!on) return; const t2 = T * h.sp + h.ph; h.g.position.set(TEA.x + Math.cos(t2) * h.r, TEA.base + 28 + Math.sin(t2 * 2) * 5, TEA.z + Math.sin(t2) * h.r * 0.6); h.g.rotation.y = -t2 + Math.PI; h.g.userData.wings.forEach((w, s) => { w.rotation.z = (s ? -1 : 1) * Math.sin(T * 3 + h.ph) * 0.55; }); });
      if (on) hbPerch.forEach((h, i) => { h.g.rotation.y += Math.sin(T * 0.4 + i) * dt * 0.3; });
      if (on && frameNo % 20 === 0 && curSpeed < 6 && hbPerch.concat(hbFly).some(h => Math.hypot(h.g.position.x - bp.x, h.g.position.z - bp.z) < 30)) spot5('hornbill'); }
    { const on = near(CANYON.x, CANYON.z, 800); vult.forEach(v => { v.m.visible = on; if (!on) return; const t2 = T * v.sp + v.ph; v.m.position.set(canyonX(v.cz) + Math.cos(t2) * v.r, CANYON.base + v.h + Math.sin(T * 0.25 + v.ph) * 5, v.cz + Math.sin(t2) * v.r); v.m.rotation.set(0, -t2 + Math.PI, 0.3); });
      if (on && frameNo % 20 === 0 && curSpeed < 7 && (vult.some(v => Math.hypot(v.m.position.x - bp.x, v.m.position.z - bp.z) < 80) || snagTops.some(s => Math.hypot(s[0] - bp.x, s[2] - bp.z) < 20))) spot5('vulture'); }
    { let any = false; const day = night < 0.5; for (let i = 0; i < BFN; i++) { const b = bfd[i]; if (!day || Math.abs(b.x - cp.x) + Math.abs(b.z - cp.z) > 120) { hideI(bfW, i * 2); hideI(bfW, i * 2 + 1); continue; } any = true; const t2 = T * b.sp + b.ph;
        const x = b.x + Math.sin(t2 * 0.7) * 3 + Math.sin(t2 * 1.9) * 0.8, z = b.z + Math.cos(t2 * 0.6) * 3 + Math.cos(t2 * 2.3) * 0.8, y = hFast(x, z) + 0.7 + Math.sin(t2 * 2.6) * 0.35, yaw = -t2 * 0.7, fl = Math.sin(T * 17 + b.ph) * 1.1;
        for (let w = 0; w < 2; w++) { dummy.position.set(x, y, z); dummy.rotation.set(0, yaw, w ? -fl : fl); dummy.scale.set(w ? -1 : 1, 1, 1); dummy.updateMatrix(); bfW.setMatrixAt(i * 2 + w, dummy.matrix); }
        if (frameNo % 20 === 0 && curSpeed < 5 && Math.hypot(x - bp.x, z - bp.z) < 5) spot5('butterfly'); }
      dummy.scale.set(1, 1, 1); if (any || frameNo % 30 === 0) bfW.instanceMatrix.needsUpdate = true; }
    if (frameNo % 10 === 0) { for (const R of [FARM, TEA, SPRINGS, CANYON]) if (regW(R, bp.x, bp.z) > 0.6) zSeen.add(R.id); if (zSeen.size >= 4) stamp('loop'); }
    if (CROP && Math.hypot(bp.x - CROP.x, bp.z - CROP.z) < 3) stamp('crop');
    if (Math.hypot(bp.x - STALL.x, bp.z - STALL.z) < 6 && curSpeed < 0.8) { chaiT += dt; if (chaiT > 2.5) stamp('chai'); } else chaiT = 0;
    if (Math.hypot(bp.x - BIGP.x, bp.z - BIGP.z) < BIGP.r && curSpeed < 1.5) { soakT += dt; if (soakT > 2) stamp('soak'); } else soakT = 0;
    if (Math.abs(bp.z - ARCH.z) < 2.5 && Math.abs(bp.x - ARCH.x) < 7) stamp('arch'); }

  function v5Tick(dt, T, bp, night) { const cp = camera.position; v6Tick(dt, T, bp, night);
    { const a = sstep(0.55, 0.9, night) * (1 - Math.min(1, WX.oc)) * lerp(0.3, 1, REG.w.snow || 0); auroraU.amt.value += (a - auroraU.amt.value) * Math.min(1, dt * 0.5); aur.visible = auroraU.amt.value > 0.01;
      if (aur.visible) aur.position.set(cp.x, Math.max(cp.y, 0) + 170, cp.z + 560); if (auroraU.amt.value > 0.45 && peakR(bp.x, bp.z) < 0.55) stamp('aurora'); }
    const nearPk = Math.abs(cp.x - PEAK.x) + Math.abs(cp.z - PEAK.z) < 900;
    eag.forEach(e => { e.m.visible = nearPk; if (!nearPk) return; const t2 = T * e.sp + e.ph; e.m.position.set(SUM.x + Math.cos(t2) * e.r, SUM.y + e.h + Math.sin(T * 0.3 + e.ph) * 5, SUM.z + Math.sin(t2) * e.r); e.m.rotation.set(0, -t2 + Math.PI, 0.35); e.m.scale.set(3.2, 3.2 * (0.75 + 0.25 * Math.abs(Math.sin(T * 1.4 + e.ph))), 3.2); });
    if (nearPk && frameNo % 20 === 0 && curSpeed < 6 && eag.some(e => Math.hypot(e.m.position.x - bp.x, e.m.position.z - bp.z) < 90)) spot5('eagle');
    for (const s of snowmen) { if (!s.hit) { if (Math.abs(bp.x - s.x) + Math.abs(bp.z - s.z) < 3 && Math.hypot(bp.x - s.x, bp.z - s.z) < 1.5 && curSpeed > 1.5) { s.hit = true; s.t = 0; s.g.rotation.y = Math.atan2(s.x - bp.x, s.z - bp.z); stamp('snowman'); } continue; }
      s.t += dt; s.body.rotation.x = sstep(0, 0.55, s.t) * 1.42; s.head.position.set(0, lerp(s.hy, 0.3 * s.s, sstep(0.15, 0.8, s.t)), lerp(0, 2.6 * s.s, sstep(0.15, 1.3, s.t))); s.head.rotation.x = s.t * 5 * (1 - sstep(0.9, 1.5, s.t));
      if (s.t > 30 && Math.hypot(bp.x - s.x, bp.z - s.z) > 40) { s.hit = false; s.body.rotation.x = 0; s.head.position.set(0, s.hy, 0); s.head.rotation.x = 0; } }
    { const ox = bp.x - CAVE.x, oz = bp.z - CAVE.z, a = ox * CD.x + oz * CD.z, b = ox * CP.x + oz * CP.z; if (a > 2 && a < CLEN && Math.abs(b) < CR) stamp('cave');
      if (night < 0.3) yetiGone = 0; const dY = Math.hypot(bp.x - yeti.position.x, bp.z - yeti.position.z); yeti.visible = night > 0.55 && yetiGone < 1 && dY < 300;
      if (yeti.visible) { if (dY < 9) { yetiT += dt; stamp('yeti'); } yetiArm.rotation.z = yetiT > 0 ? 2.5 + Math.sin(T * 9) * 0.35 : 0.25; if (yetiT > 3) { yetiGone = 1; yetiT = 0; } } }
    if (Math.abs(bp.x - SUM.x) + Math.abs(bp.z - SUM.z) < 14 && Math.hypot(bp.x - SUM.x, bp.z - SUM.z) < 10) stamp('summit');
    if (Math.abs(iceSpin) > 6.3) { stamp('spin'); iceSpin = 0; }
    if (bp.x > BSR.bx0 && bp.x < BSR.bx1 && bp.z > BSR.bz0 && bp.z < BSR.bz1) { const q = roadQ(BSR, bp.x, bp.z);
      if (q.d < 3.6) { if (gateNext < GRUN.length && gateLastU >= 0 && gateLastU <= GRUN[gateNext] && q.u > GRUN[gateNext]) { if (gateNext === 0) gateT0 = T; gateNext++; if (gateNext === GRUN.length) { if (T - gateT0 < 30) stamp('gates'); gateNext = 0; } }
        if (q.u < GRUN[0] - 0.03 || (gateNext > 0 && T - gateT0 > 30)) gateNext = 0; gateLastU = q.u; } else if (q.d > 10) { gateNext = 0; gateLastU = -1; } } }

  function v4Tick(dt, T, bp, night) { const cp = camera.position, fast = !lp || frameNo % 2 === 0;
    tileTick(cp); v5Tick(dt, T, bp, night);
    if (frameNo % 30 === 0) updShafts();
    shaftU.op.value = clamp((SUN.y - 0.08) * 2.5, 0, 1) * (1 - night) * (1 - Math.min(1, WX.oc) * 0.8) * (1 - WX.mist * 0.5) * 0.55;
    shroomMat.emissiveIntensity = 0.15 + night * 1.8;
    mists.forEach(m => m.s.scale.setScalar(m.b * (1 + Math.sin(T * 1.7 + m.ph) * 0.12)));
    for (const p of peacocks) { const u = p.g.userData; if (u.far) continue; const want = p.state === 'idle' && Math.sin(T * 0.22 + p.phase * 3) > 0.35 ? 1 : 0; if (Math.abs(want - u.fanA) > 0.002) { u.fanA += (want - u.fanA) * Math.min(1, dt * 1.6); setFan(p.g, u.fanA); } }
    if (fast) { let idx = 0; FLK.forEach((f, fi) => { const R = f.R, far = Math.hypot(cp.x - R.x, cp.z - R.z) > 650, ang = T * 0.05 + fi * 2, cx = R.x + Math.cos(ang) * R.sx * 0.45 + Math.sin(T * 0.11 + fi) * 30, cz = R.z + Math.sin(ang * 1.3) * R.sz * 0.4, cy = R.base + 38 + Math.sin(T * 0.2 + fi) * 8;
        f.sc += ((Math.hypot(bp.x - cx, bp.z - cz) < 60 ? 1 : 0) - f.sc) * 0.05;
        for (let i = 0; i < f.n; i++, idx++) { if (far) { hideI(flockV4, idx); continue; } const b = fbd[idx], t2 = T * b.sp + b.ph, rr = b.r * (1 + f.sc * 1.8) * (0.7 + 0.3 * Math.sin(T * 0.3 + b.a));
          dummy.position.set(cx + Math.cos(t2 + b.a) * rr + Math.sin(T * 0.7 + b.b) * 3, cy + Math.sin(t2 * 1.3 + b.b) * rr * 0.35, cz + Math.sin(t2 + b.a) * rr * 0.7); dummy.rotation.set(0, -(t2 + b.a) + Math.PI, Math.sin(T * 12 + b.ph) * 0.25); dummy.scale.set(0.9, 0.35 + 0.65 * Math.abs(Math.sin(T * 13 + b.ph)), 0.9); dummy.updateMatrix(); flockV4.setMatrixAt(idx, dummy.matrix); } });
      flockV4.instanceMatrix.needsUpdate = true; }
    if (fast) { for (let i = 0; i < FSN; i++) { const f = fsd[i], S = f.S; if (Math.abs(S.x - cp.x) + Math.abs(S.z - cp.z) > 200) { hideI(fish, i); continue; } const a = f.a + T * f.w, cx = S.x + Math.sin(T * 0.1 + f.ph * 0.2) * S.r * 0.5, cz = S.z + Math.cos(T * 0.08) * S.r * 0.4;
        dummy.position.set(cx + Math.cos(a) * f.r, S.y - f.d, cz + Math.sin(a) * f.r); dummy.rotation.set(0, (f.w > 0 ? Math.PI - a : -a) + Math.sin(T * 8 + f.ph) * 0.15, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); fish.setMatrixAt(i, dummy.matrix); } fish.instanceMatrix.needsUpdate = true; }
    for (let i = 0; i < DFN; i++) { const d = dfd[i]; if (Math.abs(d.p.x - cp.x) + Math.abs(d.p.z - cp.z) > 200 || night > 0.7) { hideI(dfBody, i); hideI(dfWing, i * 2); hideI(dfWing, i * 2 + 1); continue; }
      d.t -= dt; if (d.t <= 0) { d.t = 0.8 + Math.random() * 2; d.tg.set(d.h.x + (Math.random() - 0.5) * 7, d.h.y + 0.4 + Math.random() * 1.1, d.h.z + (Math.random() - 0.5) * 7); }
      const dx = d.tg.x - d.p.x, dz = d.tg.z - d.p.z; d.p.lerp(d.tg, Math.min(1, dt * 3.5)); if (Math.hypot(dx, dz) > 0.05) d.yaw = Math.atan2(-dx, -dz);
      dummy.rotation.set(0, d.yaw, 0); dummy.position.copy(d.p); dummy.position.y += Math.sin(T * 9 + i) * 0.03; dummy.scale.set(1, 1, 1); dummy.updateMatrix(); dfBody.setMatrixAt(i, dummy.matrix);
      for (let w = 0; w < 2; w++) { dummy.rotation.set(0, d.yaw, Math.sin(T * 60 + i + w) * 0.3); dummy.position.copy(d.p); dummy.translateZ(w ? 0.03 : -0.02); dummy.updateMatrix(); dfWing.setMatrixAt(i * 2 + w, dummy.matrix); } }
    dfBody.instanceMatrix.needsUpdate = dfWing.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < BEEN; i++) { const b = beeH[i]; if (night > 0.5 || Math.abs(b.x - cp.x) + Math.abs(b.z - cp.z) > 90) { hideI(bees, i); continue; } const t2 = T * 1.6 + b.ph;
      dummy.position.set(b.x + Math.sin(t2 * 1.9) * 0.9 + Math.sin(T * 7 + b.ph) * 0.08, b.y + Math.sin(t2 * 3.1) * 0.25, b.z + Math.sin(t2 * 1.3 + 1) * 0.9); dummy.rotation.set(0, t2 * 1.9, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); bees.setMatrixAt(i, dummy.matrix); }
    bees.instanceMatrix.needsUpdate = true;
    const batOn = night > 0.45; for (let i = 0; i < BATN; i++) { const b = batH[i]; if (!batOn || Math.abs(b.x - cp.x) + Math.abs(b.z - cp.z) > 320) { hideI(bats, i); continue; } const t2 = T * b.sp + b.ph;
      dummy.position.set(b.x + Math.cos(t2) * b.r + Math.sin(T * 2.7 + b.ph) * 1.5, b.y + Math.sin(T * 1.9 + b.ph) * 2, b.z + Math.sin(t2 * 1.3) * b.r); dummy.rotation.set(0, -t2 + Math.PI, Math.sin(T * 5 + b.ph) * 0.4); dummy.scale.set(0.55, 0.25 + 0.6 * Math.abs(Math.sin(T * 18 + b.ph)), 0.55); dummy.updateMatrix(); bats.setMatrixAt(i, dummy.matrix); }
    bats.instanceMatrix.needsUpdate = true;
    { const wbl = Math.max(regW(BLOSSOM, cp.x, cp.z), petalW(cp.x, cp.z)); petals.visible = wbl > 0.05; if (petals.visible) { const rs = i => { petA[i * 3] = cp.x + (Math.random() - 0.5) * 50; petA[i * 3 + 1] = cp.y + 2 + Math.random() * 12; petA[i * 3 + 2] = cp.z + (Math.random() - 0.5) * 50; };
      if (!petInit) { petInit = true; for (let i = 0; i < PN; i++) rs(i); }
      for (let i = 0; i < PN; i++) { const o = i * 3; petA[o + 1] -= dt * (0.5 + (i % 5) * 0.12); petA[o] += dt * (wdx * 1.2 + Math.sin(T * 1.3 + i) * 0.6); petA[o + 2] += dt * (wdz * 1.2 + Math.cos(T * 1.1 + i) * 0.6);
        if (petA[o + 1] < hFast(petA[o], petA[o + 2]) || Math.abs(petA[o] - cp.x) > 30 || Math.abs(petA[o + 2] - cp.z) > 30) rs(i); }
      petG.attributes.position.needsUpdate = true; petals.material.opacity = 0.9 * Math.min(1, wbl * 1.5); } }
    if (frameNo % 20 === 0 && curSpeed < 6 && opts.onSpot) { const hit = k => { if (!SPOTTED.has(k)) { SPOTTED.add(k); opts.onSpot(k); } }, near = (x, z, r) => Math.hypot(x - bp.x, z - bp.z) < r;
      if (night <= 0.7 && dfd.some(d => near(d.p.x, d.p.z, 6))) hit('dragonfly');
      if (night <= 0.5 && beeH.some(b => near(b.x, b.z, 5))) hit('bee');
      if (batOn && batH.some(b => near(b.x, b.z, 16))) hit('bat'); } }

  // Adaptive quality tiers
  await __y(); const maxTier = lp ? 2 : 3; await __y(); let tier = opts.mobile ? 0 : (lp ? 1 : 3), frameNo = 0, drawDist = 1, paused = false, forceLow = lp && !opts.mobile; await __y(); const perf = { acc: 0, n: 0, prev: 0, cool: 0, good: 0 };
  // Phones: keep the pixel ratio at or above 1 (below that the low-poly world goes soft); pay for it with shadows + draw distance instead.
  await __y(); const TIERS = opts.mobile ? [{ pr: 1.25, sh: false, dd: 0.55 }, { pr: 1.5, sh: false, dd: 0.7 }, { pr: 1.75, sh: false, dd: 0.85 }, { pr: 2, sh: true, dd: 1 }] : [{ pr: 0.6, sh: false, dd: 0.6 }, { pr: 0.85, sh: false, dd: 0.8 }, { pr: 1.25, sh: true, dd: 1 }, { pr: 1.75, sh: true, dd: 1 }];
  await __y(); const PERF_DOWN = opts.mobile ? 30 : 21, PERF_UP = opts.mobile ? 19 : 17.5;
  await __y(); renderer.shadowMap.autoUpdate = false;
  await __y(); const setTier = k => { tier = k; const c = TIERS[k]; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, c.pr)); renderer.setSize(host.clientWidth, host.clientHeight); resizePost(); if (key.castShadow !== c.sh) key.castShadow = c.sh; renderer.shadowMap.needsUpdate = true; drawDist = c.dd; document.documentElement.classList.toggle('lite', mobile || k <= 1); awStreaks.visible = k > 0; opts.onTier && opts.onTier(k); };
  await __y(); setTier(tier);
  await __y(); const toNDC = e => { const r = canvas.getBoundingClientRect(); mouse.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
  await __y(); const hitNote = () => { ray.setFromCamera(mouse, camera); const h = ray.intersectObjects(notes.map(n => n.hit)); return h.length ? h[0].object.userData.note : -1; };
  await __y(); const hitDino = () => { ray.setFromCamera(mouse, camera); return ray.intersectObject(dinoHit, true).length > 0; };
  await __y(); const startFlee = () => { const dx = dino.position.x - lastBX, dz = dino.position.z - lastBZ, d = Math.hypot(dx, dz) || 1, away = 3 + Math.random() * 3;
    dinoTarget.set(dino.position.x + dx / d * away, 0, dino.position.z + dz / d * away); dinoFleeT = 4.5 + Math.random() * 2.5; };
  await __y(); const clickDino = () => { dinoReactT = 0.5; if (dinoState === 'roam') { dinoSeekLake = false; dinoSeekBike = false; dinoLingerT = 0; opts.onDino && opts.onDino('flee'); startFlee(); } else { opts.onDino && opts.onDino('poke'); } };
  await __y(); const onDown = e => { down = { x: e.clientX, y: e.clientY, yo: yawOff, po: pitchOff, t: performance.now(), drag: false, pad: mobile && free && e.clientY > host.clientHeight * 0.5 && e.clientX < host.clientWidth * 0.55 }; };
  await __y(); const onMove = e => { toNDC(e); if (e.pointerType !== 'touch') lastMouse = performance.now();
    if (down) { const dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.hypot(dx, dy) > 6) down.drag = true;
      if (down.drag && down.pad) { const R = 70; let ddx = dx, ddy = dy; const d = Math.hypot(ddx, ddy); if (d > R) { ddx = ddx / d * R; ddy = ddy / d * R; } stickX = clamp(ddx / R, -1, 1); stickY = clamp(-ddy / R, -1, 1); }
      else if (down.drag) { yawOff = down.yo - dx * 0.006; pitchOff = clamp(down.po + dy * 0.004, -0.3, 0.9); lastPan = performance.now(); } }
    const now = performance.now();
    if (e.target === canvas && now - lastRip > 90) { lastRip = now; const wp = waterHit(); if (wp) wU.rip.value[ripI++ % 8].set(wp.x, wp.z, wU.time.value); hover = hitNote(); canvas.style.cursor = hover >= 0 ? 'pointer' : fireHit() ? 'pointer' : hitDino() ? 'pointer' : down && down.drag ? 'grabbing' : 'grab'; } };
  await __y(); const onUp = e => { if (down && down.pad) { stickX = 0; stickY = 0; }
    if (down && !down.drag && e.target === canvas && performance.now() - down.t < 500) { toNDC(e); const n = hitNote(); if (n >= 0) opts.onNote && opts.onNote(n, e.clientX, e.clientY); else if (hitDino()) clickDino(); else { const wp = waterHit(); if (wp) for (let k = 0; k < 3; k++) wU.rip.value[ripI++ % 8].set(wp.x + k * 0.01, wp.z, wU.time.value + k * 0.35); } } down = null; };
  await __y(); const KM = { arrowleft: 'l', a: 'l', arrowright: 'r', d: 'r', arrowup: 'u', w: 'u', arrowdown: 'b', s: 'b', ' ': 'jump', shift: 'boost' };
  await __y(); const onKey = e => { if (e.target && /input|textarea|select/i.test(e.target.tagName)) return; const m = KM[(e.key || '').toLowerCase()]; if (!m) return; if (!free && (m === 'u' || m === 'b' || m === 'jump')) return; keys[m] = e.type === 'keydown'; e.preventDefault(); };
  await __y(); canvas.addEventListener('pointerdown', onDown); await __y(); window.addEventListener('pointermove', onMove); await __y(); window.addEventListener('pointerup', onUp); await __y(); window.addEventListener('keydown', onKey); await __y(); window.addEventListener('keyup', onKey);
  await __y(); const onResize = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h); resizePost(); camera.aspect = w / h; camera.fov = w < h ? 64 : 52; camera.updateProjectionMatrix(); };
  await __y(); window.addEventListener('resize', onResize); await __y(); onResize();
  await __y(); if (typeof ResizeObserver !== 'undefined') { const ro = new ResizeObserver(onResize); ro.observe(host); }

  // Camera config per stop: orbit angle, look shift, lift
  await __y(); const CAM = [[0, 0, 0], [0.6, 1, 0], [0.6, 1, 0], [0.6, 1, 0], [0.6, 1, 0], [0.15, 0, 1.8], [0.6, 1, 0], [0.6, 1, 0], [1.25, 1, 1.4], [0.5, 0.15, -0.5]];
  await __y(); const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  await __y(); let lastArrive = -1, fireBoost = 0, starT = -1, camRoll = 0, slip = 0, jumpHeld = false, lastGY = null, vyPrev = 0, boostAmt = 0, wheelie = 0, surf = 0, freePitch = 0;
  await __y(); let introArmed = !opts.holdIntro, introStart = null, prevZ = zAt(0), last = performance.now(), running = true, raf = 0, readySent = false, lean = 0;
  await __y(); const clock0 = performance.now();

  // v7: shader warm-up. Every distinct material variant in the scene is compiled up front with compileAsync (parallel, off the
  // main thread) and the first frame waits for it. Details that matter:
  //  - the scene is drawn into postRT, and three.js builds different programs for a render target than for the canvas, so the
  //    compile calls run with postRT (or BL.a for the bloom passes) selected;
  //  - one representative object per variant (material + instancing + vertex colours + shadow flags) is compiled, through a small
  //    stand-in scene that carries the real lights and fog, so a call does not have to walk all ~6,000 objects;
  //  - proxies share the real geometry and material but are never added to the scene, and only a few milliseconds of work run per frame.
  await __y(); let warm = 0, warmT0 = 0, warmJobs = [], warmProxies = null; await __y(); const warmSeen = new Set(), warmScene = new THREE.Scene();
  await __y(); const warmKey = o => { const m = o.material; return (Array.isArray(m) ? m.map(x => x.uuid).join() : m.uuid) + '|' + (o.isInstancedMesh ? 'i' + (o.instanceColor ? 'c' : '') : '') + (o.isPoints ? 'p' : o.isLine ? 'l' : o.isSprite ? 's' : '') + (o.geometry && o.geometry.attributes.color ? 'v' : '') + (o.receiveShadow ? 'r' : '') + (o.castShadow ? 'a' : ''); };
  await __y(); const warmCollect = () => { const seen = warmSeen, out = [], L = [];
    scene.traverse(o => { if (o.isLight) { if (o.visible) L.push(o); return; } if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite) || !o.material) return; const k = warmKey(o); if (seen.has(k)) return; seen.add(k); out.push(o); });
    warmScene.children = L; warmScene.fog = scene.fog; warmScene.environment = scene.environment;
    return out.map(o => { let p;
      if (o.isInstancedMesh) { p = new THREE.InstancedMesh(o.geometry, o.material, 1); if (o.instanceColor) p.setColorAt(0, new THREE.Color()); }
      else if (o.isPoints) p = new THREE.Points(o.geometry, o.material); else if (o.isLine) p = new THREE.Line(o.geometry, o.material); else if (o.isSprite) p = new THREE.Sprite(o.material); else p = new THREE.Mesh(o.geometry, o.material);
      p.receiveShadow = o.receiveShadow; p.castShadow = o.castShadow; p.frustumCulled = false; return p; }); };
  await __y(); const warmRun = (list, jobs, budget) => { const t0 = performance.now(); renderer.setRenderTarget(postRT);
    while (list.length && performance.now() - t0 < budget) { try { jobs.push(renderer.compileAsync(list.pop(), camera, warmScene)); } catch (err) { /* skip */ } }
    renderer.setRenderTarget(null); };
  await __y(); const warmFinish = () => { if (warm < 2) { warm = 2; warmProxies = null; opts.onWarm && opts.onWarm(performance.now() - warmT0); } };
  await __y(); const warmStep = () => { // once per frame while warming
    if (!warmProxies) { warmProxies = warmCollect();
      renderer.setRenderTarget(BL.a); fsq.material = brightMat; warmJobs.push(renderer.compileAsync(fsScene, postCamB)); fsq.material = blurMat; warmJobs.push(renderer.compileAsync(fsScene, postCamB));
      renderer.setRenderTarget(null); warmJobs.push(renderer.compileAsync(postScene, postCam)); return; }
    warmRun(warmProxies, warmJobs, 10);
    if (!warmProxies.length) Promise.all(warmJobs).then(warmFinish, warmFinish);
  };
  // Without KHR_parallel_shader_compile (software GL, a few old drivers) compiling up front would just block the main thread for longer, so leave it lazy.
  await __y(); const canWarm = () => { try { return renderer.extensions.has('KHR_parallel_shader_compile'); } catch (err) { return false; } };
  await __y(); const beginWarm = () => { warm = 1; warmT0 = performance.now(); try { mergeStatic(); } catch (err) { console.warn(err); } if (!canWarm()) { warmFinish(); return; } setTimeout(warmFinish, 12000); };
  // After each deferred build step, compile the new materials in the background, a few at a time, without holding the frame.
  await __y(); const warmMore = () => { try { if (!canWarm()) return; const ps = warmCollect(), jobs = []; const step = () => { warmRun(ps, jobs, 4); if (ps.length) setTimeout(step, 24); }; step(); } catch (err) { /* ignore */ } };

  // v7: distance culling for small props and animals. Only direct children of the scene, only if they are small, use fog,
  // contain no lights and no custom shaders. "Hidden" is a separate flag so the world's own show/hide logic is untouched.
  await __y(); const cullList = [], cullQ = [], cullSeen = new WeakSet(), cullBox = new THREE.Box3(), cullSph = new THREE.Sphere();
  await __y(); const CULL_SKIP = /^(sky|cloud|star|sun|moon|flare|wind|water|road|terrain|far-|aurora|rain|snow|dust|petal|leaf|fog|spark|fire|glow|ground|bike|rider|dino|muja|wheel|wisp|note|hit)/i;
  await __y(); const vAcc = o => { if (o._apAcc) return; o._apAcc = true; let v = o.visible; Object.defineProperty(o, 'visible', { get() { return v && !this._apHide; }, set(x) { v = x; }, configurable: true }); };
  await __y(); const cullEligible = o => {
    if (!(o.isMesh || o.isGroup || o.isSprite || o.type === 'Object3D') || o.isInstancedMesh || o.userData.chunked || o.frustumCulled === false || CULL_SKIP.test(o.name || '')) return false;
    let ok = true;
    o.traverse(c => { if (!ok) return; if (c.isLight || c.isPoints || c.isLine || c.isSkinnedMesh) { ok = false; return; }
      if (c.material) (Array.isArray(c.material) ? c.material : [c.material]).forEach(m => { if (m.isShaderMaterial || m.fog === false || m.isPointsMaterial || m.isSpriteMaterial) ok = false; }); });
    return ok;
  };
  await __y(); const cullScan = () => { for (const o of scene.children) if (!cullSeen.has(o)) { cullSeen.add(o); cullQ.push(o); } };
  await __y(); const cullStep = n => { // measure a few new candidates per frame so the cost is spread out
    while (n-- > 0 && cullQ.length) { const o = cullQ.pop(); if (!cullEligible(o)) continue;
      cullBox.setFromObject(o); if (cullBox.isEmpty()) continue; cullBox.getBoundingSphere(cullSph);
      const r = cullSph.radius + cullSph.center.distanceTo(o.position); if (r > 70) continue;
      vAcc(o); cullList.push({ o, r }); } };
  await __y(); const updateRoots = () => { const ch = scene.children; for (let i = 0; i < ch.length; i++) { const o = ch[i]; if (o._apHide || o.userData.apStatic) continue; o.updateMatrixWorld(); } };
  await __y(); const cullPass = () => {
    const cp = camera.position, lim = scene.fog.far + 20, PX = lp ? 3 : 1.4, F = (renderer.domElement.height / 2) / Math.tan(camera.fov * Math.PI / 360);
    for (let i = 0; i < cullList.length; i++) { const c = cullList[i], o = c.o, p = o.position, dx = p.x - cp.x, dy = p.y - cp.y, dz = p.z - cp.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz) - c.r;
      const lim2 = Math.min(lim, c.r * F / PX + 30);   // beyond this the object is under about a pixel, or fully fogged
      if (o._apHide) { if (d < lim2 * 0.9) { o._apHide = false; o.updateMatrixWorld(true); } } else if (d > lim2) o._apHide = true; } };

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!running || paused) { perf.prev = 0; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now; const T = (now - clock0) / 1000;
    frameNo++; const fi = perf.prev ? now - perf.prev : 16; perf.prev = now;
    if (fi < 200) { perf.acc += fi; perf.n++; }
    if (perf.n >= 60) { const ms = perf.acc / perf.n; perf.acc = 0; perf.n = 0;
      if (now - perf.cool > 2500) { if (ms > PERF_DOWN && tier > 0) { setTier(tier - 1); perf.cool = now; perf.good = 0; } else if (ms < PERF_UP) { if (++perf.good >= (opts.mobile ? 3 : 5) && tier < (forceLow ? 0 : maxTier)) { setTier(tier + 1); perf.cool = now; perf.good = 0; } } else perf.good = 0; } }
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
      const thr = clamp((keys.u || touch.u ? 1 : 0) - (keys.b || touch.b ? 1 : 0) + stickY, -1, 1), boost = keys.boost && thr > 0 ? 1 : 0; boostAmt += (boost - boostAmt) * (1 - Math.exp(-dt * 4));
      const onRoad = roadDist(fx, fz) < roadW(fz) + 0.3, sandy = (zBand(fz, COAST.zHi, COAST.zLo, 1) > 0.5 && fx < coastX(fz) + 30) || Math.hypot(fx - DESERT.x, fz - DESERT.z) < DESERT.r * 1.2;
      surf = onRoad ? 0 : sandy ? 2 : 1;
      const onIce = FLAKE.y !== null && Math.hypot(fx - FLAKE.x, fz - FLAKE.z) < FLAKE.r - 0.4; iceOn = onIce;
      const grip = onIce ? 0.5 : onRoad ? 9 : sandy ? 2.4 : 4.2, drag = onIce ? 0.12 : onRoad ? 0.5 : sandy ? 1.5 : 0.9, topS = (onRoad ? 27 : sandy ? 17 : 22) + boostAmt * 10;
      if (grounded) {
        const accel = thr > 0 ? (fs < 0 ? 22 : 13 + boostAmt * 10) * (1 - Math.min(0.8, Math.max(0, fs) / topS)) : thr < 0 ? (fs > 0 ? 26 : 7) : 0;
        fs += thr * dt * accel; fs -= fs * dt * drag * (thr ? 0.22 : 1);
        const sa = groundY(fx - Math.sin(fh) * 1.2, fz - Math.cos(fh) * 1.2) - groundY(fx + Math.sin(fh) * 1.2, fz + Math.cos(fh) * 1.2); fs -= clamp(sa / 2.4, -0.8, 0.8) * 9.8 * dt;
      }
      fs = clamp(fs, -6, topS + 5);
      const turnRate = 2.4 * clamp(1 - Math.abs(fs) / 46, 0.55, 1) * (grounded ? 1 : 0.4);
      const yawRate = -keyDir * turnRate * clamp(Math.abs(fs) / 2.2, 0.18, 1) * (fs < 0 ? -1 : 1); fh += yawRate * dt; iceSpin = onIce && grounded ? iceSpin + yawRate * dt : 0;
      slip += -yawRate * Math.abs(fs) * 0.1 * (grounded ? (onIce ? 3 : onRoad ? 0.5 : 1.3) : 0.2) * dt; slip *= Math.exp(-dt * (grounded ? grip : 0.4)); slip = clamp(slip, -7, 7);
      const fwx = -Math.sin(fh), fwz = -Math.cos(fh), rtx = Math.cos(fh), rtz = -Math.sin(fh);
      let nx = fx + (fwx * fs + rtx * slip) * dt, nz = fz + (fwz * fs + rtz * slip) * dt;
      { const ei = edgeInfo(nx, nz); if (ei.e < SOFT_IN) { const sB = clamp((SOFT_IN - ei.e) / (SOFT_IN - SOFT_OUT), 0, 1), sE = sB * sB * (3 - 2 * sB), vo = (nx - fx) * ei.ox + (nz - fz) * ei.oz, fo = fwx * ei.ox + fwz * ei.oz;
        if (vo > 0) { nx -= ei.ox * vo * sE; nz -= ei.oz * vo * sE; }
        if (fo > 0) { fs *= Math.exp(-dt * sE * 1.6 * fo); fh += (rtx * ei.ox + rtz * ei.oz) * sE * dt * 1.4; } } }
      const stepL = Math.max(0.05, Math.hypot(nx - fx, nz - fz));
      const wall = grounded && roadDist(nx, nz) > roadW(nz) + 0.5 && !onPier(fx, fz) && (groundY(nx, nz) - groundY(fx, fz)) / stepL > 2.4 + Math.abs(fs) * 0.03;
      const hit = collideAt(nx, nz, 0.25);
      const sea = zBand(nz, COAST.zHi, COAST.zLo, 1) > 0.5 && nx < coastX(nz) + 12 && hFast(nx, nz) < SEA_Y - 2.2 && !onPier(nx, nz);
      if (edgeInfo(nx, nz).e > SOFT_OUT - 8 && !sea && !wall && !hit) { fx = nx; fz = nz; }
      else { const imp = Math.abs(fs); fs *= -0.35; slip *= -0.3; shake = Math.min(1, 0.3 + imp / 16); opts.onBrake && opts.onBrake(); if (imp > 6) spawnDust(10, fx + fwx * 0.8, fz + fwz * 0.8, 1);
        if (hit) { const pdx = fx - hit.x, pdz = fz - hit.z, pl = Math.hypot(pdx, pdz) || 1, nx2 = pdx / pl, nz2 = pdz / pl, tx2 = -nz2, tz2 = nx2;
          const along = (nx - fx) * tx2 + (nz - fz) * tz2; fx += nx2 * 0.12 + tx2 * along * 0.6; fz += nz2 * 0.12 + tz2 * along * 0.6; } }
      z = fz; const gy0 = groundY(fx, fz); if (lastGY === null) { lastGY = gy0; airY = gy0; }
      if (!(keys.jump || touch.jump)) jumpHeld = false;
      if (grounded) { const gv = (gy0 - lastGY) / Math.max(dt, 1e-3), pred = lastGY + vyPrev * dt - 11 * dt * dt;
        if ((keys.jump || touch.jump) && !jumpHeld) { jumpHeld = true; grounded = false; airVel = Math.max(0, vyPrev) + 7.2; airY = gy0; shake = Math.max(shake, 0.3); }
        else if (Math.abs(fs) > 7 && gy0 < pred - 0.07 && vyPrev > -1) { grounded = false; airVel = vyPrev; airY = lastGY + vyPrev * dt; }
        else { airY = gy0; vyPrev = clamp(gv, -30, 30); } }
      else { airVel -= 22 * dt; airY += airVel * dt;
        if (airY <= gy0) { const impact = -airVel; airY = gy0; grounded = true; vyPrev = 0; shake = Math.max(shake, clamp(impact / 12, 0.25, 1)); if (impact > 9) fs *= 0.92; spawnDust(Math.round(clamp(impact * 1.5, 6, 26)), fx, fz, surf); opts.onBrake && impact > 10 && opts.onBrake(); } }
      lastGY = gy0; airY = Math.max(airY, gy0);
      bp = tmp.set(fx, airY, fz); yaw = fh;
      const ga = groundY(fx - Math.sin(fh) * 0.8, fz - Math.cos(fh) * 0.8), gb = groundY(fx + Math.sin(fh) * 0.8, fz + Math.cos(fh) * 0.8);
      wheelie += ((grounded && thr > 0 && fs > 1 && fs < 9 ? 0.16 + boostAmt * 0.12 : 0) - wheelie) * (1 - Math.exp(-dt * 5));
      const pT = grounded ? Math.atan2(ga - gb, 1.6) + wheelie : clamp(Math.atan2(airVel, Math.max(4, Math.abs(fs))) * 0.6, -0.5, 0.45); freePitch += (pT - freePitch) * (1 - Math.exp(-dt * (grounded ? 14 : 4))); if (!isFinite(freePitch)) freePitch = 0; pitch = freePitch;
      lean += (clamp(keyDir * fs * 0.04 + slip * 0.06, -0.6, 0.6) - lean) * (1 - Math.exp(-dt * 6));
      if (grounded && (surf > 0 && Math.abs(fs) > 5 || Math.abs(slip) > 1.6) && Math.random() < dt * (Math.abs(fs) * 1.6 + Math.abs(slip) * 10)) spawnDust(1, fx - fwx * 0.75, fz - fwz * 0.75, Math.abs(slip) > 1.6 && surf === 0 ? 3 : surf);
      { const wS = waterAt(fx, fz), wet = wS !== null && airY <= wS + 0.08, as = Math.abs(fs);
        if (wet) { const depth = clamp(wS - (hFast || H)(fx, fz), 0, 2.5); fs *= Math.exp(-dt * (0.5 + depth * 0.8));
          if (!wasGrounded && grounded) { const pw = clamp(0.9 + (-vyPrev) * 0.05 + as * 0.03, 0.9, 2); spawnSpray(34, fx, wS, fz, pw); addRipple(fx, fz); addRipple(fx + fwx * 1.5, fz + fwz * 1.5); shake = Math.max(shake, 0.35); opts.onSplash && opts.onSplash(pw); }
          else if (!inWater && as > 3) { spawnSpray(18, fx + fwx * 0.8, wS, fz + fwz * 0.8, 0.9 + as * 0.03, fwx * as * 0.2, fwz * as * 0.2); addRipple(fx, fz); opts.onSplash && opts.onSplash(0.7); }
          wakeT -= dt; if (as > 0.8 && wakeT <= 0) { wakeT = clamp(0.5 - as * 0.015, 0.18, 0.5); addRipple(fx - fwx * 0.7, fz - fwz * 0.7); }
          if (as > 1.5 && Math.random() < dt * as * 2.4) { const sd = Math.random() < 0.5 ? -1 : 1; spawnSpray(2, fx + fwx * 0.7 + rtx * sd * 0.3, wS, fz + fwz * 0.7 + rtz * sd * 0.3, 0.45 + as * 0.035, rtx * sd * as * 0.12, rtz * sd * as * 0.12); }
          if (as > 1 && Math.random() < dt * as * 1.4) spawnSpray(1, fx - fwx * 0.8, wS, fz - fwz * 0.8, 0.5 + as * 0.03, -fwx * 1.2, -fwz * 1.2); }
        inWater = wet; wasGrounded = grounded; }
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
    bikeRoot.position.copy(bp); bikeRoot.rotation.set(pitch + (susRear - susFront) * 0.4, yaw, 0, 'YXZ'); bike.rotation.z = -lean; bike.position.y = (Math.sin(T * 21) * 0.6 + Math.sin(T * 34 + 1.7) * 0.4) * (0.004 + 0.011 * trailMix(bp.z)) * clamp(curSpeed / 18, 0, 1);
    lastBX = bp.x; lastBZ = bp.z;
    curSpeed += (Math.min(spd, 30) - curSpeed) * (1 - Math.exp(-dt * 3));
    const brakeAmt = clamp(Math.max(0, brakeSpd - curSpeed) * 6, 0, 1); brakeSpd = curSpeed;
    const tE = fO(free ? fz : zAt(t));

    // env
    let e = envAt(tE), night = sstep(0.42, 0.76, tE), glow = sstep(0.5, 0.86, tE), sunX = -0.5, sunY = lerp(0.09, -0.14, sstep(0, 0.52, tE));
    { const dayAct = (free && dayOn) || dayForce !== null; if (dayAct && dayPh < 0) dayPh = dayForce !== null ? dayForce : 0.74 + tE * 0.13; dayMix += ((dayAct ? 1 : 0) - dayMix) * (1 - Math.exp(-dt * 1.2)); if (!dayAct && dayMix < 0.003) { dayMix = 0; dayPh = -1; }
      if (dayMix > 0 && dayPh >= 0) { if (dayAct) dayPh = dayForce !== null ? dayForce : (dayPh + dt / DAY_LEN) % 1; const d = dayAt(dayPh); e = mixEnv(e, d.e, dayMix); night = lerp(night, d.night, dayMix); glow = lerp(glow, d.glow, dayMix); sunX = lerp(sunX, d.sx, dayMix); sunY = lerp(sunY, d.sy, dayMix); } }
    wxTick(dt); wxEnv(e, night);
    skyU.top.value.copy(e.top); skyU.mid.value.copy(e.mid); skyU.hor.value.copy(e.hor); skyU.night.value = night; skyU.time.value = T;
    SUN.set(sunX, sunY, -0.86).normalize(); skyU.sunDir.value.copy(SUN);
    scene.fog.color.copy(e.fog); scene.fog.near = e.fn * drawDist; scene.fog.far = e.ff * drawDist;
    FOGU.uFogBase.value = bp.y - 1.5; FOGU.uFogAmt.value = lerp(0.42, 0.66, night) + WX.mist * 0.35 + Math.min(1, WX.oc) * 0.12 + WX.dust * 0.3; FOGU.uFogHaze.value.copy(e.fog).lerp(HAZE_D, 0.3 * (1 - night)).lerp(HAZE_N, 0.4 * night);
    FOGU.uSunDir.value.copy(SUN).lerp(MOON, night).normalize(); FOGU.uSunCol.value.copy(SUNCOL).lerp(MOONCOL, night); FOGU.uSunAmt.value = lerp(0.6, 0.26, night);
    TERU.uRimCol.value.copy(e.hor).lerp(MOONCOL, night * 0.75); TERU.uRimAmt.value = lerp(0.15, 0.28, night);
    if (frameNo % 8 === 0) { const lim = scene.fog.far + 20, cp = camera.position; for (const c of chunks) { const u = c.userData, d = Math.hypot(u.cx - cp.x, u.cz - cp.z) - u.r, vis = d < (u.dd ? Math.min(lim, u.dd * (0.6 + 0.4 * drawDist)) : lim); if (u.lo) { const far = d > u.lodD * drawDist; c.visible = vis && !far; u.lo.visible = vis && far; } else c.visible = vis; } }
    hemi.color.copy(e.hs); hemi.groundColor.copy(e.hg); hemi.intensity = e.hi;
    const ld = tmp2.copy(SUN).lerp(MOON, lerp(sstep(0.42, 0.62, tE), sstep(0.3, 0.7, night), dayMix)); ld.y = Math.max(ld.y, 0.4); ld.normalize();
    key.color.copy(e.kc); key.intensity = e.ki; key.position.copy(bp).addScaledVector(ld, 60); key.target.position.copy(bp);
    cloudMat.color.copy(e.cl); wU.skyc.value.copy(e.hor).lerp(e.mid, 0.4); wU.skyTop.value.copy(e.top).lerp(e.mid, 0.3); wU.sunDir.value.copy(SUN); wU.time.value = T; wU.gust.value = windAmtU.value; wU.fogColor.value.copy(scene.fog.color); wU.fogNear.value = scene.fog.near; wU.fogFar.value = scene.fog.far;
    head.intensity = lerp(3, 30, night); headGlow.material.opacity = lerp(0.35, 0.95, night); beamU.opacity.value = lerp(0, 0.22, night); pool.material.opacity = lerp(0, 0.5, night); beamU.time.value = T;
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
        if (dinoStand > 1.4) { dinoState = 'jumpoff'; dinoJumpT = 0; dinoRoamT = 0; scene.attach(dino); dino.getWorldPosition(dinoJumpFrom); dinoBaseY = groundY(bp.x, bp.z + 0.9); const atFireStop = !free && Math.round(t * NSTOP) === 9; const ro = atFireStop ? [FIRE.x, FIRE.z + 1.6] : [bp.x, bp.z + 1.1]; dinoSeekLake = !atFireStop && Math.hypot(bp.x - LAKE.x, bp.z - LAKE.z) < LAKE.r + 60; pickRoamTarget(ro[0], ro[1]); dinoJumpTo.set(bp.x + (Math.random() - 0.5) * 1.4, dinoBaseY, bp.z + 1.0 + Math.random() * 0.6); }
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
    glows.forEach(g => { g.s.material.opacity = lerp(g.base, g.n, glow); }); lhBeam.v = night * 0.1;
    fireLight.intensity = (lerp(4, 22, night)) * (1 + fireBoost * 0.6) * (0.8 + Math.sin(T * 13) * 0.1 + Math.sin(T * 7.3) * 0.14 + Math.sin(T * 23.7) * 0.06) * sstep(0.8, 0.95, tE);
    fireLight.position.x = Math.sin(T * 9) * 0.05; fireLight.position.z = Math.cos(T * 7) * 0.05;
    flames.forEach((f, k) => { const flick = Math.sin(T * 9 + k) * 0.08 + Math.sin(T * 17 + k * 3) * 0.05; f.scale.set(1 + flick, 1 + Math.sin(T * 11 + k * 2) * 0.18 + Math.sin(T * 21 + k) * 0.08, 1 + flick); f.rotation.y = T * (1 + k) + Math.sin(T * 5 + k) * 0.3; f.position.x = Math.sin(T * 6 + k * 2) * 0.03; f.position.z = Math.cos(T * 6.4 + k * 2) * 0.03; });
    if (fireBoost > 0.01) flames.forEach(f => f.scale.multiplyScalar(1 + fireBoost * 0.4));
    anim.forEach(fn => fn(T)); progFx.forEach(fn => fn(tE));
    { const day = lerp(1 - sstep(0.62, 0.82, tE), 1 - sstep(0.3, 0.7, night), dayMix);
      flock2.visible = day > 0.02; if (flock2.visible) { for (let i = 0; i < bdat2.length; i++) { const b = bdat2[i], f = b.f;
          if (f === 3) cV3.set(PIER.x0 - 10 + Math.cos(T * 0.13) * 45, SEA_Y + 20 + Math.sin(T * 0.3) * 3, PIER.z + Math.sin(T * 0.13) * 55);
          else { const w = 0.045 * (f + 1), R = 55 + f * 28; cV3.set(bp.x + Math.cos(T * w + f * 2.1) * R, bp.y + 24 + f * 7, bp.z - 30 + Math.sin(T * w + f * 2.1) * R); }
          b.q.copy(b.p); b.p.set(cV3.x + Math.sin(T * 0.7 + b.ph * 1.3) * 7, cV3.y + Math.sin(T * 0.9 + b.ph * 2.1) * 2.2, cV3.z + Math.cos(T * 0.6 + b.ph * 0.7) * 7);
          dummy.position.copy(b.p); if (b.q.distanceToSquared(b.p) > 1e-6) dummy.lookAt(b.q); const glide = Math.sin(T * 0.4 + b.ph) > 0.3 ? 0.15 : 1; dummy.scale.set(1.5, Math.sin(T * b.ff + b.ph) * 0.45 * glide + 0.05, 1.5); dummy.updateMatrix(); flock2.setMatrixAt(i, dummy.matrix); }
        flock2.instanceMatrix.needsUpdate = true; }
      flutter2.visible = day > 0.05 && !free ? curSpeed < 14 : day > 0.05; if (flutter2.visible) { for (let i = 0; i < NBF2; i++) { const b = bfd2[i];
          if (Math.hypot(b.a.x - bp.x, b.a.z - bp.z) > 26) { const a = Math.random() * 6.28, r = 7 + Math.random() * 16; b.a.set(bp.x + Math.cos(a) * r + fr.f.x * 8, 0, bp.z + Math.sin(a) * r + fr.f.z * 8); b.a.y = groundY(b.a.x, b.a.z); if (roadDist(b.a.x, b.a.z) < 3) b.a.x += 6; }
          b.q.copy(b.p); b.p.set(b.a.x + Math.sin(T * 0.9 + b.ph) * b.r, b.a.y + 0.7 + Math.sin(T * 1.7 + b.ph * 2) * 0.35, b.a.z + Math.cos(T * 1.1 + b.ph) * b.r);
          dummy.position.copy(b.p); if (b.q.distanceToSquared(b.p) > 1e-7) dummy.lookAt(b.q); dummy.scale.set(0.16, Math.sin(T * 17 + b.ph * 5) * 0.14, 0.16); dummy.updateMatrix(); flutter2.setMatrixAt(i, dummy.matrix); }
        flutter2.instanceMatrix.needsUpdate = true; }
      for (const r of rabbits2) { const dxb = r.g.position.x - bp.x, dzb = r.g.position.z - bp.z, db = Math.hypot(dxb, dzb); if (db > 140) continue;
        if (r.u >= 1) { r.wait -= dt; const scared = db < 3 + curSpeed * 0.45 + boostAmt * 4; if (r.wait <= 0 || scared) { r.from.copy(r.g.position); let tx, tz; if (scared) { tx = r.g.position.x + dxb / (db || 1) * 2.4; tz = r.g.position.z + dzb / (db || 1) * 2.4; } else { const a = Math.random() * 6.28; tx = r.hx + Math.cos(a) * 3 * Math.random(); tz = r.hz + Math.sin(a) * 3 * Math.random(); }
            r.to.set(tx, groundY(tx, tz), tz); r.u = 0; r.dur = scared ? 0.3 : 0.45; r.wait = scared ? 0.05 : 0.6 + Math.random() * 2.4; r.g.rotation.y = Math.atan2(-(tx - r.from.x), -(tz - r.from.z)); } }
        else { r.u = Math.min(1, r.u + dt / r.dur); r.g.position.lerpVectors(r.from, r.to, r.u); r.g.position.y += Math.sin(r.u * Math.PI) * 0.32; } }
      for (const o of owls2) { const blink = ((T * 0.23 + o.ph) % 1) < 0.05 ? 0 : 1, op = glow * blink * 0.95; o.pair.forEach(e => { e.material.opacity = op; e.visible = op > 0.01; }); }
      for (const f of fishes2) { f.t += dt; if (f.t > 0 && f.t < 1) { const u = f.t; f.f.visible = true; f.f.position.set(f.x + f.dx * u * 3, f.y + Math.sin(u * Math.PI) * 1.5, f.z + f.dz * u * 3); f.f.rotation.set(Math.cos(u * Math.PI) * 0.9, Math.atan2(-f.dx, -f.dz), 0, 'YXZ'); if (f.spl === 0 && u > 0.95) { f.spl = 1; wU.rip.value[ripI++ % 8].set(f.f.position.x, f.f.position.z, wU.time.value); f.sp.position.set(f.f.position.x, f.y + 0.2, f.f.position.z); f.sp.material.opacity = 0.7; } }
        else if (f.t >= 1) { f.f.visible = false; f.sp.material.opacity *= Math.exp(-dt * 3); if (f.t > 3 + Math.random() * 3) { const nearLake = Math.hypot(camera.position.x - LAKE.x, camera.position.z - LAKE.z) < 170, nearSea = Math.hypot(camera.position.x - PIER.x0, camera.position.z - PIER.z) < 220; if (nearLake || nearSea) { const a = Math.random() * 6.28, r = Math.random() * (nearLake ? LAKE.r * 0.55 : 30); f.x = (nearLake ? LAKE.x : PIER.x0 - 25) + Math.cos(a) * r; f.z = (nearLake ? LAKE.z : PIER.z) + Math.sin(a) * r; f.y = nearLake ? LAKE.y : SEA_Y; const d2 = Math.random() * 6.28; f.dx = Math.cos(d2); f.dz = Math.sin(d2); f.t = 0; f.spl = 0; wU.rip.value[ripI++ % 8].set(f.x, f.z, wU.time.value); } else f.t = 0.99; } } }
      if (!free && trailMix(bp.z) > 0.5 && curSpeed > 5 && Math.random() < dt * curSpeed * 1.2) spawnDust(1, bp.x - fr.f.x * 0.75, bp.z - fr.f.z * 0.75, 1);
      for (let i = 0; i < DN2; i++) { if (dLife2[i] >= 1) continue; const j = i * 3; dLife2[i] = Math.min(1, dLife2[i] + dt / 1.4); dVel2[j + 1] -= dt * dG2[i]; dPos2[j] += dVel2[j] * dt; dPos2[j + 1] += dVel2[j + 1] * dt; dPos2[j + 2] += dVel2[j + 2] * dt; dVel2[j] *= 0.96; dVel2[j + 2] *= 0.96; }
      dGeo2.attributes.position.needsUpdate = true; dGeo2.attributes.aLife.needsUpdate = true; dGeo2.attributes.aCol.needsUpdate = true; dU2.uScale.value = renderer.domElement.height / 900 * 6; }
    deer.forEach(d => { const distBike = Math.hypot(bp.x - d.g.position.x, bp.z - d.g.position.z);
      const deerFlee = () => { d.state = 'flee'; const dx = d.g.position.x - bp.x, dz = d.g.position.z - bp.z, dl = Math.hypot(dx, dz) || 1; d.target.set(d.g.position.x + dx / dl * 18, 0, d.g.position.z + dz / dl * 18); };
      if (d.state !== 'flee' && d.state !== 'alert' && distBike < alarmR * 1.9) { if (distBike < alarmR * 0.6) deerFlee(); else { d.state = 'alert'; d.t = 0.6 + rnd() * 0.9; } }
      if (d.state === 'alert') { d.head.rotation.x += (-0.4 - d.head.rotation.x) * Math.min(1, dt * 8); faceTo(d.g, bp.x - d.g.position.x, bp.z - d.g.position.z, Math.min(1, dt * 3)); d.t -= dt;
        if (distBike < alarmR || (d.t <= 0 && !quietBike)) deerFlee(); else if (d.t <= 0) { if (distBike > alarmR * 2.1) { d.state = 'graze'; d.t = 2 + rnd() * 3; } else d.t = 0.4; } }
      if (d.state === 'flee') { const dx = d.target.x - d.g.position.x, dz = d.target.z - d.g.position.z, dl = Math.hypot(dx, dz);
        if (dl < 0.5 || distBike > alarmR * 2.2 + 6) { d.state = 'graze'; d.t = 2 + rnd() * 3; } else { const sp = 6.5; d.g.position.x += dx / dl * sp * dt; d.g.position.z += dz / dl * sp * dt; d.g.position.y = H(d.g.position.x, d.g.position.z) + Math.abs(Math.sin(d.phase * 0.5)) * 0.28;
          const ty = Math.atan2(-dx, -dz); let dy = ty - d.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); d.g.rotation.y += dy * Math.min(1, dt * 8); d.phase += dt * 9; d.legs.forEach((l, i) => { l.rotation.x = Math.sin(d.phase + (i % 2 ? Math.PI : 0)) * 0.6; }); } }
      else if (d.state === 'graze') { d.head.rotation.x = 0.3 + Math.sin(T * 1.2 + d.phase) * 0.15; d.t -= dt; if (d.t <= 0) { d.state = 'walk'; const a = rnd() * Math.PI * 2, r = 2 + rnd() * 4; d.target.set(d.g.position.x + Math.cos(a) * r, 0, d.g.position.z + Math.sin(a) * r); } }
      else if (d.state === 'walk') { const dx = d.target.x - d.g.position.x, dz = d.target.z - d.g.position.z, dl = Math.hypot(dx, dz);
        if (dl < 0.3) { d.state = 'graze'; d.t = 3 + rnd() * 4; } else { const sp = 1.1; d.g.position.x += dx / dl * sp * dt; d.g.position.z += dz / dl * sp * dt; d.g.position.y = H(d.g.position.x, d.g.position.z);
          const ty = Math.atan2(-dx, -dz); let dy = ty - d.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); d.g.rotation.y += dy * Math.min(1, dt * 5); d.phase += dt * 4; d.legs.forEach((l, i) => { l.rotation.x = Math.sin(d.phase + (i % 2 ? Math.PI : 0)) * 0.4; }); } } });
    critters.forEach(c => {
      { const u = c.g.userData, dC = Math.abs(bp.x - c.g.position.x) + Math.abs(bp.z - c.g.position.z); if (dC > 320) { if (!u.far) { u.far = true; u.wasVis = c.g.visible; c.g.visible = false; } return; } if (u.far) { u.far = false; c.g.visible = u.wasVis; } }
      const distBike = Math.hypot(bp.x - c.g.position.x, bp.z - c.g.position.z), distDino = Math.hypot(dino.position.x - c.g.position.x, dino.position.z - c.g.position.z), threat = Math.min(distBike / (0.55 + curSpeed / 14 + boostAmt * 0.8), distDino);
      if (c.state !== 'flee' && c.state !== 'alert' && threat < c.fleeDist * 1.7 && threat >= c.fleeDist) { c.state = 'alert'; c.t = 0.35 + rnd() * 0.5; }
      if (c.state === 'alert') { faceTo(c.g, (distBike < distDino ? bp.x : dino.position.x) - c.g.position.x, (distBike < distDino ? bp.z : dino.position.z) - c.g.position.z, Math.min(1, dt * 6)); c.g.scale.set(1, 1.07, 1); c.t -= dt; if (c.t <= 0) { c.g.scale.set(1, 1, 1); c.state = 'idle'; c.t = 0.8 + rnd(); } }
      if (threat < c.fleeDist && c.state !== 'flee' && (c.state !== 'alert' || c.t <= 0.15)) { c.g.scale.set(1, 1, 1); c.state = 'flee'; const fromX = distBike < distDino ? bp.x : dino.position.x, fromZ = distBike < distDino ? bp.z : dino.position.z, dx = c.g.position.x - fromX, dz = c.g.position.z - fromZ, dl = Math.hypot(dx, dz) || 1; c.target.set(c.g.position.x + dx / dl * 10, 0, c.g.position.z + dz / dl * 10); }
      if (c.state === 'flee') { const dx = c.target.x - c.g.position.x, dz = c.target.z - c.g.position.z, dl = Math.hypot(dx, dz);
        if (dl < 0.4 || threat > c.fleeDist + 5) { c.state = 'idle'; c.t = 1.5 + rnd() * 2; } else { const [adx, adz] = dinoAvoid(c.g.position.x, c.g.position.z, dx / dl, dz / dl);
          c.g.position.x += adx * c.fleeSpd * dt; c.g.position.z += adz * c.fleeSpd * dt; c.g.position.y = hFast(c.g.position.x, c.g.position.z);
          const ty = Math.atan2(-adx, -adz); let dy = ty - c.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); c.g.rotation.y += dy * Math.min(1, dt * 8);
          c.phase += dt * c.gait; c.legs.forEach((l, i) => { l.rotation.x = Math.sin(c.phase + (i % 2 ? Math.PI : 0)) * (c.hop ? 0.9 : 0.6); });
          if (c.hop) c.g.position.y += Math.abs(Math.sin(c.phase)) * 0.06; } }
      else if (c.state === 'idle') { c.t -= dt; c.g.scale.setScalar(1 + Math.sin(T * 2.4 + c.phase) * 0.02);
        if (c.t <= 0) { c.g.scale.setScalar(1); c.state = 'walk'; const a = rnd() * Math.PI * 2, r = 1.5 + rnd() * (c.kind === 'goat' ? 5 : 3), nx = (c.herd ? lerp(c.g.position.x, c.herd.x + c.hox, 0.35) : c.g.position.x) + Math.cos(a) * r, nz = (c.herd ? lerp(c.g.position.z, c.herd.z + c.hoz, 0.35) : c.g.position.z) + Math.sin(a) * r; if (!collideAt(nx, nz, 0.4)) c.target.set(nx, 0, nz); else c.t = 1; } }
      else if (c.state === 'walk') { const dx = c.target.x - c.g.position.x, dz = c.target.z - c.g.position.z, dl = Math.hypot(dx, dz);
        if (dl < 0.3) { c.state = 'idle'; c.t = 2 + rnd() * 3; } else { const [adx, adz] = dinoAvoid(c.g.position.x, c.g.position.z, dx / dl, dz / dl);
          c.g.position.x += adx * c.wanderSpd * dt; c.g.position.z += adz * c.wanderSpd * dt; c.g.position.y = hFast(c.g.position.x, c.g.position.z);
          const ty = Math.atan2(-adx, -adz); let dy = ty - c.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); c.g.rotation.y += dy * Math.min(1, dt * 5);
          c.phase += dt * c.gait * 0.6; c.legs.forEach((l, i) => { l.rotation.x = Math.sin(c.phase + (i % 2 ? Math.PI : 0)) * (c.hop ? 0.5 : 0.35); });
          if (c.hop) c.g.position.y += Math.abs(Math.sin(c.phase)) * 0.035; } }
    });
    birds.forEach(b => { b.ph += dt * b.spd; b.flap += dt * 14; const distB = Math.hypot(bp.x - b.cx, bp.z - b.cz); b.scatter += ((distB < Math.max(22, alarmR * 2.4) || gustNear > 0.35 ? 1 : 0) - b.scatter) * dt * 2;
      const a = b.ph; const rr = b.r * (1 + b.scatter * 0.6); b.g.position.set(b.cx + Math.cos(a) * rr, b.h + b.scatter * 4 + Math.sin(a * 2) * 1.2, b.cz + Math.sin(a) * rr * 0.7); b.g.rotation.y = -a - Math.PI / 2; const flapA = Math.sin(b.flap * (1 + b.scatter * 0.8)) * 0.6; b.wL.rotation.z = flapA; b.wR.rotation.z = -flapA; });
    flies2.count = BF; flyDat.forEach((f, i) => { const tt = T * f.spd + f.ph; const x = f.x0 + Math.sin(tt) * 1.4 + Math.sin(tt * 2.3) * 0.4, y = f.y0 + Math.sin(tt * 1.7) * 0.35, z = f.z0 + Math.cos(tt * 0.8) * 1.4;
      dummy.position.set(x, y, z); dummy.rotation.set(0, T * 2 + i, Math.sin(T * 10 + i) * 0.5); dummy.updateMatrix(); flies2.setMatrixAt(i, dummy.matrix); }); flies2.instanceMatrix.needsUpdate = true; flyMat.opacity = lerp(0.15, 0.95, 1 - night * 0.7);
    owls.forEach(o => { const on = night > 0.3; o.g.visible = on; if (on) { o.ph += dt; if (Math.hypot(bp.x - o.g.position.x, bp.z - o.g.position.z) >= 40) o.g.rotation.y += (Math.sin(o.ph * 0.3) * 0.4 - o.g.rotation.y) * Math.min(1, dt * 2); o.blinkAt -= dt; const blink = o.blinkAt < 0.12 ? 0.15 : 1; o.g.children.forEach(c => { if (c.name === 'owl-eye') c.scale.y = blink; }); if (o.blinkAt < 0) o.blinkAt = 2.5 + Math.random() * 4; } });
    fishT -= dt; if (fishT <= 0 && fishJumping <= 0) { fishT = 5 + Math.random() * 9; fishJumping = 1; const a2 = Math.random() * Math.PI * 2, rr2 = Math.random() * LAKE.r * 0.7; fishFrom.set(LAKE.x + Math.cos(a2) * rr2, LAKE.y, LAKE.z + Math.sin(a2) * rr2); fishTo.set(fishFrom.x + Math.cos(a2) * 1.6, LAKE.y, fishFrom.z + Math.sin(a2) * 1.6); }
    if (fishJumping > 0) { fishJumping -= dt / 0.7; const p = clamp(1 - fishJumping, 0, 1); fishJump.visible = p < 1; fishJump.position.lerpVectors(fishFrom, fishTo, p); fishJump.position.y += Math.sin(p * Math.PI) * 0.9; fishJump.rotation.x = Math.cos(p * Math.PI) * 0.8; fishJump.rotation.y = Math.atan2(fishTo.x - fishFrom.x, fishTo.z - fishFrom.z);
      fishSplash.position.set(fishTo.x, LAKE.y + 0.1, fishTo.z); fishSplash.material.opacity = p > 0.85 ? 0.6 : fishSplash.material.opacity * Math.exp(-dt * 2); }
    else { fishJump.visible = false; fishSplash.material.opacity *= Math.exp(-dt * 2.5); }
    if (Math.abs(camera.position.x - riverX(clamp(camera.position.z, RIV.zLo, RIV.zHi))) < 420) rFish.forEach(f => {
      if (f.p < 0) { f.wait -= dt; if (f.wait > 0) return;
        const near = zBand(bp.z, RIV.zHi, RIV.zLo, 1) > 0.5 && Math.abs(bp.x - riverX(bp.z)) < 90;
        const z0 = clamp(near ? bp.z + (Math.random() - 0.5) * 70 : lerp(RIV.zHi, RIV.zLo, Math.random()), RIV.zLo + 6, RIV.zHi - 6), wy = roadY(z0) - 2.2, x0 = riverX(z0) + (Math.random() - 0.5) * 7;
        const dz = (Math.random() < 0.7 ? -1 : 1) * (1.1 + Math.random() * 1.4), dx = (Math.random() - 0.5) * 1.2, z1 = z0 + dz, x1 = x0 + dx - (riverX(z0) - riverX(z1)) * -1;
        f.from.set(x0, wy, z0); f.to.set(riverX(z1) + (x0 - riverX(z0)) + dx, roadY(z1) - 2.2, z1); f.dur = 0.7 + Math.random() * 0.35; f.hgt = 0.7 + Math.random() * 0.9; f.p = 0; f.g.visible = true;
        f.g.rotation.y = Math.atan2(f.to.x - f.from.x, f.to.z - f.from.z); spawnSpray(8, x0, wy, z0, 0.6); rivRip[rivI++ % 8].set(x0, z0, wU.time.value); }
      f.p += dt / f.dur; const p = Math.min(1, f.p); f.g.position.lerpVectors(f.from, f.to, p); f.g.position.y += Math.sin(p * Math.PI) * f.hgt; f.g.rotation.x = -Math.cos(p * Math.PI) * 0.9; f.tail.rotation.y = Math.sin(T * 38) * 0.5;
      if (f.p >= 1) { f.g.visible = false; f.p = -1; f.wait = 1.5 + Math.random() * 4.5; spawnSpray(12, f.to.x, f.to.y, f.to.z, 0.75); rivRip[rivI++ % 8].set(f.to.x, f.to.z, wU.time.value); } });
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
    lifeTick(dt, T, bp, fr, night);
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
    const si = free ? 0 : Math.round(t * NSTOP), dwell = free ? 0 : 1 - sstep(0.004, 0.062, Math.abs(t - si / NSTOP)); const cc = CAM[si] || CAM[0], sd = side[si] || 1;
    { const arrNow = !free && dwell > 0.92 ? si : -1; if (arrNow !== lastArrive) { if (arrNow === 8 && starT < 0) { starT = 0; starBase.copy(camFwd); } if (arrNow === 9) fireBoost = 1; lastArrive = arrNow; } fireBoost *= Math.exp(-dt * 0.8); }

    // Rider: sits on the log by the fire when parked at the campfire stop
    if (rider) { const atFire = !free && si === 9 && dwell > 0.9;
      if (riderState === 'onBike' && atFire) { riderState = 'toLog'; riderT = 0; scene.attach(rider); rider.getWorldPosition(riderFrom); }
      else if (riderState === 'sitting' && !atFire) { riderState = 'toBike'; riderT = 0; rider.getWorldPosition(riderFrom); }
      if (riderState === 'toLog' || riderState === 'toBike') { riderT = clamp(riderT + dt / 1.1, 0, 1); const ease = riderT * riderT * (3 - 2 * riderT);
        const dest = riderState === 'toLog' ? logSeat : bikeRoot.localToWorld(new THREE.Vector3(0, 0, 0));
        rider.position.lerpVectors(riderFrom, dest, ease); rider.position.y += Math.sin(ease * Math.PI) * 0.1;
        rider.rotation.y += dt * 3;
        if (riderT >= 1) { if (riderState === 'toLog') { rider.rotation.set(0, logSeatYaw, 0); riderState = 'sitting'; } else { bike.attach(rider); rider.position.set(0, 0, 0); rider.rotation.set(0, 0, 0); riderState = 'onBike'; } } }
    }
    const a = cc[0] * dwell * (si === 8 ? 1 : -sd) + (free ? 0 : steer * 0.12) + yawOff, D = (free ? 6.4 : 5.6) + dwell * 1.2 + cc[2] * dwell * 1.5;
    const back = tmp2.copy(fr.f).multiplyScalar(-Math.cos(a) * D).addScaledVector(fr.r, -Math.sin(a) * D);
    const chase = camPos.clone().copy(bp).add(back); chase.y = bp.y + 2.1 + cc[2] * dwell + pitchOff * D;
    const gy = hFast(chase.x, chase.z) + 1.2; if (chase.y < gy) chase.y = gy;
    const look = new THREE.Vector3().copy(bp).addScaledVector(fr.f, 2.5); look.y += 0.9;
    if (si === 8) look.lerp(new THREE.Vector3(LAKE.x, LAKE.y + 6, LAKE.z - 10), dwell * 0.35);
    if (si === 9) look.lerp(new THREE.Vector3(FIRE.x, hFast(FIRE.x, FIRE.z) + 1.1, FIRE.z), dwell * 0.4);
    // shift subject away from panel
    const camR = new THREE.Vector3().subVectors(look, chase).cross(new THREE.Vector3(0, 1, 0)).normalize();
    if (si === 9 && dwell > 0.3) { const orbR = 6.5, orbH = 3.0, ang = T * 0.12, fgy = hFast(FIRE.x, FIRE.z);
      const fireOrbitPos = new THREE.Vector3(FIRE.x + Math.cos(ang) * orbR, fgy + orbH, FIRE.z + Math.sin(ang) * orbR);
      const fireLook = new THREE.Vector3(FIRE.x, fgy + 1.1, FIRE.z);
      const w = sstep(0.3, 0.7, dwell); chase.lerp(fireOrbitPos, w); look.lerp(fireLook, w);
    } else if (mobile) look.y -= 0.9 * dwell * cc[1]; else look.addScaledVector(camR, 1.7 * dwell * cc[1]);
    // intro: descend through clouds
    if (intro < 1) { const ip = new THREE.Vector3(roadX(zAt(0)) + 30, 130, zAt(0) + 110); const e2 = intro * intro * (3 - 2 * intro); chase.lerp(ip, 1 - e2); const il = new THREE.Vector3(roadX(-120), 20, -140); look.lerp(il, 1 - sstep(0.2, 1, intro)); }
    shake *= Math.exp(-dt * 6); if (shake > 0.001 && !reduceMotion) { chase.x += (Math.random() - 0.5) * 0.18 * shake; chase.y += (Math.random() - 0.5) * 0.12 * shake; }
    camera.position.lerp(chase, intro < 1 ? 1 : 1 - Math.exp(-dt * lerp(7, 3.2, dwell))); camLook.lerp(look, intro < 1 ? 1 : 1 - Math.exp(-dt * lerp(8, 3.6, dwell)));
    camRoll += ((reduceMotion ? 0 : lean * 0.55) - camRoll) * (1 - Math.exp(-dt * 3)); camera.up.set(0, Math.cos(camRoll), 0).addScaledVector(fr.r, Math.sin(camRoll)); camera.lookAt(camLook);
    { const fT = (camera.aspect < 1 ? 64 : 52) + clamp((curSpeed - 12) / 18, 0, 1) * 6 + boostAmt * 5; if (Math.abs(camera.fov - fT) > 0.03) { camera.fov += (fT - camera.fov) * (1 - Math.exp(-dt * 3)); camera.updateProjectionMatrix(); } }
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
    if (starT >= 0) { starT += dt; const p = starT / 1.9; if (p >= 1) { starT = -1; star.visible = false; } else { starR.crossVectors(starBase, camera.up).normalize(); starA.copy(starBase).addScaledVector(camera.up, 0.36 - 0.16 * p).addScaledVector(starR, -0.45 + 0.9 * p).normalize(); star.position.copy(camera.position).addScaledVector(starA, 380); star.material.opacity = Math.sin(p * Math.PI) * 0.9; star.material.rotation = -0.18; star.visible = true; } }

    // fireflies
    ray.setFromCamera(mouse, camera); mouseW.copy(ray.ray.origin).addScaledVector(ray.ray.direction, 9);
    const cen = tmp2.copy(bp).addScaledVector(fr.f, 8); cen.y += 1.5;
    if (!fliesInit) { for (let i = 0; i < FN; i++) { ffp[i * 3] = cen.x + (Math.random() - 0.5) * 50; ffp[i * 3 + 1] = cen.y + Math.random() * 6 - 1; ffp[i * 3 + 2] = cen.z + (Math.random() - 0.5) * 50; } fliesInit = true; }
    for (let i = 0; i < FN; i++) { const j = i * 3; const fol = false;
      if (fol) { const ox = mouseW.x + Math.sin(T * 1.3 + i) * 1.4, oy = mouseW.y + Math.cos(T * 1.7 + i * 2) * 0.9, oz = mouseW.z + Math.sin(T * 0.9 + i * 3) * 1.4; ffv[j] += (ox - ffp[j]) * dt * 1.6; ffv[j + 1] += (oy - ffp[j + 1]) * dt * 1.6; ffv[j + 2] += (oz - ffp[j + 2]) * dt * 1.6; }
      else { ffv[j] += Math.sin(T * 0.7 + i) * dt * 0.6; ffv[j + 1] += Math.cos(T * 0.9 + i * 1.3) * dt * 0.4; ffv[j + 2] += Math.sin(T * 0.8 + i * 2.1) * dt * 0.6; }
      ffv[j] *= 0.96; ffv[j + 1] *= 0.96; ffv[j + 2] *= 0.96; ffp[j] += ffv[j] * dt * 4; ffp[j + 1] += ffv[j + 1] * dt * 4; ffp[j + 2] += ffv[j + 2] * dt * 4;
      if (!fol) { if (ffp[j] - cen.x > 28) ffp[j] -= 56; if (ffp[j] - cen.x < -28) ffp[j] += 56; if (ffp[j + 2] - cen.z > 28) ffp[j + 2] -= 56; if (ffp[j + 2] - cen.z < -28) ffp[j + 2] += 56; const gy2 = hFast(ffp[j], ffp[j + 2]); if (ffp[j + 1] < gy2 + 0.3) ffp[j + 1] = gy2 + 0.3; if (ffp[j + 1] > gy2 + 7) ffp[j + 1] = gy2 + 7; } }
    buddies.forEach((b, k) => { const a = T * (0.32 + k * 0.11) + b.ph, rr = 2.4 + Math.sin(T * 0.5 + b.ph) * 1.1, px = bp.x + Math.cos(a) * rr, pz = bp.z + Math.sin(a) * rr; b.l.position.set(px, hFast(px, pz) + 0.6 + Math.sin(T * 1.3 + b.ph) * 0.35, pz); b.s.position.copy(b.l.position); const pulse = 0.65 + 0.35 * Math.sin(T * 2.2 + b.ph * 3); b.l.intensity = glow * 1.8 * pulse; b.s.material.opacity = glow * 0.9 * pulse; b.s.visible = glow > 0.02; });
    ffg.attributes.position.needsUpdate = true; ffm.opacity = lerp(0.35, 1, glow); ffm.size = lerp(0.22, 0.34, glow);

    const gust = 1 + 0.22 * Math.sin(T * 0.55 + 2) + 0.12 * Math.sin(T * 1.9);
    const wAmt = Math.max(clamp((curSpeed - 2) / 24, 0, 1) * gust, gustNear * 0.85);
    wind.position.copy(bp); wind.rotation.set(0, yaw, 0); wind.visible = wAmt > 0.01 && intro >= 1; streakMat.opacity = wAmt * 0.5;
    if (wind.visible) {
      sdat.forEach((s, i) => { s.z += dt * (curSpeed * 1.8 + 6); if (s.z > 8) { s.z = -30; s.x = (Math.random() - 0.5) * 7; s.y = 0.3 + Math.random() * 3.2; } wO.position.set(s.x, s.y, s.z); wO.rotation.set(0, 0, 0); wO.scale.set(1, 1, s.l * (0.4 + wAmt * 2.4)); wO.updateMatrix(); streaks.setMatrixAt(i, wO.matrix); }); streaks.instanceMatrix.needsUpdate = true;
      ldat.forEach((l, i) => { l.z += dt * (curSpeed * 1.2 + 2); l.r += dt * 4 * l.s; l.y += Math.sin(T * 2 + i) * dt * 0.5; if (l.z > 8) { l.z = -24; l.x = (Math.random() - 0.5) * 9; l.y = Math.random() * 3; } wO.position.set(l.x + Math.sin(T + i) * 0.3, 0.2 + l.y, l.z); wO.rotation.set(l.r, l.r * 0.7, l.r * 0.3); wO.scale.setScalar(wAmt * l.s * 1.4); wO.updateMatrix(); leaves.setMatrixAt(i, wO.matrix); }); leaves.instanceMatrix.needsUpdate = true;
    }
    if (key.castShadow && renderer.shadowMap.enabled && (frameNo % 2 === 1 || frameNo < 4)) renderer.shadowMap.needsUpdate = true;
    postU.time.value = T; postU.night.value = night;
    if (frameNo % 6 === 3) { cullScan(); cullStep(160); cullPass(); }
    if (warm < 2) { if (warm === 0) beginWarm(); warmStep(); if (warm < 2) return; }
    updateRoots();
    renderer.setRenderTarget(postRT); renderer.render(scene, camera);
    const doBloom = tier > 0; postU.bloomAmt.value = doBloom ? lerp(0.4, 0.9, glow) : 0;
    if (doBloom) { fsq.material = brightMat; renderer.setRenderTarget(BL.a); renderer.render(fsScene, postCamB); blurPass(BL.a, BL.b, 1, 0, 1); blurPass(BL.b, BL.a, 0, 1, 1); blurPass(BL.a, BL.b, 1, 0, 2.3); blurPass(BL.b, BL.a, 0, 1, 2.3); }
    postU.focus.value = tier >= 2 && !free && intro >= 1 ? dwell * 0.85 : 0;
    renderer.setRenderTarget(null); renderer.render(postScene, postCam);
    if (!readySent) { readySent = true; opts.onReady && opts.onReady(); }
    if (deferred.length && !deferBusy) { deferBusy = true; const runNext = () => { const fn = deferred.shift(); if (!fn) { deferBusy = false; return; } const saved = seed; seed = 9001 + deferred.length * 131; try { fn(); } catch (err) { console.warn(err); } seed = saved; chunkify(); hookAll(); warmMore(); renderer.shadowMap.needsUpdate = true; if (deferred.length) (window.requestIdleCallback ? requestIdleCallback(runNext, { timeout: 500 }) : setTimeout(runNext, 40)); else { deferBusy = false; warmUp(); } }; setTimeout(runNext, 80); }
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
    teleport(x, z, yaw = 0) { fx = x; fz = z; fh = yaw; fs = 0; },
    regions() { return { jungle: [JUNGLE.x, JUNGLE.z], savanna: [SAVANNA.x, SAVANNA.z], blossom: [BLOSSOM.x, BLOSSOM.z], jpool: [JPOOL.x, JPOOL.z], lagoon: [LAGOON.x, LAGOON.z], peak: [PEAK.x, PEAK.z], trail: [TRAIL.pts[0][0], TRAIL.pts[0][1]], lake: [FLAKE.x, FLAKE.z], cave: [CAVE.x - CDIR.x * 6, CAVE.z - CDIR.z * 6], bridge: [BRIDGE.x, BRIDGE.z], gates: bAt(0.42).slice(0, 2), farm: [FARM.x, FARM.z], yard: [YARD.x, YARD.z], tea: [TEA.x, TEA.z], factory: [FACT.x, FACT.z], springs: [SPRINGS.x, SPRINGS.z], pools: [SPOOLS[4].x, SPOOLS[4].z], canyon: [CANYON.x, CANYON.z], arch: [canyonX(-20), -20], loop: [LOOP.pts[0][0], LOOP.pts[0][1]] }; },
    setStick(x, y) { stickX = clamp(x, -1, 1); stickY = clamp(y, -1, 1); },
    setReducedMotion(v) { reduceMotion = !!v; if (reduceMotion && this.skipIntro) this.skipIntro(); },
    setPaused(p) { paused = !!p; last = performance.now(); },
    setDayPhase(p) { dayForce = p == null ? null : (typeof p === 'string' ? (DAYN[p] ?? 0.5) : ((p % 1) + 1) % 1); if (dayForce !== null) dayPh = dayForce; },
    setDayClock(on) { dayOn = !!on; },
    setWeather(k) { WX.force = k || null; if (!k) WX.next = 1; },
    setSeason(sn) { if (['summer', 'spring', 'autumn', 'winter'].includes(sn)) { season = sn; seasonDirty = true; try { sessionStorage.setItem('ap-season', sn); } catch (e) {} } },
    getLife() { return { season, dayPh, dayMix, region: REG.id, weather: { rain: WX.rain, drizzle: WX.drizzle, snow: WX.snow, dust: WX.dust, storm: WX.stormAmt, mist: WX.mist, wet: WX.wet } }; },
    snapshot() { renderer.setRenderTarget(null); renderer.render(postScene, postCam); return canvas.toDataURL('image/jpeg', 0.92); },
    getMapInfo() { const P = (x, z) => [Math.round(x), Math.round(z)], road = [], coast = [], river = []; for (let z = Z0 + 140; z >= ZEND - 6; z -= 20) road.push(P(roadX(z), z)); for (let z = COAST.zHi; z >= COAST.zLo; z -= 25) coast.push(P(coastX(z), z)); for (let z = RIV.zHi; z >= RIV.zLo; z -= 20) river.push(P(riverX(z), z));
      return { road, coast, river, lake: { x: LAKE.x, z: LAKE.z, r: LAKE.r }, desert: { x: DESERT.x, z: DESERT.z, r: DESERT.r }, meadow: { x: MEADOW.x, z: MEADOW.z, r: MEADOW.r }, fire: { x: FIRE.x, z: FIRE.z }, secrets: SECRET_POS, stops: Array.from({ length: NSTOP + 1 }, (_, i) => { const z = zAt(i / NSTOP); return P(roadX(z), z); }) }; },
    getTier() { return tier; },
    setForceLow(v) { forceLow = !!v; if (forceLow && tier > 0) setTier(0); },
    setHold(active) { if (active && !holdActive) holdT = t; holdActive = active; },
    callDino() { const wasSleepy = curNight && dinoState === 'roam'; if (dinoState === 'roam') { dinoFleeT = 0; dinoSeekLake = false; dinoSeekBike = false; dinoLingerT = 0; dinoState = 'run'; } else if (dinoState === 'jumpoff') { dinoState = 'run'; scene.attach(dino); } dinoReactT = wasSleepy ? 0.9 : 0.5; opts.onDino && opts.onDino('called'); },
    getState() { const distLake = Math.hypot(lastBX - LAKE.x, lastBZ - LAKE.z), water = clamp(1 - distLake / 70, 0, 1);
      const rx = Math.cos(lastYaw), rz = -Math.sin(lastYaw), distFire = Math.hypot(lastBX - FIRE.x, lastBZ - FIRE.z);
      const lakePan = clamp(((LAKE.x - lastBX) * rx + (LAKE.z - lastBZ) * rz) / Math.max(1, distLake), -1, 1), firePan = clamp(((FIRE.x - lastBX) * rx + (FIRE.z - lastBZ) * rz) / Math.max(1, distFire), -1, 1);
      return { x: lastBX, z: lastBZ, yaw: lastYaw, night: curNight, region: REG.w, regionId: REG.id, wx: { rain: WX.rain, drizzle: WX.drizzle, snow: WX.snow, dust: WX.dust, storm: WX.stormAmt }, gust: gustNear, season, dayPh, t: free ? clamp((Z0 - fz) / L, 0, 1) : t, speed: curSpeed, trail: trailMix(free ? fz : zAt(t)), water, lakePan, lakeDist: distLake, firePan, fireDist: distFire }; },
    dispose() { cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); window.removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', onVis); renderer.dispose(); postRT.dispose(); canvas.remove(); }
  };
}
