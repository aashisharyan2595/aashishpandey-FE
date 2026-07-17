"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminFetch, clearAdminToken, getAdminToken } from "@/lib/admin-auth";

type UserProfile = {
  name: string;
  email: string;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const isPublicPage =
    pathname === "/admin/login" ||
    pathname === "/admin/oauth-callback" ||
    pathname?.startsWith("/admin/reset-password/");

  // Hydration safety gate
  const [hydrated, setHydrated] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard hydration-safe mount gate
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isPublicPage && !getAdminToken()) {
      router.replace("/admin/login");
    }
  }, [hydrated, isPublicPage, router]);

  useEffect(() => {
    if (!hydrated || isPublicPage || !getAdminToken()) return;
    adminFetch("/api/admin/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.user) {
          setUser({ name: data.user.name, email: data.user.email });
        }
      })
      .catch(() => {});
  }, [hydrated, isPublicPage]);

  if (!hydrated) return null;

  const authorized = isPublicPage || Boolean(getAdminToken());
  if (!authorized) return null;

  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-[#F5F3EE] text-[#0B0B0C]">
        <meta name="robots" content="noindex, nofollow" />
        {children}
      </div>
    );
  }

  const logOutEverywhere = async () => {
    if (!confirm("Sign out on every device? You'll need to sign in again here too.")) return;
    await adminFetch("/api/admin/auth/logout-all", { method: "POST" });
    clearAdminToken();
    router.replace("/admin/login");
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin",
      exact: true,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
        </svg>
      ),
    },
    {
      label: "Posts",
      href: "/admin/posts",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      ),
    },
    {
      label: "Case Studies",
      href: "/admin/case-studies",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.008 1.24l.885 1.77a2.25 2.25 0 0 0 2.007 1.24h1.98a2.25 2.25 0 0 0 2.007-1.24l.885-1.77a2.25 2.25 0 0 1 2.007-1.24h3.86m-18 0h18m-18 0v-2.25A2.25 2.25 0 0 1 4.5 9h15A2.25 2.25 0 0 1 21.75 11.25v2.25m-18 0v5.25A2.25 2.25 0 0 0 4.5 21h15a2.25 2.25 0 0 0 2.25-2.25v-5.25M9 3h6M12 3v3" />
        </svg>
      ),
    },
    {
      label: "Media Library",
      href: "/admin/media",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      ),
    },
    {
      label: "Categories",
      href: "/admin/categories",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.44 1.44 0 0 0 2.037 0l4.318-4.317a1.44 1.44 0 0 0 0-2.037L11.16 3.659A2.235 2.235 0 0 0 9.568 3Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
        </svg>
      ),
    },
    {
      label: "Submissions",
      href: "/admin/submissions",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
      ),
    },
    {
      label: "Users",
      href: "/admin/users",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0 1 10.089 18a11.374 11.374 0 0 1-5.089-1.237v-.109c0-2.197 3.208-4.016 7.64-4.016 4.432 0 7.64 1.819 7.64 4.016v.109ZM6 7.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm18.303 2.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        </svg>
      ),
    },
  ];

  const checkActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname?.startsWith(item.href);
  };

  // Plain JSX value (not a component function) — used in two places below,
  // but must not be redeclared as a component each render or both instances
  // remount (losing scroll position / any local UI state) on every re-render.
  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0B0B0C] p-6 text-[#F5F3EE]">
      <div className="grid gap-8">
        <div>
          <Link href="/" className="group flex items-baseline gap-2">
            <span className="font-display text-lg font-bold tracking-tight text-[#FF5A36] group-hover:opacity-80">
              Aashish Pandey
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#8A8A86]">
              CMS v2
            </span>
          </Link>
        </div>

        <nav className="grid gap-1 font-mono text-xs uppercase tracking-widest">
          {navItems.map((item) => {
            const isActive = checkActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3.5 rounded-lg px-4 py-3 transition-all ${
                  isActive
                    ? "bg-[#FF5A36] text-[#F5F3EE] font-bold"
                    : "text-[#8A8A86] hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="grid gap-4 border-t border-white/[0.08] pt-6 font-mono text-xs uppercase tracking-widest">
        {user && (
          <div className="px-2">
            <p className="truncate text-xs font-semibold text-white">{user.name}</p>
            <p className="truncate text-[10px] text-[#8A8A86] mt-0.5 lowercase">{user.email}</p>
          </div>
        )}
        <div className="grid gap-1">
          <button
            type="button"
            onClick={logOutEverywhere}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-[#8A8A86] hover:bg-white/[0.04] hover:text-white transition-all text-left"
          >
            <svg className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l6-6m0 0l6 6m-6-6v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h3" />
            </svg>
            <span>Sign out all</span>
          </button>
          <button
            type="button"
            onClick={() => {
              clearAdminToken();
              router.replace("/admin/login");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-[#8A8A86] hover:bg-white/[0.04] hover:text-white transition-all text-left"
          >
            <svg className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#0B0B0C] flex flex-col md:flex-row">
      <meta name="robots" content="noindex, nofollow" />
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 shrink-0 border-r border-[#0B0B0C]/10 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Top Navbar */}
      <header className="md:hidden flex items-center justify-between border-b border-[#0B0B0C]/10 bg-[#0B0B0C] p-4 text-[#F5F3EE]">
        <Link href="/" className="font-display text-sm font-bold tracking-tight text-[#FF5A36]">
          Aashish Pandey
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-[#8A8A86] hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile Overlay Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-[#0B0B0C]/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex w-80 max-w-[85vw] flex-col h-full z-10 shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Content Area */}
      <main className="flex-1 px-6 py-10 md:px-12 overflow-x-hidden min-h-screen">
        {children}
      </main>
    </div>
  );
}
