"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * A slowly-drifting low-poly facet composition, deterministic per slug —
 * the animated counterpart to CaseStudyCover's static planes. Used where a
 * project has no real screenshot to show and a static image would be
 * inconsistent with its siblings that do; motion (not a photo) carries the
 * visual instead, restrained per the guideline's motion language (slow,
 * continuous, no gimmicks) and switched off entirely under
 * prefers-reduced-motion. Animates transform only (translate/scale) —
 * Framer Motion can't reliably tween a raw SVG `points` string, so the
 * polygon shapes stay fixed and drift as whole planes instead.
 */
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETTE = ["#3E4A3D", "#28352D", "#77734B", "#5E97AF", "#B39A55", "#EEE4CF"];

export default function AnimatedFacets({
  slug,
  label,
  metric,
  className,
}: {
  slug: string;
  label: string;
  metric?: { value: string; label: string };
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const rand = mulberry32(hashSeed(slug));

  const planes = Array.from({ length: 6 }, (_, i) => {
    const cx = rand() * 400;
    const cy = rand() * 300;
    const r = 90 + rand() * 160;
    const a1 = rand() * Math.PI * 2;
    const a2 = a1 + 1.4 + rand() * 1.6;
    const a3 = a2 + 1.4 + rand() * 1.6;
    // Rounded to 2dp: server (Node) and client (browser) V8 builds can
    // differ in the last bit of cos/sin output for the same input, which
    // otherwise trips a hydration mismatch on every single polygon.
    const pt = (a: number) => `${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`;
    return {
      key: i,
      points: `${pt(a1)} ${pt(a2)} ${pt(a3)}`,
      fill: PALETTE[Math.floor(rand() * PALETTE.length)],
      opacity: 0.5 + rand() * 0.4,
      dx: (rand() - 0.5) * 18,
      dy: (rand() - 0.5) * 14,
      scale: 1 + rand() * 0.06,
      duration: 10 + rand() * 8,
      delay: rand() * 3,
    };
  });

  return (
    <div className={`relative overflow-hidden bg-[var(--night)] ${className ?? ""}`}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
        {planes.map((p) => (
          <motion.polygon
            key={p.key}
            points={p.points}
            fill={p.fill}
            opacity={p.opacity}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={{ x: 0, y: 0, scale: 1 }}
            animate={
              reduceMotion
                ? { x: 0, y: 0, scale: 1 }
                : { x: [0, p.dx, 0], y: [0, p.dy, 0], scale: [1, p.scale, 1] }
            }
            transition={{ duration: p.duration, delay: p.delay, repeat: reduceMotion ? 0 : Infinity, ease: "easeInOut" }}
          />
        ))}
      </svg>
      <span className="label absolute left-4 top-4 text-[var(--sand)] opacity-80">{label}</span>
      {metric && (
        <div className="absolute bottom-4 left-4 right-4">
          <p className="display-l leading-none" style={{ color: "var(--sand)" }}>
            {metric.value}
          </p>
          <p className="label mt-1 text-[var(--sand)] opacity-70">{metric.label}</p>
        </div>
      )}
    </div>
  );
}
