// Pairing mailbox for the P2P file sharing tool (/tools/p2p-file-sharing). Upstash Redis over REST, no npm deps.
// Browsers swap WebRTC offers and answers through here, then connect to each other directly: files never pass through
// this function. Every message is encrypted in the browser with a key derived from the room code, and the code itself
// never reaches the server, so all it holds is opaque blobs under a random-looking room id.
// A room has one host and several guests, so joining is guest-initiated: each guest drops its own offer in a queue
// and the host answers it. Guests then find each other through the host, over the direct connections, not through here.
//   POST   { room, offer }          host opens a room (the blob is a sealed greeting)    → 201 | 409 room taken
//   POST   { room, renew }          host keeps the room open another TTL                 → 200 | 404
//   GET    ?room=..&want=offer      guest reads the greeting (proves the code is right)  → 200 { data } | 404
//   POST   { room, join, gid }      guest leaves its offer in the queue                   → 201 | 404 | 409 queue full
//   GET    ?room=..&want=joins      host takes all queued offers                         → 200 { data:[..] } | 410 closed
//   POST   { room, answer, gid }    host answers one guest                               → 201
//   GET    ?room=..&want=answer&gid=..  guest polls for its answer                      → 200 { data } once | 204 | 410
//   DELETE ?room=..                 host closes the room to new devices                  → 204
// Keys: p2p:o:<room> (greeting), p2p:j:<room> (queue of offers), p2p:a:<room>:<gid> (answer),
//       rl:p2p:<ip> (rooms opened per hour), rl:p2pj:<ip> (join attempts per hour)
const { redis, ip } = require('./_lib');

const TTL = 900;            // seconds a room stays open to new devices (the host can renew)
const MAX = 16000;          // characters; an encrypted offer is usually 1 to 4 KB
const ROOMS_PER_HOUR = 30;  // per IP address
const JOINS_PER_HOUR = 120; // per IP address
const QUEUE = 24;           // offers waiting for the host at one time
const ROOM = /^[a-f0-9]{32}$/;
const GID = /^[a-f0-9]{12}$/;
const BLOB = /^[A-Za-z0-9_-]+$/;

const blob = (v) => typeof v === 'string' && v.length > 20 && v.length <= MAX && BLOB.test(v);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.UPSTASH_REDIS_REST_URL) return res.status(503).json({ error: 'Pairing by code is not available right now. Use copy and paste pairing below.' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const q = req.query || {};
  const room = String((req.method === 'POST' ? body.room : q.room) || '');
  if (!ROOM.test(room)) return res.status(400).json({ error: 'Bad pairing code.' });
  const O = `p2p:o:${room}`, J = `p2p:j:${room}`, A = (g) => `p2p:a:${room}:${g}`;
  const gid = String((req.method === 'POST' ? body.gid : q.gid) || '');
  const gone = 'No device is waiting with that code. It may have expired, or the host closed it.';

  try {
    if (req.method === 'POST' && body.offer !== undefined) {
      if (!blob(body.offer)) return res.status(400).json({ error: 'The connection details are malformed.' });
      const k = `rl:p2p:${ip(req)}`, n = await redis('INCR', k);
      if (n === 1) await redis('EXPIRE', k, 3600);
      if (n > ROOMS_PER_HOUR) return res.status(429).json({ error: 'Too many pairing codes from this network in the last hour. Try again later, or use copy and paste pairing.' });
      const ok = await redis('SET', O, body.offer, 'EX', TTL, 'NX');
      if (!ok) return res.status(409).json({ error: 'That code is in use. Make a new one.' });
      return res.status(201).json({ ok: true, ttl: TTL });
    }
    if (req.method === 'POST' && body.renew) {
      if (!(await redis('EXISTS', O))) return res.status(404).json({ error: gone });
      await redis('EXPIRE', O, TTL);
      return res.status(200).json({ ok: true, ttl: TTL });
    }
    if (req.method === 'POST' && body.join !== undefined) {
      if (!blob(body.join) || !GID.test(gid)) return res.status(400).json({ error: 'The connection details are malformed.' });
      const k = `rl:p2pj:${ip(req)}`, n = await redis('INCR', k);
      if (n === 1) await redis('EXPIRE', k, 3600);
      if (n > JOINS_PER_HOUR) return res.status(429).json({ error: 'Too many join attempts from this network. Try again later.' });
      if (!(await redis('EXISTS', O))) return res.status(404).json({ error: gone });
      if ((await redis('LLEN', J)) >= QUEUE) return res.status(409).json({ error: 'Too many devices are joining at once. Wait a few seconds and try again.' });
      await redis('RPUSH', J, gid + '.' + body.join);
      await redis('EXPIRE', J, TTL);
      return res.status(201).json({ ok: true });
    }
    if (req.method === 'POST' && body.answer !== undefined) {
      if (!blob(body.answer) || !GID.test(gid)) return res.status(400).json({ error: 'The connection details are malformed.' });
      await redis('SET', A(gid), body.answer, 'EX', 120, 'NX');
      return res.status(201).json({ ok: true });
    }
    if (req.method === 'GET' && q.want === 'offer') {
      const data = await redis('GET', O);
      if (!data) return res.status(404).json({ error: gone });
      return res.status(200).json({ data });
    }
    if (req.method === 'GET' && q.want === 'joins') {
      if (!(await redis('EXISTS', O))) return res.status(410).json({ error: 'The code is closed.' });
      const rows = (await redis('LPOP', J, QUEUE)) || [];
      return res.status(200).json({ data: rows });
    }
    if (req.method === 'GET' && q.want === 'answer') {
      if (!GID.test(gid)) return res.status(400).json({ error: 'Bad request.' });
      const data = await redis('GETDEL', A(gid));
      if (data) return res.status(200).json({ data });
      // still waiting, or the host closed the room: tell them apart so the guest can stop polling
      if (await redis('EXISTS', O)) return res.status(204).end();
      return res.status(410).json({ error: 'The host closed the code before you were connected.' });
    }
    if (req.method === 'DELETE') {
      await redis('DEL', O, J);
      return res.status(204).end();
    }
    return res.status(405).json({ error: 'Unsupported request.' });
  } catch (e) {
    return res.status(500).json({ error: 'Pairing is having trouble. Try again, or use copy and paste pairing.' });
  }
};
