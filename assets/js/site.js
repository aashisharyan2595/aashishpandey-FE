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

  /* ---- newsletter form in the footer ---- */
  var T0 = Date.now();
  document.addEventListener('submit', function (ev) {
    var f = ev.target; if (!f || !f.matches || !f.matches('form[data-news]')) return;
    ev.preventDefault();
    var msg = f.querySelector('[data-news-msg]'), btn = f.querySelector('button'), email = (f.email.value || '').trim();
    var say = function (t, cls) { msg.textContent = t; msg.className = cls || ''; };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say('That email address does not look right.', 'is-err'); f.email.focus(); return; }
    btn.disabled = true; say('Sending…');
    window.apToken().then(function (tk) {
      if (!tk && window.apTokenStuck) return { ok: false, j: { error: VERIFY_MSG } };
      return fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, hp: f.hp.value, ts: T0, page: location.pathname, name: ((f.elements['name'] && f.elements['name'].value) || '').trim().slice(0, 60), cf: tk }) }).then(asResult);
    })
      .then(function (x) { btn.disabled = false; if (x.ok) { f.email.value = ''; if (f.elements['name']) f.elements['name'].value = ''; say(x.j.message || 'Check your inbox to confirm.', 'is-ok'); if (window.apTrack) window.apTrack('newsletter_signup', {}); } else say(x.j.error || 'Could not subscribe. Please try again later.', 'is-err'); })
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
