/**
 * The Orbit-mode signature motif — a ring, a node, two signal lines. Used
 * sparingly (the guideline's 10% experimental layer), never as a repeated
 * decorative pattern. No cyberpunk, no neon — the cyan stays a quiet accent.
 * The node drifts slowly around the ring — the one "systems in motion"
 * touch on the page — and stops entirely under reduced motion.
 */
export default function OrbitMark({ className }: { className?: string }) {
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden className={className}>
      <style>{`
        .orbit-spin { transform-origin: 44px 44px; animation: orbit-spin 26s linear infinite; }
        @keyframes orbit-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .orbit-spin { animation: none; } }
      `}</style>
      <circle cx="44" cy="44" r="30" stroke="var(--orbit)" strokeWidth="1" opacity="0.5" />
      <ellipse cx="44" cy="44" rx="30" ry="12" stroke="var(--orbit)" strokeWidth="1" opacity="0.35" />
      <g className="orbit-spin">
        <circle cx="74" cy="44" r="2.5" fill="var(--orbit)" />
      </g>
      <path d="M44 14v8M44 62v12" stroke="var(--orbit)" strokeWidth="1" opacity="0.4" />
      <circle cx="44" cy="44" r="3" fill="var(--gold)" />
    </svg>
  );
}
