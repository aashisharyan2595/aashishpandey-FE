// A small, safe Markdown renderer for blog posts and case studies. No dependencies, and raw HTML in the source is always escaped, so an
// editor can never put a script on the site. Supported: headings, paragraphs, lists (one level of nesting), quotes, callouts, code blocks,
// tables, rules, links, images with captions, bold, italic, strike, inline code, a YouTube embed and a button.
//   > [!NOTE] text   > [!TIP] text   > [!WARNING] text      callouts
//   ::youtube[VIDEO_ID]                                        privacy-friendly embed (youtube-nocookie)
//   ::button[Label](https://example.com)                       call-to-action button
//   ![alt text](/media/abc "caption")                          figure with a caption
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slug = (s) => String(s).toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'section';

// links and image sources: only web addresses, site paths, anchors and mail links
const safeHref = (u) => { u = String(u || '').trim(); return /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(u) && !/[\s"<>]/.test(u) ? u : ''; };
const safeSrc = (u) => { u = String(u || '').trim(); return /^(https:\/\/|\/(?!\/))/i.test(u) && !/[\s"<>]/.test(u) ? u : ''; };

function inline(t) {
  const keep = [];
  const hold = (h) => { keep.push(h); return '\u0000' + (keep.length - 1) + '\u0000'; };
  t = String(t);
  t = t.replace(/`([^`\n]+)`/g, (m, c) => hold('<code>' + esc(c) + '</code>'));
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (m, alt, src, cap) => { const s = safeSrc(src); return s ? hold('<img src="' + esc(s) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">') : esc(alt); });
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (m, label, href, title) => {
    const h = safeHref(href); if (!h) return label;
    const ext = /^https?:\/\//i.test(h) && !/^https?:\/\/(www\.)?aashishpandey\.com/i.test(h);
    return hold('<a href="' + esc(h) + '"' + (title ? ' title="' + esc(title) + '"' : '') + (ext ? ' rel="noopener noreferrer" target="_blank"' : '') + '>' + inline(label) + '</a>');
  });
  t = esc(t);   // placeholders are NUL + digits, which escaping leaves alone
  t = t.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>').replace(/(^|[^_\w])_([^_\n]+)_(?![_\w])/g, '$1<em>$2</em>').replace(/~~([^~\n]+)~~/g, '<s>$1</s>');
  return t.replace(/\u0000(\d+)\u0000/g, (m, i) => keep[+i]);
}

function render(src, opts) {
  opts = opts || {};
  const lines = String(src || '').replace(/\r\n?/g, '\n').split('\n'), out = [], toc = [], used = {};
  let i = 0, words = 0;
  const idFor = (text) => { let b = slug(text), n = b, k = 2; while (used[n]) n = b + '-' + k++; used[n] = 1; return n; };
  const para = [];
  const flush = () => { if (para.length) { const t = para.join('\n'); words += t.split(/\s+/).filter(Boolean).length; out.push('<p>' + inline(t).replace(/\n/g, '<br>') + '</p>'); para.length = 0; } };
  const isList = (l) => /^\s*([-*+]|\d+[.)])\s+/.test(l);
  while (i < lines.length) {
    const l = lines[i];
    let m;
    if (/^\s*$/.test(l)) { flush(); i++; continue; }
    if ((m = /^```\s*([\w-]*)\s*$/.exec(l))) {   // fenced code
      flush(); const body = []; i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++]);
      i++; out.push('<pre><code' + (m[1] ? ' class="lang-' + esc(m[1]) + '"' : '') + '>' + esc(body.join('\n')) + '</code></pre>'); continue;
    }
    if ((m = /^(#{1,4})\s+(.+?)\s*#*\s*$/.exec(l))) {   // headings: the page title is the h1, so # and ## both become h2
      flush(); const lv = Math.max(2, Math.min(4, m[1].length)), text = m[2], id = idFor(text);
      if (lv <= 3) toc.push({ level: lv, id, text: text.replace(/[*_`]/g, '') });
      words += text.split(/\s+/).length; out.push('<h' + lv + ' id="' + id + '">' + inline(text) + '</h' + lv + '>'); i++; continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)) { flush(); out.push('<hr>'); i++; continue; }
    if ((m = /^::youtube\[([\w-]{6,20})\]\s*$/.exec(l))) { flush(); out.push('<div class="md-video"><iframe src="https://www.youtube-nocookie.com/embed/' + m[1] + '" title="Video" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>'); i++; continue; }
    if ((m = /^::button\[([^\]]+)\]\(([^)\s]+)\)\s*$/.exec(l))) { flush(); const h = safeHref(m[2]); if (h) out.push('<p class="md-cta"><a class="md-btn" href="' + esc(h) + '">' + esc(m[1]) + '</a></p>'); i++; continue; }
    if ((m = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/.exec(l))) {   // an image on its own line is a figure
      flush(); const s = safeSrc(m[2]); if (s) out.push('<figure><img src="' + esc(s) + '" alt="' + esc(m[1]) + '" loading="lazy" decoding="async">' + (m[3] ? '<figcaption>' + esc(m[3]) + '</figcaption>' : '') + '</figure>'); i++; continue;
    }
    if (/^>\s?/.test(l)) {   // quote or callout
      flush(); const q = []; while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ''));
      const c = /^\[!(NOTE|TIP|WARNING)\]\s*(.*)$/i.exec(q[0] || '');
      if (c) { q[0] = c[2]; const kind = c[1].toLowerCase(); out.push('<aside class="md-callout md-' + kind + '"><b>' + kind[0].toUpperCase() + kind.slice(1) + '</b>' + render(q.join('\n')).html + '</aside>'); }
      else out.push('<blockquote>' + render(q.join('\n')).html + '</blockquote>');
      continue;
    }
    if (isList(l)) {
      flush(); const ordered = /^\s*\d/.test(l); const items = [];
      while (i < lines.length && (isList(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        const cur = lines[i];
        if (isList(cur)) { const ind = cur.match(/^\s*/)[0].length; const text = cur.replace(/^\s*([-*+]|\d+[.)])\s+/, ''); if (ind >= 2 && items.length) items[items.length - 1].sub.push(text); else items.push({ text, sub: [] }); }
        else items[items.length - 1].text += ' ' + cur.trim();
        i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push('<' + tag + '>' + items.map((it) => { words += it.text.split(/\s+/).length; return '<li>' + inline(it.text) + (it.sub.length ? '<ul>' + it.sub.map((s) => '<li>' + inline(s) + '</li>').join('') + '</ul>' : '') + '</li>'; }).join('') + '</' + tag + '>');
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(l) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1])) {   // table
      flush(); const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(l), al = cells(lines[i + 1]).map((c) => (/^:-+:$/.test(c) ? 'center' : /-:$/.test(c) ? 'right' : '')); i += 2; const rows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i++]));
      const td = (t, k, tag) => '<' + tag + (al[k] ? ' style="text-align:' + al[k] + '"' : '') + '>' + inline(t) + '</' + tag + '>';
      out.push('<div class="md-table"><table><thead><tr>' + head.map((c, k) => td(c, k, 'th')).join('') + '</tr></thead><tbody>' + rows.map((r) => '<tr>' + head.map((c, k) => td(r[k] || '', k, 'td')).join('') + '</tr>').join('') + '</tbody></table></div>');
      continue;
    }
    para.push(l); i++;
  }
  flush();
  return { html: out.join('\n'), toc, words: opts.noWords ? 0 : words };
}
module.exports = { render, esc, slug, inline, safeHref, safeSrc };
