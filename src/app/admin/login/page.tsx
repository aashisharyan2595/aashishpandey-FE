"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { setAdminToken } from "@/lib/admin-auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const ERROR_MESSAGES: Record<string, string> = {
  pending_approval: "Your access request is pending approval from an existing admin.",
  access_denied: "Access denied for this account.",
  google_failed: "Google sign-in failed — try again.",
};

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [needsBootstrap, setNeedsBootstrap] = useState<boolean | null>(null);
  const [requiresSecret, setRequiresSecret] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bootstrapSecret, setBootstrapSecret] = useState("");
  const errParam = searchParams.get("error");
  const [error, setError] = useState<string | null>(
    errParam ? (ERROR_MESSAGES[errParam] ?? "Something went wrong — try again.") : null
  );
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/auth/bootstrap-status`)
      .then((res) => (res.ok ? res.json() : { needsBootstrap: false, requiresSecret: false }))
      .then((data: { needsBootstrap: boolean; requiresSecret: boolean }) => {
        setNeedsBootstrap(data.needsBootstrap);
        setRequiresSecret(data.requiresSecret);
      })
      .catch(() => setNeedsBootstrap(false));
  }, []);

  const handleBootstrap = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/admin/auth/bootstrap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, bootstrapSecret }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't set up the account — try again.");
        return;
      }
      const { token } = (await res.json()) as { token: string };
      setAdminToken(token);
      router.replace("/admin");
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Incorrect email or password.");
        return;
      }
      const { token } = (await res.json()) as { token: string };
      setAdminToken(token);
      router.replace("/admin");
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Enter your email above first, then click forgot password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await fetch(`${API_URL}/api/admin/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setForgotSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (needsBootstrap === null) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  if (needsBootstrap) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <form onSubmit={handleBootstrap} className="grid w-full max-w-sm gap-6">
          <div>
            <h1 className="font-display text-3xl">Set up your admin account</h1>
            <p className="mt-2 text-sm text-muted">
              No admin account exists yet — the first one created here becomes the site owner.
            </p>
          </div>
          <input
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="border-b border-ink/20 bg-transparent py-3 outline-none focus:border-accent"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="border-b border-ink/20 bg-transparent py-3 outline-none focus:border-accent"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8 characters)"
            className="border-b border-ink/20 bg-transparent py-3 outline-none focus:border-accent"
          />
          {requiresSecret && (
            <input
              required
              value={bootstrapSecret}
              onChange={(e) => setBootstrapSecret(e.target.value)}
              placeholder="Setup code"
              className="border-b border-ink/20 bg-transparent py-3 outline-none focus:border-accent"
            />
          )}
          {error && <p className="text-sm text-accent">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-fit rounded-full bg-accent px-8 py-3 font-mono text-sm uppercase tracking-widest text-background disabled:opacity-50"
          >
            {loading ? "Setting up…" : "Create account"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="grid w-full max-w-sm gap-6">
        <h1 className="font-display text-3xl">Admin</h1>

        <a
          href={`${API_URL}/api/admin/auth/google`}
          data-cursor-hover
          className="flex items-center justify-center gap-2 rounded-full border border-ink/20 py-3 font-mono text-sm uppercase tracking-widest hover:border-accent"
        >
          Sign in with Google
        </a>

        <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-muted">
          <span className="h-px flex-1 bg-ink/10" />
          or
          <span className="h-px flex-1 bg-ink/10" />
        </div>

        <form onSubmit={handleLogin} className="grid gap-6">
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="border-b border-ink/20 bg-transparent py-3 outline-none focus:border-accent"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="border-b border-ink/20 bg-transparent py-3 outline-none focus:border-accent"
          />
          {error && <p className="text-sm text-accent">{error}</p>}
          {forgotSent && (
            <p className="text-sm text-muted">
              If that email has an account, a reset link is on its way.
            </p>
          )}
          <div className="flex items-center justify-between gap-4">
            <button
              type="submit"
              disabled={loading}
              className="w-fit rounded-full bg-accent px-8 py-3 font-mono text-sm uppercase tracking-widest text-background disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className="font-mono text-xs uppercase tracking-widest text-muted hover:text-accent"
            >
              Forgot password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
