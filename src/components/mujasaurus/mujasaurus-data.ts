// Scripted tour content for Mujasaurus, the site mascot — keyed by pathname
// prefix so the same component can guide any page without per-page wiring.
// "Knows everything about the site" here means a curated script, not a live
// AI backend: cheap, instant, and never wrong about what the site actually does.

export const NAME = "Mujasaurus";
export const PRONUNCIATION = "moo-ja-SORE-us";

const GUIDE_TIPS: Record<string, string[]> = {
  "/": [
    "This is Aashish's Critical Path — every glass bar on the timeline is a real project he's shipped since 2018.",
    "Scroll to fly the camera down the timeline. Orange bars are live milestones, cream ones are just markers in between.",
    "See a bar you like? Click it — it opens the real case study behind it: the brief, the work, the result.",
    "There's a whole 'Ride mode' hiding up top, near the nav — Aashish's career retold as a motorcycle journey.",
    "The music panel next to Ride mode plays generative ambient tracks I quite like, if you want company while you scroll.",
  ],
  "/work": [
    "Every card on this page is a real, shipped project — client, timeframe, and the actual outcome, not filler.",
    "Use the filters up top to narrow by discipline if you're hunting for something specific.",
    "Click any card to open the full case study: context, response, and the evidence it worked.",
  ],
  "/about": [
    "This page is the honest version of the résumé — how Aashish actually works, not just a list of job titles.",
    "Look for the timeline of roles and the tools he reaches for on a normal week.",
  ],
  "/contact": [
    "This is the fastest way to reach Aashish directly — no recruiter relay in between.",
    "Fill in the brief and it lands straight in his inbox. Short and specific gets read first.",
  ],
  "/ride": [
    "Welcome to Ride mode — Aashish's career retold as a motorcycle journey across four gears.",
    "Logbook, Map, Garage and Pit Stop are all real content. The actual riding game is still being built — I promise it's next, not skipped.",
  ],
  "/field-notes": [
    "Field Notes is where the write-ups live — Aashish thinking out loud about delivery, product and process.",
    "Tap a tag or category up top to filter to the kind of writing you're after.",
  ],
  "/field-prototype": [
    "This is an experimental page — a prototype Aashish is trying out. Poke around, nothing here is final.",
  ],
};

const FALLBACK_TIPS: string[] = [
  `I'm ${NAME} — say it "${PRONUNCIATION}" — Aashish's mascot and guide around here.`,
  "Click the compass in my menu for a quick tour of wherever you are on the site.",
  "Try feeding me, or ask for a trick — I've got a few good ones.",
  "Head to Work to see everything Aashish has actually shipped, or About for the story behind it.",
  "Drag me around if I'm in your way — I don't mind.",
];

export function tipsFor(pathname: string): string[] {
  if (GUIDE_TIPS[pathname]) return GUIDE_TIPS[pathname];
  const key = Object.keys(GUIDE_TIPS)
    .filter((k) => k !== "/" && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return key ? GUIDE_TIPS[key] : FALLBACK_TIPS;
}

export const INTRO_TIP = `Hi, I'm ${NAME} (${PRONUNCIATION})! Click me any time — I'll show you around.`;
