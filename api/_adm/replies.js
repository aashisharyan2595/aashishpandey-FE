// Reply templates (one per service, editable) and sending a reply from the dashboard.
const T = require('../_templates');
const cfg = require('./cfg');
const { env, sendMail, esc, nl2br, firstName } = require('../_mail');

function defaults() {
  const out = {};
  for (const [k, t] of Object.entries(T.TOPICS)) {
    out[k] = { label: t.label, subject: `Re: your ${t.short} brief`, body: `Hi {first},\n\nThanks for your ${t.short} brief. I have read it{site}.\n\nA few questions so I can scope this properly:\n{questions}\n\nIf a call is easier, book a time here: {book}\n\nAashish` };
  }
  return out;
}
async function templates() {
  const saved = await cfg.get('templates', {}), d = defaults(), out = {};
  for (const k of Object.keys(d)) out[k] = { ...d[k], ...(saved[k] || {}) };
  return out;
}
const keyOf = (service) => T.SERVICE_TOPIC[service] || 'other';
function host(u) { try { return new URL(/^https?:/i.test(u) ? u : 'https://' + u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }
function fill(text, rec) {
  const t = T.TOPICS[keyOf(rec.service)] || T.TOPICS.other, h = host(rec.website_url || '');
  const map = { first: firstName(rec.name), name: rec.name || '', company: rec.company || '', service: t.label, questions: t.ask.slice(0, 3).map((q, i) => `${i + 1}. ${q}`).join('\n'), book: T.BOOK, site: h ? ` and had a first look at ${h}` : '' };
  return String(text || '').replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k] : m));
}
const linkify = (html) => html.replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}">${u}</a>`);

// a reply from a person looks like one: plain paragraphs, no banner, replies go to the real inbox
async function send(rec, subject, body) {
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222222;">${linkify(nl2br(body))}</div>`;
  return sendMail({ to: rec.email, subject, html, text: body, replyTo: env().admins });
}
module.exports = { defaults, templates, fill, keyOf, send };
