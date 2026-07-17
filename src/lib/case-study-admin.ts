export type CaseStudyRecord = {
  _id: string;
  title: string;
  slug: string;
  client: string;
  timeframe: string;
  summary: string;
  tags: string[];
  problem: string;
  approach: string;
  outcome: string;
  metric: { value: string; label: string };
  coverImage?: string;
  featured: boolean;
  order: number;
  published: boolean;
  updatedAt?: string;
};
