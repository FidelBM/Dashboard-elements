import type { RoleName } from "./auth";

export const apiActionPermissions = {
  MANUAL_REVIEW_CREATE: ["CUSTOMER_SUCCESS", "ADMIN"],
  FILE_UPLOAD_PROCESS: ["CUSTOMER_SUCCESS", "ADMIN"],
  FOLLOW_UP_WRITE: ["CUSTOMER_SUCCESS", "ADMIN"],
  FOLLOW_UP_OBSERVATION: ["ANALYST_QUALITY", "ADMIN"],
  CORRECTION_SUGGESTION: ["CUSTOMER_SUCCESS", "ADMIN"],
  CORRECTION_OFFICIAL: ["ANALYST_QUALITY", "ADMIN"],
  RESULT_EXPORT: ["CUSTOMER_SUCCESS", "ANALYST_QUALITY", "COMMERCIAL_DIRECTION", "ADMIN"],
  AUDIT_READ: ["ADMIN"],
} as const satisfies Record<string, readonly RoleName[]>;

export type ApiAction = keyof typeof apiActionPermissions;

export function canUseApiAction(roleName: RoleName, action: ApiAction): boolean {
  return (apiActionPermissions[action] as readonly RoleName[]).includes(roleName);
}
