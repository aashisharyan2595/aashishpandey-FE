// Build-time only (runs after prerender.cjs on Vercel). Never commit its output.
// For every page whose <x-dc> template contains {{ bindings }}, the template moves into /tpl/<Page>.<hash>.js and the
// served HTML keeps only the prerendered #ap-pre content. Crawlers that don't run JavaScript then read real HTML with
// no template code. In the browser the script fills <x-dc> before the page runtime boots, so nothing else changes.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..'), out = path.join(root, 'tpl');
fs.rmSync(out, { recursive: true, force: true });
let n = 0;
for (const f of fs.readdirSync(root).filter(x => x.endsWith('.dc.html'))) {
  const p = path.join(root, f), src = fs.readFileSync(p, 'utf8');
  const a = src.indexOf('<x-dc>'), b = src.lastIndexOf('</x-dc>');
  if (a < 0 || b < 0) continue;
  const tpl = src.slice(a + 6, b);
  if (!tpl.includes('{{')) continue;
  if (!src.includes('id="ap-pre"')) throw new Error(f + ': has bindings but no #ap-pre placeholder, refusing to strip its content');
  fs.mkdirSync(out, { recursive: true });
  const hash = crypto.createHash('sha1').update(tpl).digest('hex').slice(0, 10);
  const name = f.replace('.dc.html', '') + '.' + hash + '.js';
  const js = "(function(){var d=document.querySelector('x-dc');if(!d)return;d.innerHTML=" + JSON.stringify(tpl) + ";" +
    "var n=0;(function w(){var r=document.getElementById('dc-root'),p=document.getElementById('ap-pre');" +
    "if(r&&r.firstElementChild){if(p)p.remove();}else if(p&&++n<900)requestAnimationFrame(w);})();})();\n";
  fs.writeFileSync(path.join(out, name), js);
  const html = src.slice(0, a + 6) + src.slice(b) .replace('</x-dc>', '</x-dc>\n<script src="/tpl/' + name + '"></script>');
  fs.writeFileSync(p, html);
  n++; console.log('externalized', f, '->', 'tpl/' + name, (js.length / 1024).toFixed(0) + 'KB');
}
console.log(n + ' page(s) externalized');
