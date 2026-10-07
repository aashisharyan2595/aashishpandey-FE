// Site content edited from the admin, and client testimonials.
//   cfg:content      { avail, notice, quotes, ask }   (see DEFAULTS)
//   tm:<id>          one testimonial              tms   sorted set of ids by time
// The public pages read /api/config?a=content (CDN-cached for 5 minutes), so a change shows on the site within a few minutes.
const crypto = require('crypto');
const { redis } = require('../_lib');
const cfg = require('./cfg');
const { SITE, env, sendMail, clean, nl2br, firstName } = require('../_mail');

const DEFAULTS = {
  avail: { on: false, text: 'Available for full-time and freelance', status: 'open' },   // the chip on the closing contact panel; off = the built-in text
  notice: { on: false, text: '', link: '', linkText: '', from: '', until: '', style: 'promo', scope: 'all' },    // a thin bar at the top of every page
  closing: { on: false, head: '', em: '', text: '' },                    // the headline and line on the closing contact panel; off = the built-in copy
  quotes: { on: true, max: 3 },                                            // approved testimonials on the closing contact panel
  ask: { subject: 'A quick favour: two lines about working together?', body: 'Hi {first},\n\nThanks again for trusting me with {project}. If you were happy with how it went, would you write two or three lines about it? It takes a minute and helps other people decide.\n\n{link}\n\nNo pressure at all, and I only publish it if you tick the box that says I can.\n\nAashish' },
};
async function get() { const c = await cfg.get('content', {}); return { avail: { ...DEFAULTS.avail, ...(c.avail || {}) }, notice: { ...DEFAULTS.notice, ...(c.notice || {}) }, closing: { ...DEFAULTS.closing, ...(c.closing || {}) }, quotes: { ...DEFAULTS.quotes, ...(c.quotes || {}) }, ask: { ...DEFAULTS.ask, ...(c.ask || {}) } }; }
const STATUS = ['open', 'limited', 'booked'], STYLES = ['promo', 'info', 'alert'], day = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : '');
const okUrl = (u) => !u || /^(https:\/\/|\/)[^\s<>"']{0,300}$/.test(u);
async function save(b, by) {
  const cur = await get(), n = b || {};
  const next = {
    avail: n.avail ? { on: !!n.avail.on, text: clean(n.avail.text, 60) || DEFAULTS.avail.text, status: STATUS.includes(n.avail.status) ? n.avail.status : 'open' } : cur.avail,
    notice: n.notice ? { on: !!n.notice.on, text: clean(n.notice.text, 140), link: clean(n.notice.link, 300), linkText: clean(n.notice.linkText, 40), from: day(n.notice.from), until: day(n.notice.until), style: STYLES.includes(n.notice.style) ? n.notice.style : 'promo', scope: n.notice.scope === 'tools' ? 'tools' : 'all' } : cur.notice,
    closing: n.closing ? { on: !!n.closing.on, head: clean(n.closing.head, 80), em: clean(n.closing.em, 60), text: clean(n.closing.text, 260) } : cur.closing,
    quotes: n.quotes ? { on: !!n.quotes.on, max: Math.min(6, Math.max(1, parseInt(n.quotes.max, 10) || 3)) } : cur.quotes,
    ask: n.ask ? { subject: clean(n.ask.subject, 160) || DEFAULTS.ask.subject, body: String(n.ask.body || '').slice(0, 4000) || DEFAULTS.ask.body } : cur.ask,
  };
  if (!okUrl(next.notice.link)) throw new Error('The notice link must start with https:// or /.');
  if (next.notice.on && !next.notice.text) throw new Error('Write the notice text first.');
  if (next.notice.from && next.notice.until && next.notice.until < next.notice.from) throw new Error('The notice ends before it starts.');
  if (next.closing.on && !next.closing.head && !next.closing.text) throw new Error('Write the closing panel text, or turn it off.');
  const changes = diff(cur, next);
  await cfg.set('content', next);
  await logChanges(changes, by);
  return next;
}

/* ---------- change history: who changed what, with the old and the new value ---------- */
const AREAS = { avail: 'Availability line', notice: 'Notice bar', closing: 'Closing panel', quotes: 'Testimonials', ask: 'Testimonial request email' };
const FIELDS = { on: 'shown', text: 'text', link: 'link', linkText: 'link text', from: 'show from', until: 'hide after', style: 'style', scope: 'where', status: 'status', head: 'headline', em: 'highlighted words', max: 'how many', subject: 'subject', body: 'message' };
const show = (v) => (typeof v === 'boolean' ? (v ? 'on' : 'off') : String(v === undefined || v === null ? '' : v).slice(0, 300));
function diff(a, b) {
  const out = [];
  for (const area of Object.keys(AREAS)) for (const f of Object.keys(b[area] || {})) {
    const x = (a[area] || {})[f], y = b[area][f];
    if (show(x) !== show(y)) out.push({ area: AREAS[area], field: FIELDS[f] || f, before: show(x), after: show(y) });
  }
  return out;
}
async function logChanges(changes, by) {
  if (!changes.length) return;
  const t = Date.now();
  try {
    for (const c of changes.reverse()) await redis('LPUSH', 'content:log', JSON.stringify({ t, by: by || '', ...c }));
    await redis('LTRIM', 'content:log', 0, 299);
  } catch (e) { console.error('content log failed', e.message); }
}
// put one field back to what it was. The log keeps text as shown (300 characters), so the long request email is not restorable.
async function restore(t, area, field) {
  const row = (await history(300)).find((r) => String(r.t) === String(t) && r.area === area && r.field === field);
  if (!row) throw new Error('That entry is no longer in the history.');
  const ak = Object.keys(AREAS).find((k) => AREAS[k] === area), fk = Object.keys(FIELDS).find((k) => FIELDS[k] === field);
  if (!ak || !fk || ak === 'ask') throw new Error('That one cannot be restored from here.');
  const cur = await get(), v = row.before, val = typeof cur[ak][fk] === 'boolean' ? v === 'on' : typeof cur[ak][fk] === 'number' ? Number(v) : v;
  return save({ [ak]: { ...cur[ak], [fk]: val } }, 'Restored');
}
async function history(n) {
  const rows = (await redis('LRANGE', 'content:log', 0, Math.min(300, n || 100) - 1)) || [];
  return rows.map((r) => { try { return JSON.parse(r); } catch (e) { return null; } }).filter(Boolean);
}

/* ---------- testimonials ---------- */
const secret = () => crypto.createHash('sha256').update('ap-tm|' + (env().secret || process.env.ADMIN_PASSWORD || '')).digest();
const sig = (s) => crypto.createHmac('sha256', secret()).update(s).digest('base64url').slice(0, 22);
const tokenFor = (briefId) => `${briefId}.${sig(briefId)}`;
function briefOf(tok) { const [id, s] = String(tok || '').split('.'); if (!id || !s || id.length > 40) return null; const a = Buffer.from(sig(id)), b = Buffer.from(s); return a.length === b.length && crypto.timingSafeEqual(a, b) ? id : null; }
const formUrl = (briefId) => `${SITE}/api/config?a=tform&t=${encodeURIComponent(tokenFor(briefId))}`;

async function list() {
  const ids = (await redis('ZREVRANGE', 'tms', 0, 499)) || [];
  if (!ids.length) return [];
  const rows = await redis('MGET', ...ids.map((i) => 'tm:' + i));
  return rows.map((r) => { try { return r ? JSON.parse(r) : null; } catch (e) { return null; } }).filter(Boolean);
}
async function getTm(id) { const raw = await redis('GET', 'tm:' + id); return raw ? JSON.parse(raw) : null; }
async function putTm(t) { await redis('SET', 'tm:' + t.id, JSON.stringify(t)); await redis('ZADD', 'tms', t.created, t.id); return t; }
// a client (from the emailed link) or the owner (typed in by hand) adds one; it waits for approval either way
async function add(d, from) {
  const t = { id: Date.now().toString(36) + crypto.randomBytes(3).toString('hex'), created: Date.now(), status: 'pending', from: from || 'form',
    quote: clean(d.quote, 600), name: clean(d.name, 80), role: clean(d.role, 80), company: clean(d.company, 80), rating: Math.min(5, Math.max(0, parseInt(d.rating, 10) || 0)), publish: !!d.publish, brief: clean(d.brief, 40), email: clean(d.email, 254) };
  if (t.quote.length < 15) throw new Error('Please write at least a sentence.');
  if (t.name.length < 2) throw new Error('Please add your name.');
  return putTm(t);
}
async function act(id, op, patch) {
  const t = await getTm(clean(id, 30)); if (!t) throw new Error('Not found.');
  if (op === 'delete') { await redis('DEL', 'tm:' + t.id); await redis('ZREM', 'tms', t.id); return null; }
  if (op === 'approve') { if (!t.publish) throw new Error('They did not agree to it being published, so it stays private.'); t.status = 'approved'; }
  else if (op === 'hide') t.status = 'hidden';
  else if (op === 'top' || op === 'bottom') { const os = (await list()).map((x) => x.order || 0); t.order = op === 'top' ? Math.max(0, ...os) + 1 : Math.min(0, ...os) - 1; }   // the site shows higher numbers first
  else if (op === 'edit') { for (const k of ['quote', 'name', 'role', 'company']) if (patch && patch[k] !== undefined) t[k] = clean(patch[k], k === 'quote' ? 600 : 80); if (patch && patch.order !== undefined) t.order = Number(patch.order) || 0; }
  else throw new Error('Unknown action.');
  t.updated = Date.now(); return putTm(t);
}
const pub = (t) => ({ quote: t.quote, name: t.name, role: t.role, company: t.company, rating: t.rating });
async function published(max) { return (await list()).filter((t) => t.status === 'approved' && t.publish).sort((a, b) => (b.order || 0) - (a.order || 0) || b.created - a.created).slice(0, max || 3).map(pub); }

// email the client a link to the form; the brief remembers when it was asked
async function request(rec) {
  const c = await get(), url = formUrl(rec.id);
  const map = { first: firstName(rec.name), name: rec.name || '', company: rec.company || '', project: rec.company ? 'the ' + rec.company + ' project' : 'your project', link: url };
  const fill = (s) => String(s || '').replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k] : m));
  const subject = fill(c.ask.subject), body = fill(c.ask.body);
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222222;">${nl2br(body).replace(url.replace(/&/g, '&amp;'), `<a href="${url}">Write a few lines</a>`)}</div>`;
  await sendMail({ to: rec.email, subject, html, text: body, replyTo: env().admins, kind: 'reply', ref: rec.id });
  return { url };
}
module.exports = { DEFAULTS, get, save, history, restore, diff, list, add, act, published, request, tokenFor, briefOf, formUrl };
