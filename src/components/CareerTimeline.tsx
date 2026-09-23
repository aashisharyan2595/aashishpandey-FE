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
            className="card w-[85vw] max-w-md shrink-0 snap-start p-8"
          >
            <p className="tabular text-sm font-black" style={{ color: "var(--gold)" }}>
              {String(i + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </p>
            <p className="meta-mono mt-4">{item.period}</p>
            <h3 className="h3 mt-2">{item.role}</h3>
            <p className="text-muted">{item.company}</p>
            <ul className="body-sm mt-6 grid gap-3 text-muted">
              {item.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span className="mt-1 shrink-0" style={{ color: "var(--gold)" }}>
                    —
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
      <p className="meta">Scroll for more →</p>
    </div>
  );
}
