export type BlockType = "heading" | "paragraph" | "image" | "quote" | "code";

export type HeadingData = { text: string; level?: 2 | 3 };
export type ParagraphData = { text: string };
export type ImageData = { url: string; alt?: string; caption?: string };
export type QuoteData = { text: string; attribution?: string };
export type CodeData = { code: string; language?: string };

export type Block =
  | { type: "heading"; data: HeadingData }
  | { type: "paragraph"; data: ParagraphData }
  | { type: "image"; data: ImageData }
  | { type: "quote"; data: QuoteData }
  | { type: "code"; data: CodeData };

export type BlogPostSummary = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  tags: string[];
  published: boolean;
  publishedAt?: string;
  updatedAt?: string;
};

export type BlogPost = BlogPostSummary & {
  template: string;
  blocks: Block[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function getBlogPosts(): Promise<BlogPostSummary[]> {
  try {
    const res = await fetch(`${API_URL}/api/blog`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return (await res.json()) as BlogPostSummary[];
  } catch {
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${API_URL}/api/blog/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as BlogPost;
  } catch {
    return null;
  }
}
