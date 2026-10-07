/* Blog and case-study pages: reading progress, the table of contents highlight, and the copy-link button. No dependencies. */
(function () {
  'use strict';
  var bar = document.querySelector('.bl-progress i'), art = document.querySelector('.bl-md');
  if (bar && art) {
    var tick = false;
    var upd = function () {
      tick = false;
      var r = art.getBoundingClientRect(), h = r.height - innerHeight * 0.5, p = h > 0 ? Math.min(1, Math.max(0, -r.top / h)) : 0;
      bar.style.width = (p * 100).toFixed(1) + '%';
    };
    addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', upd); upd();
  }
  var links = [].slice.call(document.querySelectorAll('.bl-toc a'));
  if (links.length && 'IntersectionObserver' in window) {
    var map = {}; links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting && map[e.target.id]) { links.forEach(function (a) { a.classList.remove('is-on'); }); map[e.target.id].classList.add('is-on'); } });
    }, { rootMargin: '-90px 0px -65% 0px' });
    Object.keys(map).forEach(function (id) { var h = document.getElementById(id); if (h) io.observe(h); });
  }
  // count a view after the page has been open for a few seconds; the server ignores crawlers and repeat visits
  var art2 = document.querySelector('[data-pid]');
  if (art2 && navigator.sendBeacon) setTimeout(function () { try { navigator.sendBeacon('/api/config?a=site&p=hit&id=' + art2.getAttribute('data-pid')); } catch (e) { /* views are best effort */ } }, 4000);
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copy]'); if (!b) return;
    var url = b.getAttribute('data-copy'), done = function () { var t = b.textContent; b.textContent = 'Copied'; setTimeout(function () { b.textContent = t; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, done); else done();
  });
})();
