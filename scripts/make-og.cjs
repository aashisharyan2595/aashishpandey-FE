#!/usr/bin/env node
/* Draws the share images (1200x630 JPEG) in assets/og/ from scripts/og-cards.json, in the Night Ride look:
 * dusk sky, assets/nr/horizon.svg, the logo mark, the card's icon, and the site fonts (Geist, Geist Mono, Instrument Serif).
 *
 *   node scripts/make-og.cjs              draw every card
 *   node scripts/make-og.cjs tool-pad     draw only these ids
 *
 * Needs Playwright with Chromium and network for Google Fonts. Not part of the Vercel build: run it locally, commit the
 * images, bump "v" in og-cards.json, then run node scripts/og-tags.cjs so pages link the new version. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const cfg = require('./og-cards.json');
const icons = require('./chrome-icons.json');

let chromium;
try { ({ chromium } = require('playwright')); } catch {
  try { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')); } catch {
    console.error('make-og: needs Playwright (npm i -g playwright, then npx playwright install chromium)'); process.exit(1);
  }
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const tools = cfg.cards.filter((c) => c.kind === 'tool').length;
const title = (c) => c.title.replace('{N}', tools);
const icon = (k) => (k.startsWith('<') ? k : icons.tools[k] || icons.extra[k] || '');
const dataUri = (svg) => 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
const HORIZON = dataUri(read('assets/nr/horizon.svg'));
const LOGO = dataUri(read('assets/logo-mark.svg'));

// Fixed star field so re-drawing gives identical images.
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const STARS = Array.from({ length: 70 }, () => {
  const x = rnd() * 1200, y = rnd() * 400, r = rnd() < 0.15 ? 1.6 : 0.9, o = (0.25 + rnd() * 0.55).toFixed(2);
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#f4efe6" opacity="${o}"/>`;
}).join('');

function html(c) {
  const t = title(c), long = t.length > 18;
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;600&family=Geist+Mono:wght@500&family=Instrument+Serif:ital@0;1&display=block">
<style>
*{margin:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden;background:#070916}
.c{position:relative;width:1200px;height:630px;color:#f4efe6;font-family:Geist,sans-serif;
 background:radial-gradient(70% 60% at 50% 100%,rgba(245,184,103,.40),rgba(196,106,74,.16) 45%,transparent 75%),
 linear-gradient(180deg,#070916 0%,#070916 30%,#151236 68%,#2c1d4a 100%)}
.stars{position:absolute;inset:0}
.hz{position:absolute;left:0;right:0;bottom:0;height:210px;background:url(${HORIZON}) center bottom/1200px 210px no-repeat}
.top{position:absolute;left:64px;right:64px;top:52px;display:flex;align-items:center;justify-content:space-between}
.me{display:flex;align-items:center;gap:16px;font-weight:600;font-size:28px;letter-spacing:-.01em}
.me img{width:52px;height:52px;border-radius:12px}
.kind{font:500 18px 'Geist Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#f5b867;
 border:1.5px solid rgba(245,184,103,.45);border-radius:999px;padding:10px 20px;background:rgba(7,9,22,.5)}
.main{position:absolute;left:64px;right:64px;top:150px;display:flex;gap:40px;align-items:flex-start}
.ic{flex:none;width:132px;height:132px;border-radius:30px;display:grid;place-items:center;
 background:linear-gradient(160deg,#131838,#0e1230);border:1.5px solid rgba(244,239,230,.16);box-shadow:0 20px 50px rgba(0,0,0,.35)}
.ic svg{width:70px;height:70px;stroke:#f5b867}
.tx{min-width:0;padding-top:2px}
h1{font-weight:600;font-size:${long ? 72 : 88}px;line-height:1.02;letter-spacing:-.035em;text-wrap:balance}
p{margin-top:20px;font-size:31px;line-height:1.3;color:#cfc9d8;max-width:860px;text-wrap:balance}
.foot{margin-top:16px;font:italic 40px 'Instrument Serif',serif;color:#ffc880}
.url{margin-top:26px;font:500 20px 'Geist Mono',monospace;color:rgba(244,239,230,.62);letter-spacing:.02em}
</style></head><body><div class="c">
<svg class="stars" width="1200" height="630">${STARS}</svg><div class="hz"></div>
<div class="top"><div class="me"><img src="${LOGO}" alt="">Aashish Pandey</div><div class="kind">${esc(cfg.kinds[c.kind])}</div></div>
<div class="main"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${icon(c.icon)}</svg></div>
<div class="tx"><h1>${esc(t)}</h1><p>${esc(c.sub)}</p>${c.foot ? `<div class="foot">${esc(c.foot)}</div>` : ''}
<div class="url">aashishpandey.com${c.path === '/' ? '' : esc(c.path)}</div></div></div>
</div></body></html>`;
}

(async () => {
  const only = process.argv.slice(2);
  const cards = only.length ? cfg.cards.filter((c) => only.includes(c.id)) : cfg.cards;
  for (const c of cards) if (!icon(c.icon)) { console.error(`make-og: card ${c.id} has no icon "${c.icon}"`); process.exit(1); }
  const out = path.join(ROOT, 'assets', 'og');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const c of cards) {
    await page.setContent(html(c), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const over = await page.evaluate(() => { const m = document.querySelector('.main').getBoundingClientRect(); return m.bottom > 450; });
    if (over) console.warn(`make-og: ${c.id} text runs into the horizon; shorten its sub`);
    await page.screenshot({ path: path.join(out, `og-${c.id}.jpg`), type: 'jpeg', quality: 86 });
  }
  await browser.close();
  console.log(`wrote ${cards.length} images to assets/og/`);
})();
