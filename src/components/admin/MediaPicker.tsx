"use client";

import { useState } from "react";
import MediaGrid from "./MediaGrid";
import type { Media } from "@/lib/media";

export default function MediaPicker({
  label = "Browse library",
  onSelect,
}: {
  label?: string;
  onSelect: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-ink/20 px-4 py-1.5 font-mono text-xs uppercase tracking-widest hover:border-accent"
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-ink/10 bg-background/80 p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl">Media library</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-muted hover:text-accent"
              >
                ✕
              </button>
            </div>
            <MediaGrid
              selectable
              onSelect={(item: Media) => {
                onSelect(item.url);
                setOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
