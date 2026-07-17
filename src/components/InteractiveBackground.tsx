"use client";

import { useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

export default function InteractiveBackground() {
  const glowRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const springX = useSpring(x, { damping: 28, stiffness: 120, mass: 0.6 });
  const springY = useSpring(y, { damping: 28, stiffness: 120, mass: 0.6 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const applyVars = () => {
      glowRef.current?.style.setProperty("--spot-x", `${springX.get()}px`);
      glowRef.current?.style.setProperty("--spot-y", `${springY.get()}px`);
    };
    const unsubX = springX.on("change", applyVars);
    const unsubY = springY.on("change", applyVars);

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      unsubX();
      unsubY();
    };
  }, [x, y, springX, springY]);

  return (
    <div className="grid-layer pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      <div className="grid-base" />
      <div ref={glowRef} className="grid-glow" />
    </div>
  );
}
