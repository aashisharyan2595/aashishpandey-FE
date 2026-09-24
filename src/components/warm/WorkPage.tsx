import Link from "next/link";
import SiteFooter from "@/components/warm/SiteFooter";
import SiteFx from "@/components/warm/SiteFx";
import SiteHeader from "@/components/warm/SiteHeader";
import WarmBody from "@/components/warm/WarmBody";
import styles from "@/components/warm/warm.module.css";
import { DISPLAY_ORDER } from "@/components/warm/work-data";
import type { CaseStudy } from "@/lib/case-studies";

const ARCHIVE: [string, string, string][] = [
  ["Unilever: one delivery framework, 10+ brands", "Langoor · Liquid I.V., Lipton, Magnum, Talenti · NA, EMEA, APAC", "2025 – now"],
  ["Talenti Ice Cream Canada: market entry", "Langoor", "2025 – now"],
  ["Wipro D2C modernization", "Langoor", "2025 – now"],
  ["Magnum Ice Cream Canada relaunch", "Langoor", "2025"],
  ["Liquid I.V. across Europe", "Langoor", "2024 – 2025"],
  ["35+ enterprise platforms & CMS", "Knowledge Units · JW Marriott, Westin Pune", "2022 – 2025"],
  ["StoryNest AI platform", "Knowledge Units", "2022 – 2025"],
  ["SEO & Core Web Vitals program", "Knowledge Units · real estate + hospitality", "2022 – 2025"],
  ["Technical onboarding playbook", "Knowledge Units", "2023"],
  ["Reliance Industries: CMS & e-commerce", "0to1 Media", "2020 – 2022"],
  ["Bajaj Electronics: CMS & e-commerce", "0to1 Media", "2020 – 2022"],
  ["Zebronics campaign pages", "0to1 Media", "2020 – 2022"],
  ["15+ production web systems", "Freelance · ITC, Anchor, MSI India", "2018 – 2020"],
];

export default function WorkPage({ caseStudies }: { caseStudies: CaseStudy[] }) {
  const ordered = [...caseStudies].sort((a, b) => DISPLAY_ORDER.indexOf(a.slug) - DISPLAY_ORDER.indexOf(b.slug));

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
      <SiteFx scene="work" />
      <SiteHeader />

      <main
        style={{
          padding: "clamp(110px,14vh,150px) clamp(16px,5vw,72px) clamp(64px,8vw,110px)",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(48px,7vw,96px)",
          maxWidth: 1360,
          margin: "0 auto",
        }}
      >
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "24px 56px", alignItems: "end" }}>
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(72px,13vw,210px)", lineHeight: 0.8, letterSpacing: "-.045em" }}>
            Work<span style={{ color: "#e8773a" }}>.</span>
          </h1>
          <p style={{ margin: 0, maxWidth: 520, fontSize: "clamp(18px,1.6vw,22px)", lineHeight: 1.45 }}>
            Five programs that show how I plan and ship: constraints formalized, dependencies mapped, teams across
            time zones kept on one date. Plus 35+ more in the archive.
          </p>
        </section>

        <section aria-label="Selected work" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {ordered.map((c, i) => (
            <Link
              key={c.slug}
              href={`/work/${c.slug}`}
              className={styles.workCard}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))",
                gap: "18px 32px",
                alignItems: "center",
                padding: "clamp(18px,2.4vw,30px)",
                borderRadius: 24,
                background: "rgba(251,243,228,.94)",
                border: "1px solid rgba(23,27,46,.08)",
                boxShadow: "0 24px 50px -34px rgba(23,27,46,.55)",
                textDecoration: "none",
                color: "#171b2e",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                    color: "#5e6478",
                  }}
                >
                  <span style={{ color: "#e8773a", fontWeight: 600 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span>{c.client.split(",")[0]}</span>
                  <span>{c.timeframe}</span>
                </div>
                <h2 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(28px,3.2vw,46px)", lineHeight: 0.95, letterSpacing: "-.025em" }}>{c.title}</h2>
                <span style={{ fontSize: 15, color: "#5e6478" }}>{c.tags.join(" · ")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: "clamp(52px,6vw,88px)", lineHeight: 0.82, color: "#e8773a", letterSpacing: "-.035em" }}>
                    {c.metric.value}
                  </span>
                  <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em" }}>
                    {c.metric.label}
                  </span>
                </div>
                <span
                  aria-hidden="true"
                  style={{
                    flex: "none",
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background: "#171b2e",
                    color: "#fbf3e4",
                    fontSize: 20,
                  }}
                >
                  ↗
                </span>
              </div>
            </Link>
          ))}
        </section>

        <section aria-labelledby="arch" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 10 }}>
            <h2 id="arch" style={{ margin: 0, fontWeight: 800, fontSize: "clamp(40px,5vw,72px)", lineHeight: 0.85, letterSpacing: "-.035em" }}>
              The archive
            </h2>
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", color: "#5e6478" }}>
              2018 – now · 35+ platforms
            </span>
          </div>
          <ol style={{ listStyle: "none", margin: 0, padding: 0, borderTop: "1px solid rgba(23,27,46,.16)" }}>
            {ARCHIVE.map(([t, org, yr]) => (
              <li
                key={t}
                className={styles.archiveRow}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: "6px 24px",
                  alignItems: "baseline",
                  padding: "16px 4px",
                  borderBottom: "1px solid rgba(23,27,46,.12)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: "clamp(17px,1.6vw,21px)" }}>{t}</span>
                  <span style={{ fontSize: 14, color: "#5e6478" }}>{org}</span>
                </div>
                <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, whiteSpace: "nowrap" }}>{yr}</span>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
