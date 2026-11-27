// Concept file: CrowdStrike buys Zscaler. Light cool ground, violet accent.
const { head, mk, svg } = require('../art.js');
const GROUND = '#eeeef7', INK = '#16152b', VIO = '#5a3fd1', CREAM = '#fbfaff', PALE = '#dcdcf0';
const shield = (x, y, s, fill, op = 1) => `<g transform="translate(${x},${y}) scale(${s})" opacity="${op}"><path d="M0 -130 L100 -92 V12 C100 82 46 128 0 150 C-46 128 -100 82 -100 12 V-92 Z" fill="${fill}" stroke="${INK}" stroke-width="${8 / s}" stroke-linejoin="round"/></g>`;
module.exports = {
  slug: 'crowdstrike-buys-zscaler-43-9-billion-deal',
  palette: 'light',
  cover: { alt: 'Two shields overlapping and merging into one, headline "$43.9B, all stock."',
    html: `<div id="g" style="background:${GROUND};color:${INK}">${svg(`${shield(760, 320, 1.6, CREAM)}${shield(930, 320, 1.6, VIO, .88)}<path d="M900 250 v140 M830 320 h140" stroke="${INK}" stroke-width="0"/>`)}
${head(`$43.9B,<br><i style="color:${VIO}">all stock.</i>`, { c: INK, k: VIO, kick: 'CROWDSTRIKE + ZSCALER', t: 80, w: 540 })}${mk()}</div>` },
  art: [{ name: 'overlap', alt: 'Two overlapping circles: Zscaler with about 8,000 customers and over 2,000 shared with CrowdStrike', caption: 'Zscaler serves about 8,000 enterprise customers, and over 2,000 of them already use CrowdStrike too.', before: 'What we don',
    html: `<div id="g" style="background:${PALE};color:${INK}">${svg(`<circle cx="800" cy="330" r="165" fill="${CREAM}" stroke="${INK}" stroke-width="8"/><circle cx="950" cy="330" r="165" fill="${VIO}" fill-opacity=".85" stroke="${INK}" stroke-width="8"/><rect x="838" y="290" width="84" height="80" rx="0" fill="none"/><text x="875" y="342" text-anchor="middle" font-family="Geist" font-weight="900" font-size="38" fill="${CREAM}">2,000+</text><text x="870" y="132" text-anchor="end" font-family="Geist" font-weight="800" font-size="32" fill="${INK}">CrowdStrike</text><text x="910" y="132" font-family="Geist" font-weight="800" font-size="32" fill="${INK}">Zscaler 8,000</text>`)}
${head(`Only 2,000<br><i style="color:${VIO}">overlap.</i>`, { c: INK, k: VIO, kick: 'THE CUSTOMER MAP', t: 110, w: 520, font: "400 100px/.92 'Instrument Serif'" })}${mk()}</div>` }],
};
