"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export default function Marquee({ items }: { items: string[] }) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!track.current) return;
    const tween = gsap.to(track.current, {
      xPercent: -50,
      duration: 20,
      ease: "linear",
      repeat: -1,
    });
    return () => {
      tween.kill();
    };
  }, []);

  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-white/10 py-6">
      <div ref={track} className="flex w-max gap-12">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="font-display text-3xl text-muted md:text-5xl"
          >
            {item} <span className="text-accent">*</span>
          </span>
        ))}
      </div>
    </div>
  );
}
