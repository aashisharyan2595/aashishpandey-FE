"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { adminFetch } from "@/lib/admin-auth";
import type { Media } from "@/lib/media";

export default function MediaGrid({
  onSelect,
  selectable = false,
}: {
  onSelect?: (media: Media) => void;
  selectable?: boolean;
}) {
  const [media, setMedia] = useState<Media[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    adminFetch("/api/admin/media")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMedia);
  }, []);

  useEffect(() => load(), [load]);

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    setError(null);
    setUploading(true);
    try {
      if (list.length === 1) {
        const body = new FormData();
        body.append("file", list[0]);
        const res = await adminFetch("/api/admin/media", { method: "POST", body });
        if (!res.ok) {
          setError("Upload failed — check the file and try again.");
          return;
        }
        const created = (await res.json()) as Media;
        setMedia((prev) => (prev ? [created, ...prev] : [created]));
      } else {
        const body = new FormData();
        list.forEach((file) => body.append("files", file));
        const res = await adminFetch("/api/admin/media/bulk", { method: "POST", body });
        if (!res.ok) {
          setError("Upload failed — check the files and try again.");
          return;
        }
        const created = (await res.json()) as Media[];
        setMedia((prev) => (prev ? [...created, ...prev] : created));
      }
    } finally {
      setUploading(false);
    }
  };

  const updateAlt = async (id: string, alt: string) => {
    setMedia((prev) => prev?.map((m) => (m._id === id ? { ...m, alt } : m)) ?? null);
    await adminFetch(`/api/admin/media/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ alt }),
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image? This can't be undone.")) return;
    await adminFetch(`/api/admin/media/${id}`, { method: "DELETE" });
    setMedia((prev) => prev?.filter((m) => m._id !== id) ?? null);
  };

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length > 0) upload(e.dataTransfer.files);
        }}
        className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ink/20 px-6 py-8 text-center"
      >
        <p className="text-sm text-muted">Drag images here (multiple allowed), or</p>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="rounded-full border border-ink/20 px-4 py-1.5 font-mono text-sm uppercase tracking-widest hover:border-accent disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Choose files"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="mt-3 text-sm text-accent">{error}</p>}

      {media === null ? (
        <p className="mt-8 text-muted">Loading…</p>
      ) : media.length === 0 ? (
        <p className="mt-8 text-muted">No images uploaded yet.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {media.map((item) => (
            <div key={item._id} className="grid gap-1.5">
              <div className="group relative aspect-square overflow-hidden rounded-lg border border-ink/10">
                <button
                  type="button"
                  onClick={() => selectable && onSelect?.(item)}
                  className="relative block h-full w-full"
                  disabled={!selectable}
                >
                  <Image
                    src={item.url}
                    alt={item.alt || item.filename}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                  {selectable && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60 font-mono text-xs uppercase tracking-widest text-white opacity-0 transition-opacity group-hover:opacity-100">
                      Select
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item._id)}
                  aria-label="Delete image"
                  className="absolute top-1 right-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 hover:text-accent"
                >
                  ✕
                </button>
              </div>
              {!selectable && (
                <input
                  defaultValue={item.alt ?? ""}
                  onBlur={(e) => {
                    if (e.target.value !== (item.alt ?? "")) updateAlt(item._id, e.target.value);
                  }}
                  placeholder="Alt text"
                  className="w-full border-b border-ink/10 bg-transparent py-1 text-xs outline-none focus:border-accent"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
