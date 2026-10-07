// Optional IP allowlist for the admin. Set ADMIN_ALLOWED_IPS in Vercel to a comma separated list of addresses or IPv4 ranges
// (for example "203.0.113.7, 198.51.100.0/24, 2001:db8::1"). Unset means everyone who has the link may try to sign in, as before.
// Scheduled jobs are not affected: they prove themselves with CRON_SECRET. To get back in after your address changes, edit or remove the variable and redeploy.
const list = () => String(process.env.ADMIN_ALLOWED_IPS || '').split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean).slice(0, 50);
const ipOf = (req) => String((req.headers['x-real-ip'] || req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '')).split(',')[0].trim().replace(/^::ffff:/, '');
const v4 = (s) => { const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s); if (!m) return null; const p = m.slice(1).map(Number); return p.some((n) => n > 255) ? null : (((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3]) >>> 0; };
function match(ip, rule) {
  rule = rule.replace(/^::ffff:/, '');
  if (!rule.includes('/')) return rule.toLowerCase() === ip.toLowerCase();
  const [base, bits] = rule.split('/'), n = Number(bits), a = v4(ip), b = v4(base);
  if (a === null || b === null || !(n >= 0 && n <= 32)) return false;   // ranges are IPv4 only; list an IPv6 address on its own
  const mask = n === 0 ? 0 : (~0 << (32 - n)) >>> 0;
  return ((a & mask) >>> 0) === ((b & mask) >>> 0);
}
const on = () => list().length > 0;
const allowed = (req) => !on() || list().some((r) => match(ipOf(req), r));
module.exports = { on, allowed, ipOf, match };
