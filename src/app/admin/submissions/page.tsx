"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-auth";

type InquiryType = "general" | "recruiter" | "project";

type Submission = {
  _id: string;
  name: string;
  email: string;
  message: string;
  inquiryType?: InquiryType;
  company?: string;
  role?: string;
  projectType?: string;
  budget?: string;
  timeline?: string;
  createdAt: string;
};

const INQUIRY_LABELS: Record<InquiryType, string> = {
  general: "Just saying hi",
  recruiter: "Hiring (recruiter)",
  project: "Project / freelance",
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
          {submissions.map((s) => {
            const details = [
              s.company && `Company: ${s.company}`,
              s.role && `Role: ${s.role}`,
              s.projectType && `Project type: ${s.projectType}`,
              s.budget && `Budget: ${s.budget}`,
              s.timeline && `Timeline: ${s.timeline}`,
            ].filter(Boolean);

            return (
              <div key={s._id} className="rounded-lg border border-ink/10 p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-medium">
                    {s.name} <span className="text-muted">— {s.email}</span>
                  </p>
                  <p className="shrink-0 font-mono text-xs text-muted">
                    {new Date(s.createdAt).toLocaleString()}
                  </p>
                </div>
                {s.inquiryType && (
                  <p className="mt-1 font-mono text-xs uppercase tracking-widest text-accent">
                    {INQUIRY_LABELS[s.inquiryType] ?? s.inquiryType}
                  </p>
                )}
                {details.length > 0 && (
                  <p className="mt-2 font-mono text-xs text-muted">{details.join(" · ")}</p>
                )}
                <p className="mt-2 text-muted">{s.message}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
