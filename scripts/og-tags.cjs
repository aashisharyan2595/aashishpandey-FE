#!/usr/bin/env node
/* Writes the share tags (Open Graph + Twitter card) on every page, from scripts/og-cards.json.
 * Each page keeps its own title, description, URL, type and locale; the image, its size and alt text come from the
 * card that lists the page (or the fallback), with ?v= from og-cards.json so LinkedIn and WhatsApp refetch after a redraw.
 *
 *   node scripts/og-tags.cjs           rewrite the tags in place
 *   node scripts/og-tags.cjs --check   exit 1 if any page is out of date (run by check-site.cjs)
 *
 * Pages made by sop-pages.cjs get the same block from block() below. */
const fs = require('fs'), path = require('path');
const pages = require('./pages.cjs');
const cfg = require('./og-cards.json');

const KEYS = ['og:type', 'og:site_name', 'og:locale', 'og:title', 'og:description', 'og:url', 'og:image', 'og:image:width',
  'og:image:height', 'og:image:type', 'og:image:alt', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt'];
const attr = (s) => String(s).replace(/&(?![a-z]+;|#\d+;)/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const tools = cfg.cards.filter((c) => c.kind === 'tool').length;

const byPage = {};
for (const c of cfg.cards) for (const p of c.pages) {
  if (byPage[p]) throw new Error(`og-cards.json: ${p} is listed under ${byPage[p].id} and ${c.id}`);
  byPage[p] = c;
}

// The share image for a page file name: { url, alt }.
function image(name) {
  const c = byPage[name];
  if (!c) return { url: cfg.origin + cfg.fallback.image + '?v=' + cfg.v, alt: cfg.fallback.alt };
  return { url: `${cfg.origin}/assets/og/og-${c.id}.jpg?v=${cfg.v}`, alt: `${c.title.replace('{N}', tools)}: ${c.sub.replace(/\.$/, '')}` };
}

// o: { type, locale, title, desc, url, name } with title/desc already HTML-escaped.
function block(o) {
  const img = image(o.name);
  const v = { 'og:type': o.type || 'website', 'og:site_name': 'Aashish Pandey', 'og:locale': o.locale || 'en_IN', 'og:title': o.title,
    'og:description': o.desc, 'og:url': o.url, 'og:image': img.url, 'og:image:width': '1200', 'og:image:height': '630',
    'og:image:type': 'image/jpeg', 'og:image:alt': attr(img.alt), 'twitter:card': 'summary_large_image', 'twitter:title': o.twTitle || o.title,
    'twitter:description': o.twDesc || o.desc, 'twitter:image': img.url, 'twitter:image:alt': attr(img.alt) };
  return KEYS.map((k) => `<meta ${k.startsWith('og:') ? 'property' : 'name'}="${k}" content="${v[k]}">`).join('\n');
}

const tagRe = (k) => new RegExp(`<meta (?:property|name)="${k.replace(/[.:]/g, '\\$&')}" content="([^"]*)">\\n?`, 'g');
const get = (h, k) => { const m = tagRe(k).exec(h); return m ? m[1] : ''; };

function rewrite(name, h) {
  const one = (re) => (re.exec(h) || [])[1] || '';
  const o = {
    name, type: get(h, 'og:type'), locale: get(h, 'og:locale'),
    title: get(h, 'og:title') || one(/<title>([^<]*)<\/title>/),
    desc: get(h, 'og:description') || one(/<meta name="description" content="([^"]*)">/),
    url: get(h, 'og:url') || one(/<link rel="canonical" href="([^"]*)">/),
    twTitle: get(h, 'twitter:title'), twDesc: get(h, 'twitter:description'),
  };
  if (!o.title || !o.desc || !o.url) return { h, missing: ['title', 'desc', 'url'].filter((k) => !o[k]) };
  let at = -1;
  for (const k of KEYS) { const m = tagRe(k).exec(h); if (m && (at < 0 || m.index < at)) at = m.index; }
  let out = h;
  if (at < 0) at = out.indexOf('</head>');
  const head = out.slice(0, at), rest = out.slice(at);
  let stripped = rest;
  for (const k of KEYS) stripped = stripped.replace(tagRe(k), '');
  const glue = head.endsWith('\n') || head.endsWith('>') ? '' : '\n';
  out = head + glue + block(o) + (stripped.startsWith('\n') ? '' : '\n') + stripped;
  return { h: out };
}

if (require.main === module) {
  const check = process.argv.includes('--check');
  const bad = [];
  const known = new Set(pages.list().map((p) => p.name));
  for (const p of Object.keys(byPage)) if (!known.has(p)) bad.push(`og-cards.json lists ${p}, which is not a page`);
  for (const p of pages.list()) {
    const h = fs.readFileSync(p.abs, 'utf8');
    if (!/<meta property="og:/.test(h) && !/<link rel="canonical"/.test(h)) continue; // not a public page
    const r = rewrite(p.name, h);
    if (r.missing) { bad.push(`${p.rel}: no ${r.missing.join(', ')} to build share tags from`); continue; }
    if (r.h === h) continue;
    if (check) bad.push(`${p.rel}: share tags out of date; run node scripts/og-tags.cjs`);
    else { fs.writeFileSync(p.abs, r.h); console.log('updated', p.rel); }
  }
  for (const c of cfg.cards) if (!fs.existsSync(path.join(pages.ROOT, 'assets/og', `og-${c.id}.jpg`))) bad.push(`assets/og/og-${c.id}.jpg is missing; run node scripts/make-og.cjs ${c.id}`);
  if (bad.length) { console.log(bad.join('\n')); process.exit(1); }
  if (check) console.log('og-tags: all share tags current');
}

module.exports = { block, image };
