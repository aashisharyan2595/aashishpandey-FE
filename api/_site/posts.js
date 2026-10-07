// Blog posts and case studies, kept in Redis and rendered on request (see render.js).
//   post:<id>        one entry as JSON            posts:idx     sorted set of ids by last edit
//   slug:<type>:<s>  id for a slug                post:rev:<id> list of earlier versions, newest first (30 kept)
// type is 'post' or 'case'. status is 'draft' or 'published'; a published entry whose publishAt is still in the future is "scheduled".
const crypto = require('crypto');
const { redis } = require('../_lib');
const md = require('./md');

const TYPES = ['post', 'case'];
const LIMITS = { title: 120, excerpt: 300, body: 80000, category: 40, author: 60, tag: 30, tags: 8, seoTitle: 70, seoDesc: 180 };
const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
const list = (a, n, len) => (Array.isArray(a) ? a : String(a || '').split(',')).map((x) => str(x, len)).filter(Boolean).filter((x, i, arr) => arr.indexOf(x) === i).slice(0, n);
const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const newId = () => Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
const img = (v) => { v = str(v, 400); return /^(\/media\/[a-z0-9]+|https:\/\/[^\s"<>]+)$/i.test(v) ? v : ''; };
const url = (v) => { v = str(v, 300); return /^https:\/\/[^\s"<>]+$/i.test(v) ? v : ''; };

async function get(id) { if (!/^[a-z0-9]{6,20}$/.test(String(id || ''))) return null; const raw = await redis('GET', 'post:' + id); return raw ? JSON.parse(raw) : null; }
async function bySlug(type, slug) { const id = await redis('GET', `slug:${type}:${slug}`); return id ? get(id) : null; }
async function all() {
  const ids = (await redis('ZREVRANGE', 'posts:idx', 0, 999)) || [];
  if (!ids.length) return [];
  const rows = await redis('MGET', ...ids.map((i) => 'post:' + i));
  return rows.map((r) => { try { return r ? JSON.parse(r) : null; } catch (e) { return null; } }).filter(Boolean);
}
const isLive = (p, now) => p.status === 'published' && (!p.publishAt || p.publishAt <= (now || Date.now()));
const stateOf = (p, now) => (p.status !== 'published' ? 'draft' : isLive(p, now) ? 'published' : 'scheduled');

// what the public pages see: only live entries, newest first, cached briefly per server instance
let cache = null;
async function live(type) {
  if (!cache || Date.now() - cache.t > 20000) cache = { t: Date.now(), rows: (await all()).filter((p) => isLive(p)).sort((a, b) => (b.publishAt || b.updated) - (a.publishAt || a.updated)) };
  return type ? cache.rows.filter((p) => p.type === type) : cache.rows;
}
const dropCache = () => { cache = null; };

function normalise(input, cur) {
  const b = input || {}, type = TYPES.includes(b.type) ? b.type : (cur && cur.type) || 'post';
  const o = {
    id: cur ? cur.id : newId(), type, created: cur ? cur.created : Date.now(), updated: Date.now(),
    title: str(b.title, LIMITS.title), slug: slugify(b.slug || b.title || ''),
    excerpt: str(b.excerpt, LIMITS.excerpt), body: String(b.body == null ? '' : b.body).slice(0, LIMITS.body).replace(/\u0000/g, ''),
    cover: { src: img(b.cover && b.cover.src), alt: str(b.cover && b.cover.alt, 160) },
    tags: list(b.tags, LIMITS.tags, LIMITS.tag), category: str(b.category, LIMITS.category), author: str(b.author, LIMITS.author) || 'Aashish Pandey',
    status: b.status === 'published' ? 'published' : 'draft', featured: !!b.featured,
    publishAt: Number(b.publishAt) > 0 ? Number(b.publishAt) : 0,
    seo: { title: str(b.seo && b.seo.title, LIMITS.seoTitle), description: str(b.seo && b.seo.description, LIMITS.seoDesc), canonical: url(b.seo && b.seo.canonical), noindex: !!(b.seo && b.seo.noindex), ogImage: img(b.seo && b.seo.ogImage) },
  };
  if (type === 'case') o.case = {
    client: str(b.case && b.case.client, 80), role: str(b.case && b.case.role, 80), year: str(b.case && b.case.year, 12), services: list(b.case && b.case.services, 8, 40), stack: list(b.case && b.case.stack, 14, 30),
    link: url(b.case && b.case.link), metrics: (Array.isArray(b.case && b.case.metrics) ? b.case.metrics : []).slice(0, 4).map((m) => ({ value: str(m && m.value, 16), label: str(m && m.label, 60) })).filter((m) => m.value && m.label),
  };
  return o;
}

async function uniqueSlug(type, slug, exceptId) {
  let s = slug || 'untitled', n = 2;
  for (;;) { const id = await redis('GET', `slug:${type}:${s}`); if (!id || id === exceptId) return s; s = slug + '-' + n++; if (n > 60) return slug + '-' + newId().slice(-5); }
}

async function save(input, who) {
  const cur = input && input.id ? await get(input.id) : null;
  if (input && input.id && !cur) throw new Error('That entry no longer exists.');
  const o = normalise(input, cur);
  if (!o.title) throw new Error('Add a title first.');
  if (o.status === 'published') {
    if (!o.slug) throw new Error('Add a web address (slug).');
    if (o.body.trim().length < 40) throw new Error('Write the body before publishing.');
    if (!o.excerpt) throw new Error('Add a short summary (it becomes the search description and the card text).');
    if (!o.publishAt) o.publishAt = cur && cur.publishAt && cur.status === 'published' ? cur.publishAt : Date.now();
  } else if (!o.publishAt) o.publishAt = 0;
  o.slug = await uniqueSlug(o.type, o.slug || slugify(o.title), o.id);
  const r = md.render(o.body, {}); o.words = r.words; o.mins = Math.max(1, Math.round(r.words / 200));
  if (cur) {   // keep the old version so a mistake can be undone
    await redis('LPUSH', 'post:rev:' + cur.id, JSON.stringify({ t: Date.now(), by: who || '', post: cur })); await redis('LTRIM', 'post:rev:' + cur.id, 0, 29);
    if (cur.slug !== o.slug || cur.type !== o.type) await redis('DEL', `slug:${cur.type}:${cur.slug}`);
  }
  o.history = (cur && cur.history ? cur.history : []).concat([{ t: Date.now(), by: who || '', a: !cur ? 'created' : cur.status !== o.status ? o.status : 'edited' }]).slice(-12);
  await redis('SET', 'post:' + o.id, JSON.stringify(o)); await redis('SET', `slug:${o.type}:${o.slug}`, o.id); await redis('ZADD', 'posts:idx', o.updated, o.id);
  dropCache(); return o;
}
async function remove(id) {
  const p = await get(id); if (!p) return false;
  await redis('DEL', 'post:' + p.id); await redis('DEL', `slug:${p.type}:${p.slug}`); await redis('ZREM', 'posts:idx', p.id); await redis('DEL', 'post:rev:' + p.id);
  dropCache(); return true;
}
async function revisions(id) { return ((await redis('LRANGE', 'post:rev:' + id, 0, 29)) || []).map((r) => { try { return JSON.parse(r); } catch (e) { return null; } }).filter(Boolean); }
async function restore(id, t, who) {
  const rev = (await revisions(id)).find((r) => String(r.t) === String(t)); if (!rev) throw new Error('That version is no longer kept.');
  const p = rev.post; return save({ ...p, id }, who);
}
// a preview link for an unpublished entry: signed so only someone holding the link can read it
const secret = () => crypto.createHash('sha256').update('ap-preview|' + (process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'x')).digest();
const previewToken = (id) => { const exp = Date.now() + 7 * 864e5, p = id + '.' + exp; return p + '.' + crypto.createHmac('sha256', secret()).update(p).digest('base64url').slice(0, 24); };
function previewId(tok) { const [id, exp, sig] = String(tok || '').split('.'); if (!id || !exp || !sig || Number(exp) < Date.now()) return null; const want = crypto.createHmac('sha256', secret()).update(id + '.' + exp).digest('base64url').slice(0, 24); const a = Buffer.from(want), b = Buffer.from(sig); return a.length === b.length && crypto.timingSafeEqual(a, b) ? id : null; }

const pub = (p) => ({ id: p.id, type: p.type, title: p.title, slug: p.slug, excerpt: p.excerpt, cover: p.cover, tags: p.tags, category: p.category, author: p.author, publishAt: p.publishAt, mins: p.mins, featured: p.featured, case: p.case });
module.exports = { TYPES, get, bySlug, all, live, save, remove, revisions, restore, previewToken, previewId, stateOf, isLive, slugify, pub, dropCache };
