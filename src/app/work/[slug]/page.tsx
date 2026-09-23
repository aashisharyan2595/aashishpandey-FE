import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CaseStudyCover from "@/components/CaseStudyCover";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Reveal from "@/components/Reveal";
import Stamp from "@/components/Stamp";
import { getCaseStudies, getCaseStudyBySlug } from "@/lib/case-studies";
import { buildMetadata } from "@/lib/seo";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const studies = await getCaseStudies();
  return studies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getCaseStudyBySlug(slug);
  if (!item) return {};
  return buildMetadata({
    title: item.title,
    description: item.summary,
    path: `/work/${slug}`,
    image: item.coverImage,
  });
}

const SECTIONS = [
  { key: "problem" as const, label: "The problem" },
  { key: "approach" as const, label: "The approach" },
  { key: "outcome" as const, label: "The outcome" },
];

export default async function CaseStudyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const item = await getCaseStudyBySlug(slug);
  if (!item) notFound();

  const all = await getCaseStudies();
  const next = all[(all.findIndex((c) => c.slug === slug) + 1) % all.length];

  return (
    <>
      <Navbar />
      <main className="flex-1 pb-24">
        <div className="relative mt-24 aspect-[16/9] w-full overflow-hidden border-b border-line md:mt-28 md:aspect-[21/9]">
          <CaseStudyCover slug={item.slug} label={item.title} className="h-full w-full" />
        </div>

        <div className="px-6 md:px-12">
          <Reveal className="mt-10 max-w-3xl">
            <Link href="/work" className="text-sm font-bold uppercase tracking-widest text-muted hover:text-interactive">
              ← All work
            </Link>
            <p className="eyebrow mt-8">
              {item.client} — {item.timeframe}
            </p>
            <h1 className="display-l mt-4">{item.title}</h1>
            <div className="mt-6 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.05} className="mt-16">
            <Stamp value={item.metric.value} label={item.metric.label} color="forest" size="lg" />
          </Reveal>

          <div className="mt-20 grid max-w-3xl gap-16">
            {SECTIONS.map((section, i) => (
              <Reveal key={section.key} delay={i * 0.05}>
                <div className="flex items-baseline gap-4">
                  <span className="tabular text-sm font-black" style={{ color: "var(--gold)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="h2">{section.label}</h2>
                </div>
                <p className="mt-4 max-w-2xl text-lg text-muted">{item[section.key]}</p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1} className="mt-32 max-w-3xl border-t border-line pt-12">
            <p className="eyebrow">Next up</p>
            <Link href={`/work/${next.slug}`} className="group mt-4 flex items-baseline justify-between gap-4">
              <h3 className="h2 transition-colors group-hover:text-interactive">{next.title}</h3>
              <span className="shrink-0 text-sm font-bold uppercase tracking-widest text-muted group-hover:text-interactive">
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
