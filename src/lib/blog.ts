export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "quote"
  | "code"
  | "divider"
  | "button"
  | "gallery"
  | "video"
  | "embed"
  | "html";

export type HeadingData = { text: string; level?: 2 | 3 };
export type ParagraphData = { text: string };
export type ImageData = { url: string; alt?: string; caption?: string };
export type QuoteData = { text: string; attribution?: string };
export type CodeData = { code: string; language?: string };
export type DividerData = Record<string, never>;
export type ButtonData = { text: string; url: string };
export type GalleryData = { images: { url: string; alt?: string }[] };
export type VideoData = { url: string; caption?: string };
export type EmbedData = { url: string; caption?: string };
export type HtmlData = { html: string };

export type Block =
  | { type: "heading"; data: HeadingData }
  | { type: "paragraph"; data: ParagraphData }
  | { type: "image"; data: ImageData }
  | { type: "quote"; data: QuoteData }
  | { type: "code"; data: CodeData }
  | { type: "divider"; data: DividerData }
  | { type: "button"; data: ButtonData }
  | { type: "gallery"; data: GalleryData }
  | { type: "video"; data: VideoData }
  | { type: "embed"; data: EmbedData }
  | { type: "html"; data: HtmlData };

export type AutosaveSnapshot = {
  title?: string;
  slug?: string;
  excerpt?: string;
  blocks?: Block[];
  coverImage?: string;
  tags?: string[];
  category?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  savedAt?: string;
};

export type BlogPostSummary = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  tags: string[];
  category?: string;
  published: boolean;
  publishedAt?: string;
  updatedAt?: string;
};

export type BlogPost = BlogPostSummary & {
  template: string;
  blocks: Block[];
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  autosave?: AutosaveSnapshot;
};

export type Category = { _id: string; name: string; slug: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function getBlogPosts(params?: {
  category?: string;
  tag?: string;
}): Promise<BlogPostSummary[]> {
  try {
    const search = new URLSearchParams();
    if (params?.category) search.set("category", params.category);
    if (params?.tag) search.set("tag", params.tag);
    const qs = search.toString();
    const res = await fetch(`${API_URL}/api/blog${qs ? `?${qs}` : ""}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return (await res.json()) as BlogPostSummary[];
  } catch {
    return [];
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/api/categories`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return (await res.json()) as Category[];
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
