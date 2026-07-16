export type CaseStudy = {
  slug: string;
  title: string;
  client: string;
  timeframe: string;
  summary: string;
  tags: string[];
  problem: string;
  approach: string;
  outcome: string;
  metric: { value: string; label: string };
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "tmicc-shopify-relaunch",
    title: "Relaunching Magnum Ice Cream Canada",
    client: "Unilever, via Langoor",
    timeframe: "2025",
    summary:
      "End-to-end redevelopment and UX redesign of a Shopify storefront for a global ice cream brand.",
    tags: ["Shopify Plus", "UX", "Delivery"],
    problem:
      "The Magnum Ice Cream Canada site needed a full redevelopment and UX redesign, coordinated across onshore and offshore teams working different hours, on a hard launch date.",
    approach:
      "I owned the end-to-end project plan — sequencing design, build, and QA against the launch date, tracking dependencies between teams in different time zones, and keeping stakeholders aligned on scope and risk as the build progressed.",
    outcome:
      "The site launched on schedule and stable, with a UX overhaul that improved the brand's positioning on the platform.",
    metric: { value: "On time", label: "Hard launch date, zero slip" },
  },
  {
    slug: "storynest-ai-platform",
    title: "Growing StoryNest, an AI storytelling platform",
    client: "Knowledge Units",
    timeframe: "2022 – 2025",
    summary:
      "Owned the product lifecycle for an AI-powered storytelling platform, driving a 50% increase in traffic.",
    tags: ["Product Ownership", "Growth", "Prioritization"],
    problem:
      "StoryNest needed clearer prioritization — the backlog had more feature ideas than the team could ship, and it wasn't obvious which would actually move engagement.",
    approach:
      "I ran workflow analysis on how users actually moved through the product, used that to reprioritize the roadmap around the highest-leverage features, and drove strategic targeting decisions for where to invest next.",
    outcome:
      "Traffic grew 50% over the engagement, with a backlog that stayed prioritized against evidence instead of opinion.",
    metric: { value: "+50%", label: "Traffic growth" },
  },
  {
    slug: "wipro-d2c-modernization",
    title: "Modernizing Wipro's D2C platforms",
    client: "Wipro Appliances & Wipro Consumer Lighting, via Langoor",
    timeframe: "2025 – Present",
    summary:
      "Standardized delivery templates across two direct-to-consumer platforms, increasing user handling capacity by 40%.",
    tags: ["D2C", "Process Design", "Stakeholder Alignment"],
    problem:
      "Two related but separate D2C platforms were running on inconsistent delivery processes, which made it hard to scale support and slowed down every new request.",
    approach:
      "I partnered directly with Wipro stakeholders to design and standardize reusable delivery templates across both platforms, replacing ad hoc handling with a repeatable process.",
    outcome:
      "User handling capacity increased by 40%, with a shared process both platform teams could actually rely on.",
    metric: { value: "+40%", label: "Handling capacity" },
  },
  {
    slug: "zebronics-campaign-pages",
    title: "Iterating Zebronics' campaign landing pages",
    client: "Zebronics, via 0to1 Media",
    timeframe: "2020 – 2022",
    summary:
      "Used GA4 data to iterate 10+ campaign landing pages, lifting engagement and social shares by 25%.",
    tags: ["GA4", "SEO", "Conversion"],
    problem:
      "Campaign landing pages were being built and left alone — no feedback loop from real user behavior back into design decisions.",
    approach:
      "I set up a GA4-driven iteration cycle across 10+ landing pages, combining analytics with SEO best practices to find and fix the specific points where users were dropping off.",
    outcome:
      "User engagement and social shares rose 25%, and the iteration process became the template for future campaign pages.",
    metric: { value: "+25%", label: "Engagement & shares" },
  },
];

export function getCaseStudies(): CaseStudy[] {
  return caseStudies;
}

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return caseStudies.find((c) => c.slug === slug);
}
