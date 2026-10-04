// Admin backend for the submissions page. Path is deliberately unlisted; never link to it. Password from ADMIN_PASSWORD (Vercel env), signed cookie session.
//   POST login {password} | POST logout | GET me
//   GET  list   &type=brief|subscriber &status= &q= &from=YYYY-MM-DD &to= &offset= &limit=
//   GET  export &format=csv|xlsx|json  (same filters, or &ids=a,b,c for a selection)
//   POST update {id, status?, note?} | POST delete {ids:[...]} | POST resend {id, which:'admin'|'user'}
const crypto = require('crypto');
const { env, sendMail, clean, parseBody, clientIp, limited, link } = require('./_mail');
const T = require('./_templates');
const store = require('./_store');
const { makeXlsx } = require('./_xlsx');

const COOKIE = 'ap_admin', TTL = 12 * 3600;
const STATUSES = ['new', 'replied', 'spam', 'archived', 'pending', 'subscribed', 'unsubscribed'];
const secret = () => process.env.ADMIN_SECRET || crypto.createHash('sha256').update('ap-admin|' + (process.env.ADMIN_PASSWORD || '')).digest('hex');
const b64 = (s) => Buffer.from(s).toString('base64url');
const sig = (p) => crypto.createHmac('sha256', secret()).update(p).digest('base64url');
const issue = () => { const p = b64(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + TTL })); return p + '.' + sig(p); };
function authed(req) {
  const m = String(req.headers.cookie || '').match(new RegExp('(?:^|; )' + COOKIE + '=([^;]+)'));
  if (!m) return false;
  const [p, s] = m[1].split('.'); if (!p || !s) return false;
  const a = Buffer.from(sig(p)), b = Buffer.from(s);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try { return JSON.parse(Buffer.from(p, 'base64url').toString()).exp > Date.now() / 1000; } catch (e) { return false; }
}
const setCookie = (res, v, age) => res.setHeader('Set-Cookie', `${COOKIE}=${v}; Path=/; Max-Age=${age}; HttpOnly; Secure; SameSite=Strict`);
const sameOrigin = (req) => { const o = req.headers.origin; if (!o) return true; try { return new URL(o).host === req.headers.host; } catch (e) { return false; } };
const eq = (a, b) => { const x = crypto.createHash('sha256').update(String(a)).digest(), y = crypto.createHash('sha256').update(String(b)).digest(); return crypto.timingSafeEqual(x, y); };

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

/* ---------- export ---------- */
const HEAD = ['ID', 'Received (IST)', 'Type', 'Status', 'Name', 'Email', 'Company', 'Website', 'Looking for', 'Budget', 'Timeline', 'Message', 'Came from', 'Page', 'Referrer', 'Alert email', 'Confirmation email', 'Notes'];
const ist = (ms) => new Date(ms).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }).replace(',', '');
const toRow = (r) => [r.id, ist(r.created), r.type, r.status, r.name, r.email, r.company, r.website_url, r.service, r.budget, r.timeline, r.message, r.source, r.page, r.ref,
  r.mail && r.mail.admin || '', r.mail && r.mail.user || '', r.note].map((v) => (v == null ? '' : String(v)));
// a cell that starts with = + - @ can run as a formula when the CSV is opened in Excel; a leading apostrophe stops that
const csvCell = (v) => { let s = String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = (rows) => '﻿' + [HEAD, ...rows.map(toRow)].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';

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
    if (a === 'login' && post) {
      if (await limited('adminlogin', clientIp(req), 8, 900)) return out(429, { error: 'Too many tries. Wait 15 minutes.' });
      const b = parseBody(req);
      if (!b.password || !eq(b.password, process.env.ADMIN_PASSWORD)) return out(401, { error: 'Wrong password.' });
      setCookie(res, issue(), TTL); return out(200, { ok: true });
    }
    if (a === 'logout') { setCookie(res, '', 0); return out(200, { ok: true }); }
    if (!authed(req)) return out(401, { error: 'Sign in required.' });
    if (a === 'me') return out(200, { ok: true });

    if (a === 'list') {
      const rows = await store.all();
      const hit = filter(rows, q), off = Math.max(0, Number(q.offset) || 0), lim = Math.min(500, Number(q.limit) || 200);
      const count = (f) => rows.filter(f).length;
      return out(200, {
        total: hit.length, items: hit.slice(off, off + lim),
        counts: { all: rows.length, brief: count((r) => r.type === 'brief'), newBriefs: count((r) => r.type === 'brief' && r.status === 'new'), subscriber: count((r) => r.type === 'subscriber'), mailfail: count((r) => r.mail && (r.mail.admin === 'failed' || r.mail.user === 'failed')) },
      });
    }
    if (a === 'export') {
      const hit = filter(await store.all(), q), fmt = String(q.format || 'csv'), stamp = new Date().toISOString().slice(0, 10), base = `submissions-${stamp}`;
      if (fmt === 'json') { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="${base}.json"`); return res.status(200).send(JSON.stringify(hit, null, 2)); }
      if (fmt === 'xlsx') { res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', `attachment; filename="${base}.xlsx"`); return res.status(200).send(makeXlsx([HEAD, ...hit.map(toRow)])); }
      res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="${base}.csv"`); return res.status(200).send(csv(hit));
    }
    if (!post) return out(405, { error: 'Use POST.' });
    const b = parseBody(req);

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
    return out(404, { error: 'Unknown action.' });
  } catch (e) {
    console.error('admin:', e.message);
    return out(500, { error: 'Something went wrong. Try again.' });
  }
};
