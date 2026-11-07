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
          if (p && p.then) p.then(function () { toast(k === 'write' ? 'Image copied' : 'Copied to clipboard'); win(doc.activeElement); }, function () {});
          return p;
        };
      } catch (e) {}
    });
    var lastDl = 0;
    function dl(a) {
      if (!a || !a.hasAttribute || !a.hasAttribute('download')) return;
      var now = Date.now(); if (now - lastDl < 400) return; lastDl = now;
      var n = a.getAttribute('download');
      toast(n ? 'Downloading ' + n : 'Download started'); win(a);
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

  /* ---------- after a win: one small, inline email offer right after the tool did its job ----------
     A copy or a download is the moment the tool has proved itself, so that is when it asks, once per page, below the result.
     Never a modal, never in the way: it sits in the page flow, has a "No thanks" that is remembered for 60 days (apNlX),
     and is not shown again once the visitor has subscribed anywhere on the site (apNlDone). The tools never depend on it. */
  var ls = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var winShown = false;
  // What the offer says, when it shows and how often are set in the admin desk (Pop-ups tab) and handled by window.apPop in site.js; without it nothing is shown.
  function win(src) {
    var P = window.apPop;
    if (winShown || !P || !/^\/tools\//.test(location.pathname)) return;
    winShown = true;
    P.cfg(function (c) {
      if (!P.can(c, 'afterUse')) return;
      setTimeout(function () {
        if (!P.can(c, 'afterUse') || doc.querySelector('#ap-rc')) return;   // the corner card is already asking
        var at = winAnchor(src); if (!at) return;
        // when the tool ends right above the "Try next" email box, light that box up instead of adding a second form
        var nl = doc.querySelector('.tl-next__nl'), nf = nl && nl.querySelector('form');
        if (nf && nl.getBoundingClientRect().top - at.getBoundingClientRect().bottom < 240) {
          nl.classList.add('tl-next__nl--hot'); nf.setAttribute('data-news', 'after-use'); P.mark(c, 'afterUse');
          var b = nl.querySelector('.tl-next__t b'); if (b) b.textContent = c.doneHead;
          return;
        }
        var w = doc.createElement('aside'); w.className = 'tl-win'; w.setAttribute('aria-label', 'New tools by email');
        var t = doc.createElement('div'); t.className = 'tl-win__t';
        var h = doc.createElement('b'); h.textContent = c.doneHead; var sp = doc.createElement('span'); sp.textContent = P.copy(c, 'tools', 'body') + ' ';
        var lk = doc.createElement('a'); lk.href = '/newsletter'; lk.textContent = 'What you get'; sp.appendChild(lk); t.appendChild(h); t.appendChild(sp); w.appendChild(t);
        var f = doc.createElement('form'); f.setAttribute('data-news', 'after-use'); f.noValidate = true;
        var ok = P.copy(c, 'tools', 'success'); if (ok) f.setAttribute('data-ok', ok);
        f.innerHTML = '<input name="hp" tabindex="-1" autocomplete="off" aria-hidden="true" class="tl-nl__hp"><input name="email" type="email" class="tl-input" placeholder="you@example.com" autocomplete="email" inputmode="email" aria-label="Email address" required maxlength="254"><button class="tl-btn tl-btn--p" type="submit"></button><p data-news-msg role="status"></p>';
        f.querySelector('button').textContent = P.copy(c, 'tools', 'button'); w.appendChild(f);
        var x = doc.createElement('button'); x.type = 'button'; x.className = 'tl-win__x'; x.textContent = P.copy(c, 'tools', 'dismiss'); w.appendChild(x);
        at.parentNode.insertBefore(w, at.nextSibling); P.mark(c, 'afterUse');
        x.addEventListener('click', function () { P.dismiss(c, 'afterUse'); w.remove(); });
        requestAnimationFrame(function () { w.classList.add('is-on'); });
      }, 1400);   // after the toast has had its moment
    });
  }
  // below the answer when the page marks one, otherwise below the block of the page the visitor just used
  function winAnchor(src) {
    var res = doc.querySelector('[data-tl-result]'), main = doc.querySelector('main');
    if (res && res.offsetParent !== null && !res.closest('.tl-hero') && res.getBoundingClientRect().width >= res.parentElement.getBoundingClientRect().width * 0.9) return res;   // a half-width answer (two columns) would squeeze the offer in beside it
    if (res && res.offsetParent !== null) src = res;
    if (!main) return null;
    var el = src && src.nodeType === 1 && main.contains(src) ? src : null;
    while (el && el.parentElement !== main) el = el.parentElement;
    if (el && !el.matches('.tl-hero, header, section[aria-label="About this tool"], .tl-next')) return el;
    var nx = main.querySelector('.tl-next'); return nx ? nx.previousElementSibling : null;
  }
  var print0 = window.print;   // résumé, SOP and invoice save their PDF through the print dialog
  if (typeof print0 === 'function') window.print = function () { var r = print0.apply(window, arguments); win(doc.activeElement); return r; };

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
    var force = /[?&]nl=show\b/.test(location.search);   // ?nl=show clears this browser's memory and shows the offer after a moment
    if (force) { try { localStorage.removeItem('apNlX'); localStorage.removeItem('apNlDone'); } catch (e) {} }
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
      return '<div class="tl-next__t"><b>New free tools by email</b><span>At most one email a month, plus one practical tip. Unsubscribe in one click. <a href="/newsletter">What you get</a> · <a href="/privacy">Privacy</a></span></div>'
        + '<form data-news="' + (sub === 0 ? 'card' : 'inline') + '" novalidate><input name="hp" tabindex="-1" autocomplete="off" aria-hidden="true" class="tl-nl__hp"><input name="email" type="email" class="tl-input" placeholder="you@example.com" autocomplete="email" inputmode="email" aria-label="Email address" required><button class="tl-btn tl-btn--p" type="submit">Subscribe</button><p data-news-msg role="status"></p></form>';
    }
    // a successful sign-up is remembered, so neither the form nor the card asks again
    new MutationObserver(function (m) {
      m.forEach(function (r) { var t = r.target; if (t.matches && t.matches('[data-news-msg].is-ok') && t.closest('.tl-next, .tl-nl, .tl-win')) { store.set('apNlDone', '1'); setTimeout(function () { var c = doc.querySelector('.tl-nl'); if (c) c.remove(); var x = doc.querySelector('.tl-win__x'); if (x) x.remove(); }, 3500); } });
    }).observe(doc.body, { subtree: true, attributes: true, attributeFilter: ['class'] });

    // the floating card: after real use, never with the cookie notice up. Look, words, timing and limits come from the admin desk through window.apPop (site.js).
    if (done) return;
    var armTries = 0;
    (function arm() {
      var P = window.apPop;   // site.js loads right after this file, so it can still be a moment away
      if (!P) return void (++armTries < 40 && setTimeout(arm, 150));
      var pop = P.start('tool', { guard: function () { return !doc.querySelector('.tl-win'); } });   // the inline offer, if it is already asking, takes the place of the card
      if (!pop) return;
      function onUse(e) {
        var t = e.target; if (!t || !t.closest || t.closest('.ap-nav, .ap-foot, .ap-close, .ap-quotes, .ap-notice, #ap-cc, header, footer, .tl-next, #ap-rc')) return;
        if (e.type === 'pointerdown' && !t.closest('button, input, select, textarea, label, a[download], [role=button], canvas')) return;
        ['pointerdown', 'input', 'change'].forEach(function (k) { doc.removeEventListener(k, onUse, true); });
        pop.use();
      }
      ['pointerdown', 'input', 'change'].forEach(function (k) { doc.addEventListener(k, onUse, true); });
    })();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', initNext); else initNext();
})();
