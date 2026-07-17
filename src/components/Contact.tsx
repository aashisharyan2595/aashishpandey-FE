import Link from "next/link";
import Reveal from "@/components/Reveal";

export default function Contact() {
  return (
    <section id="contact" className="px-6 py-32 md:px-12">
      <Reveal>
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-muted">
          Get in touch
        </p>
        <h2 className="font-display mt-6 max-w-3xl text-4xl leading-[1.05] md:text-7xl">
          Say hello: <span className="text-accent">let&apos;s build something.</span>
        </h2>
        <p className="mt-6 max-w-xl text-lg text-muted">
          Hiring, a project in mind, or just want to say hi — the full contact
          page reaches me directly.
        </p>
        <Link
          href="/contact"
          data-cursor-hover
          className="mt-10 inline-block w-fit rounded-full bg-accent px-8 py-3 font-mono text-sm uppercase tracking-widest text-background transition-transform hover:scale-[1.03]"
        >
          Get in touch →
        </Link>
      </Reveal>
    </section>
  );
}
