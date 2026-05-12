import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AUTH_NAME_COOKIE, AUTH_ROLE_COOKIE, getRoleLabel, isRoleName } from "@/lib/auth";
import { getNavigationForRole } from "@/lib/navigation";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const roleValue = cookieStore.get(AUTH_ROLE_COOKIE)?.value;
  const userName = cookieStore.get(AUTH_NAME_COOKIE)?.value ?? "Usuario demo";

  if (!isRoleName(roleValue)) {
    redirect("/login");
  }

  const navigation = getNavigationForRole(roleValue);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard">
          <span>SCRI</span>
          <strong>Review Intelligence</strong>
        </Link>
        <nav className="nav-list" aria-label="Navegacion principal">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              <span>{item.label}</span>
              <small>{item.description}</small>
            </Link>
          ))}
        </nav>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div>
            <p className="topbar-label">Rol activo</p>
            <strong>{getRoleLabel(roleValue)}</strong>
          </div>
          <div className="user-chip">
            <span>{userName}</span>
            <form action="/api/auth/logout" method="post">
              <button type="submit">Salir</button>
            </form>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
