/* Site header and footer behaviour: search (Cmd/Ctrl+K, "/"), menu pictures that load on first hover, and the footer lists that fold up on phones.
   Everything is read from the header and footer already on the page, so a menu edit in scripts/chrome.cjs shows up in search too. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var txt = function (el) { return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); };

  /* The page runtime may rebuild the body after this script runs, so everything below listens on the document
     (or is applied again when new nodes appear) instead of binding to elements once. */

  /* ---------- menu pictures: fetched the first time a menu is touched ---------- */
  var loadPics = function (e) {
    var dd = e.target.closest && e.target.closest('.ap-dd--mega'); if (!dd) return;
    dd.querySelectorAll('img[data-src]').forEach(function (i) { i.src = i.getAttribute('data-src'); i.removeAttribute('data-src'); });
  };
  ['mouseover', 'focusin', 'touchstart'].forEach(function (ev) { d.addEventListener(ev, loadPics, { passive: true, capture: true }); });

  /* ---------- footer: lists fold up on phones, always open on larger screens ---------- */
  var mq = window.matchMedia('(max-width:620px)'), applied = null;
  // Applies the current screen size to the lists. The size is re-read on load, resize, page show, tab focus and shortly after
  // start, because a page opened in a background tab or a window that is still resizing can report the wrong size at first.
  // A person's own open or close on a phone is kept: lists are only reset when the screen size class changes.
  function sync() {
    var small = window.innerWidth <= 620 || mq.matches, changed = small !== applied;
    d.querySelectorAll('.ap-foot__col').forEach(function (c) {
      if (changed || !c.hasAttribute('data-f')) { c.open = !small; c.setAttribute('data-f', '1'); }
    });
    applied = small;
  }
  sync();
  if (window.MutationObserver) {
    var mo = new MutationObserver(sync);
    mo.observe(d.documentElement, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 8000);
  }
  ['load', 'resize', 'pageshow', 'orientationchange'].forEach(function (ev) { window.addEventListener(ev, sync); });
  d.addEventListener('visibilitychange', sync);
  [300, 1500, 4000].forEach(function (ms) { setTimeout(sync, ms); });
  if (mq.addEventListener) mq.addEventListener('change', sync); else if (mq.addListener) mq.addListener(sync);
  d.addEventListener('click', function (e) { var s = e.target.closest && e.target.closest('.ap-foot__col > summary'); if (s && window.innerWidth > 620) e.preventDefault(); });

  /* ---------- search ---------- */
  var index = null;
  function build() {
    var out = [], seen = {};
    var add = function (o) { var k = o.href + '|' + o.t; if (!o.href || !o.t || seen[k]) return; seen[k] = 1; out.push(o); };
    var top = d.querySelector('.ap-nav__pill > a'); if (top) add({ t: txt(top), href: top.getAttribute('href'), d: 'Client sites, products and career', g: 'Pages' });
    d.querySelectorAll('.ap-dd--mega').forEach(function (dd) {
      var menu = txt(dd.querySelector('.ap-dd__btn'));
      var feat = dd.querySelector('.ap-mega__feat');
      if (feat) add({ t: txt(feat.querySelector('.ap-mega__ft')).replace(/Interactive$/, '').trim(), href: feat.getAttribute('href'), d: txt(feat.querySelector('.ap-mega__fd')), g: menu });
      dd.querySelectorAll('.ap-mega__g').forEach(function (g) {
        var h = txt(g.querySelector('.ap-mega__h'));
        g.querySelectorAll('.ap-mega__it').forEach(function (a) {
          var t = a.querySelector('.ap-mega__t').cloneNode(true), b = t.querySelector('.ap-mega__b'); if (b) b.remove();
          add({ t: txt(t), href: a.getAttribute('href'), d: txt(a.querySelector('.ap-mega__d')), g: menu, k: h, x: a.target === '_blank', dl: a.hasAttribute('download') });
        });
      });
    });
    d.querySelectorAll('.ap-foot__legal a').forEach(function (a) { add({ t: txt(a), href: a.getAttribute('href'), d: 'Legal', g: 'Pages' }); });
    return out;
  }
  var SUGGEST = ['/portfolio', '/case-studies', '/services', '/tools', '/contact', '/tools/resume-maker'];

  var pal, input, list, opener, items = [], sel = 0;
  function make() {
    pal = d.createElement('div'); pal.className = 'ap-pal'; pal.hidden = true;
    pal.innerHTML = '<div class="ap-pal__box" role="dialog" aria-modal="true" aria-label="Search the site">'
      + '<div class="ap-pal__in"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>'
      + '<input type="search" placeholder="Search pages and tools" aria-label="Search pages and tools" autocomplete="off" autocapitalize="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="ap-pal-list">'
      + '<button type="button" class="ap-pal__x" aria-label="Close search">Esc</button></div>'
      + '<div class="ap-pal__list" id="ap-pal-list" role="listbox"></div>'
      + '<div class="ap-pal__foot" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> to move</span><span><kbd>Enter</kbd> to open</span></div></div>';
    d.body.appendChild(pal);
    input = pal.querySelector('input'); list = pal.querySelector('.ap-pal__list');
    pal.addEventListener('mousedown', function (e) { if (e.target === pal) close(); });
    pal.querySelector('.ap-pal__x').addEventListener('click', close);
    input.addEventListener('input', render);
    input.addEventListener('keydown', key);
    list.addEventListener('mousemove', function (e) { var a = e.target.closest && e.target.closest('.ap-pal__it'); if (a) pick(+a.getAttribute('data-i'), false); });
    list.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('.ap-pal__it'); if (!a) return; e.preventDefault(); go(+a.getAttribute('data-i')); });
  }
  function score(it, q) {
    var t = it.t.toLowerCase(), hay = (it.t + ' ' + it.d + ' ' + (it.k || '') + ' ' + it.g).toLowerCase(), s = 0;
    for (var i = 0; i < q.length; i++) {
      if (hay.indexOf(q[i]) < 0) return -1;
      s += t.indexOf(q[i]) === 0 ? 4 : t.indexOf(q[i]) > 0 ? 3 : 1;
    }
    return s;
  }
  function row(it, i) {
    return '<a class="ap-pal__it" role="option" id="ap-pal-' + i + '" data-i="' + i + '" href="' + it.href + '"' + (it.x ? ' target="_blank" rel="noopener"' : '') + '><span class="ap-pal__t">' + esc(it.t) + '</span><span class="ap-pal__d">' + esc(it.d) + '</span><span class="ap-pal__g">' + esc(it.g) + '</span></a>';
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function render() {
    var q = input.value.toLowerCase().split(/\s+/).filter(Boolean), html = '';
    if (!q.length) {
      items = SUGGEST.map(function (h) { return index.filter(function (x) { return x.href === h; })[0]; }).filter(Boolean);
      html = '<p class="ap-pal__h">Suggested</p>' + items.map(row).join('');
    } else {
      items = index.map(function (it) { return { it: it, s: score(it, q) }; }).filter(function (r) { return r.s >= 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 12).map(function (r) { return r.it; });
      html = items.length ? items.map(row).join('') : '<p class="ap-pal__none">Nothing matches that. Try “resume”, “QR” or “Shopify”, or <a href="/contact">send a brief</a>.</p>';
    }
    list.innerHTML = html; sel = 0; pick(0, true);
  }
  function pick(i, scroll) {
    if (!items.length) { input.removeAttribute('aria-activedescendant'); return; }
    sel = (i + items.length) % items.length;
    list.querySelectorAll('.ap-pal__it').forEach(function (a) { a.setAttribute('aria-selected', +a.getAttribute('data-i') === sel ? 'true' : 'false'); });
    var cur = d.getElementById('ap-pal-' + sel); input.setAttribute('aria-activedescendant', 'ap-pal-' + sel);
    if (scroll && cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
  }
  function go(i) {
    var it = items[i]; if (!it) return;
    if (it.x) window.open(it.href, '_blank', 'noopener'); else { close(); location.href = it.href; }
  }
  function key(e) {
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) { e.preventDefault(); pick(sel + 1, true); }
    else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) { e.preventDefault(); pick(sel - 1, true); }
    else if (e.key === 'Enter') { e.preventDefault(); go(sel); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  }
  function open(from) {
    if (!pal) { index = build(); make(); }
    opener = from || d.activeElement;
    var sheet = d.querySelector('details.ap-ms'); if (sheet) sheet.open = false;
    pal.hidden = false; root.style.overflow = 'hidden'; input.value = ''; render(); input.focus();
  }
  function close() { if (!pal || pal.hidden) return; pal.hidden = true; root.style.overflow = ''; if (opener && opener.focus) opener.focus(); }
  d.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-ap-search]'); if (b) { e.preventDefault(); open(b); } });
  d.addEventListener('keydown', function (e) {
    var t = e.target, typing = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); pal && !pal.hidden ? close() : open(); }
    else if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); open(); }
  });
}());
