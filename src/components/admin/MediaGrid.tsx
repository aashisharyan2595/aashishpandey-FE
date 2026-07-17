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

  const upload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await adminFetch("/api/admin/media", { method: "POST", body });
      if (!res.ok) {
        setError("Upload failed — check the file and try again.");
        return;
      }
      const created = (await res.json()) as Media;
      setMedia((prev) => (prev ? [created, ...prev] : [created]));
    } finally {
      setUploading(false);
    }
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
          const file = e.dataTransfer.files[0];
          if (file) upload(file);
        }}
        className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ink/20 px-6 py-8 text-center"
      >
        <p className="text-sm text-muted">Drag an image here, or</p>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="rounded-full border border-ink/20 px-4 py-1.5 font-mono text-sm uppercase tracking-widest hover:border-accent disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Choose file"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
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
            <div
              key={item._id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-ink/10"
            >
              <button
                type="button"
                onClick={() => selectable && onSelect?.(item)}
                className="relative block h-full w-full"
                disabled={!selectable}
              >
                <Image
                  src={item.url}
                  alt={item.filename}
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
          ))}
        </div>
      )}
    </div>
  );
}
