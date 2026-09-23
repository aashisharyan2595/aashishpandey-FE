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
    <Reveal className="border-b border-line pb-16">
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">{eyebrow}</p>
        {index && <p className="meta tabular">{index}</p>}
      </div>
      <h1 className="display-l mt-6 max-w-3xl">{title}</h1>
      {intro && <p className="mt-6 max-w-xl text-lg text-muted">{intro}</p>}
    </Reveal>
  );
}
