import Link from "next/link";
import Reveal from "@/components/Reveal";
import Stamp from "@/components/Stamp";

export default function Contact() {
  return (
    <section id="contact" className="px-6 py-24 md:px-12 md:py-28">
      <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
        <Reveal>
          <p className="eyebrow">Get in touch</p>
          <h2 className="display-l mt-5 max-w-2xl">
            Have a <span style={{ color: "var(--gold)" }}>complicated digital project?</span>
          </h2>
          <p className="body-l mt-6 max-w-xl text-muted">
            If you&apos;re building, redesigning, migrating or scaling a digital
            product or website, tell me what you&apos;re working on.
          </p>
          <Link href="/contact" className="btn btn-primary mt-8">
            Let&apos;s talk →
          </Link>
        </Reveal>
        <Reveal delay={0.1} className="hidden lg:block">
          <Stamp value="Reply" label="Within 48h" color="sky" />
        </Reveal>
      </div>
    </section>
  );
}
