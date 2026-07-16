"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
});

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from("[data-hero-eyebrow]", { y: 20, opacity: 0, duration: 0.6 })
        .from(
          "[data-hero-line]",
          { y: 60, opacity: 0, duration: 0.9, stagger: 0.12 },
          "-=0.3"
        )
        .from("[data-hero-sub]", { y: 20, opacity: 0, duration: 0.6 }, "-=0.4")
        .from("[data-hero-scene]", { scale: 0.8, opacity: 0, duration: 1 }, "-=0.9");
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 md:px-12"
    >
      <div
        data-hero-scene
        className="pointer-events-none absolute right-[-10%] top-1/2 hidden h-[55vw] max-h-[560px] w-[55vw] max-w-[560px] -translate-y-1/2 opacity-80 md:block"
      >
        <HeroScene />
      </div>

      <div className="relative z-10 max-w-2xl">
        <p
          data-hero-eyebrow
          className="mb-4 font-mono text-sm uppercase tracking-[0.3em] text-muted"
        >
          Aashish Pandey — Project Manager
        </p>
        <h1 className="font-display text-[9vw] font-medium leading-[1.1] md:text-[6vw] md:leading-[0.9]">
          <span data-hero-line className="block">
            I keep complex delivery
          </span>
          <span data-hero-line className="block text-accent">
            shipping on schedule.
          </span>
        </h1>
        <p
          data-hero-sub
          className="mt-8 max-w-md text-lg text-muted md:text-xl"
        >
          6+ years running delivery for global brands — Unilever, Wipro,
          Reliance, ITC — with enough hands-on CMS and dev background to get
          into the weeds when a project needs it.
        </p>
      </div>
    </section>
  );
}
