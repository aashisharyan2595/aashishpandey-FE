import ContactPage from "@/components/warm/ContactPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact",
  description: "Start a project with Aashish Pandey, Technical Project Manager in Bangalore. Replies within 48 hours.",
  path: "/contact",
});

export default function Contact() {
  return <ContactPage />;
}
