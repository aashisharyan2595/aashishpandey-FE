export type Project = {
  title: string;
  slug: string;
  summary: string;
  tags: string[];
  liveUrl?: string;
  repoUrl?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const fallbackProjects: Project[] = [
  {
    title: "Placeholder Project One",
    slug: "placeholder-one",
    summary: "Swap this out once real project data is in the CMS.",
    tags: ["Next.js", "TypeScript"],
  },
  {
    title: "Placeholder Project Two",
    slug: "placeholder-two",
    summary: "Swap this out once real project data is in the CMS.",
    tags: ["Node.js", "MongoDB"],
  },
  {
    title: "Placeholder Project Three",
    slug: "placeholder-three",
    summary: "Swap this out once real project data is in the CMS.",
    tags: ["Three.js", "WebGL"],
  },
];

export async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${API_URL}/api/projects`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return fallbackProjects;
    const data = (await res.json()) as Project[];
    return data.length > 0 ? data : fallbackProjects;
  } catch {
    return fallbackProjects;
  }
}
