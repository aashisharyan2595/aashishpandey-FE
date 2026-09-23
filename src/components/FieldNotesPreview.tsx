import Link from "next/link";
import Reveal from "@/components/Reveal";
import { getBlogPosts } from "@/lib/blog";

const PULL_QUOTES = ["The road teaches you to read terrain.", "Good plans leave room for the road to change."];

export default async function FieldNotesPreview() {
  const posts = (await getBlogPosts()).slice(0, 3);

  return (
    <section className="border-b border-line px-6 py-24 md:px-12 md:py-28">
      <Reveal className="flex items-baseline justify-between gap-4">
        <div>
          <p className="eyebrow">Field</p>
          <h2 className="h1 mt-4 max-w-2xl">Field notes.</h2>
        </div>
        <Link href="/field-notes" className="text-sm font-bold uppercase tracking-widest text-muted hover:text-interactive">
          From the field →
        </Link>
      </Reveal>

      <Reveal delay={0.05} className="mt-8 grid gap-4 sm:grid-cols-2">
        {PULL_QUOTES.map((q) => (
          <p key={q} className="h3 max-w-sm border-l-2 pl-4" style={{ borderColor: "var(--gold)" }}>
            &ldquo;{q}&rdquo;
          </p>
        ))}
      </Reveal>

      {posts.length > 0 ? (
        <div className="mt-12 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={post._id} delay={i * 0.05} className="bg-background p-6">
              <Link href={`/field-notes/${post.slug}`} className="group block">
                <p className="meta-mono">{post.category ?? "Field"}</p>
                <h3 className="h3 mt-2 transition-colors group-hover:text-interactive">{post.title}</h3>
                <p className="mt-2 text-sm text-muted">{post.excerpt}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      ) : (
        <Reveal delay={0.1} className="mt-12 border border-dashed border-line p-10 text-center">
          <p className="eyebrow">Nothing filed yet</p>
          <p className="mt-3 text-muted">The first field note is on its way.</p>
        </Reveal>
      )}
    </section>
  );
}
