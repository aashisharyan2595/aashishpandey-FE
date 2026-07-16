"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAdminToken, getAdminToken } from "@/lib/admin-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  // This section is client-only auth (localStorage token, no session cookie), so
  // the server can never know whether a visitor is authorized. Render nothing until
  // after the client has mounted, so the server and first client render always
  // agree (both empty) and we only read localStorage once hydration is safe.
  const [hydrated, setHydrated] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard hydration-safe mount gate
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoginPage && !getAdminToken()) {
      router.replace("/admin/login");
    }
  }, [hydrated, isLoginPage, router]);

  if (!hydrated) return null;

  const authorized = isLoginPage || Boolean(getAdminToken());
  if (!authorized) return null;

  if (isLoginPage) {
    return <div className="min-h-screen bg-background text-foreground">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <nav className="flex items-center gap-6 font-mono text-sm uppercase tracking-widest">
          <Link href="/admin" className="hover:text-accent">
            Admin
          </Link>
          <Link href="/admin/posts" className="hover:text-accent">
            Posts
          </Link>
          <Link href="/admin/submissions" className="hover:text-accent">
            Submissions
          </Link>
        </nav>
        <button
          type="button"
          onClick={() => {
            clearAdminToken();
            router.replace("/admin/login");
          }}
          className="font-mono text-sm uppercase tracking-widest text-muted hover:text-accent"
        >
          Log out
        </button>
      </header>
      <main className="px-6 py-10 md:px-12">{children}</main>
    </div>
  );
}
