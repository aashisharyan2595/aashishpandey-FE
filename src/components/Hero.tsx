import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import Reveal from "@/components/Reveal";
import RouteLine from "@/components/RouteLine";

const METADATA = ["Pune / India", "Project Management", "Digital Products", "Web + D2C"];

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line px-6 pb-20 pt-32 md:px-12 md:pb-28 md:pt-40">
      <div className="relative grid gap-10 lg:grid-cols-[1fr_minmax(0,42%)] lg:items-stretch lg:gap-0">
        <div className="relative lg:pr-16 lg:py-2">
          <Reveal>
            <h1 className="display-xl">
              I turn complex digital work
              <br />
              into things that
              <br />
              <span style={{ color: "var(--gold)" }}>actually ship.</span>
            </h1>
          </Reveal>

          {/* Phone/tablet: the photo as a large band right under the
              headline, not a small framed card — the geometric "cut corner"
              primitive carrying a real, art-directed photo. */}
          <Reveal scaleIn delay={0.1} className="relative mt-8 aspect-[4/5] w-full overflow-hidden sm:aspect-[16/10] lg:hidden">
            <HeroPhoto objectPosition="50% 26%" />
          </Reveal>

          <Reveal delay={0.1} className="mt-8 max-w-lg text-lg text-muted lg:mt-6">
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

          {/* The route connecting where he is to what he does — the rider
              motif, doubling as the brand's "Route" geometry primitive. */}
          <RouteLine nodes={4} className="mt-4 h-3 w-full max-w-sm" />

          <Reveal delay={0.24} className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/work" className="btn btn-primary">
              View my work
              <Icon name="arrowRight" size={16} />
            </Link>
            <Link href="/contact" className="btn">
              Let&apos;s talk
            </Link>
          </Reveal>
        </div>

        {/* Desktop: the photo as a large standing panel, not a small
            framed card — the brand's "cut corner" primitive scaled up to
            environment size, carrying the full portrait. */}
        <Reveal scaleIn delay={0.14} className="relative hidden lg:block">
          <div className="relative h-full min-h-[600px] w-full">
            <HeroPhoto objectPosition="50% 28%" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function HeroPhoto({ objectPosition }: { objectPosition: string }) {
  return (
    <div className="cut-corner group relative h-full w-full overflow-hidden border border-line">
      <Image
        src="/images/aashish-hero.webp"
        alt="Aashish Pandey, geometric editorial illustration, on a mountain road"
        fill
        priority
        sizes="(min-width: 1024px) 42vw, 100vw"
        className="object-cover"
        style={{ objectPosition }}
      />
      {/* A warm colour wash over the photo — ties the art-directed
          illustration into the site's own palette, poster-style, rather
          than sitting as a flat, unrelated photo. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(150deg, var(--gold) 0%, transparent 55%)",
          mixBlendMode: "color",
          opacity: 0.35,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(0deg, var(--night) 0%, transparent 22%)",
          opacity: 0.6,
        }}
      />
      <span className="pointer-events-none absolute bottom-4 right-4 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--sand)] opacity-80">
        AP / Field — Pune, IN
      </span>
    </div>
  );
}
