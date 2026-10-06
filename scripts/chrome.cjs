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
const NAV_CSS = 25; // bump when assets/nav.css changes: assets are cached for 30 days
const NAV_JS = 3;   // same for assets/nav.js (search, menu images, footer on phones)

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
       { h: 'Advise and deliver', items: [
        { href: '/freelance-project-manager', t: 'Freelance project manager', d: 'Launches, rollouts, handovers', ic: 'kanban', f: 'Freelance project manager' },
        { href: '/tech-consultant', t: 'Tech consultant', d: 'Architecture and delivery', ic: 'compass' },
      ] }],
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
        { href: '/tools/sop-maker', t: 'SOP Maker', d: '116 SOP templates, Word and PDF', b: 'New' },
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
        { href: '/contact', t: 'Send a brief', d: 'Freelance project inquiry', ic: 'send', f: 'Send a brief' },
        { href: WA, t: 'WhatsApp', d: 'Quick chat', ic: 'chat', x: true },
        { href: MAIL, t: 'Email', d: 'hello@aashishpandey.com', ic: 'mail' },
      ] }],
    ],
  },
};
// a picture and one line in the wide menus (shown from 1180px up; the image loads on first hover)
MENUS.work.promo = { href: '/work-liquid-iv', t: 'Liquid I.V. rollout', d: '15 markets on Shopify, 9 new EU markets live in H1 2026.', img: '/assets/nav/promo-work.webp', w: 480, h: 281 };
MENUS.services.promo = { href: '/shopify-developer', t: 'Shopify developer', d: 'Stores I built, like Copper Chocs, and a 15-market rollout I ran.', img: '/assets/nav/promo-services.webp', w: 480, h: 300 };
MENUS.tools.promo = { href: '/tools/resume-maker', t: 'Resume Maker', d: '30 ATS-friendly templates. PDF and Word, no sign-up.', img: '/assets/nav/promo-tools.webp', w: 480, h: 300 };
const ORDER = ['work', 'services', 'tools', 'more'];
const HIRE = [
  { href: BOOK, t: 'Book a 20-min call', d: 'Pick a slot that suits you', x: true },
  { href: MAIL, t: 'Email', d: 'hello@aashishpandey.com' },
  { href: '/contact', t: 'Send a brief', d: 'Freelance project inquiry' },
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
  more: [['/', 'The 3D ride'], ['/how-this-site-was-built', 'How this site was built'], [CV, 'Résumé (PDF)'], ['/contact', 'Send a brief']],
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
  const pr = m.promo ? `<a class="ap-mega__promo" role="menuitem" href="${e(m.promo.href)}"><span class="ap-mega__pimg"><img data-src="${e(m.promo.img)}" alt="" width="${m.promo.w}" height="${m.promo.h}" decoding="async"></span><span class="ap-mega__pt">${e(m.promo.t)}</span><span class="ap-mega__pd">${e(m.promo.d)}</span><span class="ap-mega__pgo">Open${ARROW}</span></a>` : '';
  return `<div class="ap-dd ap-dd--mega"><button type="button" class="ap-dd__btn" aria-haspopup="true">${e(m.label)}${CARET}</button><div class="ap-mega ap-mega--${n}${m.promo ? ' ap-mega--promo' : ''}" role="menu">${feat}<div class="ap-mega__main"><div class="ap-mega__cols ap-mega__cols--${n}">${cols}</div>${pr}</div><div class="ap-mega__foot"><span class="ap-mega__note"><span class="ap-mega__dot"></span>${e(m.note)}</span><a class="ap-mega__all" role="menuitem" href="${e(m.cta.href)}"${ext(m.cta)}>${e(cta)}${ARROW}</a></div></div></div>`;
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
  const SEARCH_SVG = svg('<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path>', 17, 2);
  const search = `<button type="button" class="ap-nav__search" data-ap-search aria-label="Search the site" aria-haspopup="dialog">${SEARCH_SVG}<span class="ap-nav__stxt">Search</span><kbd class="ap-nav__kbd" aria-hidden="true">\u2318K</kbd></button>`;
  const sheet = `<details class="ap-nav__menu ap-ms"><summary aria-label="Open menu"><span class="ap-ms__burger" aria-hidden="true"><span></span><span></span></span><span class="ap-ms__lbl">Menu</span></summary><div class="ap-ms__sheet">`
    + `<button type="button" class="ap-ms__search" data-ap-search>${SEARCH_SVG}<span>Search the site</span></button>`
    + `<div class="ap-ms__ctas"><a class="ap-ms__cta ap-ms__cta--pri" href="${e(BOOK)}" target="_blank" rel="noopener"><span class="ap-nav__dot"></span>Book a 20-min call</a><a class="ap-ms__cta" href="${e(WA)}" target="_blank" rel="noopener">WhatsApp</a></div>`
    + `<a class="ap-ms__top" href="/portfolio">Portfolio${ARROW}</a>` + ORDER.map(sheetGroup).join('') + '</div></details>';
  return `<nav class="ap-nav" aria-label="Main"><div class="ap-nav__in"><a class="ap-nav__logo" href="/"><span class="ap-nav__badge" aria-hidden="true"></span><span class="ap-nav__name">Aashish Pandey</span></a><div class="ap-nav__pill"><a href="/portfolio">Portfolio</a>${ORDER.map(mega).join('')}</div><div class="ap-nav__right">${search}${hire}${sheet}</div></div></nav>`;
}

/* ---------- footer ---------- */
// Plain text columns, quiet colours, one legal row: the pattern the large sites use (Vercel, Stripe, Linear).
const TOOL_ORDER = ['/tools/resume-maker', '/tools/qr-code-generator', '/tools/invoice-generator', '/tools/sop-maker', '/tools/password-generator', '/tools/image-resizer', '/tools/url-shortener', '/tools/lorem-ipsum-generator', '/tools/pad', '/tools/time-zone-meeting-planner', '/tools/file-hash-checker', '/tools/exif-remover', '/tools/project-estimate-calculator', '/tools/qr-code-checker', '/tools/website-launch-checklist'];
function footer() {
  const link = ([h, t, x]) => `<a href="${e(h)}"${x ? ' target="_blank" rel="noopener"' : ''}>${e(t)}</a>`;
  const col = (h, inner, cls = '') => `<details class="ap-foot__col${cls}" open><summary class="ap-foot__h">${h}</summary><div class="ap-foot__links">${inner}</div></details>`;
  const order = ['/shopify-developer', '/full-stack-developer', '/wordpress-webflow-developer', '/seo-consultant', '/ui-ux-design', '/freelance-project-manager', '/tech-consultant'];
  const svc = [['/services', 'All services'], ...flat(MENUS.services).filter((i) => i.href !== '/services').sort((a, b) => order.indexOf(a.href) - order.indexOf(b.href)).map((i) => [i.href, i.f || i.t])];
  const byHref = Object.fromEntries(flat(MENUS.tools).map((t) => [t.href, t]));
  const tools = `<div class="ap-foot__tools">${TOOL_ORDER.map((h) => `<a href="${e(h)}">${e(byHref[h].f || byHref[h].t)}</a>`).join('')}</div><a class="ap-foot__all" href="/tools">All ${toolCount} tools</a>`;
  const work = [['/portfolio', 'Portfolio'], ...FOOT.work.filter(([h]) => h !== '/portfolio')];
  const contact = [[MAIL, 'hello@aashishpandey.com'], [BOOK, 'Book a 20-minute call', 1], ['/contact', 'Send a brief'], [WA, 'WhatsApp', 1], [LI, 'LinkedIn', 1]];
  const more = [['/', 'The 3D ride'], ['/how-this-site-was-built', 'How this site was built'], [CV, 'Résumé (PDF)']];
  return `<footer class="ap-foot" aria-label="Site footer"><div class="ap-foot__in"><div class="ap-foot__top"><div class="ap-foot__brand"><a class="ap-nav__logo" href="/"><span class="ap-nav__badge" aria-hidden="true"></span><span class="ap-nav__name">Aashish Pandey</span></a><p>${e(FOOT.tagline)}</p><a class="ap-foot__status" href="/contact"><span class="ap-nav__dot"></span>${e(FOOT.status)}</a><form class="ap-foot__news" data-news novalidate><label for="ap-news-e">New tools and write-ups, by email</label><input id="ap-news-n" type="text" name="name" placeholder="First name (optional)" autocomplete="given-name" maxlength="60"><div class="ap-foot__nrow"><input id="ap-news-e" type="email" name="email" placeholder="you@example.com" autocomplete="email" required maxlength="254"><button type="submit">Subscribe</button></div><input class="ap-hp" name="hp" tabindex="-1" autocomplete="off" aria-hidden="true"><p data-news-msg role="status" aria-live="polite">Subscribed straight away. Unsubscribe any time. <a href="/privacy">Privacy</a></p></form></div>`
    + `<nav class="ap-foot__cols" aria-label="Footer">${col('Work', work.map(link).join(''))}${col('Services', svc.map(link).join(''))}${col('Free tools', tools, ' ap-foot__col--tools')}<div class="ap-foot__stack">${col('Get in touch', contact.map(link).join(''))}${col('More', more.map(link).join(''))}</div></nav></div>`
    + `<div class="ap-foot__base"><span class="ap-foot__copy">© ${YEAR} Aashish Pandey</span><nav class="ap-foot__legal" aria-label="Legal"><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/cookies">Cookies</a><a href="/image-license">Image licence</a><button type="button" data-cookie-settings>Cookie settings</button></nav><a href="#" class="ap-foot__up">Back to top <span aria-hidden="true">↑</span></a></div>`
    + `<p class="ap-foot__credits">Designed and built with passion <svg class="ap-foot__heart" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 4.5 6.3 4.5c2.1 0 3.8 1.2 5.7 3.3 1.9-2.1 3.6-3.3 5.7-3.3 3.6 0 5.4 3.9 3.9 7.3C19.5 16.4 12 21 12 21z"></path></svg> by Aashish Pandey</p></div></footer>`;
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
  // the script that opens search and loads the menu pictures sits beside the stylesheet, with the same path style
  if (/nav\.js\?v=\d+/.test(out)) out = out.replace(/nav\.js\?v=\d+/g, `nav.js?v=${NAV_JS}`);
  else out = out.replace(/(<link rel="stylesheet" href=")((?:\/|\.\/)?)(assets\/nav\.css\?v=\d+)(">)/, (m, a, pre, c, d) => `${m}\n<script src="${pre}assets/nav.js?v=${NAV_JS}" defer></script>`);
  if (out !== src) { changed++; stale.push(f); if (!CHECK) fs.writeFileSync(fp, out); }
}
if (CHECK) { if (stale.length) { console.error('Out of date, run: node scripts/chrome.cjs\n  ' + stale.join('\n  ')); process.exit(1); } console.log('chrome: all pages current'); }
else console.log(`chrome: ${changed} page(s) updated`);
