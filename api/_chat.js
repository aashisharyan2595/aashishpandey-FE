// Blind relay for the private chat room's connection handshake. Served through /api/config?a=chat so no new function is needed.
// The page derives a mailbox id from a secret that lives in the URL fragment (the browser never sends a fragment to any server)
// and encrypts every blob with a key from the same secret. All this file ever stores is random-looking ids and sealed text,
// for at most 15 minutes. Messages, files and keys never pass through here: they travel browser to browser (WebRTC).
//   POST   { m, i, b }        append blob b to mailbox m as sender i           -> 201 | 409 full | 429
//   GET    ?m=..&i=..&since=N  blobs appended after position N by anyone but i  -> 200 { n, items:[{i,b}] }
//   DELETE ?m=..              empty the mailbox once both sides are connected  -> 204
// Storage: Upstash when UPSTASH_REDIS_REST_URL/TOKEN work, otherwise this serverless instance's own memory (no outside service at all).
// Memory is per warm instance and short lived, which is fine for a 15 minute handshake; if two requests land on different instances the page falls back to manual pairing.
const { redis, ip } = require('./_lib');

const TTL = 900, MAX_BLOB = 12000, MAX_ITEMS = 60, POSTS_PER_HOUR = 200, POLLS_PER_HOUR = 3000;
const MB = /^[a-f0-9]{32}$/, ID = /^[a-f0-9]{12}$/, B64 = /^[A-Za-z0-9_-]+$/;

const mem = new Map();
const sweep = () => { const t = Date.now(); for (const [k, v] of mem) if (v.exp && v.exp < t) mem.delete(k); };
const memKv = async (cmd, k, a, b) => {
  sweep();
  const e = mem.get(k);
  switch (cmd) {
    case 'INCR': { const v = e || { val: 0 }; v.val = (v.val || 0) + 1; mem.set(k, v); return v.val; }
    case 'EXPIRE': { if (e) e.exp = Date.now() + a * 1000; return 1; }
    case 'LLEN': return e && e.list ? e.list.length : 0;
    case 'RPUSH': { const v = e || { list: [] }; v.list = v.list || []; v.list.push(a); mem.set(k, v); return v.list.length; }
    case 'LRANGE': { const l = (e && e.list) || []; return l.slice(a, b === -1 || b === undefined ? undefined : b + 1); }
    case 'DEL': mem.delete(k); return 1;
  }
};
let useRedis = !!process.env.UPSTASH_REDIS_REST_URL;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const q = req.query || {};
  const m = String((req.method === 'POST' ? body.m : q.m) || '');
  if (!MB.test(m)) return res.status(400).json({ error: 'Bad request.' });
  const key = `chat:${m}`;
  const kv = (...a) => (useRedis ? redis(...a).catch(e => { if (/NOPERM|WRONGPASS|Unauthorized|401|403|fetch|not configured/i.test(String(e && e.message))) { useRedis = false; return memKv(...a); } throw e; }) : memKv(...a));
  try {
    if (req.method === 'POST') {
      const i = String(body.i || ''), b = body.b;
      if (!ID.test(i) || typeof b !== 'string' || b.length < 20 || b.length > MAX_BLOB || !B64.test(b)) return res.status(400).json({ error: 'Bad request.' });
      const k = `rl:chatp:${ip(req)}`, n = await kv('INCR', k);
      if (n === 1) await kv('EXPIRE', k, 3600);
      if (n > POSTS_PER_HOUR) return res.status(429).json({ error: 'Too many attempts. Try again later.' });
      if ((await kv('LLEN', key)) >= MAX_ITEMS) return res.status(409).json({ error: 'Room is full.' });
      await kv('RPUSH', key, JSON.stringify({ i, b }));
      await kv('EXPIRE', key, TTL);
      return res.status(201).json({ ok: true });
    }
    if (req.method === 'GET') {
      const i = String(q.i || ''), since = Math.max(0, Math.min(MAX_ITEMS, parseInt(q.since, 10) || 0));
      if (!ID.test(i)) return res.status(400).json({ error: 'Bad request.' });
      const k = `rl:chatg:${ip(req)}`, n = await kv('INCR', k);
      if (n === 1) await kv('EXPIRE', k, 3600);
      if (n > POLLS_PER_HOUR) return res.status(429).json({ error: 'Too many requests.' });
      const total = Number(await kv('LLEN', key)) || 0;
      const rows = since >= total ? [] : ((await kv('LRANGE', key, since, total - 1)) || []);
      const items = [];
      for (const r of rows) { try { const x = JSON.parse(r); if (x.i !== i) items.push(x); } catch (e) { /* skip */ } }
      return res.status(200).json({ n: total, items });
    }
    if (req.method === 'DELETE') { await kv('DEL', key); return res.status(204).end(); }
    return res.status(405).json({ error: 'Not allowed.' });
  } catch (e) {
    console.error('chat relay:', e.message);
    const m = String(e && e.message || e).replace(/[A-Za-z0-9_\-]{24,}/g, '…').slice(0, 90);
    return res.status(500).json({ error: 'Relay error.', detail: m });
  }
};
