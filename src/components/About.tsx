import AboutVisual from "@/components/AboutVisual";
import Marquee from "@/components/Marquee";
import Reveal from "@/components/Reveal";

const skills = [
  "Delivery Planning",
  "Stakeholder Alignment",
  "Agile & Scrum",
  "CMS Architecture",
  "GA4 & GTM",
  "Figma",
  "CI/CD",
];

export default function About() {
  return (
    <section id="about" className="px-6 py-24 md:px-12">
      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-16">
        <Reveal>
          <p className="font-mono text-sm uppercase tracking-[0.3em] text-muted">About</p>
          <h2 className="font-display mt-4 max-w-3xl text-3xl leading-tight md:text-4xl lg:text-5xl">
            I like being the person who understands the roadmap and can still
            read the codebase — somewhere between project management and
            hands-on build.
          </h2>
          <p className="mt-6 max-w-xl text-muted">
            Six years across agencies and product teams, running delivery for
            brands that can&apos;t afford a missed launch date. I still open the
            CMS myself when a project needs it.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="aspect-[5/6] w-full max-w-xs justify-self-center lg:justify-self-end">
          <AboutVisual />
        </Reveal>
      </div>

      <Reveal delay={0.15} className="mt-16">
        <Marquee items={skills} />
      </Reveal>
    </section>
  );
}
