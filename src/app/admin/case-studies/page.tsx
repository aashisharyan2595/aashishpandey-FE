"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-auth";
import type { CaseStudyRecord } from "@/lib/case-study-admin";

export default function AdminCaseStudiesPage() {
  const [caseStudies, setCaseStudies] = useState<CaseStudyRecord[] | null>(null);

  useEffect(() => {
    adminFetch("/api/admin/case-studies")
      .then((res) => (res.ok ? res.json() : []))
      .then(setCaseStudies);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this case study? This can't be undone.")) return;
    await adminFetch(`/api/admin/case-studies/${id}`, { method: "DELETE" });
    setCaseStudies((prev) => prev?.filter((c) => c._id !== id) ?? null);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Case studies</h1>
        <Link
          href="/admin/case-studies/new"
          className="rounded-full bg-accent px-6 py-2 font-mono text-sm uppercase tracking-widest text-background"
        >
          New case study
        </Link>
      </div>

      {caseStudies === null ? (
        <p className="mt-8 text-muted">Loading…</p>
      ) : caseStudies.length === 0 ? (
        <p className="mt-8 text-muted">No case studies yet — create your first one.</p>
      ) : (
        <div className="mt-8 divide-y divide-ink/10 border-t border-ink/10">
          {caseStudies.map((cs) => (
            <div key={cs._id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium">{cs.title}</p>
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  {cs.published ? "Published" : "Draft"}
                  {cs.featured && " — Featured"} — order {cs.order}
                </p>
              </div>
              <div className="flex shrink-0 gap-4 font-mono text-sm uppercase tracking-widest">
                <Link href={`/admin/case-studies/${cs._id}`} className="hover:text-accent">
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(cs._id)}
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
