// Concept file: Gemini 4 Neon review. Light cream ground, coral accent. Cover = a price tag carrying the score; in-post = cost per task bars.
const { head, mk, svg } = require('../art.js');
const GROUND = '#f6efe3', INK = '#14182b', CORAL = '#e0562b', PALE = '#f3e3d8', CREAM = '#fffaf0';
const bar = (x, h, fill, label, val) => `<g transform="translate(${x},560)"><rect x="-90" y="${-h}" width="180" height="${h}" rx="14" fill="${fill}" stroke="${INK}" stroke-width="6"/><text y="${-h - 22}" text-anchor="middle" font-family="Geist" font-weight="800" font-size="52" fill="${INK}">${val}</text><text y="52" text-anchor="middle" font-family="Geist" font-weight="700" font-size="36" fill="${INK}">${label}</text></g>`;
module.exports = {
  slug: 'gemini-4-neon-review-pros-cons',
  palette: 'light',
  cover: { alt: 'A price tag reading $3 hung on a big 61, headline "A 61 for $3"',
    html: `<div id="g" style="background:${GROUND};color:${INK}">${svg(`<g transform="translate(930,330)"><path d="M0 -120 L150 -60 V130 a40 40 0 0 1 -40 40 H-110 a40 40 0 0 1 -40 -40 V-60 Z" fill="${CORAL}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/><circle cx="0" cy="-82" r="14" fill="${GROUND}" stroke="${INK}" stroke-width="6"/><text y="82" text-anchor="middle" font-family="Instrument Serif" font-size="200" fill="${CREAM}">61</text><text y="140" text-anchor="middle" font-family="Geist" font-weight="800" font-size="30" fill="${INK}">$3 PER M TOKENS</text></g>`)}
${head(`A 61 for<br><i style="color:${CORAL}">three dollars.</i>`, { c: INK, k: CORAL, kick: 'GEMINI 4 NEON REVIEW', t: 80, w: 620 })}${mk()}</div>` },
  art: [{ name: 'cost-per-task', alt: 'Two bars: Neon at $3.74 per task against Carbon at $7.76', caption: 'Artificial Analysis measured $3.74 per benchmark task for Neon at high against $7.76 for Carbon.', before: 'What do independent tests say?',
    html: `<div id="g" style="background:${PALE};color:${INK}">${svg(`${bar(620, 190, CORAL, 'Neon', '$3.74')}${bar(920, 390, CREAM, 'Carbon', '$7.76')}`)}
${head(`Half the cost<br><i style="color:${CORAL}">per task.</i>`, { c: INK, k: CORAL, kick: 'COST PER TASK, HIGH SETTING', t: 40, w: 520, font: "400 92px/.92 'Instrument Serif'" })}${mk()}</div>` }],
};
