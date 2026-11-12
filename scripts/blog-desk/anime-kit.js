/* Anime-style drawing kit (browser side), loaded after story-kit.js. Cel shading (flat colour + one shadow tone + dark ink outline), painted gradient skies, rim light, glow, sparkles and speed lines.
   It adds KIT.A = { defs, dusk, tech, dawn, title, card, burst, spark, dino2, ink, ... } and replaces KIT.dino with the cel-shaded Mujasauraus (same ids, so the pose function still drives it). */
(function () {
  const K = window.KIT, P = K.P, INK = '#2a1850', rn = (i, k) => { const x = Math.sin(i * 127.1 + (k || 0) * 311.7) * 43758.5453; return x - Math.floor(x); };
  const esc = K.esc;
  const defs = () => `<defs>
<linearGradient id="aDusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#150f5c"/><stop offset=".35" stop-color="#5b2a9e"/><stop offset=".62" stop-color="#d8508f"/><stop offset=".82" stop-color="#ff8f78"/><stop offset="1" stop-color="#ffd08a"/></linearGradient>
<linearGradient id="aTech" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070b30"/><stop offset=".55" stop-color="#12206b"/><stop offset="1" stop-color="#1b4f9a"/></linearGradient>
<linearGradient id="aDawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2b8f"/><stop offset=".45" stop-color="#7a5bd0"/><stop offset=".8" stop-color="#ff9ac1"/><stop offset="1" stop-color="#ffd9a0"/></linearGradient>
<radialGradient id="aSun"><stop offset="0" stop-color="#fff6d6"/><stop offset=".45" stop-color="#ffd27a" stop-opacity=".95"/><stop offset="1" stop-color="#ff8f78" stop-opacity="0"/></radialGradient>
<radialGradient id="aGlowT"><stop offset="0" stop-color="#5ff5da" stop-opacity=".65"/><stop offset="1" stop-color="#5ff5da" stop-opacity="0"/></radialGradient>
<radialGradient id="aGlowP"><stop offset="0" stop-color="#ff7fb0" stop-opacity=".6"/><stop offset="1" stop-color="#ff7fb0" stop-opacity="0"/></radialGradient>
<radialGradient id="aGlowW"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<linearGradient id="aIris" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d2b4a"/><stop offset=".55" stop-color="#1f8f8a"/><stop offset="1" stop-color="#6ff0d6"/></linearGradient>
<linearGradient id="aCard" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9defa"/></linearGradient>
<linearGradient id="aPanel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#27308f"/><stop offset="1" stop-color="#171d63"/></linearGradient>
<linearGradient id="aRay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>`;
  const stars = (n, h) => Array.from({ length: n }, (_, i) => `<circle cx="${(rn(i, 1) * 1080).toFixed(0)}" cy="${(rn(i, 2) * h).toFixed(0)}" r="${rn(i, 3) < 0.2 ? 2.8 : 1.4}" fill="#fff" opacity="${(0.3 + rn(i, 4) * 0.6).toFixed(2)}"/>`).join('');
  // layered skyline: each layer is one group so it can drift for parallax
  const skyline = (id, y, c, win, seed, h0, h1) => { let r = '', x = -40; let i = 0; while (x < 1160) { const w = 70 + rn(i + seed, 1) * 90, h = h0 + rn(i + seed, 2) * (h1 - h0); r += `<rect x="${x.toFixed(0)}" y="${(y - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${c}"/>`; if (win) for (let wy = y - h + 24; wy < y - 24; wy += 34) for (let wx = x + 14; wx < x + w - 18; wx += 26) if (rn(wx + wy + seed, 5) < 0.38) r += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="10" height="16" rx="2" fill="${win}" opacity="${(0.6 + rn(wx, wy) * 0.4).toFixed(2)}"/>`; x += w + 4 + rn(i + seed, 3) * 10; i++; } return `<g id="${id}">${r}</g>`; };
  const cloud = (id, cx, cy, s, col, rim) => `<g id="${id}"><g transform="translate(${cx} ${cy}) scale(${s})"><ellipse cx="0" cy="0" rx="190" ry="44" fill="${col}"/><ellipse cx="-70" cy="-30" rx="90" ry="46" fill="${col}"/><ellipse cx="50" cy="-42" rx="110" ry="54" fill="${col}"/><path d="M-190 4 Q0 30 190 4" fill="none" stroke="${rim}" stroke-width="7" stroke-linecap="round" opacity=".8"/><path d="M-70 -58 Q-20 -86 40 -76" fill="none" stroke="${rim}" stroke-width="6" stroke-linecap="round" opacity=".7"/></g></g>`;
  const rays = (cx, cy, n, col) => `<g opacity=".9">${Array.from({ length: n }, (_, i) => { const a = -100 + i * (200 / (n - 1)); return `<polygon points="${cx},${cy} ${cx + Math.tan((a - 5) * Math.PI / 180) * 1500},${cy + 1500} ${cx + Math.tan((a + 5) * Math.PI / 180) * 1500},${cy + 1500}" fill="url(#aRay)" transform="rotate(0)" opacity="${(0.25 + rn(i, 7) * 0.5).toFixed(2)}"/>`; }).join('')}</g>`;
  // painted backgrounds. All have ids bgA / bgB / bgC (far to near) so a scene can drift them for parallax.
  const dusk = () => `${defs()}<rect x="-300" y="-500" width="1680" height="3000" fill="url(#aDusk)"/>${stars(70, 700)}
<g id="bgA"><circle cx="540" cy="900" r="420" fill="url(#aSun)"/><circle cx="540" cy="900" r="120" fill="#fff3cf"/>${cloud('cl0', 220, 640, 1.2, '#ff9bbd', '#ffe2c0')}${cloud('cl1', 880, 760, 1.5, '#ff8fa8', '#ffe2c0')}${cloud('cl2', 560, 480, 1.0, '#b36ad8', '#ffb3d9')}</g>
<g id="bgB">${skyline('skA', 1130, '#5a2c86', '#ffd48a', 3, 140, 380)}</g>
<g id="bgC">${skyline('skB', 1300, '#2a1650', '#ffcf7a', 9, 220, 600)}</g>
<rect x="-300" y="1290" width="1680" height="900" fill="#1a0f3d"/><rect x="-300" y="1284" width="1680" height="10" fill="#ff8f9e" opacity=".5"/>`;
  const tech = () => `${defs()}<rect x="-300" y="-500" width="1680" height="3000" fill="url(#aTech)"/>${stars(50, 800)}
<circle cx="540" cy="1000" r="560" fill="url(#aGlowT)" opacity=".55"/>
<g id="bgA">${Array.from({ length: 9 }, (_, i) => `<polygon points="${60 + i * 125},${620 + rn(i, 8) * 140} ${100 + i * 125},${560 + rn(i, 8) * 140} ${140 + i * 125},${620 + rn(i, 8) * 140} ${140 + i * 125},${680 + rn(i, 8) * 140} ${100 + i * 125},${720 + rn(i, 8) * 140} ${60 + i * 125},${680 + rn(i, 8) * 140}" fill="none" stroke="#5ff5da" stroke-width="3" opacity="${(0.12 + rn(i, 9) * 0.2).toFixed(2)}"/>`).join('')}</g>
<g id="bgB">${skyline('skT', 1130, '#13265f', '#6ff0d6', 21, 160, 520)}</g>
<g id="bgC"><rect x="-300" y="1130" width="1680" height="900" fill="#0a1240"/>${Array.from({ length: 14 }, (_, i) => `<line x1="${540 + (i - 6.5) * 60}" y1="1130" x2="${540 + (i - 6.5) * 440}" y2="2000" stroke="#5ff5da" stroke-width="3" opacity=".3"/>`).join('')}${Array.from({ length: 9 }, (_, i) => `<line x1="-300" y1="${1130 + Math.pow(i / 8, 2) * 850}" x2="1380" y2="${1130 + Math.pow(i / 8, 2) * 850}" stroke="#5ff5da" stroke-width="3" opacity=".28"/>`).join('')}</g>`;
  const dawn = () => `${defs()}<rect x="-300" y="-500" width="1680" height="3000" fill="url(#aDawn)"/>${stars(40, 600)}
<g id="bgA"><circle cx="760" cy="760" r="380" fill="url(#aSun)"/><circle cx="760" cy="760" r="100" fill="#fff3cf"/>${cloud('cl0', 240, 560, 1.4, '#c9a6ff', '#fff0d8')}${cloud('cl1', 860, 980, 1.7, '#ffb3cf', '#fff0d8')}</g>
<g id="bgB">${cloud('cl2', 380, 1160, 2.2, '#ffc9d9', '#fff4e0')}</g><g id="bgC">${cloud('cl3', 900, 1330, 2.6, '#ffe0e6', '#fff8ea')}</g>${rays(760, 760, 9)}`;
  // anime title text: heavy, slanted, thick ink outline with a colour drop
  const title = (id, txt, size, col, sh) => `<g id="${id}"><g transform="skewX(-8)"><text id="${id}b" x="7" y="9" text-anchor="middle" font-family="Geist" font-weight="900" font-size="${size}" fill="${sh || '#ff5f8f'}" stroke="${INK}" stroke-width="${size * 0.16}" stroke-linejoin="round" paint-order="stroke">${esc(txt)}</text><text id="${id}a" x="0" y="0" text-anchor="middle" font-family="Geist" font-weight="900" font-size="${size}" fill="${col || '#fff'}" stroke="${INK}" stroke-width="${size * 0.1}" stroke-linejoin="round" paint-order="stroke">${esc(txt)}</text></g></g>`;
  // glossy cel-shaded card: ink outline, light top edge, shadow strip
  const card = (id, w, h, col, inner, r) => `<g id="${id}"><rect x="${-w / 2 + 8}" y="${-h / 2 + 12}" width="${w}" height="${h}" rx="${r || 34}" fill="#000" opacity=".28"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${r || 34}" fill="${col}" stroke="${INK}" stroke-width="6"/><path d="M${-w / 2 + 20} ${-h / 2 + 14} h${w - 40}" stroke="#fff" stroke-opacity=".55" stroke-width="7" stroke-linecap="round"/><rect x="${-w / 2 + 3}" y="${h / 2 - 22}" width="${w - 6}" height="19" rx="12" fill="#000" opacity=".12"/>${inner || ''}</g>`;
  const burst = (id, col, n) => `<g id="${id}">${Array.from({ length: n || 30 }, (_, i) => { const a = i * 360 / (n || 30) + rn(i, 2) * 6, l = 520 + rn(i, 3) * 700; return `<polygon points="0,${-70 - rn(i, 4) * 40} ${(4 + rn(i, 5) * 10).toFixed(1)},${-l} ${(-4 - rn(i, 6) * 10).toFixed(1)},${-l}" fill="${col}" transform="rotate(${a.toFixed(1)})"/>`; }).join('')}</g>`;
  const spark = (id, col, s) => `<path id="${id}" d="M0 ${-(s || 30)} Q4 -4 ${s || 30} 0 Q4 4 0 ${s || 30} Q-4 4 ${-(s || 30)} 0 Q-4 -4 0 ${-(s || 30)}Z" fill="${col || '#fff'}"/>`;
  // Mujasauraus, anime cel-shaded: ink outline, one shadow tone, big glossy eyes. Same ids as the plain dino so C.dino() poses it.
  const O = `stroke="${INK}" stroke-width="5" stroke-linejoin="round"`;
  const dino2 = (id) => `<g id="${id}">
<ellipse cx="0" cy="8" rx="150" ry="16" fill="#000" opacity=".32"/>
<g id="${id}tail"><path d="M70 -150 Q200 -150 226 -70 Q232 -28 196 -30 Q178 -70 112 -84Z" fill="#8c72f0" ${O}/><path d="M112 -84 Q178 -70 196 -30 Q232 -28 226 -70 Q210 -50 150 -66Z" fill="#6f55d4" opacity=".6"/><path d="M150 -140 l10 -30 l16 26z M196 -118 l22 -22 l6 32z" fill="${P.teal}" ${O}/></g>
<g id="${id}legL"><rect x="-92" y="-84" width="66" height="84" rx="32" fill="#8c72f0" ${O}/><ellipse cx="-58" cy="-8" rx="46" ry="21" fill="#7a60e0" ${O}/><circle cx="-84" cy="-6" r="6" fill="#fff3c4"/><circle cx="-58" cy="-2" r="6" fill="#fff3c4"/><circle cx="-32" cy="-6" r="6" fill="#fff3c4"/></g>
<g id="${id}legR"><rect x="26" y="-84" width="66" height="84" rx="32" fill="#8c72f0" ${O}/><ellipse cx="58" cy="-8" rx="46" ry="21" fill="#7a60e0" ${O}/><circle cx="32" cy="-6" r="6" fill="#fff3c4"/><circle cx="58" cy="-2" r="6" fill="#fff3c4"/><circle cx="84" cy="-6" r="6" fill="#fff3c4"/></g>
<g id="${id}body"><g id="${id}spk"><circle cx="0" cy="-300" r="190" fill="url(#aGlowT)" opacity=".55"/><path d="M-120 -230 l-34 -44 l52 8z M-80 -262 l-18 -56 l50 22z M120 -230 l34 -44 l-52 8z M80 -262 l18 -56 l-50 22z" fill="${P.teal}" ${O}/></g>
<ellipse cx="0" cy="-160" rx="128" ry="112" fill="#a48cff" ${O}/><path d="M60 -250 Q140 -200 122 -130 Q100 -60 20 -50 Q100 -100 92 -170 Q88 -220 60 -250Z" fill="#7f66e0" opacity=".55"/>
<ellipse cx="0" cy="-138" rx="84" ry="80" fill="#fff3c4"/><path d="M-60 -170 Q0 -154 60 -170 M-66 -136 Q0 -118 66 -136 M-56 -102 Q0 -88 56 -102" fill="none" stroke="#e8d390" stroke-width="7" stroke-linecap="round"/></g>
<g id="${id}armL"><rect x="-150" y="-206" width="46" height="96" rx="23" fill="#8c72f0" ${O}/><circle cx="-127" cy="-112" r="26" fill="#a48cff" ${O}/></g>
<g id="${id}armR"><rect x="104" y="-206" width="46" height="96" rx="23" fill="#8c72f0" ${O}/><circle cx="127" cy="-112" r="26" fill="#a48cff" ${O}/></g>
<g id="${id}head"><path d="M-46 -404 l-14 -52 l44 30z M0 -412 l0 -60 l30 46z M46 -404 l14 -52 l-44 30z" fill="${P.teal}" ${O}/><path d="M-70 -392 l-18 -56 l50 14z M70 -392 l18 -56 l-50 14z" fill="#fff3c4" ${O}/>
<circle cx="0" cy="-306" r="116" fill="#a48cff" ${O}/><path d="M52 -406 Q122 -370 116 -296 Q108 -226 48 -204 Q100 -250 98 -310 Q96 -370 52 -406Z" fill="#7f66e0" opacity=".5"/><path d="M-70 -388 Q-30 -418 20 -414" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="9" stroke-linecap="round"/>
<ellipse cx="0" cy="-268" rx="74" ry="48" fill="#b9a6ff" stroke="${INK}" stroke-width="4"/><circle cx="-26" cy="-278" r="5" fill="#5a42b9"/><circle cx="26" cy="-278" r="5" fill="#5a42b9"/>
<ellipse cx="-88" cy="-270" rx="24" ry="15" fill="#ff8fb0" opacity=".9"/><ellipse cx="88" cy="-270" rx="24" ry="15" fill="#ff8fb0" opacity=".9"/>
<g id="${id}eL"><ellipse cx="-46" cy="-318" rx="33" ry="40" fill="#fff" ${O}/><g id="${id}pL"><ellipse cx="-44" cy="-314" rx="23" ry="30" fill="url(#aIris)"/><ellipse cx="-44" cy="-312" rx="12" ry="17" fill="#07162b"/><ellipse cx="-36" cy="-326" rx="9" ry="10" fill="#fff"/><circle cx="-52" cy="-300" r="4.5" fill="#fff" opacity=".9"/></g><path d="M-80 -330 Q-46 -364 -12 -334" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/></g>
<g id="${id}eR"><ellipse cx="46" cy="-318" rx="33" ry="40" fill="#fff" ${O}/><g id="${id}pR"><ellipse cx="48" cy="-314" rx="23" ry="30" fill="url(#aIris)"/><ellipse cx="48" cy="-312" rx="12" ry="17" fill="#07162b"/><ellipse cx="56" cy="-326" rx="9" ry="10" fill="#fff"/><circle cx="40" cy="-300" r="4.5" fill="#fff" opacity=".9"/></g><path d="M12 -334 Q46 -364 80 -330" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/></g>
<rect id="${id}bL" x="-72" y="-376" width="52" height="9" rx="4.5" fill="${INK}"/><rect id="${id}bR" x="20" y="-376" width="52" height="9" rx="4.5" fill="${INK}"/>
<path id="${id}mouth" d="M-24 -252 Q0 -244 24 -252" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><ellipse id="${id}mouthO" cx="0" cy="-248" rx="22" ry="4" fill="#5a1f3a" stroke="${INK}" stroke-width="4" opacity="0"/>
<path id="${id}sweat" d="M118 -380 q16 26 0 40 q-16 -14 0 -40z" fill="#9fe0ff" opacity="0"/></g></g>`;
  K.dinoFlat = K.dino; K.dino = dino2;
  window.PACK = window.PACK || {};
  K.A = { INK, defs, dusk, tech, dawn, title, card, burst, spark, dino2, cloud, skyline, rn };
})();
