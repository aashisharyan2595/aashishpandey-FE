import CareerTimeline from "@/components/CareerTimeline";
import Footer from "@/components/Footer";
import Marquee from "@/components/Marquee";
import Navbar from "@/components/Navbar";
import Numbers from "@/components/Numbers";
import PageHero from "@/components/PageHero";
import PhotoFrame from "@/components/PhotoFrame";
import Reveal from "@/components/Reveal";
import { certifications, experience } from "@/lib/experience";
import { buildMetadata } from "@/lib/seo";

const skills = [
  "Delivery Planning",
  "Stakeholder Alignment",
  "Agile & Scrum",
  "Process Mapping (Visio)",
  "Jira & Azure DevOps",
  "CI/CD",
  "GA4 & GTM",
  "A/B Testing",
  "Shopify Plus",
  "Webflow & AEM",
  "Figma",
  "Vendor Negotiation",
];

export const metadata = buildMetadata({
  title: "About",
  description: "Project manager and technical delivery lead — career timeline, skills, and certifications.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pt-40 pb-28 md:px-12 md:pb-32">
        <PageHero
          eyebrow="About"
          title="Somewhere between project management and hands-on build."
          intro="Six years across agencies and product teams, running delivery for brands that can't afford a missed launch date. I still open the CMS myself when a project needs it."
        />

        <div className="mt-16 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-16">
          <Reveal>
            <p className="max-w-xl text-lg text-muted">
              Project manager and business analyst with 6+ years driving integrated
              delivery, operational efficiency, and stakeholder alignment in
              fast-paced media, advertising, and digital agency environments — for
              global Fortune 500 brands including Unilever, Wipro, Reliance, and ITC.
              Hands-on with the Microsoft delivery stack (MS Planner, MS Project, MS
              Visio, MS Teams, MS Loop) alongside Agile/Scrum frameworks in Jira,
              translating business objectives into plans and process maps that keep
              onshore and offshore teams aligned, paced, and unblocked.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="flex justify-center lg:justify-end">
            <PhotoFrame id="AP / About" caption="Pune, IN" aspect="aspect-[5/6]" rotate={-3} className="w-full max-w-xs" />
          </Reveal>
        </div>

        <Reveal delay={0.15} className="mt-16">
          <Marquee items={skills} />
        </Reveal>

        <div className="mt-24 -mx-6 border-y border-line md:-mx-12">
          <Numbers />
        </div>

        <Reveal className="mt-24">
          <p className="eyebrow">Career</p>
          <h2 className="font-display mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Where the last six years went.
          </h2>
        </Reveal>
        <CareerTimeline items={experience} />

        <Reveal className="mt-24 max-w-2xl">
          <p className="eyebrow">Certifications</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {certifications.map((c) => (
              <span key={c} className="tag">
                {c}
              </span>
            ))}
          </div>
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
