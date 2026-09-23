import Link from "next/link";
import Icon from "@/components/Icon";
import PhotoFrame from "@/components/PhotoFrame";
import Reveal from "@/components/Reveal";

const METADATA = ["Pune / India", "Project Management", "Digital Products", "Web + D2C"];

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line px-6 pb-20 pt-32 md:px-12 md:pb-28 md:pt-40">
      {/* A single large geometric plane, restrained, behind the headline —
          the brand's "environment" layer, per composition hierarchy. */}
      <svg
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
      >
        <polygon points="500,0 800,120 800,600 380,600" fill="var(--forest)" />
        <polygon points="800,120 800,600 620,600" fill="var(--gold)" />
      </svg>

      {/* Mobile/tablet: stacks headline -> photo -> supporting copy, so the
          editorial hero object sits right under the headline instead of
          being buried below the CTAs. Desktop: two columns, photo spans
          both rows via named grid areas. */}
      <div
        className={[
          "relative grid gap-10",
          "[grid-template-areas:'heading'_'photo'_'body']",
          "lg:grid-cols-[1.5fr_1fr] lg:items-start lg:gap-16",
          "lg:[grid-template-areas:'heading_photo'_'body_photo']",
        ].join(" ")}
      >
        <div style={{ gridArea: "heading" }}>
          <Reveal>
            <h1 className="display-xl">
              I turn complex digital work
              <br />
              into things that
              <br />
              <span style={{ color: "var(--gold)" }}>actually ship.</span>
            </h1>
          </Reveal>
        </div>

        <Reveal
          scaleIn
          delay={0.14}
          className="flex justify-center lg:justify-end"
          style={{ gridArea: "photo" }}
        >
          <PhotoFrame
            src="/images/aashish-hero.webp"
            alt="Aashish Pandey, geometric editorial illustration, on a mountain road"
            id="AP / Field"
            caption="Pune, IN"
            aspect="aspect-[4/5]"
            objectPosition="50% 30%"
            className="w-64 md:w-72 lg:w-80"
          />
        </Reveal>

        <div style={{ gridArea: "body" }}>
          <Reveal delay={0.1} className="max-w-lg text-lg text-muted">
            I&apos;m Aashish — a Project Manager working across digital products,
            websites, D2C and technology. I sit between business goals, design,
            engineering and delivery to turn ambiguous briefs into work teams
            can actually build and launch.
          </Reveal>

          <Reveal delay={0.18} className="mt-8 flex flex-wrap gap-x-2 gap-y-1">
            {METADATA.map((d, i) => (
              <span key={d} className="meta-mono">
                {d}
                {i < METADATA.length - 1 && <span className="mx-2 opacity-50">/</span>}
              </span>
            ))}
          </Reveal>

          <Reveal delay={0.24} className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/work" className="btn btn-primary">
              View my work
              <Icon name="arrowRight" size={16} />
            </Link>
            <Link href="/contact" className="btn">
              Let&apos;s talk
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
