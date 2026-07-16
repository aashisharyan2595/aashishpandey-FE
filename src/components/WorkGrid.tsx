"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import CaseStudyCover from "@/components/CaseStudyCover";
import type { CaseStudy } from "@/lib/case-studies";

const MotionLink = motion.create(Link);

function WorkCard({ item, index }: { item: CaseStudy; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });
  const rotateX = useTransform(springY, [0, 1], [8, -8]);
  const rotateY = useTransform(springX, [0, 1], [-8, 8]);

  const handleMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  };

  const reset = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <MotionLink
      ref={ref}
      href={`/work/${item.slug}`}
      data-cursor-hover
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-colors hover:border-accent/50"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <CaseStudyCover
          slug={item.slug}
          label={item.title}
          className="h-full w-full scale-105 transition-transform duration-700 ease-out group-hover:scale-100"
        />
        <span className="absolute left-4 top-4 font-mono text-xs uppercase tracking-widest text-muted">
          {String(index + 1).padStart(2, "0")}
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
  );
}

export default function WorkGrid({ items }: { items: CaseStudy[] }) {
  return (
    <div className="mt-16 grid gap-8 [perspective:1200px] sm:grid-cols-2">
      {items.map((item, i) => (
        <WorkCard key={item.slug} item={item} index={i} />
      ))}
    </div>
  );
}
