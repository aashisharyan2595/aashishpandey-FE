import Image from "next/image";

/**
 * The crystalline "cut plane" photo treatment introduced on the homepage
 * hero — a chamfered mask (one small corner cut, one large diagonal facet
 * filled with the brand gold, a gold seam stroke) instead of a plain framed
 * card. Four variants put the large facet in a different corner each time,
 * so photos across the site read as the same family without being
 * identical. Pick a variant whose facet lands on background/negative space
 * in the source photo, never across the subject.
 */
export type FacetVariant = "corner-br" | "corner-bl" | "corner-tr" | "corner-tl";

const VARIANTS: Record<
  FacetVariant,
  { mask: string; facet: string; stroke: string; facetAt: "br" | "bl" | "tr" | "tl" }
> = {
  "corner-br": {
    mask: "polygon(14% 0%, 100% 0%, 100% 64%, 78% 100%, 0% 100%, 0% 18%)",
    facet: "polygon(100% 64%, 100% 100%, 78% 100%)",
    stroke: "14,0 100,0 100,64 78,100 0,100 0,18",
    facetAt: "br",
  },
  "corner-bl": {
    mask: "polygon(0% 0%, 86% 0%, 100% 18%, 100% 100%, 22% 100%, 0% 64%)",
    facet: "polygon(0% 64%, 0% 100%, 22% 100%)",
    stroke: "0,0 86,0 100,18 100,100 22,100 0,64",
    facetAt: "bl",
  },
  "corner-tr": {
    mask: "polygon(0% 0%, 64% 0%, 100% 22%, 100% 100%, 18% 100%, 0% 86%)",
    facet: "polygon(64% 0%, 100% 0%, 100% 22%)",
    stroke: "0,0 64,0 100,22 100,100 18,100 0,86",
    facetAt: "tr",
  },
  "corner-tl": {
    mask: "polygon(36% 0%, 100% 0%, 100% 86%, 82% 100%, 0% 100%, 0% 22%)",
    facet: "polygon(0% 0%, 36% 0%, 0% 22%)",
    stroke: "36,0 100,0 100,86 82,100 0,100 0,22",
    facetAt: "tl",
  },
};

export default function FacetPhoto({
  src,
  alt,
  id,
  caption,
  variant = "corner-br",
  aspect = "aspect-[4/5]",
  objectPosition = "50% 50%",
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  id: string;
  caption: string;
  variant?: FacetVariant;
  aspect?: string;
  objectPosition?: string;
  className?: string;
  priority?: boolean;
}) {
  const v = VARIANTS[variant];
  // The corner carrying the gold facet needs dark text; the corner still
  // sitting on the photo keeps the light caption colour.
  const idColor = v.facetAt === "bl" ? "var(--night)" : "var(--sand)";
  const captionColor = v.facetAt === "br" ? "var(--night)" : "var(--sand)";

  return (
    <div className={`relative ${aspect} overflow-hidden ${className ?? ""}`}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ clipPath: v.facet, background: "var(--gold)" }}
        aria-hidden
      />

      <div className="absolute inset-0" style={{ clipPath: v.mask }}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 42vw, 100vw"
          className="object-cover"
          style={{ objectPosition }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "linear-gradient(150deg, var(--gold) 0%, transparent 55%)",
            mixBlendMode: "color",
            opacity: 0.35,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(0deg, var(--night) 0%, transparent 22%)", opacity: 0.6 }}
        />
      </div>

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
      >
        <polygon points={v.stroke} fill="none" stroke="var(--gold)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
      </svg>

      <span
        className="pointer-events-none absolute bottom-4 left-4 text-[10px] font-bold uppercase tracking-[0.1em] opacity-80"
        style={{ color: idColor }}
      >
        {id}
      </span>
      <span
        className="pointer-events-none absolute bottom-4 right-4 text-[10px] font-bold uppercase tracking-[0.1em] opacity-90"
        style={{ color: captionColor }}
      >
        {caption}
      </span>
    </div>
  );
}
