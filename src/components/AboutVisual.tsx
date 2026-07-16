export default function AboutVisual() {
  return (
    <svg
      viewBox="0 0 300 360"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <linearGradient id="about-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#141416" />
          <stop offset="100%" stopColor="#0b0b0c" />
        </linearGradient>
        <filter id="about-blur">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>

      <rect width="300" height="360" rx="24" fill="url(#about-bg)" />
      <rect width="300" height="360" rx="24" fill="none" stroke="#f5f3ee" strokeOpacity="0.08" />

      <circle cx="150" cy="150" r="90" fill="#ff5a36" opacity="0.18" filter="url(#about-blur)" />

      <g stroke="#ff5a36" strokeWidth="1" fill="none" opacity="0.8">
        <circle cx="150" cy="160" r="72" />
        <circle cx="150" cy="160" r="50" strokeOpacity="0.5" />
        <circle cx="150" cy="160" r="28" strokeOpacity="0.3" />
      </g>

      <circle cx="150" cy="160" r="4" fill="#ff5a36" />
      <circle cx="204" cy="112" r="3" fill="#f5f3ee" opacity="0.6" />
      <circle cx="90" cy="220" r="2.5" fill="#f5f3ee" opacity="0.4" />

      <g fontFamily="var(--font-mono)" fontSize="10" fill="#8a8a86" letterSpacing="2">
        <text x="24" y="36">AP / 06</text>
        <text x="24" y="332">DELIVERY LEAD</text>
      </g>
    </svg>
  );
}
