"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

export default function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { damping: 30, stiffness: 400, mass: 0.5 });
  const springY = useSpring(y, { damping: 30, stiffness: 400, mass: 0.5 });
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      setVisible(true);
      x.set(e.clientX - 8);
      y.set(e.clientY - 8);
    };

    const over = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      setHovering(Boolean(target.closest("a, button, [data-cursor-hover]")));
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
    };
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[100] hidden h-4 w-4 rounded-full bg-accent mix-blend-difference md:block"
      style={{ x: springX, y: springY, opacity: visible ? 1 : 0 }}
      animate={{ scale: hovering ? 2.5 : 1 }}
      transition={{ scale: { type: "spring", damping: 20, stiffness: 300 } }}
    />
  );
}
