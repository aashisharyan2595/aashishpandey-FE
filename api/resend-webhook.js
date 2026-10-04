// POST /api/resend-webhook: Resend tells us what happened to each email (delivered, bounced, reported as spam...).
// Resend signs every call (Svix): without the right signature nothing is accepted. Env: RESEND_WEBHOOK_SECRET (starts with whsec_).
const crypto = require('crypto');
const maillog = require('./_adm/maillog');

async function rawBody(req) {
  if (typeof req.rawBody === 'string') return req.rawBody;
  if (typeof req.body === 'string') return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);   // already parsed: compact JSON re-serialises the same way
  return new Promise((ok, bad) => { let d = ''; req.on('data', (c) => { d += c; }); req.on('end', () => ok(d)); req.on('error', bad); });
}
function verify(secret, id, ts, raw, header) {
  const key = Buffer.from(String(secret).replace(/^whsec_/, ''), 'base64');
  const want = crypto.createHmac('sha256', key).update(`${id}.${ts}.${raw}`).digest('base64');
  return String(header || '').split(' ').some((part) => { const [v, sig] = part.split(','); if (v !== 'v1' || !sig) return false; const a = Buffer.from(sig), b = Buffer.from(want); return a.length === b.length && crypto.timingSafeEqual(a, b); });
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: 'RESEND_WEBHOOK_SECRET is not set.' });
  try {
    const raw = await rawBody(req), h = req.headers || {};
    const id = h['svix-id'], ts = h['svix-timestamp'], sig = h['svix-signature'];
    if (!id || !ts || !sig) return res.status(400).json({ error: 'Missing signature headers.' });
    if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return res.status(400).json({ error: 'Timestamp too old.' });   // stops a captured call being replayed later
    if (!verify(secret, id, ts, raw, sig)) return res.status(401).json({ error: 'Bad signature.' });
    return res.status(200).json(await maillog.event(JSON.parse(raw)));
  } catch (e) { console.error('resend-webhook:', e.message); return res.status(500).json({ error: 'Could not process.' }); }
};
module.exports.config = { api: { bodyParser: false } };
