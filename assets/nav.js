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
          add({ t: txt(t), href: a.getAttribute('href'), d: txt(a.querySelector('.ap-mega__d')), g: menu, k: h, x: a.target === '_blank', dl: a.hasAttribute('download'), a: a.getAttribute('data-k') || '' });
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
  /* ---------- matching ----------
     A tool is found by its name, by the other names listed for it in scripts/tool-search.json (they arrive here as data-k on its menu link),
     or by its short description, in that order of weight. Typos are forgiven (one slip in a short word, two in a long one), a run-together word
     such as "timezone" matches "time zone", and every word typed has to match something. Used by this search box and by the /tools page. */
  var norm = function (v) { return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim(); };
  var STOP = ' a an the my me i we to for of and or in on with how do can what is online free tool tools make create get best ';
  var words = function (v) { // typed text as words, without filler such as "free" or "my" (unless that leaves nothing)
    var all = norm(v).split(' ').filter(Boolean), keep = all.filter(function (w) { return STOP.indexOf(' ' + w + ' ') < 0; });
    return keep.length ? keep : all;
  };
  function dist(a, b, max) { // Damerau-Levenshtein (a swap of two letters counts as one slip), gives up above max
    var la = a.length, lb = b.length; if (Math.abs(la - lb) > max) return max + 1;
    var p2 = null, p1 = [], i, j, c, row;
    for (j = 0; j <= lb; j++) p1[j] = j;
    for (i = 1; i <= la; i++) {
      row = [i]; var low = i;
      for (j = 1; j <= lb; j++) {
        c = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
        row[j] = Math.min(p1[j] + 1, row[j - 1] + 1, p1[j - 1] + c);
        if (i > 1 && j > 1 && a.charCodeAt(i - 1) === b.charCodeAt(j - 2) && a.charCodeAt(i - 2) === b.charCodeAt(j - 1)) row[j] = Math.min(row[j], p2[j - 2] + 1);
        if (row[j] < low) low = row[j];
      }
      if (low > max) return max + 1;
      p2 = p1; p1 = row;
    }
    return p1[lb];
  }
  function prep(it) {
    if (it.P) return it.P;
    var ph = (it.a ? it.a.split(',') : []).map(norm).filter(Boolean), tk = {}, add = function (x) { x.split(' ').forEach(function (w) { if (w) tk[w] = 1; }); };
    ph.forEach(add);
    var nm = norm(it.t), ds = norm(it.d + ' ' + (it.k || '') + ' ' + it.g);
    return (it.P = { nm: nm, nt: nm.split(' '), ph: ph, at: Object.keys(tk), ds: ds, dt: ds.split(' '), sq: [nm.replace(/ /g, '')].concat(ph.map(function (x) { return x.replace(/ /g, ''); })) });
  }
  // how well one typed word matches one tool (0 = not at all). fuzz = how many slips to forgive (loosened for the "closest tools" list)
  function wordScore(P, w, fuzz) {
    var best = 0, i, t, sc, tol = w.length < 4 ? 0 : w.length < 10 ? 1 : 2; if (fuzz && w.length > 5) tol = Math.min(3, tol + 1);
    for (i = 0; i < P.nt.length; i++) { t = P.nt[i]; sc = t === w ? 100 : t.indexOf(w) === 0 ? 92 : t.indexOf(w) > 0 && w.length > 2 ? 70 : 0; if (sc > best) best = sc; }
    if (best >= 92) return best;
    if (P.ph.some(function (x) { return x === w; }) || P.at.indexOf(w) >= 0) best = Math.max(best, 66);
    else for (i = 0; i < P.at.length; i++) { t = P.at[i]; if (t.indexOf(w) === 0) best = Math.max(best, 58); else if (w.length > 2 && t.indexOf(w) > 0) best = Math.max(best, 40); }
    if (best < 58) for (i = 0; i < P.sq.length; i++) { t = P.sq[i]; if (t.indexOf(w) === 0 && w.length > 3) best = Math.max(best, i ? 56 : 88); else if (w.length > 3 && t.indexOf(w) > 0) best = Math.max(best, 38); }
    if (best < 50) for (i = 0; i < P.dt.length; i++) { t = P.dt[i]; if (t.indexOf(w) === 0) best = Math.max(best, 22); else if (w.length > 2 && t.indexOf(w) > 0) best = Math.max(best, 12); }
    if (!best && tol && w.length > 3) { // typos: against the name words, the other names' words and the run-together forms
      var d, m = tol + 1;
      P.nt.forEach(function (x) { d = dist(w, x, tol); if (d < m) m = d; });
      P.at.forEach(function (x) { d = dist(w, x.slice(0, w.length + 1), tol); if (d < m) m = d; d = dist(w, x, tol); if (d < m) m = d; });
      P.sq.forEach(function (x) { d = dist(w, x, tol); if (d < m) m = d; });
      if (m <= tol) best = 46 - 8 * m;
    }
    return best;
  }
  function score(it, q, any) { // q = words; every word must match unless any is set (closest-tools list)
    var P = prep(it), s = 0, hit = 0, i, v;
    for (i = 0; i < q.length; i++) { v = wordScore(P, q[i], any); if (v) { s += v; hit++; } else if (!any) return -1; }
    if (!hit) return -1;
    var whole = q.join(' ');
    if (P.nm === whole) s += 60; else if (P.nm.indexOf(whole) === 0) s += 25;
    return s - (any ? 20 * (q.length - hit) : 0);
  }
  var getIndex = function () { if (!index || !index.length) index = build(); return index; };
  function rank(q, any) {
    return getIndex().map(function (it, n) { return { it: it, s: score(it, q, any), n: n }; }).filter(function (r) { return r.s >= 0; })
      .sort(function (a, b) { return b.s - a.s || a.n - b.n; });
  }
  // for the /tools page: tool links in best-first order for what was typed ([] when nothing matches)
  window.apToolMatch = function (text) {
    var q = words(text); if (!q.length) return null;
    return rank(q).filter(function (r) { return /^\/tools\/[^?#]/.test(r.it.href) || r.it.href === '/tools/pad'; }).map(function (r) { return r.it.href; });
  };
  window.apToolNear = function (text, n) { // nearest tools when nothing matches: [{href, t}]
    var q = words(text), out = [];
    rank(q, true).forEach(function (r) { if (r.s >= 30 && out.length < (n || 4) && /^\/tools\//.test(r.it.href)) out.push({ href: r.it.href, t: r.it.t }); });
    return out;
  };
  function row(it, i) {
    return '<a class="ap-pal__it" role="option" id="ap-pal-' + i + '" data-i="' + i + '" href="' + it.href + '"' + (it.x ? ' target="_blank" rel="noopener"' : '') + '><span class="ap-pal__t">' + esc(it.t) + '</span><span class="ap-pal__d">' + esc(it.d) + '</span><span class="ap-pal__g">' + esc(it.g) + '</span></a>';
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function render() {
    var q = words(input.value), html = '';
    getIndex();
    if (!q.length) {
      items = SUGGEST.map(function (h) { return index.filter(function (x) { return x.href === h; })[0]; }).filter(Boolean);
      html = '<p class="ap-pal__h">Suggested</p>' + items.map(row).join('');
    } else {
      items = rank(q).slice(0, 12).map(function (r) { return r.it; });
      if (items.length) html = items.map(row).join('');
      else {
        // nothing matched even with typos allowed: offer the nearest tools, or the popular ones
        items = rank(q, true).filter(function (r) { return r.s >= 30 && /^\/tools\//.test(r.it.href); }).slice(0, 4).map(function (r) { return r.it; });
        var near = !!items.length;
        if (!near) items = ['/tools/resume-maker', '/tools/qr-code-generator', '/tools/invoice-generator', '/tools/image-resizer'].map(function (h) { return index.filter(function (x) { return x.href === h; })[0]; }).filter(Boolean);
        html = '<p class="ap-pal__none">No tool is called that. ' + (near ? 'Closest:' : 'Popular tools:') + '</p>' + items.map(row).join('')
          + '<p class="ap-pal__none">Missing one? <a href="/contact">Tell me what you need</a>.</p>';
      }
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

  /* ---------- "Most used" tools in the Tools menu ----------
     The four tiles are filled in this order, without repeats:
       1. tools this visitor opened before, most used first (fades with time, so recent visits count more)
       2. the site-wide top tools of the last 30 days (/api/config?a=top, cached by the CDN and here for 12 hours)
       3. the defaults written into the page by scripts/chrome.cjs
     Visits are kept only in this browser (localStorage key apTools) and are never sent anywhere. The menu is closed
     while this runs, so nothing moves on screen; if storage is blocked the defaults simply stay. */
  var KEY = 'apTools', TOPKEY = 'apToolsTop', HALF = 30 * 864e5, SLOTS = 4;
  var store = function (k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } };
  var known = function () { var o = {}; d.querySelectorAll('.ap-mega__g .ap-mega__it, .ap-ms__tiles .ap-ms__tile').forEach(function (a) { o[a.getAttribute('href')] = 1; }); return o; };
  (function remember() {
    var m = /^\/tools\/([a-z0-9-]+)/.exec(location.pathname), h = m && '/tools/' + m[1];
    if (!h || !known()[h]) return;
    var all = store(KEY) || {}, now = Date.now(), it = all[h] || { s: 0, t: now };
    if (now - it.t < 30 * 6e4 && it.s) { it.t = now; } else { it.s = it.s * Math.pow(0.5, (now - it.t) / HALF) + 1; it.t = now; }   // a reload within 30 minutes is the same visit
    all[h] = it;
    var keys = Object.keys(all).sort(function (a, b) { return all[b].t - all[a].t; });
    keys.slice(40).forEach(function (k) { delete all[k]; });
    store(KEY, all);
  }());
  function popTools(defs) {
    var ok = known(), out = [], mine = 0, all = store(KEY) || {}, now = Date.now(), top = store(TOPKEY);
    var add = function (h) { if (out.length < SLOTS && ok[h] && out.indexOf(h) < 0) { out.push(h); return true; } };
    Object.keys(all).map(function (h) { return { h: h, s: all[h].s * Math.pow(0.5, (now - all[h].t) / HALF) }; })
      .sort(function (a, b) { return b.s - a.s; }).forEach(function (r) { if (add(r.h)) mine++; });
    ((top && top.list) || []).forEach(add); defs.forEach(add);
    return { list: out, mine: mine };
  }
  function tile(h, phone) {
    var src = d.querySelector((phone ? '.ap-ms__tiles .ap-ms__tile' : '.ap-mega__g .ap-mega__it') + '[href="' + h + '"]'); if (!src) return null;
    var a = d.createElement('a'), ic = src.querySelector('.ap-mega__ic');
    a.href = h;
    if (phone) { a.className = 'ap-ms__tile'; a.innerHTML = ic.outerHTML + '<span></span>'; a.lastChild.textContent = txt(src); return a; }
    var t = src.querySelector('.ap-mega__t'), name = t ? txt(t.firstChild) : txt(src);
    a.className = 'ap-mega__tile'; a.setAttribute('role', 'menuitem');
    a.innerHTML = ic.outerHTML + '<span class="ap-mega__tx"><span class="ap-mega__t"></span><span class="ap-mega__d"></span></span>';
    a.querySelector('.ap-mega__t').textContent = name; a.querySelector('.ap-mega__d').textContent = txt(src.querySelector('.ap-mega__d'));
    return a;
  }
  function fillPop() {
    d.querySelectorAll('[data-ap-pop]').forEach(function (box) {
      var phone = box.classList.contains('ap-ms__pop'), grid = box.querySelector(phone ? '.ap-ms__tiles' : '.ap-mega__tiles'), head = box.querySelector('p');
      if (!grid || !head) return;
      if (!box.getAttribute('data-def')) box.setAttribute('data-def', [].map.call(grid.children, function (a) { return a.getAttribute('href'); }).join(' '));
      var r = popTools(box.getAttribute('data-def').split(' ')), sig = r.list.join(' ') + '|' + r.mine;
      if (box.getAttribute('data-sig') === sig) return;
      var tiles = r.list.map(function (h) { return tile(h, phone); });
      if (tiles.some(function (x) { return !x; })) return;
      grid.textContent = ''; tiles.forEach(function (x) { grid.appendChild(x); });
      head.textContent = !r.mine ? 'Most used' : r.mine >= SLOTS ? 'Your tools' : 'Your tools and most used';
      box.setAttribute('data-sig', sig);
    });
  }
  fillPop();
  ['mouseover', 'focusin', 'touchstart'].forEach(function (ev) { d.addEventListener(ev, function (e) { if (e.target.closest && e.target.closest('.ap-dd--mega, .ap-ms')) fillPop(); }, { passive: true, capture: true }); });
  window.addEventListener('pageshow', fillPop);
  // site-wide top tools: one small CDN-cached request at most every 12 hours, after the page has settled
  var top = store(TOPKEY);
  if (!(top && Date.now() - top.t < 12 * 36e5) && window.fetch && !/^(localhost|127\.)/.test(location.hostname)) {
    var later = window.requestIdleCallback || function (f) { setTimeout(f, 2500); };
    window.addEventListener('load', function () { later(function () {
      fetch('/api/config?a=top').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        if (j && j.tools) { store(TOPKEY, { t: Date.now(), list: j.tools.map(function (k) { return '/tools/' + k; }) }); fillPop(); }
      }).catch(function () { /* the defaults stay */ });
    }); });
  }
}());
