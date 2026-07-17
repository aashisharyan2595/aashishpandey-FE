import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The admin CMS must not be reachable at all on production — only staging
// admins edit content, then push it across. Runs before any admin JS ships,
// so production never even loads the bundle.
export function proxy(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEPLOY_ENV === "production" && request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.rewrite(new URL("/404", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
