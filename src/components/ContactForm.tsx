"use client";

import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "sending" | "sent" | "error";
type InquiryType = "general" | "recruiter" | "project";

const INQUIRY_OPTIONS: { value: InquiryType; label: string }[] = [
  { value: "general", label: "Just saying hi" },
  { value: "recruiter", label: "Hiring (recruiter)" },
  { value: "project", label: "Project or freelance work" },
];

const fieldClass =
  "border-b border-ink/20 bg-transparent py-3 outline-none transition-colors focus:border-accent";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inquiryType, setInquiryType] = useState<InquiryType>("general");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? "").trim(),
      message: String(form.get("message") ?? ""),
      inquiryType,
      company: String(form.get("company") ?? ""),
      role: String(form.get("role") ?? ""),
      projectType: String(form.get("projectType") ?? ""),
      budget: String(form.get("budget") ?? ""),
      timeline: String(form.get("timeline") ?? ""),
    };

    if (!EMAIL_PATTERN.test(payload.email)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("sending");

    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Request failed");
      }
      setStatus("sent");
      formEl.reset();
      setInquiryType("general");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong — retry");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid max-w-xl gap-6">
      <div>
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
          I&apos;m reaching out as…
        </p>
        <div className="flex flex-wrap gap-2">
          {INQUIRY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              data-cursor-hover
              onClick={() => setInquiryType(opt.value)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                inquiryType === opt.value
                  ? "border-accent bg-accent text-background"
                  : "border-ink/20 hover:border-accent"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <input name="name" required placeholder="Your name" className={fieldClass} />
      <input
        name="email"
        type="email"
        required
        placeholder="Your email"
        className={fieldClass}
      />

      {inquiryType === "recruiter" && (
        <div className="grid gap-6 sm:grid-cols-2">
          <input name="company" placeholder="Company" className={fieldClass} />
          <input name="role" placeholder="Role you're hiring for" className={fieldClass} />
        </div>
      )}

      {inquiryType === "project" && (
        <div className="grid gap-6 sm:grid-cols-2">
          <input
            name="company"
            placeholder="Company / organization"
            className={fieldClass}
          />
          <input name="projectType" placeholder="Project type" className={fieldClass} />
          <input name="budget" placeholder="Budget range (optional)" className={fieldClass} />
          <input name="timeline" placeholder="Timeline (optional)" className={fieldClass} />
        </div>
      )}

      <textarea
        name="message"
        required
        rows={4}
        placeholder="What are you building?"
        className={fieldClass}
      />

      {status === "error" && errorMessage && (
        <p className="text-sm text-accent">{errorMessage}</p>
      )}

      <motion.button
        type="submit"
        data-cursor-hover
        disabled={status === "sending"}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="mt-4 w-fit rounded-full bg-accent px-8 py-3 font-mono text-sm uppercase tracking-widest text-background disabled:opacity-50"
      >
        {status === "sending" && "Sending…"}
        {status === "sent" && "Sent — thank you!"}
        {status === "error" && "Retry"}
        {status === "idle" && "Send message"}
      </motion.button>
    </form>
  );
}
