/* SOP Maker: turns one SOP object into the paper preview, Markdown, plain text and a Word (.docx) file.
   Shared by the builder (/tools/sop-maker/build) and the template library (/tools/sop-maker/templates).
   Everything runs in the browser; nothing is uploaded. */
(function () {
'use strict';
var FONTS = { arial: ['Arial', 'Arial, Helvetica, sans-serif'], calibri: ['Calibri', 'Calibri, Carlito, Arial, sans-serif'], georgia: ['Georgia', 'Georgia, serif'], cambria: ['Cambria', 'Cambria, Caladea, Georgia, serif'] };
var ACCENTS = ['#1f4e79', '#0f766e', '#4338ca', '#b45309', '#be123c', '#111111'];
var PAPER = { A4: [210, 297, 11906, 16838], Letter: [215.9, 279.4, 12240, 15840] };

function blank() {
  return {
    tpl: '', topic: '',
    meta: { company: '', title: '', id: '', version: '1.0', dept: '', owner: '', approver: '', effective: '', review: 'Every 12 months', prepared: '' },
    purpose: '', scope: '', defs: [], roles: [], prereqs: [], steps: [], checks: [], kpis: [], risks: [], related: [], revs: [],
    d: { accent: ACCENTS[0], font: 'arial', paper: 'A4', size: 10.5, flow: true, sign: true }
  };
}
function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function initials(s) { return String(s || '').replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).filter(function (w) { return !/^(and|of|the|for|to|a|an|in|on|with)$/i.test(w); }).map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 4); }
function fromTemplate(t, depts, keep) {
  var s = blank(), dn = (depts && depts[t.dept]) ? depts[t.dept].code : 'SOP';
  if (keep) { s.meta.company = keep.meta.company; s.meta.prepared = keep.meta.prepared; s.d = JSON.parse(JSON.stringify(keep.d)); }
  s.tpl = t.id; s.topic = keep ? keep.topic : '';
  s.meta.title = t.title; s.meta.id = 'SOP-' + dn + '-' + (initials(t.title) || '001') + '-01'; s.meta.dept = depts && depts[t.dept] ? depts[t.dept].name : '';
  s.meta.owner = (t.roles[0] || [''])[0]; s.meta.approver = (t.roles[1] || t.roles[0] || [''])[0];
  s.meta.effective = today(); s.meta.review = t.review || 'Every 12 months';
  s.purpose = t.purpose; s.scope = t.scope;
  s.defs = clone(t.definitions); s.roles = clone(t.roles); s.prereqs = clone(t.prereqs);
  s.steps = t.steps.map(function (x) { return { t: x.t, d: x.d, o: x.o }; });
  s.checks = clone(t.checks); s.kpis = clone(t.kpis); s.risks = clone(t.risks); s.related = clone(t.related);
  s.revs = [['1.0', today(), 'First issue', s.meta.owner]];
  return s;
}
function clone(x) { return JSON.parse(JSON.stringify(x || [])); }

/* A starting skeleton for any topic or career that has no template. The kind picks the shape. */
var KINDS = {
  process: { n: 'Process (start to finish)', steps: [
    ['Receive the request or trigger', 'Log the request for {t} in [tracking tool] with the date, requester and what is needed. Acknowledge it within 1 business day.', 0],
    ['Check it is complete and in scope', 'Confirm the inputs listed under prerequisites are present. Send incomplete requests back with what is missing.', 0],
    ['Plan the work', 'Agree the owner, the deadline and any approvals needed for {t}. Note dependencies and risks.', 0],
    ['Carry out the core task', 'Do the work for {t} following the agreed standard. Record decisions and anything unusual as you go.', 1],
    ['Check the output', 'A second person checks the result against the quality checks below before it is released.', 2],
    ['Approve and release', 'The approver signs off. Release or hand over the output and tell the requester.', 2],
    ['Record and file', 'Save the final version, evidence and approvals in [system] with the SOP ID in the file name.', 0],
    ['Handle exceptions', 'If something does not fit this procedure, stop, record it and escalate to the owner before continuing.', 0],
    ['Review and improve', 'Look at the KPIs each month. Feed problems and ideas into the next revision of this SOP.', 0]] },
  routine: { n: 'Routine or checklist (daily, weekly)', steps: [
    ['Prepare before you start', 'Gather the tools, access and materials for {t}. Check the previous shift or period notes.', 1],
    ['Run the safety and readiness checks', 'Walk through the readiness checklist. Do not continue if any must-have item fails; report it to the supervisor.', 1],
    ['Complete each routine task in order', 'Work through the {t} tasks in the order listed in the checklist. Tick each one as it is done.', 1],
    ['Record readings and results', 'Write down the figures, counts or observations the checklist asks for, with the time.', 1],
    ['Fix or report anything out of range', 'Correct small issues on the spot. Log anything you cannot fix and tell the supervisor straight away.', 1],
    ['Hand over or close down', 'Leave the area or system in the agreed state and write a short handover note.', 1],
    ['Supervisor sign-off', 'The supervisor reviews the completed checklist and signs it off the same day.', 0]] },
  approval: { n: 'Approval workflow', steps: [
    ['Submit the request', 'The requester fills in the {t} request form with the business reason, cost and timing.', 1],
    ['Check against policy', 'The reviewer checks the request against the policy and the approval limits in this SOP.', 2],
    ['Route to the right approver', 'Requests above [limit] go to the second-level approver. Two-person approval is required above [higher limit].', 2],
    ['Approve, reject or ask for changes', 'The approver decides within [2 business days] and records the reason in [system].', 0],
    ['Tell the requester', 'Send the decision and any conditions to the requester the same day.', 2],
    ['Carry out the approved action', 'Only act once approval is recorded. Keep the approval reference with the records.', 1],
    ['File the evidence', 'Store the request, approval and outcome together so they can be audited.', 2],
    ['Report monthly', 'Share counts, turnaround times and exceptions with the owner each month.', 2]] },
  customer: { n: 'Customer-facing service', steps: [
    ['Greet and identify the customer', 'Respond to the customer about {t} within [target time]. Confirm who they are and what they need.', 1],
    ['Understand the request', 'Ask open questions, repeat the request back and log it in [CRM or helpdesk].', 1],
    ['Check what applies', 'Look up the customer record, the policy and any previous contact before you promise anything.', 1],
    ['Resolve or route', 'Resolve it if you can within your authority. Otherwise route it to the right team with full notes.', 1],
    ['Confirm the outcome', 'Tell the customer what was done, what happens next and when. Use plain language.', 1],
    ['Follow up', 'Check back within [timeframe] that the issue is solved. Close the record only after that.', 1],
    ['Learn from it', 'Tag the record so trends show up in the monthly review led by the owner.', 0]] },
  safety: { n: 'Safety-critical task', steps: [
    ['Confirm you are trained and authorised', 'Only trained and authorised people may carry out {t}. Check the training record.', 1],
    ['Assess the risks', 'Review the risk assessment and the area before starting. Stop if conditions have changed.', 1],
    ['Put on protective equipment', 'Wear the PPE listed under prerequisites and check it is in good condition.', 1],
    ['Isolate and secure', 'Isolate energy sources, secure the area and display warning signs as required.', 1],
    ['Carry out the task step by step', 'Follow the method exactly. Never skip a step or use a shortcut.', 1],
    ['Verify it is safe', 'Check the work, remove isolation in the right order and confirm the area is safe to use.', 2],
    ['Report incidents and near misses', 'Report any injury, damage or near miss to the supervisor at once and log it within 24 hours.', 1],
    ['Record completion', 'Sign the task record. The supervisor countersigns.', 2]] }
};
function skeleton(topic, kind, company) {
  var s = blank(), t = String(topic || 'the task').trim() || 'the task', k = KINDS[kind] || KINDS.process, title = t.charAt(0).toUpperCase() + t.slice(1);
  var roles = kind === 'routine' || kind === 'safety' ? [['Supervisor', 'Owns this SOP, trains staff and signs off completed records.'], ['Team member', 'Carries out ' + t + ' as written and reports problems.'], ['Checker', 'Independently verifies the work before it is signed off.']]
    : kind === 'customer' ? [['Team lead', 'Owns this SOP, coaches the team and reviews quality.'], ['Service agent', 'Handles ' + t + ' with customers from first contact to close.'], ['Specialist team', 'Takes routed cases that need specialist knowledge.']]
    : kind === 'approval' ? [['Approver', 'Makes the decision within the limits set in this SOP.'], ['Requester', 'Submits complete requests with the business reason.'], ['Reviewer', 'Checks requests against policy and routes them.']]
    : [['Process owner', 'Owns this SOP, keeps it current and resolves exceptions.'], ['Doer', 'Carries out ' + t + ' as written.'], ['Reviewer and approver', 'Checks the output and approves its release.']];
  s.topic = t; s.meta.company = company || ''; s.meta.title = title; s.meta.id = 'SOP-' + (initials(t) || 'GEN') + '-01'; s.meta.owner = roles[0][0]; s.meta.approver = roles[kind === 'approval' ? 0 : 2][0]; s.meta.effective = today();
  s.purpose = 'This procedure sets out how [Company] carries out ' + t + ' the same way every time, so the result is safe, consistent and meets the agreed standard. It makes clear who does what and when.';
  s.scope = 'Applies to everyone who takes part in ' + t + ' at [Company], including contractors. It does not cover [out-of-scope activities], which have their own procedures.';
  s.defs = [['SOP', 'Standard operating procedure: the agreed way to do a task.'], ['Owner', 'The person accountable for this SOP and for keeping it current.']];
  s.roles = roles;
  s.prereqs = ['Training on this SOP, recorded in the training log', 'Access to [systems or tools] needed for ' + t, 'The latest version of this SOP and its forms'];
  s.steps = k.steps.map(function (r) { return { t: r[0], d: r[1].replace(/\{t\}/g, t), o: roles[Math.min(r[2], roles.length - 1)][0] }; });
  s.checks = ['Every step is completed in order and recorded', 'A second person checks the output before sign-off', 'Exceptions are logged and escalated the same day'];
  s.kpis = [['On-time completion', '95% within the target time'], ['First-time right', '98% pass the check without rework'], ['Exceptions', 'Fewer than [n] a month, all closed within 5 business days']];
  s.risks = [['Steps skipped under time pressure', 'Checklist sign-off and spot checks by the owner'], ['Out-of-date version in use', 'Only the controlled copy in [system] is valid; printed copies expire after 30 days'], ['Single person knows the process', 'Train at least two people and rotate the task']];
  s.related = ['Training record', 'Exception log'];
  s.revs = [['1.0', today(), 'First issue', roles[0][0]]];
  return s;
}

/* ---------- text helpers ---------- */
var E = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
var filled = function (a) { return (a || []).filter(function (x) { return Array.isArray(x) ? x.some(function (v) { return String(v || '').trim(); }) : String(x || '').trim(); }); };
function sections(s) {
  // the numbered sections in print order, skipping empty ones
  var out = [];
  if (s.purpose.trim()) out.push(['purpose', 'Purpose']);
  if (s.scope.trim()) out.push(['scope', 'Scope']);
  if (filled(s.defs).length) out.push(['defs', 'Definitions']);
  if (filled(s.roles).length) out.push(['roles', 'Roles and responsibilities']);
  if (filled(s.prereqs).length) out.push(['prereqs', 'Prerequisites, tools and materials']);
  if (s.steps.some(function (x) { return (x.t || x.d || '').trim(); })) out.push(['steps', 'Procedure']);
  if (filled(s.checks).length) out.push(['checks', 'Quality checks and controls']);
  if (filled(s.kpis).length) out.push(['kpis', 'Measures of success (KPIs)']);
  if (filled(s.risks).length) out.push(['risks', 'Risks and controls']);
  if (filled(s.related).length) out.push(['related', 'Related documents']);
  if (filled(s.revs).length) out.push(['revs', 'Revision history']);
  return out;
}
function steps(s) { return s.steps.filter(function (x) { return (x.t || x.d || '').trim(); }); }
function metaRows(s) {
  var m = s.meta;
  return [['Company', m.company], ['SOP ID', m.id], ['Version', m.version], ['Department', m.dept], ['Owner', m.owner], ['Approved by', m.approver], ['Effective date', m.effective], ['Review', m.review]].filter(function (r) { return String(r[1] || '').trim(); });
}

/* ---------- the paper ---------- */
function html(s) {
  var d = s.d, o = [], n = 0, st = steps(s);
  o.push('<div class="sop-doc" style="--ac:' + E(d.accent) + ';--ff:' + E(FONTS[d.font] ? FONTS[d.font][1] : FONTS.arial[1]) + ';--fs:' + (+d.size || 10.5) + 'pt">');
  o.push('<header class="sop-hd"><div class="sop-hd-t"><span class="sop-kick">Standard operating procedure</span><h1>' + E(s.meta.title || 'Untitled SOP') + '</h1></div>' + (s.meta.company ? '<div class="sop-co">' + E(s.meta.company) + '</div>' : '') + '</header>');
  var mr = metaRows(s);
  if (mr.length) o.push('<table class="sop-meta"><tbody>' + pairs(mr).map(function (p) { return '<tr>' + p.map(function (c) { return c ? '<th>' + E(c[0]) + '</th><td>' + E(c[1]) + '</td>' : '<th></th><td></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>');
  sections(s).forEach(function (sec) {
    n++; var k = sec[0], h = '<h2><span>' + n + '.</span> ' + E(sec[1]) + '</h2>', b = '';
    if (k === 'purpose' || k === 'scope') b = para(s[k]);
    else if (k === 'defs') b = table(['Term', 'Meaning'], filled(s.defs), [30, 70]);
    else if (k === 'roles') b = table(['Role', 'Responsibilities'], filled(s.roles), [30, 70]);
    else if (k === 'kpis') b = table(['Measure', 'Target'], filled(s.kpis), [45, 55]);
    else if (k === 'risks') b = table(['Risk', 'Control or mitigation'], filled(s.risks), [42, 58]);
    else if (k === 'revs') b = table(['Version', 'Date', 'Change', 'By'], filled(s.revs), [12, 18, 48, 22]);
    else if (k === 'prereqs' || k === 'checks' || k === 'related') b = '<ul>' + filled(s[k]).map(function (x) { return '<li>' + E(x) + '</li>'; }).join('') + '</ul>';
    else if (k === 'steps') {
      if (d.flow && st.length > 1 && st.length <= 16) b += '<div class="sop-flow" aria-hidden="true">' + st.map(function (x, i) { return '<span><b>' + (i + 1) + '</b>' + E(short(x.t || x.d)) + '</span>'; }).join('<i></i>') + '</div>';
      b += '<table class="sop-steps"><thead><tr><th style="width:7%">#</th><th>Step and how</th><th style="width:22%">Owner</th></tr></thead><tbody>' + st.map(function (x, i) {
        return '<tr><td class="sop-n">' + n + '.' + (i + 1) + '</td><td>' + (x.t ? '<strong>' + E(x.t) + '</strong>' : '') + (x.d ? '<div>' + E(x.d) + '</div>' : '') + '</td><td>' + E(x.o) + '</td></tr>';
      }).join('') + '</tbody></table>';
    }
    o.push('<section class="sop-sec">' + h + b + '</section>');
  });
  if (d.sign) o.push('<section class="sop-sec sop-sign"><table><thead><tr><th></th><th>Name</th><th>Signature</th><th>Date</th></tr></thead><tbody><tr><th>Prepared by</th><td>' + E(s.meta.prepared) + '</td><td></td><td></td></tr><tr><th>Approved by</th><td>' + E(s.meta.approver) + '</td><td></td><td></td></tr></tbody></table></section>');
  o.push('<footer class="sop-ft">' + E([s.meta.id, s.meta.version ? 'Version ' + s.meta.version : '', 'Uncontrolled when printed. Check the latest version before use.'].filter(Boolean).join(' · ')) + '</footer>');
  o.push('</div>');
  return o.join('');
}
function short(t) { t = String(t || ''); return t.length > 34 ? t.slice(0, 32).replace(/\s+\S*$/, '') + '…' : t; }
function para(t) { return String(t).split(/\n+/).filter(function (x) { return x.trim(); }).map(function (x) { return '<p>' + E(x) + '</p>'; }).join(''); }
function table(head, rows, w) { return '<table><thead><tr>' + head.map(function (x, i) { return '<th style="width:' + w[i] + '%">' + E(x) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function (r) { return '<tr>' + head.map(function (_, i) { return '<td>' + E(r[i]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>'; }
function pairs(a) { var o = []; for (var i = 0; i < a.length; i += 2) o.push([a[i], a[i + 1]]); return o; }

/* ---------- Markdown and plain text ---------- */
function md(s) {
  var o = [], n = 0, m = s.meta, cell = function (x) { return String(x || '').replace(/\|/g, '\\|').replace(/\n/g, ' '); };
  var tb = function (head, rows) { o.push('| ' + head.join(' | ') + ' |', '|' + head.map(function () { return ' --- '; }).join('|') + '|'); rows.forEach(function (r) { o.push('| ' + head.map(function (_, i) { return cell(r[i]); }).join(' | ') + ' |'); }); o.push(''); };
  o.push('# ' + (m.title || 'Untitled SOP'), '');
  if (m.company) o.push('**' + m.company + '** · Standard operating procedure', '');
  var mr = metaRows(s); if (mr.length) tb(['Field', 'Value'], mr);
  sections(s).forEach(function (sec) {
    n++; var k = sec[0]; o.push('## ' + n + '. ' + sec[1], '');
    if (k === 'purpose' || k === 'scope') o.push(s[k].trim(), '');
    else if (k === 'defs') tb(['Term', 'Meaning'], filled(s.defs));
    else if (k === 'roles') tb(['Role', 'Responsibilities'], filled(s.roles));
    else if (k === 'kpis') tb(['Measure', 'Target'], filled(s.kpis));
    else if (k === 'risks') tb(['Risk', 'Control or mitigation'], filled(s.risks));
    else if (k === 'revs') tb(['Version', 'Date', 'Change', 'By'], filled(s.revs));
    else if (k === 'steps') { steps(s).forEach(function (x, i) { o.push((i + 1) + '. **' + (x.t || 'Step').trim() + '**' + (x.o ? ' _(Owner: ' + x.o.trim() + ')_' : '') + (x.d ? '  \n   ' + x.d.trim() : '')); }); o.push(''); }
    else { filled(s[k]).forEach(function (x) { o.push('- ' + x); }); o.push(''); }
  });
  if (s.d.sign) { o.push('## Sign-off', ''); tb(['', 'Name', 'Signature', 'Date'], [['Prepared by', m.prepared, '', ''], ['Approved by', m.approver, '', '']]); }
  return o.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
function text(s) { return md(s).replace(/^#+ /gm, '').replace(/\*\*|_\(|\)_/g, function (x) { return x === '_(' ? '(' : x === ')_' ? ')' : ''; }).replace(/^\|[ -|]+\|$/gm, '').replace(/^\| (.*) \|$/gm, function (_, r) { return r.split(' | ').filter(Boolean).join(': '); }).replace(/\n{3,}/g, '\n\n'); }

/* ---------- Word (.docx) ---------- */
var X = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
function crc32(u8) { var t = crc32.t; if (!t) { t = crc32.t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } } var r = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) r = t[(r ^ u8[i]) & 255] ^ (r >>> 8); return (r ^ 0xFFFFFFFF) >>> 0; }
function zip(entries, type) {
  var enc = new TextEncoder(), now = new Date(), time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1), date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate(), local = [], central = [], off = 0;
  entries.forEach(function (en) {
    var name = enc.encode(en.name), data = enc.encode(en.text), crc = crc32(data), L = new DataView(new ArrayBuffer(30)), C = new DataView(new ArrayBuffer(46));
    L.setUint32(0, 0x04034b50, true); L.setUint16(4, 20, true); L.setUint16(6, 0x0800, true); L.setUint16(10, time, true); L.setUint16(12, date, true); L.setUint32(14, crc, true); L.setUint32(18, data.length, true); L.setUint32(22, data.length, true); L.setUint16(26, name.length, true);
    C.setUint32(0, 0x02014b50, true); C.setUint16(4, 20, true); C.setUint16(6, 20, true); C.setUint16(8, 0x0800, true); C.setUint16(12, time, true); C.setUint16(14, date, true); C.setUint32(16, crc, true); C.setUint32(20, data.length, true); C.setUint32(24, data.length, true); C.setUint16(28, name.length, true); C.setUint32(42, off, true);
    local.push(new Uint8Array(L.buffer), name, data); central.push(new Uint8Array(C.buffer), name); off += 30 + name.length + data.length;
  });
  var cl = central.reduce(function (a, x) { return a + x.length; }, 0), Z = new DataView(new ArrayBuffer(22)); Z.setUint32(0, 0x06054b50, true); Z.setUint16(8, entries.length, true); Z.setUint16(10, entries.length, true); Z.setUint32(12, cl, true); Z.setUint32(16, off, true);
  return new Blob(local.concat(central, [new Uint8Array(Z.buffer)]), { type: type });
}
function docx(s) {
  var d = s.d, fn = (FONTS[d.font] || FONTS.arial)[0], sz = Math.round((+d.size || 10.5) * 2), P = PAPER[d.paper] || PAPER.A4, mg = 1134, tw = P[2] - 2 * mg, ac = String(d.accent || '#1f4e79').replace('#', ''), body = [], n = 0;
  var run = function (t, o) { o = o || {}; return '<w:r><w:rPr><w:rFonts w:ascii="' + fn + '" w:hAnsi="' + fn + '" w:cs="' + fn + '"/>' + (o.b ? '<w:b/>' : '') + (o.i ? '<w:i/>' : '') + (o.caps ? '<w:caps/>' : '') + (o.c ? '<w:color w:val="' + o.c + '"/>' : '') + '<w:sz w:val="' + (o.sz || sz) + '"/></w:rPr><w:t xml:space="preserve">' + X(t) + '</w:t></w:r>'; };
  var para = function (inner, o) { o = o || {}; return '<w:p><w:pPr>' + (o.style ? '<w:pStyle w:val="' + o.style + '"/>' : '') + (o.keep ? '<w:keepNext/>' : '') + (o.num ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : '') + (o.border ? '<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="2" w:color="' + o.border + '"/></w:pBdr>' : '') + '<w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after == null ? 80 : o.after) + '" w:line="276" w:lineRule="auto"/>' + (o.ind ? '<w:ind w:left="' + o.ind[0] + '" w:hanging="' + o.ind[1] + '"/>' : '') + '</w:pPr>' + inner + '</w:p>'; };
  var cellXml = function (w, inner, o) { o = o || {}; return '<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/>' + (o.fill ? '<w:shd w:val="clear" w:color="auto" w:fill="' + o.fill + '"/>' : '') + '</w:tcPr>' + (inner || para('', { after: 0 })) + '</w:tc>'; };
  var tbl = function (head, rows, pct, o) {
    o = o || {}; var ws = pct.map(function (p) { return Math.round(tw * p / 100); }), b = '<w:top w:val="single" w:sz="4" w:color="BFBFBF"/><w:left w:val="single" w:sz="4" w:color="BFBFBF"/><w:bottom w:val="single" w:sz="4" w:color="BFBFBF"/><w:right w:val="single" w:sz="4" w:color="BFBFBF"/><w:insideH w:val="single" w:sz="4" w:color="BFBFBF"/><w:insideV w:val="single" w:sz="4" w:color="BFBFBF"/>';
    var x = '<w:tbl><w:tblPr><w:tblW w:w="' + tw + '" w:type="dxa"/><w:tblBorders>' + b + '</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="50" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="50" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>' + ws.map(function (w) { return '<w:gridCol w:w="' + w + '"/>'; }).join('') + '</w:tblGrid>';
    if (head) x += '<w:tr><w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>' + head.map(function (h, i) { return cellXml(ws[i], para(run(h, { b: 1, c: 'FFFFFF', sz: sz - 2 }), { after: 0 }), { fill: ac }); }).join('') + '</w:tr>';
    rows.forEach(function (r) { x += '<w:tr><w:trPr><w:cantSplit/></w:trPr>' + r.map(function (c, i) { var inner = typeof c === 'object' && c && c.xml ? c.xml : para(run(c == null ? '' : c, o.bold && o.bold(i) ? { b: 1 } : {}), { after: 0 }); return cellXml(ws[i], inner, o.fill && o.fill(i) ? { fill: o.fill(i) } : {}); }).join('') + '</w:tr>'; });
    return x + '</w:tbl>' + para('', { after: 60 });
  };
  body.push(para(run('Standard operating procedure', { caps: 1, c: ac, sz: sz - 3, b: 1 }), { after: 40 }));
  body.push(para(run(s.meta.title || 'Untitled SOP', { b: 1, sz: Math.round(sz * 2) }), { after: s.meta.company ? 40 : 160 }));
  if (s.meta.company) body.push(para(run(s.meta.company, { c: '555555' }), { after: 160 }));
  var mr = metaRows(s);
  if (mr.length) body.push(tbl(null, pairs(mr).map(function (p) { return [p[0] ? p[0][0] : '', p[0] ? p[0][1] : '', p[1] ? p[1][0] : '', p[1] ? p[1][1] : '']; }), [17, 33, 17, 33], { bold: function (i) { return i % 2 === 0; }, fill: function (i) { return i % 2 === 0 ? 'F2F2F2' : null; } }));
  sections(s).forEach(function (sec) {
    n++; var k = sec[0];
    body.push(para(run(n + '. ' + sec[1], { b: 1, c: ac, sz: sz + 4 }), { before: 200, after: 80, border: ac, keep: 1 }));
    if (k === 'purpose' || k === 'scope') String(s[k]).split(/\n+/).filter(function (x) { return x.trim(); }).forEach(function (x) { body.push(para(run(x))); });
    else if (k === 'defs') body.push(tbl(['Term', 'Meaning'], filled(s.defs), [30, 70], { bold: function (i) { return i === 0; } }));
    else if (k === 'roles') body.push(tbl(['Role', 'Responsibilities'], filled(s.roles), [30, 70], { bold: function (i) { return i === 0; } }));
    else if (k === 'kpis') body.push(tbl(['Measure', 'Target'], filled(s.kpis), [45, 55]));
    else if (k === 'risks') body.push(tbl(['Risk', 'Control or mitigation'], filled(s.risks), [42, 58]));
    else if (k === 'revs') body.push(tbl(['Version', 'Date', 'Change', 'By'], filled(s.revs), [12, 18, 48, 22]));
    else if (k === 'steps') body.push(tbl(['#', 'Step and how', 'Owner'], steps(s).map(function (x, i) { return [n + '.' + (i + 1), { xml: (x.t ? para(run(x.t, { b: 1 }), { after: 20 }) : '') + para(run(x.d || ''), { after: 0 }) }, x.o || '']; }), [9, 69, 22]));
    else filled(s[k]).forEach(function (x) { body.push(para(run(x), { num: 1, ind: [360, 260], after: 40 })); });
  });
  if (s.d.sign) { body.push(para(run('Sign-off', { b: 1, c: ac, sz: sz + 4 }), { before: 200, after: 80, border: ac, keep: 1 })); body.push(tbl(['', 'Name', 'Signature', 'Date'], [['Prepared by', s.meta.prepared, '', ''], ['Approved by', s.meta.approver, '', '']], [20, 30, 30, 20], { bold: function (i) { return i === 0; } })); }
  var foot = [s.meta.id, s.meta.version ? 'Version ' + s.meta.version : '', 'Uncontrolled when printed'].filter(Boolean).join(' · ');
  var doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>' + body.join('') + '<w:sectPr><w:footerReference w:type="default" r:id="rIdF"/><w:pgSz w:w="' + P[2] + '" w:h="' + P[3] + '"/><w:pgMar w:top="' + mg + '" w:right="' + mg + '" w:bottom="' + mg + '" w:left="' + mg + '" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>';
  var footer = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:tabs><w:tab w:val="right" w:pos="' + tw + '"/></w:tabs></w:pPr>' + run(foot, { sz: 16, c: '777777' }) + '<w:r><w:rPr><w:sz w:val="16"/><w:color w:val="777777"/></w:rPr><w:tab/><w:t xml:space="preserve">Page </w:t></w:r><w:r><w:rPr><w:sz w:val="16"/><w:color w:val="777777"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:sz w:val="16"/><w:color w:val="777777"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>';
  var numbering = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="360" w:hanging="260"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>';
  var W = 'application/vnd.openxmlformats-officedocument.wordprocessingml';
  return zip([
    { name: '[Content_Types].xml', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="' + W + '.document.main+xml"/><Override PartName="/word/footer1.xml" ContentType="' + W + '.footer+xml"/><Override PartName="/word/numbering.xml" ContentType="' + W + '.numbering+xml"/></Types>' },
    { name: '_rels/.rels', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
    { name: 'word/_rels/document.xml.rels', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdF" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rIdN" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>' },
    { name: 'word/document.xml', text: doc },
    { name: 'word/footer1.xml', text: footer },
    { name: 'word/numbering.xml', text: numbering }
  ], W + '.document');
}

function slug(s) { return String(s || 'sop').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'sop'; }
function download(blob, name) { var u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 3000); }
function save(s, fmt) {
  var base = slug(s.meta.title) + '-sop';
  if (fmt === 'docx') download(docx(s), base + '.docx');
  else if (fmt === 'md') download(new Blob([md(s)], { type: 'text/markdown;charset=utf-8' }), base + '.md');
  else if (fmt === 'txt') download(new Blob([text(s)], { type: 'text/plain;charset=utf-8' }), base + '.txt');
  else if (fmt === 'json') download(new Blob([JSON.stringify(s, null, 1)], { type: 'application/json' }), base + '.json');
}
/* Print one SOP on its own (the library uses this; the builder prints its live preview). */
function printDoc(s) {
  var host = document.getElementById('sop-print-host');
  if (!host) { host = document.createElement('div'); host.id = 'sop-print-host'; document.body.appendChild(host); }
  host.innerHTML = html(s); document.documentElement.classList.add('sop-printing');
  var t = document.title; document.title = (s.meta.title || 'SOP') + ' - SOP - aashishpandey.com';
  var done = function () { document.documentElement.classList.remove('sop-printing'); host.innerHTML = ''; document.title = t; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done); window.print(); setTimeout(function () { if (document.documentElement.classList.contains('sop-printing') && !window.matchMedia('print').matches) done(); }, 1500);
}

window.SOPDoc = { blank: blank, fromTemplate: fromTemplate, skeleton: skeleton, KINDS: KINDS, FONTS: FONTS, ACCENTS: ACCENTS, PAPER: PAPER, html: html, md: md, text: text, docx: docx, save: save, printDoc: printDoc, slug: slug, today: today };
})();
