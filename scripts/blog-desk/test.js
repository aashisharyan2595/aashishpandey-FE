#!/usr/bin/env node
// Dry run of the blog desk tools with a fake network and no keys. The images are drawn for real (Playwright). Run: node scripts/blog-desk/test.js
// It writes into a throwaway copy of content/blog and assets/blog (restored afterwards) so nothing real is touched.
const { execFileSync } = require('child_process'), fs = require('fs'), path = require('path'), assert = require('assert'), os = require('os');
const ROOT = path.join(__dirname, '..', '..'), DESK = path.join(__dirname, 'desk.js'), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'desk-'));
const run = (...a) => execFileSync('node', ['-r', path.join(__dirname, 'test', 'mockfetch.js'), DESK, ...a], { cwd: ROOT, env: { ...process.env, NODE_PATH: process.env.NODE_PATH || '' }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const keep = {}; ['content/blog', 'assets/blog'].forEach((d) => { keep[d] = fs.existsSync(path.join(ROOT, d)); });
const { PAGES } = require('./test/mockfetch.js'), urls = Object.keys(PAGES);
(async () => { try {
  const feed = JSON.parse(run('feeds')); assert(feed.length > 10, 'feeds give items'); assert.strictEqual(JSON.parse(run('feeds')).length, 0, 'seen items are not shown twice');
  const dir = path.join(TMP, 'src'); const out = run('fetch', dir, ...urls, 'https://paywalled.example.com/x'); assert(/unreadable/.test(out) && /lean=L/.test(out) && /lean=R/.test(out) && /PRIMARY/.test(out), out);
  const p = run('pick', dir, 'news'); assert(/enough: YES/.test(p), p);
  const bad = { title: 'Acme layoffs: what we know about the 12% cut', slug: 'acme-layoffs-test', excerpt: 'Acme will cut about 12% of its staff. Here is what is confirmed, what is not, and what to watch next.', seo_title: 'Acme layoffs: what we know so far', seo_description: 'Acme is cutting about 12% of staff. What is confirmed, what is not, and what it means for workers and customers, with sources.', category: 'Industry', tags: ['layoffs', 'acme'], about: ['Acme'], product: '', pros: [], cons: [], image_headline: 'Acme layoffs: what we know', image_kicker: 'Confirmed vs unknown', image_alt: 'Illustration of a news timeline',
    tldr: 'Acme is cutting about 12% of its workforce, roughly 3,000 jobs, according to Reuters and NPR.',
    body_markdown: `## What happened at Acme?\n\nAcme says it will cut about 12% of staff, [Reuters reported](${urls[4]}). That’s roughly 3,000 people — according to [NPR](${urls[1]}). Let us delve into the story and a [made-up link](https://evil.example.com/x).\n\nIt isn't clear yet which teams are hit. [Fox News](${urls[2]}) says sales is the largest group. The [Guardian](${urls[0]}) puts the focus on contractors, and [Mint](${urls[5]}) asks what it means for Bengaluru. The company said it cut "9999 positions" overall.\n\n## My take\n\nI'd wait for the filing before drawing conclusions. Layoff headlines move fast, and the details move slower than the headlines.`,
    faq: [{ q: 'How many jobs is Acme cutting?', a: 'About 12% of staff, or roughly 3,000 people, according to Reuters and NPR. Acme has not published a full breakdown by team or country yet.' }, { q: 'Why is Acme cutting jobs?', a: 'Acme calls it a restructuring in its own note. Other outlets add context, but the company has not given a detailed reason beyond that.' }, { q: 'Does this affect India?', a: 'Mint asks that question for Bengaluru, but there is no confirmed number for India yet.' }],
    claims: [{ claim: 'Acme will cut about 12% of staff', source_url: urls[4] }, { claim: 'roughly 3000 people', source_url: urls[1] }, { claim: 'It cut 8888 jobs', source_url: urls[1] }] };
  const draft = path.join(TMP, 'draft.json'); fs.writeFileSync(draft, JSON.stringify(bad));
  const c1 = run('check', draft, dir); assert(/FIX NEEDED/.test(c1) && /9999/.test(c1) && /8888/.test(c1) && /avoid "delve"/.test(c1), c1);
  const good = { ...bad, body_markdown: bad.body_markdown.replace(' Let us delve into the story and a [made-up link](https://evil.example.com/x).', '').replace(' The company said it cut "9999 positions" overall.', '').replace(' — according', ', according'), claims: bad.claims.slice(0, 2) };
  fs.writeFileSync(draft, JSON.stringify(good)); const c2 = run('check', draft, dir); assert(/unsupported numbers\/quotes: none/.test(c2), c2);
  const email = path.join(TMP, 'email.html'), at = new Date(Date.now() + 864e5).toISOString();
  const b = JSON.parse(run('build', draft, dir, '--kind', 'news', '--at', at, '--email', email)); console.log('built', b.file, '| goes live', b.goesLive);
  assert(fs.existsSync(path.join(ROOT, b.file)) && fs.existsSync(path.join(ROOT, 'assets/blog/acme-layoffs-test-cover.jpg')));
  // the site engine sees it: scheduled now, live later; schema on the page
  const posts = require(path.join(ROOT, 'api/_site/posts')), render = require(path.join(ROOT, 'api/_site/render'));
  const fp = require(path.join(ROOT, 'api/_site/fileposts')); assert(fp.bySlug('post', 'acme-layoffs-test'), 'file post is read');
  let html = '', res = { setHeader() {}, status(c) { this.c = c; return this; }, send(x) { html = x; } };
  await render.handle({ query: { a: 'site', p: 'post', slug: 'acme-layoffs-test' }, method: 'GET', headers: {} }, res); assert.strictEqual(res.c, 404, 'not live before its time');
  const f = JSON.parse(fs.readFileSync(path.join(ROOT, b.file), 'utf8')); f.publishAt = Date.now() - 1000; fs.writeFileSync(path.join(ROOT, b.file), JSON.stringify(f));
  Object.keys(require.cache).filter((k) => /api\/_site\//.test(k)).forEach((k) => delete require.cache[k]);
  const render2 = require(path.join(ROOT, 'api/_site/render')); await render2.handle({ query: { a: 'site', p: 'post', slug: 'acme-layoffs-test' }, method: 'GET', headers: {} }, res); assert.strictEqual(res.c, 200);
  for (const t of ['NewsArticle', 'FAQPage', '"citation"', 'og:image', 'Quick answer', 'width="1200"']) assert(html.includes(t), 'page has ' + t);
  const rss = []; res.send = (x) => rss.push(x); await render2.handle({ query: { a: 'site', p: 'rss' }, method: 'GET', headers: {} }, res); assert(/acme-layoffs-test/.test(rss[0]), 'in the RSS feed');
  assert(/stop acme-layoffs-test/.test(fs.readFileSync(email, 'utf8')));
  console.log('title tag:', /<title>(.*?)<\/title>/.exec(html)[1]); console.log('all checks passed');
  if (process.argv.includes('--keep')) { fs.mkdirSync('/tmp/blog-test', { recursive: true }); fs.copyFileSync(email, '/tmp/blog-test/email.html'); fs.writeFileSync('/tmp/blog-test/post.html', html); fs.copyFileSync(path.join(ROOT, 'assets/blog/acme-layoffs-test-cover.jpg'), '/tmp/blog-test/cover.jpg'); }
} finally {
  fs.rmSync(path.join(ROOT, 'assets/blog/acme-layoffs-test-cover.jpg'), { force: true });
  fs.rmSync(path.join(ROOT, 'content/blog/acme-layoffs-test.json'), { force: true }); fs.rmSync(path.join(ROOT, 'content/blog/state.json'), { force: true });
  if (!keep['assets/blog']) fs.rmSync(path.join(ROOT, 'assets/blog'), { recursive: true, force: true }); if (!keep['content/blog']) fs.rmSync(path.join(ROOT, 'content/blog'), { recursive: true, force: true });
  fs.rmSync(TMP, { recursive: true, force: true });
}
})().catch((e) => { console.error(e); process.exit(1); });
