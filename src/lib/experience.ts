export type ExperienceEntry = {
  role: string;
  company: string;
  period: string;
  bullets: string[];
};

export const experience: ExperienceEntry[] = [
  {
    role: "Project Manager",
    company: "Langoor",
    period: "Nov 2025 – Present",
    bullets: [
      "Manage end-to-end project plans for Unilever's global brand portfolio across multiple geographies using MS Planner and MS Teams, tracking tasks, dependencies, and delivery health.",
      "Led the end-to-end redevelopment and UX redesign of the Magnum Ice Cream Canada (TMICC) Shopify website, coordinating onshore and offshore teams to a stable, on-schedule launch.",
      "Built process maps and delivery workflows in MS Visio to give stakeholders clear visibility into dependencies and progress.",
      "Partnered with Wipro stakeholders to modernize D2C platforms for Wipro Appliances and Wipro Consumer Lighting, standardizing reusable delivery templates that increased user handling capacity by 40%.",
      "Enabled Talenti Ice Cream Canada's digital market entry by defining technical scope and coordinating execution across time zones.",
      "Facilitate cross-team collaboration via MS Teams and MS Loop across a unified delivery framework for 10+ Unilever brands.",
    ],
  },
  {
    role: "Project Manager & Sr. Web Developer",
    company: "Knowledge Units",
    period: "Jul 2022 – Aug 2025",
    bullets: [
      "Directed the product ownership lifecycle for StoryNest, an AI-powered storytelling platform, driving a 50% traffic increase through workflow analysis and feature prioritization.",
      "Delivered 35+ enterprise-grade digital platforms and CMS solutions for luxury hospitality leaders including JW Marriott and Westin Pune, maintaining a 99% on-time delivery rate.",
      "Analyzed operational bottlenecks and instituted structured sprint planning and SOPs using Jira and Azure DevOps.",
      "Optimized SEO and web performance for real estate and hospitality portals, improving Core Web Vitals scores.",
      "Developed a comprehensive onboarding playbook and process documentation for technical teams.",
    ],
  },
  {
    role: "CMS Developer & Project Lead",
    company: "0to1 Media",
    period: "Dec 2020 – May 2022",
    bullets: [
      "Spearheaded CMS and e-commerce platform development for Reliance Industries, Zebronics, and Bajaj Electronics, improving mobile conversion rates.",
      "Iterated 10+ campaign landing pages for Zebronics using GA4 data insights and SEO best practices, boosting engagement and social shares by 25%.",
      "Collaborated with design and content teams to ensure consistent brand messaging across high-traffic touchpoints.",
      "Mentored a team of 5 junior developers on structured coding workflows and CI/CD pipelines.",
    ],
  },
  {
    role: "Freelance Web Developer & Project Consultant",
    company: "Self-employed",
    period: "2018 – Dec 2020",
    bullets: [
      "Delivered 15+ complex client projects for ITC, Anchor, and MSI India, focusing on high-performance architecture and long-term maintainability.",
      "Functioned as an end-to-end product owner across diverse digital initiatives, from discovery and scope definition through launch and post-launch iteration.",
    ],
  },
];

export const certifications: string[] = [
  "Agile Project Management — Udemy",
  "Google Digital Marketing Certification",
  "DevOps Essentials — Linux Academy",
  "Prompt Engineering — freeCodeCamp",
  "Python Fundamentals — Scaler",
  "Fundamentals of Project Management — Great Learning Academy",
  "LinkedIn Marketing Solutions Fundamentals",
];
