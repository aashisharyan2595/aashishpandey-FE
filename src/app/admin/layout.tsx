"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminFetch, clearAdminToken, getAdminToken } from "@/lib/admin-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPage =
    pathname === "/admin/login" ||
    pathname === "/admin/oauth-callback" ||
    pathname?.startsWith("/admin/reset-password/");

  // This section is client-only auth (localStorage token, no session cookie), so
  // the server can never know whether a visitor is authorized. Render nothing until
  // after the client has mounted, so the server and first client render always
  // agree (both empty) and we only read localStorage once hydration is safe.
  const [hydrated, setHydrated] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard hydration-safe mount gate
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isPublicPage && !getAdminToken()) {
      router.replace("/admin/login");
    }
  }, [hydrated, isPublicPage, router]);

  if (!hydrated) return null;

  const authorized = isPublicPage || Boolean(getAdminToken());
  if (!authorized) return null;

  if (isPublicPage) {
    return <div className="min-h-screen bg-background text-foreground">{children}</div>;
  }

  const logOutEverywhere = async () => {
    if (!confirm("Sign out on every device? You'll need to sign in again here too.")) return;
    await adminFetch("/api/admin/auth/logout-all", { method: "POST" });
    clearAdminToken();
    router.replace("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <nav className="flex items-center gap-6 font-mono text-sm uppercase tracking-widest">
          <Link href="/admin" className="hover:text-accent">
            Admin
          </Link>
          <Link href="/admin/posts" className="hover:text-accent">
            Posts
          </Link>
          <Link href="/admin/media" className="hover:text-accent">
            Media
          </Link>
          <Link href="/admin/categories" className="hover:text-accent">
            Categories
          </Link>
          <Link href="/admin/submissions" className="hover:text-accent">
            Submissions
          </Link>
          <Link href="/admin/users" className="hover:text-accent">
            Users
          </Link>
        </nav>
        <div className="flex items-center gap-4 font-mono text-sm uppercase tracking-widest text-muted">
          <button type="button" onClick={logOutEverywhere} className="hover:text-accent">
            Log out everywhere
          </button>
          <button
            type="button"
            onClick={() => {
              clearAdminToken();
              router.replace("/admin/login");
            }}
            className="hover:text-accent"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="px-6 py-10 md:px-12">{children}</main>
    </div>
  );
}
