import Link from "next/link";
import CaseStudyCover from "@/components/CaseStudyCover";
import Icon from "@/components/Icon";
import Reveal from "@/components/Reveal";
import type { CaseStudy } from "@/lib/case-studies";

export default function WorkGrid({ items }: { items: CaseStudy[] }) {
  if (items.length === 0) {
    return (
      <div className="mt-16 border border-dashed border-line p-10 text-center">
        <p className="eyebrow">No matches</p>
        <p className="mt-3 text-muted">Nothing filed under that discipline yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-16 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item, i) => (
        <Reveal key={item.slug} delay={i * 0.04} className="bg-background">
          <Link href={`/work/${item.slug}`} className="group block h-full">
            <div className="relative aspect-[4/3] overflow-hidden">
              <CaseStudyCover
                slug={item.slug}
                label={item.title}
                coverImage={item.coverImage}
                metric={item.metric}
                className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
              {/* The typographic cover already features the metric in large
                  type — the badge is only needed as an accent over a real
                  photo, where it'd otherwise have no metric visible at all. */}
              {item.coverImage && <span className="tag absolute right-3 top-3 bg-background/90">{item.metric.value}</span>}
            </div>

            <div className="p-6">
              <p className="meta-mono">
                {String(i + 1).padStart(2, "0")} · {item.client.split(",")[0]} · {item.timeframe.split(/[\s–]/)[0]}
              </p>
              <h3 className="h3 mt-2 transition-colors group-hover:text-interactive">{item.title}</h3>
              <p className="body-sm mt-2 text-muted">{item.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest text-muted transition-all group-hover:gap-3 group-hover:text-interactive">
                View project
                <Icon name="arrowRight" size={14} />
              </span>
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
