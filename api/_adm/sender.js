// Newsletter sender: who the newsletter comes from (name, address, reply-to) and the sending domains behind it.
// Uses the Resend key the site already has (no new key): Resend sends from any domain verified on the same account.
// A full-access key can add and verify domains from here; a "sending only" key cannot, and the admin says so.
// The newsletter uses the saved address only once its domain shows as verified; until then it keeps the site's normal sender.
const cfg = require('./cfg');
const { env, resend } = require('../_mail');

const DEF = { name: '', from: '', replyTo: '', domain: '', verified: false, checked: 0, scope: 'newsletter' };
const okEmail = (e) => /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(e);
const domOf = (e) => String(e || '').split('@')[1] || '';
const okDomain = (d) => /^(?=.{3,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(d);
const cleanName = (s) => String(s || '').replace(/[<>"\r\n@]/g, '').trim().slice(0, 60);

async function get() { return cfg.get('sender', DEF); }
// the From line the newsletter uses right now
async function newsletterFrom() {
  const c = await get();
  if (c.from && c.verified) return { from: (c.name ? `${c.name} <${c.from}>` : c.from), replyTo: c.replyTo ? [c.replyTo] : env().admins, custom: true };
  return { from: env().from, replyTo: env().admins, custom: false };
}
function friendly(e) {
  if (e && (e.status === 401 || e.status === 403)) return 'Your Resend key is the "sending only" kind, so this page cannot list or add domains. Add the domain in the Resend dashboard under Domains, then tick "It shows Verified in Resend" below.';
  return (e && e.message) || 'Resend did not answer.';
}
async function domains() {
  try { const j = await resend('/domains', 'GET'); return { ok: true, items: ((j && j.data) || []).map((d) => ({ id: d.id, name: d.name, status: d.status, region: d.region || '', created: d.created_at || '' })) }; }
  catch (e) { return { ok: false, error: friendly(e), items: [] }; }
}
// the DNS records Resend wants for one domain, plus a DMARC record (Resend does not create one; Gmail and Yahoo require it for bulk mail)
async function domain(id) {
  const d = await resend('/domains/' + encodeURIComponent(id), 'GET');
  const recs = (d.records || []).map((r) => ({ type: r.type, name: r.name, value: r.value, priority: r.priority || '', status: r.status || '', purpose: r.record || '' }));
  recs.push({ type: 'TXT', name: '_dmarc', value: `v=DMARC1; p=none; rua=mailto:${env().admin}`, priority: '', status: 'add yourself', purpose: 'DMARC (suggested)' });
  return { id: d.id, name: d.name, status: d.status, records: recs };
}
async function add(name) {
  name = String(name || '').trim().toLowerCase();
  if (!okDomain(name)) throw new Error('Type a domain like news.example.com.');
  try { const d = await resend('/domains', 'POST', { name }); return domain(d.id); } catch (e) { throw new Error(friendly(e)); }
}
async function verify(id) {
  try { await resend('/domains/' + encodeURIComponent(id) + '/verify', 'POST'); } catch (e) { throw new Error(friendly(e)); }
  const d = await domain(id), c = await get();
  if (c.from && domOf(c.from).toLowerCase() === d.name.toLowerCase()) await cfg.set('sender', { ...c, verified: d.status === 'verified', checked: Date.now() });
  return d;
}
// save; the address is checked against the account's domains so "verified" is never assumed
async function save(b) {
  const c = await get(), from = String(b.from || '').trim().toLowerCase(), replyTo = String(b.replyTo || '').trim().toLowerCase();
  if (from && !okEmail(from)) throw new Error('The from address does not look right.');
  if (replyTo && !okEmail(replyTo)) throw new Error('The reply-to address does not look right.');
  let verified = false, note = '';
  if (from) {
    const list = await domains(), dn = domOf(from), hit = list.items.find((d) => d.name.toLowerCase() === dn || dn.endsWith('.' + d.name.toLowerCase()));
    if (hit) { verified = hit.status === 'verified'; note = verified ? '' : `The domain ${hit.name} is ${hit.status} in Resend. Newsletters keep using the current sender until it verifies.`; }
    else if (list.ok) note = `${dn} is not in your Resend account yet. Add it below, put the DNS records in place, then press Verify.`;
    else { verified = b.trust === true; note = verified ? '' : list.error; }   // a sending-only key cannot check, so the owner confirms it
  }
  const next = { ...c, name: cleanName(b.name), from, replyTo, domain: domOf(from), verified, checked: Date.now() };
  await cfg.set('sender', next);
  return { sender: next, note };
}
module.exports = { get, save, domains, domain, add, verify, newsletterFrom, DEF };
