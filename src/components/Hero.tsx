import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import Reveal from "@/components/Reveal";
import RouteLine from "@/components/RouteLine";

const METADATA = ["Pune / India", "Project Management", "Digital Products", "Web + D2C"];

// A single large diagonal cut at the bottom-right — the same facet language
// as FacetPhoto, scaled to environment size, so the photo reads as the
// scene the statement sits inside rather than an illustration next to it.
const HERO_MASK = "polygon(0% 0%, 100% 0%, 100% 84%, 90% 100%, 0% 100%)";

export default function Hero() {
  return (
    <section className="relative flex min-h-[94vh] items-end border-b border-line">
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: HERO_MASK }}>
        <Image
          src="/images/aashish-hero.webp"
          alt="Aashish Pandey on a mountain road"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "50% 30%" }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(150deg, var(--gold) 0%, transparent 55%)", mixBlendMode: "color", opacity: 0.25 }}
          aria-hidden
        />
        {/* Legibility scrim — the illustration is bright enough that a subtle
            gradient alone left the headline nearly unreadable; this needs to
            read as near-opaque at the very bottom where the text sits. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(0deg, var(--night) 0%, color-mix(in srgb, var(--night) 80%, transparent) 38%, color-mix(in srgb, var(--night) 20%, transparent) 68%, transparent 90%)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "linear-gradient(100deg, var(--night) 0%, color-mix(in srgb, var(--night) 55%, transparent) 30%, transparent 58%)",
          }}
          aria-hidden
        />
      </div>

      <div className="relative w-full px-6 pb-16 pt-40 md:px-12 md:pb-20">
        <Reveal>
          <h1 className="display-mega" style={{ color: "var(--sand)" }}>
            From brief
            <br />
            to <span style={{ color: "var(--gold)" }}>shipped.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.1} className="body-l mt-6 max-w-lg" style={{ color: "var(--sand)" }}>
          I turn complex digital work into things that actually ship — sitting between product,
          design, technology and delivery.
        </Reveal>

        <Reveal delay={0.16} className="mt-6 flex flex-wrap gap-x-2 gap-y-1">
          {METADATA.map((d, i) => (
            <span key={d} className="meta-mono" style={{ color: "var(--sand)", opacity: 0.8 }}>
              {d}
              {i < METADATA.length - 1 && <span className="mx-2 opacity-50">/</span>}
            </span>
          ))}
        </Reveal>

        <RouteLine nodes={4} color="var(--sand)" className="mt-4 h-3 w-full max-w-sm opacity-70" />

        <Reveal delay={0.22} className="mt-8 flex flex-wrap items-center gap-4">
          <Link href="/work" className="btn btn-primary">
            View my work
            <Icon name="arrowRight" size={16} />
          </Link>
          <Link href="/contact" className="btn" style={{ borderColor: "var(--sand)", color: "var(--sand)" }}>
            Start a brief
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
