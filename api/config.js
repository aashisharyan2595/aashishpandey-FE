// GET /api/config → public settings the forms need. Only the Turnstile site key, which is meant to be public.
// With ?a= it also serves the small public endpoints in _pulse.js (tool counter, admin-set site content, testimonial form),
// which share this function so the site stays within the 12 functions Vercel Hobby allows.
const pulse = require('./_pulse');
module.exports = (req, res) => {
  if ((req.query || {}).a) return pulse(req, res);
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).json({ turnstile: process.env.TURNSTILE_SITEKEY || '' });
};
