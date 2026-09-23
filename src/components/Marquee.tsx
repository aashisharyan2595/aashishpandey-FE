"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { gsap } from "@/lib/gsap";

function subscribeReducedMotion(onChange: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export default function Marquee({ items }: { items: string[] }) {
  const track = useRef<HTMLDivElement>(null);
  // The duplicated list is only a scroll-loop technique — a visible artifact
  // (the same list rendered twice in a row) unless the loop is actually
  // animating. Reduced-motion readers get a single, normally-wrapping list
  // instead of a static double.
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!track.current || reduceMotion) return;
    const tween = gsap.to(track.current, {
      xPercent: -50,
      duration: 24,
      ease: "linear",
      repeat: -1,
    });
    return () => {
      tween.kill();
    };
  }, [reduceMotion]);

  if (reduceMotion) {
    return (
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-y border-line py-5">
        {items.map((item) => (
          <span key={item} className="label text-muted">
            {item}
          </span>
        ))}
      </div>
    );
  }

  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-line py-5">
      <div ref={track} className="flex w-max gap-10">
        {doubled.map((item, i) => (
          <span key={i} className="label text-muted">
            {item} <span style={{ color: "var(--gold)" }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
