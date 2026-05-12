import { Prisma, RoleName } from "@/generated/prisma";

type AuditDb = {
  auditLog: {
    create(args: Prisma.AuditLogCreateArgs): Promise<unknown>;
  };
};

export const AUDIT_ACTIONS = {
  LOGIN: "LOGIN",
  FILE_UPLOAD: "FILE_UPLOAD",
  FILE_VALIDATION: "FILE_VALIDATION",
  UPLOAD_ERRORS: "UPLOAD_ERRORS",
  PREDICTION_EXECUTION: "PREDICTION_EXECUTION",
  HUMAN_CORRECTION: "HUMAN_CORRECTION",
  CORRECTION_SUGGESTION: "CORRECTION_SUGGESTION",
  FOLLOW_UP_CREATED: "FOLLOW_UP_CREATED",
  FOLLOW_UP_UPDATED: "FOLLOW_UP_UPDATED",
  CRITICAL_CASE_CLOSED: "CRITICAL_CASE_CLOSED",
  RESULT_EXPORT: "RESULT_EXPORT",
  USER_PERMISSION_CHANGE: "USER_PERMISSION_CHANGE",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export type AuditActor = {
  userId?: string | null;
  roleName?: RoleName | null;
};

type AuditInput = AuditActor & {
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  previousValues?: Prisma.InputJsonValue | null;
  newValues?: Prisma.InputJsonValue | null;
  description: string;
};

const sensitiveKeyPattern = /(comment|comentario|raw|payload|password|token|secret|cookie|phone|telefono|email|correo|address|direccion)/i;

export async function logAuditEvent(db: AuditDb, input: AuditInput) {
  await db.auditLog.create({
    data: {
      userId: input.userId ?? null,
      roleName: input.roleName ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      previousValues: input.previousValues ? sanitizeAuditValue(input.previousValues) : undefined,
      newValues: input.newValues ? sanitizeAuditValue(input.newValues) : undefined,
      description: input.description,
    },
  });
}

export function sanitizeAuditValue(value: Prisma.InputJsonValue): Prisma.InputJsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditValue(item as Prisma.InputJsonValue)) as Prisma.InputJsonArray;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        sensitiveKeyPattern.test(key)
          ? "[redactado]"
          : sanitizeAuditValue(item as Prisma.InputJsonValue),
      ]),
    ) as Prisma.InputJsonObject;
  }

  return value;
}
