export const AUTH_ROLE_COOKIE = "scri_role";
export const AUTH_NAME_COOKIE = "scri_name";

export const ROLES = [
  "CUSTOMER_SUCCESS",
  "ANALYST_QUALITY",
  "COMMERCIAL_DIRECTION",
  "ADMIN",
] as const;

export type RoleName = (typeof ROLES)[number];

export type DemoUser = {
  email: string;
  name: string;
  role: RoleName;
  roleLabel: string;
};

export const demoUsers: DemoUser[] = [
  {
    email: "admin@example.com",
    name: "Demo Admin",
    role: "ADMIN",
    roleLabel: "Administrador",
  },
  {
    email: "customer.success@example.com",
    name: "Demo Customer Success",
    role: "CUSTOMER_SUCCESS",
    roleLabel: "Customer Success",
  },
  {
    email: "analyst.quality@example.com",
    name: "Demo Analista Calidad",
    role: "ANALYST_QUALITY",
    roleLabel: "Analista / Calidad",
  },
  {
    email: "commercial.direction@example.com",
    name: "Demo Dirección Comercial",
    role: "COMMERCIAL_DIRECTION",
    roleLabel: "Dirección Comercial",
  },
];

export function isRoleName(value: string | undefined): value is RoleName {
  return ROLES.includes(value as RoleName);
}

export function getRoleLabel(role: RoleName): string {
  return demoUsers.find((user) => user.role === role)?.roleLabel ?? role;
}
