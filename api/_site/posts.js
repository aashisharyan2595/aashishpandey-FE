// Blog posts and case studies: storage, editorial workflow, permissions on each entry, comments, locks, taxonomy and checks.
//   post:<id>         one entry as JSON            posts:idx      sorted set of ids by last edit
//   slug:<type>:<s>   id for a slug (old slugs keep pointing at the entry so they can redirect)
//   post:rev:<id>     earlier versions, newest first (30 kept)       lock:<id>   who is editing now (expires in 90 s)
// type is 'post' or 'case'.  status: draft -> review -> approved -> published, plus archived and trash.
// "actor" is the signed-in person: { id, name, perms:Set }. Permissions are listed in api/_adm/perms.js.
const crypto = require('crypto');
const { redis } = require('../_lib');
const md = require('./md');

const TYPES = ['post', 'case'];
const STATUSES = ['draft', 'review', 'approved', 'published', 'archived', 'trash'];
const LIMITS = { title: 120, excerpt: 300, body: 80000, category: 40, tag: 30, tags: 8, seoTitle: 70, seoDesc: 180 };
const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
const list = (a, n, len) => (Array.isArray(a) ? a : String(a || '').split(',')).map((x) => str(x, len)).filter(Boolean).filter((x, i, arr) => arr.indexOf(x) === i).slice(0, n);
const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const newId = () => Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
const img = (v) => { v = str(v, 400); return /^(\/media\/[a-z0-9]+|https:\/\/[^\s"<>]+)$/i.test(v) ? v : ''; };
const url = (v) => { v = str(v, 300); return /^https:\/\/[^\s"<>]+$/i.test(v) ? v : ''; };
const day = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : '');
const err = (msg, code, extra) => Object.assign(new Error(msg), { code: code || 400 }, extra || {});
const has = (a, p) => !!(a && a.perms && a.perms.has(p));
const mine = (a, p) => !!(a && p.createdBy && p.createdBy === a.id);

async function get(id) { if (!/^[a-z0-9]{6,20}$/.test(String(id || ''))) return null; const raw = await redis('GET', 'post:' + id); return raw ? JSON.parse(raw) : null; }
async function bySlug(type, slug) { const id = await redis('GET', `slug:${type}:${slug}`); return id ? get(id) : null; }
async function all() {
  const ids = (await redis('ZREVRANGE', 'posts:idx', 0, 1999)) || [];
  if (!ids.length) return [];
  const rows = await redis('MGET', ...ids.map((i) => 'post:' + i));
  return rows.map((r) => { try { return r ? JSON.parse(r) : null; } catch (e) { return null; } }).filter(Boolean);
}
const isLive = (p, now) => { now = now || Date.now(); return p.status === 'published' && (!p.publishAt || p.publishAt <= now) && (!p.unpublishAt || p.unpublishAt > now); };
const stateOf = (p, now) => { now = now || Date.now(); if (p.status !== 'published') return p.status; if (p.unpublishAt && p.unpublishAt <= now) return 'expired'; return p.publishAt && p.publishAt > now ? 'scheduled' : 'published'; };

let cache = null;
async function live(type) {
  if (!cache || Date.now() - cache.t > 20000) cache = { t: Date.now(), rows: (await all()).filter((p) => isLive(p)).sort((a, b) => (b.publishAt || b.updated) - (a.publishAt || a.updated)) };
  return type ? cache.rows.filter((p) => p.type === type) : cache.rows;
}
const dropCache = () => { cache = null; };

/* ---------- who may do what to one entry ---------- */
function canView(a) { return has(a, 'content.view'); }
function canEdit(a, p) {
  if (p.status === 'trash') return false;   // restore first
  if (p.status === 'published' || p.status === 'archived') return has(a, 'content.publish');   // a live page changes the site
  if (has(a, 'content.edit_any')) return true;
  return mine(a, p) && has(a, 'content.edit_own') && (p.status === 'draft' || p.status === 'review');
}
// '' when the move is allowed, otherwise the reason it is not
function moveError(a, p, to) {
  const from = p.status;
  if (!STATUSES.includes(to)) return 'Unknown status.';
  if (from === to) return 'It is already ' + to + '.';
  const pub = has(a, 'content.publish'), rev = has(a, 'content.review'), del = has(a, 'content.delete'), own = mine(a, p);
  const no = (what) => 'You do not have permission to ' + what + '.';
  if (to === 'review') return (from === 'draft' || from === 'approved') && (canEdit(a, p) || rev) ? '' : no('send this for review');
  if (to === 'approved') return from === 'review' && rev ? '' : no('approve this');
  if (to === 'published') return pub ? '' : no('publish');
  if (to === 'archived') return pub ? '' : no('archive');
  if (to === 'trash') return del || (own && from === 'draft' && has(a, 'content.edit_own')) ? '' : no('delete this');
  if (to === 'draft') {
    if (from === 'review') return rev || own || pub ? '' : no('send this back');
    if (from === 'approved') return rev || pub ? '' : no('send this back');
    if (from === 'published' || from === 'archived') return pub ? '' : no('take this off the site');
    if (from === 'trash') return del || own ? '' : no('restore this');
  }
  return 'That move is not allowed.';
}

/* ---------- normalising what the editor sends ---------- */
function normalise(b, cur, a) {
  b = b || {}; const type = TYPES.includes(b.type) ? b.type : (cur && cur.type) || 'post';
  const o = {
    id: cur ? cur.id : newId(), type, created: cur ? cur.created : Date.now(), updated: Date.now(),
    title: str(b.title, LIMITS.title), slug: slugify(b.slug || b.title || ''),
    excerpt: str(b.excerpt, LIMITS.excerpt), body: String(b.body == null ? '' : b.body).slice(0, LIMITS.body).replace(/\u0000/g, ''),
    cover: { src: img(b.cover && b.cover.src), alt: str(b.cover && b.cover.alt, 160) },
    tags: list(b.tags, LIMITS.tags, LIMITS.tag), category: str(b.category, LIMITS.category),
    featured: !!b.featured, publishAt: Number(b.publishAt) > 0 ? Number(b.publishAt) : 0, unpublishAt: Number(b.unpublishAt) > 0 ? Number(b.unpublishAt) : 0,
    due: day(b.due), assignee: str(b.assignee, 20),
    seo: { title: str(b.seo && b.seo.title, LIMITS.seoTitle), description: str(b.seo && b.seo.description, LIMITS.seoDesc), canonical: url(b.seo && b.seo.canonical), noindex: !!(b.seo && b.seo.noindex), ogImage: img(b.seo && b.seo.ogImage) },
  };
  if (type === 'case') o.case = {
    client: str(b.case && b.case.client, 80), role: str(b.case && b.case.role, 80), year: str(b.case && b.case.year, 12), services: list(b.case && b.case.services, 8, 40), stack: list(b.case && b.case.stack, 14, 30),
    link: url(b.case && b.case.link), metrics: (Array.isArray(b.case && b.case.metrics) ? b.case.metrics : []).slice(0, 4).map((m) => ({ value: str(m && m.value, 16), label: str(m && m.label, 60) })).filter((m) => m.value && m.label),
  };
  // who is shown as the author: the writer by default; people who can edit anyone's work may pick someone else
  const pickAuthor = a && (has(a, 'content.edit_any') || has(a, 'content.publish'));
  o.authorId = pickAuthor && b.authorId ? str(b.authorId, 20) : (cur && cur.authorId) || (a && a.id) || 'owner';
  o.author = str(b.author, 60) || (cur && cur.author) || (a && a.name) || 'Aashish Pandey';
  return o;
}

async function uniqueSlug(type, slug, exceptId) {
  let s = slug || 'untitled', n = 2;
  for (;;) { const id = await redis('GET', `slug:${type}:${s}`); if (!id || id === exceptId) return s; s = slug + '-' + n++; if (n > 60) return slug + '-' + newId().slice(-5); }
}
const event = (a, o) => Object.assign({ t: Date.now(), by: a ? a.id : '', name: a ? a.name : '' }, o);
const stamp = (p, ev) => { p.timeline = (p.timeline || []).concat([ev]).slice(-60); };

// problems that stop an entry going on the site
function publishErrors(o) {
  const e = [];
  if (!o.title) e.push('Add a title.'); if (!o.slug) e.push('Add a web address.');
  if (o.body.trim().length < 40) e.push('Write the body (at least a few sentences).');
  if (!o.excerpt) e.push('Add a short summary: it becomes the search description and the card text.');
  if (o.publishAt && o.unpublishAt && o.unpublishAt <= o.publishAt) e.push('The take-down time is before the go-live time.');
  return e;
}

/* ---------- save ---------- */
async function save(input, actor) {
  const cur = input && input.id ? await get(input.id) : null;
  if (input && input.id && !cur) throw err('That entry no longer exists.', 404);
  if (cur) {
    if (!canEdit(actor, cur)) throw err(cur.status === 'trash' ? 'Restore it from the trash before editing.' : cur.status === 'published' || cur.status === 'archived' ? 'Only people who can publish may change a live entry.' : 'You can only edit your own drafts.', 403);
    if (input.base && cur.updated > Number(input.base) && !input.force) throw err('Someone saved a newer version while you were editing.', 409, { by: (cur.timeline && cur.timeline.length ? cur.timeline[cur.timeline.length - 1].name : '') || cur.author, at: cur.updated });
  } else if (!has(actor, 'content.create')) throw err('You do not have permission to write new entries.', 403);
  const o = normalise(input, cur, actor);
  if (!o.title) throw err('Add a title first.');
  o.status = cur ? cur.status : 'draft'; o.createdBy = cur ? cur.createdBy : actor.id; o.createdByName = cur ? cur.createdByName : actor.name;
  o.comments = cur ? cur.comments || [] : []; o.timeline = cur ? cur.timeline || [] : []; o.oldSlugs = cur ? cur.oldSlugs || [] : [];
  if (cur) { o.trashedAt = cur.trashedAt; o.prevStatus = cur.prevStatus; }
  // only those who can publish may schedule; an author's own date fields are ignored
  if (!has(actor, 'content.publish')) { o.publishAt = cur ? cur.publishAt : 0; o.unpublishAt = cur ? cur.unpublishAt : 0; o.featured = cur ? cur.featured : false; }
  // people without edit_any cannot reassign someone else's entry
  if (cur && !has(actor, 'content.edit_any') && !has(actor, 'content.publish')) o.assignee = cur.assignee || '';
  o.slug = await uniqueSlug(o.type, o.slug || slugify(o.title), o.id);
  const r = md.render(o.body, {}); o.words = r.words; o.mins = Math.max(1, Math.round(r.words / 200));
  if (cur) {
    await redis('LPUSH', 'post:rev:' + cur.id, JSON.stringify({ t: Date.now(), by: actor.name, post: cur })); await redis('LTRIM', 'post:rev:' + cur.id, 0, 29);
    if (cur.slug !== o.slug) { o.oldSlugs = [cur.slug].concat(o.oldSlugs.filter((x) => x !== cur.slug && x !== o.slug)).slice(0, 10); }
    if (cur.status === 'approved' && (cur.body !== o.body || cur.title !== o.title)) { o.status = 'review'; stamp(o, event(actor, { a: 'moved', from: 'approved', to: 'review', note: 'Edited after approval' })); }
  }
  stamp(o, event(actor, { a: cur ? 'edited' : 'created' }));
  await redis('SET', 'post:' + o.id, JSON.stringify(o)); await redis('SET', `slug:${o.type}:${o.slug}`, o.id); await redis('ZADD', 'posts:idx', o.updated, o.id);
  dropCache(); return o;
}

/* ---------- moving through the workflow ---------- */
async function move(id, to, actor, opts) {
  opts = opts || {};
  const p = await get(id); if (!p) throw err('Not found.', 404);
  const why = moveError(actor, p, to); if (why) throw err(why, 403);
  if (to === 'published') {
    if (opts.publishAt !== undefined) p.publishAt = Number(opts.publishAt) > 0 ? Number(opts.publishAt) : 0;
    if (opts.unpublishAt !== undefined) p.unpublishAt = Number(opts.unpublishAt) > 0 ? Number(opts.unpublishAt) : 0;
    const e = publishErrors(p); if (e.length) throw err(e.join(' '), 400, { problems: e });
    if (!p.publishAt) p.publishAt = Date.now();
  }
  if (to === 'trash') { p.prevStatus = p.status; p.trashedAt = Date.now(); }
  if (p.status === 'trash' && to !== 'trash') { p.trashedAt = 0; }
  const from = p.status; p.status = to; p.updated = Date.now();
  const note = str(opts.note, 1000);
  if (note) p.comments = (p.comments || []).concat([{ id: newId(), t: Date.now(), by: actor.id, name: actor.name, kind: to === 'approved' ? 'approve' : from === 'review' && to === 'draft' && has(actor, 'content.review') ? 'changes' : 'comment', text: note }]).slice(-200);
  stamp(p, event(actor, { a: 'moved', from, to, note: note ? note.slice(0, 120) : undefined }));
  await redis('SET', 'post:' + p.id, JSON.stringify(p)); await redis('ZADD', 'posts:idx', p.updated, p.id);
  dropCache(); return { post: p, from };
}

async function comment(id, actor, text) {
  const p = await get(id); if (!p) throw err('Not found.', 404);
  text = str(text, 1500); if (!text) throw err('Write a comment first.');
  const c = { id: newId(), t: Date.now(), by: actor.id, name: actor.name, kind: 'comment', text };
  p.comments = (p.comments || []).concat([c]).slice(-200);
  await redis('SET', 'post:' + p.id, JSON.stringify(p)); return { post: p, comment: c };
}
async function setAssignee(id, actor, assignee, due) {
  const p = await get(id); if (!p) throw err('Not found.', 404);
  if (!has(actor, 'content.edit_any') && !has(actor, 'content.review') && !has(actor, 'content.publish')) throw err('You do not have permission to assign work.', 403);
  p.assignee = str(assignee, 20); if (due !== undefined) p.due = day(due); p.updated = Date.now();
  stamp(p, event(actor, { a: 'assigned', note: p.assignee ? 'Assigned' : 'Unassigned' }));
  await redis('SET', 'post:' + p.id, JSON.stringify(p)); dropCache(); return p;
}

// delete for good: only from the trash
async function purge(id, actor) {
  const p = await get(id); if (!p) throw err('Not found.', 404);
  if (p.status !== 'trash') throw err('Move it to the trash first.', 400);
  if (!has(actor, 'content.delete')) throw err('You do not have permission to delete for good.', 403);
  for (const s of [p.slug].concat(p.oldSlugs || [])) await redis('DEL', `slug:${p.type}:${s}`);
  await redis('DEL', 'post:' + p.id); await redis('ZREM', 'posts:idx', p.id); await redis('DEL', 'post:rev:' + p.id); await redis('DEL', 'lock:' + p.id);
  dropCache(); return true;
}

/* ---------- versions ---------- */
async function revisions(id) { return ((await redis('LRANGE', 'post:rev:' + id, 0, 29)) || []).map((r) => { try { return JSON.parse(r); } catch (e) { return null; } }).filter(Boolean); }
async function restore(id, t, actor) {
  const rev = (await revisions(id)).find((r) => String(r.t) === String(t)); if (!rev) throw err('That version is no longer kept.', 404);
  const cur = await get(id); const p = rev.post; return save({ ...p, id, base: cur && cur.updated }, actor);
}
// line by line difference between two texts (longest common subsequence; entries are short enough for this)
function lineDiff(a, b) {
  const x = String(a || '').split('\n'), y = String(b || '').split('\n'), n = Math.min(x.length, 1500), m = Math.min(y.length, 1500);
  const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = []; let i = 0, j = 0;
  while (i < n && j < m) { if (x[i] === y[j]) { out.push({ t: '=', s: x[i] }); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) out.push({ t: '-', s: x[i++] }); else out.push({ t: '+', s: y[j++] }); }
  while (i < n) out.push({ t: '-', s: x[i++] }); while (j < m) out.push({ t: '+', s: y[j++] });
  // keep a little context around the changes
  const keep = out.map((l, k) => l.t !== '=' || out.slice(Math.max(0, k - 2), k + 3).some((q) => q.t !== '='));
  const res = []; let skipped = 0;
  out.forEach((l, k) => { if (keep[k]) { if (skipped) { res.push({ t: '~', s: skipped + ' unchanged lines' }); skipped = 0; } res.push(l); } else skipped++; });
  if (skipped) res.push({ t: '~', s: skipped + ' unchanged lines' });
  return res;
}

/* ---------- soft locks so two people do not edit the same entry blindly ---------- */
async function lock(id, actor, take) {
  const k = 'lock:' + id, raw = await redis('GET', k), cur = raw ? JSON.parse(raw) : null;
  if (cur && cur.uid !== actor.id && !take) return { held: false, by: cur.name, since: cur.t };
  await redis('SET', k, JSON.stringify({ uid: actor.id, name: actor.name, t: cur && cur.uid === actor.id ? cur.t : Date.now() }), 'EX', 90);
  return { held: true };
}
async function unlock(id, actor) { const k = 'lock:' + id, raw = await redis('GET', k), cur = raw ? JSON.parse(raw) : null; if (cur && cur.uid === actor.id) await redis('DEL', k); }
async function lockOf(id) { const raw = await redis('GET', 'lock:' + id); return raw ? JSON.parse(raw) : null; }

/* ---------- categories and tags ---------- */
async function taxonomy() {
  const rows = (await all()).filter((p) => p.status !== 'trash'), tags = {}, cats = {};
  rows.forEach((p) => { (p.tags || []).forEach((t) => { tags[t] = (tags[t] || 0) + 1; }); if (p.category) cats[p.category] = (cats[p.category] || 0) + 1; });
  const fmt = (m) => Object.entries(m).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return { tags: fmt(tags), categories: fmt(cats) };
}
async function renameTax(kind, from, to, actor) {
  from = str(from, 40); to = str(to, 40); if (!from || !to) throw err('Give both names.');
  let n = 0;
  for (const p of await all()) {
    let ch = false;
    if (kind === 'tag' && (p.tags || []).includes(from)) { p.tags = [...new Set(p.tags.map((t) => (t === from ? to : t)))].slice(0, 8); ch = true; }
    if (kind === 'category' && p.category === from) { p.category = to; ch = true; }
    if (ch) { p.updated = Date.now(); stamp(p, event(actor, { a: 'edited', note: (kind === 'tag' ? 'Tag ' : 'Category ') + from + ' renamed to ' + to })); await redis('SET', 'post:' + p.id, JSON.stringify(p)); await redis('ZADD', 'posts:idx', p.updated, p.id); n++; }
  }
  dropCache(); return n;
}
async function deleteTax(kind, name, actor) {
  name = str(name, 40); let n = 0;
  for (const p of await all()) {
    let ch = false;
    if (kind === 'tag' && (p.tags || []).includes(name)) { p.tags = p.tags.filter((t) => t !== name); ch = true; }
    if (kind === 'category' && p.category === name) { p.category = ''; ch = true; }
    if (ch) { p.updated = Date.now(); stamp(p, event(actor, { a: 'edited', note: (kind === 'tag' ? 'Tag ' : 'Category ') + name + ' removed' })); await redis('SET', 'post:' + p.id, JSON.stringify(p)); await redis('ZADD', 'posts:idx', p.updated, p.id); n++; }
  }
  dropCache(); return n;
}

/* ---------- checks shown before publishing ---------- */
function checks(p) {
  const out = [], add = (level, label, detail) => out.push({ level, label, detail: detail || '' });
  const title = (p.seo && p.seo.title) || p.title || '', desc = (p.seo && p.seo.description) || p.excerpt || '', body = p.body || '', words = body.trim().split(/\s+/).filter(Boolean).length;
  if (!p.title) add('bad', 'Title', 'Add a title.'); else if (title.length < 25) add('warn', 'Search title is short', title.length + ' characters. Around 30 to 60 reads best in results.'); else if (title.length > 60) add('warn', 'Search title is long', title.length + ' characters. Google may cut it at about 60.'); else add('ok', 'Search title length');
  if (!desc) add('bad', 'Summary', 'The summary becomes the search description and the card text.'); else if (desc.length < 70) add('warn', 'Description is short', desc.length + ' characters. 70 to 155 works well.'); else if (desc.length > 160) add('warn', 'Description is long', desc.length + ' characters. It will be cut at about 155.'); else add('ok', 'Description length');
  if (!p.slug) add('bad', 'Web address', 'Add one.'); else if (p.slug.length > 70) add('warn', 'Web address is long', 'Shorter addresses are easier to share.'); else add('ok', 'Web address');
  if (!(p.cover && p.cover.src)) add('warn', 'Cover image', 'Posts with a cover image look better on cards and when shared.'); else if (!(p.cover.alt || '').trim()) add('warn', 'Cover image has no description', 'Describe the image for people using screen readers.'); else add('ok', 'Cover image');
  if (words < 150) add('warn', 'Very short', words + ' words. Search engines prefer a substantial page.'); else add('ok', words + ' words');
  const heads = (body.match(/^#{1,4}\s+\S/gm) || []).length; if (words > 500 && heads < 2) add('warn', 'Add headings', 'Long text reads better with sub headings, and they build the contents list.'); else if (words > 500) add('ok', 'Headings');
  const imgs = [...body.matchAll(/!\[([^\]]*)\]\(/g)]; const noAlt = imgs.filter((m) => !m[1].trim()).length; if (noAlt) add('warn', noAlt + ' image' + (noAlt === 1 ? ' has' : 's have') + ' no description', 'Add text between the square brackets.');
  const links = (body.match(/\]\((\/[^)\s]*|https?:\/\/(www\.)?aashishpandey\.com[^)\s]*)/g) || []).length; if (!links) add('warn', 'No links to other pages', 'Link to a service, tool or related post.'); else add('ok', 'Links to other pages');
  if (!(p.tags || []).length) add('warn', 'No tags', 'Tags group posts and power the topic filter.'); if (!p.category) add('warn', 'No category', '');
  if (p.type === 'case') { const c = p.case || {}; if (!c.client) add('warn', 'Client name missing', ''); if (!(c.metrics || []).length) add('warn', 'No results numbers', 'Case studies land better with one or two numbers.'); }
  if (/(lorem ipsum|TODO|\bXXX\b)/i.test(body)) add('bad', 'Placeholder text found', 'Search for lorem ipsum, TODO or XXX.');
  const score = Math.max(0, 100 - out.filter((x) => x.level === 'bad').length * 25 - out.filter((x) => x.level === 'warn').length * 8);
  return { items: out, score, blockers: publishErrors({ ...p, body: body, title: p.title || '', slug: p.slug || '', excerpt: p.excerpt || '' }) };
}

const summary = (p, now) => ({ id: p.id, type: p.type, title: p.title, slug: p.slug, status: p.status, state: stateOf(p, now), updated: p.updated, created: p.created, publishAt: p.publishAt, unpublishAt: p.unpublishAt, tags: p.tags, category: p.category, authorId: p.authorId, author: p.author, createdBy: p.createdBy, createdByName: p.createdByName, assignee: p.assignee || '', due: p.due || '', words: p.words, mins: p.mins, cover: p.cover && p.cover.src, featured: p.featured, excerpt: p.excerpt, noindex: !!(p.seo && p.seo.noindex), comments: (p.comments || []).length, trashedAt: p.trashedAt || 0 });

// a preview link for an unpublished entry: signed so only someone holding the link can read it
const secret = () => crypto.createHash('sha256').update('ap-preview|' + (process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'x')).digest();
const previewToken = (id) => { const exp = Date.now() + 7 * 864e5, p = id + '.' + exp; return p + '.' + crypto.createHmac('sha256', secret()).update(p).digest('base64url').slice(0, 24); };
function previewId(tok) { const [id, exp, sig] = String(tok || '').split('.'); if (!id || !exp || !sig || Number(exp) < Date.now()) return null; const want = crypto.createHmac('sha256', secret()).update(id + '.' + exp).digest('base64url').slice(0, 24); const a = Buffer.from(want), b = Buffer.from(sig); return a.length === b.length && crypto.timingSafeEqual(a, b) ? id : null; }

module.exports = { TYPES, STATUSES, get, bySlug, all, live, save, move, comment, setAssignee, purge, revisions, restore, lineDiff, lock, unlock, lockOf, taxonomy, renameTax, deleteTax, checks, summary, previewToken, previewId, stateOf, isLive, canEdit, canView, moveError, publishErrors, slugify, dropCache, has, mine, err };
