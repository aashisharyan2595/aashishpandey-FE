// GET /api/health  -> which mail settings this deployment can see. Only true or false, never the values.
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const has = (k) => !!(process.env[k] && String(process.env[k]).trim());
  res.status(200).json({
    RESEND_API_KEY: has('RESEND_API_KEY'), RESEND_FROM: has('RESEND_FROM'), ADMIN_EMAIL: has('ADMIN_EMAIL'),
    RESEND_AUDIENCE_ID: has('RESEND_AUDIENCE_ID'), NEWSLETTER_SECRET: has('NEWSLETTER_SECRET'),
    RESEND_WEBHOOK_SECRET: has('RESEND_WEBHOOK_SECRET'), CRON_SECRET: has('CRON_SECRET'), TURNSTILE_SITEKEY: has('TURNSTILE_SITEKEY'), TURNSTILE_SECRET: has('TURNSTILE_SECRET'), ADMIN_PASSWORD: has('ADMIN_PASSWORD'), UPSTASH: has('UPSTASH_REDIS_REST_URL') && has('UPSTASH_REDIS_REST_TOKEN'),
    environment: process.env.VERCEL_ENV || 'unknown',
  });
};
