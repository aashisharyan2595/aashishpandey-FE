import Link from "next/link";
import BlogList from "@/components/BlogList";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { getBlogPosts, getCategories } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Writing",
  description: "Notes on delivery, process, and shipping software.",
  path: "/blog",
});

export default async function BlogIndexPage() {
  const [posts, categories] = await Promise.all([getBlogPosts(), getCategories()]);

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pt-40 pb-28 md:px-12 md:pb-32">
        <PageHero
          eyebrow="Writing"
          title="Notes on delivery and shipping."
          intro="Field notes on process, tooling, and what actually moves a project forward."
        />

        {categories.length > 0 && (
          <Reveal delay={0.05} className="mt-10 flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c._id}
                href={`/blog/category/${c.slug}`}
                data-cursor-hover
                className="rounded-full border border-ink/10 px-4 py-1.5 text-sm hover:border-accent"
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
