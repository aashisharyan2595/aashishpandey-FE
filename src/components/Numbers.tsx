import Reveal from "@/components/Reveal";
import Stamp from "@/components/Stamp";

const stats: { value: string; label: string; color: "amber" | "green" | "cobalt" }[] = [
  { value: "6+", label: "Years running delivery", color: "cobalt" },
  { value: "35+", label: "Platforms shipped", color: "amber" },
  { value: "99%", label: "On-time delivery rate", color: "green" },
  { value: "+50%", label: "Best traffic growth delivered", color: "amber" },
];

export default function Numbers() {
  return (
    <section className="border-b border-line px-6 py-16 md:px-12">
      <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.05} className="flex flex-col items-center text-center">
            <Stamp value={stat.value} label={stat.label} color={stat.color} tilt={i % 2 === 0 ? -6 : 6} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
