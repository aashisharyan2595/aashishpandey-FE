import Image from "next/image";

/**
 * A photo slot, framed flat with a single cut corner (the brand's "Cut"
 * geometry primitive) — no rotation, no tape, no glassmorphism, per the UI
 * foundation. Pass `src` once a real photo exists; until then it renders a
 * clearly-labelled pending state rather than fake art.
 *
 * `objectPosition` lets each placement choose where the subject sits when
 * the frame's aspect ratio crops the source image — the geometric artworks
 * are tall (9:16-ish) and each one's subject sits at a different point in
 * frame, so a single centred crop doesn't suit all of them.
 */
export default function PhotoFrame({
  src,
  alt = "",
  id,
  caption,
  aspect = "aspect-[4/5]",
  objectPosition = "50% 50%",
  className,
}: {
  src?: string;
  alt?: string;
  id: string;
  caption: string;
  aspect?: string;
  objectPosition?: string;
  className?: string;
}) {
  return (
    <div
      className={`card cut-corner group overflow-hidden transition-colors duration-300 hover:border-[var(--gold)] ${className ?? ""}`}
    >
      <div className={`relative overflow-hidden ${aspect} bg-[var(--surface)]`}>
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="480px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            style={{ objectPosition }}
          />
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
