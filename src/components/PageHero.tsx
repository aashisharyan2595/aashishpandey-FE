import type { ReactNode } from "react";
import Reveal from "@/components/Reveal";

export default function PageHero({
  eyebrow,
  title,
  intro,
  index,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: string;
  index?: string;
}) {
  return (
    <Reveal className="border-b border-ink/10 pb-16">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-muted">{eyebrow}</p>
        {index && <p className="font-mono text-sm text-muted">{index}</p>}
      </div>
      <h1 className="font-display mt-6 max-w-3xl text-5xl leading-[1.05] md:text-7xl">
        {title}
      </h1>
      {intro && <p className="mt-6 max-w-xl text-lg text-muted">{intro}</p>}
    </Reveal>
  );
}
