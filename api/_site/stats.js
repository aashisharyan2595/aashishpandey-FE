// Page views for blog posts and case studies, counted by a small beacon from the page (assets/blog.js).
//   pv:t:<id>   total views      pv:d:<id>   hash of views per day (yyyymmdd)      pv:seen:<id>:<visitor>   keeps one visitor to one view per 30 minutes
//   pv:r:<id> / pv:rd:<id>   reads (scrolled most of the post or stayed 45 s)    ix:v   blog index views per day    ix:c:<id>   clicks on that post's card per day
//   ab:t   layout test counters, field <test>:<arm>:v (views) or :r (reads)
// A visitor is a hash of ip + browser, never stored in the clear. Known crawlers are not counted. The CDN caches pages, so counting happens in the browser, not on render.
const crypto = require('crypto');
const { redis, ip } = require('../_lib');

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|lighthouse|headless|curl|wget|python|node-fetch|axios|go-http|vercel/i;
const dayKey = (t) => new Date(t || Date.now()).toISOString().slice(0, 10).replace(/-/g, '');

// Layout tests (docs/blog-desk-runbook.md, Experiments). Arms are picked in the browser per page view and sent along; only these names are counted.
const AB = { cover: ['a', 'b'], nl: ['a', 'b'] };
const abList = (s) => String(s || '').split(',').map((x) => x.split(':')).filter(([t, a]) => AB[t] && AB[t].includes(a));
async function who(req, id, tag) {   // true once per visitor and post per 30 minutes; crawlers never count
  if (!/^[a-z0-9]{6,20}$/.test(String(id || ''))) return false;
  const ua = String(req.headers['user-agent'] || ''); if (!ua || BOT.test(ua)) return false;
  const w = crypto.createHash('sha1').update(ip(req) + '|' + ua).digest('hex').slice(0, 16);
  return (await redis('SET', `pv:seen${tag}:${id}:${w}`, '1', 'NX', 'EX', 1800)) === 'OK';
}
async function hit(req, id, ab) {
  if (!(await who(req, id, ''))) return false;
  await redis('INCR', 'pv:t:' + id); await redis('HINCRBY', 'pv:d:' + id, dayKey(), 1);
  for (const [t, a] of abList(ab)) await redis('HINCRBY', 'ab:t', `${t}:${a}:v`, 1);
  return true;
}
async function read(req, id, ab) {
  if (!(await who(req, id, ':r'))) return false;
  await redis('INCR', 'pv:r:' + id); await redis('HINCRBY', 'pv:rd:' + id, dayKey(), 1);
  for (const [t, a] of abList(ab)) await redis('HINCRBY', 'ab:t', `${t}:${a}:r`, 1);
  return true;
}
// the blog index: k 'v' = the index was viewed, 'c' = a post card was clicked (id = that post)
async function card(req, k, id) {
  if (k === 'v') { const ua = String(req.headers['user-agent'] || ''); if (!ua || BOT.test(ua)) return false; const w = crypto.createHash('sha1').update(ip(req) + '|' + ua).digest('hex').slice(0, 16); if ((await redis('SET', 'pv:seen:ix:' + w, '1', 'NX', 'EX', 1800)) !== 'OK') return false; await redis('HINCRBY', 'ix:v', dayKey(), 1); return true; }
  if (k === 'c' && await who(req, id, ':c')) { await redis('HINCRBY', 'ix:c:' + id, dayKey(), 1); return true; }
  return false;
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
// First 7 days after going live, for the blog desk's feedback loop. Counts only, nothing about visitors.
//   views7 page views, reads7 reads, clicks7 clicks on the post's card in the blog index, ix7 blog index views over the same days (card click rate = clicks7 / ix7)
async function windows(rows) {
  const out = [];
  for (const p of rows) {
    if (!p.publishAt) continue;
    const keys = []; for (let i = 0; i < 7; i++) keys.push(dayKey(p.publishAt + i * 864e5));
    const sum = (v) => (v || []).reduce((a, x) => a + (Number(x) || 0), 0);
    const [v, r, c, ix, tot] = await Promise.all([redis('HMGET', 'pv:d:' + p.id, ...keys), redis('HMGET', 'pv:rd:' + p.id, ...keys), redis('HMGET', 'ix:c:' + p.id, ...keys), redis('HMGET', 'ix:v', ...keys), redis('GET', 'pv:t:' + p.id)]);
    out.push({ slug: p.slug, publishAt: p.publishAt, views7: sum(v), reads7: sum(r), clicks7: sum(c), ix7: sum(ix), total: Number(tot) || 0 });
  }
  return out;
}
async function abScores() {
  const flat = (await redis('HGETALL', 'ab:t')) || [], out = {};
  for (let i = 0; i < flat.length; i += 2) { const [t, a, k] = String(flat[i]).split(':'); ((out[t] = out[t] || {})[a] = out[t][a] || { v: 0, r: 0 })[k] = Number(flat[i + 1]) || 0; }
  return out;
}
const forget = async (id) => { await redis('DEL', 'pv:t:' + id); await redis('DEL', 'pv:d:' + id); };
module.exports = { hit, read, card, totals, series, windows, abScores, forget };
