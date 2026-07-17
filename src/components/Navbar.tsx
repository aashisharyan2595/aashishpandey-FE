"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import MagneticLink from "@/components/MagneticLink";
import ThemeToggle from "@/components/ThemeToggle";

const links = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Writing" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 transition-all duration-500 md:px-12 ${
          scrolled
            ? "border-b border-foreground/10 bg-background/40 py-4 text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_8px_32px_-16px_rgba(0,0,0,0.5)] backdrop-blur-xl backdrop-saturate-150"
            : "py-6 text-white mix-blend-difference"
        }`}
      >
        <MagneticLink href="/" className="font-display text-lg font-medium">
          AP
        </MagneticLink>

        <nav className="hidden items-center gap-8 text-sm uppercase tracking-widest sm:flex">
          {links.map((link) => (
            <MagneticLink key={link.href} href={link.href}>
              {link.label}
            </MagneticLink>
          ))}
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-5 sm:hidden">
          <ThemeToggle />
          <button
            type="button"
            data-cursor-hover
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="font-mono text-sm uppercase tracking-widest"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 flex flex-col justify-center gap-6 bg-background/70 px-6 backdrop-blur-2xl sm:hidden"
          >
            {links.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.06 }}
              >
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="font-display text-4xl"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
