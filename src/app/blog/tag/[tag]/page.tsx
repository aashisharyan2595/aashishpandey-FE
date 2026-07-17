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
  };
}

export default async function BlogTagPage({ params }: { params: Promise<Params> }) {
  const { tag } = await params;
  const posts = await getBlogPosts({ tag });

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pt-40 pb-24 md:px-12">
        <Reveal>
          <Link
            href="/blog"
            data-cursor-hover
            className="font-mono text-sm uppercase tracking-widest text-muted hover:text-accent"
          >
            ← All writing
          </Link>
          <p className="font-mono mt-8 text-sm uppercase tracking-[0.3em] text-muted">Tag</p>
          <h1 className="font-display mt-4 max-w-2xl text-4xl leading-tight md:text-6xl">
            #{tag}
          </h1>
        </Reveal>

        <BlogList posts={posts} />
      </main>
      <Footer />
    </>
  );
}
