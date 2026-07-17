"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-auth";
import type { BlogPostSummary } from "@/lib/blog";

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<BlogPostSummary[] | null>(null);

  useEffect(() => {
    adminFetch("/api/admin/blog")
      .then((res) => (res.ok ? res.json() : []))
      .then(setPosts);
  }, []);

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
        <div className="mt-8 divide-y divide-ink/10 border-t border-ink/10">
          {posts.map((post) => (
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
    </div>
  );
}
