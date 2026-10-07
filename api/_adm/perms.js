// Access control for the admin. Every action needs one permission; a role is a named set of permissions; every person has one role.
//   admin:roles   JSON { [roleId]: { name, desc, perms:[...] } }   only roles that differ from the built-in presets, plus custom roles
// The owner (who signs in with ADMIN_PASSWORD) always holds every permission and cannot be edited. Built-in roles can be changed and reset.
const { redis } = require('../_lib');

const PERMS = [
  // content
  { id: 'content.view', g: 'Content', label: 'See posts and case studies', desc: 'Open the list and read any entry, including drafts.' },
  { id: 'content.create', g: 'Content', label: 'Write new entries', desc: 'Create drafts and send them for review.' },
  { id: 'content.edit_own', g: 'Content', label: 'Edit their own drafts', desc: 'Change their own entries until they are published.' },
  { id: 'content.edit_any', g: 'Content', label: 'Edit anyone\'s entries', desc: 'Change entries written by other people.' },
  { id: 'content.review', g: 'Content', label: 'Review and approve', desc: 'Approve an entry, or send it back with comments.' },
  { id: 'content.publish', g: 'Content', label: 'Publish and unpublish', desc: 'Put entries on the site, schedule them, take them down, edit live pages.' },
  { id: 'content.delete', g: 'Content', label: 'Delete entries', desc: 'Move entries to the trash and empty it.' },
  { id: 'taxonomy.manage', g: 'Content', label: 'Manage categories and tags', desc: 'Rename, merge and remove them.' },
  { id: 'site.edit', g: 'Content', label: 'Edit site text and testimonials', desc: 'Availability line, notice bar, closing panel and testimonials.' },
  // media
  { id: 'media.view', g: 'Media', label: 'See the media library', desc: '' },
  { id: 'media.upload', g: 'Media', label: 'Upload images', desc: '' },
  { id: 'media.manage', g: 'Media', label: 'Edit and delete any image', desc: '' },
  // inbox
  { id: 'inbox.view', g: 'Inbox', label: 'Read the inbox', desc: 'Briefs, subscribers and their messages.' },
  { id: 'inbox.manage', g: 'Inbox', label: 'Work the inbox', desc: 'Reply, set stage and status, add notes.' },
  { id: 'inbox.delete', g: 'Inbox', label: 'Delete and block', desc: 'Delete records and block senders.' },
  { id: 'inbox.export', g: 'Inbox', label: 'Export data', desc: 'Download the inbox as a spreadsheet.' },
  { id: 'quotes.manage', g: 'Inbox', label: 'Send quotes', desc: '' },
  // audience
  { id: 'news.manage', g: 'Audience', label: 'Write and send the newsletter', desc: '' },
  { id: 'mail.view', g: 'Audience', label: 'See the mail log', desc: '' },
  { id: 'mail.manage', g: 'Audience', label: 'Manage blocked addresses', desc: '' },
  { id: 'spam.manage', g: 'Audience', label: 'Edit spam rules', desc: '' },
  { id: 'links.manage', g: 'Audience', label: 'Manage short links', desc: '' },
  // insights
  { id: 'insights.view', g: 'Insights', label: 'See dashboards', desc: 'Overview, search data, tool usage, site health.' },
  { id: 'health.run', g: 'Insights', label: 'Run site checks', desc: '' },
  // manage
  { id: 'settings.manage', g: 'Manage', label: 'Change settings', desc: 'Alerts, email templates and the morning digest.' },
  { id: 'team.manage', g: 'Manage', label: 'Manage people', desc: 'Add, deactivate and reset team members.' },
  { id: 'roles.manage', g: 'Manage', label: 'Manage roles', desc: 'Create roles and change what they can do.' },
  { id: 'audit.view', g: 'Manage', label: 'See the activity log', desc: '' },
  { id: 'security.manage', g: 'Manage', label: 'Security controls', desc: 'Sign everyone out, backups, end other people\'s sign-ins.' },
];
const ALL = PERMS.map((p) => p.id);
const pick = (...p) => p.flatMap((x) => (x.endsWith('.*') ? ALL.filter((i) => i.startsWith(x.slice(0, -1))) : [x]));

// the built-in roles. Their ids stay stable because people are stored with them.
const PRESETS = {
  owner: { name: 'Owner', desc: 'Everything, always. Signs in with the password set in Vercel.', perms: ALL, locked: true },
  admin: { name: 'Admin', desc: 'Runs the whole site day to day. Cannot manage roles or security controls.', perms: ALL.filter((p) => !['roles.manage', 'security.manage'].includes(p)) },
  editor: { name: 'Editor', desc: 'Reviews, edits and publishes content. No inbox.', perms: pick('content.*', 'taxonomy.manage', 'site.edit', 'media.*', 'insights.view') },
  author: { name: 'Author', desc: 'Writes drafts and sends them for review. Cannot publish.', perms: pick('content.view', 'content.create', 'content.edit_own', 'media.view', 'media.upload') },
  assistant: { name: 'Support', desc: 'Works the inbox: replies, stages, notes and quotes. Reads content.', perms: pick('inbox.view', 'inbox.manage', 'quotes.manage', 'mail.view', 'content.view') },
  marketer: { name: 'Marketer', desc: 'Newsletter, short links and dashboards; drafts content for review.', perms: pick('news.manage', 'mail.view', 'links.manage', 'insights.view', 'content.view', 'content.create', 'content.edit_own', 'media.view', 'media.upload') },
  viewer: { name: 'Viewer', desc: 'Read only: content, inbox, mail and dashboards.', perms: pick('content.view', 'inbox.view', 'mail.view', 'insights.view', 'media.view') },
};

// what each admin action needs. null = any signed-in person (their own account). A function decides from the request body.
const ACTIONS = {
  me: null, pw_change: null, sec_get: null, sessions_list: null, sessions_revoke: null, totp_setup: null, totp_enable: null, totp_disable: null,
  push_key: null, push_subscribe: null, push_unsubscribe: null, push_test: null, profile_get: null, profile_save: null, authors_list: 'content.view', notes_seen: null,
  // inbox
  list: 'inbox.view', mail_for: 'inbox.view', digest_get: 'inbox.view', tpl_get: 'inbox.view', reply_get: 'inbox.view', quote_list: 'inbox.view', quote_preview: 'inbox.view',
  update: 'inbox.manage', resend: 'inbox.manage', reply_send: 'inbox.manage', thread_note: 'inbox.manage', quote_send: 'quotes.manage', quote_status: 'quotes.manage',
  bulk: (b) => { const a = String((b && b.action) || ''); return a.startsWith('status:') || a === 'notspam' ? 'inbox.manage' : 'inbox.delete'; },
  delete: 'inbox.delete', export: 'inbox.export',
  // audience
  news_overview: 'news.manage', news_preview: 'news.manage', news_test: 'news.manage', news_start: 'news.manage', news_send: 'news.manage', news_retry: 'news.manage', news_import: 'news.manage', news_import_briefs: 'news.manage',
  mail_list: 'mail.view', mail_suppress: 'mail.manage', mail_unsuppress: 'mail.manage', spam_get: 'spam.manage', spam_save: 'spam.manage', links_list: 'links.manage', links_act: 'links.manage',
  // insights and operations
  attention_get: 'insights.view', health_get: 'insights.view', tools_stats: 'insights.view', gsc_get: 'insights.view', health_run: 'health.run',
  alerts_get: 'settings.manage', alerts_save: 'settings.manage', alerts_test: 'settings.manage', tpl_save: 'settings.manage', digest_save: 'settings.manage', digest_now: 'settings.manage',
  users_list: 'team.manage', users_add: 'team.manage', users_update: 'team.manage', users_delete: 'team.manage', sessions_revoke_user: 'team.manage',
  roles_list: null, roles_save: 'roles.manage', roles_delete: 'roles.manage', roles_reset: 'roles.manage', audit_list: 'audit.view', signout_all: 'security.manage', backup_now: 'security.manage',
  // content
  posts_list: 'content.view', post_get: 'content.view', post_preview: 'content.view', post_preview_url: 'content.view', post_revisions: 'content.view', post_diff: 'content.view', post_comment: 'content.view', post_assign: 'content.view', post_lock: 'content.view', post_unlock: 'content.view',
  post_save: 'content.create', post_duplicate: 'content.create', post_move: 'content.view', post_restore: 'content.view', post_bulk: 'content.view', post_delete: 'content.view',   // these check the entry itself as well
  tax_list: 'content.view', tax_rename: 'taxonomy.manage', tax_delete: 'taxonomy.manage',
  content_get: 'content.view', content_log: 'site.edit', content_save: 'site.edit', content_restore: 'site.edit', tm_list: 'site.edit', tm_act: 'site.edit', tm_add: 'site.edit', tm_request: 'site.edit',
  media_list: 'media.view', media_upload: 'media.upload', media_update: 'media.upload', media_delete: 'media.upload',   // update and delete also check who uploaded it
};

let cache = null;
async function roles() {
  if (cache && Date.now() - cache.t < 30000) return cache.v;
  let stored = {}; try { const raw = await redis('GET', 'admin:roles'); if (raw) stored = JSON.parse(raw); } catch (e) { /* presets only */ }
  const out = {};
  for (const [id, p] of Object.entries(PRESETS)) out[id] = { id, name: p.name, desc: p.desc, perms: p.locked ? p.perms : (stored[id] ? valid(stored[id].perms) : p.perms), builtin: true, locked: !!p.locked, changed: !p.locked && !!stored[id] };
  for (const [id, r] of Object.entries(stored)) if (!PRESETS[id]) out[id] = { id, name: r.name, desc: r.desc || '', perms: valid(r.perms), builtin: false, locked: false };
  cache = { t: Date.now(), v: out }; return out;
}
const valid = (a) => [...new Set((Array.isArray(a) ? a : []).filter((x) => ALL.includes(x)))];
const drop = () => { cache = null; };
async function stored() { try { const raw = await redis('GET', 'admin:roles'); return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; } }
async function permsOf(roleId) { if (roleId === 'owner') return new Set(ALL); const r = (await roles())[roleId]; return new Set(r ? r.perms : []); }
async function exists(id) { return !!(await roles())[id]; }

async function save(b) {
  const st = await stored(), name = String(b.name || '').trim().slice(0, 40), desc = String(b.desc || '').trim().slice(0, 160);
  let id = String(b.id || '').trim();
  if (id === 'owner') throw new Error('The owner role cannot be changed.');
  if (!id) { if (!name) throw new Error('Give the role a name.'); id = 'r' + name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 14) + Math.random().toString(36).slice(2, 5); if (PRESETS[id] || st[id]) throw new Error('That name is taken.'); }
  else if (!PRESETS[id] && !st[id]) throw new Error('Role not found.');
  const perms = valid(b.perms);
  if (PRESETS[id]) st[id] = { name: PRESETS[id].name, desc: PRESETS[id].desc, perms };   // a built-in keeps its name; only the permissions change
  else st[id] = { name: name || st[id].name, desc, perms };
  await redis('SET', 'admin:roles', JSON.stringify(st)); drop(); return (await roles())[id];
}
async function reset(id) { const st = await stored(); if (!PRESETS[id] || PRESETS[id].locked) throw new Error('Only built-in roles can be reset.'); delete st[id]; await redis('SET', 'admin:roles', JSON.stringify(st)); drop(); return (await roles())[id]; }
async function remove(id) { const st = await stored(); if (PRESETS[id]) throw new Error('Built-in roles cannot be deleted. Reset it instead.'); if (!st[id]) throw new Error('Role not found.'); delete st[id]; await redis('SET', 'admin:roles', JSON.stringify(st)); drop(); }

// is this person (with user.perms, a Set) allowed to run the action?
function allowed(user, action, body) {
  if (!(action in ACTIONS)) return false;   // an action nobody mapped is refused, not allowed
  const need = ACTIONS[action]; if (need === null) return true;
  const p = typeof need === 'function' ? need(body) : need;
  return user.perms.has(p);
}
module.exports = { PERMS, ALL, PRESETS, ACTIONS, roles, permsOf, exists, save, reset, remove, allowed, drop };
