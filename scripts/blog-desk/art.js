// Single-idea blog images (cover-v2 and in-post art), the style Aashish picked on 2026-11-23. Hand-drawn SVG + HTML, rendered with Playwright, no services or keys.
//   node scripts/blog-desk/art.js scripts/blog-desk/art/<slug>.js --stills   render PNGs to /tmp/art-<slug>/ to look at first
//   node scripts/blog-desk/art.js scripts/blog-desk/art/<slug>.js            write the JPGs (cover 3600 wide + 1200 copy, in-post 2400 wide) (with metadata), set the cover, insert the in-post images, bump `updated` on a live post
// A concept file exports { slug, palette ('light' | 'dark' | 'bold', the cover's ground), cover: { html, alt }, art: [{ name, html, alt, caption, before? }] }. Build `html` with the helpers below (see art/jensen-huang-resigns-nvidia-ceo.js).
// Old <slug>-cover.jpg / -thumb.jpg files are never touched or deleted (they rank in image search); seo.ogImage is set to the new -cover-v2.jpg so share previews match the page (the old cover is still listed in the image sitemap).
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
  const { chromium } = require('playwright'), b = await chromium.launch();
  // render the HTML at `scale` x (so text stays sharp on retina and wide screens) and encode a JPEG at that full size; never downscale
  const png = async (html, scale) => { const p = await b.newPage({ viewport: { width: 1200, height: H }, deviceScaleFactor: scale }); await p.setContent(`<style>${css}</style>${html}`);
    await p.evaluate(() => Promise.all(['800 20px Geist', '400 60px "Instrument Serif"', 'italic 60px "Instrument Serif"'].map((f) => document.fonts.load(f).catch(() => 0)))); await p.waitForTimeout(150);
    const buf = await p.locator('#g').screenshot(); await p.close(); return buf; };
  const jpg = async (html, scale, q, w) => { const src = await png(html, scale);   // Pillow keeps full colour detail (4:4:4) on text edges; Playwright's encoder is the fallback
    const r = require('child_process').spawnSync('python3', ['-c', `import sys,io\nfrom PIL import Image\nim=Image.open(io.BytesIO(sys.stdin.buffer.read())).convert('RGB')\nw=${w || 0}\nif w and im.size[0]!=w: im=im.resize((w,round(im.size[1]*w/im.size[0])),Image.LANCZOS)\no=io.BytesIO();im.save(o,'JPEG',quality=${q},subsampling=0,optimize=True,progressive=True);sys.stdout.buffer.write(o.getvalue())`], { input: src, maxBuffer: 64e6 });
    if (r.status === 0 && r.stdout.length) return r.stdout;
    const p = await b.newPage({ viewport: { width: w || 1200 * scale, height: 800 } }); await p.setContent(`<body style="margin:0"><img id="i" src="data:image/png;base64,${src.toString('base64')}" style="width:${w || 1200 * scale}px;display:block">`);
    const out = await p.locator('#i').screenshot({ type: 'jpeg', quality: q }); await p.close(); return out; };
  const imgs = [{ key: 'cover', html: c.cover.html }, ...(c.art || []).map((a) => ({ key: 'art-' + a.name, html: a.html }))];
  if (stills) { const dir = `/tmp/art-${slug}`; fs.mkdirSync(dir, { recursive: true }); for (const im of imgs) fs.writeFileSync(`${dir}/${im.key}.png`, await png(im.html, 2)); console.log('stills in', dir); await b.close(); return; }
  const d = JSON.parse(fs.readFileSync(pf, 'utf8')), seo = d.seo || {}, x = d.extra || {};
  const meta = (t, alt) => ({ title: t, alt, description: seo.description || d.excerpt, keywords: [...(d.tags || []), ...(x.about || [])], url: `https://aashishpandey.com/blog/${slug}` });
  // cover: 3600x1890 -cover-hd.jpg (used, sharp on any screen) plus a 1200-wide -cover-v2.jpg that render.js offers in srcset for small cards and 1x screens
  const cf = `/assets/blog/${slug}-cover-hd.jpg`, cm = meta(seo.title || d.title, c.cover.alt);
  fs.writeFileSync(ROOT + cf, embed(await jpg(c.cover.html, 3, 86), cm));
  fs.writeFileSync(ROOT + `/assets/blog/${slug}-cover-v2.jpg`, embed(await jpg(c.cover.html, 3, 88, 1200), cm));
  d.cover = { ...(d.cover || {}), src: cf, alt: c.cover.alt };
  d.seo = { ...(d.seo || {}), ogImage: `/assets/blog/${slug}-cover-v2.jpg` };   // the share picture is always the page's cover
  d.extra = { ...(d.extra || {}), art: { palette: c.palette || 'light' } };   // light | dark | bold, scored by learn.js (image palette)
  for (const a of c.art || []) {
    const f = `/assets/blog/${slug}-art-${a.name}-hd.jpg`, line = `![${a.alt}](${f} "${a.caption}")`;
    fs.writeFileSync(ROOT + f, embed(await jpg(a.html, 2, 90), meta(`${seo.title || d.title}: ${a.name.replace(/-/g, ' ')}`, a.alt)));
    if (d.body.includes(`(${f} `)) continue;   // already placed
    const hs = [...d.body.matchAll(/^## .+$/gm)], h = (a.before && hs.find((m) => m[0].includes(a.before))) || hs[1] || hs[0];
    d.body = h ? d.body.slice(0, h.index) + line + '\n\n' + d.body.slice(h.index) : d.body + '\n\n' + line;
  }
  if (d.publishAt && d.publishAt < Date.now()) d.updated = Date.now();   // a change to a live post shows "Updated <date>"
  fs.writeFileSync(pf, JSON.stringify(d, null, 2) + '\n'); await b.close(); console.log('images written:', slug, imgs.length);
})();
