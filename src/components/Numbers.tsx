import Reveal from "@/components/Reveal";

const stats = [
  { value: "6+", label: "Years running delivery" },
  { value: "4", label: "Global brands shipped for" },
  { value: "+50%", label: "Best traffic growth delivered" },
  { value: "40%", label: "Capacity gained from process design" },
];

export default function Numbers() {
  return (
    <section className="border-y border-white/10 px-6 py-20 md:px-12">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-6">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.05}>
            <p className="font-display text-4xl text-accent md:text-5xl">{stat.value}</p>
            <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted">
              {stat.label}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
