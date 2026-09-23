import Link from "next/link";
import FacetPhoto from "@/components/FacetPhoto";
import Reveal from "@/components/Reveal";
import { getBlogPosts } from "@/lib/blog";

const PULL_QUOTES = ["The road teaches you to read terrain.", "Good plans leave room for the road to change."];

export default async function FieldNotesPreview() {
  const posts = (await getBlogPosts()).slice(0, 3);

  return (
    <section className="border-b border-line px-6 py-24 md:px-12 md:py-28">
      <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Field</p>
          <h2 className="h1 mt-4 max-w-2xl">Field notes.</h2>
        </div>
        <Link href="/field-notes" className="text-sm font-bold uppercase tracking-widest text-muted hover:text-interactive">
          From the field →
        </Link>
      </Reveal>

      <div className="mt-10 grid gap-10 md:grid-cols-[220px_1fr] md:items-center md:gap-12">
        <Reveal scaleIn delay={0.05}>
          <FacetPhoto
            src="/images/aashish-checking-time.webp"
            alt="Aashish Pandey checking the time on a ride, geometric editorial illustration"
            id="AP / Field"
            caption="On schedule"
            variant="corner-tr"
            aspect="aspect-[4/5]"
            objectPosition="50% 20%"
            className="w-full max-w-[220px]"
          />
        </Reveal>
        <Reveal delay={0.1} className="grid gap-4 sm:grid-cols-2">
          {PULL_QUOTES.map((q) => (
            <p key={q} className="h3 max-w-sm border-l-2 pl-4" style={{ borderColor: "var(--gold)" }}>
              &ldquo;{q}&rdquo;
            </p>
          ))}
        </Reveal>
      </div>

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
