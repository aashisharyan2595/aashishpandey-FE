import Link from "next/link";
import SiteFooter from "@/components/warm/SiteFooter";
import SiteFx from "@/components/warm/SiteFx";
import SiteHeader from "@/components/warm/SiteHeader";
import WarmBody from "@/components/warm/WarmBody";
import styles from "@/components/warm/warm.module.css";
import { ROLE_BY_SLUG } from "@/components/warm/work-data";
import type { CaseStudy } from "@/lib/case-studies";

const SECTIONS = [
  { key: "problem" as const, label: "Context" },
  { key: "approach" as const, label: "The response" },
  { key: "outcome" as const, label: "The evidence" },
];

export default function WorkCasePage({
  item,
  index,
  total,
  next,
}: {
  item: CaseStudy;
  index: number;
  total: number;
  next: CaseStudy;
}) {
  const role = ROLE_BY_SLUG[item.slug] ?? item.tags[0];

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
          gap: "clamp(40px,6vw,80px)",
          maxWidth: 1180,
          margin: "0 auto",
        }}
      >
        <Link
          href="/work"
          className={styles.pillOutline}
          style={{
            alignSelf: "flex-start",
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: ".05em",
            padding: "9px 14px",
            borderRadius: 999,
            border: "1px solid rgba(23,27,46,.2)",
            textDecoration: "none",
            color: "#171b2e",
          }}
        >
          ← All work
        </Link>

        <header style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: ".05em",
              color: "#5e6478",
            }}
          >
            <span style={{ color: "#e8773a", fontWeight: 600 }}>
              Case {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            <span>{item.client}</span>
            <span>{item.timeframe}</span>
          </div>
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(46px,7.5vw,120px)", lineHeight: 0.86, letterSpacing: "-.035em" }}>{item.title}</h1>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: 14, marginTop: 10 }}>
            <div style={{ padding: 20, borderRadius: 20, background: "#171b2e", color: "#fbf3e4", display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: "clamp(56px,7vw,96px)", lineHeight: 0.82, color: "#f4b24a", letterSpacing: "-.035em" }}>
                {item.metric.value}
              </span>
              <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em" }}>
                {item.metric.label}
              </span>
            </div>
            <div style={{ padding: 20, borderRadius: 20, background: "rgba(251,243,228,.94)", border: "1px solid rgba(23,27,46,.08)", display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", color: "#5e6478" }}>
                Disciplines
              </span>
              <span style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.3 }}>{item.tags.join(" · ")}</span>
            </div>
            <div style={{ padding: 20, borderRadius: 20, background: "rgba(251,243,228,.94)", border: "1px solid rgba(23,27,46,.08)", display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", color: "#5e6478" }}>
                Role
              </span>
              <span style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.3 }}>{role}</span>
            </div>
          </div>
        </header>

        <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid rgba(23,27,46,.16)" }}>
          {SECTIONS.map((s, i) => (
            <section
              key={s.key}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))",
                gap: "12px 48px",
                padding: "clamp(28px,4vw,48px) 0",
                borderBottom: "1px solid rgba(23,27,46,.12)",
              }}
            >
              <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "#e8773a", fontWeight: 600 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(30px,3.4vw,48px)", lineHeight: 0.9, letterSpacing: "-.025em" }}>{s.label}</h2>
              </div>
              <p style={{ margin: 0, fontSize: "clamp(18px,1.6vw,22px)", lineHeight: 1.55, maxWidth: 640 }}>{item[s.key]}</p>
            </section>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 14 }}>
          <a
            href={`mailto:aashishpandey406@gmail.com?subject=${encodeURIComponent("Re: " + item.title)}`}
            style={{ padding: 24, borderRadius: 22, background: "#e8773a", color: "#171b2e", display: "flex", flexDirection: "column", gap: 8, textDecoration: "none" }}
          >
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Similar problem?
            </span>
            <span style={{ fontWeight: 800, fontSize: "clamp(24px,2.6vw,34px)", letterSpacing: "-.02em" }}>Talk it through →</span>
          </a>
          <Link
            href={`/work/${next.slug}`}
            style={{ padding: 24, borderRadius: 22, background: "rgba(251,243,228,.94)", border: "1px solid rgba(23,27,46,.08)", display: "flex", flexDirection: "column", gap: 8, textDecoration: "none", color: "#171b2e" }}
          >
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", color: "#5e6478" }}>
              Next case
            </span>
            <span style={{ fontWeight: 800, fontSize: "clamp(22px,2.4vw,30px)", letterSpacing: "-.02em", lineHeight: 1.05 }}>{next.title} →</span>
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
