// Shared helpers for the URL shortener. Upstash Redis over REST, no npm deps.
// Env: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
const URL_ = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(...cmd) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

const SITE = 'aashishpandey.com';
const EXPIRY = { '1d': 86400, '7d': 604800, '30d': 2592000, '90d': 7776000, '1y': 31536000 };
const RESERVED = new Set(['api', 'admin', 'tools', 's', 'www', 'login', 'case-studies', 'portfolio', 'assets', 'static', 'null', 'undefined']);
// Other shorteners (no chaining) and hosts commonly abused for phishing / malware drops.
const BLOCKED_HOSTS = [
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'rebrand.ly', 'cutt.ly', 'shorturl.at', 'tiny.cc', 'rb.gy', 'bl.ink', 'v.gd', 's.id',
  'grabify.link', 'iplogger.org', 'iplogger.com', '2no.co', 'yip.su', 'ngrok.io', 'ngrok-free.app', 'duckdns.org', 'no-ip.com'
];
const BLOCKED_WORDS = ['login-verify', 'account-suspended', 'wallet-connect', 'free-nitro', 'airdrop-claim', 'secure-update', 'verify-identity'];
const RATE = { hour: 5, day: 20 };

function checkUrl(raw) {
  let u;
  try { u = new URL(String(raw || '').trim()); } catch (e) { return { error: 'That doesn’t look like a full link. Include https://' }; }
  if (!/^https?:$/.test(u.protocol)) return { error: 'Only http and https links can be shortened.' };
  if (u.username || u.password) return { error: 'Links with embedded credentials are blocked.' };
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  if (host === SITE || host.endsWith('.' + SITE)) return { error: 'That link is already on aashishpandey.com.' };
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host === 'localhost' || host.endsWith('.local')) return { error: 'IP addresses and local hosts are blocked.' };
  if (BLOCKED_HOSTS.some(b => host === b || host.endsWith('.' + b))) return { error: 'Links to other shorteners or trackers are blocked.' };
  const low = u.href.toLowerCase();
  if (BLOCKED_WORDS.some(w => low.includes(w))) return { error: 'This link matches our phishing blocklist.' };
  if (u.href.length > 2048) return { error: 'That link is too long (2,048 characters max).' };
  return { url: u.href };
}

function checkAlias(a) {
  if (!a) return { alias: null };
  a = String(a).trim();
  if (!/^[A-Za-z0-9_-]{3,32}$/.test(a)) return { error: 'Aliases use 3–32 letters, numbers, - or _.' };
  if (RESERVED.has(a.toLowerCase())) return { error: 'That alias is reserved. Try another.' };
  return { alias: a };
}

const ALPHA = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function code(n = 6) { let s = ''; const b = require('crypto').randomBytes(n); for (let i = 0; i < n; i++) s += ALPHA[b[i] % ALPHA.length]; return s; }

function ip(req) { return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim(); }

async function rateLimit(addr) {
  const h = `rl:h:${addr}`, d = `rl:d:${addr}`;
  const [nh, nd] = await Promise.all([redis('INCR', h), redis('INCR', d)]);
  if (nh === 1) await redis('EXPIRE', h, 3600);
  if (nd === 1) await redis('EXPIRE', d, 86400);
  if (nh > RATE.hour) return 'You’ve made 5 links this hour. Try again later.';
  if (nd > RATE.day) return 'Daily limit reached. Try again tomorrow.';
  return null;
}

module.exports = { redis, SITE, EXPIRY, checkUrl, checkAlias, code, ip, rateLimit };
