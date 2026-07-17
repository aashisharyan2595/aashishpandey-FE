import Link from "next/link";
import Reveal from "@/components/Reveal";
import WorkGrid from "@/components/WorkGrid";
import { getCaseStudies } from "@/lib/case-studies";

export default function Work() {
  const items = getCaseStudies().slice(0, 3);

  return (
    <section id="work" className="px-6 py-24 md:px-12">
      <Reveal className="flex items-baseline justify-between gap-4">
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-muted">
          Selected work
        </p>
        <Link
          href="/work"
          data-cursor-hover
          className="font-mono text-sm uppercase tracking-widest text-muted hover:text-accent"
        >
          View all →
        </Link>
      </Reveal>
      <WorkGrid items={items} />
    </section>
  );
}
