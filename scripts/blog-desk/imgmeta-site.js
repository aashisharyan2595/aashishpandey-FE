// Rewrites owner + SEO metadata in every site image, in place (same file names, same pixels): node scripts/blog-desk/imgmeta-site.js [--dry]
// Blog images take their title, alt, caption and keywords from their post (content/blog/<slug>.json); other images from the page that shows them
// (its <title>, description, keywords and the <img alt>). Third-party images keep their real creator and credit. No AI or software fields (see imgmeta.js).
// Skipped: assets/vendor (libraries), assets/brands (other companies' logos), gifpacks (Noto emoji, Google's).
const fs = require('fs'), path = require('path'), { embedAny } = require('./imgmeta.js');
const ROOT = path.join(__dirname, '..', '..'), SITE = 'https://aashishpandey.com', dry = process.argv.includes('--dry');
const IMG = /\.(jpe?g|png|webp|svg)$/i, SKIP = /^assets\/(vendor|brands)\//;
const walk = (d) => fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(d + '/' + e.name) : [d + '/' + e.name]));
const unesc = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const kw = (...a) => [...a.flat().filter(Boolean), 'Aashish Pandey'];

// pages: who shows which asset, with what alt
const pages = walk('pages').filter((f) => f.endsWith('.html')).map((f) => {
  const h = fs.readFileSync(path.join(ROOT, f), 'utf8'), g = (re) => unesc((h.match(re) || [])[1] || '');
  return { h, url: g(/<link rel="canonical" href="([^"]+)"/) || SITE, title: g(/<title>([^<]+)<\/title>/).replace(/\s*[·|]\s*Aashish Pandey\s*$/, ''), desc: g(/<meta name="description" content="([^"]*)"/),
    keys: g(/<meta name="keywords" content="([^"]*)"/).split(',').map((x) => x.trim()).filter(Boolean), ogAlt: g(/<meta property="og:image:alt" content="([^"]*)"/) };
});
// images shared across the whole site (icons, logo, menu promos, background art): described once here
const SHARED = {
  'assets/favicon.svg': ['Aashish Pandey logo', 'Aashish Pandey logo mark, an A in cream and amber'], 'assets/favicon-32.png': ['Aashish Pandey logo', 'Aashish Pandey logo mark, an A in cream and amber'],
  'assets/apple-touch-icon.png': ['Aashish Pandey logo', 'Aashish Pandey logo mark, an A in cream and amber'], 'assets/icon-192.png': ['Aashish Pandey logo', 'Aashish Pandey logo mark, an A in cream and amber'],
  'assets/icon-512.png': ['Aashish Pandey logo', 'Aashish Pandey logo mark, an A in cream and amber'], 'assets/badge-96.png': ['Aashish Pandey notification badge', 'Aashish Pandey logo mark used as a notification badge'],
  'assets/logo-mark.svg': ['Aashish Pandey logo', 'Aashish Pandey logo mark, an A in cream and amber'],
  'assets/me-portrait.webp': ['Aashish Pandey, project manager in Bangalore', 'Portrait of Aashish Pandey, project manager and developer in Bangalore'],
  'assets/me-ride.webp': ['Aashish Pandey on his Honda H\'ness 350', 'Aashish Pandey riding his Honda H\'ness 350'],
  'assets/nav/promo-services.webp': ['Services by Aashish Pandey', 'Menu artwork for the services of Aashish Pandey: development, SEO and project delivery'],
  'assets/nav/promo-tools.webp': ['Free browser tools by Aashish Pandey', 'Menu artwork for the free browser tools on aashishpandey.com'],
  'assets/nav/promo-work.webp': ['Case studies by Aashish Pandey', 'Menu artwork for the project case studies of Aashish Pandey'],
  'assets/nr/horizon.svg': ['Night Ride horizon', 'Night-time horizon artwork used across aashishpandey.com'],
};
const SITE_DESC = 'Aashish Pandey, project manager and developer in Bangalore: case studies, services, free browser tools and a blog.';
function fromPages(rel) {
  if (SHARED[rel]) return { title: SHARED[rel][0], alt: SHARED[rel][1], description: SITE_DESC, keywords: kw('Aashish Pandey logo', 'project manager Bangalore'), url: SITE };
  const name = path.basename(rel), uses = pages.filter((p) => p.h.includes(name));
  const human = name.replace(/\.[a-z]+$/i, '').replace(/-/g, ' '), cap = human.charAt(0).toUpperCase() + human.slice(1);
  if (rel.startsWith('assets/legal/')) { const p = uses.find((u) => /\/(privacy|terms|cookies|image-licen[cs]e)/.test(u.url) && u.h.includes(name)) || uses[0];
    if (p) return { title: p.title + ' · Aashish Pandey', alt: `Banner for the ${p.title} page on aashishpandey.com`, description: p.desc, keywords: kw(p.keys, p.title), url: p.url }; }
  const tool = rel.startsWith('assets/tool-art/') ? `${cap} · free online tool by Aashish Pandey` : '';
  for (const p of uses) for (const tag of p.h.match(/<img\b[^>]*>/g) || []) {
    if (!tag.includes(name)) continue; const a = (tag.match(/\balt="([^"]*)"/) || [])[1];
    if (a) return { title: tool || p.title, alt: unesc(a), description: p.desc, keywords: kw(p.keys, tool ? human : []), url: tool ? `${SITE}/tools/${name.replace(/\.svg$/, '')}` : p.url };
  }
  const p = uses.find((u) => u.h.includes(`og:image" content="${SITE}/${rel}`)) || uses[0];
  if (p) return { title: p.title, alt: p.ogAlt || p.title, description: p.desc, keywords: kw(p.keys), url: p.url };
  const t = name.replace(/\.[a-z]+$/i, '').replace(/[-_]+/g, ' ').replace(/^og /, '');
  return { title: t.charAt(0).toUpperCase() + t.slice(1) + ' · Aashish Pandey', alt: t, description: SITE_DESC, keywords: kw(t.split(' ').slice(0, 6)), url: SITE };
}

// blog posts
const posts = fs.readdirSync(path.join(ROOT, 'content/blog')).filter((n) => /^[a-z0-9-]+\.json$/.test(n) && !['calendar.json', 'state.json', 'learn.json', 'experiments.json'].includes(n))
  .map((n) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'content/blog', n), 'utf8')); } catch (e) { return null; } }).filter((p) => p && p.slug).sort((a, b) => b.slug.length - a.slug.length);
function fromPost(rel) {
  const name = path.basename(rel), p = posts.find((x) => name.startsWith(x.slug + '-')); if (!p) return null;
  const seo = p.seo || {}, x = p.extra || {}, th = x.thumb || {}, url = `${SITE}/blog/${p.slug}`, title = seo.title || p.title, keywords = kw(p.tags || [], x.about || []), description = seo.description || p.excerpt;
  const role = name.slice(p.slug.length + 1).replace(/\.[a-z]+$/, ''), base = { title, description, keywords, url };
  const imgs = [...(p.body || '').matchAll(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g)], hd = '/' + rel.replace(/\.jpg$/, '-hd.jpg');
  const inBody = imgs.find((m) => m[2] === '/' + rel) || imgs.find((m) => m[2] === hd);   // an older copy describes the same picture as its -hd file
  const hook = String(th.text || '').replace(/\|/g, ' ').trim(), sub = th.sub && th.sub !== title && th.sub !== p.title ? th.sub : '';
  const oldCoverAlt = [`${title}: ${hook}`.replace(/:\s*$/, ''), sub].filter(Boolean).join(/[.?!]$/.test(hook) ? ' ' : '. ').replace(/\s+/g, ' ').trim();
  if (/^shot-/.test(role)) return { ...base, title: `${title}: ${role.slice(5).replace(/-/g, ' ')}`, alt: inBody ? inBody[1] : title, description: inBody && inBody[3] || description, creator: 'Rockstar Games / Take-Two Interactive', rights: '© Rockstar Games / Take-Two Interactive. Official media, used with credit.' };
  if (role === 'photo' && x.photo) return { ...base, title: `${title}: photo`, alt: (x.photo && x.photo.alt) || (inBody && inBody[1]) || title, description: x.photo.credit || description, creator: x.photo.artist || 'Unknown', rights: `${x.photo.credit || ''} (${x.photo.license || ''} ${x.photo.licenseUrl || ''})`.trim() };
  if (inBody) return { ...base, title: `${title}: ${role.replace(/^art-/, '').replace(/-hd$/, '').replace(/-/g, ' ')}`, alt: inBody[1], description: inBody[3] || description };
  if (/^cover-(v2|hd)$/.test(role)) return { ...base, alt: (p.cover && p.cover.alt) || title };
  if (role === 'cover') return { ...base, alt: oldCoverAlt };
  if (role === 'thumb') return { ...base, alt: oldCoverAlt + ' (video thumbnail)' };
  if (role === 'proscons') return { ...base, title: `${title}: pros and cons`, alt: `Pros and cons of ${x.product || p.title.replace(/ review.*$/i, '')} at a glance` };
  return { ...base, title: `${title}: ${role.replace(/-/g, ' ')}`, alt: title };   // an image not used in the post (older art kept for its URL)
}

let n = 0, skipped = 0;
for (const rel of walk('assets').filter((f) => IMG.test(f))) {
  if (SKIP.test(rel)) { skipped++; continue; }
  const m = (rel.startsWith('assets/blog/') && fromPost(rel)) || fromPages(rel);
  const file = path.join(ROOT, rel), buf = fs.readFileSync(file), out = embedAny(buf, path.extname(rel), m);
  if (dry) console.log(rel, '|', m.title, '|', m.alt); else if (!out.equals(buf)) { fs.writeFileSync(file, out); n++; }
}
console.log(dry ? 'dry run' : `metadata written: ${n} files`, `| skipped (vendor, other brands' logos): ${skipped}`);
