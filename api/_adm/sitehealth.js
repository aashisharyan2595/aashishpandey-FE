// Site health: every page in the sitemaps answers, email and spam services are reachable, the database and scheduled jobs work.
// Runs with the nightly backup and the morning digest (Vercel Cron), and on demand from the admin. A failure sends an alert.
//   health:last   JSON of the latest run      health:hist   list of short summaries, newest first (60 kept)
const { redis } = require('../_lib');
const { env } = require('../_mail');
const notify = require('./notify');
const maillog = require('./maillog');
const sec = require('./security');

const KEY_PAGES = ['/', '/portfolio', '/services', '/case-studies', '/contact', '/tools'];
const timed = async (fn) => { const t = Date.now(); try { const v = await fn(); return { ...v, ms: Date.now() - t }; } catch (e) { return { ok: false, detail: String(e.message || e).slice(0, 160), ms: Date.now() - t }; } };
const fetchT = (url, opt, ms) => { const c = new AbortController(), t = setTimeout(() => c.abort(), ms || 8000); return fetch(url, { ...opt, signal: c.signal, headers: { 'User-Agent': 'aashishpandey-health/1', ...((opt && opt.headers) || {}) } }).finally(() => clearTimeout(t)); };

async function sitemapUrls(origin) {
  const locs = (xml) => [...String(xml).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  const idx = await (await fetchT(origin + '/sitemap.xml')).text(), out = new Set();
  const subs = locs(idx).filter((u) => /\.xml$/.test(u));
  for (const s of subs) { try { const p = new URL(s).pathname; for (const u of locs(await (await fetchT(origin + p)).text())) out.add(new URL(u).pathname); } catch (e) { /* listed as a failure below */ } }
  if (!subs.length) for (const u of locs(idx)) { try { out.add(new URL(u).pathname); } catch (e) { /* skip */ } }
  return [...out];
}
async function checkPages(origin) {
  let paths = [];
  try { paths = await sitemapUrls(origin); } catch (e) { /* fall back to the key pages */ }
  const all = [...new Set([...KEY_PAGES, ...paths])], res = [];
  let i = 0;
  const worker = async () => { while (i < all.length) { const p = all[i++], t = Date.now(); try { const r = await fetchT(origin + p, { redirect: 'manual' }, 9000); res.push({ path: p, status: r.status, ms: Date.now() - t }); } catch (e) { res.push({ path: p, status: 0, ms: Date.now() - t, error: e.name === 'AbortError' ? 'timed out' : String(e.message).slice(0, 80) }); } } };
  await Promise.all(Array.from({ length: 8 }, worker));
  res.sort((a, b) => (a.status === 200) - (b.status === 200) || b.ms - a.ms);
  return { pages: res, sitemapCount: paths.length };
}
async function checks(origin) {
  const c = [];
  const pg = await timed(async () => { const r = await checkPages(origin), bad = r.pages.filter((p) => p.status !== 200), slow = r.pages.filter((p) => p.status === 200 && p.ms > 3000);
    return { ok: !bad.length, warn: !!slow.length, detail: bad.length ? `${bad.length} of ${r.pages.length} pages fail: ${bad.slice(0, 4).map((p) => p.path + ' (' + (p.status || p.error) + ')').join(', ')}` : `All ${r.pages.length} pages answer${slow.length ? `, ${slow.length} slow (over 3 s)` : ''}. Slowest ${r.pages.length ? Math.max(...r.pages.map((p) => p.ms)) : 0} ms.`, pages: r.pages };
  });
  c.push({ key: 'pages', name: 'Pages', ...pg });
  c.push({ key: 'db', name: 'Database', ...(await timed(async () => { const p = await redis('PING'); return { ok: p === 'PONG', detail: p === 'PONG' ? 'Upstash Redis answers.' : 'Unexpected answer: ' + p }; })) });
  c.push({ key: 'email', name: 'Email sending (Resend)', ...(await timed(async () => {
    if (!env().key) return { ok: false, detail: 'RESEND_API_KEY is not set, so no email can be sent.' };
    const r = await fetchT('https://api.resend.com/domains', { headers: { Authorization: 'Bearer ' + env().key } }), j = await r.json().catch(() => ({}));
    if (r.status === 401 && /restricted/i.test(JSON.stringify(j))) return { ok: true, detail: 'The key works (it is a sending-only key, so the domain status cannot be read).' };
    if (!r.ok) return { ok: false, detail: 'Resend refused the key (' + r.status + '): ' + (j.message || '') };
    const doms = j.data || [], bad = doms.filter((d) => d.status !== 'verified');
    return { ok: !!doms.length && !bad.length, detail: doms.length ? doms.map((d) => d.name + ' ' + d.status).join(', ') : 'No sending domain in Resend.' };
  })) });
  c.push({ key: 'delivery', name: 'Delivery, last 7 days', ...(await timed(async () => {
    const since = Date.now() - 7 * 864e5, rows = (await maillog.all(600)).filter((x) => x.at > since), n = (s) => rows.filter((x) => x.status === s).length;
    const bad = n('bounced') + n('complained') + n('failed');
    return { ok: true, warn: bad > 0, detail: `${rows.length} sent, ${n('delivered')} delivered, ${n('bounced')} bounced, ${n('complained')} spam reports, ${n('failed')} failed.` };
  })) });
  c.push({ key: 'spam', name: 'Spam check (Turnstile)', ...(await timed(async () => {
    if (!process.env.TURNSTILE_SECRET) return { ok: true, warn: true, detail: 'Not set up: forms rely on the honeypot, timing and phrase rules only.' };
    const r = await fetchT('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET, response: 'health-check' }) });
    const codes = ((await r.json().catch(() => ({})))['error-codes'] || []);
    if (codes.includes('invalid-input-secret')) return { ok: false, detail: 'Cloudflare rejects TURNSTILE_SECRET.' };
    return { ok: true, detail: 'Cloudflare answers and accepts the secret' + (process.env.TURNSTILE_SITEKEY ? '.' : ', but TURNSTILE_SITEKEY is missing.'), warn: !process.env.TURNSTILE_SITEKEY };
  })) });
  c.push({ key: 'jobs', name: 'Nightly backup', ...(await timed(async () => {
    if (!process.env.CRON_SECRET) return { ok: false, detail: 'CRON_SECRET is not set, so the backup, digest and these checks never run on their own.' };
    const b = await sec.lastBackup();
    if (!b) return { ok: true, warn: true, detail: 'No backup has run yet.' };
    const age = (Date.now() - b.at) / 3600e3;
    return { ok: b.ok && age < 36, detail: (b.ok ? 'Last backup ' : 'Last backup FAILED ') + Math.round(age) + 'h ago' + (b.ok ? `, ${b.count} records.` : ': ' + (b.error || '')) };
  })) });
  c.push({ key: 'webhook', name: 'Delivery reports', ok: true, warn: !process.env.RESEND_WEBHOOK_SECRET, detail: process.env.RESEND_WEBHOOK_SECRET ? 'Resend webhook is connected.' : 'Not connected: every email stays at "sent". See the Mail section.', ms: 0 });
  return c;
}
async function run(origin, opts) {
  opts = opts || {};
  const at = Date.now(), list = await checks(origin);
  const fails = list.filter((x) => !x.ok), warns = list.filter((x) => x.ok && x.warn);
  const r = { at, origin, ms: Date.now() - at, ok: !fails.length, fails: fails.length, warns: warns.length, checks: list, via: opts.via || 'manual' };
  try { await redis('SET', 'health:last', JSON.stringify(r)); await redis('LPUSH', 'health:hist', JSON.stringify({ at, ok: r.ok, fails: r.fails, warns: r.warns, via: r.via, names: fails.map((x) => x.name) })); await redis('LTRIM', 'health:hist', 0, 59); } catch (e) { console.error('health: not saved', e.message); }
  if (fails.length && opts.alert) await notify.send('Site health: ' + fails.map((x) => x.name + ': ' + x.detail).join(' | ').slice(0, 600), { title: 'Something on the site is down', tag: 'health' });
  return r;
}
async function last() {
  const [l, h] = await Promise.all([redis('GET', 'health:last'), redis('LRANGE', 'health:hist', 0, 59)]);
  return { last: l ? JSON.parse(l) : null, history: (h || []).map((x) => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean) };
}
module.exports = { run, last };
