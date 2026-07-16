"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-auth";

type Submission = {
  _id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);

  useEffect(() => {
    adminFetch("/api/admin/submissions")
      .then((res) => (res.ok ? res.json() : []))
      .then(setSubmissions);
  }, []);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl">Submissions</h1>

      {submissions === null ? (
        <p className="mt-8 text-muted">Loading…</p>
      ) : submissions.length === 0 ? (
        <p className="mt-8 text-muted">No contact form submissions yet.</p>
      ) : (
        <div className="mt-8 grid gap-4">
          {submissions.map((s) => (
            <div key={s._id} className="rounded-lg border border-white/10 p-4">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-medium">
                  {s.name} <span className="text-muted">— {s.email}</span>
                </p>
                <p className="shrink-0 font-mono text-xs text-muted">
                  {new Date(s.createdAt).toLocaleString()}
                </p>
              </div>
              <p className="mt-2 text-muted">{s.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
