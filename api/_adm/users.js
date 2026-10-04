// Team accounts and roles. The owner signs in with ADMIN_PASSWORD (as before); everyone else has an account here.
// Roles: owner (everything) · assistant (work the inbox: reply, set stage and status, notes; no delete, no export, no settings) · viewer (read only).
const crypto = require('crypto');
const { redis } = require('../_lib');

const ROLES = ['owner', 'assistant', 'viewer'];
const READ = new Set(['me', 'list', 'links_list', 'spam_get', 'alerts_get', 'news_overview', 'tpl_get', 'sec_get', 'push_key', 'push_subscribe', 'push_unsubscribe', 'push_test', 'pw_change', 'totp_setup', 'totp_enable', 'totp_disable', 'digest_get']);
const ASSIST = new Set([...READ, 'update', 'reply_get', 'reply_send', 'thread_note', 'resend', 'bulk']);
// owner-only: export, delete, templates, spam rules, alerts, newsletter, short links, backups, team, activity log, quotes, sign out everywhere
function can(role, action, body) {
  if (role === 'owner') return true;
  if (role === 'assistant') {
    if (action === 'bulk') { const a = String((body && body.action) || ''); return a.startsWith('status:') || a === 'notspam'; }   // not delete, not block
    return ASSIST.has(action);
  }
  return role === 'viewer' && READ.has(action);
}

const all = async () => { const raw = await redis('GET', 'admin:users'); return raw ? JSON.parse(raw) : {}; };
const save = (m) => redis('SET', 'admin:users', JSON.stringify(m));
const pub = (u) => u && ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, createdAt: u.createdAt, lastLogin: u.lastLogin || 0, mustChange: !!u.mustChange });

const hash = (pw, salt) => { salt = salt || crypto.randomBytes(16).toString('hex'); return `scrypt$${salt}$${crypto.scryptSync(String(pw), salt, 32).toString('hex')}`; };
function verify(pw, stored) {
  const [, salt, h] = String(stored || '').split('$'); if (!salt || !h) return false;
  const x = crypto.scryptSync(String(pw), salt, 32), y = Buffer.from(h, 'hex');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
const A = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
function genPassword() { let s = ''; for (const b of crypto.randomBytes(14)) s += A[b % A.length]; return s.slice(0, 4) + '-' + s.slice(4, 9) + '-' + s.slice(9, 14); }

async function add({ name, email, role }) {
  const m = await all(); email = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('That email address does not look right.');
  if (!ROLES.includes(role) || role === 'owner') throw new Error('Choose assistant or viewer.');
  if (Object.values(m).some((u) => u.email === email)) throw new Error('Someone with that email already exists.');
  const pw = genPassword(), id = crypto.randomBytes(5).toString('hex');
  m[id] = { id, name: String(name || '').trim().slice(0, 60) || email, email, role, active: true, createdAt: Date.now(), pwHash: hash(pw), mustChange: true };
  await save(m); return { user: pub(m[id]), password: pw };
}
async function byEmail(email) { email = String(email || '').trim().toLowerCase(); return Object.values(await all()).find((u) => u.email === email) || null; }
async function get(id) { return (await all())[id] || null; }
async function update(id, patch) {
  const m = await all(); const u = m[id]; if (!u) throw new Error('User not found.');
  if (patch.role !== undefined) { if (!ROLES.includes(patch.role) || patch.role === 'owner') throw new Error('Choose assistant or viewer.'); u.role = patch.role; }
  if (patch.active !== undefined) u.active = !!patch.active;
  let password;
  if (patch.resetPassword) { password = genPassword(); u.pwHash = hash(password); u.mustChange = true; }
  if (patch.newPassword) { u.pwHash = hash(patch.newPassword); u.mustChange = false; }
  if (patch.lastLogin) u.lastLogin = patch.lastLogin;
  await save(m); return { user: pub(u), password };
}
async function remove(id) { const m = await all(); delete m[id]; await save(m); await redis('DEL', 'admin:totp:' + id); }

module.exports = { ROLES, can, all, pub, hash, verify, genPassword, add, byEmail, get, update, remove };
