"use client";

import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import Reveal from "@/components/Reveal";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Status = "idle" | "sending" | "sent" | "error";

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      message: String(form.get("message") ?? ""),
    };

    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("sent");
      e.currentTarget.reset();
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="px-6 py-32 md:px-12">
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
            className="border-b border-white/20 bg-transparent py-3 outline-none transition-colors focus:border-accent"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Your email"
            className="border-b border-white/20 bg-transparent py-3 outline-none transition-colors focus:border-accent"
          />
          <textarea
            name="message"
            required
            rows={4}
            placeholder="What are you building?"
            className="border-b border-white/20 bg-transparent py-3 outline-none transition-colors focus:border-accent"
          />
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
            {status === "error" && "Something went wrong — retry"}
            {status === "idle" && "Send message"}
          </motion.button>
        </form>
      </Reveal>
    </section>
  );
}
