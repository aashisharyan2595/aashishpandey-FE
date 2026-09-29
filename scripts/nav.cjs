// Writes the shared header into every static page (between <!-- ap-nav:start/end --> markers, or in place of the old sticky nav).
// Run after changing the links below or assets/nav.css:  node scripts/nav.cjs
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const LINKS = [['/portfolio', 'Portfolio'], ['/case-studies', 'Case studies'], ['/services', 'Services'], ['/tools', 'Tools']];
const MORE = [['/', 'The 3D ride'], ['/how-this-site-was-built', 'How this site was built'], ['/assets/Aashish-Pandey-Resume.pdf', 'Résumé (PDF)']];
const SUB = [['#pf-work', 'Work'], ['#pf-projects', 'Projects'], ['#pf-career', 'Career'], ['#pf-toolkit', 'Toolkit'], ['#pf-contact', 'Contact']];
const svc = { current: '/services' }, tool = (crumb) => ({ current: '/tools', crumb }), work = { current: '/case-studies' };
const PAGES = {
  'Case-Studies.dc.html': { current: '/case-studies' }, 'Services.dc.html': svc,
  'Shopify-Developer.dc.html': svc, 'Full-Stack-Developer.dc.html': svc, 'SEO-Consultant.dc.html': svc, 'UI-UX-Design.dc.html': svc, 'Tech-Consultant.dc.html': svc,
  'Tools-v2.dc.html': { current: '/tools' }, 'Tools-Shortener.dc.html': tool('URL Shortener'), 'Tools-Image.dc.html': tool('Image Resizer'),
  'Tools-Lorem.dc.html': tool('Lorem Ipsum'), 'Tools-QR.dc.html': tool('QR Codes'), 'Tools-Checklist.dc.html': tool('Launch Checklist'),
  'Proof-v2.dc.html': { current: '/portfolio', sub: true },
  'Work-Liquid-IV.dc.html': work, 'Work-Talenti.dc.html': work, 'Work-StoryNest.dc.html': work, 'Work-CEAT-Specialty.dc.html': work,
  'How-This-Site-Was-Built.dc.html': {},
};
const a = (h, t, cur) => `<a href="${h}"${cur === h ? ' aria-current="page"' : ''}>${t}</a>`;
function header(o) {
  const crumb = o.crumb ? `<span class="ap-nav__crumb"><a href="/tools">Tools</a> / ${o.crumb}</span>` : '';
  const sub = o.sub ? `<div class="ap-nav__sub"><div class="ap-nav__subin">${SUB.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}</div></div>` : '';
  return `<!-- ap-nav:start -->\n<nav class="ap-nav" aria-label="Main"><div class="ap-nav__in">` +
    `<a class="ap-nav__logo" href="/"><span class="ap-nav__badge">AP</span><span class="ap-nav__name">Aashish Pandey</span></a>${crumb}` +
    `<div class="ap-nav__pill">${LINKS.map(([h, t]) => a(h, t, o.current)).join('')}</div>` +
    `<div class="ap-nav__right"><a class="ap-nav__cta" href="/portfolio#pf-contact"><span class="ap-nav__dot"></span>Hire me</a>` +
    `<details class="ap-nav__menu"><summary>Menu</summary><div class="ap-nav__sheet">${LINKS.map(([h, t]) => a(h, t, o.current)).join('')}<hr>${MORE.map(([h, t]) => a(h, t)).join('')}</div></details></div>` +
    `</div>${sub}</nav>\n<!-- ap-nav:end -->`;
}
const CSS = '<link rel="stylesheet" href="/assets/nav.css?v=1">';
for (const [f, o] of Object.entries(PAGES)) {
  const p = path.join(root, f); let s = fs.readFileSync(p, 'utf8');
  const html = header(o);
  const re = /<!-- ap-nav:start -->[\s\S]*?<!-- ap-nav:end -->|<nav class="ap-nav"[\s\S]*?<\/nav>|<nav style="position:sticky[\s\S]*?<\/nav>/g;
  let n = 0; s = s.replace(re, () => { n++; return html; });
  if (!n) throw new Error(f + ': no header found');
  if (!s.includes('/assets/nav.css')) s = s.replace('<meta name="viewport" content="width=device-width, initial-scale=1">', m => m + '\n' + CSS);
  s = s.replace(/<a href="#pf-contact" aria-label="Hire me" style="position:fixed/g, f.startsWith('Work-') ? '<a class="ap-float" href="/portfolio#pf-contact" aria-label="Hire me" style="position:fixed' : '<a class="ap-float" href="#pf-contact" aria-label="Hire me" style="position:fixed');
  fs.writeFileSync(p, s); console.log(f, n + ' header(s)');
}
