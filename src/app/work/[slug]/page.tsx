import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WorkCasePage from "@/components/warm/WorkCasePage";
import { DISPLAY_ORDER } from "@/components/warm/work-data";
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

export default async function CaseStudyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const item = await getCaseStudyBySlug(slug);
  if (!item) notFound();

  const all = await getCaseStudies();
  const ordered = [...all].sort((a, b) => DISPLAY_ORDER.indexOf(a.slug) - DISPLAY_ORDER.indexOf(b.slug));
  const index = ordered.findIndex((c) => c.slug === slug);
  const next = ordered[(index + 1) % ordered.length];

  return <WorkCasePage item={item} index={index} total={ordered.length} next={next} />;
}
