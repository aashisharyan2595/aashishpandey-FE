// Email templates. Plain HTML with inline styles and tables so they work in Gmail, Outlook and Apple Mail.
// Each template returns { subject, html, text }. Text is plain and short, in the site's own voice.
// The brief emails adapt to the person: first name, the service they picked, where on the site they wrote from,
// their budget and timeline. All the copy for that lives in TOPICS and SOURCES below, so it is easy to edit.
const { SITE, esc, nl2br, firstName } = require('./_mail');
const BOOK = 'https://bookings.cloud.microsoft/bookwithme/user/21d85864cd9e44ad8e0b02c8924d50a0@aashishpandey.com/meetingtype/GSQs53Xp5k-9OwIn67Xxow2?anonymous&ismsaljsauthenabled&ep=mlink';
const WHATSAPP = 'https://wa.me/917558415031';
const RESUME = SITE + '/assets/Aashish-Pandey-Resume.pdf';

const NAVY = '#0b1030', AMBER = '#f5b867', INK = '#1a1420', MUTED = '#5c566a', LINE = '#e8e2d6', PAPER = '#faf7f0';

/* ---------- what each service gets: reply copy, prep list, proof links, first questions for me ---------- */
const TOPICS = {
  shopify: {
    short: 'Shopify', label: 'Shopify development',
    line: 'Shopify is the work I have done the most of, from single stores to a 15 market rollout.',
    steps: ['I read your brief and look at your current store or site, if you shared one.', 'Within 48 hours I write back with the questions that change the price, or with a scope, a timeline and a quote.', 'If a call is easier, we set one up. No pressure either way.'],
    prep: ['Your store URL, or the one you are replacing', 'Apps or integrations you rely on (ERP, reviews, subscriptions, shipping)', 'How many products, markets and languages you need'],
    proof: [['Liquid I.V.: Shopify rollout across 15 markets', '/work-liquid-iv'], ['Talenti Canada: a new site live before the product', '/work-talenti']],
    ask: ['New build, rebuild or fix? What is live today?', 'Theme or fully custom? Which apps and integrations?', 'How many markets, currencies and languages?', 'Who owns content and product data, and who will maintain it?'],
  },
  fullstack: {
    short: 'full-stack', label: 'Full-stack development',
    line: 'I build internal tools, dashboards and customer facing apps, and I stay on to run them.',
    steps: ['I read your brief and work out what the first usable version needs to do.', 'Within 48 hours I write back with questions, or with a scope, a timeline and a quote.', 'If a call is easier, we set one up. No pressure either way.'],
    prep: ['Who will use it, and what they do today instead', 'Any system it has to talk to (CRM, ERP, database, API)', 'What would make the first version a success'],
    proof: [['CEAT Specialty: taking over a live enterprise platform', '/work-ceat-specialty'], ['How this site was built', '/how-this-site-was-built']],
    ask: ['Who are the users and what is the one job it must do?', 'What data and systems does it touch?', 'Is there an existing codebase or is this greenfield?', 'Hosting, security and compliance constraints?'],
  },
  wp: {
    short: 'WordPress or Webflow', label: 'WordPress or Webflow',
    line: 'A site your team can edit without calling a developer is what I aim for.',
    steps: ['I read your brief and look at the current site, if you shared one.', 'Within 48 hours I write back with questions, or with a scope, a timeline and a quote.', 'If a call is easier, we set one up. No pressure either way.'],
    prep: ['The current site URL, or two sites you like', 'Who will edit the site day to day', 'Pages, forms and integrations you need at launch'],
    proof: [['Talenti Canada: built and maintained inside an existing platform', '/work-talenti'], ['StoryNest: SEO and performance work over seven months', '/work-storynest']],
    ask: ['New site or a rebuild? What is wrong with the current one?', 'WordPress or Webflow, or open to my advice?', 'Who edits content and how often?', 'What must be redirected or kept for SEO?'],
  },
  seo: {
    short: 'SEO', label: 'SEO consulting',
    line: 'I do SEO as an engineer and a project manager: fix what is slow or broken first, then plan content around real demand.',
    steps: ['I read your brief and take a first look at the site you shared.', 'Within 48 hours I write back with what I noticed and the questions that matter, or with a scope and a quote.', 'If a call is easier, we set one up. No pressure either way.'],
    prep: ['Your site URL and, if you have it, Search Console access (view only is fine)', 'The pages or keywords that matter most to revenue', 'What you have tried so far'],
    proof: [['StoryNest: SEO plan and performance marketing assets', '/work-storynest'], ['Free tools I built that rank on their own', '/tools']],
    ask: ['Which pages and keywords bring revenue today?', 'Is there a traffic drop, a migration or a launch behind this?', 'Search Console and Analytics access?', 'Who can ship technical fixes on your side?'],
  },
  uiux: {
    short: 'UI and UX', label: 'UI and UX design',
    line: 'I design the screens and I build them, so what you approve is what ships.',
    steps: ['I read your brief and look at what exists today.', 'Within 48 hours I write back with questions, or with a scope, a timeline and a quote.', 'If a call is easier, we set one up. No pressure either way.'],
    prep: ['Screenshots, links or a Figma file of what exists', 'Who the users are and what is not working for them', 'Brand assets, if there are any'],
    proof: [['Portfolio: sites and products I have designed and built', '/portfolio'], ['Liquid I.V.: storefront work across markets', '/work-liquid-iv']],
    ask: ['Which flow or screen is hurting the business?', 'Do designs exist, or is this from a blank page?', 'Who builds it: me or your team?', 'Brand guidelines and any research available?'],
  },
  tech: {
    short: 'tech consulting', label: 'Tech consulting',
    line: 'Most of my consulting is a clear second opinion: what to build, what to buy, and what to leave alone.',
    steps: ['I read your brief and note the decisions you are trying to make.', 'Within 48 hours I write back with questions, or with a proposed format and a quote.', 'A short call usually settles it faster than email. We can set one up.'],
    prep: ['The decision or problem, in a sentence', 'What is already built or bought', 'Who else needs to be convinced'],
    proof: [['CEAT Specialty: a zero downtime platform handover', '/work-ceat-specialty'], ['Portfolio', '/portfolio']],
    ask: ['What decision is blocked, and by when?', 'What is the current stack and who maintains it?', 'Is this advice only, or advice plus delivery?', 'Budget owner and stakeholders?'],
  },
  pm: {
    short: 'project management', label: 'Project management',
    line: 'I take over programmes that need landing: plan, vendors, risks and the weekly rhythm.',
    steps: ['I read your brief and work out where the programme stands.', 'Within 48 hours I write back with questions, or with how I would take it on and a quote.', 'If a call is easier, we set one up. No pressure either way.'],
    prep: ['What is late, at risk or unclear right now', 'Team, vendors and the decision makers involved', 'The date that matters most'],
    proof: [['CEAT Specialty: a live platform taken over with zero downtime', '/work-ceat-specialty'], ['StoryNest: seven months as project manager and architect', '/work-storynest']],
    ask: ['What is the programme and what is at risk?', 'Team size, vendors and who decides?', 'The deadline that cannot move?', 'Embedded for weeks or a fixed outcome?'],
  },
  other: {
    short: 'project', label: 'Something else',
    line: 'If it is a mix of product, design and engineering, it is probably my kind of problem.',
    steps: ['I read your brief and work out which part is the real problem.', 'Within 48 hours I write back with questions, or with a scope, a timeline and a quote.', 'If a call is easier, we set one up. No pressure either way.'],
    prep: ['What you are trying to achieve, in a sentence', 'Anything that already exists', 'The date you are working toward'],
    proof: [['Portfolio: client sites and career', '/portfolio'], ['Case studies', '/case-studies']],
    ask: ['What outcome do they want?', 'What exists today?', 'Where do they need me: advice, build or both?', 'Deadline and budget owner?'],
  },
};
// one short phrase per service for "reply with ..." in the visitor email
const WANT = { shopify: 'your store URL and the apps you rely on', fullstack: 'who will use it and what it has to connect to', wp: 'the current site URL and who edits it', seo: 'your site URL, and Search Console access if you have it (view only is fine)', uiux: 'screenshots or a link to what exists today', tech: 'the decision you are trying to make, in a sentence', pm: 'what is late or at risk, and the date that matters', other: 'what you want to achieve and anything that already exists' };
const SERVICE_TOPIC = { 'Shopify development': 'shopify', 'Full-stack development': 'fullstack', 'WordPress or Webflow': 'wp', 'SEO consulting': 'seo', 'UI and UX design': 'uiux', 'Tech consulting': 'tech', 'Project management': 'pm', 'Something else': 'other' };

/* ---------- where on the site they wrote from ---------- */
const SOURCES = {
  contact: { label: 'the contact page', hello: 'Thanks for reaching out through the contact page.' },
  tools: { label: 'the Tools page', hello: 'Thanks for the note. It is good to hear from someone who found me through the tools.' },
  ride: { label: 'the interactive ride', hello: 'Thanks for riding all the way to the campfire. Most people do not.' },
  'shopify-developer': { label: 'the Shopify developer page', hello: 'Thanks for writing from the Shopify page.' },
  'full-stack-developer': { label: 'the full-stack developer page', hello: 'Thanks for writing from the full-stack page.' },
  'wordpress-webflow-developer': { label: 'the WordPress and Webflow page', hello: 'Thanks for writing from the WordPress and Webflow page.' },
  'seo-consultant': { label: 'the SEO consultant page', hello: 'Thanks for writing from the SEO page.' },
  'ui-ux-design': { label: 'the UI and UX design page', hello: 'Thanks for writing from the design page.' },
  'tech-consultant': { label: 'the tech consultant page', hello: 'Thanks for writing from the tech consulting page.' },
  'freelance-project-manager': { label: 'the freelance project manager page', hello: 'Thanks for writing from the project management page.' },
  services: { label: 'the Services page', hello: 'Thanks for writing from the Services page.' },
  portfolio: { label: 'the portfolio page', hello: 'Thanks for looking through my work and getting in touch.' },
};
const PAGE_SOURCE = { '/': 'ride', '/contact': 'contact', '/tools': 'tools', '/services': 'services', '/portfolio': 'portfolio', '/case-studies': 'portfolio' };
// an explicit source wins (pages that share one form set it); otherwise the page path says where the form lives
function sourceOf(d) {
  const slug = String(d.source || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (SOURCES[slug]) return { key: slug, ...SOURCES[slug] };
  const path = String(d.page || '').split('?')[0].replace(/\/$/, '') || '/';
  const k = PAGE_SOURCE[path] || path.replace(/^\//, '');
  if (SOURCES[k]) return { key: k, ...SOURCES[k] };
  if (/^work-/.test(k)) return { key: k, label: 'a case study page', hello: 'Thanks for reading the case study and getting in touch.' };
  return { key: k || 'site', label: 'the site', hello: 'Thanks for getting in touch.' };
}

/* ---------- reading the brief ---------- */
const BUDGET_RANK = { 'Under $1,000': 1, '$1,000 to $5,000': 2, '$5,000 to $15,000': 3, '$15,000 to $50,000': 4, 'More than $50,000': 5 };
function read(d) {
  const t = TOPICS[SERVICE_TOPIC[d.service]] || TOPICS.other;
  const src = sourceOf(d);
  const rank = BUDGET_RANK[d.budget] || 0;
  const urgent = d.timeline === 'As soon as possible';
  const priority = rank >= 4 || (rank >= 3 && urgent) ? 'High' : (rank >= 3 || urgent || d.company ? 'Medium' : 'Standard');
  let host = '', siteUrl = '';
  try {
    if (d.website_url) { siteUrl = /^https?:/i.test(d.website_url) ? d.website_url : 'https://' + d.website_url; host = new URL(siteUrl).hostname.replace(/^www\./, ''); }
  } catch (e) { host = ''; siteUrl = ''; }
  return { t, src, rank, urgent, priority, host, siteUrl, first: firstName(d.name) };
}
const PRIORITY_COLOR = { High: '#b4421c', Medium: '#9a5418', Standard: '#5c566a' };

/* ---------- building blocks ---------- */
function layout({ preheader, title, body, footer, tag }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f3eee4;font-family:Arial,Helvetica,sans-serif;color:${INK};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3eee4;"><tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${LINE};">
<tr><td style="background:${NAVY};padding:22px 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td><span style="font-size:17px;font-weight:700;letter-spacing:-.01em;color:#f4efe6;">Aashish Pandey</span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${AMBER};margin-left:8px;"></span><br><span style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#aaa4b8;">Project manager and creative technologist</span></td>${tag ? `<td align="right" style="vertical-align:top;">${tag}</td>` : ''}</tr></table></td></tr>
<tr><td style="padding:30px 28px 8px;font-size:16px;line-height:1.6;color:${INK};">${body}</td></tr>
<tr><td style="padding:18px 28px 28px;border-top:1px solid ${LINE};font-size:12.5px;line-height:1.6;color:${MUTED};">${footer}</td></tr>
</table>
<p style="margin:14px 0 0;font-size:12px;color:#8a8398;">Aashish Pandey · Bangalore, India · <a href="${SITE}" style="color:#8a8398;">aashishpandey.com</a></p>
</td></tr></table></body></html>`;
}
const p = (t) => `<p style="margin:0 0 16px;">${t}</p>`;
const h = (t) => `<p style="margin:22px 0 8px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${MUTED};">${esc(t)}</p>`;
const button = (href, label, ghost) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 10px 14px 0;display:inline-table;"><tr><td style="${ghost ? `border:1.5px solid ${INK};` : `background:${AMBER};`}border-radius:999px;"><a href="${esc(href)}" style="display:inline-block;padding:${ghost ? '11px 22px' : '13px 24px'};font-size:15px;font-weight:700;color:${INK};text-decoration:none;">${esc(label)}</a></td></tr></table>`;
const row = (k, v, raw) => v ? `<tr><td style="padding:9px 14px 9px 0;font-size:13px;color:${MUTED};vertical-align:top;white-space:nowrap;border-bottom:1px solid ${LINE};">${esc(k)}</td><td style="padding:9px 0;font-size:15px;color:${INK};border-bottom:1px solid ${LINE};">${raw ? v : esc(v)}</td></tr>` : '';
const quote = (t) => `<div style="margin:6px 0 22px;padding:14px 16px;background:${PAPER};border-left:3px solid ${AMBER};border-radius:6px;font-size:15px;line-height:1.65;">${nl2br(t)}</div>`;
const list = (items, ordered) => { const tag = ordered ? 'ol' : 'ul'; return `<${tag} style="margin:0 0 18px;padding-left:20px;line-height:1.7;">${items.map((i) => `<li style="margin:0 0 4px;">${esc(i)}</li>`).join('')}</${tag}>`; };
const links = (pairs) => `<ul style="margin:0 0 18px;padding-left:20px;line-height:1.7;">${pairs.map(([l, u]) => `<li style="margin:0 0 4px;"><a href="${SITE}${u}" style="color:#9a5418;font-weight:600;">${esc(l)}</a></li>`).join('')}</ul>`;
const pill = (text, color) => `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${color};color:#ffffff;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${esc(text)}</span>`;

/* ---------- light layout: emails to visitors ----------
   Gmail files heavy HTML (banners, buttons, many links, hidden preheaders) under Promotions and Outlook scores it as spam.
   Mail that people receive from me reads like a note from a person: plain paragraphs, one or two links, no images. */
const lp = (t) => `<p style="margin:0 0 14px;">${t}</p>`;
const lh = (t) => `<p style="margin:18px 0 6px;"><b>${esc(t)}</b></p>`;
const lul = (items, ordered) => { const tag = ordered ? 'ol' : 'ul'; return `<${tag} style="margin:0 0 14px;padding-left:22px;">${items.map((i) => `<li style="margin:0 0 3px;">${i}</li>`).join('')}</${tag}>`; };
const lightLayout = ({ title, body, footer }) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222222;background:#ffffff;"><div style="max-width:560px;">${body}<p style="margin:22px 0 0;font-size:12.5px;line-height:1.6;color:#6b6b6b;">${footer}</p></div></body></html>`;
const alink = (href, label) => `<a href="${esc(href)}">${esc(label)}</a>`;

/* ---------- 1. admin: a new brief arrived ---------- */
function adminBrief(d) {
  const r = read(d);
  const bits = [r.t.short, d.budget && d.budget !== 'Not sure yet' ? d.budget : '', r.urgent ? 'ASAP' : ''].filter(Boolean).join(' · ');
  const subject = `${r.priority === 'High' ? '[High] ' : ''}${d.name}: ${bits} (via ${r.src.label.replace(/^the /, '')})`;
  const draftBody = `Hi ${r.first},\n\nThanks for your brief${r.src.key === 'contact' ? '' : ' from ' + r.src.label}. `
    + `I have read it${r.host ? ' and had a first look at ' + r.host : ''}.\n\n`
    + `A few questions so I can scope this properly:\n${r.t.ask.slice(0, 3).map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\n`
    + `If a call is easier, book a time here: ${BOOK}\n\nAashish`;
  const mailto = `mailto:${d.email}?subject=${encodeURIComponent('Re: your ' + r.t.short + ' brief')}&body=${encodeURIComponent(draftBody)}`;
  const why = [r.rank >= 3 ? 'budget is ' + d.budget : '', r.urgent ? 'they want it as soon as possible' : '', d.company ? 'it came with a company name' : ''].filter(Boolean).join(', ');
  const html = layout({
    tag: pill(r.priority + ' priority', PRIORITY_COLOR[r.priority]),
    preheader: `${d.name}${d.company ? ' from ' + d.company : ''} wants ${r.t.label}${d.budget ? ', ' + d.budget : ''}.`, title: subject,
    body: p(`<strong>${esc(d.name)}</strong>${d.company ? ' from <strong>' + esc(d.company) + '</strong>' : ''} sent a brief from <strong>${esc(r.src.label)}</strong>. Reply to this email and it goes straight to ${esc(r.first)}.`)
      + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">${row('Name', d.name)}${row('Email', `<a href="mailto:${esc(d.email)}" style="color:#9a5418;">${esc(d.email)}</a>`, true)}${row('Company', d.company)}${r.siteUrl ? row('Website', `<a href="${esc(r.siteUrl)}" style="color:#9a5418;">${esc(r.host)}</a>`, true) : row('Website', d.website_url)}${row('Looking for', r.t.label)}${row('Budget', d.budget)}${row('Timeline', d.timeline)}${row('Came from', r.src.label)}</table>`
      + h('Their message') + quote(d.message)
      + button(mailto, `Reply to ${r.first} (draft ready)`) + button(BOOK, 'Offer a call', true)
      + h('First questions to ask') + list(r.t.ask)
      + (why && r.priority !== 'Standard' ? p(`<span style="color:${MUTED};font-size:14px;">${r.priority === 'High' ? 'Flagged high' : 'Worth a quick look'}: ${esc(why)}.</span>`) : ''),
    footer: `Sent ${esc(d.when)} from ${esc(d.page || '/contact')}${d.ref ? ', arriving from ' + esc(d.ref) : ''}. The sender agreed to the privacy policy. Their confirmation email says you will reply within 48 hours.`,
  });
  const text = `${r.priority} priority brief from ${d.name} <${d.email}>, via ${r.src.label}\n${d.company ? 'Company: ' + d.company + '\n' : ''}${d.website_url ? 'Website: ' + d.website_url + '\n' : ''}Looking for: ${r.t.label}\n${d.budget ? 'Budget: ' + d.budget + '\n' : ''}${d.timeline ? 'Timeline: ' + d.timeline + '\n' : ''}\n${d.message}\n\nFirst questions:\n${r.t.ask.map((q) => '- ' + q).join('\n')}\n\nReply to this email to answer ${d.name}. They were told you reply within 48 hours.`;
  return { subject, html, text };
}

/* ---------- 2. user: we got your brief (kept short on purpose) ---------- */
function userBriefConfirmation(d, unsubUrl) {
  const r = read(d);
  const subject = r.urgent ? `Got it, ${r.first}. I will look at yours first` : `Got your brief, ${r.first}`;
  // one personal line, the most useful one
  const note = r.urgent ? 'Since it is urgent, yours goes to the front of the queue.'
    : r.host ? `I will look at ${r.host} before I reply.`
    : d.company ? `I noted that it is for ${d.company}.` : '';
  const want = WANT[SERVICE_TOPIC[d.service]] || WANT.other;
  const best = r.t.proof[0];
  const quoted = String(d.message).replace(/\s+/g, ' ').trim();
  const snippet = quoted.length > 160 ? quoted.slice(0, 157) + '...' : quoted;
  const open = r.src.key === 'ride' ? 'Thanks for riding all the way to the campfire.' : `Thanks for your ${r.t.short} brief.`;
  const html = lightLayout({
    title: subject,
    body: lp(`Hi ${esc(r.first)},`)
      + lp(`${esc(open)} It reached me and I read every one myself. ${esc(note)}`.trim())
      + lp(`I will reply within 48 hours with questions, or with a scope and a quote. If you can, reply with ${esc(want)}.`)
      + lp(`Closest work to yours: ${alink(SITE + best[1], best[0])}. Prefer to talk? ${alink(BOOK, 'Book 20 minutes')} or just reply.`)
      + `<p style="margin:0 0 14px;color:#6b6b6b;">You wrote: &ldquo;${esc(snippet)}&rdquo;</p>`
      + lp('Aashish'),
    footer: `Sent because you used the form on ${esc(r.src.label)}. No mailing list. ${unsubUrl ? alink(unsubUrl, 'Unsubscribe') + ' · ' : ''}${alink(SITE + '/privacy', 'Privacy')}`,
  });
  const text = `Hi ${r.first},\n\n${open} It reached me and I read every one myself.${note ? ' ' + note : ''}\n\nI will reply within 48 hours with questions, or with a scope and a quote. If you can, reply with ${want}.\n\nClosest work to yours: ${best[0]}: ${SITE}${best[1]}\nPrefer to talk? Book 20 minutes: ${BOOK}\n\nYou wrote: "${snippet}"\n\nAashish\n\nSent because you used the form on ${r.src.label}. No mailing list.${unsubUrl ? '\nUnsubscribe: ' + unsubUrl : ''}\nPrivacy: ${SITE}/privacy`;
  return { subject, html, text };
}

/* ---------- 3. subscriber: please confirm ---------- */
function subscribeConfirm(url, src, unsubUrl) {
  const where = { tools: 'the Tools page', portfolio: 'the portfolio page' }[src] || 'aashishpandey.com';
  const subject = 'Please confirm your subscription';
  const html = lightLayout({
    title: subject,
    body: lp('Hi,') + lp(`Please confirm you want emails from aashishpandey.com: ${alink(url, 'confirm my subscription')}.`)
      + lp('The link works for 48 hours. If it was not you, ignore this email and nothing happens.') + lp('Aashish'),
    footer: `You get this because this address was typed into the subscribe form on ${esc(where)}. ${unsubUrl ? alink(unsubUrl, 'Unsubscribe') + ' · ' : ''}${alink(SITE + '/privacy', 'Privacy policy')}`,
  });
  const text = `Hi,\n\nSomeone, hopefully you, asked to get emails from aashishpandey.com. Open this link to say yes:\n${url}\n\nThe link works for 48 hours. If it was not you, ignore this email. Nothing happens.\n\n${unsubUrl ? 'Unsubscribe: ' + unsubUrl + '\n' : ''}Privacy: ${SITE}/privacy`;
  return { subject, html, text };
}

/* ---------- 4. subscriber: welcome (adapts to where they signed up) ---------- */
const WELCOME = {
  tools: { hello: 'Most used tools:', pairs: [['QR code generator', '/tools/qr-code-generator'], ['Invoice generator', '/tools/invoice-generator'], ['Password generator', '/tools/password-generator'], ['Image resizer', '/tools/image-resizer']] },
  portfolio: { hello: 'Where to start:', pairs: [['Liquid I.V.: Shopify across 15 markets', '/work-liquid-iv'], ['Talenti Canada', '/work-talenti'], ['All case studies', '/case-studies']] },
  _: { hello: 'Where to start:', pairs: [['The interactive ride (best on a laptop)', '/'], ['Case studies', '/case-studies'], ['Free tools', '/tools']] },
};
function subscribeWelcome(unsubUrl, src) {
  const w = WELCOME[src] || WELCOME._;
  const subject = 'You are subscribed';
  const html = lightLayout({
    title: subject,
    body: lp('Hi,') + lp('You are on the list. I only write when I have published something worth reading, never to fill space.')
      + lp(esc(w.hello)) + lul(w.pairs.slice(0, 3).map(([l, u]) => alink(SITE + u, l)))
      + lp('Reply any time. It comes to me.') + lp('Aashish'),
    footer: `${alink(unsubUrl, 'Unsubscribe')} · ${alink(SITE + '/privacy', 'Privacy')}`,
  });
  const text = `Hi,\n\nYou are on the list. I only write when I have published something worth reading, never to fill space.\n\n${w.hello}\n${w.pairs.slice(0, 3).map(([l, u]) => `- ${l}: ${SITE}${u}`).join('\n')}\n\nReply any time. It comes to me.\n\nAashish\n\nUnsubscribe: ${unsubUrl}\nPrivacy: ${SITE}/privacy`;
  return { subject, html, text };
}

/* ---------- 5. admin: new subscriber / unsubscribe ---------- */
function adminSubscriber(email, kind = 'subscribed', src) {
  const subject = kind === 'subscribed' ? `New subscriber: ${email}` : `Unsubscribed: ${email}`;
  const html = layout({
    preheader: subject, title: subject,
    body: p(kind === 'subscribed' ? `<strong>${esc(email)}</strong> confirmed their subscription${src && src !== '_' ? ' (signed up from the <strong>' + esc(src) + '</strong> page)' : ''} and is now in your Resend audience.` : `<strong>${esc(email)}</strong> unsubscribed. They are marked as unsubscribed in your Resend audience.`),
    footer: 'This is an automatic note from the site.',
  });
  return { subject, html, text: subject };
}

module.exports = { adminBrief, userBriefConfirmation, subscribeConfirm, subscribeWelcome, adminSubscriber, TOPICS, SERVICE_TOPIC };
