import Reveal from "@/components/Reveal";
import Stamp from "@/components/Stamp";

const stats: { value: string; label: string; color: "gold" | "forest" | "sky" }[] = [
  { value: "6+", label: "Years running delivery", color: "sky" },
  { value: "35+", label: "Platforms shipped", color: "gold" },
  { value: "99%", label: "On-time delivery rate", color: "forest" },
  { value: "+50%", label: "Best traffic growth delivered", color: "gold" },
];

export default function Numbers() {
  return (
    <section className="border-b border-line px-6 py-16 md:px-12">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.05}>
            <Stamp value={stat.value} label={stat.label} color={stat.color} className="h-full" />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
