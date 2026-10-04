// Quotes: build one from a brief, email it, host a page where the client accepts or declines.
// Accept and decline are buttons on the page (a POST), never a link in the email, so a mail scanner that opens links cannot accept for them.
const crypto = require('crypto');
const T = require('../_templates');
const store = require('../_store');
const { redis } = require('../_lib');
const { env, sendMail, esc, nl2br, firstName, SITE } = require('../_mail');
const notify = require('./notify');

const CUR = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'CAD', 'AUD'];
const money = (minor, cur) => new Intl.NumberFormat(cur === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: cur }).format(minor / 100);
const dateFmt = (ms) => new Date(ms).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric' });
const sign = (id) => crypto.createHmac('sha256', env().secret || 'quote').update('quote|' + id).digest('base64url').slice(0, 24);
const okToken = (id, t) => { const a = Buffer.from(sign(id)), b = Buffer.from(String(t || '')); return a.length === b.length && crypto.timingSafeEqual(a, b); };
const url = (q) => `${SITE}/api/quote?id=${q.id}&t=${sign(q.id)}`;

function totals(items, taxPct) {
  let sub = 0; for (const i of items) sub += Math.round(i.qty * Math.round(i.price * 100));
  const tax = Math.round(sub * (taxPct || 0) / 100); return { sub, tax, total: sub + tax };
}
function clean(d) {
  const items = (Array.isArray(d.items) ? d.items : []).map((i) => ({ desc: String(i.desc || '').trim().slice(0, 200), qty: Number(i.qty), price: Number(i.price) })).filter((i) => i.desc);
  if (!items.length) throw new Error('Add at least one line item.');
  if (items.length > 20) throw new Error('A quote can have up to 20 lines.');
  for (const i of items) { if (!(i.qty >= 0.01 && i.qty <= 9999)) throw new Error('Check the quantity on each line.'); if (!(i.price >= 0 && i.price <= 1e9)) throw new Error('Check the price on each line.'); }
  const cur = CUR.includes(d.currency) ? d.currency : 'USD', taxPct = Math.min(50, Math.max(0, Number(d.taxPct) || 0));
  return { items, currency: cur, taxPct, taxLabel: String(d.taxLabel || 'Tax').trim().slice(0, 20) || 'Tax', validDays: Math.min(90, Math.max(1, parseInt(d.validDays, 10) || 14)), notes: String(d.notes || '').slice(0, 2000).trim() };
}
const mk = (brief, user, c, number) => {
  const t = totals(c.items, c.taxPct), now = Date.now(), id = crypto.randomBytes(6).toString('hex');
  return { id, number, briefId: brief.id, name: brief.name, email: brief.email, service: brief.service || '', ...c, subtotal: t.sub, tax: t.tax, total: t.total, created: now, validUntil: now + c.validDays * 864e5, status: 'sent', by: user ? user.name : '' };
};
async function nextNumber() { const n = await redis('INCR', 'quote:seq'); return `Q-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`; }

/* ---------- the email ---------- */
function linesTable(q) {
  const rows = q.items.map((i) => `<tr><td style="padding:9px 12px 9px 0;font-size:15px;border-bottom:1px solid #e2dacb;">${esc(i.desc)}${i.qty !== 1 ? `<br><span style="font-size:13px;color:#5c566a;">${i.qty} &times; ${money(Math.round(i.price * 100), q.currency)}</span>` : ''}</td><td align="right" style="padding:9px 0;font-size:15px;border-bottom:1px solid #e2dacb;white-space:nowrap;">${money(Math.round(i.qty * Math.round(i.price * 100)), q.currency)}</td></tr>`).join('');
  const tot = (k, v, b) => `<tr><td style="padding:7px 12px 7px 0;font-size:${b ? 16 : 14}px;${b ? 'font-weight:700;' : 'color:#5c566a;'}">${esc(k)}</td><td align="right" style="padding:7px 0;font-size:${b ? 16 : 14}px;${b ? 'font-weight:700;' : 'color:#5c566a;'}white-space:nowrap;">${v}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px;">${rows}${q.tax ? tot('Subtotal', money(q.subtotal, q.currency)) + tot(`${q.taxLabel} (${q.taxPct}%)`, money(q.tax, q.currency)) : ''}${tot('Total', money(q.total, q.currency), true)}</table>`;
}
function email(q) {
  const first = firstName(q.name), short = (T.TOPICS[T.SERVICE_TOPIC[q.service]] || T.TOPICS.other).short;
  const subject = `Your ${short} quote ${q.number}`;
  const html = T.shell({
    title: subject, preheader: `${money(q.total, q.currency)}, valid until ${dateFmt(q.validUntil)}.`,
    eyebrow: `Quote ${q.number}`, headline: `Your quote, ${T.accent(first + '.')}`,
    body: `<p style="margin:0 0 16px;">Thanks for your brief${q.service ? ' about ' + esc(q.service.toLowerCase()) : ''}. Here is what I propose.</p>`
      + linesTable(q)
      + `<p style="margin:14px 0 16px;font-size:13.5px;color:#5c566a;">Valid until <strong>${esc(dateFmt(q.validUntil))}</strong>.</p>`
      + (q.notes ? `<div style="margin:0 0 18px;padding:12px 14px;background:#faf6ec;border-left:3px solid #f5b867;border-radius:6px;font-size:14.5px;line-height:1.6;">${nl2br(q.notes)}</div>` : '')
      + `<p style="margin:6px 0 4px;">${T.button(url(q), 'Review and accept')}</p>`
      + `<p style="margin:0 0 16px;font-size:14px;color:#5c566a;">Questions, or want something changed? Just reply to this email.</p><p style="margin:0;">Aashish</p>`,
    footer: `Sent because you asked for a ${esc(short)} quote on aashishpandey.com.<br>${T.flink(SITE + '/privacy', 'Privacy')}`,
  });
  const text = `Hi ${first},\n\nThanks for your brief. Here is what I propose (quote ${q.number}).\n\n${q.items.map((i) => `- ${i.desc}${i.qty !== 1 ? ` (${i.qty} x ${money(Math.round(i.price * 100), q.currency)})` : ''}: ${money(Math.round(i.qty * Math.round(i.price * 100)), q.currency)}`).join('\n')}\n${q.tax ? `${q.taxLabel} (${q.taxPct}%): ${money(q.tax, q.currency)}\n` : ''}Total: ${money(q.total, q.currency)}\nValid until ${dateFmt(q.validUntil)}.\n${q.notes ? '\n' + q.notes + '\n' : ''}\nReview and accept: ${url(q)}\nQuestions? Just reply to this email.\n\nAashish`;
  return { subject, html, text };
}

/* ---------- admin side ---------- */
async function preview(brief, draft) { const c = clean(draft), q = mk(brief, null, c, 'Q-PREVIEW'); return { html: email(q).html, total: money(q.total, q.currency), page: pageHtml(q) }; }
async function send(brief, user, draft) {
  const c = clean(draft), q = mk(brief, user, c, await nextNumber()), m = email(q);
  await sendMail({ to: brief.email, subject: m.subject, html: m.html, text: m.text, replyTo: env().admins });   // throws if it fails, so nothing is recorded as sent
  await redis('SET', `quote:${q.id}`, JSON.stringify(q)); await redis('ZADD', 'quotes', q.created, q.id);
  const open = ['new', 'contacted', 'call'].includes(brief.stage || 'new');
  await store.update(brief.id, { quotes: [...(brief.quotes || []), q.id], value: q.total / 100, currency: q.currency, ...(open ? { stage: 'quoted' } : {}), status: brief.status === 'new' ? 'replied' : brief.status,
    thread: [...(brief.thread || []), { dir: 'out', at: Date.now(), subject: m.subject, body: `Sent quote ${q.number}: ${money(q.total, q.currency)}, valid until ${dateFmt(q.validUntil)}.` }] });
  return q;
}
async function get(id) { const raw = await redis('GET', `quote:${id}`); return raw ? JSON.parse(raw) : null; }
async function listFor(brief) { const out = []; for (const id of brief.quotes || []) { const q = await get(id); if (q) out.push({ ...q, link: url(q), totalText: money(q.total, q.currency) }); } return out; }
async function setStatus(id, status) {
  const q = await get(id); if (!q) throw new Error('Quote not found.');
  if (!['accepted', 'declined', 'withdrawn'].includes(status)) throw new Error('Unknown status.');
  q.status = status; q.respondedAt = Date.now(); q.respondedBy = 'owner'; await redis('SET', `quote:${id}`, JSON.stringify(q));
  const b = await store.get(q.briefId);
  if (b && status === 'accepted') await store.update(b.id, { stage: 'won', value: q.total / 100, currency: q.currency });
  return q;
}

/* ---------- the client's answer ---------- */
async function respond(id, token, action, reason) {
  if (!okToken(id, token)) return { code: 404, error: 'Quote not found.' };
  const q = await get(id); if (!q) return { code: 404, error: 'Quote not found.' };
  if (q.status !== 'sent') return { code: 200, ok: true, status: q.status };   // already answered: repeating changes nothing
  if (Date.now() > q.validUntil) return { code: 410, error: 'This quote has expired. Please reply to the email and I will refresh it.' };
  q.status = action === 'accept' ? 'accepted' : 'declined'; q.respondedAt = Date.now(); q.reason = String(reason || '').slice(0, 300);
  await redis('SET', `quote:${id}`, JSON.stringify(q));
  const b = await store.get(q.briefId);
  if (b) await store.update(b.id, action === 'accept' ? { stage: 'won', value: q.total / 100, currency: q.currency, status: b.status === 'new' ? 'replied' : b.status, thread: [...(b.thread || []), { dir: 'in', at: Date.now(), body: `Accepted quote ${q.number} (${money(q.total, q.currency)}).` }] }
    : { stage: 'lost', lostReason: q.reason ? `Declined quote: ${q.reason}` : 'Declined the quote', thread: [...(b.thread || []), { dir: 'in', at: Date.now(), body: `Declined quote ${q.number}.${q.reason ? ' ' + q.reason : ''}` }] });
  const word = action === 'accept' ? 'accepted' : 'declined', head = `Quote ${q.number} ${word} by ${q.name}`;
  try { const m = T.shell({ title: head, eyebrow: 'Quote answered', headline: `${esc(q.name)} ${T.accent(word + '.')}`, body: `<p style="margin:0 0 12px;">${esc(q.number)}: <strong>${money(q.total, q.currency)}</strong> for ${esc(q.service || 'a project')}.</p>${q.reason ? `<p style="margin:0 0 12px;">Their note: ${esc(q.reason)}</p>` : ''}<p style="margin:0;">Reply to this email to write to ${esc(firstName(q.name))}.</p>`, footer: 'Automatic note from the site.' }); await sendMail({ to: env().admins, replyTo: q.email, subject: head, html: m, text: `${head}. ${money(q.total, q.currency)}.` }); } catch (e) { console.error('quote: admin note failed', e.message); }
  await notify.send(`${head}\n${money(q.total, q.currency)}`, { title: action === 'accept' ? 'Quote accepted' : 'Quote declined', tag: 'quote' });
  return { code: 200, ok: true, status: q.status };
}

/* ---------- the page the client sees ---------- */
function pageHtml(q, note) {
  const expired = q.status === 'sent' && Date.now() > q.validUntil, live = q.status === 'sent' && !expired;
  const state = q.status === 'accepted' ? `Accepted on ${dateFmt(q.respondedAt || Date.now())}. Thank you.` : q.status === 'declined' ? 'Declined.' : q.status === 'withdrawn' ? 'This quote was withdrawn.' : expired ? 'This quote has expired. Reply to the email and I will refresh it.' : '';
  const rows = q.items.map((i) => `<tr><td>${esc(i.desc)}${i.qty !== 1 ? `<small>${i.qty} &times; ${money(Math.round(i.price * 100), q.currency)}</small>` : ''}</td><td class="r">${money(Math.round(i.qty * Math.round(i.price * 100)), q.currency)}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Quote ${esc(q.number)} · Aashish Pandey</title>
<style>*{box-sizing:border-box}body{margin:0;background:#070916;color:#1a1420;font:16px/1.6 Geist,Arial,Helvetica,sans-serif;padding:24px 14px}.w{max-width:620px;margin:0 auto}.logo{color:#f4efe6;font-weight:700;margin:0 6px 14px}.logo i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#f5b867;margin-left:7px}
.c{background:#f4efe6;border-radius:22px;padding:30px 26px}.e{font:700 11px 'Courier New',monospace;letter-spacing:.16em;text-transform:uppercase;color:#9a5418;margin:0 0 10px}h1{margin:0 0 16px;font-size:28px;letter-spacing:-.03em}h1 em{font-family:Georgia,serif;font-weight:400;color:#9a5418}
table{width:100%;border-collapse:collapse}td{padding:10px 0;border-bottom:1px solid #e2dacb;vertical-align:top}td.r{text-align:right;white-space:nowrap;padding-left:14px}small{display:block;color:#5c566a;font-size:13px}.t td{border:0;padding:5px 0;color:#5c566a;font-size:14.5px}.t tr.g td{color:#1a1420;font-weight:700;font-size:18px;padding-top:10px}
.n{margin:18px 0;padding:12px 14px;background:#faf6ec;border-left:3px solid #f5b867;border-radius:6px;font-size:15px}.s{margin:18px 0 0;padding:12px 14px;border-radius:12px;background:#e6efe6;color:#245c3b;font-weight:600}.s.x{background:#f3e6df;color:#8a3a1c}
.b{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}button{font:700 15px Arial,sans-serif;min-height:48px;padding:0 24px;border-radius:999px;border:1.5px solid #1a1420;background:none;cursor:pointer}button.p{background:#f5b867;border-color:#f5b867}button:disabled{opacity:.5}.m{color:#8e89a0;font-size:12.5px;text-align:center;margin-top:14px}.m a{color:#aaa4b8}
@media print{body{background:#fff;padding:0}.c{background:#fff;border-radius:0}.b,.m,.logo{display:none}}</style></head><body><div class="w"><p class="logo">Aashish Pandey<i></i></p><div class="c">
<p class="e">Quote ${esc(q.number)}</p><h1>Quote for <em>${esc(firstName(q.name))}</em></h1>
<table>${rows}</table><table class="t">${q.tax ? `<tr><td>Subtotal</td><td class="r">${money(q.subtotal, q.currency)}</td></tr><tr><td>${esc(q.taxLabel)} (${q.taxPct}%)</td><td class="r">${money(q.tax, q.currency)}</td></tr>` : ''}<tr class="g"><td>Total</td><td class="r">${money(q.total, q.currency)}</td></tr></table>
<p style="color:#5c566a;font-size:14px;margin:14px 0 0;">Prepared ${esc(dateFmt(q.created))} · valid until <strong>${esc(dateFmt(q.validUntil))}</strong></p>${q.notes ? `<div class="n">${nl2br(q.notes)}</div>` : ''}
${state ? `<div class="s ${q.status === 'accepted' ? '' : 'x'}" id="st">${esc(state)}</div>` : '<div id="st"></div>'}
${live ? `<div class="b" id="bt"><button class="p" id="ac">Accept this quote</button><button id="dc">Decline</button><button id="pr" type="button" onclick="window.print()">Save as PDF</button></div>` : `<div class="b"><button type="button" onclick="window.print()">Save as PDF</button></div>`}
</div><p class="m">Questions? Reply to the email, or write to <a href="mailto:hello@aashishpandey.com">hello@aashishpandey.com</a>.</p></div>
${live ? `<script>(function(){var id=${JSON.stringify(q.id)},t=${JSON.stringify(sign(q.id))};function go(a,reason){var b=document.getElementById('bt');[].forEach.call(b.querySelectorAll('button'),function(x){x.disabled=true});fetch('/api/quote?a='+a,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id,t:t,reason:reason||''})}).then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})}).then(function(x){var s=document.getElementById('st');if(x.ok){b.style.display='none';s.className='s'+(a==='accept'?'':' x');s.textContent=a==='accept'?'Accepted. Thank you! I will be in touch within one working day to start.':'Declined. Thanks for letting me know.'}else{s.className='s x';s.textContent=x.j.error||'Something went wrong. Please reply to the email.';[].forEach.call(b.querySelectorAll('button'),function(y){y.disabled=false})}}).catch(function(){var s=document.getElementById('st');s.className='s x';s.textContent='Could not reach the server. Please reply to the email.';[].forEach.call(b.querySelectorAll('button'),function(y){y.disabled=false})})}
document.getElementById('ac').onclick=function(){if(confirm('Accept this quote for ${money(q.total, q.currency).replace(/'/g, '')}?'))go('accept')};document.getElementById('dc').onclick=function(){var r=prompt('Optional: what made you decide against it? (You can leave this empty.)');if(r!==null)go('decline',r)}})();</script>` : ''}</body></html>`;
}
module.exports = { clean, preview, send, get, listFor, setStatus, respond, pageHtml, okToken, CUR, money };
