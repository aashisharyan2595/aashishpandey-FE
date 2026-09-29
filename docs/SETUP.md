# Setup and moving guide

How to rebuild aashishpandey.com from this repo, and what to change if you switch hosting, the database or the domain. This repo is public, so nothing secret goes in it. Tokens live in Vercel's environment variables.

## 1. What the site is made of

- **Static pages.** Every page is a `.dc.html` file in the repo root. There is no framework and no bundler. A small runtime (`support.js`) turns each file into the page in the browser.
- **The ride.** `Portfolio.dc.html` loads a 3D world (`world-v6.js`, three.js from unpkg) and generated audio (`audio-v3.js`).
- **Clean URLs.** `vercel.json` maps paths like `/tools/pad` to the real file (`Tools-Pad-v2.dc.html`).
- **One tiny backend.** `api/shorten.js` and `api/s/[code].js` power the URL shortener. They are Node functions and need a Redis database.
- **Build step.** `node scripts/prerender.cjs && node scripts/externalize.cjs`. The first writes a static copy of each page's content into the HTML. The second moves each dynamic page's template into a hashed file under `tpl/`, so the served HTML has real content and no `{{ }}` template code. `tpl/` is generated at deploy and is git-ignored. Source files keep their inline templates, so the design tool and local previews still work.

| Path | Purpose |
|---|---|
| `Portfolio.dc.html` | Home page, the 3D ride |
| `Proof-v2.dc.html` | `/portfolio` (client sites, career, toolkit, contact) |
| `Services.dc.html` | `/services` hub linking to every service page |
| `Case-Studies.dc.html` | `/case-studies` (listing of the four case studies) |
| `Shopify-Developer`, `Full-Stack-Developer`, `Wordpress-Webflow-Developer`, `SEO-Consultant`, `UI-UX-Design`, `Tech-Consultant` (`.dc.html`) | The six service pages, each with a visible FAQ and matching `FAQPage` markup |
| `Work-*.dc.html` | The four case-study pages |
| `How-This-Site-Was-Built.dc.html` | Build write-up |
| `Tools-*.dc.html` | `/tools` hub and seven tools (notepad, URL shortener, image resizer, lorem ipsum, launch checklist, QR code generator `Tools-QR`, QR code checker `Tools-QR-Check`) |
| `404.html` | Not-found page |
| `site.js` | Analytics, click tracking, dev-preview routing |
| `support.js` | The page runtime. Don't edit |
| `world-v6.js`, `audio-v3.js` | Active 3D world and audio. `world-v2/v3/v4.js` and `audio-v2.js` are old copies kept for rollback |
| `api/` | Shortener backend |
| `scripts/` | `prerender.cjs` and `externalize.cjs` (build steps), `sitemap.cjs` (regenerates `sitemap.xml`), `make-og.py` (per-page share images into `assets/og/`), `nav.cjs` (writes the shared header into every static page; the styles are in `assets/nav.css`, bump `?v=` in the pages when you change it), `checklist-static.cjs` (regenerates the crawlable list of checks inside the launch checklist page; run it after editing the checks) |
| `assets/` | Images, résumé PDF, favicons, OG image. `assets/vendor/` holds two third-party libraries used by the QR tools: `qrcode.js` (qrcode-generator 1.4.4, MIT) and `jsQR.min.js` (jsQR 1.4.0, Apache-2.0). Both are copied in so the tools do not depend on a CDN |
| `vercel.json` | Build command, redirects, rewrites, headers |
| `sitemap.xml`, `robots.txt`, `llms.txt` | Search and AI crawler files |

## 2. Accounts and services in use

| Service | What for | Cost |
|---|---|---|
| GitHub (`aashisharyan2595/aashishpandey-FE`) | Source code. Vercel deploys from `main` | Free |
| Vercel | Hosting, functions, Web Analytics | Free plan |
| Domain registrar and DNS | `aashishpandey.com` | Paid yearly |
| Upstash Redis | Short-link storage | Free plan |
| Google Analytics 4 | Traffic. ID is in `site.js` (`GA_ID`) | Free |
| unpkg, Google Fonts, simpleicons | Libraries, fonts and logos loaded by the pages | Free |
| Email (`hello@aashishpandey.com`) | Set up separately from the site. It lives in the DNS MX records, so keep those when you change DNS | Varies |

## 3. Deploy from scratch on Vercel

1. Push the repo to GitHub (see section 8).
2. In Vercel, click **Add New → Project** and import the repo.
3. Settings on the import screen:
   - Framework Preset: **Other**
   - Build Command: `node scripts/prerender.cjs && node scripts/externalize.cjs` (already in `vercel.json`)
   - Output Directory: `.` (already in `vercel.json`)
   - Install Command: leave empty. There is no `package.json`
4. Add the environment variables from section 4.
5. Deploy.
6. Add the domain (section 5).

## 4. Environment variables

Set these in Vercel under Settings → Environment Variables, for **Production**. Redeploy after any change, because variables only apply to new deployments.

| Name | Value |
|---|---|
| `UPSTASH_REDIS_REST_URL` | From the Upstash database page, REST API section. Starts with `https://` |
| `UPSTASH_REDIS_REST_TOKEN` | Same place. Use the normal token, not the read-only one |

Without them the site works, but the shortener returns errors.

## 5. Domain and DNS

1. In Vercel, Settings → Domains, add both `aashishpandey.com` and `www.aashishpandey.com`.
2. Make **`aashishpandey.com` the primary**. Set `www` to redirect to it, permanent (308) if Vercel offers the choice.
3. At your DNS provider, create the records Vercel shows you. As of writing that was an `A` record for the bare domain pointing at `76.76.21.21` and a `CNAME` for `www` pointing at `cname.vercel-dns.com`. Use whatever the dashboard says now.
4. Keep the existing MX and TXT records so email keeps working.
5. Every canonical tag, the sitemap and the JSON-LD use `https://aashishpandey.com` (no www). Leave it that way. If you ever change the primary domain, search and replace it in all `.dc.html` files, `sitemap.xml`, `robots.txt`, `llms.txt` and `api/_lib.js` (`SITE`).

## 6. The database (short links)

Only `api/_lib.js` talks to the database, through one `redis()` function that sends commands to Upstash's REST API. That file is the only place to change if you move to a different database.

What gets stored:

| Key | Value | Expiry |
|---|---|---|
| `s:<code>` (lowercase) | JSON `{ url, created, expiresAt }` | The link's own expiry (1 day to 1 year) |
| `c:<code>` | Click count | None |
| `rl:h:<ip>`, `rl:d:<ip>` | Rate-limit counters | 1 hour, 1 day |

Limits in code: 5 new links an hour and 20 a day per visitor, `http(s)` links only, blocklists for other shorteners and phishing words.

**Switching to a new Upstash database:** create it, copy the new URL and token into Vercel, redeploy. Existing links stay in the old one. To keep them, list keys with `SCAN 0 MATCH s:*` and copy each with its remaining TTL (`PTTL`), or accept that old links expire.

**Switching to a different database type (Turso, Postgres, KV and so on):** rewrite `redis()` and the five commands used in `shorten.js`, `s/[code].js` and `_lib.js` (`SET ... EX ... NX`, `GET`, `INCR`, `EXPIRE`). Expiry has to be done by hand if the new database has no TTL.

**Free options:** Upstash free plan (what is used now), Turso, Cloudflare Workers KV (via its HTTP API), Supabase or Neon free Postgres. Check each provider's current limits before relying on them.

## 7. Moving to a different host

Any host works if it can do four things. Vercel-specific bits are marked.

1. **Serve the repo root as static files** and run `node scripts/prerender.cjs` before publishing (optional but it improves SEO).
2. **Rewrite clean URLs to files.** The table is in `vercel.json` under `rewrites`. Examples: `/` → `/Portfolio.dc.html`, `/portfolio` → `/Proof-v2.dc.html`, `/case-studies` → `/Case-Studies.dc.html`, `/tools/pad` → `/Tools-Pad-v2.dc.html`. Redirects for old URLs are under `redirects`.
3. **Run the two Node functions.** `POST /api/shorten` and `GET /s/:code` (which `vercel.json` rewrites to `/api/s/:code`). They use `fetch` and `crypto`, so Node 18 or newer. The rate limit reads the `x-forwarded-for` header, so the host must set it to the real visitor IP.
4. **Send the headers** in `vercel.json` (HSTS, cache rules for `/assets/*` and `*.js`, `no-store` for `/api/*`).

Vercel-only: `/_vercel/insights/script.js` in `site.js` (Web Analytics). Remove that line on another host.

On a plain server (nginx plus Node), translate the rewrites into `try_files` or `rewrite` rules and run the two functions in a small Express app. Netlify and Cloudflare Pages have their own redirect and function formats, so `vercel.json` needs translating by hand.

## 8. Uploading to Git

```bash
git clone https://github.com/aashisharyan2595/aashishpandey-FE.git
cd aashishpandey-FE
# make changes
git add <files>
git commit -m "What changed and why"
git push origin main
```

Pushing to `main` deploys to production. There are also `staging`, `redesign` and `rebuild-v2` branches from earlier work.

**Never commit:** tokens or `.env` files, `CLAUDE.md` or `HANDOFF_BRIEF.md` (the repo root is served publicly, so they would be readable on the site), design-tool scratch files (`github.md`, `CHANGELOG*.md`, `.thumbnail`), the `uploads/` folder, or mp3 files.

## 9. Adding a new page

1. Create `Something.dc.html`. Copy the `<head>` from a similar page (title, description, canonical, OG tags), then add the page to `PAGES` in `scripts/nav.cjs` and run it so the header matches the rest of the site.
2. Add a rewrite in `vercel.json`, for example `/something` → `/Something.dc.html`.
3. Add the same route to `ROUTES` in `site.js` so local preview works.
4. Add the page to the list in `scripts/sitemap.cjs` and to `llms.txt`, then run `node scripts/sitemap.cjs`. Dates in the sitemap only move when a page's content really changes, so run it before every commit that edits a page. The visible "Updated" date on each case study is typed by hand: change it, and `dateModified` in that page's JSON-LD, whenever you edit the case study.
5. **Use absolute paths** for scripts and assets: `/site.js`, `/support.js`, `/assets/...`. A page served from a nested URL like `/tools/pad` breaks with relative paths, because `support.js` would be requested from `/tools/support.js`.
6. Any page with `{{ }}` bindings needs the `#ap-pre` placeholder (`<div id="ap-pre"></div><!-- /ap-pre -->`) **and** the line `const pre = document.getElementById('ap-pre'); pre && pre.remove();` in its component's `componentDidMount`. The build refuses to strip a bound template from a page without the placeholder. Prerender is opt-in. Only add `<div id="ap-pre"></div><!-- /ap-pre -->` if the page also has code that removes `#ap-pre` on load (see `Proof-v2.dc.html`). Otherwise the static copy stays on the page and everything shows twice.
7. Add a share image: add a card to `ITEMS` in `scripts/make-og.py`, run it, and point `og:image` at the new file in `assets/og/`. Add matching `og:image:alt` and `twitter:image:alt` tags. Keep the title under about 60 characters and the description under about 155.
8. Test the real URL, not just the file, then push.

## 10. Checks after any deploy or move

```bash
for p in / /portfolio /case-studies /tools /tools/pad /tools/url-shortener /work-liquid-iv /robots.txt /sitemap.xml; do
  printf "%-28s" $p; curl -s -o /dev/null -w "%{http_code}\n" https://aashishpandey.com$p
done
curl -sI https://www.aashishpandey.com/ | head -3        # should redirect to the bare domain
curl -s -X POST https://aashishpandey.com/api/shorten \
  -H 'Content-Type: application/json' -d '{"url":"https://example.com","expires":"1d"}'
```

A 200 only means the file was found. Open each page in a browser too and look for raw `{{ }}` text, which means a script failed to load. Then check the browser console.

## 11. Rolling back

- **A bad deploy:** in Vercel, open Deployments and promote the last good one, or `git revert <commit>` and push.
- **The 3D world:** in `Portfolio.dc.html`, change `world-v6.js` in the `import()` line back to `world-v4.js`.
- **Old commits that show your bike plate:** the artwork was replaced in the current files, but earlier commits still contain the old image. Rewriting history is a separate, deliberate step.

## 12. Known limits

- The shortener only works with the two Upstash variables set.
- Tracking (GA4 and Vercel Analytics) only loads on the live domain, not on localhost.
- The page source contains both the prerendered block and the raw template, so crawlers that don't run JavaScript see some text twice.
