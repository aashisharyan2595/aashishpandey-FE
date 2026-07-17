import type { MetadataRoute } from "next";
import { getCaseStudies } from "@/lib/case-studies";
import { getBlogPosts, getCategories } from "@/lib/blog";

const SITE_URL = "https://aashishpandey.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [caseStudies, posts, categories] = await Promise.all([
    getCaseStudies(),
    getBlogPosts(),
    getCategories(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/work`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.5 },
  ];

  const caseStudyRoutes: MetadataRoute.Sitemap = caseStudies.map((item) => ({
    url: `${SITE_URL}/work/${item.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt ? new Date(post.updatedAt) : undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/blog/category/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  const tags = Array.from(new Set(posts.flatMap((p) => p.tags)));
  const tagRoutes: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${SITE_URL}/blog/tag/${tag}`,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  return [...staticRoutes, ...caseStudyRoutes, ...postRoutes, ...categoryRoutes, ...tagRoutes];
}
