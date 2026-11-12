// Posts kept as files in the repo (content/blog/<slug>.json), written by the scheduled blog desk and published by git, so no database access
// or API key is needed to add a post. They show up on /blog, in the RSS feed and the sitemaps exactly like posts made in the admin desk, and go live
// when their publishAt time passes. They are read-only here: change one by editing its file (or ask Claude to). See docs/BLOG-DESK.md.
// Needs "includeFiles": "content/blog/**" for api/config.js in vercel.json, and a redirect that keeps /content/* from being served as static files
// (a scheduled post must not be readable before it goes live).
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..', '..', 'content', 'blog');
let rows = null;
function load() {
  if (rows) return rows;
  rows = [];
  let names = []; try { names = fs.readdirSync(DIR); } catch (e) { return rows; }
  for (const n of names) {
    if (!/^[a-z0-9-]+\.json$/.test(n) || n === 'calendar.json' || n === 'state.json') continue;
    try {
      const p = JSON.parse(fs.readFileSync(path.join(DIR, n), 'utf8'));
      if (p && p.slug && p.title && p.body && p.publishAt) rows.push({ type: 'post', status: 'published', authorId: 'owner', author: 'Aashish Pandey', tags: [], comments: [], timeline: [], oldSlugs: [], file: true, created: p.publishAt, updated: p.updated || p.publishAt, ...p, id: 'f' + require('crypto').createHash('sha1').update(p.slug).digest('hex').slice(0, 9) });
    } catch (e) { console.error('content/blog/' + n + ' is not valid JSON:', e.message); }
  }
  return rows;
}
const list = () => load();
const bySlug = (type, slug) => (type === 'post' ? load().find((p) => p.slug === slug) || null : null);
module.exports = { list, bySlug };
