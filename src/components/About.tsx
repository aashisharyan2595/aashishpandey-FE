import Link from "next/link";
import Reveal from "@/components/Reveal";

export default function About() {
  return (
    <section id="about" className="border-b border-line px-6 py-24 md:px-12 md:py-28">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <Reveal>
          <p className="eyebrow">About</p>
          <p className="font-display mt-5 max-w-2xl text-2xl font-medium leading-tight tracking-tight md:text-4xl">
            I like being the person who understands the roadmap and can still
            read the codebase — somewhere between project management and
            hands-on build.
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <Link
            href="/about"
            className="font-mono text-sm uppercase tracking-widest text-muted hover:text-accent"
          >
            Full career timeline →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
