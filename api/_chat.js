// Blind relay for the private chat room's connection handshake. Served through /api/config?a=chat so no new function is needed.
// The page derives a mailbox id from a secret that lives in the URL fragment (the browser never sends a fragment to any server)
// and encrypts every blob with a key from the same secret. All this file ever stores is random-looking ids and sealed text,
// for at most 15 minutes. Messages, files and keys never pass through here: they travel browser to browser (WebRTC).
//   POST   { m, i, b }        append blob b to mailbox m as sender i           -> 201 | 409 full | 429
//   GET    ?m=..&i=..&since=N  blobs appended after position N by anyone but i  -> 200 { n, items:[{i,b}] }
//   DELETE ?m=..              empty the mailbox once both sides are connected  -> 204
// Needs UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (set for Production and for the stage branch in Preview); without them it answers 503 and the page offers manual pairing.
const { redis, ip } = require('./_lib');

const TTL = 900, MAX_BLOB = 12000, MAX_ITEMS = 60, POSTS_PER_HOUR = 200, POLLS_PER_HOUR = 3000;
const MB = /^[a-f0-9]{32}$/, ID = /^[a-f0-9]{12}$/, B64 = /^[A-Za-z0-9_-]+$/;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (!process.env.UPSTASH_REDIS_REST_URL) return res.status(503).json({ error: 'No relay here. Pair manually.', manual: true });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const q = req.query || {};
  const m = String((req.method === 'POST' ? body.m : q.m) || '');
  if (!MB.test(m)) return res.status(400).json({ error: 'Bad request.' });
  const key = `chat:${m}`;
  try {
    if (req.method === 'POST') {
      const i = String(body.i || ''), b = body.b;
      if (!ID.test(i) || typeof b !== 'string' || b.length < 20 || b.length > MAX_BLOB || !B64.test(b)) return res.status(400).json({ error: 'Bad request.' });
      const k = `rl:chatp:${ip(req)}`, n = await redis('INCR', k);
      if (n === 1) await redis('EXPIRE', k, 3600);
      if (n > POSTS_PER_HOUR) return res.status(429).json({ error: 'Too many attempts. Try again later.' });
      if ((await redis('LLEN', key)) >= MAX_ITEMS) return res.status(409).json({ error: 'Room is full.' });
      await redis('RPUSH', key, JSON.stringify({ i, b }));
      await redis('EXPIRE', key, TTL);
      return res.status(201).json({ ok: true });
    }
    if (req.method === 'GET') {
      const i = String(q.i || ''), since = Math.max(0, Math.min(MAX_ITEMS, parseInt(q.since, 10) || 0));
      if (!ID.test(i)) return res.status(400).json({ error: 'Bad request.' });
      const k = `rl:chatg:${ip(req)}`, n = await redis('INCR', k);
      if (n === 1) await redis('EXPIRE', k, 3600);
      if (n > POLLS_PER_HOUR) return res.status(429).json({ error: 'Too many requests.' });
      const rows = (await redis('LRANGE', key, since, -1)) || [];
      const items = [];
      for (const r of rows) { try { const x = JSON.parse(r); if (x.i !== i) items.push(x); } catch (e) { /* skip */ } }
      return res.status(200).json({ n: since + rows.length, items });
    }
    if (req.method === 'DELETE') { await redis('DEL', key); return res.status(204).end(); }
    return res.status(405).json({ error: 'Not allowed.' });
  } catch (e) {
    console.error('chat relay:', e.message);
    return res.status(500).json({ error: 'Relay error.' });
  }
};
