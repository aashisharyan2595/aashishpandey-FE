import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import WorkGrid from "@/components/WorkGrid";
import { getCaseStudies } from "@/lib/case-studies";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Work",
  description: "Delivery case studies from Unilever, Wipro, and other engagements.",
  path: "/work",
});

export default async function WorkIndexPage() {
  const items = await getCaseStudies();

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pt-40 pb-28 md:px-12 md:pb-32">
        <PageHero
          eyebrow="All work"
          title="Delivery case studies."
          intro="Real engagements — the problem, the approach, and what shipped."
          index={`0${items.length}`.slice(-2) + " total"}
        />
        <WorkGrid items={items} />
      </main>
      <Footer />
    </>
  );
}
