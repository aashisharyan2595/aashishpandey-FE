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
    <section id="about" className="px-6 py-32 md:px-12">
      <Reveal>
        <h2 className="font-display max-w-3xl text-3xl leading-tight md:text-5xl">
          I like being the person who understands the roadmap and can still
          read the codebase — somewhere between project management and
          hands-on build.
        </h2>
      </Reveal>

      <Reveal delay={0.1} className="mt-16">
        <Marquee items={skills} />
      </Reveal>
    </section>
  );
}
