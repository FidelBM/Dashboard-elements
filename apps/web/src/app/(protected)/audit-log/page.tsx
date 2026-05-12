import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { AuditLogClient, type AuditLogFilters, type AuditLogRow } from "./audit-log-client";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuditLogPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const filters = normalizeFilters(params);

  const [logs, filterOptions] = await Promise.all([
    prisma.auditLog.findMany({
      where: buildWhere(filters),
      include: {
        user: {
          include: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
    getFilterOptions(),
  ]);

  const rows: AuditLogRow[] = logs.map((log) => ({
    id: log.id,
    user: log.user?.name ?? "Sistema / no identificado",
    role: log.roleName ?? log.user?.role.name ?? null,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    previousValues: summarizeJson(log.previousValues),
    newValues: summarizeJson(log.newValues),
    description: log.description,
    createdAt: log.createdAt.toISOString(),
  }));

  return <AuditLogClient filterOptions={filterOptions} filters={filters} rows={rows} />;
}

function normalizeFilters(params: Record<string, string | string[] | undefined>): AuditLogFilters {
  return {
    user: getParam(params.user),
    action: getParam(params.action),
    entityType: getParam(params.entityType),
    dateFrom: getParam(params.dateFrom),
    dateTo: getParam(params.dateTo),
  };
}

function buildWhere(filters: AuditLogFilters): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};

  if (filters.user) {
    where.user = { name: { contains: filters.user, mode: "insensitive" } };
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(`${filters.dateFrom}T00:00:00.000Z`);
    if (filters.dateTo) where.createdAt.lte = new Date(`${filters.dateTo}T23:59:59.999Z`);
  }

  return where;
}

async function getFilterOptions() {
  const [actions, entities] = await Promise.all([
    prisma.auditLog.findMany({
      distinct: ["action"],
      orderBy: { action: "asc" },
      select: { action: true },
    }),
    prisma.auditLog.findMany({
      distinct: ["entityType"],
      orderBy: { entityType: "asc" },
      select: { entityType: true },
    }),
  ]);

  return {
    actions: actions.map((item) => item.action),
    entities: entities.map((item) => item.entityType),
  };
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function summarizeJson(value: Prisma.JsonValue | null) {
  if (!value) {
    return "No aplica";
  }

  const text = JSON.stringify(value);
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}
