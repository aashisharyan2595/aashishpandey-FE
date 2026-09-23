"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import ThemeToggle from "@/components/ThemeToggle";

// Field Notes stays a real, indexed route (linked contextually from the
// homepage's Field Notes module) but isn't a primary-nav destination — it
// has no published content yet, and a nav item leading to "nothing filed
// yet" reads as an unfinished site.
const links = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
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
        className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4 transition-colors duration-300 md:px-12 ${
          scrolled ? "glass border-b border-line" : "border-b border-transparent"
        }`}
      >
        <Link href="/" className="text-sm font-black uppercase tracking-[0.12em]">
          Aashish Pandey
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-bold uppercase tracking-[0.06em] lg:flex lg:gap-8">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link transition-colors hover:text-interactive">
              {link.label}
            </Link>
          ))}
          <Link href="/contact" className="btn !py-2 !text-xs whitespace-nowrap">
            Work with me
          </Link>
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-5 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest"
          >
            <Icon name={open ? "close" : "menu"} size={18} />
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
            transition={{ duration: 0.2 }}
            className="glass fixed inset-0 z-40 flex flex-col justify-center gap-6 px-6 lg:hidden"
          >
            {links.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 + i * 0.05 }}
              >
                <Link href={link.href} onClick={() => setOpen(false)} className="display-l">
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
