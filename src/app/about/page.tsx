import AboutPage from "@/components/warm/AboutPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  description: "Aashish Pandey: Technical Project Manager in Bangalore with 6+ years across Unilever, Wipro, Reliance and ITC. Experience, skills, education and certifications.",
  path: "/about",
});

export default function About() {
  return <AboutPage />;
}
