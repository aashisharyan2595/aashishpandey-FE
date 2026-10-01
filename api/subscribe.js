// POST /api/subscribe  { email, hp, ts }  → sends a confirmation link (double opt-in). The address joins the audience only after the click.
const { env, sendMail, clean, validEmail, parseBody, clientIp, limited, link } = require('./_mail');
const T = require('./_templates');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  const b = parseBody(req), email = clean(b.email, 254).toLowerCase();
  const age = Date.now() - Number(b.ts || 0);
  if (clean(b.hp, 200) || !(age >= 2000 && age <= 864e5)) return res.status(200).json({ ok: true, message: 'Check your inbox for a confirmation link.' });
  if (!validEmail(email)) return res.status(400).json({ error: 'That email address does not look right.' });
  if (await limited('sub', clientIp(req), 5, 3600)) return res.status(429).json({ error: 'Too many tries. Please wait an hour and try again.' });
  if (!env().audience) return res.status(503).json({ error: 'The newsletter is not connected yet. Please try again later.' });
  try {
    const m = T.subscribeConfirm(link('confirm', email));
    await sendMail({ to: email, subject: m.subject, html: m.html, text: m.text, replyTo: env().admin });
  } catch (e) {
    if (e.code === 'NOCONFIG') return res.status(503).json({ error: 'The newsletter is not connected yet. Please try again later.' });
    console.error('subscribe: mail failed', e.message);
    return res.status(502).json({ error: 'Could not send the confirmation email. Please try again later.' });
  }
  return res.status(200).json({ ok: true, message: 'Almost done. Check your inbox and click the link to confirm.' });
};
