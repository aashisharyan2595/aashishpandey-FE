import Reveal from "@/components/Reveal";
import type { ExperienceEntry } from "@/lib/experience";

export default function CareerTimeline({ items }: { items: ExperienceEntry[] }) {
  return (
    <div className="mt-10">
      <div className="timeline-scroll flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6">
        {items.map((item, i) => (
          <Reveal
            key={`${item.company}-${item.role}`}
            delay={i * 0.05}
            className="w-[85vw] max-w-md shrink-0 snap-start rounded-2xl border border-ink/10 bg-ink/[0.03] p-8 backdrop-blur-md"
          >
            <p className="font-display text-5xl text-accent">
              {String(i + 1).padStart(2, "0")}
            </p>
            <p className="mt-6 font-mono text-xs uppercase tracking-widest text-muted">
              {item.period}
            </p>
            <h3 className="font-display mt-2 text-2xl">{item.role}</h3>
            <p className="text-muted">{item.company}</p>
            <ul className="mt-6 grid gap-3 text-sm text-muted">
              {item.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span className="mt-1 shrink-0 text-accent">—</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        Scroll for more →
      </p>
    </div>
  );
}
