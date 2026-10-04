/* Shared site script: clean-URL routing in preview, analytics, focus trap. Loaded in <head> of every page. */
(function () {
  var ROUTES = {
    '/': 'Portfolio.dc.html',
    '/portfolio': 'Proof-v3.dc.html',
    '/case-studies': 'Case-Studies.dc.html',
    '/services': 'Services.dc.html',
    '/tech-consultant': 'Tech-Consultant.dc.html',
    '/ui-ux-design': 'UI-UX-Design.dc.html',
    '/seo-consultant': 'SEO-Consultant.dc.html',
    '/freelance-project-manager': 'Freelance-Project-Manager.dc.html',
    '/image-license': 'Image-License.dc.html',
    '/contact': 'Contact.dc.html',
    '/terms': 'Legal-Terms.dc.html',
    '/privacy': 'Legal-Privacy.dc.html',
    '/cookies': 'Legal-Cookies.dc.html',
    '/full-stack-developer': 'Full-Stack-Developer.dc.html',
    '/wordpress-webflow-developer': 'Wordpress-Webflow-Developer.dc.html',
    '/shopify-developer': 'Shopify-Developer.dc.html',
    '/how-this-site-was-built': 'How-This-Site-Was-Built.dc.html',
    '/work-liquid-iv': 'Work-Liquid-IV.dc.html',
    '/work-talenti': 'Work-Talenti.dc.html',
    '/work-storynest': 'Work-StoryNest.dc.html',
    '/work-ceat-specialty': 'Work-CEAT-Specialty.dc.html',
    '/tools': 'Tools-v3.dc.html',
    '/tools/pad': 'Tools-Pad-v2.dc.html',
    '/tools/url-shortener': 'Tools-Shortener.dc.html',
    '/tools/image-resizer': 'Tools-Image.dc.html',
    '/tools/lorem-ipsum-generator': 'Tools-Lorem.dc.html',
    '/tools/qr-code-generator': 'Tools-QR.dc.html',
    '/tools/qr-code-checker': 'Tools-QR-Check.dc.html',
    '/tools/website-launch-checklist': 'Tools-Checklist.dc.html',
    '/tools/exif-remover': 'Tools-Exif.dc.html',
    '/tools/file-hash-checker': 'Tools-Hash.dc.html',
    '/tools/password-generator': 'Tools-Password.dc.html',
    '/tools/time-zone-meeting-planner': 'Tools-Timezone.dc.html',
    '/tools/project-estimate-calculator': 'Tools-Estimate.dc.html',
    '/tools/invoice-generator': 'Tools-Invoice.dc.html',
    '/tools/resume-maker': 'Tools-Resume.dc.html',
    '/tools/resume-maker/build': 'Tools-Resume-Build.dc.html',
    '/tools/resume-maker/templates': 'Tools-Resume-Templates.dc.html',
    '/tools/resume-maker/examples': 'Tools-Resume-Examples.dc.html',
    '/tools/resume-maker/guide': 'Tools-Resume-Guide.dc.html',
    '/tools/resume-maker/examples/software-engineer': 'Tools-Resume-Ex-SoftwareEngineer.dc.html',
    '/tools/resume-maker/examples/ux-ui-designer': 'Tools-Resume-Ex-UxUiDesigner.dc.html',
    '/tools/resume-maker/examples/project-manager': 'Tools-Resume-Ex-ProjectManager.dc.html',
    '/tools/resume-maker/examples/data-analyst': 'Tools-Resume-Ex-DataAnalyst.dc.html',
    '/tools/resume-maker/examples/marketing-manager': 'Tools-Resume-Ex-MarketingManager.dc.html',
    '/tools/resume-maker/examples/sales-manager': 'Tools-Resume-Ex-SalesManager.dc.html',
    '/tools/resume-maker/examples/mechanical-engineer': 'Tools-Resume-Ex-MechanicalEngineer.dc.html',
    '/tools/resume-maker/examples/graduate': 'Tools-Resume-Ex-Graduate.dc.html'
  };
  // Set a GA4 measurement ID (e.g. 'G-XXXXXXX') to enable Google Analytics. Vercel Web Analytics loads automatically in production.
  var GA_ID = 'G-H9J2D0RHRT';
  // Microsoft Clarity (session replay and heatmaps). Production only, loaded when idle, and not on the pages where visitors type their own
  // text or personal details (notepad, resume builder, invoice), because those pages promise the data stays on the device.
  var CLARITY_ID = 'yr4j64clj0';
  var NO_CLARITY = /^\/tools\/(pad|invoice-generator|resume-maker\/build|password-generator|exif-remover|file-hash-checker|estimate|project-estimate-calculator)/;

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
  /* ---- consent: Google Analytics and Clarity only run after the visitor accepts ---- */
  var CONSENT_KEY = 'apConsent';
  function getConsent() { try { var c = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'); return c && typeof c.a === 'boolean' ? c : null; } catch (e) { return null; } }
  function setConsent(a) { try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: 1, a: a, t: Date.now() })); } catch (e) {} }
  var gpc = navigator.globalPrivacyControl === true;   // a Global Privacy Control signal counts as "reject"
  function analyticsAllowed() { var c = getConsent(); return !gpc && !!(c && c.a); }
  function whenIdle(fn, ms) {
    var done = false, run = function () { if (done) return; done = true; fn(); };
    ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) { addEventListener(ev, run, { once: true, passive: true }); });
    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: ms }); else setTimeout(run, ms - 1000);
  }
  var started = false;
  function startAnalytics() {
    if (dev || started || !analyticsAllowed()) return; started = true;
    window['ga-disable-' + GA_ID] = false;
    if (GA_ID) {
      // GA is queued now and its script loads when the page is idle, so it never competes with first paint
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date()); window.gtag('config', GA_ID);
      whenIdle(function () { if (!analyticsAllowed()) return; var g = document.createElement('script'); g.async = true; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID; document.head.appendChild(g); }, 4000);
    }
    if (CLARITY_ID && !NO_CLARITY.test(location.pathname)) {
      whenIdle(function () {
        if (!analyticsAllowed()) return;
        (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, 'clarity', 'script', CLARITY_ID);
      }, 9000);
    }
  }
  function stopAnalytics() {
    window['ga-disable-' + GA_ID] = true;
    if (window.clarity) { try { window.clarity('consent', false); } catch (e) {} }
    var host = location.hostname.split('.').slice(-2).join('.');
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (/^(_ga|_gid|_gat|_clck|_clsk|MUID|CLID|ANONCHK|SM|_uetsid|_uetvid)/.test(n)) ['', '; domain=' + host, '; domain=.' + host].forEach(function (d) { document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d; });
    });
  }
  if (!dev) {
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    var v = document.createElement('script'); v.defer = true; v.src = '/_vercel/insights/script.js'; document.head.appendChild(v);   // cookieless
    startAnalytics();
  }

  /* ---- cookie notice ---- */
  function showNotice(fromFooter) {
    var old = document.getElementById('ap-cc'); if (old) old.remove();
    if (!document.getElementById('ap-cc-css')) {
      var st = document.createElement('style'); st.id = 'ap-cc-css';
      st.textContent = '#ap-cc{position:fixed;z-index:95;left:16px;bottom:16px;width:min(440px,calc(100vw - 32px));box-sizing:border-box;padding:18px 18px 16px;border-radius:20px;background:rgba(15,20,51,.97);border:1px solid rgba(244,239,230,.18);box-shadow:0 24px 70px rgba(0,0,0,.55);color:#f4efe6;font:400 14px/1.55 Geist,system-ui,sans-serif;animation:apccIn .5s cubic-bezier(.16,1,.3,1) both}'
        + '#ap-cc *{box-sizing:border-box}#ap-cc h2{margin:0 0 6px;font:600 16px/1.2 Geist,system-ui,sans-serif;letter-spacing:-.02em}#ap-cc p{margin:0 0 14px;color:#cfc9d8}#ap-cc a{color:#f5b867;text-decoration:underline;text-underline-offset:3px}'
        + '#ap-cc .apcc-row{display:flex;gap:10px;flex-wrap:wrap}#ap-cc button{flex:1 1 140px;min-height:44px;padding:0 16px;border-radius:999px;font:600 14px Geist,system-ui,sans-serif;cursor:pointer;border:1px solid rgba(244,239,230,.35);background:rgba(244,239,230,.08);color:#f4efe6;transition:background .2s,border-color .2s}'
        + '#ap-cc button:hover{background:rgba(244,239,230,.16);border-color:#f4efe6}#ap-cc button[data-a="1"]{background:#f5b867;border-color:#f5b867;color:#1a1420}#ap-cc button[data-a="1"]:hover{background:#ffc880}'
        + '#ap-cc :focus-visible{outline:2px solid #7ff3e1;outline-offset:2px}@keyframes apccIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){#ap-cc{animation:none}}';
      document.head.appendChild(st);
    }
    var cur = getConsent(), box = document.createElement('div');
    box.id = 'ap-cc'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Cookie notice');
    box.innerHTML = '<h2>Cookies and analytics</h2><p>I use Google Analytics and Microsoft Clarity to see how the site is used. They only start if you accept. The tools and the rest of the site work without them. '
      + (cur ? 'Right now you have <strong>' + (cur.a ? 'accepted' : 'rejected') + '</strong> analytics. ' : '') + 'See the <a href="/cookies">cookie policy</a> and the <a href="/privacy">privacy policy</a>.</p>'
      + '<div class="apcc-row"><button type="button" data-a="0">Reject</button><button type="button" data-a="1">Accept analytics</button></div>';
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('button[data-a]'); if (!b) return;
      var yes = b.getAttribute('data-a') === '1'; setConsent(yes); box.remove();
      if (yes) startAnalytics(); else { started = false; stopAnalytics(); }
    });
    document.body.appendChild(box);
    if (fromFooter) { var f = box.querySelector('button'); if (f) f.focus(); }
  }
  function initNotice() { if (!getConsent() && !gpc) showNotice(false); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNotice); else initNotice();
  document.addEventListener('click', function (ev) { var t = ev.target.closest && ev.target.closest('[data-cookie-settings]'); if (t) { ev.preventDefault(); showNotice(true); } });

  /* ---- newsletter form in the footer ---- */
  var T0 = Date.now();
  document.addEventListener('submit', function (ev) {
    var f = ev.target; if (!f || !f.matches || !f.matches('form[data-news]')) return;
    ev.preventDefault();
    var msg = f.querySelector('[data-news-msg]'), btn = f.querySelector('button'), email = (f.email.value || '').trim();
    var say = function (t, cls) { msg.textContent = t; msg.className = cls || ''; };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say('That email address does not look right.', 'is-err'); f.email.focus(); return; }
    btn.disabled = true; say('Sending…');
    window.apToken().then(function (tk) { return fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, hp: f.hp.value, ts: T0, page: location.pathname, cf: tk }) }); })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) { btn.disabled = false; if (x.ok) { f.email.value = ''; say(x.j.message || 'Check your inbox to confirm.', 'is-ok'); if (window.apTrack) window.apTrack('newsletter_signup', {}); } else say(x.j.error || 'Could not subscribe. Please try again later.', 'is-err'); })
      .catch(function () { btn.disabled = false; say('Could not reach the server. Please try again later.', 'is-err'); });
  });
  /* ---- Cloudflare Turnstile (optional): runs only when TURNSTILE_SITEKEY is set in Vercel; stays invisible unless Cloudflare needs a click ---- */
  var tsLoading = null, tsWidget = null, tsKey = '', tsResolve = null;
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
    return tsLoad().then(function (t) {
      if (!t) return '';
      return new Promise(function (resolve) {
        var done = false, fin = function (v) { if (!done) { done = true; tsResolve = null; resolve(v || ''); } };
        tsResolve = fin;
        var box = document.getElementById('ap-ts');
        if (!box) { box = document.createElement('div'); box.id = 'ap-ts'; box.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:96'; document.body.appendChild(box); }
        if (tsWidget === null) tsWidget = t.render(box, { sitekey: tsKey, execution: 'execute', appearance: 'interaction-only', callback: function (tok) { if (tsResolve) tsResolve(tok); }, 'error-callback': function () { if (tsResolve) tsResolve(''); } });
        else t.reset(tsWidget);
        t.execute(tsWidget);
        setTimeout(function () { fin(''); }, 20000);
      });
    });
  };
  // shared by every brief form: same rules as the newsletter (honeypot, time check, JSON POST, inline result)
  window.apSend = function (d) {
    d.hp = ''; d.ts = T0; d.page = location.pathname;
    try { var rf = new URL(document.referrer); d.ref = rf.origin === location.origin ? rf.pathname : rf.hostname; } catch (e) { /* no referrer */ }
    return window.apToken().then(function (tk) { d.cf = tk; return fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }); })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
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
