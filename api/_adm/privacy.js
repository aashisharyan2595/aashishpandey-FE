// Privacy requests (GDPR Articles 15 and 17, India's DPDP Act sections 11 and 12): find everything held about one email
// address, hand it over as a file, or erase it. Erasing keeps one thing on purpose: if the address is on the blocked list
// (it bounced or asked not to be written to), it stays there unless asked, so the site never writes to that person again.
// Each request is written to a register with a one-way hash of the address, the counts and who handled it, never the address.
const crypto = require('crypto');
const { redis } = require('../_lib');
const store = require('../_store');
const maillog = require('./maillog');
const content = require('./content');

const norm = (e) => String(e || '').trim().toLowerCase().slice(0, 254);
const ok = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const hash = (e) => crypto.createHash('sha256').update('ap-privacy|' + e).digest('hex').slice(0, 16);
const has = (to, e) => String(to || '').toLowerCase().split(/[,\s]+/).includes(e);

async function gather(email) {
  const e = norm(email); if (!ok(e)) throw new Error('Enter a full email address.');
  const records = (await store.all()).filter((r) => norm(r.email) === e);
  const quoteIds = records.flatMap((r) => r.quotes || []);
  const quotes = []; for (const id of quoteIds) { const raw = await redis('GET', 'quote:' + id); if (raw) { try { quotes.push(JSON.parse(raw)); } catch (x) { /* skip */ } } }
  const mail = (await maillog.all()).filter((m) => has(m.to, e));
  const tms = (await content.list()).filter((t) => norm(t.email) === e || records.some((r) => r.id === t.brief));
  const sup = (await maillog.suppressed())[e] || null;
  const campIds = (await redis('ZREVRANGE', 'camps', 0, 49)) || [], camps = [];
  for (const id of campIds) { const raw = await redis('GET', 'camp:' + id); if (!raw) continue; try { const c = JSON.parse(raw); if ((c.queue || []).some((x) => norm(x) === e) || (c.failed || []).some((f) => norm(f.email) === e)) camps.push(c); } catch (x) { /* skip */ } }
  return { e, records, quotes, mail, tms, sup, camps };
}
const summary = (g) => ({
  email: g.e,
  briefs: g.records.filter((r) => r.type === 'brief').map((r) => ({ id: r.id, created: r.created, service: r.service || '', status: r.status, stage: r.stage || '', name: r.name || '' })),
  subscriber: g.records.filter((r) => r.type === 'subscriber').map((r) => ({ id: r.id, created: r.created, status: r.status })),
  quotes: g.quotes.length, emails: g.mail.length, testimonials: g.tms.length, campaigns: g.camps.length, blocked: g.sup,
  total: g.records.length + g.quotes.length + g.mail.length + g.tms.length,
});
async function find(email) { return summary(await gather(email)); }
async function exportData(email) {
  const g = await gather(email);
  return { about: 'Everything aashishpandey.com holds about this email address, exported on request.', exported: new Date().toISOString(), email: g.e,
    submissions: g.records, quotes: g.quotes.map(({ token, ...q }) => q), emails_sent: g.mail.map((m) => ({ at: new Date(m.at).toISOString(), subject: m.subject, kind: m.kind, status: m.status })),
    testimonials: g.tms, blocked_from_email: g.sup, newsletter_sends: g.camps.map((c) => ({ subject: c.subject, created: new Date(c.created).toISOString() })) };
}
async function erase(email, opts, by) {
  const g = await gather(email), n = summary(g);
  await store.remove(g.records.map((r) => r.id));
  for (const q of g.quotes) { await redis('DEL', 'quote:' + q.id); await redis('ZREM', 'quotes', q.id); }
  for (const m of g.mail) { await redis('DEL', 'mail:' + m.id); await redis('ZREM', 'maillog', m.id); }
  for (const t of g.tms) await content.act(t.id, 'delete');
  for (const c of g.camps) { c.queue = (c.queue || []).filter((x) => norm(x) !== g.e); c.failed = (c.failed || []).filter((f) => norm(f.email) !== g.e); await redis('SET', 'camp:' + c.id, JSON.stringify(c)); }
  if (g.sup && opts && opts.unblock) await maillog.unsuppress(g.e);
  await redis('DEL', 'subemail:' + g.e);
  await note('erase', g.e, n, by, opts && opts.ref);
  return { ok: true, removed: n.total, keptBlock: !!(g.sup && !(opts && opts.unblock)) };
}
async function note(kind, e, n, by, ref) {
  const row = { t: Date.now(), kind, who: hash(e), by: by || '', ref: String(ref || '').slice(0, 80), counts: { briefs: n.briefs.length, subscriber: n.subscriber.length, quotes: n.quotes, emails: n.emails, testimonials: n.testimonials } };
  await redis('LPUSH', 'admin:privacy', JSON.stringify(row)); await redis('LTRIM', 'admin:privacy', 0, 499);
}
async function register() { return ((await redis('LRANGE', 'admin:privacy', 0, 199)) || []).map((r) => { try { return JSON.parse(r); } catch (e) { return null; } }).filter(Boolean); }
module.exports = { find, exportData, erase, note, register, hash, norm };
