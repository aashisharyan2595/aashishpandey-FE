// "Needs attention": one list of everything that is broken, stale or waiting, so the owner does not have to open every tab to find out.
// Each item is { level: bad | warn | info, title, detail, tab }. Scheduled jobs leave a record (noteRun) so a job that stopped running can be noticed.
const { redis } = require('../_lib');
const siteHealth = require('./sitehealth');
const maillog = require('./maillog');
const gsc = require('./gsc');
const pipeline = require('./pipeline');
const sec = require('./security');
const notify = require('./notify');
const push = require('./webpush');
const content = require('./content');

const H = 3600e3;
const noteRun = (job, ok, error) => redis('SET', 'admin:run:' + job, JSON.stringify({ at: Date.now(), ok: !!ok, error: error ? String(error).slice(0, 200) : '' })).catch(() => {});
const lastRun = async (job) => { try { const r = await redis('GET', 'admin:run:' + job); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
const within = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timed out')), ms))]);
const hrs = (ms) => (ms < 48 * H ? Math.round(ms / H) + ' hours' : Math.round(ms / 24 / H) + ' days');

async function vercelDeploys() {   // optional: needs VERCEL_TOKEN and VERCEL_PROJECT_ID (and VERCEL_TEAM_ID for a team project)
  const { VERCEL_TOKEN: tok, VERCEL_PROJECT_ID: pid, VERCEL_TEAM_ID: team } = process.env;
  if (!tok || !pid) return null;
  const since = Date.now() - 24 * H, u = `https://api.vercel.com/v6/deployments?projectId=${encodeURIComponent(pid)}&since=${since}&limit=100${team ? '&teamId=' + encodeURIComponent(team) : ''}`;
  const r = await fetch(u, { headers: { Authorization: 'Bearer ' + tok } });
  if (!r.ok) throw new Error('Vercel answered ' + r.status);
  const j = await r.json(); return (j.deployments || []).length;
}

async function build({ rows, now }) {
  now = now || Date.now();
  const out = [], add = (level, title, detail, tab) => out.push({ level, title, detail: detail || '', tab: tab || '' });

  // scheduled jobs
  if (!process.env.CRON_SECRET) add('warn', 'Scheduled jobs are off', 'Add CRON_SECRET in Vercel. Without it the nightly backup, the morning digest and the twice-daily health checks never run.', 'set');
  else {
    for (const [job, label, max] of [['cron', 'Nightly backup and health check', 36], ['digest', 'Morning digest', 36]]) {
      const r = await lastRun(job);
      if (!r) add('info', label + ' has not run yet', 'It runs by itself. If this stays for more than a day, check Vercel, Settings, Cron Jobs.', 'set');
      else if (!r.ok) add('bad', label + ' failed', (r.error || 'No reason was recorded.') + ' Last tried ' + hrs(now - r.at) + ' ago.', 'set');
      else if (now - r.at > max * H) add('bad', label + ' has stopped', 'It last ran ' + hrs(now - r.at) + ' ago. Check Vercel, Settings, Cron Jobs.', 'set');
    }
  }
  // site health
  try {
    const h = await siteHealth.last(), l = h.last;
    if (l && l.fails) add('bad', l.fails + ' site check' + (l.fails === 1 ? '' : 's') + ' failing', 'See the Health tab for which pages or files.', 'health');
    else if (l && l.warns) add('warn', l.warns + ' site warning' + (l.warns === 1 ? '' : 's'), 'See the Health tab.', 'health');
    if (l && now - (l.at || l.t || now) > 30 * H) add('warn', 'Site checks are out of date', 'The last run was ' + hrs(now - (l.at || l.t)) + ' ago.', 'health');
  } catch (e) { /* skip */ }
  // mail
  try {
    const mails = await maillog.all(), week = mails.filter((m) => m.at > now - 7 * 864e5 && ['bounced', 'complained', 'failed'].includes(m.status));
    if (week.length) add('warn', week.length + ' email' + (week.length === 1 ? '' : 's') + ' bounced or failed this week', week.slice(0, 3).map((m) => m.to).join(', ') + (week.length > 3 ? ' and more' : ''), 'mail');
  } catch (e) { /* skip */ }
  const lost = rows.filter((r) => r.mail && (r.mail.admin === 'failed' || r.mail.user === 'failed'));
  if (lost.length) add('bad', lost.length + ' brief' + (lost.length === 1 ? '' : 's') + ' with a failed email', 'The alert to you or the confirmation to them did not go out. Open the brief and press resend.', 'sub');
  // Search Console
  if (!gsc.ready()) add('info', 'Search Console is not connected', 'Add GSC_CLIENT_EMAIL and GSC_PRIVATE_KEY in Vercel to see search data in the Search tab.', 'seo');
  else { try { await within(gsc.get(false), 6000); } catch (e) { add('bad', 'Search Console is not working', String(e.message).slice(0, 180) + ' The service account key may have been revoked or lost access to the property.', 'seo'); } }
  // Vercel
  try {
    const n = await within(vercelDeploys(), 6000), cap = Number(process.env.VERCEL_DEPLOY_LIMIT) || 100;
    if (n === null) add('info', 'Vercel usage is not connected', 'Add VERCEL_TOKEN and VERCEL_PROJECT_ID to see deployments against the daily limit. Storage and bandwidth are on the Usage page in Vercel.', '');
    else if (n >= cap * 0.9) add('bad', n + ' of ' + cap + ' deployments in the last 24 hours', 'The daily limit is almost used up. New pushes will be refused until it resets.', '');
    else if (n >= cap * 0.7) add('warn', n + ' of ' + cap + ' deployments in the last 24 hours', 'Push in bigger batches to stay under the daily limit.', '');
  } catch (e) { add('warn', 'Could not read Vercel usage', String(e.message).slice(0, 120), ''); }
  // inbox
  const open = rows.filter((r) => r.type === 'brief' && r.status !== 'spam');
  const stale = open.filter((r) => r.status === 'new' && now - r.created > 24 * H);
  if (stale.length) add('warn', stale.length + ' brief' + (stale.length === 1 ? '' : 's') + ' waiting more than a day', 'No reply yet.', 'sub');
  const late = open.filter((r) => pipeline.overdue(r, now)).length, fup = open.filter((r) => pipeline.followDue(r, now)).length;
  if (late) add('bad', late + ' overdue brief' + (late === 1 ? '' : 's'), 'Past your 48 hour promise.', 'sub');
  if (fup) add('warn', fup + ' follow-up' + (fup === 1 ? '' : 's') + ' due', '', 'sub');
  // security
  try {
    if (!(await sec.totpState('owner')).enabled) add('warn', 'Two-factor sign-in is off', 'Turn it on in Settings so a stolen password is not enough.', 'set');
    const hist = await sec.history(60), bad = hist.filter((x) => !x.ok && x.t > now - 24 * H).length;
    if (bad >= 5) add('warn', bad + ' failed sign-ins in the last day', 'See Settings, Sign-in history.', 'set');
    const ch = notify.channels();
    if (!(ch.telegram || ch.slack || ch.webhook) && !(await push.count())) add('warn', 'No alert channel is set up', 'You will not hear about new briefs or sign-ins. Turn on notifications on your phone in Settings.', 'set');
  } catch (e) { /* skip */ }
  // testimonials
  try { const p = (await content.list()).filter((t) => t.status === 'pending').length; if (p) add('info', p + ' testimonial' + (p === 1 ? '' : 's') + ' to approve', '', 'content'); } catch (e) { /* skip */ }

  const rank = { bad: 0, warn: 1, info: 2 };
  out.sort((x, y) => rank[x.level] - rank[y.level]);
  return { at: now, items: out, ok: !out.some((x) => x.level !== 'info') };
}
module.exports = { build, noteRun };
