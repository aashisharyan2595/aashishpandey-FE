// Blind relay for the private chat room's connection handshake. Served through /api/config?a=chat so no new function is needed.
// The page derives a mailbox id from a secret that lives in the URL fragment (the browser never sends a fragment to any server)
// and encrypts every blob with a key from the same secret. All this file ever stores is random-looking ids and sealed text,
// for at most 15 minutes. Messages, files and keys never pass through here: they travel browser to browser (WebRTC).
//   POST   { m, i, b }        append blob b to mailbox m as sender i           -> 201 | 409 full | 429
//   GET    ?m=..&i=..&since=N  blobs appended after position N by anyone but i  -> 200 { n, items:[{i,b}] }
//   DELETE ?m=..              empty the mailbox once both sides are connected  -> 204
//   POST   { m, q:1, b, d }    keep one sealed message for the other person (needs Upstash)  -> 201 { durable }
//   GET    ?m=..&q=1&since=N   sealed messages after position N                              -> 200 { n, items:[{b}], durable }
//   POST   { m, sub, d }       register this browser for a blank "new message" push           -> 201
//   GET    ?vapid=1            the public key a browser needs to subscribe
// Stored messages are sealed on the device with a key the server never sees; they expire after 30 days and the list keeps at most 400.
// Storage: Upstash when UPSTASH_REDIS_REST_URL/TOKEN work, otherwise this serverless instance's own memory (no outside service at all).
// Memory is per warm instance and short lived, which is fine for a 15 minute handshake; if two requests land on different instances the page falls back to manual pairing.
const { redis, ip } = require('./_lib');
const push = require('./_adm/webpush');

const QTTL = 30 * 86400, QMAX = 400, QBLOB = 6000, SUBS_MAX = 6;
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
  if (req.method === 'GET' && q.vapid) { try { return res.status(200).json({ key: await push.publicKey(), durable: useRedis }); } catch (e) { return res.status(200).json({ durable: false }); } }
  const m = String((req.method === 'POST' ? body.m : q.m) || '');
  if (!MB.test(m)) return res.status(400).json({ error: 'Bad request.' });
  const key = `chat:${m}`;
  const kv = (...a) => (useRedis ? redis(...a).catch(e => { if (/NOPERM|WRONGPASS|Unauthorized|401|403|fetch|not configured/i.test(String(e && e.message))) { useRedis = false; return memKv(...a); } throw e; }) : memKv(...a));
  const durable = () => useRedis;
  try {
    if (req.method === 'POST' && (body.q || body.sub)) {
      if (!durable()) return res.status(503).json({ error: 'Stored messages are not set up here.', durable: false });
      const d = String(body.d || '');
      if (!ID.test(d)) return res.status(400).json({ error: 'Bad request.' });
      const rk = `rl:chatq:${ip(req)}`, rn = await kv('INCR', rk);
      if (rn === 1) await kv('EXPIRE', rk, 3600);
      if (rn > 600) return res.status(429).json({ error: 'Too many requests.' });
      if (body.sub) {
        const sb = body.sub;
        if (!sb || typeof sb.endpoint !== 'string' || !/^https:\/\//.test(sb.endpoint) || sb.endpoint.length > 600 || !sb.keys || !sb.keys.p256dh || !sb.keys.auth) return res.status(400).json({ error: 'Bad request.' });
        const sk = `chatsub:${m}`;
        await kv('HSET', sk, d, JSON.stringify({ endpoint: sb.endpoint, keys: { p256dh: String(sb.keys.p256dh).slice(0, 120), auth: String(sb.keys.auth).slice(0, 60) } }));
        await kv('EXPIRE', sk, QTTL);
        const n = (await kv('HLEN', sk)) || 0;
        if (n > SUBS_MAX) { const all = (await kv('HKEYS', sk)) || []; for (const k of all.slice(0, n - SUBS_MAX)) if (k !== d) await kv('HDEL', sk, k); }
        return res.status(201).json({ ok: true, durable: true });
      }
      const b = body.b;
      if (typeof b !== 'string' || b.length < 20 || b.length > QBLOB || !B64.test(b)) return res.status(400).json({ error: 'Bad request.' });
      const qk = `chatq:${m}`;
      const seq = Number(await kv('INCR', `chatqs:${m}`)) || 1;
      await kv('RPUSH', qk, JSON.stringify({ b, t: Date.now(), s: seq }));
      await kv('LTRIM', qk, -QMAX, -1);
      await kv('EXPIRE', qk, QTTL);
      await kv('EXPIRE', `chatqs:${m}`, QTTL);
      // blank ping to the other person's browsers (never the content); at most one per 20 seconds per room
      try {
        const gate = await kv('SET', `chatpush:${m}`, '1', 'EX', 20, 'NX');
        if (gate) {
          const flat = (await kv('HGETALL', `chatsub:${m}`)) || [];
          const subs = [];
          for (let i = 0; i < flat.length; i += 2) { if (flat[i] !== d) { try { subs.push({ id: flat[i], ...JSON.parse(flat[i + 1]) }); } catch (e) { /* skip */ } } }
          if (subs.length) {
            const v = await push.vapid();
            const payload = JSON.stringify({ title: 'New message', body: 'Open the chat to read it.', url: body.u && /^\/[a-z0-9-]{3,80}$/.test(String(body.u)) ? body.u : '/', tag: 'room' });
            const dead = [];
            await Promise.all(subs.map(async (s) => {
              try {
                const r = await fetch(s.endpoint, { method: 'POST', headers: { Authorization: `vapid t=${push.jwt(new URL(s.endpoint).origin, v)}, k=${v.pub}`, 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '86400', Urgency: 'high' }, body: push.encrypt(s, payload) });
                if (r.status === 404 || r.status === 410) dead.push(s.id);
              } catch (e) { /* ignore */ }
            }));
            for (const id of dead) await kv('HDEL', `chatsub:${m}`, id);
          }
        }
      } catch (e) { /* a failed ping must never fail the message */ }
      return res.status(201).json({ ok: true, durable: true });
    }
    if (req.method === 'GET' && q.q) {
      if (!durable()) return res.status(200).json({ n: 0, items: [], durable: false });
      const since = Math.max(0, parseInt(q.since, 10) || 0);
      const gk = `rl:chatqg:${ip(req)}`, gn = await kv('INCR', gk);
      if (gn === 1) await kv('EXPIRE', gk, 3600);
      if (gn > 4000) return res.status(429).json({ error: 'Too many requests.' });
      const qk = `chatq:${m}`, latest = Number(await kv('GET', `chatqs:${m}`)) || 0, want = latest - since;
      const rows = want <= 0 ? [] : ((await kv('LRANGE', qk, -Math.min(want, QMAX), -1)) || []);
      const items = [];
      for (const r of rows) { try { const x = JSON.parse(r); if (x.s > since) items.push({ b: x.b, t: x.t, s: x.s }); } catch (e) { /* skip */ } }
      return res.status(200).json({ n: latest, items, durable: true });
    }
    if (req.method === 'DELETE' && q.sub) { if (durable()) await kv('HDEL', `chatsub:${m}`, String(q.sub)); return res.status(204).end(); }
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
