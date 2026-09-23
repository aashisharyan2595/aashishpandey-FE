import Link from "next/link";
import Reveal from "@/components/Reveal";
import { worlds } from "@/lib/worlds";

export default function FourWorlds() {
  return (
    <section className="border-b border-line px-6 py-24 md:px-12 md:py-28">
      <Reveal className="flex items-baseline justify-between gap-4">
        <div>
          <p className="eyebrow">System</p>
          <h2 className="h1 mt-4 max-w-2xl">I work between four worlds.</h2>
        </div>
        <Link href="/about" className="text-sm font-bold uppercase tracking-widest text-muted hover:text-interactive">
          More on this →
        </Link>
      </Reveal>
      <div className="mt-10 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {worlds.map((w, i) => (
          <Reveal key={w.label} delay={i * 0.05} className="bg-background p-6">
            <p className="tabular text-sm font-black" style={{ color: "var(--gold)" }}>
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="h3 mt-3">{w.label}</h3>
            <p className="mt-2 text-sm text-muted">{w.detail}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
