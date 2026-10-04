// Web Push without dependencies: VAPID signing (RFC 8292) and aes128gcm payload encryption (RFC 8291).
// Works with Chrome, Edge, Firefox, Android, and Safari on iPhone once the admin is added to the Home Screen (iOS 16.4+).
const crypto = require('crypto');
const cfg = require('./cfg');
const { redis } = require('../_lib');
const { ADMIN_PATH } = require('./path');

const b64u = (b) => Buffer.from(b).toString('base64url');
const unb64u = (s) => Buffer.from(String(s), 'base64url');
const hkdf = (salt, ikm, info, len) => Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, len));

// the server's own key pair is made once and kept in Redis
async function vapid() {
  let v = await cfg.get('vapid', {});
  if (!v.pub) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const jwk = publicKey.export({ format: 'jwk' });
    v = { pub: b64u(Buffer.concat([Buffer.from([4]), unb64u(jwk.x), unb64u(jwk.y)])), priv: privateKey.export({ type: 'pkcs8', format: 'pem' }) };
    await cfg.set('vapid', v);
  }
  return v;
}
const publicKey = async () => (await vapid()).pub;

function jwt(aud, v) {
  const head = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' })), claims = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'mailto:hello@aashishpandey.com' }));
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + claims), { key: crypto.createPrivateKey(v.priv), dsaEncoding: 'ieee-p1363' });
  return head + '.' + claims + '.' + b64u(sig);
}

// RFC 8291: encrypt one message for one browser
function encrypt(sub, payload) {
  const ua = unb64u(sub.keys.p256dh), auth = unb64u(sub.keys.auth);
  const ecdh = crypto.createECDH('prime256v1'); ecdh.generateKeys();
  const asPub = ecdh.getPublicKey(), secret = ecdh.computeSecret(ua), salt = crypto.randomBytes(16);
  const ikm = hkdf(auth, secret, Buffer.concat([Buffer.from('WebPush: info\0'), ua, asPub]), 32);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const ct = Buffer.concat([c.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPub.length]), asPub, ct]);
}

const subs = async () => { const raw = await redis('GET', 'push:subs'); return raw ? JSON.parse(raw) : []; };
const saveSubs = (l) => redis('SET', 'push:subs', JSON.stringify(l.slice(-60)));
async function subscribe(uid, sub, ua) {
  if (!sub || typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint) || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) throw new Error('That does not look like a push subscription.');
  const l = (await subs()).filter((s) => s.endpoint !== sub.endpoint);
  l.push({ uid, endpoint: sub.endpoint, keys: { p256dh: String(sub.keys.p256dh), auth: String(sub.keys.auth) }, ua: String(ua || '').slice(0, 100), created: Date.now() });
  await saveSubs(l);
}
async function unsubscribe(endpoint) { await saveSubs((await subs()).filter((s) => s.endpoint !== endpoint)); }
const count = async () => (await subs()).length;

// → { sent, failed }. A browser that says the subscription is gone (404 or 410) is dropped.
async function sendAll(msg, only) {
  const list = (await subs()).filter((s) => !only || only(s));
  if (!list.length) return { sent: 0, failed: 0 };
  const v = await vapid(), body = JSON.stringify({ title: msg.title || 'aashishpandey.com', body: msg.body || '', url: msg.url || ADMIN_PATH, tag: msg.tag || 'alert' }), dead = new Set();
  let sent = 0, failed = 0;
  await Promise.all(list.map(async (s) => {
    try {
      const r = await fetch(s.endpoint, { method: 'POST', headers: { Authorization: `vapid t=${jwt(new URL(s.endpoint).origin, v)}, k=${v.pub}`, 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '86400', Urgency: 'normal' }, body: encrypt(s, body) });
      if (r.ok) sent++; else { failed++; if (r.status === 404 || r.status === 410) dead.add(s.endpoint); }
    } catch (e) { failed++; }
  }));
  if (dead.size) await saveSubs((await subs()).filter((s) => !dead.has(s.endpoint)));
  return { sent, failed };
}
module.exports = { publicKey, subscribe, unsubscribe, sendAll, count, encrypt, jwt, vapid, b64u, unb64u, hkdf };
