// Concept file: 1Password breach. Light warm ground, coral accent.
const { head, mk, svg } = require('../art.js');
const GROUND = '#f6efe6', INK = '#1b1714', RED = '#d6452f', CREAM = '#fbf7ef', PALE = '#ead9c6';
const vault = `<g transform="translate(850,330)"><rect x="-150" y="-160" width="300" height="320" rx="30" fill="${PALE}" stroke="${INK}" stroke-width="8"/><circle r="92" fill="${CREAM}" stroke="${INK}" stroke-width="8"/><circle r="22" fill="${INK}"/><path d="M0 -92 V-52 M0 92 V52 M-92 0 H-52 M92 0 H52 M-65 -65 l28 28 M65 -65 l-28 28 M-65 65 l28 -28 M65 65 l-28 -28" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><rect x="-150" y="-100" width="12" height="46" rx="4" fill="${INK}"/><rect x="-150" y="54" width="12" height="46" rx="4" fill="${INK}"/></g>`;
const envelope = (x, y, rot, s = 1) => `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})"><rect x="-110" y="-70" width="220" height="140" rx="12" fill="${CREAM}" stroke="${INK}" stroke-width="7"/><path d="M-110 -62 L0 20 L110 -62" fill="none" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/><circle cx="62" cy="38" r="22" fill="${RED}" stroke="${INK}" stroke-width="5"/><text x="62" y="47" text-anchor="middle" font-family="Geist" font-weight="900" font-size="28" fill="${CREAM}">@</text></g>`;
const hook = `<g transform="translate(850,0)"><path d="M0 0 V190" stroke="${INK}" stroke-width="5"/><path d="M0 190 V290 C0 345 -62 345 -62 292" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M-62 292 l-16 -26 M-62 292 l18 -22" stroke="${INK}" stroke-width="10" stroke-linecap="round"/></g>`;
module.exports = {
  slug: '1password-breach-employee-github-customer-emails',
  palette: 'light',
  cover: { alt: 'A closed vault door with an envelope slipping out from behind it, headline "Vaults safe. Emails not."',
    html: `<div id="g" style="background:${GROUND};color:${INK}">${svg(`${vault}${envelope(1000, 500, 10, .8)}`)}
${head(`Vaults safe.<br><i style="color:${RED}">Emails not.</i>`, { c: INK, k: RED, kick: '1PASSWORD BREACH, NOV 2026', t: 80, w: 540 })}${mk()}</div>` },
  art: [{ name: 'real-bait', alt: 'An envelope hanging from a fishing hook, showing why leaked names and emails make phishing believable', caption: '1Password tells customers to treat any surprise email, text or call about their account as suspect.', before: 'Why phishing',
    html: `<div id="g" style="background:${PALE};color:${INK}">${svg(`${hook}${envelope(850, 400, -8, 1.05)}`)}
${head(`Real name.<br><i style="color:${RED}">Real bait.</i>`, { c: INK, k: RED, kick: 'WHY PHISHING IS THE RISK', t: 130, w: 560, font: "400 104px/.92 'Instrument Serif'" })}${mk()}</div>` }],
};
