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
        <linearGradient id="about-sweep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff5a36" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ff5a36" stopOpacity="0" />
        </linearGradient>
        <filter id="about-blur">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <style>
          {`
            @keyframes av-spin { to { transform: rotate(360deg); } }
            @keyframes av-spin-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
            @keyframes av-pulse { 0%, 100% { r: 4; opacity: 1; } 50% { r: 5.5; opacity: 0.7; } }
            @keyframes av-breathe { 0%, 100% { opacity: 0.18; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.1); } }

            .av-sweep { transform-origin: 150px 160px; animation: av-spin 6s linear infinite; }
            .av-orbit-outer { transform-origin: 150px 160px; animation: av-spin 18s linear infinite; }
            .av-orbit-inner { transform-origin: 150px 160px; animation: av-spin-reverse 11s linear infinite; }
            .av-center { transform-origin: 150px 160px; animation: av-pulse 2.4s ease-in-out infinite; }
            .av-glow { transform-box: fill-box; transform-origin: center; animation: av-breathe 4s ease-in-out infinite; }

            @media (prefers-reduced-motion: reduce) {
              .av-sweep, .av-orbit-outer, .av-orbit-inner, .av-center, .av-glow {
                animation: none;
              }
            }
          `}
        </style>
      </defs>

      <rect width="300" height="360" rx="24" fill="url(#about-bg)" />
      <rect width="300" height="360" rx="24" fill="none" stroke="#f5f3ee" strokeOpacity="0.08" />

      <circle className="av-glow" cx="150" cy="150" r="90" fill="#ff5a36" opacity="0.18" filter="url(#about-blur)" />

      <g stroke="#ff5a36" strokeWidth="1" fill="none" opacity="0.8">
        <circle cx="150" cy="160" r="72" />
        <circle cx="150" cy="160" r="50" strokeOpacity="0.5" />
        <circle cx="150" cy="160" r="28" strokeOpacity="0.3" />
      </g>

      <g className="av-sweep">
        <line x1="150" y1="160" x2="150" y2="88" stroke="url(#about-sweep)" strokeWidth="2" />
      </g>

      <g className="av-orbit-outer">
        <circle cx="204" cy="112" r="3" fill="#f5f3ee" opacity="0.6" />
      </g>
      <g className="av-orbit-inner">
        <circle cx="90" cy="220" r="2.5" fill="#f5f3ee" opacity="0.4" />
      </g>

      <circle className="av-center" cx="150" cy="160" r="4" fill="#ff5a36" />

      <g fontFamily="var(--font-mono)" fontSize="10" fill="#8a8a86" letterSpacing="2">
        <text x="24" y="36">AP / 06</text>
        <text x="24" y="332">DELIVERY LEAD</text>
      </g>
    </svg>
  );
}
