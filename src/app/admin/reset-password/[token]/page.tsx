"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const confirmMismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't reset your password — try again.");
        return;
      }
      setDone(true);
      setTimeout(() => router.replace("/admin/login"), 2000);
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="max-w-sm text-center text-muted">
          Password updated. You&apos;ve been signed out everywhere — redirecting to sign in…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="grid w-full max-w-sm gap-6">
        <h1 className="font-display text-3xl">Reset password</h1>
        <input
          type="password"
          required
          autoFocus
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (min 8 characters)"
          className="border-b border-ink/20 bg-transparent py-3 outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          aria-invalid={confirmMismatch}
          className="border-b border-ink/20 bg-transparent py-3 outline-none focus:border-accent aria-[invalid=true]:border-accent"
        />
        {confirmMismatch && !error && (
          <p className="text-sm text-accent">Passwords don&apos;t match.</p>
        )}
        {error && <p className="text-sm text-accent">{error}</p>}
        <button
          type="submit"
          disabled={loading || confirmMismatch}
          className="w-fit rounded-full bg-accent px-8 py-3 font-mono text-sm uppercase tracking-widest text-background disabled:opacity-50"
        >
          {loading ? "Saving…" : "Set new password"}
        </button>
      </form>
    </div>
  );
}
