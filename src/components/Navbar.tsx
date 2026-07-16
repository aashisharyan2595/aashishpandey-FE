"use client";

import MagneticLink from "@/components/MagneticLink";

const links = [
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-6 mix-blend-difference md:px-12">
      <MagneticLink href="#" className="font-display text-lg font-medium">
        AP
      </MagneticLink>
      <nav className="flex gap-8 text-sm uppercase tracking-widest">
        {links.map((link) => (
          <MagneticLink key={link.href} href={link.href}>
            {link.label}
          </MagneticLink>
        ))}
      </nav>
    </header>
  );
}
