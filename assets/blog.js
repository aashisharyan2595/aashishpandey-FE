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
  // FAQ and Sources fold away; open the one a link, the contents list or a search lands in, and open all of them when printing
  var openFor = function (el) { for (var n = el; n; n = n.parentNode) if (n.tagName === 'DETAILS') n.open = true; };
  var hashOpen = function () { if (location.hash.length > 1) { var t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) { openFor(t); t.scrollIntoView(); } } };
  hashOpen(); addEventListener('hashchange', hashOpen);
  addEventListener('beforeprint', function () { [].forEach.call(document.querySelectorAll('.bl-acc'), function (d) { d.open = true; }); });
  // count a view after the page has been open for a few seconds; the server ignores crawlers and repeat visits
  // Layout tests: TESTS lists the ones that are running (empty = every visitor sees the current layout). Each page view gets one arm per test, picked at random with no cookie or storage,
  // and the arm is sent with the view and the read. A reviewer can look at an arm with ?ex=cover:b (not counted). Edit this list to start or stop a test.
  var TESTS = ['cover', 'nl'], art2 = document.querySelector('[data-pid]'), post = document.querySelector('.bl-post[data-pid]');
  var arms = {}, forced = /[?&]ex=([a-z]+):([a-z])/.exec(location.search);
  if (post) {
    TESTS.forEach(function (t) { arms[t] = Math.random() < 0.5 ? 'a' : 'b'; });
    if (forced) arms = {}, arms[forced[1]] = forced[2];
    Object.keys(arms).forEach(function (t) { if (arms[t] === 'b') post.classList.add('ex-' + t + '-b'); });
    if (arms.nl === 'b') { var nl = post.querySelector('.bl-nl-end'), hs = post.querySelectorAll('.bl-md h2'); if (nl && hs.length > 3) hs[2].parentNode.insertBefore(nl, hs[2]); }   // newsletter card moves from the end to before the third section
  }
  var abq = forced ? '' : '&ab=' + Object.keys(arms).map(function (t) { return t + ':' + arms[t]; }).join(',');
  var ping = function (p, extra) { try { navigator.sendBeacon('/api/config?a=site&p=' + p + '&id=' + art2.getAttribute('data-pid') + (extra || '')); } catch (e) { /* counts are best effort */ } };
  if (art2 && navigator.sendBeacon) {
    setTimeout(function () { ping('hit', abq); }, 4000);
    // a read = scrolled through most of the article, or still here after 45 seconds with some scrolling (counted once)
    var read = false, scrolled = false, doRead = function () { if (!read) { read = true; ping('read', abq); } };
    addEventListener('scroll', function () { scrolled = true; if (art && art.getBoundingClientRect().bottom < innerHeight * 1.6) doRead(); }, { passive: true });
    setTimeout(function () { if (scrolled) doRead(); }, 45000);
  }
  // blog index: one view per visit, and a click on a post's card (the click rate of its picture and title)
  var cards = document.querySelectorAll('[data-cid]');
  if (!art2 && cards.length && navigator.sendBeacon) {
    setTimeout(function () { try { navigator.sendBeacon('/api/config?a=site&p=card&k=v'); } catch (e) { /* best effort */ } }, 4000);
    document.addEventListener('click', function (e) { var c = e.target.closest && e.target.closest('[data-cid]'); if (c && e.target.closest('a')) try { navigator.sendBeacon('/api/config?a=site&p=card&k=c&id=' + c.getAttribute('data-cid')); } catch (x) { /* best effort */ } });
  }
  // Short: the YouTube player is only fetched when the reader presses play
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.md-play'), box = b && b.parentNode, id = box && box.getAttribute('data-yt');
    if (!id || !/^[\w-]{6,20}$/.test(id)) return;
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1'; f.title = 'Short video summary';
    f.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true; f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    box.textContent = ''; box.appendChild(f); f.focus();
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copy]'); if (!b) return;
    var url = b.getAttribute('data-copy'), done = function () { var t = b.textContent; b.textContent = 'Copied'; setTimeout(function () { b.textContent = t; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, done); else done();
  });
})();
