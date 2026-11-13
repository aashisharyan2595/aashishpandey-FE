import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate, delayRender, continueRender, Easing, CalculateMetadataFunction } from 'remotion';
import { C, Muja, pop, ease } from './kit';
import { TYPES } from './scenes';

const font = new FontFace('Geist', `url(${staticFile('geist.woff2')}) format('woff2')`, { weight: '100 900' });
const hF = delayRender('font');
font.load().then((x) => { document.fonts.add(x); continueRender(hF); });

export const FPS = 30; const OV = 9;
export type Props = { v: any; tl: any; voice?: string; bed?: string };
export const calcMeta: CalculateMetadataFunction<Props> = ({ props }) => ({ durationInFrames: Math.ceil((props.tl.total + 1.0) * FPS) });

// [chuckle]-style voice cues are spoken by the narrator but never shown in captions
const split = (s: string) => s.trim().split(/(?<=[.!?])\s+/).filter(Boolean).map((x) => x.replace(/\[[a-z ]+\]\s*/gi, '').trim());
export function wordsOf(v: any, tl: any) {
  // per scene: list of {w, t0 (absolute)} using the same split as tts.py
  return tl.scenes.map((sc: any, si: number) => { const sents = split(v.scenes[si].say); return sc.sentences.map((sn: any, k: number) => { const ws = (sents[k] || sn.text).split(/\s+/); if (sn.words && sn.words.length === ws.length) return ws.map((w: string, j: number) => ({ w, t0: sn.words[j][0], t1: sn.words[j][1] })); const tot = ws.reduce((a: number, w: string) => a + w.length + 2, 0); let tt = sn.start; return ws.map((w: string) => { const d = ((sn.vend - sn.start) * (w.length + 2)) / tot; const r = { w, t0: tt, t1: tt + d }; tt += d; return r; }); }); });
}
function captions(WS: any[], tl: any) {
  const out: any[] = [];
  WS.forEach((sc: any, si: number) => sc.forEach((W: any[], k: number) => { let cur: any[] = []; W.forEach((w, j) => { cur.push(w); const left = W.length - 1 - j; if ((cur.length >= 4 && left !== 1) || (/[,;:]$/.test(w.w) && cur.length >= 2 && left > 1) || j === W.length - 1) { out.push({ t0: cur[0].t0, t1: 0, words: cur }); cur = []; } }); out[out.length - 1].t1 = tl.scenes[si].sentences[k].end; }));
  out.forEach((c, i) => { if (!c.t1) c.t1 = out[i + 1].t0; });
  return out;
}
// Muja's guest route: wanders in early, waves when the narrator greets him, peeks once mid-video, and waves goodbye at the end
// Where the roaming Muja is. Scenes can carry muja: {react, at, bubble, side} and he comes on to react to the story:
// gasp | worried | think | wow | cheer | interrupt (hand up, trying to cut in; the narrator answers him in the script)
const BEAT: Record<string, { c: string; txt: string }> = { gasp: { c: '#ff5a5f', txt: '!?' }, worried: { c: '#ff8a3d', txt: 'Uh-oh' }, think: { c: '#7b6cff', txt: 'Hmm?' }, wow: { c: '#2f8ae0', txt: 'Wow!' }, cheer: { c: '#1fb5a0', txt: 'Yay!' }, interrupt: { c: '#7b6cff', txt: 'Me! Me!' } };
export function mujaPlan(v: any, tl: any, WS?: any[]) {
  const st = tl.scenes.map((s: any) => s.sentences[0].start), n = st.length, end = tl.total + 0.9, segs: any[] = [];
  const mi = v.scenes.findIndex((s: any) => s.type === 'muja'), m0 = mi >= 0 ? st[mi] - 0.1 : 1e9, m1 = mi >= 0 ? (st[mi + 1] ?? end) + 0.3 : -1;
  const wordT = (si: number, w?: string) => { if (!w || !WS) return st[si] + 0.8; const lw = w.toLowerCase(); const h = WS[si].flat().find((x: any) => x.w.toLowerCase().replace(/^[^a-z0-9$]+/, '').startsWith(lw)); return h ? h.t0 : st[si] + 0.8; };
  const reacts = v.scenes.map((s: any, i: number) => s.muja ? { i, ...s.muja } : null).filter(Boolean);
  if (reacts.length) {
    // one stay on stage per run of neighbouring scenes, so he does not walk off and on again
    reacts.forEach((r: any) => {
      const t0 = st[r.i] + 0.35, t1 = (st[r.i + 1] ?? end) - 0.15, side = r.side || 'r', beat = { t: wordT(r.i, r.at), k: r.react || 'wow', txt: r.bubble };
      const last = segs[segs.length - 1];
      if (last && last.side === side && Math.abs(last.t1 - t0) < 0.8) { last.t1 = t1; last.beats.push(beat); }
      else segs.push({ t0, t1, side, x: side === 'r' ? 945 : 140, beats: [beat] });
    });
  } else if (n > 2) segs.push({ t0: st[1] + 0.6, t1: Math.min(st[2] + 1.6, st[1] + 7), side: 'r', x: 905 });
  segs.push({ t0: st[n - 1] + 0.8, t1: end + 1, side: 'r', x: 860, w0: end - 2.6, w1: end + 1 });
  return segs.filter((s) => !(s.t0 < m1 && m0 < s.t1));
}
const MujaLayer: React.FC<{ t: number; segs: any[] }> = ({ t, segs }) => {
  const s = segs.find((x) => t >= x.t0 && t < x.t1); if (!s) return null;
  const off = s.side === 'r' ? 1220 : -160, inE = ease(t * FPS, s.t0 * FPS, (s.t0 + 1.2) * FPS), outE = s.t1 > 1e3 ? 0 : ease(t * FPS, (s.t1 - 1.2) * FPS, s.t1 * FPS);
  const bt = (s.beats || []).find((b: any) => t >= b.t - 0.15 && t < b.t + 2.3), k = bt?.k;
  const shake = k === 'worried' ? Math.sin(t * 40) * 5 : 0;
  const x = off + (s.x - off) * inE + (off - s.x) * outE + shake, moving = (inE > 0 && inE < 1) || (outE > 0 && outE < 1);
  const toRight = (s.side === 'l' && inE < 1) || (s.side === 'r' && outE > 0);
  const waving = (s.w0 !== undefined && t >= s.w0 && t < s.w1) || k === 'interrupt' || k === 'cheer';
  const inward = s.side === 'r' ? -1 : 1;
  const face = moving ? (toRight ? 1 : -1) : inward;
  const happy = k === 'gasp' || k === 'worried' ? -0.7 : k === 'think' ? 0.2 : 1, hop = k === 'cheer' || k === 'interrupt' ? 0.7 : k === 'gasp' ? 0.35 : k === 'wow' ? 0.3 : waving ? 0.6 : 0;
  const look = k === 'think' ? -0.6 : 0.6;
  const txt = bt ? (bt.txt || BEAT[k].txt) : s.w0 !== undefined && waving ? 'bye!' : '';
  const bub = bt ? pop(t * FPS, (bt.t - 0.15) * FPS) * (1 - ease(t * FPS, (bt.t + 2.0) * FPS, (bt.t + 2.3) * FPS)) : waving ? pop(t * FPS, s.w0 * FPS + 4) : 0;
  const col = bt ? BEAT[k].c : '#7b6cff', bw = Math.max(140, txt.length * 26 + 60), bx = Math.min(1060 - bw / 2, Math.max(20 + bw / 2, x)), tx = x - bx;
  return <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}><g transform={`translate(${x} 1606) scale(${0.72 * face} 0.72)`}><Muja t={t} walk={moving ? t * 10 : 0} wave={waving ? 1 : 0} hop={hop} look={look} happy={happy} /></g>
    {bub > 0.01 && txt && <g transform={`translate(${bx} 1318) scale(${bub}) rotate(${k === 'gasp' ? -4 : 0})`}><rect x={-bw / 2} y={-44} width={bw} height={84} rx={30} fill="#fff" stroke={col} strokeWidth={5} /><path d={`M${tx - 16},38 L${tx},66 L${tx + 16},38 Z`} fill="#fff" stroke={col} strokeWidth={5} strokeLinejoin="round" /><rect x={tx - 20} y={30} width={40} height={10} fill="#fff" /><text x={0} y={14} textAnchor="middle" fontWeight={900} fontSize={42} fill={col} fontFamily="Geist">{txt}</text></g>}
  </svg>;
};

const Scene: React.FC<{ v: any; i: number; dur: number; rel: number[]; WS: any[] }> = ({ v, i, dur, rel, WS }) => {
  const f = useCurrentFrame(); const t = f / FPS; const sc = v.scenes[i]; const Cmp = TYPES[sc.type] || TYPES.cast;
  const flat = WS[i].flat(); const base = rel[0] !== undefined ? flat[0]?.t0 - rel[0] : 0;
  const W = (w: string, n = 0) => { const lw = w.toLowerCase(); const hits = flat.filter((x: any) => x.w.toLowerCase().replace(/^[^a-z0-9$]+/, '').startsWith(lw)); const h = hits[n] || hits[0]; return h ? Math.round((h.t0 - base) * FPS) : 0; };
  const X = i === 0 ? 0 : interpolate(f, [0, OV], [1080, 0], { extrapolateRight: 'clamp', easing: Easing.bezier(0.6, 0, 0.2, 1) });
  return <AbsoluteFill style={{ transform: `translateX(${X}px)`, overflow: 'hidden', boxShadow: i ? '-30px 0 60px rgba(0,0,0,.25)' : undefined }}><Cmp f={f} t={t} dur={dur} S={rel} W={W} sc={sc} /></AbsoluteFill>;
};

export const Video: React.FC<Props> = ({ v, tl, voice = 'voice.wav', bed = 'bed.wav' }) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const st = tl.scenes.map((s: any) => s.sentences[0].start), WS = React.useMemo(() => wordsOf(v, tl), [v, tl]);
  const CH = React.useMemo(() => captions(WS, tl), [WS, tl]), segs = React.useMemo(() => mujaPlan(v, tl, WS), [v, tl, WS]);
  const DUR = Math.ceil((tl.total + 1.0) * FPS), cap = CH.find((c: any) => t >= c.t0 && t < c.t1);
  return (
    <AbsoluteFill style={{ background: C.sky1, fontFamily: 'Geist, sans-serif' }}>
      <Audio src={staticFile(voice)} /><Audio src={staticFile(bed)} />
      {st.map((s: number, i: number) => { const from = Math.round(s * FPS) - (i ? OV : 0); const to = i < st.length - 1 ? Math.round(st[i + 1] * FPS) : DUR; const rel = tl.scenes[i].sentences.map((x: any) => x.start - s); return <Sequence key={i} from={from} durationInFrames={to - from} layout="none"><Scene v={v} i={i} dur={(to - from) / FPS} rel={rel.map((r: number) => r + (i ? OV / FPS : 0))} WS={WS} /></Sequence>; })}
      <MujaLayer t={t} segs={segs} />
      <div style={{ position: 'absolute', top: 70, left: 56, display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(29,35,64,.82)', color: '#fff', borderRadius: 999, padding: '12px 26px 12px 16px', fontWeight: 700, fontSize: 28 }}>
        <span style={{ width: 16, height: 16, borderRadius: 99, background: C.yellow, display: 'inline-block' }} />Aashish Pandey <span style={{ color: C.yellow, fontSize: 22, letterSpacing: '.12em' }}>{(v.label || 'Explainer').toUpperCase()}</span>
      </div>
      <div style={{ position: 'absolute', top: 1660, left: 80, right: 80, textAlign: 'center' }}>
        {cap && <span style={{ display: 'inline-block', background: 'rgba(16,20,44,.78)', color: '#fff', fontWeight: 700, fontSize: 46, lineHeight: 1.25, padding: '12px 26px 16px', borderRadius: 18 }}>
          {cap.words.map((w: any, i: number) => <span key={i} style={{ color: t >= w.t0 ? '#fff' : 'rgba(255,255,255,.55)' }}>{w.w}{i < cap.words.length - 1 ? ' ' : ''}</span>)}
        </span>}
      </div>
    </AbsoluteFill>
  );
};
