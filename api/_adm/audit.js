// Activity log: who did what, when, from where. Newest first, the latest 3000 entries are kept.
const { redis } = require('../_lib');
const { clientIp } = require('../_mail');

// pick the parts of a request worth recording (never message text or passwords)
function detailOf(a, b, q) {
  const o = {};
  if (b) {
    if (Array.isArray(b.ids)) o.records = b.ids.length; else if (b.id) o.record = String(b.id).slice(0, 30);
    for (const k of ['action', 'status', 'stage', 'which', 'op', 'key', 'code', 'role', 'name', 'email', 'value', 'currency', 'followUp']) if (b[k] !== undefined && b[k] !== '' && k !== 'code') o[k] = String(b[k]).slice(0, 60);
    if (b.code !== undefined && a.startsWith('links_')) o.code = String(b.code).slice(0, 40);
    if (b.min) o.level = String(b.min);
    if (b.subject) o.subject = String(b.subject).slice(0, 80);
  }
  if (q) for (const k of ['format', 'type', 'status', 'ids']) if (q[k]) o[k] = k === 'ids' ? String(q[k]).split(',').length + ' selected' : String(q[k]).slice(0, 40);
  return o;
}
async function log(req, user, action, detail, status) {
  const e = { t: Date.now(), uid: user ? user.id : '', name: user ? user.name : '', role: user ? user.role : '', action, detail: detail || {}, status: status || 200, ip: clientIp(req), ua: String((req.headers && req.headers['user-agent']) || '').slice(0, 100) };
  try { await redis('LPUSH', 'admin:audit', JSON.stringify(e)); await redis('LTRIM', 'admin:audit', 0, 2999); } catch (err) { console.error('audit failed', err.message); }
}
async function list(opts = {}) {
  const rows = ((await redis('LRANGE', 'admin:audit', 0, 2999)) || []).map((r) => { try { return JSON.parse(r); } catch (e) { return null; } }).filter(Boolean);
  const text = String(opts.q || '').toLowerCase();
  return rows.filter((r) => (!opts.user || r.uid === opts.user) && (!opts.action || r.action === opts.action) && (!text || JSON.stringify(r).toLowerCase().includes(text))).slice(0, opts.limit || 300);
}
module.exports = { log, list, detailOf };
