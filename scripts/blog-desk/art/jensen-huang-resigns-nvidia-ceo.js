// Example concept file (the live Jensen Huang post). One idea per image, one illustration, one accent colour.
const { head, mk, svg } = require('../art.js');
const BG = '#0d0d0d', CR = '#f2f2f2', GR = '#76b900', INK = '#0d0d0d';
const box = (x, y, t, s, dash) => `<g transform="translate(${x},${y})"><rect x="-130" y="-46" width="260" height="92" rx="14" fill="${dash ? 'none' : INK}" stroke="${INK}" stroke-width="5" ${dash ? 'stroke-dasharray="12 10"' : ''}/><text y="-4" text-anchor="middle" font-family="Geist" font-weight="900" font-size="28" fill="${dash ? INK : '#fff'}">${t}</text><text y="28" text-anchor="middle" font-family="Geist" font-weight="600" font-size="20" fill="${dash ? INK : '#fff'}" opacity=".8">${s}</text></g>`;
module.exports = {
  slug: 'jensen-huang-resigns-nvidia-ceo',
  cover: { alt: 'An empty office chair under a spotlight, headline "The empty chair"',
    html: `<div id="g" style="background:radial-gradient(circle at 75% 40%,#2a2a2a,${BG} 60%);color:${CR}">${svg(`<g transform="translate(880,340)"><rect x="-110" y="-230" width="220" height="230" rx="40" fill="#1f1f1f" stroke="${CR}" stroke-opacity=".3" stroke-width="3"/><rect x="-140" y="0" width="280" height="50" rx="20" fill="#1f1f1f" stroke="${CR}" stroke-opacity=".3" stroke-width="3"/><rect x="-10" y="50" width="20" height="120" fill="#333"/><path d="M-110 200 L0 170 L110 200" fill="none" stroke="#333" stroke-width="16" stroke-linecap="round"/><path d="M-240 -300 L0 -40 L240 -300" fill="${CR}" opacity=".05"/></g>`)}
${head(`The empty<br><i style="color:${GR}">chair.</i>`, { c: CR, k: GR, kick: 'NVIDIA CEO RESIGNS', t: 120, w: 520 })}${mk()}</div>` },
  art: [{ name: 'new-chart', alt: 'Org chart: new board chair Harvey C. Jones, interim CEO Colette Kress, permanent CEO search under way', caption: 'Who runs Nvidia now, as announced on 12 November.',
    html: `<div id="g" style="background:${GR}">${svg(`${box(880, 150, 'Board chair', 'Harvey C. Jones (new)')}${box(880, 320, 'Interim CEO', 'Colette Kress')}${box(880, 490, 'Permanent CEO', 'search under way', 1)}<path d="M880 196 V274 M880 366 V444" stroke="${INK}" stroke-width="5"/>`)}
${head(`Nvidia's<br><i>new chart.</i>`, { c: INK, k: INK, kick: 'AFTER JENSEN HUANG', t: 120, w: 520 })}${mk('right:auto;left:64px')}</div>` }],
};
