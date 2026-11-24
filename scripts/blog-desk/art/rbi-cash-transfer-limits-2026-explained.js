// Concept file: RBI cash transfer limits stayed the same. Light mint ground, green accent.
const { head, mk, svg } = require('../art.js');
const GROUND = '#e6f0e4', INK = '#14201a', GREEN = '#1f7a4d', CREAM = '#f6f1e4', PALE = '#d9e8d6';
const note = (x, y, rot, amt) => `<g transform="translate(${x},${y}) rotate(${rot})"><rect x="-150" y="-70" width="300" height="140" rx="12" fill="${CREAM}" stroke="${INK}" stroke-width="6"/><circle cx="-90" cy="0" r="34" fill="${GREEN}" stroke="${INK}" stroke-width="5"/><rect x="-30" y="-40" width="150" height="14" rx="5" fill="${INK}"/><rect x="-30" y="-14" width="110" height="10" rx="4" fill="${INK}" opacity=".45"/>${amt ? `<text x="120" y="52" text-anchor="end" font-family="Geist" font-weight="900" font-size="40" fill="${INK}">${amt}</text>` : ''}</g>`;
const stamp = `<g transform="translate(330,490) rotate(-6)"><rect x="-165" y="-42" width="330" height="84" rx="10" fill="none" stroke="${GREEN}" stroke-width="8"/><text y="14" text-anchor="middle" font-family="Geist" font-weight="900" font-size="44" letter-spacing="3" fill="${GREEN}">UNCHANGED</text></g>`;
const node = (x, y, t) => `<g transform="translate(${x},${y})"><rect x="-120" y="-52" width="240" height="104" rx="18" fill="${CREAM}" stroke="${INK}" stroke-width="6"/><text text-anchor="middle" font-family="Geist" font-weight="800" font-size="36" fill="${INK}">${t.split('|').map((l, i) => `<tspan x="0" y="${i ? 34 : -4}">${l}</tspan>`).join('')}</text></g>`;
module.exports = {
  slug: 'rbi-cash-transfer-limits-2026-explained',
  palette: 'light',
  cover: { alt: 'A stack of banknotes stamped UNCHANGED, headline "The cash cap that stayed"',
    html: `<div id="g" style="background:${GROUND};color:${INK}">${svg(`${note(930, 470, -3, '')}${note(940, 400, 3, '')}${note(930, 330, -2, '')}${note(938, 260, 4, '₹50,000')}${stamp}`)}
${head(`The cash cap<br><i style="color:${GREEN}">that stayed.</i>`, { c: INK, k: GREEN, kick: 'RBI TRANSFER RULES, NOV 2026', t: 80, w: 560 })}${mk()}</div>` },
  art: [{ name: 'four-limits', alt: 'Four RBI cash limits: 50,000 at a branch, 5,000 per agent transfer, 25,000 a month, 10,000 per payout', caption: 'The four limits the RBI kept in its November 2026 directions.', before: 'What checks will senders',
    html: `<div id="g" style="background:${PALE};color:${INK}">${svg(`${node(150, 400, '₹50,000|branch')}${node(440, 400, '₹5,000|per agent')}${node(730, 400, '₹25,000|a month')}${node(1020, 400, '₹10,000|per payout')}`)}
${head(`Four limits,<br><i style="color:${GREEN}">same as before.</i>`, { c: INK, k: GREEN, kick: 'WHAT THE RBI KEPT', t: 40, w: 760, font: "400 96px/.92 'Instrument Serif'" })}${mk()}</div>` }],
};
