import Link from "next/link";
import Reveal from "@/components/Reveal";

export default function About() {
  return (
    <section id="about" className="border-b border-line px-6 py-24 md:px-12 md:py-28">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <Reveal>
          <p className="eyebrow">About</p>
          <p className="h2 mt-5 max-w-2xl">
            I like being the person who understands the roadmap and can still
            read the codebase — somewhere between project management and
            hands-on build.
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <Link href="/about" className="text-sm font-bold uppercase tracking-widest text-muted hover:text-interactive">
            Full career timeline →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
