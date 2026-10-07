// Admin actions for the content system: entries, workflow, comments, assignments, locks, bulk edits, taxonomy, media, roles and profiles.
// Called from the admin handler for the actions it lists; returns { code, json } or null when the action is not one of these.
const posts = require('../_site/posts');
const media = require('../_site/media');
const md = require('../_site/md');
const users = require('./users');
const perms = require('./perms');
const cfg = require('./cfg');
const notify = require('./notify');
const { sendMail, env, clean } = require('../_mail');
const { ADMIN_PATH } = require('./path');

const SITE = 'https://aashishpandey.com';
const ACTIONS = new Set(['posts_list', 'post_get', 'post_save', 'post_move', 'post_comment', 'post_assign', 'post_lock', 'post_unlock', 'post_delete', 'post_duplicate', 'post_restore', 'post_bulk', 'post_diff', 'post_revisions', 'post_preview', 'post_preview_url',
  'tax_list', 'tax_rename', 'tax_delete', 'authors_list', 'profile_get', 'profile_save', 'roles_list', 'roles_save', 'roles_delete', 'roles_reset', 'media_list', 'media_upload', 'media_update', 'media_delete']);
const ok = (json) => ({ code: 200, json });
const bad = (e) => ({ code: e.code && e.code >= 400 && e.code < 600 ? e.code : 400, json: { error: e.message, ...(e.code === 409 ? { conflict: true, by: e.by, at: e.at } : {}), ...(e.problems ? { problems: e.problems } : {}) } });
const deep = (p) => `${SITE}${ADMIN_PATH}#post=${p.id}`;

/* ---------- telling people ---------- */
async function recipients(perm, exceptId) {
  const found = new Set();
  for (const u of Object.values(await users.all())) if (u.active && u.id !== exceptId && (await perms.permsOf(u.role)).has(perm)) found.add(u.email);
  if (exceptId !== 'owner') env().admins.forEach((e) => found.add(e));
  return [...found].slice(0, 12);
}
async function mail(to, subject, text) {
  const html = `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;white-space:pre-line;">${String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`;
  await Promise.allSettled([].concat(to).filter(Boolean).map((t) => sendMail({ to: t, subject, text, html, kind: 'content' })));
}
async function emailOf(id) { if (!id) return ''; if (id === 'owner') return env().admins[0] || ''; const u = await users.get(id); return u && u.active ? u.email : ''; }
async function tell(kind, p, actor, extra) {
  try {
    const t = p.title || 'Untitled', link = deep(p);
    if (kind === 'review') { const to = await recipients('content.review', actor.id); if (to.length) await mail(to, `Ready for review: ${t}`, `${actor.name} sent "${t}" for review.\n\n${extra ? 'Note: ' + extra + '\n\n' : ''}Open it: ${link}`); await notify.send(`${actor.name} sent "${t}" for review.`, { title: 'Ready for review', tag: 'review' }); }
    else if (kind === 'changes' || kind === 'approved' || kind === 'published') {
      const to = await emailOf(p.createdBy); if (to && p.createdBy !== actor.id) await mail(to, kind === 'changes' ? `Changes requested: ${t}` : kind === 'approved' ? `Approved: ${t}` : `Published: ${t}`, `${actor.name} ${kind === 'changes' ? 'sent "' + t + '" back with changes.' : kind === 'approved' ? 'approved "' + t + '".' : 'published "' + t + '".'}\n\n${extra ? 'Note: ' + extra + '\n\n' : ''}Open it: ${link}`);
    } else if (kind === 'comment') {
      const to = new Set([await emailOf(p.createdBy), await emailOf(p.assignee)]); to.delete(''); const me = await emailOf(actor.id); to.delete(me);
      if (to.size) await mail([...to], `New comment on: ${t}`, `${actor.name} wrote:\n\n${extra}\n\nOpen it: ${link}`);
    } else if (kind === 'assigned') { const to = await emailOf(p.assignee); if (to && p.assignee !== actor.id) await mail(to, `Assigned to you: ${t}`, `${actor.name} assigned "${t}" to you${p.due ? ', due ' + p.due : ''}.\n\nOpen it: ${link}`); }
  } catch (e) { console.error('cms notify failed', e.message); }
}

async function ownerProfile() { return { name: 'Aashish Pandey', bio: '', avatar: '', ...(await cfg.get('ownerProfile', {})) }; }
async function authorsList() {
  const out = [], o = await ownerProfile(); out.push({ id: 'owner', name: o.name, bio: o.bio, avatar: o.avatar });
  for (const u of Object.values(await users.all())) if (u.active && (await perms.permsOf(u.role)).has('content.create')) out.push({ id: u.id, name: u.name, bio: u.bio || '', avatar: u.avatar || '' });
  return out;
}
const actorOf = (user) => ({ id: user.id, name: user.name, perms: user.perms });

async function handle(a, c) {
  if (!ACTIONS.has(a)) return null;
  const { user, q, b } = c, actor = actorOf(user), now = Date.now();
  try {
    /* ----- reads ----- */
    if (a === 'posts_list') {
      const type = String(q.type || ''), rows = (await posts.all()).filter((p) => !type || p.type === type), sm = rows.map((p) => posts.summary(p));
      const n = (t, st) => rows.filter((p) => p.type === t && (st === 'all' ? p.status !== 'trash' : posts.stateOf(p) === st)).length;
      const counts = {}; ['post', 'case'].forEach((t) => { counts[t] = n(t, 'all'); ['draft', 'review', 'approved', 'published', 'scheduled', 'archived', 'trash'].forEach((s) => { counts[t + '_' + s] = n(t, s); }); });
      return ok({ items: sm, counts, me: user.id });
    }
    if (a === 'post_get') {
      const p = await posts.get(String(q.id || '')); if (!p) return { code: 404, json: { error: 'Not found.' } };
      const lk = await posts.lockOf(p.id);
      return ok({ post: p, state: posts.stateOf(p), canEdit: posts.canEdit(actor, p), lock: lk && lk.uid !== user.id ? { by: lk.name, since: lk.t } : null, checks: posts.checks(p) });
    }
    if (a === 'post_revisions') { const r = await posts.revisions(String(q.id || '')); return ok({ items: r.map((x) => ({ t: x.t, by: x.by, title: x.post.title, status: x.post.status, words: x.post.words })) }); }
    if (a === 'post_diff') {
      const p = await posts.get(String(q.id || '')); if (!p) return { code: 404, json: { error: 'Not found.' } };
      const rev = (await posts.revisions(p.id)).find((r) => String(r.t) === String(q.t)); if (!rev) return { code: 404, json: { error: 'That version is no longer kept.' } };
      return ok({ title: [rev.post.title, p.title], body: posts.lineDiff(rev.post.body, p.body), excerpt: [rev.post.excerpt, p.excerpt] });
    }
    if (a === 'post_preview_url') {
      const p = await posts.get(String(q.id || '')); if (!p) return { code: 404, json: { error: 'Not found.' } };
      return ok({ url: `${c.origin}${p.type === 'case' ? '/work/' : '/blog/'}${p.slug}?preview=${posts.previewToken(p.id)}` });
    }
    if (a === 'tax_list') return ok(await posts.taxonomy());
    if (a === 'authors_list') return ok({ items: await authorsList() });
    if (a === 'media_list') return ok({ items: await media.list(300), max: media.MAX });
    if (a === 'profile_get') {
      if (user.id === 'owner') return ok({ profile: await ownerProfile() });
      const u = await users.get(user.id); return ok({ profile: { name: u.name, bio: u.bio || '', avatar: u.avatar || '' } });
    }
    if (a === 'roles_list') {
      const rs = await perms.roles(), ul = await users.all(), count = {};
      Object.values(ul).forEach((u) => { count[u.role] = (count[u.role] || 0) + 1; });
      return ok({ roles: Object.values(rs).map((r) => ({ ...r, users: count[r.id] || 0 })), perms: perms.PERMS, canEdit: user.perms.has('roles.manage'), canTeam: user.perms.has('team.manage') });
    }
    if (c.method !== 'POST') return { code: 405, json: { error: 'Use POST.' } };

    /* ----- previews: the rendered body and the checks, without saving ----- */
    if (a === 'post_preview') {
      const r = md.render(String(b.body || '').slice(0, 80000));
      const ck = b.fields ? posts.checks({ ...b.fields, body: String(b.body || ''), type: b.fields.type || 'post' }) : null;
      return ok({ html: r.html, toc: r.toc, words: r.words, mins: Math.max(1, Math.round(r.words / 200)), checks: ck });
    }

    /* ----- writing ----- */
    if (a === 'post_save') {
      const p = await posts.save(b, actor);
      let state = posts.stateOf(p), post = p;
      if (b.then && b.then !== p.status) {   // "Save and publish" and friends: one request, the move is checked separately
        const r = await posts.move(p.id, String(b.then), actor, { publishAt: b.publishAt, unpublishAt: b.unpublishAt, note: b.note });
        post = r.post; state = posts.stateOf(post);
        if (b.then === 'review') tell('review', post, actor, b.note); else if (b.then === 'published') tell('published', post, actor);
      }
      return ok({ ok: true, post, state, canEdit: posts.canEdit(actor, post), checks: posts.checks(post) });
    }
    if (a === 'post_move') {
      const to = String(b.to || ''), r = await posts.move(clean(b.id, 20), to, actor, { note: b.note, publishAt: b.publishAt, unpublishAt: b.unpublishAt });
      const kind = to === 'review' ? 'review' : to === 'approved' ? 'approved' : to === 'published' ? 'published' : to === 'draft' && r.from === 'review' && posts.has(actor, 'content.review') && !posts.mine(actor, r.post) ? 'changes' : '';
      if (kind) tell(kind, r.post, actor, b.note);
      return ok({ ok: true, post: r.post, state: posts.stateOf(r.post), canEdit: posts.canEdit(actor, r.post), checks: posts.checks(r.post) });
    }
    if (a === 'post_comment') { const r = await posts.comment(clean(b.id, 20), actor, b.text); tell('comment', r.post, actor, r.comment.text); return ok({ ok: true, comment: r.comment, comments: r.post.comments }); }
    if (a === 'post_assign') { const p = await posts.setAssignee(clean(b.id, 20), actor, b.assignee, b.due); if (p.assignee) tell('assigned', p, actor); return ok({ ok: true, post: p }); }
    if (a === 'post_lock') { const p = await posts.get(clean(b.id, 20)); if (!p || !posts.canEdit(actor, p)) return ok({ held: false, readonly: true }); return ok(await posts.lock(p.id, actor, !!b.take)); }
    if (a === 'post_unlock') { await posts.unlock(clean(b.id, 20), actor); return ok({ ok: true }); }
    if (a === 'post_duplicate') {
      const p = await posts.get(clean(b.id, 20)); if (!p) return { code: 404, json: { error: 'Not found.' } };
      if (!posts.canView(actor)) return { code: 403, json: { error: 'Not allowed.' } };
      const copy = await posts.save({ ...p, id: undefined, title: p.title + ' (copy)', slug: p.slug + '-copy', publishAt: 0, unpublishAt: 0, featured: false, assignee: '', due: '', authorId: undefined, author: '' }, actor);
      return ok({ ok: true, post: copy });
    }
    if (a === 'post_restore') { const p = await posts.restore(clean(b.id, 20), b.t, actor); return ok({ ok: true, post: p }); }
    if (a === 'post_delete') {   // the first delete moves to the trash; deleting from the trash is for good
      const p = await posts.get(clean(b.id, 20)); if (!p) return { code: 404, json: { error: 'Not found.' } };
      if (p.status === 'trash') { await posts.purge(p.id, actor); return ok({ ok: true, purged: true }); }
      const r = await posts.move(p.id, 'trash', actor, {}); return ok({ ok: true, post: r.post });
    }
    if (a === 'post_bulk') {
      const ids = (Array.isArray(b.ids) ? b.ids : []).map((x) => clean(x, 20)).filter(Boolean).slice(0, 100), op = String(b.op || ''), val = String(b.value || '').slice(0, 40);
      let done = 0; const failed = [];
      for (const id of ids) {
        try {
          if (op === 'move') await posts.move(id, val, actor, {});
          else if (op === 'purge') await posts.purge(id, actor);
          else if (op === 'category' || op === 'tag' || op === 'untag') {
            const p = await posts.get(id); if (!p) throw new Error('Not found.'); if (!posts.canEdit(actor, p)) throw new Error('Not allowed.');
            const next = { ...p, base: undefined }; if (op === 'category') next.category = val; else if (op === 'tag') next.tags = [...new Set([...(p.tags || []), val])]; else next.tags = (p.tags || []).filter((t) => t !== val);
            await posts.save(next, actor);
          } else throw new Error('Unknown action.');
          done++;
        } catch (e) { failed.push({ id, error: e.message }); }
      }
      return ok({ ok: true, done, failed });
    }
    if (a === 'tax_rename') return ok({ ok: true, changed: await posts.renameTax(String(b.kind), b.from, b.to, actor) });
    if (a === 'tax_delete') return ok({ ok: true, changed: await posts.deleteTax(String(b.kind), b.name, actor) });

    /* ----- media: anyone who can upload may change their own; managing others needs media.manage ----- */
    if (a === 'media_upload') return ok({ ok: true, item: await media.put(b, actor) });
    if (a === 'media_update' || a === 'media_delete') {
      const m = await media.meta(clean(b.id, 20)); if (!m) return { code: 404, json: { error: 'Not found.' } };
      if (!user.perms.has('media.manage') && m.uid !== user.id) return { code: 403, json: { error: 'You can only change images you uploaded.' } };
      if (a === 'media_update') return ok({ ok: true, item: await media.update(m.id, b) });
      await media.remove(m.id); return ok({ ok: true });
    }

    /* ----- profile and roles ----- */
    if (a === 'profile_save') {
      const name = clean(b.name, 60), bio = String(b.bio || '').replace(/[<>]/g, '').trim().slice(0, 400), avatar = /^(\/media\/[a-z0-9]+)?$/.test(String(b.avatar || '')) ? String(b.avatar || '') : '';
      if (user.id === 'owner') { await cfg.set('ownerProfile', { name: name || 'Aashish Pandey', bio, avatar }); require('../_site/render').dropAuthors(); return ok({ ok: true }); }
      await users.update(user.id, { name: name || undefined, bio, avatar }); require('../_site/render').dropAuthors(); return ok({ ok: true });
    }
    if (a === 'roles_save') { const r = await perms.save({ id: clean(b.id, 30), name: b.name, desc: b.desc, perms: b.perms }); return ok({ ok: true, role: r }); }
    if (a === 'roles_reset') return ok({ ok: true, role: await perms.reset(clean(b.id, 30)) });
    if (a === 'roles_delete') {
      const id = clean(b.id, 30); if (Object.values(await users.all()).some((u) => u.role === id)) return { code: 400, json: { error: 'People still have this role. Move them to another role first.' } };
      await perms.remove(id); return ok({ ok: true });
    }
    return null;
  } catch (e) { return bad(e); }
}
module.exports = { handle, ACTIONS, ownerProfile, authorsList };
