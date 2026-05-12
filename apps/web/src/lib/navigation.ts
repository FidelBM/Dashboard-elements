import type { RoleName } from "./auth";

export type NavItem = {
  href: string;
  label: string;
  description: string;
  roles: RoleName[];
};

const allRoles: RoleName[] = [
  "CUSTOMER_SUCCESS",
  "ANALYST_QUALITY",
  "COMMERCIAL_DIRECTION",
  "ADMIN",
];

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Resumen principal segun el rol.",
    roles: allRoles,
  },
  {
    href: "/upload-reviews",
    label: "Carga de reseñas",
    description: "Carga masiva CSV/Excel.",
    roles: ["CUSTOMER_SUCCESS", "ADMIN"],
  },
  {
    href: "/manual-review-entry",
    label: "Captura manual",
    description: "Registro individual de una resena.",
    roles: ["CUSTOMER_SUCCESS", "ADMIN"],
  },
  {
    href: "/processed-reviews",
    label: "Reseñas procesadas",
    description: "Consulta de resultados y detalle.",
    roles: ["CUSTOMER_SUCCESS", "ANALYST_QUALITY", "ADMIN"],
  },
  {
    href: "/critical-clients",
    label: "Clientes críticos",
    description: "Cuentas con mayor prioridad.",
    roles: ["CUSTOMER_SUCCESS", "ADMIN"],
  },
  {
    href: "/follow-ups",
    label: "Seguimientos",
    description: "Control basico de casos criticos.",
    roles: ["CUSTOMER_SUCCESS", "ANALYST_QUALITY", "COMMERCIAL_DIRECTION", "ADMIN"],
  },
  {
    href: "/human-corrections",
    label: "Correcciones humanas",
    description: "Validación y corrección oficial.",
    roles: ["ANALYST_QUALITY", "ADMIN"],
  },
  {
    href: "/upload-history",
    label: "Historial de cargas",
    description: "Consulta de cargas anteriores.",
    roles: ["ANALYST_QUALITY", "ADMIN"],
  },
  {
    href: "/upload-errors",
    label: "Errores de carga",
    description: "Filas invalidas y motivos.",
    roles: ["ANALYST_QUALITY", "ADMIN"],
  },
  {
    href: "/model-quality",
    label: "Calidad del modelo",
    description: "Revision manual, baja confianza y errores.",
    roles: ["ANALYST_QUALITY", "ADMIN"],
  },
  {
    href: "/reports",
    label: "Reportes",
    description: "Vistas ejecutivas de solo consulta.",
    roles: ["COMMERCIAL_DIRECTION", "ADMIN"],
  },
  {
    href: "/exports",
    label: "Exportaciones",
    description: "Salida de resultados filtrados.",
    roles: allRoles,
  },
  {
    href: "/audit-log",
    label: "Auditoría",
    description: "Acciones sensibles del sistema.",
    roles: ["ADMIN"],
  },
  {
    href: "/user-management",
    label: "Usuarios",
    description: "Gestion de usuarios y permisos.",
    roles: ["ADMIN"],
  },
];

export function getNavigationForRole(role: RoleName): NavItem[] {
  if (role === "ADMIN") {
    return navItems;
  }

  return navItems.filter((item) => item.roles.includes(role));
}

export function canAccessPath(role: RoleName, pathname: string): boolean {
  if (role === "ADMIN") {
    return true;
  }

  const matchedItem = navItems
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  if (!matchedItem) {
    return false;
  }

  return matchedItem.roles.includes(role);
}

export function getDefaultPathForRole(role: RoleName): string {
  if (role === "COMMERCIAL_DIRECTION") {
    return "/dashboard";
  }

  return "/dashboard";
}
