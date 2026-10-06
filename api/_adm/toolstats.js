// Free-tool usage counts. No cookies, no IPs, no ids: just a counter per tool per day, and where the visit came from per month.
//   tu:<yyyymmdd>        hash  "<tool>|v" = views, "<tool>|u" = visits where the tool was actually used (first click or typing)
//   tur:<yyyymm>         hash  "<tool>|<source>" = views by source (a page on this site, a search engine host, or "direct")
const { redis } = require('../_lib');

const TOOLS = {
  'pad': 'Notepad', 'url-shortener': 'URL shortener', 'image-resizer': 'Image resizer', 'exam-photo-resizer': 'Exam photo and signature resizer',
  'lorem-ipsum-generator': 'Lorem ipsum generator', 'qr-code-generator': 'QR code generator', 'qr-code-checker': 'QR code checker',
  'website-launch-checklist': 'Website launch checklist', 'exif-remover': 'EXIF remover', 'file-hash-checker': 'File hash checker',
  'password-generator': 'Password generator', 'time-zone-meeting-planner': 'Time zone meeting planner',
  'project-estimate-calculator': 'Project estimate calculator', 'invoice-generator': 'Invoice generator', 'sop-maker': 'SOP maker',
  'resume-maker': 'Resume maker', 'resume-keyword-matcher': 'Resume keyword matcher', 'p2p-file-sharing': 'P2P file sharing',
  'llm-token-counter': 'LLM token counter', 'robots-txt-generator': 'robots.txt generator', 'llms-txt-generator': 'llms.txt generator',
  'json-ld-schema-generator': 'JSON-LD schema generator',
};
const ymd = (t) => new Date(t + 5.5 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');   // days in IST
const toolOf = (path) => { const m = /^\/tools\/([a-z0-9-]+)/.exec(String(path || '')); return m && TOOLS[m[1]] ? m[1] : null; };
// a page on this site keeps its path; anything else is reduced to its host, so no full URLs (and no query strings) are kept
function sourceOf(ref, host) {
  if (!ref) return 'direct';
  let u; try { u = new URL(ref); } catch (e) { return 'direct'; }
  const h = u.hostname.replace(/^www\./, '');
  if (h === String(host || '').replace(/^www\./, '') || h === 'aashishpandey.com') return (u.pathname.replace(/\/+$/, '') || '/').slice(0, 60);
  return h.slice(0, 60);
}
async function hit(kind, path, ref, host) {
  const tool = toolOf(path); if (!tool) return false;
  const now = Date.now(), d = 'tu:' + ymd(now);
  await redis('HINCRBY', d, tool + '|' + (kind === 'use' ? 'u' : 'v'), 1); await redis('EXPIRE', d, 400 * 86400);
  if (kind !== 'use') { const m = 'tur:' + ymd(now).slice(0, 6); await redis('HINCRBY', m, tool + '|' + sourceOf(ref, host), 1); await redis('EXPIRE', m, 400 * 86400); }
  return true;
}
const pairs = (arr) => { const o = {}; for (let i = 0; arr && i < arr.length; i += 2) o[arr[i]] = Number(arr[i + 1]) || 0; return o; };

// briefs: a brief counts for a tool when it was sent from the tool page, or the visitor came to the form from it
async function stats(days, briefs) {
  days = Math.min(365, Math.max(7, Number(days) || 30));
  const now = Date.now(), list = [];
  for (let i = days - 1; i >= 0; i--) list.push(ymd(now - i * 864e5));
  const daily = await Promise.all(list.map((d) => redis('HGETALL', 'tu:' + d).then(pairs).catch(() => ({}))));
  const months = [...new Set(list.map((d) => d.slice(0, 6)))];
  const refs = await Promise.all(months.map((m) => redis('HGETALL', 'tur:' + m).then(pairs).catch(() => ({}))));
  const since = now - days * 864e5, out = {};
  for (const k of Object.keys(TOOLS)) out[k] = { key: k, name: TOOLS[k], views: 0, uses: 0, briefs: 0, days: list.map(() => 0), sources: {} };
  daily.forEach((h, i) => { for (const [f, n] of Object.entries(h)) { const [t, k] = f.split('|'); if (!out[t]) continue; if (k === 'v') { out[t].views += n; out[t].days[i] += n; } else out[t].uses += n; } });
  refs.forEach((h) => { for (const [f, n] of Object.entries(h)) { const i = f.indexOf('|'), t = f.slice(0, i), s = f.slice(i + 1); if (out[t]) out[t].sources[s] = (out[t].sources[s] || 0) + n; } });
  for (const r of briefs || []) {
    if (r.type !== 'brief' || r.status === 'spam' || !(r.created > since)) continue;
    const t = toolOf(r.page) || toolOf(r.ref); if (t) out[t].briefs += 1;
  }
  const tools = Object.values(out).map((t) => ({ ...t, sources: Object.entries(t.sources).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => ({ key: k, n })) })).sort((a, b) => b.views - a.views || b.uses - a.uses);
  const totals = tools.reduce((s, t) => ({ views: s.views + t.views, uses: s.uses + t.uses, briefs: s.briefs + t.briefs }), { views: 0, uses: 0, briefs: 0 });
  const daysTotal = list.map((d, i) => tools.reduce((s, t) => s + t.days[i], 0));
  return { days, from: list[0], to: list[list.length - 1], totals, daysTotal, tools };
}
module.exports = { TOOLS, toolOf, sourceOf, hit, stats };
