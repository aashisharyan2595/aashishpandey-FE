// Shared helpers for the contact form and the newsletter. Resend over REST, no npm deps.
// Env (set in Vercel): RESEND_API_KEY, RESEND_FROM, ADMIN_EMAIL, RESEND_AUDIENCE_ID, NEWSLETTER_SECRET
// Rate limits use Upstash Redis when it is configured (same as the URL shortener), otherwise a per-instance memory counter.
const crypto = require('crypto');
const SITE = 'https://aashishpandey.com';

const env = () => ({
  key: process.env.RESEND_API_KEY,
  from: process.env.RESEND_FROM || 'Aashish Pandey <hello@aashishpandey.com>',
  admin: process.env.ADMIN_EMAIL || 'hello@aashishpandey.com',
  audience: process.env.RESEND_AUDIENCE_ID,
  secret: process.env.NEWSLETTER_SECRET || process.env.RESEND_API_KEY || '',
});

async function resend(path, method, body) {
  const { key } = env();
  if (!key) throw Object.assign(new Error('Email is not set up yet.'), { code: 'NOCONFIG' });
  const r = await fetch('https://api.resend.com' + path, {
    method,
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.message || 'Resend error ' + r.status), { status: r.status, detail: j });
  return j;
}

function sendMail({ to, subject, html, text, replyTo, headers }) {
  const { from } = env();
  const body = { from, to: Array.isArray(to) ? to : [to], subject, html, text };
  if (replyTo) body.reply_to = replyTo;
  if (headers) body.headers = headers;
  return resend('/emails', 'POST', body);
}

/* ---------- input checks ---------- */
const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
const validEmail = (e) => e.length <= 254 && /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/.test(e);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const nl2br = (s) => esc(s).replace(/\r?\n/g, '<br>');
const firstName = (n) => clean(n, 80).split(/\s+/)[0] || 'there';
const parseBody = (req) => { let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } } return b && typeof b === 'object' ? b : {}; };
const clientIp = (req) => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();

/* ---------- signed links (confirm and unsubscribe) ---------- */
const b64 = (buf) => Buffer.from(buf).toString('base64url');
function sign(purpose, email, ts) {
  return b64(crypto.createHmac('sha256', env().secret).update(`${purpose}|${email.toLowerCase()}|${ts}`).digest()).slice(0, 32);
}
function link(purpose, email) {
  const ts = Date.now();
  return `${SITE}/api/newsletter?a=${purpose}&e=${encodeURIComponent(email)}&x=${ts}&t=${sign(purpose, email, ts)}`;
}
function verify(purpose, email, ts, tok, maxAgeMs) {
  if (!env().secret || !email || !ts || !tok) return false;
  const a = Buffer.from(sign(purpose, email, ts)), b = Buffer.from(String(tok));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  return !maxAgeMs || Date.now() - Number(ts) <= maxAgeMs;
}

/* ---------- rate limit ---------- */
const mem = new Map();
async function limited(bucket, addr, max, windowSec) {
  const k = `fm:${bucket}:${addr}`;
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const { redis } = require('./_lib');
      const n = await redis('INCR', k);
      if (n === 1) await redis('EXPIRE', k, windowSec);
      return n > max;
    }
  } catch (e) { /* fall through to memory */ }
  const now = Date.now(), rec = mem.get(k);
  if (!rec || now > rec.until) { mem.set(k, { n: 1, until: now + windowSec * 1000 }); return false; }
  rec.n += 1; return rec.n > max;
}

module.exports = { SITE, env, resend, sendMail, clean, validEmail, esc, nl2br, firstName, parseBody, clientIp, link, verify, limited };
