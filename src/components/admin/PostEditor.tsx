"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { adminFetch } from "@/lib/admin-auth";
import type {
  Block,
  BlockType,
  BlogPost,
  ButtonData,
  Category,
  CodeData,
  EmbedData,
  GalleryData,
  HeadingData,
  HtmlData,
  ImageData,
  ParagraphData,
  QuoteData,
  VideoData,
} from "@/lib/blog";
import BlockRenderer from "@/components/BlockRenderer";
import MediaPicker from "./MediaPicker";

type Revision = { _id: string; createdAt: string; snapshot: { title?: string; excerpt?: string } };

const TEMPLATES: Record<string, Block[]> = {
  "Standard article": [
    { type: "heading", data: { text: "Introduction", level: 2 } },
    { type: "paragraph", data: { text: "" } },
    { type: "image", data: { url: "", alt: "" } },
    { type: "paragraph", data: { text: "" } },
  ],
  "Case study": [
    { type: "heading", data: { text: "The problem", level: 2 } },
    { type: "paragraph", data: { text: "" } },
    { type: "heading", data: { text: "The approach", level: 2 } },
    { type: "paragraph", data: { text: "" } },
    { type: "heading", data: { text: "The outcome", level: 2 } },
    { type: "paragraph", data: { text: "" } },
  ],
  Listicle: [
    { type: "heading", data: { text: "1.", level: 3 } },
    { type: "paragraph", data: { text: "" } },
    { type: "heading", data: { text: "2.", level: 3 } },
    { type: "paragraph", data: { text: "" } },
    { type: "heading", data: { text: "3.", level: 3 } },
    { type: "paragraph", data: { text: "" } },
  ],
  "Tutorial / How-to": [
    { type: "heading", data: { text: "What you'll need", level: 2 } },
    { type: "paragraph", data: { text: "" } },
    { type: "heading", data: { text: "Step 1", level: 3 } },
    { type: "paragraph", data: { text: "" } },
    { type: "heading", data: { text: "Step 2", level: 3 } },
    { type: "paragraph", data: { text: "" } },
    { type: "heading", data: { text: "Wrap-up", level: 2 } },
    { type: "paragraph", data: { text: "" } },
  ],
  Interview: [
    { type: "heading", data: { text: "Background", level: 2 } },
    { type: "paragraph", data: { text: "" } },
    { type: "quote", data: { text: "" } },
    { type: "paragraph", data: { text: "" } },
    { type: "quote", data: { text: "" } },
    { type: "paragraph", data: { text: "" } },
  ],
  Review: [
    { type: "heading", data: { text: "First impressions", level: 2 } },
    { type: "paragraph", data: { text: "" } },
    { type: "heading", data: { text: "What works", level: 2 } },
    { type: "paragraph", data: { text: "" } },
    { type: "heading", data: { text: "What doesn't", level: 2 } },
    { type: "paragraph", data: { text: "" } },
    { type: "heading", data: { text: "Verdict", level: 2 } },
    { type: "paragraph", data: { text: "" } },
  ],
  "Visual Showcase": [
    { type: "heading", data: { text: "Showcase Introduction", level: 2 } },
    { type: "paragraph", data: { text: "Brief intro describing the project or visual collection." } },
    { type: "divider", data: {} },
    { type: "gallery", data: { images: [] } },
    { type: "paragraph", data: { text: "Closing summary or next steps." } }
  ],
  "Product Announcement": [
    { type: "heading", data: { text: "Introducing X", level: 2 } },
    { type: "paragraph", data: { text: "We are thrilled to announce the launch of X..." } },
    { type: "quote", data: { text: "A key statement about the product's value proposition.", attribution: "Lead Developer" } },
    { type: "button", data: { text: "Explore the Features", url: "https://example.com" } }
  ],
  "Short Update": [
    { type: "heading", data: { text: "Quick Update", level: 2 } },
    { type: "divider", data: {} },
    { type: "paragraph", data: { text: "Here is a brief summary of what has changed..." } }
  ]
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function emptyBlock(type: BlockType): Block {
  switch (type) {
    case "heading":
      return { type, data: { text: "", level: 2 } };
    case "paragraph":
      return { type, data: { text: "" } };
    case "image":
      return { type, data: { url: "", alt: "" } };
    case "quote":
      return { type, data: { text: "" } };
    case "code":
      return { type, data: { code: "" } };
    case "divider":
      return { type, data: {} };
    case "button":
      return { type, data: { text: "", url: "" } };
    case "gallery":
      return { type, data: { images: [] } };
    case "video":
      return { type, data: { url: "" } };
    case "embed":
      return { type, data: { url: "" } };
    case "html":
      return { type, data: { html: "" } };
  }
}

export default function PostEditor({ initialPost }: { initialPost?: BlogPost }) {
  const router = useRouter();
  const isNew = !initialPost;

  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");
  const [coverImage, setCoverImage] = useState(initialPost?.coverImage ?? "");
  const [tagsInput, setTagsInput] = useState(initialPost?.tags.join(", ") ?? "");
  const [category, setCategory] = useState(initialPost?.category ?? "");
  const [seoTitle, setSeoTitle] = useState(initialPost?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initialPost?.seoDescription ?? "");
  const [ogImage, setOgImage] = useState(initialPost?.ogImage ?? "");
  const [blocks, setBlocks] = useState<Block[]>(initialPost?.blocks ?? []);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"edit" | "split" | "preview">("edit");
  const dragIndex = useRef<number | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [lastAutosaved, setLastAutosaved] = useState<string | null>(
    initialPost?.autosave?.savedAt ?? null
  );
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [showRevisions, setShowRevisions] = useState(false);
  const [dismissedAutosave, setDismissedAutosave] = useState(false);

  useEffect(() => {
    adminFetch("/api/admin/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then(setCategories);
  }, []);

  useEffect(() => {
    if (isNew || !initialPost) return;
    adminFetch(`/api/admin/blog/${initialPost._id}/revisions`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setRevisions);
  }, [isNew, initialPost]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const applyTemplate = (name: string) => {
    setBlocks((b) => [...b, ...TEMPLATES[name]]);
  };

  const addBlock = (type: BlockType) => setBlocks((b) => [...b, emptyBlock(type)]);
  const removeBlock = (index: number) => {
    if (!confirm("Remove this block?")) return;
    setBlocks((b) => b.filter((_, i) => i !== index));
  };
  const updateBlock = (index: number, data: Block["data"]) =>
    setBlocks((b) =>
      b.map((block, i) => (i === index ? ({ ...block, data } as Block) : block))
    );
  const convertBlock = (index: number, type: BlockType) =>
    setBlocks((b) => b.map((block, i) => (i === index ? emptyBlock(type) : block)));
  const moveBlock = (index: number, direction: -1 | 1) =>
    setBlocks((b) => {
      const target = index + direction;
      if (target < 0 || target >= b.length) return b;
      const next = [...b];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const handleDrop = (index: number) => {
    const from = dragIndex.current;
    if (from === null || from === index) return;
    setBlocks((b) => {
      const next = [...b];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
    dragIndex.current = null;
  };

  const buildPayload = (published: boolean) => ({
    title,
    slug,
    excerpt,
    coverImage: coverImage || undefined,
    tags: tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    category: category || undefined,
    seoTitle: seoTitle || undefined,
    seoDescription: seoDescription || undefined,
    ogImage: ogImage || undefined,
    blocks,
    published,
  });

  const save = async (published: boolean) => {
    setError(null);
    setSaving(published ? "publish" : "draft");

    try {
      const res = await adminFetch(
        isNew ? "/api/admin/blog" : `/api/admin/blog/${initialPost!._id}`,
        { method: isNew ? "POST" : "PUT", body: JSON.stringify(buildPayload(published)) }
      );
      if (!res.ok) {
        setError("Couldn't save — check the fields and try again.");
        return;
      }
      router.push("/admin/posts");
    } finally {
      setSaving(null);
    }
  };

  // Autosave: for existing posts only, debounced on any field change.
  const autosavePayload = useMemo(
    () => ({ title, slug, excerpt, coverImage, tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean), category, seoTitle, seoDescription, ogImage, blocks }),
    [title, slug, excerpt, coverImage, tagsInput, category, seoTitle, seoDescription, ogImage, blocks]
  );
  const skipFirstAutosave = useRef(true);
  useEffect(() => {
    if (isNew || !initialPost) return;
    if (skipFirstAutosave.current) {
      skipFirstAutosave.current = false;
      return;
    }
    const timer = setTimeout(async () => {
      const res = await adminFetch(`/api/admin/blog/${initialPost._id}/autosave`, {
        method: "PATCH",
        body: JSON.stringify(autosavePayload),
      });
      if (res.ok) {
        const data = (await res.json()) as { savedAt: string };
        setLastAutosaved(data.savedAt);
      }
    }, 20000);
    return () => clearTimeout(timer);
  }, [autosavePayload, isNew, initialPost]);

  const applyAutosave = () => {
    const auto = initialPost?.autosave;
    if (!auto) return;
    if (auto.title !== undefined) setTitle(auto.title);
    if (auto.slug !== undefined) setSlug(auto.slug);
    if (auto.excerpt !== undefined) setExcerpt(auto.excerpt);
    if (auto.coverImage !== undefined) setCoverImage(auto.coverImage);
    if (auto.tags !== undefined) setTagsInput(auto.tags.join(", "));
    if (auto.category !== undefined) setCategory(auto.category);
    if (auto.seoTitle !== undefined) setSeoTitle(auto.seoTitle);
    if (auto.seoDescription !== undefined) setSeoDescription(auto.seoDescription);
    if (auto.ogImage !== undefined) setOgImage(auto.ogImage);
    if (auto.blocks !== undefined) setBlocks(auto.blocks);
    setDismissedAutosave(true);
  };

  const restoreRevision = async (revisionId: string) => {
    if (!initialPost) return;
    if (!confirm("Restore this version? Your current unsaved edits will be lost.")) return;
    const res = await adminFetch(
      `/api/admin/blog/${initialPost._id}/revisions/${revisionId}/restore`,
      { method: "POST" }
    );
    if (!res.ok) return;
    const restored = (await res.json()) as BlogPost;
    setTitle(restored.title);
    setSlug(restored.slug);
    setExcerpt(restored.excerpt);
    setCoverImage(restored.coverImage ?? "");
    setTagsInput(restored.tags.join(", "));
    setCategory(restored.category ?? "");
    setSeoTitle(restored.seoTitle ?? "");
    setSeoDescription(restored.seoDescription ?? "");
    setOgImage(restored.ogImage ?? "");
    setBlocks(restored.blocks);
    setShowRevisions(false);
  };

  const hasUnappliedAutosave =
    !dismissedAutosave &&
    initialPost?.autosave?.savedAt &&
    (!initialPost.updatedAt ||
      new Date(initialPost.autosave.savedAt) > new Date(initialPost.updatedAt));

  // Shared Preview Content Render — a plain JSX value (not a component
  // function) so it isn't remounted on every keystroke in the sibling panel.
  const previewPanel = (
    <div className="rounded-2xl border border-[#0B0B0C]/10 bg-white p-6 md:p-8 shadow-sm h-full overflow-y-auto max-h-[85vh] sticky top-8">
      {blocks.length === 0 ? (
        <p className="text-sm text-[#8A8A86] italic text-center py-12">No blocks added yet. Start writing on the left.</p>
      ) : (
        <>
          {coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt=""
              className="mb-8 w-full rounded-xl border border-[#0B0B0C]/10 object-cover max-h-80"
            />
          )}
          <h1 className="mb-6 font-display text-3xl font-bold text-[#0B0B0C]">
            {title || "Untitled Post"}
          </h1>
          <div className="prose prose-neutral max-w-none">
            <BlockRenderer blocks={blocks} />
          </div>
        </>
      )}
    </div>
  );

  // Main Editor Form (Left Column Fields) — plain JSX value, see note above.
  const editorFields = (
    <div className="space-y-6">
      <Field label="Title">
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Enter a compelling title..."
          className="border-b border-[#0B0B0C]/20 bg-transparent py-2.5 outline-none focus:border-[#FF5A36] text-lg font-medium"
        />
      </Field>
      <Field label="Slug">
        <input
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          className="border-b border-[#0B0B0C]/20 bg-transparent py-2 font-mono text-sm outline-none focus:border-[#FF5A36]"
        />
      </Field>
      <Field label="Excerpt">
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Brief description summary..."
          rows={3}
          className="border-b border-[#0B0B0C]/20 bg-transparent py-2 outline-none focus:border-[#FF5A36] resize-y"
        />
      </Field>

      {/* Templates Block */}
      <div className="rounded-xl border border-[#0B0B0C]/10 bg-white p-5 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-[#8A8A86] font-semibold">
          Insert layout template
        </p>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {Object.keys(TEMPLATES).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => applyTemplate(name)}
              className="rounded-full border border-[#0B0B0C]/15 px-4 py-1.5 font-mono text-xs uppercase tracking-widest hover:border-[#FF5A36] hover:text-[#FF5A36] transition-all bg-transparent"
            >
              + {name}
            </button>
          ))}
        </div>
      </div>

      {/* Blocks Section */}
      <div className="space-y-4">
        <p className="font-mono text-xs uppercase tracking-widest text-[#8A8A86] font-semibold border-b border-[#0B0B0C]/5 pb-2">
          Blocks
        </p>
        <div className="grid gap-4">
          {blocks.map((block, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => (dragIndex.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(i)}
              className="group relative flex gap-4 rounded-xl border border-[#0B0B0C]/10 bg-white p-5 shadow-sm hover:border-[#FF5A36]/30 transition-all"
            >
              <span
                className="mt-1 shrink-0 cursor-grab select-none text-[#8A8A86] hover:text-[#0B0B0C]"
                aria-hidden
                title="Drag to reorder"
              >
                ⠿
              </span>
              <div className="flex-1">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <select
                    value={block.type}
                    onChange={(e) => convertBlock(i, e.target.value as BlockType)}
                    className="border-b border-[#0B0B0C]/20 bg-transparent font-mono text-xs uppercase tracking-widest text-[#8A8A86] outline-none focus:border-[#FF5A36] focus:text-[#FF5A36]"
                  >
                    {(
                      [
                        "heading",
                        "paragraph",
                        "image",
                        "quote",
                        "code",
                        "divider",
                        "button",
                        "gallery",
                        "video",
                        "embed",
                        "html",
                      ] as BlockType[]
                    ).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <div className="flex shrink-0 gap-1.5 font-mono text-xs text-[#8A8A86]">
                    <button
                      type="button"
                      onClick={() => moveBlock(i, -1)}
                      disabled={i === 0}
                      className="hover:text-[#FF5A36] disabled:opacity-30 p-1 bg-[#F5F3EE] rounded"
                      aria-label="Move block up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(i, 1)}
                      disabled={i === blocks.length - 1}
                      className="hover:text-[#FF5A36] disabled:opacity-30 p-1 bg-[#F5F3EE] rounded"
                      aria-label="Move block down"
                    >
                      ↓
                    </button>
                  </div>
                </div>
                <BlockFields block={block} onChange={(data) => updateBlock(i, data)} />
              </div>
              <button
                type="button"
                onClick={() => removeBlock(i)}
                className="shrink-0 self-start text-[#8A8A86] hover:text-[#FF5A36] transition-colors p-1"
                aria-label="Remove block"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Add Block Row */}
        <div className="rounded-xl border border-dashed border-[#0B0B0C]/20 p-5 bg-white/40">
          <p className="font-mono text-xs uppercase tracking-widest text-[#8A8A86] font-semibold text-center mb-3">
            Add Block
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {(
              [
                "heading",
                "paragraph",
                "image",
                "quote",
                "code",
                "divider",
                "button",
                "gallery",
                "video",
                "embed",
                "html",
              ] as BlockType[]
            ).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addBlock(type)}
                className="rounded-full border border-[#0B0B0C]/10 bg-white px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[#0B0B0C] hover:border-[#FF5A36] hover:text-[#FF5A36] transition-all shadow-sm"
              >
                + {type}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Settings Sidebar (Right Column Settings) — plain JSX value, see note above.
  const settingsSidebar = (
    <div className="space-y-6 sticky top-8">
      {/* Publishing Actions Panel */}
      <div className="rounded-2xl border border-[#0B0B0C]/10 bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-display text-sm font-bold text-[#0B0B0C] border-b border-[#0B0B0C]/5 pb-3">
          Publishing Actions
        </h3>
        {error && <p className="text-xs text-[#FF5A36] font-mono">{error}</p>}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            disabled={saving !== null}
            onClick={() => save(true)}
            className="w-full rounded-full bg-[#FF5A36] py-3 font-mono text-xs uppercase tracking-widest text-[#F5F3EE] hover:opacity-90 disabled:opacity-50 transition-all font-semibold"
          >
            {saving === "publish" ? "Publishing…" : "Publish Post"}
          </button>
          <button
            type="button"
            disabled={saving !== null}
            onClick={() => save(false)}
            className="w-full rounded-full border border-[#0B0B0C]/20 bg-transparent py-3 font-mono text-xs uppercase tracking-widest text-[#0B0B0C] hover:bg-[#F5F3EE] disabled:opacity-50 transition-all"
          >
            {saving === "draft" ? "Saving…" : "Save Draft"}
          </button>
        </div>
        {!isNew && lastAutosaved && (
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#8A8A86] text-center pt-2">
            Autosaved at {new Date(lastAutosaved).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Meta Properties Panel */}
      <div className="rounded-2xl border border-[#0B0B0C]/10 bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-display text-sm font-bold text-[#0B0B0C] border-b border-[#0B0B0C]/5 pb-3">
          Post Settings
        </h3>
        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border-b border-[#0B0B0C]/20 bg-transparent py-2 text-sm outline-none focus:border-[#FF5A36] w-full"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tags (comma separated)">
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. UX, Next.js, Design"
            className="border-b border-[#0B0B0C]/20 bg-transparent py-2 text-sm outline-none focus:border-[#FF5A36]"
          />
        </Field>
        <Field label="Cover image">
          <div className="flex items-center gap-2">
            <input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="Cover URL"
              className="min-w-0 flex-1 border-b border-[#0B0B0C]/20 bg-transparent py-1.5 text-xs outline-none focus:border-[#FF5A36]"
            />
            <MediaPicker onSelect={setCoverImage} />
          </div>
        </Field>
      </div>

      {/* SEO & Social Panel */}
      <div className="rounded-2xl border border-[#0B0B0C]/10 bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-display text-sm font-bold text-[#0B0B0C] border-b border-[#0B0B0C]/5 pb-3">
          Search &amp; Social SEO
        </h3>
        <Field label={`SEO Title (${seoTitle.length}/70)`}>
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            maxLength={70}
            placeholder="Defaults to post title"
            className="border-b border-[#0B0B0C]/20 bg-transparent py-1.5 text-xs outline-none focus:border-[#FF5A36]"
          />
        </Field>
        <Field label={`SEO Description (${seoDescription.length}/160)`}>
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            maxLength={160}
            placeholder="Defaults to excerpt"
            rows={2}
            className="border-b border-[#0B0B0C]/20 bg-transparent py-1.5 text-xs outline-none focus:border-[#FF5A36]"
          />
        </Field>
        <Field label="Social share image">
          <div className="flex items-center gap-2">
            <input
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              placeholder="Social image URL"
              className="min-w-0 flex-1 border-b border-[#0B0B0C]/20 bg-transparent py-1.5 text-xs outline-none focus:border-[#FF5A36]"
            />
            <MediaPicker onSelect={setOgImage} />
          </div>
        </Field>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl space-y-8">
      {/* Editor Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#0B0B0C]/10 pb-5">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0B0B0C]">
            {isNew ? "New Post" : "Edit Post"}
          </h1>
          {!isNew && revisions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowRevisions((v) => !v)}
              className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-[#8A8A86] hover:text-[#FF5A36] transition-all"
            >
              {showRevisions ? "Hide" : "Show"} revision history ({revisions.length})
            </button>
          )}
        </div>

        {/* View Toggle Controller */}
        <div className="flex items-center gap-1.5 rounded-full border border-[#0B0B0C]/10 bg-white p-1">
          <button
            type="button"
            onClick={() => setView("edit")}
            className={`rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-all ${
              view === "edit" ? "bg-[#0B0B0C] text-[#F5F3EE]" : "text-[#8A8A86] hover:text-[#0B0B0C]"
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setView("split")}
            className={`rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-all ${
              view === "split" ? "bg-[#0B0B0C] text-[#F5F3EE]" : "text-[#8A8A86] hover:text-[#0B0B0C]"
            }`}
          >
            Split View
          </button>
          <button
            type="button"
            onClick={() => setView("preview")}
            className={`rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-all ${
              view === "preview" ? "bg-[#0B0B0C] text-[#F5F3EE]" : "text-[#8A8A86] hover:text-[#0B0B0C]"
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Unapplied Autosave Alert */}
      {hasUnappliedAutosave && (
        <div className="flex items-center justify-between rounded-xl border border-[#FF5A36]/40 bg-[#FF5A36]/10 px-4 py-3.5 text-sm text-[#0B0B0C]">
          <span>
            An autosaved draft from{" "}
            {new Date(initialPost!.autosave!.savedAt!).toLocaleString()} is newer than this version.
          </span>
          <div className="flex shrink-0 gap-3 font-mono text-xs uppercase tracking-widest font-semibold ml-4">
            <button type="button" onClick={applyAutosave} className="text-[#FF5A36] hover:opacity-85">
              Restore
            </button>
            <button
              type="button"
              onClick={() => setDismissedAutosave(true)}
              className="text-[#8A8A86] hover:text-[#0B0B0C]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Revision History Widget */}
      {showRevisions && (
        <div className="rounded-2xl border border-[#0B0B0C]/10 bg-white p-5 shadow-sm space-y-3">
          <p className="font-mono text-xs uppercase tracking-widest text-[#8A8A86] font-semibold border-b border-[#0B0B0C]/5 pb-2">
            Revision history
          </p>
          <div className="grid gap-2.5 max-h-40 overflow-y-auto">
            {revisions.map((rev) => (
              <div key={rev._id} className="flex items-center justify-between gap-4 text-xs">
                <span className="text-[#0B0B0C]">
                  {new Date(rev.createdAt).toLocaleString()} — {rev.snapshot.title || "Untitled"}
                </span>
                <button
                  type="button"
                  onClick={() => restoreRevision(rev._id)}
                  className="font-mono text-[10px] uppercase tracking-widest text-[#FF5A36] hover:opacity-80"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid Responsive Layout */}
      {view === "edit" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">{editorFields}</div>
          <div className="lg:col-span-1">{settingsSidebar}</div>
        </div>
      )}

      {view === "split" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="h-[85vh] overflow-y-auto pr-2 pb-12">{editorFields}</div>
          <div className="h-[85vh] sticky top-8">{previewPanel}</div>
        </div>
      )}

      {view === "preview" && (
        <div className="max-w-4xl mx-auto pb-12">{previewPanel}</div>
      )}

      {/* Bottom Sticky Action Bar in Split/Preview Mode */}
      {view !== "edit" && (
        <div className="fixed bottom-6 right-6 z-30 flex gap-3 shadow-lg rounded-full bg-white border border-[#0B0B0C]/10 p-2.5">
          <button
            type="button"
            disabled={saving !== null}
            onClick={() => save(false)}
            className="rounded-full border border-[#0B0B0C]/20 bg-transparent px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-[#0B0B0C] hover:bg-[#F5F3EE] disabled:opacity-50"
          >
            {saving === "draft" ? "Saving…" : "Save Draft"}
          </button>
          <button
            type="button"
            disabled={saving !== null}
            onClick={() => save(true)}
            className="rounded-full bg-[#FF5A36] px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-[#F5F3EE] hover:opacity-90 disabled:opacity-50 font-semibold"
          >
            {saving === "publish" ? "Publishing…" : "Publish Post"}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-[#8A8A86] font-semibold">{label}</span>
      {children}
    </label>
  );
}

function BlockFields({
  block,
  onChange,
}: {
  block: Block;
  onChange: (data: Block["data"]) => void;
}) {
  const inputClass =
    "w-full border-b border-[#0B0B0C]/20 bg-transparent py-2 text-sm outline-none focus:border-[#FF5A36] text-[#0B0B0C]";

  switch (block.type) {
    case "heading": {
      const data = block.data as HeadingData;
      return (
        <div className="flex gap-3">
          <input
            value={data.text}
            onChange={(e) => onChange({ ...data, text: e.target.value })}
            placeholder="Heading text"
            className={inputClass}
          />
          <select
            value={data.level ?? 2}
            onChange={(e) => onChange({ ...data, level: Number(e.target.value) as 2 | 3 })}
            className="border-b border-[#0B0B0C]/20 bg-transparent py-2 text-sm outline-none"
          >
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
        </div>
      );
    }
    case "paragraph": {
      const data = block.data as ParagraphData;
      return (
        <textarea
          value={data.text}
          onChange={(e) => onChange({ ...data, text: e.target.value })}
          placeholder="Paragraph text"
          rows={3}
          className={inputClass}
        />
      );
    }
    case "image": {
      const data = block.data as ImageData;
      return (
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <input
              value={data.url}
              onChange={(e) => onChange({ ...data, url: e.target.value })}
              placeholder="Image URL"
              className={inputClass}
            />
            <MediaPicker
              label="Browse"
              onSelect={(url) => onChange({ ...data, url })}
            />
          </div>
          <input
            value={data.alt ?? ""}
            onChange={(e) => onChange({ ...data, alt: e.target.value })}
            placeholder="Alt text"
            className={inputClass}
          />
          <input
            value={data.caption ?? ""}
            onChange={(e) => onChange({ ...data, caption: e.target.value })}
            placeholder="Caption (optional)"
            className={inputClass}
          />
        </div>
      );
    }
    case "quote": {
      const data = block.data as QuoteData;
      return (
        <div className="grid gap-2">
          <textarea
            value={data.text}
            onChange={(e) => onChange({ ...data, text: e.target.value })}
            placeholder="Quote text"
            rows={2}
            className={inputClass}
          />
          <input
            value={data.attribution ?? ""}
            onChange={(e) => onChange({ ...data, attribution: e.target.value })}
            placeholder="Attribution (optional)"
            className={inputClass}
          />
        </div>
      );
    }
    case "code": {
      const data = block.data as CodeData;
      return (
        <div className="grid gap-2">
          <input
            value={data.language ?? ""}
            onChange={(e) => onChange({ ...data, language: e.target.value })}
            placeholder="Language (optional)"
            className={inputClass}
          />
          <textarea
            value={data.code}
            onChange={(e) => onChange({ ...data, code: e.target.value })}
            placeholder="Code"
            rows={4}
            className={`${inputClass} font-mono`}
          />
        </div>
      );
    }
    case "divider":
      return <p className="text-xs text-[#8A8A86] italic">Horizontal divider line (decorates structure).</p>;
    case "button": {
      const data = block.data as ButtonData;
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={data.text}
            onChange={(e) => onChange({ ...data, text: e.target.value })}
            placeholder="Button text"
            className={inputClass}
          />
          <input
            value={data.url}
            onChange={(e) => onChange({ ...data, url: e.target.value })}
            placeholder="Link URL"
            className={inputClass}
          />
        </div>
      );
    }
    case "gallery": {
      const data = block.data as GalleryData;
      const setImage = (i: number, patch: Partial<{ url: string; alt: string }>) =>
        onChange({
          images: data.images.map((img, idx) => (idx === i ? { ...img, ...patch } : img)),
        });
      const removeImage = (i: number) =>
        onChange({ images: data.images.filter((_, idx) => idx !== i) });
      return (
        <div className="grid gap-3">
          {data.images.map((img, i) => (
            <div key={i} className="flex items-center gap-2 border border-[#0B0B0C]/5 p-2 rounded bg-slate-50/50">
              <input
                value={img.url}
                onChange={(e) => setImage(i, { url: e.target.value })}
                placeholder="Image URL"
                className={inputClass}
              />
              <input
                value={img.alt ?? ""}
                onChange={(e) => setImage(i, { alt: e.target.value })}
                placeholder="Alt text"
                className={inputClass}
              />
              <MediaPicker label="Browse" onSelect={(url) => setImage(i, { url })} />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="shrink-0 text-[#8A8A86] hover:text-[#FF5A36]"
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ images: [...data.images, { url: "", alt: "" }] })}
            className="w-fit rounded-full border border-[#0B0B0C]/10 px-4 py-1 text-xs hover:border-[#FF5A36] hover:text-[#FF5A36]"
          >
            + Add Image to Gallery
          </button>
        </div>
      );
    }
    case "video": {
      const data = block.data as VideoData;
      return (
        <div className="grid gap-2">
          <input
            value={data.url}
            onChange={(e) => onChange({ ...data, url: e.target.value })}
            placeholder="Video URL (YouTube, Vimeo, or direct .mp4)"
            className={inputClass}
          />
          <input
            value={data.caption ?? ""}
            onChange={(e) => onChange({ ...data, caption: e.target.value })}
            placeholder="Caption (optional)"
            className={inputClass}
          />
        </div>
      );
    }
    case "embed": {
      const data = block.data as EmbedData;
      return (
        <div className="grid gap-2">
          <input
            value={data.url}
            onChange={(e) => onChange({ ...data, url: e.target.value })}
            placeholder="Embed URL (iframe src)"
            className={inputClass}
          />
          <input
            value={data.caption ?? ""}
            onChange={(e) => onChange({ ...data, caption: e.target.value })}
            placeholder="Caption (optional)"
            className={inputClass}
          />
        </div>
      );
    }
    case "html": {
      const data = block.data as HtmlData;
      return (
        <textarea
          value={data.html}
          onChange={(e) => onChange({ html: e.target.value })}
          placeholder="Raw HTML"
          rows={5}
          className={`${inputClass} font-mono`}
        />
      );
    }
  }
}
