"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CaseStudyEditor from "@/components/admin/CaseStudyEditor";
import { adminFetch } from "@/lib/admin-auth";
import type { CaseStudyRecord } from "@/lib/case-study-admin";

export default function EditCaseStudyPage() {
  const { id } = useParams<{ id: string }>();
  const [caseStudy, setCaseStudy] = useState<CaseStudyRecord | null | undefined>(undefined);

  useEffect(() => {
    adminFetch(`/api/admin/case-studies/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setCaseStudy);
  }, [id]);

  if (caseStudy === undefined) return <p className="text-muted">Loading…</p>;
  if (caseStudy === null) return <p className="text-muted">Case study not found.</p>;

  return <CaseStudyEditor initial={caseStudy} />;
}
