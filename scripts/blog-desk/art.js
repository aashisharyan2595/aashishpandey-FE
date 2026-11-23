// Single-idea blog images (cover-v2 and in-post art), the style Aashish picked on 2026-11-23. Hand-drawn SVG + HTML, rendered with Playwright, no services or keys.
//   node scripts/blog-desk/art.js scripts/blog-desk/art/<slug>.js --stills   render PNGs to /tmp/art-<slug>/ to look at first
//   node scripts/blog-desk/art.js scripts/blog-desk/art/<slug>.js            write the JPGs (with metadata), set the cover, insert the in-post images, bump `updated` on a live post
// A concept file exports { slug, cover: { html, alt }, art: [{ name, html, alt, caption, before? }] }. Build `html` with the helpers below (see art/jensen-huang-resigns-nvidia-ceo.js).
// Old <slug>-cover.jpg / -thumb.jpg files are never touched or deleted (they rank in image search); seo.ogImage keeps pointing at the old cover.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'), F = ROOT + '/assets/vendor/fonts/', { embed } = require('./imgmeta.js');
const b64 = (n) => 'data:font/woff2;base64,' + fs.readFileSync(F + n + '.woff2').toString('base64');
const logo = 'data:image/svg+xml;base64,' + fs.readFileSync(ROOT + '/assets/logo-mark.svg').toString('base64');
const H = 630;
const css = `@font-face{font-family:Geist;font-weight:300 900;src:url(${b64('geist-normal-latin')})}
@font-face{font-family:'Instrument Serif';src:url(${b64('instrument-serif-normal-latin')})}
@font-face{font-family:'Instrument Serif';font-style:italic;src:url(${b64('instrument-serif-italic-latin')})}
*{box-sizing:border-box}body{margin:0}#g{width:1200px;height:${H}px;position:relative;overflow:hidden;font-family:Geist}
.mk{position:absolute;right:56px;bottom:36px;width:40px;height:40px;border-radius:9px}.kick{font:800 22px Geist;letter-spacing:.14em}.sub{font:600 32px/1.3 Geist}`;
// headline block: kicker, serif headline (put the accent word in <i style="color:..">), optional sub-line
const head = (t, o = {}) => `<div style="position:absolute;left:${o.l || 64}px;top:${o.t || 70}px;width:${o.w || 600}px;color:${o.c}"><div class="kick" style="color:${o.k}">${o.kick}</div><div style="font:${o.font || "400 112px/.92 'Instrument Serif'"};margin-top:18px;letter-spacing:-.01em">${t}</div>${o.sub ? `<div class="sub" style="margin-top:24px;opacity:.85">${o.sub}</div>` : ''}</div>`;
const mk = (style = '') => `<img class="mk" src="${logo}" style="${style}">`;   // logo mark, bottom-right by default
const grain = (o = .07) => `<filter id="gr"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${o} 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>`;
const svg = (inner, defs = '') => `<svg width="1200" height="${H}" style="position:absolute;left:0;top:0"><defs>${grain()}${defs}</defs>${inner}<rect width="1200" height="${H}" filter="url(#gr)"/></svg>`;
module.exports = { css, head, mk, svg, grain, logo, H };

if (require.main === module) (async () => {
  const file = process.argv[2], stills = process.argv.includes('--stills');
  if (!file) { console.log('usage: art.js <concept.js> [--stills]'); process.exit(1); }
  const c = require(path.resolve(file)), slug = c.slug, pf = path.join(ROOT, 'content', 'blog', slug + '.json');
  const { chromium } = require('playwright'), b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 1200, height: H }, deviceScaleFactor: 2 });
  const shot = async (html, w, type) => { await pg.setViewportSize({ width: 1200, height: H }); await pg.setContent(`<style>${css}</style>${html}`);
    await pg.evaluate(() => Promise.all(['800 20px Geist', '400 60px "Instrument Serif"', 'italic 60px "Instrument Serif"'].map((f) => document.fonts.load(f).catch(() => 0)))); await pg.waitForTimeout(150);
    const png = await pg.locator('#g').screenshot(); if (type === 'png') return png;
    await pg.setContent(`<body style="margin:0"><img id="i" src="data:image/png;base64,${png.toString('base64')}" style="width:${w}px;display:block">`); return pg.locator('#i').screenshot({ type: 'jpeg', quality: 84 }); };
  const imgs = [{ key: 'cover', html: c.cover.html }, ...(c.art || []).map((a) => ({ key: 'art-' + a.name, html: a.html }))];
  if (stills) { const dir = `/tmp/art-${slug}`; fs.mkdirSync(dir, { recursive: true }); for (const im of imgs) fs.writeFileSync(`${dir}/${im.key}.png`, await shot(im.html, 0, 'png')); console.log('stills in', dir); await b.close(); return; }
  const d = JSON.parse(fs.readFileSync(pf, 'utf8')), seo = d.seo || {}, x = d.extra || {};
  const meta = (t, alt) => ({ title: t, alt, description: seo.description || d.excerpt, keywords: [...(d.tags || []), ...(x.about || [])], url: `https://aashishpandey.com/blog/${slug}` });
  const cf = `/assets/blog/${slug}-cover-v2.jpg`;
  fs.writeFileSync(ROOT + cf, embed(await shot(c.cover.html, 1200), meta(seo.title || d.title, c.cover.alt)));
  d.cover = { ...(d.cover || {}), src: cf, alt: c.cover.alt };
  for (const a of c.art || []) {
    const f = `/assets/blog/${slug}-art-${a.name}.jpg`, line = `![${a.alt}](${f} "${a.caption}")`;
    fs.writeFileSync(ROOT + f, embed(await shot(a.html, 1600), meta(`${seo.title || d.title}: ${a.name.replace(/-/g, ' ')}`, a.alt)));
    if (d.body.includes(`(${f} `)) continue;   // already placed
    const hs = [...d.body.matchAll(/^## .+$/gm)], h = (a.before && hs.find((m) => m[0].includes(a.before))) || hs[1] || hs[0];
    d.body = h ? d.body.slice(0, h.index) + line + '\n\n' + d.body.slice(h.index) : d.body + '\n\n' + line;
  }
  if (d.publishAt && d.publishAt < Date.now()) d.updated = Date.now();   // a change to a live post shows "Updated <date>"
  fs.writeFileSync(pf, JSON.stringify(d, null, 2) + '\n'); await b.close(); console.log('images written:', slug, imgs.length);
})();
