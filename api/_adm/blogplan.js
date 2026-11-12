// The blog desk's plan for the admin: what goes live next, the 30-day calendar and what is waiting. It reads the files the scheduled
// Claude sessions keep in the repo (content/blog/calendar.json and content/blog/<slug>.json), so it is as fresh as the last deploy.
// Read-only: to change a day, tell Claude (see docs/BLOG-DESK.md).
const fs = require('fs'), path = require('path');
const filePosts = require('../_site/fileposts'), posts_ = require('../_site/posts');
const CAL = path.join(__dirname, '..', '..', 'content', 'blog', 'calendar.json');
const IST = 5.5 * 3600 * 1000, DAY = 86400000;
const istDate = (ms) => new Date(ms + IST).toISOString().slice(0, 10);
const str = (v, n) => String(v == null ? '' : v).slice(0, n);

async function get(now) {
  let cal = {}; try { cal = JSON.parse(fs.readFileSync(CAL, 'utf8')); } catch (e) { /* no plan yet */ }
  // the desk's posts, as they stand now: edits made in the admin win over the file, and a post moved to the trash or back to a draft is not "live"
  const stored = (await posts_.all()).filter((p) => filePosts.isFileId(p.id) && p.status !== 'trash' && p.status !== 'draft');
  const slots = cal.slots || {}, posts = stored.map((p) => ({
    slug: p.slug, title: str(p.title, 140), category: str(p.category, 40), publishAt: Number(p.publishAt) || Date.parse(p.publishAt) || 0,
    kind: str((p.extra && p.extra.kind) || '', 12), excerpt: str(p.excerpt, 200),
  })).filter((p) => p.publishAt);
  const bySlug = {}; posts.forEach((p) => { bySlug[p.slug] = p; });
  const byDate = {}; posts.slice().sort((a, b) => a.publishAt - b.publishAt).forEach((p) => { const d = istDate(p.publishAt); if (!byDate[d]) byDate[d] = p; });   // a post that went live on a day with no planned slot (breaking news, a manual post) still shows on that day
  const today = istDate(now), days = [];
  for (let i = 0; i < 30; i++) {
    const d = istDate(now + i * DAY), s = slots[d] || null, p = (s && s.slug ? bySlug[s.slug] : null) || byDate[d] || null;
    days.push({
      date: d, today: i === 0, state: p ? (p.publishAt <= now ? 'live' : 'written') : s ? str(s.status, 12) || 'planned' : 'open',
      title: p ? p.title : s ? str(s.title, 140) : '', kind: p && p.kind ? p.kind : s ? str(s.kind, 12) : '', angle: s ? str(s.angle, 260) : '', locked: !!(s && s.locked),
      slug: p ? p.slug : '', goesLive: p ? p.publishAt : 0, sources: s && Array.isArray(s.urls) ? s.urls.length : 0,
    });
  }
  // posts that are on a day outside the 30 days (breaking news posted now, or a past day) still show under "next" and "recent"
  const next = posts.filter((p) => p.publishAt > now).sort((a, b) => a.publishAt - b.publishAt).slice(0, 5);
  const recent = posts.filter((p) => p.publishAt <= now).sort((a, b) => b.publishAt - a.publishAt).slice(0, 8);
  const backlog = (Array.isArray(cal.backlog) ? cal.backlog : []).slice().sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 12)
    .map((b) => ({ title: str(b.title, 140), kind: str(b.kind, 12), score: Number(b.score) || 0, added: str(b.added, 10) }));
  const planned = days.filter((d) => d.state !== 'open').length;
  return { today, now, days, next, recent, backlog, covered: (cal.covered || []).length, planned, open: days.length - planned };
}
module.exports = { get };
