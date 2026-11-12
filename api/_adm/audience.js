// Audience: the subscriber side of the admin, built like a mailing tool (growth, people, profiles, tags, campaign reports, list health).
// No new storage service and no new keys: it reads the same records the inbox uses (sub:<id>), the delivery log Resend's webhook fills
// (mail:<id>, with opened/clicked when tracking is on) and the campaign records (camp:<id>). Tags live on the subscriber record.
// Privacy: an unsubscribe is never undone by the admin unless the admin made it; imports need a consent statement and skip anyone
// who unsubscribed or is blocked; erasing a person stays in Privacy requests.
const store = require('../_store');
const { redis } = require('../_lib');
const maillog = require('./maillog');
const desk = require('./desk');
const X = require('./export');

const H = 3600e3, D = 24 * H, IST = 5.5 * H;
const lc = (s) => String(s || '').trim().toLowerCase();
const okEmail = (e) => /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]{2,}$/.test(e) && e.length <= 254;
const dayKey = (t) => new Date(t + IST).toISOString().slice(0, 10);   // the day in India
const joined = (r) => r.confirmed || r.created;
const cleanTag = (t) => lc(t).replace(/[^a-z0-9 _-]+/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);
const tagsOf = (r) => (Array.isArray(r.tags) ? r.tags : []);
const label = (via, source) => { const k = via || (source === 'import' ? 'import' : ''); return /^pop-/.test(k) ? 'Pop-up (' + k.slice(4) + ')' : desk.SOURCE_LABEL[k] || k; };

/* ---------- loading everything once per request ---------- */
async function camps(cap = 50) {
  const ids = (await redis('ZREVRANGE', 'camps', 0, cap - 1)) || [], out = [];
  for (let i = 0; i < ids.length; i += 100) { const rows = await redis('MGET', ...ids.slice(i, i + 100).map((x) => 'camp:' + x)); for (const r of rows) { if (r) { try { out.push(JSON.parse(r)); } catch (e) { /* skip */ } } } }
  return out;
}
async function load() {
  const [rows, mail, sup] = await Promise.all([store.all(), maillog.all(3000), maillog.suppressed()]);
  return { rows, subs: rows.filter((r) => r.type === 'subscriber'), mail, sup };
}
// what each address did with the emails it got: counts and the latest times
function engagementMap(mail) {
  const m = new Map();
  for (const e of mail) {
    for (const to of String(e.to || '').toLowerCase().split(/[,\s]+/).filter(Boolean)) {
      let x = m.get(to); if (!x) { x = { sent: 0, news: 0, opened: 0, clicked: 0, bounced: 0, lastSent: 0, lastOpen: 0, lastClick: 0 }; m.set(to, x); }
      x.sent++; if (e.kind === 'newsletter') x.news++;
      if (e.at > x.lastSent) x.lastSent = e.at;
      if (e.status === 'bounced' || e.status === 'complained') x.bounced++;
      for (const ev of e.events || []) {
        if (ev.type === 'opened') { x.lastOpen = Math.max(x.lastOpen, ev.at); }
        if (ev.type === 'clicked') { x.lastClick = Math.max(x.lastClick, ev.at); x.lastOpen = Math.max(x.lastOpen, ev.at); }
      }
      if (e.opened || e.clicked) x.opened++;
      if (e.clicked) x.clicked++;
    }
  }
  return m;
}
// engaged: opened or clicked in 90 days · quiet: got mail, nothing opened in 90 days · new: joined in the last 30 days, nothing to judge yet
function tierOf(r, eg, now) {
  if (r.status !== 'subscribed') return r.status;
  const e = eg || {};
  if (e.lastOpen > now - 90 * D) return 'engaged';
  if (joined(r) > now - 30 * D && !(e.lastOpen)) return 'new';
  if (e.sent) return 'quiet';
  return 'nodata';
}
// 0-100: opens and clicks over the emails they got, with recent activity counting more
function scoreOf(eg, now) {
  if (!eg || !eg.sent) return null;
  let s = Math.min(1, eg.opened / eg.sent) * 60 + Math.min(1, eg.clicked / Math.max(1, eg.opened || 1)) * 20;
  if (eg.lastOpen > now - 30 * D) s += 20; else if (eg.lastOpen > now - 90 * D) s += 10;
  return Math.round(Math.min(100, s));
}
function row(r, eg, sup, now) {
  const e = eg || {}, blocked = sup[lc(r.email)] || null;
  return { id: r.id, email: r.email, name: r.name || '', status: r.status, joined: joined(r), created: r.created, unsubscribed: r.unsubscribed || 0, via: r.via || '', source: r.source || '', viaLabel: label(r.via, r.source), page: r.page || '', tags: tagsOf(r),
    sent: e.sent || 0, news: e.news || 0, opened: e.opened || 0, clicked: e.clicked || 0, lastSent: e.lastSent || 0, lastOpen: e.lastOpen || 0, score: scoreOf(e, now), tier: tierOf(r, e, now), blocked: blocked ? blocked.reason : '' };
}

/* ---------- overview ---------- */
function series(subs, now, days) {
  const end = new Date(dayKey(now) + 'T23:59:59.999+05:30').getTime(), start = end - days * D + 1, monthly = days > 120;
  const keys = [], idx = {};
  for (let t = start; t <= end; t += D) { const k = monthly ? dayKey(t).slice(0, 7) : dayKey(t); if (!(k in idx)) { idx[k] = keys.length; keys.push(k); } }
  const gain = keys.map(() => 0), lost = keys.map(() => 0), total = keys.map(() => 0);
  const key = (t) => (monthly ? dayKey(t).slice(0, 7) : dayKey(t));
  for (const r of subs) {
    const j = joined(r); if (r.status !== 'pending' && j >= start && j <= end) gain[idx[key(j)]]++;
    if (r.unsubscribed && r.unsubscribed >= start && r.unsubscribed <= end) lost[idx[key(r.unsubscribed)]]++;
  }
  // people on the list at the end of each bucket
  const ends = keys.map((k, i) => (i === keys.length - 1 ? end : (monthly ? new Date(keys[i + 1] + '-01T00:00:00+05:30').getTime() : new Date(keys[i + 1] + 'T00:00:00+05:30').getTime()) - 1));
  for (const r of subs) { if (r.status === 'pending') continue; const j = joined(r); for (let i = 0; i < ends.length; i++) if (j <= ends[i] && !(r.unsubscribed && r.unsubscribed <= ends[i])) total[i]++; }
  return { keys, gain, lost, total, monthly };
}
function rates(list) {
  const n = list.length, c = (f) => list.filter(f).length;
  const delivered = c((m) => ['delivered'].includes(m.status) || m.opened || m.clicked), bounced = c((m) => m.status === 'bounced'), complained = c((m) => m.status === 'complained'), failed = c((m) => m.status === 'failed');
  const opened = c((m) => m.opened || m.clicked), clicked = c((m) => m.clicked), base = Math.max(1, delivered);
  const pct = (a, b) => (b ? Math.round(1000 * a / b) / 10 : null);
  return { sent: n, delivered, bounced, complained, failed, opened, clicked, deliveredRate: pct(delivered, n - c((m) => m.status === 'sent' && !m.opened)), openRate: delivered ? pct(opened, base) : null, clickRate: delivered ? pct(clicked, base) : null, clickToOpen: opened ? pct(clicked, opened) : null, bounceRate: pct(bounced, n), complaintRate: pct(complained, n) };
}
function overview(L, now, days) {
  now = now || Date.now(); days = [30, 90, 365].includes(Number(days)) ? Number(days) : 30;
  const { subs, mail, sup } = L, eg = engagementMap(mail);
  const active = subs.filter((r) => r.status === 'subscribed'), since = (t, d) => t > now - d * D;
  const startToday = new Date(dayKey(now) + 'T00:00:00+05:30').getTime();
  const n30 = active.filter((r) => since(joined(r), 30)).length + subs.filter((r) => r.status === 'unsubscribed' && since(joined(r), 30)).length;
  const p30 = subs.filter((r) => r.status !== 'pending' && joined(r) <= now - 30 * D && joined(r) > now - 60 * D).length;
  const u30 = subs.filter((r) => r.unsubscribed && since(r.unsubscribed, 30)).length;
  const startCount = subs.filter((r) => r.status !== 'pending' && joined(r) <= now - 30 * D && !(r.unsubscribed && r.unsubscribed <= now - 30 * D)).length;
  const news90 = mail.filter((m) => m.kind === 'newsletter' && since(m.at, 90)), all30 = mail.filter((m) => since(m.at, 30));
  const tiers = { engaged: 0, quiet: 0, new: 0, nodata: 0 };
  const rowsActive = active.map((r) => row(r, eg.get(lc(r.email)), sup, now)); rowsActive.forEach((x) => { tiers[x.tier] = (tiers[x.tier] || 0) + 1; });
  const tags = {}; for (const r of active) for (const t of tagsOf(r)) tags[t] = (tags[t] || 0) + 1;
  const pages = {}; for (const r of active) if (since(joined(r), 90) && r.page) pages[r.page] = (pages[r.page] || 0) + 1;
  const latest = subs.slice().sort((a, b) => joined(b) - joined(a)).filter((r) => r.status !== 'pending').slice(0, 12).map((r) => row(r, eg.get(lc(r.email)), sup, now));
  const gone = subs.filter((r) => r.unsubscribed).sort((a, b) => b.unsubscribed - a.unsubscribed).slice(0, 5).map((r) => row(r, eg.get(lc(r.email)), sup, now));
  return {
    at: now, days,
    kpi: { active: active.length, unsubscribed: subs.filter((r) => r.status === 'unsubscribed').length, pending: subs.filter((r) => r.status === 'pending').length, ever: subs.length,
      today: active.filter((r) => joined(r) >= startToday).length, week: active.filter((r) => since(joined(r), 7)).length, month: n30, prevMonth: p30, unsub30: u30,
      net30: n30 - u30, churn30: startCount ? Math.round(1000 * u30 / startCount) / 10 : null, blockedActive: active.filter((r) => sup[lc(r.email)]).length },
    news: rates(news90), all: rates(all30),
    series: series(subs, now, days), tiers, tags: Object.entries(tags).map(([tag, n]) => ({ tag, n })).sort((a, b) => b.n - a.n),
    sources: { month: desk.sources(L.rows, now, 30).map((s) => ({ ...s, label: label(s.via) })), all: desk.sources(L.rows, now, 0).map((s) => ({ ...s, label: label(s.via) })) },
    pages: Object.entries(pages).map(([page, n]) => ({ page, n })).sort((a, b) => b.n - a.n).slice(0, 8),
    latest, gone, webhook: !!process.env.RESEND_WEBHOOK_SECRET,
  };
}

/* ---------- people ---------- */
const SORTS = { new: (a, b) => b.joined - a.joined, old: (a, b) => a.joined - b.joined, engaged: (a, b) => (b.score ?? -1) - (a.score ?? -1) || b.lastOpen - a.lastOpen, name: (a, b) => (a.name || a.email).localeCompare(b.name || b.email), active: (a, b) => Math.max(b.lastOpen, b.lastSent) - Math.max(a.lastOpen, a.lastSent) };
function people(L, q, now) {
  now = now || Date.now(); q = q || {};
  const eg = engagementMap(L.mail), text = lc(q.q).slice(0, 80), st = String(q.status || 'subscribed'), tier = String(q.tier || 'all'), tag = cleanTag(q.tag || ''), via = String(q.via || 'all');
  const from = q.from ? Date.parse(q.from + 'T00:00:00+05:30') : 0, to = q.to ? Date.parse(q.to + 'T23:59:59+05:30') : Infinity;
  let list = L.subs.map((r) => row(r, eg.get(lc(r.email)), L.sup, now)).filter((r) => {
    if (st === 'blocked') { if (!r.blocked) return false; } else if (st !== 'all' && r.status !== st) return false;
    if (tier !== 'all' && r.tier !== tier) return false;
    if (tag && !r.tags.includes(tag)) return false;
    if (via !== 'all' && (r.via || (r.source === 'import' ? 'import' : '')) !== (via === 'unknown' ? '' : via)) return false;
    if (r.joined < from || r.joined > to) return false;
    if (text && !(r.email + ' ' + r.name + ' ' + r.tags.join(' ') + ' ' + r.page).toLowerCase().includes(text)) return false;
    return true;
  });
  list.sort(SORTS[q.sort] || SORTS.new);
  const off = Math.max(0, Number(q.offset) || 0), lim = Math.min(500, Number(q.limit) || 100);
  const allTags = {}; for (const r of L.subs) for (const t of tagsOf(r)) allTags[t] = (allTags[t] || 0) + 1;
  return { total: list.length, items: list.slice(off, off + lim), tags: Object.keys(allTags).sort(), ids: q.allIds === '1' ? list.map((r) => r.id).slice(0, 2000) : undefined };
}

/* ---------- one person: profile and timeline ---------- */
function person(L, id, campList, now) {
  now = now || Date.now();
  const r = L.subs.find((x) => x.id === id); if (!r) return null;
  const e = lc(r.email), eg = engagementMap(L.mail).get(e), mine = L.mail.filter((m) => String(m.to || '').toLowerCase().split(/[,\s]+/).includes(e)).sort((a, b) => b.at - a.at);
  const cmap = new Map(campList.map((c) => ['camp:' + c.id, c]));
  const tl = [];
  tl.push({ at: joined(r), k: 'join', t: r.via === 'import' || r.source === 'import' ? 'Added by import' : 'Subscribed', d: [label(r.via, r.source), r.page].filter(Boolean).join(' · ') });
  for (const m of mine) {
    const c = cmap.get(m.ref), evs = (m.events || []).filter((x) => x.type !== 'sent');
    tl.push({ at: m.at, k: 'mail', t: (m.kind === 'newsletter' ? 'Newsletter: ' : m.kind === 'welcome' ? 'Welcome email: ' : 'Email: ') + (m.subject || (c && c.subject) || ''), d: m.status, opened: !!m.opened, clicked: !!m.clicked, ev: evs.map((x) => ({ type: x.type, at: x.at, detail: x.detail || '' })) });
  }
  if (r.unsubscribed) tl.push({ at: r.unsubscribed, k: 'unsub', t: r.unsubBy ? 'Unsubscribed by ' + r.unsubBy : 'Unsubscribed', d: r.unsubBy ? '' : 'Used the link in an email' });
  const blk = L.sup[e]; if (blk) tl.push({ at: blk.at, k: 'block', t: 'Blocked from email', d: blk.reason === 'complained' ? 'Reported an email as spam' : blk.reason === 'bounced' ? 'The address bounced' : 'Blocked by hand' });
  for (const h of r.history || []) tl.push({ at: h.at, k: 'note', t: h.t, d: h.by ? 'by ' + h.by : '' });
  tl.sort((a, b) => b.at - a.at);
  const briefs = L.rows.filter((x) => x.type === 'brief' && lc(x.email) === e).map((x) => ({ id: x.id, created: x.created, service: x.service || '', status: x.status }));
  return { ...row(r, eg, L.sup, now), note: r.note || '', fields: r.fields || {}, consent: r.consent || { how: r.via === 'import' ? 'import' : 'form', at: joined(r), page: r.page || '', via: r.via || '' }, unsubBy: r.unsubBy || '', briefs, timeline: tl.slice(0, 120), mails: mine.length };
}

/* ---------- changes ---------- */
const note = (r, t, by) => [...(r.history || []), { at: Date.now(), t, by: by || '' }].slice(-40);
async function setTags(ids, add, remove, by) {
  add = [...new Set((add || []).map(cleanTag).filter(Boolean))].slice(0, 6); remove = new Set((remove || []).map(cleanTag).filter(Boolean));
  if (!add.length && !remove.size) throw new Error('Name a tag first.');
  let n = 0;
  for (const id of ids) {
    const r = await store.get(id); if (!r || r.type !== 'subscriber') continue;
    const cur = tagsOf(r), next = [...new Set(cur.filter((t) => !remove.has(t)).concat(add))].slice(0, 12);
    if (next.join() === cur.join()) continue;
    await store.update(id, { tags: next }); n++;
  }
  return n;
}
async function unsubscribe(ids, by) {
  let n = 0;
  for (const id of ids) { const r = await store.get(id); if (!r || r.type !== 'subscriber' || r.status === 'unsubscribed') continue; await store.update(id, { status: 'unsubscribed', unsubscribed: Date.now(), unsubBy: 'admin', history: note(r, 'Unsubscribed from the admin', by) }); n++; }
  return n;
}
// only an unsubscribe the admin made can be taken back; a person's own choice stands
async function resubscribe(ids, by) {
  let n = 0, refused = 0;
  for (const id of ids) {
    const r = await store.get(id); if (!r || r.type !== 'subscriber' || r.status !== 'unsubscribed') continue;
    if (r.unsubBy !== 'admin') { refused++; continue; }
    await store.update(id, { status: 'subscribed', unsubscribed: 0, unsubBy: '', history: note(r, 'Unsubscribe undone from the admin', by) }); n++;
  }
  return { n, refused };
}
async function saveNote(id, text, by) { const r = await store.get(id); if (!r || r.type !== 'subscriber') throw new Error('Not found.'); await store.update(id, { note: String(text || '').slice(0, 2000) }); return true; }

/* ---------- import ---------- */
function parseCsv(text) {
  const out = [], s = String(text || '').replace(/^﻿/, '').slice(0, 400000); let row = [], cell = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; continue; }
    if (c === '"') q = true; else if (c === ',' || c === ';' || c === '\t') { row.push(cell); cell = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(cell); out.push(row); row = []; cell = ''; } else cell += c;
  }
  if (cell || row.length) { row.push(cell); out.push(row); }
  return out.map((r) => r.map((x) => x.trim())).filter((r) => r.some(Boolean));
}
// rows: email, then optional name and tags (tags split by | or space). A header row is found by the word "email".
async function importList(text, opt, by) {
  opt = opt || {};
  if (opt.consent !== true) throw new Error('Confirm that everyone on the list agreed to get your emails.');
  const rows = parseCsv(text); if (!rows.length) throw new Error('Paste or choose a file with at least one email address.');
  let ci = { email: 0, name: 1, tags: 2 }, start = 0;
  const head = rows[0].map(lc), ei = head.findIndex((h) => /e-?mail/.test(h));
  if (ei > -1) { ci = { email: ei, name: head.findIndex((h) => /^(first )?name|full name/.test(h)), tags: head.findIndex((h) => /tag|group|label/.test(h)) }; start = 1; }
  const extra = cleanTag(opt.tag || ''), how = String(opt.note || '').slice(0, 200), res = { added: 0, updated: 0, skippedUnsub: 0, skippedBlocked: 0, invalid: 0, dupes: 0, total: 0 };
  const sup = await maillog.suppressed(), seen = new Set();
  for (const r of rows.slice(start, start + 2000)) {
    res.total++;
    const email = lc(r[ci.email]); if (!okEmail(email)) { res.invalid++; continue; }
    if (seen.has(email)) { res.dupes++; continue; } seen.add(email);
    let name = ci.name > -1 ? String(r[ci.name] || '').slice(0, 60) : ''; if (/https?:|www\.|@|[<>]/i.test(name)) name = '';
    const tags = [...new Set((ci.tags > -1 ? String(r[ci.tags] || '').split(/[|\s]+/) : []).concat(extra ? [extra] : []).map(cleanTag).filter(Boolean))].slice(0, 12);
    if (sup[email]) { res.skippedBlocked++; continue; }
    const cur = await store.byEmail(email);
    if (cur && cur.status === 'unsubscribed') { res.skippedUnsub++; continue; }   // they said no; an import never overrides that
    if (cur) { const next = [...new Set(tagsOf(cur).concat(tags))].slice(0, 12); await store.update(cur.id, { tags: next, ...(name && !cur.name ? { name } : {}) }); res.updated++; continue; }
    await store.subscriber(email, { status: 'subscribed', confirmed: Date.now(), via: 'import', source: 'import', ...(name ? { name } : {}), tags, consent: { how: 'import', note: how, by: by || '', at: Date.now() } });
    res.added++;
  }
  return res;
}

/* ---------- export ---------- */
const HEAD = ['Email', 'Name', 'Status', 'Joined (IST)', 'Source', 'Page', 'Tags', 'Emails received', 'Opened', 'Clicked', 'Engagement', 'Last opened (IST)', 'Unsubscribed (IST)', 'Blocked'];
function csv(list) {
  const cell = (v) => { let s = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const rowsOut = list.map((r) => [r.email, r.name, r.status, X.ist(r.joined), r.viaLabel, r.page, r.tags.join(' | '), r.sent, r.opened, r.clicked, r.score == null ? '' : r.score, r.lastOpen ? X.ist(r.lastOpen) : '', r.unsubscribed ? X.ist(r.unsubscribed) : '', r.blocked]);
  return '﻿' + [HEAD, ...rowsOut].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}

/* ---------- campaign reports ---------- */
function campaigns(L, campList, now) {
  now = now || Date.now();
  const byRef = {}; for (const m of L.mail) if (m.ref && m.ref.startsWith('camp:')) (byRef[m.ref] = byRef[m.ref] || []).push(m);
  return campList.map((c) => {
    const list = byRef['camp:' + c.id] || [], r = rates(list), sentAt = c.sentAt || c.created, who = new Set(list.map((m) => lc(m.to)));
    const unsub = L.subs.filter((s) => s.unsubscribed && s.unsubscribed >= sentAt && s.unsubscribed <= sentAt + 7 * D && who.has(lc(s.email))).length;
    return { id: c.id, subject: c.subject, created: c.created, sentAt, status: c.status, total: c.total, sentCount: c.sent, failed: (c.failed || []).length, remaining: (c.queue || []).length, skipped: c.skipped || 0, aud: c.aud || '', ...r, unsub, unsubRate: r.sent ? Math.round(1000 * unsub / r.sent) / 10 : null };
  });
}
function campaign(L, campList, id, now) {
  const c = campList.find((x) => x.id === id); if (!c) return null;
  const rep = campaigns(L, [c], now)[0], subsBy = new Map(L.subs.map((s) => [lc(s.email), s]));
  const people = L.mail.filter((m) => m.ref === 'camp:' + id).sort((a, b) => Number(!!b.clicked) - Number(!!a.clicked) || Number(!!b.opened) - Number(!!a.opened)).map((m) => { const s = subsBy.get(lc(m.to)); return { email: m.to, name: s ? s.name || '' : '', id: s ? s.id : '', status: m.status, opened: !!m.opened, clicked: !!m.clicked, at: m.at, unsub: !!(s && s.unsubscribed && s.unsubscribed >= rep.sentAt && s.unsubscribed <= rep.sentAt + 7 * D) }; });
  // opens over the first 72 hours, hour by hour
  const curve = Array(72).fill(0); for (const m of L.mail) if (m.ref === 'camp:' + id) { const o = (m.events || []).find((e) => e.type === 'opened' || e.type === 'clicked'); if (o) { const h = Math.floor((o.at - rep.sentAt) / H); if (h >= 0 && h < 72) curve[h]++; } }
  return { ...rep, preheader: c.preheader || '', body: String(c.body || '').slice(0, 4000), failedList: (c.failed || []).slice(0, 50), people, curve };
}

/* ---------- list health ---------- */
// thresholds follow the bulk-sender rules Gmail and Yahoo published for 2024 (spam reports under 0.3%, ideally under 0.1%) and the usual 2% bounce line
function health(L, campList, now) {
  now = now || Date.now();
  const o = overview(L, now, 30), r30 = o.all, n90 = o.news, out = [], add = (level, title, detail, tab) => out.push({ level, title, detail, tab: tab || '' });
  if (!o.webhook) add('bad', 'Delivery tracking is off', 'Add the Resend webhook (Mail log shows how). Without it nothing knows about bounces, spam reports, opens or clicks.', 'mail');
  else add('ok', 'Delivery tracking is on', 'Resend reports every delivery, bounce and spam report back here.');
  if (r30.sent) {
    const b = r30.bounceRate || 0, c = r30.complaintRate || 0;
    add(b >= 5 ? 'bad' : b >= 2 ? 'warn' : 'ok', `Bounce rate ${b}% (30 days)`, b >= 2 ? 'Above 2% hurts your sending name. Remove addresses that bounce and never import old lists.' : 'Under 2%: healthy.', 'mail');
    add(c >= 0.3 ? 'bad' : c >= 0.1 ? 'warn' : 'ok', `Spam reports ${c}% (30 days)`, c >= 0.1 ? 'Gmail and Yahoo want this under 0.1% and block senders at 0.3%. Send only what people signed up for, and keep the unsubscribe link easy to find.' : 'Under 0.1%: inside the Gmail and Yahoo rules.', 'mail');
    if (r30.deliveredRate != null) add(r30.deliveredRate < 95 ? 'warn' : 'ok', `Delivered ${r30.deliveredRate}% (30 days)`, r30.deliveredRate < 95 ? 'Some emails are not arriving. Open Mail log, Problems, to see why.' : 'Almost everything arrives.', 'mail');
  } else add('info', 'No emails in the last 30 days', 'Rates show once mail goes out.');
  add('ok', 'One-click unsubscribe in every email', 'Each newsletter carries a List-Unsubscribe header and a visible link, as Gmail and Yahoo require.');
  const last = campList.find((c) => c.status === 'sent'), since = last ? Math.floor((now - (last.sentAt || last.created)) / D) : null;
  if (o.kpi.active) add(since == null ? 'warn' : since > 35 ? 'warn' : 'ok', since == null ? 'No newsletter sent yet' : `Last newsletter ${since} days ago`, since == null || since > 35 ? 'The sign-up forms promise about one email a month. A long gap makes people forget they subscribed, which raises spam reports.' : 'On track with the "about one email a month" promise.', 'news');
  const quietShare = o.kpi.active ? Math.round(100 * o.tiers.quiet / o.kpi.active) : 0;
  if (o.webhook && n90.sent) add(quietShare > 50 ? 'warn' : 'ok', `${o.tiers.quiet} quiet subscriber${o.tiers.quiet === 1 ? '' : 's'} (${quietShare}%)`, quietShare > 50 ? 'More than half opened nothing in 90 days. Send them a short "still want these?" email, then unsubscribe those who stay quiet.' : 'Most of the list is opening.', 'aud:quiet');
  if (o.kpi.blockedActive) add('warn', `${o.kpi.blockedActive} subscriber${o.kpi.blockedActive === 1 ? ' is' : 's are'} blocked`, 'They bounced or reported spam, so newsletters skip them. Unsubscribe them to keep the numbers honest.', 'aud:blocked');
  if (o.kpi.active > 100) add('warn', `${o.kpi.active} subscribers, Resend free plan sends 100 a day`, 'A newsletter to everyone will stop at 100. Send in daily parts with "Finish", or move to a paid Resend plan.', 'news');
  const noSource = o.kpi.active ? L.subs.filter((r) => r.status === 'subscribed' && !r.via && r.source !== 'import').length : 0;
  add(noSource ? 'info' : 'ok', noSource ? `${noSource} sign-up${noSource === 1 ? '' : 's'} without a recorded source` : 'Every sign-up has a recorded source', noSource ? 'These joined before sources were tracked. Each still has its sign-up time, which is the consent record.' : 'You can show where and when each person agreed (GDPR Art. 7, DPDP Act s. 6).');
  const score = Math.max(0, 100 - out.reduce((s, x) => s + (x.level === 'bad' ? 25 : x.level === 'warn' ? 10 : 0), 0));
  return { score, checks: out, rates30: r30, news90: n90 };
}

/* ---------- digest lines (morning email) ---------- */
function digestLines(subs, now) {
  now = now || Date.now();
  const day = subs.filter((r) => r.status !== 'pending' && joined(r) > now - D), lost = subs.filter((r) => r.unsubscribed && r.unsubscribed > now - D);
  const active = subs.filter((r) => r.status === 'subscribed').length, week = subs.filter((r) => r.status !== 'pending' && joined(r) > now - 7 * D).length;
  return { newDay: day.length, lostDay: lost.length, active, week, names: day.slice(0, 5).map((r) => r.name || r.email) };
}

module.exports = { load, camps, overview, people, person, setTags, unsubscribe, resubscribe, saveNote, importList, parseCsv, csv, campaigns, campaign, health, digestLines, cleanTag, engagementMap, label };
