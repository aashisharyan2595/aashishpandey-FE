"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { adminFetch } from "@/lib/admin-auth";
import type {
  Block,
  BlockType,
  BlogPost,
  CodeData,
  HeadingData,
  ImageData,
  ParagraphData,
  QuoteData,
} from "@/lib/blog";

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
  const [blocks, setBlocks] = useState<Block[]>(initialPost?.blocks ?? []);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);

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

  const save = async (published: boolean) => {
    setError(null);
    setSaving(published ? "publish" : "draft");

    const payload = {
      title,
      slug,
      excerpt,
      coverImage: coverImage || undefined,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      blocks,
      published,
    };

    try {
      const res = await adminFetch(
        isNew ? "/api/admin/blog" : `/api/admin/blog/${initialPost!._id}`,
        { method: isNew ? "POST" : "PUT", body: JSON.stringify(payload) }
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

  return (
    <div className="grid max-w-3xl gap-10">
      <div>
        <h1 className="font-display text-3xl">{isNew ? "New post" : "Edit post"}</h1>
      </div>

      <div className="grid gap-4">
        <Field label="Title">
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="border-b border-white/20 bg-transparent py-2 outline-none focus:border-accent"
          />
        </Field>
        <Field label="Slug">
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className="border-b border-white/20 bg-transparent py-2 font-mono text-sm outline-none focus:border-accent"
          />
        </Field>
        <Field label="Excerpt">
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="border-b border-white/20 bg-transparent py-2 outline-none focus:border-accent"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cover image URL (optional)">
            <input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="border-b border-white/20 bg-transparent py-2 text-sm outline-none focus:border-accent"
            />
          </Field>
          <Field label="Tags (comma separated)">
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="border-b border-white/20 bg-transparent py-2 text-sm outline-none focus:border-accent"
            />
          </Field>
        </div>
      </div>

      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Start from a template</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.keys(TEMPLATES).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => applyTemplate(name)}
              className="rounded-full border border-white/10 px-4 py-1.5 text-sm hover:border-accent"
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
            className="flex gap-3 rounded-lg border border-white/10 p-4"
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
              className="rounded-full border border-white/10 px-4 py-1.5 text-sm capitalize hover:border-accent"
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
          className="rounded-full border border-white/20 px-6 py-2 font-mono text-sm uppercase tracking-widest disabled:opacity-50"
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
    "w-full border-b border-white/20 bg-transparent py-1.5 text-sm outline-none focus:border-accent";

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
            className="border-b border-white/20 bg-transparent py-1.5 text-sm outline-none"
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
          <input
            value={data.url}
            onChange={(e) => onChange({ ...data, url: e.target.value })}
            placeholder="Image URL"
            className={inputClass}
          />
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
