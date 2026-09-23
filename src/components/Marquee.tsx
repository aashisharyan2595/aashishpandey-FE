"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export default function Marquee({ items }: { items: string[] }) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!track.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tween = gsap.to(track.current, {
      xPercent: -50,
      duration: 24,
      ease: "linear",
      repeat: -1,
    });
    return () => {
      tween.kill();
    };
  }, []);

  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-line py-5">
      <div ref={track} className="flex w-max gap-10">
        {doubled.map((item, i) => (
          <span key={i} className="text-sm font-bold uppercase tracking-[0.08em] text-muted">
            {item} <span style={{ color: "var(--gold)" }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
