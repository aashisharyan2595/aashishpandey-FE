import Marquee from "@/components/Marquee";
import Reveal from "@/components/Reveal";

const skills = [
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Three.js",
  "GSAP",
  "Design Systems",
];

export default function About() {
  return (
    <section id="about" className="px-6 py-32 md:px-12">
      <Reveal>
        <h2 className="font-display max-w-3xl text-3xl leading-tight md:text-5xl">
          I like building interfaces that surprise people a little —
          somewhere between engineering and play.
        </h2>
      </Reveal>

      <Reveal delay={0.1} className="mt-16">
        <Marquee items={skills} />
      </Reveal>
    </section>
  );
}
