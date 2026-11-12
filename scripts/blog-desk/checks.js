// Checks that run in code, not in a model: reading source pages, picking a spread of sources, copy overlap, and the "does this read like a person" pass.
const { outletOf } = require('./sources');

const UA = 'Mozilla/5.0 (compatible; AashishPandeyBlogDesk/1.0; +https://aashishpandey.com)';
const safeUrl = (u) => { try { const x = new URL(u); return x.protocol === 'https:' && !/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(x.hostname) && !x.hostname.endsWith('.internal') && !x.username ? x.href : ''; } catch (e) { return ''; } };
const strip = (html) => String(html || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<nav[\s\S]*?<\/nav>|<footer[\s\S]*?<\/footer>|<aside[\s\S]*?<\/aside>|<!--[\s\S]*?-->/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/\s+/g, ' ').trim();
const titleOf = (html) => { const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html || ''); return m ? strip(m[1]).slice(0, 200) : ''; };

async function fetchPage(url, ms) {
  const u = safeUrl(url); if (!u) return null;
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms || 12000);
  try {
    const r = await fetch(u, { headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' }, redirect: 'follow', signal: ctl.signal });
    if (!r.ok || !/html|text/i.test(r.headers.get('content-type') || 'text/html')) return null;
    const html = (await r.text()).slice(0, 900000), text = strip(html);
    if (text.length < 400) return null;   // blocked, paywalled or empty
    return { url: u, finalUrl: r.url || u, title: titleOf(html), text: text.slice(0, 60000) };
  } catch (e) { return null; } finally { clearTimeout(t); }
}

// choose up to `max` of the fetched pages with a spread: each lean group, a non-US outlet, a primary source, at most 2 per outlet
function pickSources(pages, max) {
  max = max || 8; const chosen = [], per = {}, has = (p) => chosen.includes(p);
  const add = (p) => { if (!p || has(p) || chosen.length >= max) return; const k = p.meta.outlet; if ((per[k] || 0) >= 2) return; per[k] = (per[k] || 0) + 1; chosen.push(p); };
  ['L', 'C', 'R'].forEach((g) => add(pages.find((p) => p.meta.lean === g)));
  add(pages.find((p) => p.meta.region && p.meta.region !== 'US' && !has(p) && p.meta.lean));
  add(pages.find((p) => p.meta.region === 'IN' && !has(p)));
  pages.filter((p) => p.meta.primary).slice(0, 2).forEach(add);
  pages.forEach(add);
  return chosen;
}
function diversity(sources, kind, trade) {
  const outlets = new Set(sources.map((s) => s.meta.outlet)), leans = new Set(sources.map((s) => s.meta.lean).filter(Boolean)), primary = sources.some((s) => s.meta.primary), nonUs = sources.some((s) => s.meta.region && s.meta.region !== 'US');
  const need = kind === 'breaking' ? { n: 3, o: 2, l: 1 } : { n: 5, o: 3, l: kind === 'review' ? 1 : 2 };
  if (trade) { need.n = 4; need.o = 3; need.l = 0; }   // technical, security or developer-tool topics only trade outlets cover: official source + 3 independent outlets, no political spread
  const problems = [];
  if (sources.length < need.n) problems.push(`only ${sources.length} readable sources (need ${need.n})`);
  if (outlets.size < need.o) problems.push(`only ${outlets.size} different outlets (need ${need.o})`);
  if (leans.size < need.l) problems.push(`viewpoint spread too narrow (${[...leans].join('/') || 'none'})`);
  if ((kind === 'review' || trade) && !primary) problems.push('no primary source (the maker\'s own page, a paper or a filing)');
  return { ok: !problems.length, problems, outlets: outlets.size, leans: [...leans].sort().join(''), primary, nonUs, count: sources.length };
}

/* ---------- copy overlap ---------- */
const words = (s) => String(s).toLowerCase().replace(/[^a-z0-9\s']/g, ' ').split(/\s+/).filter(Boolean);
const N = 8;
// share of the article's 8-word runs that also appear in a source, ignoring text inside quotation marks (a short quote is allowed)
function overlap(article, sourceTexts) {
  const noQuotes = String(article).replace(/"[^"\n]{3,300}"/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'), w = words(noQuotes);
  if (w.length < N + 5) return { pct: 0, worst: null, flagged: [] };
  const key = (a, i) => a.slice(i, i + N).join(' '), union = new Set(); let worst = { pct: 0, i: -1 };
  const grams = []; for (let i = 0; i + N <= w.length; i++) grams.push(key(w, i));
  sourceTexts.forEach((t, si) => {
    const sw = words(t), set = new Set(); for (let i = 0; i + N <= sw.length; i++) set.add(key(sw, i));
    let h = 0; grams.forEach((g) => { if (set.has(g)) { h++; union.add(g); } });
    const p = (h / grams.length) * 100; if (p > worst.pct) worst = { pct: p, i: si };
  });
  const covered = new Array(w.length).fill(false); grams.forEach((g, gi) => { if (union.has(g)) for (let k = 0; k < N; k++) covered[gi + k] = true; });
  const flagged = noQuotes.split(/(?<=[.!?])\s+|\n+/).filter((sn) => { const sw = words(sn); if (sw.length < N) return false; let h = 0, n = 0; for (let i = 0; i + N <= sw.length; i++) { n++; if (union.has(key(sw, i))) h++; } return n && h / n >= 0.3; }).slice(0, 8);
  return { pct: Math.round((covered.filter(Boolean).length / w.length) * 1000) / 10, worst: worst.i, flagged };
}
async function copyscape(text) {
  const u = process.env.COPYSCAPE_USER, k = process.env.COPYSCAPE_KEY; if (!u || !k) return null;
  try {
    const r = await fetch(`https://www.copyscape.com/api/?u=${encodeURIComponent(u)}&k=${encodeURIComponent(k)}&o=csearch&e=UTF-8&c=3&f=json`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 't=' + encodeURIComponent(text.slice(0, 30000)) });
    const j = await r.json(); if (j.error) throw new Error(j.error);
    const total = Math.max(1, (j.querywords || words(text).length)), top = (j.result || []).reduce((m, x) => Math.max(m, Number(x.percentmatched) || 0), 0);
    return { pct: top, count: (j.result || []).length, url: top ? ((j.result || [])[0] || {}).url : '' };
  } catch (e) { console.error('copyscape failed:', e.message); return { error: e.message }; }
}

/* ---------- human-sounding text ---------- */
const BANNED = ['delve', 'tapestry', 'in today\'s fast-paced', 'in the ever-evolving', 'ever-changing landscape', 'game-changer', 'game changer', 'revolutionize', 'unlock the power', 'it\'s worth noting', 'it is worth noting', 'in conclusion', 'in summary,', 'navigate the complexities', 'a testament to', 'seamless', 'cutting-edge', 'embark on', 'dive into', 'dive deep', 'landscape of', 'harness the', 'at the end of the day', 'stands as a', 'rich tapestry', 'paradigm shift', 'moreover,', 'furthermore,', 'as an ai', 'i hope this helps', 'leverage', 'robust'];
function scrub(t) {
  return String(t)
    .replace(/[​-‏‪-‮⁠-⁤﻿­᠎]/g, '')       // invisible characters some tools leave behind
    .replace(/[     ]/g, ' ')
    .replace(/(\d)\s?[–—]\s?(\d)/g, '$1 to $2')
    .replace(/\s?[—–]\s?/g, ', ')                                         // dashes used as breaks read as machine-made
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...')
    .replace(/,\s*,/g, ',').replace(/[ \t]+\n/g, '\n').replace(/[ ]{2,}/g, ' ');
}
function lint(text) {
  const plain = String(text).replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#>*_`|]/g, ' '), low = plain.toLowerCase(), issues = [];
  BANNED.forEach((b) => { if (low.includes(b)) issues.push(`avoid "${b.trim()}"`); });
  const sents = plain.split(/(?<=[.!?])\s+/).map((s) => words(s).length).filter((n) => n > 2), mean = sents.reduce((a, b) => a + b, 0) / (sents.length || 1);
  const sd = Math.sqrt(sents.reduce((a, b) => a + (b - mean) ** 2, 0) / (sents.length || 1));
  if (sents.length > 8 && sd < 5.5) issues.push('sentences are all about the same length; mix short and long ones');
  if (sents.length > 8 && !/\b(i'd|i'm|i've|don't|doesn't|isn't|it's|that's|can't|won't|you'll|we're|they're|here's)\b/i.test(plain)) issues.push('use everyday contractions (it\'s, don\'t, I\'d)');
  const lists = (String(text).match(/^\s*[-*]\s/gm) || []).length; if (lists > 18) issues.push('too many bullet points; write more of it as sentences');
  const colonHeads = (String(text).match(/^#{2,3}\s.*:\s/gm) || []).length; if (colonHeads > 2) issues.push('headings with colons everywhere look templated');
  return { issues, sd: Math.round(sd * 10) / 10, sentences: sents.length };
}
module.exports = { fetchPage, pickSources, diversity, overlap, copyscape, scrub, lint, outletOf, words, strip, safeUrl };
