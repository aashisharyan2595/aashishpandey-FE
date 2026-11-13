import React from 'react';
import { AbsoluteFill, staticFile, delayRender, continueRender } from 'remotion';
import { C, Muja, Sneaker, Server, Priya, Exec, Robot, Icon, Shield } from './kit';

// Click-worthy thumbnails (Aashish, 2026-11-13: "look at proper thumbnails"). Rules from YouTube/creator guidance:
// one focal point, a big expressive character, 2-4 huge words that add to the title instead of repeating it,
// strong contrast that still reads at phone size (168x94), nothing important in the bottom-right corner (timestamp).
// Data: video JSON "posters": [{ bg, side, text: ["LINE", "LINE"], hi, art: [elements] }]
// art elements are drawn in a 640x720 box (feet on y=690); the wide 1280x720 version puts the box on `side`,
// the Shorts 1080x1920 version scales it up under the words.

const font = new FontFace('Geist', `url(${staticFile('geist.woff2')}) format('woff2')`, { weight: '100 900' });
const hF = delayRender('font');
font.load().then((x) => { document.fonts.add(x); continueRender(hF); });

const BG: Record<string, [string, string]> = {
  red: ['#ff5a5f', '#9c1f3a'], navy: ['#3a4790', '#121736'], purple: ['#8b78ff', '#36246e'], teal: ['#21c7a8', '#0b4f5e'],
  yellow: ['#ffd84d', '#ff8a3d'], blue: ['#4fb3ff', '#1b3f9c'], dark: ['#3b3f58', '#0e1020'],
};
const T: React.FC<{ x: number; y: number; s: number; c?: string; children: React.ReactNode; a?: 'middle' | 'start' }> = ({ x, y, s, c = C.ink, children, a = 'middle' }) =>
  <text x={x} y={y} textAnchor={a} fontWeight={900} fontSize={s} fill={c} fontFamily="Geist">{children}</text>;

const Cloud: React.FC = () => (<g>
  <ellipse cx={0} cy={0} rx={190} ry={110} fill="#6d7391" /><ellipse cx={-120} cy={30} rx={120} ry={85} fill="#7a809e" /><ellipse cx={130} cy={30} rx={130} ry={85} fill="#7a809e" /><ellipse cx={0} cy={50} rx={200} ry={70} fill="#7a809e" />
  <path d="M-70,-10 l40,40 M-30,-10 l-40,40 M40,-10 l40,40 M80,-10 l-40,40" stroke={C.ink} strokeWidth={14} strokeLinecap="round" />
  <path d="M-50,90 Q0,55 50,90" stroke={C.ink} strokeWidth={12} fill="none" strokeLinecap="round" />
</g>);
const Building: React.FC = () => (<g>
  <rect x={0} y={0} width={300} height={560} rx={16} fill="#3b4a8a" />
  {Array.from({ length: 15 }).map((_, i) => <rect key={i} x={30 + (i % 3) * 90} y={40 + Math.floor(i / 3) * 90} width={64} height={52} rx={8} fill={(i * 7) % 5 === 0 ? C.yellow : '#7fb2ff'} />)}
  <rect x={110} y={460} width={80} height={100} rx={10} fill="#26305e" />
</g>);

const El: React.FC<{ e: any }> = ({ e }) => {
  const { x = 320, y = 690, s = 1, r = 0, flip } = e, sx = flip ? -s : s;
  const at = (ch: React.ReactNode) => <g transform={`translate(${x} ${y}) rotate(${r}) scale(${sx} ${s})`}>{ch}</g>;
  switch (e.c) {
    case 'glow': return <circle cx={x} cy={y} r={e.rad || 300} fill="url(#glow)" />;
    case 'muja': return at(<Muja t={1.3} happy={e.happy ?? 1} look={e.look ?? 0.5} wave={e.wave ? 1 : 0} wear={e.wear || ''} hold={e.hold || ''} signText={e.sign || 'YES'} />);
    case 'sneaker': return at(<Sneaker walk={0} grin={e.grin ?? 1} look={e.look ?? 1} />);
    case 'server': return at(<Server doorOpen={e.door ?? 1} t={0.4} alarm={e.alarm ? 1 : 0} />);
    case 'priya': return at(<Priya smile={e.smile ?? 1} look={e.look ?? 0.6} wave={e.wave ? 1 : 0} />);
    case 'exec': return at(<Exec carry={!!e.carry} mood={e.mood ?? 0} look={e.look ?? 0} />);
    case 'robot': return at(<Robot t={0.6} happy={e.happy ?? 1} arm={e.arm ?? 0.6} />);
    case 'icon': return at(<Icon k={e.k} />);
    case 'shield': return at(<Shield check={1} />);
    case 'cloud': return at(<Cloud />);
    case 'building': return at(<Building />);
    case 'rain': return <g>{Array.from({ length: 18 }).map((_, i) => <path key={i} d={`M${x - 200 + (i * 47) % 420},${y + (i * 83) % 260} l-12,40`} stroke="#9fb4ff" strokeWidth={7} strokeLinecap="round" />)}</g>;
    case 'stamp': return at(<g><rect x={-230} y={-70} width={460} height={140} rx={18} fill="none" stroke={e.color || C.red} strokeWidth={14} /><T x={0} y={32} s={e.fs || 92} c={e.color || C.red}>{e.text}</T></g>);
    case 'tag': return at(<g><path d="M-170,-80 L130,-80 L200,0 L130,80 L-170,80 Z" fill={C.yellow} stroke="#fff" strokeWidth={10} /><circle cx={120} cy={0} r={16} fill="#fff" /><T x={-30} y={34} s={e.fs || 100}>{e.text}</T></g>);
    case 'card': { const w = e.w || 420, h = e.h || 230; return at(<g><rect x={-w / 2} y={-h / 2 + 12} width={w} height={h} rx={30} fill="rgba(0,0,0,.25)" /><rect x={-w / 2} y={-h / 2} width={w} height={h} rx={30} fill="#fff" /><T x={0} y={(e.sub ? 10 : 36)} s={e.fs || 120} c={e.color || C.ink}>{e.text}</T>{e.sub && <T x={0} y={h / 2 - 34} s={36} c="#556">{e.sub}</T>}</g>); }
    case 'arrow': { const up = e.dir === 'up'; return at(<g transform={up ? 'rotate(180)' : undefined}><path d="M-50,-170 L50,-170 L50,10 L120,10 L0,170 L-120,10 L-50,10 Z" fill={up ? C.green : C.red} stroke="#fff" strokeWidth={12} strokeLinejoin="round" /></g>); }
    case 'bubble': { const w = Math.max(160, String(e.text).length * (e.fs || 64) * 0.62 + 70); return at(<g><rect x={-w / 2} y={-60} width={w} height={120} rx={44} fill="#fff" stroke={e.color || C.ink} strokeWidth={8} /><path d="M-20,56 L-44,104 L20,58 Z" fill="#fff" stroke={e.color || C.ink} strokeWidth={8} strokeLinejoin="round" /><rect x={-26} y={46} width={50} height={16} fill="#fff" /><T x={0} y={(e.fs || 64) * 0.36} s={e.fs || 64} c={e.color || C.ink}>{e.text}</T></g>); }
    case 'x': return at(<g><circle r={70} fill={C.red} stroke="#fff" strokeWidth={10} /><path d="M-30,-30 L30,30 M30,-30 L-30,30" stroke="#fff" strokeWidth={18} strokeLinecap="round" /></g>);
    case 'check': return at(<g><circle r={70} fill={C.green} stroke="#fff" strokeWidth={10} /><path d="M-32,2 L-8,28 L36,-26" stroke="#fff" strokeWidth={18} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>);
    default: return null;
  }
};

const Art: React.FC<{ p: any }> = ({ p }) => (
  <svg width={640} height={720} viewBox="0 0 640 720" style={{ overflow: 'visible' }}>
    <defs><radialGradient id="glow"><stop offset="0" stopColor="#fff" stopOpacity="0.55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient></defs>
    {(p.art || []).map((e: any, i: number) => <El key={i} e={e} />)}
  </svg>
);

const Words: React.FC<{ p: any; maxW: number; size: number; align: 'left' | 'center' }> = ({ p, maxW, size, align }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', gap: size * 0.06 }}>
    {p.text.map((l: string, i: number) => {
      const fs = Math.min(size, Math.floor(maxW / (l.length * 0.62 + 0.3))), hi = i === (p.hi ?? p.text.length - 1);
      return <div key={i} style={{ fontFamily: 'Geist', fontWeight: 900, fontSize: fs, lineHeight: 1.02, letterSpacing: '-0.02em', color: hi ? C.ink : '#fff', background: hi ? C.yellow : 'transparent', padding: hi ? `${fs * 0.04}px ${fs * 0.16}px ${fs * 0.08}px` : 0, borderRadius: fs * 0.14, transform: `rotate(${hi ? -2 : 0}deg)`, WebkitTextStroke: hi ? undefined : `${Math.max(4, fs * 0.05)}px ${C.ink}`, paintOrder: 'stroke fill', textShadow: hi ? undefined : `0 ${fs * 0.06}px 0 rgba(0,0,0,.35)` }}>{l}</div>;
    })}
  </div>
);

const Back: React.FC<{ p: any }> = ({ p }) => {
  const [a, b] = BG[p.bg || 'navy'] || BG.navy;
  return <AbsoluteFill style={{ background: `radial-gradient(circle at ${p.side === 'left' ? '28%' : '72%'} 55%, ${a} 0%, ${b} 78%)` }}>
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, opacity: 0.08 }}>
      {Array.from({ length: 18 }).map((_, i) => <polygon key={i} points={`${p.side === 'left' ? 28 : 72},55 ${50 + 120 * Math.cos(i * 0.35)},${55 + 120 * Math.sin(i * 0.35)} ${50 + 120 * Math.cos(i * 0.35 + 0.15)},${55 + 120 * Math.sin(i * 0.35 + 0.15)}`} fill="#fff" />)}
    </svg>
  </AbsoluteFill>;
};

export const Poster: React.FC<{ v: any; k: number; tall?: boolean }> = ({ v, k, tall }) => {
  const p = (v.posters || [])[k] || { text: ['HELLO'], art: [] };
  if (tall) return (
    <AbsoluteFill style={{ fontFamily: 'Geist' }}>
      <Back p={{ ...p, side: 'center' }} />
      <div style={{ position: 'absolute', top: 210, left: 60, right: 60, display: 'flex', justifyContent: 'center' }}><Words p={p} maxW={960} size={210} align="center" /></div>
      <div style={{ position: 'absolute', left: 540 - 320 * 1.55, top: 1920 - 720 * 1.55 - 60, width: 640, height: 720, transform: 'scale(1.55)', transformOrigin: 'top left' }}><Art p={p} /></div>
    </AbsoluteFill>
  );
  const left = p.side === 'left';
  return (
    <AbsoluteFill style={{ fontFamily: 'Geist' }}>
      <Back p={p} />
      <div style={{ position: 'absolute', top: 0, left: left ? 0 : 640, width: 640, height: 720 }}><Art p={p} /></div>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: left ? 620 : 48, width: 620, display: 'flex', alignItems: 'center' }}><Words p={p} maxW={600} size={150} align="left" /></div>
    </AbsoluteFill>
  );
};
