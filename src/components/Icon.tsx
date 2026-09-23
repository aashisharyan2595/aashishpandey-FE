/**
 * The site's geometric icon family — 24×24 grid, 1.5px stroke, sharp
 * corners, generous negative space. A small, deliberately limited set:
 * only the icons the UI actually uses, not the full theoretical catalogue.
 */
const paths: Record<string, React.ReactNode> = {
  arrowRight: <path d="M4 12h16M14 6l6 6-6 6" />,
  arrowUpRight: <path d="M7 17 17 7M8 7h9v9" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  plus: <path d="M12 4v16M4 12h16" />,
  mail: <path d="M4 6h16v12H4z M4 7l8 6 8-6" />,
  linkedin: <path d="M5 5h14v14H5z M8.5 10v6.5 M8.5 8.25v.01 M12 16.5V13a2 2 0 0 1 4 0v3.5 M12 13v3.5" />,
  external: <path d="M9 6h9v9 M18 6 6 18" />,
  check: <path d="M5 12.5 9.5 17 19 7" />,
};

export type IconName = keyof typeof paths;

export default function Icon({
  name,
  size = 18,
  strokeWidth = 1.5,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}
