// Real data for the "Critical Path" homepage — a 3D Gantt chart of the
// career timeline. Ported verbatim from the source design's own script
// (Aashish Critical Path v3.dc.html), which is itself consistent with
// case-studies.ts and the About page's experience data. Kept separate from
// lib/case-studies.ts / lib/field.ts rather than merged: this page's ROWS
// model real date spans (fractional years) and per-world flags the other
// files don't need, and merging would force an unrelated shape onto them.

export const INK = "#171b2e";
export const BG = "#f6ead6";
export const ACCENT = "#e8773a";
export const MUTED = "#8b8f9f";

export type World = { name: string; text: string; tools: string[] };

export const WORLDS: World[] = [
  {
    name: "Product",
    text: "Owning outcomes and prioritizing roadmaps against evidence: StoryNest's traffic growth, Wipro's D2C process redesign.",
    tools: ["Roadmap prioritization", "Workflow analysis", "GA4 & GTM", "A/B testing"],
  },
  {
    name: "Design",
    text: "Design-literate enough to work directly in Figma and own a UX redesign end to end, not just review one.",
    tools: ["Figma", "UX redesign", "Brand consistency"],
  },
  {
    name: "Technology",
    text: "Hands-on with CMS architecture, Shopify Plus and CI/CD, enough to open the codebase when a project needs it.",
    tools: ["CMS architecture", "Shopify Plus", "Webflow & AEM", "CI/CD", "Core Web Vitals"],
  },
  {
    name: "Delivery",
    text: "Agile/Scrum, stakeholder alignment and process design, the throughline across every role. Onshore and offshore teams aligned, paced and unblocked.",
    tools: ["Agile & Scrum", "Jira & Azure DevOps", "MS Planner · Project · Visio · Loop", "Vendor negotiation"],
  },
];

export const NOW = 2026.73;

export type TimelineRow = {
  t: string;
  short: string;
  a: number;
  b: number;
  w: [number, number, number, number];
  c?: number;
};

// a/b = fractional-year span; w = [Product, Design, Tech, Delivery] flags;
// c = index into CASES when this row has a full case study attached.
export const ROWS: TimelineRow[] = [
  { t: "15+ client projects: ITC, Anchor, MSI India", short: "Freelance · 15+ projects", a: 2018.05, b: 2020.9, w: [1, 0, 1, 1] },
  { t: "Reliance Industries: CMS & e-commerce", short: "Reliance Industries", a: 2020.95, b: 2022.4, w: [1, 0, 1, 0] },
  { t: "Bajaj Electronics: CMS & e-commerce", short: "Bajaj Electronics", a: 2020.95, b: 2022.4, w: [0, 0, 1, 0] },
  { t: "Zebronics campaign pages", short: "Zebronics", a: 2020.95, b: 2022.4, w: [1, 0, 1, 0], c: 0 },
  { t: "StoryNest AI platform", short: "StoryNest", a: 2022.5, b: 2025.65, w: [1, 0, 0, 1], c: 1 },
  { t: "35+ platforms & CMS: JW Marriott, Westin Pune", short: "JW Marriott · Westin", a: 2022.5, b: 2025.65, w: [0, 0, 1, 1] },
  { t: "SEO & Core Web Vitals: real estate + hospitality", short: "SEO & Core Web Vitals", a: 2022.5, b: 2025.65, w: [0, 0, 1, 0] },
  { t: "Liquid I.V. across Europe", short: "Liquid I.V. Europe", a: 2024.0, b: 2025.99, w: [1, 0, 1, 1], c: 2 },
  { t: "Wipro D2C modernization", short: "Wipro D2C", a: 2025.0, b: NOW, w: [1, 0, 0, 1], c: 3 },
  { t: "Magnum Ice Cream Canada relaunch", short: "Magnum Canada", a: 2025.0, b: 2025.99, w: [0, 1, 1, 1], c: 4 },
  { t: "Talenti Ice Cream Canada: market entry", short: "Talenti Canada", a: 2025.85, b: NOW, w: [0, 0, 1, 1] },
  { t: "Unilever: 10+ brands, one delivery framework", short: "Unilever portfolio", a: 2025.85, b: NOW, w: [0, 0, 0, 1] },
];

export type Phase = { t: string; a: number; b: number; r0: number; r1: number };

export const PHASES: Phase[] = [
  { t: "FREELANCE", a: 2018.0, b: 2020.95, r0: 0, r1: 0 },
  { t: "0TO1 MEDIA", a: 2020.95, b: 2022.45, r0: 1, r1: 3 },
  { t: "KNOWLEDGE UNITS", a: 2022.5, b: 2025.7, r0: 4, r1: 6 },
  { t: "LANGOOR", a: 2025.85, b: NOW, r0: 7, r1: 11 },
];

export type CasePoint = {
  row: number;
  n: string;
  phase: string;
  yr: string;
  title: string;
  client: string;
  disc: string;
  metric: string;
  metricLabel: string;
  url: string;
  s: [string, string, string];
};

export const CASES: CasePoint[] = [
  {
    row: 3,
    n: "01",
    phase: "0to1 Media",
    yr: "2020 – 2022",
    title: "Iterating Zebronics' campaign landing pages",
    client: "Zebronics, via 0to1 Media",
    disc: "GA4 · SEO · Conversion",
    metric: "+25%",
    metricLabel: "Engagement + shares (blended)",
    url: "/work/zebronics-campaign-pages",
    s: [
      "Campaign landing pages were being built and left alone, with no feedback loop from real user behavior back into design decisions.",
      "I set up a GA4-driven iteration cycle across 10+ landing pages, combining analytics with SEO best practices to find and fix the specific points where users were dropping off.",
      "A blended engagement-and-social-shares metric rose 25%, and the iteration process became the template for future campaign pages.",
    ],
  },
  {
    row: 4,
    n: "02",
    phase: "Knowledge Units",
    yr: "2022 – 2025",
    title: "Growing StoryNest, an AI storytelling platform",
    client: "Knowledge Units",
    disc: "Product Ownership · Growth · Prioritization",
    metric: "+50%",
    metricLabel: "Traffic growth",
    url: "/work/storynest-ai-platform",
    s: [
      "The backlog had more feature ideas than the team could ship, and it wasn't obvious which would actually move engagement.",
      "I ran workflow analysis on how users actually moved through the product, used it to reprioritize the roadmap around the highest-leverage features, and drove targeting decisions for where to invest next.",
      "Traffic grew 50% across 2022–2025, with a backlog that stayed prioritized against evidence instead of opinion.",
    ],
  },
  {
    row: 7,
    n: "03",
    phase: "Langoor",
    yr: "2024 – 2025",
    title: "Expanding Liquid I.V. across Europe",
    client: "Liquid I.V. (Unilever), via Langoor",
    disc: "Shopify Plus · Localization · D2C · Delivery",
    metric: "9",
    metricLabel: "Countries, one launch program",
    url: "/work/liquid-iv-europe-expansion",
    s: [
      "Liquid I.V. had no European D2C footprint. Launching market by market would have meant rebuilding the same storefront logic, checkout and content pipeline up to nine times.",
      "A hub-and-spoke architecture: liquid-iv.eu geo-routes to eight Shopify Plus storefronts (DE, ES, FR, IT, NL, SE, IS, IE). Design, translation and build for all nine sites ran in parallel against one launch window, and every store ships in its own language.",
      "Nine live storefronts from one coordinated program instead of nine, with a central hub that makes it straightforward to add the next country.",
    ],
  },
  {
    row: 8,
    n: "04",
    phase: "Langoor",
    yr: "2025 – Present",
    title: "Modernizing Wipro's D2C platforms",
    client: "Wipro Appliances & Wipro Consumer Lighting, via Langoor",
    disc: "D2C · Process Design · Stakeholder Alignment",
    metric: "+40%",
    metricLabel: "Handling capacity",
    url: "/work/wipro-d2c-modernization",
    s: [
      "Two related but separate D2C platforms were running on inconsistent delivery processes, which made support hard to scale and slowed down every new request.",
      "I partnered directly with Wipro stakeholders to design and standardize reusable delivery templates across both platforms, replacing ad hoc handling with a repeatable process.",
      "Request-handling capacity rose 40%, with a shared process both platform teams could actually rely on.",
    ],
  },
  {
    row: 9,
    n: "05",
    phase: "Langoor",
    yr: "2025",
    title: "Relaunching Magnum Ice Cream Canada",
    client: "Unilever, via Langoor",
    disc: "Shopify Plus · UX · Delivery",
    metric: "On time",
    metricLabel: "Hard launch date, zero slip",
    url: "/work/tmicc-shopify-relaunch",
    s: [
      "A full redevelopment and UX redesign, coordinated across onshore and offshore teams working different hours, on a hard launch date.",
      "I owned the end-to-end plan: sequencing design, build and QA against the date, tracking cross-time-zone dependencies, and keeping stakeholders aligned on scope and risk.",
      "Launched on schedule and stable, with a UX overhaul that improved the brand's positioning on the platform.",
    ],
  },
];

export const NAV = ["Intro", "Freelance", "Zebronics", "StoryNest", "Liquid I.V.", "Wipro", "Magnum", "Archive", "Four worlds", "Kick off"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const X = (y: number) => (y - 2018) * 10;
export const ZR = (r: number) => r * 3.2;
export const H = (r: number) => (ROWS[r].c != null ? 2.8 : 1.1);
export const fmt = (y: number) => {
  const yy = Math.floor(y);
  const m = Math.min(11, Math.max(0, Math.floor((y - yy) * 12)));
  return `${MONTHS[m]} ${yy}`;
};

export type Track = {
  name: string;
  mood: string;
  bpm: number;
  root: number;
  scale: number[];
  prog: number[];
  pad: OscillatorType;
  arp: OscillatorType;
  arpEvery: number;
  kick: boolean;
  cut: number;
};

export const TRACKS: Track[] = [
  { name: "Golden hour", mood: "Warm lo-fi pads", bpm: 72, root: 57, scale: [0, 3, 5, 7, 10], prog: [0, -4, -7, -2], pad: "triangle", arp: "sine", arpEvery: 2, kick: true, cut: 1800 },
  { name: "Night ride", mood: "Synthwave, headlights on", bpm: 100, root: 50, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, -4, -2, -5], pad: "sawtooth", arp: "square", arpEvery: 1, kick: true, cut: 1400 },
  { name: "Monsoon", mood: "Slow ambient drift", bpm: 60, root: 53, scale: [0, 2, 4, 6, 7, 9, 11], prog: [0, 2, -3, -1], pad: "sine", arp: "sine", arpEvery: 4, kick: false, cut: 2400 },
  { name: "Sprint", mood: "Upbeat, ship it", bpm: 118, root: 60, scale: [0, 2, 4, 7, 9], prog: [0, 5, -3, -5], pad: "triangle", arp: "square", arpEvery: 1, kick: true, cut: 2200 },
  { name: "Chai break", mood: "Soft bossa pluck", bpm: 84, root: 52, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 5, -2, 3], pad: "sine", arp: "triangle", arpEvery: 2, kick: false, cut: 2000 },
];

export const LOGOS = ["Unilever", "Wipro", "Reliance", "ITC", "JW Marriott", "Zebronics", "Bajaj"];
