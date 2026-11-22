// Banner style D2 "Paper" (locked by Aashish 2026-11-14): cream left with a short hook, slanted navy right panel with a subtle dot matrix,
// one main flat illustration fully on the navy side plus small supporting icons and sparkles. Cover 1200x630 and thumbnail 1280x720 share the design.
// Hook rules: 2 to 3 words, never the title, add stakes / a number / a question; `|` forces a line break. Optional post fields: banner_tag (up to 24 chars), banner_sub (up to 60 chars).
const NAVY = '#101936', CREAM = '#fff6e6', PAPER = '#f3ede1', TEAL = '#12b5a6', TEALD = '#0a8f84';
const tile = (x, y, w, h, inner, rx = 22) => `<g transform="translate(${x},${y})"><rect x="8" y="8" width="${w}" height="${h}" rx="${rx}" fill="${PAPER}"/><rect width="${w}" height="${h}" rx="${rx}" fill="${CREAM}"/>${inner}</g>`;
const star = (x, y, r, c = CREAM) => `<path transform="translate(${x},${y})" d="M0 ${-r} Q4 -4 ${r} 0 Q4 4 0 ${r} Q-4 4 ${-r} 0 Q-4 -4 0 ${-r}Z" fill="${c}"/>`;
const pill = (x, y, w, h, fill, txt, fs) => `<g transform="translate(${x},${y})"><rect x="7" y="7" width="${w}" height="${h}" rx="${h / 2}" fill="${PAPER}"/><rect width="${w}" height="${h}" rx="${h / 2}" fill="${fill}"/><text x="${w / 2}" y="${h / 2 + fs * 0.35}" text-anchor="middle" font-family="Geist" font-weight="900" font-size="${fs}" fill="${NAVY}" letter-spacing="1">${txt}</text></g>`;
const badge = (x, y, r, inner) => `<g transform="translate(${x},${y})"><circle cx="7" cy="7" r="${r}" fill="${PAPER}"/><circle r="${r}" fill="${CREAM}"/>${inner}</g>`;
const ICON = {
  mic: `<rect x="-14" y="-32" width="28" height="46" rx="14" fill="${TEAL}" stroke="${NAVY}" stroke-width="5"/><path d="M-26 -2 a26 26 0 0 0 52 0 M0 24 V36 M-12 36 H12" fill="none" stroke="${NAVY}" stroke-width="6" stroke-linecap="round"/>`,
  video: `<rect x="-34" y="-20" width="44" height="40" rx="9" fill="${TEAL}" stroke="${NAVY}" stroke-width="5"/><path d="M16 -6 L36 -18 V18 L16 6Z" fill="${NAVY}" stroke="${NAVY}" stroke-width="4" stroke-linejoin="round"/>`,
  doc: `<path d="M-22 -32 H8 L24 -16 V32 H-22Z" fill="${TEAL}" stroke="${NAVY}" stroke-width="5" stroke-linejoin="round"/><path d="M-12 -4 H14 M-12 8 H14 M-12 20 H4" stroke="${NAVY}" stroke-width="5" stroke-linecap="round"/>`,
  tag: `<path d="M-28 -6 L-6 -28 H26 V4 L4 28 Z" fill="${TEAL}" stroke="${NAVY}" stroke-width="5" stroke-linejoin="round"/><circle cx="12" cy="-12" r="5" fill="${NAVY}"/>`,
  scale: `<path d="M0 -32 V30 M-18 32 H18 M-30 -16 H30" stroke="${NAVY}" stroke-width="6" stroke-linecap="round"/><path d="M-30 -16 L-42 10 H-18Z M30 -16 L18 10 H42Z" fill="${TEAL}" stroke="${NAVY}" stroke-width="4" stroke-linejoin="round"/>`,
  phone: `<rect x="-17" y="-32" width="34" height="64" rx="9" fill="${TEAL}" stroke="${NAVY}" stroke-width="5"/><circle cy="22" r="3.5" fill="${NAVY}"/>`,
  lock: `<rect x="-24" y="-6" width="48" height="38" rx="9" fill="${TEAL}"/><path d="M-14 -6 V-18 a14 14 0 0 1 28 0 V-6" fill="none" stroke="${NAVY}" stroke-width="8" stroke-linecap="round"/><circle cy="12" r="5" fill="${NAVY}"/>`,
  bug: `<ellipse cy="6" rx="20" ry="26" fill="${TEAL}"/><circle cy="-24" r="12" fill="${TEAL}"/><g stroke="${NAVY}" stroke-width="5" stroke-linecap="round"><path d="M-20 -4 L-38 -12 M-20 10 L-40 14 M20 -4 L38 -12 M20 10 L40 14 M-8 -34 L-16 -48 M8 -34 L16 -48"/></g><circle cx="-7" cy="2" r="4" fill="${NAVY}"/><circle cx="8" cy="12" r="4" fill="${NAVY}"/>`,
  bell: `<path d="M0 -30 C-20 -30 -24 -10 -24 4 L-30 20 H30 L24 4 C24 -10 20 -30 0 -30Z" fill="${NAVY}"/><circle cy="30" r="7" fill="${NAVY}"/><circle cy="-34" r="5" fill="${NAVY}"/>`,
  coins: `<g stroke="${NAVY}" stroke-width="4"><ellipse cy="14" rx="26" ry="9" fill="${TEAL}"/><ellipse cy="4" rx="26" ry="9" fill="${TEAL}"/><ellipse cy="-6" rx="26" ry="9" fill="${TEAL}"/><ellipse cy="-16" rx="26" ry="9" fill="${CREAM}"/></g>`,
  plane: `<path d="M-34 6 L-6 -2 L-22 -30 H-10 L14 -6 L32 -12 C40 -14 42 -6 34 -2 L16 6 L-2 34 H-14 L-10 8Z" fill="${TEAL}" stroke="${NAVY}" stroke-width="5" stroke-linejoin="round"/>`,
  bolt: `<path d="M6 -34 L-22 6 H-2 L-8 34 L24 -8 H4Z" fill="${TEAL}" stroke="${NAVY}" stroke-width="5" stroke-linejoin="round"/>`,
  chat: `<path d="M-30 -22 H30 a8 8 0 0 1 8 8 V10 a8 8 0 0 1 -8 8 H-2 L-20 32 V18 H-30 a8 8 0 0 1 -8 -8 V-14 a8 8 0 0 1 8 -8Z" fill="${TEAL}" stroke="${NAVY}" stroke-width="5" stroke-linejoin="round"/><g fill="${NAVY}"><circle cx="-14" cy="-2" r="4"/><circle cy="-2" r="4"/><circle cx="14" cy="-2" r="4"/></g>`,
  check: `<circle r="30" fill="${TEAL}" stroke="${NAVY}" stroke-width="5"/><path d="M-14 0 L-4 11 L16 -10" fill="none" stroke="${NAVY}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  clock: `<circle r="30" fill="${TEAL}" stroke="${NAVY}" stroke-width="5"/><path d="M0 -16 V0 L12 8" fill="none" stroke="${NAVY}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
  pad: `<path d="M-30 -14 H30 C42 -14 46 22 36 28 C28 32 22 24 14 14 H-14 C-22 24 -28 32 -36 28 C-46 22 -42 -14 -30 -14Z" fill="${TEAL}" stroke="${NAVY}" stroke-width="5" stroke-linejoin="round"/><path d="M-22 -2 V8 M-27 3 H-17" stroke="${NAVY}" stroke-width="5" stroke-linecap="round"/><circle cx="20" cy="0" r="4" fill="${NAVY}"/><circle cx="28" cy="8" r="4" fill="${NAVY}"/>`,
  chip: `<rect x="-22" y="-22" width="44" height="44" rx="8" fill="${TEAL}" stroke="${NAVY}" stroke-width="5"/><rect x="-10" y="-10" width="20" height="20" rx="3" fill="${NAVY}"/><g stroke="${NAVY}" stroke-width="5" stroke-linecap="round"><path d="M-12 -30 V-22 M0 -30 V-22 M12 -30 V-22 M-12 22 V30 M0 22 V30 M12 22 V30 M-30 -12 H-22 M-30 0 H-22 M-30 12 H-22 M22 -12 H30 M22 0 H30 M22 12 H30"/></g>`,
};
function pickIcons(t) {
  if (/nginx/.test(t)) return ['chip', 'lock', 'check'];
  if (/debut|first day|first-day/.test(t) && /ipo|nasdaq/.test(t)) return ['clock', 'tag', 'coins'];
  if (/\bgta\b|grand theft auto|video game/.test(t)) return ['coins', 'pad', 'bell'];
  if (/airline|flight booking|boarding/.test(t)) return ['plane', 'lock', 'tag'];
  if (/\bwallet\b/.test(t)) return ['coins', 'lock', 'chat'];
  if (/lawsuit|sues |sued|attorney general|court/.test(t)) return ['scale', 'bug', 'lock'];
  if (/voice clon|deepfake|cloned voice/.test(t)) return ['phone', 'mic', 'lock'];
  if (/meeting|google meet|zoom|video call/.test(t)) return ['video', 'doc', 'chat'];
  if (/decisions api|decision api/.test(t)) return ['scale', 'tag', 'check'];
  if (/hydrogen|argon/.test(t)) return ['bolt', 'tag', 'chip'];
  if (/secur|vulnerab|cve|patch|breach|flaw|exploit|privacy|scam/.test(t)) return ['lock', 'bug', 'bolt'];
  if (/outage|incident|down|latency|uptime/.test(t)) return ['clock', 'bolt', 'chat'];
  if (/gemini|gpt|openai|claude|model|llm|chatbot|agent|\bai\b/.test(t)) return ['chat', 'chip', 'check'];
  if (/ipo|stock|share|earnings|revenue|funding|valuation|pricing|market/.test(t)) return ['bell', 'coins', 'check'];
  return ['bolt', 'chat', 'check'];
}
// main flat illustrations (drawn for the navy panel; cream outlines, bg-coloured hard shadow)
function flatServer() {
  return `<g stroke="${CREAM}" stroke-width="9" stroke-linejoin="round"><rect x="20" y="70" width="330" height="96" rx="22" fill="${CREAM}"/><rect x="20" y="186" width="330" height="96" rx="22" fill="${CREAM}"/><rect x="20" y="302" width="330" height="96" rx="22" fill="${CREAM}"/></g>
<g fill="${TEALD}"><circle cx="70" cy="118" r="13"/><circle cx="70" cy="350" r="13"/></g><circle cx="70" cy="234" r="13" fill="#e5383b"/>
<g fill="${NAVY}"><rect x="120" y="108" width="170" height="20" rx="10"/><rect x="120" y="224" width="170" height="20" rx="10"/><rect x="120" y="340" width="170" height="20" rx="10"/></g>
<path d="M360 110 L520 160 V290 C520 380 450 440 360 480 C270 440 200 380 200 290 V160 Z" fill="${PAPER}" transform="translate(16,16)"/>
<path d="M360 110 L520 160 V290 C520 380 450 440 360 480 C270 440 200 380 200 290 V160 Z" fill="${TEAL}" stroke="${CREAM}" stroke-width="10" stroke-linejoin="round"/>
<path d="M375 130 L338 230 L392 262 L346 360 L372 462" fill="none" stroke="${CREAM}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="440" cy="240" r="34" fill="${CREAM}" stroke="${CREAM}" stroke-width="8"/><text x="440" y="254" text-anchor="middle" font-family="Geist" font-weight="900" font-size="44" fill="#e5383b">!</text>`;
}
function flatCandle() {
  const cand = (x, top, bot, wt, wb, c) => `<path d="M${x + 36} ${wt} V${wb}" stroke="${CREAM}" stroke-width="9" stroke-linecap="round"/><rect x="${x + 8}" y="${top + 12}" width="72" height="${bot - top}" rx="12" fill="${PAPER}"/><rect x="${x}" y="${top}" width="72" height="${bot - top}" rx="12" fill="${c}" stroke="${CREAM}" stroke-width="9"/>`;
  return `<path d="M20 330 H580" stroke="${CREAM}" stroke-width="6" stroke-dasharray="4 16" stroke-linecap="round"/>`
    + cand(40, 250, 360, 230, 400, TEAL) + cand(160, 90, 250, 60, 270, TEAL) + cand(280, 40, 140, 20, 190, CREAM) + cand(400, 130, 250, 100, 300, CREAM)
    + `<g transform="translate(350,410)"><rect x="10" y="10" width="220" height="96" rx="26" fill="${PAPER}"/><rect width="220" height="96" rx="26" fill="${CREAM}" stroke="${CREAM}" stroke-width="6"/>${T(28, 66, 'start', 50, NAVY, '$83')}<path d="M172 26 V66 M158 52 L172 68 L186 52" fill="none" stroke="${TEALD}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}
function flatBars() {
  let g = `<g stroke="${CREAM}" stroke-width="9" stroke-linejoin="round">`;
  [[30, 300, 110, 150, CREAM], [170, 220, 110, 230, TEAL], [310, 140, 110, 310, CREAM], [450, 50, 110, 400, TEAL]].forEach(([x, y, w, h, c]) => { g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${PAPER}" transform="translate(14,14)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${c}"/>`; });
  g += `</g><path d="M30 260 L190 180 L310 110 L480 40" fill="none" stroke="${PAPER}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,10)"/><path d="M30 260 L190 180 L310 110 L480 40" fill="none" stroke="${CREAM}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,10)"/>`;
  g += `<g transform="translate(380,330)"><circle r="78" fill="${PAPER}" cx="12" cy="12"/><circle r="78" fill="${CREAM}" stroke="${CREAM}" stroke-width="9"/><circle r="56" fill="none" stroke="${NAVY}" stroke-width="5" stroke-dasharray="4 9"/><text y="26" text-anchor="middle" font-family="Geist" font-weight="900" font-size="80" fill="${NAVY}">$</text></g>`;
  return g;
}

// topic illustrations added 2026-11-16 so posts on different subjects no longer share the same picture
const T = (x, y, a, fs, fill, t, w = 900) => `<text x="${x}" y="${y}" text-anchor="${a}" font-family="Geist" font-weight="${w}" font-size="${fs}" fill="${fill}">${t}</text>`;
function flatVoice() {
  const bars = [30, 70, 110, 60, 150, 90, 40, 120, 70, 30], hs = bars.map((h, i) => `<rect x="${40 + i * 52}" y="${470 - h / 2 - 20}" width="30" height="${h}" rx="15" fill="${i % 3 === 1 ? TEAL : CREAM}" stroke="${NAVY}" stroke-width="3"/>`).join('');
  return `<g stroke="${CREAM}" stroke-width="9" stroke-linejoin="round"><rect x="30" y="30" width="190" height="330" rx="38" fill="${PAPER}" transform="translate(14,14)"/><rect x="30" y="30" width="190" height="330" rx="38" fill="${CREAM}"/></g>
<rect x="52" y="76" width="146" height="236" rx="20" fill="${NAVY}"/><circle cx="125" cy="148" r="34" fill="${TEAL}"/><path d="M70 262 C74 200 176 200 180 262Z" fill="${TEAL}"/><rect x="95" y="46" width="60" height="9" rx="4" fill="${NAVY}"/><circle cx="125" cy="336" r="9" fill="${NAVY}"/>
<g fill="none" stroke="${CREAM}" stroke-width="12" stroke-linecap="round"><path d="M285 150 a60 60 0 0 1 0 90"/><path d="M335 112 a115 115 0 0 1 0 166"/><path d="M385 76 a170 170 0 0 1 0 240"/></g>
<g transform="translate(470,60)"><circle r="46" fill="${PAPER}" cx="9" cy="9"/><circle r="46" fill="#e5383b" stroke="${CREAM}" stroke-width="8"/>${T(0, 20, 'middle', 58, CREAM, '!')}</g>
<rect x="20" y="395" width="540" height="130" rx="26" fill="${NAVY}" stroke="${CREAM}" stroke-width="7" stroke-dasharray="3 14" stroke-linecap="round"/>${hs}`;
}
function flatMeeting() {
  const tile2 = (x, y, c, face) => `<rect x="${x + 12}" y="${y + 12}" width="230" height="170" rx="22" fill="${PAPER}"/><rect x="${x}" y="${y}" width="230" height="170" rx="22" fill="${c}" stroke="${CREAM}" stroke-width="8"/>` + face;
  const person = (x, y) => `<circle cx="${x + 115}" cy="${y + 66}" r="28" fill="${NAVY}"/><path d="M${x + 55} ${y + 160} C${x + 60} ${y + 104} ${x + 170} ${y + 104} ${x + 175} ${y + 160}Z" fill="${NAVY}"/>`;
  return tile2(20, 30, CREAM, person(20, 30)) + tile2(300, 30, CREAM, person(300, 30)) + tile2(20, 240, CREAM, person(20, 240))
    + tile2(300, 240, TEAL, `<g transform="translate(415,325)">${star(0, 0, 46, NAVY)}${star(40, -38, 18, CREAM)}${star(-44, 34, 14, CREAM)}</g>`)
    + `<g transform="translate(20,455)"><rect x="12" y="12" width="520" height="86" rx="22" fill="${PAPER}"/><rect width="520" height="86" rx="22" fill="${NAVY}" stroke="${CREAM}" stroke-width="8"/><circle cx="42" cy="43" r="12" fill="#e5383b"/><g fill="${CREAM}"><rect x="76" y="26" width="300" height="12" rx="6"/><rect x="76" y="50" width="220" height="12" rx="6"/></g><rect x="396" y="24" width="100" height="40" rx="20" fill="${TEAL}"/>${T(446, 53, 'middle', 22, NAVY, 'NOTES')}</g>`;
}
function flatGauge() {
  return `<path d="M60 380 A240 240 0 0 1 540 380" fill="none" stroke="${PAPER}" stroke-width="64" stroke-linecap="round" transform="translate(12,12)"/><path d="M60 380 A240 240 0 0 1 540 380" fill="none" stroke="${CREAM}" stroke-width="64" stroke-linecap="round"/><path d="M60 380 A240 240 0 0 1 400 160" fill="none" stroke="${TEAL}" stroke-width="64" stroke-linecap="round"/>
<g stroke="${NAVY}" stroke-width="6" stroke-linecap="round"><path d="M150 214 L168 232 M300 112 V138 M450 214 L432 232"/></g>
<path d="M300 380 L420 220" stroke="${CREAM}" stroke-width="22" stroke-linecap="round"/><circle cx="300" cy="380" r="36" fill="${CREAM}"/><circle cx="300" cy="380" r="14" fill="${NAVY}"/>
<g transform="translate(90,430)"><rect x="10" y="10" width="420" height="96" rx="26" fill="${PAPER}"/><rect width="420" height="96" rx="26" fill="${CREAM}" stroke="${CREAM}" stroke-width="6"/>${T(34, 66, 'start', 52, NAVY, '$1.50')}<rect x="236" y="22" width="2" height="52" fill="${NAVY}" opacity=".3"/>${T(262, 66, 'start', 40, TEALD, '/ 1M')}</g>`;
}
function flatDecide() {
  const row = (y, w, ok) => `<rect x="${32}" y="${y + 12}" width="470" height="92" rx="22" fill="${PAPER}"/><rect x="20" y="${y}" width="470" height="92" rx="22" fill="${CREAM}" stroke="${CREAM}" stroke-width="6"/><g fill="${NAVY}"><rect x="46" y="${y + 20}" width="${150 + (w % 3) * 40}" height="12" rx="6"/></g><rect x="46" y="${y + 50}" width="300" height="22" rx="11" fill="${NAVY}" opacity=".15"/><rect x="46" y="${y + 50}" width="${w}" height="22" rx="11" fill="${ok ? TEAL : NAVY}"/><circle cx="430" cy="${y + 46}" r="28" fill="${ok ? TEAL : '#e5383b'}"/><path d="${ok ? `M416 ${y + 46} l10 11 l20 -22` : `M418 ${y + 34} l24 24 M442 ${y + 34} l-24 24`}" fill="none" stroke="${ok ? NAVY : CREAM}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`;
  return row(20, 270, true) + row(140, 120, false) + row(260, 230, true) + row(380, 180, true)
    + `<g transform="translate(430,426)"><circle r="44" cx="8" cy="8" fill="${PAPER}"/><circle r="44" fill="${TEAL}" stroke="${CREAM}" stroke-width="7"/>${T(0, 6, 'middle', 26, NAVY, '1,000')}${T(0, 26, 'middle', 12, NAVY, 'PER CALL', 800)}</g>`;
}

// lawsuit / AI agent escape illustration added 2026-11-17 (California v. OpenAI post): gavel, dashed sandbox, a small robot walking out
function flatCourt() {
  const bot = (x, y, sc, c) => `<g transform="translate(${x},${y}) scale(${sc})"><path d="M0 -62 V-44" stroke="${NAVY}" stroke-width="7" stroke-linecap="round"/><circle cy="-66" r="8" fill="#e5383b" stroke="${NAVY}" stroke-width="4"/><rect x="-46" y="-46" width="92" height="70" rx="20" fill="${c}" stroke="${NAVY}" stroke-width="8"/><circle cx="-16" cy="-12" r="9" fill="${NAVY}"/><circle cx="16" cy="-12" r="9" fill="${NAVY}"/><rect x="-36" y="30" width="72" height="54" rx="14" fill="${c}" stroke="${NAVY}" stroke-width="8"/><path d="M-18 84 V104 M18 84 V104" stroke="${NAVY}" stroke-width="9" stroke-linecap="round"/></g>`;
  return `<rect x="26" y="268" width="290" height="250" rx="34" fill="${NAVY}" stroke="${CREAM}" stroke-width="9" stroke-dasharray="30 20" stroke-linecap="round"/>
<path d="M300 380 H330" stroke="${NAVY}" stroke-width="16"/>
${bot(130, 380, 0.95, CREAM)}
<path d="M330 420 C370 420 390 440 420 440" fill="none" stroke="${CREAM}" stroke-width="9" stroke-dasharray="3 18" stroke-linecap="round"/>
${bot(470, 380, 1.15, TEAL)}
<g transform="translate(540,300)"><circle r="40" cx="8" cy="8" fill="${PAPER}"/><circle r="40" fill="#e5383b" stroke="${CREAM}" stroke-width="7"/>${T(0, 18, 'middle', 50, CREAM, '!')}</g>
<g transform="translate(250,120) rotate(-28)"><rect x="-96" y="-44" width="192" height="88" rx="20" fill="${PAPER}" transform="translate(12,12)"/><rect x="-96" y="-44" width="192" height="88" rx="20" fill="${CREAM}" stroke="${CREAM}" stroke-width="8"/><rect x="-60" y="-44" width="22" height="88" fill="${TEAL}"/><rect x="38" y="-44" width="22" height="88" fill="${TEAL}"/><rect x="-14" y="44" width="28" height="170" rx="14" fill="${CREAM}"/></g>
<g transform="translate(70,150)"><rect x="8" y="8" width="170" height="34" rx="12" fill="${PAPER}"/><rect width="170" height="34" rx="12" fill="${TEAL}" stroke="${CREAM}" stroke-width="6"/></g>`;
}

// airline AI-agent ban illustration added 2026-11-18 (United bans AI agents post): boarding pass, a robot head stamped out by a red no sign, small plane
function flatTicket() {
  return `<g transform="rotate(-6 300 280)"><rect x="52" y="124" width="470" height="300" rx="34" fill="${PAPER}" transform="translate(14,14)"/><rect x="52" y="124" width="470" height="300" rx="34" fill="${CREAM}" stroke="${CREAM}" stroke-width="8"/>
<rect x="52" y="124" width="470" height="84" rx="34" fill="${TEAL}"/><rect x="52" y="180" width="470" height="28" fill="${TEAL}"/>
<g fill="${NAVY}"><rect x="88" y="150" width="130" height="16" rx="8"/><rect x="88" y="236" width="110" height="14" rx="7"/><rect x="88" y="270" width="170" height="14" rx="7"/><rect x="88" y="304" width="90" height="14" rx="7"/></g>
<path d="M360 150 L398 140 L380 112 L400 112 L428 140 L452 134 C464 132 466 146 454 150 L430 160 L406 192 L386 192 L398 160Z" fill="${NAVY}"/>
<path d="M330 124 V424" stroke="${NAVY}" stroke-width="5" stroke-dasharray="3 14" stroke-linecap="round"/>
<g fill="${NAVY}">${Array.from({ length: 11 }, (_, i) => `<rect x="${356 + i * 11}" y="${352}" width="${i % 3 === 0 ? 7 : 4}" height="54" rx="1.5"/>`).join('')}</g></g>
<g transform="translate(345,285)"><path d="M0 -70 V-50" stroke="${NAVY}" stroke-width="8" stroke-linecap="round"/><circle cy="-76" r="9" fill="#e5383b" stroke="${NAVY}" stroke-width="4"/><rect x="-52" y="-52" width="104" height="82" rx="24" fill="${CREAM}" stroke="${NAVY}" stroke-width="8"/><circle cx="-18" cy="-14" r="10" fill="${NAVY}"/><circle cx="18" cy="-14" r="10" fill="${NAVY}"/><path d="M-20 12 H20" stroke="${NAVY}" stroke-width="8" stroke-linecap="round"/><rect x="-62" y="-26" width="12" height="32" rx="6" fill="${TEAL}" stroke="${NAVY}" stroke-width="4"/><rect x="50" y="-26" width="12" height="32" rx="6" fill="${TEAL}" stroke="${NAVY}" stroke-width="4"/></g>
<g transform="translate(345,285)"><circle r="104" fill="none" stroke="${PAPER}" stroke-width="38" transform="translate(10,10)"/><circle r="104" fill="none" stroke="#e5383b" stroke-width="30"/><path d="M-74 -74 L74 74" stroke="#e5383b" stroke-width="30" stroke-linecap="round"/></g>
<g transform="translate(86,76)"><rect x="8" y="8" width="210" height="52" rx="26" fill="${PAPER}"/><rect width="210" height="52" rx="26" fill="${NAVY}" stroke="${CREAM}" stroke-width="6"/><circle cx="32" cy="26" r="9" fill="#e5383b"/><rect x="56" y="19" width="130" height="14" rx="7" fill="${CREAM}"/></g>`;
}
// AI "teammates" illustration added 2026-11-19 (Perplexity Teammates review): three agent avatars around a shared task board, linked by dotted lines, with a 24/7 clock badge
function flatTeam() {
  const bot = (x, y, c) => `<g transform="translate(${x},${y})"><rect x="9" y="9" width="150" height="132" rx="34" fill="${PAPER}"/><rect width="150" height="132" rx="34" fill="${c}" stroke="${CREAM}" stroke-width="8"/><path d="M75 0 V-22" stroke="${CREAM}" stroke-width="8" stroke-linecap="round"/><circle cy="-30" cx="75" r="9" fill="${NAVY}" stroke="${CREAM}" stroke-width="5"/><circle cx="48" cy="58" r="14" fill="${NAVY}"/><circle cx="102" cy="58" r="14" fill="${NAVY}"/><path d="M46 96 Q75 118 104 96" fill="none" stroke="${NAVY}" stroke-width="8" stroke-linecap="round"/></g>`;
  return `<g fill="none" stroke="${CREAM}" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 16"><path d="M110 200 V300"/><path d="M450 200 V300"/><path d="M280 220 V300"/></g>`
    + bot(35, 60, CREAM) + bot(215, 100, TEAL) + bot(380, 60, CREAM)
    + `<g transform="translate(40,300)"><rect x="12" y="12" width="520" height="220" rx="28" fill="${PAPER}"/><rect width="520" height="220" rx="28" fill="${NAVY}" stroke="${CREAM}" stroke-width="8"/>`
    + [0, 1, 2].map((i) => `<g transform="translate(${28 + i * 164},34)"><rect width="148" height="160" rx="16" fill="${i === 1 ? TEAL : CREAM}" opacity="${i === 2 ? 0.55 : 1}"/><g fill="${NAVY}"><rect x="16" y="22" width="90" height="12" rx="6"/><rect x="16" y="50" width="116" height="12" rx="6"/><rect x="16" y="78" width="70" height="12" rx="6"/></g>${i === 0 ? `<path d="M22 122 l16 16 l32 -34" fill="none" stroke="${TEALD}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>` : ''}</g>`).join('')
    + `</g><g transform="translate(540,300)"><circle cx="7" cy="7" r="54" fill="${PAPER}"/><circle r="54" fill="${NAVY}" stroke="${CREAM}" stroke-width="8"/>${T(0, 12, 'middle', 34, CREAM, '24/7')}</g>`;
}
// agent payments illustration added 2026-11-20 (ChatGPT Wallet review): a wallet with a card peeking out and a Face ID approval badge
function flatWallet() {
  return `<g transform="rotate(-8 270 230)"><rect x="100" y="104" width="330" height="196" rx="26" fill="${PAPER}" transform="translate(12,12)"/><rect x="100" y="104" width="330" height="196" rx="26" fill="${TEAL}" stroke="${CREAM}" stroke-width="8"/><rect x="132" y="140" width="56" height="42" rx="10" fill="${NAVY}"/><g fill="${NAVY}"><rect x="132" y="240" width="150" height="14" rx="7"/><rect x="300" y="240" width="90" height="14" rx="7"/></g></g>
<rect x="40" y="250" width="440" height="250" rx="44" fill="${PAPER}" transform="translate(16,16)"/>
<rect x="40" y="250" width="440" height="250" rx="44" fill="${CREAM}" stroke="${CREAM}" stroke-width="8"/>
<path d="M70 300 H300" stroke="${NAVY}" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 14"/>
<rect x="352" y="332" width="170" height="96" rx="30" fill="${NAVY}" stroke="${CREAM}" stroke-width="8"/><circle cx="406" cy="380" r="16" fill="${TEAL}"/>
<g transform="translate(450,190)"><circle cx="10" cy="10" r="92" fill="${PAPER}"/><circle r="92" fill="${NAVY}" stroke="${CREAM}" stroke-width="8"/>
<g fill="none" stroke="${TEAL}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><path d="M-56 -26 V-52 H-30"/><path d="M30 -52 H56 V-26"/><path d="M56 26 V52 H30"/><path d="M-30 52 H-56 V26"/></g>
<g stroke="${CREAM}" stroke-width="8" stroke-linecap="round" fill="none"><path d="M-22 -16 V-4"/><path d="M22 -16 V-4"/><path d="M-4 -6 V10 H4"/><path d="M-20 26 Q0 40 20 26"/></g></g>
<g transform="translate(540,70)"><circle cx="7" cy="7" r="40" fill="${PAPER}"/><circle r="40" fill="${TEAL}" stroke="${CREAM}" stroke-width="7"/><path d="M-16 0 L-5 12 L17 -12" fill="none" stroke="${NAVY}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}
// video game launch illustration added 2026-11-20 (GTA 6 launch numbers post): a game controller, a stack of coins and a dashed "EST." stamp
function flatGame() {
  const coin = (x, y) => `<ellipse cx="${x + 8}" cy="${y + 8}" rx="74" ry="26" fill="${PAPER}"/><ellipse cx="${x}" cy="${y}" rx="74" ry="26" fill="${TEAL}" stroke="${CREAM}" stroke-width="8"/>`;
  return `<g transform="rotate(-8 270 210)"><path d="M120 120 H420 C500 120 530 290 480 320 C440 344 410 300 380 260 H160 C130 300 100 344 60 320 C10 290 40 120 120 120Z" fill="${PAPER}" transform="translate(14,14)"/>
<path d="M120 120 H420 C500 120 530 290 480 320 C440 344 410 300 380 260 H160 C130 300 100 344 60 320 C10 290 40 120 120 120Z" fill="${CREAM}" stroke="${CREAM}" stroke-width="8" stroke-linejoin="round"/>
<g fill="${NAVY}"><rect x="108" y="176" width="22" height="70" rx="8"/><rect x="84" y="200" width="70" height="22" rx="8"/><circle cx="400" cy="184" r="17"/><circle cx="440" cy="222" r="17" fill="${TEAL}"/><circle cx="360" cy="222" r="17"/><circle cx="400" cy="260" r="17"/></g><rect x="236" y="170" width="76" height="30" rx="15" fill="${TEAL}"/></g>
${coin(130, 470)}${coin(130, 440)}${coin(130, 410)}${coin(130, 380)}
<g transform="translate(400,440) rotate(6)"><rect x="12" y="12" width="190" height="96" rx="20" fill="${PAPER}"/><rect width="190" height="96" rx="20" fill="${NAVY}" stroke="${CREAM}" stroke-width="7" stroke-dasharray="3 14" stroke-linecap="round"/>${T(95, 48, 'middle', 38, CREAM, '$1.84B')}${T(95, 80, 'middle', 24, TEAL, 'EST.', 800)}</g>
<g transform="translate(520,70)"><circle r="40" cx="8" cy="8" fill="${PAPER}"/><circle r="40" fill="#e5383b" stroke="${CREAM}" stroke-width="7"/>${T(0, 18, 'middle', 50, CREAM, '?')}</g>`;
}
// web server gateway illustration added 2026-11-21 (NGINX HTTP/2 flaws post): three request streams into a proxy box with a broken padlock, an "h2" label and a version tag
function flatGateway() {
  const arrow = (y, c) => `<path d="M10 ${y} H190" stroke="${c}" stroke-width="14" stroke-linecap="round" stroke-dasharray="2 26"/><path d="M178 ${y - 18} L206 ${y} L178 ${y + 18}" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `${arrow(150, CREAM)}${arrow(260, TEAL)}${arrow(370, CREAM)}
<rect x="230" y="60" width="290" height="400" rx="44" fill="${PAPER}" transform="translate(16,16)"/>
<rect x="230" y="60" width="290" height="400" rx="44" fill="${CREAM}" stroke="${CREAM}" stroke-width="9"/>
${T(375, 150, 'middle', 76, NAVY, 'h2')}
<rect x="270" y="176" width="210" height="16" rx="8" fill="${TEAL}"/>
<g transform="translate(375,320)"><path d="M-46 -34 V-62 a46 46 0 0 1 92 0 V-40" fill="none" stroke="${NAVY}" stroke-width="14" stroke-linecap="round" transform="translate(30,-8) rotate(24)"/><rect x="-62" y="-30" width="124" height="98" rx="20" fill="${NAVY}"/><circle cy="12" r="13" fill="${TEAL}"/><path d="M0 24 V44" stroke="${TEAL}" stroke-width="9" stroke-linecap="round"/></g>
<g transform="translate(520,80)"><circle cx="8" cy="8" r="44" fill="${PAPER}"/><circle r="44" fill="#e5383b" stroke="${CREAM}" stroke-width="8"/>${T(0, 16, 'middle', 52, CREAM, '!')}</g>
<g transform="translate(300,470) rotate(-4)"><rect x="12" y="12" width="230" height="70" rx="18" fill="${PAPER}"/><rect width="230" height="70" rx="18" fill="${TEAL}" stroke="${CREAM}" stroke-width="7"/>${T(115, 48, 'middle', 38, NAVY, 'v1.31.9')}</g>`;
}
function hookLines(text) {
  if (text.includes('|')) return text.split('|').map((x) => x.trim()).filter(Boolean).slice(0, 3);
  const sent = text.split(/(?<=[.!?])\s+/).filter(Boolean); if (sent.length >= 2 && sent.length <= 3) return sent;
  const w = text.split(/\s+/).filter(Boolean); if (w.length <= 1) return [w.join(' ')];
  if (w.length === 2) return [w[0], w[1]]; if (w.length === 3) return w; if (w.length === 4) return [w[0] + ' ' + w[1], w[2] + ' ' + w[3]];
  return [w[0] + ' ' + w[1], w.slice(2, w.length - 1).join(' '), w[w.length - 1]].filter(Boolean).slice(0, 3);
}
function pickMain(post) {
  const t = [post.slug, post.category, (post.tags || []).join(' '), post.title].join(' ').toLowerCase();
  if (/nginx/.test(t)) return 'gateway';
  if (/debut|first day|first-day/.test(t) && /ipo|nasdaq/.test(t)) return 'candle';
  if (/\bgta\b|grand theft auto|video game/.test(t)) return 'game';
  if (/airline|flight booking|boarding pass/.test(t)) return 'ticket';
  if (/\bwallet\b/.test(t)) return 'wallet';
  if (/teammates/.test(t)) return 'team';
  if (/lawsuit|sues |sued|attorney general|court/.test(t)) return 'court';
  if (/voice clon|deepfake|cloned voice/.test(t)) return 'voice';
  if (/meeting|google meet|zoom|video call/.test(t)) return 'meeting';
  if (/decisions api|decision api/.test(t)) return 'decide';
  if (/hydrogen|argon|flash model|fast.*cheap/.test(t)) return 'gauge';
  if (/secur|vulnerab|cve|patch|breach|privacy|dpdp|gdpr|scam|fraud|flaw|exploit/.test(t)) return 'server';
  if (/\bipo\b|stock|share price|earnings|revenue|funding|valuation|pricing|market|layoff|nasdaq/.test(t)) return 'bars';
  return null;
}
function coverHtmlD(post, W, H, G) {
  const { esc, b64, FONTS, pickArt, ART, DEFS, STAGE, KIND, hookText, ACC } = G;
  const k = W / 1600, SH = Math.round(1600 * H / W), dy = SH - 900, text = hookText(post).toUpperCase(), lines = hookLines(text);
  const maxc = Math.max(...lines.map((l) => l.length)), fs = Math.min(170, Math.floor(760 / (maxc * 0.76)), Math.floor((SH - 140 - 270) / (lines.length * 0.92)));
  const numAt = lines.findIndex((l) => /\d/.test(l)), hi = numAt > -1 ? numAt : lines.length - 1;
  const h1 = lines.map((l, i) => (i === hi ? `<em>${esc(l)}</em>` : esc(l))).join('<br>');
  const tag = String(post.banner_tag || '').slice(0, 24).toUpperCase(), sub = String(post.banner_sub || post.title || '').slice(0, 60);
  const ph = post.photo && post.photo.file, kind = pickMain(post), t = [post.slug, post.category, (post.tags || []).join(' '), post.title].join(' ').toLowerCase();
  const icons = pickIcons(t); let main, sat = '';
  const mt = Math.round((SH - 504) / 2);
  if (ph) main = `<div class="ph"><img src="${b64(ph, 'image/jpeg')}" alt=""></div>`;
  else if (kind === 'server') main = `<svg class="art" viewBox="0 0 600 560">${flatServer()}</svg>`;
  else if (kind === 'gateway') main = `<svg class="art" viewBox="0 0 600 560">${flatGateway()}</svg>`;
  else if (kind === 'voice') main = `<svg class="art" viewBox="0 0 600 560">${flatVoice()}</svg>`;
  else if (kind === 'meeting') main = `<svg class="art" viewBox="0 0 600 560">${flatMeeting()}</svg>`;
  else if (kind === 'gauge') main = `<svg class="art" viewBox="0 0 600 560">${flatGauge()}</svg>`;
  else if (kind === 'decide') main = `<svg class="art" viewBox="0 0 600 560">${flatDecide()}</svg>`;
  else if (kind === 'team') main = `<svg class="art" viewBox="0 0 600 560">${flatTeam()}</svg>`;
  else if (kind === 'game') main = `<svg class="art" viewBox="0 0 600 560">${flatGame()}</svg>`;
  else if (kind === 'wallet') main = `<svg class="art" viewBox="0 0 600 560">${flatWallet()}</svg>`;
  else if (kind === 'ticket') main = `<svg class="art" viewBox="0 0 600 560">${flatTicket()}</svg>`;
  else if (kind === 'court') main = `<svg class="art" viewBox="0 0 600 560">${flatCourt()}</svg>`;
  else if (kind === 'candle') main = `<svg class="art" viewBox="0 0 600 560">${flatCandle()}</svg>`;
  else if (kind === 'bars') main = `<svg class="art" viewBox="0 0 600 560">${flatBars()}</svg>`;
  else main = `<svg class="art2" viewBox="0 0 400 300" fill="none">${DEFS(ACC.teal[0])}${STAGE(ACC.teal[0])}${ART[pickArt(post)](ACC.teal[0])}</svg>`;
  const kk = (KIND[post.kind] || 'Blog').toUpperCase();
  const bot = String(post.banner_pill || (tag && tag !== kk ? kk : '')).slice(0, 16);
  sat = ''; // top row: a tag pill and an icon badge
  sat += pill(1040, 104, Math.max(150, 30 + (tag || kk).length * 22), 58, TEAL, esc(tag || kk), 28);
  sat += badge(1480, 130, 56, ICON[icons[0]]);
  sat += `<g transform="translate(0,${dy})">${badge(1075, 790, 56, ICON[icons[1]])}${badge(1470, 790, 56, ICON[icons[2]])}${bot ? pill(1150, 764, Math.min(250, Math.max(130, 34 + bot.length * 15)), 56, CREAM, esc(bot), 22) : ''}</g>`;
  [[1300, 70, 16, CREAM], [1545, 270, 12, TEAL], [990, 430, 12, TEAL], [1560, 660 + dy, 14, CREAM], [1260, 330, 8, CREAM]].forEach(([x, y, r, c]) => { sat += star(x, y, r, c); });
  sat += `<g fill="${CREAM}" opacity=".7"><circle cx="1010" cy="${650 + dy}" r="6"/><circle cx="1545" cy="190" r="6"/><circle cx="1345" cy="${745 + dy}" r="5"/></g>`;
  const css = `*{margin:0;box-sizing:border-box}html,body{width:${W}px;height:${H}px;overflow:hidden;background:${PAPER}}
${FONTS()}
.s{width:1600px;height:${SH}px;zoom:${k};position:relative;overflow:hidden;color:${NAVY};font-family:Geist,sans-serif;background:${PAPER}}
.dots{position:absolute;inset:0;background-image:radial-gradient(${NAVY} 3px,transparent 3.5px);background-size:30px 30px;opacity:.10;-webkit-mask-image:linear-gradient(100deg,transparent 35%,#000)}
.panel{position:absolute;right:0;top:0;bottom:0;width:760px;background:${NAVY} radial-gradient(#fff6e62a 2px,transparent 2.6px) 0 0/28px 28px;clip-path:polygon(120px 0,100% 0,100% 100%,0 100%)}
.top{position:absolute;left:80px;top:56px;font-weight:900;font-size:24px;letter-spacing:4px;display:flex;gap:16px;align-items:center}
.top img{width:56px;height:56px;border-radius:14px}.top b{background:${NAVY};color:${PAPER};padding:9px 18px;border-radius:8px;font-size:21px}
h1{position:absolute;left:76px;top:${SH > 860 ? 150 : 135}px;font-size:${fs}px;line-height:.9;font-weight:900;letter-spacing:-.04em;text-transform:uppercase}
h1 em{font-style:normal;color:${TEALD}}
.tag{position:absolute;left:80px;bottom:170px;font-weight:900;font-size:24px;letter-spacing:4px;border-bottom:6px solid ${NAVY};padding-bottom:6px;display:${tag ? 'block' : 'none'}}
.sub{position:absolute;left:80px;bottom:62px;max-width:800px;font-size:30px;font-weight:800;color:${NAVY};background:${CREAM};padding:14px 24px;border-radius:12px;border:5px solid ${NAVY};box-shadow:7px 7px 0 ${NAVY}}
.art{position:absolute;left:1020px;top:${mt}px;width:540px;height:504px}
.art2{position:absolute;left:1000px;top:${Math.round((SH - 420) / 2)}px;width:560px;height:420px;filter:drop-shadow(0 20px 30px #0008)}
.ph{position:absolute;left:1030px;top:${Math.round((SH - 520) / 2)}px;width:500px;height:520px;border-radius:32px;overflow:hidden;border:6px solid ${CREAM};box-shadow:12px 12px 0 ${PAPER}}.ph img{width:100%;height:100%;object-fit:cover}
.sat{position:absolute;left:0;top:0;width:1600px;height:${SH}px}
.cr{position:absolute;right:50px;bottom:22px;font:500 18px Geist,sans-serif;color:rgba(244,239,230,.7)}`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="s"><div class="dots"></div><div class="panel"></div><div class="top"><img src="${b64('assets/logo-mark.svg', 'image/svg+xml')}" alt="">AASHISH PANDEY <b>${esc(kk)}</b></div><h1>${h1}</h1><div class="tag">${esc(tag)}</div><div class="sub">${esc(sub)}</div>${main}<svg class="sat" viewBox="0 0 1600 ${SH}">${sat}</svg>${ph ? `<div class="cr">${esc(post.photo.credit || '')}</div>` : ''}</div></body></html>`;
}
module.exports = { coverHtmlD, hookLines };
