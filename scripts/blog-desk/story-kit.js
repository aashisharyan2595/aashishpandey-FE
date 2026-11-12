/* Flat-vector drawing kit for the story videos (browser side). Kurzgesagt-style: no outlines, saturated shapes on deep indigo, soft glows, big-eyed little characters.
   Everything is drawn on a 1080x1920 canvas. Pieces are SVG strings; story-page.js moves them by id. */
(function () {
  const P = { bg1: '#1d2158', bg2: '#0a0d2a', wall: '#252b6e', wall2: '#303889', floor: '#151946', teal: '#3fe0c5', pink: '#ff5f8f', yellow: '#ffc94a', blue: '#5b8cff', orange: '#ff8a4c', violet: '#9b7bff', white: '#eef2ff', ink: '#0b0e2b', grey: '#9aa4d4' };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const DEFS = (acc) => `<defs>
<linearGradient id="gBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.bg1}"/><stop offset="1" stop-color="${P.bg2}"/></linearGradient>
<linearGradient id="gWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.wall2}"/><stop offset="1" stop-color="${P.wall}"/></linearGradient>
<linearGradient id="gFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232a73"/><stop offset="1" stop-color="${P.floor}"/></linearGradient>
<linearGradient id="gBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b7c4f2"/></linearGradient>
<linearGradient id="gBodyJ" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd9c4"/><stop offset="1" stop-color="#ff8a6a"/></linearGradient>
<linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a8"/><stop offset="1" stop-color="#ffb938"/></linearGradient>
<linearGradient id="gDev" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4150c9"/><stop offset="1" stop-color="#232b82"/></linearGradient>
<radialGradient id="gGlow"><stop offset="0" stop-color="${acc}" stop-opacity=".55"/><stop offset="1" stop-color="${acc}" stop-opacity="0"/></radialGradient>
<radialGradient id="gVig" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>
</defs>`;
  const G = (id, inner) => `<g id="${id}">${inner}</g>`;
  // the room: night window, clock, pigeonholes, floor
  function room(acc, stars) {
    let holes = ''; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) holes += `<rect x="${770 + c * 92}" y="${470 + r * 118}" width="80" height="106" rx="14" fill="#1a1f58"/>${(r + c) % 2 ? `<rect x="${780 + c * 92}" y="${540 + r * 118}" width="60" height="38" rx="6" fill="${[P.yellow, P.pink, P.blue, P.teal][(r * 3 + c) % 4]}" opacity=".9"/>` : ''}`;
    return `<rect x="-300" y="-500" width="1680" height="3000" fill="url(#gBg)"/>${stars}
<circle cx="540" cy="840" r="620" fill="url(#gGlow)"/>
<rect x="-300" y="230" width="1680" height="830" fill="url(#gWall)"/>
<g opacity=".35">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${i * 135}" y="230" width="6" height="830" fill="${P.ink}"/>`).join('')}</g>
<rect x="90" y="330" width="330" height="300" rx="34" fill="${P.ink}"/><rect x="104" y="344" width="302" height="272" rx="24" fill="#10154a"/>
<circle cx="320" cy="430" r="44" fill="#fff6c8"/><circle cx="338" cy="418" r="40" fill="#10154a"/><g fill="#fff" opacity=".8"><circle cx="160" cy="400" r="3"/><circle cx="220" cy="470" r="4"/><circle cx="270" cy="400" r="3"/><circle cx="180" cy="540" r="3"/><circle cx="350" cy="560" r="4"/></g>
<rect x="253" y="344" width="8" height="272" fill="${P.ink}"/><rect x="104" y="476" width="302" height="8" fill="${P.ink}"/>
<g id="clock"><circle cx="905" cy="350" r="62" fill="${P.ink}"/><circle cx="905" cy="350" r="52" fill="#f3f6ff"/><rect id="clkH" x="902" y="312" width="6" height="40" rx="3" fill="${P.ink}"/><rect id="clkM" x="903" y="306" width="4" height="46" rx="2" fill="${P.pink}"/><circle cx="905" cy="350" r="6" fill="${P.ink}"/></g>
<rect x="750" y="446" width="300" height="500" rx="26" fill="${P.ink}"/>${holes}
<rect x="-300" y="1060" width="1680" height="900" fill="url(#gFloor)"/><rect x="-300" y="1056" width="1680" height="10" fill="#3a43a0" opacity=".6"/>`;
  }
  // a robot: Dex (white, teal eyes) or Jev (peach, orange eyes). Origin is the middle of the feet.
  function robot(id, o) {
    o = o || {}; const body = o.rival ? 'url(#gBodyJ)' : 'url(#gBody)', eye = o.rival ? P.orange : P.teal, dark = o.rival ? '#5a2347' : '#171d57', side = o.rival ? '#e0705a' : '#97a6e0';
    return `<g id="${id}">
<ellipse cx="0" cy="6" rx="120" ry="16" fill="#000" opacity=".3"/>
<g id="${id}legL"><rect x="-70" y="-84" width="46" height="84" rx="22" fill="${side}"/><rect x="-84" y="-30" width="74" height="30" rx="15" fill="${dark}"/></g>
<g id="${id}legR"><rect x="24" y="-84" width="46" height="84" rx="22" fill="${side}"/><rect x="10" y="-30" width="74" height="30" rx="15" fill="${dark}"/></g>
<g id="${id}body"><rect x="-100" y="-250" width="200" height="190" rx="70" fill="${body}"/><path d="M40 -250 q60 0 60 70 v50 q0 70 -70 70 h-10 q50 -30 50 -90 v-30 q0 -50 -30 -70z" fill="${side}" opacity=".45"/>
<rect x="-52" y="-206" width="104" height="70" rx="26" fill="${dark}"/><circle cx="-24" cy="-171" r="9" fill="${eye}"/><circle cx="4" cy="-171" r="9" fill="${P.yellow}"/><circle cx="32" cy="-171" r="9" fill="${P.pink}"/></g>
<g id="${id}armL"><rect x="-146" y="-232" width="42" height="130" rx="21" fill="${side}"/><circle cx="-125" cy="-100" r="26" fill="${dark}"/></g>
<g id="${id}armR"><rect x="104" y="-232" width="42" height="130" rx="21" fill="${side}"/><circle cx="125" cy="-100" r="26" fill="${dark}"/></g>
<g id="${id}head"><line x1="0" y1="-408" x2="0" y2="-458" stroke="${side}" stroke-width="9" stroke-linecap="round"/><circle id="${id}ant" cx="0" cy="-466" r="17" fill="${P.yellow}"/><circle cx="0" cy="-466" r="34" fill="${P.yellow}" opacity=".25"/>
<circle cx="-146" cy="-318" r="26" fill="${eye}"/><circle cx="146" cy="-318" r="26" fill="${eye}"/>
<rect x="-136" y="-420" width="272" height="190" rx="82" fill="${body}"/><path d="M60 -420 q76 0 76 90 v20 q0 80 -76 80 h-20 q60 -40 60 -110 v-10 q0 -50 -40 -70z" fill="${side}" opacity=".4"/>
<rect x="-108" y="-392" width="216" height="130" rx="54" fill="${dark}"/>
<g id="${id}eyes"><ellipse id="${id}eL" cx="-50" cy="-336" rx="26" ry="31" fill="${eye}"/><ellipse id="${id}eR" cx="50" cy="-336" rx="26" ry="31" fill="${eye}"/><circle id="${id}pL" cx="-42" cy="-346" r="9" fill="#fff"/><circle id="${id}pR" cx="58" cy="-346" r="9" fill="#fff"/></g>
<rect id="${id}bL" x="-82" y="-388" width="58" height="9" rx="4.5" fill="${eye}"/><rect id="${id}bR" x="24" y="-388" width="58" height="9" rx="4.5" fill="${eye}"/>
<path id="${id}mouth" d="M-28 -286 Q0 -268 28 -286" fill="none" stroke="${eye}" stroke-width="9" stroke-linecap="round"/><ellipse id="${id}mouthO" cx="0" cy="-282" rx="18" ry="2" fill="${eye}" opacity="0"/>
<path id="${id}sweat" d="M118 -380 q16 26 0 40 q-16 -14 0 -40z" fill="#7fd0ff" opacity="0"/></g></g>`;
  }
  const envelope = (id, col, q) => `<g id="${id}"><rect x="-62" y="-42" width="124" height="84" rx="12" fill="${col}"/><path d="M-62 -30 L0 12 L62 -30 L62 -34 q0 -8 -8 -8 h-108 q-8 0 -8 8z" fill="#000" opacity=".16"/>${q ? `<text x="0" y="22" text-anchor="middle" font-family="Geist" font-weight="900" font-size="58" fill="#fff">?</text>` : ''}</g>`;
  const sheet = (id) => `<g id="${id}"><rect x="-50" y="-66" width="100" height="132" rx="10" fill="#f3f6ff"/>${[-40, -22, -4, 14, 32].map((y, i) => `<rect x="-36" y="${y}" width="${i === 4 ? 40 : 72}" height="8" rx="4" fill="#9aa4d4"/>`).join('')}</g>`;
  const chip = (id, txt, col, w) => `<g id="${id}"><rect x="${-(w || 190) / 2}" y="-40" width="${w || 190}" height="80" rx="40" fill="${col}"/><text x="0" y="17" text-anchor="middle" font-family="Geist" font-weight="900" font-size="46" fill="${P.ink}">${esc(txt)}</text></g>`;
  const label = (id, txt, size, col) => `<text id="${id}" x="0" y="0" text-anchor="middle" font-family="Geist" font-weight="900" font-size="${size || 90}" fill="${col || '#fff'}" stroke="${P.ink}" stroke-width="${(size || 90) * 0.14}" paint-order="stroke" stroke-linejoin="round">${esc(txt)}</text>`;
  const gadget = (id) => `<g id="${id}"><circle r="190" fill="url(#gGlow)"/><line x1="40" y1="-150" x2="62" y2="-208" stroke="#7d8be0" stroke-width="9" stroke-linecap="round"/><circle cx="64" cy="-214" r="14" fill="${P.yellow}"/>
<rect x="-80" y="-140" width="160" height="260" rx="40" fill="url(#gDev)"/><rect x="-58" y="-116" width="116" height="104" rx="22" fill="#0d1240"/>
<text x="0" y="-52" text-anchor="middle" font-family="Geist" font-weight="900" font-size="58" fill="${P.teal}" id="${id}scr">94%</text>
<circle cx="-40" cy="46" r="18" fill="${P.teal}"/><circle cx="0" cy="46" r="18" fill="${P.yellow}"/><circle cx="40" cy="46" r="18" fill="${P.pink}"/><rect x="-40" y="84" width="80" height="12" rx="6" fill="#6d7cdf"/></g>`;
  const stopwatch = (id) => `<g id="${id}"><circle r="200" fill="url(#gGlow)"/><rect x="-18" y="-190" width="36" height="34" rx="8" fill="#7d8be0"/><rect x="-34" y="-204" width="68" height="20" rx="10" fill="#9aa8f5"/><circle r="150" fill="#9aa8f5"/><circle r="128" fill="#f3f6ff"/>
${Array.from({ length: 12 }, (_, i) => `<rect x="-4" y="-122" width="8" height="${i % 3 ? 14 : 26}" rx="4" fill="${P.ink}" transform="rotate(${i * 30})"/>`).join('')}
<path id="${id}arc" d="M0 0 L0 -118 A118 118 0 0 1 118 0 Z" fill="${P.teal}" opacity=".55"/><g id="${id}hand"><rect x="-5" y="-112" width="10" height="120" rx="5" fill="${P.pink}"/></g><circle r="14" fill="${P.ink}"/></g>`;
  const coin = (id) => `<g id="${id}"><circle r="130" fill="url(#gGlow)"/><circle r="92" fill="url(#gGold)"/><circle r="72" fill="none" stroke="#e79a1c" stroke-width="8"/><text x="0" y="26" text-anchor="middle" font-family="Geist" font-weight="900" font-size="84" fill="#c97b0a">$</text></g>`;
  const magnifier = (id) => `<g id="${id}"><circle r="74" fill="#9be8ff" opacity=".25"/><circle r="74" fill="none" stroke="${P.yellow}" stroke-width="16"/><line x1="52" y1="52" x2="128" y2="128" stroke="${P.yellow}" stroke-width="22" stroke-linecap="round"/></g>`;
  const check = (id, col) => `<g id="${id}"><circle r="44" fill="${col || P.teal}"/><path d="M-20 2 l14 16 l28 -32" fill="none" stroke="${P.ink}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  const cross = (id) => `<g id="${id}"><circle r="44" fill="${P.pink}"/><path d="M-18 -18 l36 36 M18 -18 l-36 36" fill="none" stroke="${P.ink}" stroke-width="10" stroke-linecap="round"/></g>`;
  const desk = () => `<g id="desk"><rect x="250" y="918" width="580" height="34" rx="12" fill="#c68a4c"/><rect x="262" y="952" width="556" height="108" rx="10" fill="#8d5a2e"/><rect x="262" y="952" width="556" height="12" fill="#000" opacity=".2"/><rect x="300" y="976" width="200" height="64" rx="8" fill="#a56d3a"/><circle cx="400" cy="1008" r="8" fill="${P.yellow}"/></g>`;
  const conveyor = (id) => `<g id="${id}"><rect x="-60" y="0" width="1200" height="64" rx="20" fill="#2b3290"/><rect x="-60" y="0" width="1200" height="14" rx="7" fill="#4a56c9"/><g id="${id}ticks">${Array.from({ length: 24 }, (_, i) => `<rect x="${i * 60 - 60}" y="24" width="30" height="10" rx="5" fill="#161c63"/>`).join('')}</g>${[60, 300, 540, 780, 1020].map((x) => `<circle cx="${x}" cy="84" r="20" fill="#161c63"/><circle cx="${x}" cy="84" r="9" fill="#4a56c9"/>`).join('')}</g>`;
  const scanner = (id) => `<g id="${id}"><path d="M-130 0 v-190 q0 -50 50 -50 h160 q50 0 50 50 v190 h-50 v-170 h-160 v170z" fill="#4150c9"/><rect x="-80" y="-182" width="160" height="12" rx="6" fill="${P.teal}"/><circle cx="0" cy="-214" r="14" fill="${P.yellow}"/></g>`;
  window.KIT = { P, DEFS, room, robot, envelope, sheet, chip, label, gadget, stopwatch, coin, magnifier, check, cross, desk, conveyor, scanner, G, esc };
})();
