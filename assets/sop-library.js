/* SOP template library (/tools/sop-maker/templates): search, department filter, preview and downloads.
   The template cards are static HTML; this only adds behaviour. Needs sop-templates.js and sop-doc.js. */
(function () {
'use strict';
var D = window.SOPDoc, DEPTS = window.SOP_DEPTS, byId = {};
(window.SOP_TEMPLATES || []).forEach(function (t) { byId[t.id] = t; });
var $ = function (s) { return document.querySelector(s); }, all = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
var cards = all('.sm-card'), depts = all('.sm-dept'), q = $('#q'), f = 'all';
function apply() {
  var words = q.value.toLowerCase().split(/[^a-z0-9]+/).filter(function (w) { return w.length > 1; }), n = 0;
  cards.forEach(function (c) {
    var hay = c.getAttribute('data-q'), ok = (f === 'all' || c.getAttribute('data-dept') === f) && words.every(function (w) { return hay.indexOf(w.replace(/(ing|es|s)$/, '').slice(0, Math.max(3, w.length - 2))) >= 0; });
    c.hidden = !ok; if (ok) n++;
  });
  depts.forEach(function (d) { d.hidden = !d.querySelector('.sm-card:not([hidden])'); });
  $('#count').textContent = n + (n === 1 ? ' template' : ' templates');
  $('#none').hidden = n > 0;
  $('#noneLink').href = '/tools/sop-maker/build' + (q.value.trim() ? '?topic=' + encodeURIComponent(q.value.trim()) : '');
}
q.addEventListener('input', apply);
all('#filter button').forEach(function (b) {
  b.addEventListener('click', function () { f = b.getAttribute('data-f'); all('#filter button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); apply(); });
});
// a department link from the landing page (#people) filters to it
var h = location.hash.slice(1); if (DEPTS[h]) { var fb = document.querySelector('#filter [data-f="' + h + '"]'); fb && fb.click(); }

var dlg = $('#view'), doc = $('#viewDoc');
function sized() { var w = doc.clientWidth, el = doc.firstChild; if (!el) return; var sc = w / 794; el.style.transform = 'scale(' + sc + ')'; doc.style.height = Math.ceil(el.offsetHeight * sc) + 'px'; }
function sopFor(id) { var s = D.fromTemplate(byId[id], DEPTS); s.meta.company = '[Company]'; return s; }
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-dl]'); if (!b) return;
  var id = b.closest('.sm-card').getAttribute('data-id'), kind = b.getAttribute('data-dl'); if (!byId[id]) return;
  var s = sopFor(id);
  if (window.apTrack) window.apTrack('sop_lib_' + kind, { t: id });
  if (kind === 'view') {
    doc.innerHTML = D.html(s); $('#viewT').textContent = byId[id].title; $('#viewC').href = '/tools/sop-maker/build?t=' + id;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    sized(); dlg.querySelector('.sm-view-b').scrollTop = 0;
  } else if (kind === 'pdf') D.printDoc(s);
  else D.save(s, kind);
});
$('#viewX').addEventListener('click', function () { dlg.close ? dlg.close() : dlg.removeAttribute('open'); });
dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
window.addEventListener('resize', function () { if (dlg.open) sized(); });
})();
