import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const item = getCaseStudyBySlug(slug);
  if (!item) notFound();

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pt-40 pb-32 md:px-12">
        <Reveal className="max-w-3xl">
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

        <div className="mt-20 grid max-w-3xl gap-16">
          <Reveal>
            <h2 className="font-display text-2xl text-accent md:text-3xl">The problem</h2>
            <p className="mt-4 max-w-2xl text-lg text-muted">{item.problem}</p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-display text-2xl text-accent md:text-3xl">The approach</h2>
            <p className="mt-4 max-w-2xl text-lg text-muted">{item.approach}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display text-2xl text-accent md:text-3xl">The outcome</h2>
            <p className="mt-4 max-w-2xl text-lg text-muted">{item.outcome}</p>
          </Reveal>
        </div>
      </main>
      <Footer />
    </>
  );
}
