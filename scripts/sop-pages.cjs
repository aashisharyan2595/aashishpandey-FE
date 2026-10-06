#!/usr/bin/env node
/*
 * SOP Maker: builds the four SOP pages and the template data file from one source.
 *
 *   scripts/sop-templates.json   the templates (edit this to add or change one)
 *   DEPTS below                  the departments, their codes and icons
 *
 * Writes:
 *   assets/sop-templates.js          data for the builder and the library
 *   Tools-SOP.dc.html                /tools/sop-maker            (landing)
 *   Tools-SOP-Build.dc.html          /tools/sop-maker/build      (the builder)
 *   Tools-SOP-Templates.dc.html      /tools/sop-maker/templates  (library, every template crawlable)
 *   Tools-SOP-Guide.dc.html          /tools/sop-maker/guide      (how to write an SOP)
 *
 * Run after editing:  node scripts/sop-pages.cjs
 * The header and footer regions are kept from the existing file (scripts/chrome.cjs owns them).
 */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SITE = 'https://aashishpandey.com';
const V = 1; // bump when assets/sop-*.js or sop*.css change: assets are cached for 30 days

global.window = {};
require(path.join(ROOT, 'assets', 'sop-doc.js'));
const SOPDoc = global.window.SOPDoc;

/* ---------- departments ---------- */
const I = {
  people: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  sales: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  marketing: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  support: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  finance: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/>',
  ops: '<path d="M21 8 12 3 3 8v8l9 5 9-5V8z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/>',
  it: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  product: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
  legal: '<path d="M12 3v18"/><path d="M5 7h14"/><path d="m5 7-3 7a3 3 0 0 0 6 0z"/><path d="m19 7-3 7a3 3 0 0 0 6 0z"/><path d="M8 21h8"/>',
  safety: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  leadership: '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
  retail: '<path d="m3 9 1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9h18"/><path d="M9 20v-6h6v6"/>',
  pm: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7v7"/><path d="M12 7v4"/><path d="M16 7v9"/>',
};
const DEPTS = {
  people: { name: 'People and HR', short: 'HR', code: 'HR', d: 'Hiring, onboarding, reviews, leave and leaving.' },
  sales: { name: 'Sales', short: 'Sales', code: 'SAL', d: 'Leads, proposals, closing, handoffs and renewals.' },
  marketing: { name: 'Marketing', short: 'Marketing', code: 'MKT', d: 'Content, campaigns, launches, events and PR.' },
  support: { name: 'Customer support and success', short: 'Support', code: 'CS', d: 'Tickets, escalations, refunds and churn.' },
  finance: { name: 'Finance and accounting', short: 'Finance', code: 'FIN', d: 'Invoicing, payables, close, payroll and tax.' },
  ops: { name: 'Operations and procurement', short: 'Operations', code: 'OPS', d: 'Purchasing, vendors, stock, shipping and quality.' },
  it: { name: 'IT and security', short: 'IT', code: 'IT', d: 'Access, backups, incidents, patching and devices.' },
  product: { name: 'Product and engineering', short: 'Product', code: 'ENG', d: 'Releases, code review, bugs, on-call and post-mortems.' },
  legal: { name: 'Legal and compliance', short: 'Legal', code: 'LEG', d: 'Contracts, NDAs, privacy requests and audits.' },
  safety: { name: 'Health, safety and facilities', short: 'Safety', code: 'HSE', d: 'Inspections, accidents, fire drills and visitors.' },
  leadership: { name: 'Leadership and strategy', short: 'Leadership', code: 'EXE', d: 'Meetings, OKRs, business reviews and crises.' },
  retail: { name: 'Retail, food and ecommerce', short: 'Retail', code: 'RET', d: 'Store open and close, food safety and orders.' },
  pm: { name: 'Project management', short: 'Projects', code: 'PMO', d: 'Kickoff, change control, status and closure.' },
};
const ORDER = Object.keys(DEPTS);
const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'sop-templates.json'), 'utf8'))
  .sort((a, b) => ORDER.indexOf(a.dept) - ORDER.indexOf(b.dept));
const N = T.length;
const byDept = Object.fromEntries(ORDER.map((k) => [k, T.filter((t) => t.dept === k)]));
for (const t of T) if (!DEPTS[t.dept]) throw new Error('unknown dept ' + t.dept + ' in ' + t.id);
if (new Set(T.map((t) => t.id)).size !== N) throw new Error('duplicate template id');

/* ---------- helpers ---------- */
const e = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const svg = (p, s = 22) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ARROW = svg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', 16);
const ARROW_S = svg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', 12);
const CHECK = svg('<path d="M20 6 9 17l-5-5"/>', 14);
const crumb = (items) => `<nav aria-label="Breadcrumb"><ol class="rm-crumb">${items.map(([h, t], i) => (i ? '<li aria-hidden="true" style="opacity:.5">/</li>' : '') + (h ? `<li><a href="${h}">${e(t)}</a></li>` : `<li><span aria-current=page>${e(t)}</span></li>`)).join('')}</ol></nav>`;
const faq = (qs) => `<div class="rm-faq">${qs.map(([q, a]) => `<details><summary><h3>${e(q)}</h3></summary><p>${e(a)}</p></details>`).join('')}</div>`;
const faqLd = (url, qs) => ({ '@type': 'FAQPage', '@id': url + '#faq', mainEntity: qs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const crumbLd = (url, items) => ({ '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: items.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: SITE + u })) });
const paper = (s, cls = '') => `<div class="sm-paper ${cls}"><div class="sm-scale">${SOPDoc.html(s)}</div></div>`;
const sample = (id, accent) => { const t = T.find((x) => x.id === id) || T[0], s = SOPDoc.fromTemplate(t, DEPTS); s.meta.company = 'Northwind Studio'; s.meta.effective = '2026-10-01'; s.revs = [['1.0', '2026-10-01', 'First issue', s.meta.owner]]; s.meta.prepared = 'A. Pandey'; if (accent) s.d.accent = accent; return s; };

/* ---------- page shell ---------- */
const BASE = fs.readFileSync(path.join(ROOT, 'pages/tools/Tools-Estimate.dc.html'), 'utf8');
const STYLE = BASE.slice(BASE.indexOf('<style>'), BASE.indexOf('input[type=range]{accent-color:#f5b867}') + 39) + '\n</style>';
const PERSON = JSON.parse(BASE.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'][0];
const region = (src, name) => (src.match(new RegExp(`<!-- ap-${name}:start -->[\\s\\S]*?<!-- ap-${name}:end -->`)) || [])[0];
function page(file, o) {
  const url = SITE + o.path, at = path.join(ROOT, 'pages/tools/sop', file), prev = fs.existsSync(at) ? fs.readFileSync(at, 'utf8') : '';
  const nav = region(prev, 'nav') || region(BASE, 'nav'), foot = region(prev, 'foot') || region(BASE, 'foot');
  const navCss = (BASE.match(/nav\.css\?v=\d+/) || ['nav.css?v=1'])[0], navJs = (BASE.match(/nav\.js\?v=\d+/) || ['nav.js?v=1'])[0];
  const img = SITE + '/assets/og/og-tool-sop.jpg';
  const graph = [PERSON, { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: 'Aashish Pandey', publisher: { '@id': SITE + '/#person' }, inLanguage: 'en' }, ...o.ld,
    { '@type': 'WebPage', '@id': url + '#webpage', url, name: o.title, description: o.desc, inLanguage: 'en', isPartOf: { '@id': SITE + '/#website' }, breadcrumb: { '@id': url + '#breadcrumb' }, ...(o.about ? { about: { '@id': o.about }, mainEntity: { '@id': o.about } } : {}) }];
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="/assets/${navCss}">
<script src="/assets/${navJs}" defer></script>
<title>${e(o.title)}</title>
<meta name="description" content="${e(o.desc)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/assets/favicon.svg?v=2" type="image/svg+xml">
<link rel="icon" href="/assets/favicon-32.png?v=2" sizes="32x32" type="image/png">
<link rel="manifest" href="/assets/site.webmanifest">
<meta name="theme-color" content="#0b1030">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Aashish Pandey">
<meta property="og:title" content="${e(o.title)}">
<meta property="og:description" content="${e(o.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${img}">
<meta property="og:image:alt" content="SOP Maker by Aashish Pandey">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${e(o.title)}">
<meta name="twitter:description" content="${e(o.desc)}">
<meta name="twitter:image" content="${img}">
<meta name="twitter:image:alt" content="SOP Maker by Aashish Pandey">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&amp;family=Geist+Mono:wght@400;500&amp;family=Instrument+Serif:ital@0;1&amp;display=swap" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&amp;family=Geist+Mono:wght@400;500&amp;family=Instrument+Serif:ital@0;1&amp;display=swap"></noscript>
<script src="/assets/js/site.js" defer></script>
<script src="/assets/motion.js" defer></script>
${STYLE}
<link rel="stylesheet" href="/assets/sop-site.css?v=${V}">
<link rel="stylesheet" href="/assets/sop.css?v=${V}">
</head>
<body>
<div id="top" style="min-height:100vh;background:#070916;color:#f4efe6;font-family:'Geist',system-ui,sans-serif;overflow-x:clip;display:flex;flex-direction:column;">
  ${nav}
  <main style="flex:1;width:100%;max-width:1200px;margin:0 auto;box-sizing:border-box;padding:clamp(40px,7vw,96px) clamp(18px,4vw,44px) 0;display:flex;flex-direction:column;gap:clamp(28px,4vw,40px);">
    <div class="rm"${o.gap ? ` style="gap:${o.gap}"` : ''}>
${o.body}
</div>
</main>
  ${foot}
</div>
${o.scripts || ''}<script src="/assets/sop-site.js?v=${V}" defer></script>
</body>
</html>
`;
  const fp = at;
  if (prev !== html) { fs.writeFileSync(fp, html); console.log('wrote', file); }
}

/* ---------- shared bits ---------- */
const SECTIONS = [
  ['Document control', 'ID, version, owner, approver, effective and review dates.'],
  ['Purpose and scope', 'Why it exists, who it covers and what it does not.'],
  ['Definitions', 'The terms a new starter might not know.'],
  ['Roles and responsibilities', 'Who does what, so every step has an owner.'],
  ['Prerequisites', 'Access, tools, forms and training needed first.'],
  ['Procedure', 'Numbered steps, each with an owner, timing and limits.'],
  ['Quality checks', 'The control points that catch mistakes.'],
  ['KPIs', 'How you know the process is working.'],
  ['Risks and controls', 'What can go wrong and what stops it.'],
  ['Related documents', 'Forms, policies and linked SOPs.'],
  ['Revision history and sign-off', 'Every change, and who approved it.'],
];
const BAND = `<section class="rm-sec"><div class="rm-band">
<div><span class="rm-ico">${svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m17 8 5 5"/><path d="m22 8-5 5"/>')}</span><h3>No account</h3><p>Nothing to sign up for or pay for. No watermark.</p></div>
<div><span class="rm-ico">${svg('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>')}</span><h3>Private</h3><p>Your SOP is saved on this device only. Nothing is uploaded.</p></div>
<div><span class="rm-ico">${svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>')}</span><h3>Word, PDF, Markdown</h3><p>Edit it in Word or Google Docs, print it, or paste it into a wiki.</p></div>
<div><span class="rm-ico">${svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>')}</span><h3>Audit-ready layout</h3><p>Document control and revision history in the ISO 9001 style.</p></div>
</div></section>`;
const tplLink = (t) => `/tools/sop-maker/build?t=${t.id}`;

/* ---------- 1. landing ---------- */
const LAND_FAQ = [
  ['What is an SOP?', 'A standard operating procedure is a written, step-by-step description of how a task is done in your business, who does each step and how you check it was done right. It lets anyone trained on it get the same result every time.'],
  ['Is this SOP maker free?', `Yes. All ${N} templates, the builder and every download are free, with no account and no watermark.`],
  ['Can I make an SOP for a topic that has no template?', 'Yes. Type any topic or job, such as "dental surgery sterilisation" or "night shift handover", choose the kind of procedure, and the builder gives you a complete starting draft to edit.'],
  ['What format do I get?', 'A Word file (.docx) you can edit in Word, Google Docs or Pages, a PDF from the print window, Markdown for wikis like Notion or Confluence, and plain text. You can also save the SOP as a file and open it again later.'],
  ['Is my SOP stored on a server?', 'No. The builder runs in your browser and saves only on your device. The Word file and PDF are made on your device too.'],
  ['Do the templates meet ISO 9001?', 'The layout follows the document-control habits ISO 9001 auditors look for: an ID, version, owner, approver, effective date, review cycle and revision history. Whether your process complies depends on what you write in it, so check the content with whoever owns your quality system.'],
  ['How long should an SOP be?', 'Long enough that a trained new starter can follow it without asking. Most good SOPs fit on two to four pages with 6 to 15 steps. Split anything longer into separate SOPs.'],
];
{
  const fan = [sample('people-employee-onboarding', '#1f4e79'), sample('support-refunds-returns', '#0f766e'), sample('it-security-incident-response', '#be123c')];
  const pop = ['people-employee-onboarding', 'people-recruitment-job-requisition', 'support-refunds-returns', 'finance-customer-invoicing-billing', 'finance-month-end-close', 'it-security-incident-response', 'product-release', 'sales-lead-qualification', 'ops-purchase-requests-purchase-orders', 'retail-store-opening', 'marketing-social-media-posting-moderation', 'pm-project-kickoff']
    .map((id) => T.find((t) => t.id === id)).filter(Boolean);
  const body = `  <div class="rm-hero"><div class="rm-hero-t">${crumb([['/', 'Home'], ['/tools', 'Tools'], [null, 'SOP Maker']])}<span class="rm-kick"><i></i>Free · Private · No sign-up</span><h1 class="rm-h1">Write a clear SOP for anything, <em>in minutes.</em></h1><p class="rm-sub">Start from ${N} professional templates or type any topic or career. Edit the steps, owners and checks, then download Word, PDF or Markdown.</p><div class="rm-btns"><a class="rm-btn rm-btn--p" href="/tools/sop-maker/build">Build my SOP${ARROW}</a><a class="rm-btn" href="/tools/sop-maker/templates">Browse ${N} templates</a></div><div class="rm-pills"><span class="rm-pill">${CHECK}No account</span><span class="rm-pill">${CHECK}Word and PDF</span><span class="rm-pill">${CHECK}Works offline</span></div></div>
  <div class="rm-fan sm-fan">${fan.map((s) => `<div class="rm-sheet">${paper(s)}</div>`).join('')}</div></div>
  <section class="rm-sec"><form class="sm-ask" action="/tools/sop-maker/build" method="get"><label for="ask" class="rm-h2" style="max-width:none">What do you need <em>an SOP for?</em></label><div class="sm-ask-r"><input id="ask" name="topic" class="tl-input" type="text" placeholder="e.g. customer refunds, new hire onboarding, kitchen closing" maxlength="120" autocomplete="off"><button class="rm-btn rm-btn--p" type="submit">Start${ARROW}</button></div><p class="tl-muted tl-small">Any business task, job or career. The builder finds the closest template or writes a starter draft for your topic.</p></form></section>
  <section class="rm-sec"><div class="rm-head"><h2 class="rm-h2">Three steps, <em>no sign-up.</em></h2></div><div class="rm-steps">
<div class="rm-card"><span class="rm-num">01</span><span class="rm-ico">${svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>')}</span><h3>Pick a template or a topic</h3><p>Search ${N} templates by department, or type any topic for a starter draft.</p></div>
<div class="rm-card"><span class="rm-num">02</span><span class="rm-ico">${svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>')}</span><h3>Make it yours</h3><p>Edit roles, steps, owners, checks, KPIs and risks. The preview updates as you type.</p></div>
<div class="rm-card"><span class="rm-num">03</span><span class="rm-ico">${svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>')}</span><h3>Download and roll out</h3><p>Word, PDF or Markdown, with a sign-off block and revision history.</p></div>
</div></section>
  <section class="rm-sec"><div class="rm-head"><h2 class="rm-h2">Templates for <em>every part of the business.</em></h2><p class="rm-sub">Written for startups and growing teams. Fill in the square-bracket placeholders and they are ready to use.</p></div><div class="rm-jobs">${ORDER.map((k) => `<a class="rm-card" href="/tools/sop-maker/templates#${k}"><span class="rm-ico">${svg(I[k])}</span><h3>${e(DEPTS[k].name)}</h3><p>${e(DEPTS[k].d)}</p><span class="rm-more">${byDept[k].length} templates ${ARROW_S}</span></a>`).join('')}</div></section>
  <section class="rm-sec"><div class="rm-head"><h2 class="rm-h2">Most used <em>templates.</em></h2></div><div class="sm-pop">${pop.map((t) => `<a href="${tplLink(t)}"><span class="sm-pop-d">${e(DEPTS[t.dept].short)}</span><strong>${e(t.title)}</strong><span class="sm-pop-s">${e(t.summary)}</span></a>`).join('')}</div><div><a class="rm-btn" href="/tools/sop-maker/templates">See all ${N} templates${ARROW}</a></div></section>
  <section class="rm-sec"><div class="rm-head"><h2 class="rm-h2">What every SOP <em>includes.</em></h2><p class="rm-sub">One proven structure, so your procedures look and read the same across the company.</p></div><ol class="sm-parts">${SECTIONS.map(([a, b], i) => `<li><span class="rm-num">${String(i + 1).padStart(2, '0')}</span><strong>${e(a)}</strong><span>${e(b)}</span></li>`).join('')}</ol><p class="tl-muted tl-small">New to writing SOPs? Read the <a href="/tools/sop-maker/guide">guide to writing an SOP</a>.</p></section>
${BAND}
  <section class="rm-sec"><div class="rm-head"><h2 class="rm-h2">Quick answers</h2></div>${faq(LAND_FAQ)}</section>
  <div class="rm-final"><h2>Ready to write yours?</h2><div class="rm-btns"><a class="rm-btn rm-btn--p" href="/tools/sop-maker/build">Build my SOP${ARROW}</a><a class="rm-btn" href="/tools/sop-maker/guide">Read the guide</a></div></div>`;
  const url = SITE + '/tools/sop-maker', desc = `Free SOP maker with ${N} professional SOP templates for startups and small businesses: HR, sales, finance, IT, operations and more. Any topic. Word, PDF and Markdown. No sign-up.`;
  page('Tools-SOP.dc.html', { path: '/tools/sop-maker', title: `Free SOP Maker · ${N} SOP Templates, Word and PDF`, desc, about: url + '#app', body,
    ld: [{ '@type': 'WebApplication', '@id': url + '#app', name: 'SOP Maker', url, description: desc, applicationCategory: 'BusinessApplication', operatingSystem: 'Any (runs in a web browser)', browserRequirements: 'Requires JavaScript', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, creator: { '@id': SITE + '/#person' }, image: SITE + '/assets/og/og-tool-sop.jpg', featureList: [`${N} SOP templates across ${ORDER.length} departments`, 'A starter draft for any topic or career', 'Roles, numbered steps with owners, quality checks, KPIs, risks and revision history', 'Download Word (.docx), PDF and Markdown', 'Runs in the browser, saves on your device'], inLanguage: 'en' },
      crumbLd(url, [['Home', '/'], ['Tools', '/tools'], ['SOP Maker', '/tools/sop-maker']]), faqLd(url, LAND_FAQ)] });
}

/* ---------- 2. builder ---------- */
{
  const STEPS = ['Start', 'Details', 'People', 'Procedure', 'Controls', 'Download'];
  const body = `  <div class="rb-top"><div style="display:flex;flex-direction:column;gap:10px">${crumb([['/', 'Home'], ['/tools', 'Tools'], ['/tools/sop-maker', 'SOP Maker'], [null, 'Builder']])}<h1 class="rm-h1" style="font-size:clamp(28px,3.4vw,40px)">SOP <em>builder</em></h1></div>
  <nav id="steps" class="rb-steps" aria-label="Steps">${STEPS.map((s, i) => `<button type="button" data-go="${i + 1}"><span class="rb-n">${i + 1}</span><span class="rb-l">${s}</span></button>`).join('')}</nav></div>
  <div class="rb-grid">
    <div class="rb-panel">
      <section class="rb-step" data-step="1"><h2>What is the SOP for?</h2>
        <form id="topicForm" class="tl-field" role="search"><label for="topic">Topic, task or career</label><input id="topic" class="tl-input" type="search" placeholder="e.g. refund request, nurse shift handover, café closing" maxlength="120" autocomplete="off"></form>
        <div id="deptFilter" class="rb-filter" role="group" aria-label="Filter by department"></div>
        <p id="tplCount" class="tl-muted tl-small" aria-live="polite"></p>
        <div id="tplList" class="sb-tpls"></div>
        <div class="sb-blank"><span class="rb-lab">No good match? Start a draft for <span id="kindTopic">your topic</span></span><div class="tl-row" style="gap:10px;align-items:flex-end"><div class="tl-field" style="flex:1 1 220px"><label for="kind">Kind of procedure</label><select id="kind" class="tl-select"></select></div><button id="makeBlank" class="tl-btn tl-btn--p" type="button">Write a starter draft</button></div><p class="tl-muted tl-small">Works for any topic or job. You get roles, steps, checks, KPIs and risks to edit.</p></div>
      </section>
      <section class="rb-step" data-step="2" hidden><h2>Details</h2><p class="tl-muted tl-small">Square-bracket text like [Company] is a placeholder. Replace it with your own detail.</p><div id="detailsBody"></div></section>
      <section class="rb-step" data-step="3" hidden><h2>People and prerequisites</h2><div id="peopleBody" style="display:flex;flex-direction:column;gap:20px"></div></section>
      <section class="rb-step" data-step="4" hidden><h2>Procedure</h2><p class="tl-muted tl-small">One action per step, starting with a verb. Add timing and limits so nobody has to guess.</p><datalist id="roleNames"></datalist><div id="stepList" class="sb-steps"></div><div><button id="addStep" class="tl-btn" type="button">+ Add a step</button></div><div id="checksHost"></div></section>
      <section class="rb-step" data-step="5" hidden><h2>Controls and history</h2><div id="controlsBody" style="display:flex;flex-direction:column;gap:20px"></div></section>
      <section class="rb-step" data-step="6" hidden><h2>Design and download</h2><div id="designBody" style="display:flex;flex-direction:column;gap:16px"></div>
        <div class="rb-dl"><button id="print" class="is-p" type="button">Save as PDF<small>Opens the print window. Choose Save as PDF.</small></button><button id="dl-docx" type="button">Word file<small>.docx you can edit in Word, Google Docs or Pages.</small></button><button id="dl-md" type="button">Markdown<small>For Notion, Confluence, GitHub or a wiki.</small></button><button id="dl-copy" type="button"><span>Copy plain text</span><small>Paste into an email or a chat.</small></button><button id="dl-json" type="button">Save to edit later<small>A small file you can open here again.</small></button><label>Open a saved SOP<small>Choose a file saved from this tool.</small><input id="ld-json" type="file" accept=".json,application/json" class="sr"></label></div>
        <div class="tl-actions"><button id="reset" class="tl-btn" type="button">Start again</button></div>
        <p class="tl-muted tl-small">Templates are a starting point, not legal advice. Check anything that touches law, safety or tax against local rules.</p></section>
      <div class="rb-nav"><button id="rbBack" class="tl-btn" type="button" hidden>Back</button><button id="rbNext" class="tl-btn tl-btn--p" type="button" style="margin-left:auto">Next</button></div>
    </div>
    <div class="rb-prev"><div class="rb-sticky"><div class="no-print" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><span id="pageNote" class="tl-muted" style="font-size:13px"></span><button id="rbDl" class="tl-btn tl-btn--p" type="button">Download</button></div><div id="fit" class="sb-fit"><div id="sop" aria-label="SOP preview"></div></div></div></div>
  </div>`;
  const url = SITE + '/tools/sop-maker/build', desc = `Build a standard operating procedure step by step: roles, numbered steps with owners, checks, KPIs, risks and sign-off. ${N} templates or any topic. Word and PDF, free and private.`;
  page('Tools-SOP-Build.dc.html', { path: '/tools/sop-maker/build', title: 'SOP Builder · Free, Private, Word and PDF', desc, gap: '22px', body,
    scripts: `<script src="/assets/sop-templates.js?v=${V}"></script>\n<script src="/assets/sop-doc.js?v=${V}"></script>\n<script src="/assets/sop-builder.js?v=${V}"></script>\n`,
    ld: [crumbLd(url, [['Home', '/'], ['Tools', '/tools'], ['SOP Maker', '/tools/sop-maker'], ['Builder', '/tools/sop-maker/build']])] });
}

/* ---------- 3. template library ---------- */
{
  const card = (t) => `<article class="sm-card" id="t-${t.id}" data-id="${t.id}" data-dept="${t.dept}" data-q="${e([t.title, t.summary, (t.tags || []).join(' '), DEPTS[t.dept].name].join(' ').toLowerCase())}"><div class="sm-card-t"><h3>${e(t.title)}</h3><span class="rm-badge">${t.steps.length} steps</span></div><p>${e(t.summary)}</p>
<details class="sm-more"><summary>What it covers</summary><p><strong>Purpose.</strong> ${e(t.purpose)}</p><p><strong>Roles:</strong> ${e(t.roles.map((r) => r[0]).join(', '))}.</p><ol>${t.steps.map((s) => `<li>${e(s.t)}</li>`).join('')}</ol><p><strong>KPIs:</strong> ${e(t.kpis.map((k) => k[0] + ' (' + k[1] + ')').join('; '))}.</p></details>
<div class="sm-acts"><a class="tl-btn tl-btn--p" href="${tplLink(t)}">Customise</a><button type="button" class="tl-btn" data-dl="docx">Word</button><button type="button" class="tl-btn" data-dl="pdf">PDF</button><button type="button" class="tl-btn" data-dl="md">Markdown</button><button type="button" class="tl-btn" data-dl="view">Preview</button></div></article>`;
  const body = `  <div class="rm-head">${crumb([['/', 'Home'], ['/tools', 'Tools'], ['/tools/sop-maker', 'SOP Maker'], [null, 'Templates']])}<span class="rm-kick"><i></i>${N} templates · ${ORDER.length} departments</span><h1 class="rm-h1" style="font-size:clamp(34px,4.6vw,58px)">Free SOP templates <em>for startups and small business.</em></h1><p class="rm-sub" style="max-width:680px">Every template has a purpose, scope, roles, numbered steps with owners, quality checks, KPIs, risks and a revision log. Download it as Word, PDF or Markdown, or customise it in the builder.</p></div>
  <section class="rm-sec" style="gap:18px"><div class="sm-find"><div class="tl-field" style="flex:1 1 280px"><label for="q">Search templates</label><input id="q" class="tl-input" type="search" placeholder="e.g. refund, payroll, onboarding, backup" autocomplete="off"></div></div>
  <div id="filter" class="rm-filter" role="group" aria-label="Filter by department"><button type="button" aria-pressed="true" data-f="all">All</button>${ORDER.map((k) => `<button type="button" aria-pressed="false" data-f="${k}">${e(DEPTS[k].short)}</button>`).join('')}</div>
  <p id="count" class="tl-muted tl-small" aria-live="polite">${N} templates</p>
  ${ORDER.map((k) => `<section class="sm-dept" id="${k}" data-dept="${k}"><div class="sm-dept-h"><span class="rm-ico">${svg(I[k])}</span><div><h2>${e(DEPTS[k].name)}</h2><p>${e(DEPTS[k].d)} ${byDept[k].length} templates.</p></div></div><div class="sm-cards">${byDept[k].map(card).join('')}</div></section>`).join('\n  ')}
  <p id="none" class="tl-muted" hidden>No template matches that search. <a id="noneLink" href="/tools/sop-maker/build">Write a starter draft for it in the builder</a>.</p></section>
  <dialog id="view" class="sm-view" aria-label="Template preview"><div class="sm-view-h"><strong id="viewT"></strong><div class="tl-actions"><a id="viewC" class="tl-btn tl-btn--p" href="#">Customise</a><button type="button" class="tl-btn" id="viewX">Close</button></div></div><div class="sm-view-b"><div id="viewDoc"></div></div></dialog>
  <div class="rm-final"><h2>Need an SOP for something else?</h2><div class="rm-btns"><a class="rm-btn rm-btn--p" href="/tools/sop-maker/build">Start from any topic${ARROW}</a></div></div>`;
  const url = SITE + '/tools/sop-maker/templates', desc = `${N} free SOP templates for startups and small businesses across HR, sales, marketing, support, finance, operations, IT, product, legal, safety and more. Word, PDF, Markdown.`;
  page('Tools-SOP-Templates.dc.html', { path: '/tools/sop-maker/templates', title: `${N} Free SOP Templates · Word, PDF and Markdown`, desc, gap: 'clamp(40px,5vw,64px)', about: url + '#list', body,
    scripts: `<script src="/assets/sop-templates.js?v=${V}"></script>\n<script src="/assets/sop-doc.js?v=${V}"></script>\n<script src="/assets/sop-library.js?v=${V}"></script>\n`,
    ld: [{ '@type': 'ItemList', '@id': url + '#list', name: 'SOP templates', numberOfItems: N, itemListElement: T.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.title + ' SOP template', url: url + '#t-' + t.id })) },
      crumbLd(url, [['Home', '/'], ['Tools', '/tools'], ['SOP Maker', '/tools/sop-maker'], ['Templates', '/tools/sop-maker/templates']])] });
}

/* ---------- 4. guide ---------- */
const GUIDE_FAQ = [
  ['What is the difference between a policy, an SOP and a work instruction?', 'A policy says what the rule is and why. An SOP says how the process runs across people and teams, step by step. A work instruction goes deeper into one task at one workstation, often with screenshots or photos. Checklists are the shortest form, used to confirm the steps were done.'],
  ['Who should write an SOP?', 'The person who does the task every day writes the first draft, because they know the real steps. The process owner edits it, and someone who has never done the task tests it before it is approved.'],
  ['How often should SOPs be reviewed?', 'At least once a year, and straight away after an incident, an audit finding, a new tool or a change in the law. Put the review date in the document control block so it is not forgotten.'],
  ['How many steps should an SOP have?', 'Most work well with 6 to 15 steps. If you need more than about 20, split the process into separate SOPs and link them.'],
  ['What makes an SOP audit-ready?', 'A unique ID, a version number, a named owner and approver, an effective date, a review date, a revision history and evidence that people were trained on it. Auditors also check that what people actually do matches the document.'],
];
{
  const sec = (id, h, inner) => `<section id="${id}"><h2>${h}</h2>${inner}</section>`;
  const p = (t) => `<p>${t}</p>`;
  const list = (a, x) => `<ul class="rm-list${x ? ' rm-list--x' : ''}">${a.map((t) => `<li><span>${t}</span></li>`).join('')}</ul>`;
  const toc = [['what', 'What an SOP is'], ['when', 'When you need one'], ['parts', 'The 11 parts'], ['steps', 'Writing the steps'], ['format', 'Choosing a format'], ['rollout', 'Rolling it out'], ['mistakes', 'Common mistakes'], ['faq', 'Questions']];
  const ex = sample('support-refunds-returns', '#0f766e');
  const body = `  <div class="rm-head">${crumb([['/', 'Home'], ['/tools', 'Tools'], ['/tools/sop-maker', 'SOP Maker'], [null, 'Guide']])}<span class="rm-kick"><i></i>Guide · 8 minute read</span><h1 class="rm-h1" style="font-size:clamp(34px,4.6vw,58px)">How to write an SOP <em>people actually follow.</em></h1><p class="rm-sub" style="max-width:680px">A practical method from 20 years of running delivery teams: what goes in, how to write steps that cannot be misread, and how to keep procedures alive after launch.</p><div class="rm-toc">${toc.map(([a, b]) => `<a href="#${a}">${b}</a>`).join('')}</div></div>
  <div class="rm-ex"><div class="rm-ex-prev">${paper(ex)}<a class="rm-btn rm-btn--p" href="/tools/sop-maker/build?t=support-refunds-returns">Use this template${ARROW}</a></div><div class="rm-guide">
${sec('what', 'What an SOP is', p('A standard operating procedure is the agreed, written way a recurring task is done in your business. It names who does each step, in what order, to what standard and how the result is checked. The goal is simple: anyone trained on it gets the same result, whether it is their first week or their fifth year.') + p('Good SOPs are not paperwork for its own sake. They let you hand work over without losing quality, train new people faster, pass audits, and see where a process breaks when something goes wrong.'))}
${sec('when', 'When you need one', p('Write an SOP when a task meets any of these tests:') + list(['It happens more than once a month, or rarely but with high stakes (a data breach, a fire drill).', 'More than one person does it, or it passes between teams.', 'A mistake costs money, customers, safety or compliance.', 'A new starter would have to ask someone how it is done.', 'An auditor, investor, insurer or regulator may ask how you control it.']) + p('Start with the five processes that cause the most rework or questions. In most startups that is onboarding, invoicing, refunds, access management and product releases.'))}
${sec('parts', 'The 11 parts of a complete SOP', `<ol class="sm-parts sm-parts--g">${SECTIONS.map(([a, b], i) => `<li><span class="rm-num">${String(i + 1).padStart(2, '0')}</span><strong>${e(a)}</strong><span>${e(b)}</span></li>`).join('')}</ol>` + p('Keep the order the same in every SOP. People learn where to look, and reviewers can compare documents quickly.'))}
${sec('steps', 'Writing steps that cannot be misread', list(['<strong>Start with a verb.</strong> "Check the bank details against the vendor master file", not "Bank details check".', '<strong>One action per step.</strong> If a step has "and then", it is probably two steps.', '<strong>Name an owner.</strong> A role, not a person, so the SOP survives staff changes.', '<strong>Give numbers.</strong> "Within 1 business day", "above 5,000", "three attempts". Vague words like "promptly" or "large" get read differently by everyone.', '<strong>Say what to do when it goes wrong.</strong> Add the exception or escalation path right where it happens.', '<strong>Write for the newest person.</strong> Spell out acronyms in the definitions, and link the forms and systems they will need.']) + `<div class="rm-two"><div class="rm-quote"><strong>Weak:</strong> Process refunds promptly once approved.</div><div class="rm-quote"><strong>Strong:</strong> Issue the refund to the original payment method within 2 business days of approval, and email the customer the reference number.</div></div>`)}
${sec('format', 'Choosing a format', p('Match the format to the work. This tool uses a numbered step table with owners, plus an optional flow line, which suits most business processes.') + list(['<strong>Step list:</strong> short, linear routines such as opening a store.', '<strong>Step table with owners:</strong> processes that move between roles, like hiring or invoicing.', '<strong>Hierarchical steps:</strong> long procedures where some steps have sub-steps.', '<strong>Flowchart:</strong> processes with decisions and branches, such as ticket triage.', '<strong>Checklist:</strong> a companion to any SOP, used on the job to confirm each step was done.']))}
${sec('rollout', 'Rolling it out and keeping it alive', `<ol class="sm-ol"><li><strong>Draft</strong> with the person who does the work.</li><li><strong>Test</strong> by having someone new follow it without help. Fix every place they stop.</li><li><strong>Approve</strong> and give it an ID, version and effective date.</li><li><strong>Train</strong> everyone affected and record who was trained.</li><li><strong>Measure</strong> the KPIs for a month or two.</li><li><strong>Review</strong> on the set cycle, or after any incident, and log each change in the revision history.</li></ol>` + p('This is the Plan, Do, Check, Act cycle that ISO 9001 and Lean teams use. The SOP is the "standard" that each improvement builds on.') + `<div class="rm-callout">Keep one controlled copy, in a shared drive or wiki, and mark printed copies as uncontrolled. The most common audit finding is staff using an old version.</div>`)}
${sec('mistakes', 'Common mistakes', list(['Writing how the process should work instead of how it does work, so nobody follows it.', 'Huge documents that try to cover every case. Split them.', 'No owner, so it is never updated.', 'Steps without timing, limits or an escalation path.', 'Copying a template without replacing the placeholders and local rules.', 'Launching without training, then blaming people for not following it.'], 1))}
${sec('faq', 'Questions', faq(GUIDE_FAQ))}
  </div></div>
  <div class="rm-final"><h2>Write your first SOP now.</h2><div class="rm-btns"><a class="rm-btn rm-btn--p" href="/tools/sop-maker/build">Build my SOP${ARROW}</a><a class="rm-btn" href="/tools/sop-maker/templates">Browse templates</a></div></div>`;
  const url = SITE + '/tools/sop-maker/guide', desc = 'How to write a standard operating procedure: when you need one, the 11 parts, how to write clear steps, formats, rollout and review, and common mistakes. With free templates.';
  page('Tools-SOP-Guide.dc.html', { path: '/tools/sop-maker/guide', title: 'How to Write an SOP · Step-by-step Guide with Templates', desc, about: url + '#article', body,
    ld: [{ '@type': 'Article', '@id': url + '#article', headline: 'How to write an SOP people actually follow', description: desc, author: { '@id': SITE + '/#person' }, publisher: { '@id': SITE + '/#person' }, datePublished: '2026-10-06', dateModified: '2026-10-06', image: SITE + '/assets/og/og-tool-sop.jpg', mainEntityOfPage: url, inLanguage: 'en' },
      crumbLd(url, [['Home', '/'], ['Tools', '/tools'], ['SOP Maker', '/tools/sop-maker'], ['Guide', '/tools/sop-maker/guide']]), faqLd(url, GUIDE_FAQ)] });
}

/* ---------- data file ---------- */
const data = `/* Generated by scripts/sop-pages.cjs from scripts/sop-templates.json. Do not edit by hand. */\nwindow.SOP_DEPTS=${JSON.stringify(DEPTS)};\nwindow.SOP_TEMPLATES=${JSON.stringify(T)};\n`;
const df = path.join(ROOT, 'assets', 'sop-templates.js');
if (!fs.existsSync(df) || fs.readFileSync(df, 'utf8') !== data) { fs.writeFileSync(df, data); console.log('wrote assets/sop-templates.js'); }
console.log(`sop: ${N} templates in ${ORDER.length} departments`);
