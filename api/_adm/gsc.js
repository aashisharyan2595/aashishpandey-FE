// Google Search Console for the admin: clicks, impressions, CTR and position by week, plus top queries and pages.
// Env (Vercel): GSC_CLIENT_EMAIL and GSC_PRIVATE_KEY from a Google Cloud service account (JSON key file), and optionally GSC_SITE
// (default sc-domain:aashishpandey.com). Add the service account's email as a user (Restricted is enough) on the Search Console property.
// Answers are cached in Redis for 6 hours; Search Console data lags 2-3 days anyway.
const crypto = require('crypto');
const { redis } = require('../_lib');

const site = () => process.env.GSC_SITE || 'sc-domain:aashishpandey.com';
const ready = () => !!(process.env.GSC_CLIENT_EMAIL && process.env.GSC_PRIVATE_KEY);
const day = (d) => d.toISOString().slice(0, 10);
const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');

async function token() {
  const now = Math.floor(Date.now() / 1000), key = String(process.env.GSC_PRIVATE_KEY).replace(/\\n/g, '\n');
  const head = b64({ alg: 'RS256', typ: 'JWT' }), claims = b64({ iss: process.env.GSC_CLIENT_EMAIL, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const sig = crypto.createSign('RSA-SHA256').update(head + '.' + claims).sign(key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: head + '.' + claims + '.' + sig }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error('Google sign-in failed: ' + (j.error_description || j.error || r.status));
  return j.access_token;
}
async function query(tok, body) {
  const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site())}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(r.status === 403 ? 'The service account cannot read ' + site() + '. Add its email as a user in Search Console.' : 'Search Console answered ' + r.status + ': ' + ((j.error && j.error.message) || ''));
  return j.rows || [];
}
const row = (x) => ({ clicks: x.clicks || 0, impressions: x.impressions || 0, ctr: x.ctr || 0, position: x.position || 0 });

async function fetchAll() {
  const tok = await token(), end = new Date(Date.now() - 2 * 864e5), start = new Date(end.getTime() - 83 * 864e5), from28 = new Date(end.getTime() - 27 * 864e5), prev28 = new Date(end.getTime() - 55 * 864e5), prevEnd = new Date(end.getTime() - 28 * 864e5);
  const [days, queries, pages, countries, devices, prevTot] = await Promise.all([
    query(tok, { startDate: day(start), endDate: day(end), dimensions: ['date'], rowLimit: 200 }),
    query(tok, { startDate: day(from28), endDate: day(end), dimensions: ['query'], rowLimit: 25 }),
    query(tok, { startDate: day(from28), endDate: day(end), dimensions: ['page'], rowLimit: 15 }),
    query(tok, { startDate: day(from28), endDate: day(end), dimensions: ['country'], rowLimit: 6 }),
    query(tok, { startDate: day(from28), endDate: day(end), dimensions: ['device'], rowLimit: 5 }),
    query(tok, { startDate: day(prev28), endDate: day(prevEnd) }),
  ]);
  // 12 weeks, oldest first, each ending on the last day with data
  const weeks = [];
  for (let w = 11; w >= 0; w--) {
    const we = new Date(end.getTime() - w * 7 * 864e5), ws = new Date(we.getTime() - 6 * 864e5), inW = days.filter((d) => d.keys[0] >= day(ws) && d.keys[0] <= day(we));
    const clicks = inW.reduce((s, d) => s + d.clicks, 0), impressions = inW.reduce((s, d) => s + d.impressions, 0);
    const pos = impressions ? inW.reduce((s, d) => s + d.position * d.impressions, 0) / impressions : 0;
    weeks.push({ from: day(ws), to: day(we), clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: pos });
  }
  const sum = (list) => { const c = list.reduce((s, d) => s + d.clicks, 0), i = list.reduce((s, d) => s + d.impressions, 0); return { clicks: c, impressions: i, ctr: i ? c / i : 0, position: i ? list.reduce((s, d) => s + d.position * d.impressions, 0) / i : 0 }; };
  return {
    site: site(), at: Date.now(), range: { from: day(from28), to: day(end) },
    total: sum(days.filter((d) => d.keys[0] >= day(from28))), previous: prevTot[0] ? row(prevTot[0]) : null, weeks,
    queries: queries.map((x) => ({ key: x.keys[0], ...row(x) })), pages: pages.map((x) => ({ key: x.keys[0].replace(/^https?:\/\/[^/]+/, '') || '/', ...row(x) })),
    countries: countries.map((x) => ({ key: x.keys[0].toUpperCase(), ...row(x) })), devices: devices.map((x) => ({ key: x.keys[0].toLowerCase(), ...row(x) })),
  };
}
async function get(refresh) {
  if (!ready()) return { ready: false, site: site() };
  if (!refresh) { try { const raw = await redis('GET', 'gsc:cache'); if (raw) { const c = JSON.parse(raw); if (Date.now() - c.at < 6 * 3600e3) return { ready: true, ...c }; } } catch (e) { /* fetch fresh */ } }
  const data = await fetchAll();
  await redis('SET', 'gsc:cache', JSON.stringify(data), 'EX', 7 * 86400);
  return { ready: true, ...data };
}
module.exports = { ready, get };
