type StampColor = "amber" | "green" | "cobalt";

const colorClass: Record<StampColor, string> = {
  amber: "stamp-amber",
  green: "stamp-green",
  cobalt: "stamp-cobalt",
};

/**
 * The site's signature element: an ink stamp, like the ones on a shipping
 * manifest marking a parcel ON TIME / DELIVERED. Used wherever there's a
 * real, shipped outcome to mark — never decoratively.
 */
export default function Stamp({
  value,
  label,
  color = "amber",
  tilt = -7,
  size = "md",
  className,
}: {
  value: string;
  label: string;
  color?: StampColor;
  tilt?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass =
    size === "lg" ? "w-36 h-36 md:w-44 md:h-44" : size === "sm" ? "w-20 h-20" : "w-28 h-28";

  return (
    <div
      className={`stamp ${colorClass[color]} ${sizeClass} ${className ?? ""}`}
      style={{ "--stamp-tilt": `${tilt}deg` } as React.CSSProperties}
    >
      <span
        className={`font-display leading-none ${
          size === "lg" ? "text-3xl md:text-4xl" : size === "sm" ? "text-base" : "text-xl md:text-2xl"
        }`}
      >
        {value}
      </span>
      <span className="mt-1 text-[0.55rem] tracking-[0.18em]">{label}</span>
    </div>
  );
}
