// Run at deploy (vercel.json buildCommand): refreshes the static prerender block in every page.
const fs = require('fs');
const path = require('path');
const { prerender } = require('./prerender-core.js');

const root = path.join(__dirname, '..');
for (const f of fs.readdirSync(root).filter(n => n.endsWith('.dc.html'))) {
  const p = path.join(root, f);
  const src = fs.readFileSync(p, 'utf8');
  if (!src.includes('id="ap-pre"')) continue; // opt-in: pages without the placeholder have no code to remove it
  const out = prerender(src, f);
  if (out !== src) { fs.writeFileSync(p, out); console.log('prerendered', f); }
}
