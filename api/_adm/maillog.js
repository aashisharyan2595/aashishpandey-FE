// Delivery log. Every email the site sends is recorded when it leaves (with the id Resend gives it), and Resend's webhook
// then tells us what happened to it: delivered, delayed, bounced, reported as spam, opened. Bounced and spam-reporting addresses are blocked.
const { redis } = require('../_lib');
const TTL = 180 * 86400;   // log entries expire on their own after six months
const RANK = { sent: 1, delayed: 2, delivered: 3, failed: 4, bounced: 5, complained: 6 };   // later in the story wins, and bad news always wins
const TYPE = { 'email.sent': 'sent', 'email.delivered': 'delivered', 'email.delivery_delayed': 'delayed', 'email.bounced': 'bounced', 'email.complained': 'complained', 'email.failed': 'failed', 'email.opened': 'opened', 'email.clicked': 'clicked' };

const key = (id) => 'mail:' + id;
async function load(id) { const raw = await redis('GET', key(id)); return raw ? JSON.parse(raw) : null; }
const save = (r) => redis('SET', key(r.id), JSON.stringify(r), 'EX', TTL);

async function record({ id, to, subject, kind, ref }) {
  if (!id) return;
  const at = Date.now(), existing = await load(id);   // a webhook can beat us here; keep what it already learned
  const rec = existing ? { ...existing, to: [].concat(to).join(', '), subject: String(subject || '').slice(0, 140), kind: kind || 'other', ref: ref || '' }
    : { id, to: [].concat(to).join(', '), subject: String(subject || '').slice(0, 140), kind: kind || 'other', ref: ref || '', at, status: 'sent', events: [{ type: 'sent', at }] };
  await save(rec); await redis('ZADD', 'maillog', rec.at, id);
}

/* ---------- blocked addresses ---------- */
async function suppressed() { const raw = await redis('GET', 'mail:suppressed'); return raw ? JSON.parse(raw) : {}; }
async function isSuppressed(email) { return !!(await suppressed())[String(email || '').toLowerCase()]; }
async function suppress(email, reason) { const m = await suppressed(); m[String(email).toLowerCase()] = { reason: reason || 'manual', at: Date.now() }; await redis('SET', 'mail:suppressed', JSON.stringify(m)); }
async function unsuppress(email) { const m = await suppressed(); delete m[String(email).toLowerCase()]; await redis('SET', 'mail:suppressed', JSON.stringify(m)); }

/* ---------- what Resend tells us ---------- */
async function event(p) {
  const type = TYPE[p && p.type], d = (p && p.data) || {}, id = d.email_id;
  if (!type || !id) return { ignored: true };
  const at = Date.parse(p.created_at) || Date.now();
  let rec = await load(id);
  if (!rec) rec = { id, to: [].concat(d.to || []).join(', '), subject: String(d.subject || '').slice(0, 140), kind: 'other', ref: '', at, status: 'sent', events: [] };
  if (rec.events.some((e) => e.type === type && Math.abs(e.at - at) < 1000)) return { duplicate: true };   // webhooks are sometimes delivered twice
  const detail = d.bounce ? [d.bounce.type, d.bounce.subType, d.bounce.message].filter(Boolean).join(': ').slice(0, 300) : d.reason ? String(d.reason).slice(0, 200) : '';
  rec.events.push({ type, at, ...(detail ? { detail } : {}) }); rec.events.sort((a, b) => a.at - b.at);
  if (type === 'opened') rec.opened = true; else if (type === 'clicked') rec.clicked = true;
  else if ((RANK[type] || 0) >= (RANK[rec.status] || 0)) rec.status = type;
  await save(rec); await redis('ZADD', 'maillog', rec.at, id);
  // a hard bounce or a spam complaint: stop writing to that address (the permanent kind only; a full mailbox can recover)
  if (type === 'complained' || (type === 'bounced' && !/transient|temporary/i.test((d.bounce && d.bounce.type) || ''))) for (const a of [].concat(d.to || [])) await suppress(a, type);
  return { ok: true, status: rec.status };
}

/* ---------- reading the log ---------- */
async function all(cap = 1500) {
  const ids = (await redis('ZREVRANGE', 'maillog', 0, cap - 1)) || [], out = [];
  for (let i = 0; i < ids.length; i += 200) { const rows = await redis('MGET', ...ids.slice(i, i + 200).map(key)); for (const r of rows) { if (r) { try { out.push(JSON.parse(r)); } catch (e) { /* skip */ } } } }
  return out;
}
function stats(rows) {
  const since = Date.now() - 30 * 864e5, r = rows.filter((x) => x.at > since), n = (s) => r.filter((x) => x.status === s).length;
  const settled = n('delivered') + n('bounced') + n('complained') + n('failed');
  return { total: r.length, delivered: n('delivered'), sent: n('sent'), delayed: n('delayed'), bounced: n('bounced'), complained: n('complained'), failed: n('failed'), opened: r.filter((x) => x.opened).length, rate: settled ? Math.round(100 * n('delivered') / settled) : null };
}
module.exports = { record, event, all, stats, suppressed, isSuppressed, suppress, unsuppress };
