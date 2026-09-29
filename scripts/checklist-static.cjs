// Rewrites the crawlable checklist section in Tools-Checklist.dc.html from the tool's own data.
// Run after you edit the checks in that file:  node scripts/checklist-static.cjs
const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'Tools-Checklist.dc.html');
let s = fs.readFileSync(file, 'utf8');
const sc = s.slice(s.indexOf('<script type="text/x-dc" data-dc-script>') + 41);
const m = { exports: {} };
new Function('module', sc.slice(0, sc.indexOf('const uid =')) + ';module.exports={catsFor};')(m);
const { catsFor } = m.exports;
const general = catsFor('general'), eco = catsFor('ecommerce').filter(c => !general.find(g => g.name === c.name));
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const H = '#fff6ea', T = '#cfc6b6', SOFT = '#9a927f';
const cat = c => `<h3 style="margin:22px 0 8px;font-weight:600;font-size:18px;letter-spacing:-.02em;color:${H};">${esc(c.name)}</h3><ul style="margin:0;padding-left:20px;font-size:15px;line-height:1.6;color:${T};">` +
  c.items.map(i => `<li style="margin:0 0 8px;"><strong style="color:${H};font-weight:600;">${esc(i.t)}</strong>${i.p === 'must' ? ' <span style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#f5b867;">must-have</span>' : ''} <span style="color:${SOFT};">${esc(i.n)}</span></li>`).join('') + '</ul>';
const n = general.reduce((a, c) => a + c.items.length, 0);
const body = `<h2 style="margin:28px 0 0;font-weight:600;font-size:clamp(20px,2.4vw,26px);letter-spacing:-.03em;color:${H};">Website launch checklist: all ${n} checks</h2><p style="margin:8px 0 0;font-size:15.5px;line-height:1.7;color:${T};">This is the full Marketing website list, grouped by area. Open the tool above to tick items off and edit them.</p>` + general.map(cat).join('') +
  `<h2 style="margin:36px 0 0;font-weight:600;font-size:clamp(20px,2.4vw,26px);letter-spacing:-.03em;color:${H};">Shopify and ecommerce: what to add</h2><p style="margin:8px 0 0;font-size:15.5px;line-height:1.7;color:${T};">The Shopify / ecommerce template is the website checklist above plus a Store &amp; checkout section.</p>` + eco.map(cat).join('');
const re = /<!-- checklist-static:start -->[\s\S]*?<!-- checklist-static:end -->/;
if (!re.test(s)) throw new Error('markers not found');
const out = s.replace(re, () => '<!-- checklist-static:start -->' + body + '<!-- checklist-static:end -->');
fs.writeFileSync(file, out);
console.log(out === s ? 'checklist list already up to date' : 'checklist list updated', `(${n} website checks, ${eco.reduce((a, c) => a + c.items.length, 0)} store checks)`);
