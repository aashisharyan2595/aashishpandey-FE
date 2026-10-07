// Page views for blog posts and case studies, counted by a small beacon from the page (assets/blog.js).
//   pv:t:<id>   total views      pv:d:<id>   hash of views per day (yyyymmdd)      pv:seen:<id>:<visitor>   keeps one visitor to one view per 30 minutes
// A visitor is a hash of ip + browser, never stored in the clear. Known crawlers are not counted. The CDN caches pages, so counting happens in the browser, not on render.
const crypto = require('crypto');
const { redis, ip } = require('../_lib');

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|lighthouse|headless|curl|wget|python|node-fetch|axios|go-http|vercel/i;
const dayKey = (t) => new Date(t || Date.now()).toISOString().slice(0, 10).replace(/-/g, '');

async function hit(req, id) {
  if (!/^[a-z0-9]{6,20}$/.test(String(id || ''))) return false;
  const ua = String(req.headers['user-agent'] || ''); if (!ua || BOT.test(ua)) return false;
  const who = crypto.createHash('sha1').update(ip(req) + '|' + ua).digest('hex').slice(0, 16);
  const first = await redis('SET', `pv:seen:${id}:${who}`, '1', 'NX', 'EX', 1800); if (first !== 'OK') return false;
  await redis('INCR', 'pv:t:' + id); await redis('HINCRBY', 'pv:d:' + id, dayKey(), 1); return true;
}
async function totals(ids) {
  if (!ids.length) return {};
  const rows = await redis('MGET', ...ids.map((i) => 'pv:t:' + i)), out = {}; ids.forEach((i, k) => { out[i] = Number(rows[k]) || 0; }); return out;
}
// last n days, oldest first: [{ d:'2026-10-01', n:3 }, ...]
async function series(id, n) {
  n = n || 30; const days = [], now = Date.now(); for (let i = n - 1; i >= 0; i--) days.push(now - i * 864e5);
  const keys = days.map(dayKey), vals = (await redis('HMGET', 'pv:d:' + id, ...keys)) || [];
  return keys.map((k, i) => ({ d: k.slice(0, 4) + '-' + k.slice(4, 6) + '-' + k.slice(6), n: Number(vals[i]) || 0 }));
}
const forget = async (id) => { await redis('DEL', 'pv:t:' + id); await redis('DEL', 'pv:d:' + id); };
module.exports = { hit, totals, series, forget };
