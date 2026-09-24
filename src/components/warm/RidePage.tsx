"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteFooter from "@/components/warm/SiteFooter";
import WarmBody from "@/components/warm/WarmBody";
import styles from "@/components/warm/warm.module.css";
import type { CaseStudy } from "@/lib/case-studies";

/**
 * "Ride" — the source design's racing-game concept (Aashish Ride v4.dc.html):
 * a real driving game (procedural 3D terrain, a modeled motorcycle, physics,
 * collision, persistent save state, external CC0 3D/audio assets) reached
 * through 5 "gears": Ride (the game itself), Logbook, Map, Garage, Pit stop.
 *
 * Scoped deliberately: the actual driving/physics engine is a genuinely
 * separate, large build (bigger than the whole rest of the site combined)
 * and isn't implemented here — shipping a rushed version of it would be
 * worse than being upfront that it's next. This ships the other four gears
 * for real now (all real content, no placeholders) and gives Ride itself an
 * honest "in progress" screen instead of a broken or fake game.
 */

const IND = "#171b2e";
const TAN = "#e8773a";
const MAG = "#a3332c";
const LIME = "#f4b24a";
const CRM = "#f7ecda";

const GEARS: { key: string; label: string }[] = [
  { key: "ride", label: "Ride" },
  { key: "logbook", label: "Logbook" },
  { key: "map", label: "Map" },
  { key: "garage", label: "Garage" },
  { key: "pitstop", label: "Pit stop" },
];

const ROLES = [
  { name: "Delivery Lead", world: "Delivery", perk: "Tank build: 130 HP and a shield that soaks the first hit of every level.", stats: "HP 130 · SPD 29 · DASH 3.2s" },
  { name: "Tech Lead", world: "Technology", perk: "Dash recharges in 1.8s and every clear pays +400.", stats: "HP 100 · SPD 30 · DASH 1.8s" },
  { name: "Product Owner", world: "Product", perk: "Token magnet: collects shipped tokens from every lane.", stats: "HP 100 · SPD 30 · MAGNET" },
  { name: "UX Designer", world: "Design", perk: "Nimble: 40% sharper steering, top speed 32, 2s recovery after hits.", stats: "HP 90 · SPD 32 · STEER+" },
];

const LEGS = [
  {
    lv: 1,
    color: LIME,
    org: "Freelance",
    role: "Web Developer & Project Consultant",
    span: "2018 – Dec 2020",
    bullets: [
      "Delivered 15+ complex client projects for ITC, Anchor and MSI India, focused on high-performance architecture and long-term maintainability.",
      "End-to-end product owner across digital initiatives, from discovery and scope definition through launch and post-launch iteration.",
    ],
    stops: ["ITC", "Anchor", "MSI India"],
  },
  {
    lv: 2,
    color: TAN,
    org: "0to1 Media",
    role: "CMS Developer & Project Lead",
    span: "Dec 2020 – May 2022",
    bullets: [
      "CMS and e-commerce platform development for Reliance Industries, Zebronics and Bajaj Electronics, improving mobile conversion rates.",
      "Iterated 10+ Zebronics campaign landing pages with GA4 insights and SEO best practices: +25% engagement and social shares.",
      "Mentored a team of 5 junior developers on structured coding workflows and CI/CD pipelines.",
    ],
    stops: [{ t: "Zebronics", href: "/work/zebronics-campaign-pages" }, { t: "Reliance Industries" }, { t: "Bajaj Electronics" }],
  },
  {
    lv: 3,
    color: MAG,
    org: "Knowledge Units",
    role: "Project Manager & Sr. Web Developer",
    span: "Jul 2022 – Aug 2025",
    bullets: [
      "Directed the product ownership lifecycle for StoryNest, an AI storytelling platform: +50% traffic through workflow analysis and feature prioritization.",
      "Delivered 35+ enterprise-grade digital platforms and CMS solutions for hospitality leaders including JW Marriott and Westin Pune, with a 99% on-time delivery rate.",
      "Instituted structured sprint planning and SOPs in Jira and Azure DevOps.",
      "Optimized SEO and web performance for real estate and hospitality portals, improving Core Web Vitals.",
    ],
    stops: [{ t: "StoryNest", href: "/work/storynest-ai-platform" }, { t: "JW Marriott" }, { t: "Westin Pune" }],
  },
  {
    lv: 4,
    color: "#8fa9d6",
    org: "Langoor",
    role: "Project Manager",
    span: "Nov 2025 – Present",
    bullets: [
      "End-to-end project plans for Unilever's global brand portfolio across geographies, with one delivery framework for 10+ brands.",
      "Led the Magnum Ice Cream Canada Shopify redevelopment and UX redesign to a stable, on-schedule launch.",
      "Modernized D2C platforms for Wipro Appliances and Wipro Consumer Lighting with reusable delivery templates: +40% handling capacity.",
      "Enabled Talenti Ice Cream Canada's digital market entry by defining technical scope and coordinating execution across time zones.",
    ],
    stops: [
      { t: "Liquid I.V. Europe", href: "/work/liquid-iv-europe-expansion" },
      { t: "Magnum Canada", href: "/work/tmicc-shopify-relaunch" },
      { t: "Wipro D2C", href: "/work/wipro-d2c-modernization" },
      { t: "Talenti Canada" },
      { t: "Unilever: 10+ brands" },
    ],
  },
];

const PARTS = [
  { part: "Handlebars", job: "Steering", world: "Product", color: TAN, text: "Owning outcomes and prioritizing roadmaps against evidence: StoryNest's traffic growth, Wipro's D2C process redesign.", tools: ["Roadmap prioritization", "Workflow analysis", "GA4 & GTM", "A/B testing"] },
  { part: "Engine", job: "Power", world: "Technology", color: LIME, text: "Hands-on with CMS architecture, Shopify Plus and CI/CD, enough to open the codebase when a project needs it.", tools: ["CMS architecture", "Shopify Plus", "Webflow & AEM", "CI/CD", "Core Web Vitals"] },
  { part: "Livery", job: "Finish", world: "Design", color: MAG, text: "Design-literate enough to work directly in Figma and own a UX redesign end to end, not just review one.", tools: ["Figma", "UX redesign", "Brand consistency"] },
  { part: "Chassis", job: "Holds it together", world: "Delivery", color: CRM, text: "Agile/Scrum, stakeholder alignment and process design, the throughline across every role. Onshore and offshore teams aligned, paced and unblocked.", tools: ["Agile & Scrum", "Jira & Azure DevOps", "MS Planner · Project · Visio · Loop", "Vendor negotiation"] },
];

const TICKER = ["Delivery Planning", "Stakeholder Alignment", "Agile & Scrum", "Process Mapping (Visio)", "Jira & Azure DevOps", "CI/CD", "GA4 & GTM", "A/B Testing", "Shopify Plus", "Webflow & AEM", "Figma", "Vendor Negotiation"];
const CERTS = ["Agile Project Management · Udemy", "Google Digital Marketing", "DevOps Essentials · Linux Academy", "Prompt Engineering · freeCodeCamp", "Python Fundamentals · Scaler", "Fundamentals of Project Management · Great Learning", "LinkedIn Marketing Solutions Fundamentals"];
const STATS = [
  { v: "6+", k: "Years in digital", bg: LIME },
  { v: "35+", k: "Projects shipped", bg: CRM },
  { v: "4", k: "Global brands", bg: CRM },
  { v: "99%", k: "On time at Knowledge Units", bg: TAN },
];

function parseGear(): string {
  const h = (typeof window !== "undefined" ? window.location.hash : "").replace(/^#\/?/, "");
  return GEARS.some((g) => g.key === h) ? h : "ride";
}

const mono: React.CSSProperties = { fontFamily: "var(--font-ibm-plex-mono), monospace" };

export default function RidePage({ caseStudies }: { caseStudies: CaseStudy[] }) {
  // Lazy initializer reads the hash directly rather than defaulting to
  // "ride" and correcting via a synchronous setState in an effect (which
  // triggers an avoidable extra render) — SSR has no window, so the server
  // render is always "ride", matching the common no-hash entry case.
  const [gear, setGear] = useState(() => parseGear());

  useEffect(() => {
    const onHash = () => {
      setGear(parseGear());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <div style={{ color: CRM, fontFamily: "var(--font-bricolage), Helvetica, Arial, sans-serif", background: IND, minHeight: "100vh" }}>
      <WarmBody />

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          padding: "12px clamp(12px,2.4vw,28px)",
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: 12,
          textTransform: "uppercase",
          background: IND,
          borderBottom: `1.5px solid ${LIME}`,
        }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 8, background: CRM, color: IND, padding: "9px 12px", fontWeight: 700, border: `1.5px solid ${IND}`, borderRadius: 999, textDecoration: "none" }}
        >
          ← Home
        </Link>
        <nav aria-label="Gears" style={{ display: "flex", flexWrap: "wrap", background: IND, border: `1.5px solid ${LIME}` }}>
          {GEARS.map((g) => {
            const on = g.key === gear;
            return (
              <a
                key={g.key}
                href={`#/${g.key}`}
                aria-current={on ? "page" : undefined}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 11px", background: on ? LIME : "transparent", color: on ? IND : CRM, fontWeight: 700, textDecoration: "none", transition: "background .2s,color .2s" }}
              >
                {g.label}
              </a>
            );
          })}
        </nav>
        <span style={{ background: LIME, color: IND, padding: "8px 10px", fontWeight: 700, border: `1.5px solid ${LIME}`, whiteSpace: "nowrap" }}>◆ 0/35</span>
      </header>

      {gear === "ride" && (
        <main style={{ minHeight: "80vh", padding: "80px clamp(16px,4vw,56px)", display: "flex", flexDirection: "column", gap: 28, maxWidth: 900, margin: "0 auto" }}>
          <span style={{ ...mono, fontSize: 12, textTransform: "uppercase", fontWeight: 700, color: LIME }}>Gear 1 · Ride</span>
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(40px,7vw,90px)", lineHeight: 0.88, letterSpacing: "-.05em", textTransform: "uppercase" }}>
            The road&apos;s <span style={{ color: TAN }}>still being paved.</span>
          </h1>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.5, maxWidth: 640 }}>
            The full ride — a real driving game with a modeled bike, procedural terrain, physics and 14 hidden easter eggs across the career — is its own build, genuinely bigger than the rest of this site combined. It&apos;s next, not skipped. In the meantime, here&apos;s the cast and the route.
          </p>
          <div role="group" aria-label="Riders" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            {ROLES.map((r) => (
              <div key={r.name} style={{ border: `1.5px solid ${IND}`, background: CRM, color: IND, padding: 14, display: "flex", flexDirection: "column", gap: 6, borderRadius: 12 }}>
                <span style={{ fontWeight: 800, fontSize: 17 }}>{r.name}</span>
                <span style={{ ...mono, fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: MAG }}>World: {r.world}</span>
                <span style={{ fontSize: 13, lineHeight: 1.4 }}>{r.perk}</span>
                <span style={{ ...mono, fontSize: 10, fontWeight: 700 }}>{r.stats}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a href="#/logbook" className={styles.pillPrimary} style={{ background: LIME, color: IND, padding: "14px 20px", fontWeight: 800, textDecoration: "none" }}>
              Read the logbook instead →
            </a>
            <a href="#/map" style={{ border: `1.5px solid ${CRM}`, padding: "13px 18px", fontWeight: 700, textDecoration: "none", color: CRM }}>
              See the route
            </a>
          </div>
        </main>
      )}

      {gear === "logbook" && (
        <main style={{ minHeight: "80vh", background: TAN, color: IND, padding: "56px clamp(16px,4vw,56px) 80px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 900 }}>
            <span style={{ ...mono, fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>Gear 2 · Logbook</span>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(56px,11vw,150px)", lineHeight: 0.8, letterSpacing: "-.05em", textTransform: "uppercase" }}>Logbook</h1>
            <p style={{ margin: 0, fontSize: 18, lineHeight: 1.45, maxWidth: 560, background: CRM, padding: "14px 16px", border: `1.5px solid ${IND}`, borderRadius: 12 }}>
              Five rides, written up in full — context, response, evidence.
            </p>
          </div>
          <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(280px,100%),1fr))", gap: 20 }}>
            {caseStudies.map((c, i) => (
              <Link
                key={c.slug}
                href={`/work/${c.slug}`}
                style={{ display: "flex", flexDirection: "column", background: CRM, color: IND, border: `1.5px solid ${IND}`, borderRadius: 18, textDecoration: "none", minHeight: 300 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: `3px solid ${IND}`, ...mono, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                  <span>Ride {String(i + 1).padStart(2, "0")}</span>
                  <span>{c.timeframe}</span>
                </div>
                <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  <span style={mono}>{c.client}</span>
                  <h2 style={{ margin: 0, fontWeight: 800, fontSize: 22, lineHeight: 1.05 }}>{c.title}</h2>
                  <span style={{ marginTop: "auto", fontWeight: 800, fontSize: 48, lineHeight: 0.9, letterSpacing: "-.03em", color: MAG }}>{c.metric.value}</span>
                  <span style={{ ...mono, fontSize: 10, textTransform: "uppercase" }}>{c.metric.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </main>
      )}

      {gear === "map" && (
        <main style={{ minHeight: "80vh", background: CRM, color: IND, padding: "56px clamp(16px,4vw,56px) 80px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 24, alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <span style={{ ...mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Gear 3 · Map · the 4 legs</span>
              <h1 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(50px,9.5vw,140px)", lineHeight: 0.8, letterSpacing: "-.055em", textTransform: "uppercase" }}>
                The route<br />
                <span style={{ color: MAG }}>so far.</span>
              </h1>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(130px,1fr))", border: `1.5px solid ${IND}` }}>
              {STATS.map((s) => (
                <div key={s.k} style={{ padding: "12px 16px", border: `1.5px solid ${IND}`, display: "flex", flexDirection: "column", gap: 2, background: s.bg }}>
                  <span style={{ fontWeight: 800, fontSize: 36, lineHeight: 1, letterSpacing: "-.04em" }}>{s.v}</span>
                  <span style={{ ...mono, fontSize: 10, textTransform: "uppercase" }}>{s.k}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 48, display: "flex", flexDirection: "column" }}>
            {LEGS.map((l) => (
              <section key={l.lv} style={{ display: "grid", gridTemplateColumns: "clamp(56px,8vw,90px) minmax(0,1fr)", gap: "clamp(12px,3vw,32px)" }}>
                <div aria-hidden="true" style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                  <div style={{ position: "absolute", top: 0, bottom: 0, width: 20, background: IND }} />
                  <span style={{ position: "relative", marginTop: 10, width: "clamp(44px,6vw,64px)", height: "clamp(44px,6vw,64px)", borderRadius: "50%", background: l.color, border: `4px solid ${IND}`, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 16 }}>
                    L{l.lv}
                  </span>
                </div>
                <div style={{ padding: "12px 0 48px", display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                  <span style={{ ...mono, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                    Level {l.lv} · {l.span}
                  </span>
                  <h2 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(30px,4vw,54px)", lineHeight: 0.9, letterSpacing: "-.04em" }}>{l.org}</h2>
                  <span style={{ fontSize: 17, fontWeight: 700, color: "#56607e" }}>{l.role}</span>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8, maxWidth: 720 }}>
                    {l.bullets.map((b) => (
                      <li key={b} style={{ display: "grid", gridTemplateColumns: "16px minmax(0,1fr)", gap: 8, fontSize: 16, lineHeight: 1.5 }}>
                        <span style={{ color: MAG, fontWeight: 800 }}>—</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                    {l.stops.map((sp) => {
                      const stop = typeof sp === "string" ? { t: sp, href: undefined } : sp;
                      const content = (
                        <>
                          <span style={{ width: 9, height: 9, transform: "rotate(45deg)", background: IND }} />
                          {stop.t}
                        </>
                      );
                      return stop.href ? (
                        <Link key={stop.t} href={stop.href} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: `2.5px solid ${IND}`, background: CRM, fontWeight: 700, fontSize: 13, borderRadius: 12, textDecoration: "none", color: IND }}>
                          {content}
                        </Link>
                      ) : (
                        <span key={stop.t} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: `2.5px solid ${IND}`, background: "transparent", fontWeight: 700, fontSize: 13, borderRadius: 12 }}>
                          {content}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </section>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "clamp(56px,8vw,90px) minmax(0,1fr)", gap: "clamp(12px,3vw,32px)", alignItems: "center" }}>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <span style={{ width: 22, height: 22, background: MAG, border: `4px solid ${IND}`, transform: "rotate(45deg)" }} />
              </div>
              <a href="#/pitstop" style={{ fontWeight: 800, fontSize: "clamp(22px,3vw,34px)", letterSpacing: "-.03em", color: IND, textDecoration: "none" }}>
                Level 5: unmapped. Yours? →
              </a>
            </div>
          </div>
        </main>
      )}

      {gear === "garage" && (
        <main style={{ minHeight: "80vh", background: IND, color: CRM, padding: "56px 0 80px" }}>
          <div style={{ padding: "0 clamp(16px,4vw,56px)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 24, alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <span style={{ ...mono, fontSize: 12, textTransform: "uppercase", fontWeight: 700, color: LIME }}>Gear 4 · Garage</span>
              <h1 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(50px,9.5vw,140px)", lineHeight: 0.8, letterSpacing: "-.055em", textTransform: "uppercase" }}>
                The<br />
                <span style={{ color: TAN }}>machine.</span>
              </h1>
            </div>
            <p style={{ margin: 0, maxWidth: 440, fontSize: 16, lineHeight: 1.5 }}>
              I started as a developer, moved into technical team leadership, then project management, and kept the hands-on technical understanding. Four parts make one machine.
            </p>
          </div>
          <div aria-hidden="true" style={{ margin: "36px 0", borderTop: `3px solid ${LIME}`, borderBottom: `3px solid ${LIME}`, background: LIME, color: IND, overflow: "hidden", whiteSpace: "nowrap" }}>
            <div style={{ display: "inline-flex", gap: 24, padding: "12px 0", fontWeight: 800, fontSize: 20, textTransform: "uppercase" }}>
              {[...TICKER, ...TICKER].map((t, i) => (
                <span key={i}>{t} ◆</span>
              ))}
            </div>
          </div>
          <div style={{ padding: "0 clamp(16px,4vw,56px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(260px,100%),1fr))", gap: 18 }}>
            {PARTS.map((p) => (
              <article key={p.part} style={{ background: CRM, color: IND, border: `1.5px solid ${CRM}`, display: "flex", flexDirection: "column", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ background: p.color, padding: 14, borderBottom: `3px solid ${IND}`, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ ...mono, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{p.job}</span>
                  <h2 style={{ margin: 0, fontWeight: 800, fontSize: 34, lineHeight: 0.9, letterSpacing: "-.03em", textTransform: "uppercase" }}>{p.part}</h2>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>= {p.world}</span>
                </div>
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{p.text}</p>
                  <div style={{ display: "flex", flexDirection: "column", ...mono, fontSize: 11 }}>
                    {p.tools.map((t) => (
                      <div key={t} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #171b2e", padding: "4px 0" }}>
                        <span>{t}</span>
                        <span>✓</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <section style={{ marginTop: 44, padding: "0 clamp(16px,4vw,56px)", display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(28px,4vw,44px)", letterSpacing: "-.03em", textTransform: "uppercase" }}>Service record</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CERTS.map((c) => (
                <span key={c} style={{ border: `1.5px solid ${LIME}`, padding: "8px 11px", fontSize: 13, fontWeight: 700 }}>
                  {c}
                </span>
              ))}
            </div>
          </section>
        </main>
      )}

      {gear === "pitstop" && (
        <main style={{ minHeight: "80vh", background: MAG, color: IND, padding: "80px clamp(16px,4vw,56px) 60px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 36 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ ...mono, fontSize: 12, textTransform: "uppercase", fontWeight: 700, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: LIME, border: `1.5px solid ${IND}` }} />
              Gear 5 · Pit stop · reply within 48h
            </span>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(34px,6.6vw,100px)", lineHeight: 0.86, letterSpacing: "-.06em", textTransform: "uppercase", color: CRM, textShadow: `4px 4px 0 ${IND}` }}>
              Have a<br />complicated<br />project?
            </h1>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "stretch" }}>
            <div style={{ flex: "1 1 320px", maxWidth: 520, background: CRM, border: `1.5px solid ${IND}`, borderRadius: 18, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ margin: 0, fontSize: 18, lineHeight: 1.45 }}>If you&apos;re building, redesigning, migrating or scaling a digital product or website, pull in and tell me what you&apos;re working on.</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href="/contact" style={{ background: IND, color: LIME, padding: "14px 20px", fontWeight: 800, fontSize: 17, textDecoration: "none" }}>
                  Let&apos;s talk →
                </Link>
                <a href="https://linkedin.com/in/aashish-kumar-pandey" style={{ border: `1.5px solid ${IND}`, padding: "12px 15px", fontWeight: 700, color: IND, textDecoration: "none" }}>
                  LinkedIn
                </a>
                <a href="https://github.com/aashisharyan2595" style={{ border: `1.5px solid ${IND}`, padding: "12px 15px", fontWeight: 700, color: IND, textDecoration: "none" }}>
                  GitHub
                </a>
              </div>
            </div>
            <div style={{ flex: "0 1 280px", background: IND, color: CRM, border: `1.5px solid ${LIME}`, padding: 16, display: "flex", flexDirection: "column", gap: 8, ...mono, fontSize: 11, textTransform: "uppercase" }}>
              <span style={{ color: LIME, fontWeight: 700 }}>Your ride stats</span>
              <span style={{ opacity: 0.7 }}>Play the ride to see stats here — coming in the next phase.</span>
            </div>
          </div>
          <footer style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, ...mono, fontSize: 11, textTransform: "uppercase", color: CRM }}>
            <span>AP · Project management, digital products, web engineering, D2C · Bangalore, IN</span>
            <span>© 2026 Aashish Pandey</span>
          </footer>
        </main>
      )}

      <SiteFooter />
    </div>
  );
}
