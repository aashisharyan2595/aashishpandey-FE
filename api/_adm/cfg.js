// Small JSON settings kept in Redis (cfg:<name>), cached for a minute per server instance.
const { redis } = require('../_lib');
const cache = new Map();
async function get(name, def) {
  const c = cache.get(name);
  if (c && Date.now() - c.t < 60000) return c.v;
  let v = def;
  try { const raw = await redis('GET', 'cfg:' + name); if (raw) v = { ...def, ...JSON.parse(raw) }; } catch (e) { /* use the defaults */ }
  cache.set(name, { v, t: Date.now() });
  return v;
}
async function set(name, v) { await redis('SET', 'cfg:' + name, JSON.stringify(v)); cache.delete(name); }
module.exports = { get, set };
