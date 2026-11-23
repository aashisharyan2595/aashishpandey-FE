# Humanize rules (built in)

Aashish's standing rule: every draft that reaches readers sounds like a person wrote it. The three skills (`humanizer`, `writing-quality:writing-enforcer`, `humanize-writing`) are the best tool for this, but a scheduled session does not always have them installed, and a run must not skip the pass because of that. This page is the same method in the repo, adapted from those MIT-licensed skills (pattern tables only, no voice fingerprints), so any session can follow it. `desk.js check` scans for the patterns below in code.

## How a run uses this
1. Save the draft as `/tmp/draft.json`. Check which skills exist: `ls /root/.claude/plugins/synced/*/*/skills/ 2>/dev/null | grep -E 'humaniz|writing-enforcer|claim-boundary'` and look at the Skill tool list.
2. If the skills are there, use them in the order in the runbook (step 5b), then do steps 3 to 5 anyway. If they are not, do steps 3 to 5 alone and say so in the report: `Humanizer: built-in rules only (skills not installed in this session)`.
3. Rewrite with the rules below. Smallest edit that fixes the pattern. Never add a fact, opinion, feeling or experience the draft did not have. When a fix would need one, cut instead.
4. Scan: `node scripts/blog-desk/desk.js check /tmp/draft.json /tmp/src` must show `style: ok`. Fix hits in context, do not just swap a flagged word for a synonym.
5. Fact lock: `cp /tmp/draft.json /tmp/before.json` before step 3, then `node scripts/blog-desk/desk.js humanize /tmp/before.json /tmp/draft.json`. It must print `FACTS LOCKED`. Anything it lists must be deliberate and still true.
6. Name the mode in the email notes and the thread report: `Humanizer: skills` or `Humanizer: built-in rules only (<why>)`. Never write "I did a manual pass" without this line.

## Act on sight (rarely a writer's own choice)
- Contrast frame: "It's not about X, it's about Y." Say the second half.
- Closing moral or quotable last line. End on the last real point.
- Self-answered question: "The result? Bookings doubled." Write it as a sentence.
- Announcing: "Here's the thing", "In this guide", "Let's dive in". Start with what follows.
- Stock opener or closer: "In today's fast-moving world", "Stay tuned", "The future looks bright".
- Staged feeling or pre-emptive empathy ("I know this may be frustrating", "Rest assured"). Cut.

## Act when they cluster
- Payoff clause tacked on a fact (", so you can focus on what matters", ", which means less admin"). Keep the fact, cut the tail.
- Slogan pairs and "No X. No Y. Just Z." Say what the thing does.
- Groups of three where the content supports two. Drop only the padding item.
- Inflated significance: pivotal, testament, plays a key role, marks a major shift, stark reminder. Say the fact.
- Vague authority ("experts say", "studies show"). Name the source or cut the claim.
- Bold run-in labels on every list item, scattered bold, Title Case headings, a recap paragraph that repeats the post.
- Hidden actor ("will be moved on Saturday") where the source says who. Never invent an actor.

## Words and punctuation
Replace only when padding: delve, tapestry, landscape (figurative), leverage, seamless, robust, elevate, empower, foster, unlock, streamline, navigate (figurative), multifaceted, game-changer. No em or en dashes (use a comma, colon, brackets or a full stop; vary them). Contractions where a person would use them. Mix short and long sentences, but do not chop sentences into fragments for punch.

## Edits that read as AI themselves
Adding a personal aside to be "warmer", swapping words for synonyms for no reason, making every sentence the same length, making a claim more confident than the draft ("may" to "will", "some" to "most"), adding typos or slang to look human, rewording only the flagged phrase and leaving the sentence around it stiff.

## Facts stay
Numbers, dates, names, links, quoted words, the claims list, `title`, `slug`, `seo_title` and `seo_description` are not touched by this pass unless every claim stays accurate. This is the claim-boundary check in code: `desk.js humanize` compares before and after. The same pass applies to video scripts, email copy, newsletters and captions written by any scheduled job; for those, run the scan by hand on the text (`node -e "console.log(require('./scripts/blog-desk/checks').lint(require('fs').readFileSync(process.argv[1],'utf8')).issues)" file.txt`).
