import ContactForm from "@/components/ContactForm";
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
              Say hello: <span className="text-accent">let&apos;s build something.</span>
            </>
          }
          intro="Whether you're hiring, have a project in mind, or just want to say hi — this reaches me directly."
        />

        <div className="mt-16 grid gap-16 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <p className="font-mono text-sm uppercase tracking-widest text-muted">
              Email
            </p>
            <a
              href="mailto:hello@aashishpandey.com"
              data-cursor-hover
              className="mt-2 block font-display text-2xl hover:text-accent md:text-3xl"
            >
              hello@aashishpandey.com
            </a>

            <p className="mt-10 font-mono text-sm uppercase tracking-widest text-muted">
              Elsewhere
            </p>
            <div className="mt-2 grid gap-2">
              <a
                href="https://linkedin.com/in/aashish-kumar-pandey"
                data-cursor-hover
                className="block hover:text-accent"
              >
                LinkedIn
              </a>
              <a
                href="https://github.com/aashisharyan2595"
                data-cursor-hover
                className="block hover:text-accent"
              >
                GitHub
              </a>
            </div>
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
