// Admin backend. Path is deliberately unlisted; never link to it. Password from ADMIN_PASSWORD (Vercel env), signed cookie session, optional 2FA.
// Everything is /api/<this file>?a=<action>. Public: login, logout, cron (needs CRON_SECRET). The rest needs a signed-in session.
//   Submissions: list, export, update, delete, resend, bulk, reply_get, reply_send, thread_note, tpl_get, tpl_save
//   Newsletter:  news_overview, news_preview, news_test, news_start, news_send, news_retry, news_import
//   Spam:        spam_get, spam_save          Alerts: alerts_get, alerts_save, alerts_test
//   Security:    sec_get, totp_setup, totp_enable, totp_disable, signout_all, backup_now
//   Short links: links_list, links_act
const crypto = require('crypto');
const { env, sendMail, clean, parseBody, clientIp, limited, link } = require('./_mail');
const T = require('./_templates');
const store = require('./_store');
const cfg = require('./_adm/cfg');
const X = require('./_adm/export');
const sec = require('./_adm/security');
const totp = require('./_adm/totp');
const replies = require('./_adm/replies');
const news = require('./_adm/news');
const links = require('./_adm/links');
const notify = require('./_adm/notify');
const spam = require('./_spam');

const COOKIE = 'ap_admin', TTL = 12 * 3600;
const STATUSES = ['new', 'replied', 'spam', 'archived', 'pending', 'subscribed', 'unsubscribed'];
const secret = () => process.env.ADMIN_SECRET || crypto.createHash('sha256').update('ap-admin|' + (process.env.ADMIN_PASSWORD || '')).digest('hex');
const b64 = (s) => Buffer.from(s).toString('base64url');
const sig = (p) => crypto.createHmac('sha256', secret()).update(p).digest('base64url');
const issue = (e) => { const p = b64(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + TTL, e })); return p + '.' + sig(p); };
async function authed(req) {
  const m = String(req.headers.cookie || '').match(new RegExp('(?:^|; )' + COOKIE + '=([^;]+)'));
  if (!m) return false;
  const [p, s] = m[1].split('.'); if (!p || !s) return false;
  const a = Buffer.from(sig(p)), b = Buffer.from(s);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try { const j = JSON.parse(Buffer.from(p, 'base64url').toString()); return j.exp > Date.now() / 1000 && String(j.e) === await sec.epoch(); } catch (e) { return false; }
}
const setCookie = (res, v, age) => res.setHeader('Set-Cookie', `${COOKIE}=${v}; Path=/; Max-Age=${age}; HttpOnly; Secure; SameSite=Strict`);
const sameOrigin = (req) => { const o = req.headers.origin; if (!o) return true; try { return new URL(o).host === req.headers.host; } catch (e) { return false; } };
const eq = (a, b) => { const x = crypto.createHash('sha256').update(String(a)).digest(), y = crypto.createHash('sha256').update(String(b)).digest(); return crypto.timingSafeEqual(x, y); };
const cap = (a, n, len) => (Array.isArray(a) ? a : []).map((x) => String(x).trim().toLowerCase().slice(0, len)).filter(Boolean).slice(0, n);

/* ---------- filtering ---------- */
function filter(rows, q) {
  const ids = q.ids ? new Set(String(q.ids).split(',')) : null;
  const text = String(q.q || '').toLowerCase().trim();
  const from = q.from ? Date.parse(q.from + 'T00:00:00+05:30') : 0, to = q.to ? Date.parse(q.to + 'T23:59:59+05:30') : Infinity;
  return rows.filter((r) => {
    if (ids) return ids.has(r.id);
    if (q.type && q.type !== 'all' && r.type !== q.type) return false;
    if (q.status && q.status !== 'all') {
      if (q.status === 'mailfail') { if (!(r.mail && (r.mail.admin === 'failed' || r.mail.user === 'failed'))) return false; }
      else if (r.status !== q.status) return false;
    }
    if (r.created < from || r.created > to) return false;
    if (text && !['name', 'email', 'company', 'website_url', 'service', 'message', 'page', 'source', 'note'].some((k) => String(r[k] || '').toLowerCase().includes(text))) return false;
    return true;
  });
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const q = req.query || {}, a = String(q.a || '');
  const out = (code, j) => res.status(code).json(j);
  if (!process.env.ADMIN_PASSWORD) return out(503, { error: 'The admin is not set up yet. Add ADMIN_PASSWORD in the Vercel project settings.' });
  if (!store.enabled()) return out(503, { error: 'The database is not connected. UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are missing.' });
  const post = req.method === 'POST';
  if (post && !sameOrigin(req)) return out(403, { error: 'Request blocked.' });

  try {
    /* ----- no session needed ----- */
    if (a === 'login' && post) {
      if (await limited('adminlogin', clientIp(req), 8, 900)) return out(429, { error: 'Too many tries. Wait 15 minutes.' });
      const b = parseBody(req);
      if (!b.password || !eq(b.password, process.env.ADMIN_PASSWORD)) { await sec.logLogin(req, false, 'wrong password'); return out(401, { error: 'Wrong password.' }); }
      const st = await sec.totpState();
      if (st.enabled) {
        if (!b.code) return out(401, { error: 'Enter the 6-digit code from your authenticator app.', need2fa: true });
        if (!(await sec.verifySecondStep(b.code))) { await sec.logLogin(req, false, 'wrong 2FA code'); return out(401, { error: 'That code is not right.', need2fa: true }); }
      }
      setCookie(res, issue(await sec.epoch()), TTL);
      await sec.logLogin(req, true, st.enabled ? '2FA' : '');
      await notify.send(`Admin sign-in on aashishpandey.com from ${clientIp(req)}. If this was not you, open Settings and choose Sign out everywhere.`);
      return out(200, { ok: true });
    }
    if (a === 'logout') { setCookie(res, '', 0); return out(200, { ok: true }); }
    if (a === 'cron') {   // Vercel Cron: the nightly backup
      if (!process.env.CRON_SECRET) return out(503, { error: 'Set CRON_SECRET in Vercel to enable the nightly backup.' });
      if (req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) return out(401, { error: 'Not allowed.' });
      return out(200, await sec.backup());
    }

    /* ----- signed in from here ----- */
    if (!(await authed(req))) return out(401, { error: 'Sign in required.' });
    if (a === 'me') return out(200, { ok: true });

    if (a === 'list') {
      const rows = await store.all();
      const hit = filter(rows, q), off = Math.max(0, Number(q.offset) || 0), lim = Math.min(500, Number(q.limit) || 200);
      const count = (f) => rows.filter(f).length;
      return out(200, {
        total: hit.length, items: hit.slice(off, off + lim),
        counts: { all: rows.length, brief: count((r) => r.type === 'brief'), newBriefs: count((r) => r.type === 'brief' && r.status === 'new'), subscriber: count((r) => r.type === 'subscriber'), mailfail: count((r) => r.mail && (r.mail.admin === 'failed' || r.mail.user === 'failed')), spam: count((r) => r.status === 'spam') },
      });
    }
    if (a === 'export') {
      const hit = filter(await store.all(), q), fmt = String(q.format || 'csv'), stamp = new Date().toISOString().slice(0, 10), base = `submissions-${stamp}`;
      if (fmt === 'json') { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="${base}.json"`); return res.status(200).send(JSON.stringify(hit, null, 2)); }
      if (fmt === 'xlsx') { res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', `attachment; filename="${base}.xlsx"`); return res.status(200).send(X.xlsx(hit)); }
      res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="${base}.csv"`); return res.status(200).send(X.csv(hit));
    }
    if (a === 'links_list') return out(200, await links.list());
    if (a === 'sec_get') {
      const st = await sec.totpState();
      return out(200, { totp: { enabled: !!st.enabled, recoveryLeft: (st.recovery || []).length }, history: await sec.history(50), backup: await sec.lastBackup(), cronReady: !!process.env.CRON_SECRET });
    }
    if (a === 'spam_get') {
      const c = await cfg.get('spam', spam.DEFAULTS), rows = await store.all(), since = Date.now() - 30 * 864e5;
      return out(200, { cfg: c, defaults: { phrases: spam.PHRASES, threshold: spam.SPAM_AT }, caught30: rows.filter((r) => r.status === 'spam' && r.created > since).length });
    }
    if (a === 'alerts_get') return out(200, { cfg: await cfg.get('alerts', { min: 'high' }), channels: notify.channels() });
    if (a === 'news_overview') { const rows = await store.all(); return out(200, { growth: news.growth(rows), campaigns: await news.list() }); }
    if (a === 'tpl_get') return out(200, { templates: await replies.templates(), defaults: replies.defaults() });
    if (!post) return out(405, { error: 'Use POST.' });
    const b = parseBody(req);

    /* ----- submissions ----- */
    if (a === 'update') {
      const patch = {};
      if (b.status !== undefined) { if (!STATUSES.includes(b.status)) return out(400, { error: 'Unknown status.' }); patch.status = b.status; }
      if (b.note !== undefined) patch.note = clean(b.note, 2000);
      const r = await store.update(clean(b.id, 40), patch);
      return r ? out(200, { ok: true, item: r }) : out(404, { error: 'Not found.' });
    }
    if (a === 'delete') {
      const ids = (Array.isArray(b.ids) ? b.ids : [b.id]).map((x) => clean(x, 40)).filter(Boolean).slice(0, 500);
      await store.remove(ids); return out(200, { ok: true, deleted: ids.length });
    }
    if (a === 'resend') {   // send an email again from the stored record, for when the first one failed
      const r = await store.get(clean(b.id, 40));
      if (!r || r.type !== 'brief') return out(404, { error: 'Brief not found.' });
      const d = { ...r, when: new Date(r.created).toUTCString() };
      try {
        if (b.which === 'user') { const un = link('unsubscribe', r.email), m = T.userBriefConfirmation(d, un); await sendMail({ to: r.email, subject: m.subject, html: m.html, text: m.text, replyTo: env().admins, headers: { 'List-Unsubscribe': `<${un}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } }); await store.update(r.id, { mail: { user: 'sent', userError: '' } }); }
        else { const m = T.adminBrief(d); await sendMail({ to: env().admins, replyTo: r.email, subject: m.subject, html: m.html, text: m.text }); await store.update(r.id, { mail: { admin: 'sent', adminError: '' } }); }
      } catch (e) { return out(502, { error: 'Email failed: ' + e.message }); }
      return out(200, { ok: true });
    }
    if (a === 'bulk') {   // act on many records at once
      const ids = (Array.isArray(b.ids) ? b.ids : []).map((x) => clean(x, 40)).filter(Boolean).slice(0, 200), act = String(b.action || '');
      const recs = (await Promise.all(ids.map((id) => store.get(id)))).filter(Boolean);
      if (act.startsWith('status:')) {
        const st = act.slice(7); if (!STATUSES.includes(st)) return out(400, { error: 'Unknown status.' });
        for (const r of recs) await store.update(r.id, { status: st });
      } else if (act === 'notspam') {   // false alarms: back to New, allow the sender next time, and send the alert that never went out
        const c = await cfg.get('spam', spam.DEFAULTS), allow = new Set(c.allow || []);
        for (const r of recs) {
          if (b.allow) allow.add(String(r.email).toLowerCase());
          await store.update(r.id, { status: 'new', flags: [], spamScore: 0 });
          if (r.type === 'brief' && r.mail && r.mail.admin === 'skipped') {
            try { const m = T.adminBrief({ ...r, when: new Date(r.created).toUTCString() }); await sendMail({ to: env().admins, replyTo: r.email, subject: m.subject, html: m.html, text: m.text }); await store.update(r.id, { mail: { admin: 'sent' } }); }
            catch (e) { await store.update(r.id, { mail: { admin: 'failed', adminError: String(e.message).slice(0, 200) } }); }
          }
        }
        await cfg.set('spam', { ...c, allow: [...allow].slice(0, 500) });
      } else if (act === 'block') {
        const c = await cfg.get('spam', spam.DEFAULTS), block = new Set(c.block || []);
        for (const r of recs) { block.add(String(r.email).toLowerCase()); await store.update(r.id, { status: 'spam' }); }
        await cfg.set('spam', { ...c, block: [...block].slice(0, 500) });
      } else if (act === 'delete') { await store.remove(recs.map((r) => r.id)); }
      else return out(400, { error: 'Unknown action.' });
      return out(200, { ok: true, n: recs.length });
    }

    /* ----- replying from the dashboard ----- */
    if (a === 'reply_get') {
      const r = await store.get(clean(b.id, 40)); if (!r) return out(404, { error: 'Not found.' });
      const t = await replies.templates(), key = b.key && t[b.key] ? b.key : replies.keyOf(r.service);
      return out(200, { key, options: Object.entries(t).map(([k, v]) => ({ key: k, label: v.label })), draft: { subject: replies.fill(t[key].subject, r), body: replies.fill(t[key].body, r) }, thread: r.thread || [] });
    }
    if (a === 'reply_send') {
      const r = await store.get(clean(b.id, 40)); if (!r || !r.email) return out(404, { error: 'Not found.' });
      const subject = clean(b.subject, 200), body = String(b.body || '').slice(0, 10000).trim();
      if (!subject || body.length < 2) return out(400, { error: 'Add a subject and a message.' });
      const entry = { dir: 'out', at: Date.now(), subject, body };
      try { await replies.send(r, subject, body); } catch (e) { await store.update(r.id, { thread: [...(r.thread || []), { ...entry, error: String(e.message).slice(0, 200) }] }); return out(502, { error: 'Email failed: ' + e.message }); }
      const u = await store.update(r.id, { thread: [...(r.thread || []), entry], status: r.status === 'new' || r.status === 'spam' ? 'replied' : r.status });
      return out(200, { ok: true, item: u });
    }
    if (a === 'thread_note') {   // log what they wrote back (replies arrive in your own inbox, not here)
      const r = await store.get(clean(b.id, 40)); if (!r) return out(404, { error: 'Not found.' });
      const text = String(b.text || '').slice(0, 10000).trim(); if (!text) return out(400, { error: 'Write something to log.' });
      const u = await store.update(r.id, { thread: [...(r.thread || []), { dir: b.dir === 'in' ? 'in' : 'note', at: Date.now(), body: text }] });
      return out(200, { ok: true, item: u });
    }
    if (a === 'tpl_save') {
      const key = clean(b.key, 30), d = replies.defaults(); if (!d[key]) return out(400, { error: 'Unknown template.' });
      const saved = await cfg.get('templates', {});
      if (b.reset) delete saved[key]; else saved[key] = { subject: clean(b.subject, 200), body: String(b.body || '').slice(0, 10000) };
      await cfg.set('templates', saved); return out(200, { ok: true });
    }

    /* ----- newsletter ----- */
    if (a === 'news_preview') { const c = news.clean(b); return out(200, { html: news.render(c, SITE_UNSUB).html }); }
    if (a === 'news_test') {
      const c = news.clean(b); if (!c.subject || !c.body.trim()) return out(400, { error: 'Add a subject and a body first.' });
      const to = env().admins[0], un = link('unsubscribe', to), r = news.render(c, un);
      try { await sendMail({ to, subject: '[Test] ' + c.subject, html: r.html, text: r.text, replyTo: env().admins }); } catch (e) { return out(502, { error: 'Email failed: ' + e.message }); }
      return out(200, { ok: true, to });
    }
    if (a === 'news_start') {
      const c = news.clean(b); if (!c.subject || !c.body.trim()) return out(400, { error: 'Add a subject and a body first.' });
      if (b.confirm !== 'SEND') return out(400, { error: 'Type SEND to confirm.' });
      const camp = await news.start(c); return out(200, { id: camp.id, total: camp.total });
    }
    if (a === 'news_send') { try { return out(200, await news.sendChunk(clean(b.id, 20))); } catch (e) { return out(404, { error: e.message }); } }
    if (a === 'news_retry') { try { return out(200, await news.retryFailed(clean(b.id, 20))); } catch (e) { return out(404, { error: e.message }); } }
    if (a === 'news_import') { try { return out(200, { ok: true, imported: await news.importFromResend() }); } catch (e) { return out(502, { error: 'Could not read the Resend audience: ' + e.message }); } }

    /* ----- spam rules and alerts ----- */
    if (a === 'spam_save') {
      const c = { threshold: Math.min(20, Math.max(2, parseInt(b.threshold, 10) || spam.SPAM_AT)), block: cap(b.block, 500, 100), allow: cap(b.allow, 500, 100), phrasesOff: cap(b.phrasesOff, 100, 60), phrasesExtra: cap(b.phrasesExtra, 200, 60) };
      await cfg.set('spam', c); return out(200, { ok: true, cfg: c });
    }
    if (a === 'alerts_save') { const min = ['off', 'high', 'medium', 'all'].includes(b.min) ? b.min : 'high'; await cfg.set('alerts', { min }); return out(200, { ok: true }); }
    if (a === 'alerts_test') { const r = await notify.send('Test alert from your aashishpandey.com admin. If you can read this, push alerts work.'); return r.none ? out(400, { error: 'No alert channel is set up yet. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID, or SLACK_WEBHOOK_URL, in Vercel.' }) : out(200, r); }

    /* ----- security ----- */
    if (a === 'totp_setup') {
      const st = await sec.totpState(); if (st.enabled) return out(400, { error: 'Two-factor sign-in is already on.' });
      const pending = totp.secret(); await sec.saveTotp({ ...st, enabled: false, pending });
      return out(200, { secret: pending, uri: totp.uri(pending) });
    }
    if (a === 'totp_enable') {
      const st = await sec.totpState(); if (!st.pending) return out(400, { error: 'Start the setup first.' });
      const step = totp.check(st.pending, b.code); if (step < 0) return out(400, { error: 'That code is not right. Check the time on your phone and try again.' });
      const rec = totp.recoveryCodes();
      await sec.saveTotp({ enabled: true, secret: st.pending, last: step, recovery: rec.map(totp.hash) });
      return out(200, { ok: true, recovery: rec });
    }
    if (a === 'totp_disable') {
      const st = await sec.totpState(); if (!st.enabled) return out(200, { ok: true });
      if (!(await sec.verifySecondStep(b.code))) return out(400, { error: 'Enter a current code (or a recovery code) to turn it off.' });
      await sec.saveTotp({ enabled: false }); return out(200, { ok: true });
    }
    if (a === 'signout_all') { await sec.bumpEpoch(); setCookie(res, '', 0); return out(200, { ok: true }); }
    if (a === 'backup_now') { const r = await sec.backup(); return r.ok ? out(200, r) : out(502, { error: 'Backup email failed: ' + r.error }); }

    /* ----- short links ----- */
    if (a === 'links_act') { try { await links.act(b.code, b.op); return out(200, { ok: true }); } catch (e) { return out(400, { error: e.message }); } }

    return out(404, { error: 'Unknown action.' });
  } catch (e) {
    console.error('admin:', e.message);
    return out(500, { error: 'Something went wrong. Try again.' });
  }
};
const SITE_UNSUB = 'https://aashishpandey.com/api/newsletter?a=unsubscribe';
