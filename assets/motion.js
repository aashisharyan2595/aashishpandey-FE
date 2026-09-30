/* Shared micro-interactions for static pages: nav state, scroll reveals, number count-ups, card spotlight.
   Uses the Web Animations API only (no inline style edits), so React re-renders never fight it. */
(function () {
  var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function navState() { var n = document.querySelector('.ap-nav'); if (n) n.classList.toggle('is-scrolled', scrollY > 8); }
  addEventListener('scroll', navState, { passive: true });
  document.addEventListener('click', function (e) {
    var up = e.target.closest && e.target.closest('.ap-foot__up'); if (up) { e.preventDefault(); scrollTo({ top: 0, behavior: rm ? 'auto' : 'smooth' }); }
    var dd = e.target.closest && e.target.closest('.ap-dd__btn'); if (dd && document.activeElement !== dd) dd.focus();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.activeElement && document.activeElement.closest && document.activeElement.closest('.ap-dd')) document.activeElement.blur(); });

  var EASE = 'cubic-bezier(.16,1,.3,1)', seen = new WeakSet(), io;
  function countUp(el) {
    var txt = el.textContent.trim(), m = txt.match(/^([^\d]*)(\d[\d,]*)(\.\d+)?(.*)$/);
    if (!m || m[4].length > 4 || /\d/.test(m[4])) return;
    var to = parseFloat((m[2] + (m[3] || '')).replace(/,/g, '')), dec = m[3] ? m[3].length - 1 : 0, comma = m[2].indexOf(',') > -1, t0 = performance.now(), D = 1300;
    function fmt(v) { var s = v.toFixed(dec); if (comma) s = Number(s).toLocaleString('en-US', { minimumFractionDigits: dec }); return m[1] + s + m[4]; }
    (function step(now) { var p = Math.min(1, (now - t0) / D); el.textContent = fmt(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); else el.textContent = txt; })(t0);
  }
  function scan() {
    if (rm || !Element.prototype.animate) return;
    if (document.querySelector('[data-rv]')) return; // page runs its own motion
    var main = document.querySelector('x-dc main, main'); if (!main || document.getElementById('ap-pre')) return;
    var sel = 'main h1, main h2, main > * > p, main section > div > p, main article, main figure, main section li, main details, main dl > div, main section > div > a, main ol > li';
    var vh = innerHeight, groups = new Map();
    main.querySelectorAll(sel).forEach(function (el) {
      if (seen.has(el) || el.closest('.ap-nav,.ap-foot,[role=dialog]')) return; seen.add(el);
      var r = el.getBoundingClientRect(); if (r.top < vh * 0.92 || r.height === 0) return;
      var p = el.parentElement, i = groups.get(p) || 0; groups.set(p, i + 1);
      var a = el.animate([{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'none' }], { duration: 850, delay: Math.min(i, 6) * 70, easing: EASE, fill: 'both' });
      a.pause(); el.__apRv = a; io.observe(el);
    });
    main.querySelectorAll('[data-count], dd, span').forEach(function (el) {
      if (el.__apCnt || el.children.length) return; var fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 30 && !el.hasAttribute('data-count')) return;
      if (!/^\D{0,2}\d[\d,.]*\D{0,4}$/.test(el.textContent.trim())) return; el.__apCnt = 1; io.observe(el);
    });
  }
  function init() {
    navState();
    if (!('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (!en.isIntersecting) return; var t = en.target; if (t.__apRv) t.__apRv.play(); if (t.__apCnt === 1) { t.__apCnt = 2; countUp(t); } io.unobserve(t); }); }, { rootMargin: '0px 0px -6% 0px' });
    var tries = 0; (function wait() { if (document.getElementById('ap-pre') && tries++ < 60) return setTimeout(wait, 100); setTimeout(scan, 120); })();
    var mt; new MutationObserver(function () { clearTimeout(mt); mt = setTimeout(scan, 250); }).observe(document.body, { childList: true, subtree: true });
    // card spotlight: any link-card or article with a border radius gets a soft cursor glow
    document.addEventListener('pointermove', function (e) { var c = e.target.closest && e.target.closest('main article, main a[href^="/work-"]'); if (!c) return; var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }, { passive: true });
  }
  /* Brand motion: the site is a ride at dusk, so motion borrows from the road.
     Odometer = scroll progress, headlight = card glow, road markings = eyebrow rules,
     lanterns = step numbers lighting up, and FAQ answers slide open like a panel. */
  function brand() {
    // odometer: distance travelled down the page
    if (!document.querySelector('.ap-odo')) {
      var odo = document.createElement('div'); odo.className = 'ap-odo'; odo.setAttribute('aria-hidden', 'true'); document.body.appendChild(odo);
      var tick = function () { var h = document.documentElement.scrollHeight - innerHeight; odo.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')'; };
      addEventListener('scroll', tick, { passive: true }); addEventListener('resize', tick); tick();
    }
    if (rm || !Element.prototype.animate) return;
    var vis = new IntersectionObserver(function (es) { es.forEach(function (en) { if (!en.isIntersecting) return; var f = en.target.__apIn; if (f) f(); vis.unobserve(en.target); }); }, { rootMargin: '0px 0px -10% 0px' });
    function onView(el, fn) { if (el.__apInSet) return; el.__apInSet = 1; el.__apIn = fn; vis.observe(el); }
    var main = document.querySelector('main'); if (!main) return;
    // road markings: eyebrow rules draw in from the left
    main.querySelectorAll('span').forEach(function (s) {
      var st = s.getAttribute('style') || ''; if (!/width:\s*24px;\s*height:\s*1px/.test(st)) return;
      var a = s.animate([{ transform: 'scaleX(0)', transformOrigin: 'left' }, { transform: 'scaleX(1)', transformOrigin: 'left' }], { duration: 900, delay: 250, easing: EASE, fill: 'both' }); a.pause();
      onView(s, function () { a.play(); });
    });
    // lanterns: step labels light up one after another
    main.querySelectorAll('ol > li > span:first-child').forEach(function (s, i) {
      if (!/^Step \d/.test(s.textContent.trim())) return;
      var a = s.animate([{ opacity: .25, textShadow: '0 0 0 rgba(245,184,103,0)' }, { opacity: 1, textShadow: '0 0 14px rgba(245,184,103,.9)', offset: .55 }, { opacity: 1, textShadow: '0 0 0 rgba(245,184,103,0)' }], { duration: 1400, delay: (i % 3) * 220, easing: 'ease-out', fill: 'both' }); a.pause();
      onView(s, function () { a.play(); });
    });
    // headlight: cards pick up a warm glow that follows the cursor
    main.querySelectorAll('a, li, article, aside, form').forEach(function (c) {
      if (c.hasAttribute('data-ap-glow') || c.closest('[data-ap-glow]')) return;
      var cs = getComputedStyle(c), r = parseFloat(cs.borderTopLeftRadius); if (!(r >= 16 && r < 60) || parseFloat(cs.borderTopWidth) < 1 || c.offsetWidth < 200) return;
      c.setAttribute('data-ap-glow', ''); if (cs.position === 'static') c.style.position = 'relative';
    });
  }
  // FAQ: answers slide open and closed instead of snapping
  document.addEventListener('click', function (e) {
    var sm = e.target.closest && e.target.closest('details > summary'); if (!sm || rm || !Element.prototype.animate) return;
    var d = sm.parentElement, body = sm.nextElementSibling; if (!body || d.__apBusy) return;
    e.preventDefault(); d.__apBusy = 1;
    if (!d.open) { d.open = true; var h = body.scrollHeight; body.animate([{ height: '0px', opacity: 0, overflow: 'hidden' }, { height: h + 'px', opacity: 1, overflow: 'hidden' }], { duration: 380, easing: EASE }).onfinish = function () { d.__apBusy = 0; }; }
    else { var h2 = body.scrollHeight; body.animate([{ height: h2 + 'px', opacity: 1, overflow: 'hidden' }, { height: '0px', opacity: 0, overflow: 'hidden' }], { duration: 260, easing: 'ease-in' }).onfinish = function () { d.open = false; d.__apBusy = 0; }; }
  });
  document.addEventListener('pointermove', function (e) { var c = e.target.closest && e.target.closest('[data-ap-glow]'); if (!c) return; var r = c.getBoundingClientRect(); c.style.setProperty('--gx', (e.clientX - r.left) + 'px'); c.style.setProperty('--gy', (e.clientY - r.top) + 'px'); }, { passive: true });
  var bt; function brandSoon() { clearTimeout(bt); bt = setTimeout(function () { if (document.getElementById('ap-pre')) return brandSoon(); brand(); }, 300); }
  new MutationObserver(brandSoon).observe(document.documentElement, { childList: true, subtree: true });
  brandSoon();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
