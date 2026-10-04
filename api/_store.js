// Submission store for the admin page. Upstash Redis over REST (same database as the URL shortener), no npm deps.
// Every brief and every newsletter event is written here BEFORE any email is sent, so nothing is lost if mail fails.
//   sub:<id>        JSON record
//   subs            sorted set of ids, score = created time (ms)
//   subemail:<mail> id of that address's subscriber record
const { redis } = require('./_lib');
const crypto = require('crypto');

const enabled = () => !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const newId = () => Date.now().toString(36) + '-' + crypto.randomBytes(4).toString('hex');

async function add(rec) {
  if (!enabled()) return null;
  const id = newId(), created = Date.now();
  const full = { id, created, updated: created, ...rec };
  await redis('SET', `sub:${id}`, JSON.stringify(full));
  await redis('ZADD', 'subs', created, id);
  return full;
}
async function get(id) {
  const raw = await redis('GET', `sub:${id}`);
  return raw ? JSON.parse(raw) : null;
}
async function update(id, patch) {
  if (!enabled() || !id) return null;
  const cur = await get(id);
  if (!cur) return null;
  const next = { ...cur, ...patch, mail: { ...(cur.mail || {}), ...(patch.mail || {}) }, updated: Date.now() };
  await redis('SET', `sub:${id}`, JSON.stringify(next));
  return next;
}
async function remove(ids) {
  for (const id of ids) {
    const cur = await get(id);
    if (cur && cur.type === 'subscriber' && cur.email) await redis('DEL', `subemail:${cur.email}`);
    await redis('DEL', `sub:${id}`);
    await redis('ZREM', 'subs', id);
  }
}
// newest first; capped so one request stays fast
async function all(cap = 5000) {
  const ids = await redis('ZREVRANGE', 'subs', 0, cap - 1);
  const out = [];
  for (let i = 0; i < ids.length; i += 200) {
    const rows = await redis('MGET', ...ids.slice(i, i + 200).map((x) => `sub:${x}`));
    for (const r of rows) { if (r) { try { out.push(JSON.parse(r)); } catch (e) { /* skip a damaged record */ } } }
  }
  return out;
}
// one record per subscriber address; later events (confirmed, unsubscribed) update it
async function subscriber(email, patch) {
  if (!enabled()) return null;
  const k = `subemail:${email}`;
  const id = await redis('GET', k);
  if (id) { const u = await update(id, patch); if (u) return u; }
  const rec = await add({ type: 'subscriber', email, name: '', status: 'pending', ...patch });
  if (rec) await redis('SET', k, rec.id);
  return rec;
}

module.exports = { enabled, add, get, update, remove, all, subscriber };
