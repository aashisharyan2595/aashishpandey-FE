"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Burst = {
  id: number;
  x: number;
  y: number;
  particles: { angle: number; distance: number; size: number }[];
};

const PARTICLE_COUNT = 7;

export default function ClickBurst() {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const nextId = useRef(0);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion.current) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select")) return;

      const id = nextId.current++;
      const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        angle: (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.5,
        distance: 24 + Math.random() * 28,
        size: 3 + Math.random() * 3,
      }));

      setBursts((prev) => [...prev, { id, x: e.clientX, y: e.clientY, particles }]);
      window.setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== id));
      }, 700);
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90]">
      <AnimatePresence>
        {bursts.map((burst) => (
          <div key={burst.id} style={{ position: "fixed", left: burst.x, top: burst.y }}>
            {burst.particles.map((p, i) => (
              <motion.span
                key={i}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos(p.angle) * p.distance,
                  y: Math.sin(p.angle) * p.distance,
                  opacity: 0,
                  scale: 0.3,
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  width: p.size,
                  height: p.size,
                  borderRadius: "9999px",
                  background: "var(--accent)",
                }}
              />
            ))}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
