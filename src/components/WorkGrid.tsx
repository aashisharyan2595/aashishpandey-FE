"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import CaseStudyCover from "@/components/CaseStudyCover";
import type { CaseStudy } from "@/lib/case-studies";

const MotionLink = motion.create(Link);

export default function WorkGrid({ items }: { items: CaseStudy[] }) {
  return (
    <div className="mt-16 grid gap-8 sm:grid-cols-2">
      {items.map((item, i) => (
        <MotionLink
          key={item.slug}
          href={`/work/${item.slug}`}
          data-cursor-hover
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: i * 0.05 }}
          className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-colors hover:border-accent/50"
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            <CaseStudyCover
              slug={item.slug}
              label={item.title}
              className="h-full w-full scale-105 transition-transform duration-700 ease-out group-hover:scale-100"
            />
            <span className="absolute left-4 top-4 font-mono text-xs uppercase tracking-widest text-muted">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="absolute right-4 top-4 rounded-full border border-white/15 bg-background/60 px-3 py-1 font-mono text-xs uppercase tracking-widest text-foreground backdrop-blur-sm">
              {item.metric.value}
            </span>
          </div>

          <div className="p-6">
            <h3 className="font-display text-xl transition-colors group-hover:text-accent md:text-2xl">
              {item.title}
            </h3>
            <p className="mt-2 text-sm text-muted">{item.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-widest text-muted">
              {item.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </MotionLink>
      ))}
    </div>
  );
}
