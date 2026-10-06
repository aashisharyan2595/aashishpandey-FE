#!/usr/bin/env node
/*
 * Pre-deploy check. Runs in GitHub Actions on every pull request and every push to main
 * (.github/workflows/check.yml), and by hand:
 *     node scripts/check-site.cjs                  check the working tree
 *     node scripts/check-site.cjs --base main      also check that changed versioned assets got a new ?v=
 *
 * It copies the repo to a temp folder and runs the Vercel buildCommand there, so the working tree is never
 * touched (prerender.cjs rewrites pages on every run; its output must not be committed). Then it checks:
 *   1. every internal link, image, script and stylesheet in the built pages resolves to a file, a rewrite,
 *      a redirect that lands somewhere real, or an api/ function
 *   2. every page links the current version of each versioned asset (nav.css?v=, site.css?v= ...), and the
 *      committed header and footer match scripts/chrome.cjs, so the deploy does not rewrite them
 *   3. with --base: an asset that changed since the base also got its ?v= bumped (assets are cached for 30 days)
 *   4. the sitemaps list only real pages, every routed page is in a sitemap, and the tool count agrees across
 *      the sitemaps, the /tools hub, its ItemList data and the "All N tools" links
 * No network calls. Exits 1 with one line per problem, naming the page.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SITE = /^https?:\/\/(?:www\.)?aashishpandey\.com(?=[/?#"'\s]|$)/;
const argv = process.argv.slice(2);
const baseArg = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : null;
const GH = !!process.env.GITHUB_ACTIONS;

const problems = [];
const fail = (file, msg) => problems.push({ file, msg });

/* ---------- 1. build in a temp copy ---------- */
const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'site-check-'));
const SKIP_COPY = new Set(['.git', 'node_modules', 'tpl', '.vercel']);
fs.cpSync(ROOT, tmp, { recursive: true, filter: (src) => !SKIP_COPY.has(path.basename(src)) || path.dirname(src) !== ROOT });
const src = {}; // page sources as committed, before the build touches them
// pages are keyed by repo-relative path (pages/tools/Tools-QR.dc.html), root files by name (404.html)
const htmlFiles = (root) => [...fs.readdirSync(root).filter((x) => x.endsWith('.html')), ...require('./pages.cjs').list(root).map((p) => p.rel)];
for (const f of htmlFiles(tmp)) src[f] = fs.readFileSync(path.join(tmp, f), 'utf8');
try {
  execSync(vercel.buildCommand, { cwd: tmp, stdio: 'pipe' });
} catch (e) {
  console.error('Build failed: ' + vercel.buildCommand + '\n' + String(e.stdout || '') + String(e.stderr || ''));
  process.exit(1);
}

/* ---------- what the deployment serves ---------- */
const ignored = fs.existsSync(path.join(ROOT, '.vercelignore'))
  ? fs.readFileSync(path.join(ROOT, '.vercelignore'), 'utf8').split('\n').map((s) => s.trim().replace(/^\/|\/$/g, '')).filter((s) => s && !s.startsWith('#'))
  : [];
const served = (rel) => !ignored.some((g) => rel === g || rel.startsWith(g + '/'));
const fileExists = (urlPath) => {
  const rel = urlPath.replace(/^\//, '');
  if (!rel || !served(rel)) return false;
  const p = path.join(tmp, rel);
  return fs.existsSync(p) && fs.statSync(p).isFile();
};
// api functions: api/x.js serves /api/x, api/s/[code].js serves /api/s/<anything>; files starting with _ are private
const apiRoutes = [];
(function walk(dir) {
  for (const n of fs.readdirSync(path.join(tmp, dir))) {
    const rel = dir + '/' + n;
    if (fs.statSync(path.join(tmp, rel)).isDirectory()) { if (!n.startsWith('_')) walk(rel); continue; }
    if (!/\.(c?js|ts|mjs)$/.test(n) || n.startsWith('_')) continue;
    const route = '/' + rel.replace(/\.(c?js|ts|mjs)$/, '').replace(/\[[^\]]+\]/g, '[^/]+');
    apiRoutes.push(new RegExp('^' + route + '/?$'));
  }
})('api');

// path-to-regexp subset Vercel uses here: :name, :name*, :name(a|b)
function toRe(source) {
  const keys = [];
  const re = source.replace(/[.+?^${}[\]\\]/g, '\\$&').replace(/:(\w+)(\([^)]*\))?(\*)?/g, (m, k, alt, star) => {
    keys.push(k);
    if (alt) return '(' + alt.slice(1, -1).replace(/\\\|/g, '|') + ')';
    return star ? '(.*)' : '([^/]+)';
  });
  return { re: new RegExp('^' + re + '$'), keys };
}
// rules with has/missing conditions (e.g. the www host redirect) only apply to some requests; links are checked as
// requests to the canonical host, so leave them out
const compile = (list) => (list || []).filter((r) => !r.has && !r.missing).map((r) => ({ ...r, ...toRe(r.source) }));
const redirects = compile(vercel.redirects);
const rewrites = compile(vercel.rewrites);
const fill = (rule, m) => rule.destination.replace(/:(\w+)\*?(\([^)]*\))?/g, (x, k) => m[rule.keys.indexOf(k) + 1] ?? '');

function resolve(urlPath, depth = 0) {
  if (depth > 5) return 'redirect loop';
  let p;
  try { p = decodeURI(urlPath); } catch { p = urlPath; }
  for (const r of redirects) {
    const m = p.match(r.re);
    if (m) {
      const to = fill(r, m);
      if (/^https?:/.test(to)) return null;
      return resolve(to.split(/[?#]/)[0], depth + 1);
    }
  }
  if (fileExists(p)) return null;
  if (apiRoutes.some((re) => re.test(p))) return null;
  for (const r of rewrites) {
    const m = p.match(r.re);
    if (m) {
      const to = fill(r, m).split(/[?#]/)[0];
      if (fileExists(to) || apiRoutes.some((re) => re.test(to))) return null;
      return `rewrite ${r.source} points at ${to}, which does not exist`;
    }
  }
  return 'nothing serves this path';
}

// the URLs each page is served at (the rewrite sources), used to resolve relative links
const routesOf = {};
for (const r of vercel.rewrites || []) {
  const f = r.destination.replace(/^\//, '');
  if (f.endsWith('.html') && !r.source.includes(':')) (routesOf[f] = routesOf[f] || []).push(r.source);
}

/* ---------- 1. links and assets in the built pages ---------- */
const SKIP_SCHEME = /^(mailto:|tel:|sms:|javascript:|data:|blob:|about:|#|\/\/)/i;
const DYNAMIC = /\{\{|\$\{|' *\+|" *\+|\+ *'|\+ *"/;
let checked = 0;
function checkRef(file, raw, bases) {
  let v = raw.trim().replace(/&amp;/g, '&');
  if (!v || DYNAMIC.test(v) || SKIP_SCHEME.test(v)) return;
  const abs = v.match(SITE);
  if (abs) v = v.slice(abs[0].length) || '/';
  else if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return; // other sites: no network calls
  checked++;
  const targets = v.startsWith('/') ? [v] : bases.map((b) => new URL(v, 'https://x' + b).pathname);
  for (const t of targets) {
    const p = t.split(/[?#]/)[0];
    const why = resolve(p);
    if (why) { fail(file, `broken link ${raw.trim()} (${why})`); return; }
  }
}
function scanHtml(file, html, bases) {
  // self-links anywhere in the file, including JSON-LD and scripts: https://aashishpandey.com/...
  for (const m of html.matchAll(/https?:\/\/(?:www\.)?aashishpandey\.com(\/[^\s"'<>\\)`,]*)?/g)) {
    const after = html.slice(m.index + m[0].length, m.index + m[0].length + 4);
    if (/^\s*\+/.test(after) || /^['"`]\s*\+/.test(after)) continue; // a prefix in string concatenation
    checkRef(file, m[0], bases);
  }
  // markup: strip scripts (except templates moved into tpl/, scanned separately) and comments
  const body = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[\s\S]*?<\/script>/gi, '');
  for (const m of body.matchAll(/\s(href|src|data-src|poster|action)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const v = m[2] ?? m[3];
    if (m[1].toLowerCase() === 'action' && !v) continue;
    checkRef(file, v, bases);
  }
  for (const m of body.matchAll(/\s(?:srcset|data-srcset)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    for (const part of (m[1] ?? m[2]).split(',')) checkRef(file, part.trim().split(/\s+/)[0], bases);
  }
  for (const m of body.matchAll(/url\(\s*(?:&quot;|['"])?([^'")&]+)(?:&quot;|['"])?\s*\)/g)) checkRef(file, m[1], bases);
}
const builtPages = htmlFiles(tmp).filter(served).sort();
for (const f of builtPages) {
  const html = fs.readFileSync(path.join(tmp, f), 'utf8');
  const bases = routesOf[f] || ['/' + f];
  scanHtml(f, html, bases);
  // externalized templates: the page markup now lives in tpl/<Page>.<hash>.js as one JSON string
  for (const m of html.matchAll(/<script src="\/(tpl\/[^"]+\.js)"><\/script>/g)) {
    const js = fs.readFileSync(path.join(tmp, m[1]), 'utf8');
    const s = js.match(/innerHTML=("(?:[^"\\]|\\.)*")/);
    if (!s) { fail(f, `${m[1]} has no template string`); continue; }
    scanHtml(f, JSON.parse(s[1]), bases);
  }
}
// stylesheets: url() inside assets/*.css resolves against the css file
(function walk(dir) {
  for (const n of fs.readdirSync(path.join(tmp, dir))) {
    const rel = dir + '/' + n;
    if (fs.statSync(path.join(tmp, rel)).isDirectory()) { walk(rel); continue; }
    if (!n.endsWith('.css')) continue;
    const css = fs.readFileSync(path.join(tmp, rel), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) checkRef(rel, m[1], ['/' + rel]);
  }
})('assets');

/* ---------- 2. versioned assets: one version per asset, and the header current ---------- */
const chromeSrc = fs.readFileSync(path.join(ROOT, 'scripts/chrome.cjs'), 'utf8');
const pinned = {
  'nav.css': (chromeSrc.match(/const NAV_CSS = (\d+)/) || [])[1],
  'nav.js': (chromeSrc.match(/const NAV_JS = (\d+)/) || [])[1],
};
function versions(pages) {
  const by = {}; // asset -> version -> [pages]
  for (const [f, html] of Object.entries(pages)) {
    for (const m of html.matchAll(/(?:\/|\.\/|")assets\/([\w./-]+\.(?:css|js))\?v=([\w.-]+)/g)) {
      ((by[m[1]] = by[m[1]] || {})[m[2]] = by[m[1]][m[2]] || new Set()).add(f);
    }
  }
  return by;
}
const verNow = versions(src);
for (const [asset, vs] of Object.entries(verNow)) {
  const want = pinned[asset] || Object.entries(vs).sort((a, b) => b[1].size - a[1].size || (b[0] > a[0] ? 1 : -1))[0][0];
  for (const [v, pages] of Object.entries(vs)) {
    if (v === want) continue;
    for (const f of pages) fail(f, `links assets/${asset}?v=${v}, current is v=${want}${pinned[asset] ? ' (scripts/chrome.cjs)' : ''}`);
  }
}
try {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/chrome.cjs'), '--check'], { cwd: ROOT, stdio: 'pipe' });
} catch (e) {
  for (const f of String(e.stderr).split('\n').slice(1).map((s) => s.trim()).filter(Boolean)) {
    fail(f, 'header or footer differs from scripts/chrome.cjs, so the deploy rewrites it. Run: node scripts/chrome.cjs and commit');
  }
}

/* ---------- 3. changed assets got a new ?v= ---------- */
if (baseArg) {
  const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  let changed = null;
  try { changed = git('diff', '--name-only', `${baseArg}...HEAD`).split('\n').filter(Boolean); } catch (e) {
    console.warn(`note: cannot diff against ${baseArg}, skipping the version-bump check (${String(e.stderr).trim()})`);
  }
  if (changed) {
    const atBase = {};
    for (const f of Object.keys(src)) { try { atBase[f] = git('show', `${baseArg}:${f}`); } catch { /* new page */ } }
    const verBase = versions(atBase);
    let chromeBase = '';
    try { chromeBase = git('show', `${baseArg}:scripts/chrome.cjs`); } catch { /* none */ }
    const pinnedBase = { 'nav.css': (chromeBase.match(/const NAV_CSS = (\d+)/) || [])[1], 'nav.js': (chromeBase.match(/const NAV_JS = (\d+)/) || [])[1] };
    for (const c of changed.filter((x) => x.startsWith('assets/'))) {
      const asset = c.slice('assets/'.length);
      if (!verNow[asset] || !verBase[asset]) continue;
      const before = pinnedBase[asset] ? new Set([pinnedBase[asset]]) : new Set(Object.keys(verBase[asset]));
      const now = pinned[asset] ? [pinned[asset]] : Object.keys(verNow[asset]);
      const stale = now.filter((v) => before.has(v));
      if (stale.length) fail(c, `changed since ${baseArg} but pages still link ?v=${stale.join(',')}; browsers keep the old copy for 30 days. Bump the version${pinned[asset] ? ' in scripts/chrome.cjs' : ' in every page that links it'}`);
    }
  }
}

/* ---------- 4. sitemaps and the tool count ---------- */
const read = (f) => fs.readFileSync(path.join(tmp, f), 'utf8');
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
const index = read('seo/sitemap.xml');
const inSitemaps = new Map(); // url path -> sitemap file
for (const loc of locs(index)) {
  const name = loc.replace(SITE, '').replace(/^\//, '');
  if (!fs.existsSync(path.join(tmp, 'seo', name))) { fail('sitemap.xml', `lists ${loc}, which is not in the repo`); continue; }
  for (const u of locs(read('seo/' + name))) {
    if (!SITE.test(u)) { fail(name, `${u} is not on aashishpandey.com`); continue; }
    const p = u.replace(SITE, '') || '/';
    if (inSitemaps.has(p)) fail(name, `${p} is listed twice (also in ${inSitemaps.get(p)})`);
    inSitemaps.set(p, name);
    const why = resolve(p);
    if (why) fail(name, `lists ${p} (${why})`);
    else if (redirects.some((r) => r.re.test(p))) fail(name, `lists ${p}, which redirects; list the destination instead`);
  }
}
for (const f of fs.readdirSync(path.join(ROOT, 'seo')).filter((x) => /^sitemap-.*\.xml$/.test(x))) {
  if (!locs(index).some((l) => l.endsWith('/' + f))) fail('sitemap.xml', `does not list ${f}`);
}
// every routed page should be in a sitemap unless it says noindex
for (const [f, routes] of Object.entries(routesOf)) {
  if (!f.endsWith('.dc.html') || !src[f]) continue;
  if (/<meta[^>]+name="robots"[^>]+noindex/i.test(src[f])) {
    for (const r of routes) if (inSitemaps.has(r)) fail(inSitemaps.get(r), `lists ${r}, but ${f} is noindex`);
    continue;
  }
  if (!routes.some((r) => inSitemaps.has(r))) fail(f, `served at ${routes[0]} but in no sitemap. Add it to scripts/sitemap.cjs and run it`);
}
// one tool = one top-level /tools/<slug> page
const toolPaths = [...inSitemaps.keys()].filter((p) => /^\/tools\/[^/]+$/.test(p)).sort();
const N = toolPaths.length;
const hubFile = (vercel.rewrites || []).find((r) => r.source === '/tools')?.destination.replace(/^\//, '');
if (hubFile && src[hubFile]) {
  const hub = src[hubFile];
  const list = hub.match(/"@type":"ItemList","numberOfItems":(\d+),"itemListElement":(\[[\s\S]*?\])\}/);
  if (!list) fail(hubFile, 'no ItemList structured data found for the tool count check');
  else {
    if (+list[1] !== N) fail(hubFile, `ItemList numberOfItems is ${list[1]}, the sitemaps have ${N} tools`);
    const urls = [...list[2].matchAll(/"url":"([^"]+)"/g)].map((m) => m[1].replace(SITE, '')).filter((p) => /^\/tools\/[^/]+$/.test(p));
    if (urls.length !== +list[1]) fail(hubFile, `ItemList numberOfItems is ${list[1]} but it holds ${urls.length} tools`);
    for (const p of toolPaths) if (!urls.includes(p)) fail(hubFile, `ItemList is missing ${p}, which is in the sitemaps`);
    for (const p of urls) if (!toolPaths.includes(p)) fail(hubFile, `ItemList has ${p}, which is in no sitemap`);
  }
  const cards = new Set([...hub.replace(/<!-- ap-(nav|foot):start -->[\s\S]*?<!-- ap-\1:end -->/g, '').matchAll(/href="(\/tools\/[^"/#?]+)"/g)].map((m) => m[1]));
  for (const p of toolPaths) if (!cards.has(p)) fail(hubFile, `the hub page does not link ${p}`);
  for (const m of hub.matchAll(/\b(\d+) (?:free )?tools\b/g)) if (+m[1] !== N) fail(hubFile, `says "${m[0]}", the sitemaps have ${N} tools`);
}
for (const [f, html] of Object.entries(src)) {
  for (const m of new Set([...html.matchAll(/All (\d+) tools/g)].map((x) => x[1]))) if (+m !== N) fail(f, `says "All ${m} tools", the sitemaps have ${N}`);
}

/* ---------- report ---------- */
fs.rmSync(tmp, { recursive: true, force: true });
const seen = new Set();
const out = problems.filter((p) => { const k = p.file + '\0' + p.msg; return !seen.has(k) && seen.add(k); });
if (!out.length) {
  console.log(`site check passed: ${builtPages.length} pages, ${checked} internal links and assets, ${inSitemaps.size} sitemap URLs, ${N} tools`);
  process.exit(0);
}
out.sort((a, b) => (a.file > b.file ? 1 : a.file < b.file ? -1 : 0));
for (const p of out) {
  console.log(`${p.file}: ${p.msg}`);
  if (GH) console.log(`::error file=${p.file},title=Site check::${p.msg.replace(/%/g, '%25').replace(/\r?\n/g, '%0A')}`);
}
console.log(`\n${out.length} problem(s) found`);
process.exit(1);
