// GET /api/health  -> { ok: true } for anyone (an uptime check).
// The list of which settings this deployment can see (true or false, never the values) is only shown with
// "Authorization: Bearer <CRON_SECRET>", so a stranger cannot map which protections are switched on.
const crypto = require('crypto');
const same = (a, b) => { const x = crypto.createHash('sha256').update(String(a)).digest(), y = crypto.createHash('sha256').update(String(b)).digest(); return crypto.timingSafeEqual(x, y); };
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const cron = process.env.CRON_SECRET, auth = String((req.headers && req.headers.authorization) || '');
  if (!cron || !same(auth, 'Bearer ' + cron)) return res.status(200).json({ ok: true });
  const has = (k) => !!(process.env[k] && String(process.env[k]).trim());
  res.status(200).json({
    ok: true,
    RESEND_API_KEY: has('RESEND_API_KEY'), RESEND_FROM: has('RESEND_FROM'), ADMIN_EMAIL: has('ADMIN_EMAIL'),
    RESEND_AUDIENCE_ID: has('RESEND_AUDIENCE_ID'), NEWSLETTER_SECRET: has('NEWSLETTER_SECRET'),
    RESEND_WEBHOOK_SECRET: has('RESEND_WEBHOOK_SECRET'), CRON_SECRET: has('CRON_SECRET'), TURNSTILE_SITEKEY: has('TURNSTILE_SITEKEY'), TURNSTILE_SECRET: has('TURNSTILE_SECRET'), ADMIN_PASSWORD: has('ADMIN_PASSWORD'), ADMIN_SECRET: has('ADMIN_SECRET'), ADMIN_ALLOWED_IPS: has('ADMIN_ALLOWED_IPS'), UPSTASH: has('UPSTASH_REDIS_REST_URL') && has('UPSTASH_REDIS_REST_TOKEN'),
    environment: process.env.VERCEL_ENV || 'unknown',
  });
};
