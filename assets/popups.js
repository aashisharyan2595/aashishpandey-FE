/* Draws one pop-up from its settings. Shared by the site (loaded by assets/js/site.js only when a pop-up is about to show) and by the admin desk's live preview,
   so what you see in the builder is what visitors get.
   Every word the admin set goes in with textContent, never as HTML; colours were resolved on the server from fixed tables and are checked again here.
   window.apPopRender.build(popup, { preview, phone, lift, onClose(remember), onClick }) -> { root, card, layout }  (the caller adds root to the page) */
(function () {
  var hex = function (v, d) { return typeof v === 'string' && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v) ? v : d; };
  var el = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; };
  var LAYOUTS = { 'corner-right': 1, 'corner-left': 1, 'bar-bottom': 1, 'bar-top': 1, center: 1, takeover: 1 };
  // phones never get a blocking pop-up: a centred card or a full-screen one becomes a bottom sheet (Google demotes pages with intrusive mobile pop-ups, and it is kinder)
  function layoutOf(p, phone) { var l = LAYOUTS[p.layout] ? p.layout : 'corner-right'; return phone && (l === 'center' || l === 'takeover') ? 'sheet' : l; }
  function css(id, s, layout, look) {
    var bg = hex(s.bg, '#0f1433'), fg = hex(s.fg, '#f4efe6'), mute = hex(s.mute, '#b9b3c6'), line = hex(s.line, '#f4efe62e'), field = hex(s.field, '#f4efe60d'), acc = hex(s.accent, '#f5b867'), ink = hex(s.ink, '#1a1420'), link = hex(s.link, '#f5b867');
    var r = look.radius === 'sharp' ? 4 : look.radius === 'round' ? 28 : 18, br = look.radius === 'sharp' ? '8px' : '999px', w = { narrow: 320, normal: 380, wide: 480 }[look.width] || 380, cw = { narrow: 400, normal: 480, wide: 620 }[look.width] || 480;
    var c = '.apr-' + id, q = c + ' ';
    return c + '{position:fixed;z-index:90;box-sizing:border-box;background:' + bg + ';border:1px solid ' + line + ';color:' + fg + ';font:400 14px/1.5 Geist,system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.45);opacity:0;transform:translateY(10px);transition:opacity .35s,transform .35s;padding:16px 16px 12px;border-radius:' + r + 'px}'
      + q + '*{box-sizing:border-box}' + q + '.apr-in{display:flex;flex-direction:column;gap:8px}'
      + q + '.apr-h{font:600 15px/1.3 Geist,system-ui,sans-serif;letter-spacing:-.01em;margin:0 28px 0 0}' + q + '.apr-p{margin:0;font-size:13px;color:' + mute + '}' + q + '.apr-n{margin:0;font-size:11.5px;color:' + mute + '}' + q + '.apr-l{font-size:12.5px}'
      + q + 'a{color:' + link + ';text-decoration:underline;text-underline-offset:3px}' + q + '.apr-img{display:block;width:100%;max-height:170px;object-fit:cover;border-radius:' + Math.max(4, r - 6) + 'px}' + q + 'hr{border:0;border-top:1px solid ' + line + ';margin:2px 0;width:100%}'
      + q + '.apr-f{display:flex;flex-wrap:wrap;gap:8px}' + q + '.apr-f>*{flex:1 1 100%}'
      + q + 'input[type=email],' + q + 'input[type=text],' + q + 'select{width:100%;min-width:0;height:44px;padding:0 12px;border-radius:' + (look.radius === 'sharp' ? 6 : 12) + 'px;border:1px solid ' + line + ';background:' + field + ';color:' + fg + ';font:400 15px Geist,system-ui,sans-serif}' + q + 'select option{color:#1a1420}'
      + q + 'input:focus,' + q + 'select:focus{outline:none;border-color:' + link + ';box-shadow:0 0 0 3px ' + link + '2e}' + q + 'label.apr-fl{display:block;font-size:12.5px;color:' + mute + ';margin:0 0 3px}' + q + 'label.apr-ck{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:' + fg + '}' + q + 'label.apr-ck input{margin-top:3px;accent-color:' + acc + '}'
      + q + '.apr-btn,' + q + 'button[type=submit]{display:inline-flex;align-items:center;justify-content:center;height:44px;padding:0 18px;border-radius:' + br + ';border:0;background:' + acc + ';color:' + ink + ';font:600 14px Geist,system-ui,sans-serif;cursor:pointer;text-decoration:none}' + q + '.apr-btn:hover{filter:brightness(1.06)}' + q + 'button[disabled]{opacity:.6;cursor:wait}'
      + q + '[data-news-msg]{flex-basis:100%;margin:0;font-size:12.5px;color:' + mute + '}' + q + '[data-news-msg]:empty{display:none}' + q + '[data-news-msg].is-ok{color:' + link + ';font-size:14px}' + q + '[data-news-msg].is-err{color:#e0674a}'
      + q + '.apr-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}' + q + '.apr-x{position:absolute;top:4px;right:4px;width:44px;height:44px;border:0;background:none;color:' + mute + ';font-size:22px;line-height:1;cursor:pointer}' + q + '.apr-x:hover{color:' + fg + '}'
      + q + '.apr-no{align-self:flex-end;min-height:32px;padding:0 4px;border:0;background:none;color:' + mute + ';font:500 12.5px Geist,system-ui,sans-serif;text-decoration:underline;text-underline-offset:3px;cursor:pointer}'
      + q + '.apr-t,' + q + '.apr-a{display:flex;flex-direction:column;gap:8px;min-width:0}'
      // layouts
      + c + '.apr--corner-right{right:16px;bottom:16px;width:min(' + w + 'px,calc(100vw - 32px))}' + c + '.apr--corner-left{left:16px;bottom:16px;width:min(' + w + 'px,calc(100vw - 32px))}'
      + c + '.apr--center{left:50%;top:50%;width:min(' + cw + 'px,calc(100vw - 32px));max-height:calc(100vh - 48px);overflow:auto;transform:translate(-50%,-46%);padding:22px 22px 14px}' + c + '.apr--center.is-on{transform:translate(-50%,-50%)}' + c + '.apr--center .apr-h{font-size:20px}' + c + '.apr--center .apr-p{font-size:14px}'
      + c + '.apr--bar-bottom,' + c + '.apr--bar-top{left:0;right:0;width:auto;border-radius:0;border-width:1px 0;padding:12px max(16px,calc((100vw - 1100px)/2)) calc(12px + env(safe-area-inset-bottom,0px))}' + c + '.apr--bar-bottom{bottom:0}' + c + '.apr--bar-top{top:0;transform:translateY(-10px);padding-bottom:12px}'
      + c + '.apr--bar-bottom .apr-in,' + c + '.apr--bar-top .apr-in{flex-direction:row;flex-wrap:wrap;align-items:center;gap:8px 24px;padding-right:36px}' + c + '.apr--bar-bottom .apr-t,' + c + '.apr--bar-top .apr-t{flex:1 1 320px}' + c + '.apr--bar-bottom .apr-a,' + c + '.apr--bar-top .apr-a{flex:1 1 360px;max-width:560px;flex-direction:row;flex-wrap:wrap;align-items:center}' + c + '.apr--bar-bottom .apr-f,' + c + '.apr--bar-top .apr-f{flex-wrap:wrap;flex:1 1 320px}' + c + '.apr--bar-bottom .apr-f>*,' + c + '.apr--bar-top .apr-f>*{flex:1 1 150px}' + c + '.apr--bar-bottom .apr-no,' + c + '.apr--bar-top .apr-no{display:none}'
      + c + '.apr--takeover{inset:0;width:auto;border-radius:0;border:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:32px 20px;overflow:auto;box-shadow:none;transform:scale(.985)}' + c + '.apr--takeover .apr-in{width:min(' + cw + 'px,100%);gap:12px}' + c + '.apr--takeover .apr-h{font-size:clamp(26px,4vw,40px);line-height:1.12;margin:0}' + c + '.apr--takeover .apr-p{font-size:16px}' + c + '.apr--takeover .apr-no{align-self:center}'
      + c + '.apr--sheet,' + c + '.apr--phone.apr--corner-right,' + c + '.apr--phone.apr--corner-left{left:12px;right:12px;bottom:12px;width:auto}' + c + '.apr--sheet{border-radius:' + Math.max(12, r) + 'px}'
      + c + '.apr--phone.apr--bar-bottom .apr-in,' + c + '.apr--phone.apr--bar-top .apr-in{flex-direction:column;align-items:stretch;gap:8px;padding-right:0}' + c + '.apr--phone.apr--bar-bottom .apr-no,' + c + '.apr--phone.apr--bar-top .apr-no{display:block}' + c + '.apr--phone.apr--bar-bottom .apr-a,' + c + '.apr--phone.apr--bar-top .apr-a,' + c + '.apr--phone.apr--bar-bottom .apr-t,' + c + '.apr--phone.apr--bar-top .apr-t{max-width:none;flex:0 0 auto}'
      + c + '.apr--lift{bottom:calc(84px + env(safe-area-inset-bottom,0px))}'
      + c + '.apr--phone .apr-h{margin-right:28px}'
      + c + '.apr--phone.apr--takeover{inset:auto 12px 12px}'
      + c + '.is-on{opacity:1;transform:none}' + c + '.apr--center.is-on{transform:translate(-50%,-50%)}' + c + '.apr--takeover.is-on{transform:none}'
      + '.aprw-' + id + '{position:fixed;inset:0;z-index:89;pointer-events:none}.aprw-' + id + ' .apr{pointer-events:auto}.aprw-' + id + ' .apr-bd{position:absolute;inset:0;background:rgba(5,7,20,.6);opacity:0;transition:opacity .35s;pointer-events:auto}.aprw-' + id + ' .apr-bd.is-on{opacity:1}'
      + '.aprw-' + id + '.apr--pv .apr--bar-bottom,.aprw-' + id + '.apr--pv .apr--bar-top{padding-left:16px;padding-right:16px}.aprw-' + id + '.apr--pv{position:absolute}.aprw-' + id + '.apr--pv .apr{position:absolute;pointer-events:none}.aprw-' + id + '.apr--pv .apr-bd{pointer-events:none}'
      + '.aprw-' + id + '.apr--pv .apr{max-width:calc(100% - 24px);max-height:calc(100% - 24px)}.aprw-' + id + '.apr--pv .apr.apr--center{width:calc(100% - 24px)}.aprw-' + id + '.apr--pv .apr.apr--bar-bottom,.aprw-' + id + '.apr--pv .apr.apr--bar-top{max-width:none}'
      + '@media(prefers-reduced-motion:reduce){' + c + ',.aprw-' + id + ' .apr-bd{transition:none}' + c + '{transform:none}' + c + '.apr--center{transform:translate(-50%,-50%)}}@media print{.aprw-' + id + '{display:none!important}}';
  }
  function build(p, o) {
    o = o || {};
    var id = (p.id || 'pv').replace(/[^a-z0-9]/g, '') || 'pv', layout = layoutOf(p, !!o.phone), look = p.look || {}, bars = layout === 'bar-bottom' || layout === 'bar-top';
    var old = document.getElementById('ap-rc-css-' + id); if (old) old.remove();
    var st = document.createElement('style'); st.id = 'ap-rc-css-' + id; st.textContent = css(id, p.style || {}, layout, look); document.head.appendChild(st);
    var root = el('div', 'aprw-' + id + (o.preview ? ' apr--pv' : '')); root.setAttribute('data-popup', id);
    var wrap = root;
    var bd = null;
    if ((layout === 'center' || layout === 'takeover') && (look.backdrop || layout === 'takeover')) { bd = el('div', 'apr-bd'); root.appendChild(bd); if (o.onClose) bd.addEventListener('click', function () { o.onClose(true); }); }
    var card = el('aside', 'apr apr-' + id + ' apr--' + layout + (o.phone ? ' apr--phone' : '') + (o.lift ? ' apr--lift' : '')); if (!o.preview) card.id = 'ap-rc';
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', p.name || 'Newsletter'); card.setAttribute('data-popup', id);
    var inn = el('div', 'apr-in');
    var parts = [], formBlocks = [], formAt = -1, subscribe = false;
    (p.blocks || []).forEach(function (b) {
      var isForm = b.t === 'email' || b.t === 'field' || (b.t === 'button' && b.action !== 'link');
      if (isForm) { if (formAt < 0) { formAt = parts.length; parts.push(null); } formBlocks.push(b); if (b.t === 'email') subscribe = true; return; }
      parts.push(b);
    });
    var hasLinks = (p.blocks || []).some(function (b) { return b.t === 'links'; });
    function mk(b) {
      var n;
      switch (b.t) {
        case 'heading': n = el('div', 'apr-h', b.text); n.setAttribute('role', 'heading'); n.setAttribute('aria-level', '2'); return n;
        case 'text': return el('p', 'apr-p', b.text);
        case 'note': return el('p', 'apr-n', b.text);
        case 'divider': return document.createElement('hr');
        case 'image': if (!b.src) return null; n = el('img', 'apr-img'); n.alt = b.alt || ''; n.loading = 'lazy'; n.src = b.src; return n;
        case 'links': n = el('p', 'apr-p apr-l'); var a1 = el('a', '', 'What you get'), a2 = el('a', '', 'Privacy'); a1.href = '/newsletter'; a2.href = '/privacy'; n.appendChild(a1); n.appendChild(document.createTextNode(' · ')); n.appendChild(a2); return n;
        case 'button': n = el('a', 'apr-btn', b.text); n.href = b.href || '#'; if (/^https:/.test(b.href || '') && b.href.indexOf(location.origin) !== 0) { n.target = '_blank'; n.rel = 'noopener'; } if (o.onClick) n.addEventListener('click', function () { o.onClick(); }); return n;
      }
      return null;
    }
    function form() {
      var f = el('form', 'apr-f'); f.noValidate = true; f.setAttribute('data-news', 'pop-' + id); f.setAttribute('data-popup', id);
      if (p.success) f.setAttribute('data-ok', p.success);
      var hp = el('input', 'apr-hp'); hp.name = 'hp'; hp.tabIndex = -1; hp.autocomplete = 'off'; hp.setAttribute('aria-hidden', 'true'); f.appendChild(hp);
      formBlocks.forEach(function (b) {
        if (b.t === 'email') { var em = document.createElement('input'); em.name = 'email'; em.type = 'email'; em.placeholder = b.placeholder || 'you@example.com'; em.autocomplete = 'email'; em.inputMode = 'email'; em.setAttribute('aria-label', 'Email address'); em.required = true; em.maxLength = 254; f.appendChild(em); }
        else if (b.t === 'field') {
          var w = el('div'), lab = el('label', b.kind === 'checkbox' ? 'apr-ck' : 'apr-fl'), inp;
          if (b.kind === 'select') { inp = document.createElement('select'); var o0 = el('option', '', 'Choose…'); o0.value = ''; inp.appendChild(o0); (b.options || []).forEach(function (t) { var op = el('option', '', t); op.value = t; inp.appendChild(op); }); }
          else if (b.kind === 'checkbox') { inp = document.createElement('input'); inp.type = 'checkbox'; }
          else { inp = document.createElement('input'); inp.type = 'text'; inp.maxLength = b.kind === 'name' ? 60 : 120; if (b.kind === 'name') { inp.autocomplete = 'given-name'; } }
          inp.name = b.kind === 'name' ? 'name' : 'f_' + (b.id || ''); if (b.kind !== 'name') inp.setAttribute('data-f', b.id || ''); inp.setAttribute('data-label', b.label || ''); if (b.required) inp.setAttribute('data-req', '1');
          if (b.kind === 'checkbox') { lab.appendChild(inp); lab.appendChild(document.createTextNode(b.label + (b.required ? ' *' : ''))); w.appendChild(lab); }
          else { lab.textContent = b.label + (b.required ? ' *' : ''); w.appendChild(lab); w.appendChild(inp); }
          f.appendChild(w);
        } else if (b.t === 'button') { var sb = el('button', '', b.text); sb.type = 'submit'; f.appendChild(sb); }
      });
      var m = el('p'); m.setAttribute('data-news-msg', ''); m.setAttribute('role', 'status'); m.setAttribute('aria-live', 'polite'); f.appendChild(m);
      if (!hasLinks) { var lk = mk({ t: 'links' }); lk.style.flexBasis = '100%'; f.appendChild(lk); }   // a sign-up form always points to what people get and to the privacy page
      return f;
    }
    var nodes = parts.map(function (b, i) { return b === null ? { form: true } : { n: mk(b), b: b }; }).filter(function (x) { return x.form || x.n; });
    if (bars) {
      var t = el('div', 'apr-t'), a = el('div', 'apr-a');
      nodes.forEach(function (x) { if (x.form) a.appendChild(form()); else if (x.b.t === 'button') a.appendChild(x.n); else t.appendChild(x.n); });
      if (t.childNodes.length) inn.appendChild(t); if (a.childNodes.length) inn.appendChild(a);
    } else nodes.forEach(function (x) { inn.appendChild(x.form ? form() : x.n); });
    var x = el('button', 'apr-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); card.appendChild(x);
    card.appendChild(inn);
    var no = el('button', 'apr-no', p.dismiss || 'No thanks'); no.type = 'button'; inn.appendChild(no);
    if (o.onClose) { x.addEventListener('click', function () { o.onClose(true); }); no.addEventListener('click', function () { o.onClose(true); }); }
    wrap.appendChild(card);
    return { root: root, card: card, layout: layout, bd: bd, subscribe: subscribe };
  }
  window.apPopRender = { build: build, layoutOf: layoutOf };
})();
