// Per-project art direction (Sprint 01 §13) — reuses the site's existing
// brand palette tokens rather than introducing new colours, so each case
// study reads distinctly without the system fragmenting. Optional: data
// coming from the backend CMS may not have it yet, so every consumer
// falls back to a sensible default rather than assuming it's set.
export type CaseStudyTheme = "terracotta" | "sky" | "forest" | "orbit" | "moss";

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
  coverImage?: string;
  theme?: CaseStudyTheme;
  featured?: boolean;
  order?: number;
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
    coverImage: "/images/case-studies/tmicc-shopify-relaunch.webp",
    theme: "terracotta",
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
      "Traffic grew 50% across my time on the platform (2022–2025), with a backlog that stayed prioritized against evidence instead of opinion.",
    metric: { value: "+50%", label: "Traffic growth" },
    coverImage: "/images/case-studies/storynest-ai-platform.webp",
    theme: "sky",
  },
  {
    slug: "wipro-d2c-modernization",
    title: "Modernizing Wipro's D2C platforms",
    client: "Wipro Appliances & Wipro Consumer Lighting, via Langoor",
    timeframe: "2025 – Present",
    summary:
      "Standardized delivery templates across two direct-to-consumer platforms, letting the team take on 40% more incoming requests without a proportional increase in effort.",
    tags: ["D2C", "Process Design", "Stakeholder Alignment"],
    problem:
      "Two related but separate D2C platforms were running on inconsistent delivery processes, which made it hard to scale support and slowed down every new request.",
    approach:
      "I partnered directly with Wipro stakeholders to design and standardize reusable delivery templates across both platforms, replacing ad hoc handling with a repeatable process.",
    outcome:
      "Request-handling capacity — how many incoming requests the standardized process could absorb — increased by 40%, with a shared process both platform teams could actually rely on.",
    metric: { value: "+40%", label: "Handling capacity" },
    theme: "forest",
  },
  {
    slug: "liquid-iv-europe-expansion",
    title: "Expanding Liquid I.V. across Europe",
    client: "Liquid I.V. (Unilever), via Langoor",
    timeframe: "2024 – 2025",
    summary:
      "Took the #1 US hydration brand into Europe — one Shopify Plus hub routing to 8 fully localized country storefronts across 9 markets.",
    tags: ["Shopify Plus", "Localization", "D2C", "Delivery"],
    problem:
      "Liquid I.V. had no European D2C footprint. Launching market-by-market would have meant rebuilding the same storefront logic, checkout, and content pipeline up to nine times, with no shared source of truth and no consistent way to add a market later.",
    approach:
      "I planned and delivered a hub-and-spoke architecture instead: a single central site (liquid-iv.eu) that geo-routes visitors to their market, sitting in front of eight independent Shopify Plus storefronts — Germany, Spain, France, Italy, the Netherlands, Sweden, Iceland, and Ireland. I owned the delivery plan across design, translation, and build for all nine sites in parallel, sequencing full-content localization (not just currency and shipping — every storefront ships in its own language) against a shared launch window, and coordinating with translation and regional stakeholders so each market's site was genuinely native, not machine-translated boilerplate.",
    outcome:
      "Nine live storefronts launched from one coordinated program instead of nine separate ones, each fully localized in its market's language, with a central hub that makes it straightforward to add the next country.",
    metric: { value: "9", label: "Countries, one launch program" },
    coverImage: "/images/case-studies/liquid-iv-europe-expansion.webp",
    theme: "orbit",
  },
  {
    slug: "zebronics-campaign-pages",
    title: "Iterating Zebronics' campaign landing pages",
    client: "Zebronics, via 0to1 Media",
    timeframe: "2020 – 2022",
    summary:
      "Used GA4 data to iterate 10+ campaign landing pages, lifting a combined engagement-and-shares metric by 25%.",
    tags: ["GA4", "SEO", "Conversion"],
    problem:
      "Campaign landing pages were being built and left alone — no feedback loop from real user behavior back into design decisions.",
    approach:
      "I set up a GA4-driven iteration cycle across 10+ landing pages, combining analytics with SEO best practices to find and fix the specific points where users were dropping off.",
    outcome:
      "A blended engagement-and-social-shares metric rose 25%, and the iteration process became the template for future campaign pages.",
    metric: { value: "+25%", label: "Engagement + shares (blended)" },
    theme: "moss",
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function getCaseStudies(): Promise<CaseStudy[]> {
  try {
    const res = await fetch(`${API_URL}/api/case-studies`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return caseStudies;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return caseStudies;
  } catch {
    return caseStudies;
  }
}

export async function getCaseStudyBySlug(slug: string): Promise<CaseStudy | undefined> {
  try {
    const res = await fetch(`${API_URL}/api/case-studies/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return caseStudies.find((c) => c.slug === slug);
    }
    const data = await res.json();
    if (data && !data.error) {
      return data;
    }
    return caseStudies.find((c) => c.slug === slug);
  } catch {
    return caseStudies.find((c) => c.slug === slug);
  }
}
