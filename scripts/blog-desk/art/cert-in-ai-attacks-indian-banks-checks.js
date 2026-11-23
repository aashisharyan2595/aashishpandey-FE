// Concept file: CERT-In AI attacks on Indian payment systems. Light palette, vermilion accent.
const { head, mk, svg } = require('../art.js');
const CREAM = '#f6efe3', INK = '#16181d', RED = '#d6452a', PALE = '#e9e2d3';
const coin = (x, y, r, t, f) => `<g transform="translate(${x},${y})"><circle r="${r}" fill="${f}" stroke="${INK}" stroke-width="6"/><circle r="${r - 14}" fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="5 7"/><text y="${r * 0.34}" text-anchor="middle" font-family="Geist" font-weight="900" font-size="${r * 1.0}" fill="${INK}">${t}</text></g>`;
const bill = (x, y, rot) => `<g transform="translate(${x},${y}) rotate(${rot})"><rect x="-120" y="-56" width="240" height="112" rx="10" fill="${CREAM}" stroke="${INK}" stroke-width="6"/><circle r="30" fill="${RED}" stroke="${INK}" stroke-width="5"/><rect x="-100" y="-38" width="44" height="14" rx="4" fill="${INK}"/><rect x="56" y="24" width="44" height="14" rx="4" fill="${INK}"/></g>`;
const node = (x, y, t) => `<g transform="translate(${x},${y})"><rect x="-120" y="-52" width="240" height="104" rx="18" fill="${CREAM}" stroke="${INK}" stroke-width="6"/><text text-anchor="middle" font-family="Geist" font-weight="800" font-size="36" fill="${INK}">${t.split('|').map((l, i) => `<tspan x="0" y="${i ? 34 : -4}">${l}</tspan>`).join('')}</text></g>`;
module.exports = {
  slug: 'cert-in-ai-attacks-indian-banks-checks',
  palette: 'light',
  cover: { alt: 'A small one-rupee coin followed by a tall stack of banknotes, headline "The one-rupee test"',
    html: `<div id="g" style="background:${CREAM};color:${INK}">${svg(`${coin(700, 450, 62, '1', '#f3c96b')}<path d="M772 430 C 830 330, 880 300, 930 270" fill="none" stroke="${RED}" stroke-width="8" stroke-dasharray="4 18" stroke-linecap="round"/><path d="M930 270 l-34 4 M930 270 l-8 32" stroke="${RED}" stroke-width="8" stroke-linecap="round"/>${bill(1000, 470, -3)}${bill(1010, 400, 3)}${bill(1000, 330, -2)}${bill(1008, 260, 4)}${bill(1000, 190, -3)}`)}
${head(`The one-rupee<br><i style="color:${RED}">test.</i>`, { c: INK, k: RED, kick: 'CERT-IN WARNS ON AI ATTACKS', t: 80, w: 560 })}${mk()}</div>` },
  art: [{ name: 'money-path', alt: 'Four steps: exposed server, payout system, mule accounts, IMPS and NEFT withdrawal', caption: 'How the money leaves, as I4C describes it.', before: 'How do the attackers',
    html: `<div id="g" style="background:${PALE};color:${INK}">${svg(`${node(150, 400, 'Open|server')}${node(440, 400, 'Payout|API')}${node(730, 400, 'Mule|accounts')}${node(1020, 400, 'IMPS|/ NEFT')}<path d="M274 400 H316 M564 400 H606 M854 400 H896" stroke="${RED}" stroke-width="8" stroke-linecap="round"/><path d="M316 400 l-18 -14 M316 400 l-18 14 M606 400 l-18 -14 M606 400 l-18 14 M896 400 l-18 -14 M896 400 l-18 14" stroke="${RED}" stroke-width="8" stroke-linecap="round"/>`)}
${head(`How the money<br><i style="color:${RED}">leaves.</i>`, { c: INK, k: RED, kick: 'THE PATH, IN FOUR STEPS', t: 40, w: 760, font: "400 96px/.92 'Instrument Serif'" })}${mk()}</div>` }],
};
