"use client";

import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

export default function Reveal({
  children,
  delay = 0,
  className,
  style,
  scaleIn = false,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  /** A slightly more "arriving" entrance (subtle scale + fade) for editorial
      objects like photos, instead of the default fade + rise used for text. */
  scaleIn?: boolean;
}) {
  return (
    <motion.div
      initial={scaleIn ? { opacity: 0, scale: 0.96 } : { opacity: 0, y: 40 }}
      whileInView={scaleIn ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: scaleIn ? 0.8 : 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
