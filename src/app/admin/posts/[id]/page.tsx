"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PostEditor from "@/components/admin/PostEditor";
import { adminFetch } from "@/lib/admin-auth";
import type { BlogPost } from "@/lib/blog";

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined);

  useEffect(() => {
    adminFetch(`/api/admin/blog/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setPost);
  }, [id]);

  if (post === undefined) return <p className="text-muted">Loading…</p>;
  if (post === null) return <p className="text-muted">Post not found.</p>;

  return <PostEditor initialPost={post} />;
}
