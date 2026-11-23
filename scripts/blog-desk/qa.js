#!/usr/bin/env node
// QA gates for the blog pipeline (docs/blog-desk-runbook.md, "QA pipeline"). Mechanical checks only; the judgement checks
// (facts, tone, relevance) are done by a separate QA agent that did not write the post.
//   node scripts/blog-desk/qa.js content <slug>              post file, images, banner uniqueness, metadata, style
//   node scripts/blog-desk/qa.js stage <slug>                 stage branch only: make a scheduled post visible on the preview (publishAt = now), remember the real time
//   node scripts/blog-desk/qa.js release <slug>               put the real go-live time back (the only change between the stage copy and what ships)
//   node scripts/blog-desk/qa.js front <base-url|local> <slug>   renders the page at phone and desktop size and checks it (`local` serves this checkout, before any deploy)
// Both print one PASS or FAIL line per check and exit 1 if any check fails. Needs no keys or services (front uses the
// Playwright and Chromium already installed in the session).
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..', '..'), BLOG = path.join(ROOT, 'content', 'blog'), IMG = path.join(ROOT, 'assets', 'blog');
const [mode, ...args] = process.argv.slice(2);
const out = []; const ok = (name, pass, note) => { out.push(pass); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${note ? ': ' + note : ''}`); };
const sha = (f) => crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex');
const readPost = (slug) => JSON.parse(fs.readFileSync(path.join(BLOG, slug + '.json'), 'utf8'));
const GENERATORS = /Playwright|Chromium|Pillow|ImageMagick|Photoshop|Midjourney|DALL|Stable Diffusion|ChatGPT|Claude|Sharp|libvips/;

function content(slug) {
  const p = readPost(slug), x = p.extra || {}, checks = require('./checks');
  ok('post fields', !!(p.title && p.excerpt && p.body && p.seo && p.seo.description && x.faq && x.faq.length >= 3 && x.sources && x.sources.length >= 3), `${(x.faq || []).length} FAQ, ${(x.sources || []).length} sources`);
  ok('title, description lengths', p.title.length <= 62 && p.excerpt.length >= 110 && p.excerpt.length <= 155 && p.seo.title.length < 50 && p.seo.description.length >= 120 && p.seo.description.length <= 155, `title ${p.title.length}, excerpt ${p.excerpt.length}, seo title ${p.seo.title.length}, seo desc ${p.seo.description.length}`);
  const lint = checks.lint(p.body); ok('human style scan', !lint.issues.length, lint.issues.slice(0, 3).join(' | '));
  const dashes = (p.body.split(/\n## Sources/)[0] + p.title + p.excerpt + JSON.stringify(x.faq)).match(/[–—]/g); ok('no em or en dashes', !dashes, dashes ? dashes.length + ' found' : '');
  const hosts = new Set((x.sources || []).map((s) => new URL(s.url).hostname.replace(/^www\./, ''))), bad = [];
  (p.body.match(/\]\((https?:[^)\s]+)/g) || []).forEach((l) => { const h = new URL(l.slice(2)).hostname.replace(/^www\./, ''); if (!hosts.has(h) && !/aashishpandey\.com$/.test(h)) bad.push(h); });
  ok('links go only to listed sources or the site', !bad.length, bad.join(', '));
  ok('no scripts, iframes or remote images in the body', !/<script|<iframe|!\[[^\]]*\]\(https?:/i.test(p.body));
  const mine = fs.readdirSync(IMG).filter((f) => f.startsWith(slug + '-')), others = fs.readdirSync(IMG).filter((f) => !f.startsWith(slug + '-') && /\.jpg$/.test(f));
  const otherHashes = new Map(others.map((f) => [sha(path.join(IMG, f)), f]));
  const dup = mine.filter((f) => otherHashes.has(sha(path.join(IMG, f)))).map((f) => f + ' = ' + otherHashes.get(sha(path.join(IMG, f))));
  ok('banner and art are unique (no identical file on any other post)', !dup.length && mine.some((f) => /cover/.test(f)), dup.join(', ') || mine.length + ' files');
  const alts = [...(p.body.match(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g) || [])].map((m) => /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/.exec(m));
  const altBad = alts.filter((m) => !m[1] || m[1].length > 125 || !m[3]).map((m) => m[2]); const coverAlt = (p.cover || {}).alt || '';
  ok('every image has alt (under 125 chars) and a caption', !altBad.length && coverAlt && coverAlt.length <= 125, altBad.join(', ') || `${alts.length} in-post image(s), cover alt ${coverAlt.length} chars`);
  const metaBad = mine.filter((f) => { const b = fs.readFileSync(path.join(IMG, f)), head = b.subarray(0, b.indexOf(Buffer.from([0xff, 0xda]))).toString('latin1'); return !head.includes('Aashish Pandey') || GENERATORS.test(head); });
  ok('image metadata: owner present, no software or AI info', !metaBad.length, metaBad.join(', '));
  ok('updated date set', Number.isFinite(p.updated), `publishAt ${new Date(p.publishAt).toISOString()}`);
  ok('in calendar covered list', (require(path.join(BLOG, 'calendar.json')).covered || []).length > 0 && fs.existsSync(path.join(BLOG, slug + '.json')));
}

// `local`: a small static server plus the same rewrites vercel.json uses for the blog, so the real renderer (api/config.js) runs on this checkout
async function serve() {
  const http = require('http'), fake = http.createServer((q, r) => { q.resume(); q.on('end', () => { r.setHeader('content-type', 'application/json'); r.end('{"result":null}'); }); });   // stands in for Redis: no database, only the post files are served
  await new Promise((r) => fake.listen(0, '127.0.0.1', r)); process.env.UPSTASH_REDIS_REST_URL = 'http://127.0.0.1:' + fake.address().port; process.env.UPSTASH_REDIS_REST_TOKEN = 'none';
  const url = require('url'), handler = require(path.join(ROOT, 'api', 'config.js')), types = { '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.html': 'text/html' };
  return new Promise((res) => { const srv = http.createServer((req, rs) => {
    const u = url.parse(req.url, true), m = /^\/blog(?:\/([a-z0-9-]+))?$/.exec(u.pathname);
    if (m || u.pathname.startsWith('/api/')) { req.query = m ? { a: 'site', p: m[1] ? 'post' : 'blog', ...(m[1] ? { slug: m[1] } : {}) } : u.query; rs.status = (c) => { rs.statusCode = c; return rs; }; rs.json = (o) => { rs.setHeader('content-type', 'application/json'); rs.end(JSON.stringify(o)); }; rs.send = (b) => rs.end(b); return Promise.resolve(handler(req, rs)).catch((e) => { rs.statusCode = 500; rs.end(String(e)); }); }
    const f = path.join(ROOT, decodeURIComponent(u.pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.statusCode = 404; return rs.end('not found'); }
    rs.setHeader('content-type', types[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(rs); });
    srv.listen(0, '127.0.0.1', () => res({ srv, base: 'http://127.0.0.1:' + srv.address().port })); });
}

async function front(base, slug) {
  let srv; const isLocal = base === 'local'; if (isLocal) ({ srv, base } = await serve());
  base = base.replace(/\/$/, ''); const url = `${base}/blog/${slug}`; let r, t0 = Date.now();   // a Vercel "building" placeholder also answers 200, so the wait below only accepts the real post page
 
  while (Date.now() - t0 < 180000) { try { r = await fetch(url + '?qa=' + Date.now()); if (r.status === 200 && (await r.clone().text()).includes('rel="canonical"')) break; r = null; } catch (e) { r = null; } await new Promise((s) => setTimeout(s, 10000)); }
  ok('post page answers 200 (waits up to 3 min for a new deploy)', !!r, r ? String(r.status) : 'no post page after 3 min'); if (!r) return;
  const { chromium } = require('playwright'), br = await chromium.launch(), dir = `/tmp/qa-${slug}`; fs.mkdirSync(dir, { recursive: true });
  const links = new Set();
  for (const [name, w, h, dpr] of [['phone', 390, 844, 3], ['desktop', 1440, 900, 2]]) {
    const pg = await (await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr })).newPage(), errs = [];
    pg.on('pageerror', (e) => errs.push(e.message)); pg.on('response', (x) => x.status() >= 400 && !(isLocal && x.url().includes('/_vercel/')) && errs.push(x.status() + ' ' + x.url().replace(base, '')));
    await pg.goto(url + '?qa=' + Date.now(), { waitUntil: 'networkidle' });
    await pg.evaluate(async () => { document.querySelectorAll('img[loading=lazy]').forEach((i) => i.loading = 'eager'); for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((s) => setTimeout(s, 80)); } window.scrollTo(0, 0); });
    const d = await pg.evaluate(async (dpr) => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth, h1: document.querySelectorAll('h1').length, title: document.title,
      desc: (document.querySelector('meta[name=description]') || {}).content || '', canon: (document.querySelector('link[rel=canonical]') || {}).href || '', ogimg: (document.querySelector('meta[property="og:image"]') || {}).content || '',
      ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { return JSON.parse(s.textContent); } catch (e) { return null; } }),
      imgs: await Promise.all([...document.querySelectorAll('article img, main img')].map(async (i) => { let nw = 0; try { nw = (await createImageBitmap(await (await fetch(i.currentSrc || i.src)).blob())).width; } catch (e) { /* counts as broken */ } return { src: i.currentSrc || i.src, alt: i.getAttribute('alt'), nw, cw: i.clientWidth, shown: i.clientWidth > 0 }; })),
      links: [...document.querySelectorAll('article a[href], main a[href]')].map((a) => a.href) }), dpr);
    ok(`${name}: no sideways scroll`, d.overflow <= 0, d.overflow + 'px'); ok(`${name}: one h1`, d.h1 === 1, d.h1 + ' found');
    for (const e of errs.filter((x) => /^5\d\d /.test(x))) { const again = await fetch(base + e.slice(4)).catch(() => ({ status: 599 })); if (again.status < 400) errs.splice(errs.indexOf(e), 1); }   // a one-off 5xx from a preview edge is not a page error if the same file loads on retry
    ok(`${name}: no console errors`, !errs.length, errs.slice(0, 2).join(' | '));
    const blurry = d.imgs.filter((i) => i.shown && i.nw < i.cw * dpr * 0.95).map((i) => `${i.src.split('/').pop()} ${i.nw}px for ${i.cw * dpr}`), broken = d.imgs.filter((i) => !i.nw || i.alt === null);   // alt="" is fine on a linked card; the post's own images are checked for real alt text by `content`
    ok(`${name}: images load, have an alt attribute, and are sharp at ${dpr}x`, !blurry.length && !broken.length, [...blurry, ...broken.map((i) => i.src.split('/').pop())].join(', ') || d.imgs.length + ' images');
    if (name === 'desktop') {
      ok('SEO tags: title, description, canonical, og:image', d.title && d.desc.length >= 100 && /\/blog\/[a-z0-9-]+$/.test(d.canon) && d.ogimg, `canonical ${d.canon}`);
      ok('structured data parses and has headline and dates', d.ld.length && d.ld.every(Boolean) && JSON.stringify(d.ld).includes('"headline"') && JSON.stringify(d.ld).includes('datePublished'));
      d.links.forEach((l) => links.add(l));
    }
    await pg.screenshot({ path: `${dir}/${name}-top.png` }); await pg.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
    // each picture as a reader sees it after scrolling to it (a full-page capture can miss lazy or revealed images)
    const figs = await pg.locator('article figure, main figure').all(); for (let i = 0; i < figs.length; i++) { await figs[i].scrollIntoViewIfNeeded(); await pg.waitForTimeout(400); await figs[i].screenshot({ path: `${dir}/${name}-figure${i + 1}.png` }).catch(() => {}); } await pg.context().close();
  }
  await br.close();
  const dead = []; for (const l of links) { if (!/^https?:/.test(l) || l.startsWith(base + '/#') || (isLocal && l.startsWith(base))) continue; try { let x = await fetch(l.startsWith(base) ? l : l, { method: 'GET', redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; blog-qa)' } }); if (x.status >= 400 && ![401, 403, 405, 429, 999].includes(x.status)) dead.push(`${x.status} ${l}`); } catch (e) { dead.push('no answer ' + l); } }
  ok(`links work (${links.size} checked; 401/403/429 from news sites are not counted)`, !dead.length, dead.join(' | '));
  const idx = await (await fetch(`${base}/blog?qa=${Date.now()}`)).text(); ok('blog index lists the post', idx.includes(`/blog/${slug}`));
  console.log('screenshots: ' + dir); if (srv) srv.close();
}

const QALOG = (slug) => path.join(BLOG, 'qa', slug + '.md'), postFile = (slug) => path.join(BLOG, slug + '.json');
function setPublishAt(slug, t) { const f = postFile(slug), raw = fs.readFileSync(f, 'utf8'), p = JSON.parse(raw), ind = /\n( +)"/.exec(raw); p.publishAt = t; fs.writeFileSync(f, JSON.stringify(p, null, ind ? ind[1].length : 2) + (raw.endsWith('\n') ? '\n' : '')); }
function stage(slug) {
  const p = readPost(slug), log = QALOG(slug); fs.mkdirSync(path.dirname(log), { recursive: true });
  if (!fs.existsSync(log) || !/^go-live: /m.test(fs.readFileSync(log, 'utf8'))) fs.appendFileSync(log, `go-live: ${new Date(p.publishAt).toISOString()}\n`);
  setPublishAt(slug, Date.now() - 60000); console.log('stage copy: publishAt set to now; real go-live time kept in ' + path.relative(ROOT, log));
}
function release(slug) {
  const m = /^go-live: (\S+)/m.exec(fs.existsSync(QALOG(slug)) ? fs.readFileSync(QALOG(slug), 'utf8') : ''); if (!m) throw new Error('no go-live line in ' + QALOG(slug));
  setPublishAt(slug, Date.parse(m[1])); console.log('release: publishAt back to ' + m[1]);
}

(async () => {
  if (mode === 'stage' && args[0]) return stage(args[0]); if (mode === 'release' && args[0]) return release(args[0]);
  if (mode === 'content' && args[0]) content(args[0]); else if (mode === 'front' && args[1]) await front(args[0], args[1]);
  else { console.error('usage: qa.js content <slug> | qa.js front <base-url> <slug>'); process.exit(2); }
  const f = out.filter((x) => !x).length; console.log(f ? `RESULT: ${f} FAIL` : 'RESULT: PASS'); process.exit(f ? 1 : 0);
})().catch((e) => { console.error('qa:', e.message); process.exit(1); });
