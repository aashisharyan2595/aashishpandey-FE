// Cover: 11 days out, then back. In-post: share price fell, then jumped. Light ground, one orange accent.
const { head, mk, svg } = require('../art.js');
const BG = '#f4efe3', INK = '#14141f', OR = '#d9481c';
const days = Array.from({ length: 11 }, (_, i) => { const x = 560 + i * 54, last = i === 10;
  return `<circle cx="${x}" cy="360" r="20" fill="${i === 0 ? INK : last ? OR : 'none'}" stroke="${INK}" stroke-width="5"/>${i === 0 ? `<path d="M${x - 8} 352 L${x + 8} 368 M${x + 8} 352 L${x - 8} 368" stroke="${BG}" stroke-width="5" stroke-linecap="round"/>` : ''}${last ? `<path d="M${x - 9} 360 L${x - 2} 368 L${x + 10} 351" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}`; }).join('');
const bar = (x, h, c, t, s) => `<rect x="${x}" y="${470 - h}" width="150" height="${h}" rx="10" fill="${c}"/><text x="${x + 75}" y="${440 - h}" text-anchor="middle" font-family="Geist" font-weight="900" font-size="40" fill="${INK}">${t}</text><text x="${x + 75}" y="515" text-anchor="middle" font-family="Geist" font-weight="600" font-size="24" fill="${INK}">${s}</text>`;
module.exports = {
  slug: 'nvidia-reinstates-jensen-huang-ceo',
  palette: 'light',
  cover: { alt: 'Eleven circles in a row, the first crossed out and the last ticked, headline "11 days. Then back."',
    html: `<div id="g" style="background:${BG};color:${INK}">${svg(`${days}<path d="M560 330 Q830 220 1100 330" fill="none" stroke="${OR}" stroke-width="6" stroke-dasharray="4 14" stroke-linecap="round"/>`)}
${head(`11 days.<br><i style="color:${OR}">Then back.</i>`, { c: INK, k: OR, kick: 'NVIDIA REINSTATES ITS CEO', t: 120, w: 500 })}${mk()}</div>` },
  art: [{ name: 'share-move', alt: 'Two bars: Nvidia shares down more than 16% since early November, then up 27% on reinstatement day', caption: 'Nvidia shares: down more than 16% since early November (NPR, 17 Nov), then up 27% by 9:51 am ET on 23 Nov (TechCrunch).', before: 'What the market did',
    html: `<div id="g" style="background:${BG}">${svg(`${bar(640, 160, INK, '-16%', 'early Nov')}${bar(860, 250, OR, '+27%', '23 Nov')}<line x1="600" y1="470" x2="1060" y2="470" stroke="${INK}" stroke-width="4"/>`)}
${head(`Down, then<br><i style="color:${OR}">up fast.</i>`, { c: INK, k: OR, kick: 'NVIDIA SHARES', t: 120, w: 520 })}${mk('right:auto;left:64px')}</div>` }],
};
