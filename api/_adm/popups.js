// Newsletter pop-up settings, set from the admin ("Pop-ups" tab), and simple anonymous stats.
//   cfg:popups     the settings (see DEFAULTS). Everything is checked here, so the public script never receives free HTML or free colours:
//                  text is plain text (the page inserts it with textContent), colours come only from the THEMES and ACCENTS tables below.
//   popups:log     who changed what (plus the signed activity log the admin handler writes for every save)
//   pp:<yyyymmdd>  hash "<shown|dismiss>|<surface>|<page>" = count. No cookies, no ids, no IPs: just a counter per day.
// The public pages read /api/config?a=popups (CDN-cached for 5 minutes). If that fails, the script uses the same built-in defaults as DEFAULTS.
const { redis } = require('../_lib');
const cfg = require('./cfg');
const { clean } = require('../_mail');

const SURFACES = { reading: 'Reading card', tool: 'Tool corner card', afterUse: 'After-use offer' };
const TYPES = { blog: 'Blog', services: 'Services', cases: 'Case studies', tools: 'Tools', other: 'Other pages' };
const VIA_SURFACE = { reading: 'reading', card: 'tool', 'after-use': 'afterUse' };   // what /api/subscribe records as `via`, mapped to the surface it came from
// Pages that never get a pop-up, whatever the settings say: forms people must finish, legal pages and the admin.
const NEVER = ['/contact', '/privacy', '/terms', '/cookies', '/image-license', '/newsletter', '/api', '/kd2ozfuew9n4uaciyl1j'];

const THEMES = {
  dusk: { name: 'Dusk (the site colours)', bg: '#0f1433', fg: '#f4efe6', mute: '#b9b3c6', line: '#f4efe62e', field: '#f4efe60d', light: false },
  night: { name: 'Night (darker)', bg: '#080a1c', fg: '#f4efe6', mute: '#a9a3b8', line: '#f4efe629', field: '#f4efe60f', light: false },
  paper: { name: 'Paper (light)', bg: '#f4efe6', fg: '#1a1420', mute: '#5b5468', line: '#1a14202e', field: '#1a14200d', light: true },
};
const ACCENTS = {
  amber: { name: 'Amber', bg: '#f5b867', ink: '#1a1420', link: '#f5b867', linkOnLight: '#8a5a12' },
  teal: { name: 'Teal', bg: '#7ff3e1', ink: '#07151a', link: '#7ff3e1', linkOnLight: '#0b6b60' },
  coral: { name: 'Coral', bg: '#ff9d8a', ink: '#2a0a0a', link: '#ff9d8a', linkOnLight: '#a63a28' },
  violet: { name: 'Violet', bg: '#b9a4ff', ink: '#140d33', link: '#b9a4ff', linkOnLight: '#4b36b0' },
};
const POSITIONS = { right: 'Bottom right corner', left: 'Bottom left corner', bar: 'Bottom bar (full width)' };

const COPY_BASE = { head: 'New free tools, by email', body: 'At most one email a month, plus one practical tip. Unsubscribe in one click.', button: 'Subscribe', success: '', dismiss: 'No thanks' };
const NO_COPY = { head: '', body: '', button: '', success: '', dismiss: '' };
const DEFAULTS = {
  on: true,
  ver: 1,                                                                    // raised by "ask everyone again": earlier "No thanks" answers stop counting
  surfaces: { reading: true, tool: true, afterUse: true },
  types: { blog: true, services: true, cases: true, tools: true, other: true },
  include: [],                                                               // show on these paths even when their page type is off
  exclude: ['/', '/portfolio'],                                             // never on these (a path also covers the pages under it; '/' is the home page only)
  devices: { desktop: true, phone: true },
  limits: { delay: 8, perVisit: 1, quietDays: 60 },
  triggers: { seconds: 12, scroll: 40, fallback: 45, afterUse: 12, toolFallback: 40, exit: false },
  look: { position: 'right', theme: 'dusk', accent: 'amber' },
  copy: { default: { ...COPY_BASE }, blog: { ...NO_COPY }, services: { ...NO_COPY }, cases: { ...NO_COPY }, tools: { ...NO_COPY }, other: { ...NO_COPY } },
  doneHead: 'Done. Want the next free tool too?',
};
// hard limits, shown to the owner in the admin too
const LIMITS = { delay: [5, 120], perVisit: [1, 3], quietDays: [1, 365], seconds: [5, 300], scroll: [10, 90], fallback: [15, 600], afterUse: [5, 300], toolFallback: [15, 600] };
const MAXLEN = { head: 80, body: 220, button: 24, success: 120, dismiss: 24, doneHead: 80 };

const num = (v, [lo, hi], def) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : def; };
const bool = (v, def) => (v === undefined || v === null ? def : v === true || v === 'true' || v === 1);
const pick = (v, table, def) => (Object.prototype.hasOwnProperty.call(table, v) ? v : def);
// one line of plain text: no tags, no line breaks, no control characters
const line = (v, max) => clean(String(v == null ? '' : v).replace(/[<>]/g, '').replace(/\s+/g, ' '), max);

// '/Blog/' → '/blog', a pasted full address → its path. Returns '' when it is not a path on this site.
function normPath(raw) {
  let s = String(raw || '').trim().toLowerCase();
  if (!s) return '';
  if (/^https?:\/\//.test(s)) { try { const u = new URL(s); if (!/^(www\.)?aashishpandey\.(com|online)$/.test(u.hostname)) return ''; s = u.pathname; } catch (e) { return ''; } }
  s = s.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (s.length > 100 || !/^\/[a-z0-9\-_.~/%]*$/.test(s) || s.includes('//') || s.includes('..')) return '';
  return s;
}
function paths(v, label) {
  const src = Array.isArray(v) ? v : String(v || '').split(/[\n,]+/);
  const out = [];
  for (const x of src) {
    if (!String(x).trim()) continue;
    const p = normPath(x);
    if (!p) throw new Error(`"${line(x, 40)}" in ${label} is not a path on this site. Use something like /blog or /tools/qr-code-generator.`);
    if (!out.includes(p)) out.push(p);
  }
  if (out.length > 40) throw new Error(`${label}: at most 40 paths.`);
  return out;
}

// Turn anything the admin sends into a complete, valid settings object. Unknown keys are dropped; bad numbers are pulled into range.
function normalize(n, base) {
  const d = DEFAULTS, c = base || d, x = n && typeof n === 'object' ? n : {};
  const o = (k) => (x[k] && typeof x[k] === 'object' ? x[k] : {});
  const out = {
    on: bool(x.on, c.on), ver: c.ver,
    surfaces: {}, types: {}, devices: {}, limits: {}, triggers: {}, look: {}, copy: {},
    include: x.include === undefined ? c.include : paths(x.include, 'the "always show" list'),
    exclude: x.exclude === undefined ? c.exclude : paths(x.exclude, 'the "never show" list'),
    doneHead: x.doneHead === undefined ? c.doneHead : line(x.doneHead, MAXLEN.doneHead) || d.doneHead,
  };
  for (const k of Object.keys(SURFACES)) out.surfaces[k] = bool(o('surfaces')[k], c.surfaces[k]);
  for (const k of Object.keys(TYPES)) out.types[k] = bool(o('types')[k], c.types[k]);
  for (const k of ['desktop', 'phone']) out.devices[k] = bool(o('devices')[k], c.devices[k]);
  const L = o('limits'), T = o('triggers');
  out.limits.delay = num(L.delay === undefined ? c.limits.delay : L.delay, LIMITS.delay, d.limits.delay);
  out.limits.perVisit = num(L.perVisit === undefined ? c.limits.perVisit : L.perVisit, LIMITS.perVisit, d.limits.perVisit);
  out.limits.quietDays = num(L.quietDays === undefined ? c.limits.quietDays : L.quietDays, LIMITS.quietDays, d.limits.quietDays);
  // no trigger may fire sooner than the minimum delay
  const floor = (k, v) => Math.max(out.limits.delay, num(v === undefined ? c.triggers[k] : v, LIMITS[k], d.triggers[k]));
  out.triggers.seconds = floor('seconds', T.seconds); out.triggers.fallback = Math.max(out.triggers.seconds, floor('fallback', T.fallback));
  out.triggers.scroll = num(T.scroll === undefined ? c.triggers.scroll : T.scroll, LIMITS.scroll, d.triggers.scroll);
  out.triggers.afterUse = Math.max(5, num(T.afterUse === undefined ? c.triggers.afterUse : T.afterUse, LIMITS.afterUse, d.triggers.afterUse));
  out.triggers.toolFallback = floor('toolFallback', T.toolFallback);
  out.triggers.exit = bool(T.exit, c.triggers.exit);
  const K = o('look');
  out.look.position = pick(K.position === undefined ? c.look.position : K.position, POSITIONS, d.look.position);
  out.look.theme = pick(K.theme === undefined ? c.look.theme : K.theme, THEMES, d.look.theme);
  out.look.accent = pick(K.accent === undefined ? c.look.accent : K.accent, ACCENTS, d.look.accent);
  const C = o('copy');
  for (const t of ['default', ...Object.keys(TYPES)]) {
    const src = C[t] && typeof C[t] === 'object' ? C[t] : null, cur = c.copy[t] || NO_COPY;
    out.copy[t] = {};
    for (const f of Object.keys(COPY_BASE)) {
      let v = src && src[f] !== undefined ? line(src[f], MAXLEN[f]) : cur[f];
      if (t === 'default' && !v && f !== 'success') v = COPY_BASE[f];   // the main wording never goes blank (a blank success line means the built-in one)
      out.copy[t][f] = v;
    }
  }
  return out;
}

async function get() {
  const raw = await cfg.get('popups', {});
  let out; try { out = normalize(raw, DEFAULTS); } catch (e) { out = normalize({}, DEFAULTS); }
  out.ver = Math.max(1, parseInt(raw && raw.ver, 10) || 1);   // the version belongs to what was saved, not to the defaults
  return out;
}
const style = (look) => {
  const t = THEMES[look.theme] || THEMES.dusk, a = ACCENTS[look.accent] || ACCENTS.amber;
  return { bg: t.bg, fg: t.fg, mute: t.mute, line: t.line, field: t.field, accent: a.bg, ink: a.ink, link: t.light ? a.linkOnLight : a.link };
};
// what the public pages get: the settings, with the colours already resolved
function publicConfig(c) {
  return { on: c.on, ver: c.ver, surfaces: c.surfaces, types: c.types, include: c.include, exclude: c.exclude, devices: c.devices, limits: c.limits, triggers: c.triggers, position: c.look.position, style: style(c.look), copy: c.copy, doneHead: c.doneHead, never: NEVER };
}
const meta = () => ({ surfaces: SURFACES, types: TYPES, themes: THEMES, accents: ACCENTS, positions: POSITIONS, limits: LIMITS, maxlen: MAXLEN, never: NEVER, copyBase: COPY_BASE });

/* ---------- saving, with a change history ---------- */
const FIELD = {
  on: 'pop-ups', 'surfaces.reading': 'reading card', 'surfaces.tool': 'tool corner card', 'surfaces.afterUse': 'after-use offer',
  'types.blog': 'on blog', 'types.services': 'on services', 'types.cases': 'on case studies', 'types.tools': 'on tools', 'types.other': 'on other pages',
  include: 'always show on', exclude: 'never show on', 'devices.desktop': 'on desktop', 'devices.phone': 'on phones',
  'limits.delay': 'minimum seconds on page', 'limits.perVisit': 'most per visit', 'limits.quietDays': 'quiet days after No thanks',
  'triggers.seconds': 'seconds before (reading)', 'triggers.scroll': 'scroll percent', 'triggers.fallback': 'seconds, if not scrolled', 'triggers.afterUse': 'seconds after using a tool', 'triggers.toolFallback': 'seconds, if tool unused', 'triggers.exit': 'exit intent',
  'look.position': 'position', 'look.theme': 'theme', 'look.accent': 'accent', doneHead: 'after-use headline',
};
const flat = (c) => {
  const o = {};
  for (const k of Object.keys(c)) {
    const v = c[k];
    if (k === 'ver') continue;
    if (k === 'copy') { for (const t of Object.keys(v)) for (const f of Object.keys(v[t])) o[`copy.${t}.${f}`] = v[t][f]; }
    else if (v && typeof v === 'object' && !Array.isArray(v)) for (const f of Object.keys(v)) o[`${k}.${f}`] = v[f];
    else o[k] = v;
  }
  return o;
};
const shown = (v) => (typeof v === 'boolean' ? (v ? 'on' : 'off') : Array.isArray(v) ? v.join(', ') : String(v === undefined || v === null ? '' : v).slice(0, 200));
function diff(a, b) {
  const x = flat(a), y = flat(b), out = [];
  for (const k of Object.keys(y)) {
    if (shown(x[k]) === shown(y[k])) continue;
    const m = /^copy\.(\w+)\.(\w+)$/.exec(k);
    const field = m ? `${m[1] === 'default' ? 'words' : (TYPES[m[1]] || m[1]) + ' words'}: ${m[2]}` : FIELD[k] || k;
    out.push({ field, before: shown(x[k]), after: shown(y[k]) });
  }
  return out;
}
async function logChanges(rows, by) {
  if (!rows.length) return;
  const t = Date.now();
  try {
    for (const r of rows.slice().reverse()) await redis('LPUSH', 'popups:log', JSON.stringify({ t, by: by || '', ...r }));
    await redis('LTRIM', 'popups:log', 0, 299);
  } catch (e) { console.error('popups log failed', e.message); }
}
async function history(n) {
  const rows = (await redis('LRANGE', 'popups:log', 0, Math.min(300, n || 100) - 1)) || [];
  return rows.map((r) => { try { return JSON.parse(r); } catch (e) { return null; } }).filter(Boolean);
}
// returns { cfg, changes }; throws a plain message when something is not allowed
async function save(b, by) {
  const cur = await get(), next = normalize(b, cur);
  next.ver = cur.ver;
  const changes = diff(cur, next);
  await cfg.set('popups', next);
  await logChanges(changes, by);
  return { cfg: next, changes };
}
// "ask everyone again": earlier "No thanks" answers stop counting. People who already subscribed are never asked.
async function reset(by) {
  const cur = await get(), next = { ...cur, ver: cur.ver + 1 };
  await cfg.set('popups', next);
  await logChanges([{ field: 'asked everyone again', before: 'version ' + cur.ver, after: 'version ' + next.ver }], by);
  await redis('SET', 'popups:reset', String(Date.now()));
  return next;
}
async function lastReset() { try { return Number(await redis('GET', 'popups:reset')) || 0; } catch (e) { return 0; } }

/* ---------- anonymous event counters ---------- */
const ymd = (t) => new Date(t + 5.5 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');   // days in IST
const pageKey = (p) => { const s = normPath(String(p || '').split('?')[0]); return s ? s.slice(0, 60) : ''; };
const typeOf = (p) => (/^\/tools(\/|$)/.test(p) ? 'tools' : /^\/blog(\/|$)/.test(p) ? 'blog' : /^\/services(\/|$)/.test(p) || /^\/(freelance|full-stack|seo-|shopify|tech-consult|ui-ux|wordpress)/.test(p) ? 'services' : /^\/(case-studies|work(-[a-z0-9-]+)?)(\/|$)/.test(p) ? 'cases' : 'other');
async function hit(kind, surface, page) {
  if (!['shown', 'dismiss'].includes(kind) || !SURFACES[surface]) return false;
  const k = 'pp:' + ymd(Date.now());
  await redis('HINCRBY', k, `${kind}|${surface}|${pageKey(page) || '?'}`, 1);
  await redis('EXPIRE', k, 400 * 86400);
  return true;
}
const pairs = (arr) => { const o = {}; for (let i = 0; arr && i < arr.length; i += 2) o[arr[i]] = Number(arr[i + 1]) || 0; return o; };
// rows: the store's subscribers (signed up through a pop-up when `via` says so)
async function stats(days, rows) {
  days = [7, 30, 90].includes(Number(days)) ? Number(days) : 30;
  const now = Date.now(), list = [];
  for (let i = days - 1; i >= 0; i--) list.push(ymd(now - i * 864e5));
  const daily = await Promise.all(list.map((d) => redis('HGETALL', 'pp:' + d).then(pairs).catch(() => ({}))));
  const zero = () => ({ shown: 0, dismissed: 0, subscribed: 0 });
  const bySurface = {}, byPage = {}, byType = {}, trend = list.map(() => 0);
  for (const s of Object.keys(SURFACES)) bySurface[s] = zero();
  for (const t of Object.keys(TYPES)) byType[t] = zero();
  const page = (p) => (byPage[p] = byPage[p] || zero());
  daily.forEach((h, i) => {
    for (const [f, n] of Object.entries(h)) {
      const [k, s, ...rest] = f.split('|'), p = rest.join('|');
      if (!bySurface[s]) continue;
      const slot = k === 'shown' ? 'shown' : 'dismissed';
      bySurface[s][slot] += n; byType[typeOf(p)][slot] += n; page(p)[slot] += n;
      if (k === 'shown') trend[i] += n;
    }
  });
  const since = now - days * 864e5;
  for (const r of rows || []) {
    if (r.type !== 'subscriber' || r.status !== 'subscribed') continue;
    const s = VIA_SURFACE[r.via]; if (!s || (r.confirmed || r.created) < since) continue;
    const p = pageKey(r.page) || '?';
    bySurface[s].subscribed += 1; byType[typeOf(p)].subscribed += 1; page(p).subscribed += 1;
  }
  const tot = zero(); for (const s of Object.values(bySurface)) { tot.shown += s.shown; tot.dismissed += s.dismissed; tot.subscribed += s.subscribed; }
  const pages = Object.entries(byPage).map(([path, v]) => ({ path, ...v })).sort((a, b) => b.shown - a.shown || b.subscribed - a.subscribed).slice(0, 12);
  return { days, total: tot, surfaces: bySurface, types: byType, pages, trend, labels: list, resetAt: await lastReset() };
}

module.exports = { DEFAULTS, THEMES, ACCENTS, SURFACES, TYPES, LIMITS, NEVER, normalize, normPath, get, save, reset, history, publicConfig, meta, hit, stats, typeOf, lastReset };
