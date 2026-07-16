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

function blobPath(cx: number, cy: number, r: number, rand: () => number): string {
  const points = 7;
  const step = (Math.PI * 2) / points;
  const coords: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const angle = i * step;
    const radius = r * (0.72 + rand() * 0.32);
    coords.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  let d = `M ${coords[0][0]} ${coords[0][1]} `;
  for (let i = 0; i < points; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[(i + 1) % points];
    const mx = (x1 + x2) / 2 + (rand() - 0.5) * r * 0.3;
    const my = (y1 + y2) / 2 + (rand() - 0.5) * r * 0.3;
    d += `Q ${mx} ${my} ${x2} ${y2} `;
  }
  return d + "Z";
}

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

  const blobs = Array.from({ length: 3 }, () => ({
    cx: 60 + rand() * 280,
    cy: 40 + rand() * 220,
    r: 60 + rand() * 90,
    opacity: 0.16 + rand() * 0.22,
  }));

  const rotation = Math.floor(rand() * 12 - 6);
  const gridGap = 28;
  const initial = label.trim().charAt(0).toUpperCase() || "*";

  return (
    <svg
      viewBox="0 0 400 300"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id={`bg-${slug}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#141416" />
          <stop offset="100%" stopColor="#0b0b0c" />
        </linearGradient>
        <filter id={`blur-${slug}`}>
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <pattern
          id={`grid-${slug}`}
          width={gridGap}
          height={gridGap}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={1} cy={1} r={1} fill="#f5f3ee" opacity={0.08} />
        </pattern>
      </defs>

      <rect width="400" height="300" fill={`url(#bg-${slug})`} />
      <rect width="400" height="300" fill={`url(#grid-${slug})`} />

      <g filter={`url(#blur-${slug})`}>
        {blobs.map((b, i) => (
          <path
            key={i}
            d={blobPath(b.cx, b.cy, b.r, rand)}
            fill="#ff5a36"
            opacity={b.opacity}
          />
        ))}
      </g>

      <g transform={`rotate(${rotation} 200 150)`}>
        <path
          d={blobPath(200, 150, 78, rand)}
          fill="none"
          stroke="#ff5a36"
          strokeWidth={1.5}
          opacity={0.7}
        />
      </g>

      <text
        x="24"
        y="270"
        fontFamily="var(--font-display)"
        fontSize="120"
        fill="#f5f3ee"
        opacity={0.06}
      >
        {initial}
      </text>
    </svg>
  );
}
