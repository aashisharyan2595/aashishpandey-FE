"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { adminFetch } from "@/lib/admin-auth";
import type {
  Block,
  BlockType,
  BlogPost,
  Category,
  CodeData,
  HeadingData,
  ImageData,
  ParagraphData,
  QuoteData,
} from "@/lib/blog";
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
    if (blocks.length > 0 && !confirm("Replace current blocks with this template?")) return;
    setBlocks(TEMPLATES[name]);
  };

  const addBlock = (type: BlockType) => setBlocks((b) => [...b, emptyBlock(type)]);
  const removeBlock = (index: number) =>
    setBlocks((b) => b.filter((_, i) => i !== index));
  const updateBlock = (index: number, data: Block["data"]) =>
    setBlocks((b) =>
      b.map((block, i) => (i === index ? ({ ...block, data } as Block) : block))
    );

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

  return (
    <div className="grid max-w-3xl gap-10">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-3xl">{isNew ? "New post" : "Edit post"}</h1>
        {!isNew && (
          <div className="text-right font-mono text-xs uppercase tracking-widest text-muted">
            {lastAutosaved && (
              <p>Saved automatically at {new Date(lastAutosaved).toLocaleTimeString()}</p>
            )}
            {revisions.length > 0 && (
              <button
                type="button"
                onClick={() => setShowRevisions((v) => !v)}
                className="mt-1 hover:text-accent"
              >
                {showRevisions ? "Hide" : "Show"} revision history ({revisions.length})
              </button>
            )}
          </div>
        )}
      </div>

      {hasUnappliedAutosave && (
        <div className="flex items-center justify-between rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
          <span>
            An autosaved draft from{" "}
            {new Date(initialPost!.autosave!.savedAt!).toLocaleString()} is newer than this
            saved post.
          </span>
          <div className="flex shrink-0 gap-3 font-mono text-xs uppercase tracking-widest">
            <button type="button" onClick={applyAutosave} className="hover:text-accent">
              Restore it
            </button>
            <button
              type="button"
              onClick={() => setDismissedAutosave(true)}
              className="text-muted hover:text-accent"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {showRevisions && (
        <div className="rounded-lg border border-ink/10 p-4">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
            Revision history
          </p>
          <div className="grid gap-2">
            {revisions.map((rev) => (
              <div key={rev._id} className="flex items-center justify-between gap-4 text-sm">
                <span>
                  {new Date(rev.createdAt).toLocaleString()} — {rev.snapshot.title || "Untitled"}
                </span>
                <button
                  type="button"
                  onClick={() => restoreRevision(rev._id)}
                  className="shrink-0 font-mono text-xs uppercase tracking-widest hover:text-accent"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4">
        <Field label="Title">
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="border-b border-ink/20 bg-transparent py-2 outline-none focus:border-accent"
          />
        </Field>
        <Field label="Slug">
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className="border-b border-ink/20 bg-transparent py-2 font-mono text-sm outline-none focus:border-accent"
          />
        </Field>
        <Field label="Excerpt">
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="border-b border-ink/20 bg-transparent py-2 outline-none focus:border-accent"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cover image">
            <div className="flex items-center gap-2">
              <input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="Image URL"
                className="min-w-0 flex-1 border-b border-ink/20 bg-transparent py-2 text-sm outline-none focus:border-accent"
              />
              <MediaPicker onSelect={setCoverImage} />
            </div>
          </Field>
          <Field label="Tags (comma separated)">
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="border-b border-ink/20 bg-transparent py-2 text-sm outline-none focus:border-accent"
            />
          </Field>
        </div>
        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border-b border-ink/20 bg-transparent py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 rounded-lg border border-ink/10 p-4">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Search &amp; social</p>
        <Field label={`SEO title (${seoTitle.length}/70 — falls back to post title)`}>
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            maxLength={70}
            className="border-b border-ink/20 bg-transparent py-2 text-sm outline-none focus:border-accent"
          />
        </Field>
        <Field label={`SEO description (${seoDescription.length}/160 — falls back to excerpt)`}>
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            maxLength={160}
            rows={2}
            className="border-b border-ink/20 bg-transparent py-2 text-sm outline-none focus:border-accent"
          />
        </Field>
        <Field label="Social share image (falls back to cover image)">
          <div className="flex items-center gap-2">
            <input
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              placeholder="Image URL"
              className="min-w-0 flex-1 border-b border-ink/20 bg-transparent py-2 text-sm outline-none focus:border-accent"
            />
            <MediaPicker onSelect={setOgImage} />
          </div>
        </Field>
      </div>

      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Start from a template</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.keys(TEMPLATES).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => applyTemplate(name)}
              className="rounded-full border border-ink/10 px-4 py-1.5 text-sm hover:border-accent"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {blocks.map((block, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => (dragIndex.current = i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            className="flex gap-3 rounded-lg border border-ink/10 p-4"
          >
            <span
              className="mt-1 shrink-0 cursor-grab select-none text-muted"
              aria-hidden
              title="Drag to reorder"
            >
              ⠿
            </span>
            <div className="flex-1">
              <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
                {block.type}
              </p>
              <BlockFields block={block} onChange={(data) => updateBlock(i, data)} />
            </div>
            <button
              type="button"
              onClick={() => removeBlock(i)}
              className="shrink-0 self-start text-muted hover:text-accent"
              aria-label="Remove block"
            >
              ✕
            </button>
          </div>
        ))}

        <div className="flex flex-wrap gap-2 pt-2">
          {(["heading", "paragraph", "image", "quote", "code"] as BlockType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => addBlock(type)}
              className="rounded-full border border-ink/10 px-4 py-1.5 text-sm capitalize hover:border-accent"
            >
              + {type}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-accent">{error}</p>}

      <div className="flex gap-4">
        <button
          type="button"
          disabled={saving !== null}
          onClick={() => save(false)}
          className="rounded-full border border-ink/20 px-6 py-2 font-mono text-sm uppercase tracking-widest disabled:opacity-50"
        >
          {saving === "draft" ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          disabled={saving !== null}
          onClick={() => save(true)}
          className="rounded-full bg-accent px-6 py-2 font-mono text-sm uppercase tracking-widest text-background disabled:opacity-50"
        >
          {saving === "publish" ? "Publishing…" : "Publish"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="font-mono text-xs uppercase tracking-widest text-muted">{label}</span>
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
    "w-full border-b border-ink/20 bg-transparent py-1.5 text-sm outline-none focus:border-accent";

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
            className="border-b border-ink/20 bg-transparent py-1.5 text-sm outline-none"
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
  }
}
