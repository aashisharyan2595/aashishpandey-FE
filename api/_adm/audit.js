// Activity log: who did what, when, from where. Newest first, the latest 3000 entries are kept.
// Tamper evidence: every entry carries a sequence number (one counter, so a missing number shows a deleted entry) and an HMAC
// of its contents (so an edited entry no longer matches). Someone with database access can still wipe the list, but cannot
// quietly change or remove single entries. Entries written before this existed are reported as "not signed".
const crypto = require('crypto');
const { redis } = require('../_lib');
const { clientIp } = require('../_mail');
const KEEP = 3000;

const key = () => process.env.AUDIT_KEY || process.env.ADMIN_SECRET || crypto.createHash('sha256').update('ap-audit|' + (process.env.ADMIN_PASSWORD || '')).digest('hex');
const body = (e) => JSON.stringify([e.seq, e.t, e.uid, e.name, e.role, e.action, e.detail, e.status, e.ip, e.ua]);
const mac = (e) => crypto.createHmac('sha256', key()).update(body(e)).digest('base64url').slice(0, 32);

// pick the parts of a request worth recording (never message text or passwords)
function detailOf(a, b, q) {
  const o = {};
  if (b) {
    if (Array.isArray(b.ids)) o.records = b.ids.length; else if (b.id) o.record = String(b.id).slice(0, 30);
    for (const k of ['action', 'status', 'stage', 'which', 'op', 'key', 'code', 'role', 'name', 'email', 'value', 'currency', 'followUp', 'title', 'slug', 'type']) if (b[k] !== undefined && b[k] !== '' && k !== 'code') o[k] = String(b[k]).slice(0, 60);
    if (b.code !== undefined && a.startsWith('links_')) o.code = String(b.code).slice(0, 40);
    if (b.min) o.level = String(b.min);
    if (b._sum) o.changed = String(b._sum).slice(0, 200);   // set by the handler after a save: which settings changed (never the values)
    if (b.subject) o.subject = String(b.subject).slice(0, 80);
    if (a.startsWith('privacy_')) delete o.email;   // a privacy request must not leave the address behind in the log
  }
  if (q) for (const k of ['format', 'type', 'status', 'ids', 'from', 'to']) if (q[k]) o[k] = k === 'ids' ? String(q[k]).split(',').length + ' selected' : String(q[k]).slice(0, 40);
  return o;
}
async function log(req, user, action, detail, status) {
  const e = { t: Date.now(), uid: user ? user.id : '', name: user ? user.name : '', role: user ? user.role : '', action, detail: detail || {}, status: status || 200, ip: clientIp(req), ua: String((req.headers && req.headers['user-agent']) || '').slice(0, 100) };
  try { e.seq = Number(await redis('INCR', 'admin:audit:seq')); e.mac = mac(e); await redis('LPUSH', 'admin:audit', JSON.stringify(e)); await redis('LTRIM', 'admin:audit', 0, KEEP - 1); } catch (err) { console.error('audit failed', err.message); }
}
async function rows() { return ((await redis('LRANGE', 'admin:audit', 0, KEEP - 1)) || []).map((r) => { try { return JSON.parse(r); } catch (e) { return null; } }).filter(Boolean); }

// kinds group the actions so the log can be narrowed without knowing their names
const KIND = { signin: (a) => a === 'login' || a === 'reauth', denied: (a) => /^denied:|^stepup:/.test(a), exports: (a) => ['export', 'audit_export', 'privacy_export', 'backup_now'].includes(a), people: (a) => /^(users_|roles_|sessions_|signout_all|totp_|pw_change|policy_save)/.test(a), privacy: (a) => a.startsWith('privacy_') };
function filter(all, o) {
  const text = String(o.q || '').toLowerCase(), from = o.from ? Date.parse(o.from + 'T00:00:00+05:30') : 0, to = o.to ? Date.parse(o.to + 'T23:59:59+05:30') : Infinity, k = KIND[o.kind];
  return all.filter((r) => (!o.user || r.uid === o.user) && (!o.action || r.action === o.action) && (!k || k(r.action)) && r.t >= from && r.t <= to && (!text || JSON.stringify(r).toLowerCase().includes(text)));
}
async function list(opts = {}) {
  const hit = filter(await rows(), opts);
  return { items: hit.slice(0, opts.limit || 300).map(({ mac: m, ...r }) => r), total: hit.length };
}

// re-check every signature, and look for missing sequence numbers between the oldest and newest signed entry
async function verify() {
  const all = await rows(), signed = all.filter((r) => r.seq && r.mac), bad = [];
  for (const r of signed) { const want = Buffer.from(mac(r)), got = Buffer.from(String(r.mac)); if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) bad.push(r.seq); }
  const seqs = [...new Set(signed.map((r) => r.seq))].sort((a, b) => a - b), gaps = [];
  for (let i = 1; i < seqs.length; i++) if (seqs[i] - seqs[i - 1] > 1) gaps.push([seqs[i - 1] + 1, seqs[i] - 1]);
  const missing = gaps.reduce((s, g) => s + g[1] - g[0] + 1, 0);
  const res = { at: Date.now(), total: all.length, signed: signed.length, legacy: all.length - signed.length, bad: bad.length, badSeqs: bad.slice(0, 20), gaps: missing, gapRanges: gaps.slice(0, 20), first: seqs[0] || 0, last: seqs[seqs.length - 1] || 0 };
  await redis('SET', 'admin:audit:check', JSON.stringify(res)).catch(() => {});
  return res;
}
async function lastCheck() { try { const raw = await redis('GET', 'admin:audit:check'); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }

const cell = (v) => { const s = String(v == null ? '' : v); return /^[=+\-@\t\r]/.test(s) ? "'" + s : s; };   // stop spreadsheet formulas
const csvq = (v) => '"' + cell(v).replace(/"/g, '""') + '"';
function csv(items) {
  const head = ['seq', 'time_utc', 'person', 'role', 'action', 'result', 'details', 'ip', 'browser'];
  return '﻿' + [head.join(',')].concat(items.map((r) => [r.seq || '', new Date(r.t).toISOString(), r.name || r.uid, r.role, r.action, r.status, Object.entries(r.detail || {}).map(([k, v]) => k + ': ' + v).join('; '), r.ip, r.ua].map(csvq).join(','))).join('\r\n');
}
async function exportCsv(opts) { return csv(filter(await rows(), opts)); }
module.exports = { log, list, detailOf, verify, lastCheck, exportCsv };
