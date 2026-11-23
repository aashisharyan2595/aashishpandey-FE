# QA log: banks-ai-agents-customer-liability
Humanizer: skills (humanizer:humanizer) plus built-in rules (desk.js check, humanize-rules.md). QA agent is the same model family as the writer.
go-live: 2026-11-23T17:51:29.439Z

- 1 topic: backlog item banks-ai-agents-liability (score 8, security +2). Title style "number" not honest for this story (only Citi says you pay if hacked), used the next least-tried.
- 2 relevance agent: APPROVE (audience fit, no duplicate, security 3 of last 10, 7 sources). Flag: ai already over the 4-of-10 cap before this post.
- 3 content: draft, desk.js check PASS (6.2% overlap), humanizer pass (5 edits), cover-v2 and one in-post art, qa.js content and front local PASS.
- 4 QA pass 1: CHANGES NEEDED. 2 blockers (title and FAQ claimed all 6 banks say you pay if hacked; sources only say that for Citi), 8 fixes, 3 nits. Facts 33 supported, 7 unsupported, 2 contradicted.
- 5 writer fix: title and quick answer pinned to Citi, FAQ names who said what, 2 links moved to the page that says it, "what to watch" section added, India line limited to what sources say, Fox source cited, art text scoped to Citi. Side effect found: dropping an uncited source broke the viewpoint-spread rule, so the source was cited instead.
- 6 QA pass 2: CHANGES NEEDED. 7 issues (FAQ 2 wording, length 1330 vs 1300, quick answer contradicted body, Fox causation, 2 staged phrases, speculative bullet, diagram text).
- 7 writer fix: all 7 applied, 45 words cut.
- 8 QA pass 3: SIGNOFF. Facts 44 supported, 0 unsupported, 0 contradicted. Nits skipped: relative dates ("this week") go stale; source title truncated in the Sources list (display only).
- 9 stage link: branch stage-1123, preview https://aashishpandey-fe-git-stage-1123-aashish-pandey1.vercel.app/blog/banks-ai-agents-customer-liability, noindex. qa.js front 13 of 13 PASS.
- 10 stage QA agent: SIGNOFF FOR GO-LIVE, conditional on seeing the in-post diagram; the full-page screenshot missed it (lazy image). Writer checked it with a scrolled element screenshot: renders correctly. qa.js now saves per-figure screenshots. Nit fixed: calendar.json trailing newline. Cookie banner overlaps the title in the screenshot: site overlay, not the post.
- 11 go live: qa.js release restored publishAt, pushed stage-1123 to main.
- 12 post-live: qa.js front on https://aashishpandey.com 13 of 13 PASS, qa.js content PASS, in sitemap-posts.xml, no noindex, IndexNow 200. QA agent: LIVE OK.
live: 2026-11-23 LIVE OK
