# Blog desk

Writes one AI and tech post a day, checks it, schedules it for 9:00 am IST and emails you the draft at 9:00 pm IST the night before. Breaking news is published straight away. Code lives in `scripts/blog-bot/`, schedule in `.github/workflows/blog-bot.yml`, posts go into the normal blog engine (`api/_site/posts.js`), so every post can be edited in the admin desk under Posts.

## What runs when (GitHub Actions)
| When | What |
|---|---|
| every 2 hours | read ~20 news feeds, score them, update the 30-day plan, publish breaking news, send new posts to IndexNow |
| 7:00 pm IST | write tomorrow's post, schedule it for 9:00 am IST, queue the draft email for 9:00 pm IST (Resend holds it) |
| 8:15 pm IST | second try, only does anything if there is no draft yet |

## Setup: secrets (repo Settings > Secrets and variables > Actions)
| Secret | Needed | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | writer (Claude Opus 5.5), scoring (Haiku 5.5), fact check fallback (Sonnet 5.5) |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | yes | same values as in Vercel |
| `RESEND_API_KEY`, `ADMIN_EMAIL` | yes | same values as in Vercel; `RESEND_FROM` optional |
| `OPENAI_API_KEY` | optional | second-vendor fact check (`OPENAI_CHECK_MODEL` to pick the model). Without it a separate Claude reviewer does the check |
| `COPYSCAPE_USER`, `COPYSCAPE_KEY` | optional | web-wide plagiarism check. Without them only the in-house check against the sources runs |
| variable `BLOG_BUDGET_USD` | optional | monthly spend limit, default 60 |

The repo is public: the workflow never prints drafts, keys or addresses, and does not run on pull requests.

## Rules every post goes through
- Sources: at least 5 readable pages from 3 outlets for news and explainers (3 and 2 for breaking), a spread of left, centre and right outlets (outlet labels are in `sources.js` and are approximate), plus a primary source for reviews.
- Facts: every claim is tied to a source page; a second model checks each one. A contradicted claim or two unsupported claims hold the post.
- Copy: no more than 10% of its 8-word runs may appear in a source (quotes excluded); Copyscape too when set up.
- Voice: invisible characters and dashes removed, banned filler phrases rewritten, one rewrite pass.
- A held post is saved as a draft, you get an email saying why, and nothing goes live until you press Schedule.

## Controls
- Email button page (link in every draft email): Stop, Publish now, Preview, Schedule again.
- Admin desk > Calendar: planned topics, pause switch, Change or Skip a day (a day you change is locked).
- Admin desk > Posts: edit any post; edits to a scheduled post are kept.

## Search and answer engines
Answer-first "Quick answer", question headings, FAQ section plus FAQPage schema, NewsArticle or BlogPosting schema with `citation` and `about`, sources list, cover image as share image, image sitemap, RSS, internal links to tools, IndexNow ping for new posts (`<key>.txt` in the repo root is the public IndexNow key).

## Dry run (no keys, no network)
`NODE_PATH=$(npm root -g) node scripts/blog-bot/test.js` (add `--keep` to write the images and email to /tmp/blog-test).
