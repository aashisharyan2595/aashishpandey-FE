/* SOP Maker builder (/tools/sop-maker/build). Needs sop-templates.js and sop-doc.js first.
   State lives in this tab and in localStorage; nothing is sent anywhere. */
(function () {
'use strict';
var D = window.SOPDoc, T = window.SOP_TEMPLATES || [], DEPTS = window.SOP_DEPTS || {};
var $ = function (s) { return document.querySelector(s); };
function h(tag, attrs) {
  var e = document.createElement(tag);
  if (attrs) for (var k in attrs) {
    if (attrs[k] == null || attrs[k] === false) continue;
    if (k === 'class') e.className = attrs[k];
    else if (k === 'text') e.textContent = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
  }
  for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null) continue; e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); }
  return e;
}
var KEY = 'apSop', st, step = 1, MAX = 6, dept = 'all';
var track = function (n, p) { if (window.apTrack) window.apTrack(n, p || {}); };

/* ---------- state ---------- */
function load() {
  var q = new URLSearchParams(location.search), id = q.get('t'), topic = q.get('topic'), saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (saved && !(saved.meta && saved.steps && saved.d)) saved = null;
  var t = id && byId(id);
  if (t) { st = D.fromTemplate(t, DEPTS, saved); step = 2; }
  else if (saved) { st = fixUp(saved); }
  else { st = D.fromTemplate(byId('people-employee-onboarding') || T[0], DEPTS); st.tpl = st.tpl || ''; }
  if (topic) { st.topic = topic.slice(0, 120); }
  if (id || topic) history.replaceState(null, '', location.pathname);
}
function fixUp(s) {
  var b = D.blank();
  for (var k in b) if (s[k] == null) s[k] = b[k];
  for (k in b.meta) if (s.meta[k] == null) s.meta[k] = b.meta[k];
  for (k in b.d) if (s.d[k] == null) s.d[k] = b.d[k];
  return s;
}
function byId(id) { for (var i = 0; i < T.length; i++) if (T[i].id === id) return T[i]; return null; }
var saveT; function save() { clearTimeout(saveT); saveT = setTimeout(function () { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }, 250); }
function changed() { render(); save(); }

/* ---------- search ---------- */
var STOP = /^(the|and|for|of|a|an|to|in|on|with|my|our|how|sop|procedure|process|standard|operating)$/;
function words(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(function (w) { return w.length > 1 && !STOP.test(w); }); }
function score(t, q) {
  if (!q.length) return 0;
  var title = t.title.toLowerCase(), tags = (t.tags || []).join(' ').toLowerCase(), sum = (t.summary + ' ' + (DEPTS[t.dept] ? DEPTS[t.dept].name : '')).toLowerCase(), s = 0;
  q.forEach(function (w) { var stem = w.replace(/(ing|es|s|ed)$/, ''); if (stem.length < 3) stem = w; if (title.indexOf(stem) >= 0) s += 5; if (tags.indexOf(stem) >= 0) s += 3; if (sum.indexOf(stem) >= 0) s += 1; });
  return s;
}
function results() {
  var q = words(st.topic);
  var list = T.filter(function (t) { return dept === 'all' || t.dept === dept; });
  if (q.length) list = list.map(function (t) { return [score(t, q), t]; }).filter(function (x) { return x[0] > 0; }).sort(function (a, b) { return b[0] - a[0]; }).map(function (x) { return x[1]; });
  return list;
}

/* ---------- step 1 ---------- */
function drawStart() {
  var f = $('#deptFilter'); f.textContent = '';
  [['all', 'All']].concat(Object.keys(DEPTS).map(function (k) { return [k, DEPTS[k].short || DEPTS[k].name]; })).forEach(function (d) {
    f.appendChild(h('button', { type: 'button', 'aria-pressed': String(dept === d[0]), onclick: function () { dept = d[0]; drawStart(); } }, d[1]));
  });
  var g = $('#tplList'), r = results(); g.textContent = '';
  $('#tplCount').textContent = r.length ? r.length + (r.length === 1 ? ' template' : ' templates') + (words(st.topic).length ? ' match' : '') : 'No template matches. Use the starter below, it works for any topic.';
  r.slice(0, 60).forEach(function (t) {
    g.appendChild(h('button', { type: 'button', class: 'sb-tpl', 'aria-pressed': String(st.tpl === t.id), onclick: function () { pick(t); } },
      h('span', { class: 'sb-tpl-d', text: DEPTS[t.dept] ? DEPTS[t.dept].name : '' }), h('strong', { text: t.title }), h('span', { class: 'sb-tpl-s', text: t.summary })));
  });
  $('#kindTopic').textContent = st.topic.trim() ? '"' + st.topic.trim() + '"' : 'your topic';
}
function pick(t) {
  if (dirty() && !confirm('Replace your current SOP with the ' + t.title + ' template?')) return;
  st = D.fromTemplate(t, DEPTS, st); drawAll(); go(2); track('sop_template', { t: t.id });
}
function dirty() { try { return !!localStorage.getItem(KEY + 'Edited'); } catch (e) { return false; } }
function markEdited() { try { localStorage.setItem(KEY + 'Edited', '1'); } catch (e) {} }
function clearEdited() { try { localStorage.removeItem(KEY + 'Edited'); } catch (e) {} }

/* ---------- editors ---------- */
function field(label, val, on, o) {
  o = o || {}; var id = 'f' + Math.random().toString(36).slice(2, 8);
  var inp = o.area ? h('textarea', { id: id, class: 'tl-textarea', rows: o.rows || 3, placeholder: o.ph || '' }) : h('input', { id: id, class: 'tl-input', type: o.type || 'text', placeholder: o.ph || '', maxlength: o.max || 200 });
  inp.value = val == null ? '' : val; inp.addEventListener('input', function () { on(inp.value); markEdited(); changed(); });
  return h('div', { class: 'tl-field' + (o.wide ? ' rs-wide' : '') }, h('label', { for: id, text: label }), inp);
}
function lines(label, arr, set, ph) {
  return field(label, arr.join('\n'), function (v) { set(v.split('\n').map(function (x) { return x.replace(/^\s*[-*•]\s*/, ''); }).filter(function (x, i, a) { return x.trim() || i < a.length - 1; })); }, { area: 1, rows: Math.max(3, Math.min(10, arr.length + 1)), ph: ph, wide: 1 });
}
function rowCtl(arr, i, redraw) {
  return h('div', { class: 'sb-ctl' },
    h('button', { type: 'button', class: 'tz-mini', 'aria-label': 'Move up', disabled: i === 0 || null, onclick: function () { var x = arr.splice(i, 1)[0]; arr.splice(i - 1, 0, x); markEdited(); redraw(); changed(); } }, '↑'),
    h('button', { type: 'button', class: 'tz-mini', 'aria-label': 'Move down', disabled: i === arr.length - 1 || null, onclick: function () { var x = arr.splice(i, 1)[0]; arr.splice(i + 1, 0, x); markEdited(); redraw(); changed(); } }, '↓'),
    h('button', { type: 'button', class: 'tz-mini', 'aria-label': 'Remove', onclick: function () { arr.splice(i, 1); markEdited(); redraw(); changed(); } }, '×'));
}
/* rows of 2 to 4 cells */
function grid(host, title, arr, cols, addLabel, hint) {
  var box = h('div', { class: 'sb-grid' });
  var redraw = function () {
    box.textContent = '';
    arr.forEach(function (r, i) {
      var row = h('div', { class: 'sb-row sb-row--' + cols.length });
      cols.forEach(function (c, j) {
        var inp = c.area ? h('textarea', { class: 'tl-textarea', rows: 2, placeholder: c.l, 'aria-label': c.l }) : h('input', { class: 'tl-input', type: 'text', placeholder: c.l, 'aria-label': c.l, maxlength: 300 });
        inp.value = r[j] || ''; inp.addEventListener('input', function () { r[j] = inp.value; markEdited(); changed(); });
        row.appendChild(inp);
      });
      row.appendChild(rowCtl(arr, i, redraw)); box.appendChild(row);
    });
  };
  redraw();
  host.appendChild(h('div', { class: 'sb-block' }, h('div', { class: 'sb-bh' }, h('span', { class: 'rb-lab', text: title }), hint ? h('span', { class: 'tl-muted tl-small', text: hint }) : null), box,
    h('div', {}, h('button', { type: 'button', class: 'tl-btn', onclick: function () { arr.push(cols.map(function () { return ''; })); markEdited(); redraw(); changed(); var l = box.lastChild && box.lastChild.querySelector('input,textarea'); l && l.focus(); } }, '+ ' + addLabel))));
}
function roleNames() { return st.roles.map(function (r) { return (r[0] || '').trim(); }).filter(Boolean); }
function drawSteps() {
  var box = $('#stepList'); box.textContent = '';
  var dl = $('#roleNames'); dl.textContent = ''; roleNames().forEach(function (n) { dl.appendChild(h('option', { value: n })); });
  st.steps.forEach(function (s, i) {
    var t = h('input', { class: 'tl-input sb-st', type: 'text', placeholder: 'Step, starting with a verb', 'aria-label': 'Step ' + (i + 1) + ' title', maxlength: 160 }); t.value = s.t || '';
    var o = h('input', { class: 'tl-input', type: 'text', placeholder: 'Owner', 'aria-label': 'Step ' + (i + 1) + ' owner', list: 'roleNames', maxlength: 80 }); o.value = s.o || '';
    var d = h('textarea', { class: 'tl-textarea', rows: 2, placeholder: 'How, with timing or limits', 'aria-label': 'Step ' + (i + 1) + ' detail' }); d.value = s.d || '';
    t.addEventListener('input', function () { s.t = t.value; markEdited(); changed(); }); o.addEventListener('input', function () { s.o = o.value; markEdited(); changed(); }); d.addEventListener('input', function () { s.d = d.value; markEdited(); changed(); });
    box.appendChild(h('div', { class: 'sb-step' }, h('div', { class: 'sb-step-h' }, h('span', { class: 'sb-num', text: String(i + 1) }), t, rowCtl(st.steps, i, drawSteps)), h('div', { class: 'sb-step-b' }, d, o)));
  });
}
function drawDetails() {
  var b = $('#detailsBody'); b.textContent = ''; var m = st.meta, g = h('div', { class: 'rs-f2' });
  g.appendChild(field('SOP title', m.title, function (v) { m.title = v; }, { wide: 1, max: 120 }));
  g.appendChild(field('Company or team', m.company, function (v) { m.company = v; }, { ph: 'Your company' }));
  g.appendChild(field('Department', m.dept, function (v) { m.dept = v; }));
  g.appendChild(field('SOP ID', m.id, function (v) { m.id = v; }, { max: 40 }));
  g.appendChild(field('Version', m.version, function (v) { m.version = v; }, { max: 12 }));
  g.appendChild(field('Owner', m.owner, function (v) { m.owner = v; }));
  g.appendChild(field('Approved by', m.approver, function (v) { m.approver = v; }));
  g.appendChild(field('Prepared by', m.prepared, function (v) { m.prepared = v; }, { ph: 'Your name' }));
  g.appendChild(field('Effective date', m.effective, function (v) { m.effective = v; }, { type: 'date' }));
  g.appendChild(field('Review cycle', m.review, function (v) { m.review = v; }, { wide: 1 }));
  g.appendChild(field('Purpose: why this SOP exists', st.purpose, function (v) { st.purpose = v; }, { area: 1, rows: 3, wide: 1 }));
  g.appendChild(field('Scope: who and what it covers, and what it does not', st.scope, function (v) { st.scope = v; }, { area: 1, rows: 3, wide: 1 }));
  b.appendChild(g);
}
function drawPeople() {
  var b = $('#peopleBody'); b.textContent = '';
  grid(b, 'Roles and responsibilities', st.roles, [{ l: 'Role' }, { l: 'What they do in this SOP', area: 1 }], 'Add a role', 'Step owners are picked from these.');
  grid(b, 'Definitions', st.defs, [{ l: 'Term' }, { l: 'Meaning', area: 1 }], 'Add a term');
  b.appendChild(lines('Prerequisites, tools and materials (one per line)', st.prereqs, function (v) { st.prereqs = v; }, 'Access to the HR system'));
}
function drawControls() {
  var b = $('#controlsBody'); b.textContent = '';
  grid(b, 'Measures of success (KPIs)', st.kpis, [{ l: 'Measure' }, { l: 'Target' }], 'Add a KPI');
  grid(b, 'Risks and controls', st.risks, [{ l: 'Risk', area: 1 }, { l: 'Control or mitigation', area: 1 }], 'Add a risk');
  b.appendChild(lines('Related documents (one per line)', st.related, function (v) { st.related = v; }));
  grid(b, 'Revision history', st.revs, [{ l: 'Version' }, { l: 'Date' }, { l: 'Change' }, { l: 'By' }], 'Add a revision');
}
function drawDesign() {
  var b = $('#designBody'); b.textContent = ''; var d = st.d;
  var sw = h('div', { class: 'tl-row', style: 'gap:10px' });
  D.ACCENTS.forEach(function (c) { sw.appendChild(h('button', { type: 'button', class: 'inv-sw', style: 'background:' + c, 'aria-label': 'Colour ' + c, 'aria-pressed': String(d.accent === c), onclick: function () { d.accent = c; drawDesign(); changed(); } })); });
  var pick = h('input', { type: 'color', value: d.accent, 'aria-label': 'Custom colour', class: 'sb-color' }); pick.addEventListener('input', function () { d.accent = pick.value; changed(); }); sw.appendChild(pick);
  b.appendChild(h('div', { class: 'tl-field' }, h('span', { class: 'tl-label', text: 'Accent colour' }), sw));
  var sel = function (label, opts, val, on) { var s = h('select', { class: 'tl-select', 'aria-label': label }); opts.forEach(function (o) { s.appendChild(h('option', { value: o[0], text: o[1] })); }); s.value = String(val); s.addEventListener('change', function () { on(s.value); changed(); }); return h('div', { class: 'tl-field' }, h('label', { text: label }), s); };
  var g = h('div', { class: 'rs-f2' });
  g.appendChild(sel('Font', Object.keys(D.FONTS).map(function (k) { return [k, D.FONTS[k][0]]; }), d.font, function (v) { d.font = v; }));
  g.appendChild(sel('Text size', [['9.5', 'Small'], ['10.5', 'Normal'], ['11.5', 'Large']], d.size, function (v) { d.size = +v; }));
  g.appendChild(sel('Paper', [['A4', 'A4'], ['Letter', 'US Letter']], d.paper, function (v) { d.paper = v; }));
  b.appendChild(g);
  var ck = function (label, key) { var i = h('input', { type: 'checkbox' }); i.checked = !!d[key]; i.addEventListener('change', function () { d[key] = i.checked; changed(); }); return h('label', { class: 'tl-check' }, i, label); };
  b.appendChild(h('div', { class: 'tl-row' }, ck('Show the step flow above the procedure', 'flow'), ck('Add a sign-off block', 'sign')));
}
function drawChecks() { var host = $('#checksHost'); host.textContent = ''; host.appendChild(lines('Quality checks and controls (one per line)', st.checks, function (v) { st.checks = v; })); }
function drawAll() { drawStart(); drawDetails(); drawPeople(); drawSteps(); drawChecks(); drawControls(); drawDesign(); render(); save(); var ti = $('#topic'); if (document.activeElement !== ti) ti.value = st.topic || ''; }

/* ---------- preview ---------- */
var prev = $('#sop'), fit = $('#fit');
function render() {
  prev.innerHTML = D.html(st);
  var P = D.PAPER[st.d.paper] || D.PAPER.A4, pw = P[0] * 96 / 25.4; // page width in CSS px
  prev.style.width = pw + 'px';
  var sc = Math.min(1, fit.clientWidth / pw); prev.style.transform = 'scale(' + sc + ')';
  var ph = P[1] * 96 / 25.4, H = prev.offsetHeight; fit.style.height = Math.ceil(H * sc) + 'px';
  var pages = Math.max(1, Math.ceil((H - 4) / ph));
  prev.querySelectorAll('.sop-pb').forEach(function (x) { x.remove(); });
  for (var i = 1; i < pages; i++) prev.appendChild(h('div', { class: 'sop-pb', style: 'top:' + Math.round(ph * i) + 'px', text: 'Page ' + (i + 1) }));
  $('#pageNote').textContent = 'About ' + pages + (pages === 1 ? ' page' : ' pages') + ' on ' + (st.d.paper === 'Letter' ? 'US Letter' : 'A4') + '. Dashed lines show roughly where pages break.';
}
window.addEventListener('resize', function () { render(); });

/* ---------- steps ---------- */
function go(n) {
  step = Math.max(1, Math.min(MAX, n));
  document.querySelectorAll('.rb-step').forEach(function (s) { s.hidden = +s.getAttribute('data-step') !== step; });
  document.querySelectorAll('#steps button').forEach(function (b) { var k = +b.getAttribute('data-go'); if (k === step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); b.classList.toggle('is-done', k < step); });
  $('#rbBack').hidden = step === 1; $('#rbNext').hidden = step === MAX;
  var cur = document.querySelector('#steps [aria-current]'); cur && cur.scrollIntoView && cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  if (window.innerWidth < 1060) { var p = $('.rb-panel'); var y = p.getBoundingClientRect().top + window.scrollY - 80; if (window.scrollY > y) window.scrollTo(0, y); }
}

/* ---------- wiring ---------- */
load();
var topicIn = $('#topic');
topicIn.value = st.topic || '';
topicIn.addEventListener('input', function () { st.topic = topicIn.value; drawStart(); save(); });
$('#topicForm').addEventListener('submit', function (e) { e.preventDefault(); var r = results(); if (r[0]) { var el = document.querySelector('#tplList .sb-tpl'); el && el.focus(); } });
var kinds = $('#kind'); Object.keys(D.KINDS).forEach(function (k) { kinds.appendChild(h('option', { value: k, text: D.KINDS[k].n })); });
$('#makeBlank').addEventListener('click', function () {
  var t = (st.topic || '').trim(); if (!t) { topicIn.focus(); topicIn.setAttribute('aria-invalid', 'true'); setTimeout(function () { topicIn.removeAttribute('aria-invalid'); }, 1600); return; }
  if (dirty() && !confirm('Replace your current SOP with a new starter for "' + t + '"?')) return;
  var keep = st; st = D.skeleton(t, kinds.value, keep.meta.company); st.d = keep.d; st.meta.prepared = keep.meta.prepared; clearEdited(); drawAll(); go(2); track('sop_skeleton', { k: kinds.value });
});
$('#addStep').addEventListener('click', function () { st.steps.push({ t: '', d: '', o: roleNames()[0] || '' }); markEdited(); drawSteps(); changed(); var l = document.querySelector('#stepList .sb-step:last-child .sb-st'); l && l.focus(); });
document.querySelectorAll('#steps button').forEach(function (b) { b.addEventListener('click', function () { go(+b.getAttribute('data-go')); }); });
$('#rbNext').addEventListener('click', function () { go(step + 1); });
$('#rbBack').addEventListener('click', function () { go(step - 1); });
$('#rbDl').addEventListener('click', function () { go(MAX); });
var origTitle = document.title;
window.addEventListener('afterprint', function () { document.title = origTitle; });
$('#print').addEventListener('click', function () { render(); document.title = (st.meta.title || 'SOP') + ' - SOP'; track('sop_print', { t: st.tpl }); window.print(); });
$('#dl-docx').addEventListener('click', function () { D.save(st, 'docx'); track('sop_docx', { t: st.tpl }); });
$('#dl-md').addEventListener('click', function () { D.save(st, 'md'); track('sop_md', { t: st.tpl }); });
$('#dl-json').addEventListener('click', function () { D.save(st, 'json'); });
$('#dl-copy').addEventListener('click', function (e) { var b = e.currentTarget, s = b.querySelector('span'), idle = s.textContent; (navigator.clipboard ? navigator.clipboard.writeText(D.text(st)) : Promise.reject()).then(function () { s.textContent = 'Copied'; setTimeout(function () { s.textContent = idle; }, 1500); }, function () { window.prompt('Copy this:', D.text(st)); }); });
$('#ld-json').addEventListener('change', function (e) {
  var f = e.target.files[0]; if (!f) return; var r = new FileReader();
  r.onload = function () { try { var s = JSON.parse(r.result); if (!s.meta || !s.steps) throw 0; st = fixUp(s); markEdited(); drawAll(); go(2); } catch (x) { alert('That file is not an SOP saved from this tool.'); } e.target.value = ''; };
  r.readAsText(f);
});
$('#reset').addEventListener('click', function () { if (!confirm('Clear this SOP and start again?')) return; try { localStorage.removeItem(KEY); } catch (e) {} clearEdited(); st = D.blank(); st.steps = [{ t: '', d: '', o: '' }]; drawAll(); go(1); });
drawAll(); go(step);
window.__sop = { st: function () { return st; }, md: function () { return D.md(st); } };
})();
