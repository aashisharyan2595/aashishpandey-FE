import type { Metadata } from "next";
import Link from "next/link";
import BlogList from "@/components/BlogList";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Reveal from "@/components/Reveal";
import { getBlogPosts, getCategories } from "@/lib/blog";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  const name = category?.name ?? slug;
  return {
    title: `${name} — Writing — Aashish Pandey`,
    description: `Posts filed under ${name}.`,
  };
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const [posts, categories] = await Promise.all([
    getBlogPosts({ category: slug }),
    getCategories(),
  ]);
  const category = categories.find((c) => c.slug === slug);

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pt-40 pb-32 md:px-12">
        <Reveal>
          <Link
            href="/blog"
            data-cursor-hover
            className="font-mono text-sm uppercase tracking-widest text-muted hover:text-accent"
          >
            ← All writing
          </Link>
          <p className="font-mono mt-8 text-sm uppercase tracking-[0.3em] text-muted">
            Category
          </p>
          <h1 className="font-display mt-4 max-w-2xl text-4xl leading-tight md:text-6xl">
            {category?.name ?? slug}
          </h1>
        </Reveal>

        <BlogList posts={posts} />
      </main>
      <Footer />
    </>
  );
}
