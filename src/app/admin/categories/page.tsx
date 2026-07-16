"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-auth";
import type { Category } from "@/lib/blog";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminFetch("/api/admin/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then(setCategories);
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    setError(null);
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), slug: slugify(name) }),
      });
      if (!res.ok) {
        setError("Couldn't create category — slug may already be in use.");
        return;
      }
      const created = (await res.json()) as Category;
      setCategories((prev) => [...(prev ?? []), created].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
    } finally {
      setSaving(false);
    }
  };

  const rename = async (category: Category, newName: string) => {
    if (!newName.trim() || newName === category.name) return;
    const res = await adminFetch(`/api/admin/categories/${category._id}`, {
      method: "PUT",
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!res.ok) return;
    const updated = (await res.json()) as Category;
    setCategories((prev) => prev?.map((c) => (c._id === updated._id ? updated : c)) ?? null);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category? Posts using it will keep the old value as plain text.")) return;
    await adminFetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev?.filter((c) => c._id !== id) ?? null);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl">Categories</h1>

      <div className="mt-8 flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="New category name"
          className="flex-1 border-b border-white/20 bg-transparent py-2 outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={create}
          disabled={saving}
          className="shrink-0 rounded-full bg-accent px-6 py-2 font-mono text-sm uppercase tracking-widest text-background disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-accent">{error}</p>}

      {categories === null ? (
        <p className="mt-8 text-muted">Loading…</p>
      ) : categories.length === 0 ? (
        <p className="mt-8 text-muted">No categories yet.</p>
      ) : (
        <div className="mt-8 divide-y divide-white/10 border-t border-white/10">
          {categories.map((category) => (
            <div key={category._id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <input
                  defaultValue={category.name}
                  onBlur={(e) => rename(category, e.target.value)}
                  className="bg-transparent font-medium outline-none focus:border-b focus:border-accent"
                />
                <p className="font-mono text-xs uppercase tracking-widest text-muted">{category.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(category._id)}
                className="shrink-0 font-mono text-sm uppercase tracking-widest text-muted hover:text-accent"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
