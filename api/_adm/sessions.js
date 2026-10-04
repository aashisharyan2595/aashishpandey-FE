// Active sign-ins. Each sign-in is a record that can be ended at any time; the cookie is only valid while its record exists.
const crypto = require('crypto');
const { redis } = require('../_lib');
const TTL = 12 * 3600;

async function create(user, info, ip) {
  const id = crypto.randomBytes(12).toString('hex'), now = Date.now();
  const rec = { id, uid: user.id, name: user.name, role: user.role, created: now, last: now, ip, geo: info.geo, device: info.device, client: info.client, loc: info.loc, distanceKm: info.distanceKm, mismatch: info.mismatch, tzMismatch: info.tzMismatch };
  await redis('SET', 'sess:' + id, JSON.stringify(rec), 'EX', TTL); await redis('ZADD', 'sess', now, id);
  return rec;
}
async function get(id) { if (!/^[a-f0-9]{24}$/.test(String(id || ''))) return null; const raw = await redis('GET', 'sess:' + id); return raw ? JSON.parse(raw) : null; }
async function touch(rec) {   // remember when it was last used, at most once a minute
  const now = Date.now(); if (now - rec.last < 60000) return;
  rec.last = now; const left = Math.max(60, Math.floor((rec.created + TTL * 1000 - now) / 1000));
  await redis('SET', 'sess:' + rec.id, JSON.stringify(rec), 'EX', left);
}
async function list() {
  const ids = (await redis('ZREVRANGE', 'sess', 0, 199)) || []; if (!ids.length) return [];
  const rows = await redis('MGET', ...ids.map((i) => 'sess:' + i)), out = [];
  rows.forEach((r, i) => { if (r) { try { out.push(JSON.parse(r)); } catch (e) { /* skip */ } } else redis('ZREM', 'sess', ids[i]).catch(() => {}); });   // expired ones fall out of the index
  return out;
}
async function revoke(id) { await redis('DEL', 'sess:' + id); await redis('ZREM', 'sess', id); }
async function revokeUser(uid) { for (const s of await list()) if (s.uid === uid) await revoke(s.id); }
async function revokeAll() { for (const s of await list()) await revoke(s.id); }
module.exports = { create, get, touch, list, revoke, revokeUser, revokeAll };
