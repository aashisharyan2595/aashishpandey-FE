"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

export default function InteractiveBackground() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 40, stiffness: 90, mass: 0.8 });
  const springY = useSpring(y, { damping: 40, stiffness: 90, mass: 0.8 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    x.set(window.innerWidth / 2);
    y.set(window.innerHeight / 2);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- gates rendering on client-only matchMedia checks
    setReady(true);

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [x, y]);

  return (
    <div className="ambient-layer pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      <div className="ambient-blob ambient-blob-a" />
      <div className="ambient-blob ambient-blob-b" />
      {ready && (
        <motion.div
          className="ambient-cursor-glow"
          style={{ x: springX, y: springY }}
        />
      )}
    </div>
  );
}
