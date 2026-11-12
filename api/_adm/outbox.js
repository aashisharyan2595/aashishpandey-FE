// Sends the blog desk's emails (content/blog/outbox/*.html and *.txt) to the admin addresses through the site's own Resend sender,
// so the scheduled Claude sessions need no mail account or key. Files ship with the deployment (includeFiles: content/blog/**).
// "Already sent" is remembered in the database (cfg outbox_sent) because the site cannot commit to git; sent files can be moved to outbox/sent/ later.
const fs = require('fs'), path = require('path');
const cfg = require('./cfg');
const { env, sendMail, esc } = require('../_mail');
const DIR = path.join(__dirname, '..', '..', 'content', 'blog', 'outbox');

function pending(sent) {
  let names = []; try { names = fs.readdirSync(DIR, { withFileTypes: true }).filter((d) => d.isFile() && /\.(html|txt)$/i.test(d.name)).map((d) => d.name).sort(); } catch (e) { /* no outbox yet */ }
  return names.filter((n) => !sent.includes(n));
}
function parse(name) {
  const raw = fs.readFileSync(path.join(DIR, name), 'utf8'), m = /^\s*<!--\s*subject:\s*(.*?)\s*-->\s*/i.exec(raw), body = m ? raw.slice(m[0].length) : raw;
  const title = (/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(body) || [])[1];
  const plain = String(title || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim();
  if (/\.txt$/i.test(name)) return { subject: m ? m[1] : 'Blog desk note: ' + name.replace(/\.txt$/i, ''), html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;white-space:pre-wrap">${esc(body)}</div>`, text: body };
  return { subject: m ? m[1] : 'Goes live tomorrow 9:00 am: ' + (plain || name.replace(/\.html$/i, '')), html: body, text: body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() };
}
async function run() {
  const to = env().admins; if (!to.length) return { sent: 0, error: 'ADMIN_EMAIL is not set' };
  const sent = (await cfg.get('outbox_sent', [])) || [], todo = pending(sent), done = [], failed = [];
  for (const n of todo) {
    try { const m = parse(n); await sendMail({ to, subject: m.subject, html: m.html, text: m.text, kind: 'blog-desk', ref: n }); done.push(n); sent.push(n); await cfg.set('outbox_sent', sent.slice(-300)); }
    catch (e) { failed.push({ file: n, error: String(e.message || e).slice(0, 200) }); }
  }
  return { sent: done.length, files: done, failed };
}
module.exports = { run, pending, parse };
