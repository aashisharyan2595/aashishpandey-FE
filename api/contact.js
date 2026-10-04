// POST /api/contact  { name, email, company?, website_url?, service?, budget?, timeline?, message, consent, hp, ts }
// → 200 { ok: true } | 4xx/5xx { error }. Sends the brief to the admin (reply-to the sender) and a confirmation to the sender.
const { env, sendMail, clean, validEmail, parseBody, clientIp, limited, link } = require('./_mail');
const T = require('./_templates');
const store = require('./_store');
const crypto = require('crypto');
const spam = require('./_spam');
const turnstile = require('./_turnstile');
const cfg = require('./_adm/cfg');
const notify = require('./_adm/notify');

const SERVICES = ['Shopify development', 'Full-stack development', 'WordPress or Webflow', 'SEO consulting', 'UI and UX design', 'Tech consulting', 'Project management', 'Something else'];
const BUDGETS = ['Not sure yet', 'Under $1,000', '$1,000 to $5,000', '$5,000 to $15,000', '$15,000 to $50,000', 'More than $50,000'];
const TIMELINES = ['As soon as possible', 'Within a month', 'In 1 to 3 months', 'No fixed date'];
const pick = (v, list) => (list.includes(v) ? v : '');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  const b = parseBody(req);
  // bots: a hidden field that people never fill in, or a form sent within 3 seconds of loading
  const age = Date.now() - Number(b.ts || 0);
  if (clean(b.hp, 200) || !(age >= 3000 && age <= 864e5)) return res.status(200).json({ ok: true });

  const d = {
    name: clean(b.name, 80), email: clean(b.email, 254).toLowerCase(), company: clean(b.company, 120), website_url: clean(b.website_url, 200),
    service: pick(b.service, SERVICES), budget: pick(b.budget, BUDGETS), timeline: pick(b.timeline, TIMELINES), message: clean(b.message, 4000),
    page: clean(b.page, 80), source: clean(b.source, 40), ref: clean(b.ref, 120), when: new Date().toUTCString(),
  };
  if (d.name.length < 2) return res.status(400).json({ error: 'Please add your name.' });
  if (!validEmail(d.email)) return res.status(400).json({ error: 'That email address does not look right.' });
  if (d.message.length < 10) return res.status(400).json({ error: 'Please write a few words about the project.' });
  if (b.consent !== true) return res.status(400).json({ error: 'Please tick the box to agree to the privacy policy.' });
  // spam: scored first. A high score is saved as "spam" in the admin (so a false alarm can be rescued) but nothing is emailed,
  // and the sender sees the normal success message so a bot learns nothing.
  const ip = clientIp(req), rules = store.enabled() ? await cfg.get('spam', spam.DEFAULTS) : spam.DEFAULTS;   // rules you edit in the admin (Spam tab)
  const sp = spam.score(d, req, rules), cap = await turnstile.check(b.cf, ip), trusted = spam.listed(d.email, rules.allow);
  if (!trusted) { if (cap === 'bad') { sp.score += 4; sp.flags.push('captcha failed'); } else if (cap === 'missing') { sp.score += 3; sp.flags.push('no captcha token'); } }
  if (sp.score >= (rules.threshold || spam.SPAM_AT)) {
    try { await store.add({ type: 'brief', status: 'spam', ...d, spamScore: sp.score, flags: sp.flags, mail: { admin: 'skipped', user: 'skipped' } }); } catch (e) { console.error('contact: could not save spam', e.message); }
    return res.status(200).json({ ok: true });
  }
  // the same person may send the same brief up to 3 times a day (people retry, or add a detail); after that it is a repeat
  const same = crypto.createHash('sha256').update(d.email + '|' + d.message.toLowerCase().replace(/\s+/g, ' ')).digest('hex').slice(0, 24);
  if (await limited('dup', same, 3, 86400)) return res.status(429).json({ error: 'You have already sent this exact message three times today. I have it and will reply soon. If something changed, edit the message and send again.' });
  if (await limited('contactmail', d.email, 6, 86400)) return res.status(429).json({ error: 'That is a lot of briefs from one address today. I have them all and will reply soon.' });
  if (await limited('contactday', ip, 15, 86400)) return res.status(429).json({ error: 'Too many messages from this connection today. Please email hello@aashishpandey.com.' });
  if (await limited('contact', ip, 5, 3600)) return res.status(429).json({ error: 'Too many messages from this connection. Please try again in an hour, or email hello@aashishpandey.com.' });

  // save first: the admin page keeps every brief even if the emails below fail
  let rec = null;
  try { rec = await store.add({ type: 'brief', status: 'new', ...d, ...(sp.score ? { spamScore: sp.score, flags: sp.flags } : {}), mail: {} }); } catch (e) { console.error('contact: could not save', e.message); }
  if (b.news === true) try { await store.autoSubscribe(d.email, (d.name.split(/\s+/)[0] || '').slice(0, 60), 'brief'); } catch (e) { console.error('contact: could not add to the list', e.message); }
  const mark = (mail) => (rec ? store.update(rec.id, { mail }).catch((e) => console.error('contact: status not saved', e.message)) : null);
  try {   // push alert (Telegram, Slack or a webhook) for briefs at or above the priority you chose in the admin
    const pri = T.priorityOf(d), al = store.enabled() ? await cfg.get('alerts', { min: 'high' }) : { min: 'high' };
    const need = { off: 99, high: 3, medium: 2, all: 1 }[al.min] || 3;
    if ({ Standard: 1, Medium: 2, High: 3 }[pri] >= need) await notify.send(`New ${pri} brief: ${d.name}${d.company ? ' (' + d.company + ')' : ''}\n${d.service || 'Something else'}${d.budget ? ' · ' + d.budget : ''}${d.timeline ? ' · ' + d.timeline : ''}\n${String(d.message).slice(0, 200)}${d.message.length > 200 ? '...' : ''}\n${d.email}`);
  } catch (e) { console.error('contact: alert failed', e.message); }
  try {
    const a = T.adminBrief(d);
    await sendMail({ to: env().admins, replyTo: d.email, subject: a.subject, html: a.html, text: a.text, kind: 'admin-alert', ref: rec && rec.id });
    await mark({ admin: 'sent' });
  } catch (e) {
    console.error('contact: admin mail failed', e.message);
    await mark({ admin: 'failed', adminError: String(e.message).slice(0, 200) });
    if (rec) return res.status(200).json({ ok: true });   // saved, so the visitor is not told it failed. It shows in the admin with a red flag.
    if (e.code === 'NOCONFIG') return res.status(503).json({ error: 'The form is not connected yet. Please email hello@aashishpandey.com.' });
    return res.status(502).json({ error: 'Could not send your message. Please email hello@aashishpandey.com.' });
  }
  try {   // the confirmation is a courtesy: the brief already arrived, so a failure here is not an error for the visitor
    const un = link('unsubscribe', d.email), u = T.userBriefConfirmation(d, un);
    await sendMail({ to: d.email, subject: u.subject, html: u.html, text: u.text, replyTo: env().admins, headers: { 'List-Unsubscribe': `<${un}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }, kind: 'visitor-confirmation', ref: rec && rec.id });
    await mark({ user: 'sent' });
  } catch (e) { console.error('contact: confirmation mail failed', e.message); await mark({ user: 'failed', userError: String(e.message).slice(0, 200) }); }
  return res.status(200).json({ ok: true });
};
