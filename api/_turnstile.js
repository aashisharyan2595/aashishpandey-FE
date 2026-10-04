// Cloudflare Turnstile. Optional: with TURNSTILE_SECRET unset every check passes, so the forms keep working until the keys are added.
// Env (Vercel): TURNSTILE_SITEKEY (public, served by /api/config) and TURNSTILE_SECRET (private).
const on = () => !!process.env.TURNSTILE_SECRET;

// → 'ok' | 'missing' (no token sent: script blocked or a bot that never ran it) | 'bad' (Cloudflare says it failed) | 'off'
async function check(token, ip) {
  if (!on()) return 'off';
  if (!token || typeof token !== 'string' || token.length > 2048) return 'missing';
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET, response: token, remoteip: ip || '' }),
    });
    const j = await r.json();
    return j.success ? 'ok' : 'bad';
  } catch (e) { console.error('turnstile: verify failed', e.message); return 'off'; }   // Cloudflare unreachable: do not lock real people out
}

module.exports = { on, check };
