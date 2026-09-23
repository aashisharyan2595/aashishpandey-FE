import Link from "next/link";
import Reveal from "@/components/Reveal";

const sitemap = [
  { href: "/work", label: "Work" },
  { href: "/blog", label: "Writing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-line px-6 pt-20 pb-10 md:px-12">
      <Reveal>
        <Link href="/contact" className="group block">
          <p className="eyebrow">Next stop</p>
          <span className="display-l mt-3 block">
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
    </footer>
  );
}
