// Draws each post's images in the site's Night Ride look with Playwright: a 1200x630 cover (also the share image) and, for reviews, a pros-and-cons card.
// Everything is drawn from the post's own words, so there is no stock photo and no third-party licence to worry about. Output is JPEG, kept under the media limit.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const b64 = (f, mime) => 'data:' + mime + ';base64,' + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const FONTS = () => `@font-face{font-family:Geist;font-weight:100 900;src:url(${b64('assets/vendor/fonts/geist-normal-latin.woff2', 'font/woff2')})}
@font-face{font-family:'Instrument Serif';font-style:italic;src:url(${b64('assets/vendor/fonts/instrument-serif-italic-latin.woff2', 'font/woff2')})}`;
let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const stars = (n, h) => Array.from({ length: n }, () => `<circle cx="${(rnd() * 1200).toFixed(1)}" cy="${(rnd() * h).toFixed(1)}" r="${rnd() < 0.15 ? 1.6 : 0.9}" fill="#f4efe6" opacity="${(0.25 + rnd() * 0.55).toFixed(2)}"/>`).join('');
const BASE = (extra) => `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS()}
*{margin:0;box-sizing:border-box}html,body{width:1200px;height:630px;overflow:hidden;background:#070916}
.c{position:relative;width:1200px;height:630px;color:#f4efe6;font-family:Geist,sans-serif;background:radial-gradient(70% 60% at 50% 100%,rgba(245,184,103,.40),rgba(196,106,74,.16) 45%,transparent 75%),linear-gradient(180deg,#070916 0%,#070916 30%,#151236 68%,#2c1d4a 100%)}
.stars{position:absolute;inset:0}.hz{position:absolute;left:0;right:0;bottom:0;height:210px;background:url(${b64('assets/nr/horizon.svg', 'image/svg+xml')}) center bottom/1200px 210px no-repeat}
.top{position:absolute;left:64px;right:64px;top:50px;display:flex;align-items:center;justify-content:space-between}
.me{display:flex;align-items:center;gap:16px;font-weight:600;font-size:27px;letter-spacing:-.01em}.me img{width:50px;height:50px;border-radius:12px}
.kind{font:600 17px Geist,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#f5b867;border:1.5px solid rgba(245,184,103,.45);border-radius:999px;padding:9px 20px;background:rgba(7,9,22,.5)}
${extra}</style></head><body><div class="c"><svg class="stars" width="1200" height="630">${stars(70, 400)}</svg><div class="hz"></div>`;
const TOP = (kind) => `<div class="top"><div class="me"><img src="${b64('assets/logo-mark.svg', 'image/svg+xml')}" alt="">Aashish Pandey</div><div class="kind">${esc(kind)}</div></div>`;
const KIND = { review: 'AI tool review', news: 'Tech news', breaking: 'Breaking', explainer: 'Explainer' };

// a small drawing for each kind of post, so covers are not all the same
function motif(kind, n) {
  const dots = Array.from({ length: 6 }, (_, i) => [90 + i * 62, 150 - Math.sin((i + n % 3) * 1.1) * 52 - i * 6]);
  if (kind === 'review') return `<svg width="360" height="220" viewBox="0 0 360 220" fill="none"><rect x="8" y="14" width="150" height="190" rx="22" stroke="#7ee0a8" stroke-width="3" opacity=".85"/><rect x="202" y="14" width="150" height="190" rx="22" stroke="#ff8f8f" stroke-width="3" opacity=".85"/><path d="M52 112l22 24 44-52" stroke="#7ee0a8" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M250 88l54 54M304 88l-54 54" stroke="#ff8f8f" stroke-width="10" stroke-linecap="round"/><line x1="180" y1="30" x2="180" y2="190" stroke="#f4efe6" stroke-opacity=".25" stroke-dasharray="4 8"/></svg>`;
  if (kind === 'breaking') return `<svg width="360" height="220" viewBox="0 0 360 220" fill="none"><circle cx="180" cy="110" r="18" fill="#ff6b6b"/><circle cx="180" cy="110" r="44" stroke="#ff6b6b" stroke-width="3" opacity=".6"/><circle cx="180" cy="110" r="72" stroke="#ff6b6b" stroke-width="3" opacity=".3"/><circle cx="180" cy="110" r="102" stroke="#ff6b6b" stroke-width="2" opacity=".15"/></svg>`;
  if (kind === 'explainer') return `<svg width="360" height="220" viewBox="0 0 360 220" fill="none" stroke="#f5b867" stroke-width="3"><circle cx="70" cy="110" r="26"/><circle cx="190" cy="48" r="22"/><circle cx="190" cy="172" r="22"/><circle cx="300" cy="110" r="30" fill="#f5b867" fill-opacity=".2"/><path d="M94 98L170 58M94 122L170 162M212 56L274 98M212 164L274 122" opacity=".7"/></svg>`;
  return `<svg width="360" height="220" viewBox="0 0 440 220" fill="none"><polyline points="${dots.map((d) => d.join(',')).join(' ')}" stroke="#f5b867" stroke-width="3" opacity=".8"/>${dots.map((d, i) => `<circle cx="${d[0]}" cy="${d[1]}" r="${i === 5 ? 12 : 7}" fill="${i === 5 ? '#f5b867' : '#0e1230'}" stroke="#f5b867" stroke-width="3"/>`).join('')}</svg>`;
}
function coverHtml({ title, kicker, kind }) {
  const t = String(title), size = t.length > 70 ? 56 : t.length > 52 ? 64 : 74;
  return BASE(`.main{position:absolute;left:64px;right:64px;top:150px;display:flex;gap:44px;align-items:flex-start}.tx{flex:1;min-width:0}.mo{flex:none;width:300px;padding-top:6px;opacity:.95}.mo svg{width:300px;height:auto;display:block}
h1{font-weight:600;font-size:${size}px;line-height:1.04;letter-spacing:-.035em;text-wrap:balance}.k{margin-top:22px;font:italic 42px 'Instrument Serif',serif;color:#ffc880}.url{position:absolute;left:64px;bottom:34px;font:500 20px Geist,sans-serif;color:rgba(244,239,230,.62)}`)
    + `${TOP(KIND[kind] || 'Blog')}<div class="main"><div class="tx"><h1>${esc(t)}</h1>${kicker ? `<div class="k">${esc(kicker)}</div>` : ''}</div><div class="mo">${motif(kind, t.length)}</div></div><div class="url">aashishpandey.com/blog</div></div></body></html>`;
}
function prosConsHtml({ name, pros, cons }) {
  const li = (a, c) => a.slice(0, 5).map((x) => `<li><i style="background:${c}"></i><span>${esc(x)}</span></li>`).join('');
  return BASE(`.t{position:absolute;left:64px;top:128px;font-weight:600;font-size:46px;letter-spacing:-.03em}.cols{position:absolute;left:64px;right:64px;top:210px;display:flex;gap:28px}
.col{flex:1;background:rgba(14,18,48,.82);border:1.5px solid rgba(244,239,230,.16);border-radius:22px;padding:22px 26px 18px;min-height:300px}.col h2{font:600 17px Geist,sans-serif;letter-spacing:.14em;text-transform:uppercase;margin-bottom:12px}
ul{list-style:none;padding:0;margin:0}li{display:flex;gap:14px;align-items:flex-start;font-size:23px;line-height:1.25;margin:0 0 12px}li i{flex:none;width:10px;height:10px;border-radius:50%;margin-top:9px}.url{position:absolute;left:64px;bottom:30px;font:500 20px Geist,sans-serif;color:rgba(244,239,230,.62)}`)
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
  const htmls = [coverHtml({ title: post.image_headline || post.title, kicker: post.image_kicker, kind: post.kind })], roles = ['cover'];
  if (post.kind === 'review' && (post.pros || []).length >= 2 && (post.cons || []).length >= 2) { htmls.push(prosConsHtml({ name: post.product || post.title, pros: post.pros, cons: post.cons })); roles.push('proscons'); }
  const bufs = await render(htmls); return bufs.map((buf, i) => ({ role: roles[i], buf, w: 1200, h: 630 }));
}
module.exports = { makeImages, coverHtml, prosConsHtml };
