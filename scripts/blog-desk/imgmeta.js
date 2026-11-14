// Writes search-friendly metadata into a blog image (JPEG): EXIF (description, artist, copyright, software) and an XMP packet (title, description, keywords, creator, rights, source URL).
// Everything comes from the post itself (its alt text, SEO description, tags and URL), so each image is described by what the blog is about. No tools or keys needed.
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function exifSegment(fields) { // little-endian TIFF with ASCII tags in IFD0
  const tags = fields.filter((f) => f[1]).map(([tag, val]) => [tag, Buffer.from(String(val).replace(/[^\x20-\x7e]/g, '?') + '\0', 'ascii')]).sort((a, b) => a[0] - b[0]);
  const n = tags.length, head = 8, ifdLen = 2 + n * 12 + 4; let off = head + ifdLen; const ifd = Buffer.alloc(ifdLen), data = [];
  ifd.writeUInt16LE(n, 0);
  tags.forEach(([tag, buf], i) => { const e = 2 + i * 12; ifd.writeUInt16LE(tag, e); ifd.writeUInt16LE(2, e + 2); ifd.writeUInt32LE(buf.length, e + 4);
    if (buf.length <= 4) { buf.copy(ifd, e + 8); } else { ifd.writeUInt32LE(off, e + 8); data.push(buf); off += buf.length + (buf.length % 2); if (buf.length % 2) data.push(Buffer.alloc(1)); } });
  const tiff = Buffer.concat([Buffer.from([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0]), ifd, ...data]), body = Buffer.concat([Buffer.from('Exif\0\0', 'ascii'), tiff]);
  const seg = Buffer.alloc(4); seg.writeUInt16BE(0xffe1, 0); seg.writeUInt16BE(body.length + 2, 2); return Buffer.concat([seg, body]);
}
function xmpSegment(m) {
  const li = (a) => a.map((x) => `<rdf:li>${esc(x)}</rdf:li>`).join('');
  const xml = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/" xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/" xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/">`
    + `<dc:title><rdf:Alt><rdf:li xml:lang="x-default">${esc(m.title)}</rdf:li></rdf:Alt></dc:title><dc:description><rdf:Alt><rdf:li xml:lang="x-default">${esc(m.description)}</rdf:li></rdf:Alt></dc:description>`
    + `<dc:subject><rdf:Bag>${li(m.keywords)}</rdf:Bag></dc:subject><dc:creator><rdf:Seq>${li([m.creator])}</rdf:Seq></dc:creator><dc:rights><rdf:Alt><rdf:li xml:lang="x-default">${esc(m.rights)}</rdf:li></rdf:Alt></dc:rights>`
    + `<photoshop:Headline>${esc(m.title)}</photoshop:Headline><photoshop:Source>${esc(m.url)}</photoshop:Source><xmpRights:WebStatement>${esc(m.url)}</xmpRights:WebStatement><Iptc4xmpCore:AltTextAccessibility><rdf:Alt><rdf:li xml:lang="x-default">${esc(m.alt)}</rdf:li></rdf:Alt></Iptc4xmpCore:AltTextAccessibility>`
    + `</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;
  const body = Buffer.concat([Buffer.from('http://ns.adobe.com/xap/1.0/\0', 'ascii'), Buffer.from(xml, 'utf8')]), seg = Buffer.alloc(4);
  seg.writeUInt16BE(0xffe1, 0); seg.writeUInt16BE(body.length + 2, 2); return Buffer.concat([seg, body]);
}
// m: { title, alt, description, keywords[], url, creator?, rights? }
function embed(jpeg, m) {
  if (!jpeg || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) return jpeg;
  const meta = { creator: 'Aashish Pandey', rights: `© ${new Date().getFullYear()} Aashish Pandey`, ...m, keywords: (m.keywords || []).filter(Boolean).slice(0, 20) };
  let pos = 2; // drop any existing EXIF/XMP, keep JFIF and the rest
  const keep = [jpeg.slice(0, 2)];
  while (pos + 4 <= jpeg.length && jpeg[pos] === 0xff && jpeg[pos + 1] >= 0xe0 && jpeg[pos + 1] <= 0xef) {
    const len = jpeg.readUInt16BE(pos + 2), seg = jpeg.slice(pos, pos + 2 + len);
    if (!(jpeg[pos + 1] === 0xe1)) keep.push(seg); pos += 2 + len;
  }
  const exif = exifSegment([[0x010e, meta.alt || meta.title], [0x013b, meta.creator], [0x8298, meta.rights], [0x0131, 'aashishpandey.com blog desk'], [0x010d, meta.title]]);
  return Buffer.concat([...keep, exif, xmpSegment(meta), jpeg.slice(pos)]);
}
module.exports = { embed };
