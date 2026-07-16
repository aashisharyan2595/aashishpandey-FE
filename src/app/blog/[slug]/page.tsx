import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlockRenderer from "@/components/BlockRenderer";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Reveal from "@/components/Reveal";
import { getBlogPostBySlug } from "@/lib/blog";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} — Aashish Pandey`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pt-40 pb-32 md:px-12">
        <Reveal className="max-w-3xl">
          <Link
            href="/blog"
            data-cursor-hover
            className="font-mono text-sm uppercase tracking-widest text-muted hover:text-accent"
          >
            ← All writing
          </Link>
          <h1 className="font-display mt-8 text-4xl leading-tight md:text-6xl">
            {post.title}
          </h1>
          {post.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2 text-xs uppercase tracking-widest text-muted">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Reveal>

        <Reveal delay={0.1} className="mt-20 max-w-3xl">
          <BlockRenderer blocks={post.blocks} />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
