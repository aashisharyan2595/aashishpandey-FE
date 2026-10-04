// The page a client sees for their quote, and their accept or decline. Public, but every call needs the quote's own signed token.
const quotes = require('./_adm/quotes');
const { parseBody, clientIp, limited } = require('./_mail');

const page = (t, m) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${t}</title></head><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#070916;color:#f4efe6;font-family:Arial,sans-serif;padding:24px;box-sizing:border-box;"><div style="max-width:440px;text-align:center;"><h1 style="margin:0 0 12px;">${t}</h1><p style="color:#cfc9d8;line-height:1.6;">${m}</p><a href="https://aashishpandey.com" style="display:inline-block;margin-top:14px;padding:13px 24px;border-radius:999px;background:#f5b867;color:#1a1420;font-weight:700;text-decoration:none;">Back to the site</a></div></body></html>`;
const sameOrigin = (req) => { const o = req.headers.origin; if (!o) return true; try { return new URL(o).host === req.headers.host; } catch (e) { return false; } };

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const q = req.query || {};
  try {
    if (await limited('quote', clientIp(req), 60, 3600)) { res.status(429).setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end(page('Too many tries', 'Please wait a little and try again.')); }
    if (req.method === 'GET') {
      const rec = q.id && quotes.okToken(q.id, q.t) ? await quotes.get(String(q.id)) : null;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      if (!rec) { res.status(404); return res.end(page('Quote not found', 'This link is not valid. Please use the link in the email, or write to hello@aashishpandey.com.')); }
      return res.status(200).end(quotes.pageHtml(rec));
    }
    if (req.method === 'POST') {
      if (!sameOrigin(req)) return res.status(403).json({ error: 'Request blocked.' });
      const b = parseBody(req), a = q.a === 'decline' ? 'decline' : q.a === 'accept' ? 'accept' : '';
      if (!a) return res.status(400).json({ error: 'Unknown action.' });
      const r = await quotes.respond(String(b.id || ''), b.t, a, b.reason);
      return res.status(r.code).json(r.error ? { error: r.error } : { ok: true, status: r.status });
    }
    return res.status(405).json({ error: 'Use GET or POST.' });
  } catch (e) { console.error('quote:', e.message); return res.status(500).json({ error: 'Something went wrong. Please reply to the email.' }); }
};
