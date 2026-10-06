// Admin backend. Path is deliberately unlisted; never link to it. The owner signs in with ADMIN_PASSWORD (Vercel env); team members have their own accounts.
// Everything is /api/<this file>?a=<action>. Public: login, logout, cron and digest (need CRON_SECRET). The rest needs a session, and the role decides what it may do.
//   Inbox:       list, export, update, delete, resend, bulk, reply_get, reply_send, thread_note, tpl_get, tpl_save
//   Pipeline:    update (stage, value, follow-up), digest_get, digest_save, digest_now
//   Quotes:      quote_preview, quote_send, quote_list, quote_status
//   Newsletter:  news_overview, news_preview, news_test, news_start, news_send, news_retry, news_import
//   Spam/alerts: spam_get, spam_save, alerts_get, alerts_save, alerts_test
//   Phone:       push_key, push_subscribe, push_unsubscribe, push_test
//   Team:        users_list, users_add, users_update, users_delete, audit_list, pw_change
//   Security:    sec_get, totp_setup, totp_enable, totp_disable, signout_all, backup_now
//   Short links: links_list, links_act
//   Site:        health_get, health_run, tools_stats, gsc_get, content_get, content_save, tm_list, tm_act, tm_add, tm_request
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
const users = require('./_adm/users');
const audit = require('./_adm/audit');
const quotes = require('./_adm/quotes');
const push = require('./_adm/webpush');
const pipeline = require('./_adm/pipeline');
const device = require('./_adm/device');
const sessions = require('./_adm/sessions');
const maillog = require('./_adm/maillog');
const spam = require('./_spam');
const siteHealth = require('./_adm/sitehealth');
const toolStats = require('./_adm/toolstats');
const gsc = require('./_adm/gsc');
const content = require('./_adm/content');

const COOKIE = 'ap_admin', TTL = 12 * 3600;
const STATUSES = ['new', 'replied', 'spam', 'archived', 'pending', 'subscribed', 'unsubscribed'];
const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'CAD', 'AUD'];
// what goes in the activity log (reads are not recorded; a refused attempt always is)
const AUDITED = new Set(['update', 'delete', 'resend', 'bulk', 'reply_send', 'thread_note', 'tpl_save', 'spam_save', 'alerts_save', 'alerts_test', 'news_test', 'news_start', 'news_retry', 'news_import', 'news_import_briefs', 'totp_enable', 'totp_disable', 'signout_all', 'backup_now', 'links_act', 'users_add', 'users_update', 'users_delete', 'pw_change', 'sessions_revoke', 'sessions_revoke_user', 'security_save', 'mail_unsuppress', 'mail_suppress', 'quote_send', 'quote_status', 'export', 'digest_save', 'digest_now', 'push_subscribe', 'push_unsubscribe', 'health_run', 'content_save', 'tm_act', 'tm_add', 'tm_request']);
const secret = () => process.env.ADMIN_SECRET || crypto.createHash('sha256').update('ap-admin|' + (process.env.ADMIN_PASSWORD || '')).digest('hex');
const b64 = (s) => Buffer.from(s).toString('base64url');
const sig = (p) => crypto.createHmac('sha256', secret()).update(p).digest('base64url');
const issue = (e, u, sid) => { const p = b64(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + TTL, e, u, s: sid })); return p + '.' + sig(p); };
const cookieSid = (req) => { try { const m = String(req.headers.cookie || '').match(new RegExp('(?:^|; )' + COOKIE + '=([^;]+)')); return m ? JSON.parse(Buffer.from(m[1].split('.')[0], 'base64url').toString()).s : null; } catch (e) { return null; } };
// → { id, name, role } or null. The role is read fresh each time, so a change or a deactivation applies at once.
async function session(req) {
  const m = String(req.headers.cookie || '').match(new RegExp('(?:^|; )' + COOKIE + '=([^;]+)'));
  if (!m) return null;
  const [p, s] = m[1].split('.'); if (!p || !s) return null;
  const a = Buffer.from(sig(p)), b = Buffer.from(s);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let j; try { j = JSON.parse(Buffer.from(p, 'base64url').toString()); } catch (e) { return null; }
  if (!(j.exp > Date.now() / 1000) || String(j.e) !== await sec.epoch()) return null;
  const uid = j.u || 'owner', rec = await sessions.get(j.s);   // ended from the admin, or expired: no longer valid even though the cookie is
  if (!rec || rec.uid !== uid) return null;
  sessions.touch(rec).catch(() => {});
  if (uid === 'owner') return { id: 'owner', name: 'Owner', role: 'owner', sid: rec.id };
  const u = await users.get(uid);
  return u && u.active ? { id: u.id, name: u.name, role: u.role, mustChange: !!u.mustChange, sid: rec.id } : null;
}
const setCookie = (res, v, age) => res.setHeader('Set-Cookie', `${COOKIE}=${v}; Path=/; Max-Age=${age}; HttpOnly; Secure; SameSite=Strict`);
const sameOrigin = (req) => { const o = req.headers.origin; if (!o) return true; try { return new URL(o).host === req.headers.host; } catch (e) { return false; } };
const eq = (a, b) => { const x = crypto.createHash('sha256').update(String(a)).digest(), y = crypto.createHash('sha256').update(String(b)).digest(); return crypto.timingSafeEqual(x, y); };
const cap = (a, n, len) => (Array.isArray(a) ? a : []).map((x) => String(x).trim().toLowerCase().slice(0, len)).filter(Boolean).slice(0, n);
// the site the health checks look at: production checks the live domain, a preview checks itself
const siteOrigin = (req) => (process.env.VERCEL_ENV === 'production' ? 'https://aashishpandey.com' : 'https://' + req.headers.host);
const DUMMY = users.hash('not a real password', '00000000000000000000000000000000');   // so a wrong email takes as long as a wrong password

/* ---------- filtering ---------- */
function filter(rows, q) {
  const ids = q.ids ? new Set(String(q.ids).split(',')) : null, now = Date.now();
  const text = String(q.q || '').toLowerCase().trim();
  const from = q.from ? Date.parse(q.from + 'T00:00:00+05:30') : 0, to = q.to ? Date.parse(q.to + 'T23:59:59+05:30') : Infinity;
  return rows.filter((r) => {
    if (ids) return ids.has(r.id);
    if (q.type && q.type !== 'all' && r.type !== q.type) return false;
    if (q.status && q.status !== 'all') {
      if (q.status === 'mailfail') { if (!(r.mail && (r.mail.admin === 'failed' || r.mail.user === 'failed'))) return false; }
      else if (r.status !== q.status) return false;
    }
    if (q.stage && q.stage !== 'all') {
      if (r.type !== 'brief' || r.status === 'spam') return false;
      if (q.stage === 'overdue') { if (!pipeline.overdue(r, now)) return false; }
      else if (q.stage === 'soon') { if (!pipeline.dueSoon(r, now)) return false; }
      else if (q.stage === 'followup') { if (!pipeline.followDue(r, now)) return false; }
      else if (pipeline.stageOf(r) !== q.stage) return false;
    }
    if (r.created < from || r.created > to) return false;
    if (text && !['name', 'email', 'company', 'website_url', 'service', 'message', 'page', 'source', 'note'].some((k) => String(r[k] || '').toLowerCase().includes(text))) return false;
    return true;
  });
}
const flag = (r, now) => (r.type === 'brief' ? { ...r, stageNow: pipeline.stageOf(r), overdue: pipeline.overdue(r, now), dueSoon: pipeline.dueSoon(r, now), followDue: pipeline.followDue(r, now) } : r);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const q = req.query || {}, a = String(q.a || '');
  let status = 200, user = null, body = null;
  const out = (code, j) => { status = code; return res.status(code).json(j); };
  if (!process.env.ADMIN_PASSWORD) return out(503, { error: 'The admin is not set up yet. Add ADMIN_PASSWORD in the Vercel project settings.' });
  if (!store.enabled()) return out(503, { error: 'The database is not connected. UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are missing.' });
  const post = req.method === 'POST';
  if (post && !sameOrigin(req)) return out(403, { error: 'Request blocked.' });

  try {
    /* ----- no session needed ----- */
    if (a === 'login' && post) {
      if (await limited('adminlogin', clientIp(req), 8, 900)) return out(429, { error: 'Too many tries. Wait 15 minutes.' });
      const b = parseBody(req), info = device.collect(req, b.client);
      const label = b.email ? String(b.email).trim().toLowerCase() : 'owner', place = device.place(info.geo);
      const alertText = (who) => `${who} signed in from ${clientIp(req)}${place ? ' (' + place + ')' : ''} on ${info.device.browser} / ${info.device.os}.${info.mismatch ? ' The browser location is ' + info.distanceKm + ' km from where the IP address is.' : ''}`;
      if (b.email) {   // a team member
        const email = String(b.email).trim().toLowerCase();
        if (await limited('adminloginu', email, 8, 900)) return out(429, { error: 'Too many tries. Wait 15 minutes.' });
        const u = await users.byEmail(email), good = users.verify(b.password, u ? u.pwHash : DUMMY) && u && u.active;
        const who = { id: u ? u.id : '', name: u ? u.name : email, role: u ? u.role : '' };
        if (!good) { await sec.logLogin(req, false, 'wrong email or password', email, info); await audit.log(req, who, 'login', { ok: false }, 401); return out(401, { error: 'Wrong email or password.' }); }
        if ((await sec.totpState(u.id)).enabled) {
          if (!b.code) return out(401, { error: 'Enter the 6-digit code from your authenticator app.', need2fa: true });
          if (!(await sec.verifySecondStep(b.code, u.id))) { await sec.logLogin(req, false, 'wrong 2FA code', email, info); await audit.log(req, who, 'login', { ok: false, why: '2FA' }, 401); return out(401, { error: 'That code is not right.', need2fa: true }); }
        }
        const sess = await sessions.create({ id: u.id, name: u.name, role: u.role }, info, clientIp(req));
        setCookie(res, issue(await sec.epoch(), u.id, sess.id), TTL); await users.update(u.id, { lastLogin: Date.now() });
        await sec.logLogin(req, true, '', email, { ...info, sid: sess.id }); await audit.log(req, who, 'login', { ok: true, place, mismatchKm: info.mismatch ? info.distanceKm : undefined }, 200);
        await notify.send(alertText(`${u.name} (${u.role})`), { title: info.mismatch ? 'Sign-in: location does not match' : 'Team sign-in', tag: 'login' });
        return out(200, { ok: true, user: users.pub(u) });
      }
      const who = { id: 'owner', name: 'Owner', role: 'owner' };
      if (!b.password || !eq(b.password, process.env.ADMIN_PASSWORD)) { await sec.logLogin(req, false, 'wrong password', 'owner', info); await audit.log(req, who, 'login', { ok: false }, 401); return out(401, { error: 'Wrong password.' }); }
      const st = await sec.totpState('owner');
      if (st.enabled) {
        if (!b.code) return out(401, { error: 'Enter the 6-digit code from your authenticator app.', need2fa: true });
        if (!(await sec.verifySecondStep(b.code, 'owner'))) { await sec.logLogin(req, false, 'wrong 2FA code', 'owner', info); await audit.log(req, who, 'login', { ok: false, why: '2FA' }, 401); return out(401, { error: 'That code is not right.', need2fa: true }); }
      }
      const sess = await sessions.create(who, info, clientIp(req));
      setCookie(res, issue(await sec.epoch(), 'owner', sess.id), TTL);
      await sec.logLogin(req, true, st.enabled ? '2FA' : '', 'owner', { ...info, sid: sess.id }); await audit.log(req, who, 'login', { ok: true, place, mismatchKm: info.mismatch ? info.distanceKm : undefined }, 200);
      await notify.send(alertText('Owner') + ' If this was not you, open Settings and sign that session out.', { title: info.mismatch ? 'Sign-in: location does not match' : 'Admin sign-in', tag: 'login' });
      return out(200, { ok: true });
    }
    if (a === 'logout') { const sid = cookieSid(req); if (sid) await sessions.revoke(String(sid)).catch(() => {}); setCookie(res, '', 0); return out(200, { ok: true }); }
    if (a === 'cron' || a === 'digest') {   // Vercel Cron: the nightly backup and the morning digest
      if (!process.env.CRON_SECRET) return out(503, { error: 'Set CRON_SECRET in Vercel to enable scheduled jobs.' });
      if (req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) return out(401, { error: 'Not allowed.' });
      const health = await siteHealth.run(siteOrigin(req), { alert: true, via: a }).then((r) => ({ ok: r.ok, fails: r.fails })).catch((e) => ({ error: e.message }));   // twice a day, with an alert if anything fails
      if (a === 'cron') return out(200, { ...(await sec.backup()), health });
      if ((await cfg.get('digest', { on: true })).on === false) return out(200, { sent: false, off: true, health });
      return out(200, await pipeline.sendDigest(await store.all()));
    }

    /* ----- signed in from here ----- */
    user = await session(req);
    if (!user) return out(401, { error: 'Sign in required.' });
    body = post ? parseBody(req) : {};
    if (!users.can(user.role, a, body)) { await audit.log(req, user, 'denied:' + a, audit.detailOf(a, body, q), 403); user = null; return out(403, { error: 'Your role does not allow that.' }); }
    const b = body, now = Date.now();
    if (a === 'me') return out(200, { ok: true, user });

    if (a === 'list') {
      const rows = await store.all();
      const hit = filter(rows, q), off = Math.max(0, Number(q.offset) || 0), lim = Math.min(500, Number(q.limit) || 200);
      const count = (f) => rows.filter(f).length, pl = pipeline.stats(rows);
      return out(200, {
        total: hit.length, items: hit.slice(off, off + lim).map((r) => flag(r, now)), pipeline: pl, role: user.role,
        counts: { all: rows.length, brief: count((r) => r.type === 'brief'), newBriefs: count((r) => r.type === 'brief' && r.status === 'new'), subscriber: count((r) => r.type === 'subscriber'), mailfail: count((r) => r.mail && (r.mail.admin === 'failed' || r.mail.user === 'failed')), spam: count((r) => r.status === 'spam'), overdue: pl.overdue },
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
      const st = await sec.totpState(user.id), owner = user.role === 'owner';
      return out(200, { totp: { enabled: !!st.enabled, recoveryLeft: (st.recovery || []).length }, history: owner ? await sec.history(50) : [], backup: owner ? await sec.lastBackup() : null, cronReady: !!process.env.CRON_SECRET });
    }
    if (a === 'spam_get') {
      const c = await cfg.get('spam', spam.DEFAULTS), rows = await store.all(), since = Date.now() - 30 * 864e5;
      return out(200, { cfg: c, defaults: { phrases: spam.PHRASES, threshold: spam.SPAM_AT }, caught30: rows.filter((r) => r.status === 'spam' && r.created > since).length });
    }
    if (a === 'alerts_get') return out(200, { cfg: await cfg.get('alerts', { min: 'high' }), channels: { ...notify.channels(), push: (await push.count()) > 0 } });
    if (a === 'digest_get') return out(200, { cfg: await cfg.get('digest', { on: true }), cronReady: !!process.env.CRON_SECRET });
    if (a === 'news_overview') { const rows = await store.all(); return out(200, { growth: news.growth(rows), campaigns: await news.list() }); }
    if (a === 'tpl_get') return out(200, { templates: await replies.templates(), defaults: replies.defaults() });
    if (a === 'push_key') return out(200, { key: await push.publicKey() });
    if (a === 'sessions_list') { const all = await sessions.list(), mine = user.role === 'owner' ? all : all.filter((x) => x.uid === user.id); return out(200, { sessions: mine.map((x) => ({ ...x, current: x.id === user.sid })), you: user.sid }); }
    if (a === 'mail_list') {
      const rows = await maillog.all(), sup = await maillog.suppressed(), kind = String(q.kind || ''), st = String(q.status || ''), text = String(q.q || '').toLowerCase();
      const hit = rows.filter((r) => (!kind || kind === 'all' || r.kind === kind) && (!st || st === 'all' || (st === 'problems' ? ['bounced', 'complained', 'failed', 'delayed'].includes(r.status) : r.status === st)) && (!text || (r.to + ' ' + r.subject).toLowerCase().includes(text)));
      return out(200, { items: hit.slice(0, 200), stats: maillog.stats(rows), suppressed: Object.entries(sup).map(([email, v]) => ({ email, ...v })), webhook: !!process.env.RESEND_WEBHOOK_SECRET, url: 'https://aashishpandey.com/api/resend-webhook' });
    }
    if (a === 'mail_for') { const rows = (await maillog.all()).filter((r) => r.ref === String(q.ref || '')); return out(200, { items: rows, webhook: !!process.env.RESEND_WEBHOOK_SECRET }); }
    if (a === 'users_list') { const m = await users.all(); return out(200, { users: Object.values(m).map(users.pub).sort((x, y) => x.createdAt - y.createdAt) }); }
    if (a === 'audit_list') { const m = await users.all(); return out(200, { items: await audit.list({ user: q.user, action: q.action, q: q.q, limit: 300 }), users: [{ id: 'owner', name: 'Owner' }, ...Object.values(m).map((u) => ({ id: u.id, name: u.name }))] }); }
    if (a === 'health_get') return out(200, await siteHealth.last());
    if (a === 'tools_stats') return out(200, await toolStats.stats(q.days, await store.all()));
    if (a === 'gsc_get') { try { return out(200, await gsc.get(q.refresh === '1')); } catch (e) { return out(502, { error: e.message }); } }
    if (a === 'content_get') return out(200, { content: await content.get(), defaults: content.DEFAULTS });
    if (a === 'tm_list') return out(200, { items: await content.list() });
    if (!post) return out(405, { error: 'Use POST.' });

    /* ----- inbox ----- */
    if (a === 'update') {
      const cur = await store.get(clean(b.id, 40)); if (!cur) return out(404, { error: 'Not found.' });
      const patch = {};
      if (b.status !== undefined) { if (!STATUSES.includes(b.status)) return out(400, { error: 'Unknown status.' }); patch.status = b.status; }
      if (b.note !== undefined) patch.note = clean(b.note, 2000);
      if (b.stage !== undefined) {
        if (!pipeline.STAGES.includes(b.stage)) return out(400, { error: 'Unknown stage.' });
        patch.stage = b.stage;
        if (pipeline.stageOf(cur) === 'new' && b.stage !== 'new' && (patch.status || cur.status) === 'new') patch.status = 'replied';   // moved on, so it is no longer waiting for a first answer
        if (b.stage !== 'lost') patch.lostReason = '';
      }
      if (b.value !== undefined) { const v = b.value === '' || b.value === null ? 0 : Number(b.value); if (!(v >= 0 && v <= 1e9)) return out(400, { error: 'Check the deal value.' }); patch.value = v; }
      if (b.currency !== undefined) { if (!CURRENCIES.includes(b.currency)) return out(400, { error: 'Unknown currency.' }); patch.currency = b.currency; }
      if (b.lostReason !== undefined) patch.lostReason = clean(b.lostReason, 300);
      if (b.followUp !== undefined) { if (b.followUp && !/^\d{4}-\d{2}-\d{2}$/.test(b.followUp)) return out(400, { error: 'Use a date.' }); patch.followUp = b.followUp || ''; }
      const r = await store.update(cur.id, patch);
      return out(200, { ok: true, item: flag(r, now) });
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
        if (b.which === 'user') { const un = link('unsubscribe', r.email), m = T.userBriefConfirmation(d, un); await sendMail({ to: r.email, subject: m.subject, html: m.html, text: m.text, replyTo: env().admins, headers: { 'List-Unsubscribe': `<${un}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }, kind: 'visitor-confirmation', ref: r.id }); await store.update(r.id, { mail: { user: 'sent', userError: '' } }); }
        else { const m = T.adminBrief(d); await sendMail({ to: env().admins, replyTo: r.email, subject: m.subject, html: m.html, text: m.text, kind: 'admin-alert', ref: r.id }); await store.update(r.id, { mail: { admin: 'sent', adminError: '' } }); }
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
            try { const m = T.adminBrief({ ...r, when: new Date(r.created).toUTCString() }); await sendMail({ to: env().admins, replyTo: r.email, subject: m.subject, html: m.html, text: m.text, kind: 'admin-alert', ref: r.id }); await store.update(r.id, { mail: { admin: 'sent' } }); }
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
      const subject = clean(b.subject, 200), text = String(b.body || '').slice(0, 10000).trim();
      if (!subject || text.length < 2) return out(400, { error: 'Add a subject and a message.' });
      const entry = { dir: 'out', at: Date.now(), subject, body: text, by: user.name };
      try { await replies.send(r, subject, text); } catch (e) { await store.update(r.id, { thread: [...(r.thread || []), { ...entry, error: String(e.message).slice(0, 200) }] }); return out(502, { error: 'Email failed: ' + e.message }); }
      const patch = { thread: [...(r.thread || []), entry], status: r.status === 'new' || r.status === 'spam' ? 'replied' : r.status };
      if (pipeline.stageOf(r) === 'new') patch.stage = 'contacted';
      return out(200, { ok: true, item: flag(await store.update(r.id, patch), now) });
    }
    if (a === 'thread_note') {   // log what they wrote back (replies arrive in your own inbox, not here)
      const r = await store.get(clean(b.id, 40)); if (!r) return out(404, { error: 'Not found.' });
      const text = String(b.text || '').slice(0, 10000).trim(); if (!text) return out(400, { error: 'Write something to log.' });
      return out(200, { ok: true, item: flag(await store.update(r.id, { thread: [...(r.thread || []), { dir: b.dir === 'in' ? 'in' : 'note', at: Date.now(), body: text, by: user.name }] }), now) });
    }
    if (a === 'tpl_save') {
      const key = clean(b.key, 30), d = replies.defaults(); if (!d[key]) return out(400, { error: 'Unknown template.' });
      const saved = await cfg.get('templates', {});
      if (b.reset) delete saved[key]; else saved[key] = { subject: clean(b.subject, 200), body: String(b.body || '').slice(0, 10000) };
      await cfg.set('templates', saved); return out(200, { ok: true });
    }

    /* ----- quotes (owner only) ----- */
    if (a === 'quote_list') { const r = await store.get(clean(b.id, 40)); return r ? out(200, { quotes: await quotes.listFor(r) }) : out(404, { error: 'Not found.' }); }
    if (a === 'quote_preview' || a === 'quote_send') {
      const r = await store.get(clean(b.id, 40)); if (!r || r.type !== 'brief') return out(404, { error: 'Brief not found.' });
      try {
        if (a === 'quote_preview') return out(200, await quotes.preview(r, b.draft || {}));
        const qt = await quotes.send(r, user, b.draft || {}); return out(200, { ok: true, quote: { id: qt.id, number: qt.number, total: quotes.money(qt.total, qt.currency) } });
      } catch (e) { return out(400, { error: e.message }); }
    }
    if (a === 'quote_status') { try { const qt = await quotes.setStatus(clean(b.qid, 20), String(b.status || '')); return out(200, { ok: true, status: qt.status }); } catch (e) { return out(400, { error: e.message }); } }

    /* ----- newsletter ----- */
    if (a === 'news_preview') { const c = news.clean(b); return out(200, { html: news.render(c, SITE_UNSUB, 'Priya').html }); }
    if (a === 'news_test') {
      const c = news.clean(b); if (!c.subject || !c.body.trim()) return out(400, { error: 'Add a subject and a body first.' });
      const to = env().admins[0], un = link('unsubscribe', to), r = news.render(c, un);
      try { await sendMail({ to, subject: '[Test] ' + c.subject, html: r.html, text: r.text, replyTo: env().admins, kind: 'newsletter-test' }); } catch (e) { return out(502, { error: 'Email failed: ' + e.message }); }
      return out(200, { ok: true, to });
    }
    if (a === 'news_start') {
      const c = news.clean(b); if (!c.subject || !c.body.trim()) return out(400, { error: 'Add a subject and a body first.' });
      if (b.confirm !== 'SEND') return out(400, { error: 'Type SEND to confirm.' });
      const camp = await news.start(c); return out(200, { id: camp.id, total: camp.total });
    }
    if (a === 'news_send') { try { return out(200, await news.sendChunk(clean(b.id, 20))); } catch (e) { return out(404, { error: e.message }); } }
    if (a === 'news_retry') { try { return out(200, await news.retryFailed(clean(b.id, 20))); } catch (e) { return out(404, { error: e.message }); } }
    if (a === 'news_import_briefs' && post) return out(200, { ok: true, added: await news.addPastSenders() });
    if (a === 'news_import') { try { return out(200, { ok: true, imported: await news.importFromResend() }); } catch (e) { return out(502, { error: 'Could not read the Resend audience: ' + e.message }); } }

    /* ----- spam rules, alerts, digest, phone notifications ----- */
    if (a === 'spam_save') {
      const c = { threshold: Math.min(20, Math.max(2, parseInt(b.threshold, 10) || spam.SPAM_AT)), block: cap(b.block, 500, 100), allow: cap(b.allow, 500, 100), phrasesOff: cap(b.phrasesOff, 100, 60), phrasesExtra: cap(b.phrasesExtra, 200, 60) };
      await cfg.set('spam', c); return out(200, { ok: true, cfg: c });
    }
    if (a === 'alerts_save') { const min = ['off', 'high', 'medium', 'all'].includes(b.min) ? b.min : 'high'; await cfg.set('alerts', { min }); return out(200, { ok: true }); }
    if (a === 'alerts_test') { const r = await notify.send('Test alert from your aashishpandey.com admin. If you can read this, push alerts work.', { title: 'Test alert', tag: 'test' }); return r.none ? out(400, { error: 'No alert channel is set up yet. Turn on notifications on a device in Settings, or add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID, or SLACK_WEBHOOK_URL, in Vercel.' }) : out(200, r); }
    if (a === 'digest_save') { await cfg.set('digest', { on: b.on !== false }); return out(200, { ok: true }); }
    if (a === 'digest_now') { const r = await pipeline.sendDigest(await store.all()); return out(200, r); }
    if (a === 'push_subscribe') { try { await push.subscribe(user.id, b.subscription, req.headers['user-agent']); return out(200, { ok: true }); } catch (e) { return out(400, { error: e.message }); } }
    if (a === 'push_unsubscribe') { await push.unsubscribe(String(b.endpoint || '')); return out(200, { ok: true }); }
    if (a === 'push_test') { const r = await push.sendAll({ title: 'Notifications work', body: 'This device will get alerts for new briefs and quotes.', tag: 'test' }, (s) => s.uid === user.id); return r.sent ? out(200, r) : out(400, { error: r.failed ? 'The browser rejected the notification. Turn notifications off and on again.' : 'This device is not subscribed yet.' }); }

    /* ----- sign-ins and mail ----- */
    if (a === 'sessions_revoke') {
      const rec = await sessions.get(String(b.sid || '')); if (!rec) return out(404, { error: 'That sign-in has already ended.' });
      if (user.role !== 'owner' && rec.uid !== user.id) return out(403, { error: 'You can only end your own sign-ins.' });
      await sessions.revoke(rec.id); if (rec.id === user.sid) setCookie(res, '', 0); return out(200, { ok: true, self: rec.id === user.sid });
    }
    if (a === 'sessions_revoke_user') { await sessions.revokeUser(clean(b.uid, 20)); return out(200, { ok: true }); }
    if (a === 'mail_unsuppress') { await maillog.unsuppress(clean(b.email, 254)); return out(200, { ok: true }); }
    if (a === 'mail_suppress') { await maillog.suppress(clean(b.email, 254), 'manual'); return out(200, { ok: true }); }

    /* ----- team ----- */
    if (a === 'users_add') { try { return out(200, { ok: true, ...(await users.add(b)) }); } catch (e) { return out(400, { error: e.message }); } }
    if (a === 'users_update') {
      try {
        const r = await users.update(clean(b.id, 20), { role: b.role, active: b.active, resetPassword: !!b.resetPassword });
        if (b.active === false) await sessions.revokeUser(clean(b.id, 20));   // deactivating also ends their sign-ins
        return out(200, { ok: true, ...r });
      } catch (e) { return out(400, { error: e.message }); }
    }
    if (a === 'users_delete') { await sessions.revokeUser(clean(b.id, 20)); await users.remove(clean(b.id, 20)); return out(200, { ok: true }); }
    if (a === 'pw_change') {
      if (user.id === 'owner') return out(400, { error: 'The owner password is set in Vercel (ADMIN_PASSWORD).' });
      const u = await users.get(user.id), np = String(b.newPassword || '');
      if (!u || !users.verify(b.current, u.pwHash)) return out(400, { error: 'Your current password is not right.' });
      if (np.length < 10) return out(400, { error: 'Use at least 10 characters.' });
      await users.update(user.id, { newPassword: np }); return out(200, { ok: true });
    }

    /* ----- security ----- */
    if (a === 'totp_setup') {
      const st = await sec.totpState(user.id); if (st.enabled) return out(400, { error: 'Two-factor sign-in is already on.' });
      const pending = totp.secret(); await sec.saveTotp({ ...st, enabled: false, pending }, user.id);
      return out(200, { secret: pending, uri: totp.uri(pending) });
    }
    if (a === 'totp_enable') {
      const st = await sec.totpState(user.id); if (!st.pending) return out(400, { error: 'Start the setup first.' });
      const step = totp.check(st.pending, b.code); if (step < 0) return out(400, { error: 'That code is not right. Check the time on your phone and try again.' });
      const rec = totp.recoveryCodes();
      await sec.saveTotp({ enabled: true, secret: st.pending, last: step, recovery: rec.map(totp.hash) }, user.id);
      return out(200, { ok: true, recovery: rec });
    }
    if (a === 'totp_disable') {
      const st = await sec.totpState(user.id); if (!st.enabled) return out(200, { ok: true });
      if (!(await sec.verifySecondStep(b.code, user.id))) return out(400, { error: 'Enter a current code (or a recovery code) to turn it off.' });
      await sec.saveTotp({ enabled: false }, user.id); return out(200, { ok: true });
    }
    if (a === 'signout_all') { await sec.bumpEpoch(); await sessions.revokeAll(); setCookie(res, '', 0); return out(200, { ok: true }); }
    if (a === 'backup_now') { const r = await sec.backup(); return r.ok ? out(200, r) : out(502, { error: 'Backup email failed: ' + r.error }); }

    /* ----- site: health, content, testimonials ----- */
    if (a === 'health_run') return out(200, await siteHealth.run(siteOrigin(req), { via: 'manual' }));
    if (a === 'content_save') { try { return out(200, { ok: true, content: await content.save(b) }); } catch (e) { return out(400, { error: e.message }); } }
    if (a === 'tm_act') { try { return out(200, { ok: true, item: await content.act(b.id, String(b.op || ''), b) }); } catch (e) { return out(400, { error: e.message }); } }
    if (a === 'tm_add') { try { return out(200, { ok: true, item: await content.add({ ...b, publish: b.publish !== false }, 'admin') }); } catch (e) { return out(400, { error: e.message }); } }
    if (a === 'tm_request') {
      const r = await store.get(clean(b.id, 40)); if (!r || r.type !== 'brief' || !r.email) return out(404, { error: 'Brief not found.' });
      try { const x = await content.request(r); const item = await store.update(r.id, { testimonial: { ...(r.testimonial || {}), asked: Date.now() }, thread: [...(r.thread || []), { dir: 'out', at: Date.now(), subject: 'Testimonial request', body: 'Asked for a testimonial: ' + x.url, by: user.name }] }); return out(200, { ok: true, item: flag(item, now) }); }
      catch (e) { return out(502, { error: 'Email failed: ' + e.message }); }
    }

    /* ----- short links ----- */
    if (a === 'links_act') { try { await links.act(b.code, b.op); return out(200, { ok: true }); } catch (e) { return out(400, { error: e.message }); } }

    return out(404, { error: 'Unknown action.' });
  } catch (e) {
    console.error('admin:', e.message);
    return out(500, { error: 'Something went wrong. Try again.' });
  } finally {
    if (user && AUDITED.has(a)) await audit.log(req, user, a, audit.detailOf(a, body, q), status);
  }
};
const SITE_UNSUB = 'https://aashishpandey.com/api/newsletter?a=unsubscribe';
