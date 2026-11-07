// Security policy for the admin, and the security score that checks it.
//   cfg:policy   { idleMin, stepUp, stepUpMin, require2fa }
// idleMin:    sign a session out after this many minutes without a request the person made (0 = only the 12 hour limit).
// stepUp:     risky actions (exports, erasing data, people, roles, security) need the password again within stepUpMin minutes.
// require2fa: everyone, the owner included, must turn on two-factor sign-in before they can use anything else.
// NIST SP 800-63B AAL2 asks for re-authentication after 30 minutes of inactivity and at most 12 hours overall; the defaults follow it.
const cfg = require('./cfg');
const DEFAULTS = { idleMin: 30, stepUp: true, stepUpMin: 10, require2fa: false };
const IDLE = [0, 15, 30, 60, 120, 240], STEP = [5, 10, 15, 30];

// actions that need a fresh password (sudo mode). Each one exports personal data, cannot be undone, or changes who can get in.
const STEP_UP = new Set(['export', 'audit_export', 'privacy_export', 'privacy_erase', 'backup_now', 'signout_all', 'users_add', 'users_update', 'users_delete', 'sessions_revoke_user', 'roles_save', 'roles_delete', 'roles_reset', 'totp_disable', 'policy_save', 'popups_save', 'popups_reset']);
// what a person may still do while the "everyone needs 2FA" rule is waiting for them
const SETUP_OK = new Set(['me', 'sec_get', 'totp_setup', 'totp_enable', 'pw_change', 'sessions_list', 'sessions_revoke', 'profile_get', 'push_key', 'reauth', 'reauth_state', 'notes_seen', 'roles_list']);

async function get() {
  const c = await cfg.get('policy', DEFAULTS);
  return { idleMin: IDLE.includes(Number(c.idleMin)) ? Number(c.idleMin) : DEFAULTS.idleMin, stepUp: c.stepUp !== false, stepUpMin: STEP.includes(Number(c.stepUpMin)) ? Number(c.stepUpMin) : DEFAULTS.stepUpMin, require2fa: !!c.require2fa };
}
async function save(b, has2fa) {
  const n = { idleMin: Number(b.idleMin), stepUp: b.stepUp !== false, stepUpMin: Number(b.stepUpMin), require2fa: !!b.require2fa };
  if (!IDLE.includes(n.idleMin)) throw new Error('Pick a sign-out time from the list.');
  if (!STEP.includes(n.stepUpMin)) throw new Error('Pick a confirmation window from the list.');
  if (n.require2fa && !has2fa) throw new Error('Turn on two-factor sign-in for yourself first, or the rule would lock you out of this page.');
  await cfg.set('policy', n); return n;
}
const elevated = (user, pol, now) => !pol.stepUp || (user.elev && now - user.elev < pol.stepUpMin * 60000);

// a score out of 100 with one line per check. weight: how much it matters. Grounded in OWASP ASVS 4.0 (V2 authentication, V3 sessions, V7 logging).
async function posture({ sec, users, guard, auditCheck, pol }) {
  const env = process.env, now = Date.now(), checks = [];
  const add = (id, ok, weight, title, detail, fix, tab) => checks.push({ id, ok: ok === null ? null : !!ok, weight, title, detail, fix: ok ? '' : fix, tab: tab || '' });
  const owner2fa = !!(await sec.totpState('owner')).enabled;
  const team = Object.values(await users.all()).filter((u) => u.active);
  const on = await Promise.all(team.map((u) => sec.totpState(u.id).then((s) => !!s.enabled)));
  const teamOn = on.filter(Boolean).length, bk = await sec.lastBackup();
  add('owner2fa', owner2fa, 20, 'Two-factor sign-in on the owner account', owner2fa ? 'An authenticator code is needed after the password.' : 'Anyone with the password gets in.', 'Settings, Security and sessions, Two-factor sign-in.', 'set');
  add('team2fa', team.length ? teamOn === team.length : null, 10, 'Two-factor sign-in for the team', team.length ? `${teamOn} of ${team.length} active people have it on.` : 'No team members yet.', 'Ask them to turn it on, or switch on "Everyone needs two-factor sign-in" below.', 'set');
  add('require2fa', team.length ? pol.require2fa : null, 5, 'Two-factor sign-in is required', pol.require2fa ? 'Nobody can use the admin until they set it up.' : 'It is optional for the team.', 'Turn on "Everyone needs two-factor sign-in" in the security rules.', 'set');
  add('idle', pol.idleMin > 0 && pol.idleMin <= 30, 10, 'Idle sign-out at 30 minutes or less', pol.idleMin ? `Signed out after ${pol.idleMin} minutes without activity.` : 'Off: a session lasts the full 12 hours.', 'Set "Sign out when idle" to 30 minutes or less.', 'set');
  add('stepup', pol.stepUp, 10, 'Password asked again for risky actions', pol.stepUp ? `Exports, erasing data, people, roles and security changes ask again after ${pol.stepUpMin} minutes.` : 'Off: an unlocked laptop can export everything.', 'Turn on "Confirm it is you" in the security rules.', 'set');
  add('secret', !!env.ADMIN_SECRET, 10, 'Separate key for sign-in cookies', env.ADMIN_SECRET ? 'ADMIN_SECRET is set in Vercel.' : 'The cookie key is worked out from the password, so a leaked password also forges cookies.', 'Add ADMIN_SECRET in Vercel (any long random text), then redeploy. Everyone is signed out once.');
  add('ips', guard.on(), 5, 'Admin limited to known addresses', guard.on() ? 'ADMIN_ALLOWED_IPS is set.' : 'Anyone with the link can reach the sign-in page.', 'Optional: set ADMIN_ALLOWED_IPS in Vercel if your address is stable.');
  add('cron', !!env.CRON_SECRET, 5, 'Scheduled jobs protected', env.CRON_SECRET ? 'CRON_SECRET is set.' : 'Nightly backup and health checks cannot run.', 'Add CRON_SECRET in Vercel.');
  add('backup', !!(bk && bk.ok && now - bk.at < 36 * 3600e3), 10, 'Backup in the last 36 hours', bk ? (bk.ok ? 'Last backup ' + Math.round((now - bk.at) / 3600e3) + ' hours ago.' : 'The last backup failed: ' + (bk.error || 'unknown error')) : 'No backup yet.', 'Settings, Backup and sessions, Email me a backup. Check CRON_SECRET.', 'set');
  add('webhook', !!env.RESEND_WEBHOOK_SECRET, 5, 'Email delivery events are signed', env.RESEND_WEBHOOK_SECRET ? 'RESEND_WEBHOOK_SECRET is set.' : 'Bounces and spam reports are not tracked.', 'Follow the steps on the Mail log page.', 'mail');
  add('audit', auditCheck.bad === 0 && auditCheck.gaps === 0, 10, 'Activity log untouched', auditCheck.signed ? (auditCheck.bad || auditCheck.gaps ? `${auditCheck.bad} changed and ${auditCheck.gaps} missing entries.` : `All ${auditCheck.signed} signed entries check out.`) : 'Entries are signed from now on.', 'Open Team and access, Activity, and run the integrity check.', 'team');
  const scored = checks.filter((c) => c.ok !== null), total = scored.reduce((s, c) => s + c.weight, 0), got = scored.filter((c) => c.ok).reduce((s, c) => s + c.weight, 0);
  return { score: total ? Math.round(100 * got / total) : 100, checks };
}
module.exports = { DEFAULTS, IDLE, STEP, STEP_UP, SETUP_OK, get, save, elevated, posture };
