// Banner style D2 "Paper" (locked by Aashish 2026-11-14): cream left with a short hook, slanted navy right panel with a subtle dot matrix,
// one main flat illustration fully on the navy side plus small supporting icons and sparkles. Cover 1200x630 and thumbnail 1280x720 share the design.
// Hook rules: 2 to 3 words, never the title, add stakes / a number / a question; `|` forces a line break. Optional post fields: banner_tag (up to 24 chars), banner_sub (up to 60 chars).
const NAVY = '#101936', CREAM = '#fff6e6', PAPER = '#f3ede1', TEAL = '#12b5a6', TEALD = '#0a8f84';
const tile = (x, y, w, h, inner, rx = 22) => `<g transform="translate(${x},${y})"><rect x="8" y="8" width="${w}" height="${h}" rx="${rx}" fill="${PAPER}"/><rect width="${w}" height="${h}" rx="${rx}" fill="${CREAM}"/>${inner}</g>`;
const star = (x, y, r, c = CREAM) => `<path transform="translate(${x},${y})" d="M0 ${-r} Q4 -4 ${r} 0 Q4 4 0 ${r} Q-4 4 ${-r} 0 Q-4 -4 0 ${-r}Z" fill="${c}"/>`;
const pill = (x, y, w, h, fill, txt, fs) => `<g transform="translate(${x},${y})"><rect x="7" y="7" width="${w}" height="${h}" rx="${h / 2}" fill="${PAPER}"/><rect width="${w}" height="${h}" rx="${h / 2}" fill="${fill}"/><text x="${w / 2}" y="${h / 2 + fs * 0.35}" text-anchor="middle" font-family="Geist" font-weight="900" font-size="${fs}" fill="${NAVY}" letter-spacing="1">${txt}</text></g>`;
const badge = (x, y, r, inner) => `<g transform="translate(${x},${y})"><circle cx="7" cy="7" r="${r}" fill="${PAPER}"/><circle r="${r}" fill="${CREAM}"/>${inner}</g>`;
const ICON = {
  lock: `<rect x="-24" y="-6" width="48" height="38" rx="9" fill="${TEAL}"/><path d="M-14 -6 V-18 a14 14 0 0 1 28 0 V-6" fill="none" stroke="${NAVY}" stroke-width="8" stroke-linecap="round"/><circle cy="12" r="5" fill="${NAVY}"/>`,
  bug: `<ellipse cy="6" rx="20" ry="26" fill="${TEAL}"/><circle cy="-24" r="12" fill="${TEAL}"/><g stroke="${NAVY}" stroke-width="5" stroke-linecap="round"><path d="M-20 -4 L-38 -12 M-20 10 L-40 14 M20 -4 L38 -12 M20 10 L40 14 M-8 -34 L-16 -48 M8 -34 L16 -48"/></g><circle cx="-7" cy="2" r="4" fill="${NAVY}"/><circle cx="8" cy="12" r="4" fill="${NAVY}"/>`,
  bell: `<path d="M0 -30 C-20 -30 -24 -10 -24 4 L-30 20 H30 L24 4 C24 -10 20 -30 0 -30Z" fill="${NAVY}"/><circle cy="30" r="7" fill="${NAVY}"/><circle cy="-34" r="5" fill="${NAVY}"/>`,
  coins: `<g stroke="${NAVY}" stroke-width="4"><ellipse cy="14" rx="26" ry="9" fill="${TEAL}"/><ellipse cy="4" rx="26" ry="9" fill="${TEAL}"/><ellipse cy="-6" rx="26" ry="9" fill="${TEAL}"/><ellipse cy="-16" rx="26" ry="9" fill="${CREAM}"/></g>`,
  bolt: `<path d="M6 -34 L-22 6 H-2 L-8 34 L24 -8 H4Z" fill="${TEAL}" stroke="${NAVY}" stroke-width="5" stroke-linejoin="round"/>`,
  chat: `<path d="M-30 -22 H30 a8 8 0 0 1 8 8 V10 a8 8 0 0 1 -8 8 H-2 L-20 32 V18 H-30 a8 8 0 0 1 -8 -8 V-14 a8 8 0 0 1 8 -8Z" fill="${TEAL}" stroke="${NAVY}" stroke-width="5" stroke-linejoin="round"/><g fill="${NAVY}"><circle cx="-14" cy="-2" r="4"/><circle cy="-2" r="4"/><circle cx="14" cy="-2" r="4"/></g>`,
  check: `<circle r="30" fill="${TEAL}" stroke="${NAVY}" stroke-width="5"/><path d="M-14 0 L-4 11 L16 -10" fill="none" stroke="${NAVY}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  clock: `<circle r="30" fill="${TEAL}" stroke="${NAVY}" stroke-width="5"/><path d="M0 -16 V0 L12 8" fill="none" stroke="${NAVY}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
  chip: `<rect x="-22" y="-22" width="44" height="44" rx="8" fill="${TEAL}" stroke="${NAVY}" stroke-width="5"/><rect x="-10" y="-10" width="20" height="20" rx="3" fill="${NAVY}"/><g stroke="${NAVY}" stroke-width="5" stroke-linecap="round"><path d="M-12 -30 V-22 M0 -30 V-22 M12 -30 V-22 M-12 22 V30 M0 22 V30 M12 22 V30 M-30 -12 H-22 M-30 0 H-22 M-30 12 H-22 M22 -12 H30 M22 0 H30 M22 12 H30"/></g>`,
};
function pickIcons(t) {
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
function flatBars() {
  let g = `<g stroke="${CREAM}" stroke-width="9" stroke-linejoin="round">`;
  [[30, 300, 110, 150, CREAM], [170, 220, 110, 230, TEAL], [310, 140, 110, 310, CREAM], [450, 50, 110, 400, TEAL]].forEach(([x, y, w, h, c]) => { g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${PAPER}" transform="translate(14,14)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${c}"/>`; });
  g += `</g><path d="M30 260 L190 180 L310 110 L480 40" fill="none" stroke="${PAPER}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,10)"/><path d="M30 260 L190 180 L310 110 L480 40" fill="none" stroke="${CREAM}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,10)"/>`;
  g += `<g transform="translate(380,330)"><circle r="78" fill="${PAPER}" cx="12" cy="12"/><circle r="78" fill="${CREAM}" stroke="${CREAM}" stroke-width="9"/><circle r="56" fill="none" stroke="${NAVY}" stroke-width="5" stroke-dasharray="4 9"/><text y="26" text-anchor="middle" font-family="Geist" font-weight="900" font-size="80" fill="${NAVY}">$</text></g>`;
  return g;
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
  else if (kind === 'bars') main = `<svg class="art" viewBox="0 0 600 560">${flatBars()}</svg>`;
  else main = `<svg class="art2" viewBox="0 0 400 300" fill="none">${DEFS(ACC.teal[0])}${STAGE(ACC.teal[0])}${ART[pickArt(post)](ACC.teal[0])}</svg>`;
  const kk = (KIND[post.kind] || 'Blog').toUpperCase();
  const bot = String(post.banner_pill || (tag && tag !== kk ? kk : '')).slice(0, 16);
  sat = ''; // top row: a tag pill and an icon badge
  sat += pill(1040, 104, Math.max(150, 30 + (tag || kk).length * 22), 58, TEAL, esc(tag || kk), 28);
  sat += badge(1480, 130, 56, ICON[icons[0]]);
  sat += `<g transform="translate(0,${dy})">${badge(1075, 790, 56, ICON[icons[1]])}${badge(1470, 790, 56, ICON[icons[2]])}${bot ? pill(1180, 764, Math.max(150, 40 + bot.length * 17), 56, CREAM, esc(bot), 24) : ''}</g>`;
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
