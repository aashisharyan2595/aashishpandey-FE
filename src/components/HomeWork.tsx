import Image from "next/image";
import Link from "next/link";
import CaseStudyCover from "@/components/CaseStudyCover";
import Icon from "@/components/Icon";
import Reveal from "@/components/Reveal";
import type { CaseStudy } from "@/lib/case-studies";

/**
 * The homepage's proof section — five genuinely different compositions
 * instead of five identical cards (Sprint 01 §8/§9). Each tile's layout is
 * chosen to fit what that specific project actually has: a real photo gets
 * to dominate, a project with only a metric gets to be typographic, and the
 * international-expansion story gets a wide interruption banner instead of
 * competing for space in a grid cell.
 */
export default function HomeWork({ items }: { items: CaseStudy[] }) {
  const [dominant, split, typographic, banner, compact] = items;

  return (
    <div className="mt-16 flex flex-col gap-px overflow-hidden border border-line bg-line">
      {dominant && <DominantTile item={dominant} index={1} />}

      <div className="grid gap-px lg:grid-cols-[1.4fr_1fr]">
        {split && <SplitTile item={split} index={2} />}
        {typographic && <TypographicTile item={typographic} index={3} />}
      </div>

      {banner && <BannerTile item={banner} index={4} />}

      {compact && <CompactTile item={compact} index={5} />}
    </div>
  );
}

function TileMeta({ item, index }: { item: CaseStudy; index: number }) {
  return (
    <p className="meta-mono">
      {String(index).padStart(2, "0")} · {item.client.split(",")[0]} · {item.timeframe.split(/[\s–]/)[0]}
    </p>
  );
}

function TileTags({ item }: { item: CaseStudy }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {item.tags.map((tag) => (
        <span key={tag} className="tag">
          {tag}
        </span>
      ))}
    </div>
  );
}

function ViewProject() {
  return (
    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest text-muted transition-all group-hover:gap-3 group-hover:text-interactive">
      View project
      <Icon name="arrowRight" size={14} />
    </span>
  );
}

// 01 — dominant visual feature: the case study with the strongest real
// photography gets to fill the full width, image-forward with the copy
// overlaid rather than boxed off to one side.
function DominantTile({ item, index }: { item: CaseStudy; index: number }) {
  return (
    <Reveal>
      <Link href={`/work/${item.slug}`} className="group relative block bg-background">
        <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/9] lg:aspect-[21/9]">
          {item.coverImage ? (
            <Image
              src={item.coverImage}
              alt={item.title}
              fill
              sizes="100vw"
              priority
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <CaseStudyCover slug={item.slug} label={item.title} metric={item.metric} className="h-full w-full" />
          )}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(0deg, rgba(16,22,24,0.85) 0%, rgba(16,22,24,0.05) 45%, transparent 65%)" }}
          />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
            <TileMeta item={item} index={index} />
            <h3 className="h1 mt-3 max-w-2xl" style={{ color: "var(--sand)" }}>
              {item.title}
            </h3>
            <p className="body mt-3 max-w-xl" style={{ color: "var(--sand)", opacity: 0.85 }}>
              {item.summary}
            </p>
            <TileTags item={item} />
            <ViewProject />
          </div>
          <span className="tag absolute right-4 top-4 md:right-6 md:top-6" style={{ background: "var(--gold)", color: "var(--night)", borderColor: "var(--gold)" }}>
            {item.metric.value}
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

// 02 — asymmetrical editorial split: photo and copy as two unequal columns
// rather than a card with an image cap.
function SplitTile({ item, index }: { item: CaseStudy; index: number }) {
  return (
    <Reveal delay={0.05} className="grid gap-px bg-line sm:grid-cols-[1.1fr_1fr]">
      <Link href={`/work/${item.slug}`} className="group relative block overflow-hidden bg-background">
        <div className="relative aspect-[4/3] h-full">
          {item.coverImage ? (
            <Image
              src={item.coverImage}
              alt={item.title}
              fill
              sizes="(min-width: 1024px) 33vw, 100vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <CaseStudyCover slug={item.slug} label={item.title} metric={item.metric} className="h-full w-full" />
          )}
        </div>
      </Link>
      <Link href={`/work/${item.slug}`} className="group flex flex-col justify-center bg-background p-6 md:p-8">
        <TileMeta item={item} index={index} />
        <h3 className="h2 mt-3 transition-colors group-hover:text-interactive">{item.title}</h3>
        <p className="body-sm mt-2 text-muted">{item.summary}</p>
        <TileTags item={item} />
        <ViewProject />
      </Link>
    </Reveal>
  );
}

// 03 — large typographic metric: no photography to lean on, so the number
// itself is the visual — set big, on its own plane, not squeezed into a
// small badge beside a placeholder image.
function TypographicTile({ item, index }: { item: CaseStudy; index: number }) {
  return (
    <Reveal delay={0.1}>
      <Link
        href={`/work/${item.slug}`}
        className="group flex h-full flex-col justify-between bg-background p-6 md:p-8"
        style={{ background: "var(--surface)" }}
      >
        <div>
          <TileMeta item={item} index={index} />
          <p className="display-l mt-4 leading-none" style={{ color: "var(--gold)" }}>
            {item.metric.value}
          </p>
          <p className="label mt-2 text-muted">{item.metric.label}</p>
        </div>
        <div>
          <h3 className="h3 transition-colors group-hover:text-interactive">{item.title}</h3>
          <p className="body-sm mt-2 text-muted">{item.summary}</p>
          <TileTags item={item} />
          <ViewProject />
        </div>
      </Link>
    </Reveal>
  );
}

// 04 — visual interruption: a full-bleed wide banner that breaks the
// section's rhythm, the way FieldBreak breaks the rest of the homepage.
// Suits Liquid I.V. specifically — the story is about breadth (nine
// storefronts), which reads better wide and short than boxed square.
function BannerTile({ item, index }: { item: CaseStudy; index: number }) {
  return (
    <Reveal delay={0.05}>
      <Link href={`/work/${item.slug}`} className="group relative block bg-background">
        <div className="relative aspect-[16/9] overflow-hidden sm:aspect-[3/1]">
          {item.coverImage ? (
            <Image
              src={item.coverImage}
              alt={item.title}
              fill
              sizes="100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <CaseStudyCover slug={item.slug} label={item.title} metric={item.metric} className="h-full w-full" />
          )}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(100deg, rgba(16,22,24,0.88) 0%, rgba(16,22,24,0.35) 55%, transparent 85%)" }}
          />
          <div className="absolute inset-y-0 left-0 flex max-w-lg flex-col justify-center p-6 md:p-10">
            <TileMeta item={item} index={index} />
            <h3 className="h2 mt-3" style={{ color: "var(--sand)" }}>
              {item.title}
            </h3>
            <p className="body-sm mt-2" style={{ color: "var(--sand)", opacity: 0.85 }}>
              {item.summary}
            </p>
            <ViewProject />
          </div>
          <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 text-right md:block">
            <p className="display-l leading-none" style={{ color: "var(--gold)" }}>
              {item.metric.value}
            </p>
            <p className="label mt-1" style={{ color: "var(--sand)", opacity: 0.7 }}>
              {item.metric.label}
            </p>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

// 05 — compact closing feature, paired with the section's own close-out
// CTA so the sequence ends on a deliberate beat rather than just stopping.
function CompactTile({ item, index }: { item: CaseStudy; index: number }) {
  return (
    <Reveal delay={0.05} className="grid gap-px bg-line sm:grid-cols-[1fr_1fr]">
      <Link href={`/work/${item.slug}`} className="group flex flex-col justify-center bg-background p-6 md:p-8">
        <TileMeta item={item} index={index} />
        <h3 className="h3 mt-2 transition-colors group-hover:text-interactive">{item.title}</h3>
        <p className="body-sm mt-2 text-muted">{item.summary}</p>
        <TileTags item={item} />
        <ViewProject />
      </Link>
      <Link
        href="/work"
        className="group flex flex-col items-start justify-center gap-2 bg-background p-6 md:p-8"
        style={{ background: "var(--surface)" }}
      >
        <p className="eyebrow">Full archive</p>
        <p className="h3 transition-colors group-hover:text-interactive">See all five, in depth.</p>
        <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest text-muted transition-all group-hover:gap-3 group-hover:text-interactive">
          View all work
          <Icon name="arrowRight" size={14} />
        </span>
      </Link>
    </Reveal>
  );
}
