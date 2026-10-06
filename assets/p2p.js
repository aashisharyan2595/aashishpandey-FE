/* P2P File Sharing (/tools/p2p-file-sharing).
 * Two browsers pair, then send files straight to each other over a WebRTC data channel. Nothing is uploaded.
 * Pairing, two ways:
 *   by code   the offer and answer go through /api/p2p, encrypted here with a key made from the code (the code never
 *             leaves the device). The server keeps that blob for 10 minutes at most and deletes it once the devices connect.
 *   by hand   the person copies an invite and a reply between the devices themselves; no server at all.
 * ICE uses public STUN only (no TURN relay), so a few strict networks cannot connect. The page says so.
 * Wire protocol on the channel: JSON strings for control, ArrayBuffers for file bytes, one file at a time, in order.
 *   {t:'hi',name}  {t:'meta',id,name,size,type}  <bytes...>  {t:'end',id}  {t:'cancel',id}
 *   receiver -> sender: {t:'got',id,n[,fin]} (bytes safely stored; drives the send window)  {t:'stop',id}
 *   {t:'text',id,s}  {t:'bye'}
 */
(function () {
'use strict';
var $ = function (s) { return document.querySelector(s); };
function h(tag, attrs) {
  var e = document.createElement(tag);
  if (attrs) for (var k in attrs) {
    if (attrs[k] == null) continue;
    if (k === 'class') e.className = attrs[k];
    else if (k === 'text') e.textContent = attrs[k];
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null) continue; e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); }
  return e;
}
function fmtSize(n) { return n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : n < 1073741824 ? (n / 1048576).toFixed(1) + ' MB' : (n / 1073741824).toFixed(2) + ' GB'; }
function fmtTime(s) {
  s = Math.max(1, Math.round(s));
  if (s < 60) return s + ' s';
  if (s < 3600) return Math.floor(s / 60) + ' min ' + (s % 60 ? (s % 60) + ' s' : '');
  return Math.floor(s / 3600) + ' h ' + Math.round((s % 3600) / 60) + ' min';
}
function show(el, on) { if (el) el.hidden = !on; }
function track(n, p) { try { if (window.apTrack) window.apTrack(n, p || {}); } catch (e) { /* analytics never breaks the tool */ } }

var ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }, { urls: 'stun:stun.cloudflare.com:3478' }];
var API = '/api/p2p';
var ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32: no I, L, O or U to misread
var CODE_LEN = 8, TTL = 600000;
var WINDOW = 16 * 1048576;   // bytes the sender may be ahead of what the receiver has stored
var HIGH = 4 * 1048576;      // pause sending while the channel buffer holds more than this
var READ = 1048576;          // read the file 1 MB at a time
var ACK = 1048576;           // receiver confirms every 1 MB
var DISK_FROM = 32 * 1048576; // incoming files this big go to browser storage (OPFS) where the browser allows it
var CONNECT_WAIT = 30000;

var supported = !!(window.RTCPeerConnection && window.crypto && crypto.subtle && window.TextEncoder);

/* ---------- small helpers ---------- */
function hex(u8) { var s = ''; for (var i = 0; i < u8.length; i++) s += (u8[i] < 16 ? '0' : '') + u8[i].toString(16); return s; }
function b64u(u8) { var s = ''; for (var i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function unb64u(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
function uid() { return hex(crypto.getRandomValues(new Uint8Array(6))); }
function newCode() { var b = crypto.getRandomValues(new Uint8Array(CODE_LEN)), s = ''; for (var i = 0; i < CODE_LEN; i++) s += ALPHA[b[i] & 31]; return s; }
function cleanCode(s) { return String(s || '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V').replace(/[^0-9A-Z]/g, ''); }
function niceCode(c) { return c.slice(0, 4) + '-' + c.slice(4); }
var ADJ = ['Amber', 'Brisk', 'Calm', 'Coral', 'Golden', 'Jade', 'Lunar', 'Misty', 'Quiet', 'Rapid', 'Silver', 'Solar', 'Swift', 'Teal', 'Velvet', 'Wild'];
var ANI = ['Falcon', 'Fox', 'Gecko', 'Heron', 'Koala', 'Lynx', 'Otter', 'Owl', 'Panda', 'Puma', 'Raven', 'Tiger', 'Whale', 'Wolf', 'Yak', 'Zebra'];
function deviceName() {
  var r = crypto.getRandomValues(new Uint8Array(2)), ua = navigator.userAgent, os = '';
  if (/iPhone/.test(ua)) os = 'iPhone'; else if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) os = 'iPad';
  else if (/Android/.test(ua)) os = 'Android'; else if (/Mac OS X/.test(ua)) os = 'Mac'; else if (/Windows/.test(ua)) os = 'Windows'; else if (/CrOS/.test(ua)) os = 'Chromebook'; else if (/Linux/.test(ua)) os = 'Linux';
  return ADJ[r[0] & 15] + ' ' + ANI[r[1] & 15] + (os ? ' (' + os + ')' : '');
}
var ME = deviceName();
function copy(text, btn, label) {
  (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () {
    if (!btn) return; var was = label || btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = was; }, 1400);
  }, function () { window.prompt('Copy this:', text); });
}
function api(method, query, body) {
  return fetch(API + (query || ''), { method: method, cache: 'no-store', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
    .then(function (r) { return (r.status === 204 ? Promise.resolve({}) : r.json().catch(function () { return {}; })).then(function (j) { return { status: r.status, ok: r.ok, j: j }; }); });
}

/* ---------- pairing crypto: the code becomes an AES key and a room id; neither the code nor the key leaves the device ---------- */
function derive(code) {
  var enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveBits']).then(function (base) {
    return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode('aashishpandey.com p2p v1'), iterations: 150000, hash: 'SHA-256' }, base, 384);
  }).then(function (bits) {
    bits = new Uint8Array(bits);
    return crypto.subtle.importKey('raw', bits.slice(0, 32), 'AES-GCM', false, ['encrypt', 'decrypt']).then(function (key) { return { key: key, room: hex(bits.slice(32, 48)) }; });
  });
}
function seal(key, obj) {
  var iv = crypto.getRandomValues(new Uint8Array(12));
  return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(JSON.stringify(obj))).then(function (ct) {
    ct = new Uint8Array(ct); var out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12); return b64u(out);
  });
}
function unseal(key, s) {
  var u = unb64u(s);
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.slice(0, 12) }, key, u.slice(12)).then(function (pt) { return JSON.parse(new TextDecoder().decode(pt)); });
}
/* by-hand pairing: the same message, compressed, as text a person can paste anywhere */
function pack(obj) {
  var bytes = new TextEncoder().encode(JSON.stringify(obj));
  if (!window.CompressionStream) return Promise.resolve('AP1j' + b64u(bytes));
  return new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()
    .then(function (b) { return 'AP1z' + b64u(new Uint8Array(b)); }, function () { return 'AP1j' + b64u(bytes); });
}
function unpack(s) {
  var m = String(s || '').replace(/\s+/g, '').match(/AP1([zj])([A-Za-z0-9_-]{20,})/);
  if (!m) return Promise.reject(new Error('That does not look like an invite or a reply from this page. Copy the whole thing.'));
  var bytes = unb64u(m[2]);
  var p = m[1] === 'j' ? Promise.resolve(bytes.buffer) : window.DecompressionStream
    ? new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()
    : Promise.reject(new Error('This browser is too old to read that. Update it, or use a code instead.'));
  return p.then(function (b) { var o = JSON.parse(new TextDecoder().decode(b)); if (!o || !o.sdp || !o.type) throw new Error('bad'); return o; })
    .catch(function (e) { throw new Error(e && /browser/.test(e.message) ? e.message : 'That text is incomplete or damaged. Copy the whole thing again.'); });
}

/* ---------- state ---------- */
var S = {
  pc: null, dc: null, role: '', mode: '', code: '', key: null, room: '', expires: 0,
  poll: 0, clock: 0, wait: 0, connected: false, peer: '', route: '', items: [], cur: null, sending: null, wake: null, chunk: 16384
};
var ui = {
  status: $('#p2p-status'), pair: $('#p2p-pair'), manual: $('#p2p-manual'), hostIdle: $('#p2p-host-idle'), host: $('#p2p-host'),
  code: $('#p2p-code'), qr: $('#p2p-qr'), expiry: $('#p2p-expiry'), join: $('#p2p-join'), joinIn: $('#p2p-join-code'),
  conn: $('#p2p-conn'), peer: $('#p2p-peer'), route: $('#p2p-route'), safety: $('#p2p-safety'), drop: $('#p2p-drop'), dropSub: $('#p2p-drop-sub'),
  pick: $('#p2p-pick'), textf: $('#p2p-textf'), textIn: $('#p2p-text-in'), list: $('#p2p-list'), bulk: $('#p2p-bulk'), saveAll: $('#p2p-saveall'),
  mHost: $('#p2p-m-host'), mInvite: $('#p2p-m-invite'), mReplyIn: $('#p2p-m-reply-in'), mInviteIn: $('#p2p-m-invite-in'), mGuest: $('#p2p-m-guest'), mReply: $('#p2p-m-reply'),
  joinBtn: $('#p2p-join button[type=submit]'), start: $('#p2p-start')
};
function say(text, kind) { ui.status.textContent = text || ''; ui.status.className = 'p2-status' + (kind ? ' is-' + kind : ''); show(ui.status, !!text); }
function busy() { return S.items.some(function (it) { return it.state === 'sending' || it.state === 'receiving' || it.state === 'queued' && S.connected || it.state === 'confirming'; }); }

/* ---------- WebRTC ---------- */
function closePc(quiet) {
  clearTimeout(S.poll); clearInterval(S.clock); clearTimeout(S.wait);
  if (S.dc) { try { if (!quiet && S.dc.readyState === 'open') S.dc.send(JSON.stringify({ t: 'bye' })); } catch (e) { /* closing anyway */ } S.dc.onclose = S.dc.onmessage = S.dc.onopen = null; try { S.dc.close(); } catch (e) { /* ignore */ } }
  if (S.pc) { S.pc.onconnectionstatechange = S.pc.oniceconnectionstatechange = S.pc.ondatachannel = null; try { S.pc.close(); } catch (e) { /* ignore */ } }
  if (S.role === 'host' && S.mode === 'code' && S.room && !S.connected) api('DELETE', '?room=' + S.room).catch(function () {});
  S.pc = S.dc = null; S.connected = false; S.room = ''; S.key = null; S.code = '';
}
function makePc() {
  closePc(true);
  var pc = new RTCPeerConnection({ iceServers: ICE });
  S.pc = pc;
  var watch = function () {
    if (pc !== S.pc) return;
    var st = pc.connectionState || pc.iceConnectionState;
    if (st === 'failed') { if (S.connected) lost('The connection dropped.'); else cantConnect(); }
    else if (st === 'disconnected' && S.connected) say('The connection is unstable. Waiting for it to come back…', 'warn');
    else if ((st === 'connected' || st === 'completed') && S.connected) say('');
  };
  pc.onconnectionstatechange = watch;
  pc.oniceconnectionstatechange = function () { if (!('connectionState' in pc)) watch(); };
  pc.ondatachannel = function (e) { wire(e.channel); };
  return pc;
}
// one message per side: wait until the browser has found its addresses (STUN), at most 4 seconds
function gathered(pc) {
  return new Promise(function (res) {
    if (pc.iceGatheringState === 'complete') return res();
    var t = setTimeout(res, 4000);
    pc.addEventListener('icegatheringstatechange', function () { if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } });
  });
}
function desc(pc) { return { type: pc.localDescription.type, sdp: pc.localDescription.sdp, name: ME }; }
function offer() {
  var pc = makePc();
  wire(pc.createDataChannel('ap-files', { ordered: true }));
  return pc.createOffer().then(function (o) { return pc.setLocalDescription(o); }).then(function () { return gathered(pc); }).then(function () { return desc(pc); });
}
function answer(off) {
  var pc = makePc();
  return pc.setRemoteDescription({ type: 'offer', sdp: off.sdp }).then(function () { return pc.createAnswer(); })
    .then(function (a) { return pc.setLocalDescription(a); }).then(function () { return gathered(pc); }).then(function () { return desc(pc); });
}
function waitForOpen(ms) {
  clearTimeout(S.wait);
  S.wait = setTimeout(function () { if (!S.connected) cantConnect(); }, ms);
}
function cantConnect() {
  var mode = S.mode;
  closePc(true); resetPair();
  say('The devices found each other but could not open a direct connection. This happens on some office, school and hotel networks, some mobile data networks and some VPNs, which block direct connections. Try both devices on the same Wi-Fi, switch off a VPN, or turn on a phone hotspot and join it with the other device.', 'bad');
  track('p2p_fail', { mode: mode });
}

/* ---------- pairing by code ---------- */
function startHost() {
  if (!supported) return;
  S.role = 'host'; S.mode = 'code';
  ui.start.disabled = true; say('Making a code…');
  var payload;
  offer().then(function (d) { payload = d; return tryRoom(3); }).then(function (r) {
    ui.start.disabled = false;
    if (!r.ok) { closePc(true); resetPair(); say((r.j && r.j.error) || 'Could not make a code. Check your connection, or use the copy and paste pairing below.', 'bad'); return; }
    showHost(); pollAnswer(S.room); track('p2p_pair', { mode: 'code' });
  }).catch(function () { ui.start.disabled = false; closePc(true); resetPair(); say('Could not make a code. Check your connection, or use the copy and paste pairing below.', 'bad'); });
  function tryRoom(n) {
    var code = newCode();
    return derive(code).then(function (k) {
      return seal(k.key, payload).then(function (blob) { return api('POST', '', { room: k.room, offer: blob }); }).then(function (r) {
        if (r.status === 409 && n > 1) return tryRoom(n - 1);
        if (r.ok) { S.code = code; S.key = k.key; S.room = k.room; S.expires = Date.now() + TTL; }
        return r;
      });
    });
  }
}
function link(param) { return location.origin + location.pathname + '#' + param; }
function showHost() {
  show(ui.hostIdle, false); show(ui.host, true);
  ui.code.textContent = niceCode(S.code);
  drawQr(link('c=' + S.code));
  say('Waiting for the other device. Enter the code there, or scan the QR code with its camera.');
  var tick = function () {
    var left = S.expires - Date.now();
    if (left <= 0) { closePc(true); resetPair(); say('The code expired after 10 minutes. Get a new one when the other device is ready.', 'warn'); return; }
    ui.expiry.textContent = 'Works once. Expires in ' + Math.floor(left / 60000) + ':' + String(Math.floor(left / 1000) % 60).padStart(2, '0') + '.';
  };
  tick(); clearInterval(S.clock); S.clock = setInterval(tick, 1000);
}
function pollAnswer(room) {
  var t0 = Date.now();
  var tick = function () {
    if (S.room !== room || S.connected) return;
    api('GET', '?room=' + room + '&want=answer').then(function (r) {
      if (S.room !== room) return;
      if (r.status === 200 && r.j.data) {
        clearInterval(S.clock);
        return unseal(S.key, r.j.data).then(function (ans) {
          S.peer = String(ans.name || 'the other device').slice(0, 60);
          say('Found ' + S.peer + '. Connecting…');
          return S.pc.setRemoteDescription({ type: 'answer', sdp: ans.sdp });
        }).then(function () { waitForOpen(CONNECT_WAIT); });
      }
      if (r.status === 410) { closePc(true); resetPair(); say('The code expired. Get a new one when the other device is ready.', 'warn'); return; }
      S.poll = setTimeout(tick, Date.now() - t0 < 60000 ? 1500 : 3000);
    }).catch(function () { if (S.room === room) S.poll = setTimeout(tick, 3000); });
  };
  S.poll = setTimeout(tick, 1200);
}
function joinCode(raw) {
  if (!supported) return;
  var code = cleanCode(raw);
  if (code.length !== CODE_LEN) { say('A code is 8 letters and numbers, like 7K3Q-9FMZ. Check it and try again.', 'bad'); ui.joinIn.focus(); return; }
  closePc(true); resetPair();
  ui.joinBtn.disabled = true; say('Looking for the other device…');
  var k;
  derive(code).then(function (x) { k = x; return api('GET', '?room=' + k.room + '&want=offer'); }).then(function (r) {
    if (!r.ok) throw new Error((r.j && r.j.error) || 'No device is waiting with that code.');
    return unseal(k.key, r.j.data).catch(function () { throw new Error('That code did not work. Check it and try again.'); });
  }).then(function (off) {
    S.role = 'guest'; S.mode = 'code'; S.peer = String(off.name || 'the other device').slice(0, 60);
    return answer(off);
  }).then(function (d) { return seal(k.key, d); }).then(function (blob) { return api('POST', '', { room: k.room, answer: blob }); }).then(function (r) {
    ui.joinBtn.disabled = false;
    if (!r.ok) throw new Error((r.j && r.j.error) || 'Could not join.');
    say('Connecting to ' + S.peer + '…'); waitForOpen(CONNECT_WAIT); track('p2p_join', { mode: 'code' });
  }).catch(function (e) {
    ui.joinBtn.disabled = false; closePc(true);
    say((e && e.message && !/^(Failed to fetch|NetworkError|Load failed)/.test(e.message)) ? e.message : 'Could not reach the pairing service. Check your connection, or use the copy and paste pairing below.', 'bad');
  });
}

/* ---------- pairing by hand (no server) ---------- */
function manualCreate() {
  if (!supported) return;
  S.role = 'host'; S.mode = 'manual';
  say('Making an invite…');
  offer().then(pack).then(function (inv) {
    ui.mInvite.value = inv; ui.mInvite.dataset.link = link('i=' + inv);
    show(ui.mHost, true); say('Send the invite to the other device, then paste its reply here.');
    track('p2p_pair', { mode: 'manual' });
  }).catch(function () { say('Could not make an invite in this browser.', 'bad'); });
}
function manualConnect() {
  if (!S.pc || S.role !== 'host' || S.mode !== 'manual') { say('Make an invite first, on this device.', 'bad'); return; }
  unpack(ui.mReplyIn.value).then(function (ans) {
    if (ans.type !== 'answer') throw new Error('That is an invite, not a reply. Paste the invite on the other device, then bring its reply back here.');
    S.peer = String(ans.name || 'the other device').slice(0, 60);
    say('Connecting to ' + S.peer + '…');
    return S.pc.setRemoteDescription({ type: 'answer', sdp: ans.sdp });
  }).then(function () { waitForOpen(CONNECT_WAIT); }).catch(function (e) { say(e.message || 'That reply did not work. Make a new invite and try again.', 'bad'); });
}
function manualJoin(text) {
  if (!supported) return;
  unpack(text).then(function (off) {
    if (off.type !== 'offer') throw new Error('That is a reply. Paste it on the device that made the invite.');
    S.role = 'guest'; S.mode = 'manual'; S.peer = String(off.name || 'the other device').slice(0, 60);
    say('Making a reply…');
    return answer(off);
  }).then(pack).then(function (rep) {
    ui.mReply.value = rep; show(ui.mGuest, true);
    say('Send this reply back to ' + S.peer + '. This page connects as soon as they paste it.');
    waitForOpen(TTL); track('p2p_join', { mode: 'manual' });
  }).catch(function (e) { say(e.message || 'That invite did not work.', 'bad'); });
}

/* ---------- QR code for the join link (assets/vendor/qrcode.js) ---------- */
function drawQr(text) {
  ui.qr.textContent = '';
  var lib = window.qrcode;
  if (!lib) { setTimeout(function () { if (S.code && text.indexOf(S.code) > 0) drawQr(text); }, 300); return; }
  try {
    var q = lib(0, 'M'); q.addData(text); q.make();
    var n = q.getModuleCount(), m = 2, d = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + m) + ' ' + (r + m) + 'h1v1h-1z';
    var t = n + m * 2;
    ui.qr.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + t + ' ' + t + '" shape-rendering="crispEdges" role="img" aria-label="QR code that opens this page with the code filled in"><rect width="' + t + '" height="' + t + '" fill="#fff"/><path d="' + d + '" fill="#070916"/></svg>';
  } catch (e) { /* the code and link still work */ }
}

/* ---------- the channel ---------- */
function wire(dc) {
  S.dc = dc;
  dc.binaryType = 'arraybuffer';
  dc.bufferedAmountLowThreshold = 1048576;
  dc.onopen = opened;
  dc.onclose = function () { if (S.dc === dc) lost('The other device disconnected.'); };
  dc.onmessage = onMessage;
  dc.onbufferedamountlow = function () { if (S.wake) S.wake(); };
}
function ctl(o) { if (S.dc && S.dc.readyState === 'open') S.dc.send(JSON.stringify(o)); }
function opened() {
  clearTimeout(S.wait); clearTimeout(S.poll); clearInterval(S.clock);
  S.connected = true;
  var max = S.pc && S.pc.sctp && S.pc.sctp.maxMessageSize;
  S.chunk = max ? Math.max(16384, Math.min(65536, max)) : 16384;
  if (S.mode === 'code' && S.role === 'host' && S.room) api('DELETE', '?room=' + S.room).catch(function () {});
  ctl({ t: 'hi', name: ME });
  show(ui.pair, false); show(ui.manual, false); show(ui.conn, true); show(ui.textf, true);
  ui.peer.textContent = 'Connected to ' + (S.peer || 'the other device');
  ui.route.textContent = 'Direct and encrypted';
  ui.dropSub.textContent = 'or click to choose. They go straight to ' + (S.peer || 'the other device') + '.';
  say('');
  routeInfo(); safetyNumber();
  track('p2p_connected', { mode: S.mode });
  pump();
}
function lost(msg) {
  var was = S.connected;
  S.items.forEach(function (it) {
    if (it.state === 'sending' || it.state === 'receiving' || it.state === 'confirming') { it.state = 'failed'; it.err = 'Stopped: the connection closed.'; if (it.sink) it.sink.abort(); }
  });
  S.cur = null; S.sending = null;
  closePc(true); resetPair(); release();
  if (was) say(msg + (S.items.some(function (x) { return x.dir === 'in' && x.url; }) ? ' Files you received are still here to save.' : ''), 'warn');
  renderAll();
}
function resetPair() {
  show(ui.pair, true); show(ui.manual, true); show(ui.conn, false); show(ui.textf, false);
  show(ui.hostIdle, true); show(ui.host, false); show(ui.mHost, false); show(ui.mGuest, false);
  ui.mInvite.value = ''; ui.mReply.value = ''; ui.qr.textContent = ''; ui.code.textContent = ''; ui.expiry.textContent = '';
  ui.dropSub.textContent = 'or click to choose. Any type, any size. They wait here until a device connects.';
  ui.start.disabled = false; ui.joinBtn.disabled = false;
}
function routeInfo() {
  if (!S.pc || !S.pc.getStats) return;
  S.pc.getStats().then(function (st) {
    var pair = null;
    st.forEach(function (r) { if (r.type === 'transport' && r.selectedCandidatePairId) pair = st.get(r.selectedCandidatePairId); });
    if (!pair) st.forEach(function (r) { if (!pair && r.type === 'candidate-pair' && r.state === 'succeeded' && (r.selected || r.nominated)) pair = r; });
    var l = pair && st.get(pair.localCandidateId), rm = pair && st.get(pair.remoteCandidateId);
    if (!l || !rm) return;
    var lan = l.candidateType === 'host' && rm.candidateType === 'host';
    S.route = lan ? 'lan' : 'internet';
    ui.route.textContent = lan ? 'Direct on your local network, encrypted' : 'Direct over the internet, encrypted';
  }).catch(function () {});
}
// a six-digit number both screens show; it is made from both devices' encryption fingerprints, so a device in the
// middle would make the two numbers differ
function safetyNumber() {
  var fp = function (sdp) { return ((sdp || '').match(/a=fingerprint:\S+ ([0-9A-Fa-f:]+)/) || [])[1] || ''; };
  var a = fp(S.pc.localDescription && S.pc.localDescription.sdp), b = fp(S.pc.remoteDescription && S.pc.remoteDescription.sdp);
  if (!a || !b) return;
  crypto.subtle.digest('SHA-256', new TextEncoder().encode([a.toUpperCase(), b.toUpperCase()].sort().join('|'))).then(function (d) {
    d = new Uint8Array(d);
    var n = String(((d[0] << 16) | (d[1] << 8) | d[2]) % 1000000).padStart(6, '0');
    ui.safety.textContent = 'Safety number ' + n.slice(0, 3) + ' ' + n.slice(3);
  });
}

/* ---------- sending ---------- */
function addFiles(list, dt) {
  var skipped = 0, files = [];
  Array.prototype.forEach.call(list, function (f, i) {
    var entry = dt && dt.items && dt.items[i] && dt.items[i].webkitGetAsEntry ? dt.items[i].webkitGetAsEntry() : null;
    if (entry && entry.isDirectory) { skipped++; return; }
    files.push(f);
  });
  files.forEach(function (f) { S.items.push({ id: uid(), dir: 'out', kind: 'file', file: f, name: f.name, size: f.size, type: f.type, done: 0, acked: 0, state: 'queued' }); });
  if (skipped) say('Folders cannot be sent as they are. Zip the folder first, then send the zip.', 'warn');
  else if (files.length && !S.connected) say(files.length === 1 ? 'Added. It sends as soon as a device connects.' : files.length + ' files added. They send as soon as a device connects.');
  renderAll(); pump();
}
function waitRoom() {
  return new Promise(function (res) { var t = setTimeout(done, 250); function done() { clearTimeout(t); if (S.wake === done) S.wake = null; res(); } S.wake = done; });
}
function pump() {
  if (S.sending || !S.connected) return;
  var it = null;
  for (var i = 0; i < S.items.length; i++) if (S.items[i].dir === 'out' && S.items[i].state === 'queued') { it = S.items[i]; break; }
  if (!it) { if (!busy()) release(); return; }
  if (it.kind === 'text') { ctl({ t: 'text', id: it.id, s: it.text }); it.state = 'sent'; renderItem(it); pump(); return; }
  S.sending = it; it.state = 'sending'; it.t0 = Date.now(); it.done = it.acked = 0; it.rate = []; hold();
  ctl({ t: 'meta', id: it.id, name: it.name, size: it.size, type: it.type || '' });
  renderItem(it);
  var dc = S.dc, off = 0;
  (function step() {
    if (it.state !== 'sending') { S.sending = null; pump(); return; }
    if (!dc || dc.readyState !== 'open') { S.sending = null; return; }
    if (off >= it.size) { ctl({ t: 'end', id: it.id }); it.state = 'confirming'; S.sending = null; renderItem(it); pump(); return; }
    if (dc.bufferedAmount > HIGH || off - it.acked > WINDOW) { waitRoom().then(step); return; }
    it.file.slice(off, off + READ).arrayBuffer().then(function (buf) {
      if (it.state !== 'sending' || dc.readyState !== 'open') { step(); return; }
      for (var p = 0; p < buf.byteLength; p += S.chunk) dc.send(new Uint8Array(buf, p, Math.min(S.chunk, buf.byteLength - p)));
      off += buf.byteLength; it.done = off;
      step();
    }, function () {
      it.state = 'failed'; it.err = 'This browser could not read the file. It may have been moved or deleted.';
      ctl({ t: 'cancel', id: it.id }); S.sending = null; renderItem(it); pump();
    });
  })();
}
function cancelOut(it) {
  if (it.state === 'sending' || it.state === 'confirming') ctl({ t: 'cancel', id: it.id });
  it.state = 'cancelled'; renderItem(it); if (!busy()) release();
}

/* ---------- receiving ---------- */
function canDisk() { return !!(navigator.storage && navigator.storage.getDirectory && window.FileSystemFileHandle && 'createWritable' in FileSystemFileHandle.prototype); }
// writes go through one promise chain, so bytes stay in order even while storage is still opening
function makeSink(id, size, type, onErr) {
  var parts = [], w = null, fh = null, dir = null, failed = false;
  var p = (size >= DISK_FROM && canDisk()
    ? navigator.storage.getDirectory().then(function (r) { return r.getDirectoryHandle('p2p-inbox', { create: true }); })
      .then(function (d) { dir = d; return d.getFileHandle(id, { create: true }); })
      .then(function (f) { fh = f; return f.createWritable(); }).then(function (x) { w = x; })
    : Promise.resolve()).catch(function () { w = null; /* no storage access: keep it in memory */ });
  var fail = function (e) { if (!failed) { failed = true; onErr(e); } };
  return {
    write: function (buf) { p = p.then(function () { if (failed) return; if (w) return w.write(buf); parts.push(buf); }).catch(fail); return p; },
    close: function () {
      return p.then(function () {
        if (failed) throw new Error('write');
        if (w) return w.close().then(function () { return fh.getFile(); }).then(function (f) { return new Blob([f], { type: type }); });
        var b = new Blob(parts, { type: type }); parts = null; return b;
      });
    },
    abort: function () { failed = true; parts = null; p.then(function () { if (w) return w.abort(); }).catch(function () {}).then(function () { if (dir) return dir.removeEntry(id); }).catch(function () {}); }
  };
}
function safeName(n) { n = String(n || 'file').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim().slice(0, 180); return n || 'file'; }
function onMessage(e) {
  var data = e.data;
  if (typeof data !== 'string') {
    var it = S.cur;
    if (!it || it.state !== 'receiving') return;
    var len = data.byteLength;
    it.got += len;
    if (it.got > it.size) { stopIn(it, 'The file was bigger than announced, so it was stopped.'); return; }
    it.sink.write(data).then(function () {
      it.stored += len;
      if (it.stored - it.ackd >= ACK) { it.ackd = it.stored; ctl({ t: 'got', id: it.id, n: it.stored }); }
    });
    tick(it);
    return;
  }
  var m; try { m = JSON.parse(data); } catch (x) { return; }
  var o = m.id && find(m.id);
  if (m.t === 'hi') { S.peer = String(m.name || S.peer || 'the other device').slice(0, 60); ui.peer.textContent = 'Connected to ' + S.peer; ui.dropSub.textContent = 'or click to choose. They go straight to ' + S.peer + '.'; }
  else if (m.t === 'meta') {
    var size = Math.max(0, +m.size || 0), type = String(m.type || '').slice(0, 100);
    var item = { id: String(m.id).slice(0, 20), dir: 'in', kind: 'file', name: safeName(m.name), size: size, type: type, got: 0, stored: 0, ackd: 0, state: 'receiving', t0: Date.now(), rate: [] };
    item.sink = makeSink(item.id, size, type, function () { stopIn(item, 'There is not enough storage space on this device for this file.'); });
    S.items.push(item); S.cur = item; hold(); renderAll();
  }
  else if (m.t === 'end' && o && o.dir === 'in') {
    if (o.state !== 'receiving') return;
    o.state = 'saving'; renderItem(o);
    o.sink.close().then(function (blob) {
      if (o.state !== 'saving') return;
      if (blob.size !== o.size) throw new Error('size');
      o.url = URL.createObjectURL(blob); o.state = 'done'; o.t1 = Date.now();
      ctl({ t: 'got', id: o.id, n: o.size, fin: 1 });
      renderItem(o); show(ui.bulk, true); say('Received ' + o.name + '.');
      if (!busy()) release();
    }).catch(function () { if (o.state === 'saving') stopIn(o, 'The file did not arrive complete. Ask for it to be sent again.'); });
    if (S.cur === o) S.cur = null;
  }
  else if (m.t === 'cancel' && o && o.dir === 'in' && (o.state === 'receiving' || o.state === 'saving')) { if (o.sink) o.sink.abort(); o.state = 'cancelled'; o.err = 'Cancelled by ' + (S.peer || 'the sender') + '.'; if (S.cur === o) S.cur = null; renderItem(o); if (!busy()) release(); }
  else if (m.t === 'got' && o && o.dir === 'out') {
    o.acked = Math.max(o.acked, +m.n || 0); rate(o, o.acked);
    if (m.fin) { o.state = 'sent'; o.t1 = Date.now(); renderItem(o); track('p2p_sent', { mb: Math.round(o.size / 1048576) }); if (!busy()) release(); }
    else tick(o);
    if (S.wake) S.wake();
  }
  else if (m.t === 'stop' && o && o.dir === 'out') { o.state = 'failed'; o.err = 'Stopped by ' + (S.peer || 'the other device') + '.'; renderItem(o); if (S.wake) S.wake(); }
  else if (m.t === 'text') { S.items.push({ id: String(m.id || uid()).slice(0, 20), dir: 'in', kind: 'text', text: String(m.s || '').slice(0, 20000), state: 'done' }); renderAll(); say('New message from ' + (S.peer || 'the other device') + '.'); }
  else if (m.t === 'bye') lost((S.peer || 'The other device') + ' disconnected.');
}
function stopIn(it, why) {
  if (it.sink) it.sink.abort();
  it.state = 'failed'; it.err = why;
  ctl({ t: 'stop', id: it.id });
  if (S.cur === it) S.cur = null;
  renderItem(it); if (!busy()) release();
}
function find(id) { for (var i = 0; i < S.items.length; i++) if (S.items[i].id === id) return S.items[i]; return null; }

/* ---------- keep the screen awake while files move (phones stop background tabs) ---------- */
var lock = null, holding = false;
function hold() {
  holding = true;
  if (lock || !navigator.wakeLock || document.visibilityState !== 'visible') return;
  navigator.wakeLock.request('screen').then(function (l) { lock = l; l.addEventListener('release', function () { lock = null; }); }).catch(function () {});
}
function release() { holding = false; if (lock) { lock.release().catch(function () {}); lock = null; } }
document.addEventListener('visibilitychange', function () { if (holding && document.visibilityState === 'visible') hold(); });
window.addEventListener('beforeunload', function (e) { if (S.connected && busy()) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- list ---------- */
function rate(it, n) {
  var now = Date.now(); it.rate.push([now, n]);
  while (it.rate.length > 2 && now - it.rate[0][0] > 3000) it.rate.shift();
}
var pending = {}, frame = 0;
function tick(it) {
  if (it.dir === 'in') rate(it, it.got);
  pending[it.id] = it;
  if (!frame) frame = setTimeout(function () { frame = 0; for (var k in pending) renderItem(pending[k]); pending = {}; }, 200);
}
var ICON = { out: '↑', in: '↓' };
function renderAll() {
  ui.list.textContent = '';
  S.items.forEach(function (it) { it.el = null; renderItem(it); });
  show(ui.bulk, S.items.some(function (x) { return x.dir === 'in' && x.url; }) || S.items.length > 0);
  show(ui.saveAll, S.items.filter(function (x) { return x.dir === 'in' && x.url; }).length > 1);
}
function stateText(it) {
  var peer = S.peer || 'the other device';
  var pct = function (n) { return it.size ? Math.floor(n / it.size * 100) + '%' : '100%'; };
  var speed = function () {
    var r = it.rate; if (!r || r.length < 2) return '';
    var dt = (r[r.length - 1][0] - r[0][0]) / 1000, db = r[r.length - 1][1] - r[0][1];
    if (dt <= 0 || db <= 0) return '';
    var bps = db / dt, left = (it.size - r[r.length - 1][1]) / bps;
    return ' · ' + fmtSize(bps) + '/s · ' + fmtTime(left) + ' left';
  };
  switch (it.state) {
    case 'queued': return S.connected ? 'Waiting its turn' : 'Waiting for a device to connect';
    case 'sending': return 'Sending · ' + pct(it.acked) + speed();
    case 'confirming': return 'Sent · waiting for ' + peer + ' to save it';
    case 'sent': return it.kind === 'text' ? 'Sent' : 'Delivered to ' + peer + (it.t1 && it.t0 ? ' in ' + fmtTime((it.t1 - it.t0) / 1000) : '');
    case 'receiving': return 'Receiving · ' + pct(it.got) + speed();
    case 'saving': return 'Finishing…';
    case 'done': return it.kind === 'text' ? 'From ' + peer : 'Received' + (it.t1 ? ' in ' + fmtTime((it.t1 - it.t0) / 1000) : '');
    case 'cancelled': return it.err || 'Cancelled';
    default: return it.err || 'Failed';
  }
}
function renderItem(it) {
  var el = h('li', { class: 'p2-item p2-item--' + it.dir + ' is-' + it.state, 'data-id': it.id });
  var head = h('div', { class: 'p2-item__head' }, h('span', { class: 'p2-item__dir', 'aria-hidden': 'true', text: ICON[it.dir] }));
  var info = h('div', { class: 'p2-item__info' });
  if (it.kind === 'text') {
    var isUrl = /^https?:\/\/\S+$/i.test(it.text.trim());
    info.appendChild(isUrl ? h('a', { class: 'p2-item__text', href: it.text.trim(), target: '_blank', rel: 'noopener noreferrer nofollow', text: it.text.trim() }) : h('p', { class: 'p2-item__text', text: it.text }));
    info.appendChild(h('span', { class: 'tl-small tl-muted', text: (it.dir === 'out' ? 'Message · ' : 'Message · ') + stateText(it) }));
  } else {
    info.appendChild(h('strong', { class: 'p2-item__name', text: it.name }));
    info.appendChild(h('span', { class: 'tl-small tl-muted', text: fmtSize(it.size) + ' · ' + stateText(it) }));
  }
  head.appendChild(info);
  var act = h('div', { class: 'p2-item__act' });
  if (it.kind === 'text') act.appendChild(h('button', { class: 'tl-copy', type: 'button', text: 'Copy', onclick: function (ev) { copy(it.text, ev.currentTarget, 'Copy'); } }));
  else if (it.dir === 'in' && it.url) act.appendChild(h('a', { class: 'tl-btn tl-btn--p p2-save', href: it.url, download: it.name, text: 'Save' }));
  if (it.dir === 'out' && (it.state === 'queued' || it.state === 'sending' || it.state === 'confirming')) act.appendChild(h('button', { class: 'tl-copy', type: 'button', text: it.state === 'queued' ? 'Remove' : 'Cancel', onclick: function () { if (it.state === 'queued') { S.items = S.items.filter(function (x) { return x !== it; }); renderAll(); } else cancelOut(it); } }));
  if (it.dir === 'in' && it.state === 'receiving') act.appendChild(h('button', { class: 'tl-copy', type: 'button', text: 'Stop', onclick: function () { stopIn(it, 'You stopped this file.'); } }));
  head.appendChild(act);
  el.appendChild(head);
  if (it.kind === 'file' && (it.state === 'sending' || it.state === 'receiving' || it.state === 'confirming' || it.state === 'saving')) {
    var n = it.dir === 'out' ? (it.state === 'sending' ? it.acked : it.size) : it.got;
    el.appendChild(h('div', { class: 'tl-bar p2-bar', role: 'progressbar', 'aria-label': it.name, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(it.size ? Math.floor(n / it.size * 100) : 100) }, h('i', { style: 'width:' + (it.size ? Math.min(100, n / it.size * 100) : 100).toFixed(1) + '%' })));
  }
  if (it.kind === 'file' && it.dir === 'in' && it.url && /^image\/(png|jpe?g|gif|webp|avif)$/.test(it.type) && it.size < 30 * 1048576) {
    el.appendChild(h('img', { class: 'p2-thumb', src: it.url, alt: '', loading: 'lazy' }));
  }
  if (it.el && it.el.parentNode) it.el.parentNode.replaceChild(el, it.el); else ui.list.prepend(el);
  it.el = el;
  show(ui.bulk, S.items.length > 0);
  show(ui.saveAll, S.items.filter(function (x) { return x.dir === 'in' && x.url; }).length > 1);
}

/* ---------- wiring ---------- */
if (!supported) {
  show($('#p2p-unsupported'), true);
  ['#p2p-start', '#p2p-join button', '#p2p-m-create', '#p2p-m-join'].forEach(function (s) { var b = $(s); if (b) b.disabled = true; });
}
// clear what a previous visit left in browser storage
if (canDisk()) navigator.storage.getDirectory().then(function (r) { return r.removeEntry('p2p-inbox', { recursive: true }); }).catch(function () {});

ui.start.addEventListener('click', startHost);
$('#p2p-cancel').addEventListener('click', function () { closePc(true); resetPair(); say('Cancelled. The code no longer works.'); });
$('#p2p-copy-link').addEventListener('click', function (e) { copy(link('c=' + S.code), e.currentTarget, 'Copy link'); });
var shareBtn = $('#p2p-share');
if (navigator.share) { show(shareBtn, true); shareBtn.addEventListener('click', function () { navigator.share({ title: 'Join my file share', text: 'Open this to receive files directly from my browser. Code ' + niceCode(S.code), url: link('c=' + S.code) }).catch(function () {}); }); }
ui.join.addEventListener('submit', function (e) { e.preventDefault(); joinCode(ui.joinIn.value); });
ui.joinIn.addEventListener('input', function () {
  var c = cleanCode(ui.joinIn.value).slice(0, CODE_LEN), v = c.length > 4 ? c.slice(0, 4) + '-' + c.slice(4) : c;
  if (ui.joinIn.value !== v) ui.joinIn.value = v;
});
$('#p2p-m-create').addEventListener('click', manualCreate);
$('#p2p-m-copy').addEventListener('click', function (e) { copy(ui.mInvite.value, e.currentTarget, 'Copy invite'); });
$('#p2p-m-copylink').addEventListener('click', function (e) { copy(ui.mInvite.dataset.link || '', e.currentTarget, 'Copy as a link'); });
$('#p2p-m-connect').addEventListener('click', manualConnect);
$('#p2p-m-join').addEventListener('click', function () { manualJoin(ui.mInviteIn.value); });
$('#p2p-m-copyreply').addEventListener('click', function (e) { copy(ui.mReply.value, e.currentTarget, 'Copy reply'); });
$('#p2p-disconnect').addEventListener('click', function () {
  if (busy() && !window.confirm('Files are still moving. Disconnect anyway?')) return;
  ctl({ t: 'bye' }); lost('Disconnected.');
});
ui.textf.addEventListener('submit', function (e) {
  e.preventDefault();
  var t = ui.textIn.value; if (!t.trim()) return;
  S.items.push({ id: uid(), dir: 'out', kind: 'text', text: t.slice(0, 20000), state: 'queued' });
  ui.textIn.value = ''; renderAll(); pump();
});
ui.saveAll.addEventListener('click', function () {
  var got = S.items.filter(function (x) { return x.dir === 'in' && x.url; });
  got.forEach(function (x, i) { setTimeout(function () { var a = h('a', { href: x.url, download: x.name }); document.body.appendChild(a); a.click(); a.remove(); }, i * 400); });
});
$('#p2p-clear').addEventListener('click', function () {
  S.items = S.items.filter(function (x) {
    var live = x.state === 'sending' || x.state === 'receiving' || x.state === 'confirming' || x.state === 'saving' || x.state === 'queued';
    if (!live && x.url) URL.revokeObjectURL(x.url);
    return live;
  });
  renderAll();
});
var drop = ui.drop, pick = ui.pick;
drop.addEventListener('click', function () { pick.click(); });
drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick.click(); } });
pick.addEventListener('change', function () { addFiles(pick.files); pick.value = ''; });
['dragenter', 'dragover'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
['dragleave', 'drop'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
drop.addEventListener('drop', function (e) { addFiles(e.dataTransfer.files, e.dataTransfer); });

// a join link: #c=CODE (pair by code) or #i=INVITE (by hand). Read it, then take it out of the address bar and history.
function fromLink() {
  var m = location.hash.match(/^#(c|i)=([A-Za-z0-9_-]+)/);
  if (!m) return;
  history.replaceState(null, '', location.pathname + location.search);
  if (!supported) return;
  if (m[1] === 'c') { ui.joinIn.value = niceCode(cleanCode(m[2])); joinCode(m[2]); }
  else { ui.manual.open = true; ui.mInviteIn.value = m[2]; manualJoin(m[2]); }
}
fromLink();
window.addEventListener('hashchange', fromLink);
window.__p2p = { S: S, cleanCode: cleanCode, derive: derive, pack: pack, unpack: unpack };
})();
