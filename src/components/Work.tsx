import Link from "next/link";
import Reveal from "@/components/Reveal";
import WorkGrid from "@/components/WorkGrid";
import { getCaseStudies } from "@/lib/case-studies";

export default async function Work() {
  const items = (await getCaseStudies()).slice(0, 3);

  return (
    <section id="work" className="px-6 py-28 md:px-12 md:py-32">
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
