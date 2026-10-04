// Two-factor sign-in: standard TOTP (RFC 6238), works with Google Authenticator, Authy, 1Password and the like. No dependencies.
const crypto = require('crypto');
const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const b32 = (buf) => { let bits = '', out = ''; for (const b of buf) bits += b.toString(2).padStart(8, '0'); for (let i = 0; i < bits.length; i += 5) out += A[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)]; return out; };
const unb32 = (s) => { let bits = ''; for (const c of s.replace(/=+$/, '').toUpperCase()) { const v = A.indexOf(c); if (v >= 0) bits += v.toString(2).padStart(5, '0'); } const out = []; for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2)); return Buffer.from(out); };
const secret = () => b32(crypto.randomBytes(20));
function code(sec, step) {
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(step));
  const h = crypto.createHmac('sha1', unb32(sec)).update(msg).digest(), o = h[19] & 15;
  return String(((h[o] & 0x7f) << 24 | h[o + 1] << 16 | h[o + 2] << 8 | h[o + 3]) % 1e6).padStart(6, '0');
}
// → the matching time step, or -1. A one step window either side forgives a slow clock.
function check(sec, input) {
  const t = String(input || '').replace(/\s/g, ''); if (!/^\d{6}$/.test(t)) return -1;
  const now = Math.floor(Date.now() / 30000);
  for (const d of [0, -1, 1]) { const a = Buffer.from(code(sec, now + d)), b = Buffer.from(t); if (crypto.timingSafeEqual(a, b)) return now + d; }
  return -1;
}
const uri = (sec) => `otpauth://totp/${encodeURIComponent('aashishpandey.com:admin')}?secret=${sec}&issuer=${encodeURIComponent('aashishpandey.com')}&digits=6&period=30`;
const recoveryCodes = () => Array.from({ length: 8 }, () => crypto.randomBytes(5).toString('hex').replace(/(.{5})(.{5})/, '$1-$2'));
const hash = (c) => crypto.createHash('sha256').update(String(c).toLowerCase().replace(/[^a-f0-9]/g, '')).digest('hex');
module.exports = { secret, check, uri, recoveryCodes, hash, code };
