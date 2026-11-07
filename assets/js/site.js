/* Shared site script: clean-URL routing in preview, analytics, focus trap. Loaded in <head> of every page. */
(function () {
  var ROUTES = {
    '/': '/pages/site/Portfolio.dc.html',
    '/portfolio': '/pages/work/Proof-v3.dc.html',
    '/case-studies': '/pages/work/Case-Studies.dc.html',
    '/services': '/pages/services/Services.dc.html',
    '/tech-consultant': '/pages/services/Tech-Consultant.dc.html',
    '/ui-ux-design': '/pages/services/UI-UX-Design.dc.html',
    '/seo-consultant': '/pages/services/SEO-Consultant.dc.html',
    '/freelance-project-manager': '/pages/services/Freelance-Project-Manager.dc.html',
    '/image-license': '/pages/site/Image-License.dc.html',
    '/contact': '/pages/site/Contact.dc.html',
    '/terms': '/pages/legal/Legal-Terms.dc.html',
    '/privacy': '/pages/legal/Legal-Privacy.dc.html',
    '/cookies': '/pages/legal/Legal-Cookies.dc.html',
    '/full-stack-developer': '/pages/services/Full-Stack-Developer.dc.html',
    '/wordpress-webflow-developer': '/pages/services/Wordpress-Webflow-Developer.dc.html',
    '/shopify-developer': '/pages/services/Shopify-Developer.dc.html',
    '/how-this-site-was-built': '/pages/site/How-This-Site-Was-Built.dc.html',
    '/work-liquid-iv': '/pages/work/Work-Liquid-IV.dc.html',
    '/work-talenti': '/pages/work/Work-Talenti.dc.html',
    '/work-storynest': '/pages/work/Work-StoryNest.dc.html',
    '/work-ceat-specialty': '/pages/work/Work-CEAT-Specialty.dc.html',
    '/tools': '/pages/tools/Tools-v3.dc.html',
    '/tools/pad': '/pages/tools/Tools-Pad-v2.dc.html',
    '/tools/url-shortener': '/pages/tools/Tools-Shortener.dc.html',
    '/tools/image-resizer': '/pages/tools/Tools-Image.dc.html',
    '/tools/lorem-ipsum-generator': '/pages/tools/Tools-Lorem.dc.html',
    '/tools/qr-code-generator': '/pages/tools/Tools-QR.dc.html',
    '/tools/qr-code-checker': '/pages/tools/Tools-QR-Check.dc.html',
    '/tools/website-launch-checklist': '/pages/tools/Tools-Checklist.dc.html',
    '/tools/exif-remover': '/pages/tools/Tools-Exif.dc.html',
    '/tools/file-hash-checker': '/pages/tools/Tools-Hash.dc.html',
    '/tools/exam-photo-resizer': '/pages/tools/Tools-Exam.dc.html',
    '/tools/resume-keyword-matcher': '/pages/tools/Tools-Match.dc.html',
    '/tools/robots-txt-generator': '/pages/tools/Tools-Robots.dc.html',
    '/tools/llms-txt-generator': '/pages/tools/Tools-Llms.dc.html',
    '/tools/json-ld-schema-generator': '/pages/tools/Tools-Schema.dc.html',
    '/tools/llm-token-counter': '/pages/tools/Tools-Tokens.dc.html',
    '/tools/p2p-file-sharing': '/pages/tools/Tools-P2P.dc.html',
    '/tools/password-generator': '/pages/tools/Tools-Password.dc.html',
    '/tools/time-zone-meeting-planner': '/pages/tools/Tools-Timezone.dc.html',
    '/tools/project-estimate-calculator': '/pages/tools/Tools-Estimate.dc.html',
    '/tools/project-management-tool': '/pages/tools/Tools-Board.dc.html',
    '/tools/online-whiteboard': '/pages/tools/Tools-Whiteboard.dc.html',
    '/tools/invoice-generator': '/pages/tools/Tools-Invoice.dc.html',
    '/tools/sop-maker': '/pages/tools/sop/Tools-SOP.dc.html',
    '/tools/sop-maker/build': '/pages/tools/sop/Tools-SOP-Build.dc.html',
    '/tools/sop-maker/templates': '/pages/tools/sop/Tools-SOP-Templates.dc.html',
    '/tools/sop-maker/guide': '/pages/tools/sop/Tools-SOP-Guide.dc.html',
    '/tools/resume-maker': '/pages/tools/resume/Tools-Resume.dc.html',
    '/tools/resume-maker/build': '/pages/tools/resume/Tools-Resume-Build.dc.html',
    '/tools/resume-maker/templates': '/pages/tools/resume/Tools-Resume-Templates.dc.html',
    '/tools/resume-maker/examples': '/pages/tools/resume/Tools-Resume-Examples.dc.html',
    '/tools/resume-maker/guide': '/pages/tools/resume/Tools-Resume-Guide.dc.html',
    '/tools/resume-maker/examples/software-engineer': '/pages/tools/resume/Tools-Resume-Ex-SoftwareEngineer.dc.html',
    '/tools/resume-maker/examples/ux-ui-designer': '/pages/tools/resume/Tools-Resume-Ex-UxUiDesigner.dc.html',
    '/tools/resume-maker/examples/project-manager': '/pages/tools/resume/Tools-Resume-Ex-ProjectManager.dc.html',
    '/tools/resume-maker/examples/data-analyst': '/pages/tools/resume/Tools-Resume-Ex-DataAnalyst.dc.html',
    '/tools/resume-maker/examples/marketing-manager': '/pages/tools/resume/Tools-Resume-Ex-MarketingManager.dc.html',
    '/tools/resume-maker/examples/sales-manager': '/pages/tools/resume/Tools-Resume-Ex-SalesManager.dc.html',
    '/tools/resume-maker/examples/mechanical-engineer': '/pages/tools/resume/Tools-Resume-Ex-MechanicalEngineer.dc.html',
    '/tools/resume-maker/examples/graduate': '/pages/tools/resume/Tools-Resume-Ex-Graduate.dc.html'
  };
  // Set a GA4 measurement ID (e.g. 'G-XXXXXXX') to enable Google Analytics. Vercel Web Analytics loads automatically in production.
  var GA_ID = 'G-H9J2D0RHRT';
  // Microsoft Clarity (session replay and heatmaps). Production only, loaded when idle, and not on the pages where visitors type their own
  // text or personal details (notepad, resume and SOP builders, invoice, file sharing), because those pages promise the data stays on the device.
  var CLARITY_ID = 'yr4j64clj0';
  var NO_CLARITY = /^\/tools\/(pad|invoice-generator|resume-maker\/build|sop-maker\/build|password-generator|exif-remover|file-hash-checker|exam-photo-resizer|resume-keyword-matcher|llm-token-counter|p2p-file-sharing|estimate|project-estimate-calculator|project-management-tool|online-whiteboard)/;

  var dev = /\.dc\.html$/.test(location.pathname);
  window.__apRoute = function (p) {
    if (!dev) return p;
    var h = p.split('#'), f = ROUTES[h[0]];
    return f ? f + (h[1] ? '#' + h[1] : '') : p;
  };

  // ---- analytics ----
  window.dataLayer = window.dataLayer || [];
  window.apTrack = function (name, props) {
    props = props || {};
    props.page = location.pathname;
    window.dataLayer.push(Object.assign({ event: name }, props));
    if (window.gtag) window.gtag('event', name, props);
    if (window.va) window.va('event', { name: name, data: props });
    if (dev && window.console) console.info('[track]', name, props);
  };
  /* ---- consent: Google Analytics and Clarity are separate choices, both off until the visitor turns them on ----
     Stored in localStorage apConsent as { v: 2, s: { stats, replay }, a, p, t }. A choice lasts 12 months, then the panel asks again.
     A v1 "reject" (one Accept/Reject choice) is kept as a reject; a v1 "accept" is asked again, because it did not name each tool. */
  var CONSENT_KEY = 'apConsent', POLICY_V = '2026-11-07', YEAR = 365 * 864e5;
  var gpc = navigator.globalPrivacyControl === true;   // a Global Privacy Control signal counts as "reject all"
  function getConsent() {
    try {
      var c = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'), age = c && Date.now() - (+c.t || 0);
      if (!c || !(age >= 0 && age < YEAR)) return null;
      if (c.v === 2 && c.s) return { s: { stats: c.s.stats === true, replay: c.s.replay === true }, t: c.t };
      if (c.a === false) return { s: { stats: false, replay: false }, t: c.t };
    } catch (e) { /* no stored choice */ }
    return null;
  }
  function setConsent(s) {
    s = { stats: !!s.stats, replay: !!s.replay };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: 2, s: s, a: s.stats || s.replay, p: POLICY_V, t: Date.now() })); } catch (e) {}
  }
  function allowed(k) { var c = getConsent(); return !gpc && !!(c && c.s[k]); }
  function whenIdle(fn, ms) {
    var done = false, run = function () { if (done) return; done = true; fn(); };
    ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) { addEventListener(ev, run, { once: true, passive: true }); });
    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: ms }); else setTimeout(run, ms - 1000);
  }
  var gaOn = false, clOn = false;
  function startAnalytics() {
    if (dev) return;
    if (GA_ID && !gaOn && allowed('stats')) {
      gaOn = true; window['ga-disable-' + GA_ID] = false;
      if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'granted' });
      else {
        // GA is queued now and its script loads when the page is idle, so it never competes with first paint.
        // Consent covers statistics only, so advertising storage and signals stay denied.
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
        window.gtag('js', new Date()); window.gtag('config', GA_ID);
        whenIdle(function () { if (!allowed('stats')) return; var g = document.createElement('script'); g.async = true; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID; document.head.appendChild(g); }, 4000);
      }
    }
    if (CLARITY_ID && !clOn && allowed('replay') && !NO_CLARITY.test(location.pathname)) {
      clOn = true;
      if (window.clarity) { window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' }); return; }
      whenIdle(function () {
        if (!allowed('replay')) { clOn = false; return; }
        (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, 'clarity', 'script', CLARITY_ID);
        // Clarity needs an explicit consent signal for visitors in the EEA, UK and Switzerland (enforced since 31 October 2025)
        window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
      }, 9000);
    }
  }
  function dropCookies(re) {
    var host = location.hostname.split('.').slice(-2).join('.');
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (re.test(n)) ['', '; domain=' + host, '; domain=.' + host].forEach(function (d) { document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d; });
    });
  }
  function stopAnalytics() {
    if (!allowed('stats')) {
      gaOn = false; window['ga-disable-' + GA_ID] = true;
      if (window.gtag) { try { window.gtag('consent', 'update', { analytics_storage: 'denied' }); } catch (e) {} }
      dropCookies(/^(_ga|_gid|_gat)/);
    }
    if (!allowed('replay')) {
      clOn = false;
      if (window.clarity) { try { window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' }); window.clarity('consent', false); } catch (e) {} }
      dropCookies(/^(_clck|_clsk|MUID|CLID|ANONCHK|SM|_uetsid|_uetvid)/);
    }
  }
  if (!dev) {
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    var v = document.createElement('script'); v.defer = true; v.src = '/_vercel/insights/script.js'; document.head.appendChild(v);   // cookieless
    window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
    var si = document.createElement('script'); si.defer = true; si.src = '/_vercel/speed-insights/script.js'; document.head.appendChild(si);   // Speed Insights: cookieless page speed scores
    startAnalytics();
  }

  /* ---- privacy choices panel: first layer (Reject all / Choose / Accept all), second layer with a switch per tool ---- */
  function noticeCss() {
    if (document.getElementById('ap-cc-css')) return;
    var st = document.createElement('style'); st.id = 'ap-cc-css';
    st.textContent = '#ap-cc{position:fixed;z-index:95;left:16px;bottom:16px;width:min(460px,calc(100vw - 32px));max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);overflow:auto;overscroll-behavior:contain;box-sizing:border-box;padding:18px 18px 16px;border-radius:20px;background:rgba(15,20,51,.98);border:1px solid rgba(244,239,230,.18);box-shadow:0 24px 70px rgba(0,0,0,.55);color:#f4efe6;font:400 14px/1.55 Geist,system-ui,sans-serif;animation:apccIn .5s cubic-bezier(.16,1,.3,1) both}'
      + '#ap-cc *{box-sizing:border-box}#ap-cc h2{margin:0 0 6px;font:600 16px/1.2 Geist,system-ui,sans-serif;letter-spacing:-.02em}#ap-cc p{margin:0 0 14px;color:#cfc9d8}#ap-cc a{color:#f5b867;text-decoration:underline;text-underline-offset:3px}'
      + '#ap-cc .apcc-row{display:flex;gap:10px;flex-wrap:wrap}#ap-cc .apcc-row button{flex:1 1 120px;min-height:44px;padding:0 16px;border-radius:999px;font:600 14px Geist,system-ui,sans-serif;cursor:pointer;border:1px solid #f4efe6;background:#f4efe6;color:#1a1420;transition:background .2s,border-color .2s}'
      + '#ap-cc .apcc-row button:hover{background:#fff;border-color:#fff}#ap-cc .apcc-row button[data-cc=choose],#ap-cc .apcc-row button[data-cc=save]{background:rgba(244,239,230,.08);border-color:rgba(244,239,230,.35);color:#f4efe6}#ap-cc .apcc-row button[data-cc=choose]:hover,#ap-cc .apcc-row button[data-cc=save]:hover{background:rgba(244,239,230,.16);border-color:#f4efe6}'
      + '#ap-cc .apcc-list{list-style:none;margin:0 0 14px;padding:0;display:grid;gap:8px}#ap-cc .apcc-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 14px;align-items:center;padding:11px 13px;border-radius:14px;background:rgba(244,239,230,.05);border:1px solid rgba(244,239,230,.1)}'
      + '#ap-cc .apcc-item b{font-weight:600;font-size:14px}#ap-cc .apcc-item span{grid-column:1;font-size:12.5px;line-height:1.45;color:#b9b3c6}#ap-cc .apcc-item .apcc-sw{grid-column:2;grid-row:1/span 2}'
      + '#ap-cc .apcc-fixed{grid-column:2;grid-row:1/span 2;font-style:normal;font:500 11px/1 "Geist Mono",ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;color:#7ff3e1;white-space:nowrap}'
      + '#ap-cc .apcc-sw{position:relative;display:inline-block;width:46px;height:28px}#ap-cc .apcc-sw input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}'
      + '#ap-cc .apcc-sw i{position:absolute;inset:0;border-radius:99px;background:rgba(244,239,230,.18);transition:background .2s;pointer-events:none}#ap-cc .apcc-sw i:after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#f4efe6;transition:transform .2s cubic-bezier(.16,1,.3,1)}'
      + '#ap-cc .apcc-sw input:checked+i{background:#f5b867}#ap-cc .apcc-sw input:checked+i:after{transform:translateX(18px);background:#1a1420}#ap-cc .apcc-sw input:disabled{cursor:not-allowed}#ap-cc .apcc-sw input:disabled+i{opacity:.45}#ap-cc .apcc-sw input:focus-visible+i{outline:2px solid #7ff3e1;outline-offset:2px}'
      + '#ap-cc:not(.apcc-bar) .apcc-row{position:sticky;bottom:-16px;margin:0 -18px -16px;padding:12px 18px 16px;background:linear-gradient(rgba(15,20,51,.9),#0f1433 30%);border-top:1px solid rgba(244,239,230,.1)}'
      + '#ap-cc .apcc-note{margin:-4px 0 14px;font-size:12.5px;line-height:1.45;color:#b9b3c6}#ap-cc .apcc-note strong{color:#f4efe6}'
      + '@media(max-width:899px){#ap-cc{left:10px;bottom:10px;width:calc(100vw - 20px);max-height:calc(100dvh - 20px);padding:14px 14px 12px;border-radius:16px}#ap-cc h2{font-size:14.5px;margin-bottom:4px}#ap-cc p{font-size:12.5px;line-height:1.45;margin-bottom:10px}#ap-cc .apcc-row{gap:8px}#ap-cc .apcc-row button{flex:1 1 0;min-height:42px;padding:0 10px;font-size:13.5px}#ap-cc .apcc-item{padding:10px 11px}#ap-cc:not(.apcc-bar) .apcc-row{bottom:-12px;margin:0 -14px -12px;padding:10px 14px 12px}}'
      + '@media(min-width:900px){#ap-cc.apcc-bar{left:16px;right:16px;margin:0 auto;width:auto;max-width:1080px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:2px 28px;padding:14px 14px 14px 22px;border-radius:18px}#ap-cc.apcc-bar h2{grid-column:1;margin:0;font-size:14.5px}#ap-cc.apcc-bar p{grid-column:1;margin:0;font-size:13.5px;line-height:1.5}#ap-cc.apcc-bar .apcc-row{grid-column:2;grid-row:1/span 2;flex-wrap:nowrap}#ap-cc.apcc-bar .apcc-row button{flex:0 0 auto;min-height:42px;padding:0 18px}}'
      + '#ap-cc :focus-visible{outline:2px solid #7ff3e1;outline-offset:2px}@keyframes apccIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){#ap-cc{animation:none}#ap-cc .apcc-sw i,#ap-cc .apcc-sw i:after{transition:none}}';
    document.head.appendChild(st);
  }
  var noticeFrom = null;
  function showNotice(fromFooter, detail) {
    var old = document.getElementById('ap-cc'); if (old) old.remove();
    noticeCss();
    var cur = getConsent(), s = cur ? cur.s : { stats: false, replay: false }, box = document.createElement('div');
    box.id = 'ap-cc'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-labelledby', 'apcc-h');
    var links = 'More in the <a href="/cookies">cookie policy</a> and the <a href="/privacy">privacy policy</a>.';
    var when = cur ? new Date(cur.t).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    if (!detail) {
      box.className = 'apcc-bar';
      box.innerHTML = '<h2 id="apcc-h">Your privacy choices</h2><p>With your OK, I use Google Analytics (pages you visit, device, rough location) and Microsoft Clarity (clicks and scrolls, as heatmaps and replays) to see what works on this site. Both stay off unless you turn them on, and every tool works without them. ' + links + '</p>'
        + '<div class="apcc-row"><button type="button" data-cc="reject">Reject all</button><button type="button" data-cc="choose">Choose</button><button type="button" data-cc="accept">Accept all</button></div>';
    } else {
      var sw = function (k, on) { return '<label class="apcc-sw"><input type="checkbox" role="switch" data-k="' + k + '"' + (on ? ' checked' : '') + (gpc ? ' disabled' : '') + ' aria-describedby="apcc-' + k + '"><i></i></label>'; };
      box.innerHTML = '<h2 id="apcc-h">Privacy choices</h2>'
        + '<p>Turn each tool on or off. You can change this at any time from Cookie settings at the bottom of every page, and turning a tool off is as quick as turning it on.</p>'
        + (gpc ? '<p class="apcc-note"><strong>Your browser sends a Global Privacy Control signal</strong>, so both stay off on this site.</p>' : '')
        + (cur ? '<p class="apcc-note">Your choice was saved on ' + when + '.</p>' : '')
        + '<ul class="apcc-list">'
        + '<li class="apcc-item"><b id="apcc-l-st">Statistics: Google Analytics</b><span id="apcc-stats">Pages you visit, how you found the site, your device and browser, and your approximate location. Sets cookies (_ga) for up to two years. Never used for ads.</span>' + sw('stats', s.stats) + '</li>'
        + '<li class="apcc-item"><b>Heatmaps and replays: Microsoft Clarity</b><span id="apcc-replay">How you click, scroll and move on a page. Sets cookies (_clck, _clsk) for up to a year. Switched off on tools where you type your own text.</span>' + sw('replay', s.replay) + '</li>'
        + '<li class="apcc-item"><b>Needed for the site</b><span>Remembers this choice, your drafts, settings and the tools you open, in your own browser. Never sent to me.</span><em class="apcc-fixed">Always on</em></li>'
        + '<li class="apcc-item"><b>Cookieless counts</b><span>Ahrefs and Vercel count page views and page speed with no cookies and nothing that identifies you.</span><em class="apcc-fixed">Always on</em></li>'
        + '</ul><p class="apcc-note">Under 18? Please leave both off. ' + links + '</p>'
        + '<div class="apcc-row"><button type="button" data-cc="reject">Reject all</button><button type="button" data-cc="save">Save choices</button><button type="button" data-cc="accept">Accept all</button></div>';
    }
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('button[data-cc]'); if (!b) return;
      var act = b.getAttribute('data-cc');
      if (act === 'choose') { showNotice(true, true); return; }
      var pick = act === 'accept' ? { stats: true, replay: true } : act === 'reject' ? { stats: false, replay: false } : {
        stats: !!(box.querySelector('input[data-k=stats]') || {}).checked, replay: !!(box.querySelector('input[data-k=replay]') || {}).checked };
      setConsent(pick); box.remove();
      stopAnalytics(); startAnalytics();
      if (noticeFrom && document.contains(noticeFrom)) { try { noticeFrom.focus(); } catch (e) {} }
      noticeFrom = null;
    });
    box.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && (fromFooter || detail)) { box.remove(); if (noticeFrom) { try { noticeFrom.focus(); } catch (e) {} } noticeFrom = null; } });
    document.body.appendChild(box);
    if (fromFooter || detail) { var f = box.querySelector('input:not([disabled]), button'); if (f) f.focus(); }
  }
  function initNotice() { if (!getConsent() && !gpc) showNotice(false); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNotice); else initNotice();
  document.addEventListener('click', function (ev) { var t = ev.target.closest && ev.target.closest('[data-cookie-settings]'); if (t) { ev.preventDefault(); noticeFrom = t; showNotice(true, true); } });

  /* ---- newsletter forms (footer, tool pages, /newsletter): any form[data-news], its value names the place ---- */
  var T0 = Date.now();
  document.addEventListener('submit', function (ev) {
    var f = ev.target; if (!f || !f.matches || !f.matches('form[data-news]')) return;
    ev.preventDefault();
    var msg = f.querySelector('[data-news-msg]'), btn = f.querySelector('button[type=submit]') || f.querySelector('button'), email = (f.email.value || '').trim();
    var via = (f.getAttribute('data-news') || 'form').replace(/[^a-z-]/g, '').slice(0, 20) || 'form';   // which sign-up place this is (footer, after-use, card, inline, page), so the list shows what works
    var say = function (t, cls) { msg.textContent = t; msg.className = cls || ''; };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say('That email address does not look right.', 'is-err'); f.email.focus(); return; }
    btn.disabled = true; say('Sending…');
    window.apToken().then(function (tk) {
      if (!tk && window.apTokenStuck) return { ok: false, j: { error: VERIFY_MSG } };
      return fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, hp: f.hp.value, ts: T0, page: location.pathname, via: via, name: ((f.elements['name'] && f.elements['name'].value) || '').trim().slice(0, 60), cf: tk }) }).then(asResult);
    })
      .then(function (x) {
        btn.disabled = false;
        if (!x.ok) return say(x.j.error || 'Could not subscribe. Please try again later.', 'is-err');
        f.email.value = ''; if (f.elements['name']) f.elements['name'].value = ''; say((f.getAttribute('data-ok') && /^You are subscribed/.test(x.j.message || '') ? f.getAttribute('data-ok') : x.j.message) || 'You are subscribed.', 'is-ok');
        try { localStorage.setItem('apNlDone', '1'); } catch (e) { /* storage off: the prompts may ask again, nothing breaks */ }
        if (window.apTrack) window.apTrack('newsletter_signup', { via: via });
      })
      .catch(function () { btn.disabled = false; say('Could not reach the server. Please try again later.', 'is-err'); });
  });
  /* ---- Cloudflare Turnstile (optional): runs only when TURNSTILE_SITEKEY is set in Vercel; stays invisible unless Cloudflare needs a click ---- */
  var tsLoading = null, tsWidget = null, tsKey = '', tsResolve = null, tsCache = null;
  window.apVerifyMsg = 'Please tick the small "Verify you are human" box at the bottom right, then press send again.';
  window.apTokenStuck = false;   // true when the check is still waiting for a tick after the wait: forms must not send without a token then
  var VERIFY_MSG = 'Please tick the small "Verify you are human" box at the bottom right, then press send again.';
  function tsLoad() {
    if (tsLoading) return tsLoading;
    tsLoading = fetch('/api/config').then(function (r) { return r.json(); }).then(function (c) {
      if (!c.turnstile) return null; tsKey = c.turnstile;
      return new Promise(function (ok) {
        var sc = document.createElement('script'); sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; sc.async = true;
        sc.onload = function () { ok(window.turnstile || null); }; sc.onerror = function () { ok(null); }; setTimeout(function () { ok(null); }, 8000); document.head.appendChild(sc);
      });
    }).catch(function () { return null; });
    return tsLoading;
  }
  document.addEventListener('focusin', function f(e) { if (e.target && e.target.closest && e.target.closest('form')) { document.removeEventListener('focusin', f); tsLoad(); } });
  window.apToken = function () {
    window.apTokenStuck = false;
    if (tsCache && Date.now() - tsCache.t < 240000) { var c = tsCache.tok; tsCache = null; return Promise.resolve(c); }   // the visitor ticked after we stopped waiting: tokens last 5 minutes and work once
    return tsLoad().then(function (t) {
      if (!t) return '';   // Turnstile is not set up or could not load: the server scores a missing token as a warning sign
      return new Promise(function (resolve) {
        var done = false, fin = function (v, timedOut) { if (!done) { done = true; tsResolve = null; window.apTokenStuck = !!timedOut && !v; resolve(v || ''); } };
        tsResolve = fin;
        var box = document.getElementById('ap-ts');
        if (!box) { box = document.createElement('div'); box.id = 'ap-ts'; box.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:96'; document.body.appendChild(box); }
        var onTok = function (tok) { if (tsResolve) tsResolve(tok); else tsCache = { tok: tok, t: Date.now() }; };
        if (tsWidget === null) tsWidget = t.render(box, { sitekey: tsKey, execution: 'execute', appearance: 'interaction-only', callback: onTok, 'error-callback': function () { if (tsResolve) tsResolve(''); } });
        else t.reset(tsWidget);
        t.execute(tsWidget);
        setTimeout(function () { fin('', true); }, 8000);
      });
    });
  };
  function asResult(r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); }
  // shared by every brief form: same rules as the newsletter (honeypot, time check, JSON POST, inline result)
  window.apSend = function (d) {
    d.hp = ''; d.ts = T0; d.page = location.pathname;
    try { var rf = new URL(document.referrer); d.ref = rf.origin === location.origin ? rf.pathname : rf.hostname; } catch (e) { /* no referrer */ }
    return window.apToken().then(function (tk) {
      if (!tk && window.apTokenStuck) return { ok: false, j: { error: VERIFY_MSG } };   // never send without a token while the check is waiting for a tick
      d.cf = tk; return fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }).then(asResult);
    })
      .catch(function () { return { ok: false, j: { error: 'Could not reach the server. Please try again, or email hello@aashishpandey.com.' } }; });
  };
  function classify(a) {
    var h = a.getAttribute('href') || '', t = (a.textContent || '').trim();
    if (a.getAttribute('data-track')) return a.getAttribute('data-track');
    if (/bookings\.cloud\.microsoft/.test(h)) return 'book_call';
    if (/resume\.pdf/i.test(h)) return 'resume_download';
    if (/^mailto:/.test(h)) return /brief/i.test(h) ? 'send_brief' : 'email_click';
    if (/wa\.me/.test(h)) return 'whatsapp_click';
    if (/linkedin\.com/.test(h)) return 'linkedin_click';
    if (h === '#pf-contact' || /^hire me$/i.test(t)) return 'hire_me';
    if (/^\/work-/.test(h)) return 'case_study_open';
    if (/^\/portfolio/.test(h)) return 'proof_open';
    if (/^\/case-studies/.test(h)) return 'case_studies_open';
    if (h === '/how-this-site-was-built') return 'build_guide_open';
    if (/^\/tools/.test(h)) return 'tool_open';
    return null;
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a');
    if (!a) return;
    var n = classify(a);
    if (n) window.apTrack(n, { href: a.getAttribute('href'), label: (a.textContent || '').trim().slice(0, 60) });
    var h = a.getAttribute('href') || '';
    if (dev && h.charAt(0) === '/') { var r = window.__apRoute(h); if (r !== h) { e.preventDefault(); location.href = r; } }
  }, true);

  /* ---- free-tool usage counter: no cookies and no ids, one count for the visit and one when the tool is first used ---- */
  if (!dev && /^\/tools\/./.test(location.pathname) && !navigator.webdriver) {
    var ev = function (k) { var d = JSON.stringify({ k: k, p: location.pathname, r: k === 'view' ? document.referrer : '' }); try { if (!(navigator.sendBeacon && navigator.sendBeacon('/api/config?a=ev', d))) fetch('/api/config?a=ev', { method: 'POST', body: d, keepalive: true }); } catch (e) { /* counting must never break a tool */ } };
    ev('view');
    var used = false, onUse = function (e) {
      if (used || !e.target || !e.target.closest || e.target.closest('.ap-nav, .ap-foot, .ap-close, .ap-quotes, .ap-notice, #ap-cc, header, footer')) return;
      if (e.type === 'pointerdown' && !e.target.closest('button, input, select, textarea, label, a[download], [role=button], canvas')) return;
      used = true; ['pointerdown', 'input', 'change'].forEach(function (t) { document.removeEventListener(t, onUse, true); }); ev('use');
    };
    ['pointerdown', 'input', 'change'].forEach(function (t) { document.addEventListener(t, onUse, true); });
  }

  /* ---- content set in the admin: availability line, notice bar, testimonials ---- */
  function applyContent(c) {
    if (!c) return;
    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]; }); };
    var n = c.notice && Object.assign({}, c.notice), nk = n ? 'apNotice:' + n.text + '|' + (n.link || '') : '';
    var gone = false; try { gone = !!nk && localStorage.getItem('apNoticeX') === nk; } catch (e) { /* show it */ }
    if (n && n.scope === 'tools' && !/^\/tools(\/|$)/.test(location.pathname)) n = null;   // a notice for the tools pages only
    if (n && !gone && location.pathname !== '/' && !document.querySelector('.ap-notice')) {
      var bar = document.createElement('div'); bar.className = 'ap-notice' + (n.style === 'info' || n.style === 'alert' ? ' ap-notice--' + n.style : ''); bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Notice');
      var safe = n.link && /^(https:\/\/|\/)/.test(n.link) ? n.link : '';
      bar.innerHTML = '<span>' + esc(n.text) + '</span>' + (safe ? '<a href="' + esc(safe) + '">' + esc(n.linkText || 'Read more') + '</a>' : '') + '<button type="button" aria-label="Hide this notice">&times;</button>';
      bar.querySelector('button').onclick = function () { bar.remove(); try { localStorage.setItem('apNoticeX', nk); } catch (e) { /* fine */ } };
      document.body.insertBefore(bar, document.body.firstChild);
    }
    fillContent(c);
    // pages drawn from a template render their closing panel after this runs, so fill new copies as they appear
    if (window.MutationObserver && !applyContent.watch) {
      var t = 0;
      applyContent.watch = new MutationObserver(function () { clearTimeout(t); t = setTimeout(function () { fillContent(c); }, 60); });
      applyContent.watch.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { applyContent.watch.disconnect(); }, 15000);
    }
  }
  function fillContent(c) {
    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]; }); };
    if (c.avail) [].forEach.call(document.querySelectorAll('[data-ap-avail]'), function (el) { if (el.textContent !== c.avail) el.textContent = c.avail; if (c.availStatus) el.setAttribute('data-status', c.availStatus); });
    var cl = c.closing;   // closing panel copy set in the admin; an empty field keeps the built-in text
    if (cl) {
      [].forEach.call(document.querySelectorAll('[data-ap-ch]'), function (h) { var em = h.querySelector('[data-ap-ce]'); if (cl.head) { var tn = h.firstChild; if (tn && tn.nodeType === 3) tn.nodeValue = cl.head + ' '; } if (em && cl.em) em.textContent = cl.em; });
      [].forEach.call(document.querySelectorAll('[data-ap-cp]'), function (p) { if (cl.text) p.textContent = cl.text; });
    }
    var qs = c.quotes || [];
    if (qs.length) [].forEach.call(document.querySelectorAll('[data-ap-quotes]'), function (box) {
      if (box.children.length) return;
      box.innerHTML = qs.map(function (q) {
        var who = [q.role, q.company].filter(Boolean).join(', ');
        return '<figure class="ap-quote">' + (q.rating ? '<span class="ap-quote__stars" aria-label="' + q.rating + ' out of 5">' + new Array(q.rating + 1).join('★') + '</span>' : '') + '<blockquote>' + esc(q.quote) + '</blockquote><figcaption><b>' + esc(q.name) + '</b>' + esc(who) + '</figcaption></figure>';
      }).join('');
      box.hidden = false;
    });
  }
  if (!dev) {
    var loadContent = function () { fetch('/api/config?a=content').then(function (r) { return r.ok ? r.json() : null; }).then(applyContent).catch(function () { /* the built-in text stays */ }); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadContent); else loadContent();
  }

  // ---- keep Tab focus inside an open dialog ----
  window.apTrap = function (e, box) {
    if (e.key !== 'Tab' || !box) return;
    var f = box.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1], act = document.activeElement;
    if (!box.contains(act)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && act === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && act === last) { e.preventDefault(); first.focus(); }
  };
})();

/* ---- email pop-ups: one small, dismissible offer, set from the admin desk (Pop-ups tab) ----
   window.apPop is shared by this file (the "reading card" on blog, services and case-study pages) and tools.js (the corner card and the after-use offer on tool pages).
   Settings come from /api/config?a=popups (cached at the edge for 5 minutes). If that call fails or is slow, the built-in defaults below apply, so a pop-up never depends on it.
   Never a modal: no overlay, no focus taken, nothing blocks the page, "No thanks" or Escape closes it, reduced motion switches the animation off, and it waits for the cookie notice,
   an open menu and typing. Storage (all in the visitor's own browser, listed in the cookie policy): apNlX = when "No thanks" was said (and which settings version), apNlDone = subscribed, apNlSeen = pop-ups shown this visit. */
(function () {
  var DEF = {
    on: true, ver: 1, surfaces: { reading: true, tool: true, afterUse: true }, types: { blog: true, services: true, cases: true, tools: true, other: true },
    include: [], exclude: ['/', '/portfolio'], devices: { desktop: true, phone: true }, limits: { delay: 8, perVisit: 1, quietDays: 60 },
    triggers: { seconds: 12, scroll: 40, fallback: 45, afterUse: 12, toolFallback: 40, exit: false }, position: 'right',
    style: { bg: '#0f1433', fg: '#f4efe6', mute: '#b9b3c6', line: '#f4efe62e', field: '#f4efe60d', accent: '#f5b867', ink: '#1a1420', link: '#f5b867' },
    copy: { 'default': { head: 'New free tools, by email', body: 'At most one email a month, plus one practical tip. Unsubscribe in one click.', button: 'Subscribe', success: '', dismiss: 'No thanks' } },
    doneHead: 'Done. Want the next free tool too?',
    never: ['/contact', '/privacy', '/terms', '/cookies', '/image-license', '/newsletter', '/api', '/kd2ozfuew9n4uaciyl1j']
  };
  var ls = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }, del: function (k) { try { localStorage.removeItem(k); } catch (e) {} } };
  var ss = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }, del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} } };
  var path = (location.pathname.replace(/\/+$/, '') || '/').toLowerCase();
  var force = /[?&]nl=show\b/.test(location.search);   // ?nl=show clears this browser's "already asked / subscribed" memory and shows the offer after a moment (for testing it yourself)
  if (force) { ls.del('apNlX'); ls.del('apNlDone'); ss.del('apNlSeen'); }
  var num = function (v, lo, hi, d) { v = Math.round(Number(v)); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
  var hex = function (v, d) { return typeof v === 'string' && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v) ? v : d; };
  var str = function (v, d, n) { return typeof v === 'string' && v ? v.replace(/[<>]/g, '').slice(0, n) : d; };
  function merge(c) {   // the answer from the server, checked again here, over the built-in defaults
    c = c && typeof c === 'object' ? c : {};
    var o = JSON.parse(JSON.stringify(DEF)), g = function (k) { return c[k] && typeof c[k] === 'object' ? c[k] : {}; };
    if (c.on === false) o.on = false;
    o.ver = num(c.ver, 1, 1e6, 1);
    Object.keys(o.surfaces).forEach(function (k) { if (g('surfaces')[k] === false) o.surfaces[k] = false; });
    Object.keys(o.types).forEach(function (k) { if (g('types')[k] === false) o.types[k] = false; });
    ['desktop', 'phone'].forEach(function (k) { if (g('devices')[k] === false) o.devices[k] = false; });
    var list = function (a, d) { return Array.isArray(a) ? a.filter(function (x) { return typeof x === 'string' && /^\/[a-z0-9\-_.~\/%]*$/.test(x); }).slice(0, 40) : d; };
    o.include = list(c.include, []); o.exclude = list(c.exclude, DEF.exclude);
    var L = g('limits'), T = g('triggers');
    o.limits.delay = num(L.delay, 5, 120, 8); o.limits.perVisit = num(L.perVisit, 1, 3, 1); o.limits.quietDays = num(L.quietDays, 1, 365, 60);
    var d = o.limits.delay;
    o.triggers.seconds = Math.max(d, num(T.seconds, 5, 300, 12)); o.triggers.fallback = Math.max(o.triggers.seconds, num(T.fallback, 15, 600, 45));
    o.triggers.scroll = num(T.scroll, 10, 90, 40); o.triggers.afterUse = num(T.afterUse, 5, 300, 12); o.triggers.toolFallback = Math.max(d, num(T.toolFallback, 15, 600, 40)); o.triggers.exit = T.exit === true;
    o.position = c.position === 'left' || c.position === 'bar' ? c.position : 'right';
    var S = g('style'); Object.keys(o.style).forEach(function (k) { o.style[k] = hex(S[k], o.style[k]); });
    var C = g('copy'), cd = DEF.copy['default'];
    o.copy = {};
    ['default', 'blog', 'services', 'cases', 'tools', 'other'].forEach(function (t) {
      var s = C[t] && typeof C[t] === 'object' ? C[t] : {}, r = t === 'default' ? cd : { head: '', body: '', button: '', success: '', dismiss: '' };
      o.copy[t] = { head: str(s.head, r.head, 80), body: str(s.body, r.body, 220), button: str(s.button, r.button, 24), success: str(s.success, r.success, 120), dismiss: str(s.dismiss, r.dismiss, 24) };
    });
    o.doneHead = str(c.doneHead, DEF.doneHead, 80);
    return o;
  }
  var cur = null, waiting = null;
  function load(cb) {
    if (cur) return cb(cur);
    if (waiting) return waiting.push(cb);
    waiting = [cb];
    var fin = function (c) { if (cur) return; cur = merge(c); var w = waiting; waiting = null; w.forEach(function (f) { try { f(cur); } catch (e) {} }); };
    setTimeout(function () { fin(null); }, 3000);   // slow or failed: the defaults, so the offer never depends on the network
    try { fetch('/api/config?a=popups').then(function (r) { return r.ok ? r.json() : null; }).then(fin).catch(function () { fin(null); }); } catch (e) { fin(null); }
  }
  function typeOf(p) { return /^\/tools(\/|$)/.test(p) ? 'tools' : /^\/blog(\/|$)/.test(p) ? 'blog' : /^\/(services|freelance|full-stack|seo-|shopify|tech-consult|ui-ux|wordpress)/.test(p) ? 'services' : /^\/(case-studies|work(-[a-z0-9-]+)?)(\/|$)/.test(p) ? 'cases' : 'other'; }
  function covers(rule, p) { return rule === '/' ? p === '/' : p === rule || p.indexOf(rule + '/') === 0; }
  var phone = function () { return innerWidth < 760; };
  // is the page, the device and the switch allowed for this surface? (not about this visitor's history)
  function allowed(c, surface) {
    if (!c.on || !c.surfaces[surface]) return false;
    if (c.never.some(function (r) { return covers(r, path); }) || c.exclude.some(function (r) { return covers(r, path); })) return false;
    if (phone() ? !c.devices.phone : !c.devices.desktop) return false;
    return !!c.types[typeOf(path)] || c.include.some(function (r) { return covers(r, path); });
  }
  function quiet(c) {   // subscribed, or said "No thanks" recently (a settings reset makes older answers stop counting)
    if (ls.get('apNlDone') === '1') return true;
    var m = /^(\d+)(?::(\d+))?$/.exec(ls.get('apNlX') || ''), c0 = c || cur || DEF;
    if (!m) return false;
    return +(m[2] || 1) >= c0.ver && Date.now() - +m[1] < c0.limits.quietDays * 864e5;
  }
  var seen = function () { return Number(ss.get('apNlSeen')) || 0; };
  function can(c, surface) { return allowed(c, surface) && !quiet(c) && seen() < c.limits.perVisit && !(window.matchMedia && matchMedia('print').matches); }
  function ev(k, s) {
    try { var d = JSON.stringify({ k: k, s: s, p: path }); if (!(navigator.sendBeacon && navigator.sendBeacon('/api/config?a=pev', d))) fetch('/api/config?a=pev', { method: 'POST', body: d, keepalive: true }); } catch (e) { /* counting must never break a page */ }
  }
  function copyOf(c, type, f) { var v = c.copy[type] && c.copy[type][f]; return v || c.copy['default'][f]; }
  function mark(c, surface) { ss.set('apNlSeen', String(seen() + 1)); ev('shown', surface); }
  function dismiss(c, surface) { ls.set('apNlX', Date.now() + ':' + c.ver); ev('dismiss', surface); }

  function css(c) {
    var old = document.getElementById('ap-rc-css'); if (old) old.remove();
    var s = c.style, bar = c.position === 'bar', left = c.position === 'left', rm = '@media(prefers-reduced-motion:reduce){#ap-rc{transition:none;transform:none}}';
    var el = document.createElement('style'); el.id = 'ap-rc-css';
    el.textContent = '#ap-rc{position:fixed;z-index:90;bottom:16px;' + (bar ? 'left:0;right:0;width:auto;border-radius:0;border-width:1px 0 0;padding:14px max(16px,calc((100vw - 1100px)/2)) calc(14px + env(safe-area-inset-bottom,0px));display:flex;flex-wrap:wrap;align-items:center;gap:8px 24px' : (left ? 'left' : 'right') + ':16px;width:min(360px,calc(100vw - 32px));padding:16px 16px 12px;border-radius:18px') + ';box-sizing:border-box;background:' + s.bg + ';border:1px solid ' + s.line + ';box-shadow:0 20px 60px rgba(0,0,0,.45);color:' + s.fg + ';font:400 14px/1.5 Geist,system-ui,sans-serif;opacity:0;transform:translateY(10px);transition:opacity .35s,transform .35s}'
      + (bar ? '#ap-rc{bottom:0}' : '')
      + '#ap-rc.is-on{opacity:1;transform:none}#ap-rc *{box-sizing:border-box}#ap-rc .apr-t{' + (bar ? 'flex:1 1 320px;min-width:0' : '') + '}#ap-rc b{display:block;margin:0 ' + (bar ? '0' : '28px') + ' 2px 0;font:600 15px/1.3 Geist,system-ui,sans-serif;letter-spacing:-.01em}#ap-rc p.apr-s{margin:0 ' + (bar ? '0' : '0 10px') + ';font-size:13px;color:' + s.mute + '}#ap-rc a{color:' + s.link + ';text-decoration:underline;text-underline-offset:3px}'
      + '#ap-rc form{display:flex;flex-wrap:wrap;gap:8px;' + (bar ? 'flex:1 1 360px;max-width:520px;margin-right:36px' : '') + '}#ap-rc input[type=email]{flex:1 1 150px;min-width:0;height:44px;padding:0 12px;border-radius:12px;border:1px solid ' + s.line + ';background:' + s.field + ';color:' + s.fg + ';font:400 15px Geist,system-ui,sans-serif}#ap-rc input:focus{outline:none;border-color:' + s.link + ';box-shadow:0 0 0 3px ' + s.link + '2e}'
      + '#ap-rc button[type=submit]{height:44px;padding:0 16px;border-radius:999px;border:0;background:' + s.accent + ';color:' + s.ink + ';font:600 14px Geist,system-ui,sans-serif;cursor:pointer}#ap-rc button[disabled]{opacity:.6;cursor:wait}'
      + '#ap-rc [data-news-msg]{flex-basis:100%;margin:0;font-size:12.5px;color:' + s.mute + '}#ap-rc [data-news-msg]:empty{display:none}#ap-rc [data-news-msg].is-ok{color:' + s.link + ';font-size:14px}#ap-rc [data-news-msg].is-err{color:#e0674a}'
      + '#ap-rc .apr-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}#ap-rc .apr-x{position:absolute;top:4px;right:4px;width:44px;height:44px;border:0;background:none;color:' + s.mute + ';font-size:22px;line-height:1;cursor:pointer}#ap-rc .apr-x:hover{color:' + s.fg + '}'
      + '#ap-rc .apr-no{' + (bar ? 'display:none' : 'display:block;margin:6px 0 0 auto') + ';min-height:32px;padding:0 4px;border:0;background:none;color:' + s.mute + ';font:500 12.5px Geist,system-ui,sans-serif;text-decoration:underline;text-underline-offset:3px;cursor:pointer}'
      + '@media(max-width:640px){#ap-rc{' + (bar ? '' : 'right:12px;left:12px;bottom:12px;width:auto') + '}#ap-rc .apr-no{display:block;margin:2px 0 0 auto}}@media(max-width:899px){#ap-rc.apr--tool{bottom:calc(84px + env(safe-area-inset-bottom,0px))}}'
      + rm + '@media print{#ap-rc{display:none!important}}';
    document.head.appendChild(el);
  }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
  var openCard = null;
  function closeCard(c, surface, remember) {
    var k = document.getElementById('ap-rc'); if (k) k.remove(); document.body.style.paddingBottom = '';
    if (remember) dismiss(c, surface);
    document.removeEventListener('keydown', openCard && openCard.esc); openCard = null;
  }
  // builds the card from the settings. Every word the admin set goes in with textContent, never as HTML.
  function render(c, surface) {
    var type = typeOf(path), via = surface === 'tool' ? 'card' : 'reading';
    css(c);
    var k = el('aside', 'apr--' + surface); k.id = 'ap-rc'; k.setAttribute('aria-label', 'New tools by email');
    var x = el('button', 'apr-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); k.appendChild(x);
    var t = el('div', 'apr-t'); t.appendChild(el('b', '', copyOf(c, type, 'head')));
    var p = el('p', 'apr-s', copyOf(c, type, 'body') + ' ');
    var a1 = el('a', '', 'What you get'); a1.href = '/newsletter'; var a2 = el('a', '', 'Privacy'); a2.href = '/privacy';
    p.appendChild(a1); p.appendChild(document.createTextNode(' · ')); p.appendChild(a2); t.appendChild(p); k.appendChild(t);
    var f = el('form'); f.setAttribute('data-news', via); f.noValidate = true; var ok = copyOf(c, type, 'success'); if (ok) f.setAttribute('data-ok', ok);
    var hp = el('input', 'apr-hp'); hp.name = 'hp'; hp.tabIndex = -1; hp.autocomplete = 'off'; hp.setAttribute('aria-hidden', 'true');
    var em = document.createElement('input'); em.name = 'email'; em.type = 'email'; em.placeholder = 'you@example.com'; em.autocomplete = 'email'; em.inputMode = 'email'; em.setAttribute('aria-label', 'Email address'); em.required = true; em.maxLength = 254;
    var sb = el('button', '', copyOf(c, type, 'button')); sb.type = 'submit';
    var m = el('p'); m.setAttribute('data-news-msg', ''); m.setAttribute('role', 'status'); m.setAttribute('aria-live', 'polite');
    [hp, em, sb, m].forEach(function (n) { f.appendChild(n); }); k.appendChild(f);
    var no = el('button', 'apr-no', copyOf(c, type, 'dismiss')); no.type = 'button'; k.appendChild(no);
    document.body.appendChild(k);
    var cc = document.getElementById('ap-cc');
    if (cc) { var r = cc.getBoundingClientRect(); k.style.bottom = Math.max(c.position === 'bar' ? 0 : 16, innerHeight - r.top + 12) + 'px'; }   // wide screens: just above the cookie notice
    var esc = function (e) { if (e.key === 'Escape') closeCard(c, surface, true); };
    openCard = { esc: esc };
    var go = function () { closeCard(c, surface, true); };
    x.addEventListener('click', go); no.addEventListener('click', go); document.addEventListener('keydown', esc);
    new MutationObserver(function () { if (k.querySelector('[data-news-msg].is-ok')) setTimeout(function () { closeCard(c, surface, false); }, 3500); }).observe(k, { subtree: true, attributes: true, attributeFilter: ['class'] });
    if (c.position === 'bar') document.body.style.paddingBottom = Math.ceil(k.getBoundingClientRect().height) + 'px';   // the bar never hides the end of the page
    requestAnimationFrame(function () { k.classList.add('is-on'); });
  }
  var lastKey = 0;   // typing: a pop-up never appears while someone is in the middle of it (a text field in focus and a key pressed in the last 3 seconds)
  document.addEventListener('keydown', function () { lastKey = Date.now(); }, true);
  var busy = function () { var a = document.activeElement; return !!(a && (/^(INPUT|TEXTAREA)$/.test(a.tagName) || a.isContentEditable) && !(a.closest && a.closest('#ap-rc')) && Date.now() - lastKey < 3000); };

  // surface: 'reading' (this file) or 'tool' (tools.js). Returns { use() } for tool pages, or null when nothing will be shown.
  function start(surface, opt) {
    opt = opt || {};
    if (surface === 'reading' && (typeOf(path) === 'tools' || path === '/')) return null;   // tools have their own card; the 3D home stays clean (it is also in the default "never" list)
    if (ls.get('apNlDone') === '1' && !force) return null;
    var ctl = { use: function () {} };
    load(function (c) {
      if (!can(c, surface)) return;
      var T = c.triggers, t0 = Date.now(), shown = false, tries = 0, tm = null;
      function show() {
        if (shown) return;
        if (!can(c, surface) || (opt.guard && !opt.guard())) return;
        var cc = document.getElementById('ap-cc');
        // wait (a few seconds at a time) for: the cookie notice on phones, an open menu, typing, a hidden tab
        if (++tries < 20 && ((cc && innerWidth < 900) || document.querySelector('.ap-nav__dd[open], .ap-nav [aria-expanded="true"]') || busy() || document.hidden)) return void (tm = setTimeout(show, 4000));
        shown = true; mark(c, surface); render(c, surface);
        removeEventListener('scroll', check); document.removeEventListener('mouseout', leave);
      }
      function check() {
        if (shown || surface !== 'reading') return;
        var d = document.documentElement, max = d.scrollHeight - innerHeight;
        if (max < 300) return;   // a short page: nothing worth waiting for
        var deep = (window.pageYOffset || d.scrollTop) / max >= T.scroll / 100 + (innerWidth < 640 ? .1 : 0), left = T.seconds * 1000 - (Date.now() - t0);
        if (deep && left <= 0) show(); else if (deep) setTimeout(check, left + 50);
      }
      function leave(e) {   // exit intent: the pointer leaves through the top of the window (desktop only), after the minimum time on the page
        if (!T.exit || shown || e.relatedTarget || e.clientY > 0 || phone() || !(window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches)) return;
        if (Date.now() - t0 >= c.limits.delay * 1000) show();
      }
      if (surface === 'reading') {
        addEventListener('scroll', check, { passive: true });
        setTimeout(function () { if (!shown && document.documentElement.scrollHeight - innerHeight >= 300) show(); }, force ? 1500 : T.fallback * 1000);   // someone who reads without scrolling still gets one quiet offer
      } else {
        ctl.use = function () { ctl.use = function () {}; setTimeout(show, Math.max(T.afterUse * 1000, c.limits.delay * 1000 - (Date.now() - t0))); };
        setTimeout(show, force ? 1500 : T.toolFallback * 1000);
      }
      if (T.exit) document.addEventListener('mouseout', leave);
    });
    return ctl;
  }

  window.apPop = { cfg: load, can: can, quiet: quiet, mark: mark, dismiss: dismiss, ev: ev, copy: copyOf, type: function () { return typeOf(path); }, start: start, now: function () { return cur || DEF; }, force: force };
  if (/^\/api\//.test(path)) return;
  start('reading');
})();
