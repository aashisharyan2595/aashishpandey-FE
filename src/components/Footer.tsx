import Link from "next/link";
import MagneticLink from "@/components/MagneticLink";
import Reveal from "@/components/Reveal";

const sitemap = [
  { href: "/work", label: "Work" },
  { href: "/blog", label: "Writing" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 pt-24 pb-10 md:px-12">
      <Reveal>
        <MagneticLink
          href="/#contact"
          className="font-display block text-4xl leading-tight md:text-7xl"
        >
          Let&apos;s build <span className="text-accent">something.</span>
        </MagneticLink>
      </Reveal>

      <div className="mt-16 flex flex-col gap-8 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
        <nav className="flex flex-wrap gap-x-8 gap-y-3 font-mono text-sm uppercase tracking-widest text-muted">
          {sitemap.map((link) => (
            <Link key={link.href} href={link.href} data-cursor-hover className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-6 text-sm text-muted">
          <a
            data-cursor-hover
            href="https://linkedin.com/in/aashish-kumar-pandey"
            className="hover:text-foreground"
          >
            LinkedIn
          </a>
          <a
            data-cursor-hover
            href="https://github.com/aashisharyan2595"
            className="hover:text-foreground"
          >
            GitHub
          </a>
          <span className="font-mono text-xs uppercase tracking-widest">
            © {new Date().getFullYear()} Aashish Pandey
          </span>
        </div>
      </div>
    </footer>
  );
}
