// Shared data model for "The Operating Field" — the conceptual spine of the
// rebuild. Every relationship here is derived from real project data
// (case-studies.ts tags, summaries, outcomes) rather than invented. This
// file is the single source of truth consumed by the Field visualization,
// the homepage discovery module, the "What I Move" services page, and the
// "What are you trying to move?" problem-based entry point — so a project's
// real disciplines/services stay consistent everywhere it's referenced.

export type FieldStageKey = "brief" | "align" | "design" | "build" | "launch" | "learn";

export type FieldStage = {
  key: FieldStageKey;
  label: string;
  detail: string;
};

// BRIEF -> ALIGN -> DESIGN -> BUILD -> LAUNCH -> LEARN — how complex digital
// work actually moves, per the positioning statement. Each stage description
// is written from the real pattern across the five case studies, not generic
// agency-process copy.
export const stages: FieldStage[] = [
  {
    key: "brief",
    label: "Brief",
    detail: "The ask arrives with real constraints attached — a hard launch date, a fragmented process, a backlog with no evidence behind it.",
  },
  {
    key: "align",
    label: "Align",
    detail: "Stakeholders across time zones, teams, and disciplines get pointed at the same plan before anyone opens a design file.",
  },
  {
    key: "design",
    label: "Design",
    detail: "The UX, the architecture, the delivery template — designed together, not handed off in sequence.",
  },
  {
    key: "build",
    label: "Build",
    detail: "Onshore and offshore teams build in parallel against a tracked plan, with risk surfaced before it becomes a slip.",
  },
  {
    key: "launch",
    label: "Launch",
    detail: "Nine storefronts. One hard date. Zero slip. Launch is the proof, not the finish line.",
  },
  {
    key: "learn",
    label: "Learn",
    detail: "GA4 data, traffic curves, and handling-capacity numbers feed straight back into the next brief.",
  },
];

export type WorldKey = "product" | "design" | "technology" | "delivery";

export type World = {
  key: WorldKey;
  label: string;
  detail: string;
  caseStudySlugs: string[];
};

// The four worlds this role sits between, each linked to the real case
// studies that demonstrate it (not every project touches every world).
export const worlds: World[] = [
  {
    key: "product",
    label: "Product",
    detail: "Owning outcomes and prioritizing roadmaps against evidence — StoryNest's traffic growth, Wipro's D2C process redesign.",
    caseStudySlugs: ["storynest-ai-platform", "wipro-d2c-modernization"],
  },
  {
    key: "design",
    label: "Design",
    detail: "Design-literate enough to work directly in Figma and own a UX redesign end to end, not just review one.",
    caseStudySlugs: ["tmicc-shopify-relaunch"],
  },
  {
    key: "technology",
    label: "Technology",
    detail: "Hands-on with CMS architecture, Shopify Plus, and CI/CD — enough to open the codebase when a project needs it.",
    caseStudySlugs: ["tmicc-shopify-relaunch", "liquid-iv-europe-expansion"],
  },
  {
    key: "delivery",
    label: "Delivery",
    detail: "Agile/Scrum, stakeholder alignment, and process design — the throughline across every role.",
    caseStudySlugs: ["tmicc-shopify-relaunch", "wipro-d2c-modernization", "liquid-iv-europe-expansion"],
  },
];

export type ServiceKey =
  | "digital-product"
  | "program-delivery"
  | "d2c-commerce"
  | "technical-delivery"
  | "experience-design"
  | "growth-optimization";

export type Service = {
  key: ServiceKey;
  label: string;
  detail: string;
  caseStudySlugs: string[];
};

// "What I Move" — every category here maps to at least one real case study.
// No service is listed without proof directly attached.
export const services: Service[] = [
  {
    key: "digital-product",
    label: "Digital Product",
    detail: "Prioritizing a roadmap against real usage evidence instead of opinion, and owning the outcome, not just the backlog.",
    caseStudySlugs: ["storynest-ai-platform"],
  },
  {
    key: "program-delivery",
    label: "Project & Program Delivery",
    detail: "Sequencing design, build, and QA across onshore/offshore teams against a hard date, with risk tracked before it slips.",
    caseStudySlugs: ["tmicc-shopify-relaunch", "wipro-d2c-modernization", "liquid-iv-europe-expansion"],
  },
  {
    key: "d2c-commerce",
    label: "D2C & Commerce",
    detail: "Shopify Plus storefronts built and launched for direct-to-consumer brands, from single-market to multi-country.",
    caseStudySlugs: ["tmicc-shopify-relaunch", "liquid-iv-europe-expansion", "wipro-d2c-modernization"],
  },
  {
    key: "technical-delivery",
    label: "Technical Delivery",
    detail: "Hands-on enough with the codebase, CMS, and CI/CD to plan a technical build realistically, not just schedule one.",
    caseStudySlugs: ["tmicc-shopify-relaunch", "liquid-iv-europe-expansion"],
  },
  {
    key: "experience-design",
    label: "Experience & Design",
    detail: "Owning a UX redesign end to end, working directly in the design file rather than reviewing someone else's.",
    caseStudySlugs: ["tmicc-shopify-relaunch"],
  },
  {
    key: "growth-optimization",
    label: "Growth & Optimization",
    detail: "GA4-driven iteration cycles that turn analytics into specific fixes, measured by what actually moved.",
    caseStudySlugs: ["storynest-ai-platform", "zebronics-campaign-pages"],
  },
];

export type IntentKey = "launch" | "scale" | "build" | "optimize" | "hire" | "hello";

export type Intent = {
  key: IntentKey;
  label: string;
  detail: string;
  serviceKeys: ServiceKey[];
  caseStudySlugs: string[];
};

// "What are you trying to move?" — the problem-based entry point. Each
// intent surfaces the services and case studies that genuinely answer it.
export const intents: Intent[] = [
  {
    key: "launch",
    label: "Launch",
    detail: "Get something real out the door on a fixed date.",
    serviceKeys: ["program-delivery", "d2c-commerce"],
    caseStudySlugs: ["tmicc-shopify-relaunch", "liquid-iv-europe-expansion"],
  },
  {
    key: "scale",
    label: "Scale",
    detail: "Take one working thing into many markets or much more volume.",
    serviceKeys: ["d2c-commerce", "program-delivery"],
    caseStudySlugs: ["liquid-iv-europe-expansion", "wipro-d2c-modernization"],
  },
  {
    key: "build",
    label: "Build",
    detail: "Turn a brief into a working, technical thing.",
    serviceKeys: ["technical-delivery", "d2c-commerce"],
    caseStudySlugs: ["tmicc-shopify-relaunch", "liquid-iv-europe-expansion"],
  },
  {
    key: "optimize",
    label: "Optimize",
    detail: "Make something that already exists perform better.",
    serviceKeys: ["growth-optimization", "digital-product"],
    caseStudySlugs: ["storynest-ai-platform", "zebronics-campaign-pages"],
  },
  {
    key: "hire",
    label: "Hire me",
    detail: "Looking for a full-time or contract delivery lead.",
    serviceKeys: [],
    caseStudySlugs: [],
  },
  {
    key: "hello",
    label: "Just say hello",
    detail: "No brief yet — just want to connect.",
    serviceKeys: [],
    caseStudySlugs: [],
  },
];
