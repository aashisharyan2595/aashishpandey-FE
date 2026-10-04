// GET  /api/newsletter?a=confirm|unsubscribe&e=<email>&x=<time>&t=<token>   (links in the emails)
// POST the same URL = one-click unsubscribe (List-Unsubscribe-Post). Shows a small page; the list itself is kept in the admin database.
const { env, sendMail, clean, validEmail, verify, link, SITE, esc } = require('./_mail');
const T = require('./_templates');
const store = require('./_store');

const page = (title, msg) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} · Aashish Pandey</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#070916;color:#f4efe6;font-family:Geist,system-ui,Arial,sans-serif;padding:24px;box-sizing:border-box;">
<div style="max-width:460px;text-align:center;"><h1 style="margin:0 0 12px;font-size:30px;letter-spacing:-.03em;">${esc(title)}</h1><p style="margin:0 0 26px;font-size:17px;line-height:1.6;color:#cfc9d8;">${msg}</p>
<a href="${SITE}" style="display:inline-block;padding:13px 24px;border-radius:999px;background:#f5b867;color:#1a1420;font-weight:700;text-decoration:none;">Back to the site</a></div></body></html>`;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const q = req.query || {}, a = clean(q.a, 20), email = clean(q.e, 254).toLowerCase(), ts = clean(q.x, 20), tok = clean(q.t, 64), src = ['tools', 'portfolio'].includes(q.s) ? q.s : '';
  if (!['confirm', 'unsubscribe'].includes(a) || !validEmail(email)) return res.status(400).send(page('Link not valid', 'This link is not valid. If you wanted to subscribe, use the form on the site again.'));
  if (!verify(a, email, ts, tok, a === 'confirm' ? 48 * 3600e3 : 0)) {
    return res.status(400).send(page(a === 'confirm' ? 'Link expired' : 'Link not valid', a === 'confirm' ? 'This confirmation link has expired or was changed. Please subscribe again from the site.' : 'This link is not valid. Reply to any of my emails and I will remove you by hand.'));
  }
  if (!store.enabled()) return res.status(503).send(page('Not connected', 'This is not connected yet. Please try again later.'));
  try {
    if (a === 'confirm') {   // links from older emails: subscribe the address, no further steps
      let name = '', prior = null;
      try { prior = await store.byEmail(email); const rec = await store.subscriber(email, { status: 'subscribed', confirmed: Date.now(), source: src }); name = (rec && rec.name) || ''; } catch (e) { console.error('newsletter: could not save', e.message); throw e; }
      if (!(prior && prior.status === 'subscribed')) {
        try {
          const u = link('unsubscribe', email), w = T.subscribeWelcome(u, src, name);
          await sendMail({ to: email, subject: w.subject, html: w.html, text: w.text, replyTo: env().admins, headers: { 'List-Unsubscribe': `<${u}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }, kind: 'welcome' });
        } catch (e) { console.error('newsletter: welcome mail failed', e.message); }
      }
      return res.status(200).send(page('You are subscribed', 'Thanks. You are on the list, and every email has an unsubscribe link.'));
    }
    let who = '';
    const rec = await store.subscriber(email, { status: 'unsubscribed', unsubscribed: Date.now() }); who = (rec && rec.name) || '';   // the list lives in the admin database, so this is what stops the emails
    try { const n = T.adminSubscriber(email, 'unsubscribed', '', who); await sendMail({ to: env().admins, subject: n.subject, html: n.html, text: n.text, kind: 'admin-note' }); } catch (e) { /* the unsubscribe itself worked */ }
    return res.status(200).send(page('You are unsubscribed', 'Done. I will not email you again. If this was a mistake, you can subscribe again from the site.'));
  } catch (e) {
    console.error('newsletter failed', e.message);
    return res.status(502).send(page('Something went wrong', 'Please try again in a minute, or reply to any of my emails and I will sort it out.'));
  }
};
