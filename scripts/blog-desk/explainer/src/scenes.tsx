import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { C, pop, ease, Sneaker, Server, Priya, Banner, Sky, Ground, Card, Bug, Envelope, Shield, Exec, Robot, Icon } from './kit';

export type P = { f: number; t: number; dur: number; S: number[]; W: (w: string, n?: number) => number; sc: any; noBanner?: boolean };
const FPS = 30;
const COL: Record<string, string> = { red: C.red, green: C.green, yellow: C.yellow, navy: C.navy, blue: '#2f8ae0', purple: '#7b6cff', teal: '#1fb5a0', orange: '#ff8a3d' };
export const col = (c?: string) => (c && COL[c]) || c || C.navy;
const at = (S: number[], i: number) => Math.round((S[i] ?? 0) * FPS);
const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>{children}</svg>;
const T: React.FC<{ x: number; y: number; s?: number; c?: string; w?: number; a?: 'start' | 'middle' | 'end'; mono?: boolean; children: React.ReactNode }> = ({ x, y, s = 44, c = C.ink, w = 900, a = 'middle', mono, children }) => <text x={x} y={y} textAnchor={a} fontWeight={mono ? 700 : 900} fontSize={s} fill={c} fontFamily={mono ? 'monospace' : 'Geist'}>{children}</text>;
const rich = (s?: string) => { if (!s) return undefined; const parts = s.split('*'); return <>{parts.map((p, i) => i % 2 ? <span key={i} style={{ color: C.red }}>{p}</span> : <React.Fragment key={i}>{p}</React.Fragment>)}</>; };
export const BannerOf: React.FC<P & { atF?: number }> = ({ f, sc, noBanner, atF }) => (noBanner || !sc.banner) ? null : <Banner f={f} at={atF ?? 2} text={sc.banner.text} color={col(sc.banner.color)} sub={rich(sc.banner.sub)} tilt={sc.banner.tilt ?? -3} />;
const BG: React.FC<{ k?: string; t: number }> = ({ k = 'sky', t }) => {
  if (k === 'warm' || k === 'alert') return <><rect width={1080} height={1920} fill={k === 'alert' ? '#ffe7e0' : '#fff1d6'} />{Array.from({ length: 14 }).map((_, i) => <rect key={i} x={-300 + i * 120} y={-200} width={50} height={2600} fill={k === 'alert' ? '#ffd6cc' : '#ffe6b8'} transform="rotate(20 540 960)" />)}</>;
  if (k === 'mint') return <><Sky t={t} a="#6fe0c4" b="#d6fff3" /><Ground /></>;
  if (k === 'dusk') return <><Sky t={t} a="#8a7bff" b="#ffd1e8" sun={false} /><Ground /></>;
  return <><Sky t={t} /><Ground /></>;
};
const Who: React.FC<{ k?: string; t: number; f: number; x?: number; mood?: number; wave?: number }> = ({ k, t, f, x = 250, mood = 1, wave = 0 }) => {
  if (!k) return null;
  const s = pop(f, 4, 30, 14);
  const body = k === 'priya' ? <Priya wave={wave} look={0.6} smile={mood} /> : k === 'exec' ? <Exec mood={mood > 0.5 ? 0.6 : -0.6} look={0.5} /> : k === 'robot' ? <Robot t={t} happy={mood} arm={Math.max(0, Math.sin(t * 3))} /> : k === 'sneaker' ? <Sneaker walk={0} grin={mood} /> : null;
  return <g transform={`translate(${x} 1610) scale(${0.86 * s})`}>{body}</g>;
};
const Pill: React.FC<{ x: number; y: number; text: string; c?: string; s?: number; dot?: string; w?: number; fs?: number; dark?: boolean }> = ({ x, y, text, c, s = 1, dot, w, fs = 48, dark }) => {
  const W = Math.max(w || 0, 260, text.length * fs * 0.56 + (dot ? 150 : 110));
  return <g transform={`translate(${x} ${y}) scale(${s})`}><rect x={-W / 2} y={-46} width={W} height={104} rx={52} fill="rgba(29,35,64,.16)" transform="translate(0 8)" /><rect x={-W / 2} y={-52} width={W} height={104} rx={52} fill={dark ? C.ink : c ? c : '#fff'} />{dot && <circle cx={-W / 2 + 50} cy={0} r={16} fill={dot} />}<T x={dot ? 22 : 0} y={17} s={fs} c={dark || (c && c !== '#fff') ? '#fff' : C.ink}>{text}</T></g>;
};

// ---------- hook arts
const ArtServerDoor: React.FC<P> = ({ f, t }) => {
  const walkX = interpolate(f, [0, 62], [-160, 300], { extrapolateRight: 'clamp' });
  const walk = f < 62 ? t * 9 : 0, door = ease(f, 18, 34), alarm = f > 84 ? 1 : 0, warn = pop(f, 76, 30, 9), grin = ease(f, 66, 76);
  const rays = door * (0.75 + 0.25 * Math.sin(t * 8));
  return (<>
    <defs><linearGradient id="ray" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#ffe36e" stopOpacity="0.85" /><stop offset="1" stopColor="#ffe36e" stopOpacity="0" /></linearGradient></defs>
    <polygon points="628,1336 628,1546 160,1700 200,1150" fill="url(#ray)" opacity={rays * 0.7} />
    <g transform="translate(600 760)"><Server doorOpen={door} t={t} alarm={alarm} /></g>
    <g transform={`translate(${walkX} 1600) scale(0.86) rotate(${ease(f, 100, 120, 0, 7)})`}><Sneaker walk={walk} grin={grin} /></g>
    <g transform={`translate(330 1000) scale(${warn}) rotate(${(1 - warn) * -30})`}><Icon k="warn" /></g>
  </>);
};
const ArtRobotSort: React.FC<P> = ({ f, t }) => {
  const cards = Array.from({ length: 10 });
  const yes = Math.min(500, Math.floor(Math.max(0, f - 20) * 7)), no = Math.min(500, Math.floor(Math.max(0, f - 26) * 6));
  return (<>
    <g transform="translate(360 1600) scale(0.95)"><Robot t={t} arm={(Math.sin(t * 9) + 1) / 2} /></g>
    {cards.map((_, i) => { const s0 = i * 9; const p = ((f - s0) / 26); if (p <= 0 || p >= 1) return null; const yesBin = i % 2 === 0; const x = interpolate(p, [0, 0.45, 1], [120, 360, yesBin ? 760 : 940]); const y = interpolate(p, [0, 0.45, 1], [760, 1080, 1360]) - Math.sin(p * Math.PI) * 120; return <g key={i} transform={`translate(${x} ${y}) rotate(${p * 200})`}><rect x={-46} y={-60} width={92} height={120} rx={12} fill="#fff" stroke={C.ink} strokeWidth={5} /><T x={0} y={18} s={56}>?</T></g>; })}
    <g transform="translate(760 1440)"><path d="M-80,-60 L80,-60 L64,90 L-64,90 Z" fill={C.green} stroke="#fff" strokeWidth={8} /><T x={0} y={10} s={44} c="#fff">YES</T><T x={0} y={66} s={34} c="#fff">{yes}</T></g>
    <g transform="translate(950 1440)"><path d="M-70,-60 L70,-60 L56,90 L-56,90 Z" fill={C.red} stroke="#fff" strokeWidth={8} /><T x={0} y={10} s={44} c="#fff">NO</T><T x={0} y={66} s={34} c="#fff">{no}</T></g>
    <g transform={`translate(780 900) scale(${pop(f, 40)})`}><Icon k="tag" s={1.4} /><T x={-20} y={14} s={40}>$0.10</T></g>
  </>);
};
const ArtCeoExit: React.FC<P> = ({ f, t }) => {
  const x = interpolate(f, [6, 120], [780, 330], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), walking = f > 6 && f < 120;
  return (<>
    <g transform="translate(600 820)"><rect x={0} y={0} width={420} height={740} rx={20} fill="#3b4a8a" />{Array.from({ length: 15 }).map((_, i) => <rect key={i} x={40 + (i % 3) * 120} y={60 + Math.floor(i / 3) * 110} width={90} height={70} rx={10} fill={(i * 7) % 5 === 0 ? C.yellow : '#7fb2ff'} opacity={0.9} />)}<rect x={150} y={600} width={120} height={140} rx={12} fill="#26305e" /><rect x={150} y={600} width={120} height={140} rx={12} fill={C.yellow} opacity={ease(f, 0, 10) * (1 - ease(f, 40, 60))} /></g>
    <g transform={`translate(${x} 1610) scale(0.86)`}><Exec walk={walking ? t * 8 : 0} carry mood={-0.3} look={-1} /></g>
    <g transform={`translate(820 700) scale(${pop(f, 60)})`}><rect x={-150} y={-80} width={300} height={160} rx={24} fill="#fff" /><rect x={-60} y={-50} width={120} height={70} rx={14} fill="#c9d0ea" /><rect x={-80} y={24} width={160} height={30} rx={8} fill={C.ink} /><T x={0} y={48} s={26} c="#fff">CEO</T><g transform="translate(110 -70)"><Icon k="x" /></g></g>
    <g transform={`translate(190 860) scale(${pop(f, 80)})`}><Icon k="down" s={1.1} /></g>
  </>);
};
const ArtCloudDown: React.FC<P> = ({ f, t }) => {
  const shake = Math.sin(t * 18) * 4 * ease(f, 10, 20);
  const drops = Array.from({ length: 12 });
  return (<>
    <g transform={`translate(${540 + shake} 900)`}>
      <g fill="#8e9ab8"><ellipse cx={0} cy={40} rx={260} ry={110} /><circle cx={-120} cy={-10} r={110} /><circle cx={60} cy={-60} r={150} /><circle cx={190} cy={20} r={100} /></g>
      <path d="M-70,-10 l40,40 M-30,-10 l-40,40 M50,-10 l40,40 M90,-10 l-40,40" stroke={C.ink} strokeWidth={12} strokeLinecap="round" />
      <path d="M-40,90 Q10,60 60,90" stroke={C.ink} strokeWidth={10} fill="none" strokeLinecap="round" />
    </g>
    {drops.map((_, i) => { const p = ((t * 1.3 + i / 12) % 1); return <rect key={i} x={330 + (i * 37) % 420} y={1030 + p * 380} width={10} height={36} rx={5} fill="#7fb2ff" opacity={1 - p} />; })}
    {[['mail', 230, 1180, 20], ['calendar', 540, 1300, 32], ['chat', 850, 1180, 44]].map(([k, x, y, a]: any) => <g key={k} transform={`translate(${x} ${y}) scale(${pop(f, a)})`}><Icon k={k} s={0.9} /><g transform="translate(60 -50)" opacity={f > a + 14 ? 1 : 0}><Icon k="x" s={0.8} /></g></g>)}
  </>);
};
const ARTS: Record<string, React.FC<P>> = { 'server-door': ArtServerDoor, 'robot-sort': ArtRobotSort, 'ceo-exit': ArtCeoExit, 'cloud-down': ArtCloudDown };
export const Hook: React.FC<P> = (p) => { const A = ARTS[p.sc.art] || ArtServerDoor; return <><AbsoluteFill style={{ transform: `scale(${interpolate(p.f, [0, 140], [1, 1.08], { extrapolateRight: 'clamp' })})`, transformOrigin: '55% 62%' }}><Svg><BG k={p.sc.bg} t={p.t} /><A {...p} /></Svg></AbsoluteFill><BannerOf {...p} /></>; };

// ---------- generic types
export const Cast: React.FC<P> = (p) => { const { f, t, sc, W } = p; return (<><Svg><BG k={sc.bg} t={t} />
  {(sc.props || []).map((q: any, i: number) => { const a = q.at ? W(q.at) : 10 + i * 8; const s = pop(f, a); const fl = Math.sin(t * 2 + i) * 6; return <g key={i} transform={`translate(${q.x} ${q.y + fl}) scale(${s * (q.s || 1)})`}>{q.server ? <g transform="translate(-160 -400) scale(1)"><Server doorOpen={0} t={t} /></g> : <Icon k={q.icon} />}{q.x_at && f > W(q.x_at) && <g transform="translate(70 -60)"><Icon k="x" s={0.8} /></g>}{q.label && <T x={0} y={130} s={36}>{q.label}</T>}</g>; })}
  {(sc.pills || []).map((q: any, i: number) => <Pill key={i} x={q.x ?? 640} y={q.y} text={q.text} dot={col(q.color)} s={pop(f, q.at ? W(q.at) : 14 + i * 10)} />)}
  <Who k={sc.who} t={t} f={f} x={sc.whoX} mood={sc.mood ?? 1} wave={sc.wave && f < 60 ? -150 + Math.sin(t * 9) * 22 : 0} />
</Svg><BannerOf {...p} /></>); };

export const Stat: React.FC<P> = (p) => { const { f, t, sc } = p; const c = col(sc.color || 'red'); const card = pop(f, 6);
  const num = /^[\d,]+$/.test(sc.value || '') ? Math.round(parseInt(sc.value.replace(/,/g, ''), 10) * ease(f, 8, 40)).toLocaleString('en-US') : sc.value;
  return (<><Svg><BG k={sc.bg || 'sky'} t={t} />
    {sc.stamp && <g transform={`translate(540 640) rotate(-8) scale(${interpolate(pop(f, 4, 30, 9), [0, 1], [2.4, 1])})`} opacity={ease(f, 4, 8)}><rect x={-330} y={-100} width={660} height={200} rx={30} fill="none" stroke={C.red} strokeWidth={18} /><T x={0} y={40} s={110} c={C.red}>{sc.stamp}</T></g>}
    <Card x={110} y={sc.stamp ? 900 : 760} w={860} h={560} s={card}>
      {sc.icon && <g transform="translate(430 120)"><Icon k={sc.icon} s={0.9} /></g>}
      <T x={430} y={sc.icon ? 320 : 250} s={(sc.value || '').length > 9 ? 120 : 170} c={c}>{num}</T>
      <T x={430} y={sc.icon ? 410 : 360} s={48}>{sc.label}</T>
      {sc.sub && <T x={430} y={sc.icon ? 480 : 440} s={36} c="#6b7398">{sc.sub}</T>}
    </Card>
    <Who k={sc.who} t={t} f={f} x={sc.whoX} mood={sc.mood ?? 1} />
  </Svg><BannerOf {...p} /></>); };

export const Bars: React.FC<P> = (p) => { const { f, t, sc, W } = p; const rows = sc.rows || []; return (<><Svg><BG k={sc.bg} t={t} />
  <Card x={70} y={740} w={940} h={180 + rows.length * 170} s={pop(f, 6)}>
    {sc.title && <T x={470} y={90} s={48}>{sc.title}</T>}
    {rows.map((r: any, i: number) => { const a = r.at ? W(r.at) : 14 + i * 16; const g = ease(f, a, a + 26); const w = 600 * (r.value / (r.max || Math.max(...rows.map((x: any) => x.value)))) * g; return <g key={i} transform={`translate(60 ${170 + i * 170})`}><T x={0} y={0} s={40} a="start">{r.label}</T><rect x={0} y={24} width={600} height={70} rx={35} fill="#e3e8f7" /><rect x={0} y={24} width={Math.max(70 * g, w)} height={70} rx={35} fill={col(r.color)} /><T x={Math.max(70, w) + 24} y={74} s={44} a="start" c={col(r.color)}>{g > 0.3 ? r.text : ''}</T></g>; })}
    {sc.note && <T x={470} y={140 + rows.length * 170} s={32} c="#6b7398">{sc.note}</T>}
  </Card>
  <Who k={sc.who} t={t} f={f} x={sc.whoX} mood={sc.mood ?? 1} />
</Svg><BannerOf {...p} /></>); };

export const Chips: React.FC<P> = (p) => { const { f, t, sc, W } = p; const items = sc.items || []; const y0 = sc.who ? 720 : 800; return (<><Svg><BG k={sc.bg} t={t} />
  {items.map((q: any, i: number) => { const a = q.at ? W(q.at) : 12 + i * 12; return <g key={i}>{q.icon && <g transform={`translate(${150} ${y0 + i * 150}) scale(${pop(f, a) * 0.8})`}><Icon k={q.icon} /></g>}<Pill x={q.icon ? 600 : 540} y={y0 + i * 150} w={q.icon ? 760 : 860} text={q.text} dot={col(q.color)} s={pop(f, a)} /></g>; })}
  <Who k={sc.who} t={t} f={f} x={sc.whoX} mood={sc.mood ?? 1} />
</Svg><BannerOf {...p} /></>); };

export const Compare: React.FC<P> = (p) => { const { f, t, sc, W } = p; const L = sc.left || {}, R = sc.right || {};
  const Col: React.FC<{ x: number; d: any; a0: number }> = ({ x, d, a0 }) => <Card x={x} y={720} w={460} h={170 + (d.items || []).length * 150} s={pop(f, a0)}>
    <rect x={0} y={0} width={460} height={110} rx={28} fill={col(d.color)} /><rect x={0} y={60} width={460} height={50} fill={col(d.color)} /><T x={230} y={72} s={44} c="#fff">{d.title}</T>
    {(d.items || []).map((it: any, i: number) => { const a = typeof it === "object" && it.at ? W(it.at) : a0 + 10 + i * 10; const s = pop(f, a); return <g key={i} transform={`translate(30 ${150 + i * 150}) scale(${s})`} opacity={Math.min(1, s)}><g transform="translate(34 30)"><Icon k={d.icon || 'check'} s={0.8} /></g>{String(it.text || it).split('|').map((ln: string, k: number) => <T key={k} x={86} y={44 + k * 46 - (String(it.text || it).includes('|') ? 22 : 0)} s={39} a="start">{ln}</T>)}</g>; })}
  </Card>;
  return (<><Svg><BG k={sc.bg} t={t} /><Col x={50} d={L} a0={6} /><Col x={570} d={R} a0={R.at ? W(R.at) : 30} /></Svg><BannerOf {...p} /></>); };

export const Steps: React.FC<P> = (p) => { const { f, t, sc, W } = p; const items = sc.items || []; const by = sc.who ? 700 : 760; return (<><Svg><BG k={sc.bg} t={t} />
  <Card x={sc.who ? 330 : 90} y={by} w={sc.who ? 700 : 900} h={110 + items.length * 110} s={pop(f, 6)}>
    <T x={40} y={70} s={40} a="start" c="#6b7398">{sc.title || 'TO DO'}</T>
    {items.map((it: any, i: number) => { const a = it.at ? W(it.at) : 20 + i * 30; const c = ease(f, a + 6, a + 18); return <g key={i} transform={`translate(40 ${100 + i * 110})`} opacity={0.35 + 0.65 * ease(f, a - 4, a + 4)}><rect width={74} height={74} rx={18} fill={c > 0 ? col(it.color || 'green') : '#e3e8f7'} /><path d={it.no ? 'M22,22 L52,52 M52,22 L22,52' : 'M18,38 L32,52 L58,22'} stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={70} strokeDashoffset={70 * (1 - c)} /><T x={100} y={50} s={Math.min(sc.who ? 40 : 44, Math.floor((sc.who ? 540 : 740) / (it.text.length * 0.56)))} a="start">{it.text}</T></g>; })}
  </Card>
  <Who k={sc.who} t={t} f={f} x={sc.whoX ?? 180} mood={sc.mood ?? 1} />
</Svg><BannerOf {...p} /></>); };

export const Servers: React.FC<P> = (p) => { const { f, t, sc, W } = p; const off = W(sc.offAt || 'offline'), rev = sc.revertAt ? W(sc.revertAt) : 99999; return (<><Svg><BG k={sc.bg} t={t} />
  {[0, 1, 2, 3].map((i) => { const down = (i === 1 || i === 2) && f > off && f < rev + 20; const shake = !down && f > off && f < rev ? Math.sin(f * 2 + i) * 4 : 0; return <g key={i} transform={`translate(${70 + i * 245 + shake} 1100) scale(0.55)`} opacity={down ? 0.35 : 1}><Server doorOpen={0} t={t} alarm={!down && f > off && f < rev ? 1 : 0} />{down && <g transform="translate(160 -60) scale(1.8)"><Icon k="x" /></g>}</g>; })}
  {sc.revertAt && <Pill x={540} y={900} text={sc.revertText || 'network change reverted'} dot={C.yellow} s={pop(f, rev)} />}
  {sc.loadAt && <Pill x={540} y={780} text={sc.loadText || 'the rest got overloaded'} dot={C.red} s={pop(f, W(sc.loadAt))} />}
</Svg><BannerOf {...p} /></>); };

export const Outro: React.FC<P> = (p) => { const { f, t, sc, S, W } = p; const endI = sc.endAt ?? Math.max(0, S.length - 1), end = f >= at(S, endI);
  return (<><Svg><BG k={sc.bg} t={t} />
    <g transform={`translate(560 1240) scale(${pop(f, 8)})`}><Shield check={ease(f, 16, 34)} /></g>
    <Who k={sc.who || 'priya'} t={t} f={f} x={sc.whoX ?? 270} mood={1} wave={-140 + Math.sin(t * 6) * 10} />
    {!end && (sc.chips || []).map((q: any, i: number) => <Pill key={i} x={540} y={800 + i * 130} text={q.text} dot={col(q.color)} s={pop(f, q.at ? W(q.at) : 14 + i * 30)} />)}
    {end && <g transform={`translate(540 880) scale(${pop(f, at(S, endI))})`}><rect x={-380} y={-60} width={760} height={120} rx={60} fill={C.navy} /><circle cx={-322} cy={0} r={16} fill={C.yellow} /><T x={16} y={18} s={48} c="#fff">{sc.url || 'aashishpandey.com/blog'}</T></g>}
  </Svg>{end ? <Banner f={f} at={at(S, endI)} text={sc.endTitle || 'FULL STORY ON MY BLOG'} color={col(sc.endColor || 'red')} /> : <BannerOf {...p} />}</>); };

export const Toggle: React.FC<P> = (p) => { const { f, t, sc, W } = p; const off = ease(f, W(sc.offAt || 'off') + 4, W(sc.offAt || 'off') + 16); const knob = interpolate(off, [0, 1], [180, -180]);
  return (<><Svg><BG k={sc.bg} t={t} />
    <g transform={`translate(540 1060) scale(${pop(f, 6)})`}><rect x={-330} y={-150} width={660} height={300} rx={150} fill={off > 0.5 ? '#9aa3c7' : C.green} stroke="#fff" strokeWidth={16} /><circle cx={knob} cy={0} r={118} fill="#fff" /><T x={off > 0.5 ? 120 : -120} y={22} s={64} c="#fff">{off > 0.5 ? 'OFF' : 'ON'}</T></g>
    {sc.code && <g transform={`translate(540 1400) scale(${pop(f, W(sc.offAt || 'off') + 26)})`}><rect x={-320} y={-50} width={640} height={100} rx={22} fill="#10142c" /><T x={0} y={16} s={42} c={C.green} mono>{sc.code}</T></g>}
  </Svg><BannerOf {...p} /></>); };

// ---------- Apache-specific (also reusable)
export const Lane: React.FC<P> = (p) => { const { f, t, S } = p; const bw = pop(f, 6), sv = pop(f, 14), lane = ease(f, 18, 34); const many = f >= at(S, 1); const n = many ? 7 : 2, cols = [C.red, C.yellow, C.green, '#4fb3ff', '#b779ff', '#ff9a3d', '#ff6fb1'];
  return (<><Svg><Sky t={t + 9} a="#64c9ff" sun={false} /><Ground />
    <Card x={60} y={820} w={360} h={300} s={bw}><rect x={0} y={0} width={360} height={56} rx={28} fill="#e9eefb" />{[0, 1, 2].map((i) => <circle key={i} cx={34 + i * 26} cy={28} r={9} fill={[C.red, C.yellow, C.green][i]} />)}<rect x={30} y={86} width={300} height={34} rx={10} fill="#e3e8f7" /><rect x={30} y={140} width={140} height={120} rx={14} fill="#ffe7a3" /><rect x={190} y={140} width={140} height={54} rx={12} fill="#c9f2e6" /><rect x={190} y={206} width={140} height={54} rx={12} fill="#ffd0d5" /><T x={180} y={-26} s={40}>VISITOR</T></Card>
    <g transform={`translate(700 760) scale(${0.72 * sv})`}><Server doorOpen={0} t={t} /></g>
    <rect x={300} y={1240} width={420 * lane} height={110} rx={55} fill="#2b3466" />
    {lane > 0.95 && Array.from({ length: n }).map((_, i) => { const q = ((t * 0.55 + i / n) % 1); return <g key={i} transform={`translate(${320 + q * 380} ${1295 + Math.sin(i * 2) * 18})`}><rect x={-26} y={-22} width={52} height={44} rx={10} fill={cols[i % cols.length]} stroke="#fff" strokeWidth={5} /></g>; })}
    <Pill x={540} y={1440} text={p.sc.pill || 'MANY REQUESTS, ONE LANE'} w={640} fs={44} s={pop(f, at(S, 1) + 6)} />
  </Svg><BannerOf {...p} /></>); };
export const ModBug: React.FC<P> = (p) => { const { f, t, S, sc } = p; const mod = pop(f, 10), crack = ease(f, at(S, 1), at(S, 1) + 20), bugIn = ease(f, at(S, 1) + 8, at(S, 1) + 60);
  return (<><Svg><Sky t={t + 14} a="#5ab7f0" sun={false} /><Ground />
    <Card x={190} y={780} w={700} h={560} s={mod} fill={C.navy}><rect x={30} y={30} width={640} height={500} rx={22} fill="#3a4580" />
      <g transform={`translate(350 230) rotate(${(t * 60) % 360})`}>{Array.from({ length: 8 }).map((_, i) => <rect key={i} x={-22} y={-150} width={44} height={60} rx={10} fill={C.yellow} transform={`rotate(${i * 45})`} />)}<circle r={110} fill={C.yellow} /><circle r={44} fill="#3a4580" /></g>
      <T x={350} y={470} s={64} c="#fff">{sc.module || 'mod_http2'}</T>
      <path d="M250,120 L300,190 L270,240 L340,300 L310,350 L380,420" stroke={C.red} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={420} strokeDashoffset={420 * (1 - crack)} /></Card>
    <g transform={`translate(${interpolate(bugIn, [0, 1], [1180, 760])} ${1420 - Math.abs(Math.sin(t * 8)) * 8}) rotate(-90) scale(1.4)`}><Bug t={t} /></g>
    <Pill x={330} y={1460} text="MEMORY BUG" c={C.red} w={420} fs={46} s={pop(f, at(S, 1) + 30)} />
  </Svg><BannerOf {...p} /></>); };
export const Attack: React.FC<P> = (p) => { const { f, t, S } = p; const b = at(S, 1), dizzy = ease(f, 40, 60), term = pop(f, b + 6, 30, 12), red = f > b ? 1 : 0; const shake = f > 34 && f < b ? Math.sin(f * 2.2) * 5 : 0; const typed = (p.sc.cmd || 'run attacker_code').slice(0, Math.max(0, Math.floor((f - b - 12) / 2)));
  return (<><Svg><Sky t={t + 20} a="#4aa6e6" sun={false} /><Ground />
    <g transform={`translate(${640 + shake} 760)`}><Server doorOpen={1} t={t} alarm={red} /></g>
    {dizzy > 0 && <g transform={`translate(800 700) rotate(${t * 220})`} opacity={dizzy}>{[0, 1, 2].map((i) => <path key={i} transform={`rotate(${i * 120}) translate(80 0)`} d="M0,-26 L8,-8 L27,-8 L12,4 L18,24 L0,12 L-18,24 L-12,4 L-27,-8 L-8,-8 Z" fill={C.yellow} />)}</g>}
    {Array.from({ length: 5 }).map((_, i) => { const s0 = 4 + i * 8; const q = ease(f, s0, s0 + 22); if (q <= 0 || q >= 1) return null; const x = interpolate(q, [0, 1], [320, 700]), y = 1180 - Math.sin(q * Math.PI) * 260 + q * 120; return <g key={i} transform={`translate(${x} ${y}) rotate(${q * 360})`}><Envelope c={[C.yellow, '#fff', '#ffd0d5'][i % 3]} /></g>; })}
    <g transform="translate(230 1600) scale(0.86)"><Sneaker walk={0} grin={f > b ? 1 : 0.4} arm={f < 50 ? -120 + Math.sin(t * 14) * 30 : -20} /></g>
    <g transform={`translate(540 640) scale(${term})`}><rect x={-380} y={-110} width={760} height={220} rx={26} fill="#10142c" stroke={C.red} strokeWidth={8} />{[0, 1, 2].map((i) => <circle key={i} cx={-340 + i * 30} cy={-76} r={9} fill={[C.red, C.yellow, C.green][i]} />)}<T x={-330} y={30} s={52} c={C.green} a="start" mono>{'> ' + typed + (Math.floor(t * 3) % 2 ? '▌' : '')}</T></g>
  </Svg><BannerOf {...p} sc={{ ...p.sc, banner: p.sc.banner && { ...p.sc.banner, sub: f > b && p.sc.banner2 ? p.sc.banner2 : p.sc.banner.sub } }} /></>); };
export const Versions: React.FC<P> = (p) => { const { f, S, sc } = p; const st = interpolate(pop(f, 4, 30, 9), [0, 1], [2.4, 1]), so = ease(f, 4, 8); const bar = ease(f, at(S, 1), at(S, 1) + 36), fix = pop(f, at(S, 1) + 44), on = pop(f, at(S, 1) + 70); const X = (v: number) => 140 + ((v - 50) / 25) * 800;
  return (<><Svg><BG k="alert" t={0} />
    <g transform={`translate(540 640) rotate(-8) scale(${st})`} opacity={so}><rect x={-330} y={-100} width={660} height={200} rx={30} fill="none" stroke={C.red} strokeWidth={18} /><T x={0} y={40} s={120} c={C.red}>CRITICAL</T></g>
    <Card x={70} y={900} w={940} h={520}><T x={470} y={90} s={50}>Apache versions</T><rect x={70} y={230} width={800} height={30} rx={15} fill="#e3e8f7" /><rect x={X(55) - 70} y={222} width={(X(70) - X(55)) * bar} height={46} rx={23} fill={C.red} />
      {[50, 55, 60, 65, 70, 75].map((v) => <g key={v}><rect x={X(v) - 72} y={286} width={4} height={20} fill="#9aa3c7" /><T x={X(v) - 70} y={346} s={30} c="#6b7398">{'2.4.' + v}</T></g>)}
      <g opacity={bar}><T x={(X(55) + X(70)) / 2 - 70} y={196} s={42} c={C.red}>2.4.55 – 2.4.70 affected</T></g>
      <g transform={`translate(${X(71) - 70} 250) scale(${fix})`}><Icon k="check" /></g><g opacity={fix}><T x={X(71) - 70} y={420} s={34} c="#1a9e5a">2.4.71 fixed</T></g>
      <g transform={`translate(470 470) scale(${on})`}><rect x={-250} y={-34} width={500} height={68} rx={34} fill={C.navy} /><T x={0} y={12} s={34} c="#fff">only when HTTP/2 is on</T></g></Card>
  </Svg></>); };
export const Shop: React.FC<P> = (p) => { const { f, t, S, W } = p; const shop = pop(f, 14), srv = pop(f, W('Apache') || at(S, 1) + 4), globe = pop(f, W('popular') || at(S, 1) + 40, 30, 10);
  const wave = f < 50 ? -150 + Math.sin(t * 9) * 22 : interpolate(f, [50, 62], [-150, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (<><Svg><Sky t={t + 5} a="#6fd0ff" /><Ground />
    <Card x={470} y={760} w={520} h={420} s={shop}><rect x={0} y={0} width={520} height={70} rx={28} fill="#e9eefb" />{[0, 1, 2].map((i) => <circle key={i} cx={40 + i * 30} cy={35} r={10} fill={[C.red, C.yellow, C.green][i]} />)}{Array.from({ length: 8 }).map((_, i) => <path key={i} d={`M${20 + i * 60},92 h60 v46 q-30,26 -60,0z`} fill={i % 2 ? '#fff' : C.red} />)}<T x={260} y={210} s={50}>{p.sc.shop || "PRIYA'S SHOP"}</T>{[0, 1, 2].map((i) => <g key={i} transform={`translate(${50 + i * 150} 250)`}><rect width={120} height={120} rx={18} fill={['#ffe7a3', '#c9f2e6', '#ffd0d5'][i]} /><circle cx={60} cy={55} r={30} fill={[C.yellow, C.green, C.red][i]} /></g>)}</Card>
    {p.sc.server !== false && <><g transform={`translate(570 1210) scale(${0.45 * srv})`}><Server doorOpen={0} t={t} /><rect x={30} y={-110} width={260} height={84} rx={20} fill={C.yellow} /><T x={160} y={-52} s={46}>{p.sc.serverLabel || 'APACHE'}</T></g>
    <g transform={`translate(440 1460) scale(${globe * 0.7})`}><Icon k="globe" /></g></>}
    {(p.sc.props || []).map((q: any, i: number) => <g key={i} transform={`translate(${q.x} ${q.y + Math.sin(t * 2 + i) * 6}) scale(${pop(f, q.at ? W(q.at) : 20 + i * 8) * (q.s || 1)})`}><Icon k={q.icon} />{q.label && <T x={0} y={120} s={34}>{q.label}</T>}</g>)}
    <g transform="translate(250 1610) scale(0.86)"><Priya wave={wave} look={0.6} /></g>
  </Svg><BannerOf {...p} /></>); };

export const TYPES: Record<string, React.FC<P>> = { hook: Hook, cast: Cast, stat: Stat, bars: Bars, chips: Chips, compare: Compare, steps: Steps, servers: Servers, outro: Outro, toggle: Toggle, lane: Lane, bug: ModBug, attack: Attack, versions: Versions, shop: Shop };
