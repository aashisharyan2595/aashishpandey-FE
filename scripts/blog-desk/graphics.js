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
function coverHtml(post) {
  const o = look(post), t = String(post.title), kicker = post.kicker, kind = post.kind, c = o.acc[0];
  setSeed(o.h + 7); const art = `<svg viewBox="0 0 400 300" fill="none">${ART[o.art](c)}</svg>`;
  const size0 = t.length > 70 ? 56 : t.length > 52 ? 64 : 74, size = o.layout === 'stage' ? Math.min(size0, 64) : o.layout === 'wide' ? size0 : Math.min(size0, 66);
  const css = `.main{position:absolute;top:150px;display:flex;align-items:flex-start;z-index:2}.tx{min-width:0}.mo svg{display:block;width:100%;height:auto}
h1{font-weight:600;font-size:${size}px;line-height:1.04;letter-spacing:-.035em;text-wrap:balance}.k{margin-top:22px;font:italic 42px 'Instrument Serif',serif;color:${o.acc[2]}}.url{position:absolute;left:64px;bottom:34px;font:500 20px Geist,sans-serif;color:#aaa4b8;z-index:3}
.main.side{left:64px;right:64px;gap:48px}.side .tx{flex:1}.side .mo{flex:none;width:390px;margin-top:-10px}
.main.flip{left:64px;right:64px;gap:48px;flex-direction:row-reverse}.flip .tx{flex:1}.flip .mo{flex:none;width:390px;margin-top:-10px}
.main.wide{left:64px;right:64px}.wide .tx{width:760px}.wide .mo{position:absolute;right:-10px;top:-8px;width:420px;opacity:.28}
.main.stage{left:64px;right:64px;top:132px;flex-direction:column;align-items:center;text-align:center}.stage .tx{width:900px}.stage .mo{order:-1;width:250px;margin:0 0 6px;opacity:.95}.stage .k{margin-top:16px}`;
  return BASE(css, o) + `${TOP(KIND[kind] || 'Blog')}<div class="main ${o.layout}"><div class="tx"><h1>${esc(t)}</h1>${kicker ? `<div class="k">${esc(kicker)}</div>` : ''}</div><div class="mo">${art}</div></div><div class="url">aashishpandey.com/blog</div></div></body></html>`;
}
function prosConsHtml({ name, pros, cons, post }) {
  const o = look(post || { slug: name, kind: 'review' });
  const li = (a, c) => a.slice(0, 5).map((x) => `<li><i style="background:${c}"></i><span>${esc(x)}</span></li>`).join('');
  return BASE(`.t{position:absolute;left:64px;top:128px;font-weight:600;font-size:46px;letter-spacing:-.03em}.cols{position:absolute;left:64px;right:64px;top:210px;display:flex;gap:28px}
.col{flex:1;background:rgba(14,18,48,.82);border:1.5px solid rgba(244,239,230,.16);border-radius:22px;padding:22px 26px 18px;min-height:300px}.col h2{font:600 17px Geist,sans-serif;letter-spacing:.14em;text-transform:uppercase;margin-bottom:12px}
ul{list-style:none;padding:0;margin:0}li{display:flex;gap:14px;align-items:flex-start;font-size:23px;line-height:1.25;margin:0 0 12px}li i{flex:none;width:10px;height:10px;border-radius:50%;margin-top:9px}.url{position:absolute;left:64px;bottom:30px;font:500 20px Geist,sans-serif;color:rgba(244,239,230,.62)}`, o)
    + `${TOP('Pros and cons')}<div class="t">${esc(name)} at a glance</div><div class="cols"><div class="col"><h2 style="color:#7ee0a8">Pros</h2><ul>${li(pros, '#7ee0a8')}</ul></div><div class="col"><h2 style="color:#ff8f8f">Cons</h2><ul>${li(cons, '#ff8f8f')}</ul></div></div><div class="url">aashishpandey.com/blog</div></div></body></html>`;
}

async function render(htmls) {
  let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')); }
  const browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } }), out = [];
    for (const h of htmls) {
      await page.setContent(h); await page.evaluate(() => document.fonts.ready);
      let q = 84, buf; do { buf = await page.screenshot({ type: 'jpeg', quality: q }); q -= 10; } while (buf.length > 480 * 1024 && q > 40);
      out.push(buf);
    }
    return out;
  } finally { await browser.close(); }
}
// returns [{ role, buf, w, h }]
async function makeImages(post) {
  const meta = { slug: post.slug, category: post.category, tags: post.tags, kind: post.kind }, htmls = [coverHtml({ ...meta, title: post.image_headline || post.title, kicker: post.image_kicker })], roles = ['cover'];
  if (post.kind === 'review' && (post.pros || []).length >= 2 && (post.cons || []).length >= 2) { htmls.push(prosConsHtml({ name: post.product || post.title, pros: post.pros, cons: post.cons, post: meta })); roles.push('proscons'); }
  const bufs = await render(htmls); return bufs.map((buf, i) => ({ role: roles[i], buf, w: 1200, h: 630 }));
}
module.exports = { makeImages, coverHtml, prosConsHtml };
