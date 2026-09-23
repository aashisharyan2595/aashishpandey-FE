import Link from "next/link";
import PhotoFrame from "@/components/PhotoFrame";
import Reveal from "@/components/Reveal";
import Stamp from "@/components/Stamp";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line px-6 pb-20 pt-32 md:px-12 md:pb-28 md:pt-40">
      {/* A single large geometric plane, restrained, behind the headline —
          the brand's "environment" layer, per composition hierarchy. */}
      <svg
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
      >
        <polygon points="500,0 800,120 800,600 380,600" fill="var(--forest)" />
        <polygon points="800,120 800,600 620,600" fill="var(--gold)" />
      </svg>

      <div className="relative grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:items-start lg:gap-16">
        <div>
          <Reveal>
            <p className="eyebrow">Aashish Pandey — Project Manager</p>
            <h1 className="display-xl mt-5">
              I keep complex
              <br />
              delivery
              <br />
              <span style={{ color: "var(--gold)" }}>shipping on schedule.</span>
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
            <PhotoFrame id="AP / 06" caption="Delivery lead" aspect="aspect-[4/5]" className="w-56 md:w-64" />
            <Stamp
              value="On time"
              label="Every launch"
              color="gold"
              size="sm"
              className="absolute -left-6 -bottom-6 w-28 bg-background md:-left-10"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
