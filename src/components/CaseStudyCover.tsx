/**
 * Placeholder cover for a case study / blog post image slot. Flat, quiet,
 * clearly marked as pending — swapped for a real photo via `coverImage`
 * once one exists, never dressed up to look like finished art.
 */
export default function CaseStudyCover({
  slug,
  label,
  className,
}: {
  slug: string;
  label: string;
  className?: string;
}) {
  const initial = label.trim().charAt(0).toUpperCase() || "*";

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-[var(--surface-1)] ${className ?? ""}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, color-mix(in srgb, var(--ink) 7%, transparent) 0px, color-mix(in srgb, var(--ink) 7%, transparent) 1px, transparent 1px, transparent 11px)",
      }}
      aria-hidden
    >
      <span className="font-display text-[6rem] font-extrabold leading-none text-[var(--ink)] opacity-[0.07] md:text-[9rem]">
        {initial}
      </span>
      <span className="absolute left-3 top-3 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted">
        IMG · {slug.slice(0, 10)}
      </span>
      {/* corner registration marks, like a print-ready bounding box */}
      <span className="absolute left-2 top-2 h-3 w-3 border-l border-t border-line" />
      <span className="absolute right-2 top-2 h-3 w-3 border-r border-t border-line" />
      <span className="absolute bottom-2 left-2 h-3 w-3 border-b border-l border-line" />
      <span className="absolute bottom-2 right-2 h-3 w-3 border-b border-r border-line" />
    </div>
  );
}
