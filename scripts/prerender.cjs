// Run at deploy (vercel.json buildCommand): refreshes the static prerender block in every page.
const fs = require('fs');
const path = require('path');
const { prerender } = require('./prerender-core.js');

for (const { name: f, abs: p } of require('./pages.cjs').list()) {
  const src = fs.readFileSync(p, 'utf8');
  if (!src.includes('id="ap-pre"')) continue; // opt-in: pages without the placeholder have no code to remove it
  const out = prerender(src, f);
  if (out !== src) { fs.writeFileSync(p, out); console.log('prerendered', f); }
}
