import { NextRequest, NextResponse } from "next/server";
import { AUTH_ROLE_COOKIE, isRoleName } from "./lib/auth";
import { localBrowserUrl } from "./lib/local-url";
import { canAccessPath } from "./lib/navigation";

const publicPaths = new Set(["/", "/login", "/unauthorized"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.has(pathname)) {
    return NextResponse.next();
  }

  const role = request.cookies.get(AUTH_ROLE_COOKIE)?.value;

  if (!isRoleName(role)) {
    const loginUrl = localBrowserUrl("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!canAccessPath(role, pathname)) {
    return NextResponse.redirect(localBrowserUrl("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/upload-reviews/:path*",
    "/manual-review-entry/:path*",
    "/processed-reviews/:path*",
    "/critical-clients/:path*",
    "/follow-ups/:path*",
    "/human-corrections/:path*",
    "/upload-history/:path*",
    "/upload-errors/:path*",
    "/model-quality/:path*",
    "/reports/:path*",
    "/exports/:path*",
    "/audit-log/:path*",
    "/user-management/:path*",
  ],
};
