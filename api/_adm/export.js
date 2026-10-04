// Spreadsheet, CSV and JSON builders shared by the export button and the nightly backup.
const { makeXlsx } = require('../_xlsx');
const HEAD = ['ID', 'Received (IST)', 'Type', 'Status', 'Name', 'Email', 'Company', 'Website', 'Looking for', 'Budget', 'Timeline', 'Message', 'Came from', 'Page', 'Referrer', 'Alert email', 'Confirmation email', 'Notes'];
const ist = (ms) => new Date(ms).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }).replace(',', '');
const toRow = (r) => [r.id, ist(r.created), r.type, r.status, r.name, r.email, r.company, r.website_url, r.service, r.budget, r.timeline, r.message, r.source, r.page, r.ref,
  r.mail && r.mail.admin || '', r.mail && r.mail.user || '', r.note].map((v) => (v == null ? '' : String(v)));
// a cell that starts with = + - @ can run as a formula when the CSV is opened in Excel; a leading apostrophe stops that
const csvCell = (v) => { let s = String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = (rows) => '﻿' + [HEAD, ...rows.map(toRow)].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
const xlsx = (rows) => makeXlsx([HEAD, ...rows.map(toRow)]);
module.exports = { HEAD, toRow, csv, xlsx, ist };
