"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import SiteFooter from "@/components/warm/SiteFooter";
import SiteFx from "@/components/warm/SiteFx";
import SiteHeader from "@/components/warm/SiteHeader";
import WarmBody from "@/components/warm/WarmBody";
import styles from "@/components/warm/warm.module.css";

const TYPES = ["Launch / rollout", "Replatform / migration", "D2C / Shopify", "Delivery rescue", "Something else"];

// The fixed header wraps to three pill rows below ~640px, which the design's
// own clamp(110px,14vh,150px) top padding doesn't reserve room for — it was
// sized for the single-row desktop header. Widen it on narrow viewports
// instead of leaving the badge/heading tucked under the header.
function subscribeNarrow(onChange: () => void) {
  const mql = window.matchMedia("(max-width: 640px)");
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}
function useIsNarrow() {
  return useSyncExternalStore(subscribeNarrow, () => window.matchMedia("(max-width: 640px)").matches, () => false);
}

const fieldStyle: React.CSSProperties = {
  padding: "14px 14px",
  borderRadius: 14,
  border: "1px solid rgba(23,27,46,.18)",
  background: "#fffaf1",
  fontSize: 16,
  width: "100%",
  fontFamily: "inherit",
  color: "inherit",
};

const labelHead: React.CSSProperties = {
  fontFamily: "var(--font-ibm-plex-mono), monospace",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: ".05em",
  color: "#5e6478",
};

const pillLink: React.CSSProperties = {
  padding: "11px 16px",
  borderRadius: 999,
  border: "1px solid rgba(23,27,46,.2)",
  fontWeight: 600,
  textDecoration: "none",
  color: "#171b2e",
};

export default function ContactPage() {
  const [type, setType] = useState(0);
  const narrow = useIsNarrow();

  const send = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const T = TYPES[type];
    const name = String(d.get("name") ?? "");
    const company = String(d.get("company") ?? "");
    const when = String(d.get("when") ?? "");
    const msg = String(d.get("msg") ?? "");
    const body = `Hi Aashish,\n\n${msg}\n\nType: ${T}\nTimeline: ${when || "-"}\n\n${name}${company ? ", " + company : ""}`;
    const subject = `${T}: ${company || name || "project enquiry"}`;
    window.location.href = "mailto:aashishpandey406@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  };

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
      <SiteFx scene="contact" />
      <SiteHeader />

      <main
        style={{
          minHeight: "100vh",
          padding: `${narrow ? "210px" : "clamp(110px,14vh,150px)"} clamp(16px,5vw,72px) clamp(64px,8vw,110px)`,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))",
          gap: "40px 64px",
          alignItems: "start",
          maxWidth: 1360,
          margin: "0 auto",
        }}
      >
        <section style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <span
            style={{
              alignSelf: "flex-start",
              display: "flex",
              gap: 8,
              alignItems: "center",
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontSize: 11,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              padding: "7px 12px",
              borderRadius: 999,
              background: "rgba(251,243,228,.95)",
              border: "1px solid rgba(23,27,46,.1)",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4f8a4a" }} />
            Open to new projects · replies within 48h
          </span>

          <h1
            style={{
              margin: 0,
              fontWeight: 800,
              fontSize: "clamp(60px,9.5vw,160px)",
              lineHeight: 0.82,
              letterSpacing: "-.045em",
            }}
          >
            The next bar
            <br />
            <span style={{ color: "#e8773a" }}>is yours.</span>
          </h1>

          <p style={{ margin: 0, maxWidth: 520, fontSize: "clamp(18px,1.6vw,22px)", lineHeight: 1.5 }}>
            Building, redesigning, migrating or scaling a digital product? Tell me the goal, the date and what&apos;s in
            the way.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
            <a
              href="mailto:aashishpandey406@gmail.com"
              style={{
                alignSelf: "flex-start",
                fontSize: "clamp(20px,2.2vw,28px)",
                fontWeight: 700,
                borderBottom: "2px solid #e8773a",
                paddingBottom: 4,
                color: "#171b2e",
                textDecoration: "none",
              }}
            >
              aashishpandey406@gmail.com
            </a>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a href="https://linkedin.com/in/aashish-kumar-pandey" className={styles.pillOutline} style={pillLink}>
                LinkedIn ↗
              </a>
              <a href="https://github.com/aashisharyan2595" className={styles.pillOutline} style={pillLink}>
                GitHub ↗
              </a>
              <a href="/assets/Aashish-Pandey-Resume.docx" download className={styles.pillOutline} style={pillLink}>
                Résumé ↓
              </a>
            </div>
          </div>
        </section>

        <form
          onSubmit={send}
          style={{
            padding: "clamp(20px,2.6vw,32px)",
            borderRadius: 26,
            background: "rgba(251,243,228,.95)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(23,27,46,.08)",
            boxShadow: "0 30px 60px -36px rgba(23,27,46,.6)",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={labelHead}>What do you need?</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TYPES.map((label, i) => {
                const on = i === type;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setType(i)}
                    aria-pressed={on}
                    style={{
                      padding: "9px 14px",
                      borderRadius: 999,
                      border: `1px solid ${on ? "#171b2e" : "rgba(23,27,46,.2)"}`,
                      background: on ? "#171b2e" : "transparent",
                      color: on ? "#fbf3e4" : "#171b2e",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelHead}>Your name</span>
              <input name="name" required autoComplete="name" style={fieldStyle} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelHead}>Company</span>
              <input name="company" autoComplete="organization" style={fieldStyle} />
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={labelHead}>Timeline</span>
            <input name="when" placeholder="e.g. launch by March" style={fieldStyle} />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={labelHead}>The project</span>
            <textarea name="msg" required rows={5} placeholder="Goal, constraints, what's blocking it" style={{ ...fieldStyle, resize: "vertical" }} />
          </label>

          <button
            type="submit"
            className={styles.pillPrimary}
            style={{
              alignSelf: "flex-start",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "16px 24px",
              borderRadius: 999,
              border: 0,
              background: "#171b2e",
              color: "#fbf3e4",
              fontWeight: 800,
              fontSize: 17,
              cursor: "pointer",
            }}
          >
            Send via email →
          </button>
          <span style={{ fontSize: 13, color: "#5e6478" }}>Opens your mail app with everything filled in.</span>
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}
