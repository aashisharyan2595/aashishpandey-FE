// Concept file: banks put AI agent losses on customers. Light palette, deep teal accent, a key with a tag.
const { head, mk, svg } = require('../art.js');
const CREAM = '#f6efe3', INK = '#16181d', TEAL = '#0e7c86', PALE = '#e9e2d3', BRASS = '#f3c96b';
const node = (x, y, t, fill = CREAM) => `<g transform="translate(${x},${y})"><rect x="-120" y="-52" width="240" height="104" rx="18" fill="${fill}" stroke="${INK}" stroke-width="6"/><text text-anchor="middle" font-family="Geist" font-weight="800" font-size="36" fill="${INK}">${t.split('|').map((l, i) => `<tspan x="0" y="${i ? 34 : -4}">${l}</tspan>`).join('')}</text></g>`;
const key = `<g transform="translate(850,350) rotate(-16) scale(.82)">
<rect x="70" y="-14" width="250" height="28" rx="8" fill="${BRASS}" stroke="${INK}" stroke-width="6"/>
<rect x="244" y="14" width="30" height="52" rx="6" fill="${BRASS}" stroke="${INK}" stroke-width="6"/><rect x="290" y="14" width="30" height="40" rx="6" fill="${BRASS}" stroke="${INK}" stroke-width="6"/>
<circle r="92" fill="${BRASS}" stroke="${INK}" stroke-width="6"/><circle r="36" fill="${CREAM}" stroke="${INK}" stroke-width="6"/></g>
<path d="M790 318 C 770 270, 740 262, 726 272" fill="none" stroke="${INK}" stroke-width="5"/>
<g transform="translate(672,312) rotate(10)"><rect x="-86" y="-36" width="172" height="72" rx="12" fill="${TEAL}" stroke="${INK}" stroke-width="6"/><text text-anchor="middle" y="14" font-family="Geist" font-weight="900" font-size="38" fill="${CREAM}">YOU PAY</text></g>`;
module.exports = {
  slug: 'banks-ai-agents-customer-liability',
  palette: 'light',
  cover: { alt: 'A yellow key with a teal tag reading YOU PAY, headline "Your AI agent, your loss"',
    html: `<div id="g" style="background:${CREAM};color:${INK}">${svg(key)}
${head(`Your AI agent,<br><i style="color:${TEAL}">your loss.</i>`, { c: INK, k: TEAL, kick: "CITI'S NEW TERMS SAY", t: 80, w: 560 })}${mk()}</div>` },
  art: [{ name: 'who-pays', alt: 'Your login goes to an AI agent that reaches your account; under Citi\'s terms the loss comes back to you', caption: "Where the loss lands under Citi's new terms.", before: 'Why are the banks',
    html: `<div id="g" style="background:${PALE};color:${INK}">${svg(`${node(190, 360, 'You|(customer)')}${node(600, 360, 'AI agent|with login')}${node(1010, 360, 'Your|account')}<path d="M314 360 H466 M734 360 H886" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M466 360 l-18 -14 M466 360 l-18 14 M886 360 l-18 -14 M886 360 l-18 14" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M1010 430 V500 H190 V430" fill="none" stroke="${TEAL}" stroke-width="8" stroke-dasharray="4 16" stroke-linecap="round"/><path d="M190 430 l-14 18 M190 430 l14 18" stroke="${TEAL}" stroke-width="8" stroke-linecap="round"/><text x="600" y="548" text-anchor="middle" font-family="Geist" font-weight="800" font-size="36" fill="${TEAL}">If it goes wrong, the loss comes back to you</text>`)}
${head(`Who carries<br><i style="color:${TEAL}">the loss.</i>`, { c: INK, k: TEAL, kick: "UNDER CITI'S NEW TERMS", t: 40, w: 760, font: "400 96px/.92 'Instrument Serif'" })}${mk()}</div>` }],
};
