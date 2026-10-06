// Pairing mailbox for the P2P file sharing tool (/tools/p2p-file-sharing). Upstash Redis over REST, no npm deps.
// Two browsers swap one WebRTC offer and one answer through here, then connect to each other directly: files never pass
// through this function. Both messages are encrypted in the browser with a key derived from the pairing code, and the code
// itself never reaches the server, so all it holds is an opaque blob under a random-looking room id, for 10 minutes at most.
//   POST   { room, offer }        sender opens a room                → 201 | 409 room taken
//   GET    ?room=..&want=offer    receiver reads the offer           → 200 { data } | 404
//   POST   { room, answer }       receiver replies; offer is deleted → 201 | 404 no room | 409 already answered
//   GET    ?room=..&want=answer   sender polls                       → 200 { data } once, then it is deleted | 204 not yet
//   DELETE ?room=..               sender cancels                     → 204
// Keys: p2p:o:<room> (offer), p2p:a:<room> (answer), p2p:u:<room> (answered marker), rl:p2p:<ip> (rooms opened per hour)
const { redis, ip } = require('./_lib');

const TTL = 600;            // seconds a pairing stays open
const MAX = 16000;          // characters; an encrypted offer is usually 1 to 4 KB
const ROOMS_PER_HOUR = 30;  // per IP address
const ROOM = /^[a-f0-9]{32}$/;
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
  const O = `p2p:o:${room}`, A = `p2p:a:${room}`, U = `p2p:u:${room}`;

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
    if (req.method === 'POST' && body.answer !== undefined) {
      if (!blob(body.answer)) return res.status(400).json({ error: 'The connection details are malformed.' });
      if (!(await redis('EXISTS', O))) return res.status(404).json({ error: 'No device is waiting with that code. It may have expired, or someone already used it.' });
      // first answer wins: a code connects exactly one pair of devices
      if (!(await redis('SET', U, '1', 'EX', TTL, 'NX'))) return res.status(409).json({ error: 'Another device already joined with that code. Ask for a new one.' });
      await redis('SET', A, body.answer, 'EX', TTL);
      await redis('DEL', O);
      return res.status(201).json({ ok: true });
    }
    if (req.method === 'GET' && q.want === 'offer') {
      const data = await redis('GET', O);
      if (!data) return res.status(404).json({ error: 'No device is waiting with that code. It may have expired, or someone already used it.' });
      return res.status(200).json({ data });
    }
    if (req.method === 'GET' && q.want === 'answer') {
      const data = await redis('GETDEL', A);
      if (!data) {
        // still waiting, or the room expired: tell them apart so the sender can stop polling
        if (await redis('EXISTS', O)) return res.status(204).end();
        return res.status(410).json({ error: 'The code expired. Make a new one.' });
      }
      return res.status(200).json({ data });
    }
    if (req.method === 'DELETE') {
      await redis('DEL', O, A);
      return res.status(204).end();
    }
    return res.status(405).json({ error: 'Unsupported request.' });
  } catch (e) {
    return res.status(500).json({ error: 'Pairing is having trouble. Try again, or use copy and paste pairing.' });
  }
};
