// Connection servers for the P2P file sharing tool (/tools/p2p-file-sharing).
// Two devices on different networks often cannot reach each other directly (phone data, office and school Wi-Fi, strict NATs).
// A TURN relay forwards their already-encrypted traffic when that happens; it cannot read it. This returns short-lived
// credentials for one, so no secret ever reaches the page. With nothing configured it returns public STUN only and the
// tool still works whenever a direct path exists.
// Env, either one:
//   CF_TURN_KEY_ID + CF_TURN_API_TOKEN   Cloudflare Realtime TURN (generates credentials on request)
//   METERED_APP + METERED_API_KEY        Metered.ca TURN (app name is the subdomain of <app>.metered.live)
const { redis, ip } = require('./_lib');

const STUN = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }, { urls: 'stun:stun.cloudflare.com:3478' }];
const TTL = 6 * 3600;      // seconds the credentials stay valid
const PER_HOUR = 60;       // requests per IP address

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only.' });
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const k = `rl:p2pice:${ip(req)}`, n = await redis('INCR', k);
      if (n === 1) await redis('EXPIRE', k, 3600);
      if (n > PER_HOUR) return res.status(429).json({ error: 'Too many requests.', iceServers: STUN, relay: false });
    }
  } catch (e) { /* rate limiting is best effort */ }
  try {
    const { CF_TURN_KEY_ID: id, CF_TURN_API_TOKEN: token, METERED_APP: app, METERED_API_KEY: key } = process.env;
    let relay = [];
    if (id && token) {
      const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(id)}/credentials/generate-ice-servers`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: TTL })
      });
      if (r.ok) { const j = await r.json(); relay = (Array.isArray(j.iceServers) ? j.iceServers : [j.iceServers]).filter((s) => s && s.credential); }
    } else if (app && key) {
      const r = await fetch(`https://${encodeURIComponent(app)}.metered.live/api/v1/turn/credentials?apiKey=${encodeURIComponent(key)}`);
      if (r.ok) { const j = await r.json(); relay = (Array.isArray(j) ? j : []).filter((s) => s && s.credential); }
    }
    return res.status(200).json({ iceServers: STUN.concat(relay), relay: relay.length > 0 });
  } catch (e) {
    return res.status(200).json({ iceServers: STUN, relay: false });
  }
};
