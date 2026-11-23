// The blog desk's feedback loop. Signals, all first-party (the site's own beacons, bots dropped, one count per visitor per 30 minutes), counted for the first 7 days after a post goes live
// and read from the public counts endpoint (/api/config?a=site&p=scores): views (the score), reads (scrolled through the article), and the click rate of the post's card in the blog index.
// Each closed-window post is frozen into content/blog/learn.json with its tags. Topic weights get a small learned nudge; style, length, hook and picture arms get an 80:20 rotation (see next()).
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', '..', 'content', 'blog', 'learn.json');
const DAY = 864e5, WINDOW = 7, K = 3, MIN_N = 4, MIN_VIEWS_AB = 150, SHORT_BELOW = 1250;   // K: prior weight (pulls small samples toward the overall mean); MIN_N: closed posts an arm needs before it can move anything
const read = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { return { posts: [], adj: {}, adjAt: 0 }; } };

// tags are read from the post itself, so nothing extra has to be filled in
const headlineOf = (t) => (/^\d|[$₹€£]\s?\d|\d\s?%|\d[\d,.]*\s?(b|m|k|bn|billion|million|thousand|crore|lakh)\b|\b\d+\s+(ways|tips|things|steps|reasons|questions|tools|mistakes|signs|rules|changes)\b/i.test(t) ? 'number' : /\?\s*$|^(how|why|what|is|does|should|can|will)\b/i.test(t) ? 'question' : 'statement');
const lengthOf = (w) => (w < SHORT_BELOW ? 'short' : 'long');
const HOOKS = ['words', 'number', 'question'], IMAGES = ['drawn', 'photo'], HEADLINES = ['number', 'question', 'statement'], LENGTHS = ['short', 'long'];
const hookOf = (t) => (/\d/.test(t) ? 'number' : /\?/.test(t) ? 'question' : 'words');

function stats(posts, key) {   // mean 7-day views per arm, with the shrunk mean used for decisions
  const all = posts.reduce((a, p) => a + p.views7, 0) / (posts.length || 1), out = {};
  for (const p of posts) { const k = key(p); if (!k) continue; const o = out[k] || (out[k] = { n: 0, sum: 0 }); o.n++; o.sum += p.views7; }
  for (const o of Object.values(out)) { o.mean = +(o.sum / o.n).toFixed(1); o.rel = all ? +(((o.sum + K * all) / (o.n + K)) / all).toFixed(2) : 1; }
  return out;
}

// topic nudge in [-1, +1]: needs MIN_N closed posts; 1.4x the overall mean or more = +1, 0.7x or less = -1. Never below a weight of 0 once added to the base table.
const nudge = (o) => (!o || o.n < MIN_N ? 0 : o.rel >= 1.4 ? 1 : o.rel <= 0.7 ? -1 : 0);

async function learn(force) {
  const L = read(), have = new Set(L.posts.map((p) => p.slug)), now = Date.now();
  const r = await fetch('https://aashishpandey.com/api/config?a=site&p=scores'); if (!r.ok) throw new Error('scores endpoint answered ' + r.status);
  const got = await r.json(), CONTENT = path.dirname(FILE); let added = 0;
  for (const s of got.posts) {
    if (have.has(s.slug) || now < s.publishAt + (WINDOW + 1) * DAY) continue;   // window not closed yet
    let f; try { f = JSON.parse(fs.readFileSync(path.join(CONTENT, s.slug + '.json'), 'utf8')); } catch (e) { continue; }
    const x = f.extra || {}, th = (x.thumb && x.thumb.text) || '';
    L.posts.push({ slug: s.slug, publishAt: s.publishAt, views7: s.views7, reads7: s.reads7 || 0, ctr: s.ix7 ? +(s.clicks7 / s.ix7).toFixed(3) : null, topic: x.topic || 'ai', kind: x.kind || '', headline: headlineOf(f.title), length: lengthOf(f.words || 0), hook: hookOf(th), image: x.photo ? 'photo' : 'drawn', words: f.words || 0 }); added++;
  }
  const style = L.posts.filter((p) => p.kind !== 'breaking');   // breaking posts spike on timing, so they stay out of the style arms
  L.topics = stats(L.posts, (p) => p.topic); L.kinds = stats(L.posts, (p) => p.kind); L.headlines = stats(style, (p) => p.headline); L.lengths = stats(style, (p) => p.length);
  L.hooks = stats(style, (p) => p.hook); L.images = stats(style, (p) => p.image);
  L.ab = got.ab; L.abAt = now;
  const due = force || now - (L.adjAt || 0) >= 7 * DAY;   // weights move at most once a week
  if (due) { L.adj = {}; for (const [t, o] of Object.entries(L.topics)) { const a = nudge(o); if (a) L.adj[t] = a; } L.adjAt = now; }
  L.updated = now; fs.writeFileSync(FILE, JSON.stringify(L, null, 2) + '\n');
  const line = (name, o) => `  ${name.padEnd(10)} n=${String(o.n).padEnd(2)} mean ${String(o.mean).padEnd(6)} vs overall x${o.rel}${o.n < MIN_N ? '  (too few to read)' : ''}`;
  console.log(`closed-window posts: ${L.posts.length} (+${added} new). Score = views in the first ${WINDOW} days, own counter.`);
  for (const [h, m] of [['topic', L.topics], ['kind', L.kinds], ['headline', L.headlines], ['length', L.lengths], ['banner hook', L.hooks], ['banner picture', L.images]]) { console.log(h + ':'); Object.entries(m).sort((a, b) => b[1].rel - a[1].rel).forEach(([k, o]) => console.log(line(k, o))); }
  const withCtr = L.posts.filter((p) => p.ctr != null); if (withCtr.length) console.log(`card click rate (clicks / index views, first 7 days), posts with data: ${withCtr.length}; ` + ['drawn', 'photo'].map((i) => { const x = withCtr.filter((p) => p.image === i); return x.length ? `${i} ${(100 * x.reduce((a, p) => a + p.ctr, 0) / x.length).toFixed(1)}% (n=${x.length})` : ''; }).filter(Boolean).join(', '));
  console.log('layout tests (per page view, running ones only get counts):');
  for (const [t, arms] of Object.entries(L.ab || {})) { const a = arms.a || { v: 0, r: 0 }, b = arms.b || { v: 0, r: 0 }, ra = a.v ? a.r / a.v : 0, rb = b.v ? b.r / b.v : 0; console.log(`  ${t}: A ${a.v} views, ${a.r} reads (${(100 * ra).toFixed(0)}%) | B ${b.v} views, ${b.r} reads (${(100 * rb).toFixed(0)}%) -> ${Math.min(a.v, b.v) < MIN_VIEWS_AB ? 'too few views to read (need ' + MIN_VIEWS_AB + ' per arm)' : Math.abs(rb - ra) >= 0.2 * Math.max(ra, rb, 0.01) ? 'B ' + (rb > ra ? 'ahead' : 'behind') + ' by 20%+: show Aashish before any rollout' : 'no clear difference yet'}`); }
  if (!Object.keys(L.ab || {}).length) console.log('  none counted yet (the tests started 2026-11-23; counts appear as visitors arrive)');
  console.log(due ? 'topic nudges now: ' + (JSON.stringify(L.adj) === '{}' ? 'none (no topic has enough posts and a clear gap)' : JSON.stringify(L.adj)) : 'topic nudges unchanged (reviewed less than 7 days ago)');
}

// 80:20. Every fifth post (4 of 5 exploit, 1 of 5 experiment) is an EXPERIMENT slot: the least-tried topic, title style, length, banner hook and picture, all at once, to feed the loop.
// The other four EXPLOIT: the topic with the best learned score (the news job still picks the story), and each style factor uses its leader once one clearly leads (enough posts, 1.3x the runner-up), else the least-tried arm.
function next() {
  const L = read(), total = fs.readdirSync(path.dirname(FILE)).filter((n) => /^[a-z0-9-]+\.json$/.test(n) && !['calendar.json', 'state.json', 'learn.json'].includes(n)).length;
  const experiment = total % 5 === 4;
  const n = (m, a) => (m && m[a] ? m[a].n : 0);
  const pick = (arms, m) => {
    const byN = [...arms].sort((a, b) => n(m, a) - n(m, b) || arms.indexOf(a) - arms.indexOf(b)), lead = [...arms].filter((a) => n(m, a) >= MIN_N).sort((a, b) => m[b].rel - m[a].rel);
    return !experiment && lead.length >= 2 && m[lead[0]].rel >= 1.3 * m[lead[1]].rel ? lead[0] + ' (leader)' : byN[0] + (experiment ? ' (experiment)' : ' (least tried so far)');
  };
  const topics = Object.keys(L.topics || {}), best = topics.filter((t) => L.topics[t].n >= MIN_N).sort((a, b) => L.topics[b].rel - L.topics[a].rel)[0];
  console.log(`Slot ${total + 1}: ${experiment ? 'EXPERIMENT (the 1 in 5)' : 'EXPLOIT (the 4 in 5)'}`);
  console.log(experiment ? 'topic: take the least-covered topic in learn.json (fewest closed posts, fewest in the last 10) even if its score is lower; skip only a story that would be unsafe or unsourced.' : `topic: ${best ? 'best learned topic so far is ' + best + '; prefer it when a good story exists, balance rule still applies' : 'not enough closed posts per topic to name a winner; use the weights as they are'}`);
  console.log('title style:', pick(HEADLINES, L.headlines), '| body length:', pick(LENGTHS, L.lengths).replace(/^short/, 'short (950-1200 words)').replace(/^long/, 'long (1350-1550 words)'), '| banner hook text:', pick(HOOKS, L.hooks), '| banner picture:', pick(IMAGES, L.images).replace('photo', 'photo (only if a free-licence photo of the main subject exists; else drawn)'));
  console.log('Breaking posts are exempt. If the story cannot honestly take a title style or hook, use the next least-tried one and say so. Never pad or cut facts to hit a length. The banner stays D2 Paper; only the hook wording and photo-or-drawing vary.');
}

// base weight plus the learned nudge, never below 0 (a category is never switched off; the runbook's floor rule keeps it in the plan)
const weightOf = (base, topic) => Math.max(0, (base[topic] || 0) + (read().adj[topic] || 0));
module.exports = { learn, next, weightOf, read, headlineOf, lengthOf, hookOf };
