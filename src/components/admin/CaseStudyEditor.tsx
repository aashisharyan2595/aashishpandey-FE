"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminFetch } from "@/lib/admin-auth";
import type { CaseStudyRecord } from "@/lib/case-study-admin";
import MediaPicker from "./MediaPicker";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CaseStudyEditor({ initial }: { initial?: CaseStudyRecord }) {
  const router = useRouter();
  const isNew = !initial;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [client, setClient] = useState(initial?.client ?? "");
  const [timeframe, setTimeframe] = useState(initial?.timeframe ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [tagsInput, setTagsInput] = useState(initial?.tags.join(", ") ?? "");
  const [problem, setProblem] = useState(initial?.problem ?? "");
  const [approach, setApproach] = useState(initial?.approach ?? "");
  const [outcome, setOutcome] = useState(initial?.outcome ?? "");
  const [metricValue, setMetricValue] = useState(initial?.metric.value ?? "");
  const [metricLabel, setMetricLabel] = useState(initial?.metric.label ?? "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? "");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [order, setOrder] = useState(initial?.order ?? 0);
  const [published, setPublished] = useState(initial?.published ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const save = async () => {
    setError(null);
    setSaving(true);

    const payload = {
      title,
      slug,
      client,
      timeframe,
      summary,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      problem,
      approach,
      outcome,
      metric: { value: metricValue, label: metricLabel },
      coverImage: coverImage || undefined,
      featured,
      order,
      published,
    };

    try {
      const res = await adminFetch(
        isNew ? "/api/admin/case-studies" : `/api/admin/case-studies/${initial!._id}`,
        { method: isNew ? "POST" : "PUT", body: JSON.stringify(payload) }
      );
      if (!res.ok) {
        setError("Couldn't save — check the fields and try again.");
        return;
      }
      router.push("/admin/case-studies");
    } finally {
      setSaving(false);
    }
  };

  // Plain JSX values (not component functions) so they aren't remounted,
  // losing input focus, on every keystroke.
  const editorFields = (
    <div className="space-y-6">
      <Field label="Title">
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Relaunching Magnum Ice Cream Canada"
          className="border-b border-[#0B0B0C]/20 bg-transparent py-2.5 outline-none focus:border-[#FF5A36] text-lg font-medium"
        />
      </Field>
      <Field label="Slug">
        <input
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          className="border-b border-[#0B0B0C]/20 bg-transparent py-2 font-mono text-sm outline-none focus:border-[#FF5A36]"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client / Context">
          <input
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="e.g. Unilever, via Langoor"
            className="border-b border-[#0B0B0C]/20 bg-transparent py-2 text-sm outline-none focus:border-[#FF5A36]"
          />
        </Field>
        <Field label="Timeframe">
          <input
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            placeholder="e.g. 2025"
            className="border-b border-[#0B0B0C]/20 bg-transparent py-2 text-sm outline-none focus:border-[#FF5A36]"
          />
        </Field>
      </div>

      <Field label="Summary (shown on cards)">
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Brief description outlining the engagement..."
          rows={3}
          className="border-b border-[#0B0B0C]/20 bg-transparent py-2 outline-none focus:border-[#FF5A36] resize-y"
        />
      </Field>

      <div className="space-y-6 pt-4 border-t border-[#0B0B0C]/5">
        <Field label="1. The Problem">
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="Describe the challenge Aashish stepped in to solve..."
            rows={4}
            className="border-b border-[#0B0B0C]/20 bg-transparent py-2 outline-none focus:border-[#FF5A36] resize-y"
          />
        </Field>
        <Field label="2. The Approach">
          <textarea
            value={approach}
            onChange={(e) => setApproach(e.target.value)}
            placeholder="Describe Aashish's management approach, framework, or workflow integration..."
            rows={4}
            className="border-b border-[#0B0B0C]/20 bg-transparent py-2 outline-none focus:border-[#FF5A36] resize-y"
          />
        </Field>
        <Field label="3. The Outcome">
          <textarea
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="Describe the final delivery status and results..."
            rows={4}
            className="border-b border-[#0B0B0C]/20 bg-transparent py-2 outline-none focus:border-[#FF5A36] resize-y"
          />
        </Field>
      </div>
    </div>
  );

  const settingsSidebar = (
    <div className="space-y-6 sticky top-8">
      {/* Publishing Actions Panel */}
      <div className="rounded-2xl border border-[#0B0B0C]/10 bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-display text-sm font-bold text-[#0B0B0C] border-b border-[#0B0B0C]/5 pb-3">
          Publish Actions
        </h3>
        {error && <p className="text-xs text-[#FF5A36] font-mono">{error}</p>}
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="w-full rounded-full bg-[#FF5A36] py-3 font-mono text-xs uppercase tracking-widest text-[#F5F3EE] hover:opacity-90 disabled:opacity-50 transition-all font-semibold"
        >
          {saving ? "Saving…" : isNew ? "Create Case Study" : "Save Changes"}
        </button>
      </div>

      {/* Visual Assets Panel */}
      <div className="rounded-2xl border border-[#0B0B0C]/10 bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-display text-sm font-bold text-[#0B0B0C] border-b border-[#0B0B0C]/5 pb-3">
          Case Study Visuals
        </h3>
        <Field label="Cover image">
          <div className="flex items-center gap-2">
            <input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="Cover image URL"
              className="min-w-0 flex-1 border-b border-[#0B0B0C]/20 bg-transparent py-1.5 text-xs outline-none focus:border-[#FF5A36]"
            />
            <MediaPicker onSelect={setCoverImage} />
          </div>
        </Field>
        {coverImage && (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-[#0B0B0C]/10 bg-[#F5F3EE]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImage} alt="Cover Preview" className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      {/* Metric Panel */}
      <div className="rounded-2xl border border-[#0B0B0C]/10 bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-display text-sm font-bold text-[#0B0B0C] border-b border-[#0B0B0C]/5 pb-3">
          Headline Highlight Metric
        </h3>
        <Field label="Metric value">
          <input
            value={metricValue}
            onChange={(e) => setMetricValue(e.target.value)}
            placeholder="e.g. +50% or On time"
            className="border-b border-[#0B0B0C]/20 bg-transparent py-1.5 text-sm outline-none focus:border-[#FF5A36]"
          />
        </Field>
        <Field label="Metric label">
          <input
            value={metricLabel}
            onChange={(e) => setMetricLabel(e.target.value)}
            placeholder="e.g. Traffic growth"
            className="border-b border-[#0B0B0C]/20 bg-transparent py-1.5 text-sm outline-none focus:border-[#FF5A36]"
          />
        </Field>
      </div>

      {/* Settings / Display Options */}
      <div className="rounded-2xl border border-[#0B0B0C]/10 bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-display text-sm font-bold text-[#0B0B0C] border-b border-[#0B0B0C]/5 pb-3">
          Display Settings
        </h3>
        <Field label="Tags (comma separated)">
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. Shopify, UX, Delivery"
            className="border-b border-[#0B0B0C]/20 bg-transparent py-1.5 text-sm outline-none focus:border-[#FF5A36]"
          />
        </Field>
        <Field label="Display order (lower = first)">
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="border-b border-[#0B0B0C]/20 bg-transparent py-1.5 text-sm outline-none focus:border-[#FF5A36]"
          />
        </Field>
        <div className="flex flex-col gap-2 pt-2">
          <label className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-widest text-[#0B0B0C] cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="accent-[#FF5A36]"
            />
            <span>Featured on homepage</span>
          </label>
          <label className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-widest text-[#0B0B0C] cursor-pointer">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="accent-[#FF5A36]"
            />
            <span>Published</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl space-y-8">
      {/* Editor Header Bar */}
      <div className="border-b border-[#0B0B0C]/10 pb-5">
        <h1 className="font-display text-3xl font-bold text-[#0B0B0C]">
          {isNew ? "New Case Study" : "Edit Case Study"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">{editorFields}</div>
        <div className="lg:col-span-1">{settingsSidebar}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-[#8A8A86] font-semibold">{label}</span>
      {children}
    </label>
  );
}
