"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

/**
 * A full-bleed editorial photo interlude — the homepage's one cinematic
 * "field" moment, breaking the rhythm between Work and System per the
 * guideline's quiet/expressive/quiet pacing. The image gets one slow,
 * one-time entrance settle (not a looping Ken Burns effect).
 */
export default function FieldBreak() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="relative aspect-[4/5] w-full sm:aspect-[16/9] md:aspect-[21/9]">
        <motion.div
          className="absolute inset-0"
          initial={reduceMotion ? { scale: 1 } : { scale: 1.08 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src="/images/motorcycle-sunset.webp"
            alt="A motorcycle parked in a field at sunset, geometric editorial illustration"
            fill
            sizes="100vw"
            className="object-cover"
            priority={false}
          />
        </motion.div>
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(0deg, rgba(16,22,24,0.75) 0%, rgba(16,22,24,0.15) 45%, transparent 70%)",
          }}
        />

        <div className="absolute inset-x-0 bottom-0 px-6 pb-10 md:px-12 md:pb-14">
          <p className="eyebrow" style={{ color: "var(--sand)" }}>
            Field
          </p>
          <p className="h2 mt-3 max-w-xl" style={{ color: "var(--cream)" }}>
            &ldquo;The road teaches you to read terrain.&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
