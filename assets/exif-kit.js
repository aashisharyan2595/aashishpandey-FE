/* Photo metadata kit: read, edit, add, delete and write EXIF, IPTC and XMP in JPEG, PNG and WebP.
 * Plain JavaScript, no libraries, nothing leaves the device. Used by /tools/exif-editor.
 *
 *   var doc = ExifKit.read(uint8array);        // throws Error with a plain message if the file is not JPEG, PNG or WebP
 *   ExifKit.fields(doc)                        // friendly fields with their current value (value '' = not set)
 *   ExifKit.setField(doc, 'title', 'Sunset');  // writes to every place that format keeps it (EXIF, IPTC, XMP, PNG text)
 *   ExifKit.delField(doc, 'gps');
 *   ExifKit.others(doc) / ExifKit.delOther(doc, id)   // everything else found in the file, one row each
 *   ExifKit.strip(doc, { keepOrientation: true })
 *   ExifKit.write(doc)                         // new file bytes (image data is copied untouched, never re-encoded)
 */
(function (root) {
'use strict';

var TD = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;
var TE = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
function utf8(u8, a, b) { return TD.decode(u8.subarray(a, b)); }
function enc(s) { return TE.encode(s); }
function ascii(u8, a, b) { var s = ''; for (var i = a; i < b && i < u8.length; i++) s += String.fromCharCode(u8[i]); return s; }
function starts(u8, at, str) { return ascii(u8, at, at + str.length) === str; }
function concat(parts) {
  var n = 0, i; for (i = 0; i < parts.length; i++) n += parts[i].length;
  var out = new Uint8Array(n), p = 0; for (i = 0; i < parts.length; i++) { out.set(parts[i], p); p += parts[i].length; }
  return out;
}
function fail(msg) { throw new Error(msg); }
function gcd(a, b) { while (b) { var t = a % b; a = b; b = t; } return a || 1; }
function pad2(n) { return (n < 10 ? '0' : '') + n; }

/* ===================== EXIF / TIFF ===================== */
var TSIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };
var PTR = { 0x8769: 1, 0x8825: 1, 0xA005: 1, 0x0201: 1, 0x0202: 1, 0x014A: 1 };   // pointers and thumbnail offsets: rebuilt or dropped

function emptyExif() { return { 0: {}, 1: {}, 2: {} }; }   // 0 = main, 1 = EXIF details, 2 = GPS

function parseTiff(u8, base) {
  if (base + 8 > u8.length) return null;
  var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), bo = dv.getUint16(base), le;
  if (bo === 0x4949) le = true; else if (bo === 0x4d4d) le = false; else return null;
  if (dv.getUint16(base + 2, le) !== 42) return null;
  function val(p, type, cnt) {
    var i, a = [];
    if (type === 2) { var b = u8.slice(p, p + cnt), z = b.indexOf(0); if (z >= 0) b = b.slice(0, z); return utf8(b, 0, b.length); }
    if (type === 7 || type === 1 || type === 6) return u8.slice(p, p + cnt);
    for (i = 0; i < cnt; i++) {
      if (type === 3) a.push(dv.getUint16(p + i * 2, le));
      else if (type === 8) a.push(dv.getInt16(p + i * 2, le));
      else if (type === 4) a.push(dv.getUint32(p + i * 4, le));
      else if (type === 9) a.push(dv.getInt32(p + i * 4, le));
      else if (type === 11) a.push(dv.getFloat32(p + i * 4, le));
      else if (type === 12) a.push(dv.getFloat64(p + i * 8, le));
      else if (type === 5) a.push([dv.getUint32(p + i * 8, le), dv.getUint32(p + i * 8 + 4, le)]);
      else if (type === 10) a.push([dv.getInt32(p + i * 8, le), dv.getInt32(p + i * 8 + 4, le)]);
    }
    return a;
  }
  function ifd(off) {
    var t = {}, p = base + off;
    if (!off || p + 2 > u8.length) return { t: t, next: 0 };
    var n = dv.getUint16(p, le);
    for (var i = 0; i < n; i++) {
      var e = p + 2 + i * 12; if (e + 12 > u8.length) break;
      var tag = dv.getUint16(e, le), type = dv.getUint16(e + 2, le), cnt = dv.getUint32(e + 4, le), sz = (TSIZE[type] || 0) * cnt;
      if (!sz || cnt > 200000) continue;
      var vp = sz <= 4 ? e + 8 : base + dv.getUint32(e + 8, le);
      if (vp + sz > u8.length) continue;
      t[tag] = { t: type, v: val(vp, type, cnt) };
    }
    var np = p + 2 + n * 12;
    return { t: t, next: np + 4 <= u8.length ? dv.getUint32(np, le) : 0 };
  }
  var i0 = ifd(dv.getUint32(base + 4, le)), out = { le: le, ifds: emptyExif(), thumb: false };
  if (i0.next) { var i1 = ifd(i0.next); out.thumb = !!(i1.t[0x0201] || i1.t[0x0103]); }
  var p1 = i0.t[0x8769], p2 = i0.t[0x8825];
  out.ifds[0] = i0.t;
  if (p1 && typeof p1.v[0] === 'number') out.ifds[1] = ifd(p1.v[0]).t;
  if (p2 && typeof p2.v[0] === 'number') out.ifds[2] = ifd(p2.v[0]).t;
  Object.keys(PTR).forEach(function (k) { delete out.ifds[0][k]; delete out.ifds[1][k]; });
  return out;
}

function encVal(t, v, le) {
  var n, i, o, dv;
  if (t === 2) { var b = enc(String(v)); o = new Uint8Array(b.length + 1); o.set(b); return { cnt: o.length, b: o }; }
  if (t === 1 || t === 7 || t === 6) { o = v instanceof Uint8Array ? v : Uint8Array.from(v); return { cnt: o.length, b: o }; }
  n = v.length; o = new Uint8Array(n * TSIZE[t]); dv = new DataView(o.buffer);
  for (i = 0; i < n; i++) {
    if (t === 3) dv.setUint16(i * 2, v[i], le);
    else if (t === 8) dv.setInt16(i * 2, v[i], le);
    else if (t === 4) dv.setUint32(i * 4, v[i], le);
    else if (t === 9) dv.setInt32(i * 4, v[i], le);
    else if (t === 11) dv.setFloat32(i * 4, v[i], le);
    else if (t === 12) dv.setFloat64(i * 8, v[i], le);
    else if (t === 5) { dv.setUint32(i * 8, v[i][0], le); dv.setUint32(i * 8 + 4, v[i][1], le); }
    else if (t === 10) { dv.setInt32(i * 8, v[i][0], le); dv.setInt32(i * 8 + 4, v[i][1], le); }
  }
  return { cnt: n, b: o };
}

/* Builds a fresh TIFF block: header, main IFD, EXIF IFD, GPS IFD. The thumbnail is left out on purpose. */
function buildTiff(ex, le) {
  var main = Object.assign({}, ex[0]), det = Object.assign({}, ex[1]), gps = Object.assign({}, ex[2]);
  var hasDet = Object.keys(det).length > 0, hasGps = Object.keys(gps).length > 0;
  if (!Object.keys(main).length && !hasDet && !hasGps) return null;
  if (hasDet) main[0x8769] = { t: 4, v: [0] };
  if (hasGps) main[0x8825] = { t: 4, v: [0] };
  function layout(ifd, start) {
    var tags = Object.keys(ifd).map(Number).sort(function (a, b) { return a - b; });
    var enc1 = tags.map(function (g) { return { tag: g, t: ifd[g].t, e: encVal(ifd[g].t, ifd[g].v, le) }; });
    var head = 2 + enc1.length * 12 + 4, dataLen = 0;
    enc1.forEach(function (x) { if (x.e.b.length > 4) dataLen += x.e.b.length + (x.e.b.length & 1); });
    var buf = new Uint8Array(head + dataLen), dv = new DataView(buf.buffer), dp = head;
    dv.setUint16(0, enc1.length, le);
    enc1.forEach(function (x, i) {
      var p = 2 + i * 12;
      dv.setUint16(p, x.tag, le); dv.setUint16(p + 2, x.t, le); dv.setUint32(p + 4, x.e.cnt, le);
      if (x.e.b.length <= 4) buf.set(x.e.b, p + 8);
      else { dv.setUint32(p + 8, start + dp, le); buf.set(x.e.b, dp); dp += x.e.b.length + (x.e.b.length & 1); }
    });
    return buf;
  }
  var size0 = layout(main, 8).length, sizeD = hasDet ? layout(det, 0).length : 0;
  if (hasDet) main[0x8769].v = [8 + size0];
  if (hasGps) main[0x8825].v = [8 + size0 + sizeD];
  var parts = [new Uint8Array(8), layout(main, 8)];
  if (hasDet) parts.push(layout(det, 8 + size0));
  if (hasGps) parts.push(layout(gps, 8 + size0 + sizeD));
  var out = concat(parts), dv = new DataView(out.buffer);
  dv.setUint16(0, le ? 0x4949 : 0x4d4d); dv.setUint16(2, 42, le); dv.setUint32(4, 8, le);
  return out;
}

/* ===================== IPTC (JPEG APP13, Photoshop 8BIM) ===================== */
function parseApp13(u8, d, e, doc) {
  var p = d + 14;   // "Photoshop 3.0\0"
  while (p + 12 <= e && starts(u8, p, '8BIM')) {
    var id = (u8[p + 4] << 8) | u8[p + 5], nl = u8[p + 6], q = p + 7 + nl; if ((1 + nl) & 1) q++;
    var len = ((u8[q] << 24) | (u8[q + 1] << 16) | (u8[q + 2] << 8) | u8[q + 3]) >>> 0, ds = q + 4, end = ds + len;
    if (end > e) break;
    if (id === 0x0404) {
      var i = ds;
      while (i + 5 <= end && u8[i] === 0x1C) {
        var r = u8[i + 1], dn = u8[i + 2], l = (u8[i + 3] << 8) | u8[i + 4];
        if (l & 0x8000 || i + 5 + l > end) break;
        doc.iptc.push({ r: r, d: dn, b: u8.slice(i + 5, i + 5 + l) });
        i += 5 + l;
      }
    } else doc.psOther.push({ id: id, raw: u8.slice(p, end + (len & 1)) });
    p = end + (len & 1);
  }
}
function buildApp13(doc) {
  var ds = [];
  var recs = doc.iptc.filter(function (x) { return !(x.r === 1 && x.d === 90); });
  if (recs.length) {
    recs.unshift({ r: 1, d: 90, b: Uint8Array.from([0x1B, 0x25, 0x47]) });   // text is UTF-8
    recs.sort(function (a, b) { return a.r - b.r || a.d - b.d; });
    recs.forEach(function (x) { ds.push(Uint8Array.from([0x1C, x.r, x.d, x.b.length >> 8, x.b.length & 255]), x.b); });
  }
  var iptc = concat(ds), parts = [enc('Photoshop 3.0\0')];
  doc.psOther.forEach(function (r) { parts.push(r.raw); });
  if (iptc.length) {
    var n = iptc.length;
    parts.push(concat([enc('8BIM'), Uint8Array.from([0x04, 0x04, 0, 0, (n >>> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255]), iptc, new Uint8Array(n & 1)]));
  } else if (!doc.psOther.length) return null;
  return concat(parts);
}

/* ===================== XMP ===================== */
var NS = {
  dc: 'http://purl.org/dc/elements/1.1/', xmp: 'http://ns.adobe.com/xap/1.0/', photoshop: 'http://ns.adobe.com/photoshop/1.0/',
  exif: 'http://ns.adobe.com/exif/1.0/', tiff: 'http://ns.adobe.com/tiff/1.0/', xmpRights: 'http://ns.adobe.com/xap/1.0/rights/',
  Iptc4xmpCore: 'http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/', aux: 'http://ns.adobe.com/exif/1.0/aux/', xmpMM: 'http://ns.adobe.com/xap/1.0/mm/',
  crs: 'http://ns.adobe.com/camera-raw-settings/1.0/', lr: 'http://ns.adobe.com/lightroom/1.0/'
};
var RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
function prefixOf(uri) { for (var k in NS) if (NS[k] === uri) return k; return null; }

function parseXmp(str, doc) {
  if (typeof DOMParser === 'undefined') return;
  var dom = new DOMParser().parseFromString(str, 'application/xml');
  if (dom.getElementsByTagName('parsererror').length) { doc.warnings.push('The XMP block in this file is damaged, so it was left out.'); return; }
  var ser = new XMLSerializer();
  Array.prototype.forEach.call(dom.getElementsByTagNameNS(RDF, 'Description'), function (desc) {
    Array.prototype.forEach.call(desc.attributes, function (a) {
      if (!a.namespaceURI || a.namespaceURI === RDF || a.namespaceURI.indexOf('xmlns') >= 0 || a.namespaceURI === 'http://www.w3.org/XML/1998/namespace') return;
      doc.xmp.push({ uri: a.namespaceURI, local: a.localName, kind: 'text', val: a.value });
    });
    Array.prototype.forEach.call(desc.children, function (el) {
      var uri = el.namespaceURI, local = el.localName, kids = el.children;
      if (!kids.length) { doc.xmp.push({ uri: uri, local: local, kind: 'text', val: el.textContent }); return; }
      var c = kids[0];
      if (kids.length === 1 && c.namespaceURI === RDF && /^(Alt|Seq|Bag)$/.test(c.localName)) {
        var lis = Array.prototype.slice.call(c.children), simple = lis.every(function (li) { return !li.children.length; });
        if (simple) {
          if (c.localName === 'Alt') doc.xmp.push({ uri: uri, local: local, kind: 'alt', val: lis.map(function (li) { return { lang: li.getAttribute('xml:lang') || 'x-default', text: li.textContent }; }) });
          else doc.xmp.push({ uri: uri, local: local, kind: c.localName === 'Seq' ? 'seq' : 'bag', val: lis.map(function (li) { return li.textContent; }) });
          return;
        }
      }
      doc.xmp.push({ uri: uri, local: local, kind: 'opaque', xml: ser.serializeToString(el), val: null });
    });
  });
}
function xmlEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function buildXmp(doc) {
  if (!doc.xmp.length) return null;
  var used = {}, n = 0, body = '';
  function pre(uri) { var p = prefixOf(uri); if (!p) { p = used[uri] || 'ns' + (++n); } used[uri] = p; return p; }
  doc.xmp.forEach(function (x) {
    if (x.kind === 'opaque') { body += x.xml; return; }
    var t = pre(x.uri) + ':' + x.local;
    if (x.kind === 'text') body += '<' + t + '>' + xmlEsc(x.val) + '</' + t + '>';
    else if (x.kind === 'alt') body += '<' + t + '><rdf:Alt>' + x.val.map(function (l) { return '<rdf:li xml:lang="' + xmlEsc(l.lang) + '">' + xmlEsc(l.text) + '</rdf:li>'; }).join('') + '</rdf:Alt></' + t + '>';
    else body += '<' + t + '><rdf:' + (x.kind === 'seq' ? 'Seq' : 'Bag') + '>' + x.val.map(function (v) { return '<rdf:li>' + xmlEsc(v) + '</rdf:li>'; }).join('') + '</rdf:' + (x.kind === 'seq' ? 'Seq' : 'Bag') + '></' + t + '>';
  });
  var decl = Object.keys(used).map(function (u) { return ' xmlns:' + used[u] + '="' + u + '"'; }).join('');
  return '<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>\n<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="' + RDF + '"><rdf:Description rdf:about=""' + decl + '>' + body + '</rdf:Description></rdf:RDF></x:xmpmeta>\n<?xpacket end="w"?>';
}
function xFind(doc, uri, local) { for (var i = 0; i < doc.xmp.length; i++) if (doc.xmp[i].uri === uri && doc.xmp[i].local === local) return i; return -1; }
function xGet(doc, ns, local) {
  var i = xFind(doc, NS[ns], local); if (i < 0) return null;
  var x = doc.xmp[i];
  if (x.kind === 'text') return x.val;
  if (x.kind === 'alt') { var d = x.val.filter(function (l) { return l.lang === 'x-default'; })[0] || x.val[0]; return d ? d.text : null; }
  if (x.kind === 'opaque') return null;
  return x.val.slice();
}
function xDel(doc, ns, local) { var i = xFind(doc, NS[ns], local); if (i >= 0) doc.xmp.splice(i, 1); }
function xSet(doc, ns, local, kind, val) {
  var empty = val === null || val === undefined || val === '' || (Array.isArray(val) && !val.length);
  xDel(doc, ns, local);
  if (empty) return;
  doc.xmp.push({ uri: NS[ns], local: local, kind: kind, val: kind === 'alt' ? [{ lang: 'x-default', text: val }] : kind === 'text' ? String(val) : [].concat(val) });
}

/* ===================== file containers ===================== */
function u32(u8, p) { return ((u8[p] << 24) | (u8[p + 1] << 16) | (u8[p + 2] << 8) | u8[p + 3]) >>> 0; }
function crc32(u8) {
  var t = crc32.t;
  if (!t) { t = crc32.t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } }
  var r = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) r = t[(r ^ u8[i]) & 255] ^ (r >>> 8);
  return (r ^ 0xFFFFFFFF) >>> 0;
}

function jpegSegments(u8) {
  if (u8[0] !== 0xFF || u8[1] !== 0xD8) return null;
  var segs = [], i = 2;
  while (i < u8.length - 1) {
    if (u8[i] !== 0xFF) { i++; continue; }
    while (u8[i] === 0xFF && i < u8.length) i++;
    var m = u8[i++];
    if (m === 0xD9) break;
    if (m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { segs.push({ m: m, s: i - 2, e: i, d: i }); continue; }
    var len = (u8[i] << 8) | u8[i + 1];
    if (len < 2 || i + len > u8.length) return null;
    var seg = { m: m, s: i - 2, e: i + len, d: i + 2 };
    segs.push(seg);
    if (m === 0xDA) { seg.sos = true; break; }
    i += len;
  }
  return segs;
}
function jpegEnd(u8, from) { for (var i = from; i < u8.length - 1; i++) if (u8[i] === 0xFF && u8[i + 1] === 0xD9) return i + 2; return u8.length; }

function pngChunks(u8) {
  if (![137, 80, 78, 71, 13, 10, 26, 10].every(function (b, i) { return u8[i] === b; })) return null;
  var out = [], p = 8;
  while (p + 12 <= u8.length) {
    var len = u32(u8, p), type = ascii(u8, p + 4, p + 8);
    if (p + 12 + len > u8.length) break;
    out.push({ type: type, s: p, e: p + 12 + len, d: p + 8, len: len });
    p += 12 + len;
    if (type === 'IEND') break;
  }
  return out;
}
function pngChunk(type, data) {
  var out = new Uint8Array(12 + data.length), dv = new DataView(out.buffer);
  dv.setUint32(0, data.length); out.set(enc(type), 4); out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}
function webpChunks(u8) {
  if (ascii(u8, 0, 4) !== 'RIFF' || ascii(u8, 8, 12) !== 'WEBP') return null;
  var out = [], p = 12, le32 = function (q) { return (u8[q] | (u8[q + 1] << 8) | (u8[q + 2] << 16) | (u8[q + 3] << 24)) >>> 0; };
  while (p + 8 <= u8.length) {
    var len = le32(p + 4), type = ascii(u8, p, p + 4);
    if (p + 8 + len > u8.length) break;
    out.push({ type: type, s: p, e: Math.min(u8.length, p + 8 + len + (len & 1)), d: p + 8, len: len });
    p += 8 + len + (len & 1);
  }
  return out;
}
function webpChunk(type, data) {
  var n = data.length, out = new Uint8Array(8 + n + (n & 1));
  out.set(enc(type)); out[4] = n & 255; out[5] = (n >> 8) & 255; out[6] = (n >> 16) & 255; out[7] = (n >>> 24) & 255; out.set(data, 8);
  return out;
}

/* ===================== read ===================== */
function newDoc(fmt, u8) {
  return { fmt: fmt, u8: u8, le: false, exif: emptyExif(), iptc: [], psOther: [], xmp: [], text: [], com: [], vendor: [], thumb: false, warnings: [], drop: {} };
}
function loadXmpString(doc, s) { parseXmp(s, doc); }

function read(u8) {
  var doc, i;
  if (u8[0] === 0xFF && u8[1] === 0xD8) {
    var segs = jpegSegments(u8); if (!segs) fail('This JPEG looks damaged, so it cannot be read.');
    doc = newDoc('jpeg', u8); doc.segs = segs;
    segs.forEach(function (sg, k) {
      if (sg.m === 0xE1 && starts(u8, sg.d, 'Exif\0\0')) {
        var tf = parseTiff(u8, sg.d + 6);
        if (tf) { doc.exif = tf.ifds; doc.le = tf.le; doc.thumb = doc.thumb || tf.thumb; } else doc.warnings.push('The EXIF block is damaged, so it was left out.');
      } else if (sg.m === 0xE1 && starts(u8, sg.d, 'http://ns.adobe.com/xap/1.0/\0')) loadXmpString(doc, utf8(u8, sg.d + 29, sg.e));
      else if (sg.m === 0xE1 && starts(u8, sg.d, 'http://ns.adobe.com/xmp/extension/')) doc.warnings.push('Extended XMP was found. It is not kept when you save.');
      else if (sg.m === 0xED && starts(u8, sg.d, 'Photoshop 3.0')) parseApp13(u8, sg.d, sg.e, doc);
      else if (sg.m === 0xFE) doc.com.push({ k: k, text: utf8(u8, sg.d, sg.e).replace(/\0+$/, '') });
      else if (sg.m === 0xE2 && starts(u8, sg.d, 'MPF')) doc.mpf = true;
      else if (sg.m >= 0xE3 && sg.m <= 0xEC) doc.vendor.push({ k: k, name: 'APP' + (sg.m - 0xE0), size: sg.e - sg.d });
    });
    return doc;
  }
  var ch;
  if ((ch = pngChunks(u8))) {
    doc = newDoc('png', u8); doc.chunks = ch;
    ch.forEach(function (c, k) {
      if (c.type === 'eXIf') { var tf = parseTiff(u8, c.d); if (tf) { doc.exif = tf.ifds; doc.le = tf.le; } }
      else if (c.type === 'tEXt') {
        var z = c.d; while (z < c.d + c.len && u8[z]) z++;
        var raw = u8.slice(z + 1, c.d + c.len), s = ''; for (i = 0; i < raw.length; i++) s += String.fromCharCode(raw[i]);
        doc.text.push({ k: k, key: ascii(u8, c.d, z), val: s, type: 'tEXt' });
      } else if (c.type === 'iTXt') {
        var z2 = c.d; while (z2 < c.d + c.len && u8[z2]) z2++;
        var key = ascii(u8, c.d, z2), comp = u8[z2 + 1], q = z2 + 3;
        while (q < c.d + c.len && u8[q]) q++; q++;
        while (q < c.d + c.len && u8[q]) q++; q++;
        if (key === 'XML:com.adobe.xmp' && !comp) loadXmpString(doc, utf8(u8, q, c.d + c.len));
        else if (comp) doc.text.push({ k: k, key: key, val: '(compressed text)', locked: true });
        else doc.text.push({ k: k, key: key, val: utf8(u8, q, c.d + c.len), type: 'iTXt' });
      } else if (c.type === 'zTXt') {
        var z3 = c.d; while (z3 < c.d + c.len && u8[z3]) z3++;
        doc.text.push({ k: k, key: ascii(u8, c.d, z3), val: '(compressed text)', locked: true });
      } else if (c.type === 'tIME') doc.time = { k: k, v: ((u8[c.d] << 8) | u8[c.d + 1]) + '-' + pad2(u8[c.d + 2]) + '-' + pad2(u8[c.d + 3]) };
    });
    return doc;
  }
  if ((ch = webpChunks(u8))) {
    doc = newDoc('webp', u8); doc.chunks = ch;
    ch.forEach(function (c) {
      if (c.type === 'EXIF') { var tf = parseTiff(u8, starts(u8, c.d, 'Exif\0\0') ? c.d + 6 : c.d); if (tf) { doc.exif = tf.ifds; doc.le = tf.le; } }
      else if (c.type === 'XMP ') loadXmpString(doc, utf8(u8, c.d, c.d + c.len));
    });
    return doc;
  }
  fail('This is not a JPEG, PNG or WebP file. (HEIC photos from iPhones need converting first.)');
}

/* ===================== friendly fields ===================== */
function eGet(doc, ifd, tag) { var e = doc.exif[ifd][tag]; return e ? e.v : null; }
function eSet(doc, ifd, tag, t, v) { if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) delete doc.exif[ifd][tag]; else doc.exif[ifd][tag] = { t: t, v: v }; }
function eStr(doc, ifd, tag) { var v = eGet(doc, ifd, tag); return typeof v === 'string' ? v.trim() : null; }
function iAll(doc, ds) { return doc.iptc.filter(function (x) { return x.r === 2 && x.d === ds; }).map(function (x) { return utf8(x.b, 0, x.b.length); }); }
function iSet(doc, ds, list) {
  if (doc.fmt !== 'jpeg') return;
  doc.iptc = doc.iptc.filter(function (x) { return !(x.r === 2 && x.d === ds); });
  list.forEach(function (s) { if (s !== '') { var b = enc(s); doc.iptc.push({ r: 2, d: ds, b: b.length > 2000 ? b.subarray(0, 2000) : b }); } });
}
function pGet(doc, key) { for (var i = 0; i < doc.text.length; i++) if (doc.text[i].key === key && !doc.text[i].locked) return doc.text[i].val; return null; }
function pSet(doc, key, val) {
  if (doc.fmt !== 'png') return;
  doc.text = doc.text.filter(function (t) { return t.key !== key || t.locked; });
  if (val) doc.text.push({ key: key, val: val });
}
function xpGet(doc, tag) { var v = eGet(doc, 0, tag); if (!v || typeof v === 'string') return null; var s = ''; for (var i = 0; i + 1 < v.length; i += 2) { var c = v[i] | (v[i + 1] << 8); if (!c) break; s += String.fromCharCode(c); } return s; }
function xpSet(doc, tag, s) {
  if (!s) { delete doc.exif[0][tag]; return; }
  var b = new Uint8Array(s.length * 2 + 2); for (var i = 0; i < s.length; i++) { b[i * 2] = s.charCodeAt(i) & 255; b[i * 2 + 1] = s.charCodeAt(i) >> 8; }
  doc.exif[0][tag] = { t: 1, v: b };
}
function clean(v) { return (v === null || v === undefined) ? '' : String(v).replace(/\r\n?/g, '\n').trim(); }
function firstText() { for (var i = 0; i < arguments.length; i++) { var v = arguments[i]; if (Array.isArray(v)) v = v.join(', '); if (v !== null && v !== undefined && String(v).trim() !== '') return String(v).trim(); } return ''; }

var FIELDS = [], BYID = {};
function def(o) { FIELDS.push(o); BYID[o.id] = o; }

/* text fields kept in step across EXIF, IPTC, XMP and PNG text, the way Photoshop's File Info does */
function textField(id, label, group, kind, o) {
  def({
    id: id, label: label, group: group, kind: kind, hint: o.hint || '',
    claims: o.claims || [],
    read: function (d) {
      var xv = o.x ? xGet(d, o.x[0], o.x[1]) : null, iv = o.i ? iAll(d, o.i) : [];
      var ex = o.e ? eStr(d, o.e[0], o.e[1]) : null;
      return firstText(xv, iv.length ? (o.multi ? iv : iv[0]) : '', ex, o.p ? pGet(d, o.p) : '', o.xp ? xpGet(d, o.xp) : '');
    },
    write: function (d, v) {
      v = clean(v);
      if (o.x) xSet(d, o.x[0], o.x[1], o.x[2], v ? (o.x[2] === 'text' || o.x[2] === 'alt' ? v : [v]) : '');
      if (o.i) iSet(d, o.i, v ? [v] : []);
      if (o.e) eSet(d, o.e[0], o.e[1], 2, v);
      if (o.p) pSet(d, o.p, v);
      if (o.xp) xpSet(d, o.xp, v);
    }
  });
}
function list(v) { return String(v || '').split(/[,;\n]/).map(function (s) { return s.trim(); }).filter(Boolean).filter(function (s, i, a) { return a.indexOf(s) === i; }); }

var DC = 'dc', PS = 'photoshop';
textField('title', 'Title', 'about', 'text', { x: [DC, 'title', 'alt'], i: 5, p: 'Title', xp: 0x9C9B, hint: 'A short name for the picture.', claims: [['x', DC, 'title'], ['i', 5], ['p', 'Title'], ['e', 0, 0x9C9B]] });
textField('description', 'Description', 'about', 'area', { x: [DC, 'description', 'alt'], i: 120, e: [0, 0x010E], p: 'Description', hint: 'The caption. Search engines and photo apps read this.', claims: [['x', DC, 'description'], ['i', 120], ['e', 0, 0x010E], ['p', 'Description']] });
textField('creator', 'Creator', 'about', 'text', { x: [DC, 'creator', 'seq'], i: 80, e: [0, 0x013B], p: 'Author', xp: 0x9C9D, hint: 'Who took or made it.', claims: [['x', DC, 'creator'], ['i', 80], ['e', 0, 0x013B], ['p', 'Author'], ['e', 0, 0x9C9D]] });
textField('copyright', 'Copyright', 'about', 'text', { x: [DC, 'rights', 'alt'], i: 116, e: [0, 0x8298], p: 'Copyright', hint: 'For example: © 2026 Your Name. All rights reserved.', claims: [['x', DC, 'rights'], ['i', 116], ['e', 0, 0x8298], ['p', 'Copyright']] });
textField('credit', 'Credit line', 'about', 'text', { x: [PS, 'Credit', 'text'], i: 110, claims: [['x', PS, 'Credit'], ['i', 110]] });
textField('source', 'Source', 'about', 'text', { x: [PS, 'Source', 'text'], i: 115, p: 'Source', claims: [['x', PS, 'Source'], ['i', 115], ['p', 'Source']] });
def({
  id: 'keywords', label: 'Keywords', group: 'about', kind: 'keywords', hint: 'Separate with commas. Used for search in most photo apps.',
  claims: [['x', DC, 'subject'], ['i', 25], ['e', 0, 0x9C9E]],
  read: function (d) { var x = xGet(d, DC, 'subject'), i = iAll(d, 25); return firstText(x && x.length ? x : '', i.length ? i : '', xpGet(d, 0x9C9E) ? xpGet(d, 0x9C9E).split(';') : ''); },
  write: function (d, v) { var l = list(v); xSet(d, DC, 'subject', 'bag', l); iSet(d, 25, l); xpSet(d, 0x9C9E, l.join(';')); }
});
def({
  id: 'rating', label: 'Star rating', group: 'about', kind: 'rating', hint: '0 to 5 stars.',
  claims: [['x', 'xmp', 'Rating'], ['e', 0, 0x4746]],
  read: function (d) { var x = xGet(d, 'xmp', 'Rating'); var e = eGet(d, 0, 0x4746); return firstText(x, e ? e[0] : ''); },
  write: function (d, v) { v = clean(v); var n = v === '' ? null : Math.max(0, Math.min(5, Math.round(+v) || 0)); xSet(d, 'xmp', 'Rating', 'text', n === null ? '' : String(n)); }
});
textField('city', 'City', 'place', 'text', { x: [PS, 'City', 'text'], i: 90, claims: [['x', PS, 'City'], ['i', 90]] });
textField('state', 'State or region', 'place', 'text', { x: [PS, 'State', 'text'], i: 95, claims: [['x', PS, 'State'], ['i', 95]] });
textField('country', 'Country', 'place', 'text', { x: [PS, 'Country', 'text'], i: 101, claims: [['x', PS, 'Country'], ['i', 101]] });

/* date taken: "YYYY-MM-DDTHH:MM:SS" in the form, EXIF "YYYY:MM:DD HH:MM:SS", IPTC date and time, XMP ISO */
function dateFrom(s) { var m = /^(\d{4})[-:](\d{2})[-:](\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(s || ''); return m ? m[1] + '-' + m[2] + '-' + m[3] + 'T' + m[4] + ':' + m[5] + ':' + (m[6] || '00') : ''; }
def({
  id: 'dateTaken', label: 'Date and time taken', group: 'when', kind: 'datetime', hint: 'Local time where the photo was taken.',
  claims: [['e', 1, 0x9003], ['x', PS, 'DateCreated'], ['x', 'exif', 'DateTimeOriginal'], ['i', 55], ['i', 60]],
  read: function (d) {
    var i = iAll(d, 55)[0], t = iAll(d, 60)[0], iso = i && /^\d{8}$/.test(i) ? i.slice(0, 4) + '-' + i.slice(4, 6) + '-' + i.slice(6, 8) + 'T' + (t && /^\d{6}/.test(t) ? t.slice(0, 2) + ':' + t.slice(2, 4) + ':' + t.slice(4, 6) : '00:00:00') : '';
    return dateFrom(eStr(d, 1, 0x9003)) || dateFrom(xGet(d, PS, 'DateCreated')) || dateFrom(xGet(d, 'exif', 'DateTimeOriginal')) || iso;
  },
  write: function (d, v) {
    v = dateFrom(clean(v));
    if (clean(arguments[1]) && !v) fail('Date and time taken needs the form 2026-11-23 18:30:00.');
    eSet(d, 1, 0x9003, 2, v ? v.slice(0, 10).replace(/-/g, ':') + ' ' + v.slice(11) : '');
    xSet(d, PS, 'DateCreated', 'text', v);
    if (xFind(d, NS.exif, 'DateTimeOriginal') >= 0 || !v) xSet(d, 'exif', 'DateTimeOriginal', 'text', v);
    iSet(d, 55, v ? [v.slice(0, 10).replace(/-/g, '')] : []); iSet(d, 60, v ? [v.slice(11).replace(/:/g, '') + '+0000'] : []);
  }
});

textField('make', 'Camera make', 'camera', 'text', { x: ['tiff', 'Make', 'text'], e: [0, 0x010F], claims: [['x', 'tiff', 'Make'], ['e', 0, 0x010F]] });
textField('model', 'Camera model', 'camera', 'text', { x: ['tiff', 'Model', 'text'], e: [0, 0x0110], claims: [['x', 'tiff', 'Model'], ['e', 0, 0x0110]] });
textField('lens', 'Lens', 'camera', 'text', { x: ['exif', 'LensModel', 'text'], e: [1, 0xA434], claims: [['x', 'exif', 'LensModel'], ['e', 1, 0xA434]] });
textField('software', 'Software', 'camera', 'text', { x: ['xmp', 'CreatorTool', 'text'], e: [0, 0x0131], hint: 'The app that last saved the file.', claims: [['x', 'xmp', 'CreatorTool'], ['e', 0, 0x0131]] });
textField('serial', 'Camera serial number', 'camera', 'text', { x: ['aux', 'SerialNumber', 'text'], e: [1, 0xA431], hint: 'Can identify your exact camera. Delete it if you share publicly.', claims: [['x', 'aux', 'SerialNumber'], ['e', 1, 0xA431]] });
textField('owner', 'Camera owner', 'camera', 'text', { e: [1, 0xA430], claims: [['e', 1, 0xA430]] });
var ORI = { 1: 'Normal', 2: 'Mirrored', 3: 'Upside down', 4: 'Flipped', 5: 'Mirrored, turned left', 6: 'Turned right (90° clockwise)', 7: 'Mirrored, turned right', 8: 'Turned left (90° anticlockwise)' };
def({
  id: 'orientation', label: 'Orientation', group: 'camera', kind: 'pick', options: ORI, hint: 'How apps should rotate the picture when showing it.',
  claims: [['e', 0, 0x0112], ['x', 'tiff', 'Orientation']],
  read: function (d) { var v = eGet(d, 0, 0x0112); if (v) return String(v[0]); var x = xGet(d, 'tiff', 'Orientation'); return x ? String(x) : ''; },
  write: function (d, v) { v = clean(v); eSet(d, 0, 0x0112, 3, v ? [+v] : null); if (xFind(d, NS.tiff, 'Orientation') >= 0) xSet(d, 'tiff', 'Orientation', 'text', v); }
});

function rat(v, scale) { var n = Math.round(v * scale), g = gcd(Math.abs(n), scale); return [n / g, scale / g]; }
function ratNum(r) { return r && r[1] ? r[0] / r[1] : null; }
function numField(id, label, group, hint, o) {
  def({
    id: id, label: label, group: group, kind: 'text', hint: hint, placeholder: o.ph || '', claims: o.claims,
    read: function (d) { var v = eGet(d, o.ifd, o.tag); if (!v || !v.length) return ''; return o.show(v[0]); },
    write: function (d, v) {
      v = clean(v); if (!v) { eSet(d, o.ifd, o.tag, o.t, null); return; }
      var n = o.parse(v); if (n === null || !isFinite(n)) fail(label + ' needs a number' + (o.ph ? ' like ' + o.ph : '') + '.');
      eSet(d, o.ifd, o.tag, o.t, [o.make(n)]);
    }
  });
}
function plain(n) { return String(+n.toFixed(2)); }
numField('exposure', 'Shutter speed (seconds)', 'shot', 'For example 1/250 or 2.', { ifd: 1, tag: 0x829A, t: 5, ph: '1/250', claims: [['e', 1, 0x829A]],
  show: function (r) { var n = ratNum(r); return n === null ? '' : n && n < 1 ? '1/' + Math.round(1 / n) : plain(n); },
  parse: function (s) { var m = /^1\s*\/\s*(\d+(?:\.\d+)?)$/.exec(s); return m ? 1 / +m[1] : +s; },
  make: function (n) { return n < 1 && n > 0 ? [1, Math.round(1 / n)] : rat(n, 1000); } });
numField('aperture', 'Aperture (f-number)', 'shot', 'For example 1.8.', { ifd: 1, tag: 0x829D, t: 5, ph: '1.8', claims: [['e', 1, 0x829D]], show: function (r) { return plain(ratNum(r)); }, parse: function (s) { return +s.replace(/^f\/?/i, ''); }, make: function (n) { return rat(n, 10); } });
numField('iso', 'ISO', 'shot', '', { ifd: 1, tag: 0x8827, t: 3, ph: '200', claims: [['e', 1, 0x8827]], show: function (n) { return String(n); }, parse: function (s) { return Math.round(+s); }, make: function (n) { return n; } });
numField('focal', 'Focal length (mm)', 'shot', '', { ifd: 1, tag: 0x920A, t: 5, ph: '35', claims: [['e', 1, 0x920A]], show: function (r) { return plain(ratNum(r)); }, parse: function (s) { return +s.replace(/\s*mm$/i, ''); }, make: function (n) { return rat(n, 10); } });
numField('focal35', 'Focal length, 35 mm equivalent', 'shot', '', { ifd: 1, tag: 0xA405, t: 3, ph: '50', claims: [['e', 1, 0xA405]], show: function (n) { return String(n); }, parse: function (s) { return Math.round(+s); }, make: function (n) { return n; } });
numField('bias', 'Exposure compensation (EV)', 'shot', '', { ifd: 1, tag: 0x9204, t: 10, ph: '-0.7', claims: [['e', 1, 0x9204]], show: function (r) { return plain(ratNum(r)); }, parse: function (s) { return +s; }, make: function (n) { return rat(n, 100); } });

def({
  id: 'comment', label: 'Comment', group: 'about', kind: 'area', hint: 'A free note stored with the picture.',
  claims: [['e', 1, 0x9286]],
  read: function (d) {
    var b = eGet(d, 1, 0x9286); if (!b || typeof b === 'string') return ''; var pre = ascii(b, 0, 8), body = b.subarray(8);
    if (pre === 'UNICODE\0') { var s = ''; for (var i = 0; i + 1 < body.length; i += 2) s += String.fromCharCode(d.le ? body[i] | (body[i + 1] << 8) : (body[i] << 8) | body[i + 1]); return s.replace(/\0+$/, '').trim(); }
    return utf8(body, 0, body.length).replace(/\0+$/, '').trim();
  },
  write: function (d, v) {
    v = clean(v); if (!v) { delete d.exif[1][0x9286]; return; }
    if (/^[\x20-\x7e\n]*$/.test(v)) { eSet(d, 1, 0x9286, 7, concat([enc('ASCII\0\0\0'), enc(v)])); return; }
    var b = new Uint8Array(8 + v.length * 2); b.set(enc('UNICODE\0'));
    for (var i = 0; i < v.length; i++) { var c = v.charCodeAt(i); if (d.le) { b[8 + i * 2] = c & 255; b[9 + i * 2] = c >> 8; } else { b[8 + i * 2] = c >> 8; b[9 + i * 2] = c & 255; } }
    eSet(d, 1, 0x9286, 7, b);
  }
});

/* GPS */
function dms(a, ref) {
  if (!a || a.length < 3) return null;
  var v = ratNum(a[0]) + ratNum(a[1]) / 60 + ratNum(a[2]) / 3600;
  return (ref === 'S' || ref === 'W') ? -v : v;
}
function toDms(v) {
  v = Math.abs(v); var d = Math.floor(v), m = Math.floor((v - d) * 60), s = Math.round(((v - d) * 60 - m) * 60 * 10000);
  if (s >= 600000) { s -= 600000; m++; } if (m >= 60) { m -= 60; d++; }
  return [[d, 1], [m, 1], [s, 10000]];
}
function parseCoords(s) {
  var nums = s.replace(/[°]/g, ' ').match(/-?\d+(?:\.\d+)?/g), dirs = s.toUpperCase().match(/[NSEW]/g) || [];
  if (!nums || nums.length !== 2) fail('Location needs two numbers, latitude then longitude, like 28.6139, 77.2090.');
  var lat = +nums[0], lon = +nums[1];
  if (dirs.indexOf('S') >= 0) lat = -Math.abs(lat); if (dirs.indexOf('W') >= 0) lon = -Math.abs(lon);
  if (Math.abs(lat) > 90) fail('Latitude must be between -90 and 90.');
  if (Math.abs(lon) > 180) fail('Longitude must be between -180 and 180.');
  return { lat: lat, lon: lon };
}
function coords(d) {
  var lat = dms(eGet(d, 2, 2), eStr(d, 2, 1)), lon = dms(eGet(d, 2, 4), eStr(d, 2, 3));
  if (lat === null || lon === null || !isFinite(lat) || !isFinite(lon)) {
    var xl = xGet(d, 'exif', 'GPSLatitude'), xo = xGet(d, 'exif', 'GPSLongitude');
    var f = function (s, neg) { var m = s && /^(\d+),(\d+(?:\.\d+)?)([NSEW])$/.exec(s); return m ? (+m[1] + m[2] / 60) * (m[3] === neg ? -1 : 1) : null; };
    lat = f(xl, 'S'); lon = f(xo, 'W');
    if (lat === null || lon === null) return null;
  }
  return (lat || lon) ? { lat: lat, lon: lon } : null;
}
function dropXmpGps(d) { d.xmp = d.xmp.filter(function (x) { return !(x.uri === NS.exif && /^GPS/.test(x.local)); }); }
def({
  id: 'gps', label: 'Location (latitude, longitude)', group: 'place', kind: 'text', placeholder: '28.6139, 77.2090', hint: 'Decimal degrees. Delete it to remove the location from the photo for good.',
  claims: [['e', 2, '*'], ['x', 'exif', 'GPS*']],
  read: function (d) { var c = coords(d); return c ? c.lat.toFixed(6) + ', ' + c.lon.toFixed(6) : ''; },
  write: function (d, v) {
    v = clean(v);
    if (!v) { d.exif[2] = {}; dropXmpGps(d); return; }
    var c = parseCoords(v), g = d.exif[2];
    dropXmpGps(d);
    if (!g[0]) g[0] = { t: 1, v: Uint8Array.from([2, 3, 0, 0]) };
    g[1] = { t: 2, v: c.lat < 0 ? 'S' : 'N' }; g[2] = { t: 5, v: toDms(c.lat) };
    g[3] = { t: 2, v: c.lon < 0 ? 'W' : 'E' }; g[4] = { t: 5, v: toDms(c.lon) };
  }
});
def({
  id: 'altitude', label: 'Altitude (metres)', group: 'place', kind: 'text', placeholder: '920', claims: [],
  read: function (d) { var a = eGet(d, 2, 6); if (!a || !a.length) return ''; var ref = eGet(d, 2, 5); return plain(ratNum(a[0]) * (ref && ref[0] === 1 ? -1 : 1)); },
  write: function (d, v) {
    v = clean(v); if (!v) { delete d.exif[2][6]; delete d.exif[2][5]; return; }
    var n = +v; if (!isFinite(n)) fail('Altitude needs a number of metres.');
    if (!d.exif[2][0]) d.exif[2][0] = { t: 1, v: Uint8Array.from([2, 3, 0, 0]) };
    d.exif[2][6] = { t: 5, v: [rat(Math.abs(n), 100)] }; d.exif[2][5] = { t: 1, v: Uint8Array.from([n < 0 ? 1 : 0]) };
  }
});
def({
  id: 'direction', label: 'Direction the camera faced (°)', group: 'place', kind: 'text', placeholder: '90', claims: [],
  read: function (d) { var a = eGet(d, 2, 0x11); return a && a.length ? plain(ratNum(a[0])) : ''; },
  write: function (d, v) {
    v = clean(v); if (!v) { delete d.exif[2][0x11]; delete d.exif[2][0x10]; return; }
    var n = +v; if (!isFinite(n) || n < 0 || n >= 360) fail('Direction needs a number from 0 to 359.99.');
    if (!d.exif[2][0]) d.exif[2][0] = { t: 1, v: Uint8Array.from([2, 3, 0, 0]) };
    d.exif[2][0x11] = { t: 5, v: [rat(n, 100)] }; d.exif[2][0x10] = { t: 2, v: 'T' };
  }
});

var GROUPS = [['about', 'About the picture'], ['when', 'When'], ['place', 'Where'], ['camera', 'Camera and software'], ['shot', 'Exposure settings']];

function fields(doc) {
  return FIELDS.map(function (f) {
    return { id: f.id, label: f.label, group: f.group, kind: f.kind, hint: f.hint || '', placeholder: f.placeholder || '', options: f.options || null, value: f.read(doc) };
  });
}
function getField(doc, id) { return BYID[id].read(doc); }
function setField(doc, id, v) { BYID[id].write(doc, v); }
function delField(doc, id) { BYID[id].write(doc, ''); }

/* ===================== everything else ===================== */
var ETAG = {
  0x0100: 'Image width', 0x0101: 'Image height', 0x0102: 'Bits per sample', 0x0103: 'Compression', 0x0106: 'Colour type', 0x010E: 'Description', 0x0111: 'Strip offsets', 0x0115: 'Samples per pixel',
  0x0116: 'Rows per strip', 0x0117: 'Strip byte counts', 0x011A: 'Horizontal resolution', 0x011B: 'Vertical resolution', 0x011C: 'Planar configuration', 0x0128: 'Resolution unit', 0x0132: 'Date modified', 0x013D: 'Predictor', 0x013E: 'White point',
  0x013F: 'Primary chromaticities', 0x0211: 'YCbCr coefficients', 0x0212: 'YCbCr sub-sampling', 0x0213: 'YCbCr positioning', 0x0214: 'Reference black and white', 0x9000: 'EXIF version', 0x9003: 'Date taken',
  0x9004: 'Date digitised', 0x9010: 'Time zone (modified)', 0x9011: 'Time zone (taken)', 0x9012: 'Time zone (digitised)', 0x9101: 'Colour components', 0x9102: 'Compressed bits per pixel', 0x9201: 'Shutter speed value',
  0x9202: 'Aperture value', 0x9203: 'Brightness', 0x9205: 'Max aperture', 0x9206: 'Subject distance', 0x9207: 'Metering mode', 0x9208: 'Light source', 0x9209: 'Flash', 0x927C: 'Maker notes (camera brand data)',
  0x9290: 'Sub-second time', 0x9291: 'Sub-second time (taken)', 0x9292: 'Sub-second time (digitised)', 0xA000: 'Flashpix version', 0xA001: 'Colour space', 0xA002: 'Pixel width', 0xA003: 'Pixel height',
  0xA20E: 'Focal plane X resolution', 0xA20F: 'Focal plane Y resolution', 0xA210: 'Focal plane unit', 0xA217: 'Sensing method', 0xA300: 'File source', 0xA301: 'Scene type', 0xA401: 'Custom rendered',
  0xA402: 'Exposure mode', 0xA403: 'White balance', 0xA404: 'Digital zoom', 0xA406: 'Scene capture type', 0xA407: 'Gain control', 0xA408: 'Contrast', 0xA409: 'Saturation', 0xA40A: 'Sharpness',
  0xA40C: 'Subject distance range', 0xA420: 'Unique image ID', 0xA432: 'Lens specification', 0xA433: 'Lens make', 0xA435: 'Lens serial number', 0x8822: 'Exposure program', 0x8824: 'Spectral sensitivity',
  0x8830: 'Sensitivity type', 0x8832: 'Recommended exposure index', 0x9C9C: 'Windows comment', 0x9C9F: 'Windows subject', 0xC4A5: 'Print Image Matching', 0x0214: 'Reference black and white',
  0xA460: 'Composite image', 0xA500: 'Gamma', 0xEA1C: 'Padding'
};
var TECH = { 0x0100: 1, 0x0101: 1, 0x0102: 1, 0x0103: 1, 0x0106: 1, 0x0111: 1, 0x0115: 1, 0x0116: 1, 0x0117: 1, 0x011A: 1, 0x011B: 1, 0x011C: 1, 0x0128: 1, 0x0213: 1, 0x9000: 1, 0x9101: 1, 0xA000: 1, 0xA001: 1, 0xA002: 1, 0xA003: 1, 0x0212: 1, 0x0211: 1, 0x0214: 1, 0xEA1C: 1 };
var GPSN = { 0: 'GPS version', 7: 'GPS time', 8: 'GPS satellites', 9: 'GPS status', 0x12: 'GPS map datum', 0x1D: 'GPS date', 0x1B: 'GPS processing method', 0x1C: 'GPS area name', 0x0D: 'GPS speed', 0x0C: 'GPS speed unit' };
var INAME = { 1: { 90: 'Character set' }, 2: { 5: 'Object name', 7: 'Edit status', 10: 'Urgency', 12: 'Subject reference', 15: 'Category', 20: 'Supplemental category', 40: 'Special instructions', 85: 'Byline title', 103: 'Original transmission reference', 105: 'Headline', 122: 'Caption writer', 118: 'Contact', 135: 'Language' } };

function claimed(doc, kind, a, b) {
  for (var i = 0; i < FIELDS.length; i++) {
    var cl = FIELDS[i].claims;
    for (var j = 0; j < cl.length; j++) {
      var c = cl[j];
      if (c[0] !== kind) continue;
      if (kind === 'e' && c[1] === a && (c[2] === '*' || c[2] === b)) return true;
      if (kind === 'i' && a === 2 && c[1] === b) return true;
      if (kind === 'p' && c[1] === a) return true;
      if (kind === 'x') {
        var uri = NS[c[1]];
        if (uri === a && (c[2] === b || (c[2].slice(-1) === '*' && b.indexOf(c[2].slice(0, -1)) === 0))) return true;
      }
    }
  }
  return false;
}
function show(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (v instanceof Uint8Array) { var printable = true, s = ''; for (var i = 0; i < v.length && i < 60; i++) { if (v[i] === 0 && i === v.length - 1) break; if (v[i] < 32 || v[i] > 126) { printable = false; break; } s += String.fromCharCode(v[i]); } return printable && s ? s : v.length + ' bytes'; }
  if (Array.isArray(v)) return v.slice(0, 8).map(function (x) { return Array.isArray(x) ? (x[1] ? +(x[0] / x[1]).toFixed(4) : 0) : x; }).join(', ') + (v.length > 8 ? ' …' : '');
  return String(v);
}
function others(doc) {
  var rows = [];
  [0, 1, 2].forEach(function (ifd) {
    Object.keys(doc.exif[ifd]).map(Number).forEach(function (tag) {
      if (claimed(doc, 'e', ifd, tag)) return;
      var name = ifd === 2 ? GPSN[tag] : ETAG[tag];
      rows.push({ id: 'e:' + ifd + ':' + tag, label: name || ('EXIF tag 0x' + tag.toString(16).toUpperCase()), value: show(doc.exif[ifd][tag].v), tech: !!TECH[tag] && ifd !== 2, src: 'EXIF' });
    });
  });
  doc.iptc.forEach(function (x, k) {
    if ((x.r === 1 && x.d === 90) || (x.r === 2 && x.d === 0)) return;
    if (x.r === 2 && claimed(doc, 'i', 2, x.d)) return;
    rows.push({ id: 'i:' + k, label: (INAME[x.r] && INAME[x.r][x.d]) || ('IPTC ' + x.r + ':' + x.d), value: utf8(x.b, 0, x.b.length), src: 'IPTC' });
  });
  doc.xmp.forEach(function (x, k) {
    if (claimed(doc, 'x', x.uri, x.local)) return;
    var p = prefixOf(x.uri);
    rows.push({ id: 'x:' + k, label: (p ? p + ':' : '') + x.local, value: x.kind === 'opaque' ? 'Structured data' : show(x.kind === 'alt' ? x.val.map(function (l) { return l.text; }) : x.val), src: 'XMP' });
  });
  doc.text.forEach(function (t, k) {
    if (!t.locked && claimed(doc, 'p', t.key)) return;
    rows.push({ id: 'p:' + k, label: t.key + ' (PNG text note)', value: t.val.length > 300 ? t.val.slice(0, 300) + '…' : t.val, src: 'PNG' });
  });
  doc.com.forEach(function (c) { rows.push({ id: 'c:' + c.k, label: 'JPEG comment', value: c.text, src: 'JPEG' }); });
  doc.vendor.forEach(function (v) { rows.push({ id: 's:' + v.k, label: 'Vendor data block (' + v.name + ')', value: v.size + ' bytes', src: 'JPEG' }); });
  if (doc.time) rows.push({ id: 't:time', label: 'Last changed (PNG time)', value: doc.time.v, src: 'PNG' });
  return rows;
}
function delOther(doc, id) {
  var p = id.split(':'), k = +p[1];
  if (p[0] === 'e') delete doc.exif[+p[1]][+p[2]];
  else if (p[0] === 'i') doc.iptc.splice(k, 1);
  else if (p[0] === 'x') doc.xmp.splice(k, 1);
  else if (p[0] === 'p') doc.text.splice(k, 1);
  else if (p[0] === 'c') doc.drop[k] = 1, doc.com = doc.com.filter(function (c) { return c.k !== k; });
  else if (p[0] === 's') doc.drop[k] = 1, doc.vendor = doc.vendor.filter(function (v) { return v.k !== k; });
  else if (p[0] === 't') { doc.drop[doc.time.k] = 1; doc.time = null; }
}

/* Remove everything. Colour profile and the picture itself stay. Orientation can stay so the photo does not turn sideways. */
function strip(doc, opt) {
  var ori = eGet(doc, 0, 0x0112);
  doc.exif = emptyExif(); doc.iptc = []; doc.psOther = []; doc.xmp = []; doc.text = []; doc.thumb = false; doc.time = null;
  doc.com.forEach(function (c) { doc.drop[c.k] = 1; }); doc.com = [];
  doc.vendor.forEach(function (v) { doc.drop[v.k] = 1; }); doc.vendor = [];
  if (doc.chunks) doc.chunks.forEach(function (c, k) { if (c.type === 'tIME') doc.drop[k] = 1; });
  if (opt && opt.keepOrientation && ori && ori[0] > 1) doc.exif[0][0x0112] = { t: 3, v: [ori[0]] };
}
function isEmpty(doc) { return !fields(doc).some(function (f) { return f.value; }) && !others(doc).length; }

function clone(doc) { var c = Object.assign({}, doc); c.exif = JSON.parse(JSON.stringify(doc.exif, rep), rev); c.iptc = doc.iptc.map(function (x) { return { r: x.r, d: x.d, b: x.b.slice() }; }); c.psOther = doc.psOther.slice(); c.xmp = JSON.parse(JSON.stringify(doc.xmp)); c.text = doc.text.map(function (t) { return Object.assign({}, t); }); c.com = doc.com.slice(); c.vendor = doc.vendor.slice(); c.drop = Object.assign({}, doc.drop); c.warnings = doc.warnings.slice(); return c; }
function rep(k, v) { return v instanceof Uint8Array ? { __u8: Array.from(v) } : v; }
function rev(k, v) { return v && v.__u8 ? Uint8Array.from(v.__u8) : v; }

/* Copy chosen friendly fields from one photo to another. Fields that are empty in the source are skipped. */
function copyFields(src, dst, ids) {
  var n = 0;
  (ids || FIELDS.map(function (f) { return f.id; })).forEach(function (id) { var v = BYID[id].read(src); if (v) { BYID[id].write(dst, v); n++; } });
  return n;
}

/* ===================== write ===================== */
function exifBytes(doc) { return buildTiff(doc.exif, doc.le); }
function app1(sig, data) {
  var len = 2 + sig.length + data.length;
  if (len > 65535) fail('The metadata is too big to fit in a JPEG. Delete some of the large fields, such as maker notes, and try again.');
  return concat([Uint8Array.from([0xFF, 0xE1, len >> 8, len & 255]), sig, data]);
}
function writeJpeg(doc) {
  var u8 = doc.u8, segs = doc.segs, parts = [u8.subarray(0, 2)], sos = null, k, inserted = false;
  var sof = segs.filter(function (g) { return g.m >= 0xC0 && g.m <= 0xCF && g.m !== 0xC4 && g.m !== 0xC8 && g.m !== 0xCC; })[0];
  if (sof && Object.keys(doc.exif[1]).length && !doc.exif[1][0xA002]) {   // EXIF asks for the pixel size
    doc.exif[1][0xA002] = { t: 4, v: [(u8[sof.d + 3] << 8) | u8[sof.d + 4]] }; doc.exif[1][0xA003] = { t: 4, v: [(u8[sof.d + 1] << 8) | u8[sof.d + 2]] };
  }
  var tiff = exifBytes(doc), xml = buildXmp(doc), a13 = buildApp13(doc);
  var meta = [];
  if (tiff) meta.push(app1(enc('Exif\0\0'), tiff));
  if (xml) meta.push(app1(enc('http://ns.adobe.com/xap/1.0/\0'), enc(xml)));
  if (a13) { var l = a13.length + 2; if (l > 65535) fail('The IPTC data is too big for a JPEG.'); meta.push(concat([Uint8Array.from([0xFF, 0xED, l >> 8, l & 255]), a13])); }
  function put() { if (!inserted) { meta.forEach(function (m) { parts.push(m); }); inserted = true; } }
  for (k = 0; k < segs.length; k++) {
    var sg = segs[k];
    if (sg.sos) { sos = sg; break; }
    if (sg.m !== 0xE0) put();
    var m = sg.m, drop = doc.drop[k] || m === 0xE1 || m === 0xED || m === 0xFE || (m === 0xE2 && starts(u8, sg.d, 'MPF'));
    if (!drop) parts.push(u8.subarray(sg.s, sg.e));
  }
  put();
  if (sos) parts.push(u8.subarray(sos.s, jpegEnd(u8, sos.e)));
  return concat(parts);
}
function textChunk(t) {
  var latin = /^[\x00-\xff]*$/.test(t.val) && /^[\x20-\x7e\xa1-\xff]+$/.test(t.key);
  if (latin && t.val.indexOf('\0') < 0) { var v = new Uint8Array(t.val.length); for (var i = 0; i < v.length; i++) v[i] = t.val.charCodeAt(i); return pngChunk('tEXt', concat([enc(t.key), new Uint8Array(1), v])); }
  return pngChunk('iTXt', concat([enc(t.key), Uint8Array.from([0, 0, 0, 0, 0]), enc(t.val)]));
}
function writePng(doc) {
  var u8 = doc.u8, parts = [u8.subarray(0, 8)], meta = [], tiff = exifBytes(doc), xml = buildXmp(doc);
  if (tiff) meta.push(pngChunk('eXIf', tiff));
  if (xml) meta.push(pngChunk('iTXt', concat([enc('XML:com.adobe.xmp'), Uint8Array.from([0, 0, 0, 0, 0]), enc(xml)])));
  doc.text.forEach(function (t) { if (!t.locked) meta.push(textChunk(t)); });
  doc.chunks.forEach(function (c, k) {
    if (c.type === 'eXIf' || c.type === 'tEXt' || doc.drop[k]) return;
    if (c.type === 'iTXt' || c.type === 'zTXt') { if (doc.text.some(function (t) { return t.k === k && t.locked; })) parts.push(u8.subarray(c.s, c.e)); return; }
    parts.push(u8.subarray(c.s, c.e));
    if (c.type === 'IHDR') meta.forEach(function (m) { parts.push(m); });
  });
  return concat(parts);
}
function writeWebp(doc) {
  var u8 = doc.u8, chunks = doc.chunks, tiff = exifBytes(doc), xml = buildXmp(doc), vp8x = null, body = [], i;
  var w = 0, h = 0, alpha = false, anim = false, icc = false;
  chunks.forEach(function (c) {
    if (c.type === 'VP8X') { vp8x = c; return; }
    if (c.type === 'EXIF' || c.type === 'XMP ') return;
    if (c.type === 'ICCP') icc = true;
    if (c.type === 'ALPH') alpha = true;
    if (c.type === 'ANIM') anim = true;
    if (c.type === 'VP8 ' && !w) { w = (u8[c.d + 6] | (u8[c.d + 7] << 8)) & 0x3fff; h = (u8[c.d + 8] | (u8[c.d + 9] << 8)) & 0x3fff; }
    if (c.type === 'VP8L' && !w) { var b = (u8[c.d + 1] | (u8[c.d + 2] << 8) | (u8[c.d + 3] << 16) | (u8[c.d + 4] << 24)) >>> 0; w = (b & 0x3fff) + 1; h = ((b >>> 14) & 0x3fff) + 1; if ((b >>> 28) & 1) alpha = true; }
    body.push(u8.slice(c.s, c.e));
  });
  var head = null;
  if (vp8x) {
    head = u8.slice(vp8x.s, vp8x.e);
    head[8] = (head[8] & ~0x0C) | (tiff ? 0x08 : 0) | (xml ? 0x04 : 0);
  } else if (tiff || xml) {
    var p = new Uint8Array(10); p[0] = (icc ? 0x20 : 0) | (alpha ? 0x10 : 0) | (tiff ? 0x08 : 0) | (xml ? 0x04 : 0) | (anim ? 0x02 : 0);
    p[4] = (w - 1) & 255; p[5] = ((w - 1) >> 8) & 255; p[6] = ((w - 1) >> 16) & 255; p[7] = (h - 1) & 255; p[8] = ((h - 1) >> 8) & 255; p[9] = ((h - 1) >> 16) & 255;
    head = webpChunk('VP8X', p);
  }
  var parts = []; if (head) parts.push(head);
  for (i = 0; i < body.length; i++) parts.push(body[i]);
  if (tiff) parts.push(webpChunk('EXIF', tiff));
  if (xml) parts.push(webpChunk('XMP ', enc(xml)));
  var size = 4; parts.forEach(function (x) { size += x.length; });
  var hd = new Uint8Array(12); hd.set(enc('RIFF')); hd[4] = size & 255; hd[5] = (size >> 8) & 255; hd[6] = (size >> 16) & 255; hd[7] = (size >>> 24) & 255; hd.set(enc('WEBP'), 8);
  return concat([hd].concat(parts));
}
function write(doc) {
  doc.thumb = false;
  if (doc.fmt === 'jpeg') return writeJpeg(doc);
  if (doc.fmt === 'png') return writePng(doc);
  return writeWebp(doc);
}

/* ZIP with no compression, enough for a batch download */
function zip(entries) {
  var local = [], central = [], off = 0, i, now = new Date();
  var dt = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate(), tm = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  entries.forEach(function (e) {
    var name = enc(e.name), crc = crc32(e.data), lh = new Uint8Array(30 + name.length), dv = new DataView(lh.buffer);
    dv.setUint32(0, 0x04034b50, true); dv.setUint16(4, 20, true); dv.setUint16(6, 0x0800, true); dv.setUint16(10, tm, true); dv.setUint16(12, dt, true);
    dv.setUint32(14, crc, true); dv.setUint32(18, e.data.length, true); dv.setUint32(22, e.data.length, true); dv.setUint16(26, name.length, true); lh.set(name, 30);
    var ch = new Uint8Array(46 + name.length), cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true); cv.setUint16(12, tm, true); cv.setUint16(14, dt, true);
    cv.setUint32(16, crc, true); cv.setUint32(20, e.data.length, true); cv.setUint32(24, e.data.length, true); cv.setUint16(28, name.length, true); cv.setUint32(42, off, true); ch.set(name, 46);
    local.push(lh, e.data); central.push(ch); off += lh.length + e.data.length;
  });
  var cd = concat(central), end = new Uint8Array(22), ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, entries.length, true); ev.setUint16(10, entries.length, true); ev.setUint32(12, cd.length, true); ev.setUint32(16, off, true);
  return concat(local.concat([cd, end]));
}

root.ExifKit = { read: read, write: write, fields: fields, getField: getField, setField: setField, delField: delField, others: others, delOther: delOther, strip: strip, isEmpty: isEmpty, clone: clone, copyFields: copyFields, coords: coords, zip: zip, GROUPS: GROUPS, ORIENTATION: ORI };
if (typeof module !== 'undefined' && module.exports) module.exports = root.ExifKit;
})(typeof window !== 'undefined' ? window : globalThis);
