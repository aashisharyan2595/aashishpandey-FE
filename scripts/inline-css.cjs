#!/usr/bin/env node
/* Build step (runs last in the Vercel build): puts assets/nav.css inside every page that links it, so first paint does not wait
   for a second request. The css is about 22 KB (4 KB gzipped). Pages are not cached across visits, but most visits are one page. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(ROOT, 'assets', 'nav.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '\n').trim()
  // url() paths were relative to assets/nav.css; once inlined they would resolve against the page, so make them absolute
  .replace(/url\((['"]?)(?!https?:|data:|\/)([^)'"]+)\1\)/g, "url(/assets/$2)");
let n = 0;
for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.dc.html') || x === '404.html')) {
  const p = path.join(ROOT, f), s = fs.readFileSync(p, 'utf8');
  const out = s.replace(/<link rel="stylesheet" href="\/?assets\/nav\.css\?v=\d+">/, () => `<style data-inline="nav">${css}</style>`);
  if (out !== s) { fs.writeFileSync(p, out); n++; }
}
console.log(`inline-css: ${n} page(s)`);
