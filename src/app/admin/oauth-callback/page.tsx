"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { setAdminToken } from "@/lib/admin-auth";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setAdminToken(token);
      router.replace("/admin");
    } else {
      router.replace("/admin/login?error=google_failed");
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <p className="text-muted">Signing you in…</p>
    </div>
  );
}
