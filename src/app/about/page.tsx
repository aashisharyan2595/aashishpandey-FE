import CareerTimeline from "@/components/CareerTimeline";
import Footer from "@/components/Footer";
import Marquee from "@/components/Marquee";
import Navbar from "@/components/Navbar";
import Numbers from "@/components/Numbers";
import OrbitMark from "@/components/OrbitMark";
import PageHero from "@/components/PageHero";
import PhotoFrame from "@/components/PhotoFrame";
import Reveal from "@/components/Reveal";
import { certifications, experience } from "@/lib/experience";
import { buildMetadata } from "@/lib/seo";
import { worlds } from "@/lib/worlds";

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

const orbitCerts = ["Prompt Engineering — freeCodeCamp", "Python Fundamentals — Scaler", "DevOps Essentials — Linux Academy"];

export const metadata = buildMetadata({
  title: "About",
  description: "Project manager and technical delivery lead — field, system, orbit.",
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

        {/* FIELD — grounded, personal */}
        <Reveal delay={0.05} className="mt-16 grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <PhotoFrame
            src="/images/aashish-road.webp"
            alt="Aashish Pandey, geometric editorial illustration, packed for a ride"
            id="AP / Field"
            caption="On the road"
            aspect="aspect-[4/5]"
            className="w-full max-w-xs justify-self-start"
          />
          <div>
            <p className="eyebrow">Field</p>
            <p className="mt-4 max-w-md text-muted">
              Most weekends away from the CMS look like this — a road, a bike, and
              a route that isn&apos;t on anyone&apos;s roadmap. Managing uncertainty
              on a route and managing it in a project plan aren&apos;t that different.
            </p>
          </div>
        </Reveal>

        {/* SYSTEM — career, technology, delivery */}
        <Reveal className="mt-24">
          <p className="eyebrow">System</p>
          <h2 className="h1 mt-4 max-w-2xl">I work between four worlds.</h2>
          <p className="mt-4 max-w-xl text-muted">
            I started as a developer, moved into technical team leadership, and
            eventually into project management — while keeping the hands-on
            technical understanding from where I started.
          </p>
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

        <div className="mt-24 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-16">
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
            <PhotoFrame
              src="/images/aashish-about.jpg"
              alt="Aashish Pandey, geometric editorial illustration, on a mountain road"
              id="AP / About"
              caption="Pune, IN"
              aspect="aspect-[5/6]"
              className="w-full max-w-xs"
            />
          </Reveal>
        </div>

        <Reveal delay={0.15} className="mt-16">
          <Marquee items={skills} />
        </Reveal>

        <div className="mt-24 -mx-6 border-y border-line md:-mx-12">
          <Numbers />
        </div>

        <Reveal className="mt-24">
          <p className="eyebrow">System / Career</p>
          <h2 className="h1 mt-4 max-w-2xl">Where the last six years went.</h2>
        </Reveal>
        <CareerTimeline items={experience} />

        {/* ORBIT — curiosity, what comes next */}
        <Reveal className="mt-24 grid gap-8 border-t border-line pt-16 lg:grid-cols-[auto_1fr] lg:items-start">
          <OrbitMark className="shrink-0" />
          <div>
            <p className="eyebrow" style={{ color: "var(--orbit)" }}>
              Orbit
            </p>
            <h2 className="h1 mt-4 max-w-2xl">Staying curious about what&apos;s next.</h2>
            <p className="mt-4 max-w-xl text-muted">
              Delivery is the day job; the curiosity runs a layer above it —
              picking up the fundamentals of the tools reshaping how digital
              work gets built.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {orbitCerts.map((c) => (
                <span key={c} className="tag">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

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
