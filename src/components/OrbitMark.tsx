/**
 * The Orbit-mode signature motif — a ring, a node, two signal lines. Used
 * sparingly (the guideline's 10% experimental layer), never as a repeated
 * decorative pattern. No cyberpunk, no neon — the cyan stays a quiet accent.
 */
export default function OrbitMark({ className }: { className?: string }) {
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden className={className}>
      <circle cx="44" cy="44" r="30" stroke="var(--orbit)" strokeWidth="1" opacity="0.5" />
      <ellipse cx="44" cy="44" rx="30" ry="12" stroke="var(--orbit)" strokeWidth="1" opacity="0.35" />
      <circle cx="70" cy="38" r="2.5" fill="var(--orbit)" />
      <path d="M44 14v8M44 62v12" stroke="var(--orbit)" strokeWidth="1" opacity="0.4" />
      <circle cx="44" cy="44" r="3" fill="var(--gold)" />
    </svg>
  );
}
