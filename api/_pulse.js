// Public endpoints for small site features. No cookies, nothing personal kept beyond what a client types into the testimonial form.
//   POST ?a=ev        { k: 'view'|'use', p: path, r: referrer }   free-tool usage counter (see _adm/toolstats.js)
//   GET  ?a=content   availability line, notice bar and approved testimonials for the pages (CDN-cached for 5 minutes)
//   GET  ?a=tform&t=  the testimonial form a client opens from the email (t is a signed brief id)
//   POST ?a=tsubmit   { t, quote, name, role, company, rating, publish, hp, ts }
const store = require('./_store');
const stats = require('./_adm/toolstats');
const content = require('./_adm/content');
const notify = require('./_adm/notify');
const { clean, parseBody, clientIp, limited, esc } = require('./_mail');

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch/i;

module.exports = async (req, res) => {
  const a = String((req.query || {}).a || ''), post = req.method === 'POST';
  try {
    if (a === 'ev' && post) {
      res.setHeader('Cache-Control', 'no-store');
      const b = parseBody(req), ua = String(req.headers['user-agent'] || '');
      if (!store.enabled() || BOT.test(ua) || !ua) return res.status(204).end();
      if (await limited('ev', clientIp(req), 300, 3600)) return res.status(204).end();
      await stats.hit(b.k === 'use' ? 'use' : 'view', clean(b.p, 120), clean(b.r, 400), req.headers.host);
      return res.status(204).end();
    }
    if (a === 'content') {
      res.setHeader('Vercel-CDN-Cache-Control', 'max-age=300, stale-while-revalidate=600');
      res.setHeader('CDN-Cache-Control', 'max-age=300, stale-while-revalidate=600');
      res.setHeader('Cache-Control', 'public, max-age=60');
      if (!store.enabled()) return res.status(200).json({});
      const c = await content.get(), today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
      const notice = c.notice.on && c.notice.text && (!c.notice.until || c.notice.until >= today) ? { text: c.notice.text, link: c.notice.link, linkText: c.notice.linkText } : null;
      return res.status(200).json({ avail: c.avail.on ? c.avail.text : '', notice, quotes: c.quotes.on ? await content.published(c.quotes.max) : [] });
    }
    if (a === 'tform') {
      res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Robots-Tag', 'noindex, nofollow'); res.setHeader('Content-Type', 'text/html; charset=utf-8');
      const id = content.briefOf(req.query.t), rec = id && store.enabled() ? await store.get(id) : null;
      if (!rec) return res.status(404).send(page('This link does not work', '<p class="lede">The link may be incomplete. Please reply to the email and I will send a fresh one.</p>'));
      if (rec.testimonial && rec.testimonial.got) return res.status(200).send(page('Thank you', '<p class="lede">I already have your words. Thank you again for taking the time.</p>'));
      return res.status(200).send(page('Two lines about working together?', form(rec, String(req.query.t))));
    }
    if (a === 'tsubmit' && post) {
      res.setHeader('Cache-Control', 'no-store');
      const b = parseBody(req), age = Date.now() - Number(b.ts || 0);
      if (clean(b.hp, 100) || !(age >= 3000 && age <= 864e5)) return res.status(200).json({ ok: true });
      if (await limited('tm', clientIp(req), 5, 3600)) return res.status(429).json({ error: 'Too many tries. Please try again later.' });
      const id = content.briefOf(b.t), rec = id ? await store.get(id) : null;
      if (!rec) return res.status(400).json({ error: 'This link does not work. Please reply to the email instead.' });
      if (rec.testimonial && rec.testimonial.got) return res.status(200).json({ ok: true });
      let t; try { t = await content.add({ ...b, brief: rec.id, email: rec.email }, 'form'); } catch (e) { return res.status(400).json({ error: e.message }); }
      await store.update(rec.id, { testimonial: { ...(rec.testimonial || {}), got: Date.now(), tm: t.id } });
      await notify.send(`${t.name}${t.company ? ' (' + t.company + ')' : ''} wrote a testimonial${t.publish ? '' : ' (private, not for the site)'}: "${t.quote.slice(0, 160)}"`, { title: 'New testimonial', tag: 'testimonial' });
      return res.status(200).json({ ok: true });
    }
    return res.status(404).json({ error: 'Unknown action.' });
  } catch (e) {
    console.error('pulse:', a, e.message);
    return a === 'ev' ? res.status(204).end() : res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

function form(rec, tok) {
  const v = (x) => esc(x || '');
  return `<p class="lede">Hi ${v(String(rec.name || '').split(/\s+/)[0] || 'there')}, a few honest lines about how the work went would help other people decide. It takes a minute.</p>
<form id="f" novalidate>
<label for="q">What was it like to work together?</label><textarea id="q" name="quote" rows="5" maxlength="600" required placeholder="What changed for you, and what was working together like?"></textarea>
<div class="two"><div><label for="n">Your name</label><input id="n" name="name" maxlength="80" value="${v(rec.name)}" required></div><div><label for="c">Company</label><input id="c" name="company" maxlength="80" value="${v(rec.company)}"></div></div>
<label for="r">Your role</label><input id="r" name="role" maxlength="80" placeholder="Founder, Marketing lead...">
<fieldset><legend>How would you rate it?</legend><div class="stars">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="rating" id="s${n}" value="${n}"><label for="s${n}" title="${n} of 5">&#9733;</label>`).join('')}</div></fieldset>
<label class="chk"><input type="checkbox" name="publish" checked> Aashish may show this, with my name, role and company, on aashishpandey.com.</label>
<input type="text" name="hp" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
<button type="submit">Send</button><p id="m" role="status"></p>
</form>
<script>(function(){var T0=Date.now(),f=document.getElementById('f'),m=document.getElementById('m');f.onsubmit=function(e){e.preventDefault();var d={t:${JSON.stringify(tok)},ts:T0,hp:f.hp.value,quote:f.quote.value,name:f.name.value,company:f.company.value,role:f.role.value,publish:f.publish.checked,rating:(f.querySelector('[name=rating]:checked')||{}).value};
if(d.quote.trim().length<15){m.textContent='Please write at least a sentence.';m.className='err';return}var b=f.querySelector('button');b.disabled=true;m.className='';m.textContent='Sending...';
fetch('/api/config?a=tsubmit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})}).then(function(x){if(x.ok){f.outerHTML='<p class="done">Thank you. That means a lot.</p>'}else{b.disabled=false;m.className='err';m.textContent=x.j.error||'Could not send. Please reply to the email instead.'}}).catch(function(){b.disabled=false;m.className='err';m.textContent='Could not reach the server. Please try again.'})}})();</script>`;
}
function page(title, inner) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(title)} · Aashish Pandey</title>
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;600&family=Geist+Mono:wght@500&family=Instrument+Serif:ital@1&display=swap" rel="stylesheet">
<style>:root{--ink:#f4efe6;--mute:#aaa4b8;--amber:#f5b867;--line:rgba(244,239,230,.14)}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#070916 url(/assets/nr/horizon.svg) center bottom/max(100%,1100px) auto no-repeat;color:var(--ink);font:16px/1.55 Geist,system-ui,sans-serif;padding:40px 16px 220px;display:flex;justify-content:center}
main{width:min(560px,100%);background:linear-gradient(180deg,rgba(19,24,56,.95),rgba(12,16,48,.95));border:1px solid var(--line);border-radius:22px;padding:28px}.meta{font:500 11px 'Geist Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#7ff3e1;margin:0 0 10px}
h1{margin:0 0 10px;font-size:30px;line-height:1.05;letter-spacing:-.04em;font-weight:600}h1 i{font-family:'Instrument Serif',serif;font-weight:400;color:var(--amber)}.lede{color:var(--mute);margin:0 0 18px}
label,legend{display:block;font-size:13.5px;color:var(--mute);margin:14px 0 6px}input,textarea{width:100%;font:inherit;color:inherit;background:#0a0e26;border:1px solid var(--line);border-radius:12px;padding:11px 14px;outline:none}input:focus,textarea:focus{border-color:var(--amber)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}fieldset{border:0;padding:0;margin:0}.stars{display:inline-flex;flex-direction:row-reverse;gap:4px}.stars input{position:absolute;opacity:0;width:1px}.stars label{margin:0;font-size:30px;line-height:1;color:#3a3f66;cursor:pointer}.stars input:checked~label,.stars label:hover,.stars label:hover~label{color:var(--amber)}.stars input:focus-visible+label{outline:2px solid #7ff3e1}
.chk{display:flex;gap:10px;align-items:flex-start;color:var(--ink);font-size:14.5px;margin-top:18px}.chk input{width:20px;height:20px;margin-top:2px;flex-shrink:0;accent-color:var(--amber)}.hp{position:absolute;left:-9999px}
button{margin-top:20px;width:100%;min-height:48px;border:0;border-radius:99px;background:var(--amber);color:#1a1420;font:600 16px Geist,system-ui,sans-serif;cursor:pointer}button:disabled{opacity:.6}.err{color:#ff8f7a}.done{font-size:18px;margin:18px 0 0;color:#6fd6a8}@media(max-width:480px){.two{grid-template-columns:1fr}}</style></head>
<body><main><p class="meta">aashishpandey.com</p><h1>${esc(title).replace(/(about working together\?|you)$/, '<i>$1</i>')}</h1>${inner}</main></body></html>`;
}
