import Link from "next/link";
import HomeWork from "@/components/HomeWork";
import Reveal from "@/components/Reveal";
import { getCaseStudies } from "@/lib/case-studies";

export default async function Work() {
  const items = await getCaseStudies();

  return (
    <section id="work" className="border-b border-line px-6 py-24 md:px-12 md:py-28">
      <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Things I&apos;ve shipped</p>
          <p className="body mt-2 text-muted">Real work, real constraints, real delivery.</p>
        </div>
        <Link href="/work" className="text-sm font-bold uppercase tracking-widest text-muted hover:text-interactive">
          View all →
        </Link>
      </Reveal>
      <HomeWork items={items} />
    </section>
  );
}
