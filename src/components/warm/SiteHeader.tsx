"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: { key: string; label: string; href: string }[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "work", label: "Work", href: "/work" },
  { key: "about", label: "About", href: "/about" },
  { key: "contact", label: "Contact", href: "/contact" },
];

function currentKey(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/work")) return "work";
  if (pathname.startsWith("/about")) return "about";
  if (pathname.startsWith("/contact")) return "contact";
  return "";
}

const pill = "rgba(251,243,228,.8)";
const pillBorder = "1px solid rgba(23,27,46,.1)";
const pillShadow = "0 10px 30px -18px rgba(23,27,46,.45)";

export default function SiteHeader() {
  const pathname = usePathname();
  const cur = currentKey(pathname ?? "");

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
        padding: "14px clamp(14px,3vw,32px)",
        pointerEvents: "none",
        fontFamily: "var(--font-bricolage), Helvetica, Arial, sans-serif",
        color: "#171b2e",
      }}
    >
      <Link
        href="/"
        style={{
          pointerEvents: "auto",
          display: "flex",
          gap: 10,
          alignItems: "center",
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: "-.01em",
          padding: "9px 16px 9px 12px",
          borderRadius: 999,
          color: "#171b2e",
          textDecoration: "none",
          background: pill,
          backdropFilter: "blur(14px) saturate(1.2)",
          WebkitBackdropFilter: "blur(14px) saturate(1.2)",
          border: pillBorder,
          boxShadow: pillShadow,
        }}
      >
        <span style={{ width: 11, height: 11, background: "#e8773a", transform: "rotate(45deg)", borderRadius: 2 }} />
        Aashish Pandey
      </Link>

      <nav
        aria-label="Primary"
        style={{
          pointerEvents: "auto",
          display: "flex",
          gap: 2,
          padding: 4,
          borderRadius: 999,
          background: pill,
          backdropFilter: "blur(14px) saturate(1.2)",
          WebkitBackdropFilter: "blur(14px) saturate(1.2)",
          border: pillBorder,
          boxShadow: pillShadow,
        }}
      >
        {LINKS.map((l) => {
          const on = l.key === cur;
          return (
            <Link
              key={l.key}
              href={l.href}
              aria-current={on ? "page" : undefined}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
                background: on ? "#171b2e" : "transparent",
                color: on ? "#fbf3e4" : "#171b2e",
                transition: "background-color .25s,color .25s",
              }}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ pointerEvents: "auto", display: "flex", gap: 6, alignItems: "center" }}>
        <Link
          href="/ride"
          style={{
            borderRadius: 999,
            padding: "9px 14px",
            fontWeight: 600,
            fontSize: 14,
            color: "#171b2e",
            textDecoration: "none",
            background: pill,
            backdropFilter: "blur(14px) saturate(1.2)",
            WebkitBackdropFilter: "blur(14px) saturate(1.2)",
            border: pillBorder,
            boxShadow: pillShadow,
          }}
        >
          Race mode ↗
        </Link>
        <Link
          href="/contact"
          style={{
            borderRadius: 999,
            padding: "10px 16px",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
            background: "#171b2e",
            color: "#fbf3e4",
            boxShadow: "0 10px 24px -12px rgba(23,27,46,.7)",
          }}
        >
          Let&apos;s talk →
        </Link>
      </div>
    </header>
  );
}
