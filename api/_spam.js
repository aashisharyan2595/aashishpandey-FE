// Spam scoring for the brief form. No third parties. Returns { score, flags }.
// A score of SPAM_AT or more is saved as "spam" in the admin (not emailed, visitor sees the normal success message).
// Anything lower goes through normally, with its flags kept on the record so you can see why it was close.
const SPAM_AT = 4;

const DISPOSABLE = new Set(['mailinator.com', 'guerrillamail.com', 'guerrillamail.net', '10minutemail.com', '10minutemail.net', 'tempmail.com', 'temp-mail.org', 'yopmail.com', 'trashmail.com', 'sharklasers.com', 'getnada.com', 'dispostable.com', 'throwawaymail.com', 'maildrop.cc', 'fakeinbox.com', 'mohmal.com', 'emailondeck.com', 'tempail.com', 'mintemail.com', 'spamgourmet.com']);
const PHRASES = ['seo services', 'guest post', 'backlink', 'link building', 'crypto', 'bitcoin', 'casino', 'forex', 'viagra', 'payday loan', 'telegram', 'whatsapp me', 'click here', 'buy now', 'limited offer', '100% free', 'first page of google', 'rank your website', 'domain authority', 'increase your traffic', 'we offer', 'dear sir', 'earn money', 'make money', 'adult', 'porn', 'escort', 'investment opportunity', 'work from home'];

function score(d, req) {
  const flags = []; let s = 0;
  const add = (n, why) => { s += n; flags.push(why); };
  const msg = String(d.message || ''), low = msg.toLowerCase();

  const links = (msg.match(/https?:\/\/|www\./gi) || []).length;
  if (links >= 3) add(4, 'many links'); else if (links === 2) add(3, 'two links'); else if (links === 1) add(1, 'a link in the message');

  const hits = PHRASES.filter((p) => low.includes(p));
  if (hits.length) add(Math.min(4, hits.length * 2), 'spam phrases: ' + hits.slice(0, 3).join(', '));

  const dom = String(d.email || '').split('@')[1] || '';
  if (DISPOSABLE.has(dom)) add(3, 'disposable email');

  if (/https?:|www\.|\.com\b/i.test(d.name || '')) add(3, 'link in the name');
  if (/^\d+$/.test(String(d.name || '').replace(/\s/g, ''))) add(3, 'name is only digits');

  const letters = msg.replace(/[^\p{L}]/gu, '');
  if (letters.length > 20) {
    const foreign = (msg.match(/[Ѐ-ӿ぀-ヿ一-鿿가-힯]/g) || []).length;   // Cyrillic, Japanese, Chinese, Korean
    if (foreign / letters.length > 0.5) add(2, 'mostly non-Latin text');
    if (letters === letters.toUpperCase() && letters.length > 25) add(1, 'all capitals');
  }
  if (/(.)\1{9,}/.test(msg)) add(2, 'repeated characters');
  if (msg.trim().toLowerCase() === String(d.name || '').trim().toLowerCase()) add(3, 'message equals the name');

  // a browser always sends Origin or Referer on a form post; a script often sends neither
  const h = (req && req.headers) || {}, from = String(h.origin || h.referer || '');
  if (!from) add(1, 'no origin');
  else { try { const host = new URL(from).hostname; if (!/(^|\.)aashishpandey\.com$|\.vercel\.app$|^localhost$|^127\.0\.0\.1$/.test(host)) add(4, 'posted from another site: ' + host); } catch (e) { add(2, 'odd origin'); } }
  return { score: s, flags };
}

module.exports = { score, SPAM_AT };
