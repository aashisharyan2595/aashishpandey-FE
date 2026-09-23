import Link from "next/link";
import PhotoFrame from "@/components/PhotoFrame";
import Reveal from "@/components/Reveal";

export default function About() {
  return (
    <section id="about" className="border-b border-line px-6 py-24 md:px-12 md:py-28">
      <div className="grid gap-10 md:grid-cols-[1fr_24rem] md:items-center">
        <Reveal>
          <p className="eyebrow">About</p>
          <p className="h2 mt-5 max-w-2xl">
            A developer&apos;s curiosity. A designer&apos;s eye. A project
            manager&apos;s discipline.
          </p>
          <Link
            href="/about"
            className="mt-6 inline-block text-sm font-bold uppercase tracking-widest text-muted hover:text-interactive"
          >
            Field, system, orbit →
          </Link>
        </Reveal>
        <Reveal scaleIn delay={0.1} className="flex justify-center md:justify-end">
          <PhotoFrame
            src="/images/aashish-overlook.webp"
            alt="Aashish Pandey on his motorcycle overlooking a valley, geometric editorial illustration"
            id="AP / About"
            caption="Pune, IN"
            aspect="aspect-[16/10]"
            objectPosition="50% 40%"
            className="w-full max-w-sm"
          />
        </Reveal>
      </div>
    </section>
  );
}
