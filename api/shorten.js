// POST /api/shorten  { url, alias?, expires: '1d'|'7d'|'30d'|'90d'|'1y' }
// → 201 { code, short, url, expiresAt }   | 4xx { error }
const { redis, SITE, EXPIRY, checkUrl, checkAlias, code, ip, rateLimit } = require('./_lib');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  const u = checkUrl(body.url);
  if (u.error) return res.status(400).json({ error: u.error });
  const a = checkAlias(body.alias);
  if (a.error) return res.status(400).json({ error: a.error });
  const ttl = EXPIRY[body.expires] || EXPIRY['30d'];

  try {
    const limited = await rateLimit(ip(req));
    if (limited) return res.status(429).json({ error: limited });

    const expiresAt = Date.now() + ttl * 1000;
    const record = JSON.stringify({ url: u.url, created: Date.now(), expiresAt });
    let c = a.alias, ok = null;
    if (c) {
      ok = await redis('SET', `s:${c.toLowerCase()}`, record, 'EX', ttl, 'NX');
      if (!ok) return res.status(409).json({ error: 'That alias is taken. Try another.' });
    } else {
      for (let i = 0; i < 5 && !ok; i++) { c = code(); ok = await redis('SET', `s:${c.toLowerCase()}`, record, 'EX', ttl, 'NX'); }
      if (!ok) return res.status(500).json({ error: 'Couldn’t reserve a code. Try again.' });
    }
    return res.status(201).json({ code: c, short: `https://${SITE}/s/${c}`, url: u.url, expiresAt });
  } catch (e) {
    return res.status(500).json({ error: 'The shortener is having trouble. Try again in a minute.' });
  }
};
