// Banner style C "Isometric Night" (chosen by Aashish 2026-11-14). Cover 1200x630 and thumbnail 1280x720 share one design.
// Rules (from thumbnail and social-image research): one subject, hook text of 2 to 4 big words, high contrast, readable at 300px wide, 60px safe margin,
// facts on the banner come from the post. Optional post fields: banner_tag (amber tag, up to 24 chars, e.g. a CVE id or date), banner_sub (grey line, up to 60 chars).
const U = 56, CX = 0.866, SY = 0.5;
const P = (x, y, z, ox, oy) => [ox + (x - y) * CX * U, oy + (x + y) * SY * U - z * U];
const poly = (pts, fill, extra = '') => `<polygon points="${pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="${fill}" ${extra}/>`;
function cube(x, y, z, w, d, h, c, ox, oy) {
  const t = [P(x, y, z + h, ox, oy), P(x + w, y, z + h, ox, oy), P(x + w, y + d, z + h, ox, oy), P(x, y + d, z + h, ox, oy)];
  const l = [P(x, y + d, z + h, ox, oy), P(x + w, y + d, z + h, ox, oy), P(x + w, y + d, z, ox, oy), P(x, y + d, z, ox, oy)];
  const r = [P(x + w, y, z + h, ox, oy), P(x + w, y + d, z + h, ox, oy), P(x + w, y + d, z, ox, oy), P(x + w, y, z, ox, oy)];
  const st = 'stroke="#0b1230" stroke-width="2" stroke-linejoin="round"';
  return poly(l, c[1], st) + poly(r, c[2], st) + poly(t, c[0], st);
}
const quadL = (x, y, z, w, d, h, fill, ox, oy, a, b, c2, d2) => poly([P(x + a * w, y + d, z + b * h, ox, oy), P(x + c2 * w, y + d, z + b * h, ox, oy), P(x + c2 * w, y + d, z + d2 * h, ox, oy), P(x + a * w, y + d, z + d2 * h, ox, oy)], fill);
const DARK = ['#2b3d7a', '#1a2757', '#111a40'];
function isoServer() {
  const ox = 300, oy = 400; let g = '<ellipse cx="310" cy="500" rx="300" ry="95" fill="#000" opacity=".35"/>';
  for (let i = 0; i < 3; i++) {
    const z = i * 0.95; g += cube(0, 0, z, 4.2, 3, 0.7, DARK, ox, oy);
    g += quadL(0, 0, z, 4.2, 3, 0.7, '#6ef3dc', ox, oy, .08, .3, .14, .7) + quadL(0, 0, z, 4.2, 3, 0.7, i === 1 ? '#ff6b6b' : '#6ef3dc', ox, oy, .19, .3, .25, .7);
    for (let k = 0; k < 3; k++) g += quadL(0, 0, z, 4.2, 3, 0.7, '#0b1230', ox, oy, .45 + k * .14, .3, .52 + k * .14, .7);
  }
  g += '<g stroke="#ff6b6b" stroke-width="5" stroke-linecap="round" opacity=".8"><path d="M640 150 L690 110"/><path d="M650 200 L700 195"/></g>';
  g += '<g transform="translate(380,-10) scale(.8)"><path d="M180 40 L300 78 V190 C300 262 250 312 180 346 C110 312 60 262 60 190 V78 Z" fill="#0d1535" stroke="#ffd166" stroke-width="9" stroke-linejoin="round"/><path d="M180 66 L278 96 V188 C278 246 238 288 180 318 C122 288 82 246 82 188 V96 Z" fill="#6ef3dc"/><path d="M180 66 L278 96 V188 C278 246 238 288 180 318Z" fill="#2aa7a6" opacity=".6"/><rect x="146" y="166" width="68" height="62" rx="12" fill="#0d1535"/><path d="M160 166 V148 a20 20 0 0 1 40 0" fill="none" stroke="#0d1535" stroke-width="12" stroke-linecap="round" transform="rotate(18 190 150)"/><circle cx="180" cy="196" r="9" fill="#ffb347"/></g>';
  g += '<g transform="translate(30,90)"><path d="M70 0 L140 120 H0Z" fill="#ff6b6b" stroke="#0d1535" stroke-width="8" stroke-linejoin="round"/><rect x="63" y="42" width="14" height="44" rx="6" fill="#0d1535"/><circle cx="70" cy="100" r="8" fill="#0d1535"/></g>';
  return g;
}
function isoBars(label) {
  const ox = 230, oy = 420, hs = [1.1, 1.9, 2.7, 3.6, 4.9], pts = []; let g = '<ellipse cx="380" cy="520" rx="310" ry="90" fill="#000" opacity=".35"/>';
  hs.forEach((h, i) => { const x = i * 1.15, c = i === 4 ? ['#6ef3dc', '#2fb8b0', '#1b7f86'] : ['#4d6bc4', '#2f4a9e', '#1f3377']; g += cube(x, 0, 0, 0.95, 0.95, h, c, ox, oy); pts.push(P(x + .475, .475, h, ox, oy)); });
  g += `<polyline points="${pts.map((p) => p[0].toFixed(0) + ',' + (p[1] - 60).toFixed(0)).join(' ')}" fill="none" stroke="#ffd166" stroke-width="7" stroke-dasharray="2 14" stroke-linecap="round"/>`;
  const [tx, ty] = pts[4];
  g += `<ellipse cx="${tx}" cy="${ty - 56}" rx="62" ry="18" fill="#b8741a"/><rect x="${tx - 62}" y="${ty - 72}" width="124" height="22" fill="#ffb347"/><ellipse cx="${tx}" cy="${ty - 72}" rx="62" ry="18" fill="#ffd166" stroke="#0b1230" stroke-width="3"/><text x="${tx}" y="${ty - 63}" text-anchor="middle" font-family="Geist" font-weight="900" font-size="26" fill="#0b1230">$</text>`;
  g += `<g transform="translate(20,40)"><rect width="200" height="60" rx="30" fill="#0d1535" stroke="#ffd166" stroke-width="4"/><text x="100" y="41" text-anchor="middle" font-family="Geist" font-weight="900" font-size="28" fill="#ffd166" letter-spacing="4">${label}</text></g>`;
  return g;
}
function pickIso(post) {
  const t = [post.slug, post.category, (post.tags || []).join(' '), post.title].join(' ').toLowerCase();
  if (/secur|vulnerab|cve|patch|breach|privacy|dpdp|gdpr|scam|fraud|flaw|exploit/.test(t)) return 'server';
  if (/\bipo\b|stock|share price|earnings|revenue|funding|valuation|pricing|market|layoff|nasdaq/.test(t)) return 'bars';
  return null;
}
// hook text split into up to 3 lines; the first number, else the last line, gets the accent colour
function hookLines(text) {
  const sent = text.split(/(?<=[.!?])\s+/).filter(Boolean); if (sent.length >= 2 && sent.length <= 3) return sent;
  const w = text.split(/\s+/).filter(Boolean); if (w.length <= 1) return [w.join(' ')];
  let lines; if (w.length === 2) lines = [w[0], w[1]]; else if (w.length === 3) lines = w.map((x) => x); else if (w.length === 4) lines = [w[0] + ' ' + w[1], w[2] + ' ' + w[3]]; else lines = [w[0] + ' ' + w[1], w.slice(2, w.length - 1).join(' '), w[w.length - 1]].filter(Boolean);
  return lines.slice(0, 3);
}
function coverHtmlC(post, W, H, G) {
  const { esc, b64, FONTS, look, pickArt, ART, DEFS, STAGE, KIND, hookText } = G;
  const k = W / 1600, SH = Math.round(1600 * H / W), o = look(post), text = hookText(post).toUpperCase().replace(/[.]+$/, ''), lines = hookLines(text);
  const maxc = Math.max(...lines.map((l) => l.length)), fs = Math.min(170, Math.floor(Math.min(820, 760 + (SH - 840) * 0.2) / (maxc * 0.76)), Math.floor((SH - 140 - 250) / (lines.length * 0.92)));
  const numAt = lines.findIndex((l) => /\d/.test(l)), hi = numAt > -1 ? numAt : lines.length - 1;
  const h1 = lines.map((l, i) => (i === hi ? `<em>${esc(l)}</em>` : esc(l))).join('<br>');
  const ph = post.photo && post.photo.file, iso = pickIso(post);
  const art = ph ? `<div class="ph"><img src="${b64(ph, 'image/jpeg')}" alt=""></div>`
    : iso === 'server' ? `<svg class="art" viewBox="0 0 720 640">${isoServer()}</svg>`
    : iso === 'bars' ? `<svg class="art" viewBox="0 0 720 640">${isoBars('NASDAQ')}</svg>`
    : `<svg class="art2" viewBox="0 0 400 300" fill="none">${DEFS(o.acc[0])}${STAGE(o.acc[0])}${ART[pickArt(post)](o.acc[0])}</svg>`;
  const tag = String(post.banner_tag || '').slice(0, 24).toUpperCase(), sub = String(post.banner_sub || post.title || '').slice(0, 60);
  const css = `*{margin:0;box-sizing:border-box}html,body{width:${W}px;height:${H}px;overflow:hidden;background:#070b22}
${FONTS()}
.s{width:1600px;height:${SH}px;zoom:${k};position:relative;overflow:hidden;color:#fff;font-family:Geist,sans-serif;background:radial-gradient(90% 90% at 75% 45%,#22337a 0%,#0e1740 50%,#070b22 100%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(#ffffff0a 2px,transparent 2px),linear-gradient(90deg,#ffffff0a 2px,transparent 2px);background-size:64px 64px;-webkit-mask-image:radial-gradient(70% 80% at 70% 50%,#000,transparent)}
.top{position:absolute;left:80px;top:60px;display:flex;gap:16px;align-items:center;font-weight:800;font-size:25px;letter-spacing:4px;color:#9fb0e6}
.top img{width:56px;height:56px;border-radius:14px;box-shadow:0 0 0 2px #6ef3dc55,0 8px 24px #0008}.top b{color:#6ef3dc}
h1{position:absolute;left:80px;top:${SH > 860 ? 160 : 135}px;font-size:${fs}px;line-height:.92;font-weight:900;letter-spacing:-.04em;text-transform:uppercase}
h1 em{font-style:normal;color:#6ef3dc;text-shadow:0 0 50px #6ef3dc77}
.sub{position:absolute;left:80px;bottom:62px;max-width:760px;font-size:30px;font-weight:700;color:#c3cef5;display:flex;align-items:center;gap:18px}
.sub:before{content:"";flex:none;width:56px;height:6px;background:#ffb347;border-radius:6px}
.tag{position:absolute;left:80px;bottom:${tag ? 136 : 0}px;font-weight:900;font-size:24px;letter-spacing:4px;padding:10px 20px;border-radius:10px;background:#ffb347;color:#0b1230;display:${tag ? 'block' : 'none'}}
.art{position:absolute;left:820px;top:${Math.round((SH - 640) / 2 + 20)}px;width:720px;height:640px;filter:drop-shadow(0 30px 40px #0009)}
.art2{position:absolute;left:840px;top:${Math.round((SH - 560) / 2)}px;width:700px;height:525px;filter:drop-shadow(0 30px 40px #0009)}
.ph{position:absolute;left:900px;top:${Math.round((SH - 560) / 2)}px;width:560px;height:560px;border-radius:36px;overflow:hidden;border:6px solid #6ef3dc;box-shadow:0 0 90px #6ef3dc55,0 30px 60px #000a}.ph img{width:100%;height:100%;object-fit:cover}
.cr{position:absolute;right:60px;bottom:26px;font:500 20px Geist,sans-serif;color:rgba(244,239,230,.6)}`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="s"><div class="grid"></div><div class="top"><img src="${b64('assets/logo-mark.svg', 'image/svg+xml')}" alt="">AASHISH PANDEY <b>${esc((KIND[post.kind] || 'Blog').toUpperCase())}</b></div><h1>${h1}</h1><div class="tag">${esc(tag)}</div><div class="sub">${esc(sub)}</div>${art}${ph ? `<div class="cr">${esc(post.photo.credit || '')}</div>` : ''}</div></body></html>`;
}
module.exports = { coverHtmlC, hookLines, pickIso };
