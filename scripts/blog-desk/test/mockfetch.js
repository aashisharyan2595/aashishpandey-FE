// Fake network for the dry run: feeds and news pages, nothing real is contacted.
const { FEEDS } = require('../sources');
const PAGES = { 'https://www.theguardian.com/technology/2026/nov/10/acme-layoffs': 'The Guardian', 'https://www.npr.org/2026/11/10/acme-cuts-jobs': 'NPR', 'https://www.foxnews.com/tech/acme-job-cuts': 'Fox', 'https://nypost.com/2026/11/10/acme-layoffs/': 'NYP',
  'https://www.reuters.com/technology/acme-to-cut-jobs-2026-11-10/': 'Reuters', 'https://www.livemint.com/technology/acme-layoffs-india': 'Mint', 'https://acme.example.com/blog/restructuring': 'Primary' };
const filler = (tag) => Array.from({ length: 140 }, (_, i) => `${tag} reports sentence ${i} about the restructuring plan, headcount ${100 + i * 3} and region ${i % 7} with detail number ${tag.length * i}.`).join(' ') + ' Acme will cut about 12% of staff, roughly 3000 people.';
const feedFor = (u) => { const h = Buffer.from(u).toString('hex').slice(-10); return `<?xml version="1.0"?><rss><channel>${['Acme to cut 12% of staff in restructuring', 'Best phone deals this weekend'].map((t, i) => `<item><title>${t}</title><link>https://news.example.com/${h}/${i}</link><pubDate>${new Date().toUTCString()}</pubDate><description>desc</description></item>`).join('')}</channel></rss>`; };
global.fetch = async (url) => {
  const u = String(url); if (!url || u === 'undefined') return { ok: true, json: async () => ({ result: null }) };   // the site's database: empty
  if (PAGES[u]) return { ok: true, url: u, headers: { get: () => 'text/html' }, text: async () => `<html><title>${PAGES[u]} - Acme layoffs | ${PAGES[u]}</title><body><p>${filler(PAGES[u])}</p></body></html>` };
  if (FEEDS.some((f) => f.url === u)) return { ok: true, text: async () => feedFor(u) };
  if (/indexnow/.test(u)) return { status: 200 };
  return { ok: false, status: 404, headers: { get: () => '' }, text: async () => '' };
};
module.exports = { PAGES };
