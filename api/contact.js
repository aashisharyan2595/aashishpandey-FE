// POST /api/contact  { name, email, company?, website_url?, service?, budget?, timeline?, message, consent, hp, ts }
// → 200 { ok: true } | 4xx/5xx { error }. Sends the brief to the admin (reply-to the sender) and a confirmation to the sender.
const { env, sendMail, clean, validEmail, parseBody, clientIp, limited, link } = require('./_mail');
const T = require('./_templates');

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
  if (await limited('contact', clientIp(req), 5, 3600)) return res.status(429).json({ error: 'Too many messages from this connection. Please try again in an hour, or email hello@aashishpandey.com.' });

  try {
    const a = T.adminBrief(d);
    await sendMail({ to: env().admins, replyTo: d.email, subject: a.subject, html: a.html, text: a.text });
  } catch (e) {
    if (e.code === 'NOCONFIG') return res.status(503).json({ error: 'The form is not connected yet. Please email hello@aashishpandey.com.' });
    console.error('contact: admin mail failed', e.message);
    return res.status(502).json({ error: 'Could not send your message. Please email hello@aashishpandey.com.' });
  }
  try {   // the confirmation is a courtesy: the brief already arrived, so a failure here is not an error for the visitor
    const un = link('unsubscribe', d.email), u = T.userBriefConfirmation(d, un);
    await sendMail({ to: d.email, subject: u.subject, html: u.html, text: u.text, replyTo: env().admins, headers: { 'List-Unsubscribe': `<${un}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
  } catch (e) { console.error('contact: confirmation mail failed', e.message); }
  return res.status(200).json({ ok: true });
};
