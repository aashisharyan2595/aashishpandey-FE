#!/usr/bin/env node
// Makes a short captioned explainer video for a post: Night Ride slides, a spoken voiceover and burned-in captions, as a 1920x1080 MP4.
// No accounts and no keys: the voice is Piper, an open-source voice that runs on the machine (pip install piper-tts, plus one downloaded voice file),
// the pictures are drawn with Playwright and the video is put together with ffmpeg.
//
//   node scripts/blog-desk/video.js <video.json> <out.mp4> [--voice <path to .onnx>] [--silent]
//
// video.json: { "title": "...", "url": "aashishpandey.com/blog/slug", "accent": "amber|teal|violet|green|red",
//   "scenes": [ { "say": "narration text", "type": "title|chips|stats|proscons|verdict", "headline": "...", "kicker": "...",
//                 "chips": ["Photo","Audio"], "stats": [{ "v": "150 to 250 ms", "l": "end to end" }], "pros": [..], "cons": [..] } ] }
// With --silent the video is made without a voice (captions only), timed at a reading pace.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const b64 = (f, mime) => 'data:' + mime + ';base64,' + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const ACC = { amber: ['#f5b867', '245,184,103'], teal: ['#7ff3e1', '127,243,225'], violet: ['#c8a8ff', '200,168,255'], green: ['#6fd6a8', '111,214,168'], red: ['#ff8f7a', '255,143,122'] };
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : ''; };
const [, , vfile, outFile] = process.argv;
if (!vfile || !outFile) { console.error('usage: video.js <video.json> <out.mp4> [--voice file.onnx] [--silent]'); process.exit(2); }
const V = JSON.parse(fs.readFileSync(vfile, 'utf8')), acc = ACC[V.accent] || ACC.amber, SILENT = process.argv.includes('--silent');
const TMP = fs.mkdtempSync(path.join(require('os').tmpdir(), 'vid-'));
const sh = (c) => cp.execSync(c, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 }).toString();

// split narration into caption chunks of at most 7 words, breaking at punctuation where possible
function chunks(text) {
  const out = []; String(text).split(/(?<=[.!?])\s+/).forEach((sent) => {
    const parts = sent.split(/(?<=[,;:])\s+/); let cur = [];
    const flush = () => { if (cur.length) out.push(cur.join(' ')); cur = []; };
    parts.forEach((p) => { p.split(/\s+/).forEach((w) => { cur.push(w); if (cur.length >= 7) flush(); }); if (cur.length >= 3) flush(); });
    flush();
  }); return out;
}
const FONTS = `@font-face{font-family:Geist;font-weight:100 900;src:url(${b64('assets/vendor/fonts/geist-normal-latin.woff2', 'font/woff2')})}@font-face{font-family:'Instrument Serif';font-style:italic;src:url(${b64('assets/vendor/fonts/instrument-serif-italic-latin.woff2', 'font/woff2')})}`;
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const STARS = Array.from({ length: 110 }, () => `<circle cx="${(rnd() * 1920).toFixed(1)}" cy="${(rnd() * 640).toFixed(1)}" r="${rnd() < 0.15 ? 2.2 : 1.2}" fill="#f4efe6" opacity="${(0.25 + rnd() * 0.55).toFixed(2)}"/>`).join('');
function body(s) {
  const t = s.type || 'title';
  if (t === 'chips') return `<div class="mid"><div class="chips">${(s.chips || []).map((c) => `<div class="chip">${esc(c)}</div>`).join('')}</div><div class="arrow">&rarr;</div><div class="big2">${esc(s.headline || '')}</div></div>`;
  if (t === 'stats') return `<div class="stats">${(s.stats || []).map((x) => `<div class="stat"><b>${esc(x.v)}</b><span>${esc(x.l)}</span></div>`).join('')}</div>`;
  if (t === 'proscons') return `<div class="cols"><div class="col"><h2 style="color:#7ee0a8">Pros</h2>${(s.pros || []).map((x) => `<p><i style="background:#7ee0a8"></i>${esc(x)}</p>`).join('')}</div><div class="col"><h2 style="color:#ff8f8f">Cons</h2>${(s.cons || []).map((x) => `<p><i style="background:#ff8f8f"></i>${esc(x)}</p>`).join('')}</div></div>`;
  return '';
}
function html(s, cap) {
  const t = s.type || 'title', head = t === 'chips' || t === 'proscons' || t === 'stats' ? s.kicker || '' : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}
*{margin:0;box-sizing:border-box}html,body{width:1920px;height:1080px;overflow:hidden;background:#070916}
.c{position:relative;width:1920px;height:1080px;color:#f4efe6;font-family:Geist,sans-serif;background:radial-gradient(70% 55% at 50% 100%,rgba(${acc[1]},.38),rgba(196,106,74,.15) 45%,transparent 75%),linear-gradient(180deg,#070916 0%,#0b1030 62%,#1a1640 100%)}
.stars{position:absolute;inset:0}.hz{position:absolute;left:0;right:0;bottom:0;height:340px;background:url(${b64('assets/nr/horizon.svg', 'image/svg+xml')}) center bottom/1920px 340px no-repeat}
.top{position:absolute;left:96px;right:96px;top:70px;display:flex;justify-content:space-between;align-items:center}.me{display:flex;gap:22px;align-items:center;font-weight:600;font-size:38px}.me img{width:70px;height:70px;border-radius:16px}
.kind{font:600 24px Geist;letter-spacing:.14em;text-transform:uppercase;color:${acc[0]};border:2px solid rgba(${acc[1]},.45);border-radius:999px;padding:12px 28px;background:rgba(7,9,22,.5)}
.main{position:absolute;left:96px;right:96px;top:210px;height:520px;display:flex;flex-direction:column;justify-content:center}
h1{font-weight:600;font-size:${(s.headline || '').length > 60 ? 84 : 104}px;line-height:1.04;letter-spacing:-.035em;text-wrap:balance;max-width:1500px}
.k{margin-top:30px;font:italic 64px 'Instrument Serif',serif;color:${acc[0]}}.sm{font:600 26px Geist;letter-spacing:.16em;text-transform:uppercase;color:${acc[0]};margin-bottom:26px}
.mid{display:flex;align-items:center;gap:56px}.chips{display:flex;flex-direction:column;gap:20px}.chip{font-weight:600;font-size:52px;border:3px solid ${acc[0]};border-radius:24px;padding:18px 40px;background:rgba(14,18,48,.7)}.arrow{font-size:110px;color:${acc[0]}}.big2{font-weight:600;font-size:88px;line-height:1.05;letter-spacing:-.03em;max-width:760px}
.stats{display:flex;gap:44px}.stat{flex:1;background:rgba(14,18,48,.82);border:2px solid rgba(244,239,230,.16);border-radius:34px;padding:48px 44px}.stat b{display:block;font-weight:600;font-size:92px;letter-spacing:-.03em;color:${acc[0]};line-height:1}.stat span{display:block;margin-top:22px;font-size:36px;color:#cfc9d8}
.cols{display:flex;gap:44px}.col{flex:1;background:rgba(14,18,48,.82);border:2px solid rgba(244,239,230,.16);border-radius:34px;padding:38px 46px}.col h2{font:600 28px Geist;letter-spacing:.14em;text-transform:uppercase;margin-bottom:22px}.col p{display:flex;gap:20px;font-size:40px;line-height:1.2;margin-bottom:16px}.col i{flex:none;width:16px;height:16px;border-radius:50%;margin-top:17px}
.url{position:absolute;left:96px;bottom:56px;font:500 32px Geist;color:#aaa4b8}
.cap{position:absolute;left:120px;right:120px;bottom:150px;text-align:center}.cap span{display:inline-block;font-weight:600;font-size:62px;line-height:1.18;color:#fff;background:rgba(7,9,22,.78);padding:14px 36px;border-radius:24px;box-decoration-break:clone}
</style></head><body><div class="c"><svg class="stars" width="1920" height="1080">${STARS}</svg><div class="hz"></div>
<div class="top"><div class="me"><img src="${b64('assets/logo-mark.svg', 'image/svg+xml')}" alt="">Aashish Pandey</div><div class="kind">${esc(V.label || 'Explainer')}</div></div>
<div class="main">${t === 'title' || t === 'verdict' ? `<h1>${esc(s.headline || V.title || '')}</h1>${s.kicker ? `<div class="k">${esc(s.kicker)}</div>` : ''}` : (head ? `<div class="sm">${esc(head)}</div>` : '') + body(s)}</div>
<div class="url">${esc(V.url || 'aashishpandey.com/blog')}</div><div class="cap"><span>${esc(cap)}</span></div></div></body></html>`;
}
(async () => {
  let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(sh('npm root -g').trim() + '/playwright')); }
  const browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const frames = [], wavs = [], GAP = 0.35; let n = 0;
  const voice = arg('voice') || process.env.PIPER_VOICE || '';
  for (let si = 0; si < V.scenes.length; si++) {
    const s = V.scenes[si], cs = chunks(s.say), words = cs.map((c) => c.split(/\s+/).length), total = words.reduce((a, b) => a + b, 0);
    let dur;
    if (SILENT || !voice) dur = Math.max(2.5, total / 2.6);
    else { const w = path.join(TMP, `s${si}.wav`); fs.writeFileSync(path.join(TMP, `s${si}.txt`), s.say); sh(`python3 -m piper -m "${voice}" -f "${w}" --length-scale 1.0 < "${path.join(TMP, `s${si}.txt`)}"`); wavs.push(w); dur = parseFloat(sh(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${w}"`)); }
    for (let ci = 0; ci < cs.length; ci++) {
      await page.setContent(html(s, cs[ci])); await page.evaluate(() => document.fonts.ready);
      const f = path.join(TMP, `f${String(n++).padStart(4, '0')}.png`); await page.screenshot({ path: f });
      frames.push({ f, text: cs[ci], d: dur * (words[ci] / total) + (ci === cs.length - 1 ? GAP : 0) });
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(TMP, 'list.txt'), frames.map((x) => `file '${x.f}'\nduration ${x.d.toFixed(3)}`).join('\n') + `\nfile '${frames[frames.length - 1].f}'\n`);
  let audio = '';
  if (wavs.length) {
    fs.writeFileSync(path.join(TMP, 'alist.txt'), wavs.map((w, i) => { const g = path.join(TMP, `g${i}.wav`); sh(`ffmpeg -y -f lavfi -i anullsrc=r=22050:cl=mono -t ${GAP} "${g}"`); return `file '${w}'\nfile '${g}'`; }).join('\n'));
    sh(`ffmpeg -y -f concat -safe 0 -i "${path.join(TMP, 'alist.txt')}" -ar 44100 -ac 1 "${path.join(TMP, 'voice.wav')}"`);
    audio = `-i "${path.join(TMP, 'voice.wav')}" -c:a aac -b:a 160k`;
  }
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  sh(`ffmpeg -y -f concat -safe 0 -i "${path.join(TMP, 'list.txt')}" ${audio} -vf "fps=30,format=yuv420p" -c:v libx264 -preset medium -crf 20 -movflags +faststart ${audio ? '-shortest' : ''} "${path.resolve(outFile)}"`);
  const secs = parseFloat(sh(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${path.resolve(outFile)}"`));
  // captions as a separate .srt too, so YouTube can use them as real subtitles
  const ts = (x) => new Date(Math.round(x * 1000)).toISOString().slice(11, 23).replace('.', ',');
  let t = 0; fs.writeFileSync(path.resolve(outFile).replace(/\.mp4$/, '') + '.srt', frames.map((f, i) => { const r = `${i + 1}\n${ts(t)} --> ${ts(t + f.d - 0.05)}\n${f.text}\n`; t += f.d; return r; }).join('\n'));
  console.log(JSON.stringify({ out: path.resolve(outFile), seconds: Math.round(secs * 10) / 10, scenes: V.scenes.length, frames: frames.length }));
})().catch((e) => { console.error(e); process.exit(1); });
