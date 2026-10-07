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
})();
