// One-click controls for posts the blog desk (scripts/blog-bot) writes: the nightly draft email links here.
//   GET  /api/config?a=blog&t=<token>             a small page: the post, when it goes live, and buttons
//   POST /api/config?a=blog&t=<token>&do=<act>     stop | now | resume     (a page, never a GET, does the change, so mail scanners that open links change nothing)
// The token is random, made by the bot and kept in Redis for 14 days (blog:tok:<token> -> { id, at }). No password is needed: whoever has the email has the post.
const posts = require('./posts');
const { redis } = require('../_lib');
const { esc } = require('./md');

const ACTOR = { id: 'blogdesk', name: 'Blog desk (email button)', perms: new Set(['content.view', 'content.create', 'content.edit_any', 'content.review', 'content.publish']) };
const when = (ms) => new Date(ms).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) + ' IST';

function page(title, inner) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(title)}</title>
<style>body{margin:0;background:#0b1030;color:#e9ecff;font:16px/1.55 system-ui,-apple-system,Segoe UI,sans-serif}main{max-width:560px;margin:0 auto;padding:40px 18px}h1{font-size:22px;line-height:1.3;margin:6px 0 10px}p{margin:8px 0}.k{color:#ffb86b;font-size:13px;letter-spacing:.06em;text-transform:uppercase}.s{background:#151b45;border:1px solid #2a3170;border-radius:12px;padding:14px 16px;margin:18px 0}form{display:inline}button,a.b{display:inline-block;margin:6px 8px 0 0;padding:11px 16px;border-radius:10px;border:1px solid #2a3170;background:#1b2257;color:#fff;font:600 15px system-ui,sans-serif;text-decoration:none;cursor:pointer}button.go{background:#ffb86b;color:#141a3f;border-color:#ffb86b}button.stop{background:#ff6b81;color:#fff;border-color:#ff6b81}small{color:#aab0d8}</style></head><body><main>${inner}</main></body></html>`;
}

async function handle(req, res) {
  const q = req.query || {}, tok = String(q.t || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64), act = String(q.do || '');
  res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('X-Robots-Tag', 'noindex');
  const send = (code, html) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.status(code).send(html); };
  try {
    const raw = tok.length >= 24 ? await redis('GET', 'blog:tok:' + tok) : null, rec = raw ? JSON.parse(raw) : null;
    const p = rec ? await posts.get(rec.id) : null;
    if (!p) return send(404, page('Link expired', '<p class="k">Blog desk</p><h1>This link has expired</h1><p>Links in the draft email work for 14 days. Open the post in the admin instead.</p>'));
    let note = '';
    if (req.method === 'POST') {
      const st = posts.stateOf(p);
      if (act === 'stop' && (st === 'scheduled' || st === 'published')) { await posts.move(p.id, 'draft', ACTOR, { note: 'Stopped from the draft email' }); note = 'Stopped. It is a draft again and not on the site.'; }
      else if (act === 'now' && p.status !== 'trash') {
        if (p.status === 'published') { p.publishAt = Date.now(); p.updated = Date.now(); await redis('SET', 'post:' + p.id, JSON.stringify(p)); posts.dropCache(); }
        else await posts.move(p.id, 'published', ACTOR, { publishAt: Date.now(), note: 'Published from the draft email' });
        note = 'Published. It is live now.';
      } else if (act === 'resume' && p.status === 'draft') {
        const at = Math.max(Date.now(), Number(rec.at) || 0); await posts.move(p.id, 'published', ACTOR, { publishAt: at, note: 'Scheduled again from the draft email' }); note = 'Scheduled again for ' + when(at) + '.';
      }
      await redis('LPUSH', 'blog:log', JSON.stringify({ t: Date.now(), a: 'button:' + act, id: p.id, title: p.title })); await redis('LTRIM', 'blog:log', 0, 199);
    }
    const cur = await posts.get(p.id), st = posts.stateOf(cur), url = 'https://aashishpandey.com/blog/' + cur.slug;
    const status = st === 'scheduled' ? 'Goes live ' + when(cur.publishAt) : st === 'published' ? 'Live since ' + when(cur.publishAt) : 'Stopped (draft, not on the site)';
    const btn = (d, label, cls) => `<form method="post" action="/api/config?a=blog&t=${tok}&do=${d}"><button class="${cls || ''}" type="submit">${label}</button></form>`;
    const btns = (st === 'scheduled' ? btn('stop', 'Stop this post', 'stop') + btn('now', 'Publish now', 'go') : st === 'published' ? btn('stop', 'Take it down', 'stop') : btn('resume', Number(rec.at) > Date.now() ? 'Schedule again for ' + when(rec.at) : 'Publish again', 'go'))
      + (st === 'published' ? `<a class="b" href="${esc(url)}">Open the post</a>` : `<a class="b" href="${esc(url)}?preview=${esc(posts.previewToken(cur.id))}">Preview</a>`);
    return send(200, page(cur.title, `<p class="k">Blog desk</p><h1>${esc(cur.title)}</h1><p>${esc(cur.excerpt)}</p>${note ? `<div class="s"><b>${esc(note)}</b></div>` : ''}<div class="s"><p><b>${esc(status)}</b></p>${btns}</div><p><small>Edits: open the post in the admin desk. Anything you change there is kept.</small></p>`));
  } catch (e) {
    console.error('blog desk:', e.message);
    return send(500, page('Something went wrong', '<h1>Something went wrong</h1><p>Please try again in a moment.</p>'));
  }
}
module.exports = { handle };
