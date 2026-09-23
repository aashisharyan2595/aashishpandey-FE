import Link from "next/link";
import FacetPhoto from "@/components/FacetPhoto";
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
              headline, not a small framed card — the crystalline facet
              mask carrying a real, art-directed photo. */}
          <Reveal scaleIn delay={0.1} className="relative mt-8 lg:hidden">
            <FacetPhoto
              src="/images/aashish-hero.webp"
              alt="Aashish Pandey, geometric editorial illustration, on a mountain road"
              id="AP / Field"
              caption="Pune, IN"
              variant="corner-br"
              aspect="aspect-[4/5] sm:aspect-[16/10]"
              objectPosition="50% 26%"
              priority
            />
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
            framed card — the crystalline facet mask scaled up to
            environment size, carrying the full portrait. */}
        <Reveal scaleIn delay={0.14} className="relative hidden lg:block">
          <FacetPhoto
            src="/images/aashish-hero.webp"
            alt="Aashish Pandey, geometric editorial illustration, on a mountain road"
            id="AP / Field"
            caption="Pune, IN"
            variant="corner-br"
            aspect="h-full min-h-[600px] w-full"
            objectPosition="50% 28%"
            priority
          />
        </Reveal>
      </div>
    </section>
  );
}
