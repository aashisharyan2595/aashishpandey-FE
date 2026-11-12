// Everyday helpers for the admin desk: the "Today" summary, one search across everything, and where newsletter sign-ups come from.
// Pure functions over the rows the desk already loads (no new storage, no new endpoint): the handler calls them from today_get, search_all and news_overview.
const pipeline = require('./pipeline');

const H = 3600e3, D = 24 * H;
const SOURCE_LABEL = { footer: 'Footer form', 'after-use': 'After using a tool', card: 'Corner card', inline: 'Under a tool', page: 'Newsletter page', reading: 'Reading card', form: 'Other form', brief: 'Past brief senders', import: 'Imported', '': 'Not recorded' };

const brief = (r, now, extra) => ({ id: r.id, name: r.name || r.email || 'Someone', service: r.service || '', at: r.created, ageH: Math.floor((now - r.created) / H), ...(extra || {}) });

// What needs the owner today: unanswered briefs (worst first), follow-ups that came due, quotes nobody answered, and the pulse of new people.
function today(rows, now) {
  now = now || Date.now();
  const briefs = rows.filter((r) => r.type === 'brief' && r.status !== 'spam' && r.status !== 'archived');
  const lvl = (r) => (pipeline.overdue(r, now) ? 'late' : pipeline.dueSoon(r, now) ? 'soon' : 'new');
  const reply = briefs.filter((r) => r.status === 'new' && pipeline.stageOf(r) === 'new' && !(r.thread || []).some((t) => t.dir === 'out'))
    .sort((a, b) => a.created - b.created).slice(0, 6).map((r) => brief(r, now, { level: lvl(r) }));
  const follow = briefs.filter((r) => pipeline.followDue(r, now)).sort((a, b) => String(a.followUp).localeCompare(String(b.followUp))).slice(0, 6).map((r) => brief(r, now, { followUp: r.followUp }));
  const quotes = briefs.filter((r) => pipeline.quoteWaiting(r, now)).slice(0, 4).map((r) => brief(r, now, { since: r.updated || r.created }));
  const subs = rows.filter((r) => r.type === 'subscriber' && r.status === 'subscribed'), when = (r) => r.confirmed || r.created;
  const startToday = new Date(new Date(now + 5.5 * H).toISOString().slice(0, 10) + 'T00:00:00Z').getTime() - 5.5 * H;   // midnight in India
  const sub = {
    total: subs.length, today: subs.filter((r) => when(r) >= startToday).length,
    week: subs.filter((r) => when(r) > now - 7 * D).length, prev: subs.filter((r) => when(r) <= now - 7 * D && when(r) > now - 14 * D).length,
  };
  const wk = briefs.filter((r) => r.created > now - 7 * D).length, pw = briefs.filter((r) => r.created <= now - 7 * D && r.created > now - 14 * D).length;
  // median hours until the first reply, over replies sent in the last 30 days
  const gaps = []; for (const r of briefs) { const o = (r.thread || []).find((t) => t.dir === 'out' && t.at && !t.error); if (o && o.at > now - 30 * D && o.at >= r.created) gaps.push((o.at - r.created) / H); }
  gaps.sort((a, b) => a - b);
  const median = gaps.length ? Math.round(gaps[Math.floor(gaps.length / 2)] * 10) / 10 : null;
  return { at: now, reply, follow, quotes, subs: sub, sources: sources(rows, now, 30).slice(0, 3), leads: { week: wk, prev: pw }, replyHours: median, repliesCounted: gaps.length };
}

// Where subscribers signed up. days = 0 means all time.
function sources(rows, now, days) {
  now = now || Date.now();
  const m = {};
  for (const r of rows) {
    if (r.type !== 'subscriber' || r.status !== 'subscribed') continue;
    if (days && (r.confirmed || r.created) < now - days * D) continue;
    const k = r.via || (r.source === 'import' ? 'import' : '');
    m[k] = (m[k] || 0) + 1;
  }
  return Object.entries(m).map(([via, n]) => ({ via, label: SOURCE_LABEL[via] || (/^pop-/.test(via) ? 'Pop-up (' + via.slice(4) + ')' : via), n })).sort((a, b) => b.n - a.n);
}

// One box that finds a person in briefs and subscribers. Returns small rows; the desk opens the right place from them.
function search(rows, text) {
  const t = String(text || '').toLowerCase().trim().slice(0, 80);
  if (t.length < 2) return { briefs: [], subscribers: [] };
  const has = (r, ks) => ks.some((k) => String(r[k] || '').toLowerCase().includes(t));
  const out = { briefs: [], subscribers: [] };
  {
    for (const r of rows) {   // newest first already
      if (r.type === 'brief' && out.briefs.length < 6 && has(r, ['name', 'email', 'company', 'service', 'message', 'note', 'website_url'])) out.briefs.push({ id: r.id, name: r.name || r.email, sub: [r.service, r.company, r.status].filter(Boolean).join(' · '), at: r.created, status: r.status });
      else if (r.type === 'subscriber' && out.subscribers.length < 5 && has(r, ['email', 'name'])) out.subscribers.push({ id: r.id, name: r.name || r.email, sub: [r.email !== (r.name || r.email) ? r.email : '', r.status, r.via ? 'via ' + r.via : ''].filter(Boolean).join(' · '), at: r.created, status: r.status });
      if (out.briefs.length >= 6 && out.subscribers.length >= 5) break;
    }
  }
  return out;
}

module.exports = { today, sources, search, SOURCE_LABEL };
