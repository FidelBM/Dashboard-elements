import { NextRequest, NextResponse } from "next/server";
import { AUTH_NAME_COOKIE, AUTH_ROLE_COOKIE } from "@/lib/auth";
import { localBrowserUrl } from "@/lib/local-url";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(localBrowserUrl("/login", request.url, request.headers), 303);
  response.cookies.delete(AUTH_ROLE_COOKIE);
  response.cookies.delete(AUTH_NAME_COOKIE);
  return response;
}
