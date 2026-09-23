import Image from "next/image";
import Link from "next/link";
import CaseStudyCover from "@/components/CaseStudyCover";
import Icon from "@/components/Icon";
import Reveal from "@/components/Reveal";
import type { CaseStudy } from "@/lib/case-studies";

/**
 * The homepage's proof section — one consistent card style across all five
 * projects (a first pass tried five different layouts per project; it read
 * as busy and inconsistent rather than editorial). Bigger and more spaced
 * out than the dense /work archive grid: two per row, generous padding,
 * larger type — so it reads as considered rather than a compressed index.
 */
export default function HomeWork({ items }: { items: CaseStudy[] }) {
  return (
    <div className="mt-16 grid gap-10 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-16">
      {items.map((item, i) => (
        <Reveal key={item.slug} delay={i * 0.06} className={i === 0 ? "sm:col-span-2" : undefined}>
          <Link href={`/work/${item.slug}`} className="group block">
            <div className={`relative overflow-hidden border border-line ${i === 0 ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
              {item.coverImage ? (
                <Image
                  src={item.coverImage}
                  alt={item.title}
                  fill
                  priority={i === 0}
                  sizes={i === 0 ? "100vw" : "(min-width: 640px) 50vw, 100vw"}
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              ) : (
                <CaseStudyCover
                  slug={item.slug}
                  label={item.title}
                  metric={item.metric}
                  className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              )}
            </div>

            <div className="mt-6">
              <p className="meta-mono">
                {String(i + 1).padStart(2, "0")} · {item.client.split(",")[0]} · {item.timeframe.split(/[\s–]/)[0]}
              </p>
              <h3 className={`${i === 0 ? "h1" : "h2"} mt-3 transition-colors group-hover:text-interactive`}>
                {item.title}
              </h3>
              <p className={`${i === 0 ? "body-l" : "body"} mt-3 max-w-2xl text-muted`}>{item.summary}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="tag" style={{ borderColor: "var(--gold)", color: "var(--gold)" }}>
                  {item.metric.value}
                </span>
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
