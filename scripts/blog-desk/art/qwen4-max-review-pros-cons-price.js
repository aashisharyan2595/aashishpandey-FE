// Concept file: Qwen4-Max review. Light off-white ground, green accent. Cover = a small price tag next to a tall one. In-post = independent index bars.
const { head, mk, svg } = require('../art.js');
const GROUND = '#f1f4ec', INK = '#14182b', GREEN = '#1f8a5f', PALE = '#e4ece0', CREAM = '#fbfdf7';
const tag = (x, y, s, fill, label, val) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M0 -120 L150 -60 V130 a40 40 0 0 1 -40 40 H-110 a40 40 0 0 1 -40 -40 V-60 Z" fill="${fill}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/><circle cx="0" cy="-82" r="14" fill="${GROUND}" stroke="${INK}" stroke-width="6"/><text y="70" text-anchor="middle" font-family="Instrument Serif" font-size="120" fill="${fill === GREEN ? CREAM : INK}">${val}</text><text y="130" text-anchor="middle" font-family="Geist" font-weight="800" font-size="28" fill="${fill === GREEN ? CREAM : INK}">${label}</text></g>`;
const bar = (x, h, fill, label, val) => `<g transform="translate(${x},520)"><rect x="-70" y="${-h}" width="140" height="${h}" rx="14" fill="${fill}" stroke="${INK}" stroke-width="6"/><text y="${-h - 20}" text-anchor="middle" font-family="Geist" font-weight="800" font-size="48" fill="${INK}">${val}</text><text y="50" text-anchor="middle" font-family="Geist" font-weight="700" font-size="28" fill="${INK}">${label}</text></g>`;
module.exports = {
  slug: 'qwen4-max-review-pros-cons-price',
  palette: 'light',
  cover: { alt: 'A small green $4.50 price tag next to a larger $20 tag, headline "A quarter of the price"',
    html: `<div id="g" style="background:${GROUND};color:${INK}">${svg(`${tag(700, 380, 0.85, GREEN, 'QWEN4-MAX OUT', '$4.50')}${tag(990, 330, 1.1, CREAM, 'OPUS 5.5 OUT', '$20')}`)}
${head(`A quarter<br>of the price.<br><i style="color:${GREEN}">Rank 12.</i>`, { c: INK, k: GREEN, kick: 'QWEN4-MAX REVIEW', t: 70, w: 620 })}${mk()}</div>` },
  art: [{ name: 'index-scores', alt: 'Four bars of the Artificial Analysis index: Fable 5.2 at 65, Opus 5.5 at 59, Kimi K3.1 Pro at 46, Qwen4-Max at 43', caption: 'On the Artificial Analysis index, as the Super Intel newsletter reports it, Qwen4-Max scores 43 against 59 for Opus 5.5.', before: 'Pros',
    html: `<div id="g" style="background:${PALE};color:${INK}">${svg(`${bar(480, 340, CREAM, 'Fable 5.2', '65')}${bar(650, 309, CREAM, 'Opus 5.5', '59')}${bar(820, 241, CREAM, 'Kimi K3.1', '46')}${bar(980, 225, GREEN, 'Qwen4-Max', '43')}`)}
${head(`Cheap, but<br><i style="color:${GREEN}">behind.</i>`, { c: INK, k: GREEN, kick: 'INDEPENDENT INDEX SCORE', t: 40, w: 460, font: "400 92px/.92 'Instrument Serif'" })}${mk()}</div>` }],
};
