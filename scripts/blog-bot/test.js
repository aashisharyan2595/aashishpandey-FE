#!/usr/bin/env node
// Dry run of the whole blog desk with no network and no API keys: an in-memory Redis, fake feeds and pages, a fake writer and a fake second-model check.
// The images are drawn for real (Playwright). Run:  node scripts/blog-bot/test.js   (add --keep to write the images and email to /tmp/blog-test)
const path = require('path'), fs = require('fs'), assert = require('assert');
const ROOT = path.join(__dirname, '..', '..');
const store = new Map(), zs = new Map(), sets = new Map();
const redis = async (...c) => {
  const [cmd, k, ...a] = c;
  switch (cmd) {
    case 'GET': return store.has(k) ? store.get(k) : null; case 'SET': store.set(k, a[0]); return 'OK'; case 'DEL': return store.delete(k) ? 1 : 0;
    case 'MGET': return [k, ...a].map((x) => (store.has(x) ? store.get(x) : null)); case 'INCR': store.set(k, String((Number(store.get(k)) || 0) + 1)); return Number(store.get(k));
    case 'INCRBYFLOAT': store.set(k, String((Number(store.get(k)) || 0) + Number(a[0]))); return store.get(k); case 'EXPIRE': return 1;
    case 'ZADD': { const z = zs.get(k) || new Map(); z.set(a[1], Number(a[0])); zs.set(k, z); return 1; } case 'ZREM': (zs.get(k) || new Map()).delete(a[0]); return 1;
    case 'ZREVRANGE': return [...(zs.get(k) || new Map()).entries()].sort((x, y) => y[1] - x[1]).map((x) => x[0]).slice(Number(a[0]), Number(a[1]) + 1);
    case 'LPUSH': { const l = JSON.parse(store.get(k) || '[]'); l.unshift(a[0]); store.set(k, JSON.stringify(l)); return l.length; } case 'LTRIM': return 'OK';
    case 'LRANGE': return JSON.parse(store.get(k) || '[]');
    case 'SADD': { const s = sets.get(k) || new Set(); let n = 0; a.forEach((x) => { if (!s.has(x)) { s.add(x); n++; } }); sets.set(k, s); return n; } case 'SMEMBERS': return [...(sets.get(k) || [])];
    default: throw new Error('test redis: ' + cmd);
  }
};
const libPath = require.resolve(ROOT + '/api/_lib'); require(libPath); require.cache[libPath].exports.redis = redis;
process.env.ADMIN_EMAIL = 'owner@example.com'; process.env.RESEND_API_KEY = 'x'; process.env.ADMIN_SECRET = 'test';

const bot = require('./run'), llm = require('./llm'), mail = require(ROOT + '/api/_mail'), posts = require(ROOT + '/api/_site/posts'), md = require(ROOT + '/api/_site/md');
const sentLog = []; mail.resend = async (p, m, body) => { sentLog.push(body); return { id: 'em_' + sentLog.length }; };

// fake web
const PAGES = { 'https://www.theguardian.com/technology/2026/nov/10/acme-layoffs': 'The Guardian', 'https://www.npr.org/2026/11/10/acme-cuts-jobs': 'NPR', 'https://www.foxnews.com/tech/acme-job-cuts': 'Fox', 'https://nypost.com/2026/11/10/acme-layoffs/': 'NYP',
  'https://www.reuters.com/technology/acme-to-cut-jobs-2026-11-10/': 'Reuters', 'https://www.livemint.com/technology/acme-layoffs-india': 'Mint', 'https://acme.example.com/blog/restructuring': 'Primary' };
const filler = (tag) => Array.from({ length: 140 }, (_, i) => `${tag} reports sentence ${i} about the restructuring plan, headcount ${100 + i * 3} and region ${i % 7} with detail number ${tag.length * i}.`).join(' ');
const feedFor = (u) => { const h = Buffer.from(u).toString('hex').slice(-10); return `<?xml version="1.0"?><rss><channel>${[['Acme to cut 12% of staff in restructuring', 'a'], ['Best phone deals this weekend', 'b']].map(([t, l]) => `<item><title>${t}</title><link>https://news.example.com/${h}/${l}</link><pubDate>${new Date().toUTCString()}</pubDate><description>desc</description></item>`).join('')}</channel></rss>`; };
global.fetch = async (url) => {
  const u = String(url);
  if (PAGES[u]) return { ok: true, url: u, headers: { get: () => 'text/html' }, text: async () => `<html><title>${PAGES[u]} - Acme layoffs | ${PAGES[u]}</title><body><p>${filler(PAGES[u])}</p></body></html>` };
  if (require('./sources').FEEDS.some((f) => f.url === u)) return { ok: true, text: async () => feedFor(u) };
  if (/indexnow/.test(u)) return { status: 200 };
  return { ok: false, status: 404, headers: { get: () => '' }, text: async () => '' };
};
let writes = 0;
const sourceUrls = Object.keys(PAGES);
llm.research = async () => sourceUrls.map((url) => ({ url, title: '' }));
llm.json = async ({ schema, user }) => {
  if (schema.required.includes('ideas')) return { ideas: Array.from({ length: 40 }, (_, i) => ({ title: `Evergreen idea number ${i + 1} about AI tool ${i}`, kind: i % 2 ? 'review' : 'explainer', angle: 'practical' })) };
  if (schema.required.includes('items')) { const lines = user.split('\n'); return { items: lines.map((l, i) => ({ n: i + 1, score: /deals/.test(l) ? 2 : 10, topic_key: /deals/.test(l) ? 'phone-deals' : 'acme-layoffs', kind: 'news', why: 'x' })) }; }
  writes++;
  const dirty = writes === 1 || writes === 3;   // first draft has a banned phrase, so the rewrite path runs; also run it for the breaking post
  const body = `## What happened at Acme?\n\nAcme says it will cut about 12% of staff, [Reuters reported](${sourceUrls[4]}). That's roughly 3,000 people, according to [NPR](${sourceUrls[1]}). ${dirty ? 'Let us delve into the story. ' : ''}The company called it a restructuring in its [own note](${sourceUrls[6]}).\n\nIt isn't clear yet which teams are hit. [Fox News](${sourceUrls[2]}) says sales is the largest group. The [Guardian](${sourceUrls[0]}) puts the focus on contractors, and [Mint](${sourceUrls[5]}) asks what it means for Bengaluru.\n\n## Pros\n\nA leaner plan may help margins.\n\n## What I'd watch\n\nI'd watch the next earnings call. Short note. Another longer sentence follows here because variety matters for real writing and readers alike.\n\n## My take\n\nI'd wait for the filing before drawing conclusions. Layoff headlines move fast, and the details move slower than the headlines.`;
  return { title: 'Acme layoffs: what we know about the 12% cut', slug: 'acme-layoffs-what-we-know', excerpt: 'Acme will cut about 12% of its staff. Here is what is confirmed, what is not, and what to watch next.', seo_title: 'Acme layoffs: what we know so far', seo_description: 'Acme is cutting about 12% of staff. What is confirmed, what is not, and what it means for workers and customers, with sources.',
    category: 'Industry', tags: ['layoffs', 'acme', 'tech jobs'], about: ['Acme'], tldr: 'Acme is cutting about 12% of its workforce, roughly 3,000 jobs, according to Reuters and NPR.', body_markdown: body, product: 'Acme', pros: ['Leaner cost base', 'Clear plan', 'Notice given'], cons: ['Jobs lost', 'Morale risk', 'Details thin'],
    faq: [{ q: 'How many jobs is Acme cutting?', a: 'About 12% of staff, or roughly 3,000 people, according to Reuters and NPR. Acme has not published a full breakdown by team or country yet.' }, { q: 'Why is Acme cutting jobs?', a: 'Acme calls it a restructuring in its own note. Other outlets add context, but the company has not given a detailed reason beyond that.' }, { q: 'Does this affect India?', a: 'Mint asks that question for Bengaluru, but there is no confirmed number for India yet.' }],
    claims: [{ claim: 'Acme will cut about 12% of staff', source_url: sourceUrls[4] }, { claim: 'roughly 3,000 people', source_url: sourceUrls[1] }], image_headline: 'Acme layoffs: what we know', image_kicker: 'Confirmed vs unknown', image_alt: 'Illustration of a news timeline' };
};
llm.factCheck = async ({ claims }) => ({ by: 'test checker', verdicts: claims.map((c, i) => ({ i: i + 1, status: 'supported', note: 'ok' })), risks: [] });

(async () => {
  // scan: feeds -> score -> backlog -> calendar -> breaking publish
  await bot.scan();
  const live = await posts.live('post'); assert.strictEqual(live.length, 1, 'breaking post should be live now'); const p = live[0];
  assert(p.extra.auto && p.extra.kind === 'breaking' && p.extra.sources.length >= 3, 'extra saved'); assert(!/delve|—/.test(p.body), 'style pass removed banned phrase');
  assert(/Quick answer/.test(p.body) && /## Sources/.test(p.body) && /Frequently asked/.test(p.body), 'answer-first, FAQ and sources present');
  const cal = JSON.parse(store.get('blog:cal')); assert.strictEqual(Object.keys(cal.slots).length, 30, '30-day calendar'); console.log('calendar days:', Object.keys(cal.slots).length);
  assert(sentLog.length === 1 && /Published now/.test(sentLog[0].subject), 'breaking email'); assert(!sentLog[0].scheduled_at, 'breaking email goes straight away');
  // page renders with schema
  const render = require(ROOT + '/api/_site/render'); let out = ''; const res = { setHeader() {}, status(c) { this.c = c; return this; }, send(b) { out = b; } };
  await render.handle({ query: { a: 'site', p: 'post', slug: p.slug }, method: 'GET' }, res); assert.strictEqual(res.c, 200);
  for (const t of ['NewsArticle', 'FAQPage', '"citation"', 'og:image']) assert(out.includes(t), 'page has ' + t); console.log('title tag:', /<title>(.*?)<\/title>/.exec(out)[1]);
  // nightly draft for tomorrow
  await bot.draft();
  const sch = (await posts.all()).filter((x) => x.status === 'published' && x.publishAt > Date.now()); assert.strictEqual(sch.length, 1, 'tomorrow scheduled');
  assert.strictEqual(sch[0].publishAt, bot.atIst(bot.addDays(bot.ymd(Date.now()), 1), 9, 0), 'goes live at 9:00 IST tomorrow');
  const em = sentLog[sentLog.length - 1]; assert(/^Goes live tomorrow/.test(em.subject), em.subject); console.log('email subject:', em.subject, '| send at', em.scheduled_at);
  // desk buttons
  const desk = require(ROOT + '/api/_site/desk'); const tok = /t=([A-Za-z0-9_-]+)/.exec(em.html)[1]; let page = '';
  const call = async (method, d) => { const r = { setHeader() {}, status(c) { this.c = c; return this; }, send(b) { page = b; } }; await desk.handle({ query: { t: tok, do: d }, method }, r); return r.c; };
  assert.strictEqual(await call('GET'), 200); assert(/Stop this post/.test(page));
  await call('POST', 'stop'); assert.strictEqual((await posts.get(sch[0].id)).status, 'draft', 'stop takes it off'); assert(/Schedule again/.test(page));
  await call('POST', 'resume'); assert.strictEqual(posts.stateOf(await posts.get(sch[0].id)), 'scheduled', 'resume schedules again');
  assert.strictEqual(await call('GET', ''), 200); const bad = { setHeader() {}, status(c) { this.c = c; return this; }, send() {} }; await desk.handle({ query: { t: 'x'.repeat(30) }, method: 'GET' }, bad); assert.strictEqual(bad.c, 404);
  await bot.ping(); console.log('all checks passed');
  if (process.argv.includes('--keep')) { fs.mkdirSync('/tmp/blog-test', { recursive: true }); fs.writeFileSync('/tmp/blog-test/post.html', out); fs.writeFileSync('/tmp/blog-test/email.html', em.html); for (const [k, v] of store) if (k.startsWith('media:blob:')) fs.writeFileSync(`/tmp/blog-test/${k.slice(11)}.jpg`, Buffer.from(v, 'base64')); console.log('written to /tmp/blog-test'); }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
