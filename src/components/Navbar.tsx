"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import MagneticLink from "@/components/MagneticLink";

const links = [
  { href: "/work", label: "Work" },
  { href: "/#about", label: "About" },
  { href: "/blog", label: "Writing" },
  { href: "/#contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-6 mix-blend-difference md:px-12">
        <MagneticLink href="#" className="font-display text-lg font-medium">
          AP
        </MagneticLink>

        <nav className="hidden gap-8 text-sm uppercase tracking-widest sm:flex">
          {links.map((link) => (
            <MagneticLink key={link.href} href={link.href}>
              {link.label}
            </MagneticLink>
          ))}
        </nav>

        <button
          type="button"
          data-cursor-hover
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="font-mono text-sm uppercase tracking-widest sm:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 flex flex-col justify-center gap-6 bg-background px-6 sm:hidden"
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
