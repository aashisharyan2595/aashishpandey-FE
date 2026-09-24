import RidePage from "@/components/warm/RidePage";
import { getCaseStudies } from "@/lib/case-studies";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Ride",
  description: "Aashish Pandey's career as a ride: 4 levels, 5 checkpoints, 35+ projects shipped since 2018.",
  path: "/ride",
});

export default async function Ride() {
  const items = await getCaseStudies();
  return <RidePage caseStudies={items} />;
}
