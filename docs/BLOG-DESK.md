# Blog desk

One AI and tech post a day, researched, written and checked by scheduled Claude sessions, published through git. No API keys, no accounts, no GitHub secrets.

| Scheduled task | When (IST) | What it does |
|---|---|---|
| Blog desk: news | 7:13 am, 11:13 am, 3:13 pm, 10:13 pm | reads about 20 news feeds, keeps the 30-day topic plan, publishes breaking news (max 2 a day, 2+ outlets) and emails it |
| Blog desk: evening | 6:00 pm | researches and writes tomorrow's post, runs the checks, schedules it for 9:00 am |
| Blog desk: mailer | 9:00 pm | emails Aashish the draft |

The instructions the sessions follow are in `docs/blog-desk-runbook.md`; the exact checks (source spread, copy overlap, numbers and quotes against sources, tone, images, page assembly) are in `scripts/blog-desk/`. Posts are `content/blog/<slug>.json` (published when `publishAt` passes, read by `api/_site/fileposts.js`), cover images are drawn locally into `assets/blog/`, the plan is `content/blog/calendar.json`.

To stop, change or move a post, or to pause everything, tell Claude in the project thread (or disable the scheduled tasks). Dry run with a fake network: `NODE_PATH=$(npm root -g) node scripts/blog-desk/test.js`.
