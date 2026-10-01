// Email templates. Plain HTML with inline styles and tables so they work in Gmail, Outlook and Apple Mail.
// Each template returns { subject, html, text }. Text is plain and short, in the site's own voice.
const { SITE, esc, nl2br, firstName } = require('./_mail');
const BOOK = 'https://bookings.cloud.microsoft/bookwithme/user/21d85864cd9e44ad8e0b02c8924d50a0@aashishpandey.com/meetingtype/GSQs53Xp5k-9OwIn67Xxow2?anonymous&ismsaljsauthenabled&ep=mlink';

const NAVY = '#0b1030', AMBER = '#f5b867', INK = '#1a1420', MUTED = '#5c566a', LINE = '#e8e2d6';

function layout({ preheader, title, body, footer }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f3eee4;font-family:Arial,Helvetica,sans-serif;color:${INK};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3eee4;"><tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${LINE};">
<tr><td style="background:${NAVY};padding:22px 28px;"><span style="font-size:17px;font-weight:700;letter-spacing:-.01em;color:#f4efe6;">Aashish Pandey</span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${AMBER};margin-left:8px;"></span></td></tr>
<tr><td style="padding:30px 28px 8px;font-size:16px;line-height:1.6;color:${INK};">${body}</td></tr>
<tr><td style="padding:18px 28px 28px;border-top:1px solid ${LINE};font-size:12.5px;line-height:1.6;color:${MUTED};">${footer}</td></tr>
</table>
<p style="margin:14px 0 0;font-size:12px;color:#8a8398;">Aashish Pandey · Bangalore, India · <a href="${SITE}" style="color:#8a8398;">aashishpandey.com</a></p>
</td></tr></table></body></html>`;
}
const p = (t) => `<p style="margin:0 0 16px;">${t}</p>`;
const button = (href, label) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 22px;"><tr><td style="background:${AMBER};border-radius:999px;"><a href="${esc(href)}" style="display:inline-block;padding:13px 24px;font-size:15px;font-weight:700;color:${INK};text-decoration:none;">${esc(label)}</a></td></tr></table>`;
const row = (k, v) => v ? `<tr><td style="padding:9px 14px 9px 0;font-size:13px;color:${MUTED};vertical-align:top;white-space:nowrap;border-bottom:1px solid ${LINE};">${esc(k)}</td><td style="padding:9px 0;font-size:15px;color:${INK};border-bottom:1px solid ${LINE};">${esc(v)}</td></tr>` : '';
const quote = (t) => `<div style="margin:6px 0 22px;padding:14px 16px;background:#faf7f0;border-left:3px solid ${AMBER};border-radius:6px;font-size:15px;line-height:1.65;">${nl2br(t)}</div>`;

/* ---------- 1. admin: a new brief arrived ---------- */
function adminBrief(d) {
  const subject = `New brief: ${d.service || 'Project'} from ${d.name}`;
  const html = layout({
    preheader: `${d.name} sent a brief${d.company ? ' from ' + d.company : ''}.`, title: subject,
    body: p(`<strong>${esc(d.name)}</strong> sent a brief through the site. Reply to this email and it goes straight to them.`)
      + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">${row('Name', d.name)}${row('Email', d.email)}${row('Company', d.company)}${row('Website', d.website_url)}${row('Looking for', d.service)}${row('Budget', d.budget)}${row('Timeline', d.timeline)}</table>`
      + `<p style="margin:0 0 6px;font-size:13px;color:${MUTED};">Message</p>` + quote(d.message)
      + button(`mailto:${d.email}?subject=${encodeURIComponent('Re: your brief')}`, `Reply to ${firstName(d.name)}`),
    footer: `Sent ${esc(d.when)} from ${esc(d.page || '/contact')}. The sender agreed to the privacy policy. Their confirmation email says you will reply within 48 hours.`,
  });
  const text = `New brief from ${d.name} <${d.email}>\n${d.company ? 'Company: ' + d.company + '\n' : ''}${d.website_url ? 'Website: ' + d.website_url + '\n' : ''}${d.service ? 'Looking for: ' + d.service + '\n' : ''}${d.budget ? 'Budget: ' + d.budget + '\n' : ''}${d.timeline ? 'Timeline: ' + d.timeline + '\n' : ''}\n${d.message}\n\nReply to this email to answer ${d.name}. They were told you reply within 48 hours.`;
  return { subject, html, text };
}

/* ---------- 2. user: we got your brief ---------- */
function userBriefConfirmation(d) {
  const subject = 'Got your brief. I will reply within 48 hours';
  const html = layout({
    preheader: 'Thanks for the brief. Here is what happens next.', title: subject,
    body: p(`Hi ${esc(firstName(d.name))},`)
      + p('Thanks for sending your brief. It reached me, and I read every one myself.')
      + p('<strong>What happens next</strong>')
      + `<ol style="margin:0 0 18px;padding-left:20px;line-height:1.7;"><li>I read it and check what is missing.</li><li>Within 48 hours I write back with questions, or with a scope, a timeline and a quote.</li><li>If a call is easier, we set one up. No pressure either way.</li></ol>`
      + p('A copy of what you sent:') + quote(`${d.service ? 'Looking for: ' + d.service + '\n' : ''}${d.budget ? 'Budget: ' + d.budget + '\n' : ''}${d.timeline ? 'Timeline: ' + d.timeline + '\n' : ''}\n${d.message}`)
      + p('In a hurry? You can book a time straight away.') + button(BOOK, 'Book a 20-minute call')
      + p('Aashish'),
    footer: `You get this one email because you filled in the form on <a href="${SITE}/contact" style="color:${MUTED};">aashishpandey.com</a>. I do not add you to a mailing list. Reply to this email if something in your brief was wrong. <a href="${SITE}/privacy" style="color:${MUTED};">Privacy policy</a>.`,
  });
  const text = `Hi ${firstName(d.name)},\n\nThanks for sending your brief. It reached me, and I read every one myself.\n\nWhat happens next:\n1. I read it and check what is missing.\n2. Within 48 hours I write back with questions, or with a scope, a timeline and a quote.\n3. If a call is easier, we set one up.\n\nWhat you sent:\n${d.service ? 'Looking for: ' + d.service + '\n' : ''}${d.budget ? 'Budget: ' + d.budget + '\n' : ''}${d.timeline ? 'Timeline: ' + d.timeline + '\n' : ''}\n${d.message}\n\nIn a hurry? Book a call: ${BOOK}\n\nAashish\n\nYou get this one email because you filled in the form on aashishpandey.com. I do not add you to a mailing list. Privacy: ${SITE}/privacy`;
  return { subject, html, text };
}

/* ---------- 3. subscriber: please confirm ---------- */
function subscribeConfirm(url) {
  const subject = 'Please confirm your subscription';
  const html = layout({
    preheader: 'One click to confirm.', title: subject,
    body: p('Hi,') + p('Someone, hopefully you, asked to get emails from aashishpandey.com. Click the button to say yes.') + button(url, 'Yes, subscribe me')
      + p(`The link works for 48 hours. If it was not you, ignore this email. Nothing happens and you will not hear from me.`),
    footer: `You get this because this address was typed into the subscribe form on <a href="${SITE}" style="color:${MUTED};">aashishpandey.com</a>. <a href="${SITE}/privacy" style="color:${MUTED};">Privacy policy</a>.`,
  });
  const text = `Hi,\n\nSomeone, hopefully you, asked to get emails from aashishpandey.com. Open this link to say yes:\n${url}\n\nThe link works for 48 hours. If it was not you, ignore this email. Nothing happens.\n\nPrivacy: ${SITE}/privacy`;
  return { subject, html, text };
}

/* ---------- 4. subscriber: welcome ---------- */
function subscribeWelcome(unsubUrl) {
  const subject = 'You are subscribed';
  const html = layout({
    preheader: 'Thanks for subscribing. Here is what to expect.', title: subject,
    body: p('Hi,') + p('You are on the list. Thanks.')
      + p('I will email you when I publish something worth reading, such as a new tool, a case study or a write-up. Not on a fixed schedule, and never to fill space.')
      + p('If you want to talk about a project, just reply to this email. It comes to me.') + p('Aashish'),
    footer: `Changed your mind? <a href="${esc(unsubUrl)}" style="color:${MUTED};">Unsubscribe with one click</a>. <a href="${SITE}/privacy" style="color:${MUTED};">Privacy policy</a>.`,
  });
  const text = `Hi,\n\nYou are on the list. Thanks.\n\nI will email you when I publish something worth reading, such as a new tool, a case study or a write-up. Not on a fixed schedule, and never to fill space.\n\nIf you want to talk about a project, just reply to this email.\n\nAashish\n\nUnsubscribe: ${unsubUrl}\nPrivacy: ${SITE}/privacy`;
  return { subject, html, text };
}

/* ---------- 5. admin: new subscriber / unsubscribe ---------- */
function adminSubscriber(email, kind = 'subscribed') {
  const subject = kind === 'subscribed' ? `New subscriber: ${email}` : `Unsubscribed: ${email}`;
  const html = layout({
    preheader: subject, title: subject,
    body: p(kind === 'subscribed' ? `<strong>${esc(email)}</strong> confirmed their subscription and is now in your Resend audience.` : `<strong>${esc(email)}</strong> unsubscribed. They are marked as unsubscribed in your Resend audience.`),
    footer: 'This is an automatic note from the site.',
  });
  return { subject, html, text: subject };
}

module.exports = { adminBrief, userBriefConfirmation, subscribeConfirm, subscribeWelcome, adminSubscriber };
