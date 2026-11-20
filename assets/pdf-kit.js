/* PDF Kit: a small, first-party PDF reader and writer for the merge / split / sign tool (/tools/pdf-merge-split-sign).
   No third-party code. It reads the structure of a PDF (cross-reference tables and streams, object streams),
   copies pages between documents without re-encoding their content, and writes a new file. The browser's own
   CompressionStream / DecompressionStream do the deflate work. Pages are viewed with the pdf.js already in assets/vendor.
   Not supported on purpose: encrypted files (the tool says so), digital-certificate signatures. */
(function (root) {
  'use strict';

  /* ---------- value types ---------- */
  function Name(n) { this.name = n; }
  function Ref(num, gen) { this.num = num; this.gen = gen || 0; }
  function Str(raw) { this.raw = raw; }           // raw = the token as written, parentheses or angle brackets included
  function Stream(dict, raw) { this.dict = dict; this.raw = raw; }
  var isDict = function (v) { return v instanceof Map; };

  var WS = { 0: 1, 9: 1, 10: 1, 12: 1, 13: 1, 32: 1 };
  var DELIM = { 40: 1, 41: 1, 60: 1, 62: 1, 91: 1, 93: 1, 123: 1, 125: 1, 47: 1, 37: 1 };

  function latin1(u8, a, b) {
    var s = '', i = a, step = 8192;
    while (i < b) { s += String.fromCharCode.apply(null, u8.subarray(i, Math.min(b, i + step))); i += step; }
    return s;
  }
  function bytes(s) { var u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255; return u; }
  function concat(list) {
    var n = 0, i; for (i = 0; i < list.length; i++) n += list[i].length;
    var out = new Uint8Array(n), p = 0;
    for (i = 0; i < list.length; i++) { out.set(list[i], p); p += list[i].length; }
    return out;
  }

  /* ---------- parser ---------- */
  function Parser(buf, pos, doc) { this.b = buf; this.p = pos || 0; this.doc = doc; }
  Parser.prototype.ws = function () {
    var b = this.b;
    for (;;) {
      var c = b[this.p];
      if (WS[c]) this.p++;
      else if (c === 37) { while (this.p < b.length && b[this.p] !== 10 && b[this.p] !== 13) this.p++; }
      else break;
    }
  };
  Parser.prototype.token = function () {          // a bare word: number, keyword
    var b = this.b, s = this.p;
    while (this.p < b.length && !WS[b[this.p]] && !DELIM[b[this.p]]) this.p++;
    return latin1(b, s, this.p);
  };
  Parser.prototype.int = function () {            // an unsigned integer token, or null (position kept)
    var save = this.p; this.ws();
    var t = this.token();
    if (/^\d+$/.test(t)) return parseInt(t, 10);
    this.p = save; return null;
  };
  Parser.prototype.object = function () {
    this.ws();
    var b = this.b, c = b[this.p];
    if (c === undefined) throw new Error('unexpected end');
    if (c === 47) {                                 // name
      this.p++; var s = this.p;
      while (this.p < b.length && !WS[b[this.p]] && !DELIM[b[this.p]]) this.p++;
      return new Name(latin1(b, s, this.p).replace(/#([0-9a-fA-F]{2})/g, function (m, h) { return String.fromCharCode(parseInt(h, 16)); }));
    }
    if (c === 40) {                                 // literal string, kept as written
      var s2 = this.p, depth = 0;
      for (; this.p < b.length; this.p++) {
        var d = b[this.p];
        if (d === 92) this.p++;
        else if (d === 40) depth++;
        else if (d === 41) { depth--; if (!depth) { this.p++; break; } }
      }
      return new Str(latin1(b, s2, this.p));
    }
    if (c === 60 && b[this.p + 1] === 60) {         // dictionary
      this.p += 2; var m = new Map();
      for (;;) {
        this.ws();
        if (b[this.p] === 62 && b[this.p + 1] === 62) { this.p += 2; break; }
        if (b[this.p] !== 47) throw new Error('bad dictionary key');
        var k = this.object().name;
        m.set(k, this.object());
      }
      return m;
    }
    if (c === 60) {                                 // hex string
      var s3 = this.p; while (this.p < b.length && b[this.p] !== 62) this.p++;
      this.p++; return new Str(latin1(b, s3, this.p));
    }
    if (c === 91) {                                 // array
      this.p++; var a = [];
      for (;;) { this.ws(); if (b[this.p] === 93) { this.p++; break; } a.push(this.object()); }
      return a;
    }
    var t = this.token();
    if (!t) { this.p++; throw new Error('bad token'); }
    if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(t)) {
      if (/^\d+$/.test(t)) {                        // maybe "n g R"
        var save = this.p, g = this.int();
        if (g !== null) { this.ws(); if (b[this.p] === 82 && (WS[b[this.p + 1]] || DELIM[b[this.p + 1]] || b[this.p + 1] === undefined)) { this.p++; return new Ref(parseInt(t, 10), g); } }
        this.p = save;
      }
      return parseFloat(t);
    }
    if (t === 'true') return true;
    if (t === 'false') return false;
    if (t === 'null') return null;
    throw new Error('unknown token ' + t);
  };
  // "12 0 obj ... endobj" at the current position; returns {num, gen, value}
  Parser.prototype.indirect = function () {
    var num = this.int(), gen = this.int();
    if (num === null || gen === null) throw new Error('not an object');
    this.ws(); if (this.token() !== 'obj') throw new Error('missing obj');
    var v = this.object(), b = this.b;
    if (isDict(v)) {
      var save = this.p; this.ws();
      if (b[this.p] === 115 && latin1(b, this.p, this.p + 6) === 'stream') {
        this.p += 6;
        if (b[this.p] === 13) this.p++;
        if (b[this.p] === 10) this.p++;
        var start = this.p, len = v.get('Length');
        if (len instanceof Ref && this.doc) { try { len = this.doc.get(len); } catch (e) { len = null; } }
        var end = -1;
        if (typeof len === 'number' && len >= 0 && start + len <= b.length) {
          var q = start + len; while (WS[b[q]]) q++;
          if (latin1(b, q, q + 9) === 'endstream') end = start + len;
        }
        if (end < 0) {                              // wrong /Length: search for the end marker
          var s = latin1(b, start, b.length), i = s.indexOf('endstream');
          if (i < 0) throw new Error('unterminated stream');
          end = start + i;
          if (b[end - 1] === 10) end--; if (b[end - 1] === 13) end--;
        }
        this.p = end;
        v = new Stream(v, b.subarray(start, end));
      } else this.p = save;
    }
    return { num: num, gen: gen, value: v };
  };

  /* ---------- deflate and predictors ---------- */
  function pipe(Ctor, data) {
    var s = new Ctor('deflate'), w = s.writable.getWriter();
    w.write(data).catch(function () {}); w.close().catch(function () {});
    return new Response(s.readable).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
  }
  function inflate(u8) { return pipe(DecompressionStream, u8); }
  function deflate(u8) { return pipe(CompressionStream, u8); }

  function unpredict(data, parms) {
    var pred = parms && parms.get('Predictor');
    if (!pred || pred < 10) return data;
    var colors = parms.get('Colors') || 1, bpc = parms.get('BitsPerComponent') || 8, cols = parms.get('Columns') || 1;
    var bpp = Math.max(1, (colors * bpc) >> 3), rowLen = (colors * bpc * cols + 7) >> 3;
    var rows = Math.floor(data.length / (rowLen + 1)), out = new Uint8Array(rows * rowLen);
    for (var r = 0; r < rows; r++) {
      var ft = data[r * (rowLen + 1)], src = r * (rowLen + 1) + 1, dst = r * rowLen, prev = dst - rowLen;
      for (var i = 0; i < rowLen; i++) {
        var x = data[src + i], a = i >= bpp ? out[dst + i - bpp] : 0, up = r ? out[prev + i] : 0, c = (r && i >= bpp) ? out[prev + i - bpp] : 0, v;
        if (ft === 0) v = x;
        else if (ft === 1) v = x + a;
        else if (ft === 2) v = x + up;
        else if (ft === 3) v = x + ((a + up) >> 1);
        else if (ft === 4) { var p = a + up - c, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? up : c); }
        else v = x;
        out[dst + i] = v & 255;
      }
    }
    return out;
  }
  function filterNames(dict) {
    var f = dict.get('Filter'); if (f == null) return [];
    return (Array.isArray(f) ? f : [f]).map(function (n) { return n instanceof Name ? n.name : ''; });
  }
  function decodeStream(st) {                       // only Flate (what xref and object streams use)
    var f = filterNames(st.dict), parms = st.dict.get('DecodeParms');
    if (Array.isArray(parms)) parms = parms[0];
    if (!f.length) return Promise.resolve(st.raw);
    if (f.length > 1 || (f[0] !== 'FlateDecode' && f[0] !== 'Fl')) return Promise.reject(new Error('unsupported filter ' + f.join(',')));
    return inflate(st.raw).then(function (d) { return unpredict(d, isDict(parms) ? parms : null); });
  }

  /* ---------- document ---------- */
  function PdfDoc(buf) {
    this.buf = buf; this.xref = new Map(); this.cache = new Map(); this.trailer = null; this.pages = [];
  }
  PdfDoc.prototype.get = function (v) {
    var seen = 0;
    while (v instanceof Ref) {
      if (++seen > 40) return null;
      var num = v.num;
      if (this.cache.has(num)) { v = this.cache.get(num); continue; }
      var e = this.xref.get(num), val = null;
      if (e && e.t === 1) {
        try { var o = new Parser(this.buf, e.off, this).indirect(); val = o.num === num ? o.value : null; if (o.num !== num) throw new Error('xref mismatch'); }
        catch (err) { val = null; }
      }
      this.cache.set(num, val); v = val;
    }
    return v;
  };

  PdfDoc.prototype.readXref = async function () {
    var b = this.buf, tail = latin1(b, Math.max(0, b.length - 2048), b.length), i = tail.lastIndexOf('startxref');
    if (i < 0) throw new Error('no startxref');
    var off = parseInt(tail.slice(i + 9).trim(), 10), seen = {}, self = this;
    if (!(off >= 0)) throw new Error('bad startxref');
    async function section(pos) {
      if (seen[pos]) return null; seen[pos] = 1;
      var ps = new Parser(b, pos, self); ps.ws();
      var trailer;
      if (latin1(b, ps.p, ps.p + 4) === 'xref') {
        ps.p += 4;
        for (;;) {
          ps.ws();
          if (b[ps.p] === 116) break;               // "trailer"
          var start = ps.int(), count = ps.int();
          if (start === null || count === null) throw new Error('bad xref table');
          for (var k = 0; k < count; k++) {
            var o = ps.int(), g = ps.int(); ps.ws(); var f = ps.token();
            if (o === null || g === null) throw new Error('bad xref entry');
            if (f === 'n' && !self.xref.has(start + k)) self.xref.set(start + k, { t: 1, off: o });
            else if (f === 'f' && !self.xref.has(start + k)) self.xref.set(start + k, { t: 0 });
          }
        }
        ps.token(); trailer = ps.object();
        var xs = trailer.get('XRefStm');
        if (typeof xs === 'number') await section(xs);
      } else {
        var obj = ps.indirect(), st = obj.value;
        if (!(st instanceof Stream)) throw new Error('bad xref stream');
        trailer = st.dict;
        var data = await decodeStream(st), w = trailer.get('W'), size = trailer.get('Size'), index = trailer.get('Index') || [0, size];
        var rl = w[0] + w[1] + w[2], p = 0;
        var rd = function (n) { var v = 0; for (var q = 0; q < n; q++) v = v * 256 + data[p++]; return v; };
        for (var s = 0; s < index.length; s += 2) {
          for (var n = 0; n < index[s + 1]; n++) {
            if (p + rl > data.length) break;
            var t = w[0] ? rd(w[0]) : 1, a = rd(w[1]), c = rd(w[2]), num = index[s] + n;
            if (self.xref.has(num)) continue;
            if (t === 1) self.xref.set(num, { t: 1, off: a });
            else if (t === 2) self.xref.set(num, { t: 2, stm: a, idx: c });
            else self.xref.set(num, { t: 0 });
          }
        }
      }
      if (!self.trailer) self.trailer = trailer;
      var prev = trailer.get('Prev');
      if (typeof prev === 'number') await section(prev);
      return trailer;
    }
    await section(off);
    if (!this.trailer || !this.trailer.get('Root')) throw new Error('no Root');
  };

  // fallback for damaged files: find every "n g obj" in the file
  PdfDoc.prototype.rebuild = async function () {
    var b = this.buf, s = latin1(b, 0, b.length), re = /(\d+)\s+(\d+)\s+obj\b/g, m;
    this.xref = new Map(); this.cache = new Map(); this.trailer = null;
    while ((m = re.exec(s))) this.xref.set(parseInt(m[1], 10), { t: 1, off: m.index });
    var tr = null, ti = -1;
    while ((ti = s.indexOf('trailer', ti + 1)) >= 0) {
      try { var d = new Parser(b, ti + 7, this).object(); if (isDict(d) && d.get('Root')) tr = d; } catch (e) {}
    }
    var nums = Array.from(this.xref.keys()), self = this;
    for (var i = 0; i < nums.length; i++) {
      var o = this.get(new Ref(nums[i]));
      var dct = o instanceof Stream ? o.dict : o;
      if (!isDict(dct)) continue;
      var ty = dct.get('Type');
      if (ty instanceof Name && ty.name === 'XRef' && dct.get('Root') && !tr) tr = dct;
      if (ty instanceof Name && ty.name === 'ObjStm') {
        var hd = await this.objstm(nums[i]);
        hd.forEach(function (v, n) { if (!self.xref.has(n)) { self.xref.set(n, { t: 2, stm: nums[i], idx: 0 }); } });
      }
      if (ty instanceof Name && ty.name === 'Catalog' && !tr) tr = new Map([['Root', new Ref(nums[i])]]);
    }
    if (!tr) { nums.forEach(function (n) { var o = self.get(new Ref(n)); if (isDict(o) && o.get('Type') instanceof Name && o.get('Type').name === 'Catalog') tr = new Map([['Root', new Ref(n)]]); }); }
    if (!tr) throw new Error('not a PDF');
    this.trailer = tr;
  };

  PdfDoc.prototype.objstm = async function (stmNum) {
    this._os = this._os || new Map();
    if (this._os.has(stmNum)) return this._os.get(stmNum);
    var st = this.get(new Ref(stmNum)), out = new Map();
    this._os.set(stmNum, out);
    if (!(st instanceof Stream)) return out;
    var data = await decodeStream(st), n = st.dict.get('N'), first = st.dict.get('First'), ps = new Parser(data, 0, this), pairs = [];
    for (var i = 0; i < n; i++) { var a = ps.int(), o = ps.int(); pairs.push([a, o]); }
    for (var j = 0; j < pairs.length; j++) {
      try { var p2 = new Parser(data, first + pairs[j][1], this); out.set(pairs[j][0], p2.object()); } catch (e) {}
    }
    return out;
  };

  PdfDoc.prototype.loadObjStreams = async function () {
    var stms = {}, self = this;
    this.xref.forEach(function (e) { if (e.t === 2) stms[e.stm] = 1; });
    for (var k in stms) {
      var m = await this.objstm(parseInt(k, 10));
      m.forEach(function (v, n) { var e = self.xref.get(n); if (e && e.t === 2 && !self.cache.has(n)) self.cache.set(n, v); });
    }
  };

  PdfDoc.prototype.collectPages = function () {
    var self = this, out = [], seen = new Set();
    var root = this.get(this.trailer.get('Root'));
    var top = isDict(root) ? root.get('Pages') : null;
    function walk(ref, inh) {
      var key = ref instanceof Ref ? ref.num : null;
      if (key !== null) { if (seen.has(key)) return; seen.add(key); }
      var d = self.get(ref); if (!isDict(d)) return;
      var inh2 = {};
      ['Resources', 'MediaBox', 'CropBox', 'Rotate'].forEach(function (k) { inh2[k] = d.has(k) ? d.get(k) : inh[k]; });
      var ty = d.get('Type'), kids = self.get(d.get('Kids'));
      if (Array.isArray(kids) && !(ty instanceof Name && ty.name === 'Page')) kids.forEach(function (k) { walk(k, inh2); });
      else out.push({ ref: ref, dict: d, inh: inh2 });
    }
    if (top) walk(top, {});
    if (!out.length) {                              // broken page tree: take every /Type /Page
      this.xref.forEach(function (e, n) {
        var o = self.get(new Ref(n));
        if (isDict(o) && o.get('Type') instanceof Name && o.get('Type').name === 'Page') out.push({ ref: new Ref(n), dict: o, inh: {} });
      });
    }
    this.pages = out;
  };

  PdfDoc.prototype.num = function (v) { v = this.get(v); return typeof v === 'number' ? v : 0; };
  PdfDoc.prototype.box = function (page) {
    var self = this, pick = function (v) { v = self.get(v); return Array.isArray(v) && v.length >= 4 ? v.slice(0, 4).map(function (x) { return self.num(x); }) : null; };
    var mb = pick(page.inh.MediaBox) || [0, 0, 612, 792], cb = pick(page.inh.CropBox) || mb;
    var norm = function (a) { return [Math.min(a[0], a[2]), Math.min(a[1], a[3]), Math.max(a[0], a[2]), Math.max(a[1], a[3])]; };
    mb = norm(mb); cb = norm(cb);
    var x0 = Math.max(mb[0], cb[0]), y0 = Math.max(mb[1], cb[1]), x1 = Math.min(mb[2], cb[2]), y1 = Math.min(mb[3], cb[3]);
    return x1 > x0 && y1 > y0 ? { mb: mb, cb: [x0, y0, x1, y1] } : { mb: mb, cb: mb };
  };
  PdfDoc.prototype.rotation = function (page) { var r = this.num(page.inh.Rotate); return ((Math.round(r / 90) * 90) % 360 + 360) % 360; };

  function load(u8) {
    var doc = new PdfDoc(u8);
    if (latin1(u8, 0, Math.min(1024, u8.length)).indexOf('%PDF-') < 0) return Promise.reject(new Error('This file is not a PDF.'));
    return (async function () {
      try { await doc.readXref(); await doc.loadObjStreams(); if (doc.trailer.get('Encrypt')) throw new Error('ENCRYPTED'); doc.collectPages(); if (!doc.pages.length) throw new Error('no pages'); }
      catch (e) {
        if (e.message === 'ENCRYPTED') throw new Error('This PDF is password-protected. Remove the password in the app that made it, then try again.');
        await doc.rebuild();
        if (doc.trailer.get('Encrypt')) throw new Error('This PDF is password-protected. Remove the password in the app that made it, then try again.');
        await doc.loadObjStreams(); doc.collectPages();
        if (!doc.pages.length) throw new Error('No pages could be read from this file.');
      }
      return doc;
    })();
  }

  /* ---------- writer ---------- */
  function nameStr(n) { return '/' + n.replace(/[^!-~]|[#()<>\[\]{}\/%]/g, function (c) { var h = c.charCodeAt(0).toString(16); return '#' + (h.length < 2 ? '0' : '') + h; }); }
  function num(n) { return Number.isInteger(n) ? String(n) : String(Math.round(n * 10000) / 10000); }
  function ser(v, out) {                            // pushes strings or Uint8Arrays onto out
    if (v === null || v === undefined) out.push('null');
    else if (v === true) out.push('true'); else if (v === false) out.push('false');
    else if (typeof v === 'number') out.push(num(v));
    else if (v instanceof Name) out.push(nameStr(v.name));
    else if (v instanceof Ref) out.push(v.num + ' ' + v.gen + ' R');
    else if (v instanceof Str) out.push(v.raw);
    else if (Array.isArray(v)) { out.push('['); v.forEach(function (x, i) { if (i) out.push(' '); ser(x, out); }); out.push(']'); }
    else if (v instanceof Map) { out.push('<<'); v.forEach(function (x, k) { out.push(nameStr(k)); out.push(' '); ser(x, out); out.push('\n'); }); out.push('>>'); }
    else if (v instanceof Stream) { v.dict.set('Length', v.raw.length); ser(v.dict, out); out.push('\nstream\n'); out.push(v.raw); out.push('\nendstream'); }
    else throw new Error('cannot write value');
  }

  var SKIP = { StructParents: 1, StructParent: 1, B: 1, Thumb: 1, PieceInfo: 1, Parent: 1 };
  var isType = function (d, t) { var y = d instanceof Stream ? d.dict.get('Type') : isDict(d) ? d.get('Type') : null; return y instanceof Name && y.name === t; };

  function Builder() {
    this.objs = [null]; this.memo = new Map(); this.pageMap = new Map(); this.pagesRef = this.alloc(); this.kids = [];
  }
  Builder.prototype.alloc = function () { this.objs.push(null); return new Ref(this.objs.length - 1); };
  Builder.prototype.put = function (v) { var r = this.alloc(); this.objs[r.num] = v; return r; };
  Builder.prototype.copy = function (doc, v, pageRefs) {
    var self = this;
    function cp(x, key) {
      if (x instanceof Ref) {
        var t = doc.get(x);
        if (isType(t, 'Page')) { var m = pageRefs && pageRefs.get(x.num); return m || null; }
        if (isType(t, 'Pages') || isType(t, 'Catalog')) return null;
        var mk = doc.__id + ':' + x.num;
        if (self.memo.has(mk)) return self.memo.get(mk);
        var nr = self.alloc(); self.memo.set(mk, nr);
        self.objs[nr.num] = t === null ? null : cp(t);
        return nr;
      }
      if (Array.isArray(x)) return x.map(function (y) { return cp(y); });
      if (x instanceof Map) {
        var m2 = new Map();
        x.forEach(function (y, k) {
          if (SKIP[k]) return;
          if (k === 'P' && y instanceof Ref && isType(doc.get(y), 'Page')) return;
          m2.set(k, cp(y, k));
        });
        return m2;
      }
      if (x instanceof Stream) return new Stream(cp(x.dict), x.raw);
      return x;
    }
    return cp(v);
  };
  var docId = 0;
  // Copies one page of `doc`. opts.rotate adds degrees (clockwise). Returns a handle for stamp().
  Builder.prototype.addPage = function (doc, index, opts) {
    if (doc.__id === undefined) doc.__id = ++docId;
    opts = opts || {};
    var pg = doc.pages[index], src = pg.dict, self = this, d = new Map();
    var annots = doc.get(src.get('Annots'));
    var keepAnnots = Array.isArray(annots) ? annots.filter(function (a) {
      var ad = doc.get(a); if (!isDict(ad)) return false;
      var st = doc.get(ad.get('Subtype')); if (!(st instanceof Name && st.name === 'Link')) return true;
      if (ad.has('Dest')) return false;
      var act = doc.get(ad.get('A')); var s = isDict(act) ? doc.get(act.get('S')) : null;
      return !(s instanceof Name && /^(GoTo|GoToR|Named|GoToE)$/.test(s.name));
    }) : null;
    src.forEach(function (v, k) {
      if (SKIP[k] || k === 'Annots') return;
      d.set(k, self.copy(doc, v));
    });
    if (keepAnnots && keepAnnots.length) d.set('Annots', self.copy(doc, keepAnnots));
    var inh = pg.inh;
    if (!d.has('Resources') && inh.Resources !== undefined) d.set('Resources', self.copy(doc, inh.Resources));
    var bx = doc.box(pg);
    d.set('MediaBox', bx.mb); d.set('CropBox', bx.cb);
    var rot = (doc.rotation(pg) + (opts.rotate || 0)) % 360;
    if (rot < 0) rot += 360;
    d.set('Rotate', rot);
    d.set('Type', new Name('Page')); d.set('Parent', this.pagesRef);
    var ref = this.put(d); this.kids.push(ref);
    return { ref: ref, dict: d, box: bx.cb, rotate: rot };
  };
  // A JPEG (bytes, pixel size) as a full page. Page size follows the picture, scaled down to fit A4.
  Builder.prototype.addJpegPage = function (jpeg, w, h, gray) {
    var maxW = w >= h ? 842 : 595, maxH = w >= h ? 595 : 842, s = Math.min(1, maxW / w, maxH / h), pw = Math.round(w * s * 100) / 100, ph = Math.round(h * s * 100) / 100;
    var img = this.put(new Stream(new Map([['Type', new Name('XObject')], ['Subtype', new Name('Image')], ['Width', w], ['Height', h],
      ['ColorSpace', new Name(gray ? 'DeviceGray' : 'DeviceRGB')], ['BitsPerComponent', 8], ['Filter', new Name('DCTDecode')]]), jpeg));
    var content = this.put(new Stream(new Map(), bytes('q ' + num(pw) + ' 0 0 ' + num(ph) + ' 0 0 cm /Im0 Do Q')));
    var d = new Map([['Type', new Name('Page')], ['Parent', this.pagesRef], ['MediaBox', [0, 0, pw, ph]], ['Rotate', 0],
      ['Resources', new Map([['XObject', new Map([['Im0', img]])]])], ['Contents', content]]);
    var ref = this.put(d); this.kids.push(ref);
    return { ref: ref, dict: d, box: [0, 0, pw, ph], rotate: 0 };
  };
  // A plain page with coloured background and lines of Helvetica text (used for the sample files).
  // spec: {w, h, bg:[r,g,b] 0-1, lines:[{t, x, y, size, bold, color:[r,g,b]}]} with y from the top.
  Builder.prototype.addTextPage = function (spec) {
    if (!this.fonts) this.fonts = { F1: this.put(new Map([['Type', new Name('Font')], ['Subtype', new Name('Type1')], ['BaseFont', new Name('Helvetica')], ['Encoding', new Name('WinAnsiEncoding')]])), F2: this.put(new Map([['Type', new Name('Font')], ['Subtype', new Name('Type1')], ['BaseFont', new Name('Helvetica-Bold')], ['Encoding', new Name('WinAnsiEncoding')]])) };
    var c = (spec.bg || [1, 1, 1]).map(num).join(' ') + ' rg 0 0 ' + spec.w + ' ' + spec.h + ' re f\n';
    (spec.lines || []).forEach(function (l) {
      c += 'BT /' + (l.bold ? 'F2' : 'F1') + ' ' + (l.size || 14) + ' Tf ' + (l.color || [0.1, 0.1, 0.15]).map(num).join(' ') + ' rg ' + num(l.x) + ' ' + num(spec.h - l.y) + ' Td (' + String(l.t).replace(/[\\()]/g, '\\$&') + ') Tj ET\n';
    });
    (spec.rules || []).forEach(function (r) { c += (r.color || [0.2, 0.2, 0.25]).map(num).join(' ') + ' RG ' + (r.w || 1) + ' w ' + num(r.x1) + ' ' + num(spec.h - r.y) + ' m ' + num(r.x2) + ' ' + num(spec.h - r.y) + ' l S\n'; });
    var d = new Map([['Type', new Name('Page')], ['Parent', this.pagesRef], ['MediaBox', [0, 0, spec.w, spec.h]], ['Rotate', 0],
      ['Resources', new Map([['Font', new Map([['F1', this.fonts.F1], ['F2', this.fonts.F2]])]])], ['Contents', this.put(new Stream(new Map(), bytes(c)))]]);
    var ref = this.put(d); this.kids.push(ref);
    return { ref: ref, dict: d, box: [0, 0, spec.w, spec.h], rotate: 0 };
  };
  // RGBA pixels -> an image object with a soft mask, deflated.
  Builder.prototype.addImage = async function (w, h, rgba) {
    var rgb = new Uint8Array(w * h * 3), a = new Uint8Array(w * h);
    for (var i = 0, j = 0, k = 0; i < rgba.length; i += 4, j += 3, k++) { rgb[j] = rgba[i]; rgb[j + 1] = rgba[i + 1]; rgb[j + 2] = rgba[i + 2]; a[k] = rgba[i + 3]; }
    var parts = await Promise.all([deflate(rgb), deflate(a)]);
    var mask = this.put(new Stream(new Map([['Type', new Name('XObject')], ['Subtype', new Name('Image')], ['Width', w], ['Height', h],
      ['ColorSpace', new Name('DeviceGray')], ['BitsPerComponent', 8], ['Filter', new Name('FlateDecode')]]), parts[1]));
    return this.put(new Stream(new Map([['Type', new Name('XObject')], ['Subtype', new Name('Image')], ['Width', w], ['Height', h],
      ['ColorSpace', new Name('DeviceRGB')], ['BitsPerComponent', 8], ['Filter', new Name('FlateDecode')], ['SMask', mask]]), parts[0]));
  };
  // Display (what the viewer shows, upright) to page space for a page box and rotation.
  function mapPoint(box, rot, u, v) {
    var x0 = box[0], y0 = box[1], x1 = box[2], y1 = box[3];
    if (rot === 90) return [x0 + v, y0 + u];
    if (rot === 180) return [x1 - u, y0 + v];
    if (rot === 270) return [x1 - v, y1 - u];
    return [x0 + u, y1 - v];
  }
  // Place an image on a page. fx, fy, fw, fh: fractions of the upright page, from its top-left.
  Builder.prototype.stamp = function (page, imgRef, fx, fy, fw, fh, name) {
    var box = page.box, W = box[2] - box[0], H = box[3] - box[1], rot = page.rotate;
    var dw = rot === 90 || rot === 270 ? H : W, dh = rot === 90 || rot === 270 ? W : H;
    var u0 = fx * dw, v0 = fy * dh, w = fw * dw, h = fh * dh;
    var O = mapPoint(box, rot, u0, v0 + h), X = mapPoint(box, rot, u0 + w, v0 + h), Y = mapPoint(box, rot, u0, v0);
    var cm = [X[0] - O[0], X[1] - O[1], Y[0] - O[0], Y[1] - O[1], O[0], O[1]].map(num).join(' ');
    var d = page.dict, self = this;
    var res = d.get('Resources');
    if (res instanceof Ref) res = this.objs[res.num];
    if (!(res instanceof Map)) { res = new Map(); d.set('Resources', res); }
    var xo = res.get('XObject');
    if (xo instanceof Ref) xo = this.objs[xo.num];
    if (!(xo instanceof Map)) { xo = new Map(); res.set('XObject', xo); }
    name = name || 'ApStamp' + (page.n = (page.n || 0) + 1) + 'x' + imgRef.num;
    xo.set(name, imgRef);
    var contents = d.get('Contents'), list = [];
    if (contents instanceof Ref) { var t = this.objs[contents.num]; list = Array.isArray(t) ? t.slice() : [contents]; }
    else if (Array.isArray(contents)) list = contents.slice();
    if (!page.wrapped) { list.unshift(this.put(new Stream(new Map(), bytes('q')))); page.wrapped = true; page.list = list; page.tail = []; }
    else list = page.list;
    page.tail.push('q ' + cm + ' cm /' + name + ' Do Q');
    page.list = list;
    var tailRef = page.tailRef || (page.tailRef = this.alloc());
    this.objs[tailRef.num] = new Stream(new Map(), bytes('Q\n' + page.tail.join('\n')));
    d.set('Contents', list.concat([tailRef]));
  };
  Builder.prototype.save = function (title) {
    var catalog = this.put(new Map([['Type', new Name('Catalog')], ['Pages', this.pagesRef]]));
    this.objs[this.pagesRef.num] = new Map([['Type', new Name('Pages')], ['Kids', this.kids], ['Count', this.kids.length]]);
    var info = this.put(new Map([['Producer', new Str('(aashishpandey.com PDF tool)')]].concat(title ? [['Title', new Str('(' + title.replace(/[()\\]/g, '') + ')')]] : [])));
    var chunks = [bytes('%PDF-1.7\n%\xE2\xE3\xCF\xD3\n')], offs = [], pos = chunks[0].length, i;
    for (i = 1; i < this.objs.length; i++) {
      var parts = [i + ' 0 obj\n']; ser(this.objs[i], parts); parts.push('\nendobj\n');
      var c = concat(parts.map(function (p) { return typeof p === 'string' ? bytes(p) : p; }));
      offs[i] = pos; pos += c.length; chunks.push(c);
    }
    var x = ['xref\n0 ' + this.objs.length + '\n0000000000 65535 f \n'];
    for (i = 1; i < this.objs.length; i++) x.push(('0000000000' + offs[i]).slice(-10) + ' 00000 n \n');
    x.push('trailer\n<</Size ' + this.objs.length + ' /Root ' + catalog.num + ' 0 R /Info ' + info.num + ' 0 R>>\nstartxref\n' + pos + '\n%%EOF\n');
    chunks.push(bytes(x.join('')));
    return concat(chunks);
  };

  /* ---------- helpers for the page ---------- */
  var CRC = null;
  function crc32(u8) {
    if (!CRC) { CRC = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
    var crc = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) crc = CRC[(crc ^ u8[i]) & 255] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  // files: [{name, data: Uint8Array}] -> a stored (uncompressed) zip; PDFs are already compressed.
  function zip(files) {
    var parts = [], central = [], off = 0, enc = new TextEncoder();
    function u16(n) { return [n & 255, (n >> 8) & 255]; }
    function u32(n) { return [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255]; }
    files.forEach(function (f) {
      var nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
      var lh = new Uint8Array([0x50, 0x4b, 3, 4].concat(u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(sz), u32(sz), u16(nm.length), u16(0)));
      parts.push(lh, nm, f.data);
      central.push(new Uint8Array([0x50, 0x4b, 1, 2].concat(u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(sz), u32(sz), u16(nm.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off))), nm);
      off += lh.length + nm.length + sz;
    });
    var csz = 0; central.forEach(function (c) { csz += c.length; });
    var end = new Uint8Array([0x50, 0x4b, 5, 6, 0, 0, 0, 0].concat(u16(files.length), u16(files.length), u32(csz), u32(off), u16(0)));
    return concat(parts.concat(central, [end]));
  }
  // "1-3, 5, 8-" -> [0,1,2,4,7,...] (0-based, in the order typed). Returns {pages, error}
  function parseRanges(text, count) {
    var out = [], parts = String(text || '').split(/[,;\s]+/).filter(Boolean);
    for (var i = 0; i < parts.length; i++) {
      var m = /^(\d*)\s*(?:[-–:]\s*(\d*))?$/.exec(parts[i]);
      if (!m || (!m[1] && !m[2])) return { pages: [], error: 'Could not read "' + parts[i] + '". Use numbers and ranges like 1-3, 5, 8-.' };
      var a = m[1] ? parseInt(m[1], 10) : 1, hasDash = /[-–:]/.test(parts[i]), b = hasDash ? (m[2] ? parseInt(m[2], 10) : count) : a;
      if (a < 1 || b < 1 || a > count || b > count) return { pages: [], error: 'Page ' + (a > count || a < 1 ? a : b) + ' is outside this file (1 to ' + count + ').' };
      if (a <= b) for (var p = a; p <= b; p++) out.push(p - 1); else for (var q = a; q >= b; q--) out.push(q - 1);
    }
    return { pages: out, error: '' };
  }

  var api = { load: load, Builder: Builder, zip: zip, parseRanges: parseRanges, deflate: deflate, inflate: inflate, _Parser: Parser, _Name: Name, _Ref: Ref };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PdfKit = api;
})(typeof window !== 'undefined' ? window : globalThis);
