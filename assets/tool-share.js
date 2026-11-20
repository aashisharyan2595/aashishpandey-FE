/* Share button on the tool cards of the /tools hub. It reuses the site's share dialog (assets/share-card.js): download the
 * card image, copy it, copy the link or open the phone's share sheet. Nothing is configured per tool. The button reads the
 * name, description, link and picture from the card it sits in:
 *
 *   <div data-tc="1"> <a data-card href="/tools/slug"> ... <img data-tool-art src="..."> <h3>Name</h3> <p>Description</p> </a>
 *     <button class="tc-share" data-share-tool aria-label="Share Name"> ... </button> </div>
 *
 * A new tool card that follows that markup gets sharing automatically.
 */
(function () {
  'use strict';
  function open(tc) {
    var link = tc.querySelector('a[href^="/tools/"]'), h = tc.querySelector('h3'), p = tc.querySelector('p'), art = tc.querySelector('img[data-tool-art]');
    if (!link || !h || !window.ApShare) return;
    var name = h.textContent.trim(), desc = p ? p.textContent.trim() : '', url = new URL(link.getAttribute('href'), location.origin).href;
    var slug = link.getAttribute('href').split('/').pop();
    var go = function (img) {
      window.ApShare.open({
        kicker: 'Free tool', title: 'Share ' + name, file: slug + '.png', url: url, text: name + ': ' + desc, alt: name + ' on aashishpandey.com',
        draw: function (c) {
          var ctx = c.ctx, x = 60;
          ctx.textAlign = 'left'; ctx.fillStyle = '#f4efe6'; ctx.font = '600 64px ' + c.F;
          var y = c.wrap(name, x, 190, img ? 470 : 1000, 72, 2);
          ctx.fillStyle = 'rgba(244,239,230,.72)'; ctx.font = '400 28px ' + c.F; y = c.wrap(desc, x, y + 14, img ? 470 : 900, 40, 5);
          c.pill(x, 500, 'Free', { color: '#7ff3e1', line: 'rgba(127,243,225,.4)' }); c.pill(x + 110, 500, 'Runs in your browser');
          if (img) { c.rr(580, 150, 560, 280, 22); ctx.fillStyle = '#f3eee4'; ctx.fill(); ctx.save(); c.rr(580, 150, 560, 280, 22); ctx.clip(); ctx.drawImage(img, 580, 150, 560, 280); ctx.restore(); }
        }
      });
    };
    if (!art) return go(null);
    var im = new Image(); im.onload = function () { go(im); }; im.onerror = function () { go(null); }; im.src = art.currentSrc || art.src;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-share-tool]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    open(b.closest('[data-tc]'));
  });
})();
