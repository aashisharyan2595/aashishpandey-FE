// Shared between the Work index and case-study pages: the flagship-project
// display order and each project's role/organization line, both authored in
// the source design's own case data (not present in case-studies.ts's
// schema) — kept here rather than duplicated per page.
export const DISPLAY_ORDER = [
  "liquid-iv-europe-expansion",
  "wipro-d2c-modernization",
  "tmicc-shopify-relaunch",
  "storynest-ai-platform",
  "zebronics-campaign-pages",
];

export const ROLE_BY_SLUG: Record<string, string> = {
  "liquid-iv-europe-expansion": "Project Manager, Langoor",
  "wipro-d2c-modernization": "Project Manager, Langoor",
  "tmicc-shopify-relaunch": "Project Manager, Langoor",
  "storynest-ai-platform": "Project Manager & Senior Web Developer, Knowledge Units",
  "zebronics-campaign-pages": "CMS Developer & Project Lead, 0to1 Media",
};
