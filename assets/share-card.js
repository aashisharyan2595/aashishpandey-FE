/* Share card for the tools. A tool hands over what it knows right now and a draw function; this file builds the dialog,
 * paints a 1200x630 card in the site's look, and offers download, copy image, copy link and the phone's share sheet.
 * The image is drawn in the browser and goes nowhere until the person sends it.
 *
 *   ApShare.mount('#actions', function () { return { kicker, file, text, url, draw } })   adds a Share button
 *   ApShare.open({ kicker: 'QR CODE', file: 'qr.png', text: 'share text', url: location.href, draw: function (c) { ... } })
 *
 * draw(c) paints the body. c = { ctx, W, H, F, M, now, rr, fit, pill, stat, ring, wrap }. The background, the kicker, the
 * site name and a "made at" time stamp are painted for it, so every card carries the moment it was made.
 */
(function () {
'use strict';
var F = 'Geist, system-ui, sans-serif', M = 'Geist Mono, ui-monospace, monospace', W = 1200, H = 630;
var dlg, cv, cur, built = false;

function css() {
  if (document.getElementById('ap-sh-css')) return;
  var s = document.createElement('style'); s.id = 'ap-sh-css';
  s.textContent = '.ap-sh{border:1px solid rgba(244,239,230,.16);border-radius:24px;background:#0f1433;color:#f4efe6;padding:0;width:min(860px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;font-family:Geist,system-ui,sans-serif}'
    + '.ap-sh::backdrop{background:rgba(3,4,12,.74);backdrop-filter:blur(4px)}'
    + '.ap-sh__in{padding:clamp(16px,2.6vw,26px);display:flex;flex-direction:column;gap:16px}'
    + '.ap-sh__head{display:flex;align-items:center;justify-content:space-between;gap:12px}'
    + '.ap-sh__head h2{margin:0;font-size:clamp(20px,2.4vw,26px);font-weight:600;letter-spacing:-.03em}'
    + '.ap-sh__x{width:36px;height:36px;border-radius:50%;border:1px solid rgba(244,239,230,.16);background:none;color:#f4efe6;font-size:22px;line-height:1;cursor:pointer}'
    + '.ap-sh canvas{width:100%;height:auto;border-radius:14px;display:block;border:1px solid rgba(244,239,230,.1)}'
    + '.ap-sh__act{display:flex;flex-wrap:wrap;gap:10px}'
    + '.ap-sh__b{height:44px;padding:0 18px;border-radius:999px;border:1px solid rgba(244,239,230,.16);background:none;color:#f4efe6;font:500 14px Geist,system-ui,sans-serif;cursor:pointer}'
    + '.ap-sh__b:hover{border-color:#f5b867}.ap-sh__b--p{background:#f5b867;border-color:#f5b867;color:#1a1420;font-weight:600}'
    + '.ap-sh__n{margin:0;font-size:13.5px;line-height:1.55;color:#aaa4b8}'
    + '@media(max-width:560px){.ap-sh__act{display:grid;grid-template-columns:1fr 1fr}.ap-sh__b--p{grid-column:1/-1}}';
  document.head.appendChild(s);
}
function build() {
  if (built) return; built = true; css();
  dlg = document.createElement('dialog'); dlg.className = 'ap-sh'; dlg.setAttribute('aria-labelledby', 'ap-sh-t');
  dlg.innerHTML = '<div class="ap-sh__in"><div class="ap-sh__head"><h2 id="ap-sh-t">Share card</h2><button type="button" class="ap-sh__x" aria-label="Close">&times;</button></div>'
    + '<canvas width="' + W + '" height="' + H + '" role="img"></canvas>'
    + '<div class="ap-sh__act"><button type="button" class="ap-sh__b ap-sh__b--p" data-a="dl">Download image</button><button type="button" class="ap-sh__b" data-a="img">Copy image</button>'
    + '<button type="button" class="ap-sh__b" data-a="link">Copy link</button><button type="button" class="ap-sh__b" data-a="native" hidden>Share&hellip;</button></div>'
    + '<p class="ap-sh__n">The image is drawn in your browser and goes nowhere until you send it.</p></div>';
  document.body.appendChild(dlg);
  cv = dlg.querySelector('canvas');
  dlg.querySelector('.ap-sh__x').addEventListener('click', close);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
  dlg.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-a]'); if (!b || !cur) return;
    var a = b.getAttribute('data-a');
    if (a === 'link') return copyText(cur.url || location.href, b, 'Copy link');
    blob(function (bl) {
      if (!bl) return;
      if (a === 'dl') { var u = URL.createObjectURL(bl), l = document.createElement('a'); l.href = u; l.download = cur.file || 'card.png'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 3000); }
      else if (a === 'img') {
        if (!navigator.clipboard || !window.ClipboardItem) return flash(b, 'Not supported here', 'Copy image');
        navigator.clipboard.write([new ClipboardItem({ 'image/png': bl })]).then(function () { flash(b, 'Copied', 'Copy image'); }, function () { flash(b, 'Not allowed', 'Copy image'); });
      } else if (a === 'native') {
        var d = { title: cur.kicker || 'Share', text: cur.text || '', url: cur.url || location.href };
        try { var f = new File([bl], cur.file || 'card.png', { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [f] })) d.files = [f]; } catch (x) { /* text only */ }
        navigator.share(d).catch(function () {});
      }
    });
  });
}
function blob(cb) { cv.toBlob(cb, 'image/png'); }
function flash(b, t, back) { b.textContent = t; setTimeout(function () { b.textContent = back; }, 1400); }
function copyText(t, b, label) {
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { flash(b, 'Copied', label); }, function () { window.prompt('Copy this:', t); });
}
function close() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }

/* ---------- drawing helpers handed to each tool ---------- */
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
function fit(ctx, text, maxW) { text = String(text); if (ctx.measureText(text).width <= maxW) return text; while (text.length > 2 && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -1); return text.replace(/\s+$/, '') + '…'; }
function wrap(ctx, text, x, y, maxW, lh, maxLines) {
  var words = [];
  String(text).split(/\s+/).forEach(function (w) { // a word wider than the line, such as a long link, is cut where it must be
    while (w.length > 1 && ctx.measureText(w).width > maxW) { var k = w.length; while (k > 1 && ctx.measureText(w.slice(0, k)).width > maxW) k--; words.push(w.slice(0, k)); w = w.slice(k); }
    words.push(w);
  });
  var line = '', n = 0;
  for (var i = 0; i < words.length; i++) {
    var t = line ? line + ' ' + words[i] : words[i];
    if (ctx.measureText(t).width > maxW && line) { if (++n >= maxLines) { ctx.fillText(fit(ctx, line + ' ' + words.slice(i).join(' '), maxW), x, y); return y + lh; } ctx.fillText(line, x, y); y += lh; line = words[i]; } else line = t;
  }
  if (line) { ctx.fillText(line, x, y); y += lh; }
  return y;
}
function pill(ctx, x, y, text, o) {
  o = o || {}; ctx.font = (o.font || '500 20px ') + (o.mono ? M : F);
  var w = ctx.measureText(text).width + 32, h = o.h || 42;
  ctx.fillStyle = o.bg || 'rgba(244,239,230,.07)'; ctx.strokeStyle = o.line || 'rgba(244,239,230,.16)'; ctx.lineWidth = 1.5; rr(ctx, x, y, w, h, h / 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = o.color || '#f4efe6'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, x + 16, y + h / 2 + 1); ctx.textBaseline = 'alphabetic';
  return w;
}
// a big number with a small label under it
function stat(ctx, x, y, value, label, color) {
  ctx.textAlign = 'left'; ctx.fillStyle = color || '#f4efe6'; ctx.font = '600 76px ' + F; ctx.fillText(value, x, y);
  ctx.fillStyle = 'rgba(244,239,230,.6)'; ctx.font = '400 22px ' + F; ctx.fillText(label, x, y + 34);
}
// a ring gauge: frac 0 to 1
function ring(ctx, cx, cy, r, frac, color, big, small) {
  ctx.lineCap = 'round'; ctx.lineWidth = r * 0.16;
  ctx.strokeStyle = 'rgba(244,239,230,.1)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
  ctx.strokeStyle = color || '#f5b867'; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.001, Math.min(1, frac))); ctx.stroke();
  ctx.textAlign = 'center'; ctx.fillStyle = '#f4efe6'; ctx.font = '600 ' + Math.round(r * 0.5) + 'px ' + F; ctx.fillText(big, cx, cy + r * 0.12);
  if (small) { ctx.fillStyle = 'rgba(244,239,230,.6)'; ctx.font = '400 ' + Math.round(r * 0.2) + 'px ' + F; ctx.fillText(small, cx, cy + r * 0.5); }
}
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function stamp(d) { return d.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()] + ' ' + d.getFullYear() + ' · ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds()); }

function paint(o) {
  var ctx = cv.getContext('2d'), now = new Date();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
  var g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0e1438'); g.addColorStop(1, '#070916'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  var rg = ctx.createRadialGradient(150, 60, 0, 150, 60, 520); rg.addColorStop(0, 'rgba(245,184,103,.18)'); rg.addColorStop(1, 'rgba(245,184,103,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.fillStyle = '#f5b867'; ctx.font = '500 20px ' + M; ctx.fillText(String(o.kicker || '').toUpperCase(), 60, 70);
  ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(244,239,230,.55)'; ctx.fillText('aashishpandey.com/tools', W - 60, 70);
  ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(244,239,230,.4)'; ctx.font = '400 18px ' + M; ctx.fillText('Made ' + stamp(now), 60, H - 34);
  ctx.save();
  try { o.draw({ ctx: ctx, W: W, H: H, F: F, M: M, now: now, rr: function () { return rr.apply(null, [ctx].concat([].slice.call(arguments))); }, fit: function (t, w) { return fit(ctx, t, w); }, wrap: function (t, x, y, w, lh, n) { return wrap(ctx, t, x, y, w, lh, n); }, pill: function (x, y, t, p) { return pill(ctx, x, y, t, p); }, stat: function (x, y, v, l, c) { return stat(ctx, x, y, v, l, c); }, ring: function (cx, cy, r, f, c, b, s) { return ring(ctx, cx, cy, r, f, c, b, s); } }); }
  finally { ctx.restore(); }
  cv.setAttribute('aria-label', o.alt || (o.kicker + ' card'));
}
function open(o) {
  build(); cur = o;
  dlg.querySelector('#ap-sh-t').textContent = o.title || 'Share card';
  dlg.querySelector('[data-a=link]').hidden = o.link === false;
  dlg.querySelector('[data-a=native]').hidden = !navigator.share;
  var go = function () { paint(o); if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', ''); };
  (document.fonts && document.fonts.load ? Promise.all([document.fonts.load('600 30px Geist'), document.fonts.load('400 20px Geist'), document.fonts.load('500 20px "Geist Mono"')]).catch(function () {}) : Promise.resolve()).then(go);
  if (window.apTrack) window.apTrack('share_card', { tool: o.file || o.kicker });
}
// add a Share button to a tool; get() is called when it is pressed, so the card shows what is on screen at that moment
function mount(target, get, label) {
  var host = typeof target === 'string' ? document.querySelector(target) : target;
  if (!host || host.querySelector('[data-apsh]')) return null;
  var b = document.createElement('button'); b.type = 'button'; b.className = 'tl-btn'; b.setAttribute('data-apsh', '1'); b.textContent = label || 'Share';
  b.addEventListener('click', function () { var o = get(); if (o) open(o); else flash(b, 'Nothing to share yet', label || 'Share'); });
  host.appendChild(b); return b;
}
window.ApShare = { open: open, mount: mount, fmtSize: function (n) { return n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : n < 1073741824 ? (n / 1048576).toFixed(1) + ' MB' : (n / 1073741824).toFixed(2) + ' GB'; } };
})();
