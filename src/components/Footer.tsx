import Link from "next/link";
import Reveal from "@/components/Reveal";

const sitemap = [
  { href: "/work", label: "Work" },
  { href: "/field-notes", label: "Field Notes" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line px-6 pt-20 pb-10 md:px-12">
      {/* One restrained geometric field — the footer's editorial signature,
          not decoration filling space. */}
      <svg
        viewBox="0 0 800 300"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]"
      >
        <polygon points="0,300 260,300 120,0 0,0" fill="var(--forest)" />
        <polygon points="800,300 620,300 800,60" fill="var(--gold)" />
      </svg>

      <div className="relative">
        <Reveal>
          <p className="text-sm font-bold uppercase tracking-[0.06em]">AP — Aashish Pandey</p>
          <p className="mt-2 max-w-md text-sm text-muted">
            Project management, digital products, web engineering, D2C. Design
            clarity from complexity.
          </p>
          <Link href="/contact" className="group mt-8 block">
            <span className="display-l block">
              Let&apos;s build <span style={{ color: "var(--gold)" }}>something.</span>
            </span>
          </Link>
        </Reveal>

        <div className="mt-16 flex flex-col gap-8 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-bold uppercase tracking-widest text-muted">
            {sitemap.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-6 text-sm text-muted">
            <a href="https://linkedin.com/in/aashish-kumar-pandey" className="hover:text-foreground">
              LinkedIn
            </a>
            <a href="https://github.com/aashisharyan2595" className="hover:text-foreground">
              GitHub
            </a>
            <span className="meta">© {new Date().getFullYear()} Aashish Pandey</span>
          </div>
        </div>

        <p className="mt-6 text-center text-[9px] uppercase tracking-[0.08em] text-muted opacity-50">
          love to PB ❤️
        </p>
      </div>
    </footer>
  );
}
