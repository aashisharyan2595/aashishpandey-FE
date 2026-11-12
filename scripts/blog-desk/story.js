#!/usr/bin/env node
// Story videos: a character-led, flat-vector animated explainer (in the spirit of Kurzgesagt and The Infographics Show), 1080x1920, 30 fps, with a natural voice,
// original gentle music and sound effects. All made locally: Playwright draws every frame, Kokoro speaks (tts.py), music.py synthesises the score, ffmpeg mixes.
//   node scripts/blog-desk/story.js <video.json> <out.mp4> [--silent] [--stills 3:1,4.5 --stills-dir dir]
// video.json: { title, accent, label, topic, pack: "gemini-dex", scenes: [ { say } ... one per scene in stories/<pack>.js ] }
// --stills "<scene>:<t1>,<t2>" renders still frames of one scene (no audio) so a scene can be checked quickly.
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const ROOT = path.join(__dirname, '..', '..'), G = require('./graphics.js');
const b64 = (f, mime) => 'data:' + mime + ';base64,' + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : ''; };
const [, , vfile, outFile] = process.argv; if (!vfile || !outFile) { console.error('usage: story.js <video.json> <out.mp4> [--silent]'); process.exit(2); }
const V = JSON.parse(fs.readFileSync(vfile, 'utf8')), SILENT = process.argv.includes('--silent') || !!arg('stills'), FPS = 30, acc = (G.ACC[V.accent] || G.ACC.green)[0];
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'story-')), sh = (c) => cp.execSync(c, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 }).toString();
const SRC = ['story-kit.js', 'anime-kit.js', 'story-engine.js'].map((f) => fs.readFileSync(path.join(__dirname, f), 'utf8')).join('\n') + '\n' + fs.readFileSync(path.join(__dirname, 'stories', V.pack + '.js'), 'utf8');
const FONTS = `@font-face{font-family:Geist;font-weight:100 900;src:url(${b64('assets/vendor/fonts/geist-normal-latin.woff2', 'font/woff2')})}`;
const html = () => `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}
*{margin:0;box-sizing:border-box}html,body{width:1080px;height:1920px;overflow:hidden;background:#070916}
.c{position:relative;width:1080px;height:1920px;font-family:Geist,sans-serif;color:#fff;overflow:hidden}svg#root{position:absolute;inset:0}
.vig{position:absolute;inset:0;background:radial-gradient(75% 60% at 50% 45%,transparent 55%,rgba(0,0,0,.45));pointer-events:none}
.fade{position:absolute;left:0;right:0;bottom:0;height:420px;background:linear-gradient(180deg,transparent,rgba(6,8,30,.8) 70%);pointer-events:none}
.grain{position:absolute;inset:-200px;opacity:.07;mix-blend-mode:overlay;pointer-events:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='260' height='260' filter='url(%23n)'/></svg>")}
.wipe{position:absolute;top:-120px;height:2160px;width:2400px;left:0;z-index:7;pointer-events:none;transform:translateX(-4000px) skewX(-14deg);background:linear-gradient(90deg,#ff6f91 0,#ff6f91 1.2%,#fff 1.2%,#fff 1.8%,#1b1464 1.8%,#2a1a6e 97.5%,#fff 97.5%,#fff 98.2%,#3fe0c5 98.2%)}
.bar{position:absolute;left:48px;right:48px;top:64px;height:8px;border-radius:4px;background:rgba(255,255,255,.16);z-index:5}.bar i{display:block;height:100%;width:0;border-radius:4px;background:${acc};box-shadow:0 0 16px ${acc}}
.badge{position:absolute;left:48px;top:104px;display:flex;align-items:center;gap:18px;z-index:4;font-weight:700;font-size:34px;background:rgba(7,9,22,.62);border:2px solid ${acc}66;border-radius:999px;padding:10px 28px 10px 12px}.badge img{width:52px;height:52px;border-radius:12px}.badge span{color:${acc};letter-spacing:.12em;text-transform:uppercase;font-size:26px}
.cap{position:absolute;left:90px;right:90px;top:1262px;text-align:center;z-index:6;font-weight:900;font-size:62px;line-height:1.14;letter-spacing:-.01em;color:#fff;-webkit-text-stroke:10px #05060f;paint-order:stroke fill;text-shadow:0 6px 16px rgba(0,0,0,.55)}.cw{display:inline-block;margin:0 7px}
</style></head><body><div class="c"><svg id="root" viewBox="0 0 1080 1920"><g id="cam"><g id="world"></g></g></svg><div class="fade"></div><div class="vig"></div><div class="grain"></div><div class="wipe"></div>
<div class="bar"><i></i></div><div class="badge"><img src="${b64('assets/logo-mark.svg', 'image/svg+xml')}" alt="">Aashish Pandey <span>${V.label || 'Explainer'}</span></div><div class="cap"></div></div><script>${SRC}</script></body></html>`;
function wordsOf(sn, base) { const ws = sn.text.split(/\s+/), tot = ws.reduce((a, w) => a + w.length + 2, 0), t0 = sn.start - base, t1 = (sn.vend || sn.end) - base; let t = t0; return ws.map((w) => { const d = (t1 - t0) * (w.length + 2) / tot, r = { w, t0: t, t1: t + d }; t += d; return r; }); }
function chunkify(words, dur) {
  const out = []; let cur = []; const flush = () => { if (cur.length) out.push({ words: cur, t0: cur[0].t0 }); cur = []; };
  words.forEach((w, i) => { cur.push(w); if (cur.length >= 4 || (/[.,;:!?]$/.test(w.w) && cur.length >= 2)) flush(); if (i === words.length - 1) flush(); });
  out.forEach((ch, i) => { ch.t1 = i < out.length - 1 ? out[i + 1].t0 : dur; ch.text = ch.words.map((w) => w.w).join(' '); }); return out;
}
(async () => {
  let tl;
  if (!SILENT) { sh(`python3 "${path.join(__dirname, 'tts.py')}" "${vfile}" "${TMP}"`); tl = JSON.parse(fs.readFileSync(path.join(TMP, 'timeline.json'), 'utf8')); }
  else { let t = 0; tl = { scenes: V.scenes.map((s) => ({ sentences: s.say.split(/(?<=[.!?])\s+/).map((x) => { const d = x.split(/\s+/).length / 2.7, r = { text: x, start: t, vend: t + d, end: t + d + 0.35 }; t = r.end; return r; }) })), total: t }; }
  const total = tl.total, scenes = V.scenes.map((s, i) => {
    const sn = tl.scenes[i].sentences, start = sn[0].start, end = i < V.scenes.length - 1 ? tl.scenes[i + 1].sentences[0].start : total, dur = end - start, words = sn.flatMap((x) => wordsOf(x, start));
    return { start, end, dur, f0: Math.round(start * FPS), f1: i < V.scenes.length - 1 ? Math.round(end * FPS) : Math.ceil(total * FPS), cfg: { sceneIndex: i, idx: i, first: i === 0, last: i === V.scenes.length - 1, T0: start, dur, p0: start / total, p1: end / total, acc, words, chunks: chunkify(words, dur) } };
  });
  let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(sh('npm root -g').trim() + '/playwright')); }
  const browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
  const open = async (sc) => { const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } }); page.on('pageerror', (e) => console.error('PAGE ERROR', sc.cfg.sceneIndex, e.message)); page.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', m.text()); }); await page.setContent(html()); await page.evaluate(() => document.fonts.ready); await page.evaluate((c) => window.boot(c), sc.cfg); return page; };
  if (arg('stills')) {
    const [si, ts] = arg('stills').split(':'), sc = scenes[+si], dir = arg('stills-dir') || '/tmp/stills'; fs.mkdirSync(dir, { recursive: true });
    const page = await open(sc); console.log('scene', si, 'duration', sc.dur.toFixed(1));
    for (const t of ts.split(',')) { await page.evaluate((x) => window.draw(x), +t); await page.screenshot({ path: path.join(dir, `s${si}-${t}.jpg`), type: 'jpeg', quality: 80 }); }
    await browser.close(); return;
  }
  // sound effects each scene asks for
  const sfx = []; for (const sc of scenes) { const page = await open(sc); const list = await page.evaluate(() => window.sfxList()); list.forEach((e) => sfx.push({ t: sc.start + e.t, type: e.type, v: e.v })); await page.close(); }
  const fdir = path.join(TMP, 'frames'); fs.mkdirSync(fdir);
  { const sc = scenes[0], page = await open(sc); await page.evaluate(() => window.draw(2.2, { noCaption: true })); await page.screenshot({ path: path.resolve(outFile).replace(/\.mp4$/, '') + '-poster.jpg', type: 'jpeg', quality: 88 }); await page.close(); }
  const queue = scenes.slice(), WORKERS = Math.min(3, Math.max(1, os.cpus().length - 1)); let done = 0; const all = scenes.reduce((a, x) => a + (x.f1 - x.f0), 0);
  await Promise.all(Array.from({ length: WORKERS }, async () => {
    while (queue.length) {
      const sc = queue.shift(), page = await open(sc);
      for (let g = sc.f0; g < sc.f1; g++) { await page.evaluate((t) => window.draw(t), Math.min(sc.dur - 0.001, g / FPS - sc.start)); await page.screenshot({ path: path.join(fdir, `f${String(g).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 86 }); done++; }
      await page.close(); process.stderr.write(`\r${done}/${all} frames`);
    }
  }));
  await browser.close();
  let audio = '';
  if (!SILENT) {
    sh(`ffmpeg -y -i "${path.join(TMP, 'voice.wav')}" -af "highpass=f=70,equalizer=f=180:t=q:w=1:g=2,equalizer=f=3200:t=q:w=1.2:g=2.5,acompressor=threshold=-20dB:ratio=3:attack=12:release=180:makeup=3,loudnorm=I=-16:TP=-1.5:LRA=7" -ar 44100 -ac 1 "${path.join(TMP, 'voice2.wav')}"`);
    fs.writeFileSync(path.join(TMP, 'sfx.json'), JSON.stringify({ total, sfx }));
    sh(`python3 "${path.join(__dirname, 'music.py')}" "${path.join(TMP, 'sfx.json')}" "${path.join(TMP, 'voice2.wav')}" "${path.join(TMP, 'bed.wav')}"`);
    sh(`ffmpeg -y -i "${path.join(TMP, 'voice2.wav')}" -i "${path.join(TMP, 'bed.wav')}" -filter_complex "[1:a]equalizer=f=2500:t=q:w=1:g=-3[b];[0:a][b]amix=inputs=2:duration=longest:normalize=0,volume=-1.2dB,alimiter=limit=0.89" -ar 44100 -ac 1 "${path.join(TMP, 'mix.wav')}"`);
    audio = `-i "${path.join(TMP, 'mix.wav')}" -c:a aac -b:a 192k -shortest`;
  }
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  sh(`ffmpeg -y -framerate ${FPS} -i "${path.join(fdir, 'f%05d.jpg')}" ${audio} -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -movflags +faststart "${path.resolve(outFile)}"`);
  const ts = (x) => new Date(Math.round(x * 1000)).toISOString().slice(11, 23).replace('.', ','); let n = 0, srt = [];
  scenes.forEach((sc) => sc.cfg.chunks.forEach((ch) => srt.push(`${++n}\n${ts(sc.start + ch.t0)} --> ${ts(Math.max(sc.start + ch.t0 + 0.2, sc.start + ch.t1 - 0.04))}\n${ch.text}\n`)));
  fs.writeFileSync(path.resolve(outFile).replace(/\.mp4$/, '') + '.srt', srt.join('\n'));
  console.log('\n' + JSON.stringify({ out: path.resolve(outFile), seconds: Math.round(total * 10) / 10, scenes: scenes.length, frames: all }));
})().catch((e) => { console.error(e); process.exit(1); });
