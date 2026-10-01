// Regenerates sitemap.xml. A page's <lastmod> only moves when its content really changes:
// we hash each source file (minus the prerendered #ap-pre block, which is derived) and compare with scripts/lastmod.json.
// Run by hand before committing:  node scripts/sitemap.cjs      (first run: node scripts/sitemap.cjs --init YYYY-MM-DD)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..'), stateFile = path.join(__dirname, 'lastmod.json');
const SITE = 'https://aashishpandey.com';
const P = [
  ['/', 'Portfolio.dc.html', ['/assets/og-image.jpg', '/assets/me-portrait.webp']],
  ['/portfolio', 'Proof-v3.dc.html', ['/assets/me-portrait.webp', '/assets/me-ride.webp']],
  ['/case-studies', 'Case-Studies.dc.html'],
  ['/work-liquid-iv', 'Work-Liquid-IV.dc.html'], ['/work-talenti', 'Work-Talenti.dc.html'],
  ['/work-storynest', 'Work-StoryNest.dc.html'], ['/work-ceat-specialty', 'Work-CEAT-Specialty.dc.html'],
  ['/services', 'Services.dc.html', ['/assets/og/og-services.jpg']],
  ['/shopify-developer', 'Shopify-Developer.dc.html'], ['/full-stack-developer', 'Full-Stack-Developer.dc.html'], ['/wordpress-webflow-developer', 'Wordpress-Webflow-Developer.dc.html', ['/assets/og/og-svc-wordpress-webflow.jpg']],
  ['/seo-consultant', 'SEO-Consultant.dc.html'], ['/ui-ux-design', 'UI-UX-Design.dc.html'], ['/tech-consultant', 'Tech-Consultant.dc.html'],
  ['/tools', 'Tools-v2.dc.html'], ['/tools/pad', 'Tools-Pad-v2.dc.html'], ['/tools/url-shortener', 'Tools-Shortener.dc.html'],
  ['/tools/image-resizer', 'Tools-Image.dc.html'], ['/tools/lorem-ipsum-generator', 'Tools-Lorem.dc.html'], ['/tools/qr-code-generator', 'Tools-QR.dc.html', ['/assets/og/og-tool-qr.jpg']], ['/tools/qr-code-checker', 'Tools-QR-Check.dc.html', ['/assets/og/og-tool-qr-check.jpg']], ['/tools/website-launch-checklist', 'Tools-Checklist.dc.html'],
  ['/tools/exif-remover', 'Tools-Exif.dc.html', ['/assets/og/og-tool-exif.jpg']], ['/tools/file-hash-checker', 'Tools-Hash.dc.html', ['/assets/og/og-tool-hash.jpg']], ['/tools/password-generator', 'Tools-Password.dc.html', ['/assets/og/og-tool-password.jpg']], ['/tools/time-zone-meeting-planner', 'Tools-Timezone.dc.html', ['/assets/og/og-tool-timezone.jpg']],
  ['/how-this-site-was-built', 'How-This-Site-Was-Built.dc.html', ['/assets/build/aashish-pandey-3d-portfolio-bangalore-highway-intro.jpg']],
];
const args = process.argv.slice(2), i = args.indexOf('--init');
const initDate = i >= 0 ? args[i + 1] : null;
const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {};
const today = new Date().toISOString().slice(0, 10);
const hash = f => crypto.createHash('sha1').update(fs.readFileSync(path.join(root, f), 'utf8').replace(/<div id="ap-pre"[\s\S]*?<!-- \/ap-pre -->\n?/, '')).digest('hex');
let changed = [];
for (const [, file] of P) {
  const h = hash(file), s = state[file];
  if (!s) { state[file] = { hash: h, lastmod: initDate || today }; changed.push(file + ' (new)'); }
  else if (s.hash !== h) { state[file] = { hash: h, lastmod: today }; changed.push(file); }
}
fs.writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n');
const urls = P.map(([loc, file, imgs = []]) => `  <url>\n    <loc>${SITE}${loc}</loc>\n    <lastmod>${state[file].lastmod}</lastmod>\n${imgs.map(x => `    <image:image><image:loc>${SITE}${x}</image:loc></image:image>\n`).join('')}  </url>\n`).join('');
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}</urlset>\n`);
console.log(changed.length ? 'lastmod moved for: ' + changed.join(', ') : 'no content changes, dates untouched');
