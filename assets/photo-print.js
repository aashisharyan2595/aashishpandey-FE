/* Photo prints for Explore mode. After a snap, the photo is graded like film (soft S-curve, lifted blacks, warm highlights, cool
 * shadows, a little bloom, vignette, grain) and set into one of three physical frames: a Polaroid, a gallery frame with a mat and a
 * museum label, or a strip of 35 mm film. Everything is drawn in the browser on a 1080 x 1350 canvas (4:5, the size Instagram,
 * LinkedIn and Facebook feeds show in full) and goes nowhere until the person sends it.
 *
 *   ApPhoto.open({ src: dataURL, info: { place, when, weather }, onOpen, onClose })
 */
(function () {
'use strict';
var W = 1080, H = 1350;
var SERIF = '"Cormorant Garamond", Georgia, serif', SANS = '"Instrument Sans", system-ui, sans-serif', MONO = '"JetBrains Mono", ui-monospace, monospace';
var SITE = 'aashishpandey.com', TAG = '#RideWithAashish', CTA = 'Ride the 3D world';
var STYLES = [['polaroid', 'Polaroid'], ['gallery', 'Gallery'], ['film', 'Film']];
var dlg, cv, ctx, capIn, built = false, st = null, raf = 0, noiseTile = null;

/* ---------- small helpers ---------- */
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function rng(seed) { var a = seed >>> 0; return function () { a += 0x6D2B79F5; var t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function noise() {
  if (noiseTile) return noiseTile;
  var c = canvas(256, 256), x = c.getContext('2d'), d = x.createImageData(256, 256), r = rng(7);
  for (var i = 0; i < d.data.length; i += 4) { var v = 128 + (r() - 0.5) * 120; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); return (noiseTile = c);
}
function grain(c, x, y, w, h, alpha, mode) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.globalAlpha = alpha; c.globalCompositeOperation = mode || 'overlay';
  c.fillStyle = c.createPattern(noise(), 'repeat'); c.fillRect(x, y, w, h); c.restore();
}
function fontsReady() {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  return Promise.all([document.fonts.load('italic 500 54px "Cormorant Garamond"'), document.fonts.load('400 20px "Instrument Sans"'), document.fonts.load('400 18px "JetBrains Mono"')]).catch(function () {});
}
function spaced(c, text, x, y, gap, align) { // letter-spaced text
  var w = 0, i; for (i = 0; i < text.length; i++) w += c.measureText(text[i]).width + gap; w -= gap;
  var sx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x; c.textAlign = 'left';
  for (i = 0; i < text.length; i++) { c.fillText(text[i], sx, y); sx += c.measureText(text[i]).width + gap; }
}
function fitText(c, text, maxW, size, weight, family) { var s = size; do { c.font = weight + ' ' + s + 'px ' + family; if (c.measureText(text).width <= maxW) break; s -= 2; } while (s > 24); return s; }

/* ---------- the signature under every print: name, address, and what to do ---------- */
var logo = null;
function loadLogo(cb) { if (logo) return cb(); var i = new Image(); i.onload = function () { logo = i; cb(); }; i.src = '/assets/logo-mark.svg'; }
function drawBrand(c, yc) {
  c.save(); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  var name = 'AASHISH PANDEY', sub = CTA + '  \u00B7  ' + TAG;
  c.font = '600 40px ' + SANS; var w1 = c.measureText(SITE).width; c.font = '500 17px ' + SANS; var w2 = c.measureText(sub).width;
  var ls = logo ? 84 : 0, gap = logo ? 24 : 0, tw = Math.max(w1, w2), x0 = (W - (ls + gap + tw)) / 2, tx = x0 + ls + gap;
  if (logo) { c.save(); rr(c, x0, yc - ls / 2, ls, ls, 18); c.clip(); c.drawImage(logo, x0, yc - ls / 2, ls, ls); c.restore(); c.strokeStyle = 'rgba(244,239,230,0.2)'; c.lineWidth = 2; rr(c, x0, yc - ls / 2, ls, ls, 18); c.stroke(); }
  c.fillStyle = 'rgba(244,239,230,0.86)'; c.font = '500 15px ' + MONO; spaced(c, name, tx, yc - 20, 4.2, 'left');
  c.fillStyle = '#f5b867'; c.font = '600 40px ' + SANS; c.fillText(SITE, tx, yc + 20);
  c.fillStyle = 'rgba(244,239,230,0.72)'; c.font = '500 17px ' + SANS; c.fillText(sub, tx, yc + 46);
  c.restore();
}

/* ---------- the photo: crop, then grade like film ---------- */
function coverRect(img, w, h, fx, fy) {
  var sc = Math.max(w / img.width, h / img.height), sw = w / sc, sh = h / sc;
  return { sx: (img.width - sw) * fx, sy: (img.height - sh) * fy, sw: sw, sh: sh, sc: sc, slackX: img.width - sw, slackY: img.height - sh };
}
var LUT = null;
function lut() {
  if (LUT) return LUT; LUT = new Float32Array(256);
  var sg = function (x) { return 1 / (1 + Math.exp(-5.4 * (x - 0.5))); }, a = sg(0), b = sg(1);
  for (var i = 0; i < 256; i++) { var x = i / 255, y = (sg(x) - a) / (b - a); y = x * 0.35 + y * 0.65; LUT[i] = 0.025 + y * 0.965; } // lifted blacks, soft shoulder
  return LUT;
}
function gradePhoto(img, w, h, fx, fy, warm) {
  var c = canvas(w, h), x = c.getContext('2d'), r = coverRect(img, w, h, fx, fy);
  x.imageSmoothingQuality = 'high'; x.drawImage(img, r.sx, r.sy, r.sw, r.sh, 0, 0, w, h);
  var d = x.getImageData(0, 0, w, h), p = d.data, L = lut(), i, R, G, B, lum, sh, hi;
  for (i = 0; i < p.length; i += 4) {
    R = L[p[i]]; G = L[p[i + 1]]; B = L[p[i + 2]]; lum = 0.2126 * R + 0.7152 * G + 0.0722 * B;
    sh = (1 - lum) * (1 - lum); hi = lum * lum;
    R += -0.035 * sh + 0.04 * warm * hi; G += 0.008 * sh + 0.012 * warm * hi; B += 0.045 * sh - 0.045 * warm * hi;   // cool shadows, warm highlights
    lum = 0.2126 * R + 0.7152 * G + 0.0722 * B; R = lum + (R - lum) * 1.1; G = lum + (G - lum) * 1.1; B = lum + (B - lum) * 1.1;  // a little more colour
    p[i] = clamp(R, 0, 1) * 255; p[i + 1] = clamp(G, 0, 1) * 255; p[i + 2] = clamp(B, 0, 1) * 255;
  }
  x.putImageData(d, 0, 0);
  // bloom: pick the highlights on a small copy, blur it by scaling down and up, screen it back
  var sw = Math.max(32, w >> 3), sh2 = Math.max(32, h >> 3), s1 = canvas(sw, sh2), x1 = s1.getContext('2d');
  x1.drawImage(c, 0, 0, sw, sh2); var sd = x1.getImageData(0, 0, sw, sh2), q = sd.data, v;
  for (i = 0; i < q.length; i += 4) { v = Math.max(0, (0.2126 * q[i] + 0.7152 * q[i + 1] + 0.0722 * q[i + 2]) / 255 - 0.6) * 2.6; q[i] *= v; q[i + 1] *= v; q[i + 2] *= v; }
  x1.putImageData(sd, 0, 0);
  var s2 = canvas(sw >> 1, sh2 >> 1), x2 = s2.getContext('2d'); x2.imageSmoothingQuality = 'high'; x2.drawImage(s1, 0, 0, s2.width, s2.height);
  var s3 = canvas(sw >> 2, sh2 >> 2), x3 = s3.getContext('2d'); x3.imageSmoothingQuality = 'high'; x3.drawImage(s2, 0, 0, s3.width, s3.height);
  x.save(); x.globalCompositeOperation = 'screen'; x.globalAlpha = 0.55; x.imageSmoothingQuality = 'high'; x.drawImage(s3, 0, 0, w, h); x.restore();
  // vignette and grain
  var g = x.createRadialGradient(w / 2, h * 0.48, Math.min(w, h) * 0.32, w / 2, h * 0.48, Math.max(w, h) * 0.78);
  g.addColorStop(0, 'rgba(6,7,20,0)'); g.addColorStop(1, 'rgba(6,7,20,0.46)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  grain(x, 0, 0, w, h, 0.09, 'overlay');
  return { c: c, r: r };
}

/* ---------- frames ---------- */
function shadowed(c, fn, blur, ox, oy, a) { c.save(); c.shadowColor = 'rgba(0,0,0,' + a + ')'; c.shadowBlur = blur; c.shadowOffsetX = ox; c.shadowOffsetY = oy; fn(); c.restore(); }
function sheen(c, x, y, w, h, a) { // glossy highlight across glass or paper
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); var g = c.createLinearGradient(x, y, x + w * 0.9, y + h * 0.9);
  g.addColorStop(0, 'rgba(255,255,255,' + a + ')'); g.addColorStop(0.32, 'rgba(255,255,255,0)'); g.addColorStop(0.62, 'rgba(255,255,255,0)'); g.addColorStop(0.78, 'rgba(255,255,255,' + a * 0.45 + ')'); g.addColorStop(0.86, 'rgba(255,255,255,0)');
  c.globalCompositeOperation = 'screen'; c.fillStyle = g; c.fillRect(x, y, w, h); c.restore();
}
function innerShadow(c, x, y, w, h, depth, a) { // the picture sits slightly below the surface around it
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  var edge = function (x0, y0, x1, y1, rx, ry, rw, rh) { var g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(rx, ry, rw, rh); };
  edge(0, y, 0, y + depth, x, y, w, depth); edge(0, y + h, 0, y + h - depth, x, y + h - depth, w, depth);
  edge(x, 0, x + depth, 0, x, y, depth, h); edge(x + w, 0, x + w - depth, 0, x + w - depth, y, depth, h);
  c.restore();
}

function drawPolaroid(c, o) {
  // slate surface lit from the top left
  var bg = c.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#171a30'); bg.addColorStop(1, '#090b18'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
  var sp = c.createRadialGradient(W * 0.3, H * 0.18, 40, W * 0.3, H * 0.18, W * 0.95); sp.addColorStop(0, 'rgba(255,214,160,0.20)'); sp.addColorStop(1, 'rgba(255,214,160,0)'); c.fillStyle = sp; c.fillRect(0, 0, W, H);
  grain(c, 0, 0, W, H, 0.07, 'overlay');
  var pw = 860, ph = 1040, win = 780, m = (pw - win) / 2;
  c.save(); c.translate(W / 2, H / 2 - 44); c.rotate(-0.028);
  var x = -pw / 2, y = -ph / 2;
  shadowed(c, function () { rr(c, x, y, pw, ph, 10); c.fillStyle = '#f4efe3'; c.fill(); }, 70, 18, 40, 0.6);
  var pg = c.createLinearGradient(x, y, x + pw, y + ph); pg.addColorStop(0, '#fbf8f0'); pg.addColorStop(0.55, '#f3eee1'); pg.addColorStop(1, '#e9e2d1');
  rr(c, x, y, pw, ph, 10); c.fillStyle = pg; c.fill(); grain(c, x, y, pw, ph, 0.05, 'multiply');
  c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2; rr(c, x + 1, y + 1, pw - 2, ph - 2, 9); c.stroke();
  var wx = x + m, wy = y + m;
  var ph1 = o.photo(win, win); c.drawImage(ph1.c, wx, wy); o.rect = { x: 0, y: 0, w: win, h: win, sc: ph1.r };
  innerShadow(c, wx, wy, win, win, 26, 0.38); sheen(c, wx, wy, win, win, 0.16);
  c.strokeStyle = 'rgba(0,0,0,0.28)'; c.lineWidth = 2; c.strokeRect(wx, wy, win, win);
  // caption in ink, date underneath
  c.fillStyle = '#2d2823'; c.textAlign = 'center'; var cs = fitText(c, o.caption, pw - 150, 64, 'italic 500', SERIF); c.font = 'italic 500 ' + cs + 'px ' + SERIF;
  c.save(); c.translate(0, 0); c.rotate(-0.008); c.fillText(o.caption, 0, wy + win + 112); c.restore();
  c.fillStyle = '#8a8272'; c.font = '500 17px ' + SANS; spaced(c, o.date.toUpperCase() + '   ·   EXPLORE MODE', 0, wy + win + 166, 3.2, 'center');
  c.restore();
  // tape across the top corners
  [-1, 1].forEach(function (sd) {
    c.save(); c.translate(W / 2, H / 2 - 44); c.rotate(-0.028); c.translate(sd * (pw / 2 - 46), -ph / 2 + 8); c.rotate(sd * 0.7);
    shadowed(c, function () { c.fillStyle = 'rgba(236,222,184,0.66)'; c.fillRect(-84, -26, 168, 52); }, 8, 0, 3, 0.25);
    var tg = c.createLinearGradient(-84, 0, 84, 0); tg.addColorStop(0, 'rgba(255,255,255,0.3)'); tg.addColorStop(0.5, 'rgba(255,255,255,0)'); tg.addColorStop(1, 'rgba(255,255,255,0.22)'); c.fillStyle = tg; c.fillRect(-84, -26, 168, 52);
    c.restore();
  });
  drawBrand(c, 1262);
  o.origin = { x: W / 2 - win / 2, y: H / 2 - 44 - ph / 2 + m, rot: -0.028 };
}

function drawGallery(c, o) {
  // plaster wall with a soft light from above
  var bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#3a3631'); bg.addColorStop(1, '#16140f'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
  var sp = c.createRadialGradient(W / 2, -60, 40, W / 2, -60, H * 0.95); sp.addColorStop(0, 'rgba(255,236,200,0.30)'); sp.addColorStop(1, 'rgba(255,236,200,0)'); c.fillStyle = sp; c.fillRect(0, 0, W, H);
  grain(c, 0, 0, W, H, 0.08, 'overlay');
  var fw = 880, fh = 940, fx = (W - fw) / 2, fy = 70, fr = 34, mat = 76;
  shadowed(c, function () { c.fillStyle = '#0d0c0b'; c.fillRect(fx, fy, fw, fh); }, 80, 16, 38, 0.62);
  var g = c.createLinearGradient(fx, fy, fx + fw, fy + fh); g.addColorStop(0, '#34312d'); g.addColorStop(0.5, '#0f0e0c'); g.addColorStop(1, '#262421'); c.fillStyle = g; c.fillRect(fx, fy, fw, fh);
  c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.16)'; c.beginPath(); c.moveTo(fx + 1.5, fy + fh); c.lineTo(fx + 1.5, fy + 1.5); c.lineTo(fx + fw, fy + 1.5); c.stroke();
  c.strokeStyle = 'rgba(0,0,0,0.7)'; c.beginPath(); c.moveTo(fx + fw - 1.5, fy); c.lineTo(fx + fw - 1.5, fy + fh - 1.5); c.lineTo(fx, fy + fh - 1.5); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.08)'; c.strokeRect(fx + fr - 3, fy + fr - 3, fw - 2 * fr + 6, fh - 2 * fr + 6);
  var mx = fx + fr, my = fy + fr, mw = fw - 2 * fr, mh = fh - 2 * fr;
  c.fillStyle = '#efeadf'; c.fillRect(mx, my, mw, mh); grain(c, mx, my, mw, mh, 0.06, 'multiply');
  innerShadow(c, mx, my, mw, mh, 16, 0.4);
  var wx = mx + mat, wy = my + mat, ww = mw - 2 * mat, wh = mh - 2 * mat - 22;       // a touch more mat below, like a real mount
  c.fillStyle = '#fbf8f1'; c.fillRect(wx - 5, wy - 5, ww + 10, wh + 10);               // the bevel cut
  var p1 = o.photo(ww, wh); c.drawImage(p1.c, wx, wy); o.rect = { x: 0, y: 0, w: ww, h: wh, sc: p1.r };
  innerShadow(c, wx, wy, ww, wh, 22, 0.5);
  c.save(); c.beginPath(); c.rect(mx, my, mw, mh); c.clip(); sheen(c, mx, my, mw, mh, 0.13); c.restore();
  // museum label
  var lw = 560, lh = 118, lx = (W - lw) / 2, ly = fy + fh + 44;
  shadowed(c, function () { rr(c, lx, ly, lw, lh, 3); c.fillStyle = '#f3eee2'; c.fill(); }, 22, 0, 10, 0.5);
  grain(c, lx, ly, lw, lh, 0.05, 'multiply');
  c.fillStyle = '#2a2520'; c.textAlign = 'center'; var cs = fitText(c, o.caption, lw - 60, 38, 'italic 500', SERIF); c.font = 'italic 500 ' + cs + 'px ' + SERIF; c.fillText(o.caption, W / 2, ly + 48);
  c.fillStyle = '#6f685b'; c.font = '500 14px ' + SANS; spaced(c, 'AASHISH PANDEY  ·  REAL-TIME 3D  ·  1/1', W / 2, ly + 78, 2.6, 'center');
  c.font = '500 13px ' + MONO; c.fillStyle = '#8f8878'; spaced(c, o.date.toUpperCase(), W / 2, ly + 100, 2, 'center');
  drawBrand(c, 1268);
  o.origin = { x: wx, y: wy, rot: 0 };
}

function drawFilm(c, o) {
  // a light table behind a strip of 35 mm film
  var bg = c.createRadialGradient(W / 2, H * 0.44, 20, W / 2, H * 0.44, H * 0.8); bg.addColorStop(0, '#2a2118'); bg.addColorStop(1, '#0a0908'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
  grain(c, 0, 0, W, H, 0.08, 'overlay');
  c.fillStyle = 'rgba(245,184,103,0.85)'; c.font = '500 15px ' + MONO; spaced(c, 'FROM THE ROAD  ·  AASHISH PANDEY', W / 2, 150, 5, 'center');
  var sh = 640, cx = W / 2, cy = 612;
  c.save(); c.translate(cx, cy); c.rotate(-0.045);
  var sw = W + 600, sx = -sw / 2, sy = -sh / 2;
  shadowed(c, function () { c.fillStyle = '#1a130d'; c.fillRect(sx, sy, sw, sh); }, 60, 0, 30, 0.6);
  var fb = c.createLinearGradient(0, sy, 0, sy + sh); fb.addColorStop(0, '#2b1d12'); fb.addColorStop(0.1, '#1b130d'); fb.addColorStop(0.9, '#1b130d'); fb.addColorStop(1, '#2b1d12'); c.fillStyle = fb; c.fillRect(sx, sy, sw, sh);
  // sprocket holes (the light table shows through) and edge printing
  var hole = function (hx, hy) { rr(c, hx, hy, 34, 24, 5); c.fillStyle = '#f0dcb4'; c.fill(); c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 2; c.stroke(); };
  for (var hx = sx + 14; hx < sx + sw; hx += 62) { hole(hx, sy + 22); hole(hx, sy + sh - 46); }
  c.fillStyle = '#e8963a'; c.font = '500 17px ' + MONO;
  var fn = 0; for (var tx = sx + 40; tx < sx + sw - 120; tx += 420) { fn++; c.textAlign = 'left'; c.fillText('AP 400', tx, sy + 82); c.fillText('▶ ' + (11 + fn) + (fn % 2 ? '' : 'A'), tx + 150, sy + 82); c.fillText('AASHISH PANDEY', tx + 40, sy + sh - 56); }
  // frames: the picture, and its neighbours dimmed
  var fw = 684, fh = 456, fy2 = -fh / 2 + 6;
  var p1 = o.photo(fw, fh);
  [-1, 1].forEach(function (s) {
    var nx = s * (fw + 26) - fw / 2; c.save(); c.beginPath(); c.rect(nx, fy2, fw, fh); c.clip();
    c.globalAlpha = 0.34; c.drawImage(p1.c, nx + s * 120, fy2 + 40 * s, fw, fh); c.globalAlpha = 1; c.fillStyle = 'rgba(14,10,7,0.55)'; c.fillRect(nx, fy2, fw, fh); c.restore();
  });
  c.drawImage(p1.c, -fw / 2, fy2); o.rect = { x: 0, y: 0, w: fw, h: fh, sc: p1.r };
  innerShadow(c, -fw / 2, fy2, fw, fh, 14, 0.5);
  c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 3; c.strokeRect(-fw / 2, fy2, fw, fh);
  sheen(c, -fw / 2, fy2, fw, fh, 0.08);
  c.restore();
  c.fillStyle = '#f4efe6'; c.textAlign = 'center'; var cs = fitText(c, o.caption, W - 160, 70, 'italic 500', SERIF); c.font = 'italic 500 ' + cs + 'px ' + SERIF; c.fillText(o.caption, W / 2, 1040);
  c.fillStyle = 'rgba(244,239,230,0.55)'; c.font = '500 16px ' + SANS; spaced(c, o.date.toUpperCase() + '   ·   EXPLORE MODE', W / 2, 1100, 3.4, 'center');
  drawBrand(c, 1244);
  o.origin = { x: cx - 342, y: cy - 222, rot: -0.045 };
}

/* ---------- drawing and state ---------- */
function render() {
  raf = 0; if (!st || !st.img) return;
  var o = { caption: st.caption || 'A moment on the road', date: st.date, rect: null, origin: null }, warm = st.style === 'film' ? 1.15 : 1;
  o.photo = function (w, h) { var k = st.style + '|' + Math.round(w) + 'x' + Math.round(h) + '|' + st.fx.toFixed(4) + '|' + st.fy.toFixed(4); if (st.cache && st.cache.k === k) return st.cache.v; var v = gradePhoto(st.img, Math.round(w), Math.round(h), st.fx, st.fy, warm); st.cache = { k: k, v: v }; return v; };
  ctx.save(); ctx.clearRect(0, 0, W, H); ctx.textBaseline = 'alphabetic';
  (st.style === 'gallery' ? drawGallery : st.style === 'film' ? drawFilm : drawPolaroid)(ctx, o);
  ctx.restore(); st.rect = o.rect;
}
function redraw() { if (!raf) raf = requestAnimationFrame(render); }

function defaultCaption(info) {
  info = info || {}; var place = info.place ? info.place.charAt(0).toUpperCase() + info.place.slice(1) : 'On the road', when = info.when && info.when !== 'daytime' ? ', ' + info.when : '';
  return place + when;
}
function blob(type, cb) { cv.toBlob(cb, type, type === 'image/jpeg' ? 0.93 : undefined); }
function fileName() { return 'aashish-pandey-' + (st.caption || 'photo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + st.style + '.jpg'; }
function siteUrl(via) { return 'https://' + SITE + '/?utm_source=' + via + '&utm_medium=photo-share&utm_campaign=ride-photo'; }
function shareText(withTag) { return (st.caption || 'A moment on the road') + '. Snapped riding through a 3D world in my browser. Ride it yourself' + (withTag === false ? '' : ' ' + TAG); }
function flash(b, msg, back) { b.textContent = msg; setTimeout(function () { b.textContent = back; }, 1600); }
function track(n) { try { window.apTrack && window.apTrack(n, {}); } catch (e) { /* analytics is optional */ } }

/* ---------- dialog ---------- */
function css() {
  if (document.getElementById('ap-pp-css')) return; var s = document.createElement('style'); s.id = 'ap-pp-css';
  s.textContent = '.ap-pp{border:1px solid rgba(244,239,230,.16);border-radius:24px;background:#0f1433;color:#f4efe6;padding:0;width:min(900px,calc(100vw - 20px));max-height:calc(100dvh - 20px);overflow:auto;font-family:Instrument Sans,system-ui,sans-serif}'
    + '.ap-pp::backdrop{background:rgba(3,4,12,.82);backdrop-filter:blur(5px)}'
    + '.ap-pp__in{padding:clamp(14px,2.4vw,24px);display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:clamp(14px,2.4vw,26px);align-items:start}'
    + '.ap-pp__cv{width:100%;aspect-ratio:4/5;max-height:calc(100dvh - 60px);object-fit:contain;border-radius:12px;display:block;touch-action:none;cursor:grab;background:#070916;margin:0 auto}'
    + '.ap-pp__cv:active{cursor:grabbing}.ap-pp__side{display:flex;flex-direction:column;gap:14px;min-width:0}'
    + '.ap-pp__head{display:flex;align-items:center;justify-content:space-between}.ap-pp__head h2{margin:0;font:600 22px/1.1 Instrument Sans,system-ui,sans-serif;letter-spacing:-.02em}'
    + '.ap-pp__x{width:34px;height:34px;border-radius:50%;border:1px solid rgba(244,239,230,.18);background:none;color:#f4efe6;font-size:21px;line-height:1;cursor:pointer}'
    + '.ap-pp__lab{font:500 10.5px JetBrains Mono,ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#aaa4b8;margin:0 0 7px}'
    + '.ap-pp__tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}'
    + '.ap-pp__t{height:40px;border-radius:12px;border:1px solid rgba(244,239,230,.16);background:none;color:#f4efe6;font:500 13px Instrument Sans,system-ui,sans-serif;cursor:pointer}'
    + '.ap-pp__t[aria-pressed=true]{background:#f5b867;border-color:#f5b867;color:#1a1420;font-weight:600}'
    + '.ap-pp__in input{width:100%;height:44px;border-radius:12px;border:1px solid rgba(244,239,230,.18);background:rgba(244,239,230,.05);color:#f4efe6;padding:0 14px;font:500 15px Instrument Sans,system-ui,sans-serif;box-sizing:border-box}'
    + '.ap-pp__in input:focus-visible,.ap-pp__t:focus-visible,.ap-pp__b:focus-visible,.ap-pp__x:focus-visible{outline:2px solid #7ff3e1;outline-offset:2px}'
    + '.ap-pp__act{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ap-pp__b{height:44px;border-radius:999px;border:1px solid rgba(244,239,230,.18);background:none;color:#f4efe6;font:500 14px Instrument Sans,system-ui,sans-serif;cursor:pointer;padding:0 12px}'
    + '.ap-pp__b:hover{border-color:#f5b867}.ap-pp__b--p{grid-column:1/-1;background:#f5b867;border-color:#f5b867;color:#1a1420;font-weight:600}'
    + '.ap-pp__soc{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.ap-pp__soc a{height:38px;border-radius:10px;border:1px solid rgba(244,239,230,.14);color:#cfc9d8;font:500 12.5px Instrument Sans,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;text-decoration:none}'
    + '.ap-pp__soc a:hover{border-color:#f5b867;color:#f4efe6}.ap-pp__n{margin:0;font-size:12.5px;line-height:1.55;color:#aaa4b8}'
    + '@media(max-width:760px){.ap-pp__in{grid-template-columns:1fr}.ap-pp__cv{max-height:52dvh}.ap-pp__side{display:contents}.ap-pp__head{order:-1}}';
  document.head.appendChild(s);
}
function build() {
  if (built) return; built = true; css();
  dlg = document.createElement('dialog'); dlg.className = 'ap-pp'; dlg.setAttribute('aria-labelledby', 'ap-pp-t');
  dlg.innerHTML = '<div class="ap-pp__in"><canvas class="ap-pp__cv" width="' + W + '" height="' + H + '" role="img" aria-label="Your framed photo"></canvas>'
    + '<div class="ap-pp__side"><div class="ap-pp__head"><h2 id="ap-pp-t">Your photo</h2><button type="button" class="ap-pp__x" aria-label="Close">&times;</button></div>'
    + '<div><p class="ap-pp__lab">Frame</p><div class="ap-pp__tabs">' + STYLES.map(function (s) { return '<button type="button" class="ap-pp__t" data-s="' + s[0] + '" aria-pressed="false">' + s[1] + '</button>'; }).join('') + '</div></div>'
    + '<div><p class="ap-pp__lab">Caption</p><input type="text" maxlength="42" autocomplete="off" aria-label="Caption" data-cap></div>'
    + '<div class="ap-pp__act"><button type="button" class="ap-pp__b ap-pp__b--p" data-a="native" hidden>Share&hellip;</button><button type="button" class="ap-pp__b ap-pp__b--p" data-a="dl">Download JPG</button>'
    + '<button type="button" class="ap-pp__b" data-a="img">Copy image</button><button type="button" class="ap-pp__b" data-a="cap">Copy caption</button></div>'
    + '<div class="ap-pp__soc" data-soc><a data-w target="_blank" rel="noopener">WhatsApp</a><a data-x target="_blank" rel="noopener">X</a><a data-l target="_blank" rel="noopener">LinkedIn</a></div>'
    + '<p class="ap-pp__n">Drag the picture to move it inside the frame. The print is made in your browser and goes nowhere until you send it. Attach the saved image when you post.</p></div></div>';
  document.body.appendChild(dlg); cv = dlg.querySelector('canvas'); ctx = cv.getContext('2d'); capIn = dlg.querySelector('[data-cap]');
  dlg.querySelector('.ap-pp__x').addEventListener('click', close);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
  dlg.addEventListener('close', function () { if (st && st.onClose) st.onClose(); });
  dlg.addEventListener('keydown', function (e) { e.stopPropagation(); });   // typing a caption must not steer the bike
  dlg.addEventListener('keyup', function (e) { e.stopPropagation(); });
  dlg.querySelectorAll('.ap-pp__t').forEach(function (b) { b.addEventListener('click', function () { setStyle(b.getAttribute('data-s')); }); });
  capIn.addEventListener('input', function () { st.caption = capIn.value.trim(); redraw(); links(); });
  var drag = null;
  cv.addEventListener('pointerdown', function (e) { if (!st || !st.rect) return; drag = { x: e.clientX, y: e.clientY, fx: st.fx, fy: st.fy }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', function (e) {
    if (!drag || !st.rect) return; var k = W / cv.getBoundingClientRect().width, r = st.rect.sc;
    var dx = (e.clientX - drag.x) * k / r.sc, dy = (e.clientY - drag.y) * k / r.sc;
    if (r.slackX > 1) st.fx = clamp(drag.fx - dx / r.slackX, 0, 1); if (r.slackY > 1) st.fy = clamp(drag.fy - dy / r.slackY, 0, 1); redraw();
  });
  var end = function () { drag = null; }; cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  dlg.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-a]'); if (!b || !st) return; var a = b.getAttribute('data-a'), label = b.textContent;
    if (a === 'cap') { try { navigator.clipboard.writeText(shareText() + ' ' + siteUrl('copy')).then(function () { flash(b, 'Copied', label); }, function () { flash(b, 'Not allowed', label); }); } catch (x) { flash(b, 'Not supported', label); } return; }
    if (a === 'img') { blob('image/png', function (bl) { if (!bl) return; if (!navigator.clipboard || !window.ClipboardItem) return flash(b, 'Not supported here', label); navigator.clipboard.write([new ClipboardItem({ 'image/png': bl })]).then(function () { flash(b, 'Copied', label); track('photo_copy'); }, function () { flash(b, 'Not allowed', label); }); }); return; }
    blob('image/jpeg', function (bl) {
      if (!bl) return;
      if (a === 'dl') { var u = URL.createObjectURL(bl), l = document.createElement('a'); l.href = u; l.download = fileName(); document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 2000); track('photo_download'); }
      else if (a === 'native') { var d = { title: st.caption || 'Photo', text: shareText(), url: siteUrl('native') }; try { var f = new File([bl], fileName(), { type: 'image/jpeg' }); if (navigator.canShare && navigator.canShare({ files: [f] })) d.files = [f]; } catch (x) { /* text only */ } navigator.share(d).then(function () { track('photo_share'); }, function () {}); }
    });
  });
}
function links() {
  var t = function (tag) { return encodeURIComponent(shareText(tag)); };
  dlg.querySelector('[data-w]').href = 'https://wa.me/?text=' + t() + '%20' + encodeURIComponent(siteUrl('whatsapp'));
  dlg.querySelector('[data-x]').href = 'https://twitter.com/intent/tweet?text=' + t(false) + '&url=' + encodeURIComponent(siteUrl('x')) + '&hashtags=' + TAG.slice(1);
  dlg.querySelector('[data-l]').href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(siteUrl('linkedin'));
}
function setStyle(s) { st.style = s; try { sessionStorage.setItem('apPrintStyle', s); } catch (e) { /* optional */ } dlg.querySelectorAll('.ap-pp__t').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-s') === s ? 'true' : 'false'); }); st.fx = st.fy = 0.5; redraw(); }
function close() { if (dlg && dlg.open) dlg.close(); }

function open(opts) {
  opts = opts || {}; if (!opts.src) return; build();
  var saved = 'polaroid'; try { saved = sessionStorage.getItem('apPrintStyle') || saved; } catch (e) { /* optional */ }
  var img = new Image();
  st = { img: null, style: saved, fx: 0.5, fy: 0.5, caption: defaultCaption(opts.info), date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), onClose: opts.onClose, rect: null };
  capIn.value = st.caption; links();
  dlg.querySelector('[data-a=native]').hidden = !(navigator.share); dlg.querySelector('[data-a=dl]').classList.toggle('ap-pp__b--p', !navigator.share); dlg.querySelector('[data-soc]').hidden = !!navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  img.onload = function () { fontsReady().then(function () { st.img = img; setStyle(st.style); }); };
  loadLogo(redraw);
  img.src = opts.src;
  if (opts.onOpen) opts.onOpen();
  if (!dlg.open) dlg.showModal();
}

window.ApPhoto = { open: open, close: close };
})();
