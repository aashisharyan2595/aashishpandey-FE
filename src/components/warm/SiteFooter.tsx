import Link from "next/link";
import styles from "@/components/warm/warm.module.css";

const linkStyle: React.CSSProperties = { color: "#f6ead6", textDecoration: "none" };

export default function SiteFooter() {
  return (
    <footer
      style={{
        position: "relative",
        zIndex: 2,
        background: "#171b2e",
        color: "#f6ead6",
        padding: "clamp(48px,7vw,96px) clamp(16px,5vw,72px) 28px",
        display: "flex",
        flexDirection: "column",
        gap: 48,
        borderRadius: "28px 28px 0 0",
        fontFamily: "var(--font-bricolage), Helvetica, Arial, sans-serif",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: 36 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, gridColumn: "1 / -1", maxWidth: 760 }}>
          <h2
            style={{
              margin: 0,
              fontWeight: 800,
              fontSize: "clamp(44px,6vw,92px)",
              lineHeight: 0.85,
              letterSpacing: "-.035em",
            }}
          >
            Let&apos;s ship
            <br />
            <span style={{ color: "#e8773a" }}>the next one.</span>
          </h2>
          <a
            href="mailto:aashishpandey406@gmail.com"
            className={styles.footerLink}
            style={{ alignSelf: "flex-start", fontSize: "clamp(18px,2vw,24px)", fontWeight: 600, borderBottom: "2px solid #e8773a", paddingBottom: 4, ...linkStyle }}
          >
            aashishpandey406@gmail.com
          </a>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 16 }}>
          <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "#9aa0b4" }}>
            Site
          </span>
          <Link href="/" className={styles.footerLink} style={linkStyle}>Home</Link>
          <Link href="/work" className={styles.footerLink} style={linkStyle}>Work</Link>
          <Link href="/about" className={styles.footerLink} style={linkStyle}>About</Link>
          <Link href="/contact" className={styles.footerLink} style={linkStyle}>Contact</Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 16 }}>
          <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "#9aa0b4" }}>
            Play
          </span>
          <Link href="/ride" className={styles.footerLink} style={linkStyle}>Race mode ↗</Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 16 }}>
          <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "#9aa0b4" }}>
            Elsewhere
          </span>
          <a href="https://linkedin.com/in/aashish-kumar-pandey" className={styles.footerLink} style={linkStyle}>LinkedIn ↗</a>
          <a href="https://github.com/aashisharyan2595" className={styles.footerLink} style={linkStyle}>GitHub ↗</a>
          <a href="/assets/Aashish-Pandey-Resume.docx" download className={styles.footerLink} style={linkStyle}>Résumé ↓</a>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 10,
          paddingTop: 18,
          borderTop: "1px solid rgba(246,234,214,.14)",
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: ".06em",
          color: "#9aa0b4",
        }}
      >
        <span>© 2026 Aashish Pandey · Bangalore, IN</span>
        <span>Technical Project Manager</span>
      </div>
    </footer>
  );
}
