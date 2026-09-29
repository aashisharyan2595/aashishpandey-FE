/* Shared site script: clean-URL routing in preview, analytics, focus trap. Loaded in <head> of every page. */
(function () {
  var ROUTES = {
    '/': 'Portfolio.dc.html',
    '/portfolio': 'Proof-v2.dc.html',
    '/case-studies': 'Case-Studies.dc.html',
    '/services': 'Services.dc.html',
    '/tech-consultant': 'Tech-Consultant.dc.html',
    '/ui-ux-design': 'UI-UX-Design.dc.html',
    '/seo-consultant': 'SEO-Consultant.dc.html',
    '/full-stack-developer': 'Full-Stack-Developer.dc.html',
    '/shopify-developer': 'Shopify-Developer.dc.html',
    '/how-this-site-was-built': 'How-This-Site-Was-Built.dc.html',
    '/work-liquid-iv': 'Work-Liquid-IV.dc.html',
    '/work-talenti': 'Work-Talenti.dc.html',
    '/work-storynest': 'Work-StoryNest.dc.html',
    '/work-ceat-specialty': 'Work-CEAT-Specialty.dc.html',
    '/tools': 'Tools-v2.dc.html',
    '/tools/pad': 'Tools-Pad-v2.dc.html',
    '/tools/url-shortener': 'Tools-Shortener.dc.html',
    '/tools/image-resizer': 'Tools-Image.dc.html',
    '/tools/lorem-ipsum-generator': 'Tools-Lorem.dc.html',
    '/tools/qr-code-generator': 'Tools-QR.dc.html',
    '/tools/website-launch-checklist': 'Tools-Checklist.dc.html'
  };
  // Set a GA4 measurement ID (e.g. 'G-XXXXXXX') to enable Google Analytics. Vercel Web Analytics loads automatically in production.
  var GA_ID = 'G-H9J2D0RHRT';

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
  if (!dev) {
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    var v = document.createElement('script'); v.defer = true; v.src = '/_vercel/insights/script.js'; document.head.appendChild(v);
    if (GA_ID) {
      var g = document.createElement('script'); g.async = true; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID; document.head.appendChild(g);
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date()); window.gtag('config', GA_ID);
    }
  }
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
