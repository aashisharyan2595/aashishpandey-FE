// POST /api/subscribe  { email, hp, ts }  → sends a confirmation link (double opt-in). The address joins the audience only after the click.
const { env, sendMail, clean, validEmail, parseBody, clientIp, limited, link } = require('./_mail');
const T = require('./_templates');
const store = require('./_store');
const turnstile = require('./_turnstile');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  const b = parseBody(req), email = clean(b.email, 254).toLowerCase();
  // where they signed up decides which welcome email they get (only these two are told apart)
  const pg = clean(b.page, 80), src = /^\/tools/.test(pg) ? 'tools' : /^\/(portfolio|case-studies|work-)/.test(pg) ? 'portfolio' : '';
  const age = Date.now() - Number(b.ts || 0);
  if (clean(b.hp, 200) || !(age >= 2000 && age <= 864e5)) return res.status(200).json({ ok: true, message: 'Check your inbox for a confirmation link.' });
  if (!validEmail(email)) return res.status(400).json({ error: 'That email address does not look right.' });
  const cap = await turnstile.check(b.cf, clientIp(req));
  if (cap === 'bad') return res.status(200).json({ ok: true, message: 'Almost done. Check your inbox and click the link to confirm.' });   // a bot learns nothing
  if (await limited('subaddr', email, 3, 86400)) return res.status(429).json({ error: 'A confirmation was already sent to that address today. Check your inbox and spam folder.' });
  if (await limited('sub', clientIp(req), 5, 3600)) return res.status(429).json({ error: 'Too many tries. Please wait an hour and try again.' });
  if (!env().key) return res.status(503).json({ error: 'The newsletter is not connected yet. Please try again later.' });
  try { await store.subscriber(email, { status: 'pending', page: pg, source: src }); } catch (e) { console.error('subscribe: could not save', e.message); }
  try {
    const un = link('unsubscribe', email), m = T.subscribeConfirm(link('confirm', email, src ? '&s=' + src : ''), src, un);
    await sendMail({ to: email, subject: m.subject, html: m.html, text: m.text, replyTo: env().admins, headers: { 'List-Unsubscribe': `<${un}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
  } catch (e) {
    if (e.code === 'NOCONFIG') return res.status(503).json({ error: 'The newsletter is not connected yet. Please try again later.' });
    console.error('subscribe: mail failed', e.message);
    return res.status(502).json({ error: 'Could not send the confirmation email. Please try again later.' });
  }
  return res.status(200).json({ ok: true, message: 'Almost done. Check your inbox and click the link to confirm.' });
};
