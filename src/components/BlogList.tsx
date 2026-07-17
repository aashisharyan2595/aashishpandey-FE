import Image from "next/image";
import Link from "next/link";
import CaseStudyCover from "@/components/CaseStudyCover";
import Reveal from "@/components/Reveal";
import type { BlogPostSummary } from "@/lib/blog";

export default function BlogList({ posts }: { posts: BlogPostSummary[] }) {
  if (posts.length === 0) {
    return (
      <Reveal delay={0.1} className="mt-20">
        <p className="max-w-md text-muted">Nothing published here yet — check back soon.</p>
      </Reveal>
    );
  }

  return (
    <div className="mt-16 divide-y divide-ink/10 border-t border-ink/10">
      {posts.map((post, i) => (
        <Reveal key={post._id} delay={i * 0.05}>
          <Link
            href={`/blog/${post.slug}`}
            data-cursor-hover
            className="group flex flex-col gap-4 py-8 sm:flex-row sm:items-center"
          >
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl sm:w-32">
              {post.coverImage ? (
                <Image
                  src={post.coverImage}
                  alt=""
                  fill
                  sizes="128px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <CaseStudyCover slug={post.slug} label={post.title} className="h-full w-full" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="font-display text-2xl transition-colors group-hover:text-accent md:text-4xl">
                {post.title}
              </h2>
              <p className="max-w-md text-muted">{post.excerpt}</p>
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
