import React from 'react';
import { AbsoluteFill, staticFile, delayRender, continueRender } from 'remotion';
import { C, Muja } from './kit';
import { TYPES, col } from './scenes';
import { wordsOf, FPS } from './Video';

const font = new FontFace('Geist', `url(${staticFile('geist.woff2')}) format('woff2')`, { weight: '100 900' });
const hF = delayRender('font');
font.load().then((x) => { document.fonts.add(x); continueRender(hF); });

export type TP = { v: any; tl: any; k: number; wide?: boolean };
const SceneAt: React.FC<{ v: any; tl: any; i: number; f: number }> = ({ v, tl, i, f }) => {
  const sc = v.scenes[i], Cmp = TYPES[sc.type] || TYPES.cast, WS = wordsOf(v, tl), flat = WS[i].flat(), s0 = tl.scenes[i].sentences[0].start;
  const rel = tl.scenes[i].sentences.map((x: any) => x.start - s0);
  const W = (w: string, n = 0) => { const lw = w.toLowerCase(); const hits = flat.filter((x: any) => x.w.toLowerCase().replace(/^[^a-z0-9$]+/, '').startsWith(lw)); const h = hits[n] || hits[0]; return h ? Math.round((h.t0 - s0) * FPS) : 0; };
  return <AbsoluteFill style={{ width: 1080, height: 1920 }}><Cmp f={f} t={f / FPS} dur={10} S={rel} W={W} sc={sc} noBanner /></AbsoluteFill>;
};
const Title: React.FC<{ lines: string[]; color: string; size: number; align?: 'center' | 'left'; maxW?: number }> = ({ lines, color, size, align = 'center', maxW = 900 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', gap: size * 0.16 }}>
    {lines.map((l, i) => { const fs0 = Math.min(i === 0 ? size : size * 0.82, Math.floor(maxW / (l.length * 0.6 + 0.6))); return <div key={i} style={{ background: i === 0 ? color : '#fff', color: i === 0 ? (color === C.yellow ? C.ink : '#fff') : C.ink, fontWeight: 900, fontSize: fs0, lineHeight: 1.02, padding: `${size * 0.1}px ${size * 0.3}px ${size * 0.16}px`, borderRadius: size * 0.22, transform: `rotate(${i === 0 ? -3 : 2}deg)`, boxShadow: `0 ${size * 0.11}px 0 rgba(29,35,64,.28)`, whiteSpace: 'nowrap', letterSpacing: -1 }}>{l}</div>; })}
  </div>
);
export const Thumb: React.FC<TP> = ({ v, tl, k, wide }) => {
  const th = v.thumbs[k], color = col(th.color || 'red'), i = th.scene ?? 0, fr = th.f ?? 110;
  const muja = th.muja !== false;
  if (!wide) return (
    <AbsoluteFill style={{ fontFamily: 'Geist, sans-serif', overflow: 'hidden', background: C.sky1 }}>
      <AbsoluteFill style={{ transform: `scale(${th.zoom || 1.18})`, transformOrigin: '50% 78%' }}><SceneAt v={v} tl={tl} i={i} f={fr} /></AbsoluteFill>
      <div style={{ position: 'absolute', top: 210, left: 0, right: 0 }}><Title lines={th.text} color={color} size={th.size || 128} /></div>
      {muja && <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}><g transform={`translate(${th.mujaX ?? 960} 1660) scale(${(th.mujaX ?? 960) < 540 ? 1.05 : -1.05} 1.05)`}><Muja t={1.3} wave={1} look={0.1} /></g></svg>}
    </AbsoluteFill>);
  return (
    <AbsoluteFill style={{ fontFamily: 'Geist, sans-serif', overflow: 'hidden', background: th.bg || '#5cc8ff' }}>
      <div style={{ position: 'absolute', left: 470, top: 0, width: 810, height: 720, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 1080, height: 1920, left: 0, top: -(th.wy ?? 700) * 0.75, transform: 'scale(0.75)', transformOrigin: '0 0' }}><SceneAt v={v} tl={tl} i={i} f={fr} /></div>
      </div>
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{ position: 'absolute', inset: 0 }}><polygon points="0,0 640,0 540,720 0,720" fill="#1d2340" /><polygon points="640,0 660,0 560,720 540,720" fill={color} /></svg>
      <div style={{ position: 'absolute', left: 44, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}><Title lines={th.text} color={color} size={th.wsize || 88} align="left" maxW={520} /></div>
      {muja && <svg width={1280} height={720} viewBox="0 0 1280 720" style={{ position: 'absolute', inset: 0 }}><g transform="translate(1190 716) scale(-0.8 0.8)"><Muja t={1.3} wave={1} look={0.1} /></g></svg>}
    </AbsoluteFill>);
};
