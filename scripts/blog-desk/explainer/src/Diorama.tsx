import React, { useMemo } from 'react';
import { AbsoluteFill, staticFile, delayRender, continueRender, useCurrentFrame, interpolate, Easing } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Muja, Sneaker, Priya } from './kit';

// "Toy night street" diorama, our own look (Aashish, 2026-11-13: three.js, a reference zip for technique only, own style).
// Technique ideas taken from the reference: painted flat colour, black ink outlines on 3D shapes (inverted hull), fog = horizon colour,
// camera glides with ease-out and a slow roll, lit characters. Everything here (shapes, palette, characters, framing) is ours.
// Characters are our existing flat SVG cartoons, placed in the 3D scene by projecting a ground point through the same camera.

const font = new FontFace('Geist', `url(${staticFile('geist.woff2')}) format('woff2')`, { weight: '100 900' });
const hF = delayRender('font');
font.load().then((x) => { document.fonts.add(x); continueRender(hF); }).catch(() => continueRender(hF));

const W = 1080, H = 1920, FOV = 58;
const INK = '#150a22';
const ease = (f: number, a: number, b: number, x: number, y: number) => interpolate(f, [a, b], [x, y], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.22, 0.61, 0.36, 1) });

// the camera, shared by the 3D scene and the character overlay
export const camAt = (f: number) => ({
  pos: new THREE.Vector3(ease(f, 0, 150, -1.2, 0.3), ease(f, 0, 150, 6.2, 3.4), ease(f, 0, 150, 19, 13)),
  look: new THREE.Vector3(ease(f, 0, 150, 0, 0.1), ease(f, 0, 150, 4.2, 2.9), 0),
  roll: ease(f, 0, 150, 0.05, -0.02),
});
const project = (f: number, p: THREE.Vector3) => {
  const c = camAt(f), cam = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 200);
  cam.position.copy(c.pos); cam.lookAt(c.look); cam.rotation.z += c.roll; cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const v = p.clone().project(cam), dist = c.pos.distanceTo(p);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, ppm: (H / 2) / (Math.tan((FOV * Math.PI) / 360) * dist) }; // ppm = pixels per metre at that depth
};

const toonGradient = (() => { const d = new Uint8Array([70, 70, 70, 255, 150, 150, 150, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const Toon: React.FC<{ c: string; emissive?: boolean }> = ({ c, emissive }) => emissive ? <meshBasicMaterial color={c} /> : <meshToonMaterial color={c} gradientMap={toonGradient} />;

// one painted block with an ink outline (back-face hull, slightly larger)
const Block: React.FC<{ p: [number, number, number]; s: [number, number, number]; c: string; ink?: number; emissive?: boolean; r?: [number, number, number] }> = ({ p, s, c, ink = 0.06, emissive, r }) => (
  <group position={p} rotation={r || [0, 0, 0]}>
    <mesh><boxGeometry args={s} /><Toon c={c} emissive={emissive} /></mesh>
    <mesh scale={[1 + (ink * 2) / s[0], 1 + (ink * 2) / s[1], 1 + (ink * 2) / s[2]]}><boxGeometry args={s} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
  </group>
);
const Cyl: React.FC<{ p: [number, number, number]; r: number; h: number; c: string; emissive?: boolean }> = ({ p, r, h, c, emissive }) => (
  <group position={p}>
    <mesh><cylinderGeometry args={[r, r, h, 14]} /><Toon c={c} emissive={emissive} /></mesh>
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
  const t = useMemo(() => textTex(lines, bg, fg), []);
  return <group position={p}><mesh position={[0, 0, 0.08]}><planeGeometry args={s} /><meshBasicMaterial map={t} /></mesh><Block p={[0, 0, -0.04]} s={[s[0] + 0.16, s[1] + 0.16, 0.12]} c="#2b2147" ink={0.04} /></group>;
};

const skyTex = (() => {
  const c = document.createElement('canvas'); c.width = 8; c.height = 512; const g = c.getContext('2d')!, gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#171a4a'); gr.addColorStop(0.45, '#3a2f7a'); gr.addColorStop(0.78, '#c4577a'); gr.addColorStop(1, '#ffa56b'); g.fillStyle = gr; g.fillRect(0, 0, 8, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();

const Windows: React.FC<{ x0: number; y0: number; z: number; cols: number; rows: number; dx: number; dy: number; lit: number; seed: number }> = ({ x0, y0, z, cols, rows, dx, dy, lit, seed }) => (
  <group>{Array.from({ length: cols * rows }).map((_, i) => {
    const cx = i % cols, cy = Math.floor(i / cols), on = ((i * 37 + seed * 11) % 10) / 10 < lit;
    return <mesh key={i} position={[x0 + cx * dx, y0 + cy * dy, z]}><planeGeometry args={[dx * 0.5, dy * 0.55]} /><meshBasicMaterial color={on ? '#ffd27a' : '#3a3a78'} /></mesh>;
  })}</group>
);

const Lamp: React.FC<{ x: number; z: number; t: number }> = ({ x, z, t }) => (
  <group position={[x, 0, z]}>
    <Cyl p={[0, 2.4, 0]} r={0.09} h={4.8} c="#2b2147" />
    <Block p={[0.35, 4.8, 0]} s={[0.9, 0.12, 0.12]} c="#2b2147" ink={0.03} />
    <mesh position={[0.7, 4.55, 0]}><sphereGeometry args={[0.28, 16, 12]} /><meshBasicMaterial color="#fff0b0" /></mesh>
    <mesh position={[0.7, 4.55, 0]}><sphereGeometry args={[0.55 + Math.sin(t * 3 + x) * 0.03, 16, 12]} /><meshBasicMaterial color="#ffd27a" transparent opacity={0.28} /></mesh>
  </group>
);

const World: React.FC<{ f: number }> = ({ f }) => {
  const t = f / 30;
  const back = useMemo(() => Array.from({ length: 9 }).map((_, i) => ({ x: -26 + i * 6.6, h: 7 + ((i * 53) % 9), w: 5 + ((i * 17) % 3), c: ['#4a3f93', '#5a4aa6', '#3c3880', '#6a4f9e'][i % 4], z: -16 - ((i * 7) % 5) })), []);
  const dust = useMemo(() => Array.from({ length: 36 }).map((_, i) => ({ x: ((i * 97) % 40) - 20, y: 0.5 + ((i * 53) % 90) / 10, z: -4 + ((i * 31) % 18), s: 0.04 + ((i * 13) % 5) / 90 })), []);
  return (<>
    <hemisphereLight args={['#9fa8ff', '#5b3d78', 1.1]} />
    <directionalLight position={[-6, 9, 8]} intensity={2.4} color="#ffc48a" />
    <fog attach="fog" args={['#b0527f', 28, 74]} />
    <mesh position={[0, 15, -50]}><circleGeometry args={[6, 40]} /><meshBasicMaterial color="#ffe9b8" /></mesh>
    {/* ground: road, pavement, kerb */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]}><planeGeometry args={[120, 60]} /><meshToonMaterial color="#35306a" gradientMap={toonGradient} /></mesh>
    <Block p={[0, 0.09, -2.6]} s={[60, 0.18, 4.4]} c="#6a5fae" ink={0.03} />
    {[-14, -8, -2, 4, 10, 16].map((x) => <Block key={x} p={[x, 0.01, 5]} s={[3, 0.03, 0.35]} c="#e8e0ff" ink={0} emissive />)}
    {/* background skyline */}
    {back.map((b, i) => <group key={i}><Block p={[b.x, b.h / 2, b.z]} s={[b.w, b.h, 4]} c={b.c} ink={0.1} /><Windows x0={b.x - b.w / 2 + 0.9} y0={1.4} z={b.z + 2.02} cols={Math.max(2, Math.floor(b.w / 1.4))} rows={Math.floor((b.h - 1) / 1.8)} dx={1.3} dy={1.8} lit={0.45} seed={i} /></group>)}
    {/* Priya's shop */}
    <group scale={0.58} position={[1.3, 0, 0]}>
    <Block p={[-6.2, 3.6, -2.6]} s={[6.4, 7.2, 4.4]} c="#f08a6a" />
    <Block p={[-6.2, 7.5, -2.6]} s={[6.8, 0.5, 4.8]} c="#7a3f78" ink={0.05} />
    <Block p={[-6.2, 3.1, -0.28]} s={[4.6, 3.0, 0.2]} c="#ffd27a" emissive ink={0.05} />
    {[-7.4, -6.2, -5.0].map((x) => <Block key={x} p={[x, 1.6, -0.2]} s={[0.9, 1.4, 0.16]} c="#fff0b0" emissive ink={0.03} />)}
    <Block p={[-6.2, 4.4, 0.1]} s={[5.4, 0.45, 1.5]} c="#e8484f" ink={0.05} r={[0.28, 0, 0]} />
    <Sign p={[-6.2, 5.6, -0.3]} s={[4.6, 1.15]} lines={["PRIYA'S SHOP"]} bg="#fff4d8" fg="#2b2147" />
    </group>
    {/* the server tower */}
    <group scale={0.5} position={[-1.5, 0, 0]}>
    <Block p={[7.4, 5.4, -3.2]} s={[4.6, 10.8, 4.2]} c="#4b5dc9" />
    {[2, 4, 6, 8].map((y) => <Block key={y} p={[7.4, y + 0.6, -1.06]} s={[3.8, 0.34, 0.12]} c="#2b2147" ink={0.03} />)}
    {[2, 4, 6, 8].map((y, i) => <mesh key={y} position={[6.2, y + 0.6, -0.96]}><sphereGeometry args={[0.1, 10, 8]} /><meshBasicMaterial color={(Math.floor(t * 4) + i) % 3 === 0 ? '#ff5a5f' : '#3de0b5'} /></mesh>)}
    <Block p={[7.4, 1.5, -1.06]} s={[1.7, 2.8, 0.14]} c="#13c9a8" emissive ink={0.05} />
    <Sign p={[7.4, 10.3, -1.0]} s={[3.8, 0.9]} lines={['WEB SERVER']} bg="#1a1f55" fg="#7dffe0" />
    <Cyl p={[7.4, 11.8, -3.2]} r={0.07} h={2.2} c="#2b2147" />
    <mesh position={[7.4, 13, -3.2]}><sphereGeometry args={[0.2, 12, 10]} /><meshBasicMaterial color={Math.floor(t * 2) % 2 ? '#ff5a5f' : '#ffd27a'} /></mesh>
    </group>
    <Lamp x={-0.6} z={-0.6} t={t} /><Lamp x={4.2} z={-0.6} t={t} />
    {/* drifting dust and fireflies */}
    {dust.map((d, i) => <mesh key={i} position={[d.x + Math.sin(t * 0.6 + i) * 0.5, d.y + Math.sin(t * 0.9 + i * 2) * 0.35, d.z]}><sphereGeometry args={[d.s, 6, 5]} /><meshBasicMaterial color="#ffe6a8" transparent opacity={0.8} /></mesh>)}
  </>);
};

const Rig: React.FC<{ f: number }> = ({ f }) => {
  const { camera } = useThree(); const c = camAt(f);
  camera.position.copy(c.pos); camera.lookAt(c.look); camera.rotation.z += c.roll; camera.updateProjectionMatrix();
  return null;
};

const Char: React.FC<{ f: number; at: [number, number, number]; h: number; flip?: boolean; children: React.ReactNode }> = ({ f, at, h, flip, children }) => {
  const p = project(f, new THREE.Vector3(...at)), k = (h * p.ppm) / 620;
  return <svg width={640} height={720} viewBox="0 0 640 720" style={{ position: 'absolute', left: p.x - 320 * k, top: p.y - 690 * k, transform: `scale(${flip ? -k : k}, ${k})`, transformOrigin: '320px 690px', overflow: 'visible' }}><g transform="translate(320 690)">{children}</g></svg>;
};

// 5-second test: the stranger sneaks toward the server while Priya waves, Muja pops in with a worried look
export const Diorama: React.FC = () => {
  const f = useCurrentFrame(), t = f / 30;
  const sx = ease(f, 20, 140, 3.0, 1.5), mj = ease(f, 70, 95, 1, 0);
  return (
    <AbsoluteFill style={{ background: '#171a4a' }}>
      <ThreeCanvas width={W} height={H} camera={{ fov: FOV, near: 0.1, far: 200, position: [0, 4, 15] }} onCreated={({ scene }) => { scene.background = skyTex; }} gl={{ antialias: true }}>
        <Rig f={f} /><World f={f} />
      </ThreeCanvas>
      <Char f={f} at={[-0.9, 0.18, 0.9]} h={2.4}><Priya wave={f > 60 ? 1 : 0} look={0.4} smile={f > 60 ? 1 : 0.6} /></Char>
      <Char f={f} at={[sx, 0.18, 1.6]} h={2.5} flip><Sneaker walk={t * 1.6} grin={f > 100 ? 1 : 0.3} look={1} /></Char>
      <Char f={f} at={[-2.8 - mj * 3, 0.18, 3.4]} h={2.0}><Muja t={t} happy={f > 100 ? 0.6 : 1} look={0.9} wave={f > 95 ? 1 : 0} /></Char>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(10,6,30,.42) 100%)', pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
