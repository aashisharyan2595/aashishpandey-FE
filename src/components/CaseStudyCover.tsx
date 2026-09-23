/**
 * Placeholder cover for a case study / post — a small abstract low-poly
 * "plane / facet" arrangement in brand colour, deterministic per slug. The
 * brand guideline's authenticity rule forbids ever presenting a fabricated
 * screenshot as real evidence, so this stays honestly abstract and labelled
 * pending rather than mocking up a fake browser window. Swap for a real
 * screenshot via `coverImage` once one exists.
 */
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETTE = ["#3E4A3D", "#28352D", "#77734B", "#5E97AF", "#B39A55", "#EEE4CF"];

export default function CaseStudyCover({
  slug,
  label,
  className,
}: {
  slug: string;
  label: string;
  className?: string;
}) {
  const rand = mulberry32(hashSeed(slug));

  // A handful of large coherent planes, not hundreds of tiny random facets —
  // per the guideline's geometry hierarchy and do/don't matrix.
  const planes = Array.from({ length: 6 }, () => {
    const cx = rand() * 400;
    const cy = rand() * 300;
    const r = 90 + rand() * 160;
    const a1 = rand() * Math.PI * 2;
    const a2 = a1 + 1.4 + rand() * 1.6;
    const a3 = a2 + 1.4 + rand() * 1.6;
    const pt = (a: number) => `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
    return {
      points: `${pt(a1)} ${pt(a2)} ${pt(a3)}`,
      fill: PALETTE[Math.floor(rand() * PALETTE.length)],
      opacity: 0.5 + rand() * 0.4,
    };
  });

  return (
    <div className={`relative overflow-hidden bg-[var(--night)] ${className ?? ""}`}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
        {planes.map((p, i) => (
          <polygon key={i} points={p.points} fill={p.fill} opacity={p.opacity} />
        ))}
      </svg>
      <span className="absolute left-3 top-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--sand)] opacity-70">
        {label.split(" ")[0]}
      </span>
      <span className="absolute bottom-3 right-3 text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--sand)] opacity-50">
        Cover pending
      </span>
    </div>
  );
}
