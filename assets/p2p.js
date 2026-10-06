/* P2P File Sharing (/tools/p2p-file-sharing), room edition.
 * One person opens a room, up to MAXGUESTS others join, and everyone can share files and messages. Nothing is uploaded:
 * every device is joined to the others by an encrypted WebRTC data channel.
 *
 * Joining, two ways:
 *   by code   each guest leaves one offer in a mailbox (/api/p2p, sealed here with a key made from the code, which never
 *             leaves the device) and the host answers it. Several guests can use one code while the room is open.
 *   by hand   the host copies an invite to a guest and pastes the reply back, no server at all. Repeat for each guest.
 * The host is the hub. When a guest joins, the host sends the member list and the guest opens direct links to the other
 * guests, passing the WebRTC offers and answers through the host's channel. Nobody needs the server for that part.
 *
 * Files move as a swarm, a little like BitTorrent. A file is cut into pieces (1 MB, larger for huge files) and the owner
 * announces the SHA-256 of every piece. A downloader asks any device that has a piece for it, checks the hash, keeps it, and
 * from then on serves it to the others. Devices that still lack many pieces fetch pieces that other guests already hold,
 * and only go to the owner for pieces nobody else has, so the owner uploads each piece about once, however many people
 * download. Pieces are picked rarest first; a stalled or lying peer is dropped and its pieces are asked for elsewhere.
 * Connection servers: public STUN, plus a TURN relay when the site has one configured (/api/p2p-ice). Devices connect directly
 * whenever they can, so a room works across countries and networks; the relay only carries traffic that is already encrypted.
 *
 * Wire protocol, JSON strings for control and ArrayBuffers for piece bytes, per link:
 *   hi {id,name}        first message each way
 *   room {members}      host to a new guest;  join {id,name} / leave {id}  host to everyone
 *   sig {to,from,k,d}   a guest's offer or answer for another guest, relayed by the host
 *   file {id,name,size,type,ps,owner,oname,h}   a shared file (h = base64 of all piece hashes); flooded to every device
 *   unshare {id}        owner withdrew a file (flooded);   text {id,s,from}  a message (flooded)
 *   have {f,b}          which pieces I hold (base64 bitmap);   got {f,i}  I now hold piece i
 *   req {f,i}           send me piece i;   nope {f,i}  I cannot;   piece {f,i,len}  then binary frames adding up to len
 *   bye {kicked}
 */
(function () {
'use strict';
const $ = (s) => document.querySelector(s);
function h(tag, attrs) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    if (attrs[k] == null) continue;
    if (k === 'class') e.className = attrs[k];
    else if (k === 'text') e.textContent = attrs[k];
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  for (let i = 2; i < arguments.length; i++) { const c = arguments[i]; if (c == null) continue; e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); }
  return e;
}
const fmtSize = (n) => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : n < 1073741824 ? (n / 1048576).toFixed(1) + ' MB' : (n / 1073741824).toFixed(2) + ' GB';
function fmtTime(s) {
  s = Math.max(1, Math.round(s));
  if (s < 60) return s + ' s';
  if (s < 3600) return Math.floor(s / 60) + ' min ' + (s % 60 ? (s % 60) + ' s' : '');
  return Math.floor(s / 3600) + ' h ' + Math.round((s % 3600) / 60) + ' min';
}
const show = (el, on) => { if (el) el.hidden = !on; };
function track(n, p) { try { if (window.apTrack) window.apTrack(n, p || {}); } catch (e) { /* analytics never breaks the tool */ } }

const STUN = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }, { urls: 'stun:stun.cloudflare.com:3478' }];
// Connection servers come from /api/p2p-ice: public STUN plus, when the site has one set up, short-lived TURN relay credentials.
// A relay is only used when two devices cannot reach each other directly, and it carries traffic that is already encrypted.
let ice = { iceServers: STUN, relay: false, at: 0 };
function loadIce() {
  if (Date.now() - ice.at < 1200000) return Promise.resolve(ice);
  return fetch('/api/p2p-ice', { cache: 'no-store' }).then((r) => r.json()).then((j) => {
    if (j && Array.isArray(j.iceServers) && j.iceServers.length) ice = { iceServers: j.iceServers, relay: !!j.relay, at: Date.now() };
    return ice;
  }).catch(() => ice);
}
const API = '/api/p2p';
const ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32: no I, L, O or U to misread
const CODE_LEN = 8, TTL = 900000;
const MAXGUESTS = 8;            // a room holds the host and this many guests
const HIGH = 4 * 1048576;       // pause sending on a link while its buffer holds more than this
const FLIGHT = 8 * 1048576;     // bytes of pieces asked for from one device at a time
const DISK_FROM = 32 * 1048576; // incoming files this big go to browser storage (OPFS) where the browser allows it
const CONNECT_WAIT = 30000, MESH_WAIT = 25000, STALL = 15000;
const MAXPIECES = 2048;

const supported = !!(window.RTCPeerConnection && window.crypto && crypto.subtle && window.TextEncoder);

/* ---------- small helpers ---------- */
const hex = (u8) => Array.from(u8, (b) => (b < 16 ? '0' : '') + b.toString(16)).join('');
function b64u(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function unb64u(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
const uid = () => hex(crypto.getRandomValues(new Uint8Array(6)));
function newCode() { const b = crypto.getRandomValues(new Uint8Array(CODE_LEN)); let s = ''; for (let i = 0; i < CODE_LEN; i++) s += ALPHA[b[i] & 31]; return s; }
const cleanCode = (s) => String(s || '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V').replace(/[^0-9A-Z]/g, '');
const niceCode = (c) => c.slice(0, 4) + '-' + c.slice(4);
const ADJ = ['Amber', 'Brisk', 'Calm', 'Coral', 'Golden', 'Jade', 'Lunar', 'Misty', 'Quiet', 'Rapid', 'Silver', 'Solar', 'Swift', 'Teal', 'Velvet', 'Wild'];
const ANI = ['Falcon', 'Fox', 'Gecko', 'Heron', 'Koala', 'Lynx', 'Otter', 'Owl', 'Panda', 'Puma', 'Raven', 'Tiger', 'Whale', 'Wolf', 'Yak', 'Zebra'];
function deviceName() {
  const r = crypto.getRandomValues(new Uint8Array(2)), ua = navigator.userAgent;
  let os = '';
  if (/iPhone/.test(ua)) os = 'iPhone'; else if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) os = 'iPad';
  else if (/Android/.test(ua)) os = 'Android'; else if (/Mac OS X/.test(ua)) os = 'Mac'; else if (/Windows/.test(ua)) os = 'Windows'; else if (/CrOS/.test(ua)) os = 'Chromebook'; else if (/Linux/.test(ua)) os = 'Linux';
  return ADJ[r[0] & 15] + ' ' + ANI[r[1] & 15] + (os ? ' (' + os + ')' : '');
}
const ME = { id: uid(), name: deviceName() };
function copy(text, btn, label) {
  (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => {
    if (!btn) return; const was = label || btn.textContent; btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = was; }, 1400);
  }, () => { window.prompt('Copy this:', text); });
}
function api(method, query, body) {
  return fetch(API + (query || ''), { method, cache: 'no-store', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
    .then((r) => (r.status === 204 ? Promise.resolve({}) : r.json().catch(() => ({}))).then((j) => ({ status: r.status, ok: r.ok, j })));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n || 60);

/* ---------- pairing crypto: the code becomes an AES key and a room id; neither the code nor the key leaves the device ---------- */
async function derive(code) {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode('aashishpandey.com p2p v1'), iterations: 150000, hash: 'SHA-256' }, base, 384));
  const key = await crypto.subtle.importKey('raw', bits.slice(0, 32), 'AES-GCM', false, ['encrypt', 'decrypt']);
  return { key, room: hex(bits.slice(32, 48)) };
}
async function seal(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj))));
  const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12); return b64u(out);
}
async function unseal(key, s) {
  const u = unb64u(s);
  return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.slice(0, 12) }, key, u.slice(12))));
}
/* by-hand pairing: the same message, compressed, as text a person can paste anywhere */
async function pack(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if (!window.CompressionStream) return 'AP1j' + b64u(bytes);
  try { return 'AP1z' + b64u(new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer())); } catch (e) { return 'AP1j' + b64u(bytes); }
}
async function unpack(s) {
  const m = String(s || '').replace(/\s+/g, '').match(/AP1([zj])([A-Za-z0-9_-]{20,})/);
  if (!m) throw new Error('That does not look like an invite or a reply from this page. Copy the whole thing.');
  try {
    const bytes = unb64u(m[2]);
    let buf;
    if (m[1] === 'j') buf = bytes.buffer;
    else if (window.DecompressionStream) buf = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
    else throw new Error('This browser is too old to read that. Update it, or use a code instead.');
    const o = JSON.parse(new TextDecoder().decode(buf));
    if (!o || !o.sdp || !o.type) throw new Error('bad');
    return o;
  } catch (e) { throw new Error(e && /browser/.test(e.message) ? e.message : 'That text is incomplete or damaged. Copy the whole thing again.'); }
}

/* ---------- state ---------- */
const S = {
  role: '',          // 'host' or 'guest' once a room exists
  code: '', key: null, room: '', expires: 0, poll: 0, clock: 0, polling: false,
  hostId: '', members: new Map(),   // id -> name, as the host tells us
  items: [], mPend: null, seen: new Set(), stat: { up: 0, down: 0, t0: 0, peak: 0, files: 0 }
};
const links = [];     // every WebRTC link this device has, to the host and to other guests
const F = new Map();  // file id -> file item (the same objects that are in S.items)
const ui = {
  status: $('#p2p-status'), pair: $('#p2p-pair'), manual: $('#p2p-manual'), hostIdle: $('#p2p-host-idle'), host: $('#p2p-host'), hostTitle: $('#p2p-host-title'),
  cardJoin: $('#p2p-card-join'), code: $('#p2p-code'), qr: $('#p2p-qr'), expiry: $('#p2p-expiry'), join: $('#p2p-join'), joinIn: $('#p2p-join-code'),
  conn: $('#p2p-conn'), peer: $('#p2p-peer'), route: $('#p2p-route'), safety: $('#p2p-safety'), members: $('#p2p-members'), drop: $('#p2p-drop'), dropSub: $('#p2p-drop-sub'),
  pick: $('#p2p-pick'), textf: $('#p2p-textf'), textIn: $('#p2p-text-in'), opts: $('#p2p-opts'), auto: $('#p2p-auto'), list: $('#p2p-list'), bulk: $('#p2p-bulk'), saveAll: $('#p2p-saveall'),
  mHost: $('#p2p-m-host'), mInvite: $('#p2p-m-invite'), mReplyIn: $('#p2p-m-reply-in'), mInviteIn: $('#p2p-m-invite-in'), mGuest: $('#p2p-m-guest'), mReply: $('#p2p-m-reply'),
  joinBtn: $('#p2p-join button[type=submit]'), start: $('#p2p-start'), cancel: $('#p2p-cancel'), extend: $('#p2p-extend'), empty: $('#p2p-empty')
};
function say(text, kind) { ui.status.textContent = text || ''; ui.status.className = 'p2-status' + (kind ? ' is-' + kind : ''); show(ui.status, !!text); }
const openLinks = () => links.filter((l) => l.open && l.id);
const usable = (l) => l.open && !(l.slowUntil > Date.now());
function busy() {
  return S.items.some((it) => it.kind === 'file' && (it.state === 'downloading' || it.state === 'saving' || it.state === 'hashing')) || links.some((l) => l.serving);
}

/* ---------- links ---------- */
function newLink(opts) {
  const l = Object.assign({ id: '', name: '', pc: null, dc: null, open: false, have: {}, full: {}, nreq: 0, inq: [], serving: false, cur: null, lastRx: Date.now(), bad: 0, chunk: 16384, timer: 0, wake: null, safety: '', route: '' }, opts);
  links.push(l);
  return l;
}
function linkById(id) { for (const l of links) if (l.id === id) return l; return null; }
function newPc(l) {
  const pc = new RTCPeerConnection({ iceServers: ice.iceServers });
  l.pc = pc;
  const watch = () => {
    if (pc !== l.pc) return;
    const st = pc.connectionState || pc.iceConnectionState;
    if (st === 'failed') { if (l.open) dropLink(l, 'The connection to ' + (l.name || 'a device') + ' dropped.'); else failLink(l); }
    else if (st === 'disconnected' && l.open && !l.toMesh) say('The connection is unstable. Waiting for it to come back…', 'warn');
    else if ((st === 'connected' || st === 'completed') && l.open) say('');
  };
  pc.onconnectionstatechange = watch;
  pc.oniceconnectionstatechange = () => { if (!('connectionState' in pc)) watch(); };
  pc.ondatachannel = (e) => wire(l, e.channel);
  return pc;
}
// one message per side: wait until the browser has found its addresses (STUN), at most 4 seconds
function gathered(pc) {
  return new Promise((res) => {
    if (pc.iceGatheringState === 'complete') return res();
    const t = setTimeout(res, 4000);
    pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } });
  });
}
const desc = (pc) => ({ type: pc.localDescription.type, sdp: pc.localDescription.sdp, name: ME.name, id: ME.id });
async function makeOffer(l) {
  await loadIce();
  const pc = newPc(l);
  wire(l, pc.createDataChannel('ap-files', { ordered: true }));
  await pc.setLocalDescription(await pc.createOffer());
  await gathered(pc);
  return desc(pc);
}
async function makeAnswer(l, off) {
  await loadIce();
  const pc = newPc(l);
  await pc.setRemoteDescription({ type: 'offer', sdp: off.sdp });
  await pc.setLocalDescription(await pc.createAnswer());
  await gathered(pc);
  return desc(pc);
}
function waitForOpen(l, ms) {
  clearTimeout(l.timer);
  l.timer = setTimeout(() => { if (!l.open) failLink(l); }, ms);
}
function failLink(l) {
  if (links.indexOf(l) < 0) return;
  const mesh = l.toMesh;
  removeLink(l);
  if (mesh) return; // a guest-to-guest link that cannot form is fine: that guest still reaches us through the host
  if (!openLinks().length && !S.room) { say(ice.relay ? 'The devices found each other but could not connect, even through the relay. Switch off a VPN, check neither device is behind a very strict firewall, and try again.' : 'The devices found each other but could not open a direct connection. This happens on some office, school and hotel networks, some mobile data networks and some VPNs, which block direct connections. Try both devices on the same Wi-Fi, switch off a VPN, or turn on a phone hotspot and join it with the other device.', 'bad'); S.role = ''; layout(); }
  else say('A device found the room but could not open a direct connection. It may be on a network that blocks them (some office, school and mobile networks and VPNs do).', 'warn');
  track('p2p_fail', {});
}
function removeLink(l) {
  const i = links.indexOf(l); if (i >= 0) links.splice(i, 1);
  clearTimeout(l.timer);
  if (l.dc) { l.dc.onclose = l.dc.onmessage = l.dc.onopen = null; try { l.dc.close(); } catch (e) { /* closing anyway */ } }
  if (l.pc) { l.pc.onconnectionstatechange = l.pc.oniceconnectionstatechange = l.pc.ondatachannel = null; try { l.pc.close(); } catch (e) { /* ignore */ } }
  l.pc = l.dc = null; l.open = false; l.inq = [];
  F.forEach((f) => { for (const i in f.req) if (f.req[i].l === l) delete f.req[i]; });
  if (S.mPend === l) S.mPend = null;
}
function dropLink(l, msg) {
  if (links.indexOf(l) < 0) return;
  const wasHost = l.toHost, id = l.id, name = l.name;
  removeLink(l);
  if (S.role === 'host' && l.guest && id) { S.members.delete(id); flood({ t: 'leave', id }); }
  else if (wasHost) { S.hostGone = true; S.members.clear(); openLinks().forEach((x) => S.members.set(x.id, x.name)); }
  if (l.toMesh && openLinks().length) { layout(); renderMembers(); pull(); return; }
  if (!openLinks().length) { allGone(wasHost ? (msg || 'The host left.') : (name ? name + ' left.' : msg)); return; }
  if (wasHost) say((name || 'The host') + ' left. You can still share with the other devices here.', 'warn');
  else say((name || 'A device') + ' left.');
  layout(); renderMembers(); renderAll(); pull();
}
// nobody is connected any more
function allGone(msg) {
  const was = S.items.some((it) => it.kind === 'file' && it.state === 'downloading');
  S.items.forEach((it) => {
    if (it.kind !== 'file') return;
    if (it.state === 'downloading' || it.state === 'saving') { it.state = 'failed'; it.err = 'Stopped: the connection closed.'; if (it.store) it.store.drop(); it.store = null; }
    else if (it.state === 'available') { dropFile(it); }
  });
  S.members.clear(); S.hostId = ''; S.hostGone = false;
  if (S.role === 'guest' || !S.room) S.role = '';
  release(); layout(); renderMembers(); renderAll();
  if (msg) say(msg + (S.items.some((x) => x.kind === 'file' && x.url) ? ' Files you received are still here to save.' : ''), was ? 'warn' : '');
}
function wire(l, dc) {
  l.dc = dc;
  dc.binaryType = 'arraybuffer';
  dc.bufferedAmountLowThreshold = 1048576;
  dc.onopen = () => opened(l);
  dc.onclose = () => { if (l.dc === dc) dropLink(l, (l.name || 'The other device') + ' disconnected.'); };
  dc.onmessage = (e) => onMessage(l, e);
  dc.onbufferedamountlow = () => { if (l.wake) l.wake(); };
}
function send(l, o) { if (l.dc && l.dc.readyState === 'open') { try { l.dc.send(JSON.stringify(o)); } catch (e) { /* link is closing */ } } }
function flood(o, except) { openLinks().forEach((l) => { if (l !== except && l.id) send(l, o); }); }
function opened(l) {
  clearTimeout(l.timer);
  l.open = true; l.lastRx = Date.now();
  const max = l.pc && l.pc.sctp && l.pc.sctp.maxMessageSize;
  l.chunk = max ? Math.max(16384, Math.min(65536, max)) : 16384;
  send(l, { t: 'hi', id: ME.id, name: ME.name });
}
// the other side introduced itself: now we can talk about the room
function onHi(l, m) {
  l.id = clean(m.id, 20) || l.id || uid(); l.name = clean(m.name) || 'Another device';
  if (links.some((x) => x !== l && x.id === l.id && x.open)) { removeLink(l); return; } // already linked to this device
  if (!S.stat.t0) S.stat.t0 = Date.now();
  if (S.role === 'host' && l.guest) {
    S.members.set(l.id, l.name);
    send(l, { t: 'room', members: openLinks().filter((x) => x !== l && x.id).map((x) => ({ id: x.id, name: x.name })) });
    flood({ t: 'join', id: l.id, name: l.name }, l);
    say(l.name + ' joined.');
    track('p2p_connected', { n: openLinks().length });
  } else if (l.toHost) { S.hostId = l.id; S.members.set(l.id, l.name); track('p2p_connected', {}); }
  else S.members.set(l.id, l.name);
  syncFiles(l);
  layout(); renderMembers(); routeInfo(l); safetyNumber(l);
  renderAll(); pull();
}
// tell a new link everything we know: the files in the room and which pieces we hold
function syncFiles(l) {
  F.forEach((f) => { if (f.h) send(l, fileMsg(f)); });
  F.forEach((f) => { if (f.h && f.have && f.nhave) send(l, { t: 'have', f: f.id, b: packBits(f.have) }); });
}
function routeInfo(l) {
  if (!l.pc || !l.pc.getStats) return;
  l.pc.getStats().then((st) => {
    let pair = null;
    st.forEach((r) => { if (r.type === 'transport' && r.selectedCandidatePairId) pair = st.get(r.selectedCandidatePairId); });
    if (!pair) st.forEach((r) => { if (!pair && r.type === 'candidate-pair' && r.state === 'succeeded' && (r.selected || r.nominated)) pair = r; });
    const a = pair && st.get(pair.localCandidateId), b = pair && st.get(pair.remoteCandidateId);
    if (!a || !b) return;
    l.route = a.candidateType === 'relay' || b.candidateType === 'relay' ? 'relay' : a.candidateType === 'host' && b.candidateType === 'host' ? 'lan' : 'internet';
    layout();
  }).catch(() => {});
}
// a six-digit number both screens show; it is made from both devices' encryption fingerprints, so a device in the middle would make the two numbers differ
function safetyNumber(l) {
  const fp = (sdp) => ((sdp || '').match(/a=fingerprint:\S+ ([0-9A-Fa-f:]+)/) || [])[1] || '';
  const a = fp(l.pc && l.pc.localDescription && l.pc.localDescription.sdp), b = fp(l.pc && l.pc.remoteDescription && l.pc.remoteDescription.sdp);
  if (!a || !b) return;
  crypto.subtle.digest('SHA-256', new TextEncoder().encode([a.toUpperCase(), b.toUpperCase()].sort().join('|'))).then((d) => {
    d = new Uint8Array(d);
    const n = String(((d[0] << 16) | (d[1] << 8) | d[2]) % 1000000).padStart(6, '0');
    l.safety = n.slice(0, 3) + ' ' + n.slice(3);
    renderMembers();
  });
}

/* ---------- room by code ---------- */
async function startHost() {
  if (!supported) return;
  S.role = 'host';
  ui.start.disabled = true; say('Making a code…');
  try {
    for (let n = 3; n > 0; n--) {
      const code = newCode(), k = await derive(code);
      const r = await api('POST', '', { room: k.room, offer: await seal(k.key, { name: ME.name, id: ME.id }) });
      if (r.status === 409 && n > 1) continue;
      ui.start.disabled = false;
      if (!r.ok) { S.role = openLinks().length ? 'host' : ''; say((r.j && r.j.error) || 'Could not make a code. Check your connection, or use the copy and paste pairing below.', 'bad'); layout(); return; }
      S.code = code; S.key = k.key; S.room = k.room; S.expires = Date.now() + TTL;
      showHost(); pollJoins(S.room); track('p2p_pair', { mode: 'code' });
      return;
    }
  } catch (e) { /* fall through */ }
  ui.start.disabled = false; S.role = openLinks().length ? 'host' : ''; layout();
  say('Could not make a code. Check your connection, or use the copy and paste pairing below.', 'bad');
}
const link = (param) => location.origin + location.pathname + '#' + param;
function showHost() {
  layout();
  ui.code.textContent = niceCode(S.code);
  drawQr(link('c=' + S.code));
  say(openLinks().length ? '' : 'Waiting for the other devices. Enter the code there, or scan the QR code with a camera.');
  const tick = () => {
    const left = S.expires - Date.now();
    if (left <= 0) { closeRoom(); say('The code expired. Make a new one to add more devices.', 'warn'); return; }
    ui.expiry.textContent = 'Open for new devices for ' + Math.floor(left / 60000) + ':' + String(Math.floor(left / 1000) % 60).padStart(2, '0') + '.';
  };
  tick(); clearInterval(S.clock); S.clock = setInterval(tick, 1000);
}
function closeRoom(quiet) {
  clearTimeout(S.poll); clearInterval(S.clock);
  if (S.room) api('DELETE', '?room=' + S.room).catch(() => {});
  S.room = ''; S.key = null; S.code = '';
  if (!openLinks().length && !S.mPend) S.role = '';
  ui.qr.textContent = ''; ui.code.textContent = ''; ui.expiry.textContent = '';
  layout();
  if (!quiet && openLinks().length) say('The code is closed. Devices in the room stay connected. Make a new code to add more.');
}
// the host collects the guests' offers and answers each one
function pollJoins(room) {
  const run = async () => {
    if (S.room !== room) return;
    try {
      const r = await api('GET', '?room=' + room + '&want=joins');
      if (S.room !== room) return;
      if (r.status === 410) { closeRoom(); say('The code expired. Make a new one to add more devices.', 'warn'); return; }
      if (r.ok && r.j.data && r.j.data.length) for (const row of r.j.data) await admit(room, S.key, row);
    } catch (e) { /* try again */ }
    if (S.room === room) S.poll = setTimeout(run, 1500);
  };
  S.poll = setTimeout(run, 800);
}
async function admit(room, key, row) {
  const dot = row.indexOf('.'), gid = row.slice(0, dot);
  let off;
  try { off = await unseal(key, row.slice(dot + 1)); } catch (e) { return; } // not sealed with this room's key: ignore it
  const full = openLinks().filter((x) => x.guest).length + links.filter((x) => x.guest && !x.open).length >= MAXGUESTS;
  if (full || !off.sdp) { await api('POST', '', { room, gid, answer: await seal(key, { full: true }) }).catch(() => {}); return; }
  const l = newLink({ guest: true, mode: 'code' });
  try {
    const ans = await makeAnswer(l, off);
    await api('POST', '', { room, gid, answer: await seal(key, ans) });
    waitForOpen(l, CONNECT_WAIT);
  } catch (e) { removeLink(l); }
}
async function joinCode(raw) {
  if (!supported) return;
  const code = cleanCode(raw);
  if (code.length !== CODE_LEN) { say('A code is 8 letters and numbers, like 7K3Q-9FMZ. Check it and try again.', 'bad'); ui.joinIn.focus(); return; }
  if (openLinks().length) { say('Leave this room first to join another.', 'bad'); return; }
  ui.joinBtn.disabled = true; say('Looking for the room…');
  let l = null;
  try {
    const k = await derive(code);
    const r = await api('GET', '?room=' + k.room + '&want=offer');
    if (!r.ok) throw new Error((r.j && r.j.error) || 'No device is waiting with that code.');
    const hello = await unseal(k.key, r.j.data).catch(() => { throw new Error('That code did not work. Check it and try again.'); });
    S.role = 'guest';
    l = newLink({ toHost: true, mode: 'code', name: clean(hello.name) });
    const off = await makeOffer(l), gid = uid() + '';
    const j = await api('POST', '', { room: k.room, gid, join: await seal(k.key, off) });
    if (!j.ok) throw new Error((j.j && j.j.error) || 'Could not join.');
    say('Asking ' + (l.name || 'the host') + ' to let you in…');
    track('p2p_join', { mode: 'code' });
    const t0 = Date.now();
    for (;;) {
      if (links.indexOf(l) < 0) return;
      const a = await api('GET', '?room=' + k.room + '&want=answer&gid=' + gid);
      if (a.status === 200 && a.j.data) {
        const ans = await unseal(k.key, a.j.data);
        if (ans.full) throw new Error('This room is full. It holds the host and ' + MAXGUESTS + ' other devices.');
        await l.pc.setRemoteDescription({ type: 'answer', sdp: ans.sdp });
        say('Connecting to ' + (l.name || 'the host') + '…'); waitForOpen(l, CONNECT_WAIT);
        break;
      }
      if (a.status === 410) throw new Error('The host closed the code before you were connected.');
      if (Date.now() - t0 > 60000) throw new Error('The host did not answer in time. Check that their page is still open.');
      await sleep(1000);
    }
  } catch (e) {
    if (l) removeLink(l);
    S.role = '';
    say((e && e.message && !/^(Failed to fetch|NetworkError|Load failed)/.test(e.message)) ? e.message : 'Could not reach the pairing service. Check your connection, or use the copy and paste pairing below.', 'bad');
  }
  ui.joinBtn.disabled = false; layout();
}

/* ---------- room by hand (no server) ---------- */
async function manualCreate() {
  if (!supported) return;
  if (openLinks().length >= MAXGUESTS) { say('The room is full.', 'bad'); return; }
  if (S.mPend) removeLink(S.mPend);
  if (!S.role) S.role = 'host';
  say('Making an invite…');
  try {
    const l = newLink({ guest: true, mode: 'manual' }); S.mPend = l;
    const inv = await pack(await makeOffer(l));
    ui.mInvite.value = inv; ui.mInvite.dataset.link = link('i=' + inv); ui.mReplyIn.value = '';
    show(ui.mHost, true); say('Send the invite to the other device, then paste its reply here.');
    track('p2p_pair', { mode: 'manual' });
  } catch (e) { S.mPend = null; say('Could not make an invite in this browser.', 'bad'); }
}
async function manualConnect() {
  const l = S.mPend;
  if (!l || !l.pc) { say('Make an invite first, on this device.', 'bad'); return; }
  try {
    const ans = await unpack(ui.mReplyIn.value);
    if (ans.type !== 'answer') throw new Error('That is an invite, not a reply. Paste the invite on the other device, then bring its reply back here.');
    l.name = clean(ans.name) || 'the other device';
    say('Connecting to ' + l.name + '…');
    await l.pc.setRemoteDescription({ type: 'answer', sdp: ans.sdp });
    waitForOpen(l, CONNECT_WAIT);
  } catch (e) { say(e.message || 'That reply did not work. Make a new invite and try again.', 'bad'); }
}
async function manualJoin(text) {
  if (!supported) return;
  try {
    const off = await unpack(text);
    if (off.type !== 'offer') throw new Error('That is a reply. Paste it on the device that made the invite.');
    if (openLinks().length) throw new Error('Leave this room first to join another.');
    S.role = 'guest';
    const l = newLink({ toHost: true, mode: 'manual', name: clean(off.name) || 'the other device' });
    say('Making a reply…');
    const rep = await pack(await makeAnswer(l, off));
    ui.mReply.value = rep; show(ui.mGuest, true);
    say('Send this reply back to ' + l.name + '. This page connects as soon as they paste it.');
    waitForOpen(l, TTL); track('p2p_join', { mode: 'manual' });
  } catch (e) { S.role = ''; say(e.message || 'That invite did not work.', 'bad'); }
}

/* ---------- QR code for the join link (assets/vendor/qrcode.js) ---------- */
function drawQr(text) {
  ui.qr.textContent = '';
  const lib = window.qrcode;
  if (!lib) { setTimeout(() => { if (S.code && text.indexOf(S.code) > 0) drawQr(text); }, 300); return; }
  try {
    const q = lib(0, 'M'); q.addData(text); q.make();
    const n = q.getModuleCount(), m = 2; let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + m) + ' ' + (r + m) + 'h1v1h-1z';
    const t = n + m * 2;
    ui.qr.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + t + ' ' + t + '" shape-rendering="crispEdges" role="img" aria-label="QR code that opens this page with the code filled in"><rect width="' + t + '" height="' + t + '" fill="#fff"/><path d="' + d + '" fill="#070916"/></svg>';
  } catch (e) { /* the code and link still work */ }
}

/* ---------- what is on screen follows the state ---------- */
function layout() {
  const n = openLinks().length, host = S.role === 'host', mem = members().length;
  show(ui.conn, n > 0); show(ui.textf, n > 0); show(ui.opts, n > 0);
  show(ui.pair, n === 0 || (host && !!S.room));
  show(ui.cardJoin, n === 0);
  show(ui.manual, n === 0 || host);
  show(ui.hostIdle, !S.room); show(ui.host, !!S.room);
  ui.hostTitle.textContent = n ? 'Invite more devices' : 'Show a code';
  ui.start.textContent = n ? 'Get a new code' : 'Get a code';
  ui.cancel.textContent = n ? 'Close code' : 'Cancel';
  if (n) {
    ui.peer.textContent = mem > 1 ? 'Room with ' + mem + ' devices' : 'Connected to ' + (members()[0] || {}).name;
    const lan = links.filter((x) => x.open && x.route).every((x) => x.route === 'lan') && links.some((x) => x.open && x.route);
    const rel = links.some((x) => x.open && x.route === 'relay');
    ui.route.textContent = (S.hostGone ? 'The host left. ' : '') + (rel ? 'Encrypted, passing through a relay for devices a direct path could not reach' : 'Direct and encrypted' + (lan ? ', on your local network' : ''));
    ui.dropSub.textContent = mem > 1 ? 'Any type, any size. Everyone in the room can download it, and the more people have it the faster it gets.' : 'Any type, any size. They go straight to ' + ((members()[0] || {}).name || 'the other device') + '.';
  } else {
    ui.dropSub.textContent = 'Any type, any size. Added files wait here and send once a device connects.';
  }
  const hostLink = links.find((x) => x.toHost && x.open);
  ui.safety.textContent = hostLink && hostLink.safety ? 'Safety number ' + hostLink.safety : '';
  show(ui.safety, !!ui.safety.textContent);
  ui.disconnect.textContent = host && mem > 1 ? 'Close room' : (host ? 'Disconnect' : 'Leave room');
  show(ui.empty, !S.items.length);
}
function members() {
  const out = [], seen = new Set();
  openLinks().forEach((l) => { if (l.id && !seen.has(l.id)) { seen.add(l.id); out.push({ id: l.id, name: l.name, link: l }); } });
  S.members.forEach((name, id) => { if (!seen.has(id) && id !== ME.id) { seen.add(id); out.push({ id, name }); } });
  return out;
}
function renderMembers() {
  ui.members.textContent = '';
  members().forEach((m) => {
    const li = h('li', { class: 'p2-mem' + (m.link ? '' : ' is-far') }, h('span', { class: 'p2-mem__n', text: m.name }));
    if (m.id === S.hostId) li.appendChild(h('span', { class: 'p2-mem__t', text: 'host' }));
    if (m.link && m.link.safety && S.role === 'host') li.appendChild(h('span', { class: 'p2-mem__s', title: 'Safety number: both of you should see the same six digits', text: m.link.safety }));
    if (S.role === 'host' && m.link && m.link.guest) li.appendChild(h('button', { class: 'p2-mem__x', type: 'button', 'aria-label': 'Remove ' + m.name, title: 'Remove from room', text: '×', onclick: () => kick(m.link) }));
    ui.members.appendChild(li);
  });
  layout();
}
function kick(l) { send(l, { t: 'bye', kicked: 1 }); setTimeout(() => dropLink(l, ''), 50); }

/* ---------- pieces: how a file is cut up, stored and served ---------- */
function pieceSize(size) { const mb = 1048576; return size > MAXPIECES * mb ? Math.ceil(size / MAXPIECES / mb) * mb : mb; }
function packBits(a) { const u = new Uint8Array(Math.ceil(a.length / 8)); for (let i = 0; i < a.length; i++) if (a[i]) u[i >> 3] |= 1 << (i & 7); return b64u(u); }
function unpackBits(s, n) { const u = unb64u(s), a = new Uint8Array(n); for (let i = 0; i < n; i++) a[i] = (u[i >> 3] >> (i & 7)) & 1; return a; }
function canDisk() { return !!(navigator.storage && navigator.storage.getDirectory && window.FileSystemFileHandle && 'createWritable' in FileSystemFileHandle.prototype); }
// source of the pieces a downloader keeps: in memory, or one small file per piece in browser storage so large files fit and
// pieces can be read back for the other devices straight away. Once the whole file is built, pieces are read from it instead.
function makeStore(f, onErr) {
  const disk = f.size >= DISK_FROM && canDisk();
  const parts = [], pend = {};
  let dirP = null, blob = null, dead = false;
  const dir = () => dirP || (dirP = navigator.storage.getDirectory().then((r) => r.getDirectoryHandle('p2p-inbox', { create: true })).then((r) => r.getDirectoryHandle(ME.id, { create: true })));
  const name = (i) => f.id + '_' + i;
  const slice = (i) => blob.slice(i * f.ps, Math.min(f.size, (i + 1) * f.ps)).arrayBuffer();
  return {
    put(i, buf) {
      if (dead) return Promise.resolve();
      if (!disk) { parts[i] = buf; return Promise.resolve(); }
      return pend[i] = dir().then((d) => d.getFileHandle(name(i), { create: true })).then((fh) => fh.createWritable()).then((w) => w.write(buf).then(() => w.close()))
        .catch((e) => { if (!dead) { dead = true; onErr(e); } }).then(() => { delete pend[i]; });
    },
    get(i) {
      if (blob) return slice(i);
      if (!disk) return Promise.resolve(parts[i] || null);
      return (pend[i] || Promise.resolve()).then(() => dir()).then((d) => d.getFileHandle(name(i))).then((fh) => fh.getFile()).then((x) => x.arrayBuffer()).catch(() => null);
    },
    async build() {
      await Promise.all(Object.values(pend));
      if (dead) throw new Error('storage');
      if (!disk) blob = new Blob(parts, { type: f.type });
      else { const d = await dir(); const fs = []; for (let i = 0; i < f.n; i++) fs.push(await (await d.getFileHandle(name(i))).getFile()); blob = new Blob(fs, { type: f.type }); }
      parts.length = 0;
      return blob;
    },
    drop() {
      dead = true; parts.length = 0;
      if (disk) dir().then((d) => { for (let i = 0; i < f.n; i++) d.removeEntry(name(i)).catch(() => {}); }).catch(() => {});
    }
  };
}
const srcStore = (file, ps) => ({ get: (i) => file.slice(i * ps, Math.min(file.size, (i + 1) * ps)).arrayBuffer(), drop() {} });
function safeName(n) { n = String(n || 'file').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim().slice(0, 180); return n || 'file'; }
function fileMsg(f) { return { t: 'file', id: f.id, name: f.name, size: f.size, type: f.type, ps: f.ps, owner: f.owner, oname: f.ownerName, h: b64u(f.h) }; }

/* ---------- sharing a file ---------- */
async function addFiles(list, dt) {
  let skipped = 0;
  const files = [];
  Array.prototype.forEach.call(list, (f, i) => {
    const entry = dt && dt.items && dt.items[i] && dt.items[i].webkitGetAsEntry ? dt.items[i].webkitGetAsEntry() : null;
    if (entry && entry.isDirectory) { skipped++; return; }
    files.push(f);
  });
  if (skipped) say('Folders cannot be sent as they are. Zip the folder first, then send the zip.', 'warn');
  for (const file of files) {
    const ps = pieceSize(file.size), n = Math.ceil(file.size / ps);
    const f = { id: uid(), kind: 'file', dir: 'out', name: safeName(file.name), size: file.size, type: file.type || '', ps, n, owner: ME.id, ownerName: ME.name, h: null, have: new Uint8Array(n).fill(1), nhave: n,
      req: {}, got: 0, rx: 0, up: 0, state: 'hashing', hashed: 0, t0: Date.now(), rate: [], src: file, store: srcStore(file, ps) };
    S.items.push(f); F.set(f.id, f); renderAll();
    hashFile(f).then(() => {
      if (!F.has(f.id)) return;
      f.state = 'sharing';
      if (!openLinks().length) say(files.length === 1 ? 'Added. It is shared as soon as a device joins.' : files.length + ' files added. They are shared as soon as a device joins.');
      flood(fileMsg(f)); openLinks().forEach((x) => send(x, { t: 'have', f: f.id, b: packBits(f.have) })); renderItem(f); layout();
    }, () => { f.state = 'failed'; f.err = 'This browser could not read the file. It may have been moved or deleted.'; renderItem(f); });
  }
}
async function hashFile(f) {
  f.h = new Uint8Array(32 * f.n);
  for (let i = 0; i < f.n; i++) {
    if (!F.has(f.id)) return;
    const d = await crypto.subtle.digest('SHA-256', await f.src.slice(i * f.ps, Math.min(f.size, (i + 1) * f.ps)).arrayBuffer());
    f.h.set(new Uint8Array(d), i * 32); f.hashed = i + 1;
    if (i % 8 === 7) tick(f);
  }
}
function unshare(f) {
  if (f.dir === 'out') flood({ t: 'unshare', id: f.id });
  dropFile(f); renderAll();
}
function dropFile(f) {
  for (const i in f.req) { f.req[i].l.nreq--; }
  f.req = {};
  if (f.store && f.store.drop) f.store.drop();
  if (f.url) URL.revokeObjectURL(f.url);
  F.delete(f.id); S.items = S.items.filter((x) => x !== f);
  if (f.el && f.el.parentNode) f.el.remove();
}

/* ---------- downloading ---------- */
function wantAuto(f) { return ui.auto.checked && (f.size < DISK_FROM || canDisk() || f.size < 1.5 * 1073741824); }
function startDownload(f) {
  if (f.state !== 'available' && f.state !== 'failed') return;
  f.state = 'downloading'; f.err = '';
  f.have = new Uint8Array(f.n); f.nhave = 0; f.req = {}; f.got = 0; f.rx = 0; f.rate = []; f.t0 = f.lastGot = Date.now(); f.t1 = 0;
  f.store = makeStore(f, () => failFile(f, 'There is not enough storage space on this device for this file.'));
  hold(); renderItem(f);
  if (!f.n) return finishFile(f);
  pull();
}
function cancelDownload(f) {
  for (const i in f.req) f.req[i].l.nreq--;
  f.req = {}; if (f.store) f.store.drop(); f.store = null;
  f.state = 'available'; f.have = new Uint8Array(f.n); f.nhave = 0; f.got = 0;
  renderItem(f); if (!busy()) release();
}
function failFile(f, why) {
  if (f.state !== 'downloading' && f.state !== 'saving') return;
  for (const i in f.req) f.req[i].l.nreq--;
  f.req = {}; if (f.store) f.store.drop(); f.store = null;
  f.state = 'failed'; f.err = why; f.have = new Uint8Array(f.n); f.nhave = 0;
  renderItem(f); if (!busy()) release();
}
let pullQ = 0;
function pull() { if (!pullQ) pullQ = setTimeout(() => { pullQ = 0; F.forEach(pullFile); }, 0); }
const depthOf = (f) => Math.max(2, Math.min(8, Math.floor(FLIGHT / f.ps)));
// Ask devices for the pieces we lack. A device that is itself still downloading is asked for pieces it already holds, rarest
// first, so those spread; devices that hold the whole file (the owner, finished downloaders) are asked for pieces nobody
// else has yet, so the owner uploads each piece about once and the guests trade the rest between themselves.
function pullFile(f) {
  if (f.state !== 'downloading') return;
  const ls = links.filter((l) => usable(l) && l.have[f.id]);
  if (!ls.length) return;
  const depth = depthOf(f);
  const peers = ls.filter((l) => !l.full[f.id]);
  const holders = new Uint8Array(f.n);
  peers.forEach((l) => { const b = l.have[f.id]; for (let i = 0; i < f.n; i++) holders[i] += b[i]; });
  // Spread the pieces nobody has yet: each downloading device gets a share of them (by piece number) to fetch from a full
  // source first, so they ask for different pieces and then trade. After a quiet spell any piece is fair game.
  const ids = new Set(members().map((x) => x.id)); ids.add(ME.id); ids.delete(f.owner);
  const sorted = Array.from(ids).sort(), m = Math.max(1, sorted.length), rank = Math.max(0, sorted.indexOf(ME.id));
  const stalled = Date.now() - f.lastGot > 1500;
  const need = [];
  for (let i = 0; i < f.n; i++) if (!f.have[i] && !f.req[i]) need.push(i);
  if (!need.length) { // endgame: pieces still waiting on a slow, partial device are asked for again from a full source
    const now = Date.now(), seeds = ls.filter((l) => l.full[f.id]).sort((a, b) => a.nreq - b.nreq);
    for (const i in f.req) {
      const r = f.req[i];
      if (now - r.t < 2000 || r.l.full[f.id]) continue;
      const to = seeds.find((x) => x.nreq < depth);
      if (!to) break;
      r.l.nreq = Math.max(0, r.l.nreq - 1); f.req[i] = { l: to, t: now }; to.nreq++;
      send(to, { t: 'req', f: f.id, i: +i });
    }
    return;
  }
  for (let i = need.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0, t = need[i]; need[i] = need[j]; need[j] = t; }
  let progress = true;
  while (progress && need.length) {
    progress = false;
    ls.sort((a, b) => a.nreq - b.nreq);
    for (const l of ls) {
      if (l.nreq >= depth || !need.length) continue;
      const b = l.have[f.id]; let at = -1;
      if (!l.full[f.id]) { let c = 1e9; for (let k = 0; k < need.length; k++) { const i = need[k]; if (b[i] && holders[i] < c) { c = holders[i]; at = k; if (c === 1) break; } } }
      else {
        for (let k = 0; k < need.length; k++) { const i = need[k]; if (b[i] && !holders[i] && i % m === rank) { at = k; break; } }
        if (at < 0 && (stalled || m === 1)) for (let k = 0; k < need.length; k++) { const i = need[k]; if (b[i] && !holders[i]) { at = k; break; } }
        if (at < 0 && (stalled || m === 1)) for (let k = 0; k < need.length; k++) if (b[need[k]]) { at = k; break; }
      }
      if (at < 0) continue;
      const i = need.splice(at, 1)[0];
      f.req[i] = { l, t: Date.now() }; l.nreq++;
      send(l, { t: 'req', f: f.id, i });
      progress = true;
    }
  }
}
function onPiece(l, f, i, buf) {
  const rq = f.req[i];
  if (rq && rq.l === l) { delete f.req[i]; l.nreq = Math.max(0, l.nreq - 1); }
  if (f.state !== 'downloading' || f.have[i]) { pull(); return; }
  f.rx += buf.byteLength; rate(f, f.rx);
  crypto.subtle.digest('SHA-256', buf).then((d) => {
    if (f.state !== 'downloading' || f.have[i]) return;
    const want = f.h.subarray(i * 32, i * 32 + 32), got = new Uint8Array(d);
    for (let k = 0; k < 32; k++) if (want[k] !== got[k]) { l.bad++; if (l.bad >= 3) { l.slowUntil = Date.now() + 120000; } pull(); return; }
    f.have[i] = 1; f.nhave++; f.got += buf.byteLength; f.lastGot = Date.now(); S.stat.down += buf.byteLength;
    f.store.put(i, buf).then(() => {
      flood2({ t: 'got', f: f.id, i });
      if (f.nhave === f.n && f.state === 'downloading') finishFile(f); else pull();
    });
    tick(f);
  });
}
// tell the devices we are linked to that we now hold a piece (not flooded: each device only needs its own neighbours' bitmaps)
function flood2(o) { openLinks().forEach((l) => { if (!l.full[o.f]) send(l, o); }); }
function finishFile(f) {
  f.state = 'saving'; renderItem(f);
  f.store.build().then((blob) => {
    if (f.state !== 'saving') return;
    if (blob.size !== f.size) throw new Error('size');
    f.url = URL.createObjectURL(blob); f.state = 'done'; f.t1 = Date.now();
    renderItem(f); show(ui.bulk, true);
    say('Received ' + f.name + '.');
    S.stat.files++;
    track('p2p_received', { mb: Math.round(f.size / 1048576), from: openLinks().length });
    if (!busy()) release();
    pull();
  }).catch(() => failFile(f, 'The file did not arrive complete. Ask for it to be shared again.'));
}
// every second: give up on devices that have gone quiet and ask somebody else
setInterval(() => {
  const now = Date.now();
  F.forEach((f) => {
    if (f.state !== 'downloading') return;
    pull();
    for (const i in f.req) {
      const r = f.req[i];
      if (now - r.t > STALL && now - r.l.lastRx > STALL) { r.l.slowUntil = now + 30000; delete f.req[i]; r.l.nreq = Math.max(0, r.l.nreq - 1); pull(); }
    }
  });
}, 1000);

/* ---------- serving pieces to other devices ---------- */
async function serve(l) {
  if (l.serving) return;
  l.serving = true; hold();
  try {
    while (l.inq.length && l.open) {
      const q = l.inq.shift(), f = F.get(q.f);
      const buf = f && f.store && f.have[q.i] ? await f.store.get(q.i) : null;
      if (!l.open) break;
      if (!buf) { send(l, { t: 'nope', f: q.f, i: q.i }); continue; }
      send(l, { t: 'piece', f: q.f, i: q.i, len: buf.byteLength });
      for (let p = 0; p < buf.byteLength && l.open; p += l.chunk) {
        while (l.open && l.dc.bufferedAmount > HIGH) await new Promise((r) => { l.wake = r; setTimeout(r, 250); });
        if (!l.open) break;
        try { l.dc.send(new Uint8Array(buf, p, Math.min(l.chunk, buf.byteLength - p))); } catch (e) { break; }
      }
      f.up += buf.byteLength; S.stat.up += buf.byteLength; rate2(f, f.up); tick(f);
    }
  } finally { l.serving = false; if (!busy()) release(); }
}

/* ---------- messages ---------- */
function onMessage(l, e) {
  l.lastRx = Date.now();
  const data = e.data;
  if (typeof data !== 'string') {
    const c = l.cur;
    if (!c) return;
    const len = data.byteLength;
    if (c.got + len > c.len) { l.cur = null; return; }
    if (c.buf) c.buf.set(new Uint8Array(data), c.got);
    c.got += len;
    if (c.got === c.len) { l.cur = null; if (c.buf) onPiece(l, c.f, c.i, c.buf.buffer); }
    return;
  }
  let m; try { m = JSON.parse(data); } catch (x) { return; }
  if (m.t === 'hi') return onHi(l, m);
  if (!l.id) return; // nothing but hi is accepted before the other side has introduced itself
  const f = m.f && F.get(m.f);
  switch (m.t) {
    case 'room':
      if (!l.toHost || !Array.isArray(m.members)) return;
      m.members.slice(0, MAXGUESTS + 1).forEach((x) => { const id = clean(x.id, 20); if (id && id !== ME.id) { S.members.set(id, clean(x.name) || 'Another device'); if (!linkById(id)) meshTo(id, clean(x.name)); } });
      layout(); renderMembers(); break;
    case 'join':
      if (!l.toHost) return;
      S.members.set(clean(m.id, 20), clean(m.name) || 'Another device'); say((clean(m.name) || 'A device') + ' joined.'); renderMembers(); break;
    case 'leave':
      if (!l.toHost) return;
      S.members.delete(clean(m.id, 20)); renderMembers(); break;
    case 'sig': onSig(l, m); break;
    case 'file': onFile(l, m); break;
    case 'unshare': {
      const k = 'u:' + m.id; if (S.seen.has(k)) return; S.seen.add(k);
      const x = F.get(m.id);
      if (x && x.dir === 'in' && x.state === 'available') { dropFile(x); renderAll(); }
      flood(m, l); break;
    }
    case 'text': {
      const k = 't:' + m.id; if (S.seen.has(k)) return; S.seen.add(k);
      S.items.push({ id: clean(m.id, 20), kind: 'text', dir: 'in', text: String(m.s || '').slice(0, 20000), from: clean(m.from) || l.name, state: 'done' });
      renderAll(); say('New message from ' + (clean(m.from) || l.name) + '.'); flood(m, l); break;
    }
    case 'have': {
      if (!f) return;
      const b = unpackBits(String(m.b || ''), f.n); l.have[f.id] = b; l.full[f.id] = b.every((x) => x === 1) && f.n > 0; pull(); renderItem(f); break;
    }
    case 'got': {
      if (!f) return;
      let b = l.have[f.id]; if (!b) b = l.have[f.id] = new Uint8Array(f.n);
      const i = m.i | 0; if (i < 0 || i >= f.n) return;
      b[i] = 1; l.full[f.id] = b.every((x) => x === 1); pull(); break;
    }
    case 'req': {
      if (!f || (m.i | 0) < 0 || (m.i | 0) >= f.n) { send(l, { t: 'nope', f: m.f, i: m.i }); return; }
      if (l.inq.length > 64) return;
      l.inq.push({ f: m.f, i: m.i | 0 }); serve(l); break;
    }
    case 'nope': {
      if (!f) return;
      const i = m.i | 0, r = f.req[i];
      if (r && r.l === l) { delete f.req[i]; l.nreq = Math.max(0, l.nreq - 1); }
      if (l.have[f.id]) { l.have[f.id][i] = 0; l.full[f.id] = false; }
      pull(); break;
    }
    case 'piece': {
      const i = m.i | 0, len = m.len | 0;
      const r = f && f.req[i];
      if (!f || !r || r.l !== l || len <= 0 || len > f.ps) { l.cur = { len: Math.max(0, len), got: 0, f: null }; if (!len) l.cur = null; return; } // not ours: read and drop the bytes
      l.cur = { f, i, len, got: 0, buf: new Uint8Array(len) }; break;
    }
    case 'bye': dropLink(l, m.kicked ? 'The host removed you from the room.' : (l.name || 'The other device') + ' left.'); break;
  }
}
function onFile(l, m) {
  const id = clean(m.id, 20);
  if (!id || F.has(id)) { return; }
  const size = +m.size, ps = +m.ps;
  if (!(size >= 0) || size > 4e12 || !(ps >= 65536 && ps <= 268435456)) return;
  const n = Math.ceil(size / ps);
  if (n > 4096 || m.h == null) return;
  let hh; try { hh = unb64u(String(m.h)); } catch (e) { return; }
  if (hh.length !== n * 32) return;
  const f = { id, kind: 'file', dir: 'in', name: safeName(m.name), size, type: clean(m.type, 100), ps, n, owner: clean(m.owner, 20), ownerName: clean(m.oname) || l.name, h: hh,
    have: new Uint8Array(n), nhave: 0, req: {}, got: 0, rx: 0, up: 0, state: 'available', t0: 0, rate: [] };
  S.items.push(f); F.set(id, f);
  flood(m, l);
  renderAll();
  if (wantAuto(f)) startDownload(f);
}

/* ---------- guest to guest links, set up through the host ---------- */
async function meshTo(id, name) {
  const host = links.find((x) => x.toHost && x.open);
  if (!host || linkById(id)) return;
  const l = newLink({ toMesh: true, id, name: name || 'Another device' });
  try {
    const off = await makeOffer(l);
    send(host, { t: 'sig', to: id, from: ME.id, k: 'offer', d: { sdp: off.sdp, name: ME.name } });
    waitForOpen(l, MESH_WAIT);
  } catch (e) { removeLink(l); }
}
async function onSig(l, m) {
  const to = clean(m.to, 20), from = clean(m.from, 20);
  if (to && to !== ME.id) { // we are the host: pass it on
    if (S.role !== 'host' || !l.guest) return;
    const t = linkById(to); if (t) send(t, { t: 'sig', to, from: l.id, k: m.k, d: m.d });
    return;
  }
  if (!l.toHost || !m.d || typeof m.d.sdp !== 'string') return;
  const host = l;
  if (m.k === 'offer') {
    if (linkById(from) || from === ME.id) return;
    const x = newLink({ toMesh: true, id: from, name: clean(m.d.name) || 'Another device' });
    try {
      const ans = await makeAnswer(x, { sdp: m.d.sdp });
      send(host, { t: 'sig', to: from, from: ME.id, k: 'answer', d: { sdp: ans.sdp, name: ME.name } });
      waitForOpen(x, MESH_WAIT);
    } catch (e) { removeLink(x); }
  } else if (m.k === 'answer') {
    const x = linkById(from);
    if (x && x.toMesh && x.pc && !x.open) x.pc.setRemoteDescription({ type: 'answer', sdp: m.d.sdp }).catch(() => removeLink(x));
  }
}

/* ---------- keep the screen awake while files move (phones stop background tabs) ---------- */
let lock = null, holding = false;
function hold() {
  holding = true;
  if (lock || !navigator.wakeLock || document.visibilityState !== 'visible') return;
  navigator.wakeLock.request('screen').then((l) => { lock = l; l.addEventListener('release', () => { lock = null; }); }).catch(() => {});
}
function release() { holding = false; if (lock) { lock.release().catch(() => {}); lock = null; } }
document.addEventListener('visibilitychange', () => { if (holding && document.visibilityState === 'visible') hold(); });
window.addEventListener('beforeunload', (e) => { if (openLinks().length && busy()) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- list ---------- */
function rate(it, n) { const now = Date.now(); it.rate.push([now, n]); while (it.rate.length > 2 && now - it.rate[0][0] > 3000) it.rate.shift(); S.stat.peak = Math.max(S.stat.peak, bps(it.rate)); }
function rate2(it, n) { const now = Date.now(); (it.rate2 = it.rate2 || []).push([now, n]); while (it.rate2.length > 2 && now - it.rate2[0][0] > 3000) it.rate2.shift(); }
function bps(r) { if (!r || r.length < 2) return 0; const dt = (r[r.length - 1][0] - r[0][0]) / 1000, db = r[r.length - 1][1] - r[0][1]; return dt > 0 && db > 0 ? db / dt : 0; }
const pending = {}; let frame = 0;
function tick(it) {
  pending[it.id] = it;
  if (!frame) frame = setTimeout(() => { frame = 0; for (const k in pending) if (F.has(k) || pending[k].kind === 'text') renderItem(pending[k]); for (const k in pending) delete pending[k]; }, 200);
}
function renderAll() {
  ui.list.textContent = '';
  S.items.forEach((it) => { it.el = null; renderItem(it); });
  show(ui.bulk, S.items.length > 0);
  show(ui.saveAll, S.items.filter((x) => x.kind === 'file' && x.url).length > 1);
  show(ui.empty, !S.items.length);
}
function sources(f) { const now = Date.now(); return links.filter((l) => l.open && now - l.lastRx < 3000 && Object.keys(f.req).some((i) => f.req[i].l === l)).length; }
function stateText(it) {
  const pct = (n) => it.size ? Math.floor(n / it.size * 100) + '%' : '100%';
  const nOpen = openLinks().length;
  switch (it.state) {
    case 'hashing': return 'Preparing · ' + Math.floor(it.hashed / it.n * 100) + '%';
    case 'sharing': {
      const up = bps(it.rate2), tail = it.up ? ' · ' + fmtSize(it.up) + ' sent' + (up ? ' · ' + fmtSize(up) + '/s' : '') : '';
      return (nOpen ? 'Shared with the room' : 'Ready, shared once a device joins') + tail;
    }
    case 'available': return 'From ' + it.ownerName;
    case 'downloading': {
      const r = bps(it.rate), left = r ? ' · ' + fmtTime((it.size - it.rx) / r) + ' left' : '', src = sources(it);
      if (!r && !src && !links.some((l) => usable(l) && l.have[it.id])) return 'Waiting for a device that has it';
      return pct(it.got) + (r ? ' · ' + fmtSize(r) + '/s' : '') + (src > 1 ? ' · from ' + src + ' devices' : '') + left;
    }
    case 'saving': return 'Finishing…';
    case 'done': return 'Received' + (it.t1 ? ' in ' + fmtTime((it.t1 - it.t0) / 1000) : '') + (it.up ? ' · ' + fmtSize(it.up) + ' passed on' : '');
    default: return it.err || 'Failed';
  }
}
function renderItem(it) {
  const mine = it.dir === 'out';
  const el = h('li', { class: 'p2-item p2-item--' + (mine ? 'out' : 'in') + ' is-' + (it.state === 'sharing' ? 'sent' : it.state), 'data-id': it.id });
  const head = h('div', { class: 'p2-item__head' }, h('span', { class: 'p2-item__dir', 'aria-hidden': 'true', text: mine ? '↑' : '↓' }));
  const info = h('div', { class: 'p2-item__info' });
  if (it.kind === 'text') {
    const isUrl = /^https?:\/\/\S+$/i.test(it.text.trim());
    info.appendChild(isUrl ? h('a', { class: 'p2-item__text', href: it.text.trim(), target: '_blank', rel: 'noopener noreferrer nofollow', text: it.text.trim() }) : h('p', { class: 'p2-item__text', text: it.text }));
    info.appendChild(h('span', { class: 'tl-small tl-muted', text: mine ? 'Message · sent to the room' : 'Message · from ' + it.from }));
  } else {
    info.appendChild(h('strong', { class: 'p2-item__name', text: it.name }));
    info.appendChild(h('span', { class: 'tl-small tl-muted', text: fmtSize(it.size) + ' · ' + stateText(it) }));
  }
  head.appendChild(info);
  const act = h('div', { class: 'p2-item__act' });
  if (it.kind === 'text') act.appendChild(h('button', { class: 'tl-copy', type: 'button', text: 'Copy', onclick: (ev) => copy(it.text, ev.currentTarget, 'Copy') }));
  else {
    if (it.state === 'available' || (it.state === 'failed' && !mine)) act.appendChild(h('button', { class: 'tl-btn tl-btn--p p2-save', type: 'button', text: it.state === 'failed' ? 'Retry' : 'Download', onclick: () => startDownload(it) }));
    if (it.state === 'done') act.appendChild(h('a', { class: 'tl-btn tl-btn--p p2-save', href: it.url, download: it.name, text: 'Save' }));
    if (it.state === 'downloading') act.appendChild(h('button', { class: 'tl-copy', type: 'button', text: 'Stop', onclick: () => cancelDownload(it) }));
    if (mine) act.appendChild(h('button', { class: 'tl-copy', type: 'button', text: 'Stop sharing', onclick: () => unshare(it) }));
  }
  head.appendChild(act);
  el.appendChild(head);
  if (it.kind === 'file' && (it.state === 'downloading' || it.state === 'saving' || it.state === 'hashing')) {
    const n = it.state === 'hashing' ? it.hashed / (it.n || 1) * it.size : it.got;
    el.appendChild(h('div', { class: 'tl-bar p2-bar', role: 'progressbar', 'aria-label': it.name, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(it.size ? Math.floor(n / it.size * 100) : 100) }, h('i', { style: 'width:' + (it.size ? Math.min(100, n / it.size * 100) : 100).toFixed(1) + '%' })));
    if (it.state === 'downloading' && it.n > 1 && it.n <= 400) el.appendChild(pieceMap(it));
  }
  if (it.kind === 'file' && it.url && /^image\/(png|jpe?g|gif|webp|avif)$/.test(it.type) && it.size < 30 * 1048576) el.appendChild(h('img', { class: 'p2-thumb', src: it.url, alt: '', loading: 'lazy' }));
  if (it.el && it.el.parentNode) it.el.parentNode.replaceChild(el, it.el); else ui.list.prepend(el);
  it.el = el;
  show(ui.bulk, S.items.length > 0);
  show(ui.saveAll, S.items.filter((x) => x.kind === 'file' && x.url).length > 1);
  show(ui.empty, !S.items.length);
}
// one cell per piece: a quick picture of what has arrived
function pieceMap(f) {
  const w = h('div', { class: 'p2-map', 'aria-hidden': 'true' });
  for (let i = 0; i < f.n; i++) w.appendChild(h('i', { class: f.have[i] ? 'on' : f.req[i] ? 'req' : '' }));
  return w;
}

/* ---------- wiring ---------- */
ui.disconnect = $('#p2p-disconnect');
if (!supported) {
  show($('#p2p-unsupported'), true);
  ['#p2p-start', '#p2p-join button', '#p2p-m-create', '#p2p-m-join'].forEach((s) => { const b = $(s); if (b) b.disabled = true; });
}
// Pieces live in one folder per open tab. Clear the folders earlier visits left behind, but not those of other tabs that are
// still open: each tab holds a lock named after its folder while it lives.
if (canDisk()) {
  if (navigator.locks) {
    navigator.locks.request('p2p-' + ME.id, () => new Promise(() => {}));
    Promise.all([navigator.storage.getDirectory().then((r) => r.getDirectoryHandle('p2p-inbox')), navigator.locks.query()]).then(async (a) => {
      const live = new Set((a[1].held || []).map((x) => x.name));
      for await (const [name] of a[0].entries()) if (!live.has('p2p-' + name)) a[0].removeEntry(name, { recursive: true }).catch(() => {});
    }).catch(() => {});
  } else navigator.storage.getDirectory().then((r) => r.removeEntry('p2p-inbox', { recursive: true })).catch(() => {});
}

ui.start.addEventListener('click', startHost);
ui.cancel.addEventListener('click', () => { const had = openLinks().length; closeRoom(true); say(had ? 'The code is closed. Devices in the room stay connected.' : 'Cancelled. The code no longer works.'); });
ui.extend.addEventListener('click', () => {
  if (!S.room) return;
  api('POST', '', { room: S.room, renew: 1 }).then((r) => { if (r.ok) { S.expires = Date.now() + TTL; say('The code stays open for 15 more minutes.'); } else say((r.j && r.j.error) || 'Could not keep the code open.', 'bad'); }).catch(() => {});
});
$('#p2p-copy-link').addEventListener('click', (e) => copy(link('c=' + S.code), e.currentTarget, 'Copy link'));
const shareBtn = $('#p2p-share');
if (navigator.share) { show(shareBtn, true); shareBtn.addEventListener('click', () => { navigator.share({ title: 'Join my file share', text: 'Open this to join my room and share files directly between browsers. Code ' + niceCode(S.code), url: link('c=' + S.code) }).catch(() => {}); }); }
ui.join.addEventListener('submit', (e) => { e.preventDefault(); joinCode(ui.joinIn.value); });
ui.joinIn.addEventListener('input', () => {
  const c = cleanCode(ui.joinIn.value).slice(0, CODE_LEN), v = c.length > 4 ? c.slice(0, 4) + '-' + c.slice(4) : c;
  if (ui.joinIn.value !== v) ui.joinIn.value = v;
});
$('#p2p-m-create').addEventListener('click', manualCreate);
$('#p2p-m-copy').addEventListener('click', (e) => copy(ui.mInvite.value, e.currentTarget, 'Copy invite'));
$('#p2p-m-copylink').addEventListener('click', (e) => copy(ui.mInvite.dataset.link || '', e.currentTarget, 'Copy as a link'));
$('#p2p-m-connect').addEventListener('click', manualConnect);
$('#p2p-m-join').addEventListener('click', () => manualJoin(ui.mInviteIn.value));
$('#p2p-m-copyreply').addEventListener('click', (e) => copy(ui.mReply.value, e.currentTarget, 'Copy reply'));
ui.disconnect.addEventListener('click', () => {
  if (busy() && !window.confirm('Files are still moving. Leave anyway?')) return;
  closeRoom(true);
  links.slice().forEach((l) => { send(l, { t: 'bye' }); });
  setTimeout(() => { links.slice().forEach((l) => removeLink(l)); allGone('You left the room.'); S.role = ''; layout(); }, 80);
});
ui.textf.addEventListener('submit', (e) => {
  e.preventDefault();
  const t = ui.textIn.value; if (!t.trim()) return;
  const m = { id: uid(), kind: 'text', dir: 'out', text: t.slice(0, 20000), state: 'sent', from: ME.name };
  S.items.push(m); S.seen.add('t:' + m.id);
  flood({ t: 'text', id: m.id, s: m.text, from: ME.name });
  ui.textIn.value = ''; renderAll();
});
ui.auto.addEventListener('change', () => { if (ui.auto.checked) S.items.forEach((f) => { if (f.kind === 'file' && f.state === 'available' && wantAuto(f)) startDownload(f); }); });
ui.saveAll.addEventListener('click', () => {
  const got = S.items.filter((x) => x.kind === 'file' && x.url);
  got.forEach((x, i) => { setTimeout(() => { const a = h('a', { href: x.url, download: x.name }); document.body.appendChild(a); a.click(); a.remove(); }, i * 400); });
});
$('#p2p-clear').addEventListener('click', () => {
  S.items.slice().forEach((x) => {
    if (x.kind === 'text') { S.items = S.items.filter((y) => y !== x); return; }
    if (x.state === 'done' || x.state === 'failed') dropFile(x);
  });
  renderAll();
});
const drop = ui.drop, pick = ui.pick;
drop.addEventListener('click', () => pick.click());
drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick.click(); } });
pick.addEventListener('change', () => { addFiles(pick.files); pick.value = ''; });
['dragenter', 'dragover'].forEach((n) => { drop.addEventListener(n, (e) => { e.preventDefault(); drop.classList.add('is-over'); }); });
['dragleave', 'drop'].forEach((n) => { drop.addEventListener(n, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }); });
drop.addEventListener('drop', (e) => { addFiles(e.dataTransfer.files, e.dataTransfer); });

// a join link: #c=CODE (join by code) or #i=INVITE (by hand). Read it, then take it out of the address bar and history.
function fromLink() {
  const m = location.hash.match(/^#(c|i)=([A-Za-z0-9_-]+)/);
  if (!m) return;
  history.replaceState(null, '', location.pathname + location.search);
  if (!supported) return;
  if (m[1] === 'c') { ui.joinIn.value = niceCode(cleanCode(m[2])); joinCode(m[2]); }
  else { ui.manual.open = true; ui.mInviteIn.value = m[2]; manualJoin(m[2]); }
}
// share card: what this room has done so far, drawn from live numbers. It never shows the code or file names of others.
function roomCard() {
  const mem = members(), st = S.stat, secs = st.t0 ? (Date.now() - st.t0) / 1000 : 0, moved = st.up + st.down;
  const sent = S.items.filter((x) => x.kind === 'file' && x.dir === 'out' && x.state === 'sharing').length;
  const got = S.items.filter((x) => x.kind === 'file' && x.state === 'done').length;
  const text = 'My P2P file room: ' + (mem.length + 1) + ' devices, ' + fmtSize(moved) + ' moved straight between browsers, nothing uploaded to a server.';
  return {
    kicker: 'P2P file room', title: 'Share this room', file: 'p2p-room.png', text, url: location.origin + location.pathname, alt: text,
    draw(c) {
      const x = c.ctx, names = ['You'].concat(mem.map((m) => m.name.replace(/ \(.*\)$/, '')));
      const cx = 335, cy = 345, R = 150, n = names.length, pts = names.map((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; });
      x.lineWidth = 1.5;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { x.strokeStyle = i === 0 ? 'rgba(245,184,103,.55)' : 'rgba(127,243,225,.22)'; x.beginPath(); x.moveTo(pts[i][0], pts[i][1]); x.lineTo(pts[j][0], pts[j][1]); x.stroke(); }
      pts.forEach((p, i) => {
        x.fillStyle = i === 0 ? '#f5b867' : '#7ff3e1'; x.beginPath(); x.arc(p[0], p[1], i === 0 ? 17 : 13, 0, 7); x.fill();
        x.fillStyle = '#070916'; x.beginPath(); x.arc(p[0], p[1], 6, 0, 7); x.fill();
        const out = Math.atan2(p[1] - cy, p[0] - cx), lx = p[0] + Math.cos(out) * 30, ly = p[1] + Math.sin(out) * 30 + 6;
        x.fillStyle = i === 0 ? '#f5b867' : 'rgba(244,239,230,.8)'; x.font = '500 18px ' + c.F; x.textAlign = Math.cos(out) > 0.3 ? 'left' : Math.cos(out) < -0.3 ? 'right' : 'center'; x.fillText(c.fit(names[i], 150), lx, ly);
      });
      x.textAlign = 'left';
      c.stat(660, 190, String(n), n === 1 ? 'device in the room' : 'devices in the room', '#f4efe6');
      c.stat(660, 330, fmtSize(moved), 'moved straight between browsers', '#f5b867');
      c.stat(660, 470, st.peak ? fmtSize(st.peak) + '/s' : (secs ? Math.round(secs) + ' s' : '0'), st.peak ? 'fastest transfer so far' : 'in this room so far', '#7ff3e1');
      c.pill(930, 130, got + ' received', { color: '#7ff3e1', line: 'rgba(127,243,225,.35)', bg: 'rgba(127,243,225,.07)' });
      c.pill(930, 182, sent + ' shared', { color: '#f5b867', line: 'rgba(245,184,103,.4)', bg: 'rgba(245,184,103,.07)' });
      x.fillStyle = 'rgba(244,239,230,.7)'; x.font = '500 22px ' + c.F; x.fillText("0 bytes uploaded to any server", 660, 555);
    }
  };
}
if (window.ApShare) ApShare.mount(ui.opts, roomCard, 'Share room card');
layout();
fromLink();
window.addEventListener('hashchange', fromLink);
window.__p2p = { S, F, links, ME, cleanCode, derive, pack, unpack, addFiles, MAXGUESTS };
})();
