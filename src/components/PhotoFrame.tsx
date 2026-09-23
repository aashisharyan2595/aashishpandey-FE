import Image from "next/image";

/**
 * A photo slot, framed flat with a single cut corner (the brand's "Cut"
 * geometry primitive) — no rotation, no tape, no glassmorphism, per the UI
 * foundation. Pass `src` once a real photo exists; until then it renders a
 * clearly-labelled pending state rather than fake art.
 */
export default function PhotoFrame({
  src,
  alt = "",
  id,
  caption,
  aspect = "aspect-[4/5]",
  className,
}: {
  src?: string;
  alt?: string;
  id: string;
  caption: string;
  aspect?: string;
  rotate?: number;
  className?: string;
}) {
  return (
    <div className={`card cut-corner overflow-hidden ${className ?? ""}`}>
      <div className={`relative ${aspect} bg-[var(--surface)]`}>
        {src ? (
          <Image src={src} alt={alt} fill sizes="480px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-muted opacity-60">
              <rect x="3" y="5" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="8.5" cy="10" r="1.4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3 16.5 8 12l3 2.5 3.5-4 6.5 6" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span className="eyebrow opacity-80">Portrait pending</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-line px-4 py-3">
        <span className="meta">{id}</span>
        <span className="meta">{caption}</span>
      </div>
    </div>
  );
}
