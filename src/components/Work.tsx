import Link from "next/link";
import Reveal from "@/components/Reveal";
import WorkGrid from "@/components/WorkGrid";
import { getCaseStudies } from "@/lib/case-studies";

export default async function Work() {
  const items = (await getCaseStudies()).slice(0, 3);

  return (
    <section id="work" className="border-b border-line px-6 py-24 md:px-12 md:py-28">
      <Reveal className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">Selected work</p>
        <Link href="/work" className="text-sm font-bold uppercase tracking-widest text-muted hover:text-interactive">
          View all →
        </Link>
      </Reveal>
      <WorkGrid items={items} />
    </section>
  );
}
