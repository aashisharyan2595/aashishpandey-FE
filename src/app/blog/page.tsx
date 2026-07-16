import type { Metadata } from "next";
import Link from "next/link";
import BlogList from "@/components/BlogList";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Reveal from "@/components/Reveal";
import { getBlogPosts, getCategories } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Writing — Aashish Pandey",
  description: "Notes on delivery, process, and shipping software.",
};

export default async function BlogIndexPage() {
  const [posts, categories] = await Promise.all([getBlogPosts(), getCategories()]);

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pt-40 pb-32 md:px-12">
        <Reveal>
          <p className="font-mono text-sm uppercase tracking-[0.3em] text-muted">
            Writing
          </p>
          <h1 className="font-display mt-4 max-w-2xl text-4xl leading-tight md:text-6xl">
            Notes on delivery and shipping.
          </h1>
        </Reveal>

        {categories.length > 0 && (
          <Reveal delay={0.05} className="mt-10 flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c._id}
                href={`/blog/category/${c.slug}`}
                data-cursor-hover
                className="rounded-full border border-white/10 px-4 py-1.5 text-sm hover:border-accent"
              >
                {c.name}
              </Link>
            ))}
          </Reveal>
        )}

        <BlogList posts={posts} />
      </main>
      <Footer />
    </>
  );
}
