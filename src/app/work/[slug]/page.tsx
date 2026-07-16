import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CaseStudyCover from "@/components/CaseStudyCover";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Reveal from "@/components/Reveal";
import { getCaseStudies, getCaseStudyBySlug } from "@/lib/case-studies";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getCaseStudies().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getCaseStudyBySlug(slug);
  if (!item) return {};
  return {
    title: `${item.title} — Aashish Pandey`,
    description: item.summary,
  };
}

const SECTIONS = [
  { key: "problem" as const, label: "The problem" },
  { key: "approach" as const, label: "The approach" },
  { key: "outcome" as const, label: "The outcome" },
];

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const item = getCaseStudyBySlug(slug);
  if (!item) notFound();

  const all = getCaseStudies();
  const next = all[(all.findIndex((c) => c.slug === slug) + 1) % all.length];

  return (
    <>
      <Navbar />
      <main className="flex-1 pb-32">
        <div className="relative mt-24 aspect-[16/9] w-full overflow-hidden md:mt-28 md:aspect-[21/9]">
          <CaseStudyCover slug={item.slug} label={item.title} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        <div className="px-6 md:px-12">
          <Reveal className="-mt-16 max-w-3xl md:-mt-24">
            <Link
              href="/work"
              data-cursor-hover
              className="font-mono text-sm uppercase tracking-widest text-muted hover:text-accent"
            >
              ← All work
            </Link>
            <p className="mt-8 font-mono text-sm uppercase tracking-[0.3em] text-muted">
              {item.client} — {item.timeframe}
            </p>
            <h1 className="font-display mt-4 text-4xl leading-tight md:text-6xl">
              {item.title}
            </h1>
            <div className="mt-6 flex flex-wrap gap-2 text-xs uppercase tracking-widest text-muted">
              {item.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.05} className="mt-16 max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-8">
            <p className="font-display text-4xl text-accent md:text-5xl">{item.metric.value}</p>
            <p className="mt-2 font-mono text-sm uppercase tracking-widest text-muted">
              {item.metric.label}
            </p>
          </Reveal>

          <div className="mt-20 grid max-w-3xl gap-16">
            {SECTIONS.map((section, i) => (
              <Reveal key={section.key} delay={i * 0.05}>
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-sm text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-display text-2xl md:text-3xl">{section.label}</h2>
                </div>
                <p className="mt-4 max-w-2xl text-lg text-muted">{item[section.key]}</p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1} className="mt-32 max-w-3xl border-t border-white/10 pt-12">
            <p className="font-mono text-sm uppercase tracking-[0.3em] text-muted">Next up</p>
            <Link
              href={`/work/${next.slug}`}
              data-cursor-hover
              className="group mt-4 flex items-baseline justify-between gap-4"
            >
              <h3 className="font-display text-2xl transition-colors group-hover:text-accent md:text-4xl">
                {next.title}
              </h3>
              <span className="shrink-0 font-mono text-sm uppercase tracking-widest text-muted group-hover:text-accent">
                →
              </span>
            </Link>
          </Reveal>
        </div>
      </main>
      <Footer />
    </>
  );
}
