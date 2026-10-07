/* Service worker for the admin app: installable shell, offline reading of the last inbox you saw, and push notifications.
   It only ever sees the admin page (its scope), and only caches a few read-only API answers. Signing out clears them. */
var V = 'v7', SHELL = 'ap-admin-shell-' + V, DATA = 'ap-admin-data-' + V;
var PATH = '/kd2ozfuew9n4uaciyl1j', API = '/api/kd2ozfuew9n4uaciyl1j', ORIGIN = self.location.origin;
var CACHEABLE = { me: 1, list: 1, links_list: 1, news_overview: 1, spam_get: 1, alerts_get: 1, tpl_get: 1, digest_get: 1 };
var MAX_DATA = 24;

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) { return c.addAll([PATH, PATH + '.webmanifest', '/assets/icon-192.png', '/assets/icon-512.png', '/assets/badge-96.png', '/assets/favicon.svg']); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('ap-admin-') === 0 && k !== SHELL && k !== DATA; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});

function fromCache(res) {   // same answer, marked so the page can say it is showing saved data
  var h = new Headers(res.headers); h.set('X-From-Cache', '1');
  return res.blob().then(function (b) { return new Response(b, { status: res.status, statusText: res.statusText, headers: h }); });
}
function trim(cache) { return cache.keys().then(function (ks) { return Promise.all(ks.slice(0, Math.max(0, ks.length - MAX_DATA)).map(function (k) { return cache.delete(k); })); }); }
function networkFirst(req, name, mark) {
  return fetch(req).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(name).then(function (c) { return c.put(req, copy).then(function () { return name === DATA ? trim(c) : null; }); }); }
    return res;
  }).catch(function () {
    return caches.match(req, { cacheName: name }).then(function (hit) { if (!hit) throw new Error('offline'); return mark ? fromCache(hit) : hit; });
  });
}
self.addEventListener('fetch', function (e) {
  var req = e.request; if (req.method !== 'GET') return;   // anything that changes data goes straight to the network
  var url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === 'navigate' && url.pathname === PATH) { e.respondWith(networkFirst(new Request(PATH), SHELL, false)); return; }
    if (url.pathname === API) { if (CACHEABLE[url.searchParams.get('a')]) e.respondWith(networkFirst(req, DATA, true)); return; }
    if (url.pathname.indexOf('/assets/') === 0) { e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req).then(function (res) { var c = res.clone(); caches.open(SHELL).then(function (ca) { ca.put(req, c); }); return res; }); })); return; }
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req).then(function (res) { var c = res.clone(); caches.open(SHELL).then(function (ca) { ca.put(req, c); }); return res; }); }));
  }
});
self.addEventListener('message', function (e) { if (e.data && e.data.type === 'clear') e.waitUntil(caches.delete(DATA)); });

self.addEventListener('push', function (e) {
  var d = {}; try { d = e.data.json(); } catch (x) { d = { title: 'aashishpandey.com', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'aashishpandey.com', { body: d.body || '', icon: ORIGIN + '/assets/icon-192.png', badge: ORIGIN + '/assets/badge-96.png', tag: d.tag || 'alert', renotify: true, data: { url: d.url || PATH } }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close(); var url = (e.notification.data && e.notification.data.url) || PATH;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) { if (list[i].url.indexOf(PATH) >= 0 && 'focus' in list[i]) return list[i].focus(); }
    return self.clients.openWindow(url);
  }));
});
