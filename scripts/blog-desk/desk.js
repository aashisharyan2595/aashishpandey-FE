#!/usr/bin/env node
// The blog desk's tools. No API keys and no accounts: a scheduled Claude session does the reading, deciding and writing (see docs/BLOG-DESK.md and
// docs/blog-desk-runbook.md) and uses this script for the parts that must be exact. Everything it writes goes into the repo and is published by git.
//
//   node scripts/blog-desk/desk.js feeds                          new items from the news feeds (JSON on stdout); remembers what it has shown
//   node scripts/blog-desk/desk.js fetch <dir> <url> [url...]     read pages into <dir> and label each outlet (left/centre/right, region, primary)
//   node scripts/blog-desk/desk.js pick <dir> <kind>              choose the spread of sources and say whether it is enough (kind: review|news|explainer|breaking)
//   node scripts/blog-desk/desk.js check <draft.json> <dir>       clean the draft, then report style, copy overlap and unsupported numbers or quotes
//   node scripts/blog-desk/desk.js build <draft.json> <dir> --kind K --at <ISO time|now> [--email <file>]
//                                                                 draw the images, assemble the page, write content/blog/<slug>.json and assets/blog/*
//   node scripts/blog-desk/desk.js ping                           tell IndexNow search engines about posts that went live (optional, free, no account)
//   node scripts/blog-desk/desk.js days                           what the calendar holds, and what is live
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const CONTENT = path.join(ROOT, 'content', 'blog');
const checks = require('./checks'), sources = require('./sources');
const SITE = 'https://aashishpandey.com';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const readJ = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } };
const writeJ = (f, v) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n'); };
const arg = (name) => { const i = process.argv.indexOf('--' + name); return i > -1 ? process.argv[i + 1] : ''; };
const when = (ms) => new Date(ms).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) + ' IST';

/* ---------- feeds ---------- */
const tag = (x, t) => { const m = new RegExp('<' + t + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + t + '>', 'i').exec(x); return m ? checks.strip(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')) : ''; };
function parseFeed(xml, name) {
  const out = [], blocks = String(xml).match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) || [];
  for (const b of blocks.slice(0, 30)) {
    let link = tag(b, 'link'); if (!link) { const m = /<link[^>]+href=["']([^"']+)["']/i.exec(b); link = m ? m[1] : ''; }
    link = checks.safeUrl(link.trim()); if (!link) continue;
    out.push({ feed: name, title: tag(b, 'title').slice(0, 200), url: link, at: Date.parse(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || '') || Date.now(), summary: (tag(b, 'description') || tag(b, 'summary')).slice(0, 220) });
  }
  return out;
}
async function feeds() {
  const all = [];
  await Promise.all(sources.FEEDS.map(async (f) => {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 15000);
    try { const r = await fetch(f.url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; AashishPandeyBlogDesk/1.0)' }, signal: ctl.signal }); if (r.ok) all.push(...parseFeed(await r.text(), f.name)); else console.error('feed skipped:', f.name, r.status); }
    catch (e) { console.error('feed failed:', f.name); } finally { clearTimeout(t); }
  }));
  const stateFile = path.join(CONTENT, 'state.json'), st = readJ(stateFile, { seen: {} }), now = Date.now(), cutoff = now - 36 * 3600e3;
  for (const [u, t] of Object.entries(st.seen)) if (now - t > 10 * 864e5) delete st.seen[u];
  const fresh = all.filter((x) => x.at >= cutoff && !st.seen[x.url]).sort((a, b) => b.at - a.at).slice(0, 120);
  fresh.forEach((x) => { st.seen[x.url] = now; }); writeJ(stateFile, st);
  console.log(JSON.stringify(fresh.map((x, i) => ({ n: i + 1, ...x, at: new Date(x.at).toISOString() })), null, 1));
  console.error(`${all.length} items from ${sources.FEEDS.length} feeds, ${fresh.length} new`);
}

/* ---------- reading pages ---------- */
async function fetchPages(dir, urls) {
  fs.mkdirSync(dir, { recursive: true }); const have = fs.readdirSync(dir).filter((f) => /^\d+\.json$/.test(f)).length; let n = have;
  const seen = new Set(fs.readdirSync(dir).filter((f) => /^\d+\.json$/.test(f)).map((f) => readJ(path.join(dir, f)).url));
  const list = [...new Set(urls)].filter((u) => !seen.has(u));
  for (let i = 0; i < list.length; i += 6) {
    const got = await Promise.all(list.slice(i, i + 6).map((u) => checks.fetchPage(u)));
    got.forEach((p, k) => {
      if (!p) { console.log('x  unreadable (blocked, paywalled or empty):', list[i + k]); return; }
      const meta = sources.outletOf(p.finalUrl || p.url); n++;
      writeJ(path.join(dir, String(n).padStart(2, '0') + '.json'), { ...p, meta });
      console.log(`${String(n).padStart(2, '0')} ${(meta.outlet || meta.host).padEnd(26)} lean=${meta.lean || '-'} region=${meta.region || '-'} ${meta.primary ? 'PRIMARY ' : ''}words=${p.text.split(/\s+/).length}  ${p.title.slice(0, 70)}`);
    });
  }
}
const loadPages = (dir) => fs.readdirSync(dir).filter((f) => /^\d+\.json$/.test(f)).sort().map((f) => ({ file: f, ...readJ(path.join(dir, f)) }));
function pick(dir, kind) {
  const pages = loadPages(dir), chosen = checks.pickSources(pages), div = checks.diversity(chosen, kind || 'news');
  writeJ(path.join(dir, 'picked.json'), chosen.map((p) => p.file));
  console.log('picked:'); chosen.forEach((p) => console.log(`  ${p.file} ${p.meta.outlet} (${p.meta.lean || 'primary'}${p.meta.region ? ', ' + p.meta.region : ''})`));
  console.log('enough:', div.ok ? 'YES' : 'NO', div.ok ? '' : '- ' + div.problems.join('; '));
  console.log('summary:', JSON.stringify({ sources: div.count, outlets: div.outlets, leans: div.leans, primary: div.primary, nonUs: div.nonUs }));
  if (!div.ok) console.log('missing leans to search for:', ['L', 'C', 'R'].filter((l) => !div.leans.includes(l)).join(',') || 'none');
}
const pickedPages = (dir) => { const names = readJ(path.join(dir, 'picked.json'), null); const all = loadPages(dir); return names ? all.filter((p) => names.includes(p.file)) : all; };

/* ---------- draft: clean, check, build ---------- */
const deepScrub = (o) => (typeof o === 'string' ? checks.scrub(o) : Array.isArray(o) ? o.map(deepScrub) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, deepScrub(v)])) : o);
const cleanLinks = (body, allowed) => body.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => (href.startsWith('/') || href.startsWith(SITE) || allowed.has(href.replace(/#.*$/, '')) ? m : label));
const norm = (s) => String(s).toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ');
const numsOf = (s) => (String(s).match(/\d[\d,]*(?:\.\d+)?%?/g) || []).map((x) => x.replace(/,/g, '')).filter((x) => x.replace(/\D/g, '').length >= 2 || /%/.test(x));
function analyse(draft, pages) {
  const allowed = new Set(pages.flatMap((p) => [p.url, p.finalUrl].filter(Boolean).map((u) => u.replace(/#.*$/, ''))));
  draft = deepScrub(draft); draft.body_markdown = cleanLinks(draft.body_markdown, allowed);
  const full = [draft.tldr, draft.body_markdown, ...(draft.faq || []).map((f) => f.q + ' ' + f.a)].join('\n\n');
  const l = checks.lint(full), ov = checks.overlap(full, pages.map((p) => p.text)), byUrl = {}; pages.forEach((p) => { byUrl[p.url.replace(/#.*$/, '')] = p; if (p.finalUrl) byUrl[p.finalUrl.replace(/#.*$/, '')] = p; });
  const unsupported = [];
  for (const c of draft.claims || []) {
    const src = byUrl[String(c.source_url).replace(/#.*$/, '')]; if (!src) { unsupported.push({ claim: c.claim, why: 'its source_url is not one of the picked pages' }); continue; }
    const text = src.text.replace(/,/g, ''), miss = numsOf(c.claim).filter((n) => !text.includes(n.replace(/%$/, '')));
    if (miss.length) unsupported.push({ claim: c.claim, why: 'number(s) not found in that source: ' + miss.join(', ') });
  }
  const allText = norm(pages.map((p) => p.text).join(' '));
  for (const m of full.matchAll(/"([^"\n]{12,300})"/g)) if (!allText.includes(norm(m[1]).replace(/[.,;:!?]+$/, ''))) unsupported.push({ claim: 'quote: "' + m[1].slice(0, 80) + '"', why: 'not found word for word in any source' });
  return { draft, full, lint: l, overlap: ov, unsupported, words: checks.words(full).length };
}
function check(draftFile, dir) {
  const a = analyse(readJ(draftFile), pickedPages(dir)); writeJ(draftFile.replace(/\.json$/, '') + '.clean.json', a.draft);
  console.log(`words: ${a.words}`); console.log(`style: ${a.lint.issues.length ? a.lint.issues.join('; ') : 'ok'} (sentence length spread ${a.lint.sd})`);
  console.log(`copy overlap with sources: ${a.overlap.pct}%  (limit 10%)${a.overlap.flagged.length ? '\n  passages to rewrite in your own words:\n   - ' + a.overlap.flagged.map((s) => s.slice(0, 150)).join('\n   - ') : ''}`);
  console.log(`unsupported numbers/quotes: ${a.unsupported.length ? '\n   - ' + a.unsupported.map((u) => u.claim.slice(0, 100) + ' => ' + u.why).join('\n   - ') : 'none'}`);
  console.log('cleaned draft written to', draftFile.replace(/\.json$/, '') + '.clean.json');
  console.log('RESULT:', !a.lint.issues.length && a.overlap.pct < 10 && !a.unsupported.length ? 'PASS' : a.overlap.pct >= 10 || a.unsupported.length ? 'FIX NEEDED' : 'STYLE NOTES (one rewrite pass advised)');
}
async function build(draftFile, dir) {
  const kind = arg('kind') || 'news', at = arg('at'), pages = pickedPages(dir), a = analyse(readJ(draftFile), pages), d = a.draft;
  if (a.overlap.pct >= 10) throw new Error(`copy overlap is ${a.overlap.pct}%, rewrite first`);
  if (a.unsupported.length) throw new Error('unsupported numbers or quotes remain, fix first');
  const div = checks.diversity(pages, kind); if (!div.ok && process.argv.indexOf('--allow-thin-sources') < 0) throw new Error('sources are not enough: ' + div.problems.join('; '));
  const slug = slugify(d.slug || d.title), publishAt = at === 'now' || !at ? Date.now() : Date.parse(at);
  if (!Number.isFinite(publishAt)) throw new Error('--at must be an ISO time or "now"');
  if (fs.existsSync(path.join(CONTENT, slug + '.json')) && process.argv.indexOf('--overwrite') < 0) throw new Error('content/blog/' + slug + '.json exists (use --overwrite to replace)');
  const graphics = require('./graphics'), imgs = await graphics.makeImages({ ...d, kind }), ref = {};
  fs.mkdirSync(path.join(ROOT, 'assets', 'blog'), { recursive: true });
  for (const im of imgs) { const f = `${slug}-${im.role}.jpg`; fs.writeFileSync(path.join(ROOT, 'assets', 'blog', f), im.buf); ref[im.role] = { src: '/assets/blog/' + f, alt: (im.role === 'cover' ? d.image_alt : `Pros and cons of ${d.product || d.title}: ${d.pros.slice(0, 3).join(', ')} versus ${d.cons.slice(0, 3).join(', ')}`).slice(0, 160) }; }
  let body = d.body_markdown;
  if (ref.proscons) { const fig = `![${ref.proscons.alt}](${ref.proscons.src} "Pros and cons at a glance")`, m = /^##\s+(pros|the pros|what works)/im.exec(body); body = m ? body.slice(0, m.index) + fig + '\n\n' + body.slice(m.index) : body.replace(/\n\n/, '\n\n' + fig + '\n\n'); }
  const cite = pages.map((p, i) => `${i + 1}. [${(p.title || p.meta.outlet).replace(/\s*[|\-–—:]\s*[^|\-–—:]{2,40}$/, '').slice(0, 110)}](${p.url}), ${p.meta.outlet}`);
  const full = `> **Quick answer.** ${d.tldr}\n\n${body.trim()}\n\n## Frequently asked questions\n\n${d.faq.map((f) => `### ${f.q}\n\n${f.a}`).join('\n\n')}\n\n## Sources\n\n${cite.join('\n')}\n`;
  const md = require(path.join(ROOT, 'api/_site/md')), r = md.render(full, { noWords: false });
  const post = { title: d.title.slice(0, 120), slug, excerpt: d.excerpt.slice(0, 300), body: full, cover: { src: ref.cover.src, alt: ref.cover.alt }, category: d.category, tags: d.tags.slice(0, 8), publishAt, updated: Date.now(), words: r.words, mins: Math.max(1, Math.round(r.words / 200)),
    seo: { title: d.seo_title.slice(0, 70), description: d.seo_description.slice(0, 180), ogImage: ref.cover.src }, extra: { faq: d.faq, sources: pages.map((p) => ({ url: p.url, title: (p.title || '').slice(0, 200), outlet: p.meta.outlet })), kind, about: d.about, auto: true } };
  writeJ(path.join(CONTENT, slug + '.json'), post);
  const report = { sources: `${div.count} pages from ${div.outlets} outlets (viewpoints: ${div.leans.split('').map((c) => ({ L: 'left', C: 'centre', R: 'right' }[c])).join(', ') || 'none'}${div.primary ? ', plus a primary source' : ''}${div.nonUs ? ', non-US included' : ''})`, overlap: `${a.overlap.pct}% against its sources`, words: r.words, notes: a.lint.issues };
  const emailFile = arg('email');
  if (emailFile) fs.writeFileSync(emailFile, emailHtml(post, r.html, report, kind, publishAt));
  console.log(JSON.stringify({ file: `content/blog/${slug}.json`, url: `${SITE}/blog/${slug}`, title: post.title, publishAt: new Date(publishAt).toISOString(), goesLive: when(publishAt), images: Object.values(ref).map((x) => x.src), report }, null, 1));
}
function emailHtml(p, html, rep, kind, at) {
  const b = kind === 'breaking' ? `<b>Breaking news post published just now.</b> To take it down, tell Claude in your project thread: "stop ${esc(p.slug)}".` : `<b>Goes live ${esc(when(at))}.</b> You do not need to do anything. To stop it before then, tell Claude in your project thread: "stop ${esc(p.slug)}". To change it, tell Claude what to change.`;
  const rows = [['Sources', rep.sources], ['Copy overlap', rep.overlap], ['Length', rep.words + ' words']];
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1a1d33;max-width:680px;margin:0 auto">
<p style="color:#6b6f8f;font-size:13px;margin:0 0 6px">Blog desk</p><h1 style="font-size:24px;line-height:1.25;margin:0 0 10px">${esc(p.title)}</h1>
<p style="background:#e8f7ee;border:1px solid #9bd3b0;border-radius:8px;padding:12px 14px">${b}</p>
<table style="border-collapse:collapse;width:100%;font-size:14px;margin:14px 0">${rows.map((x) => `<tr><td style="padding:6px 10px;border:1px solid #e3e5f0;background:#f6f7fb;width:130px"><b>${esc(x[0])}</b></td><td style="padding:6px 10px;border:1px solid #e3e5f0">${esc(x[1])}</td></tr>`).join('')}</table>
${rep.notes.length ? `<p style="font-size:14px"><b>Notes:</b> ${rep.notes.map(esc).join('; ')}</p>` : ''}
<p style="font-size:14px;color:#555a7a">Cover image and the post as it will appear:</p>
<img src="${SITE}${p.cover.src}" alt="" style="width:100%;height:auto;border-radius:10px;margin:0 0 14px"><hr style="border:0;border-top:1px solid #e3e5f0">
${html.replace(/<img /g, '<img style="max-width:100%;height:auto" ').replace(/src="\//g, `src="${SITE}/`).replace(/href="\//g, `href="${SITE}/`)}</div>`;
}

/* ---------- search engines and a glance at the calendar ---------- */
async function ping() {
  const st = readJ(path.join(CONTENT, 'state.json'), { seen: {} }), done = new Set(st.pinged || []), now = Date.now();
  const live = fs.readdirSync(CONTENT).filter((n) => /^[a-z0-9-]+\.json$/.test(n) && n !== 'calendar.json' && n !== 'state.json').map((n) => readJ(path.join(CONTENT, n))).filter((p) => p && p.publishAt <= now && !done.has(p.slug));
  if (!live.length) return console.log('nothing new to send');
  const keyFile = fs.readdirSync(ROOT).find((f) => /^[0-9a-f]{32}\.txt$/.test(f)); if (!keyFile) return console.log('no IndexNow key file');
  const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: 'aashishpandey.com', key: keyFile.replace('.txt', ''), keyLocation: `${SITE}/${keyFile}`, urlList: live.map((p) => `${SITE}/blog/${p.slug}`).concat([`${SITE}/blog`, `${SITE}/sitemap-posts.xml`]) }) });
  console.log('IndexNow', r.status); if (r.status < 300) { st.pinged = [...done, ...live.map((p) => p.slug)].slice(-200); writeJ(path.join(CONTENT, 'state.json'), st); }
}
function days() {
  const cal = readJ(path.join(CONTENT, 'calendar.json'), { slots: {} });
  Object.keys(cal.slots).sort().forEach((d) => console.log(d, (cal.slots[d].status || 'planned').padEnd(8), (cal.slots[d].kind || '').padEnd(9), cal.slots[d].title));
  const files = fs.readdirSync(CONTENT).filter((n) => /^[a-z0-9-]+\.json$/.test(n) && n !== 'calendar.json' && n !== 'state.json');
  console.log(`\n${files.length} post file(s):`); files.forEach((n) => { const p = readJ(path.join(CONTENT, n)); console.log(' ', new Date(p.publishAt).toISOString(), p.publishAt > Date.now() ? 'scheduled' : 'live     ', p.slug); });
}

const cmd = process.argv[2], a1 = process.argv[3], a2 = process.argv[4];
const run = { feeds, fetch: () => fetchPages(a1, process.argv.slice(4).filter((x) => !x.startsWith('--'))), pick: () => pick(a1, a2), check: () => check(a1, a2), build: () => build(a1, a2), ping, days };
if (!run[cmd]) { console.error('usage: desk.js feeds | fetch <dir> <urls> | pick <dir> <kind> | check <draft> <dir> | build <draft> <dir> --kind K --at T | ping | days'); process.exit(2); }
Promise.resolve(run[cmd]()).then(() => process.exit(0), (e) => { console.error('desk:', e.message); process.exit(1); });
