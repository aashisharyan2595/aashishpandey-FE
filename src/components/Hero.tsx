import Link from "next/link";
import PhotoFrame from "@/components/PhotoFrame";
import Reveal from "@/components/Reveal";
import Stamp from "@/components/Stamp";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line px-6 pb-20 pt-32 md:px-12 md:pb-28 md:pt-40">
      <Reveal className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line pb-4 font-mono text-xs uppercase tracking-[0.15em] text-muted">
        <span>Manifest No. AP-2026-06</span>
        <span>Origin: Pune, IN</span>
        <span className="hidden sm:inline">Status: In transit → on schedule</span>
      </Reveal>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:items-start lg:gap-16">
        <div>
          <Reveal>
            <p className="eyebrow">Aashish Pandey — Project Manager</p>
            <h1 className="font-display mt-5 text-[13vw] font-extrabold leading-[0.9] tracking-tight sm:text-6xl md:text-7xl xl:text-8xl">
              I keep complex
              <br />
              delivery
              <br />
              <span className="text-accent">shipping on schedule.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.1} className="mt-8 max-w-lg text-lg text-muted">
            6+ years running delivery for global brands — Unilever, Wipro, Reliance,
            ITC — with enough hands-on CMS and dev background to get into the weeds
            when a project needs it.
          </Reveal>

          <Reveal delay={0.16} className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/work" className="btn btn-primary">
              See the work →
            </Link>
            <Link href="/contact" className="btn">
              Get in touch
            </Link>
          </Reveal>
        </div>

        <Reveal delay={0.12} className="flex justify-center lg:justify-end">
          <div className="relative">
            <PhotoFrame
              id="AP / 06"
              caption="Delivery lead"
              aspect="aspect-[4/5]"
              rotate={2}
              className="w-56 md:w-64"
            />
            <Stamp
              value="On time"
              label="Every launch"
              color="amber"
              tilt={-10}
              size="sm"
              className="absolute -left-8 -bottom-6 bg-background md:-left-10"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
