// Pop-ups built in the admin ("Pop-ups" tab): several pop-ups, each with a layout, a look, blocks (heading, text, picture, fields, buttons),
// rules for where it shows, triggers for when, and how often. Plus anonymous stats.
//   cfg:popups     { on, ver, inline, popups: [ ... ] }  (see DEFAULTS). Everything is checked here, so the public script never receives free HTML or free colours:
//                  text is plain text (the page inserts it with textContent), colours come only from the THEMES and ACCENTS tables below,
//                  links and pictures must be this site's own paths or https addresses.
//   popups:log     who changed what (plus the signed activity log the admin handler writes for every save)
//   pp:<yyyymmdd>  hash "<shown|dismiss|click>|<pop-up id>|<page>" = count. No cookies, no ids, no IPs: just a counter per day.
// The public pages read /api/config?a=popups (CDN-cached for 5 minutes). If that fails, the script uses the same built-in defaults as DEFAULTS.
const crypto = require('crypto');
const { redis } = require('../_lib');
const cfg = require('./cfg');
const { clean } = require('../_mail');

const TYPES = { blog: 'Blog', services: 'Services', cases: 'Case studies', tools: 'Tools', other: 'Other pages' };
// Pages that never get a pop-up, whatever the settings say: forms people must finish, legal pages and the admin.
const NEVER = ['/contact', '/privacy', '/terms', '/cookies', '/image-license', '/newsletter', '/api', '/kd2ozfuew9n4uaciyl1j'];

const THEMES = {
  dusk: { name: 'Dusk (the site colours)', bg: '#0f1433', fg: '#f4efe6', mute: '#b9b3c6', line: '#f4efe62e', field: '#f4efe60d', light: false },
  night: { name: 'Night (darker)', bg: '#080a1c', fg: '#f4efe6', mute: '#a9a3b8', line: '#f4efe629', field: '#f4efe60f', light: false },
  paper: { name: 'Paper (light)', bg: '#f4efe6', fg: '#1a1420', mute: '#5b5468', line: '#1a14202e', field: '#1a14200d', light: true },
  stop: { name: 'Stop card (navy)', bg: '#141a44', fg: '#f4efe6', mute: '#b9b3c6', line: '#f4efe633', field: '#f4efe60f', light: false },
};
const ACCENTS = {
  amber: { name: 'Amber', bg: '#f5b867', ink: '#1a1420', link: '#f5b867', linkOnLight: '#8a5a12' },
  teal: { name: 'Teal', bg: '#7ff3e1', ink: '#07151a', link: '#7ff3e1', linkOnLight: '#0b6b60' },
  coral: { name: 'Coral', bg: '#ff9d8a', ink: '#2a0a0a', link: '#ff9d8a', linkOnLight: '#a63a28' },
  violet: { name: 'Violet', bg: '#b9a4ff', ink: '#140d33', link: '#b9a4ff', linkOnLight: '#4b36b0' },
};
const LAYOUTS = {
  'corner-right': 'Corner, bottom right', 'corner-left': 'Corner, bottom left', 'bar-bottom': 'Full-width bar, bottom', 'bar-top': 'Full-width bar, top',
  center: 'Centred card', takeover: 'Full screen',
};
const RADII = { soft: 'Soft corners', sharp: 'Sharp corners', round: 'Very round' };
const WIDTHS = { narrow: 'Narrow', normal: 'Normal', wide: 'Wide' };
const BLOCKS = { heading: 'Headline', text: 'Text', image: 'Picture', email: 'Email box', field: 'Extra field', button: 'Button', links: 'Links line', note: 'Small print', divider: 'Divider' };
const FIELD_KINDS = { name: 'Name', text: 'Short text', select: 'Choice list', checkbox: 'Tick box' };
const TRIGGERS = { load: 'As soon as the page loads', delay: 'After some seconds on the page', scroll: 'After scrolling down', exit: 'When a desktop visitor moves to leave', use: 'After a tool is used (tool pages)', idle: 'After the visitor goes quiet' };
const LIMITS = { delay: [1, 3600], scroll: [1, 100], use: [0, 600], idle: [3, 600], min: [0, 3600], perVisit: [0, 50], quietDays: [0, 365], again: [0, 3600], maxPopups: 6, maxBlocks: 14, maxFields: 4 };
const MAXLEN = { name: 40, heading: 100, text: 300, button: 30, label: 40, note: 200, success: 160, dismiss: 24, placeholder: 40, option: 40 };

const blk = (t, o) => ({ t, ...o });
const NEWSLETTER_BLOCKS = [
  blk('heading', { text: 'New free tools, by email' }),
  blk('text', { text: 'At most one email a month, plus one practical tip. Unsubscribe in one click.' }),
  blk('email', { placeholder: 'you@example.com' }),
  blk('button', { text: 'Subscribe', action: 'subscribe' }),
  blk('links'),
];
const RULES = () => ({ types: { blog: true, services: true, cases: true, tools: true, other: true }, include: [], exclude: ['/', '/portfolio'], devices: { desktop: true, phone: true } });
const TRIG = () => [{ k: 'scroll', n: 40, min: 12 }, { k: 'use', n: 12 }, { k: 'delay', n: 45 }];
const POPUP = () => ({
  id: 'news', name: 'Newsletter card', on: true, layout: 'corner-right',
  look: { theme: 'dusk', accent: 'amber', radius: 'soft', width: 'normal', backdrop: false },
  blocks: NEWSLETTER_BLOCKS.map((b) => ({ ...b })), success: '', dismiss: 'No thanks',
  rules: RULES(), triggers: TRIG(), freq: { perVisit: 1, quietDays: 60, again: 0 },
});
const DEFAULTS = { on: true, ver: 1, inline: { on: true, head: 'Done. Want the next free tool too?' }, popups: [POPUP()] };

// Ready-made starting points, all drawn from the site's own colours. The admin copies one into a new pop-up.
const FREQ = (q) => ({ perVisit: 1, quietDays: q, again: 0 });
const TEMPLATES = [
  { key: 'corner', name: 'Corner card', note: 'The quiet default. A small card that slides in at the bottom right.', popup: { name: 'Corner card', layout: 'corner-right', look: { theme: 'dusk', accent: 'amber', radius: 'soft', width: 'normal', backdrop: false }, blocks: NEWSLETTER_BLOCKS, rules: RULES(), triggers: TRIG(), freq: FREQ(60) } },
  { key: 'bar', name: 'Light bottom bar', note: 'A full-width paper strip along the bottom. The email box and button sit beside the words.', popup: { name: 'Bottom bar', layout: 'bar-bottom', look: { theme: 'paper', accent: 'teal', radius: 'sharp', width: 'normal', backdrop: false }, blocks: [blk('heading', { text: 'Enjoying the read?' }), blk('text', { text: 'One practical email a month. Unsubscribe in one click.' }), blk('email', { placeholder: 'you@example.com' }), blk('button', { text: 'Subscribe', action: 'subscribe' }), blk('links')], rules: RULES(), triggers: [{ k: 'scroll', n: 50, min: 10 }, { k: 'delay', n: 45 }], freq: FREQ(60) } },
  { key: 'top', name: 'Top banner', note: 'A thin bar at the top of the page for an announcement with a link. No email box.', popup: { name: 'Top banner', layout: 'bar-top', look: { theme: 'night', accent: 'teal', radius: 'sharp', width: 'normal', backdrop: false }, blocks: [blk('text', { text: 'New free tool: project estimate calculator.' }), blk('button', { text: 'Try it', action: 'link', href: '/tools/project-estimate-calculator' })], rules: RULES(), triggers: [{ k: 'load' }], freq: FREQ(7) } },
  { key: 'center', name: 'Centred spotlight', note: 'A card in the middle of the page over a soft backdrop, with a name box. Phones get a bottom sheet instead.', popup: { name: 'Spotlight', layout: 'center', look: { theme: 'stop', accent: 'amber', radius: 'round', width: 'normal', backdrop: true }, blocks: [blk('heading', { text: 'Get the next free tool first' }), blk('text', { text: 'One practical email a month. No spam, one-click unsubscribe.' }), blk('field', { kind: 'name', label: 'First name', required: false }), blk('email', { placeholder: 'you@example.com' }), blk('button', { text: 'Send me the next one', action: 'subscribe' }), blk('links')], rules: RULES(), triggers: [{ k: 'delay', n: 20 }, { k: 'exit' }], freq: FREQ(90) } },
  { key: 'takeover', name: 'Full screen', note: 'Fills the screen with a big headline and a choice question. Use sparingly. Phones get a bottom sheet instead.', popup: { name: 'Full screen', layout: 'takeover', look: { theme: 'night', accent: 'amber', radius: 'soft', width: 'wide', backdrop: true }, blocks: [blk('heading', { text: 'Free tools, straight to your inbox' }), blk('text', { text: 'Join for one practical email a month. Unsubscribe in one click.' }), blk('field', { kind: 'select', label: 'What do you do?', options: ['Founder', 'Marketer', 'Designer', 'Developer', 'Other'], required: false }), blk('email', { placeholder: 'you@example.com' }), blk('button', { text: 'Subscribe', action: 'subscribe' }), blk('links')], rules: RULES(), triggers: [{ k: 'exit' }], freq: FREQ(90) } },
  { key: 'promo', name: 'Promo with picture', note: 'A corner card with a picture and a link button, for a launch or an offer.', popup: { name: 'Promo', layout: 'corner-left', look: { theme: 'stop', accent: 'coral', radius: 'soft', width: 'normal', backdrop: false }, blocks: [blk('image', { src: '/assets/og-image.jpg', alt: '' }), blk('heading', { text: 'Need a custom tool, site or store?' }), blk('text', { text: 'Tell me what you need and I will reply within a day.' }), blk('button', { text: 'Send a brief', action: 'link', href: '/contact' })], rules: RULES(), triggers: [{ k: 'scroll', n: 60, min: 15 }], freq: FREQ(14) } },
];

/* ---------- checking input ---------- */
const num = (v, [lo, hi], def) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : def; };
const bool = (v, def) => (v === undefined || v === null ? def : v === true || v === 'true' || v === 1);
const pick = (v, table, def) => (typeof v === 'string' && Object.prototype.hasOwnProperty.call(table, v) ? v : def);
// one line of plain text: no tags, no line breaks, no control characters
const line = (v, max) => clean(String(v == null ? '' : v).replace(/[<>]/g, '').replace(/\s+/g, ' '), max);
const okUrl = (u) => /^(https:\/\/|\/(?!\/))[^\s<>"'\\]{0,300}$/.test(u);
const okImg = (u) => /^\/(?!\/)[A-Za-z0-9._~\/%-]{1,200}$/.test(u) || /^https:\/\/[^\s<>"'\\]{4,300}$/.test(u);

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
const newId = () => crypto.randomBytes(5).toString('hex').slice(0, 8);

function normBlock(b, label) {
  const t = pick(b && b.t, BLOCKS, '');
  if (!t) return null;
  const o = { t };
  if (t === 'heading') o.text = line(b.text, MAXLEN.heading);
  else if (t === 'text') o.text = line(b.text, MAXLEN.text);
  else if (t === 'note') o.text = line(b.text, MAXLEN.note);
  else if (t === 'image') {
    const src = String(b.src || '').trim();
    if (src && !okImg(src)) throw new Error(`${label}: the picture address must be a path on this site (like /assets/me-ride.webp) or an https:// address.`);
    o.src = src; o.alt = line(b.alt, 120);
  } else if (t === 'email') o.placeholder = line(b.placeholder, MAXLEN.placeholder) || 'you@example.com';
  else if (t === 'field') {
    o.kind = pick(b.kind, FIELD_KINDS, 'text'); o.label = line(b.label, MAXLEN.label) || FIELD_KINDS[o.kind]; o.required = bool(b.required, false);
    if (o.kind === 'select') {
      const raw = Array.isArray(b.options) ? b.options : String(b.options || '').split(/[\n,]+/);
      o.options = [...new Set(raw.map((x) => line(x, MAXLEN.option)).filter(Boolean))].slice(0, 10);
      if (o.options.length < 2) throw new Error(`${label}: a choice list needs at least two options.`);
    }
  } else if (t === 'button') {
    o.action = b.action === 'link' ? 'link' : 'subscribe'; o.text = line(b.text, MAXLEN.button) || (o.action === 'link' ? 'Learn more' : 'Subscribe');
    if (o.action === 'link') { o.href = String(b.href || '').trim(); if (!okUrl(o.href)) throw new Error(`${label}: the button link must start with https:// or / (for example /contact).`); }
  }
  return o;
}
function normTrigger(x) {
  const k = pick(x && x.k, TRIGGERS, '');
  if (!k) return null;
  const o = { k };
  if (k === 'delay') o.n = num(x.n, LIMITS.delay, 12);
  if (k === 'scroll') { o.n = num(x.n, LIMITS.scroll, 40); o.min = num(x.min, LIMITS.min, 0); }
  if (k === 'use') o.n = num(x.n, LIMITS.use, 12);
  if (k === 'idle') o.n = num(x.n, LIMITS.idle, 20);
  if (k === 'exit' || k === 'load') o.min = num(x.min, LIMITS.min, 0);
  return o;
}
function normPopup(x, i, used) {
  x = x && typeof x === 'object' ? x : {};
  const d = POPUP();
  let id = typeof x.id === 'string' && /^[a-z0-9]{3,12}$/.test(x.id) && !used.has(x.id) ? x.id : newId();
  while (used.has(id)) id = newId();
  used.add(id);
  const name = line(x.name, MAXLEN.name) || `Pop-up ${i + 1}`, L = x.look && typeof x.look === 'object' ? x.look : {}, R = x.rules && typeof x.rules === 'object' ? x.rules : {}, F = x.freq && typeof x.freq === 'object' ? x.freq : {};
  const blocks = (Array.isArray(x.blocks) ? x.blocks : d.blocks).slice(0, LIMITS.maxBlocks).map((b) => normBlock(b, name)).filter(Boolean);
  if (blocks.filter((b) => b.t === 'field').length > LIMITS.maxFields) throw new Error(`${name}: at most ${LIMITS.maxFields} extra fields.`);
  if (!blocks.length) throw new Error(`${name}: add at least one block.`);
  const subscribe = blocks.some((b) => b.t === 'button' && b.action === 'subscribe');
  if (subscribe && !blocks.some((b) => b.t === 'email')) throw new Error(`${name}: a Subscribe button needs an Email box.`);
  if (!subscribe && blocks.some((b) => b.t === 'email')) throw new Error(`${name}: an Email box needs a Subscribe button.`);
  if (!subscribe && blocks.some((b) => b.t === 'field')) throw new Error(`${name}: extra fields only work together with an Email box and a Subscribe button.`);
  blocks.forEach((b, n) => { if (b.t === 'field') b.id = 'f' + n; });   // a stable key for each extra field, from its place in the list
  const triggers = (Array.isArray(x.triggers) ? x.triggers : d.triggers).slice(0, 5).map(normTrigger).filter(Boolean);
  if (!triggers.length) throw new Error(`${name}: choose at least one trigger (when it shows).`);
  const types = {}; for (const k of Object.keys(TYPES)) types[k] = bool((R.types || {})[k], true);
  return {
    id, name, on: bool(x.on, true), layout: pick(x.layout, LAYOUTS, 'corner-right'),
    look: { theme: pick(L.theme, THEMES, 'dusk'), accent: pick(L.accent, ACCENTS, 'amber'), radius: pick(L.radius, RADII, 'soft'), width: pick(L.width, WIDTHS, 'normal'), backdrop: bool(L.backdrop, false) },
    blocks, success: line(x.success, MAXLEN.success), dismiss: line(x.dismiss, MAXLEN.dismiss) || 'No thanks',
    rules: { types, include: paths(R.include === undefined ? [] : R.include, `${name}: the "always show" list`), exclude: paths(R.exclude === undefined ? [] : R.exclude, `${name}: the "never show" list`), devices: { desktop: bool((R.devices || {}).desktop, true), phone: bool((R.devices || {}).phone, true) } },
    triggers, freq: { perVisit: num(F.perVisit, LIMITS.perVisit, 1), quietDays: num(F.quietDays, LIMITS.quietDays, 60), again: num(F.again, LIMITS.again, 0) },
  };
}
// Turn anything the admin sends into a complete, valid settings object. Unknown keys are dropped; bad numbers are pulled into range.
function normalize(n, base) {
  const x = n && typeof n === 'object' ? n : {}, c = base || DEFAULTS;
  const list = Array.isArray(x.popups) ? x.popups : c.popups;
  if (list.length > LIMITS.maxPopups) throw new Error(`At most ${LIMITS.maxPopups} pop-ups.`);
  const used = new Set(), I = x.inline && typeof x.inline === 'object' ? x.inline : {};
  return {
    on: bool(x.on, c.on), ver: c.ver,
    inline: { on: bool(I.on, c.inline.on), head: line(I.head === undefined ? c.inline.head : I.head, 100) || DEFAULTS.inline.head },
    popups: list.map((p, i) => normPopup(p, i, used)),
  };
}
// the first version of this feature kept one pop-up's settings in a flat object; turn it into the new shape
function migrate(raw) {
  if (!raw || raw.popups !== undefined || !(raw.surfaces || raw.copy || raw.limits)) return raw;
  const p = POPUP(), cp = (raw.copy && raw.copy.default) || {}, lk = raw.look || {}, T = raw.triggers || {}, L = raw.limits || {}, S = raw.surfaces || {};
  p.layout = lk.position === 'left' ? 'corner-left' : lk.position === 'bar' ? 'bar-bottom' : 'corner-right';
  p.look = { ...p.look, theme: lk.theme || 'dusk', accent: lk.accent || 'amber' };
  p.blocks = [blk('heading', { text: cp.head || NEWSLETTER_BLOCKS[0].text }), blk('text', { text: cp.body || NEWSLETTER_BLOCKS[1].text }), blk('email', { placeholder: 'you@example.com' }), blk('button', { text: cp.button || 'Subscribe', action: 'subscribe' }), blk('links')];
  p.success = cp.success || ''; p.dismiss = cp.dismiss || 'No thanks';
  p.rules = { types: raw.types || p.rules.types, include: raw.include || [], exclude: raw.exclude || ['/', '/portfolio'], devices: raw.devices || p.rules.devices };
  const d = L.delay || 0;
  p.triggers = [];
  if (S.reading !== false) p.triggers.push({ k: 'scroll', n: T.scroll || 40, min: Math.max(d, T.seconds || 12) }, { k: 'delay', n: Math.max(d, T.fallback || 45) });
  if (S.tool !== false) p.triggers.push({ k: 'use', n: T.afterUse || 12 }, ...(S.reading === false ? [{ k: 'delay', n: Math.max(d, T.toolFallback || 40) }] : []));
  if (T.exit) p.triggers.push({ k: 'exit', min: d });
  if (!p.triggers.length) { p.triggers = TRIG(); p.on = false; }
  p.on = p.on && (S.reading !== false || S.tool !== false);
  p.freq = { perVisit: L.perVisit || 1, quietDays: L.quietDays === undefined ? 60 : L.quietDays, again: 0 };
  return { on: raw.on !== false, ver: raw.ver || 1, inline: { on: S.afterUse !== false, head: raw.doneHead || DEFAULTS.inline.head }, popups: [p] };
}

async function get() {
  const raw = migrate(await cfg.get('popups', {}));
  let out; try { out = normalize(raw, DEFAULTS); } catch (e) { out = normalize({}, DEFAULTS); }
  out.ver = Math.max(1, parseInt(raw && raw.ver, 10) || 1);   // the version belongs to what was saved, not to the defaults
  return out;
}
const style = (look) => {
  const t = THEMES[look.theme] || THEMES.dusk, a = ACCENTS[look.accent] || ACCENTS.amber;
  return { bg: t.bg, fg: t.fg, mute: t.mute, line: t.line, field: t.field, accent: a.bg, ink: a.ink, link: t.light ? a.linkOnLight : a.link };
};
// what the public pages get: only the pop-ups that are switched on, with the colours already resolved
function publicConfig(c) {
  return { on: c.on, ver: c.ver, inline: c.inline, never: NEVER, popups: c.on ? c.popups.filter((p) => p.on).map((p) => ({ ...p, style: style(p.look) })) : [] };
}
const meta = () => ({ types: TYPES, themes: THEMES, accents: ACCENTS, layouts: LAYOUTS, radii: RADII, widths: WIDTHS, blocks: BLOCKS, fieldKinds: FIELD_KINDS, triggers: TRIGGERS, limits: LIMITS, maxlen: MAXLEN, never: NEVER, templates: TEMPLATES });

/* ---------- saving, with a change history ---------- */
const flat = (c) => {
  const o = { 'on': c.on, 'inline.on': c.inline.on, 'inline.head': c.inline.head };
  for (const p of c.popups) {
    const put = (path, v) => { o[`${p.name}|${path}`] = v; };
    put('(exists)', true); put('on', p.on); put('layout', p.layout);
    for (const f of Object.keys(p.look)) put(`look ${f}`, p.look[f]);
    put('blocks', JSON.stringify(p.blocks)); put('triggers', JSON.stringify(p.triggers)); put('success', p.success); put('dismiss', p.dismiss);
    for (const f of Object.keys(p.freq)) put(`frequency ${f}`, p.freq[f]);
    for (const f of ['types', 'devices']) put(f, JSON.stringify(p.rules[f]));
    put('never show on', p.rules.exclude.join(', ')); put('always show on', p.rules.include.join(', '));
  }
  return o;
};
const shown = (v) => (typeof v === 'boolean' ? (v ? 'on' : 'off') : String(v === undefined || v === null ? '' : v).slice(0, 140));
function diff(a, b) {
  const x = flat(a), y = flat(b), out = [];
  for (const k of Object.keys(y)) {
    if (shown(x[k]) === shown(y[k])) continue;
    const [pop, path] = k.split('|');
    if (path === undefined) { out.push({ field: k === 'on' ? 'all pop-ups' : k.replace('inline.', 'after-use offer '), before: shown(x[k]), after: shown(y[k]) }); continue; }
    if (path === '(exists)') { out.push({ field: `pop-up added: ${pop}`, before: '', after: 'new' }); continue; }
    const big = path === 'blocks' || path === 'triggers' || path === 'types' || path === 'devices';
    if (!(`${pop}|(exists)` in x) ) continue;   // a brand-new pop-up is logged once, as added
    out.push({ field: `${pop}: ${path}${big ? ' changed' : ''}`, before: big ? '' : shown(x[k]), after: big ? '' : shown(y[k]) });
  }
  for (const k of Object.keys(x)) { const [pop, path] = k.split('|'); if (path === '(exists)' && !(k in y)) out.push({ field: `pop-up removed: ${pop}`, before: 'existed', after: '' }); }
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

// The extra fields a visitor filled in, checked against what the pop-up defines. Returns { label: value }.
async function readFields(popupId, input) {
  const c = await get(), p = c.popups.find((x) => x.id === popupId);
  if (!p || !input || typeof input !== 'object') return {};
  const out = {};
  for (const b of p.blocks) {
    if (b.t !== 'field' || b.kind === 'name') continue;
    const raw = input[b.id];
    let v = b.kind === 'checkbox' ? (raw === true || raw === 'yes' || raw === 'on' ? 'yes' : '') : line(raw, 120);
    if (b.kind === 'select' && v && !b.options.includes(v)) v = '';
    if (v) out[b.label] = v;
  }
  return out;
}
const knownId = async (id) => id === 'inline' || (await get()).popups.some((p) => p.id === id);

/* ---------- anonymous event counters ---------- */
const ymd = (t) => new Date(t + 5.5 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');   // days in IST
const pageKey = (p) => { const s = normPath(String(p || '').split('?')[0]); return s ? s.slice(0, 60) : ''; };
const typeOf = (p) => (/^\/tools(\/|$)/.test(p) ? 'tools' : /^\/blog(\/|$)/.test(p) ? 'blog' : /^\/(services|freelance|full-stack|seo-|shopify|tech-consult|ui-ux|wordpress)/.test(p) ? 'services' : /^\/(case-studies|work(-[a-z0-9-]+)?)(\/|$)/.test(p) ? 'cases' : 'other');
async function hit(kind, id, page) {
  if (!['shown', 'dismiss', 'click'].includes(kind) || !/^[a-z0-9]{3,12}$/.test(id) || !(await knownId(id))) return false;
  const k = 'pp:' + ymd(Date.now());
  await redis('HINCRBY', k, `${kind}|${id}|${pageKey(page) || '?'}`, 1);
  await redis('EXPIRE', k, 400 * 86400);
  return true;
}
const pairs = (arr) => { const o = {}; for (let i = 0; arr && i < arr.length; i += 2) o[arr[i]] = Number(arr[i + 1]) || 0; return o; };
// rows: the store's subscribers (signed up through a pop-up when `via` says so: pop-<id>, or the older reading, card and after-use)
async function stats(days, rows) {
  days = [7, 30, 90].includes(Number(days)) ? Number(days) : 30;
  const now = Date.now(), list = [], conf = await get();
  for (let i = days - 1; i >= 0; i--) list.push(ymd(now - i * 864e5));
  const daily = await Promise.all(list.map((d) => redis('HGETALL', 'pp:' + d).then(pairs).catch(() => ({}))));
  const zero = () => ({ shown: 0, dismissed: 0, clicked: 0, subscribed: 0 });
  const names = { inline: 'After-use offer (inside the page)', earlier: 'Earlier pop-ups' };
  conf.popups.forEach((p) => { names[p.id] = p.name; });
  const byPopup = {}, byPage = {}, byType = {}, trend = list.map(() => 0);
  const slot = (id) => (byPopup[id] = byPopup[id] || zero());
  for (const t of Object.keys(TYPES)) byType[t] = zero();
  conf.popups.forEach((p) => slot(p.id)); slot('inline');
  const page = (p) => (byPage[p] = byPage[p] || zero());
  daily.forEach((h, i) => {
    for (const [f, n] of Object.entries(h)) {
      const [k, id, ...rest] = f.split('|'), p = rest.join('|');
      const s = k === 'shown' ? 'shown' : k === 'click' ? 'clicked' : 'dismissed';
      slot(names[id] ? id : 'earlier')[s] += n; byType[typeOf(p)][s] += n; page(p)[s] += n;
      if (k === 'shown') trend[i] += n;
    }
  });
  const since = now - days * 864e5, first = conf.popups[0] && conf.popups[0].id;
  for (const r of rows || []) {
    if (r.type !== 'subscriber' || r.status !== 'subscribed' || (r.confirmed || r.created) < since) continue;
    const via = String(r.via || ''); let id = '';
    if (via.startsWith('pop-')) id = names[via.slice(4)] ? via.slice(4) : 'earlier';
    else if (via === 'reading' || via === 'card') id = first && conf.popups.length === 1 ? first : 'earlier';
    else if (via === 'after-use') id = 'inline';
    if (!id) continue;
    const p = pageKey(r.page) || '?';
    slot(id).subscribed += 1; byType[typeOf(p)].subscribed += 1; page(p).subscribed += 1;
  }
  const tot = zero(); for (const s of Object.values(byPopup)) { tot.shown += s.shown; tot.dismissed += s.dismissed; tot.clicked += s.clicked; tot.subscribed += s.subscribed; }
  const pages = Object.entries(byPage).map(([path, v]) => ({ path, ...v })).sort((a, b) => b.shown - a.shown || b.subscribed - a.subscribed).slice(0, 12);
  const popups = Object.keys(byPopup).filter((id) => names[id] && (conf.popups.some((p) => p.id === id) || byPopup[id].shown || byPopup[id].subscribed)).map((id) => ({ id, name: names[id], ...byPopup[id] }));
  return { days, total: tot, popups, types: byType, pages, trend, labels: list, resetAt: await lastReset() };
}

module.exports = { DEFAULTS, THEMES, ACCENTS, TYPES, LAYOUTS, TEMPLATES, LIMITS, NEVER, normalize, normPath, migrate, get, save, reset, history, publicConfig, meta, hit, stats, typeOf, lastReset, readFields, style };
