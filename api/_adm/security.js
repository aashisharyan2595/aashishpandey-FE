// Sign-in history, 2FA state, "sign out everywhere", and the nightly backup.
const { redis } = require('../_lib');
const totp = require('./totp');
const store = require('../_store');
const X = require('./export');
const { env, sendMail, clientIp } = require('../_mail');

const epoch = async () => String((await redis('GET', 'admin:epoch')) || '0');
const bumpEpoch = () => redis('INCR', 'admin:epoch');

async function logLogin(req, ok, why, who, info) {
  info = info || {};
  const e = { t: Date.now(), who: who || 'owner', ip: clientIp(req), ua: String((req.headers && req.headers['user-agent']) || '').slice(0, 120), ok, why: why || '', geo: info.geo, device: info.device, client: info.client, loc: info.loc, distanceKm: info.distanceKm, mismatch: info.mismatch, tzMismatch: info.tzMismatch, sid: info.sid };
  try { await redis('LPUSH', 'admin:log', JSON.stringify(e)); await redis('LTRIM', 'admin:log', 0, 199); } catch (err) { console.error('login log failed', err.message); }
}
async function history(n = 50) {
  const rows = await redis('LRANGE', 'admin:log', 0, n - 1);
  return (rows || []).map((r) => { try { return JSON.parse(r); } catch (e) { return null; } }).filter(Boolean);
}

// 2FA is per person: the owner keeps the original key, everyone else gets their own
const tkey = (uid) => (!uid || uid === 'owner' ? 'admin:totp' : 'admin:totp:' + uid);
async function totpState(uid) { const raw = await redis('GET', tkey(uid)); return raw ? JSON.parse(raw) : { enabled: false }; }
const saveTotp = (s, uid) => redis('SET', tkey(uid), JSON.stringify(s));
// the second step at sign-in: an authenticator code (each one only once), or one of the saved recovery codes
async function verifySecondStep(input, uid) {
  const st = await totpState(uid); if (!st.enabled) return true;
  const step = totp.check(st.secret, input);
  if (step >= 0 && step > (st.last || 0)) { st.last = step; await saveTotp(st, uid); return true; }
  const h = totp.hash(input);
  if (input && (st.recovery || []).includes(h)) { st.recovery = st.recovery.filter((x) => x !== h); await saveTotp(st, uid); return true; }
  return false;
}

// emails the full set of submissions as a spreadsheet and JSON, so there is a copy outside the database
async function backup() {
  const rows = await store.all(5000), day = new Date().toISOString().slice(0, 10);
  try {
    await sendMail({
      to: env().admins, subject: `Backup ${day}: ${rows.length} records`,
      text: `Nightly backup of the submissions database. ${rows.length} records attached as a spreadsheet and as JSON. Keep or delete this email as you like.`,
      html: `<p style="font-family:Arial,sans-serif;font-size:15px;">Nightly backup of the submissions database. ${rows.length} records attached as a spreadsheet and as JSON.</p>`,
      kind: 'backup', attachments: [{ filename: `submissions-${day}.xlsx`, content: X.xlsx(rows).toString('base64') }, { filename: `submissions-${day}.json`, content: Buffer.from(JSON.stringify(rows, null, 2)).toString('base64') }],
    });
    await redis('SET', 'admin:backup', JSON.stringify({ at: Date.now(), count: rows.length, ok: true }));
    return { ok: true, count: rows.length };
  } catch (e) {
    await redis('SET', 'admin:backup', JSON.stringify({ at: Date.now(), count: rows.length, ok: false, error: String(e.message).slice(0, 200) }));
    return { ok: false, error: e.message };
  }
}
async function lastBackup() { const raw = await redis('GET', 'admin:backup'); return raw ? JSON.parse(raw) : null; }


module.exports = { epoch, bumpEpoch, logLogin, history, totpState, saveTotp, verifySecondStep, backup, lastBackup };
