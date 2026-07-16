import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Reveal from "@/components/Reveal";
import { getBlogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Writing — Aashish Pandey",
  description: "Notes on delivery, process, and shipping software.",
};

export default async function BlogIndexPage() {
  const posts = await getBlogPosts();

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

        {posts.length === 0 ? (
          <Reveal delay={0.1} className="mt-20">
            <p className="max-w-md text-muted">
              Nothing published yet — check back soon.
            </p>
          </Reveal>
        ) : (
          <div className="mt-16 divide-y divide-white/10 border-t border-white/10">
            {posts.map((post, i) => (
              <Reveal key={post._id} delay={i * 0.05}>
                <Link
                  href={`/blog/${post.slug}`}
                  data-cursor-hover
                  className="group flex flex-col gap-2 py-8 md:flex-row md:items-baseline md:justify-between"
                >
                  <h2 className="font-display text-2xl transition-colors group-hover:text-accent md:text-4xl">
                    {post.title}
                  </h2>
                  <p className="max-w-md text-muted">{post.excerpt}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
