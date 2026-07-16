import Reveal from "@/components/Reveal";
import WorkGrid from "@/components/WorkGrid";
import { getProjects } from "@/lib/api";

export default async function Work() {
  const projects = await getProjects();

  return (
    <section id="work" className="px-6 py-32 md:px-12">
      <Reveal>
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-muted">
          Selected work
        </p>
      </Reveal>
      <WorkGrid projects={projects} />
    </section>
  );
}
