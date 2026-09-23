import Link from "next/link";
import Reveal from "@/components/Reveal";

export default function About() {
  return (
    <section id="about" className="border-b border-line px-6 py-24 md:px-12 md:py-28">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <Reveal>
          <p className="eyebrow">About</p>
          <p className="h2 mt-5 max-w-2xl">
            A developer&apos;s curiosity. A designer&apos;s eye. A project
            manager&apos;s discipline.
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <Link href="/about" className="text-sm font-bold uppercase tracking-widest text-muted hover:text-interactive">
            Field, system, orbit →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
