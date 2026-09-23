import Link from "next/link";
import CaseStudyCover from "@/components/CaseStudyCover";
import Reveal from "@/components/Reveal";
import type { CaseStudy } from "@/lib/case-studies";

export default function WorkGrid({ items }: { items: CaseStudy[] }) {
  return (
    <div className="mt-16 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item, i) => (
        <Reveal key={item.slug} delay={i * 0.04} className="bg-background">
          <Link href={`/work/${item.slug}`} className="group block h-full">
            <div className="relative aspect-[4/3] overflow-hidden">
              <CaseStudyCover
                slug={item.slug}
                label={item.title}
                className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <span className="tag absolute right-3 top-3 bg-background/90">
                {item.metric.value}
              </span>
            </div>

            <div className="p-6">
              <p className="eyebrow">
                {String(i + 1).padStart(2, "0")} · {item.client.split(",")[0]}
              </p>
              <h3 className="font-display mt-2 text-xl font-bold leading-tight transition-colors group-hover:text-accent md:text-2xl">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-muted">{item.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
