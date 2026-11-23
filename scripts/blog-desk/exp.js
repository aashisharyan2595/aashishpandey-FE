// SEO experiments, kept simple: change one field on one post, remember the old value and the Search Console numbers from before, review after 28 days, keep or revert.
// Search Console numbers come from the public counts endpoint (`gsc`, only when the site's Search Console connection is set up). Every step is appended to content/blog/learn-log.md (the changelog).
const fs = require('fs'), path = require('path');
const CONTENT = path.join(__dirname, '..', '..', 'content', 'blog'), FILE = path.join(CONTENT, 'experiments.json'), LOG = path.join(CONTENT, 'learn-log.md');
const FIELDS = { seo_title: (p) => p.seo, seo_description: (p) => p.seo, title: (p) => p, excerpt: (p) => p };   // field name -> object holding it
const KEY = { seo_title: 'title', seo_description: 'description', title: 'title', excerpt: 'excerpt' };
const read = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { return { items: [] }; } };
const save = (E) => fs.writeFileSync(FILE, JSON.stringify(E, null, 2) + '\n');
const log = (t) => fs.appendFileSync(LOG, `\n- ${new Date().toISOString().slice(0, 10)}: ${t}`);
const postFile = (slug) => path.join(CONTENT, slug + '.json');
async function snap(slug) { try { const j = await (await fetch('https://aashishpandey.com/api/config?a=site&p=scores')).json(); const g = j.gsc && j.gsc.pages && j.gsc.pages[slug]; return j.gsc ? (g ? { ...g, ctr: g.impressions ? +(g.clicks / g.impressions).toFixed(3) : 0, at: Date.now() } : { clicks: 0, impressions: 0, ctr: 0, position: 0, at: Date.now() }) : null; } catch (e) { return null; } }

async function start(slug, field, value, why) {
  if (!FIELDS[field]) throw new Error('field must be one of ' + Object.keys(FIELDS).join(', '));
  const p = JSON.parse(fs.readFileSync(postFile(slug), 'utf8')), E = read(), holder = FIELDS[field](p) || (p.seo = {});
  if (E.items.some((x) => x.slug === slug && x.status === 'running')) throw new Error('this post already has a running experiment');
  if (E.items.filter((x) => x.status === 'running').length >= 2) throw new Error('two experiments are already running; review or revert one first');
  const item = { id: 'e' + (E.items.length + 1), slug, field, before: holder[KEY[field]] || '', after: String(value), why: why || '', startedAt: Date.now(), reviewAt: Date.now() + 28 * 864e5, baseline: await snap(slug), status: 'running' };
  holder[KEY[field]] = item.after; fs.writeFileSync(postFile(slug), JSON.stringify(p, null, 2) + '\n'); E.items.push(item); save(E);
  log(`SEO experiment ${item.id} started on ${slug}: ${field} "${item.before}" -> "${item.after}". Why: ${item.why || 'n/a'}. Baseline: ${item.baseline ? `${item.baseline.impressions} impressions, ${item.baseline.clicks} clicks, position ${item.baseline.position}` : 'no Search Console data'}. Revert: desk.js exp revert ${item.id}`);
  console.log('started', item.id, '(admin-edited posts keep their database copy; this change only shows if the post has not been edited in the admin)');
}
function close(id, status) {
  const E = read(), it = E.items.find((x) => x.id === id); if (!it || it.status !== 'running') throw new Error('no running experiment ' + id);
  if (status === 'reverted') { const p = JSON.parse(fs.readFileSync(postFile(it.slug), 'utf8')), h = FIELDS[it.field](p); h[KEY[it.field]] = it.before; fs.writeFileSync(postFile(it.slug), JSON.stringify(p, null, 2) + '\n'); }
  it.status = status; it.closedAt = Date.now(); save(E); log(`SEO experiment ${id} on ${it.slug} ${status}${status === 'reverted' ? ' (old ' + it.field + ' restored)' : ''}.`); console.log(id, status);
}
async function review() {
  const E = read(), run = E.items.filter((x) => x.status === 'running'); if (!run.length) return console.log('no running SEO experiments');
  for (const it of run) {
    const now = await snap(it.slug), b = it.baseline, due = Date.now() >= it.reviewAt;
    console.log(`${it.id} ${it.slug} ${it.field}: "${it.before}" -> "${it.after}" (started ${new Date(it.startedAt).toISOString().slice(0, 10)}, ${due ? 'DUE' : 'not due until ' + new Date(it.reviewAt).toISOString().slice(0, 10)})`);
    if (!b || !now) { console.log('  no Search Console numbers (connection not set up): judge on SEO rules only, keep if the new text fits the keyword and length rules'); continue; }
    const rel = b.ctr ? (now.ctr - b.ctr) / b.ctr : 0;
    console.log(`  before: ${b.impressions} impr, ${b.clicks} clicks, CTR ${(100 * b.ctr).toFixed(1)}%, pos ${b.position} | now (last 28 days): ${now.impressions} impr, ${now.clicks} clicks, CTR ${(100 * now.ctr).toFixed(1)}%, pos ${now.position}`);
    console.log('  ' + (!due ? 'wait' : now.impressions < 100 ? 'too few impressions (under 100): extend once more or decide on SEO rules, not on these numbers' : rel <= -0.2 ? 'CTR down 20%+: revert' : rel >= 0.2 ? 'CTR up 20%+: keep' : 'no clear change: keep if it reads better, else revert'));
  }
}
module.exports = { start, close, review };
