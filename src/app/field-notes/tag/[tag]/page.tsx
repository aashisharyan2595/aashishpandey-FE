import type { Metadata } from "next";
import Link from "next/link";
import BlogList from "@/components/BlogList";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Reveal from "@/components/Reveal";
import { getBlogPosts } from "@/lib/blog";

type Params = { tag: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${tag} — Writing — Aashish Pandey`,
    description: `Posts tagged ${tag}.`,
    alternates: { canonical: `/field-notes/tag/${tag}` },
  };
}

export default async function BlogTagPage({ params }: { params: Promise<Params> }) {
  const { tag } = await params;
  const posts = await getBlogPosts({ tag });

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pt-40 pb-28 md:px-12 md:pb-32">
        <Reveal>
          <Link href="/field-notes" className="text-sm font-bold uppercase tracking-widest text-muted hover:text-interactive">
            ← All writing
          </Link>
          <p className="eyebrow mt-8">Tag</p>
          <h1 className="display-l mt-4 max-w-2xl">#{tag}</h1>
        </Reveal>

        <BlogList posts={posts} />
      </main>
      <Footer />
    </>
  );
}
