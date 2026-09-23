import ContactForm from "@/components/ContactForm";
import FacetPhoto from "@/components/FacetPhoto";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact",
  description: "Get in touch about delivery work, roles, or project collaborations.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pt-40 pb-28 md:px-12 md:pb-32">
        <PageHero
          eyebrow="Contact"
          title={
            <>
              Have a <span style={{ color: "var(--gold)" }}>complicated digital project?</span>
            </>
          }
          intro="If you're building, redesigning, migrating or scaling a digital product or website, tell me what you're working on."
        />

        <div className="mt-16 grid gap-16 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <p className="eyebrow">Two ways to reach me</p>
            <p className="mt-3 max-w-sm text-sm text-muted">
              Hiring for a role, or have a project that needs delivery, product,
              or hands-on technical work — pick the closer fit in the form.
            </p>
            <p className="eyebrow mt-10">Email</p>
            <a href="mailto:hello@aashishpandey.com" className="h2 mt-2 block hover:text-interactive">
              hello@aashishpandey.com
            </a>

            <p className="eyebrow mt-10">Elsewhere</p>
            <div className="mt-2 grid gap-2">
              <a href="https://linkedin.com/in/aashish-kumar-pandey" className="block hover:text-interactive">
                LinkedIn
              </a>
              <a href="https://github.com/aashisharyan2595" className="block hover:text-interactive">
                GitHub
              </a>
            </div>

            <FacetPhoto
              src="/images/aashish-roadside.webp"
              alt="Aashish Pandey sitting roadside next to his motorcycle, geometric editorial illustration"
              id="AP / Field"
              caption="Pune, IN"
              variant="corner-tr"
              aspect="aspect-[4/5]"
              objectPosition="50% 15%"
              className="mt-10 w-full max-w-[220px]"
            />
          </Reveal>

          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </main>
      <Footer />
    </>
  );
}
