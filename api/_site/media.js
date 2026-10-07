// Images uploaded from the admin. The browser shrinks them first (WebP, long side 1600 px, under about 450 KB); the server checks the type
// by its first bytes and keeps a hard size limit. Stored in Redis and served from /media/<id> with a one-year cache (ids are never reused).
//   media:meta:<id>   JSON about the image          media:blob:<id>   base64 data          media:idx   sorted set by upload time
const crypto = require('crypto');
const { redis } = require('../_lib');

const MAX = 520 * 1024;   // decoded bytes; base64 adds a third, and the database accepts about 1 MB per request
const sniff = (b) => (b.length > 12 && b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP' ? 'image/webp' : b[0] === 0xff && b[1] === 0xd8 ? 'image/jpeg' : b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ? 'image/png' : b.slice(0, 3).toString() === 'GIF' ? 'image/gif' : '');
const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>"]/g, '').trim().slice(0, n);

async function put(d, who) {
  const raw = String(d.data || '').replace(/^data:[^,]*,/, ''), buf = Buffer.from(raw, 'base64');
  if (!buf.length) throw new Error('No image data.');
  if (buf.length > MAX) throw new Error('That image is ' + Math.round(buf.length / 1024) + ' KB after shrinking. The limit is ' + Math.round(MAX / 1024) + ' KB. Try a smaller picture.');
  const mime = sniff(buf); if (!mime) throw new Error('Only WebP, JPEG, PNG and GIF images are accepted.');
  const id = Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
  const meta = { id, mime, size: buf.length, w: Math.min(9999, Number(d.w) || 0), h: Math.min(9999, Number(d.h) || 0), name: clean(d.name, 80) || 'image', alt: clean(d.alt, 160), by: (who && who.name) || '', uid: (who && who.id) || '', at: Date.now() };
  await redis('SET', 'media:blob:' + id, buf.toString('base64')); await redis('SET', 'media:meta:' + id, JSON.stringify(meta)); await redis('ZADD', 'media:idx', meta.at, id);
  return meta;
}
async function list(n) {
  const ids = (await redis('ZREVRANGE', 'media:idx', 0, (n || 200) - 1)) || []; if (!ids.length) return [];
  const rows = await redis('MGET', ...ids.map((i) => 'media:meta:' + i));
  return rows.map((r) => { try { return r ? JSON.parse(r) : null; } catch (e) { return null; } }).filter(Boolean);
}
async function meta(id) { if (!/^[a-z0-9]{6,20}$/.test(String(id || ''))) return null; const r = await redis('GET', 'media:meta:' + id); return r ? JSON.parse(r) : null; }
async function blob(id) { if (!/^[a-z0-9]{6,20}$/.test(String(id || ''))) return null; const m = await meta(id); if (!m) return null; const b = await redis('GET', 'media:blob:' + id); return b ? { meta: m, data: Buffer.from(b, 'base64') } : null; }
async function update(id, patch) { const m = await meta(id); if (!m) throw new Error('Not found.'); if (patch.alt !== undefined) m.alt = clean(patch.alt, 160); if (patch.name !== undefined) m.name = clean(patch.name, 80) || m.name; await redis('SET', 'media:meta:' + id, JSON.stringify(m)); return m; }
async function remove(id) { if (!(await meta(id))) return false; await redis('DEL', 'media:blob:' + id); await redis('DEL', 'media:meta:' + id); await redis('ZREM', 'media:idx', id); return true; }
module.exports = { MAX, put, list, meta, blob, update, remove };
