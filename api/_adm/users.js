// Team accounts and roles. The owner signs in with ADMIN_PASSWORD (as before); everyone else has an account here.
// Roles and permissions live in perms.js; here is the person, their role id, and their public profile (name, bio, photo) used on posts.
const crypto = require('crypto');
const { redis } = require('../_lib');

const perms = require('./perms');
const ownerRole = 'owner';

const all = async () => { const raw = await redis('GET', 'admin:users'); return raw ? JSON.parse(raw) : {}; };
const save = (m) => redis('SET', 'admin:users', JSON.stringify(m));
const pub = (u) => u && ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, createdAt: u.createdAt, lastLogin: u.lastLogin || 0, mustChange: !!u.mustChange, bio: u.bio || '', avatar: u.avatar || '' });

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
  if (role === 'owner' || !(await perms.exists(role))) throw new Error('Choose a role from the list.');
  if (Object.values(m).some((u) => u.email === email)) throw new Error('Someone with that email already exists.');
  const pw = genPassword(), id = crypto.randomBytes(5).toString('hex');
  m[id] = { id, name: String(name || '').trim().slice(0, 60) || email, email, role, active: true, createdAt: Date.now(), pwHash: hash(pw), mustChange: true };
  await save(m); return { user: pub(m[id]), password: pw };
}
async function byEmail(email) { email = String(email || '').trim().toLowerCase(); return Object.values(await all()).find((u) => u.email === email) || null; }
async function get(id) { return (await all())[id] || null; }
async function update(id, patch) {
  const m = await all(); const u = m[id]; if (!u) throw new Error('User not found.');
  if (patch.role !== undefined) { if (patch.role === 'owner' || !(await perms.exists(patch.role))) throw new Error('Choose a role from the list.'); u.role = patch.role; }
  if (patch.name !== undefined) u.name = String(patch.name).trim().slice(0, 60) || u.name;
  if (patch.bio !== undefined) u.bio = String(patch.bio).replace(/[<>]/g, '').trim().slice(0, 400);
  if (patch.avatar !== undefined) u.avatar = /^(\/media\/[a-z0-9]+)?$/.test(String(patch.avatar)) ? String(patch.avatar) : u.avatar;
  if (patch.active !== undefined) u.active = !!patch.active;
  let password;
  if (patch.resetPassword) { password = genPassword(); u.pwHash = hash(password); u.mustChange = true; }
  if (patch.newPassword) { u.pwHash = hash(patch.newPassword); u.mustChange = false; }
  if (patch.lastLogin) u.lastLogin = patch.lastLogin;
  await save(m); return { user: pub(u), password };
}
async function remove(id) { const m = await all(); delete m[id]; await save(m); await redis('DEL', 'admin:totp:' + id); }

module.exports = { all, pub, hash, verify, genPassword, add, byEmail, get, update, remove };
