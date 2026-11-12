#!/usr/bin/env node
// Free-licence photos for posts, banners and videos, from Wikimedia Commons (no key, no account).
//   node scripts/blog-desk/photo.js search "<who or what>" [--n 8] [--dir /tmp/photos]
//        lists candidates with their licence and saves small previews as <dir>/1.jpg, 2.jpg ... so you can LOOK at them before choosing
//   node scripts/blog-desk/photo.js fetch "File:Some name.jpg" [--out /tmp/photo] [--width 1400]
//        saves <out>.jpg and <out>.json (licence, author, credit line, page URL) for `desk.js build --photo <out>.json`
// Only licences that allow reuse on a commercial-friendly blog are listed: public domain, CC0, CC BY, CC BY-SA, and open government licences.
// NonCommercial, NoDerivatives and "fair use" files are never listed. Commons rate-limits shared IPs, so requests retry with the wait it asks for.
const fs = require('fs'), path = require('path');
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'AashishPandeyBlogDesk/1.0 (https://aashishpandey.com; free-licence image lookup)';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const plain = (h) => String(h || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
async function get(url, binary) {
  for (let i = 0; i < 8; i++) {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: binary ? 'image/*' : 'application/json' } });
    if (r.status === 429 || r.status === 503) { const w = Math.min(60, Number(r.headers.get('retry-after')) || 20); console.error(`commons busy (${r.status}), waiting ${w}s`); await sleep(w * 1000 + 500); continue; }
    if (!r.ok) throw new Error('commons ' + r.status + ' for ' + url.slice(0, 100));
    return binary ? Buffer.from(await r.arrayBuffer()) : r.json();
  }
  throw new Error('commons kept rate-limiting; try again in a few minutes');
}
// licence gate: true only for licences that allow reuse with a credit line
function licenceOk(m) {
  const lic = plain((m.LicenseShortName || {}).value), nonFree = plain((m.NonFree || {}).value), restr = plain((m.Restrictions || {}).value);
  if (/^(true|1)$/i.test(nonFree) || /(^|[\s-])(NC|ND)([\s-]|$)/i.test(lic) || /fair use|copyrighted|all rights|non-?free/i.test(lic)) return false;
  if (/trademark|personality|insignia/i.test(restr) && !/^$/.test(restr)) { /* a personality or trademark note is a reuse caution, not a copyright bar; the writer is told to read it */ }
  return /^(CC0|Public domain|PD[ -]|CC BY(-SA)?( |$)|Attribution|GODL|OGL|No restrictions|Copyrighted free use|Pixabay|Unsplash)/i.test(lic) || /public domain/i.test(lic);
}
const rank = (lic) => (/^(CC0|Public domain|PD|No restrictions)/i.test(lic) ? 0 : /^CC BY( |$)|Attribution|GODL|OGL/i.test(lic) ? 1 : 2);
const meta = (p) => { const i = p.imageinfo[0], m = i.extmetadata || {}; return { title: p.title, w: i.width, h: i.height, mime: i.mime, thumb: i.thumburl, url: i.url, page: i.descriptionurl, license: plain((m.LicenseShortName || {}).value), licenseUrl: plain((m.LicenseUrl || {}).value), artist: plain((m.Artist || {}).value).slice(0, 80), date: plain((m.DateTimeOriginal || {}).value).slice(0, 30), desc: plain((m.ImageDescription || {}).value).slice(0, 160), restrictions: plain((m.Restrictions || {}).value) }; };
async function query(extra) {
  const qs = new URLSearchParams({ action: 'query', prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiextmetadatafilter: 'LicenseShortName|LicenseUrl|Artist|ImageDescription|DateTimeOriginal|NonFree|Restrictions', format: 'json', formatversion: '2', ...extra });
  return (await get(API + '?' + qs)).query || {};
}
async function search(q) {
  const n = Number(arg('n', 8)), dir = arg('dir', '/tmp/photos'); fs.mkdirSync(dir, { recursive: true });
  const r = await query({ generator: 'search', gsrsearch: q + ' filetype:bitmap', gsrnamespace: '6', gsrlimit: String(Math.min(40, n * 4)), iiurlwidth: '640' });
  const list = (r.pages || []).filter((p) => p.imageinfo && /^image\/(jpeg|png)$/.test(p.imageinfo[0].mime)).map(meta).filter((x) => x.w >= 700 && licenceOk({ LicenseShortName: { value: x.license } }) && !/NC|ND/.test(x.license))
    .sort((a, b) => rank(a.license) - rank(b.license) || b.w * b.h - a.w * a.h).slice(0, n);
  if (!list.length) return console.log('no free-licence photos found for', JSON.stringify(q), '(use the drawn banner instead)');
  for (let i = 0; i < list.length; i++) {
    const x = list[i]; try { fs.writeFileSync(path.join(dir, `${i + 1}.jpg`), await get(x.thumb, true)); } catch (e) { console.error('preview failed for', x.title); }
    console.log(`${i + 1}. ${x.title}  ${x.w}x${x.h}  ${x.license}${x.date ? '  ' + x.date : ''}\n   by ${x.artist || 'unknown'}\n   ${x.desc}${x.restrictions ? '\n   restrictions: ' + x.restrictions : ''}\n   ${x.page}\n   preview: ${path.join(dir, `${i + 1}.jpg`)}`);
  }
}
async function fetchOne(title) {
  const out = arg('out', '/tmp/photo'), width = Number(arg('width', 1400)); title = title.startsWith('File:') ? title : 'File:' + title;
  const r = await query({ titles: title, iiurlwidth: String(width) }), p = (r.pages || [])[0]; if (!p || !p.imageinfo) throw new Error('not found on Commons: ' + title);
  const x = meta(p); if (!licenceOk({ LicenseShortName: { value: x.license } })) throw new Error('licence not allowed for reuse here: ' + x.license);
  const buf = await get(x.thumb || x.url, true); fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true }); fs.writeFileSync(out + '.jpg', buf);
  const clean = x.artist.replace(/^(photographer|author|credit|source|photo)\s*:\s*/i, '').replace(/\s+\(?(own work|talk)\)?$/i, '').trim(), by = clean && !/^unknown/i.test(clean) ? clean : 'Wikimedia Commons contributor';
  const info = { title: x.title.replace(/^File:/, ''), page: x.page, license: x.license, licenseUrl: x.licenseUrl, artist: by, credit: `Photo: ${by}, ${x.license}, via Wikimedia Commons`, width: width, source: 'Wikimedia Commons' };
  fs.writeFileSync(out + '.json', JSON.stringify(info, null, 2) + '\n'); console.log(JSON.stringify(info, null, 2)); console.log('saved', out + '.jpg and', out + '.json');
}
const cmd = process.argv[2], a1 = process.argv[3];
if (!['search', 'fetch'].includes(cmd) || !a1) { console.error('usage: photo.js search "<query>" [--n 8] [--dir d] | photo.js fetch "File:name.jpg" [--out /tmp/photo] [--width 1400]'); process.exit(2); }
(cmd === 'search' ? search(a1) : fetchOne(a1)).then(() => process.exit(0), (e) => { console.error('photo:', e.message); process.exit(1); });
