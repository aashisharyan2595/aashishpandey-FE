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

  const title = post.seoTitle || `${post.title} — Aashish Pandey`;
  const description = post.seoDescription || post.excerpt;
  const image = post.ogImage || post.coverImage;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://aashishpandey.com/blog/${slug}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: post.ogImage || post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: { "@type": "Person", name: "Aashish Pandey", url: "https://aashishpandey.com" },
    mainEntityOfPage: `https://aashishpandey.com/blog/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1 px-6 pt-40 pb-28 md:px-12 md:pb-32">
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
                <Link
                  key={tag}
                  href={`/blog/tag/${tag}`}
                  data-cursor-hover
                  className="rounded-full border border-ink/10 px-3 py-1 hover:border-accent"
                >
                  {tag}
                </Link>
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
