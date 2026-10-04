// The sales pipeline on top of the inbox: stages, deal value, the 48 hour promise, follow-ups, and the morning digest.
const T = require('../_templates');
const { env, sendMail, esc, SITE } = require('../_mail');
const notify = require('./notify');
const { ADMIN_PATH } = require('./path');

const STAGES = ['new', 'contacted', 'call', 'quoted', 'won', 'lost'];
const OPEN = ['new', 'contacted', 'call', 'quoted'];
const SLA = 48 * 36e5, SOON = 36 * 36e5;
const stageOf = (r) => r.stage || 'new';
const answered = (r) => (r.thread || []).some((t) => t.dir === 'out');
// a brief nobody has answered yet: still New, no reply logged, not archived or spam
const waiting = (r) => r.type === 'brief' && r.status === 'new' && stageOf(r) === 'new' && !answered(r);
const overdue = (r, now) => waiting(r) && now - r.created > SLA;
const dueSoon = (r, now) => waiting(r) && now - r.created > SOON && now - r.created <= SLA;
const followDue = (r, now) => r.type === 'brief' && !!r.followUp && r.status !== 'archived' && r.status !== 'spam' && OPEN.includes(stageOf(r)) && Date.parse(r.followUp + 'T00:00:00+05:30') <= now;
const quoteWaiting = (r, now) => r.type === 'brief' && stageOf(r) === 'quoted' && now - (r.updated || r.created) > 7 * 864e5;

function stats(rows) {
  const now = Date.now(), briefs = rows.filter((r) => r.type === 'brief' && r.status !== 'spam');
  const stages = {}; for (const s of STAGES) stages[s] = { n: 0, value: {} };
  const open = {}, won = {};
  for (const r of briefs) {
    const s = stageOf(r), c = r.currency || 'USD'; stages[s].n++;
    if (r.value) { stages[s].value[c] = (stages[s].value[c] || 0) + Number(r.value); if (OPEN.includes(s)) open[c] = (open[c] || 0) + Number(r.value); if (s === 'won') won[c] = (won[c] || 0) + Number(r.value); }
  }
  return { stages, openValue: open, wonValue: won, overdue: rows.filter((r) => overdue(r, now)).length, dueSoon: rows.filter((r) => dueSoon(r, now)).length, followUps: rows.filter((r) => followDue(r, now)).length };
}
const age = (ms) => { const h = Math.floor((Date.now() - ms) / 36e5); return h < 48 ? h + 'h' : Math.floor(h / 24) + 'd'; };

function build(rows) {
  const now = Date.now();
  return { overdue: rows.filter((r) => overdue(r, now)), soon: rows.filter((r) => dueSoon(r, now)), follow: rows.filter((r) => followDue(r, now)), quoteWait: rows.filter((r) => quoteWaiting(r, now)), stats: stats(rows) };
}
async function sendDigest(rows) {
  const d = build(rows), n = d.overdue.length + d.soon.length + d.follow.length + d.quoteWait.length;
  if (!n) return { sent: false, none: true };
  const line = (r, extra) => `<li style="margin:0 0 6px;"><strong>${esc(r.name || r.email)}</strong>${r.service ? ' · ' + esc(r.service) : ''}${r.budget ? ' · ' + esc(r.budget) : ''} <span style="color:#5c566a;">(${extra})</span></li>`;
  const sec = (title, list, f) => (list.length ? `<p style="margin:18px 0 6px;font-family:'Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#5c566a;">${esc(title)}</p><ul style="margin:0 0 8px;padding-left:20px;line-height:1.6;">${list.map(f).join('')}</ul>` : '');
  const subject = `Morning digest: ${d.overdue.length ? d.overdue.length + ' overdue' : n + ' to look at'}`;
  const html = T.shell({
    title: subject, preheader: `${d.overdue.length} overdue, ${d.soon.length} due soon, ${d.follow.length} follow-ups.`,
    eyebrow: 'Morning digest', headline: `${n} ${n === 1 ? 'thing needs' : 'things need'} ${T.accent('you.')}`,
    body: sec('Overdue: past your 48 hour promise', d.overdue, (r) => line(r, 'waiting ' + age(r.created))) + sec('Due soon: under 12 hours left', d.soon, (r) => line(r, 'waiting ' + age(r.created)))
      + sec('Follow-ups due', d.follow, (r) => line(r, 'follow up ' + r.followUp)) + sec('Quotes with no answer for a week', d.quoteWait, (r) => line(r, 'quoted ' + age(r.updated || r.created) + ' ago'))
      + `<p style="margin:18px 0 4px;">${T.button(SITE + ADMIN_PATH, 'Open the admin')}</p>`,
    footer: 'Sent each morning when there is something to do. Turn it off in Settings.',
  });
  const text = `Morning digest\n\nOverdue: ${d.overdue.length}\nDue soon: ${d.soon.length}\nFollow-ups due: ${d.follow.length}\nQuotes with no answer for a week: ${d.quoteWait.length}\n\n${d.overdue.concat(d.soon).slice(0, 8).map((r) => `- ${r.name || r.email} (${r.service || 'brief'}), waiting ${age(r.created)}`).join('\n')}\n\n${SITE}${ADMIN_PATH}`;
  await sendMail({ to: env().admins, subject, html, text });
  await notify.send(`${d.overdue.length} overdue · ${d.soon.length} due soon · ${d.follow.length} follow-ups${d.quoteWait.length ? ' · ' + d.quoteWait.length + ' quotes waiting' : ''}`, { title: 'Morning digest', tag: 'digest' });
  return { sent: true, overdue: d.overdue.length, soon: d.soon.length, follow: d.follow.length, quoteWait: d.quoteWait.length };
}
module.exports = { STAGES, OPEN, stageOf, overdue, dueSoon, followDue, quoteWaiting, stats, sendDigest, build };
