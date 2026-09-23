import Image from "next/image";

/**
 * A photo, framed like a print clipped to a manifest page. Pass `src` once
 * real photos exist — until then it renders a clearly-marked placeholder so
 * the layout and captions are already right.
 */
export default function PhotoFrame({
  src,
  alt = "",
  id,
  caption,
  aspect = "aspect-[4/5]",
  rotate = -2,
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
    <div
      className={`photo-frame ${className ?? ""}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div className={`photo-frame__area ${aspect}`}>
        {src ? (
          <Image src={src} alt={alt} fill sizes="480px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-muted opacity-60">
              <rect x="3" y="5" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="8.5" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M3 16.5 8 12l3 2.5 3.5-4 6.5 6" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted opacity-70">
              Photo pending
            </span>
          </div>
        )}
      </div>
      <div className="photo-frame__caption">
        <span>{id}</span>
        <span>{caption}</span>
      </div>
    </div>
  );
}
