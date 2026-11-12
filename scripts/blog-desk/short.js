#!/usr/bin/env node
// Makes a phone-first short (1080x1920, 9:16) for YouTube Shorts, Instagram Reels and TikTok: a natural voice (Kokoro, see tts.py), an illustrated
// scene that changes every few seconds, a big kinetic headline, burned-in captions kept clear of each app's buttons, and a thumbnail frame.
//   node scripts/blog-desk/short.js <video.json> <out.mp4> [--silent]
// video.json: { title, url, accent, label, voice?: {am_michael:.6,am_adam:.4}, speed?, scenes: [ { say, head, art | type:"stats"|"proscons", stats:[{v,l}], pros, cons } ] }
// Rules it follows: the hook lands in the first 3 seconds, a new picture every 3 to 6 seconds, one idea per scene, the last 380 px stay empty (the app's UI sits there).
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const ROOT = path.join(__dirname, '..', '..'), G = require('./graphics.js');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const b64 = (f, mime) => 'data:' + mime + ';base64,' + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const [, , vfile, outFile] = process.argv; if (!vfile || !outFile) { console.error('usage: short.js <video.json> <out.mp4> [--silent]'); process.exit(2); }
const V = JSON.parse(fs.readFileSync(vfile, 'utf8')), SILENT = process.argv.includes('--silent'), acc = G.ACC[V.accent] || G.ACC.amber;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'short-')), sh = (c) => cp.execSync(c, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 }).toString();
const FONTS = `@font-face{font-family:Geist;font-weight:100 900;src:url(${b64('assets/vendor/fonts/geist-normal-latin.woff2', 'font/woff2')})}`;
const hash = (str) => { let h = 7; for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
let sd = hash(V.title) % 2147483646 + 1; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
const STARS = Array.from({ length: 90 }, () => `<circle cx="${(rnd() * 1080).toFixed(1)}" cy="${(rnd() * 1300).toFixed(1)}" r="${rnd() < 0.15 ? 2.4 : 1.3}" fill="#f4efe6" opacity="${(0.2 + rnd() * 0.5).toFixed(2)}"/>`).join('');
const hl = (t, c) => { const w = esc(t).split(' '), i = w.findIndex((x) => /\d/.test(x)), k = i > -1 ? i : w.length - 1; return w.map((x, j) => (j === k ? `<em style="color:${c}">${x}</em>` : x)).join(' '); };
function visual(s, prog, seq) {
  if (s.type === 'stats') return `<div class="stats n${(s.stats || []).length}">${s.stats.map((x) => `<div class="stat"><b>${esc(x.v)}</b><span>${esc(x.l)}</span></div>`).join('')}</div>`;
  if (s.type === 'proscons') return `<div class="pc"><div class="col"><h2 style="color:#7ee0a8">Pros</h2>${s.pros.map((x) => `<p><i style="background:#7ee0a8"></i>${esc(x)}</p>`).join('')}</div><div class="col"><h2 style="color:#ff8f8f">Cons</h2>${s.cons.map((x) => `<p><i style="background:#ff8f8f"></i>${esc(x)}</p>`).join('')}</div></div>`;
  return `<div class="art" style="transform:scale(${(1 + 0.045 * prog).toFixed(3)}) translateY(${(-14 * prog).toFixed(1)}px) rotate(${((seq % 2 ? 1 : -1) * 0.8 * prog).toFixed(2)}deg)">${G.artSvg(s.art || 'robot', V.accent)}</div>`;
}
function html(s, cap, prog, seq, pct) {
  const c = acc[0];
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}
*{margin:0;box-sizing:border-box}html,body{width:1080px;height:1920px;overflow:hidden;background:#070916}
.c{position:relative;width:1080px;height:1920px;color:#fff;font-family:Geist,sans-serif;overflow:hidden;background:radial-gradient(80% 45% at 50% 62%,rgba(${acc[1]},.32),transparent 70%),radial-gradient(60% 30% at 50% 100%,rgba(${acc[1]},.30),rgba(196,106,74,.12) 50%,transparent 75%),linear-gradient(180deg,#070916 0%,#0b1030 60%,#1a1640 100%)}
.stars{position:absolute;inset:0}.hz{position:absolute;left:0;right:0;bottom:0;height:420px;background:url(${b64('assets/nr/horizon.svg', 'image/svg+xml')}) center bottom/1080px 420px no-repeat;opacity:.9}
.bar{position:absolute;left:48px;right:48px;top:64px;height:8px;border-radius:4px;background:rgba(255,255,255,.14);z-index:5}.bar i{display:block;height:100%;width:${pct}%;border-radius:4px;background:${c}}
.badge{position:absolute;left:48px;top:104px;display:flex;align-items:center;gap:18px;z-index:4;font-weight:700;font-size:34px;background:rgba(7,9,22,.62);border:2px solid rgba(${acc[1]},.5);border-radius:999px;padding:10px 28px 10px 12px}.badge img{width:52px;height:52px;border-radius:12px}.badge span{color:${c};letter-spacing:.12em;text-transform:uppercase;font-size:26px}
h1{position:absolute;left:48px;right:48px;top:236px;text-align:center;font-weight:900;font-size:${(s.head || '').length > 22 ? 112 : 132}px;line-height:1;letter-spacing:-.04em;text-wrap:balance;-webkit-text-stroke:12px #05060f;paint-order:stroke fill;text-shadow:0 12px 28px rgba(0,0,0,.55);z-index:3}h1 em{font-style:normal;text-shadow:0 0 60px rgba(${acc[1]},.6),0 12px 28px rgba(0,0,0,.55)}
.stage{position:absolute;left:0;right:0;top:520px;height:680px;display:flex;align-items:center;justify-content:center;z-index:2}.art{width:900px;filter:drop-shadow(0 16px 36px rgba(0,0,0,.5))}.art svg{display:block;width:100%;height:auto}
.stats{width:920px;display:flex;flex-direction:column;gap:26px}.stat{background:rgba(14,18,48,.86);border:2px solid rgba(${acc[1]},.4);border-radius:44px;padding:${(s.stats || []).length > 2 ? 28 : 44}px 56px;box-shadow:0 18px 40px rgba(0,0,0,.4)}.stat b{display:block;font-weight:900;font-size:${(s.stats || []).length > 2 ? 84 : (s.stats || []).length > 1 ? 112 : 140}px;white-space:nowrap;letter-spacing:-.04em;line-height:1;color:${c}}.stat span{display:block;margin-top:12px;font-size:${(s.stats || []).length > 2 ? 38 : 44}px;color:#d7d1e0;font-weight:500}
.pc{width:940px;display:flex;flex-direction:column;gap:24px}.col{background:rgba(14,18,48,.86);border:2px solid rgba(244,239,230,.16);border-radius:40px;padding:34px 48px}.col h2{font:700 36px Geist;letter-spacing:.14em;text-transform:uppercase;margin-bottom:14px}.col p{display:flex;gap:22px;font-size:46px;line-height:1.15;font-weight:600;margin-bottom:12px}.col i{flex:none;width:18px;height:18px;border-radius:50%;margin-top:18px}
.cap{position:absolute;left:60px;right:60px;top:1240px;text-align:center;z-index:6}.cap span{font-weight:900;font-size:92px;line-height:1.12;letter-spacing:-.02em;color:#fff;-webkit-text-stroke:14px #05060f;paint-order:stroke fill;text-shadow:0 10px 24px rgba(0,0,0,.6)}.cap em{font-style:normal;color:${c}}
</style></head><body><div class="c"><div class="bg"></div><svg class="stars" width="1080" height="1920">${STARS}</svg><div class="hz"></div>
<div class="bar"><i></i></div><div class="badge"><img src="${b64('assets/logo-mark.svg', 'image/svg+xml')}" alt="">Aashish Pandey <span>${esc(V.label || 'Explainer')}</span></div>
<h1>${hl(s.head || '', c)}</h1><div class="stage">${visual(s, prog, seq)}</div><div class="cap"><span>${hl(cap, c).replace(/<em[^>]*>(.*?)<\/em>/, '<em>$1</em>')}</span></div></div></body></html>`;
}
// 2 to 4 words per caption, broken at punctuation when possible
function chunks(text) { const out = []; text.split(/(?<=[,;:.!?])\s+/).forEach((p) => { const w = p.split(/\s+/); for (let i = 0; i < w.length;) { const left = w.length - i, n = left <= 4 ? left : left === 5 ? 3 : 3; out.push(w.slice(i, i + n).join(' ')); i += n; } }); return out; }
(async () => {
  let tl;
  if (!SILENT) { sh(`python3 "${path.join(__dirname, 'tts.py')}" "${vfile}" "${TMP}"`); tl = JSON.parse(fs.readFileSync(path.join(TMP, 'timeline.json'), 'utf8')); }
  else { let t = 0; tl = { scenes: V.scenes.map((s) => ({ sentences: s.say.split(/(?<=[.!?])\s+/).map((x) => { const d = x.split(/\s+/).length / 2.7, r = { text: x, start: t, end: t + d + 0.3 }; t = r.end; return r; }) })), total: t }; }
  let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(sh('npm root -g').trim() + '/playwright')); }
  const browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}), page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const items = []; V.scenes.forEach((s, si) => { const rows = []; tl.scenes[si].sentences.forEach((sn) => { const cs = chunks(sn.text), tw = cs.reduce((a, c) => a + c.split(/\s+/).length, 0); let t = sn.start; cs.forEach((c, ci) => { const share = (sn.end - sn.start) * (c.split(/\s+/).length / tw); rows.push({ si, text: c, t0: t, t1: ci === cs.length - 1 ? sn.end : t + share }); t += share; }); }); rows.forEach((r, i) => { r.prog = rows.length > 1 ? i / (rows.length - 1) : 0; items.push(r); }); });
  const frames = []; let n = 0;
  for (const it of items) { await page.setContent(html(V.scenes[it.si], it.text, it.prog, it.si, Math.round(100 * it.t0 / tl.total))); await page.evaluate(() => document.fonts.ready); const f = path.join(TMP, `f${String(n++).padStart(4, '0')}.png`); await page.screenshot({ path: f }); frames.push({ f, d: it.t1 - it.t0, text: it.text }); }
  // the thumbnail (covers and Shorts thumbnails share the explainer-thumbnail rules): the first scene with its headline and no caption
  await page.setContent(html(V.scenes[0], '', 0, 0, 0)); await page.evaluate(() => document.fonts.ready); await page.screenshot({ path: path.resolve(outFile).replace(/\.mp4$/, '') + '-poster.jpg', type: 'jpeg', quality: 86 });
  await browser.close();
  fs.writeFileSync(path.join(TMP, 'list.txt'), frames.map((x) => `file '${x.f}'\nduration ${x.d.toFixed(3)}`).join('\n') + `\nfile '${frames[frames.length - 1].f}'\n`);
  let audio = '';
  if (!SILENT) {
    // a broadcast-style finish for the voice: roll off rumble, add a little warmth and presence, even out the loudness, then normalise
    sh(`ffmpeg -y -i "${path.join(TMP, 'voice.wav')}" -af "highpass=f=70,equalizer=f=180:t=q:w=1:g=2,equalizer=f=3200:t=q:w=1.2:g=2.5,acompressor=threshold=-20dB:ratio=3:attack=12:release=180:makeup=3,loudnorm=I=-15:TP=-1.5:LRA=7" -ar 44100 -ac 1 "${path.join(TMP, 'voice2.wav')}"`);
    audio = `-i "${path.join(TMP, 'voice2.wav')}" -c:a aac -b:a 192k`;
  }
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  sh(`ffmpeg -y -f concat -safe 0 -i "${path.join(TMP, 'list.txt')}" ${audio} -vf "fps=30,format=yuv420p" -c:v libx264 -preset medium -crf 20 -movflags +faststart ${audio ? '-shortest' : ''} "${path.resolve(outFile)}"`);
  const ts = (x) => new Date(Math.round(x * 1000)).toISOString().slice(11, 23).replace('.', ','); let t = 0;
  fs.writeFileSync(path.resolve(outFile).replace(/\.mp4$/, '') + '.srt', frames.map((f, i) => { const r = `${i + 1}\n${ts(t)} --> ${ts(t + f.d - 0.04)}\n${f.text}\n`; t += f.d; return r; }).join('\n'));
  console.log(JSON.stringify({ out: path.resolve(outFile), seconds: Math.round(t * 10) / 10, scenes: V.scenes.length, frames: frames.length }));
})().catch((e) => { console.error(e); process.exit(1); });
