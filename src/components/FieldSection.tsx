import Reveal from "@/components/Reveal";
import OperatingField from "@/components/OperatingField";

// Homepage introduction to the Operating Field — placed right after the
// opening statement, per the concept: the visitor learns how the work
// moves before seeing what's shipped.
export default function FieldSection() {
  return (
    <section id="field" className="border-b border-line px-6 py-24 md:px-12 md:py-28">
      <Reveal className="max-w-2xl">
        <p className="eyebrow">How it moves</p>
        <h2 className="h1 mt-4">The Operating Field.</h2>
        <p className="body mt-4 text-muted">
          Every project here moves through the same field — product, design, technology and delivery,
          converging into work that ships. Select a capability to see where it actually shows up.
        </p>
      </Reveal>
      <Reveal delay={0.08} className="mt-14">
        <OperatingField />
      </Reveal>
    </section>
  );
}
