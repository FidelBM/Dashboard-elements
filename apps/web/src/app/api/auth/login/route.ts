import { NextRequest, NextResponse } from "next/server";
import { AUDIT_ACTIONS, logAuditEvent } from "@/lib/audit";
import { AUTH_NAME_COOKIE, AUTH_ROLE_COOKIE, demoUsers, isRoleName } from "@/lib/auth";
import { localBrowserUrl } from "@/lib/local-url";
import { getDefaultPathForRole } from "@/lib/navigation";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const roleValue = String(formData.get("role") ?? "");
  const nextPath = String(formData.get("next") ?? "");

  if (!isRoleName(roleValue)) {
    return NextResponse.redirect(
      localBrowserUrl("/login?error=invalid-role", request.url, request.headers),
      303,
    );
  }

  const user = demoUsers.find((demoUser) => demoUser.role === roleValue);
  const dbUser = await prisma.user.findFirst({
    where: {
      name: user?.name ?? roleValue,
      role: { name: roleValue },
    },
    select: { id: true },
  });
  const redirectPath = nextPath.startsWith("/") ? nextPath : getDefaultPathForRole(roleValue);
  const response = NextResponse.redirect(
    localBrowserUrl(redirectPath, request.url, request.headers),
    303,
  );

  await logAuditEvent(prisma, {
    userId: dbUser?.id ?? null,
    roleName: roleValue,
    action: AUDIT_ACTIONS.LOGIN,
    entityType: "User",
    entityId: dbUser?.id ?? null,
    newValues: {
      roleName: roleValue,
      redirectPath,
    },
    description: `Inicio de sesion como ${user?.roleLabel ?? roleValue}.`,
  });

  response.cookies.set(AUTH_ROLE_COOKIE, roleValue, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  response.cookies.set(AUTH_NAME_COOKIE, user?.name ?? roleValue, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
