import React from 'react';
import { spring, interpolate, Easing } from 'remotion';
export const C = { ink: '#1d2340', sky1: '#5cc8ff', sky2: '#c8f0ff', red: '#ff4f5e', yellow: '#ffd23f', navy: '#2b3466', navy2: '#222a55', green: '#3ddc84', skin: '#f4c29c', hood: '#3f4470', white: '#ffffff' };
export const pop = (f: number, at: number, fps = 30, damping = 11) => spring({ frame: f - at, fps, config: { damping, stiffness: 170, mass: 0.7 } });
export const ease = (f: number, a: number, b: number, from = 0, to = 1) => interpolate(f, [a, b], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.2, 1) });

// Original flat cartoon character: sneaky stranger in a hoodie. Origin = feet centre. walk: phase in radians, look: -1..1 pupils
export const Sneaker: React.FC<{ walk: number; look?: number; grin?: number; arm?: number }> = ({ walk, look = 1, grin = 0, arm }) => {
  const sw = Math.sin(walk) * 22, bob = Math.abs(Math.cos(walk)) * 10;
  return (
    <g>
      <ellipse cx={0} cy={6} rx={120} ry={18} fill="rgba(20,30,70,.22)" />
      <g transform={`translate(0 ${-bob})`}>
        {/* back leg + arm */}
        <g transform={`rotate(${-sw} 0 -175)`}><rect x={-30} y={-180} width={52} height={175} rx={24} fill="#23264a" /><ellipse cx={8} cy={-6} rx={44} ry={20} fill="#15172e" /></g>
        <g transform={`rotate(${sw * 1.2} -10 -360)`}><rect x={-34} y={-372} width={50} height={170} rx={25} fill="#363a63" /><circle cx={-9} cy={-205} r={27} fill={C.skin} /></g>
        {/* body */}
        <path d="M-105,-160 Q-118,-330 -80,-395 Q0,-430 80,-395 Q118,-330 105,-160 Z" fill={C.hood} />
        <path d="M-60,-235 L60,-235 L50,-185 L-50,-185 Z" fill="#363a63" />
        <path d="M-6,-390 L-14,-300 M14,-390 L20,-300" stroke="#e8e8f5" strokeWidth={7} strokeLinecap="round" />
        {/* front leg */}
        <g transform={`rotate(${sw} 0 -175)`}><rect x={-26} y={-180} width={52} height={175} rx={24} fill="#2c3058" /><ellipse cx={12} cy={-6} rx={46} ry={21} fill="#1a1c36" /></g>
        {/* head with hood */}
        <circle cx={0} cy={-500} r={128} fill={C.hood} />
        <circle cx={14} cy={-488} r={92} fill={C.skin} />
        <path d="M-80,-560 Q14,-640 108,-560 Q60,-600 14,-596 Q-40,-596 -80,-560Z" fill="#363a63" />
        {/* eyes: sly */}
        <ellipse cx={-14} cy={-500} rx={20} ry={23} fill="#fff" /><ellipse cx={46} cy={-500} rx={20} ry={23} fill="#fff" />
        <circle cx={-14 + look * 8} cy={-497} r={10} fill={C.ink} /><circle cx={46 + look * 8} cy={-497} r={10} fill={C.ink} />
        <path d="M-36,-532 L6,-522 M26,-522 L68,-534" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
        <path d={`M-4,-448 Q22,${-436 + grin * 18} 52,-452`} stroke={C.ink} strokeWidth={8} fill="none" strokeLinecap="round" />
        {/* front arm */}
        <g transform={`rotate(${arm ?? -sw * 1.2} 10 -360)`}><rect x={-10} y={-372} width={50} height={170} rx={25} fill="#4a4f80" /><circle cx={15} cy={-205} r={27} fill={C.skin} /></g>
      </g>
    </g>
  );
};

// Friendly flat server tower. doorOpen 0..1, t seconds for blinking lights
export const Server: React.FC<{ doorOpen: number; t: number; alarm?: number }> = ({ doorOpen, t, alarm = 0 }) => {
  const rows = [0, 1, 2, 3, 4];
  return (
    <g>
      <ellipse cx={170} cy={812} rx={250} ry={30} fill="rgba(20,30,70,.22)" />
      <rect x={20} y={0} width={330} height={810} rx={34} fill={C.navy2} />
      <rect x={0} y={0} width={320} height={810} rx={34} fill={C.navy} />
      {rows.map((r) => (
        <g key={r} transform={`translate(28 ${34 + r * 106})`}>
          <rect width={264} height={84} rx={16} fill="#3a4580" />
          {[0, 1, 2].map((i) => { const on = Math.sin(t * (5 + r + i * 2) + r * 3 + i) > -0.2; const col = alarm > 0.5 && (Math.floor(t * 6) % 2 === 0) ? C.red : i === 2 ? C.yellow : C.green; return <circle key={i} cx={30 + i * 34} cy={42} r={11} fill={on ? col : '#26305e'} />; })}
          <rect x={140} y={28} width={100} height={8} rx={4} fill="#26305e" /><rect x={140} y={48} width={70} height={8} rx={4} fill="#26305e" />
        </g>
      ))}
      {/* the hidden door */}
      <g transform="translate(28 576)">
        <rect width={150} height={210} rx={14} fill="#1a1f42" />
        <rect width={150} height={210} rx={14} fill={C.yellow} opacity={doorOpen} />
        <g transform={`translate(0 0) scale(${1 - doorOpen * 0.82} 1)`}>
          <rect width={150} height={210} rx={14} fill="#46528f" stroke="#2a3366" strokeWidth={6} />
          <circle cx={122} cy={110} r={10} fill={C.yellow} />
        </g>
      </g>
    </g>
  );
};

// Original flat cartoon character: Priya, a small-shop owner. Origin = feet centre. wave: right-arm angle in degrees; look: pupils -1..1; smile 0..1
export const Priya: React.FC<{ wave?: number; look?: number; smile?: number; walk?: number }> = ({ wave = 0, look = 0, smile = 1, walk = 0 }) => {
  const sw = Math.sin(walk) * 18, bob = walk ? Math.abs(Math.cos(walk)) * 8 : 0;
  return (
    <g>
      <ellipse cx={0} cy={6} rx={110} ry={17} fill="rgba(20,30,70,.22)" />
      <g transform={`translate(0 ${-bob})`}>
        <g transform={`rotate(${-sw} 0 -170)`}><rect x={-38} y={-176} width={46} height={172} rx={22} fill="#24305e" /><ellipse cx={-12} cy={-6} rx={38} ry={18} fill="#7a3b2e" /></g>
        <g transform={`rotate(${sw} 0 -170)`}><rect x={-6} y={-176} width={46} height={172} rx={22} fill="#2c3a70" /><ellipse cx={22} cy={-6} rx={38} ry={18} fill="#8c4636" /></g>
        <g transform="rotate(14 -70 -370)"><rect x={-96} y={-382} width={46} height={160} rx={23} fill="#25a888" /><circle cx={-73} cy={-222} r={25} fill="#c98b5f" /></g>
        <path d="M-92,-150 Q-104,-330 -70,-392 Q0,-420 70,-392 Q104,-330 92,-150 Z" fill="#2ec4a0" />
        <path d="M-30,-404 Q0,-372 30,-404" stroke="#1f8f74" strokeWidth={8} fill="none" strokeLinecap="round" />
        <rect x={-92} y={-176} width={184} height={30} rx={12} fill="#24305e" />
        <rect x={-16} y={-428} width={32} height={34} rx={10} fill="#b97c52" />
        <circle cx={0} cy={-610} r={46} fill="#2b1d2e" />
        <circle cx={0} cy={-500} r={96} fill="#2b1d2e" />
        <circle cx={0} cy={-486} r={84} fill="#c98b5f" />
        <path d="M-90,-500 Q-80,-590 0,-596 Q80,-590 90,-500 Q60,-560 0,-560 Q-40,-560 -90,-500Z" fill="#2b1d2e" />
        <ellipse cx={-30} cy={-492} rx={15} ry={18} fill="#fff" /><ellipse cx={30} cy={-492} rx={15} ry={18} fill="#fff" />
        <circle cx={-30 + look * 6} cy={-489} r={8.5} fill={C.ink} /><circle cx={30 + look * 6} cy={-489} r={8.5} fill={C.ink} />
        <path d="M-46,-522 Q-30,-530 -14,-522 M14,-522 Q30,-530 46,-522" stroke="#2b1d2e" strokeWidth={6} fill="none" strokeLinecap="round" />
        <ellipse cx={-52} cy={-458} rx={14} ry={8} fill="#e8796b" opacity={0.5} /><ellipse cx={52} cy={-458} rx={14} ry={8} fill="#e8796b" opacity={0.5} />
        <path d={`M-24,-450 Q0,${-450 + smile * 24} 24,-450`} stroke={C.ink} strokeWidth={7} fill={smile > 0.5 ? '#fff' : 'none'} strokeLinecap="round" />
        <g transform={`rotate(${wave} 70 -370)`}><rect x={50} y={-382} width={46} height={160} rx={23} fill="#25a888" /><circle cx={73} cy={-222} r={25} fill="#c98b5f" /></g>
      </g>
    </g>
  );
};

export const Banner: React.FC<{ f: number; at?: number; text: string; color?: string; sub?: React.ReactNode; tilt?: number }> = ({ f, at = 2, text, color = C.red, sub, tilt = -3 }) => {
  const a = pop(f, at), b = pop(f, at + 10, 30, 13);
  const shade = color === C.red ? '#c63443' : color === C.green ? '#22a862' : color === C.yellow ? '#d9a90f' : '#1a2150';
  return (
    <div style={{ position: 'absolute', top: 220, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
      <div style={{ transform: `scale(${a}) rotate(${tilt}deg)`, background: color, color: color === C.yellow ? C.ink : '#fff', fontWeight: 900, fontSize: Math.min(100, Math.floor(900 / (text.length * 0.64))), padding: '14px 44px 20px', borderRadius: 26, letterSpacing: -1, boxShadow: `0 14px 0 ${shade}`, whiteSpace: 'nowrap' }}>{text}</div>
      {sub ? <div style={{ transform: `scale(${b})`, background: '#fff', color: C.ink, fontWeight: 800, fontSize: 52, padding: '12px 32px 16px', borderRadius: 20, boxShadow: '0 10px 0 rgba(29,35,64,.18)', whiteSpace: 'nowrap' }}>{sub}</div> : null}
    </div>
  );
};

export const Sky: React.FC<{ t: number; a?: string; b?: string; sun?: boolean }> = ({ t, a = C.sky1, b = C.sky2, sun = true }) => (
  <>
    <rect width={1080} height={1920} fill={a} />
    <rect width={1080} height={1920} fill="url(#skyfade)" />
    <defs><linearGradient id="skyfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={b} stopOpacity="0" /><stop offset="0.75" stopColor={b} stopOpacity="1" /></linearGradient></defs>
    {sun && <circle cx={190} cy={720} r={96} fill="#fff6c9" opacity={0.9} />}
    <g fill="#fff" opacity={0.95}>{[[120 + t * 14, 880, 0.8], [930 - t * 10, 640, 0.62]].map(([x, y, sc], i) => <g key={i} transform={`translate(${x} ${y}) scale(${sc})`}><ellipse cx={0} cy={0} rx={90} ry={44} /><circle cx={-40} cy={-24} r={46} /><circle cx={28} cy={-38} r={56} /></g>)}</g>
    <g fill="#9ad8f7">{[[0,1120,150,460],[160,1020,120,560],[290,1180,170,400],[470,960,130,620],[610,1100,160,480],[780,1000,140,580],[930,1140,150,440]].map(([x,y,w,hh],i)=><rect key={i} x={x} y={y} width={w} height={hh} rx={10}/>)}</g>
    <g fill="#7cc7ee">{[[60,1260,130,320],[240,1220,110,360],[420,1300,150,280],[700,1240,120,340],[880,1280,170,300]].map(([x,y,w,hh],i)=><rect key={i} x={x} y={y} width={w} height={hh} rx={10}/>)}</g>
  </>
);
export const Ground: React.FC = () => (
  <>
    <rect x={0} y={1560} width={1080} height={400} fill="#4b5bab" />
    <rect x={0} y={1560} width={1080} height={22} fill="#5d6fc4" />
    {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={0} y={1600 + i * 60} width={1080} height={4} fill="#5566b8" opacity={0.6} />)}
  </>
);
export const Card: React.FC<{ x: number; y: number; w: number; h: number; s?: number; children?: React.ReactNode; fill?: string }> = ({ x, y, w, h, s = 1, children, fill = '#fff' }) => (
  <g transform={`translate(${x + w / 2} ${y + h / 2}) scale(${s}) translate(${-w / 2} ${-h / 2})`}>
    <rect x={0} y={12} width={w} height={h} rx={28} fill="rgba(29,35,64,.18)" />
    <rect x={0} y={0} width={w} height={h} rx={28} fill={fill} />
    {children}
  </g>
);
export const Bug: React.FC<{ t: number }> = ({ t }) => (
  <g>
    {[-1, 0, 1].map((i) => <g key={i}><path d={`M-20,${i * 18} L-46,${i * 22 + Math.sin(t * 20 + i) * 6}`} stroke={C.ink} strokeWidth={6} strokeLinecap="round" /><path d={`M20,${i * 18} L46,${i * 22 - Math.sin(t * 20 + i) * 6}`} stroke={C.ink} strokeWidth={6} strokeLinecap="round" /></g>)}
    <ellipse cx={0} cy={4} rx={34} ry={42} fill={C.red} /><path d="M0,-36 L0,46" stroke={C.ink} strokeWidth={5} />
    <circle cx={-13} cy={-2} r={7} fill={C.ink} /><circle cx={14} cy={20} r={7} fill={C.ink} /><circle cx={12} cy={-10} r={5} fill={C.ink} />
    <circle cx={0} cy={-44} r={20} fill={C.ink} /><circle cx={-7} cy={-48} r={5} fill="#fff" /><circle cx={7} cy={-48} r={5} fill="#fff" />
    <path d="M-8,-60 Q-18,-80 -26,-82 M8,-60 Q18,-80 26,-82" stroke={C.ink} strokeWidth={4} fill="none" />
  </g>
);
export const Envelope: React.FC<{ c?: string }> = ({ c = '#fff' }) => (
  <g><rect x={-44} y={-30} width={88} height={60} rx={8} fill={c} stroke={C.ink} strokeWidth={5} /><path d="M-40,-24 L0,8 L40,-24" stroke={C.ink} strokeWidth={5} fill="none" strokeLinejoin="round" /></g>
);
export const Shield: React.FC<{ check?: number }> = ({ check = 1 }) => (
  <g>
    <path d="M0,-120 L100,-82 Q104,40 0,120 Q-104,40 -100,-82 Z" fill={C.green} stroke="#fff" strokeWidth={14} strokeLinejoin="round" />
    <path d="M-42,0 L-10,32 L48,-34" stroke="#fff" strokeWidth={20} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={160} strokeDashoffset={160 * (1 - check)} />
  </g>
);

// Mujasauraus, flat 2D guest (lavender dino, teal spikes, cream belly). Origin = feet centre, faces right. walk phase, wave 0..1, look -1..1, blink handled by t
export const Muja: React.FC<{ t: number; walk?: number; wave?: number; hop?: number; look?: number; happy?: number }> = ({ t, walk = 0, wave = 0, hop = 0, look = 0.3, happy = 1 }) => {
  const sw = Math.sin(walk) * 16, bob = walk ? Math.abs(Math.cos(walk)) * 8 : Math.sin(t * 2.4) * 3;
  const jump = hop * Math.abs(Math.sin(t * 7)) * 34, tail = Math.sin(t * 5) * 10, blink = (t % 3.1) < 0.12 ? 0.12 : 1;
  const P = '#a48cff', P2 = '#8c72f0', CR = '#fff3c4', TE = '#3fe0c5', INK = '#1d2340';
  return (
    <g>
      <ellipse cx={0} cy={4} rx={92} ry={14} fill="rgba(20,30,70,.2)" />
      <g transform={`translate(0 ${-bob - jump})`}>
        <g transform={`rotate(${tail} -70 -80)`}><path d="M-60,-70 Q-130,-60 -150,-120 Q-110,-95 -62,-108 Z" fill={P2} /><path d="M-140,-112 l-6,-22 l18,12z" fill={TE} /></g>
        <g transform={`rotate(${-sw} -30 -50)`}><rect x={-46} y={-56} width={34} height={58} rx={16} fill={P2} /></g>
        <g transform={`rotate(${sw} 26 -50)`}><rect x={10} y={-56} width={34} height={58} rx={16} fill={P2} /></g>
        {[-46, -14, 18].map((x, i) => <path key={i} d={`M${x - 16},${-150 + i * 4} L${x},${-186 + i * 2} L${x + 16},${-148 + i * 4} Z`} fill={TE} />)}
        <ellipse cx={0} cy={-92} rx={82} ry={64} fill={P} />
        <ellipse cx={14} cy={-76} rx={48} ry={38} fill={CR} />
        <circle cx={58} cy={-170} r={58} fill={P} />
        <ellipse cx={104} cy={-152} rx={36} ry={26} fill="#b9a6ff" />
        <circle cx={124} cy={-160} r={4} fill={INK} />
        <path d="M30,-222 l6,-26 l12,22z M62,-226 l10,-24 l8,24z" fill={CR} />
        <ellipse cx={72} cy={-182} rx={19} ry={21 * blink} fill="#fff" />
        <circle cx={76 + look * 6} cy={-180} r={10 * Math.max(blink, 0.3)} fill={INK} /><circle cx={80 + look * 6} cy={-185} r={3.4} fill="#fff" opacity={blink} />
        <path d="M56,-218 Q72,-230 88,-220" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
        <ellipse cx={40} cy={-150} rx={12} ry={7} fill="#ff8fb0" opacity={0.75} />
        <path d={`M86,-136 Q104,${-136 + 12 * happy} 122,-140`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
        <g transform={`rotate(${-20 - wave * (125 + Math.sin(t * 12) * 30)} 52 -110)`}><rect x={42} y={-118} width={26} height={wave ? 74 : 52} rx={13} fill={P2} /><circle cx={55} cy={wave ? -46 : -68} r={wave ? 15 : 0} fill={P} /></g>
      </g>
    </g>
  );
};

// Generic business character (suit), for executives. carry: shows a box
export const Exec: React.FC<{ walk?: number; carry?: boolean; mood?: number; look?: number }> = ({ walk = 0, carry = false, mood = 0, look = 0 }) => {
  const sw = Math.sin(walk) * 18, bob = walk ? Math.abs(Math.cos(walk)) * 8 : 0;
  return (
    <g>
      <ellipse cx={0} cy={6} rx={110} ry={17} fill="rgba(20,30,70,.22)" />
      <g transform={`translate(0 ${-bob})`}>
        <g transform={`rotate(${-sw} 0 -170)`}><rect x={-40} y={-178} width={48} height={176} rx={22} fill="#2a2f45" /><ellipse cx={-14} cy={-6} rx={40} ry={18} fill="#111" /></g>
        <g transform={`rotate(${sw} 0 -170)`}><rect x={-6} y={-178} width={48} height={176} rx={22} fill="#323854" /><ellipse cx={20} cy={-6} rx={40} ry={18} fill="#111" /></g>
        <path d="M-100,-150 Q-110,-340 -72,-400 Q0,-428 72,-400 Q110,-340 100,-150 Z" fill="#3b4268" />
        <path d="M-30,-404 L0,-330 L30,-404 Z" fill="#fff" /><path d="M-8,-392 L8,-392 L12,-300 L0,-284 L-12,-300 Z" fill={C.red} />
        <rect x={-16} y={-432} width={32} height={34} rx={10} fill="#e9b48f" />
        <circle cx={0} cy={-500} r={88} fill="#e9b48f" />
        <path d="M-88,-506 Q-84,-596 0,-598 Q84,-596 88,-506 Q70,-552 0,-556 Q-60,-552 -88,-506Z" fill="#5a5f6e" />
        <ellipse cx={-30} cy={-500} rx={14} ry={17} fill="#fff" /><ellipse cx={30} cy={-500} rx={14} ry={17} fill="#fff" />
        <circle cx={-30 + look * 6} cy={-497} r={8} fill={C.ink} /><circle cx={30 + look * 6} cy={-497} r={8} fill={C.ink} />
        <path d={`M-46,${-532 - mood * 4} L-14,-528 M14,-528 L46,${-532 - mood * 4}`} stroke="#3a3f4e" strokeWidth={7} strokeLinecap="round" />
        <path d={`M-22,-454 Q0,${-454 + mood * 16} 22,-454`} stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" />
        {carry ? (
          <g transform="translate(0 -250)">
            <rect x={-30} y={-120} width={16} height={50} fill="#3a8f4f" /><circle cx={-22} cy={-130} r={26} fill={C.green} /><circle cx={2} cy={-118} r={20} fill="#2fb36a" />
            <rect x={-110} y={-80} width={220} height={130} rx={10} fill="#d9a066" /><rect x={-110} y={-80} width={220} height={26} fill="#c48b52" />
            <circle cx={-110} cy={0} r={24} fill="#e9b48f" /><circle cx={110} cy={0} r={24} fill="#e9b48f" />
          </g>
        ) : (<>
          <g transform="rotate(10 -76 -370)"><rect x={-100} y={-382} width={46} height={168} rx={23} fill="#323854" /><circle cx={-77} cy={-214} r={25} fill="#e9b48f" /></g>
          <g transform="rotate(-10 76 -370)"><rect x={54} y={-382} width={46} height={168} rx={23} fill="#323854" /><circle cx={77} cy={-214} r={25} fill="#e9b48f" /></g>
        </>)}
      </g>
    </g>
  );
};

// Cute sorting robot
export const Robot: React.FC<{ t: number; arm?: number; happy?: number }> = ({ t, arm = 0, happy = 1 }) => (
  <g>
    <ellipse cx={0} cy={6} rx={120} ry={18} fill="rgba(20,30,70,.22)" />
    <rect x={-70} y={-120} width={140} height={120} rx={30} fill="#d8deef" /><rect x={-70} y={-40} width={140} height={20} fill="#c3cae3" />
    <rect x={-110} y={-330} width={220} height={220} rx={50} fill="#eef2fb" /><rect x={-80} y={-280} width={160} height={110} rx={28} fill={C.ink} />
    <path d={`M-40,-226 q12,${-14 * happy} 24,0 M16,-226 q12,${-14 * happy} 24,0`} stroke={C.green} strokeWidth={10} fill="none" strokeLinecap="round" />
    <path d={`M-20,-196 Q0,${-196 + 12 * happy} 20,-196`} stroke={C.green} strokeWidth={8} fill="none" strokeLinecap="round" />
    <rect x={-6} y={-380} width={12} height={50} rx={6} fill="#9aa3c7" /><circle cx={0} cy={-386} r={16} fill={Math.sin(t * 8) > 0 ? C.yellow : C.red} />
    <g transform={`rotate(${-30 - arm * 70} -110 -230)`}><rect x={-160} y={-240} width={56} height={26} rx={13} fill="#c3cae3" /><circle cx={-166} cy={-227} r={22} fill="#9aa3c7" /></g>
    <g transform={`rotate(${30 + arm * 70} 110 -230)`}><rect x={104} y={-240} width={56} height={26} rx={13} fill="#c3cae3" /><circle cx={166} cy={-227} r={22} fill="#9aa3c7" /></g>
  </g>
);

export const Icon: React.FC<{ k: string; s?: number; c?: string }> = ({ k, s = 1, c }) => {
  const g = (ch: React.ReactNode) => <g transform={`scale(${s})`}>{ch}</g>;
  switch (k) {
    case 'mail': return g(<><rect x={-70} y={-48} width={140} height={96} rx={14} fill={c || '#4fb3ff'} stroke="#fff" strokeWidth={8} /><path d="M-62,-38 L0,8 L62,-38" stroke="#fff" strokeWidth={8} fill="none" strokeLinejoin="round" /></>);
    case 'chat': return g(<><path d="M-70,-50 h140 a20,20 0 0 1 20,20 v60 a20,20 0 0 1 -20,20 h-80 l-36,30 v-30 h-24 a20,20 0 0 1 -20,-20 v-60 a20,20 0 0 1 20,-20z" fill={c || '#7b6cff'} stroke="#fff" strokeWidth={8} /><circle cx={-30} cy={0} r={9} fill="#fff" /><circle cx={0} cy={0} r={9} fill="#fff" /><circle cx={30} cy={0} r={9} fill="#fff" /></>);
    case 'calendar': return g(<><rect x={-62} y={-56} width={124} height={116} rx={16} fill="#fff" stroke={c || C.red} strokeWidth={8} /><rect x={-62} y={-56} width={124} height={32} rx={12} fill={c || C.red} />{[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={-44 + (i % 3) * 32} y={-6 + Math.floor(i / 3) * 30} width={22} height={18} rx={4} fill="#c9d0ea" />)}</>);
    case 'folder': return g(<><path d="M-70,-50 h50 l14,16 h76 a10,10 0 0 1 10,10 v80 a10,10 0 0 1 -10,10 h-130 a10,10 0 0 1 -10,-10z" fill={c || '#2fb3a8'} stroke="#fff" strokeWidth={8} /></>);
    case 'spark': return g(<><path d="M0,-70 L18,-18 L70,0 L18,18 L0,70 L-18,18 L-70,0 L-18,-18Z" fill={c || '#b779ff'} stroke="#fff" strokeWidth={7} strokeLinejoin="round" /></>);
    case 'shieldx': return g(<><path d="M0,-66 L56,-44 Q58,24 0,68 Q-58,24 -56,-44Z" fill={c || '#3b4268'} stroke="#fff" strokeWidth={8} /></>);
    case 'chip': return g(<><rect x={-70} y={-70} width={140} height={140} rx={20} fill={c || C.green} stroke="#fff" strokeWidth={8} />{[-40, 0, 40].map((v) => <g key={v}><rect x={v - 7} y={-96} width={14} height={22} rx={4} fill="#9aa3c7" /><rect x={v - 7} y={74} width={14} height={22} rx={4} fill="#9aa3c7" /><rect x={-96} y={v - 7} width={22} height={14} rx={4} fill="#9aa3c7" /><rect x={74} y={v - 7} width={22} height={14} rx={4} fill="#9aa3c7" /></g>)}<rect x={-36} y={-36} width={72} height={72} rx={10} fill="#1f8f55" /></>);
    case 'globe': return g(<><circle r={70} fill="#4fb3ff" stroke="#fff" strokeWidth={10} /><path d="M-70,0 h140 M0,-70 q-50,70 0,140 q50,-70 0,-140" stroke="#fff" strokeWidth={8} fill="none" /><path d="M-30,-40 q20,-10 40,6 q-10,20 -30,16z M10,20 q24,-4 30,20 q-20,10 -30,-6z" fill={C.green} /></>);
    case 'down': return g(<><path d="M-80,-60 L-20,0 L10,-30 L80,40" stroke={c || C.red} strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M86,46 L86,0 M86,46 L40,46" stroke={c || C.red} strokeWidth={22} strokeLinecap="round" /></>);
    case 'up': return g(<><path d="M-80,60 L-20,0 L10,30 L80,-40" stroke={c || C.green} strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M86,-46 L86,0 M86,-46 L40,-46" stroke={c || C.green} strokeWidth={22} strokeLinecap="round" /></>);
    case 'tag': return g(<><path d="M-80,-40 h110 l50,40 l-50,40 h-110z" fill={c || C.yellow} stroke="#fff" strokeWidth={8} strokeLinejoin="round" /><circle cx={28} cy={0} r={10} fill="#fff" /></>);
    case 'warn': return g(<><path d="M0,-92 L86,64 L-86,64 Z" fill={c || C.red} stroke="#fff" strokeWidth={14} strokeLinejoin="round" /><rect x={-9} y={-42} width={18} height={62} rx={9} fill="#fff" /><circle cx={0} cy={42} r={11} fill="#fff" /></>);
    case 'x': return g(<><circle r={34} fill={C.red} stroke="#fff" strokeWidth={8} /><path d="M-13,-13 L13,13 M13,-13 L-13,13" stroke="#fff" strokeWidth={9} strokeLinecap="round" /></>);
    case 'check': return g(<><circle r={34} fill={C.green} stroke="#fff" strokeWidth={8} /><path d="M-14,0 L-3,11 L16,-12" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" /></>);
    case 'phone': return g(<><rect x={-44} y={-80} width={88} height={160} rx={18} fill={C.ink} stroke="#fff" strokeWidth={8} /><rect x={-32} y={-62} width={64} height={110} rx={8} fill="#4fb3ff" /></>);
    default: return null;
  }
};
