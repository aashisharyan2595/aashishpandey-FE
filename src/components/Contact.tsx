"use client";

import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import Reveal from "@/components/Reveal";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "sending" | "sent" | "error";

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? "").trim(),
      message: String(form.get("message") ?? ""),
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
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong — retry");
    }
  };

  return (
    <section id="contact" className="px-6 py-24 md:px-12">
      <Reveal>
        <h2 className="font-display text-4xl md:text-6xl">
          Say hello: <span className="text-accent">let&apos;s build something.</span>
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        <form onSubmit={handleSubmit} className="mt-12 grid max-w-xl gap-6">
          <input
            name="name"
            required
            placeholder="Your name"
            className="border-b border-ink/20 bg-transparent py-3 outline-none transition-colors focus:border-accent"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Your email"
            className="border-b border-ink/20 bg-transparent py-3 outline-none transition-colors focus:border-accent"
          />
          <textarea
            name="message"
            required
            rows={4}
            placeholder="What are you building?"
            className="border-b border-ink/20 bg-transparent py-3 outline-none transition-colors focus:border-accent"
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
      </Reveal>
    </section>
  );
}
