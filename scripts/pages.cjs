// Where the page sources live. Every .dc.html page sits under pages/<group>/, and a page is known by its file name
// (Tools-QR.dc.html), which is unique across the repo. Build scripts use this instead of listing the repo root.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');

function list(root = ROOT) {
  const out = [];
  (function walk(dir) {
    for (const n of fs.readdirSync(path.join(root, dir)).sort()) {
      const rel = dir + '/' + n;
      if (fs.statSync(path.join(root, rel)).isDirectory()) walk(rel);
      else if (n.endsWith('.dc.html')) out.push({ name: n, rel, abs: path.join(root, rel) });
    }
  })('pages');
  return out;
}

// name -> repo-relative path, e.g. 'Tools-QR.dc.html' -> 'pages/tools/Tools-QR.dc.html'
function map(root = ROOT) {
  return Object.fromEntries(list(root).map((p) => [p.name, p.rel]));
}

module.exports = { ROOT, list, map };
