/* Card pictures for the tools hub: one small SVG per tool in assets/tool-art/<tool-slug>.svg.
 *
 *   node scripts/tool-art.cjs            redraw every picture
 *   node scripts/tool-art.cjs --alts     print slug<TAB>alt text (the hub <img alt> uses it)
 *
 * Every picture is 400x200, drawn in the site's Night Ride palette (cream stage, white sheet, navy ink, amber and teal
 * accents), so a new tool only needs one entry in ART below. A picture shows what the tool really produces, not an icon.
 * Text uses a system font stack because an SVG loaded through <img> cannot use the page's web fonts.
 */
const fs = require('fs');
const path = require('path');

const C = { ink: '#15131c', mut: '#8a8296', line: '#e4dccd', stage: '#f3eee4', amber: '#f5b867', deep: '#b8651b', teal: '#2f8f83', tealL: '#c8e7df', red: '#c8553d', redL: '#f6d7cf', navy: '#131838', sand: '#e9dfcc' };
const SANS = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif", MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r = (x, y, w, h, fill, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 3}" fill="${fill}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}"` : ''}${o.op ? ` opacity="${o.op}"` : ''}/>`;
const t = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-family="${o.mono ? MONO : SANS}" font-size="${Math.max(o.size || 11, o.mono ? 9.5 : 10)}" font-weight="${o.w || 400}" fill="${o.fill || C.ink}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${esc(s)}</text>`;
const sheet = (x, y, w, h) => r(x, y, w, h, '#fff', { rx: 10, stroke: C.line }) ;
const grey = (x, y, w, h = 5, fill = C.sand) => r(x, y, w, h, fill, { rx: h / 2 });
const chip = (x, y, s, fill, ink, w) => { w = w || s.length * 6.4 + 14; return r(x, y, w, 18, fill, { rx: 9 }) + t(x + w / 2, y + 12.8, s, { size: 10, w: 600, fill: ink, anchor: 'middle' }); };
const dots = (cx, cy, list) => list.map(([x, y, rr, f]) => `<circle cx="${cx + x}" cy="${cy + y}" r="${rr}" fill="${f}"/>`).join('');

// A QR-like matrix from a seed, with three finder squares. Compact paths, not hundreds of elements.
function qr(x, y, n, cell, seed, ink = C.ink) {
  let s = seed, d = '';
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const inFinder = (i, j) => (i < 8 && j < 8) || (i < 8 && j >= n - 8) || (i >= n - 8 && j < 8);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (!inFinder(i, j) && rnd() > 0.52) d += `M${x + j * cell} ${y + i * cell}h${cell}v${cell}h-${cell}z`;
  const fin = (fx, fy) => `<rect x="${fx}" y="${fy}" width="${cell * 7}" height="${cell * 7}" fill="${ink}"/><rect x="${fx + cell}" y="${fy + cell}" width="${cell * 5}" height="${cell * 5}" fill="#fff"/><rect x="${fx + cell * 2}" y="${fy + cell * 2}" width="${cell * 3}" height="${cell * 3}" fill="${ink}"/>`;
  return `<path d="${d}" fill="${ink}"/>` + fin(x, y) + fin(x + (n - 7) * cell, y) + fin(x, y + (n - 7) * cell);
}
const portrait = (x, y, w, h) => r(x, y, w, h, '#cfe0ee', { rx: 4 }) + `<circle cx="${x + w / 2}" cy="${y + h * 0.4}" r="${w * 0.2}" fill="#e0a77a"/><path d="M${x + w * 0.14} ${y + h}c0-${h * 0.3} ${w * 0.15}-${h * 0.34} ${w * 0.36}-${h * 0.34}s${w * 0.36} ${h * 0.04} ${w * 0.36} ${h * 0.34}z" fill="${C.navy}"/>`;
const photo = (x, y, w, h) => r(x, y, w, h, '#cfe0ee', { rx: 4 }) + `<circle cx="${x + w * 0.72}" cy="${y + h * 0.28}" r="${h * 0.12}" fill="#f7d68a"/><path d="M${x} ${y + h}l${w * 0.32}-${h * 0.5} ${w * 0.22} ${h * 0.3} ${w * 0.16}-${h * 0.2} ${w * 0.3} ${h * 0.4}z" fill="#6fa58f"/>`;
const page = (x, y, w, h, lines = 3) => r(x, y, w, h, '#fff', { rx: 3, stroke: C.line }) + Array.from({ length: lines }, (_, i) => grey(x + 7, y + 9 + i * 8, w - 14 - (i % 2) * 10, 3.5)).join('');

/* slug -> { alt, art } */
const ART = {
  'resume-keyword-matcher': { alt: 'A match-score ring at 64 percent with matched and missing keyword chips',
    art: sheet(60, 26, 280, 148) + `<circle cx="116" cy="100" r="34" fill="none" stroke="${C.sand}" stroke-width="9"/><circle cx="116" cy="100" r="34" fill="none" stroke="${C.amber}" stroke-width="9" stroke-linecap="round" stroke-dasharray="137 214" transform="rotate(-90 116 100)"/>` + t(116, 106, '64%', { size: 19, w: 700, anchor: 'middle' })
      + t(170, 62, 'PARTIAL MATCH', { size: 7.5, w: 700, fill: C.mut, ls: 1 }) + chip(170, 72, 'shopify', C.tealL, C.teal) + chip(222, 72, 'agile', C.tealL, C.teal) + chip(262, 72, 'jira', C.tealL, C.teal) + chip(170, 96, 'roadmap', C.redL, C.red) + chip(224, 96, 'a/b testing', C.redL, C.red) + t(170, 134, 'Add 3 missing keywords', { size: 9, fill: C.mut }) + grey(170, 144, 130) + grey(170, 154, 100) },
  'sop-maker': { alt: 'A standard operating procedure document titled Employee Onboarding with three numbered steps and owners',
    art: sheet(70, 16, 260, 168) + t(86, 42, 'Employee Onboarding', { size: 12, w: 700 }) + t(314, 42, 'SOP-HR-01', { size: 7.5, mono: 1, fill: C.mut, anchor: 'end' }) + r(86, 50, 228, 1.5, C.navy, { rx: 0 })
      + [['Send the welcome pack', 'HR'], ['Set up accounts and laptop', 'IT'], ['Run the first-day induction', 'Manager']].map(([s, o], i) => `<circle cx="95" cy="${73 + i * 26}" r="8" fill="${C.navy}"/>` + t(95, 76.5 + i * 26, i + 1, { size: 9, w: 700, fill: '#fff', anchor: 'middle' }) + t(110, 76.5 + i * 26, s, { size: 10 }) + t(314, 76.5 + i * 26, o, { size: 8.5, w: 700, fill: C.deep, anchor: 'end' })).join('')
      + t(86, 170, '116 templates', { size: 8.5, fill: C.mut }) + t(314, 170, 'Word  ·  PDF', { size: 8.5, w: 700, fill: C.navy, anchor: 'end' }) },
  'qr-code-generator': { alt: 'A black and white QR code beside Static and Never expires labels and PNG and SVG download buttons',
    art: r(112, 38, 124, 124, '#fff', { rx: 10, stroke: C.line }) + qr(124, 50, 25, 4, 7) + chip(252, 50, 'STATIC', C.tealL, C.teal, 56) + t(252, 88, 'Never expires', { size: 10.5, fill: C.mut }) + r(252, 102, 40, 22, C.ink, { rx: 11 }) + t(272, 117, 'PNG', { size: 9.5, w: 700, fill: '#fff', anchor: 'middle' }) + r(298, 102, 40, 22, '#fff', { rx: 11, stroke: C.line }) + t(318, 117, 'SVG', { size: 9.5, w: 700, anchor: 'middle' }) },
  'qr-code-checker': { alt: 'A QR code struck through with a red line next to a Dynamic redirect warning card',
    art: r(46, 40, 116, 116, '#fff', { rx: 10, stroke: C.line }) + qr(56, 50, 24, 4, 11) + r(48, 96, 112, 4, C.red, { rx: 2 }) + sheet(178, 38, 176, 122) + chip(190, 50, 'DYNAMIC', C.redL, C.red, 62) + t(190, 88, 'Redirects via', { size: 11.5, w: 700 }) + t(190, 103, 'qr-host.io', { size: 11.5, w: 700 }) + grey(190, 118, 140) + grey(190, 128, 110) + t(190, 148, 'The provider can switch it off.', { size: 8, fill: C.mut }) },
  'url-shortener': { alt: 'A long link being shortened to aashishpandey.com/s/k3x9 with a Copy button',
    art: r(34, 40, 332, 34, '#fff', { rx: 8, stroke: C.line }) + t(46, 61, 'https://store.example.com/collections/summer?utm_source=…', { size: 8.5, mono: 1, fill: C.mut }) + `<path d="M200 82v14m-5-5 5 6 5-6" stroke="${C.deep}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      + r(34, 104, 332, 38, '#fff', { rx: 8, stroke: C.amber, sw: 1.5 }) + t(46, 128, 'aashishpandey.com/s/k3x9', { size: 12, mono: 1, w: 700 }) + r(310, 111, 48, 24, C.ink, { rx: 12 }) + t(334, 127, 'Copy', { size: 9.5, w: 700, fill: '#fff', anchor: 'middle' }) + t(34, 166, 'Expires in 30 days  ·  0 clicks', { size: 8.5, mono: 1, fill: C.mut }) },
  'invoice-generator': { alt: 'An invoice with line items, 18 percent GST and a total of 2,59,600 rupees',
    art: sheet(70, 14, 260, 172) + t(86, 38, 'Invoice', { size: 13, w: 700 }) + t(314, 38, '#0042', { size: 8.5, mono: 1, fill: C.mut, anchor: 'end' }) + r(86, 46, 228, 1, C.line, { rx: 0 })
      + [['Discovery workshop', '₹40,000'], ['Shopify build', '₹1,80,000'], ['GST 18%', '₹39,600']].map(([a, b], i) => t(86, 66 + i * 19, a, { size: 9.5, fill: C.mut }) + t(314, 66 + i * 19, b, { size: 9.5, w: 600, anchor: 'end' })).join('')
      + r(86, 128, 228, 1.5, C.ink, { rx: 0 }) + t(86, 152, 'Total', { size: 12, w: 700 }) + t(314, 152, '₹2,59,600', { size: 14, w: 700, fill: C.deep, anchor: 'end' }) + t(86, 174, 'Print or save as PDF', { size: 8, fill: C.mut }) },
  'project-estimate-calculator': { alt: 'Best, likely and worst case bars for a Shopify store build with a PERT estimate of 230 hours or 6 weeks',
    art: sheet(54, 20, 292, 160) + t(72, 46, 'Shopify store build', { size: 12, w: 700 }) + [['Best', 70, '180h', '#d9b98a'], ['Likely', 100, '226h', C.deep], ['Worst', 128, '290h', '#d9b98a']].map(([a, w, v, f], i) => t(72, 74 + i * 22, a, { size: 9, fill: C.mut }) + r(112, 66 + i * 22, 150, 9, C.sand, { rx: 4.5 }) + r(112, 66 + i * 22, w * 1.3, 9, f, { rx: 4.5 }) + t(328, 74 + i * 22, v, { size: 9.5, w: 600, anchor: 'end' })).join('')
      + r(72, 138, 256, 1, C.line, { rx: 0 }) + t(72, 160, 'PERT estimate', { size: 9.5, fill: C.mut }) + t(328, 160, '230h · 6 wks', { size: 13, w: 700, anchor: 'end' }) },
  'time-zone-meeting-planner': { alt: 'Bangalore, London and New York hour strips with the overlapping meeting window highlighted',
    art: sheet(30, 24, 340, 152) + [['Bangalore', 'IST'], ['London', 'BST'], ['New York', 'EDT']].map(([c, z], i) => t(46, 56 + i * 32, c, { size: 10.5, w: 700 }) + t(46, 67 + i * 32, z, { size: 7, mono: 1, fill: C.mut }) + Array.from({ length: 12 }, (_, k) => r(124 + k * 19, 46 + i * 32, 16, 22, k >= 3 && k <= 5 ? C.amber : C.sand, { rx: 3 })).join('')).join('')
      + `<rect x="177" y="40" width="54" height="94" rx="6" fill="none" stroke="${C.deep}" stroke-width="1.5" stroke-dasharray="3 2"/>` + t(46, 160, 'Best overlap · 6:30 pm IST', { size: 9, mono: 1, w: 600, fill: C.deep }) },
  'exam-photo-resizer': { alt: 'A passport photo cropped to 200 by 230 pixels with a file size slider reading 38.4 KB',
    art: portrait(60, 40, 70, 96) + t(95, 150, '35 × 45 mm', { size: 7.5, mono: 1, fill: C.mut, anchor: 'middle' }) + t(158, 62, 'Ready · 38.4 KB', { size: 12, w: 700 }) + r(158, 84, 190, 7, C.sand, { rx: 3.5 }) + r(184, 82, 110, 11, C.tealL, { rx: 5.5, stroke: C.teal }) + t(158, 112, '20 KB', { size: 8, mono: 1, fill: C.mut }) + t(348, 112, '50 KB', { size: 8, mono: 1, fill: C.mut, anchor: 'end' }) + chip(158, 124, '200 × 230 px', C.tealL, C.teal, 82) },
  'image-resizer': { alt: 'A photo going from 2.4 MB to a 312 KB WebP, down 87 percent',
    art: photo(44, 50, 100, 100) + t(94, 166, 'photo.jpg', { size: 8.5, mono: 1, fill: C.mut, anchor: 'middle' }) + t(178, 92, '2.4 MB', { size: 11, mono: 1, fill: C.mut }) + `<path d="M178 104h42m-7-6 7 6-7 6" stroke="${C.deep}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` + t(178, 128, '312 KB', { size: 12, mono: 1, w: 700 })
      + photo(250, 62, 78, 78) + chip(298, 44, '-87%', C.teal, '#fff', 44) + t(289, 158, 'photo.webp', { size: 8.5, mono: 1, fill: C.mut, anchor: 'middle' }) },
  'p2p-file-sharing': { alt: 'A device to device transfer of holiday-video.mp4 at 64 percent with a one-time room code',
    art: sheet(50, 30, 300, 140) + t(68, 62, '7K3Q-9FMZ', { size: 18, mono: 1, w: 700 }) + chip(262, 46, 'CONNECTED', C.tealL, C.teal, 74) + t(68, 90, 'holiday-video.mp4', { size: 10.5, w: 700 }) + t(332, 90, '2.4 GB', { size: 9, fill: C.mut, anchor: 'end' }) + r(68, 98, 264, 7, C.sand, { rx: 3.5 }) + r(68, 98, 170, 7, C.teal, { rx: 3.5 }) + t(68, 124, '64%  ·  38 MB/s  ·  23 s left', { size: 8.5, mono: 1, fill: C.mut }) + t(68, 150, 'Direct, device to device. Nothing stored.', { size: 8.5, fill: C.mut }) },
  'pdf-merge-split-sign': { alt: 'Two PDF pages being merged with a handwritten signature signed on the second page',
    art: `<g transform="rotate(-6 120 100)">${page(76, 40, 90, 120, 5)}</g>` + t(200, 108, '+', { size: 26, w: 700, fill: C.teal, anchor: 'middle' }) + `<g transform="rotate(4 280 100)">${page(236, 36, 94, 126, 4)}<path d="M246 140c8-18 14 8 22-6s10 6 18-4 10 2 20-2" stroke="#2740b8" stroke-width="2" fill="none" stroke-linecap="round"/></g>` },
  'password-generator': { alt: 'A generated password x7#Kq9!vL2@mPz4R with a very strong four-segment meter',
    art: r(40, 50, 320, 44, '#fff', { rx: 10, stroke: C.line }) + t(56, 78, 'x7#Kq9!vL2@mPz4R', { size: 16, mono: 1, w: 700 }) + `<path d="M335 72a9 9 0 1 0 2 8m0-8v5h-5" stroke="${C.deep}" stroke-width="1.8" fill="none" stroke-linecap="round"/>` + [0, 1, 2, 3].map((i) => r(40 + i * 82, 112, 74, 6, C.teal, { rx: 3 })).join('') + t(40, 142, '16 characters · A–z 0–9 !@#', { size: 9, fill: C.mut }) + t(360, 142, 'Very strong', { size: 10.5, w: 700, fill: C.teal, anchor: 'end' }) },
  'file-hash-checker': { alt: 'A file named installer-2.4.dmg with its SHA-256 hash and a green Match badge',
    art: sheet(44, 28, 312, 144) + r(58, 42, 30, 30, C.sand, { rx: 6 }) + t(73, 61, 'DMG', { size: 7, mono: 1, w: 700, fill: C.mut, anchor: 'middle' }) + t(98, 54, 'installer-2.4.dmg', { size: 11, w: 700 }) + t(98, 67, '148.2 MB', { size: 8, fill: C.mut }) + t(58, 94, 'SHA-256', { size: 7.5, mono: 1, fill: C.mut }) + t(58, 107, '9f86d081884c7d659a2feaa0c55ad015a', { size: 8, mono: 1 }) + t(58, 119, '3bf4f1b2b0b822cd15d6c15b0f00a08', { size: 8, mono: 1 }) + chip(58, 134, '✓ MATCH', C.tealL, C.teal, 58) + t(124, 147, 'Same as the published value', { size: 8.5, fill: C.mut }) },
  'exif-remover': { alt: 'A photo with its GPS location and camera details struck through and a Removed badge',
    art: photo(44, 44, 110, 112) + sheet(176, 36, 184, 128) + t(190, 60, 'GPS', { size: 8, fill: C.mut }) + t(190, 74, '12.97° N, 77.59° E', { size: 10, mono: 1, w: 700, fill: C.red }) + r(190, 70, 126, 1.5, C.red, { rx: 0 }) + t(190, 96, 'Camera', { size: 8, fill: C.mut }) + t(190, 110, 'Pixel 8 Pro', { size: 10, mono: 1, w: 700, fill: C.red }) + r(190, 106, 70, 1.5, C.red, { rx: 0 }) + t(190, 132, 'Taken 14 Sep, 18:42', { size: 8.5, fill: C.mut }) + chip(190, 140, 'REMOVED', C.teal, '#fff', 68) },
  'project-management-tool': { alt: 'A kanban board with To do, Doing and Done columns and task cards',
    art: [['To do', 0, C.deep, 2], ['Doing', 1, C.deep, 2], ['Done', 2, C.teal, 2]].map(([n, i, f]) => { const x = 34 + i * 112; return r(x, 28, 104, 144, '#ece4d3', { rx: 8 }) + t(x + 10, 46, n, { size: 9.5, w: 700 }) + [0, 1].map((k) => (k === 1 && i === 2 ? '' : r(x + 8, 56 + k * 52, 88, 44, '#fff', { rx: 6, stroke: C.line }) + r(x + 14, 63 + k * 52, 40, 6, f, { rx: 3 }) + grey(x + 14, 77 + k * 52, 70, 4) + grey(x + 14, 86 + k * 52, 50, 4))).join(''); }).join('') },
  'online-whiteboard': { alt: 'A whiteboard canvas with a connected flowchart, a freehand curve and a yellow sticky note',
    art: sheet(30, 20, 340, 160) + r(52, 48, 90, 46, '#fff', { rx: 6, stroke: C.ink, sw: 2 }) + `<path d="M142 71h56" stroke="${C.ink}" stroke-width="2"/><path d="M192 66l8 5-8 5" stroke="${C.ink}" stroke-width="2" fill="none"/><circle cx="224" cy="71" r="26" fill="#fff" stroke="${C.deep}" stroke-width="2"/><path d="M54 142c14-30 26 20 42-4s24-6 40-18" stroke="${C.ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` + r(262, 108, 84, 60, '#f7d98a', { rx: 4 }) + grey(272, 122, 60, 4, '#c9a85c') + grey(272, 134, 44, 4, '#c9a85c') },
  'raci-matrix-builder': { alt: 'A RACI grid assigning Responsible, Accountable, Consulted and Informed roles across Plan, Build, Test and Ship',
    art: ['R', 'A', 'C', 'I'].map((h, i) => t(150 + i * 54, 34, h, { size: 9, w: 700, fill: C.mut, anchor: 'middle' })).join('') + [['Plan', ['', 'A', 'C', 'I']], ['Build', ['I', 'A/R', 'R', '']], ['Test', ['', 'C', 'A', 'R']], ['Ship', ['C', 'A', 'R', 'I']]].map(([n, row], i) => t(46, 66 + i * 34, n, { size: 11, w: 700 }) + row.map((v, k) => (v ? r(126 + k * 54, 46 + i * 34, 48, 28, v[0] === 'A' ? C.amber : v[0] === 'R' ? C.tealL : v === 'C' ? '#cfdcf5' : C.sand, { rx: 6 }) + t(150 + k * 54, 65 + i * 34, v, { size: 11, w: 700, anchor: 'middle' }) : r(126 + k * 54, 46 + i * 34, 48, 28, 'none', { rx: 6, stroke: C.line }))).join('')).join('') },
  'website-launch-checklist': { alt: 'A website go-live checklist at 31 of 48 items with two ticked and two open',
    art: sheet(54, 22, 292, 156) + t(72, 48, 'Website go-live', { size: 12, w: 700 }) + t(328, 48, '31/48', { size: 9, mono: 1, fill: C.mut, anchor: 'end' }) + r(72, 58, 256, 6, C.sand, { rx: 3 }) + r(72, 58, 165, 6, C.teal, { rx: 3 })
      + [['301 redirects mapped', 1], ['Sitemap submitted', 1], ['GA4 events firing', 0], ['Purge CDN cache', 0]].map(([s, d], i) => (d ? r(72, 77 + i * 22, 13, 13, C.teal, { rx: 3 }) + `<path transform="translate(0 ${i * 22})" d="M75 84l3 3 6-6" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : r(72, 77 + i * 22, 13, 13, '#fff', { rx: 3, stroke: C.mut })) + t(94, 88 + i * 22, s, { size: 10, fill: d ? C.mut : C.ink })).join('') },
  'robots-txt-generator': { alt: 'A robots.txt file blocking GPTBot with ClaudeBot and CCBot blocked and Googlebot allowed',
    art: sheet(40, 22, 320, 156) + ['User-agent: *', 'Disallow: /admin/', 'User-agent: GPTBot', 'Disallow: /'].map((s, i) => t(58, 48 + i * 17, s, { size: 10.5, mono: 1, w: i % 2 ? 400 : 700, fill: i % 2 ? C.ink : C.deep })).join('') + chip(58, 124, 'ClaudeBot', C.redL, C.red, 66) + chip(130, 124, 'CCBot', C.redL, C.red, 48) + chip(184, 124, 'Googlebot ok', C.tealL, C.teal, 82) + t(58, 160, 'Test any page against the rules', { size: 8.5, fill: C.mut }) },
  'llms-txt-generator': { alt: 'An llms.txt file with a site title, a summary line and linked Docs and Optional sections',
    art: sheet(44, 20, 312, 160) + ['# Acme Analytics', '> Privacy-first web analytics.', '## Docs', '- [Getting started](/docs/start)', '- [API reference](/docs/api)', '## Optional', '- [Changelog](/changelog)'].map((s, i) => t(60, 44 + i * 18, s, { size: 10, mono: 1, w: s[0] === '#' ? 700 : 400, fill: s[0] === '#' ? C.deep : s[0] === '>' ? C.mut : C.ink })).join('') },
  'json-ld-schema-generator': { alt: 'JSON-LD Product markup with name and offers and a 4 of 4 checks passed badge',
    art: sheet(44, 20, 312, 160) + ['{', '  "@type": "Product",', '  "name": "Trail backpack",', '  "offers": {"price": "129"}', '}'].map((s, i) => t(60, 46 + i * 18, s, { size: 10.5, mono: 1, fill: s.includes('Product') ? C.deep : C.ink, w: s.includes('Product') ? 700 : 400 })).join('') + chip(60, 140, '✓ 4 of 4 checks', C.tealL, C.teal, 92) + chip(160, 140, 'JSON-LD', C.sand, C.ink, 54) },
  'llm-token-counter': { alt: 'A token counter reading 1,284 tokens with context window fit bars and an API cost estimate',
    art: sheet(44, 22, 312, 156) + t(60, 60, '1,284', { size: 30, w: 700, fill: C.deep }) + t(152, 60, 'tokens', { size: 10, fill: C.mut }) + [['8K', 16], ['32K', 4], ['128K', 1]].map(([n, p], i) => t(60, 92 + i * 17, n, { size: 8.5, mono: 1, fill: C.mut }) + r(94, 85 + i * 17, 210, 6, C.sand, { rx: 3 }) + r(94, 85 + i * 17, Math.max(5, 2.1 * p * 4), 6, i ? C.teal : C.deep, { rx: 3 }) + t(340, 92 + i * 17, p + '%', { size: 8.5, mono: 1, fill: C.mut, anchor: 'end' })).join('') + t(60, 154, 'about $0.0058 per request', { size: 8.5, mono: 1, fill: C.mut }) },
  'lorem-ipsum-generator': { alt: 'A Lorem ipsum generator with Text, HTML and Markdown tabs and paragraphs of placeholder text',
    art: sheet(44, 22, 312, 156) + r(60, 36, 220, 22, C.sand, { rx: 11 }) + r(62, 38, 52, 18, '#fff', { rx: 9 }) + t(88, 50, 'Text', { size: 9.5, w: 700, anchor: 'middle' }) + t(142, 50, 'HTML', { size: 9.5, fill: C.mut, anchor: 'middle' }) + t(206, 50, 'Markdown', { size: 9.5, fill: C.mut, anchor: 'middle' })
      + ['Lorem ipsum dolor sit amet, consectetur adipiscing', 'elit, sed do eiusmod tempor incididunt ut labore et', 'dolore magna aliqua. Ut enim ad minim veniam.'].map((s, i) => t(60, 82 + i * 14, s, { size: 9, fill: C.mut })).join('') + grey(60, 130, 280) + grey(60, 142, 240) },
 /* the six tools added in PR #70 */
  'age-and-date-calculator': { alt: 'An age calculator showing 28 years, 4 months and 12 days with a day-count row between two dates',
    art: sheet(54, 22, 292, 156) + t(72, 50, 'Age on 20 Nov 2026', { size: 9, fill: C.mut }) + t(72, 90, '28', { size: 38, w: 700, fill: C.deep }) + t(118, 90, 'yrs', { size: 11, fill: C.mut }) + t(160, 90, '4', { size: 28, w: 700 }) + t(180, 90, 'mo', { size: 11, fill: C.mut }) + t(216, 90, '12', { size: 28, w: 700 }) + t(246, 90, 'days', { size: 11, fill: C.mut })
      + r(72, 108, 256, 1, C.line, { rx: 0 }) + chip(72, 122, '15 Aug 1998', C.sand, C.ink, 74) + `<path d="M154 131h40m-6-5 6 5-6 5" stroke="${C.deep}" stroke-width="1.8" fill="none" stroke-linecap="round"/>` + chip(202, 122, '20 Nov 2026', C.sand, C.ink, 74) + t(72, 160, 'Eligible: within the 30 year limit', { size: 8.5, w: 600, fill: C.teal }) },
  'online-timer': { alt: 'A Pomodoro countdown timer at 24:36 with Start, Pause and Reset buttons',
    art: `<circle cx="200" cy="92" r="58" fill="#fff" stroke="${C.line}" stroke-width="2"/><circle cx="200" cy="92" r="58" fill="none" stroke="${C.amber}" stroke-width="9" stroke-linecap="round" stroke-dasharray="228 364" transform="rotate(-90 200 92)"/>` + t(200, 100, '24:36', { size: 26, mono: 1, w: 700, anchor: 'middle' }) + t(200, 118, 'FOCUS', { size: 8, w: 700, fill: C.mut, anchor: 'middle', ls: 1.5 })
      + r(118, 160, 70, 26, C.ink, { rx: 13 }) + t(153, 177, 'Pause', { size: 10, w: 700, fill: '#fff', anchor: 'middle' }) + r(200, 160, 70, 26, '#fff', { rx: 13, stroke: C.line }) + t(235, 177, 'Reset', { size: 10, w: 700, anchor: 'middle' }) + chip(286, 30, 'Pomodoro', C.tealL, C.teal, 62) },
  'compress-pdf-to-size': { alt: 'A PDF being compressed from 3.2 MB to under 200 KB with 100, 200 and 300 KB target buttons',
    art: page(50, 36, 70, 92, 5) + t(85, 148, '3.2 MB', { size: 10, mono: 1, fill: C.mut, anchor: 'middle' }) + `<path d="M142 82h46m-7-6 7 6-7 6" stroke="${C.deep}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` + page(210, 52, 56, 74, 4) + t(238, 148, '186 KB', { size: 11, mono: 1, w: 700, fill: C.teal, anchor: 'middle' }) + chip(286, 66, '-94%', C.teal, '#fff', 44)
      + chip(104, 164, '100 KB', C.sand, C.ink, 56) + chip(166, 164, '200 KB', C.amber, C.ink, 56) + chip(228, 164, '300 KB', C.sand, C.ink, 56) },
  'image-to-pdf': { alt: 'Three photos stacked into a single PDF document',
    art: photo(52, 36, 70, 52) + photo(52, 100, 70, 52) + `<path d="M138 94h40m-7-6 7 6-7 6" stroke="${C.deep}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` + `<g transform="rotate(5 250 100)">${page(206, 30, 92, 126, 3)}</g><g transform="rotate(-4 250 100)">${r(214, 40, 84, 110, '#fff', { rx: 3, stroke: C.line })}${photo(222, 50, 68, 48)}${grey(222, 108, 60, 4)}${grey(222, 118, 44, 4)}</g>` + chip(304, 24, 'PDF', C.red, '#fff', 40) },
  'pdf-to-jpg': { alt: 'A PDF page being converted into a JPG image',
    art: page(56, 34, 86, 112, 6) + chip(76, 158, 'PDF', C.red, '#fff', 44) + `<path d="M168 92h46m-7-6 7 6-7 6" stroke="${C.deep}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` + photo(238, 40, 110, 80) + chip(262, 132, 'page-1.jpg', C.sand, C.ink, 62) + chip(300, 158, 'JPG', C.teal, '#fff', 44) },
  'background-remover': { alt: 'A portrait with its background removed, shown on a transparent checkerboard next to the original',
    art: r(50, 38, 124, 124, '#cfe0ee', { rx: 8 }) + `<circle cx="112" cy="84" r="22" fill="#e0a77a"/><path d="M70 162c0-34 18-40 42-40s42 6 42 40z" fill="${C.navy}"/>` + `<path d="M196 100h28m-6-6 6 6-6 6" stroke="${C.deep}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<defs><pattern id="ck" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#fff"/><rect width="8" height="8" fill="#e6e0d3"/><rect x="8" y="8" width="8" height="8" fill="#e6e0d3"/></pattern></defs>` + r(236, 38, 124, 124, 'url(#ck)', { rx: 8, stroke: C.line }) + `<circle cx="298" cy="84" r="22" fill="#e0a77a"/><path d="M256 162c0-34 18-40 42-40s42 6 42 40z" fill="${C.navy}"/>` + chip(282, 168, 'Transparent PNG', C.teal, '#fff', 96) },
};

function svg(slug, { alt, art }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200" role="img" aria-label="${esc(alt)}"><title>${esc(alt)}</title>${art}</svg>\n`;
}

if (require.main === module) {
  if (process.argv.includes('--alts')) { for (const [k, v] of Object.entries(ART)) console.log(k + '\t' + v.alt); process.exit(0); }
  const dir = path.join(__dirname, '..', 'assets', 'tool-art');
  fs.mkdirSync(dir, { recursive: true });
  for (const [k, v] of Object.entries(ART)) fs.writeFileSync(path.join(dir, k + '.svg'), svg(k, v));
  console.log('drew', Object.keys(ART).length, 'pictures in assets/tool-art');
}
module.exports = { ART };
