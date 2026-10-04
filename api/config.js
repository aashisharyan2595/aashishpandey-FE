// GET /api/config → public settings the forms need. Only the Turnstile site key, which is meant to be public.
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).json({ turnstile: process.env.TURNSTILE_SITEKEY || '' });
};
