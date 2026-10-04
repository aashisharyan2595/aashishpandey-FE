// POST /api/subscribe  { email, hp, ts }  → subscribes the address at once and sends a welcome email with an unsubscribe link (no confirmation step).
const { env, sendMail, clean, validEmail, parseBody, clientIp, limited, link } = require('./_mail');
const T = require('./_templates');
const store = require('./_store');
const turnstile = require('./_turnstile');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  const b = parseBody(req), email = clean(b.email, 254).toLowerCase();
  // where they signed up decides which welcome email they get (only these two are told apart)
  let name = clean(b.name, 60); if (/https?:|www\.|@|[<>]/i.test(name)) name = '';   // a name is a name: no links or addresses in it
  const pg = clean(b.page, 80), src = /^\/tools/.test(pg) ? 'tools' : /^\/(portfolio|case-studies|work-)/.test(pg) ? 'portfolio' : '';
  const age = Date.now() - Number(b.ts || 0);
  if (clean(b.hp, 200) || !(age >= 2000 && age <= 864e5)) return res.status(200).json({ ok: true, message: 'You are subscribed. A welcome email is on its way.' });
  if (!validEmail(email)) return res.status(400).json({ error: 'That email address does not look right.' });
  const cap = await turnstile.check(b.cf, clientIp(req));
  if (cap === 'bad') return res.status(200).json({ ok: true, message: 'You are subscribed. A welcome email is on its way.' });   // a bot learns nothing
  if (await limited('subaddr', email, 3, 86400)) return res.status(429).json({ error: 'That address was already signed up today. Check your inbox and spam folder.' });
  if (await limited('sub', clientIp(req), 5, 3600)) return res.status(429).json({ error: 'Too many tries. Please wait an hour and try again.' });
  if (!env().key || !store.enabled()) return res.status(503).json({ error: 'The newsletter is not connected yet. Please try again later.' });
  // No confirmation step: the address is subscribed straight away, and the welcome email carries the unsubscribe link.
  let prior = null;
  try { prior = await store.byEmail(email); await store.subscriber(email, { status: 'subscribed', confirmed: Date.now(), via: 'form', page: pg, source: src, ...(name ? { name } : {}) }); }
  catch (e) { console.error('subscribe: could not save', e.message); return res.status(502).json({ error: 'Could not sign you up right now. Please try again in a minute.' }); }
  if (prior && prior.status === 'subscribed') return res.status(200).json({ ok: true, message: 'You are already subscribed. Thank you.' });   // no second email to an address that is already on the list
  try {
    const un = link('unsubscribe', email), m = T.subscribeWelcome(un, src, name);
    await sendMail({ to: email, subject: m.subject, html: m.html, text: m.text, replyTo: env().admins, headers: { 'List-Unsubscribe': `<${un}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }, kind: 'welcome' });
  } catch (e) { console.error('subscribe: welcome mail failed', e.message); }   // they are on the list; the failure shows in the Mail tab
  try { const n = T.adminSubscriber(email, 'subscribed', src, name); await sendMail({ to: env().admins, subject: n.subject, html: n.html, text: n.text, kind: 'admin-note' }); } catch (e) { /* a courtesy note */ }
  return res.status(200).json({ ok: true, message: 'You are subscribed. A welcome email is on its way.' });
};
