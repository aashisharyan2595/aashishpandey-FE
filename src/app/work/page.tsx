import WorkPage from "@/components/warm/WorkPage";
import { getCaseStudies } from "@/lib/case-studies";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Work",
  description: "Selected delivery work by Aashish Pandey: Liquid I.V. across Europe, Wipro D2C, Magnum Canada, StoryNest and Zebronics. 35+ platforms shipped, 99% on time.",
  path: "/work",
});

export default async function Work() {
  const items = await getCaseStudies();
  return <WorkPage caseStudies={items} />;
}
