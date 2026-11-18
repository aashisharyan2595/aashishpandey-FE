/* Service worker for the private chat. It only shows a blank "new message" notification and opens the chat when tapped.
   It never reads, stores or fetches anything: messages are sealed on the device and only the page can open them. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('push', function (e) {
  var d = {}; try { d = e.data.json(); } catch (x) { d = {}; }
  e.waitUntil(self.registration.showNotification(d.title || 'New message', { body: d.body || 'Open the chat to read it.', tag: d.tag || 'room', renotify: true, data: { url: typeof d.url === 'string' && d.url.charAt(0) === '/' ? d.url : '/' } }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) { if (new URL(list[i].url).pathname === url && 'focus' in list[i]) return list[i].focus(); }
    return self.clients.openWindow(url);
  }));
});
