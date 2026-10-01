/* /portfolio hero card: tilt and glare that follow the pointer, number count-up.
   Delegated, so it works on the prerendered block and on the hydrated one. */
(function () {
  'use strict';
  var rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (!rm && fine) {
    var raf = 0, last = null;
    document.addEventListener('pointermove', function (ev) {
      var card = ev.target.closest && ev.target.closest('.pfh');
      if (!card) { if (last) { reset(last); last = null; } return; }
      last = card;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = card.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
        var tilt = card.querySelector('.pfh__tilt'); if (!tilt) return;
        card.classList.add('is-live');
        tilt.style.setProperty('--ry', ((x - .5) * 14).toFixed(2) + 'deg');
        tilt.style.setProperty('--rx', ((.5 - y) * 11).toFixed(2) + 'deg');
        tilt.style.setProperty('--px', ((.5 - x) * 18).toFixed(1) + 'px');
        tilt.style.setProperty('--py', ((.5 - y) * 18).toFixed(1) + 'px');
        card.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      });
    }, { passive: true });
    document.addEventListener('pointerleave', function () { if (last) { reset(last); last = null; } }, true);
    function reset(card) {
      card.classList.remove('is-live');
      var t = card.querySelector('.pfh__tilt'); if (!t) return;
      ['--rx', '--ry', '--px', '--py'].forEach(function (k) { t.style.removeProperty(k); });
    }
  }

  // count the chip numbers up once, when they are first seen
  function count(el) {
    if (el.__done) return; el.__done = true;
    var to = +el.getAttribute('data-pfc'), suf = el.getAttribute('data-sfx') || '';
    if (rm) { el.textContent = to + suf; return; }
    var t0 = performance.now(), D = 1500;
    (function step(now) { var p = Math.min(1, (now - t0) / D); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); })(t0 + 1);
  }
  var armedOnce = new WeakSet();
  function arm() {
    document.querySelectorAll('.pfh [data-pfc]').forEach(function (el) {
      if (armedOnce.has(el)) return; armedOnce.add(el);
      if (!rm) el.textContent = '0' + (el.getAttribute('data-sfx') || '');
      setTimeout(function () { count(el); }, 1100);
    });
  }
  arm();
  new MutationObserver(arm).observe(document.documentElement, { childList: true, subtree: true });
})();
