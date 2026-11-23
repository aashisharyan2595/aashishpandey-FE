// Writes search-friendly owner and SEO metadata into site images: JPEG (EXIF + XMP), WebP (EXIF + XMP chunks), PNG (eXIf + XMP iTXt + text) and SVG (RDF <metadata>).
// Fields: title, description, keywords, alt (IPTC alt text), creator, copyright, credit, source URL. Everything comes from the post or page the image belongs to.
// Rule (Aashish, 2026-11-23): never write AI, generator, software or tool information. Any such field already in a file (EXIF Software, XMP CreatorTool,
// IPTC/Photoshop blocks, JPEG comments, PNG Software text, SVG generator comments) is removed. No tools or keys needed.
const zlib = require('zlib');
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SITE = 'https://aashishpandey.com';
const T = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = zlib.crc32 || ((b) => { let c = 0xffffffff; for (const x of b) c = T[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; });
function norm(m) {
  const own = !m.creator || m.creator === 'Aashish Pandey';
  return { creator: 'Aashish Pandey', rights: `© ${new Date().getFullYear()} Aashish Pandey. All rights reserved.`, credit: own ? 'Aashish Pandey, aashishpandey.com' : m.creator, ...m, own,
    keywords: [...new Set((m.keywords || []).filter(Boolean).map((k) => String(k).trim()))].slice(0, 20) };
}
// little-endian TIFF with ASCII tags in IFD0: description, artist, copyright, document name. No Software tag.
function tiff(m) {
  const tags = [[0x010d, m.title], [0x010e, m.alt || m.title], [0x013b, m.creator], [0x8298, m.rights]].filter((f) => f[1])
    .map(([tag, val]) => [tag, Buffer.from(String(val).replace(/[^\x20-\x7e]/g, (c) => (c === '©' ? '(c)' : '?')) + '\0', 'ascii')]).sort((a, b) => a[0] - b[0]);
  const n = tags.length, ifdLen = 2 + n * 12 + 4; let off = 8 + ifdLen; const ifd = Buffer.alloc(ifdLen), data = [];
  ifd.writeUInt16LE(n, 0);
  tags.forEach(([tag, buf], i) => { const e = 2 + i * 12; ifd.writeUInt16LE(tag, e); ifd.writeUInt16LE(2, e + 2); ifd.writeUInt32LE(buf.length, e + 4);
    if (buf.length <= 4) buf.copy(ifd, e + 8); else { ifd.writeUInt32LE(off, e + 8); data.push(buf); off += buf.length + (buf.length % 2); if (buf.length % 2) data.push(Buffer.alloc(1)); } });
  return Buffer.concat([Buffer.from([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0]), ifd, ...data]);
}
function xmp(m) {
  const li = (a) => a.map((x) => `<rdf:li>${esc(x)}</rdf:li>`).join(''), alt = (v) => `<rdf:Alt><rdf:li xml:lang="x-default">${esc(v)}</rdf:li></rdf:Alt>`;
  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/" xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/" xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/">`
    + `<dc:title>${alt(m.title)}</dc:title><dc:description>${alt(m.description || m.alt)}</dc:description><dc:subject><rdf:Bag>${li(m.keywords)}</rdf:Bag></dc:subject>`
    + `<dc:creator><rdf:Seq>${li([m.creator])}</rdf:Seq></dc:creator><dc:rights>${alt(m.rights)}</dc:rights><xmpRights:Marked>True</xmpRights:Marked><xmpRights:UsageTerms>${alt(m.rights)}</xmpRights:UsageTerms>`
    + `<photoshop:Headline>${esc(m.title)}</photoshop:Headline><photoshop:Credit>${esc(m.credit)}</photoshop:Credit><photoshop:Source>${esc(m.url)}</photoshop:Source><xmpRights:WebStatement>${esc(m.own ? SITE + '/image-license' : m.url)}</xmpRights:WebStatement>`
    + `<Iptc4xmpCore:AltTextAccessibility>${alt(m.alt || m.title)}</Iptc4xmpCore:AltTextAccessibility>${m.own ? `<Iptc4xmpCore:CreatorContactInfo rdf:parseType="Resource"><Iptc4xmpCore:CiUrlWork>${SITE}</Iptc4xmpCore:CiUrlWork></Iptc4xmpCore:CreatorContactInfo>` : ''}`
    + `</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;
}
// JPEG: drop EXIF/XMP (APP1), IPTC/Photoshop (APP13) and comments (COM); keep JFIF, ICC colour profile and the image data.
function embed(jpeg, m0) {
  if (!jpeg || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) return jpeg;
  const m = norm(m0), keep = [jpeg.slice(0, 2)]; let pos = 2;
  while (pos + 4 <= jpeg.length && jpeg[pos] === 0xff) {
    const mk = jpeg[pos + 1]; if (mk === 0xda || !((mk >= 0xe0 && mk <= 0xef) || mk === 0xfe)) break;
    const len = jpeg.readUInt16BE(pos + 2); if (!(mk === 0xe1 || mk === 0xed || mk === 0xfe)) keep.push(jpeg.slice(pos, pos + 2 + len)); pos += 2 + len;
  }
  const seg = (body) => { const h = Buffer.alloc(4); h.writeUInt16BE(0xffe1, 0); h.writeUInt16BE(body.length + 2, 2); return Buffer.concat([h, body]); };
  return Buffer.concat([...keep, seg(Buffer.concat([Buffer.from('Exif\0\0', 'ascii'), tiff(m)])), seg(Buffer.concat([Buffer.from('http://ns.adobe.com/xap/1.0/\0', 'ascii'), Buffer.from(xmp(m), 'utf8')])), jpeg.slice(pos)]);
}
// WebP: switch to the extended (VP8X) layout if needed and replace the EXIF and XMP chunks.
function embedWebp(buf, m0) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return buf;
  const m = norm(m0), chunks = []; let p = 12;
  while (p + 8 <= buf.length) { const id = buf.toString('ascii', p, p + 4), sz = buf.readUInt32LE(p + 4); chunks.push({ id, data: buf.slice(p + 8, p + 8 + sz) }); p += 8 + sz + (sz % 2); }
  let vx = chunks.find((c) => c.id === 'VP8X');
  if (!vx) {
    const im = chunks.find((c) => c.id === 'VP8 ' || c.id === 'VP8L'); if (!im) return buf;
    let w, h, alpha = 0;
    if (im.id === 'VP8 ') { w = im.data.readUInt16LE(6) & 0x3fff; h = im.data.readUInt16LE(8) & 0x3fff; }
    else { const b = im.data.readUInt32LE(1); w = (b & 0x3fff) + 1; h = ((b >>> 14) & 0x3fff) + 1; alpha = (b >>> 28) & 1; }
    const d = Buffer.alloc(10); d[0] = alpha ? 0x10 : 0; d.writeUIntLE(w - 1, 4, 3); d.writeUIntLE(h - 1, 7, 3); vx = { id: 'VP8X', data: d }; chunks.unshift(vx);
  }
  vx.data = Buffer.from(vx.data); vx.data[0] |= 0x0c;   // EXIF + XMP present
  const body = chunks.filter((c) => c.id !== 'EXIF' && c.id !== 'XMP ');
  body.push({ id: 'EXIF', data: tiff(m) }, { id: 'XMP ', data: Buffer.from(xmp(m), 'utf8') });
  const parts = body.map((c) => { const h = Buffer.alloc(8); h.write(c.id, 0, 'ascii'); h.writeUInt32LE(c.data.length, 4); return Buffer.concat([h, c.data, c.data.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0)]); });
  const all = Buffer.concat(parts), head = Buffer.alloc(12); head.write('RIFF', 0, 'ascii'); head.writeUInt32LE(all.length + 4, 4); head.write('WEBP', 8, 'ascii');
  return Buffer.concat([head, all]);
}
// PNG: drop text, eXIf and time chunks; add eXIf, an XMP iTXt and plain Title/Author/Description/Copyright/Source text right after IHDR.
function embedPng(buf, m0) {
  if (buf.readUInt32BE(0) !== 0x89504e47) return buf;
  const m = norm(m0), chunk = (id, data) => { const h = Buffer.alloc(8); h.writeUInt32BE(data.length, 0); h.write(id, 4, 'ascii'); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([h.slice(4), data])) >>> 0, 0); return Buffer.concat([h, data, c]); };
  const text = (k, v) => chunk('iTXt', Buffer.concat([Buffer.from(k + '\0\0\0\0\0', 'latin1'), Buffer.from(String(v), 'utf8')]));
  const add = [chunk('eXIf', tiff(m)), text('XML:com.adobe.xmp', xmp(m)), text('Title', m.title), text('Author', m.creator), text('Description', m.alt || m.description || m.title), text('Copyright', m.rights), text('Source', m.url)];
  const out = [buf.slice(0, 8)]; let p = 8;
  while (p + 8 <= buf.length) { const len = buf.readUInt32BE(p), id = buf.toString('ascii', p + 4, p + 8), whole = buf.slice(p, p + 12 + len);
    if (!['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME'].includes(id)) out.push(whole); if (id === 'IHDR') out.push(...add); p += 12 + len; }
  return Buffer.concat(out);
}
// SVG: remove generator comments and old <metadata>, add one RDF block (and a <title> when there is none).
function embedSvg(src, m0) {
  const m = norm(m0); let s = String(src).replace(/<!--[\s\S]*?-->/g, (c) => (/generator|created with|illustrator|inkscape|figma|sketch|ai\b/i.test(c) ? '' : c)).replace(/<metadata[\s\S]*?<\/metadata>/g, '');
  const meta = `<metadata><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/"><rdf:Description rdf:about="${esc(m.url)}"><dc:title>${esc(m.title)}</dc:title><dc:description>${esc(m.alt || m.description)}</dc:description><dc:creator>${esc(m.creator)}</dc:creator><dc:rights>${esc(m.rights)}</dc:rights><dc:subject>${esc(m.keywords.join(', '))}</dc:subject><dc:source>${esc(m.url)}</dc:source></rdf:Description></rdf:RDF></metadata>`;
  return s.replace(/<svg\b[^>]*>/, (t) => t + (/<title[\s>]/.test(s) ? '' : `<title>${esc(m.title)}</title>`) + meta);
}
// any supported file by extension; returns the input unchanged for other types
function embedAny(buf, ext, m) {
  ext = ext.toLowerCase().replace(/^\./, '');
  if (ext === 'jpg' || ext === 'jpeg') return embed(buf, m);
  if (ext === 'webp') return embedWebp(buf, m);
  if (ext === 'png') return embedPng(buf, m);
  if (ext === 'svg') return Buffer.from(embedSvg(buf.toString('utf8'), m), 'utf8');
  return buf;
}
module.exports = { embed, embedWebp, embedPng, embedSvg, embedAny };
