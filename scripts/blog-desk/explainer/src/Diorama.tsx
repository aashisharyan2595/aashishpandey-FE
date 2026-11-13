import React, { useMemo } from 'react';
import { AbsoluteFill, staticFile, delayRender, continueRender, useCurrentFrame, interpolate, Easing } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Muja, Sneaker, Priya, Exec, Robot } from './kit';

// THE TOY STREET: our signature look (Aashish, 2026-11-13: one unique generator with its own style).
// A three.js toy diorama at night/dawn/day: flat painted colour in three tone steps, black ink outlines (inverted hulls), fog matched to the sky,
// eased camera moves with a slow roll, drifting dust, glowing windows. Our flat SVG cartoon cast stands in the 3D scene: a ground point is
// projected through the same camera, so characters scale and slide with the camera. Technique ideas came from a reference zip (MIT code,
// style study only); all shapes, palettes, characters and framing here are ours.
// Scene data (video JSON scene.toy): {mood, cam:{from:[px,py,pz,lx,ly,lz,roll], to:[...]}, sign, rightSign, rightKind, shopLit, chars:[...]}
//   char: {k: priya|sneaker|muja|exec|robot, x:[x0,x1], z, h, flip, move:[f0,f1], at:[showFrom,showTo], swap:[frame,'exec'], wave:[f0,f1],
//          say:{text,color,at:[f0,f1]}, spoon, grin, happy, hop}

const font = new FontFace('Geist', `url(${staticFile('geist.woff2')}) format('woff2')`, { weight: '100 900' });
const hF = delayRender('font');
font.load().then((x) => { document.fonts.add(x); continueRender(hF); }).catch(() => continueRender(hF));

const W = 1080, H = 1920, FOV = 58;
const INK = '#150a22';
const ease = (f: number, a: number, b: number, x: number, y: number) => interpolate(f, [a, b], [x, y], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.22, 0.61, 0.36, 1) });

type Cam = number[];
const camAt = (f: number, dur: number, c: { from: Cam; to: Cam }) => {
  const k = (i: number) => ease(f, 0, dur, c.from[i] ?? 0, c.to[i] ?? c.from[i] ?? 0);
  return { pos: new THREE.Vector3(k(0), k(1), k(2)), look: new THREE.Vector3(k(3), k(4), k(5)), roll: k(6) };
};
const DEFCAM = { from: [-1.2, 6.2, 19, 0, 4.2, 0, 0.05], to: [0.3, 3.4, 13, 0.1, 2.9, 0, -0.02] };
const project = (cam: ReturnType<typeof camAt>, p: THREE.Vector3) => {
  const c = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 200);
  c.position.copy(cam.pos); c.lookAt(cam.look); c.rotation.z += cam.roll; c.updateMatrixWorld(); c.updateProjectionMatrix();
  const v = p.clone().project(c), dist = cam.pos.distanceTo(p);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, ppm: (H / 2) / (Math.tan((FOV * Math.PI) / 360) * dist) };
};

const toonGradient = (() => { const d = new Uint8Array([70, 70, 70, 255, 150, 150, 150, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const Toon: React.FC<{ c: string; emissive?: boolean }> = ({ c, emissive }) => emissive ? <meshBasicMaterial color={c} /> : <meshToonMaterial color={c} gradientMap={toonGradient} />;

const Block: React.FC<{ p: [number, number, number]; s: [number, number, number]; c: string; ink?: number; emissive?: boolean; r?: [number, number, number] }> = ({ p, s, c, ink = 0.06, emissive, r }) => (
  <group position={p} rotation={r || [0, 0, 0]}>
    <mesh><boxGeometry args={s} /><Toon c={c} emissive={emissive} /></mesh>
    <mesh scale={[1 + (ink * 2) / s[0], 1 + (ink * 2) / s[1], 1 + (ink * 2) / s[2]]}><boxGeometry args={s} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
  </group>
);
const Cyl: React.FC<{ p: [number, number, number]; r: number; h: number; c: string }> = ({ p, r, h, c }) => (
  <group position={p}>
    <mesh><cylinderGeometry args={[r, r, h, 14]} /><Toon c={c} /></mesh>
    <mesh scale={[1.12, 1.03, 1.12]}><cylinderGeometry args={[r, r, h, 14]} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
  </group>
);

const textTex = (lines: string[], bg: string, fg: string, w = 1024, h = 256) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d')!;
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = Math.floor(h / (lines.length + 0.5)); g.font = `900 ${fs}px Geist, sans-serif`;
  const wide = Math.max(...lines.map((l) => g.measureText(l).width)); if (wide > w * 0.9) { fs = Math.floor((fs * w * 0.9) / wide); g.font = `900 ${fs}px Geist, sans-serif`; }
  lines.forEach((l, i) => g.fillText(l, w / 2, (h / (lines.length + 1)) * (i + 1)));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const Sign: React.FC<{ p: [number, number, number]; s: [number, number]; lines: string[]; bg: string; fg: string }> = ({ p, s, lines, bg, fg }) => {
  const t = useMemo(() => textTex(lines, bg, fg), [lines.join('|'), bg, fg]);
  return <group position={p}><mesh position={[0, 0, 0.08]}><planeGeometry args={s} /><meshBasicMaterial map={t} /></mesh><Block p={[0, 0, -0.04]} s={[s[0] + 0.16, s[1] + 0.16, 0.12]} c="#2b2147" ink={0.04} /></group>;
};

const MOODS: Record<string, { sky: string[]; fog: string; hemi: [string, string, number]; key: [string, number]; ground: string; kerb: string; sun?: [string, number, number]; glow: number }> = {
  night: { sky: ['#171a4a', '#3a2f7a', '#c4577a', '#ffa56b'], fog: '#b0527f', hemi: ['#9fa8ff', '#5b3d78', 1.1], key: ['#ffc48a', 2.4], ground: '#35306a', kerb: '#6a5fae', sun: ['#ffe9b8', 15, -50], glow: 1 },
  dawn: { sky: ['#3d4a9c', '#9a5aa8', '#ff8f7a', '#ffd9a0'], fog: '#f0a08a', hemi: ['#ffd0b0', '#6a4d8a', 1.2], key: ['#ffb870', 2.7], ground: '#5a4a8a', kerb: '#9a82c8', sun: ['#fff0c0', 7, -50], glow: 0.7 },
  day: { sky: ['#4f9cf0', '#8cc4ff', '#cfe8ff', '#eef8ff'], fog: '#cfe6ff', hemi: ['#dcecff', '#8a7bb0', 1.3], key: ['#fff4d0', 2.6], ground: '#8a86c8', kerb: '#c8c0f0', glow: 0.15 },
};
const skyOf = (m: string) => { const c = document.createElement('canvas'); c.width = 8; c.height = 512; const g = c.getContext('2d')!, gr = g.createLinearGradient(0, 0, 0, 512), s = MOODS[m].sky; s.forEach((col, i) => gr.addColorStop(i / (s.length - 1), col)); g.fillStyle = gr; g.fillRect(0, 0, 8, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };

const Windows: React.FC<{ x0: number; y0: number; z: number; cols: number; rows: number; dx: number; dy: number; lit: number; seed: number; dim?: boolean }> = ({ x0, y0, z, cols, rows, dx, dy, lit, seed, dim }) => (
  <group>{Array.from({ length: cols * rows }).map((_, i) => {
    const cx = i % cols, cy = Math.floor(i / cols), on = ((i * 37 + seed * 11) % 10) / 10 < lit;
    return <mesh key={i} position={[x0 + cx * dx, y0 + cy * dy, z]}><planeGeometry args={[dx * 0.5, dy * 0.55]} /><meshBasicMaterial color={on ? (dim ? '#e8d9a8' : '#ffd27a') : (dim ? '#7aa0d8' : '#3a3a78')} /></mesh>;
  })}</group>
);
const Lamp: React.FC<{ x: number; z: number; t: number; on: number }> = ({ x, z, t, on }) => (
  <group position={[x, 0, z]}>
    <Cyl p={[0, 2.4, 0]} r={0.09} h={4.8} c="#2b2147" />
    <Block p={[0.35, 4.8, 0]} s={[0.9, 0.12, 0.12]} c="#2b2147" ink={0.03} />
    <mesh position={[0.7, 4.55, 0]}><sphereGeometry args={[0.28, 16, 12]} /><meshBasicMaterial color={on > 0.3 ? '#fff0b0' : '#b8b0c8'} /></mesh>
    {on > 0.3 && <mesh position={[0.7, 4.55, 0]}><sphereGeometry args={[0.55 + Math.sin(t * 3 + x) * 0.03, 16, 12]} /><meshBasicMaterial color="#ffd27a" transparent opacity={0.28 * on} /></mesh>}
  </group>
);

const World: React.FC<{ f: number; toy: any }> = ({ f, toy }) => {
  const t = f / 30, M = MOODS[toy.mood || 'night'], lit = toy.shopLit ?? 1, signL: string[] = toy.sign || ["PRIYA'S SHOP"], rsL: string[] = toy.rightSign || ['WEB SERVER'], rk = toy.rightKind || 'server';
  const back = useMemo(() => Array.from({ length: 9 }).map((_, i) => ({ x: -26 + i * 6.6, h: 7 + ((i * 53) % 9), w: 5 + ((i * 17) % 3), c: ['#4a3f93', '#5a4aa6', '#3c3880', '#6a4f9e'][i % 4], z: -16 - ((i * 7) % 5) })), []);
  const dust = useMemo(() => Array.from({ length: 36 }).map((_, i) => ({ x: ((i * 97) % 40) - 20, y: 0.5 + ((i * 53) % 90) / 10, z: -4 + ((i * 31) % 18), s: 0.04 + ((i * 13) % 5) / 90 })), []);
  const dim = toy.mood === 'day';
  return (<>
    <hemisphereLight args={[M.hemi[0], M.hemi[1], M.hemi[2]]} />
    <directionalLight position={[-6, 9, 8]} intensity={M.key[1]} color={M.key[0]} />
    <fog attach="fog" args={[M.fog, 28, 74]} />
    {M.sun && <mesh position={[toy.mood === 'dawn' ? -8 : 0, M.sun[1], M.sun[2]]}><circleGeometry args={[6, 40]} /><meshBasicMaterial color={M.sun[0]} /></mesh>}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]}><planeGeometry args={[120, 60]} /><meshToonMaterial color={M.ground} gradientMap={toonGradient} /></mesh>
    <Block p={[0, 0.09, -2.6]} s={[60, 0.18, 4.4]} c={M.kerb} ink={0.03} />
    {[-14, -8, -2, 4, 10, 16].map((x) => <Block key={x} p={[x, 0.01, 5]} s={[3, 0.03, 0.35]} c="#e8e0ff" ink={0} emissive />)}
    {back.map((b, i) => <group key={i}><Block p={[b.x, b.h / 2, b.z]} s={[b.w, b.h, 4]} c={b.c} ink={0.1} /><Windows x0={b.x - b.w / 2 + 0.9} y0={1.4} z={b.z + 2.02} cols={Math.max(2, Math.floor(b.w / 1.4))} rows={Math.floor((b.h - 1) / 1.8)} dx={1.3} dy={1.8} lit={0.45 * M.glow + 0.1} seed={i} dim={dim} /></group>)}
    <group scale={0.58} position={[1.3, 0, 0]}>
      <Block p={[-6.2, 3.6, -2.6]} s={[6.4, 7.2, 4.4]} c="#f08a6a" />
      <Block p={[-6.2, 7.5, -2.6]} s={[6.8, 0.5, 4.8]} c="#7a3f78" ink={0.05} />
      <Block p={[-6.2, 3.1, -0.28]} s={[4.6, 3.0, 0.2]} c={lit > 0.5 ? '#ffd27a' : '#6a5a8a'} emissive ink={0.05} />
      {[-7.4, -6.2, -5.0].map((x) => <Block key={x} p={[x, 1.6, -0.2]} s={[0.9, 1.4, 0.16]} c={lit > 0.5 ? '#fff0b0' : '#8a7aa8'} emissive ink={0.03} />)}
      <Block p={[-6.2, 4.4, 0.1]} s={[5.4, 0.45, 1.5]} c="#e8484f" ink={0.05} r={[0.28, 0, 0]} />
      <Sign p={[-6.2, 5.6, -0.3]} s={[4.6, 1.15]} lines={signL} bg="#fff4d8" fg="#2b2147" />
    </group>
    <group scale={0.5} position={[-1.5, 0, 0]}>
      <Block p={[7.4, 5.4, -3.2]} s={[4.6, 10.8, 4.2]} c={rk === 'server' ? '#4b5dc9' : '#5a8fd8'} />
      {rk === 'server' ? <>
        {[2, 4, 6, 8].map((y) => <Block key={y} p={[7.4, y + 0.6, -1.06]} s={[3.8, 0.34, 0.12]} c="#2b2147" ink={0.03} />)}
        {[2, 4, 6, 8].map((y, i) => <mesh key={y} position={[6.2, y + 0.6, -0.96]}><sphereGeometry args={[0.1, 10, 8]} /><meshBasicMaterial color={(Math.floor(t * 4) + i) % 3 === 0 ? '#ff5a5f' : '#3de0b5'} /></mesh>)}
      </> : <Windows x0={6} y0={3} z={-1.05} cols={3} rows={4} dx={1.2} dy={1.9} lit={0.5 * M.glow + 0.15} seed={4} dim={dim} />}
      <Block p={[7.4, 1.5, -1.06]} s={[1.7, 2.8, 0.14]} c="#13c9a8" emissive ink={0.05} />
      <Sign p={[7.4, 10.3, -1.0]} s={[3.8, 0.9]} lines={rsL} bg="#1a1f55" fg="#7dffe0" />
      <Cyl p={[7.4, 11.8, -3.2]} r={0.07} h={2.2} c="#2b2147" />
      <mesh position={[7.4, 13, -3.2]}><sphereGeometry args={[0.2, 12, 10]} /><meshBasicMaterial color={Math.floor(t * 2) % 2 ? '#ff5a5f' : '#ffd27a'} /></mesh>
    </group>
    <Lamp x={-0.6} z={-0.6} t={t} on={M.glow} /><Lamp x={4.2} z={-0.6} t={t} on={M.glow} />
    {dust.map((d, i) => <mesh key={i} position={[d.x + Math.sin(t * 0.6 + i) * 0.5, d.y + Math.sin(t * 0.9 + i * 2) * 0.35, d.z]}><sphereGeometry args={[d.s, 6, 5]} /><meshBasicMaterial color="#ffe6a8" transparent opacity={0.8 * Math.max(0.25, M.glow)} /></mesh>)}
  </>);
};

const Rig: React.FC<{ cam: ReturnType<typeof camAt> }> = ({ cam }) => {
  const { camera } = useThree();
  camera.position.copy(cam.pos); camera.lookAt(cam.look); camera.rotation.z += cam.roll; camera.updateProjectionMatrix();
  return null;
};

const Spoon: React.FC = () => (<g transform="translate(70 -330) rotate(25)"><rect x={-7} y={-150} width={14} height={170} rx={7} fill="#c9ccd6" stroke="#150a22" strokeWidth={5} /><ellipse cx={0} cy={-170} rx={34} ry={44} fill="#dfe2ea" stroke="#150a22" strokeWidth={5} /></g>);

const Char: React.FC<{ f: number; cam: ReturnType<typeof camAt>; c: any }> = ({ f, cam, c }) => {
  const [m0, m1] = c.move || [0, 1], xs = c.x || [0, 0], x = ease(f, m0, m1, xs[0], xs[1]);
  if (c.at && (f < c.at[0] || f > c.at[1])) return null;
  const kind = c.swap && f >= c.swap[0] ? c.swap[1] : c.k, moving = f > m0 && f < m1 && xs[0] !== xs[1], t = f / 30;
  const p = project(cam, new THREE.Vector3(x, 0.18, c.z ?? 1)), h = c.h ?? 2.5, k = (h * p.ppm) / 620, wave = c.wave && f >= c.wave[0] && f <= c.wave[1] ? 1 : 0;
  const dir = xs[1] < xs[0] ? -1 : 1, flip = c.flip ?? (moving && dir < 0);
  const pop = c.at ? ease(f, c.at[0], c.at[0] + 6, 0.6, 1) : 1, sc = k * pop;
  const body = kind === 'priya' ? <><Priya wave={wave} look={0.5} smile={c.happy ?? 1} walk={moving ? t * 8 : 0} />{c.spoon && <Spoon />}</>
    : kind === 'sneaker' ? <Sneaker walk={moving ? t * 8 : 0} grin={c.grin ?? 0.4} look={1} />
    : kind === 'exec' ? <Exec carry={!!c.carry} mood={c.happy ?? 0.4} look={0.3} />
    : kind === 'robot' ? <Robot t={t} happy={c.happy ?? 1} arm={wave ? 0.8 : 0.3} />
    : <Muja t={t} walk={moving ? t * 10 : 0} happy={c.happy ?? 1} look={0.9} wave={wave} hop={c.hop ? 0.5 : 0} />;
  const s = c.say && f >= c.say.at[0] && f <= c.say.at[1] ? c.say : null;
  const bw = s ? Math.max(170, s.text.length * 30 + 70) : 0, bx = s ? Math.min(W - 20 - bw / 2, Math.max(20 + bw / 2, p.x)) : 0, by = p.y - h * p.ppm - 90;
  const bp = s ? ease(f, s.at[0], s.at[0] + 5, 0.3, 1) : 0;
  return <>
    <svg width={640} height={720} viewBox="0 0 640 720" style={{ position: 'absolute', left: p.x - 320 * sc, top: p.y - 690 * sc, transform: `scale(${flip ? -sc : sc}, ${sc})`, transformOrigin: '320px 690px', overflow: 'visible' }}><g transform="translate(320 690)">{body}</g></svg>
    {s && <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}><g transform={`translate(${bx} ${by}) scale(${bp})`}><rect x={-bw / 2} y={-46} width={bw} height={88} rx={32} fill="#fff" stroke={s.color || '#7b6cff'} strokeWidth={6} /><path d={`M${p.x - bx - 18},40 L${p.x - bx},72 L${p.x - bx + 18},40 Z`} fill="#fff" stroke={s.color || '#7b6cff'} strokeWidth={6} strokeLinejoin="round" /><rect x={p.x - bx - 22} y={32} width={44} height={12} fill="#fff" /><text x={0} y={16} textAnchor="middle" fontWeight={900} fontSize={46} fill={s.color || '#7b6cff'} fontFamily="Geist">{s.text}</text></g></svg>}
  </>;
};

// one shot of the toy street. f = frame inside the shot, dur = shot length in frames
export const ToyShot: React.FC<{ f: number; dur: number; toy: any }> = ({ f, dur, toy }) => {
  const cam = camAt(f, dur, toy.cam || DEFCAM), mood = toy.mood || 'night';
  const sky = useMemo(() => skyOf(mood), [mood]);
  return (
    <AbsoluteFill style={{ background: MOODS[mood].sky[0] }}>
      <ThreeCanvas width={W} height={H} camera={{ fov: FOV, near: 0.1, far: 200, position: [0, 4, 15] }} onCreated={({ scene }) => { scene.background = sky; }} gl={{ antialias: true }}>
        <Rig cam={cam} /><World f={f} toy={toy} />
      </ThreeCanvas>
      {(toy.chars || []).map((c: any, i: number) => <Char key={i} f={f} cam={cam} c={c} />)}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(10,6,30,.42) 100%)', pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};

// the 5-second look test (composition "Diorama")
const DEMO = { mood: 'night', chars: [
  { k: 'priya', x: [-0.9, -0.9], z: 0.9, h: 2.4, wave: [60, 150] },
  { k: 'sneaker', x: [3.0, 1.5], z: 1.6, h: 2.5, move: [20, 140], grin: 1 },
  { k: 'muja', x: [-5.8, -2.8], z: 3.4, h: 2.0, move: [70, 95], wave: [95, 150] },
] };
export const Diorama: React.FC = () => { const f = useCurrentFrame(); return <ToyShot f={f} dur={150} toy={DEMO} />; };
