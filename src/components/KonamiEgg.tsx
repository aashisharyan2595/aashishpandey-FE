"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const confetti = Array.from({ length: 24 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 8) * 0.08,
  duration: 2.2 + (i % 5) * 0.3,
  drift: ((i % 7) - 3) * 12,
}));

export default function KonamiEgg() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let progress = 0;
    const handleKey = (e: KeyboardEvent) => {
      const expected = CODE[progress];
      if (e.key.toLowerCase() === expected.toLowerCase()) {
        progress++;
        if (progress === CODE.length) {
          setActive(true);
          progress = 0;
        }
      } else {
        progress = e.key === CODE[0] ? 1 : 0;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setActive(false), 3200);
    return () => window.clearTimeout(timer);
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center overflow-hidden"
        >
          {confetti.map((c, i) => (
            <motion.span
              key={i}
              initial={{ y: "-10vh", x: 0, opacity: 1, rotate: 0 }}
              animate={{ y: "110vh", x: c.drift * 4, rotate: 360 }}
              transition={{ duration: c.duration, delay: c.delay, ease: "easeIn" }}
              className="absolute top-0 h-3 w-3 rounded-sm bg-accent"
              style={{ left: `${c.left}%` }}
            />
          ))}
          <motion.p
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="font-display rounded-2xl border border-ink/10 bg-background/80 px-8 py-6 text-2xl backdrop-blur-sm md:text-4xl"
          >
            You found it. <span className="text-accent">Nice memory.</span>
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
