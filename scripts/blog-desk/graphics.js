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

/* ---- the art: each is drawn on a 400x300 board from the seed ---- */
const L = (c, w, o) => `stroke="${c}" stroke-width="${w}" opacity="${o}" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
const ART = {
  network(c) { const n = 9 + Math.floor(rnd() * 4), pts = Array.from({ length: n }, () => [30 + rnd() * 340, 24 + rnd() * 250]);
    const edges = []; pts.forEach((a, i) => pts.slice(i + 1).map((b, j) => [Math.hypot(a[0] - b[0], a[1] - b[1]), i, i + 1 + j]).sort((x, y) => x[0] - y[0]).slice(0, 2).forEach((e) => edges.push(e)));
    return edges.map((e) => `<line x1="${pts[e[1]][0]}" y1="${pts[e[1]][1]}" x2="${pts[e[2]][0]}" y2="${pts[e[2]][1]}" ${L(c, 2, 0.5)}/>`).join('') + pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${i % 4 === 0 ? 11 : 6}" fill="${i % 4 === 0 ? c : '#070916'}" stroke="${c}" stroke-width="2.5"/>`).join(''); },
  bars(c) { const n = 7, w = 34; let h = 60 + rnd() * 60; const bs = Array.from({ length: n }, () => (h = Math.max(40, Math.min(230, h + (rnd() - 0.42) * 70))));
    return `<line x1="14" y1="268" x2="386" y2="268" ${L('#f4efe6', 2, 0.35)}/>` + bs.map((v, i) => `<rect x="${24 + i * 52}" y="${268 - v}" width="${w}" height="${v}" rx="8" fill="${i === n - 1 ? c : 'none'}" stroke="${c}" stroke-width="2.5" opacity="${i === n - 1 ? 0.9 : 0.7}"/>`).join('') + `<polyline points="${bs.map((v, i) => `${41 + i * 52},${268 - v - 22}`).join(' ')}" ${L('#f4efe6', 2.5, 0.55)}/>`; },
  shield(c) { return `<path d="M200 24 L330 70 V150 C330 218 270 258 200 282 C130 258 70 218 70 150 V70 Z" ${L(c, 3.5, 0.9)}/><path d="M200 60 L296 94 V150 C296 200 252 230 200 250 C148 230 104 200 104 150 V94 Z" ${L(c, 2, 0.4)}/><rect x="168" y="138" width="64" height="52" rx="10" fill="${c}" opacity=".9"/><path d="M178 138 V122 a22 22 0 0 1 44 0 V138" ${L(c, 5, 0.9)}/>`; },
  terminal(c) { const lines = Array.from({ length: 5 }, (_, i) => `<rect x="62" y="${104 + i * 34}" width="${60 + Math.floor(rnd() * 200)}" height="10" rx="5" fill="${i === 0 ? c : '#f4efe6'}" opacity="${i === 0 ? 0.9 : 0.28}"/>`).join('');
    return `<rect x="24" y="36" width="352" height="228" rx="20" ${L(c, 3, 0.85)}/><line x1="24" y1="78" x2="376" y2="78" ${L(c, 2, 0.4)}/><circle cx="52" cy="57" r="6" fill="${c}"/><circle cx="74" cy="57" r="6" fill="${c}" opacity=".6"/><circle cx="96" cy="57" r="6" fill="${c}" opacity=".3"/>${lines}<rect x="62" y="238" width="14" height="10" rx="2" fill="${c}"/>`; },
  rings(c) { const cx = 200, cy = 150; return [120, 92, 64, 36].map((r, i) => `<circle cx="${cx}" cy="${cy}" r="${r}" ${L(c, 2.5, 0.85 - i * 0.18)} stroke-dasharray="${i % 2 ? '4 10' : 'none'}"/>`).join('') + Array.from({ length: 4 }, (_, i) => { const a = rnd() * 6.283, r = [120, 92, 64, 36][i]; return `<circle cx="${(cx + Math.cos(a) * r).toFixed(1)}" cy="${(cy + Math.sin(a) * r).toFixed(1)}" r="9" fill="${c}"/>`; }).join('') + `<circle cx="${cx}" cy="${cy}" r="10" fill="${c}" opacity=".9"/>`; },
  cards(c) { return [0, 1, 2].map((i) => `<g transform="rotate(${(i - 1) * 9} 200 160)"><rect x="${88 + i * 8}" y="${44 + i * 10}" width="224" height="170" rx="22" fill="#0e1230" ${L(c, 3, 0.9 - i * 0.2)}/>${i === 2 ? `<rect x="120" y="90" width="90" height="12" rx="6" fill="${c}"/><rect x="120" y="120" width="156" height="9" rx="4.5" fill="#f4efe6" opacity=".3"/><rect x="120" y="144" width="132" height="9" rx="4.5" fill="#f4efe6" opacity=".3"/><rect x="120" y="168" width="100" height="9" rx="4.5" fill="#f4efe6" opacity=".3"/>` : ''}</g>`).join(''); },
  pulse(c) { let x = 20, pts = []; while (x < 380) { const spike = rnd() < 0.3; pts.push([x, 150 + (spike ? (rnd() - 0.5) * 190 : (rnd() - 0.5) * 30)]); x += spike ? 18 : 30; }
    return `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" ${L(c, 4, 0.9)}/>` + [60, 120, 180, 240, 300].map((gx) => `<line x1="${gx}" y1="24" x2="${gx}" y2="276" ${L('#f4efe6', 1, 0.12)}/>`).join('') + `<circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="9" fill="${c}"/>`; },
};
function pickArt(post) {
  const text = [post.slug, post.category, (post.tags || []).join(' '), post.title].join(' ').toLowerCase();
  if (/secur|vulnerab|cve|patch|breach|privacy|dpdp|gdpr|scam|fraud/.test(text)) return 'shield';
  if (/github|code|coding|developer|api|terminal|cli|open.?source|sdk/.test(text)) return 'terminal';
  if (/layoff|earnings|revenue|funding|valuation|pricing|cost|market|stock/.test(text)) return 'bars';
  if (/outage|incident|breaking|uptime|latency|monitor/.test(text)) return 'pulse';
  if (/explain|how |what is|guide|rag|agent/.test(text) || post.kind === 'explainer') return rnd() < 0.5 ? 'rings' : 'network';
  if (post.kind === 'review') return rnd() < 0.5 ? 'cards' : 'network';
  return ['network', 'rings', 'bars', 'cards'][Math.floor(rnd() * 4)];
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
  setSeed(o.h + 7); const art = `<svg viewBox="0 0 400 300" fill="none">${ART[o.art](c)}</svg>`;
  const n = text.length, fs = Math.round((n <= 14 ? 170 : n <= 22 ? 148 : 124) * k), layout = o.layout === 'wide' ? 'side' : o.layout;
  // the first number or the last word gets the accent colour so one thing pops
  const words = esc(text).split(' '), numAt = words.findIndex((w) => /\d/.test(w)), hi = numAt > -1 ? numAt : words.length - 1;
  const hl = words.map((w, i) => (i === hi ? `<em>${w}</em>` : w)).join(' ');
  const css = `*{margin:0;box-sizing:border-box}html,body{width:${W}px;height:${H}px;overflow:hidden;background:#070916}
.c{position:relative;width:${W}px;height:${H}px;color:#fff;font-family:Geist,sans-serif;overflow:hidden}
.badge{position:absolute;left:${48 * k}px;top:${40 * k}px;display:flex;align-items:center;gap:${14 * k}px;z-index:3;font-weight:700;font-size:${26 * k}px;background:rgba(7,9,22,.62);border:${1.5 * k}px solid rgba(${o.acc[1]},.5);border-radius:999px;padding:${8 * k}px ${22 * k}px ${8 * k}px ${10 * k}px}.badge img{width:${38 * k}px;height:${38 * k}px;border-radius:${9 * k}px}.badge span{color:${c};letter-spacing:.12em;text-transform:uppercase;font-size:${20 * k}px}
.main{position:absolute;left:${52 * k}px;right:${52 * k}px;top:${118 * k}px;bottom:${150 * k}px;display:flex;align-items:center;gap:${30 * k}px;z-index:2}
h1{font-weight:900;font-size:${fs}px;line-height:.98;letter-spacing:-.04em;text-wrap:balance;-webkit-text-stroke:${Math.max(4, 9 * k)}px #05060f;paint-order:stroke fill;text-shadow:0 ${8 * k}px ${22 * k}px rgba(0,0,0,.55);flex:1;min-width:0}h1 em{font-style:normal;color:${c}}
.mo{flex:none;width:${(layout === 'stage' ? 300 : 430) * k}px}.mo svg{display:block;width:100%;height:auto;filter:drop-shadow(0 ${6 * k}px ${16 * k}px rgba(0,0,0,.5))}.mo svg *[stroke]{stroke-width:6px}
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
module.exports = { makeImages, coverHtml, prosConsHtml };
