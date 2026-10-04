// Push alerts. Telegram bot, Slack incoming webhook, or a generic webhook (WhatsApp services such as Twilio, Make or Zapier can sit behind it).
// Env: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID, SLACK_WEBHOOK_URL, ALERT_WEBHOOK_URL. Phones and browsers that turned on notifications in the admin get a push too.
// Never throws; an alert must not break a form.
const push = require('./webpush');
const channels = () => ({
  telegram: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
  slack: !!process.env.SLACK_WEBHOOK_URL,
  webhook: !!process.env.ALERT_WEBHOOK_URL,
});
const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); });
const slackEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function send(text, opts) {
  opts = opts || {};
  const jobs = [];
  try { if (await push.count()) jobs.push(push.sendAll({ title: opts.title || 'aashishpandey.com', body: text, url: opts.url, tag: opts.tag })); } catch (e) { console.error('push failed', e.message); }
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) jobs.push(post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, { chat_id: process.env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }));
  if (process.env.SLACK_WEBHOOK_URL) jobs.push(post(process.env.SLACK_WEBHOOK_URL, { text: slackEsc(text) }));
  if (process.env.ALERT_WEBHOOK_URL) jobs.push(post(process.env.ALERT_WEBHOOK_URL, { text, source: 'aashishpandey.com' }));
  if (!jobs.length) return { sent: 0, failed: 0, none: true };
  const slow = new Promise((r) => setTimeout(() => r('timeout'), 3000));   // never hold a visitor's request for long
  const res = await Promise.race([Promise.allSettled(jobs), slow]);
  if (res === 'timeout') return { sent: 0, failed: 0, timeout: true };
  const failed = res.filter((x) => x.status === 'rejected');
  failed.forEach((x) => console.error('notify failed:', x.reason && x.reason.message));
  return { sent: res.length - failed.length, failed: failed.length };
}
module.exports = { send, channels };
