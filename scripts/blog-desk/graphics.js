// Draws each post's images in the site's Night Ride look with Playwright: a 1200x630 cover (also the share image) and, for reviews, a pros-and-cons card.
// Everything is drawn from the post's own words, so there is no stock photo and no third-party licence to worry about. Output is JPEG, kept under the media limit.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const b64 = (f, mime) => 'data:' + mime + ';base64,' + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const FONTS = () => `@font-face{font-family:Geist;font-weight:100 900;src:url(${b64('assets/vendor/fonts/geist-normal-latin.woff2', 'font/woff2')})}
@font-face{font-family:'Instrument Serif';font-style:italic;src:url(${b64('assets/vendor/fonts/instrument-serif-italic-latin.woff2', 'font/woff2')})}`;
// Every post gets its own picture, drawn from a seed made from its slug, so no two covers match. What never changes is the house style: the Night Ride sky,
// the horizon and road along the bottom, the logo and name top left, the kind label top right, the headline in Geist with a serif italic line, and the web address.
const hash = (str) => { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const setSeed = (n) => { seed = (n % 2147483646) + 1; for (let i = 0; i < 4; i++) rnd(); };
const stars = (n, h) => Array.from({ length: n }, () => `<circle cx="${(rnd() * 1200).toFixed(1)}" cy="${(rnd() * h).toFixed(1)}" r="${rnd() < 0.15 ? 1.6 : 0.9}" fill="#f4efe6" opacity="${(0.25 + rnd() * 0.55).toFixed(2)}"/>`).join('');
const ACC = { amber: ['#f5b867', '245,184,103', '#ffc880'], teal: ['#7ff3e1', '127,243,225', '#9ff7ea'], violet: ['#c8a8ff', '200,168,255', '#d9c2ff'], green: ['#6fd6a8', '111,214,168', '#8fe3bd'], red: ['#ff8f7a', '255,143,122', '#ffab9b'] };
const BASE = (extra, o) => `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS()}
*{margin:0;box-sizing:border-box}html,body{width:1200px;height:630px;overflow:hidden;background:#070916}
.c{position:relative;width:1200px;height:630px;color:#f4efe6;font-family:Geist,sans-serif;background:radial-gradient(70% 60% at ${o.gx}% 100%,rgba(${o.acc[1]},.40),rgba(196,106,74,.16) 45%,transparent 75%),radial-gradient(40% 50% at ${o.sx}% ${o.sy}%,rgba(${o.acc[1]},.10),transparent 70%),linear-gradient(180deg,#070916 0%,#0b1030 62%,#1a1640 100%)}
.stars{position:absolute;inset:0}.hz{position:absolute;left:0;right:0;bottom:0;height:210px;background:url(${b64('assets/nr/horizon.svg', 'image/svg+xml')}) center bottom/1200px 210px no-repeat}
.top{position:absolute;left:64px;right:64px;top:50px;display:flex;align-items:center;justify-content:space-between;z-index:3}
.me{display:flex;align-items:center;gap:16px;font-weight:600;font-size:27px;letter-spacing:-.01em}.me img{width:50px;height:50px;border-radius:12px}
.kind{font:600 17px Geist,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:${o.acc[0]};border:1.5px solid rgba(${o.acc[1]},.45);border-radius:999px;padding:9px 20px;background:rgba(7,9,22,.5)}
${extra}</style></head><body><div class="c"><svg class="stars" width="1200" height="630">${stars(70, 400)}</svg><div class="hz"></div>`;
const TOP = (kind) => `<div class="top"><div class="me"><img src="${b64('assets/logo-mark.svg', 'image/svg+xml')}" alt="">Aashish Pandey</div><div class="kind">${esc(kind)}</div></div>`;
const KIND = { review: 'AI tool review', news: 'Tech news', breaking: 'Breaking', explainer: 'Explainer' };

/* ---- the art: illustrated scenes drawn on a 400x300 board; filled shapes, depth and glow, in the accent colour ---- */
const W_ = '#f4efe6', D_ = '#0e1230', M_ = '#1d2358', C2 = { '#f5b867': '#7ff3e1', '#7ff3e1': '#f5b867', '#c8a8ff': '#f5b867', '#6fd6a8': '#f5b867', '#ff8f7a': '#f5b867' };
const spark = (x, y, s, f, o) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${f}" opacity="${o || 1}"/>`;
let CUR = '';
const DEFS = (c) => { CUR = c; const c2 = C2[c] || '#f5b867'; return `<defs><linearGradient id="ga" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity=".55"/></linearGradient>
<linearGradient id="gm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b4499"/><stop offset=".5" stop-color="#232a6c"/><stop offset="1" stop-color="#10153e"/></linearGradient>
<linearGradient id="gr" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="400" y2="300"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${c}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
<linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="gl"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>
<radialGradient id="gd" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="${c}" stop-opacity=".30"/><stop offset=".6" stop-color="#1a2060" stop-opacity=".35"/><stop offset="1" stop-color="#070916" stop-opacity=".1"/></radialGradient>
<pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="#fff" opacity=".22"/></pattern>
<filter id="bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter><filter id="bk" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter></defs>`; };
// the stage every scene stands on: a lit disc with a dot grid, orbit rings, soft bokeh and a contact shadow, so each picture feels art-directed
const STAGE = (c) => { const c2 = C2[c] || '#f5b867'; return `<circle cx="200" cy="150" r="146" fill="url(#gd)"/><circle cx="200" cy="150" r="146" fill="url(#dots)" opacity=".55"/><circle cx="200" cy="150" r="146" fill="none" stroke="${c}" stroke-opacity=".5" stroke-width="2"/><circle cx="200" cy="150" r="176" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="1.5" stroke-dasharray="3 9"/>
<circle cx="64" cy="64" r="15" fill="${c}" opacity=".5" filter="url(#bk)"/><circle cx="352" cy="244" r="20" fill="${c2}" opacity=".4" filter="url(#bk)"/><circle cx="372" cy="70" r="9" fill="#fff" opacity=".35" filter="url(#bk)"/><circle cx="30" cy="226" r="11" fill="${c2}" opacity=".45" filter="url(#bk)"/>
<ellipse cx="200" cy="288" rx="130" ry="11" fill="#000" opacity=".5" filter="url(#bl)"/>`; };
const S = (c, w, o) => `stroke="${c === CUR ? 'url(#gr)' : c}" stroke-width="${w}" opacity="${o || 1}" stroke-linecap="round" stroke-linejoin="round"`;
const ART = {
  robot(c) { const c2 = C2[c] || '#f5b867';
    return `<line x1="200" y1="52" x2="200" y2="30" ${S(c, 5)}/><circle cx="200" cy="24" r="11" fill="${c2}"/>
<rect x="112" y="150" width="176" height="110" rx="28" fill="url(#gm)" ${S(c, 4)}/><rect x="150" y="176" width="100" height="40" rx="12" fill="${D_}" ${S(c, 2, .5)}/><circle cx="178" cy="196" r="8" fill="${c}"/><circle cx="200" cy="196" r="8" fill="${c2}"/><circle cx="222" cy="196" r="8" fill="${W_}" opacity=".7"/>
<rect x="96" y="160" width="26" height="60" rx="13" fill="${c}" opacity=".85"/><rect x="278" y="160" width="26" height="60" rx="13" fill="${c}" opacity=".85"/>
<rect x="118" y="52" width="164" height="112" rx="34" fill="url(#gm)" ${S(c, 5)}/><path d="M134 66 Q200 48 266 66 Q250 80 200 80 Q150 80 134 66Z" fill="url(#gs)"/><rect x="136" y="76" width="128" height="62" rx="24" fill="${D_}"/>
<circle cx="172" cy="108" r="17" fill="${c}"/><circle cx="228" cy="108" r="17" fill="${c}"/><circle cx="178" cy="102" r="6" fill="#fff"/><circle cx="234" cy="102" r="6" fill="#fff"/><path d="M180 130 Q200 144 220 130" ${S(c2, 5)} fill="none"/>
<rect x="100" y="86" width="16" height="44" rx="8" fill="${c2}"/><rect x="284" y="86" width="16" height="44" rx="8" fill="${c2}"/>${spark(60, 70, 18, c)}${spark(346, 52, 13, c2)}${spark(340, 210, 20, c)}${spark(52, 200, 11, c2)}
<rect x="318" y="104" width="62" height="34" rx="14" fill="${c2}" opacity=".9"/><path d="M332 138 l-8 14 l20 -14Z" fill="${c2}" opacity=".9"/><circle cx="337" cy="121" r="4" fill="${D_}"/><circle cx="349" cy="121" r="4" fill="${D_}"/><circle cx="361" cy="121" r="4" fill="${D_}"/>`; },
  rocket(c) { const c2 = C2[c] || '#f5b867';
    return `<circle cx="320" cy="70" r="34" fill="${M_}" ${S(c, 3, .8)}/><ellipse cx="320" cy="70" rx="52" ry="11" fill="none" ${S(c2, 4, .8)} transform="rotate(-18 320 70)"/>
<path d="M150 250 Q110 262 70 290 Q110 232 150 222Z" fill="${c}" opacity=".35"/><circle cx="96" cy="262" r="22" fill="${W_}" opacity=".18"/><circle cx="130" cy="276" r="16" fill="${W_}" opacity=".14"/>
<path d="M178 208 L222 208 L212 270 Q200 300 188 270Z" fill="${c2}"/><path d="M190 208 L210 208 L206 252 Q200 270 194 252Z" fill="#fff" opacity=".85"/>
<path d="M200 22 Q262 70 252 168 L248 212 L152 212 L148 168 Q138 70 200 22Z" fill="url(#gm)" ${S(c, 5)}/><path d="M170 60 Q150 110 160 200" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="8" stroke-linecap="round"/><path d="M200 22 Q238 52 246 110 L154 110 Q162 52 200 22Z" fill="${c}"/>
<circle cx="200" cy="140" r="26" fill="${D_}" ${S(W_, 5)}/><circle cx="192" cy="132" r="8" fill="${c}" opacity=".7"/>
<path d="M148 160 Q104 186 104 238 L152 212Z" fill="${c}"/><path d="M252 160 Q296 186 296 238 L248 212Z" fill="${c}"/><rect x="154" y="190" width="92" height="12" fill="${c}" opacity=".9"/>
${spark(60, 60, 16, c2)}${spark(358, 190, 14, c)}${spark(320, 262, 10, c2)}${spark(40, 150, 9, W_, .8)}`; },
  server(c) { const c2 = C2[c] || '#f5b867';
    const rack = [34, 92, 150].map((y, i) => `<rect x="34" y="${y}" width="232" height="46" rx="12" fill="url(#gm)" ${S(c, 3, .85)}/><circle cx="62" cy="${y + 23}" r="6" fill="${i === 1 ? '#ff6b6b' : c}"/><circle cx="84" cy="${y + 23}" r="6" fill="${c}" opacity=".5"/><rect x="120" y="${y + 17}" width="${90 + i * 20}" height="12" rx="6" fill="${W_}" opacity=".25"/>`).join('');
    return `${rack}
<path d="M290 70 L378 102 V170 C378 224 336 252 290 270 C244 252 202 224 202 170 V102Z" fill="${D_}" ${S(c, 6)}/><path d="M290 92 L358 116 V170 C358 210 328 230 290 246 C252 230 222 210 222 170 V116Z" fill="url(#ga)"/><path d="M290 92 L358 116 V150 Q320 130 290 140 Q260 130 222 150 V116Z" fill="url(#gs)"/>
<rect x="268" y="160" width="44" height="38" rx="9" fill="${D_}"/><path d="M276 160 V148 a14 14 0 0 1 28 0" fill="none" ${S(D_, 6)}/><circle cx="290" cy="178" r="6" fill="${c2}"/>
<path d="M60 262 L90 232 L110 250 L140 214" fill="none" ${S(c2, 5, .9)}/>${spark(372, 50, 12, c2)}${spark(24, 252, 9, c)}`; },
  laptop(c) { const c2 = C2[c] || '#f5b867';
    const code = [[0, 70, c], [14, 110, W_], [28, 60, c2], [42, 130, W_], [56, 90, c], [70, 50, W_]].map(([dy, w, f], i) => `<rect x="${(i % 3 === 1 ? 118 : 100)}" y="${78 + dy}" width="${w}" height="8" rx="4" fill="${f}" opacity="${f === W_ ? .3 : .9}"/>`).join('');
    return `<path d="M56 244 L344 244 L370 270 L30 270Z" fill="url(#gm)" ${S(c, 4)}/><rect x="170" y="252" width="60" height="8" rx="4" fill="${c}" opacity=".6"/>
<rect x="74" y="44" width="252" height="192" rx="18" fill="${D_}" ${S(c, 5)}/><rect x="88" y="58" width="224" height="164" rx="8" fill="url(#gm)"/><path d="M88 58 H312 L240 222 H88Z" fill="url(#gs)" opacity=".35"/><circle cx="104" cy="70" r="4" fill="${c}"/><circle cx="118" cy="70" r="4" fill="${c2}"/><circle cx="132" cy="70" r="4" fill="${W_}" opacity=".6"/>${code}
<rect x="238" y="150" width="56" height="56" rx="14" fill="${c}" opacity=".9"/><text x="266" y="188" text-anchor="middle" font-family="Geist" font-weight="900" font-size="26" fill="${D_}">&lt;/&gt;</text>
<rect x="318" y="86" width="64" height="52" rx="14" fill="${c2}"/><path d="M334 98 l-10 14 l10 14M366 98 l10 14 l-10 14" fill="none" ${S(D_, 5)}/>${spark(40, 70, 14, c2)}${spark(364, 214, 10, c)}`; },
  chart(c) { const c2 = C2[c] || '#f5b867'; const hs = [70, 104, 86, 138, 118, 178, 214];
    return `<line x1="24" y1="268" x2="384" y2="268" ${S(W_, 3, .4)}/>${hs.map((h, i) => `<rect x="${34 + i * 50}" y="${268 - h}" width="36" height="${h}" rx="9" fill="${i === 6 ? 'url(#ga)' : 'url(#gm)'}" ${S(c, 3, i === 6 ? 1 : .7)}/>`).join('')}
<polyline points="${hs.map((h, i) => `${52 + i * 50},${268 - h - 26}`).join(' ')}" fill="none" ${S(c2, 6)}/><circle cx="352" cy="${268 - 214 - 26}" r="12" fill="${c2}"/><path d="M330 32 L372 32 L372 74" fill="none" ${S(c2, 8)}/><path d="M334 70 L372 32" fill="none" ${S(c2, 8)}/>
<circle cx="58" cy="52" r="24" fill="${c}"/><text x="58" y="62" text-anchor="middle" font-family="Geist" font-weight="900" font-size="30" fill="${D_}">$</text><circle cx="108" cy="36" r="14" fill="${c2}" opacity=".9"/>${spark(190, 40, 12, W_, .8)}`; },
  globe(c) { const c2 = C2[c] || '#f5b867';
    return `<circle cx="200" cy="150" r="96" fill="url(#gm)" ${S(c, 5)}/><ellipse cx="200" cy="150" rx="40" ry="96" fill="none" ${S(c, 3, .6)}/><ellipse cx="200" cy="150" rx="96" ry="34" fill="none" ${S(c, 3, .6)}/><line x1="200" y1="54" x2="200" y2="246" ${S(c, 3, .5)}/>
<path d="M150 112 q20 -20 44 -6 q10 20 -6 30 q-24 8 -38 -24Z M214 150 q30 -14 52 8 q-4 30 -36 38 q-22 -22 -16 -46Z" fill="${c}" opacity=".7"/>
<ellipse cx="200" cy="150" rx="176" ry="58" fill="none" ${S(c2, 4, .8)} transform="rotate(-24 200 150)"/>
<circle cx="52" cy="204" r="16" fill="${c2}"/><circle cx="352" cy="96" r="14" fill="${c}"/><circle cx="332" cy="226" r="10" fill="${W_}" opacity=".85"/><rect x="316" y="30" width="62" height="36" rx="12" fill="${c2}"/><path d="M332 40 h30 M332 52 h20" ${S(D_, 5)}/>${spark(60, 60, 14, c2)}`; },
  pulse(c) { const c2 = C2[c] || '#f5b867';
    return `<rect x="28" y="52" width="344" height="196" rx="24" fill="url(#gm)" ${S(c, 5)}/><rect x="44" y="68" width="312" height="164" rx="14" fill="${D_}"/>${[100, 150, 200, 250, 300].map((x) => `<line x1="${x}" y1="68" x2="${x}" y2="232" ${S(W_, 1.5, .12)}/>`).join('')}
<polyline points="44,160 100,160 124,160 142,104 166,208 188,128 208,160 270,160 290,160 312,92 330,160 356,160" fill="none" ${S(c, 6)}/><circle cx="312" cy="92" r="9" fill="${c2}"/>
<path d="M200 4 L258 100 H142Z" fill="${c2}" ${S(D_, 4)} transform="translate(0 0)"/><rect x="195" y="38" width="10" height="34" rx="5" fill="${D_}"/><circle cx="200" cy="84" r="6" fill="${D_}"/>${spark(366, 40, 11, c)}${spark(30, 262, 9, c2)}`; },
  cards(c) { const c2 = C2[c] || '#f5b867';
    const star = (x, y, f) => `<path d="M${x} ${y - 14} l4.4 9 9.8 1.4 -7.1 6.9 1.7 9.8 -8.8 -4.6 -8.8 4.6 1.7 -9.8 -7.1 -6.9 9.8 -1.4Z" fill="${f}"/>`;
    return `<g transform="rotate(-8 200 150)"><rect x="60" y="40" width="200" height="190" rx="24" fill="url(#gm)" ${S(c, 4, .6)}/></g><g transform="rotate(7 200 150)"><rect x="90" y="30" width="224" height="200" rx="26" fill="url(#gm)" ${S(c, 4, .85)}/>${[0, 1, 2, 3, 4].map((i) => star(128 + i * 36, 78, i < 4 ? c2 : '#3a4180')).join('')}<rect x="118" y="112" width="150" height="10" rx="5" fill="${W_}" opacity=".3"/><rect x="118" y="134" width="120" height="10" rx="5" fill="${W_}" opacity=".3"/>
<circle cx="150" cy="190" r="26" fill="${c}"/><path d="M138 192 l9 9 l17 -19" fill="none" ${S(D_, 6)}/><circle cx="226" cy="190" r="26" fill="#ff6b6b"/><path d="M215 179 l22 22 M237 179 l-22 22" fill="none" ${S(D_, 6)}/></g>${spark(360, 60, 18, c2)}${spark(36, 250, 12, c)}${spark(366, 220, 9, W_, .8)}`; },
};
function pickArt(post) {
  const text = [post.slug, post.category, (post.tags || []).join(' '), post.title].join(' ').toLowerCase();
  if (/secur|vulnerab|cve|patch|breach|privacy|dpdp|gdpr|scam|fraud|flaw|exploit/.test(text)) return 'server';
  if (/gemini|gpt|openai|anthropic|claude|llm|model|chatbot|agent|assistant|\bai\b/.test(text) && post.kind !== 'explainer') return 'robot';
  if (/github|code|coding|developer|api|terminal|cli|open.?source|sdk/.test(text)) return 'laptop';
  if (/layoff|earnings|revenue|funding|valuation|pricing|cost|market|stock/.test(text)) return 'chart';
  if (/outage|incident|breaking|uptime|latency|monitor/.test(text)) return 'pulse';
  if (/launch|release|new |unveil|announce/.test(text)) return 'rocket';
  if (/explain|how |what is|guide|rag/.test(text) || post.kind === 'explainer') return rnd() < 0.5 ? 'globe' : 'robot';
  if (post.kind === 'review') return rnd() < 0.5 ? 'cards' : 'robot';
  return ['globe', 'rocket', 'chart', 'cards'][Math.floor(rnd() * 4)];
}
function look(post) {
  const h = hash(post.slug || post.title || 'post'); setSeed(h);
  const byKind = { review: 'green', news: 'amber', breaking: 'red', explainer: 'teal' };
  const pool = ['amber', 'teal', 'violet', 'green'], accent = post.kind === 'breaking' ? 'red' : rnd() < 0.45 ? byKind[post.kind] || 'amber' : pool[Math.floor(rnd() * pool.length)];
  return { acc: ACC[accent], accent, layout: ['side', 'wide', 'flip', 'stage'][Math.floor(rnd() * 4)], gx: [22, 50, 78][Math.floor(rnd() * 3)], sx: 20 + Math.floor(rnd() * 60), sy: 18 + Math.floor(rnd() * 30), art: pickArt(post), h };
}
// The banner (also the share image) and the YouTube thumbnail are one design at two sizes, built on the explainer-thumbnail rules:
//  - 3 to 5 words of big type that ADD to the title (a hook or a number), never the title itself
//  - at most three things on it: the hook, one bold picture, and a small brand badge
//  - heavy, high-contrast letters with an outline and shadow so it reads at 10% size on a phone
//  - the bottom-right corner stays empty (YouTube's time stamp sits there)
//  - it must promise only what the post or video delivers in its first seconds
function hookText(post) {
  const t = String(post.thumb_text || '').replace(/\s+/g, ' ').trim();
  if (t) return t;
  const words = String(post.title || '').replace(/[:|].*$/, '').split(/\s+/).filter(Boolean); return words.slice(0, 5).join(' ');
}
function coverHtml(post, W, H) {
  W = W || 1200; H = H || 630; const k = W / 1280, o = look(post), c = o.acc[0], text = hookText(post), kind = post.kind;
  setSeed(o.h + 7); const art = `<svg viewBox="0 0 400 300" fill="none">${DEFS(c)}${STAGE(c)}${ART[o.art](c)}</svg>`;
  const n = text.length, layout = o.layout === 'wide' ? 'side' : o.layout, fs = Math.round((n <= 14 ? 170 : n <= 22 ? 148 : 124) * (layout === 'stage' ? 0.72 : 1) * k);
  // the first number or the last word gets the accent colour so one thing pops
  const words = esc(text).split(' '), numAt = words.findIndex((w) => /\d/.test(w)), hi = numAt > -1 ? numAt : words.length - 1;
  const hl = words.map((w, i) => (i === hi ? `<em>${w}</em>` : w)).join(' ');
  const css = `*{margin:0;box-sizing:border-box}html,body{width:${W}px;height:${H}px;overflow:hidden;background:#070916}
.c{position:relative;width:${W}px;height:${H}px;color:#fff;font-family:Geist,sans-serif;overflow:hidden}
.badge{position:absolute;left:${48 * k}px;top:${40 * k}px;display:flex;align-items:center;gap:${14 * k}px;z-index:3;font-weight:700;font-size:${26 * k}px;background:rgba(7,9,22,.62);border:${1.5 * k}px solid rgba(${o.acc[1]},.5);border-radius:999px;padding:${8 * k}px ${22 * k}px ${8 * k}px ${10 * k}px}.badge img{width:${38 * k}px;height:${38 * k}px;border-radius:${9 * k}px}.badge span{color:${c};letter-spacing:.12em;text-transform:uppercase;font-size:${20 * k}px}
.main{position:absolute;left:${52 * k}px;right:${52 * k}px;top:${118 * k}px;bottom:${150 * k}px;display:flex;align-items:center;gap:${30 * k}px;z-index:2}
h1{font-weight:900;word-break:keep-all;font-size:${fs}px;line-height:.98;letter-spacing:-.04em;text-wrap:balance;-webkit-text-stroke:${Math.max(4, 9 * k)}px #05060f;paint-order:stroke fill;text-shadow:0 ${8 * k}px ${22 * k}px rgba(0,0,0,.55);flex:1;min-width:0}h1 em{font-style:normal;color:${c};text-shadow:0 0 ${46 * k}px rgba(${o.acc[1]},.55),0 ${8 * k}px ${22 * k}px rgba(0,0,0,.55)}
.mo{flex:none;width:${(layout === 'stage' ? 400 : 480) * k}px}.mo svg{display:block;width:100%;height:auto;filter:drop-shadow(0 ${6 * k}px ${16 * k}px rgba(0,0,0,.5))}
.flip{flex-direction:row-reverse}.stage{flex-direction:column;justify-content:center;text-align:center;gap:${8 * k}px}.stage .mo{order:-1}.stage h1{flex:none}`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS()}${css}
.bg{position:absolute;inset:0;background:radial-gradient(70% 60% at ${o.gx}% 100%,rgba(${o.acc[1]},.46),rgba(196,106,74,.18) 45%,transparent 75%),radial-gradient(45% 55% at ${o.sx}% ${o.sy}%,rgba(${o.acc[1]},.14),transparent 70%),linear-gradient(180deg,#070916 0%,#0b1030 62%,#1a1640 100%)}
.stars{position:absolute;inset:0}.hz{position:absolute;left:0;right:0;bottom:0;height:${H * 0.33}px;background:url(${b64('assets/nr/horizon.svg', 'image/svg+xml')}) center bottom/${W}px ${H * 0.33}px no-repeat}</style></head>
<body><div class="c"><div class="bg"></div><svg class="stars" width="${W}" height="${H}" viewBox="0 0 1200 630" preserveAspectRatio="none">${stars(60, 380)}</svg><div class="hz"></div>
<div class="badge"><img src="${b64('assets/logo-mark.svg', 'image/svg+xml')}" alt="">Aashish Pandey <span>${esc(KIND[kind] || 'Blog')}</span></div>
<div class="main ${layout}"><h1>${hl}</h1><div class="mo">${art}</div></div></div></body></html>`;
}
function prosConsHtml({ name, pros, cons, post }) {
  const o = look(post || { slug: name, kind: 'review' });
  const li = (a, c) => a.slice(0, 5).map((x) => `<li><i style="background:${c}"></i><span>${esc(x)}</span></li>`).join('');
  return BASE(`.t{position:absolute;left:64px;top:128px;font-weight:600;font-size:46px;letter-spacing:-.03em}.cols{position:absolute;left:64px;right:64px;top:210px;display:flex;gap:28px}
.col{flex:1;background:rgba(14,18,48,.82);border:1.5px solid rgba(244,239,230,.16);border-radius:22px;padding:22px 26px 18px;min-height:300px}.col h2{font:600 17px Geist,sans-serif;letter-spacing:.14em;text-transform:uppercase;margin-bottom:12px}
ul{list-style:none;padding:0;margin:0}li{display:flex;gap:14px;align-items:flex-start;font-size:23px;line-height:1.25;margin:0 0 12px}li i{flex:none;width:10px;height:10px;border-radius:50%;margin-top:9px}.url{position:absolute;left:64px;bottom:30px;font:500 20px Geist,sans-serif;color:rgba(244,239,230,.62)}`, o)
    + `${TOP('Pros and cons')}<div class="t">${esc(name)} at a glance</div><div class="cols"><div class="col"><h2 style="color:#7ee0a8">Pros</h2><ul>${li(pros, '#7ee0a8')}</ul></div><div class="col"><h2 style="color:#ff8f8f">Cons</h2><ul>${li(cons, '#ff8f8f')}</ul></div></div><div class="url">aashishpandey.com/blog</div></div></body></html>`;
}

async function render(htmls, sizes) {
  let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')); }
  const browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } }), out = [];
    for (let hi = 0; hi < htmls.length; hi++) {
      const h = htmls[hi], sz = (sizes && sizes[hi]) || [1200, 630]; await page.setViewportSize({ width: sz[0], height: sz[1] });
      await page.setContent(h); await page.evaluate(() => document.fonts.ready);
      let q = 84, buf; do { buf = await page.screenshot({ type: 'jpeg', quality: q }); q -= 10; } while (buf.length > 480 * 1024 && q > 40);
      out.push(buf);
    }
    return out;
  } finally { await browser.close(); }
}
// returns [{ role, buf, w, h }]
async function makeImages(post) {
  const meta = { slug: post.slug, category: post.category, tags: post.tags, kind: post.kind, title: post.image_headline || post.title, thumb_text: post.thumb_text };
  const htmls = [coverHtml(meta, 1200, 630), coverHtml(meta, 1280, 720)], roles = ['cover', 'thumb'], sizes = [[1200, 630], [1280, 720]];
  if (post.kind === 'review' && (post.pros || []).length >= 2 && (post.cons || []).length >= 2) { htmls.push(prosConsHtml({ name: post.product || post.title, pros: post.pros, cons: post.cons, post: meta })); roles.push('proscons'); sizes.push([1200, 630]); }
  const bufs = await render(htmls, sizes); return bufs.map((buf, i) => ({ role: roles[i], buf, w: sizes[i][0], h: sizes[i][1] }));
}
// one scene as a standalone svg (used by the video maker): name is one of the ART keys, accent one of the ACC keys
const artSvg = (name, accent) => { const c = (ACC[accent] || ACC.amber)[0]; return `<svg viewBox="0 0 400 300" fill="none">${DEFS(c)}${STAGE(c)}${(ART[name] || ART.robot)(c)}</svg>`; };
module.exports = { makeImages, coverHtml, prosConsHtml, artSvg, ART, ACC };
