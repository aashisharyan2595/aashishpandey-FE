// Concept file: FIFA cyberattack. Light grey-green ground, teal accent.
const { head, mk, svg } = require('../art.js');
const GROUND = '#eaf1ee', INK = '#10201c', TEAL = '#0f8a7e', CREAM = '#f8fbf9', PALE = '#d5e5df';
const folder = `<g transform="translate(870,340)"><path d="M-190 -140 H-60 L-30 -170 H190 V-140" fill="${PALE}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/><rect x="-190" y="-140" width="380" height="290" rx="16" fill="${CREAM}" stroke="${INK}" stroke-width="8"/><rect x="-150" y="-100" width="200" height="14" rx="6" fill="${INK}"/><rect x="-150" y="-68" width="260" height="10" rx="5" fill="${INK}" opacity=".4"/><rect x="-150" y="-44" width="230" height="10" rx="5" fill="${INK}" opacity=".4"/><rect x="-150" y="-20" width="170" height="10" rx="5" fill="${INK}" opacity=".4"/></g>`;
const stamp = `<g transform="translate(900,420) rotate(-10)"><rect x="-190" y="-48" width="380" height="96" rx="12" fill="${CREAM}" fill-opacity=".92" stroke="${TEAL}" stroke-width="9"/><text y="18" text-anchor="middle" font-family="Geist" font-weight="900" font-size="54" letter-spacing="4" fill="${TEAL}">CLAIMED</text></g>`;
module.exports = {
  slug: 'fifa-cyberattack-data-stolen-what-we-know',
  palette: 'light',
  cover: { alt: 'A folder of documents stamped CLAIMED, headline "12 GB claimed."',
    html: `<div id="g" style="background:${GROUND};color:${INK}">${svg(`${folder}${stamp}`)}
${head(`12 GB<br><i style="color:${TEAL}">claimed.</i>`, { c: INK, k: TEAL, kick: 'FIFA CYBERATTACK', t: 80, w: 540 })}${mk()}</div>` },
  art: [{ name: 'tiny-slice', alt: 'A long bar of all FIFA data with a thin sliver marked as the part a source says was affected, under 0.1%', caption: 'A source told Reuters the damage covers under 0.1% of FIFA\'s data. FIFA itself has not given a figure.', before: 'What we don',
    html: `<div id="g" style="background:${PALE};color:${INK}">${svg(`<rect x="100" y="320" width="1000" height="96" rx="16" fill="${CREAM}" stroke="${INK}" stroke-width="8"/><rect x="104" y="324" width="14" height="88" fill="${TEAL}"/><path d="M111 424 V462" stroke="${INK}" stroke-width="5"/><text x="100" y="505" font-family="Geist" font-weight="800" font-size="32" fill="${INK}">Hit, per one source</text><text x="1100" y="505" text-anchor="end" font-family="Geist" font-weight="800" font-size="32" fill="${INK}" opacity=".6">All FIFA data</text>`)}
${head(`Under 0.1%.<br><i style="color:${TEAL}">One source says.</i>`, { c: INK, k: TEAL, kick: 'HOW BIG IS IT?', t: 40, w: 900, font: "400 96px/.92 'Instrument Serif'" })}${mk()}</div>` }],
};
