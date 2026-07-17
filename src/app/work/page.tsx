import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Reveal from "@/components/Reveal";
import WorkGrid from "@/components/WorkGrid";
import { getCaseStudies } from "@/lib/case-studies";

export const metadata: Metadata = {
  title: "Work — Aashish Pandey",
  description: "Delivery case studies from Unilever, Wipro, and other engagements.",
};

export default function WorkIndexPage() {
  const items = getCaseStudies();

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pt-40 pb-24 md:px-12">
        <Reveal>
          <p className="font-mono text-sm uppercase tracking-[0.3em] text-muted">
            All work
          </p>
          <h1 className="font-display mt-4 max-w-2xl text-4xl leading-tight md:text-6xl">
            Delivery case studies.
          </h1>
        </Reveal>
        <WorkGrid items={items} />
      </main>
      <Footer />
    </>
  );
}
