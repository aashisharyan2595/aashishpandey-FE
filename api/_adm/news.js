// Newsletter: render a draft in the site's email style, send it to confirmed subscribers in chunks, growth numbers, import from Resend.
// Body format: blank line = new paragraph, lines starting "- " = bullet list, [text](https://link), **bold**.
const T = require('../_templates');
const store = require('../_store');
const { redis } = require('../_lib');
const { env, resend, esc, link, SITE } = require('../_mail');
const maillog = require('./maillog');

const CHUNK = 40;   // one Resend batch call per chunk, so a request stays well inside the function time limit
const inline = (s) => esc(s)
  .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (m, t, u) => `<a href="${u}" style="color:#9a5418;font-weight:600;">${t}</a>`)
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
const plain = (s) => String(s).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1 ($2)').replace(/\*\*([^*]+)\*\*/g, '$1');

function render(c, unsubUrl, first) {
  first = first || 'there';
  c = { ...c, subject: String(c.subject).replace(/\{first\}/g, first), body: String(c.body || '').replace(/\{first\}/g, first) };
  const paras = String(c.body || '').replace(/\r/g, '').split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  const body = paras.map((pp) => {
    const lines = pp.split('\n');
    if (lines.every((l) => /^[-*] /.test(l))) return `<ul style="margin:0 0 16px;padding-left:20px;line-height:1.7;">${lines.map((l) => `<li style="margin:0 0 4px;">${inline(l.slice(2))}</li>`).join('')}</ul>`;
    return `<p style="margin:0 0 16px;">${lines.map(inline).join('<br>')}</p>`;
  }).join('');
  const btn = c.button_label && /^https?:\/\//.test(c.button_url || '') ? `<p style="margin:6px 0 4px;">${T.button(c.button_url, c.button_label)}</p>` : '';
  const html = T.shell({
    title: c.subject, preheader: c.preheader || '', eyebrow: 'Newsletter', headline: esc(c.subject),
    body: body + btn + '<p style="margin:8px 0 0;">Aashish</p>',
    footer: `You get this because you subscribed at aashishpandey.com.<br>${T.flink(unsubUrl, 'Unsubscribe')} &middot; ${T.flink(SITE + '/privacy', 'Privacy')}`,
  });
  const text = `${c.subject}\n\n${paras.map(plain).join('\n\n')}${c.button_label && /^https?:\/\//.test(c.button_url || '') ? `\n\n${c.button_label}: ${c.button_url}` : ''}\n\nAashish\n\nYou get this because you subscribed at aashishpandey.com.\nUnsubscribe: ${unsubUrl}\nPrivacy: ${SITE}/privacy`;
  return { html, text };
}

const clean = (d) => ({ subject: String(d.subject || '').trim().slice(0, 140), preheader: String(d.preheader || '').trim().slice(0, 140), body: String(d.body || '').slice(0, 20000), button_label: String(d.button_label || '').trim().slice(0, 40), button_url: String(d.button_url || '').trim().slice(0, 500) });
const subscribed = async () => (await store.all()).filter((r) => r.type === 'subscriber' && r.status === 'subscribed').map((r) => r.email);

async function start(draft) {
  const c = clean(draft), to = await subscribed();
  const id = Date.now().toString(36);
  const camp = { id, created: Date.now(), ...c, queue: to, total: to.length, sent: 0, failed: [], status: to.length ? 'sending' : 'sent' };
  await redis('SET', `camp:${id}`, JSON.stringify(camp)); await redis('ZADD', 'camps', camp.created, id);
  return camp;
}
async function getCamp(id) { const raw = await redis('GET', `camp:${id}`); return raw ? JSON.parse(raw) : null; }
async function sendChunk(id) {
  const c = await getCamp(id); if (!c) throw new Error('Campaign not found.');
  const batch = c.queue.slice(0, CHUNK);
  if (batch.length) {
    const blocked = await maillog.suppressed();   // addresses that bounced or reported spam are skipped
    c.skipped = c.skipped || 0;
    const names = new Map((await store.all()).filter((x) => x.type === 'subscriber' && x.name).map((x) => [x.email, String(x.name).split(/\s+/)[0]]));
    const sendTo = batch.filter((e) => !blocked[String(e).toLowerCase()]); c.skipped += batch.length - sendTo.length;
    const msgs = sendTo.map((email) => {
      const un = link('unsubscribe', email), r = render(c, un, names.get(email));
      return { from: env().from, to: [email], subject: String(c.subject).replace(/\{first\}/g, names.get(email) || 'there'), html: r.html, text: r.text, reply_to: env().admins, headers: { 'List-Unsubscribe': `<${un}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } };
    });
    try {
      const j = msgs.length ? await resend('/emails/batch', 'POST', msgs) : { data: [] }; c.sent += sendTo.length;
      for (let i = 0; i < msgs.length; i++) { const id = j && j.data && j.data[i] && j.data[i].id; if (id) await maillog.record({ id, to: msgs[i].to, subject: msgs[i].subject, kind: 'newsletter', ref: 'camp:' + c.id }).catch(() => {}); }
    } catch (e) { sendTo.forEach((email) => c.failed.push({ email, err: String(e.message).slice(0, 120) })); }
    c.queue = c.queue.slice(CHUNK);
  }
  if (!c.queue.length) { c.status = 'sent'; c.sentAt = Date.now(); }
  await redis('SET', `camp:${id}`, JSON.stringify(c));
  return { id, total: c.total, sent: c.sent, failed: c.failed.length, remaining: c.queue.length, done: !c.queue.length, lastError: c.failed.length ? c.failed[c.failed.length - 1].err : '' };
}
async function retryFailed(id) {
  const c = await getCamp(id); if (!c) throw new Error('Campaign not found.');
  c.queue = c.failed.map((f) => f.email); c.failed = []; c.status = c.queue.length ? 'sending' : 'sent';
  await redis('SET', `camp:${id}`, JSON.stringify(c)); return { id, remaining: c.queue.length };
}
async function list() {
  const ids = await redis('ZREVRANGE', 'camps', 0, 19), out = [];
  for (const id of ids || []) { const c = await getCamp(id); if (c) out.push({ id: c.id, created: c.created, subject: c.subject, total: c.total, sent: c.sent, failed: c.failed.length, remaining: c.queue.length, status: c.status }); }
  return out;
}

// subscriber numbers and a 12 week growth series (index 0 is the oldest week)
function growth(rows) {
  const subs = rows.filter((r) => r.type === 'subscriber'), W = 7 * 864e5, now = Date.now();
  const bucket = (t) => 11 - Math.floor((now - t) / W);
  const gain = Array(12).fill(0), lost = Array(12).fill(0);
  for (const r of subs) {
    if (r.confirmed) { const b = bucket(r.confirmed); if (b >= 0 && b < 12) gain[b]++; }
    if (r.unsubscribed) { const b = bucket(r.unsubscribed); if (b >= 0 && b < 12) lost[b]++; }
  }
  const count = (s) => subs.filter((r) => r.status === s).length;
  return { subscribed: count('subscribed'), pending: count('pending'), unsubscribed: count('unsubscribed'), gain, lost };
}

// pull existing contacts from the Resend audience into the dashboard (sign-ups from before the dashboard existed)
async function importFromResend() {
  const base = env().audience ? `/audiences/${env().audience}/contacts` : '/contacts';
  let after = null, n = 0, guard = 0;
  do {
    const j = await resend(base + '?limit=100' + (after ? '&after=' + after : ''), 'GET');
    const data = (j && j.data) || [];
    for (const c of data) {
      if (!c.email) continue;
      await store.subscriber(String(c.email).toLowerCase(), { status: c.unsubscribed ? 'unsubscribed' : 'subscribed', confirmed: c.created_at ? Date.parse(c.created_at) : Date.now(), source: 'import', ...(c.unsubscribed ? { unsubscribed: Date.now() } : {}) });
      n++;
    }
    after = j && j.has_more && data.length ? data[data.length - 1].id : null;
  } while (after && ++guard < 30);
  return n;
}
module.exports = { render, clean, start, sendChunk, retryFailed, list, growth, importFromResend, subscribed };
