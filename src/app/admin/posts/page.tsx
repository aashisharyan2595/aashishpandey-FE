"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-auth";
import type { BlogPostSummary } from "@/lib/blog";

type StatusFilter = "all" | "published" | "draft";
type SortOrder = "updated-desc" | "updated-asc" | "title-asc" | "title-desc";

const PAGE_SIZE = 10;

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<BlogPostSummary[] | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOrder>("updated-desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    adminFetch("/api/admin/blog")
      .then((res) => (res.ok ? res.json() : []))
      .then(setPosts);
  }, []);

  const filtered = useMemo(() => {
    if (!posts) return [];
    const query = search.trim().toLowerCase();
    let result = posts.filter((post) => {
      if (status === "published" && !post.published) return false;
      if (status === "draft" && post.published) return false;
      if (query && !post.title.toLowerCase().includes(query)) return false;
      return true;
    });
    result = [...result].sort((a, b) => {
      switch (sort) {
        case "updated-asc":
          return new Date(a.updatedAt ?? 0).getTime() - new Date(b.updatedAt ?? 0).getTime();
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "updated-desc":
        default:
          return new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime();
      }
    });
    return result;
  }, [posts, search, status, sort]);

  // Reset to page 1 whenever the filters change, adjusted during render
  // (React's recommended pattern) rather than in an effect, so it doesn't
  // cause an extra cascading render.
  const [prevFilters, setPrevFilters] = useState({ search, status, sort });
  if (
    prevFilters.search !== search ||
    prevFilters.status !== status ||
    prevFilters.sort !== sort
  ) {
    setPrevFilters({ search, status, sort });
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post? This can't be undone.")) return;
    await adminFetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    setPosts((prev) => prev?.filter((p) => p._id !== id) ?? null);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Posts</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-full bg-accent px-6 py-2 font-mono text-sm uppercase tracking-widest text-background"
        >
          New post
        </Link>
      </div>

      {posts === null ? (
        <p className="mt-8 text-muted">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="mt-8 text-muted">No posts yet — create your first one.</p>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap gap-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title…"
              className="min-w-0 flex-1 border-b border-ink/20 bg-transparent py-2 text-sm outline-none focus:border-accent"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="border-b border-ink/20 bg-transparent py-2 text-sm outline-none focus:border-accent"
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOrder)}
              className="border-b border-ink/20 bg-transparent py-2 text-sm outline-none focus:border-accent"
            >
              <option value="updated-desc">Recently updated</option>
              <option value="updated-asc">Oldest updated</option>
              <option value="title-asc">Title A–Z</option>
              <option value="title-desc">Title Z–A</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="mt-8 text-muted">No posts match your filters.</p>
          ) : (
            <div className="mt-4 divide-y divide-ink/10 border-t border-ink/10">
              {paged.map((post) => (
                <div key={post._id} className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-medium">{post.title}</p>
                    <p className="font-mono text-xs uppercase tracking-widest text-muted">
                      {post.published ? "Published" : "Draft"}
                      {post.updatedAt &&
                        ` — updated ${new Date(post.updatedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-4 font-mono text-sm uppercase tracking-widest">
                    <Link href={`/admin/posts/${post._id}`} className="hover:text-accent">
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(post._id)}
                      className="text-muted hover:text-accent"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <div className="mt-6 flex items-center justify-between font-mono text-xs uppercase tracking-widest text-muted">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="hover:text-accent disabled:opacity-30"
              >
                ← Previous
              </button>
              <span>
                Page {page} of {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="hover:text-accent disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
