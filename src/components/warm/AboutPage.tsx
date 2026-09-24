import SiteFooter from "@/components/warm/SiteFooter";
import SiteFx from "@/components/warm/SiteFx";
import SiteHeader from "@/components/warm/SiteHeader";
import WarmBody from "@/components/warm/WarmBody";
import styles from "@/components/warm/warm.module.css";

const ROLES = [
  {
    org: "Langoor (LS Digital Group)",
    role: "Project Manager",
    when: "Nov 2025 – Present",
    pts: [
      "Architect a multi-brand, multi-geography delivery framework for 10+ Unilever brands (Liquid I.V., Lipton, Magnum, Talenti) across NA, EMEA and APAC, with explicit dependency graphs.",
      "Coordinate distributed teams in 4+ time zones on standardized Agile workflows and automation.",
      "Led the end-to-end redevelopment and UX redesign of Magnum Ice Cream Canada on Shopify.",
      "Modernized Wipro D2C platforms: +40% concurrent user handling capacity.",
      "Enabled Talenti Ice Cream Canada's digital market entry.",
    ],
  },
  {
    org: "Knowledge Units",
    role: "Project Manager & Senior Web Developer",
    when: "Jul 2022 – Aug 2025",
    pts: [
      "Owned product strategy for StoryNest, an AI storytelling platform: +50% traffic through structured experimentation.",
      "Delivered 35+ enterprise platforms for JW Marriott, Westin Pune and other hospitality leaders at 99% on time.",
      "Authored Python and shell scripts for build automation and pre-deploy verification; standardized GitHub Actions and Docker environments.",
      "Wrote the technical onboarding playbook: decomposition patterns, verification checklists, ADRs.",
    ],
  },
  {
    org: "0to1 Media",
    role: "CMS Developer & Project Lead",
    when: "Dec 2020 – May 2022",
    pts: [
      "Built and led CMS and e-commerce platforms for Reliance Industries, Zebronics and Bajaj Electronics.",
      "10+ Zebronics campaign pages: +25% engagement and social shares.",
      "Mentored a team of 5 engineers on structured problem decomposition; reduced post-launch defects.",
    ],
  },
  {
    org: "Freelance",
    role: "Web Developer & Project Consultant",
    when: "2018 – Dec 2020",
    pts: [
      "Scoped and delivered 15+ production web systems for ITC, Anchor and MSI India.",
      "End-to-end product owner: discovery, specs with acceptance criteria, architecture, build and iteration.",
    ],
  },
];

const SKILLS: { k: string; v: string[] }[] = [
  { k: "Planning & operations", v: ["Resource allocation", "Capacity planning", "Dependency mapping", "Release planning", "Risk modeling", "MVP definition", "Roadmaps"] },
  { k: "Problem decomposition", v: ["Task breakdown", "Sub-workstreams", "Acceptance criteria", "Verification & validation", "Trade-offs"] },
  { k: "Technical stack", v: ["Python", "Docker", "GitHub Actions", "Git", "Linux CLI", "REST APIs", "SQL"] },
  { k: "PM frameworks", v: ["Agile/Scrum", "Kanban", "Jira", "Azure DevOps", "Sprint planning", "SOPs"] },
  { k: "Data & experimentation", v: ["GA4", "GTM", "A/B testing", "Funnel analysis", "KPI design", "Core Web Vitals"] },
  { k: "AI & modern tooling", v: ["Prompt engineering", "AI platform delivery", "LLM workflows", "Structured outputs"] },
  { k: "Platforms", v: ["Shopify Plus", "AEM", "Webflow", "WordPress", "Headless CMS", "D2C"] },
  { k: "Leadership", v: ["Executive communication", "Vendor negotiation", "Multi-geo teams", "Client collaboration"] },
];

const CERTS = [
  { k: "Technical", v: "Python Fundamentals (Scaler) · DevOps Essentials (Linux Academy) · Prompt Engineering (freeCodeCamp)" },
  { k: "Project management", v: "Agile Project Management (Udemy) · Fundamentals of Project Management (Great Learning)" },
  { k: "Marketing & analytics", v: "Google Digital Marketing · LinkedIn Marketing Solutions Fundamentals" },
];

const monoLabel: React.CSSProperties = {
  fontFamily: "var(--font-ibm-plex-mono), monospace",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: ".05em",
  color: "#5e6478",
};

const cardStyle: React.CSSProperties = {
  padding: "clamp(20px,2.6vw,32px)",
  borderRadius: 24,
  background: "rgba(251,243,228,.94)",
  border: "1px solid rgba(23,27,46,.08)",
  boxShadow: "0 24px 50px -36px rgba(23,27,46,.55)",
};

export default function AboutPage() {
  return (
    <div
      style={{
        margin: 0,
        color: "#171b2e",
        fontFamily: "var(--font-bricolage), Helvetica, Arial, sans-serif",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      <WarmBody />
      <SiteFx scene="about" />
      <SiteHeader />

      <main
        style={{
          padding: "clamp(110px,14vh,150px) clamp(16px,5vw,72px) clamp(64px,8vw,110px)",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(56px,8vw,110px)",
          maxWidth: 1360,
          margin: "0 auto",
        }}
      >
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "28px 64px", alignItems: "end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <span style={monoLabel}>Project Manager · Planning &amp; Operations · Pune</span>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(60px,10vw,168px)", lineHeight: 0.82, letterSpacing: "-.045em" }}>
              Plans that
              <br />
              <span style={{ color: "#e8773a" }}>actually ship.</span>
            </h1>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ margin: 0, fontSize: "clamp(18px,1.6vw,22px)", lineHeight: 1.5 }}>
              I&apos;ve spent 6+ years designing and shipping complex, constraint-rich digital systems for Fortune 500
              brands: Unilever, Wipro, Reliance, ITC. I formalize requirements as constraints and dependencies, break
              ambiguous goals into verifiable workstreams, and keep distributed teams moving to one date.
            </p>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5, color: "#3d4258" }}>
              I started as a developer, so I still write the Python validation scripts, Docker environments and
              CI/CD gates that keep delivery honest.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              <a
                href="/assets/Aashish-Pandey-Resume.docx"
                download
                className={styles.pillPrimary}
                style={{ padding: "13px 18px", borderRadius: 999, background: "#171b2e", color: "#fbf3e4", fontWeight: 700, textDecoration: "none" }}
              >
                Download résumé ↓
              </a>
              <a
                href="https://linkedin.com/in/aashish-kumar-pandey"
                className={styles.pillOutline}
                style={{ padding: "13px 18px", borderRadius: 999, border: "1px solid rgba(23,27,46,.2)", fontWeight: 700, textDecoration: "none", color: "#171b2e" }}
              >
                LinkedIn ↗
              </a>
            </div>
          </div>
        </section>

        <section aria-labelledby="exp" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <h2 id="exp" style={{ margin: 0, fontWeight: 800, fontSize: "clamp(40px,5vw,72px)", lineHeight: 0.85, letterSpacing: "-.035em" }}>
            Experience
          </h2>
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            {ROLES.map((r) => (
              <li key={r.org} style={{ ...cardStyle, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: "16px 48px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ ...monoLabel, color: "#e8773a", fontWeight: 600 }}>{r.when}</span>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(26px,2.6vw,36px)", lineHeight: 0.95, letterSpacing: "-.02em" }}>{r.org}</h3>
                  <span style={{ fontSize: 16, color: "#5e6478" }}>{r.role}</span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {r.pts.map((p) => (
                    <li key={p} style={{ display: "grid", gridTemplateColumns: "14px minmax(0,1fr)", gap: 10, fontSize: 16, lineHeight: 1.5 }}>
                      <span style={{ width: 7, height: 7, marginTop: 9, background: "#e8773a", transform: "rotate(45deg)" }} />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="sk" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <h2 id="sk" style={{ margin: 0, fontWeight: 800, fontSize: "clamp(40px,5vw,72px)", lineHeight: 0.85, letterSpacing: "-.035em" }}>
            Skills
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 14 }}>
            {SKILLS.map((s) => (
              <div
                key={s.k}
                className={styles.skillCard}
                style={{ padding: 22, borderRadius: 20, background: "rgba(251,243,228,.94)", border: "1px solid rgba(23,27,46,.08)", display: "flex", flexDirection: "column", gap: 14 }}
              >
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: 20, letterSpacing: "-.01em" }}>{s.k}</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {s.v.map((t) => (
                    <span key={t} style={{ fontSize: 14, padding: "6px 10px", borderRadius: 999, background: "rgba(23,27,46,.06)" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))", gap: 14 }}>
          <div style={{ padding: "clamp(22px,2.6vw,32px)", borderRadius: 24, background: "#171b2e", color: "#f6ead6", display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(34px,3.6vw,52px)", lineHeight: 0.88, letterSpacing: "-.03em" }}>Certifications</h2>
            {CERTS.map((c) => (
              <div key={c.k} style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 12, borderTop: "1px solid rgba(246,234,214,.14)" }}>
                <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", color: "#f4b24a" }}>{c.k}</span>
                <span style={{ fontSize: 16, lineHeight: 1.45 }}>{c.v}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "clamp(22px,2.6vw,32px)", borderRadius: 24, background: "rgba(251,243,228,.94)", border: "1px solid rgba(23,27,46,.08)", display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(34px,3.6vw,52px)", lineHeight: 0.88, letterSpacing: "-.03em" }}>Education</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 12, borderTop: "1px solid rgba(23,27,46,.12)" }}>
              <span style={monoLabel}>2015 – 2019</span>
              <span style={{ fontSize: 17, fontWeight: 600 }}>Bachelor of Engineering (discontinued)</span>
              <span style={{ fontSize: 15, color: "#5e6478" }}>Pune University</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 12, borderTop: "1px solid rgba(23,27,46,.12)" }}>
              <span style={monoLabel}>2015</span>
              <span style={{ fontSize: 17, fontWeight: 600 }}>Higher Secondary Certificate</span>
              <span style={{ fontSize: 15, color: "#5e6478" }}>Sudhir Memorial School, Kolkata</span>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
