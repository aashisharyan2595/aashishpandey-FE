// GET /s/:code  (rewritten to /api/s/:code in vercel.json) → 302 to target, or a small 404 page.
const { redis } = require('../_lib');

const notFound = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Link not found · Aashish Pandey</title>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;600&display=swap" rel="stylesheet"></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0f24;color:#f3ead9;font-family:'Instrument Sans',system-ui,sans-serif;padding:24px;box-sizing:border-box">
<div style="max-width:440px;display:flex;flex-direction:column;gap:14px"><h1 style="margin:0;font-weight:600;font-size:40px;letter-spacing:-.035em;line-height:1">This link has expired or doesn’t exist.</h1>
<p style="margin:0;font-size:16px;line-height:1.6;color:#cfc6b6">Short links on aashishpandey.com expire after the time their creator picked.</p>
<a href="/tools/url-shortener" style="align-self:flex-start;margin-top:8px;height:44px;padding:0 20px;display:flex;align-items:center;border-radius:99px;background:#f5b867;color:#1a1420;font-weight:600;text-decoration:none">Make a new short link</a></div></body></html>`;

module.exports = async (req, res) => {
  const c = String(req.query.code || '').toLowerCase();
  if (!/^[a-z0-9_-]{3,32}$/.test(c)) { res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end(notFound); }
  try {
    const raw = await redis('GET', `s:${c}`);
    if (!raw) { res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end(notFound); }
    const { url } = JSON.parse(raw);
    redis('INCR', `c:${c}`).catch(() => {});
    res.setHeader('Cache-Control', 'private, max-age=0');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.writeHead(302, { Location: url });
    return res.end();
  } catch (e) {
    res.status(502).setHeader('Content-Type', 'text/plain'); return res.end('Shortener temporarily unavailable.');
  }
};
