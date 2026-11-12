#!/usr/bin/env node
// Makes an animated phone-first short (1080x1920, 9:16, 30 fps) for YouTube Shorts, Instagram Reels and TikTok.
// Real motion graphics: headline words spring in, the picture builds itself and floats, charts draw on, numbers count up, the camera pushes in, scenes change with an
// accent sweep, and the captions light each word as it is spoken. The voice is Kokoro (see tts.py): no account, no key.
//   node scripts/blog-desk/short.js <video.json> <out.mp4> [--silent]
// video.json: { title, accent, label, topic: "tech"|"other", voice?, speed?, scenes: [ { beat, head, say, art | type:"stats"|"proscons", stats:[{v,l}], pros, cons } ] }
// The story shape it expects: Hook (first 3 seconds) -> Setup -> Insight -> Proof -> Twist -> Verdict -> Next. 30 to 90 seconds in all.
// Every frame is computed from the time t (short-page.js), so a render is identical every time.
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const ROOT = path.join(__dirname, '..', '..'), G = require('./graphics.js');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const b64 = (f, mime) => 'data:' + mime + ';base64,' + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const [, , vfile, outFile] = process.argv; if (!vfile || !outFile) { console.error('usage: short.js <video.json> <out.mp4> [--silent]'); process.exit(2); }
const V = JSON.parse(fs.readFileSync(vfile, 'utf8')), SILENT = process.argv.includes('--silent'), acc = G.ACC[V.accent] || G.ACC.amber, FPS = 30;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'short-')), sh = (c) => cp.execSync(c, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 }).toString();
const FONTS = `@font-face{font-family:Geist;font-weight:100 900;src:url(${b64('assets/vendor/fonts/geist-normal-latin.woff2', 'font/woff2')})}`;
const PAGE_JS = fs.readFileSync(path.join(__dirname, 'short-page.js'), 'utf8');
const hash = (str) => { let h = 7; for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
let sd = hash(V.title) % 2147483646 + 1; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
const STARS = Array.from({ length: 80 }, () => `<circle cx="${(rnd() * 1080).toFixed(1)}" cy="${(rnd() * 1300).toFixed(1)}" r="${rnd() < 0.15 ? 2.4 : 1.3}" fill="#f4efe6" opacity=".4"/>`).join('');
const PTS = Array.from({ length: 14 }, () => `<i class="pt" style="left:${(60 + rnd() * 960).toFixed(0)}px;width:${(8 + rnd() * 14).toFixed(0)}px;height:${(8 + rnd() * 14).toFixed(0)}px"></i>`).join('');
const c = acc[0];
function headHtml(head) { const w = String(head || '').split(/\s+/).filter(Boolean), i = w.findIndex((x) => /\d/.test(x)), k = i > -1 ? i : w.length - 1; return w.map((x, j) => `<span class="hw"${j === k ? ` style="color:${c};text-shadow:0 0 60px rgba(${acc[1]},.6),0 12px 28px rgba(0,0,0,.55)"` : ''}>${esc(x)}</span>`).join(' '); }
function visual(s) {
  if (s.type === 'stats') return `<div class="stats">${s.stats.map((x, i) => `<div class="stat"><b style="font-size:${s.stats.length > 2 ? 84 : s.stats.length > 1 ? 112 : 140}px"><span data-num="${esc(x.v)}" data-i="${i}">${esc(x.v)}</span></b><span class="l">${esc(x.l)}</span></div>`).join('')}</div>`;
  if (s.type === 'proscons') return `<div class="pc"><div class="col"><h2 style="color:#7ee0a8">Pros</h2>${s.pros.map((x) => `<p><i style="background:#7ee0a8"></i>${esc(x)}</p>`).join('')}</div><div class="col"><h2 style="color:#ff8f8f">Cons</h2>${s.cons.map((x) => `<p><i style="background:#ff8f8f"></i>${esc(x)}</p>`).join('')}</div></div>`;
  return `<div class="art">${G.artSvg(s.art || 'robot', V.accent)}</div>`;
}
function html(s, cfg) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}
*{margin:0;box-sizing:border-box}html,body{width:1080px;height:1920px;overflow:hidden;background:#070916}
.c{position:relative;width:1080px;height:1920px;color:#fff;font-family:Geist,sans-serif;overflow:hidden;background:linear-gradient(180deg,#070916 0%,#0b1030 60%,#1a1640 100%)}
.cam{position:absolute;inset:0;transform-origin:50% 45%;will-change:transform}
.glow{position:absolute;left:50%;top:860px;width:1200px;height:1200px;border-radius:50%;background:radial-gradient(circle,rgba(${acc[1]},.34),transparent 65%)}
.stars{position:absolute;inset:0}.hz{position:absolute;left:0;right:0;bottom:0;height:420px;background:url(${b64('assets/nr/horizon.svg', 'image/svg+xml')}) center bottom/1080px 420px no-repeat;opacity:.9;transform-origin:50% 100%}
.pt{position:absolute;top:420px;border-radius:50%;background:${c};box-shadow:0 0 18px ${c};opacity:0}
.ring{position:absolute;left:50%;top:860px;width:760px;height:760px;border-radius:50%;border:4px solid ${c};opacity:0}
.orbit{position:absolute;left:540px;top:860px;width:22px;height:22px;margin:-11px;border-radius:50%;background:${c};box-shadow:0 0 24px ${c}}.orbit:nth-of-type(2n){background:#fff;width:14px;height:14px;margin:-7px}
.bar{position:absolute;left:48px;right:48px;top:64px;height:8px;border-radius:4px;background:rgba(255,255,255,.14);z-index:5}.bar i{display:block;height:100%;border-radius:4px;background:${c};box-shadow:0 0 16px ${c}}
.badge{position:absolute;left:48px;top:104px;display:flex;align-items:center;gap:18px;z-index:4;font-weight:700;font-size:34px;background:rgba(7,9,22,.62);border:2px solid rgba(${acc[1]},.5);border-radius:999px;padding:10px 28px 10px 12px}.badge img{width:52px;height:52px;border-radius:12px}.badge span{color:${c};letter-spacing:.12em;text-transform:uppercase;font-size:26px}
.beat{position:absolute;right:48px;top:108px;z-index:4;font:800 28px Geist;letter-spacing:.18em;text-transform:uppercase;color:#070916;background:${c};border-radius:999px;padding:14px 28px;box-shadow:0 0 30px rgba(${acc[1]},.5)}
h1{position:absolute;left:48px;right:48px;top:236px;text-align:center;font-weight:900;font-size:${(s.head || '').length > 24 ? 100 : (s.head || '').length > 18 ? 116 : 132}px;line-height:1;letter-spacing:-.04em;-webkit-text-stroke:12px #05060f;paint-order:stroke fill;text-shadow:0 12px 28px rgba(0,0,0,.55);z-index:3}
.hw{display:inline-block;opacity:0}.ul{position:absolute;left:30%;right:30%;bottom:-26px;height:14px;border-radius:7px;background:${c};box-shadow:0 0 24px ${c};transform:scaleX(0)}
.stage{position:absolute;left:0;right:0;top:520px;height:680px;display:flex;align-items:center;justify-content:center;z-index:2}.art{width:900px;filter:drop-shadow(0 16px 36px rgba(0,0,0,.5))}.art svg{display:block;width:100%;height:auto;overflow:visible}
.stats{width:920px;display:flex;flex-direction:column;gap:26px}.stat{background:rgba(14,18,48,.88);border:2px solid rgba(${acc[1]},.42);border-radius:44px;padding:${(s.stats || []).length > 2 ? 28 : 44}px 56px;box-shadow:0 18px 40px rgba(0,0,0,.4),0 0 40px rgba(${acc[1]},.12);opacity:0}.stat b{display:block;font-weight:900;white-space:nowrap;letter-spacing:-.04em;line-height:1;color:${c}}.stat .l{display:block;margin-top:12px;font-size:${(s.stats || []).length > 2 ? 38 : 44}px;color:#d7d1e0;font-weight:500}
.pc{width:940px;display:flex;flex-direction:column;gap:24px}.col{background:rgba(14,18,48,.88);border:2px solid rgba(244,239,230,.16);border-radius:40px;padding:34px 48px;opacity:0}.col h2{font:700 36px Geist;letter-spacing:.14em;text-transform:uppercase;margin-bottom:14px}.col p{display:flex;gap:22px;font-size:46px;line-height:1.15;font-weight:600;margin-bottom:12px;opacity:0}.col i{flex:none;width:18px;height:18px;border-radius:50%;margin-top:18px}
.cap{position:absolute;left:60px;right:60px;top:1240px;text-align:center;z-index:6;font-weight:900;font-size:96px;line-height:1.12;letter-spacing:-.02em;color:#fff;-webkit-text-stroke:14px #05060f;paint-order:stroke fill;text-shadow:0 10px 24px rgba(0,0,0,.6)}
.cw{display:inline-block;margin:0 11px}
.wipe{position:absolute;top:-5%;bottom:-5%;left:0;width:100%;background:linear-gradient(90deg,${c},#fff 80%);z-index:20;display:none}
</style></head><body><div class="c"><div class="cam"><div class="glow"></div><svg class="stars" width="1080" height="1920">${STARS}</svg><div class="hz"></div>${PTS}
${s.type ? '' : '<div class="ring"></div><div class="ring"></div>'}${s.type ? '' : '<i class="orbit"></i><i class="orbit"></i><i class="orbit"></i>'}
<div class="bar"><i></i></div><div class="badge"><img src="${b64('assets/logo-mark.svg', 'image/svg+xml')}" alt="">Aashish Pandey <span>${esc(V.label || 'Explainer')}</span></div>${s.beat ? `<div class="beat">${esc(s.beat)}</div>` : ''}
<h1>${headHtml(s.head)}<div class="ul"></div></h1><div class="stage">${visual(s)}</div><div class="cap"></div></div><div class="wipe"></div></div>
<script>${PAGE_JS}</script></body></html>`;
}
// words with timings inside a sentence's spoken window, then grouped into 3-4 word caption chunks (broken at punctuation when possible)
function wordsOf(sn, base) { const ws = sn.text.split(/\s+/), tot = ws.reduce((a, w) => a + w.length + 2, 0), t0 = sn.start - base, t1 = (sn.vend || sn.end) - base; let t = t0; return ws.map((w) => { const d = (t1 - t0) * (w.length + 2) / tot, r = { w, t0: t, t1: t + d }; t += d; return r; }); }
function chunkify(words, dur) {
  const out = []; let cur = [];
  const flush = () => { if (cur.length) out.push({ words: cur, t0: cur[0].t0 }); cur = []; };
  words.forEach((w, i) => { cur.push(w); const last = i === words.length - 1; if (cur.length >= 4 || /[.,;:!?]$/.test(w.w) && cur.length >= 2 || (words.length - 1 - i === 1 && cur.length >= 3 && false)) flush(); if (last) flush(); });
  out.forEach((ch, i) => { ch.t1 = i < out.length - 1 ? out[i + 1].t0 : dur; ch.text = ch.words.map((w) => w.w).join(' '); }); return out;
}
(async () => {
  let tl;
  if (!SILENT) { sh(`python3 "${path.join(__dirname, 'tts.py')}" "${vfile}" "${TMP}"`); tl = JSON.parse(fs.readFileSync(path.join(TMP, 'timeline.json'), 'utf8')); }
  else { let t = 0; tl = { scenes: V.scenes.map((s) => ({ sentences: s.say.split(/(?<=[.!?])\s+/).map((x) => { const d = x.split(/\s+/).length / 2.7, r = { text: x, start: t, vend: t + d, end: t + d + 0.35 }; t = r.end; return r; }) })), total: t }; }
  const total = tl.total, scenes = V.scenes.map((s, i) => {
    const sn = tl.scenes[i].sentences, start = sn[0].start, end = i < V.scenes.length - 1 ? tl.scenes[i + 1].sentences[0].start : total, dur = end - start;
    const words = sn.flatMap((x) => wordsOf(x, start)), chunks = chunkify(words, dur);
    return { s, start, end, dur, f0: Math.round(start * FPS), f1: i < V.scenes.length - 1 ? Math.round(end * FPS) : Math.ceil(total * FPS), cfg: { idx: i, T0: start, dur, p0: start / total, p1: end / total, art: s.art || '', acc: c, chunks } };
  });
  let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(sh('npm root -g').trim() + '/playwright')); }
  const browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
  const fdir = path.join(TMP, 'frames'); fs.mkdirSync(fdir);
  const open = async (sc) => { const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } }); await page.setContent(html(sc.s, sc.cfg)); await page.evaluate(() => document.fonts.ready); await page.evaluate((cfg) => window.init(cfg), sc.cfg); return page; };
  // a still for the thumbnail: the hook scene a moment in, no captions
  { const sc = scenes[0], page = await open(sc); await page.evaluate(() => window.draw(1.5, { noCaption: true })); await page.screenshot({ path: path.resolve(outFile).replace(/\.mp4$/, '') + '-poster.jpg', type: 'jpeg', quality: 88 }); await page.close(); }
  const queue = scenes.slice(), WORKERS = Math.min(3, Math.max(1, os.cpus().length - 1)); let done = 0; const all = scenes.reduce((a, x) => a + (x.f1 - x.f0), 0);
  await Promise.all(Array.from({ length: WORKERS }, async () => {
    while (queue.length) {
      const sc = queue.shift(), page = await open(sc);
      for (let g = sc.f0; g < sc.f1; g++) { await page.evaluate((t) => window.draw(t), Math.min(sc.dur - 0.001, g / FPS - sc.start)); await page.screenshot({ path: path.join(fdir, `f${String(g).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 84 }); done++; }
      await page.close(); process.stderr.write(`\r${done}/${all} frames`);
    }
  }));
  await browser.close();
  let audio = '';
  if (!SILENT) {
    // a broadcast-style finish for the voice: roll off rumble, add a little warmth and presence, even out the loudness, then normalise
    sh(`ffmpeg -y -i "${path.join(TMP, 'voice.wav')}" -af "highpass=f=70,equalizer=f=180:t=q:w=1:g=2,equalizer=f=3200:t=q:w=1.2:g=2.5,acompressor=threshold=-20dB:ratio=3:attack=12:release=180:makeup=3,loudnorm=I=-15:TP=-1.5:LRA=7" -ar 44100 -ac 1 "${path.join(TMP, 'voice2.wav')}"`);
    audio = `-i "${path.join(TMP, 'voice2.wav')}" -c:a aac -b:a 192k -shortest`;
  }
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  sh(`ffmpeg -y -framerate ${FPS} -i "${path.join(fdir, 'f%05d.jpg')}" ${audio} -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -movflags +faststart "${path.resolve(outFile)}"`);
  const ts = (x) => new Date(Math.round(x * 1000)).toISOString().slice(11, 23).replace('.', ','); let n = 0, srt = [];
  scenes.forEach((sc) => sc.cfg.chunks.forEach((ch) => srt.push(`${++n}\n${ts(sc.start + ch.t0)} --> ${ts(Math.max(sc.start + ch.t0 + 0.2, sc.start + ch.t1 - 0.04))}\n${ch.text}\n`)));
  fs.writeFileSync(path.resolve(outFile).replace(/\.mp4$/, '') + '.srt', srt.join('\n'));
  console.log('\n' + JSON.stringify({ out: path.resolve(outFile), seconds: Math.round(total * 10) / 10, scenes: scenes.length, frames: all }));
})().catch((e) => { console.error(e); process.exit(1); });
