type MetricColor = "gold" | "forest" | "sky";

const colorVar: Record<MetricColor, string> = {
  gold: "var(--accent)",
  forest: "var(--success)",
  sky: "var(--interactive)",
};

/**
 * A metric block — large tabular numeral + label, flat and bordered with a
 * single cut corner (the brand's "Cut" geometry primitive). Marks a real,
 * evidenced outcome; never decorative.
 */
export default function Stamp({
  value,
  label,
  color = "gold",
  size = "md",
  className,
}: {
  value: string;
  label: string;
  color?: MetricColor;
  tilt?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const pad = size === "lg" ? "p-8" : size === "sm" ? "p-4" : "p-6";
  const valueSize =
    size === "lg" ? "text-5xl md:text-6xl" : size === "sm" ? "text-2xl" : "text-3xl md:text-4xl";

  return (
    <div className={`card cut-corner-sm ${pad} ${className ?? ""}`} style={{ borderTopColor: colorVar[color] }}>
      <p className={`tabular font-black leading-none ${valueSize}`} style={{ color: colorVar[color] }}>
        {value}
      </p>
      <p className="eyebrow mt-3">{label}</p>
    </div>
  );
}
