# aashishpandey.com

Source for [aashishpandey.com](https://aashishpandey.com), the portfolio of Aashish Pandey (project manager and creative technologist, Bangalore).

The home page is a live 3D motorcycle ride (Three.js, no video). Around it sit a portfolio, case studies, service pages and a set of free tools.

## Pages

| Section | Route | What it is |
| --- | --- | --- |
| Ride | `/` | Scroll-driven 3D ride with story stops, plus an Explore mode |
| Portfolio | `/portfolio`, `/case-studies`, `/work-*` | Client work and four case studies |
| Services | `/services` and sub-pages | Shopify, full-stack, WordPress and Webflow, SEO, UI/UX, tech consulting |
| Tools | `/tools` and `/tools/*` | 22 free tools, see below |
| Write-up | `/how-this-site-was-built` | How the site was made |

`vercel.json` holds the authoritative route map (`rewrites`) and the legacy redirects.

## Free tools

Most run in the browser with no upload and no account.

- **Documents and business:** resume maker, resume keyword matcher, invoice generator, SOP maker, project estimate calculator, website launch checklist, online notepad
- **Images and files:** image resizer, exam photo and signature resizer, photo metadata (EXIF) remover, file hash checker, QR code generator, QR code checker
- **SEO and AI:** robots.txt generator, llms.txt generator, JSON-LD schema generator, LLM token counter
- **Sharing and time:** P2P file sharing, URL shortener, time zone meeting planner, password generator, lorem ipsum generator

Two tools use a small server: the URL shortener (`api/shorten.js`) and the pairing step of P2P file sharing (`api/p2p.js`, `api/p2p-ice.js`). File data in P2P goes directly between browsers over WebRTC.

## Stack

- Static HTML plus a small templating runtime (`support.js`, `.dc.html` pages). Newer tool pages are plain HTML with inline JS.
- Three.js world in `world-v7.js`, generative audio in `audio-v3.js`.
- Vercel serverless functions in `api/` (Node, no framework). Upstash Redis over REST for the shortener and P2P mailbox.
- Hosting: Vercel, deployed from `main`.

## Build

```
node scripts/chrome.cjs && node scripts/prerender.cjs && node scripts/externalize.cjs && node scripts/inline-css.cjs
```

| Script | Job |
| --- | --- |
| `scripts/chrome.cjs` | Generates the shared header, menus and footer into marked regions on every page. `--check` exits 1 if any page is stale. |
| `scripts/prerender.cjs` | Injects the static first-paint block into the home page |
| `scripts/externalize.cjs` | Compiles page templates to hashed `/tpl/*.js` bundles |
| `scripts/inline-css.cjs` | Inlines critical CSS |
| `scripts/sitemap.cjs` | Writes `sitemap.xml` (an index) and the per-type sitemaps |
| `scripts/make-og.py` | Renders the Open Graph images in `assets/og/` |

Do not run `prerender` and `externalize` in the working tree you plan to commit: they rewrite the page sources in place. Copy the repo to a scratch folder to test the real build.

## Adding a tool

1. Add the page file and a `rewrites` entry in `vercel.json`.
2. Add the route to `ROUTES` in `site.js`.
3. Add it to the menus and `TOOL_ORDER` in `scripts/chrome.cjs`, then run `node scripts/chrome.cjs`.
4. Add it to `scripts/sitemap.cjs` and `scripts/make-og.py`, then run both.
5. Add the hub card, `TOOLS` entry and ItemList item in `Tools-v3.dc.html`.
6. Update the "Free tools" list in `llms.txt`.

Pages under `/tools/*` must use absolute asset paths (`/assets/...`), because a relative path resolves against `/tools/`.

## Environment variables

Set in Vercel. All are optional; the feature that needs one switches off or falls back without it.

| Variable | Used by |
| --- | --- |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | URL shortener, P2P pairing, rate limits |
| `CF_TURN_KEY_ID`, `CF_TURN_API_TOKEN` | P2P relay for devices on different networks (Cloudflare Realtime TURN) |
| `METERED_APP`, `METERED_API_KEY` | Same relay, Metered as the alternative |

The contact, newsletter and quote endpoints also read `RESEND_API_KEY`, `RESEND_FROM`, `ADMIN_EMAIL` and the Turnstile keys (`TURNSTILE_SITEKEY`, `TURNSTILE_SECRET`). Never commit values.

## Notes

- Do not commit `CLAUDE.md` or hand-off notes. Vercel serves the repo root, so they would be public.
- Pages show no dates unless the content has one, and the site carries no ratings or reviews markup.
- Sitemap `lastmod` values come from `scripts/lastmod.json`.

## Licence

Code and content are copyright Aashish Pandey, all rights reserved, except vendored libraries in `assets/vendor/` (pdf.js, Apache-2.0) which keep their own licences.
