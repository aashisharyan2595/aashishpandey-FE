"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The rider-branding signature motif: a route line with waypoint nodes,
 * drawn in once on scroll — the same "Route" geometry primitive from the
 * brand system (an angular line for process/flow), doubling as the literal
 * road. Used sparingly: a section connector, never decoration filling space.
 */
export default function RouteLine({
  variant = "horizontal",
  nodes = 2,
  className,
  color = "var(--gold)",
}: {
  variant?: "horizontal" | "diagonal";
  nodes?: number;
  className?: string;
  color?: string;
}) {
  const reduceMotion = useReducedMotion();
  const width = 100;
  const points =
    variant === "diagonal"
      ? Array.from({ length: nodes }, (_, i) => [(i / (nodes - 1)) * width, i % 2 === 0 ? 2 : 14])
      : Array.from({ length: nodes }, (_, i) => [(i / (nodes - 1)) * width, 8]);

  const d = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} 16`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
      style={{ overflow: "visible" }}
    >
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1}
        strokeDasharray="3 3"
        initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      />
      {points.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r={1.6}
          fill={color}
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.3, delay: 0.15 + i * (1 / nodes) }}
        />
      ))}
    </svg>
  );
}
