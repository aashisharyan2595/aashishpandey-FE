"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { CaseStudy } from "@/lib/case-studies";

const MotionLink = motion.create(Link);

export default function WorkGrid({ items }: { items: CaseStudy[] }) {
  return (
    <div className="mt-16 divide-y divide-white/10 border-t border-white/10">
      {items.map((item, i) => (
        <MotionLink
          key={item.slug}
          href={`/work/${item.slug}`}
          data-cursor-hover
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: i * 0.05 }}
          whileHover={{ x: 12 }}
          className="group flex flex-col gap-2 py-8 md:flex-row md:items-baseline md:justify-between"
        >
          <h3 className="font-display text-2xl transition-colors group-hover:text-accent md:text-4xl">
            {item.title}
          </h3>
          <p className="max-w-md text-muted">{item.summary}</p>
          <div className="flex gap-2 text-xs uppercase tracking-widest text-muted">
            {item.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </MotionLink>
      ))}
    </div>
  );
}
