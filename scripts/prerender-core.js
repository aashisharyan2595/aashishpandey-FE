/* Static prerender for Design Component pages.
   Renders each page's template to plain HTML (control flow resolved by its hints, live values dropped)
   and places it in <div id="ap-pre"> before <x-dc>, so content paints before React loads.
   The page's component removes #ap-pre on mount. Used by scripts/prerender.cjs at deploy. */
(function () {
  var PAGES = {
    'Portfolio.dc.html': {
      region: ['<!-- intro -->', '<!-- top bar -->'],
      open: '<div id="ap-pre" style="position:fixed;inset:0;z-index:30;background:radial-gradient(120% 90% at 50% 100%,#e29a72 0%,#7a5a8e 45%,#2a3a7c 100%);color:#f3ead9;font-family:\'Instrument Sans\',system-ui,sans-serif;">'
        + '<nav style="position:absolute;top:20px;left:24px;right:24px;z-index:1;display:flex;justify-content:space-between;align-items:center;gap:12px;">'
        + '<a href="/" style="color:#fff6ea;font-family:\'Cormorant Garamond\',serif;font-size:26px;text-decoration:none;">Aashish Pandey</a>'
        + '<a href="/proof" style="height:36px;padding:0 14px;display:flex;align-items:center;border-radius:999px;background:#f5b867;color:#1a1420;font-family:\'JetBrains Mono\',monospace;font-size:10.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;">Proof in 20 sec</a></nav>',
      close: '</div>'
    }
  };
  var NESTLESS = '((?:(?!<sc-(?:if|for)\\b)[\\s\\S])*?)';
  function resolveControl(t) {
    var prev;
    do {
      prev = t;
      t = t.replace(new RegExp('<sc-if\\b([^>]*)>' + NESTLESS + '</sc-if>', 'g'), function (m, a, inner) {
        return /hint-placeholder-val="\{\{\s*true\s*\}\}"/.test(a) ? inner : '';
      });
      t = t.replace(new RegExp('<sc-for\\b([^>]*)>' + NESTLESS + '</sc-for>', 'g'), '');
    } while (t !== prev);
    return t;
  }
  function strip(t) {
    t = t.replace(/<helmet>[\s\S]*?<\/helmet>/g, '');
    t = t.replace(/<!--[\s\S]*?-->/g, '');
    t = resolveControl(t);
    t = t.replace(/\s(?:on[A-Z][A-Za-z]*|ref|style-(?:hover|active|focus|before|after))="[^"]*"/g, '');
    t = t.replace(/\s[\w:-]+="[^"]*\{\{[^"]*"/g, '');
    t = t.replace(/\{\{[^}]*\}\}/g, '');
    t = t.replace(/\stabIndex=/g, ' tabindex=');
    t = t.replace(/\sid="/g, ' data-pre-id="');
    return t.replace(/\n\s*\n+/g, '\n');
  }
  function prerender(src, file) {
    var a = src.indexOf('<x-dc>'), b = src.lastIndexOf('</x-dc>');
    if (a < 0 || b < 0) return src;
    var tpl = src.slice(a + 6, b), cfg = PAGES[file] || {};
    if (cfg.region) {
      var i = tpl.indexOf(cfg.region[0]), j = tpl.indexOf(cfg.region[1], i);
      if (i < 0 || j < 0) return src;
      tpl = tpl.slice(i, j);
    }
    var block = (cfg.open || '<div id="ap-pre">') + strip(tpl) + (cfg.close || '</div>') + '<!-- /ap-pre -->\n';
    var out = src.replace(/<div id="ap-pre"[\s\S]*?<!-- \/ap-pre -->\n?/, '');
    var k = out.indexOf('<x-dc>');
    return out.slice(0, k) + block + out.slice(k);
  }
  var api = { prerender: prerender, strip: strip };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else this.apPrerender = api;
})();
