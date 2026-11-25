// Concept file: US remote-access AI chip rule. Light cream ground, blue accent.
const { head, mk, svg } = require('../art.js');
const GROUND = '#f4ede1', INK = '#14182b', BLUE = '#2a4fd0', PALE = '#e3e8f7', CREAM = '#fffaf0';
const unit = (x, y, lit) => `<g transform="translate(${x},${y})"><rect x="-150" y="-26" width="300" height="52" rx="10" fill="${CREAM}" stroke="${INK}" stroke-width="5"/><circle cx="-116" cy="0" r="9" fill="${lit ? BLUE : INK}" opacity="${lit ? 1 : .35}"/><rect x="-86" y="-8" width="150" height="16" rx="6" fill="${INK}" opacity=".25"/><rect x="82" y="-8" width="40" height="16" rx="6" fill="${INK}" opacity=".25"/></g>`;
const pill = (x, y, t) => `<g transform="translate(${x},${y})"><rect x="-150" y="-44" width="300" height="88" rx="44" fill="${CREAM}" stroke="${INK}" stroke-width="6"/><text y="14" text-anchor="middle" font-family="Geist" font-weight="800" font-size="38" fill="${INK}">${t}</text></g>`;
module.exports = {
  slug: 'ai-chip-export-rule-remote-access',
  palette: 'light',
  cover: { alt: 'A server rack behind a locked padlock, headline "The rented-chip loophole, shut"',
    html: `<div id="g" style="background:${GROUND};color:${INK}">${svg(`<g transform="translate(900,330)">${unit(0,-130,1)}${unit(0,-60,1)}${unit(0,10,0)}${unit(0,80,1)}${unit(0,150,0)}<g transform="translate(0,20)"><rect x="-70" y="-10" width="140" height="110" rx="18" fill="${BLUE}" stroke="${INK}" stroke-width="7"/><path d="M-38 -10 V-50 a38 38 0 0 1 76 0 V-10" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><circle cx="0" cy="40" r="13" fill="${INK}"/></g></g>`)}
${head(`The rented-chip<br><i style="color:${BLUE}">loophole, shut.</i>`, { c: INK, k: BLUE, kick: 'US AI CHIP RULE', t: 80, w: 620 })}${mk()}</div>` },
  art: [{ name: 'five-countries', alt: 'Five countries now needing chip licences: Indonesia, Malaysia, Singapore, Thailand, Brazil', caption: 'Indonesia, Malaysia, Singapore, Thailand and Brazil now need licences for advanced chip shipments.', before: 'Why now',
    html: `<div id="g" style="background:${PALE};color:${INK}">${svg(`${pill(260,380,'Indonesia')}${pill(600,380,'Malaysia')}${pill(940,380,'Singapore')}${pill(430,500,'Thailand')}${pill(770,500,'Brazil')}`)}
${head(`Five more places<br><i style="color:${BLUE}">need a licence.</i>`, { c: INK, k: BLUE, kick: 'CHIP SHIPMENTS', t: 40, w: 900, font: "400 92px/.92 'Instrument Serif'" })}${mk()}</div>` }],
};
