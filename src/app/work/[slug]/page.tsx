import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CaseStudyCover from "@/components/CaseStudyCover";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
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

/* Renamed toward the brand book's case-study vocabulary (Context / The
   decisions / The evidence) — but kept to the three real content fields
   the data actually has rather than forcing the brief's full eight-stage
   structure onto content that doesn't exist for it. */
const SECTIONS = [
  { key: "problem" as const, label: "Context" },
  { key: "approach" as const, label: "The response" },
  { key: "outcome" as const, label: "The evidence" },
];

export default async function CaseStudyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const item = await getCaseStudyBySlug(slug);
  if (!item) notFound();

  const all = await getCaseStudies();
  const next = all[(all.findIndex((c) => c.slug === slug) + 1) % all.length];

  const metaRows: [string, string][] = [
    ["Client", item.client],
    ["Timeframe", item.timeframe],
    ["Disciplines", item.tags.join(", ")],
    ["Status", "Shipped"],
  ];

  return (
    <>
      <Navbar />
      <main className="flex-1 pb-24">
        <div className="relative mt-24 aspect-[16/9] w-full overflow-hidden border-b border-line md:mt-28 md:aspect-[21/9]">
          <CaseStudyCover
            slug={item.slug}
            label={item.title}
            coverImage={item.coverImage}
            className="h-full w-full"
          />
        </div>

        <div className="px-6 md:px-12">
          <Reveal className="mt-10 max-w-3xl">
            <Link href="/work" className="text-sm font-bold uppercase tracking-widest text-muted hover:text-interactive">
              ← All work
            </Link>
            <p className="eyebrow mt-8">Case study</p>
            <h1 className="display-l mt-4">{item.title}</h1>
          </Reveal>

          <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <Reveal delay={0.04}>
              <dl className="grid gap-5 border-t border-line pt-6 lg:sticky lg:top-28">
                {metaRows.map(([label, value]) => (
                  <div key={label}>
                    <dt className="meta-mono opacity-70">{label}</dt>
                    <dd className="mt-1 text-sm font-bold">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-8">
                <Stamp value={item.metric.value} label={item.metric.label} color="forest" size="md" />
              </div>
            </Reveal>

            <div className="grid gap-16">
              {SECTIONS.map((section, i) => (
                <Reveal key={section.key} delay={0.06 + i * 0.05}>
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
          </div>

          <Reveal delay={0.1} className="mt-32 max-w-3xl border-t border-line pt-12">
            <p className="eyebrow">Next up</p>
            <Link href={`/work/${next.slug}`} className="group mt-4 flex items-center justify-between gap-4">
              <h3 className="h2 transition-colors group-hover:text-interactive">{next.title}</h3>
              <Icon
                name="arrowRight"
                className="shrink-0 text-muted transition-all group-hover:translate-x-1 group-hover:text-interactive"
              />
            </Link>
          </Reveal>
        </div>
      </main>
      <Footer />
    </>
  );
}
