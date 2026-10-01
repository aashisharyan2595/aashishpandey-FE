// Regenerates sitemap.xml (an index) and the per-type sitemaps sitemap-pages/case-studies/services/tools.xml. A page's <lastmod> only moves when its content really changes:
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
  ['/seo-consultant', 'SEO-Consultant.dc.html'], ['/freelance-project-manager', 'Freelance-Project-Manager.dc.html'], ['/image-license', 'Image-License.dc.html'], ['/terms', 'Legal-Terms.dc.html'], ['/privacy', 'Legal-Privacy.dc.html'], ['/cookies', 'Legal-Cookies.dc.html'], ['/ui-ux-design', 'UI-UX-Design.dc.html'], ['/tech-consultant', 'Tech-Consultant.dc.html'],
  ['/tools', 'Tools-v3.dc.html'], ['/tools/pad', 'Tools-Pad-v2.dc.html'], ['/tools/url-shortener', 'Tools-Shortener.dc.html'],
  ['/tools/image-resizer', 'Tools-Image.dc.html'], ['/tools/lorem-ipsum-generator', 'Tools-Lorem.dc.html'], ['/tools/qr-code-generator', 'Tools-QR.dc.html', ['/assets/og/og-tool-qr.jpg']], ['/tools/qr-code-checker', 'Tools-QR-Check.dc.html', ['/assets/og/og-tool-qr-check.jpg']], ['/tools/website-launch-checklist', 'Tools-Checklist.dc.html'],
  ['/tools/exif-remover', 'Tools-Exif.dc.html', ['/assets/og/og-tool-exif.jpg']], ['/tools/file-hash-checker', 'Tools-Hash.dc.html', ['/assets/og/og-tool-hash.jpg']], ['/tools/password-generator', 'Tools-Password.dc.html', ['/assets/og/og-tool-password.jpg']], ['/tools/time-zone-meeting-planner', 'Tools-Timezone.dc.html', ['/assets/og/og-tool-timezone.jpg']], ['/tools/project-estimate-calculator', 'Tools-Estimate.dc.html', ['/assets/og/og-tool-estimate.jpg']], ['/tools/invoice-generator', 'Tools-Invoice.dc.html', ['/assets/og/og-tool-invoice.jpg']], ['/tools/resume-maker', 'Tools-Resume.dc.html', ['/assets/og/og-tool-resume.jpg']], ['/tools/resume-maker/templates', 'Tools-Resume-Templates.dc.html'], ['/tools/resume-maker/examples', 'Tools-Resume-Examples.dc.html'], ['/tools/resume-maker/guide', 'Tools-Resume-Guide.dc.html'], ['/tools/resume-maker/examples/software-engineer', 'Tools-Resume-Ex-SoftwareEngineer.dc.html'], ['/tools/resume-maker/examples/ux-ui-designer', 'Tools-Resume-Ex-UxUiDesigner.dc.html'], ['/tools/resume-maker/examples/project-manager', 'Tools-Resume-Ex-ProjectManager.dc.html'], ['/tools/resume-maker/examples/data-analyst', 'Tools-Resume-Ex-DataAnalyst.dc.html'], ['/tools/resume-maker/examples/marketing-manager', 'Tools-Resume-Ex-MarketingManager.dc.html'], ['/tools/resume-maker/examples/sales-manager', 'Tools-Resume-Ex-SalesManager.dc.html'], ['/tools/resume-maker/examples/mechanical-engineer', 'Tools-Resume-Ex-MechanicalEngineer.dc.html'], ['/tools/resume-maker/examples/graduate', 'Tools-Resume-Ex-Graduate.dc.html'],
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
// One sitemap per kind of page, tied together by an index at /sitemap.xml (the only one robots.txt names).
const GROUPS = [
  ['sitemap-pages.xml', loc => loc === '/' || loc === '/portfolio' || loc === '/how-this-site-was-built' || ['/image-license', '/terms', '/privacy', '/cookies'].includes(loc)],
  ['sitemap-case-studies.xml', loc => loc === '/case-studies' || loc.startsWith('/work-')],
  ['sitemap-services.xml', loc => loc === '/services' || ['/shopify-developer', '/full-stack-developer', '/wordpress-webflow-developer', '/seo-consultant', '/freelance-project-manager', '/ui-ux-design', '/tech-consultant'].includes(loc)],
  ['sitemap-resume.xml', loc => loc.startsWith('/tools/resume-maker')],
  ['sitemap-tools.xml', loc => loc === '/tools' || (loc.startsWith('/tools/') && !loc.startsWith('/tools/resume-maker'))],
];
const entry = ([loc, file, imgs = []]) => `  <url>\n    <loc>${SITE}${loc}</loc>\n    <lastmod>${state[file].lastmod}</lastmod>\n${imgs.map(x => `    <image:image><image:loc>${SITE}${x}</image:loc></image:image>\n`).join('')}  </url>\n`;
const used = new Set(), index = [];
for (const [name, test] of GROUPS) {
  const rows = P.filter(r => test(r[0]));
  rows.forEach(r => used.add(r[0]));
  fs.writeFileSync(path.join(root, name), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${rows.map(entry).join('')}</urlset>\n`);
  index.push(`  <sitemap>\n    <loc>${SITE}/${name}</loc>\n    <lastmod>${rows.map(r => state[r[1]].lastmod).sort().pop()}</lastmod>\n  </sitemap>\n`);
  console.log(name, rows.length + ' urls');
}
const missed = P.filter(r => !used.has(r[0])).map(r => r[0]);
if (missed.length) throw new Error('not in any sitemap group: ' + missed.join(', '));
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${index.join('')}</sitemapindex>\n`);
console.log(changed.length ? 'lastmod moved for: ' + changed.join(', ') : 'no content changes, dates untouched');
