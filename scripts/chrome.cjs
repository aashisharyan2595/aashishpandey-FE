#!/usr/bin/env node
/*
 * Site header and footer, written once.
 *
 * Every page that shows the site chrome carries a marked region:
 *     <!-- ap-nav:start --> ... <!-- ap-nav:end -->
 *     <!-- ap-foot:start --> ... <!-- ap-foot:end -->
 * This script rebuilds those regions from the data below, so a menu item, a
 * description or a link is edited here and nowhere else. Run it after any change:
 *     node scripts/chrome.cjs            write every page
 *     node scripts/chrome.cjs --check    exit 1 if a page is out of date
 * It also runs first in the Vercel build (vercel.json), so production never drifts
 * from this file even if someone forgets to run it before committing.
 * Active state (current page and its menu) comes from the vercel.json rewrites.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const ICONS = JSON.parse(fs.readFileSync(path.join(__dirname, 'chrome-icons.json'), 'utf8'));
const CHECK = process.argv.includes('--check');
const YEAR = 2026;
const NAV_CSS = 12; // bump when assets/nav.css changes: assets are cached for 30 days

const BOOK = 'https://bookings.cloud.microsoft/bookwithme/user/21d85864cd9e44ad8e0b02c8924d50a0@aashishpandey.com/meetingtype/GSQs53Xp5k-9OwIn67Xxow2?anonymous&ismsaljsauthenabled&ep=mlink';
const WA = 'https://wa.me/917558415031';
const LI = 'https://www.linkedin.com/in/aashish-kumar-pandey';
const CV = '/assets/Aashish-Pandey-Resume.pdf';
const MAIL = 'mailto:hello@aashishpandey.com';

/* ---------- the menus ---------- */
// item: href, t (title), d (description), ic (icon key), f (footer label, defaults to t), b (badge), x (external), dl (download)
const MENUS = {
  work: {
    label: 'Work',
    note: '50+ sites and platforms since 2018',
    cta: { href: '/case-studies', label: 'All case studies' },
    cols: [
      [{ h: 'Start here', items: [
        { href: '/portfolio', t: 'Portfolio', d: 'Client sites, products and career', ic: 'portfolio' },
        { href: '/case-studies', t: 'Case studies', d: 'Four programs, with the numbers', ic: 'case' },
      ] }],
      [{ h: 'Programs', items: [
        { href: '/work-liquid-iv', t: 'Liquid I.V.', d: 'Shopify rollout across 15 markets', ic: 'store' },
        { href: '/work-talenti', t: 'Talenti', d: 'Canada site in 20 days', ic: 'store' },
        { href: '/work-storynest', t: 'StoryNest', d: '100K to 400K users', ic: 'chart' },
        { href: '/work-ceat-specialty', t: 'CEAT Specialty', d: 'AEM handover, zero downtime', ic: 'layout' },
      ] }],
    ],
  },
  services: {
    label: 'Services',
    note: 'Open to freelance and contract work',
    cta: { href: '/services', label: 'All services' },
    cols: [
      [{ h: 'Overview', items: [{ href: '/services', t: 'All services', d: 'How I can help', ic: 'grid' }] },
       { h: 'Advise', items: [{ href: '/tech-consultant', t: 'Tech consultant', d: 'Architecture and delivery', ic: 'compass' }] }],
      [{ h: 'Build', items: [
        { href: '/shopify-developer', t: 'Shopify developer', d: 'Stores, themes, multi-market', ic: 'store' },
        { href: '/full-stack-developer', t: 'Full-stack developer', d: 'Custom builds end to end', ic: 'code' },
        { href: '/wordpress-webflow-developer', t: 'WordPress & Webflow', d: 'CMS sites that are easy to run', ic: 'layout' },
      ] }],
      [{ h: 'Grow and design', items: [
        { href: '/seo-consultant', t: 'SEO consultant', d: 'Technical SEO and GEO', ic: 'search' },
        { href: '/ui-ux-design', t: 'UI and UX design', d: 'Interfaces and prototypes', ic: 'pen' },
      ] }],
    ],
  },
  tools: {
    label: 'Tools',
    note: 'Free · no sign-up · runs in your browser',
    cta: { href: '/tools', label: null /* "All N tools" */ },
    cols: [
      [{ h: 'Documents', items: [
        { href: '/tools/resume-maker', t: 'Resume Maker', d: 'ATS templates, PDF and Word', b: 'Popular' },
        { href: '/tools/invoice-generator', t: 'Invoice Generator', d: 'Tax, discount and your logo' },
        { href: '/tools/project-estimate-calculator', t: 'Project Estimate', d: 'Best, likely and worst case', f: 'Project Estimate Calculator' },
      ] }, { h: 'Images', items: [
        { href: '/tools/image-resizer', t: 'Image Resizer', d: 'WebP, AVIF, JPEG and PNG' },
        { href: '/tools/exif-remover', t: 'Photo Metadata Remover', d: 'Strip GPS and camera data' },
      ] }],
      [{ h: 'QR codes & links', items: [
        { href: '/tools/qr-code-generator', t: 'QR Code Generator', d: 'Static codes that never expire', b: 'Popular' },
        { href: '/tools/qr-code-checker', t: 'QR Code Checker', d: 'See if a code is dynamic', f: 'QR Code Autopsy' },
        { href: '/tools/url-shortener', t: 'URL Shortener', d: 'Short link with its own QR' },
      ] }, { h: 'Security', items: [
        { href: '/tools/password-generator', t: 'Password Generator', d: 'Made on your device' },
        { href: '/tools/file-hash-checker', t: 'File Hash Checker', d: 'MD5, SHA-1, SHA-256' },
      ] }],
      [{ h: 'Writing & planning', items: [
        { href: '/tools/pad', t: 'Online Notepad', d: 'Markdown, autosave, share' },
        { href: '/tools/lorem-ipsum-generator', t: 'Lorem Ipsum', d: 'Text, HTML or Markdown', f: 'Lorem Ipsum Generator' },
        { href: '/tools/time-zone-meeting-planner', t: 'Time Zone Planner', d: 'Convert a time across cities', f: 'Time Zone Planner' },
        { href: '/tools/website-launch-checklist', t: 'Launch Checklist', d: 'Go-live templates' },
      ] }],
    ],
  },
  more: {
    label: 'More',
    note: 'I reply within 48 hours',
    cta: { href: BOOK, label: 'Book a call', x: true },
    // the first thing in this menu: a large button for the ride
    feat: { href: '/', t: 'Ride the 3D site', d: 'Scroll a motorcycle through my career, then take it off-road.', ic: 'bike', cta: 'Start the ride', b: 'Interactive' },
    cols: [
      [{ h: 'Explore', items: [
        { href: '/how-this-site-was-built', t: 'How this site was built', d: 'The build guide, step by step', ic: 'wrench' },
      ] }, { h: 'About me', items: [
        { href: CV, t: 'Résumé (PDF)', d: 'One page, up to date', ic: 'file', dl: true },
        { href: LI, t: 'LinkedIn', d: 'Experience and recommendations', ic: 'in', x: true },
      ] }],
      [{ h: 'Get in touch', items: [
        { href: BOOK, t: 'Book a 20-min call', d: 'Pick a slot that suits you', ic: 'cal', x: true },
        { href: MAIL + '?subject=Freelance%20brief', t: 'Send a brief', d: 'Freelance project inquiry', ic: 'send', f: 'Send a brief' },
        { href: WA, t: 'WhatsApp', d: 'Quick chat', ic: 'chat', x: true },
        { href: MAIL, t: 'Email', d: 'hello@aashishpandey.com', ic: 'mail' },
      ] }],
    ],
  },
};
const ORDER = ['work', 'services', 'tools', 'more'];
const HIRE = [
  { href: BOOK, t: 'Book a 20-min call', d: 'Pick a slot that suits you', x: true },
  { href: MAIL, t: 'Email', d: 'hello@aashishpandey.com' },
  { href: MAIL + '?subject=Freelance%20brief', t: 'Send a brief', d: 'Freelance project inquiry' },
  { href: WA, t: 'WhatsApp', d: 'Quick chat', x: true },
  { href: CV, t: 'Résumé (PDF)', d: 'One page, up to date', dl: true },
];
const FOOT = {
  tagline: 'Project Manager and Creative Technologist in Bangalore. 50+ sites and platforms shipped since 2018.',
  status: 'Open to PM roles & freelance',
  soc: [
    { href: MAIL, label: 'Email Aashish', ic: 'mail' },
    { href: BOOK, label: 'Book a 20-minute call', ic: 'cal', x: true },
    { href: LI, label: 'LinkedIn', ic: 'in', x: true },
    { href: WA, label: 'WhatsApp', ic: 'chat', x: true },
  ],
  work: [['/case-studies', 'Case studies'], ['/work-liquid-iv', 'Liquid I.V.'], ['/work-talenti', 'Talenti'], ['/work-storynest', 'StoryNest'], ['/work-ceat-specialty', 'CEAT Specialty'], ['/portfolio', 'Portfolio']],
  more: [['/', 'The 3D ride'], ['/how-this-site-was-built', 'How this site was built'], [CV, 'Résumé (PDF)'], ['/portfolio#pf-contact', 'Send a brief']],
};

/* ---------- helpers ---------- */
const e = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ext = (it) => (it.x ? ' target="_blank" rel="noopener"' : '') + (it.dl ? ' download' : '');
const svg = (inner, sz = 16, sw = 2) => `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const icon = (it) => svg(ICONS.tools[it.href] || ICONS.extra[it.ic] || ICONS.extra.grid);
const ARROW = svg('<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>', 14);
const CARET = '<svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="ap-dd__caret"><path d="m6 9 6 6 6-6"></path></svg>';
const CHEV = '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="ap-ms__chev"><path d="m6 9 6 6 6-6"></path></svg>';
const toolCount = MENUS.tools.cols.flat().reduce((n, g) => n + g.items.length, 0);
const flat = (m) => m.cols.flat().flatMap((g) => g.items);

/* ---------- header ---------- */
function megaItem(it) {
  return `<a class="ap-mega__it" role="menuitem" href="${e(it.href)}"${ext(it)}><span class="ap-mega__ic">${icon(it)}</span><span class="ap-mega__tx"><span class="ap-mega__t">${e(it.t)}${it.b ? `<span class="ap-mega__b">${e(it.b)}</span>` : ''}</span><span class="ap-mega__d">${e(it.d)}</span></span></a>`;
}
function mega(key) {
  const m = MENUS[key], n = m.cols.length;
  const cols = m.cols.map((col) => `<div class="ap-mega__col">${col.map((g) => `<div class="ap-mega__g"><p class="ap-mega__h">${e(g.h)}</p>${g.items.map(megaItem).join('')}</div>`).join('')}</div>`).join('');
  const cta = m.cta.label === null ? `All ${toolCount} tools` : m.cta.label;
  const feat = m.feat ? `<a class="ap-mega__feat" role="menuitem" href="${e(m.feat.href)}"><span class="ap-mega__fic">${icon(m.feat)}</span><span class="ap-mega__ftx"><span class="ap-mega__ft">${e(m.feat.t)}<span class="ap-mega__b">${e(m.feat.b)}</span></span><span class="ap-mega__fd">${e(m.feat.d)}</span></span><span class="ap-mega__fgo">${e(m.feat.cta)}${ARROW}</span></a>` : '';
  return `<div class="ap-dd ap-dd--mega"><button type="button" class="ap-dd__btn" aria-haspopup="true">${e(m.label)}${CARET}</button><div class="ap-mega ap-mega--${n}" role="menu">${feat}<div class="ap-mega__cols ap-mega__cols--${n}">${cols}</div><div class="ap-mega__foot"><span class="ap-mega__note"><span class="ap-mega__dot"></span>${e(m.note)}</span><a class="ap-mega__all" role="menuitem" href="${e(m.cta.href)}"${ext(m.cta)}>${e(cta)}${ARROW}</a></div></div></div>`;
}
function sheetGroup(key) {
  const m = MENUS[key];
  if (key === 'tools') {
    const tiles = flat(m).map((it) => `<a class="ap-ms__tile" href="${e(it.href)}"><span class="ap-mega__ic">${icon(it)}</span><span>${e(it.t)}</span></a>`).join('');
    return `<details class="ap-ms__grp"><summary>Tools<span class="ap-ms__count">${toolCount}</span>${CHEV}</summary><div class="ap-ms__body"><a class="ap-ms__all" href="/tools">All tools<span>Free, no sign-up</span></a><div class="ap-ms__tiles">${tiles}</div></div></details>`;
  }
  const feat = m.feat ? `<a class="ap-ms__feat" href="${e(m.feat.href)}"><span class="ap-mega__ic">${icon(m.feat)}</span><span class="ap-ms__ftx"><span class="ap-ms__rt">${e(m.feat.t)}</span><span class="ap-ms__rd">${e(m.feat.d)}</span></span>${ARROW}</a>` : '';
  const rows = feat + flat(m).map((it) => `<a class="ap-ms__row" href="${e(it.href)}"${ext(it)}><span class="ap-ms__rt">${e(it.t)}</span><span class="ap-ms__rd">${e(it.d)}</span></a>`).join('');
  return `<details class="ap-ms__grp"><summary>${e(m.label)}${CHEV}</summary><div class="ap-ms__body">${rows}</div></details>`;
}
function header() {
  const hire = `<div class="ap-dd ap-dd--cta"><button type="button" class="ap-dd__btn" aria-haspopup="true"><span class="ap-nav__dot"></span>Hire me${CARET}</button><div class="ap-dd__panel ap-dd__panel--right" role="menu">${HIRE.map((it) => `<a class="ap-dd__item" role="menuitem" href="${e(it.href)}"${ext(it)}><span class="ap-dd__t">${e(it.t)}</span><span class="ap-dd__d">${e(it.d)}</span></a>`).join('')}</div></div>`;
  const sheet = `<details class="ap-nav__menu ap-ms"><summary aria-label="Open menu"><span class="ap-ms__burger" aria-hidden="true"><span></span><span></span></span><span class="ap-ms__lbl">Menu</span></summary><div class="ap-ms__sheet">`
    + `<div class="ap-ms__ctas"><a class="ap-ms__cta ap-ms__cta--pri" href="${e(BOOK)}" target="_blank" rel="noopener"><span class="ap-nav__dot"></span>Book a 20-min call</a><a class="ap-ms__cta" href="${e(WA)}" target="_blank" rel="noopener">WhatsApp</a></div>`
    + `<a class="ap-ms__top" href="/portfolio">Portfolio${ARROW}</a>` + ORDER.map(sheetGroup).join('') + '</div></details>';
  return `<nav class="ap-nav" aria-label="Main"><div class="ap-nav__in"><a class="ap-nav__logo" href="/"><span class="ap-nav__badge" aria-hidden="true"></span><span class="ap-nav__name">Aashish Pandey</span></a><div class="ap-nav__pill"><a href="/portfolio">Portfolio</a>${ORDER.map(mega).join('')}</div><div class="ap-nav__right">${hire}${sheet}</div></div></nav>`;
}

/* ---------- footer ---------- */
function footer() {
  const link = ([h, t, x]) => `<a href="${e(h)}"${x ? ' target="_blank" rel="noopener"' : ''}>${e(t)}</a>`;
  const col = (h, items) => `<div class="ap-foot__col"><p class="ap-foot__h">${h}</p>${items.map(link).join('')}</div>`;
  const svc = [['/services', 'All services'], ...flat(MENUS.services).filter((i) => i.href !== '/services').sort((a, b) => ['/shopify-developer', '/full-stack-developer', '/wordpress-webflow-developer', '/seo-consultant', '/ui-ux-design', '/tech-consultant'].indexOf(a.href) - ['/shopify-developer', '/full-stack-developer', '/wordpress-webflow-developer', '/seo-consultant', '/ui-ux-design', '/tech-consultant'].indexOf(b.href)).map((i) => [i.href, i.f || i.t])];
  const tools = flat(MENUS.tools);
  const soc = FOOT.soc.map((s) => `<a href="${e(s.href)}"${ext(s)} aria-label="${e(s.label)}">${svg(ICONS.extra[s.ic], 18, 1.8)}</a>`).join('');
  return `<footer class="ap-foot" aria-label="Site footer"><div class="ap-foot__in"><div class="ap-foot__top"><div class="ap-foot__brand"><a class="ap-nav__logo" href="/"><span class="ap-nav__badge" aria-hidden="true"></span><span class="ap-nav__name">Aashish Pandey</span></a><p>${e(FOOT.tagline)}</p><a class="ap-foot__status" href="/portfolio#pf-contact"><span class="ap-nav__dot"></span>${e(FOOT.status)}</a><div class="ap-foot__soc">${soc}</div></div>`
    + `<nav class="ap-foot__cols" aria-label="Footer">${col('Work', FOOT.work)}${col('Services', svc)}<div class="ap-foot__col ap-foot__col--2"><p class="ap-foot__h">Free tools</p><div class="ap-foot__list"><a href="/tools">All ${toolCount} tools</a>${tools.map((t) => `<a href="${e(t.href)}">${e(t.f || t.t)}</a>`).join('')}</div></div>${col('More', FOOT.more)}</nav></div>`
    + `<div class="ap-foot__base"><span>© ${YEAR} Aashish Pandey · Bangalore, India</span><span class="ap-foot__note">Tools run in your browser</span><a href="#" class="ap-foot__up">Back to top <span aria-hidden="true">↑</span></a></div></div></footer>`;
}

/* ---------- active state ---------- */
const rewrites = {};
for (const r of JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')).rewrites || []) {
  if (r.destination.endsWith('.dc.html')) rewrites[r.destination.replace(/^\//, '')] = rewrites[r.destination.replace(/^\//, '')] || r.source;
}
function activate(html, p) {
  if (!p) return html;
  const hrefs = new Set([...html.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]));
  let target = hrefs.has(p) ? p : null;
  const exact = !!target;
  if (!target) for (const h of hrefs) if (h !== '/' && p.startsWith(h + '/') && (!target || h.length > target.length)) target = h;
  if (!target) return html;
  const re = () => new RegExp(`<a ([^>]*?)href="${target.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&')}"([^>]*)>`, 'g');
  // 1. open the menu group that holds the page (positions taken from the untouched string, applied last to first)
  const marks = new Set();
  // /portfolio has its own top-level link; do not light the Work menu as well
  for (const m of (target === '/portfolio' ? [] : html.matchAll(re()))) {
    const cls = (m[0].match(/class="([^"]*)"/) || [, ''])[1];
    if (cls === '' || cls === 'ap-ms__top' || cls.includes('ap-nav__logo')) continue;
    const before = html.slice(0, m.index);
    const i1 = before.lastIndexOf('<button type="button" class="ap-dd__btn"'), i2 = before.lastIndexOf('<details class="ap-ms__grp"');
    if (i1 > i2 && i1 >= 0) marks.add('b' + i1); else if (i2 >= 0) marks.add('d' + i2);
  }
  for (const k of [...marks].sort((x, y) => +y.slice(1) - +x.slice(1))) {
    const i = +k.slice(1);
    html = k[0] === 'b'
      ? html.slice(0, i) + html.slice(i).replace('aria-haspopup="true">', 'aria-haspopup="true" data-current="true">')
      : html.slice(0, i) + html.slice(i).replace('<details class="ap-ms__grp">', '<details class="ap-ms__grp" open="">');
  }
  // 2. mark the page's own links
  if (exact) for (const m of [...html.matchAll(re())].reverse()) html = html.slice(0, m.index) + m[0].slice(0, -1) + ' aria-current="page">' + html.slice(m.index + m[0].length);
  return html;
}

/* ---------- apply ---------- */
function region(name, build, src, p) {
  const re = new RegExp(`(<!-- ap-${name}:start -->)[\\s\\S]*?(<!-- ap-${name}:end -->)`, 'g');
  let n = 0;
  const out = src.replace(re, (_, a, b) => { n++; return `${a}\n${activate(build(), p)}\n${b}`; });
  return [out, n];
}
function wrapLegacyNav(src) {
  return src.replace(/(?<!<!-- ap-nav:start -->\s*)<nav class="ap-nav"[\s\S]*?<\/nav>(?!\s*<!-- ap-nav:end -->)/g, (m) => `<!-- ap-nav:start -->\n${m}\n<!-- ap-nav:end -->`);
}
function wrapLegacyFooter(src) {
  // first run only: put markers round footers that do not have them yet
  return src.replace(/(?<!<!-- ap-foot:start -->\s*)<footer class="ap-foot"[\s\S]*?<\/footer>(?!\s*<!-- ap-foot:end -->)/g, (m) => `<!-- ap-foot:start -->\n${m}\n<!-- ap-foot:end -->`);
}
let changed = 0, stale = [];
for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.dc.html')).sort()) {
  const fp = path.join(ROOT, f), src = fs.readFileSync(fp, 'utf8');
  if (!src.includes('<!-- ap-nav:start -->') && !src.includes('<footer class="ap-foot"')) continue;
  const p = rewrites[f];
  let out = wrapLegacyFooter(wrapLegacyNav(src)), a, b;
  [out, a] = region('nav', header, out, p);
  [out, b] = region('foot', footer, out, p);
  out = out.replace(/nav\.css\?v=\d+/g, `nav.css?v=${NAV_CSS}`);
  if (out !== src) { changed++; stale.push(f); if (!CHECK) fs.writeFileSync(fp, out); }
}
if (CHECK) { if (stale.length) { console.error('Out of date, run: node scripts/chrome.cjs\n  ' + stale.join('\n  ')); process.exit(1); } console.log('chrome: all pages current'); }
else console.log(`chrome: ${changed} page(s) updated`);
