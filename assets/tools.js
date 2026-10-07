/* Shared behaviour for every tool page (/tools/*). Loaded with defer after the page's own script.
   - Toast: a short confirmation whenever a tool copies to the clipboard or starts a download, read out to screen readers.
   - Ctrl/Cmd + Enter presses the tool's main button ([data-tl-primary]).
   - Drop or paste a file anywhere on the page: it goes to the tool's file input ([data-tl-file]).
   - "See the result" pill on phones when the answer ([data-tl-result]) is below the screen after the visitor changes something.
   Opt out of the toast on pages that already show their own with <script src="/assets/tools.js" data-toast="off">. */
(function () {
  'use strict';
  var me = document.currentScript, opts = (me && me.dataset) || {};
  var doc = document, body = function () { return doc.body; };

  /* ---------- toast ---------- */
  var box, timer, live;
  function ensure() {
    if (box) return;
    box = doc.createElement('div'); box.className = 'tl-toast'; box.setAttribute('aria-hidden', 'true');
    live = doc.createElement('p'); live.className = 'sr'; live.setAttribute('aria-live', 'polite');
    body().appendChild(box); body().appendChild(live);
  }
  function toast(msg, kind) {
    if (!body()) return;
    ensure();
    box.textContent = msg; box.setAttribute('data-kind', kind || 'ok');
    box.classList.remove('is-on'); void box.offsetWidth; box.classList.add('is-on');
    live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 30);
    clearTimeout(timer); timer = setTimeout(function () { box.classList.remove('is-on'); }, 2200);
  }
  window.ApToast = toast;

  if (opts.toast !== 'off') {
    var cb = navigator.clipboard;
    if (cb) ['writeText', 'write'].forEach(function (k) {
      var orig = cb[k]; if (typeof orig !== 'function') return;
      try {
        cb[k] = function () {
          var p = orig.apply(cb, arguments);
          if (p && p.then) p.then(function () { toast(k === 'write' ? 'Image copied' : 'Copied to clipboard'); }, function () {});
          return p;
        };
      } catch (e) {}
    });
    var lastDl = 0;
    function dl(a) {
      if (!a || !a.hasAttribute || !a.hasAttribute('download')) return;
      var now = Date.now(); if (now - lastDl < 400) return; lastDl = now;
      var n = a.getAttribute('download');
      toast(n ? 'Downloading ' + n : 'Download started');
    }
    var click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { dl(this); return click.apply(this, arguments); };
    doc.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[download]'); if (a) dl(a); }, true);
  }

  /* ---------- no scroll reveal inside the tool ----------
     motion.js fades page sections in as they scroll into view. Inside a tool that hid fresh results
     (time zones, estimate, invoice) until the visitor scrolled, so the tool itself is left alone:
     anything after the hero and before "About this tool" gets an empty animation instead. */
  var anim = Element.prototype.animate;
  function inTool(el) {
    var main = el.closest && el.closest('main'); if (!main || el.closest('.tl-hero')) return false;
    var about = main.querySelector('section[aria-label="About this tool"]');
    return !about || !!(about.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING);
  }
  if (anim) Element.prototype.animate = function (kf, o) {
    var f = kf && kf[0];
    if (f && f.opacity === 0 && f.transform === 'translateY(22px)' && inTool(this)) return anim.call(this, [], 0);
    return anim.apply(this, arguments);
  };

  /* ---------- Ctrl/Cmd + Enter ---------- */
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || !(e.metaKey || e.ctrlKey) || e.defaultPrevented) return;
    var b = doc.querySelector('[data-tl-primary]');
    if (b && !b.disabled && b.offsetParent !== null) { e.preventDefault(); b.click(); }
  });

  /* ---------- drop or paste a file anywhere ---------- */
  function fileInput() { return doc.querySelector('input[type=file][data-tl-file]'); }
  function give(files) {
    var inp = fileInput(); if (!inp || !files || !files.length) return false;
    try {
      var dt = new DataTransfer(), max = inp.multiple ? files.length : 1;
      for (var i = 0; i < max; i++) dt.items.add(files[i]);
      inp.files = dt.files;
    } catch (e) { return false; }
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  var veil, depth = 0;
  function showVeil(on) {
    if (on && !veil) {
      veil = doc.createElement('div'); veil.className = 'tl-veil'; veil.setAttribute('aria-hidden', 'true');
      var inp = fileInput();
      veil.innerHTML = '<span>' + ((inp && inp.getAttribute('data-tl-file')) || 'Drop to add') + '</span>';
      body().appendChild(veil);
    }
    if (veil) veil.classList.toggle('is-on', !!on);
  }
  function hasFiles(e) { var t = e.dataTransfer && e.dataTransfer.types; return t && Array.prototype.indexOf.call(t, 'Files') >= 0; }
  doc.addEventListener('dragenter', function (e) { if (!fileInput() || !hasFiles(e)) return; depth++; showVeil(true); });
  doc.addEventListener('dragleave', function () { if (depth > 0 && --depth === 0) showVeil(false); });
  doc.addEventListener('dragover', function (e) { if (fileInput() && hasFiles(e)) e.preventDefault(); });
  doc.addEventListener('drop', function (e) {
    depth = 0; showVeil(false);
    if (!fileInput() || !hasFiles(e) || e.defaultPrevented) return;   // the tool's own drop zone handled it
    e.preventDefault(); give(e.dataTransfer.files);
  });
  doc.addEventListener('paste', function (e) {
    var inp = fileInput(); if (!inp || e.defaultPrevented || inp.hasAttribute('data-tl-nopaste')) return;
    var t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    var files = e.clipboardData && e.clipboardData.files;
    if (files && files.length && give(files)) e.preventDefault();
  });

  /* ---------- "See the result" on phones ---------- */
  var tries = 0;
  function initJump() {
    var res = doc.querySelector('[data-tl-result]');
    if (!res) { if (++tries < 20) setTimeout(initJump, 400); return; }   // pages drawn by the template runtime fill in after load
    if (!('IntersectionObserver' in window)) return;
    var pill = doc.createElement('button'); pill.type = 'button'; pill.className = 'tl-jump';
    pill.innerHTML = '<span>' + (res.getAttribute('data-tl-result') || 'See the result') + '</span><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>';
    pill.addEventListener('click', function () { res.scrollIntoView({ behavior: 'smooth', block: 'start' }); pill.classList.remove('is-on'); });
    body().appendChild(pill);
    var seen = false, below = false, touched = false;
    new IntersectionObserver(function (en) { var r = en[0]; seen = r.isIntersecting; below = !seen && r.boundingClientRect.top > 0; upd(); }).observe(res);
    function upd() { pill.classList.toggle('is-on', touched && !seen && below && innerWidth < 900); }
    var panel = res.closest('main') || body();
    ['input', 'change'].forEach(function (ev) { panel.addEventListener(ev, function (e) { if (res.contains(e.target)) return; touched = true; upd(); }, true); });
    addEventListener('resize', upd);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', initJump); else initJump();

  /* ---------- what next: related tools under the tool, and a small email prompt once the tool has been used ----------
     The related tools are read from the page's own "More free tools" cards, so there is one list to keep. The email form is a form[data-news],
     which site.js already submits to /api/subscribe (honeypot, time check, Turnstile). */
  var nextTries = 0;
  function initNext() {
    var path = location.pathname.replace(/\/$/, '');
    if (!/^\/tools\/[^/]+(\/build)?$/.test(path) || /^\/tools\/(resume-maker|sop-maker)$/.test(path)) return;
    var main = doc.querySelector('main'), about = main && main.querySelector('section[aria-label="About this tool"]');
    if (!main || !about || doc.querySelector('.tl-next')) return;
    if (!about.querySelector('a[href^="/tools/"] span') && ++nextTries < 20) return void setTimeout(initNext, 400);   // pages drawn by the template runtime fill in after load
    var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
    var done = store.get('apNlDone') === '1';
    var seen = {}, cards = [].slice.call(about.querySelectorAll('a[href^="/tools/"]')).filter(function (a) {
      var h = a.getAttribute('href'); if (!/^\/tools\/[^/?#]+$/.test(h) || h === path || seen[h] || a.closest('.ap-close, .ap-foot, .ap-nav') || !a.querySelector('span')) return false;
      return (seen[h] = 1);
    }).slice(0, 3).map(function (a) {
      var sp = a.querySelectorAll('span'); return { href: a.getAttribute('href'), t: (sp[0] && sp[0].textContent || '').trim(), d: (sp[1] && sp[1].textContent || '').trim() };
    }).filter(function (c) { return c.href && c.t && c.t.indexOf('{{') < 0; });
    var sec = doc.createElement('section'); sec.className = 'tl-next'; sec.setAttribute('aria-label', 'Related tools');
    var h = '';
    if (cards.length) h += '<h2 class="tl-next__h">Try next</h2><div class="tl-next__row">' + cards.map(function (c) { return '<a class="tl-next__a" href="' + c.href + '"><b>' + c.t + '</b>' + (c.d ? '<span>' + c.d + '</span>' : '') + '</a>'; }).join('') + '</div>';
    h += '<div class="tl-next__nl" data-nl>' + nlForm(done) + '</div>';
    sec.innerHTML = h; about.parentNode.insertBefore(sec, about);

    function nlForm(sub) {
      if (sub) return '<p class="tl-next__ok">You are on the list. New tools will reach you by email.</p>';
      return '<div class="tl-next__t"><b>New free tools by email</b><span>One short email when a new tool goes live. Unsubscribe any time. <a href="/privacy">Privacy</a></span></div>'
        + '<form data-news novalidate><input name="hp" tabindex="-1" autocomplete="off" aria-hidden="true" class="tl-nl__hp"><input name="email" type="email" class="tl-input" placeholder="you@example.com" autocomplete="email" inputmode="email" aria-label="Email address" required><button class="tl-btn tl-btn--p" type="submit">Subscribe</button><p data-news-msg role="status"></p></form>';
    }
    // a successful sign-up is remembered, so neither the form nor the card asks again
    new MutationObserver(function (m) {
      m.forEach(function (r) { var t = r.target; if (t.matches && t.matches('[data-news-msg].is-ok') && t.closest('.tl-next, .tl-nl')) { store.set('apNlDone', '1'); setTimeout(function () { var c = doc.querySelector('.tl-nl'); if (c) c.remove(); }, 3500); } });
    }).observe(doc.body, { subtree: true, attributes: true, attributeFilter: ['class'] });

    // the floating card: wide screens only (phones have bottom bars), after real use, never with the cookie notice up, once per 60 days
    if (done || innerWidth < 900) return;
    var asked = Number(store.get('apNlX')) || 0; if (asked && Date.now() - asked < 60 * 864e5) return;
    var shown = false, usedAt = 0;
    function show() {
      if (shown || doc.getElementById('ap-cc')) { if (!shown) setTimeout(show, 4000); return; }
      shown = true;
      var c = doc.createElement('aside'); c.className = 'tl-nl'; c.setAttribute('aria-label', 'New tools by email');
      c.innerHTML = '<button type="button" class="tl-nl__x" aria-label="Close">&times;</button>' + nlForm(false).replace('<div class="tl-next__t">', '<div class="tl-next__t">');
      body().appendChild(c); requestAnimationFrame(function () { c.classList.add('is-on'); });
      c.querySelector('.tl-nl__x').addEventListener('click', function () { store.set('apNlX', String(Date.now())); c.remove(); });
    }
    function onUse(e) {
      var t = e.target; if (!t || !t.closest || t.closest('.ap-nav, .ap-foot, .ap-close, .ap-quotes, .ap-notice, #ap-cc, header, footer, .tl-next, .tl-nl')) return;
      if (e.type === 'pointerdown' && !t.closest('button, input, select, textarea, label, a[download], [role=button], canvas')) return;
      ['pointerdown', 'input', 'change'].forEach(function (k) { doc.removeEventListener(k, onUse, true); });
      usedAt = Date.now(); setTimeout(show, 25000);
    }
    ['pointerdown', 'input', 'change'].forEach(function (k) { doc.addEventListener(k, onUse, true); });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', initNext); else initNext();
})();
