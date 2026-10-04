// Short links manager. The shortener keeps s:<code> (JSON, expires on its own) and c:<code> (click counter).
// "Disable" renames a link to sx:<code>, so /s/<code> stops working but the record stays for the record.
const { redis } = require('../_lib');
const OK = /^[a-z0-9_-]{3,32}$/;

async function scan(match, cap = 1000) {
  let cur = '0'; const keys = [];
  do { const r = await redis('SCAN', cur, 'MATCH', match, 'COUNT', 500); cur = String(r[0]); keys.push(...r[1]); } while (cur !== '0' && keys.length < cap);
  return [...new Set(keys)].slice(0, cap);
}
async function list() {
  const live = (await scan('s:*')).map((k) => [k, true]), off = (await scan('sx:*')).map((k) => [k, false]), all = [...live, ...off];
  if (!all.length) return { items: [], clicks: 0 };
  const vals = [], ttls = [], clicks = [];
  for (let i = 0; i < all.length; i += 100) {
    const part = all.slice(i, i + 100);
    vals.push(...await redis('MGET', ...part.map(([k]) => k)));
    ttls.push(...await Promise.all(part.map(([k]) => redis('PTTL', k))));
    clicks.push(...await redis('MGET', ...part.map(([k]) => 'c:' + k.replace(/^sx?:/, ''))));
  }
  const items = all.map(([k, active], i) => {
    let rec = {}; try { rec = JSON.parse(vals[i] || '{}'); } catch (e) { /* damaged record */ }
    let host = ''; try { host = new URL(rec.url).hostname.replace(/^www\./, ''); } catch (e) { /* no host */ }
    return { code: k.replace(/^sx?:/, ''), url: rec.url || '', host, created: rec.created || 0, expiresAt: rec.expiresAt || 0, ttlMs: ttls[i], clicks: Number(clicks[i]) || 0, active };
  }).sort((a, b) => b.created - a.created);
  return { items, clicks: items.reduce((n, x) => n + x.clicks, 0) };
}
async function act(code, op) {
  code = String(code || '').toLowerCase(); if (!OK.test(code)) throw new Error('Bad code.');
  if (op === 'disable') await redis('RENAME', `s:${code}`, `sx:${code}`);
  else if (op === 'enable') await redis('RENAME', `sx:${code}`, `s:${code}`);
  else if (op === 'delete') { await redis('DEL', `s:${code}`); await redis('DEL', `sx:${code}`); await redis('DEL', `c:${code}`); }
  else throw new Error('Unknown action.');
}
module.exports = { list, act };
