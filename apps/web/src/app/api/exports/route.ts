import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, RiskLabel, RoleName as PrismaRoleName } from "@/generated/prisma";
import { AUDIT_ACTIONS, logAuditEvent } from "@/lib/audit";
import { AUTH_NAME_COOKIE, AUTH_ROLE_COOKIE, isRoleName } from "@/lib/auth";
import {
  calculateAccumulatedCustomerRisk,
  type CustomerRiskReview,
} from "@/lib/customer-risk";
import { prisma } from "@/lib/prisma";

type AuthContext = {
  roleName: PrismaRoleName;
  userId: string | null;
};

type ExportEntity =
  | "processed_reviews"
  | "critical_clients"
  | "upload_errors"
  | "human_corrections"
  | "recommendation_feedback";

type ExportFormat = "csv" | "xlsx";

type ExportRow = Record<string, string | number | null>;

const entityLabels: Record<ExportEntity, string> = {
  processed_reviews: "Reseñas procesadas",
  critical_clients: "Clientes críticos",
  upload_errors: "Errores de carga",
  human_corrections: "Correcciones humanas",
  recommendation_feedback: "Feedback de recomendaciones",
};

export async function GET(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Sesion no valida." }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const entity = parseEntity(params.get("entity"));
  const format = parseFormat(params.get("format"));

  if (!entity) {
    return NextResponse.json({ error: "Tipo de exportacion no valido." }, { status: 400 });
  }

  const filters = collectFilters(params);
  const rows = await getExportRows(entity, filters);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const baseFileName = `${entity}-${timestamp}`;

  await logAuditEvent(prisma, {
    userId: auth.userId,
    roleName: auth.roleName,
    action: AUDIT_ACTIONS.RESULT_EXPORT,
    entityType: entityLabels[entity],
    entityId: null,
    newValues: {
      exportedEntityType: entity,
      format,
      rowCount: rows.length,
      filters,
      exportedAt: new Date().toISOString(),
    },
    description: `Exportacion de ${entityLabels[entity]} en formato ${format.toUpperCase()}.`,
  });

  if (format === "xlsx") {
    return new NextResponse(toExcelXml(rows, entityLabels[entity]), {
      headers: {
        "Content-Disposition": `attachment; filename="${baseFileName}.xls"`,
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      },
    });
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Disposition": `attachment; filename="${baseFileName}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}

async function getAuthContext(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const roleValue = cookieStore.get(AUTH_ROLE_COOKIE)?.value;
  const userName = cookieStore.get(AUTH_NAME_COOKIE)?.value ?? null;

  if (!isRoleName(roleValue)) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      name: userName ?? undefined,
      role: { name: roleValue },
    },
    select: { id: true },
  });

  return { roleName: roleValue, userId: user?.id ?? null };
}

function parseEntity(value: string | null): ExportEntity | null {
  const entities: ExportEntity[] = [
    "processed_reviews",
    "critical_clients",
    "upload_errors",
    "human_corrections",
    "recommendation_feedback",
  ];
  return entities.includes(value as ExportEntity) ? (value as ExportEntity) : null;
}

function parseFormat(value: string | null): ExportFormat {
  return value === "xlsx" ? "xlsx" : "csv";
}

function collectFilters(params: URLSearchParams) {
  return {
    dateFrom: clean(params.get("dateFrom")),
    dateTo: clean(params.get("dateTo")),
    client: clean(params.get("client")),
    risk: clean(params.get("risk")),
    cause: clean(params.get("cause")),
    category: clean(params.get("category")),
    product: clean(params.get("product")),
    source: clean(params.get("source")),
    useful: clean(params.get("useful")),
  };
}

async function getExportRows(entity: ExportEntity, filters: ReturnType<typeof collectFilters>) {
  if (entity === "processed_reviews") return exportProcessedReviews(filters);
  if (entity === "critical_clients") return exportCriticalClients(filters);
  if (entity === "upload_errors") return exportUploadErrors(filters);
  if (entity === "human_corrections") return exportHumanCorrections(filters);
  return exportRecommendationFeedback(filters);
}

async function exportProcessedReviews(filters: ReturnType<typeof collectFilters>): Promise<ExportRow[]> {
  const reviews = await prisma.review.findMany({
    where: buildReviewWhere(filters),
    include: {
      client: { select: { name: true } },
      prediction: true,
      followUps: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { reviewDate: "desc" },
    take: 5000,
  });

  return reviews
    .filter((review) => review.prediction)
    .map((review) => ({
      Cliente: review.client.name,
      Fecha: formatDate(review.reviewDate),
      Riesgo: labelRisk(review.prediction!.riskLabel),
      Probabilidad: Math.round(review.prediction!.probability * 100),
      Sentimiento: review.prediction!.sentiment,
      "Causa principal": review.prediction!.primaryCause,
      "Causa secundaria": review.prediction!.secondaryCause,
      Confianza: review.prediction!.confidence,
      Urgencia: review.prediction!.urgency,
      "Recomendación breve": review.prediction!.recommendation,
      "Clasificación original": review.originalClassification,
      Categoria: review.category,
      Subcategoria: review.subcategory,
      Producto: review.product,
      Fuente: review.source,
      NPS: review.npsScore,
      Seguimiento: review.followUps[0]?.status ?? "Sin seguimiento",
    }));
}

async function exportCriticalClients(filters: ReturnType<typeof collectFilters>): Promise<ExportRow[]> {
  const referenceDate = new Date();
  const windowStart = filters.dateFrom
    ? new Date(`${filters.dateFrom}T00:00:00.000Z`)
    : new Date(referenceDate.getTime() - 90 * 24 * 60 * 60 * 1000);
  const windowEnd = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999Z`) : referenceDate;

  const clients = await prisma.client.findMany({
    where: filters.client ? { name: { contains: filters.client, mode: "insensitive" } } : undefined,
    include: {
      reviews: {
        where: {
          reviewDate: { gte: windowStart, lte: windowEnd },
          prediction: { isNot: null },
          ...(filters.product ? { product: { contains: filters.product, mode: "insensitive" } } : {}),
          ...(filters.category ? { category: { contains: filters.category, mode: "insensitive" } } : {}),
          ...(filters.source ? { source: { contains: filters.source, mode: "insensitive" } } : {}),
          ...(filters.cause
            ? { prediction: { is: { primaryCause: { contains: filters.cause, mode: "insensitive" } } } }
            : {}),
        },
        include: { prediction: true },
      },
    },
  });

  return clients
    .map((client) => {
      const risk = calculateAccumulatedCustomerRisk(
        client.reviews
          .filter((review) => review.prediction)
          .map((review): CustomerRiskReview => ({
            reviewDate: review.reviewDate,
            riskLabel: review.prediction!.riskLabel,
            npsScore: review.npsScore,
            primaryCause: review.prediction!.primaryCause,
            detectedSignals: review.prediction!.detectedSignals,
          })),
        windowEnd,
      );

      return {
        Cliente: client.name,
        Puntaje: risk.totalScore,
        Estado: labelClientStatus(risk.status),
        "Reseñas consideradas": risk.reviewsConsidered,
        "Causas principales": risk.mainAccumulatedCauses.join("; "),
        "Señales críticas": risk.detectedCriticalSignals.join("; "),
        "Recomendación general": risk.recommendation,
      };
    })
    .filter((row) => row.Estado === "Crítico" || row.Estado === "En observación")
    .sort((a, b) => Number(b.Puntaje) - Number(a.Puntaje));
}

async function exportUploadErrors(filters: ReturnType<typeof collectFilters>): Promise<ExportRow[]> {
  const errors = await prisma.uploadError.findMany({
    where: {
      ...buildCreatedAtWhere(filters),
      ...(filters.client ? { fileUpload: { originalFileName: { contains: filters.client, mode: "insensitive" } } } : {}),
    },
    include: { fileUpload: { select: { originalFileName: true, status: true } } },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  return errors.map((error) => ({
    Archivo: error.fileUpload.originalFileName,
    Estado: error.fileUpload.status,
    Fila: error.rowNumber,
    "ID origen": error.sourceRecordId,
    Motivo: error.reason,
    Fecha: formatDateTime(error.createdAt),
  }));
}

async function exportHumanCorrections(filters: ReturnType<typeof collectFilters>): Promise<ExportRow[]> {
  const corrections = await prisma.humanCorrection.findMany({
    where: {
      ...buildCreatedAtWhere(filters),
      ...(isRisk(filters.risk) ? { correctedRiskLabel: filters.risk } : {}),
      ...(filters.cause ? { correctedPrimaryCause: { contains: filters.cause, mode: "insensitive" } } : {}),
      prediction: {
        review: {
          ...(filters.client ? { client: { name: { contains: filters.client, mode: "insensitive" } } } : {}),
          ...(filters.category ? { category: { contains: filters.category, mode: "insensitive" } } : {}),
          ...(filters.product ? { product: { contains: filters.product, mode: "insensitive" } } : {}),
        },
      },
    },
    include: {
      correctedBy: { include: { role: true } },
      prediction: { include: { review: { include: { client: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  return corrections.map((correction) => ({
    Cliente: correction.prediction.review.client.name,
    "Fecha reseña": formatDate(correction.prediction.review.reviewDate),
    "Riesgo original": labelRisk(correction.originalRiskLabel),
    "Riesgo corregido": labelRisk(correction.correctedRiskLabel),
    "Sentimiento original": correction.originalSentiment,
    "Sentimiento corregido": correction.correctedSentiment,
    "Causa original": correction.originalPrimaryCause,
    "Causa corregida": correction.correctedPrimaryCause,
    "Corregido por": correction.correctedBy.name,
    Rol: correction.correctedBy.role.name,
    Motivo: correction.reason,
    "Fecha corrección": formatDateTime(correction.createdAt),
  }));
}

async function exportRecommendationFeedback(filters: ReturnType<typeof collectFilters>): Promise<ExportRow[]> {
  const feedback = await prisma.recommendationFeedback.findMany({
    where: {
      ...buildCreatedAtWhere(filters),
      ...(filters.useful === "true" ? { isUseful: true } : {}),
      ...(filters.useful === "false" ? { isUseful: false } : {}),
      prediction: {
        review: {
          ...(filters.client ? { client: { name: { contains: filters.client, mode: "insensitive" } } } : {}),
          ...(filters.category ? { category: { contains: filters.category, mode: "insensitive" } } : {}),
          ...(filters.product ? { product: { contains: filters.product, mode: "insensitive" } } : {}),
          ...(filters.source ? { source: { contains: filters.source, mode: "insensitive" } } : {}),
        },
        ...(filters.cause ? { primaryCause: { contains: filters.cause, mode: "insensitive" } } : {}),
        ...(isRisk(filters.risk) ? { riskLabel: filters.risk } : {}),
      },
    },
    include: {
      user: { include: { role: true } },
      prediction: { include: { review: { include: { client: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  return feedback.map((item) => ({
    Cliente: item.prediction.review.client.name,
    "Fecha reseña": formatDate(item.prediction.review.reviewDate),
    Riesgo: labelRisk(item.prediction.riskLabel),
    "Causa principal": item.prediction.primaryCause,
    "Recomendación": item.prediction.recommendation,
    "Fue útil": item.isUseful ? "Sí" : "No",
    Usuario: item.user.name,
    Rol: item.user.role.name,
    "Fecha feedback": formatDateTime(item.createdAt),
  }));
}

function buildReviewWhere(filters: ReturnType<typeof collectFilters>): Prisma.ReviewWhereInput {
  const predictionFilter: Prisma.PredictionWhereInput = {};
  if (isRisk(filters.risk)) predictionFilter.riskLabel = filters.risk;
  if (filters.cause) predictionFilter.primaryCause = { contains: filters.cause, mode: "insensitive" };

  return {
    prediction: { is: predictionFilter },
    ...(filters.dateFrom || filters.dateTo
      ? {
          reviewDate: {
            ...(filters.dateFrom ? { gte: new Date(`${filters.dateFrom}T00:00:00.000Z`) } : {}),
            ...(filters.dateTo ? { lte: new Date(`${filters.dateTo}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
    ...(filters.client ? { client: { name: { contains: filters.client, mode: "insensitive" } } } : {}),
    ...(filters.category ? { category: { contains: filters.category, mode: "insensitive" } } : {}),
    ...(filters.product ? { product: { contains: filters.product, mode: "insensitive" } } : {}),
    ...(filters.source ? { source: { contains: filters.source, mode: "insensitive" } } : {}),
  };
}

function buildCreatedAtWhere(filters: ReturnType<typeof collectFilters>) {
  return filters.dateFrom || filters.dateTo
    ? {
        createdAt: {
          ...(filters.dateFrom ? { gte: new Date(`${filters.dateFrom}T00:00:00.000Z`) } : {}),
          ...(filters.dateTo ? { lte: new Date(`${filters.dateTo}T23:59:59.999Z`) } : {}),
        },
      }
    : {};
}

function toCsv(rows: ExportRow[]) {
  const headers = getHeaders(rows);
  const body = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\r\n");
  return `\uFEFF${body}`;
}

function toExcelXml(rows: ExportRow[], sheetName: string) {
  const headers = getHeaders(rows);
  const headerCells = headers.map((header) => xmlCell(header)).join("");
  const dataRows = rows
    .map((row) => `<Row>${headers.map((header) => xmlCell(row[header])).join("")}</Row>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${escapeXml(sheetName.slice(0, 31))}">
  <Table>
   <Row>${headerCells}</Row>
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

function getHeaders(rows: ExportRow[]) {
  return rows.length > 0 ? Object.keys(rows[0]) : ["Sin resultados"];
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function xmlCell(value: unknown) {
  return `<Cell><Data ss:Type="String">${escapeXml(String(value ?? ""))}</Data></Cell>`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clean(value: string | null) {
  return String(value ?? "").trim();
}

function isRisk(value: string): value is RiskLabel {
  return [RiskLabel.HIGH, RiskLabel.MEDIUM, RiskLabel.LOW, RiskLabel.MANUAL_REVIEW].includes(
    value as RiskLabel,
  );
}

function labelRisk(risk: RiskLabel) {
  if (risk === RiskLabel.HIGH) return "Riesgo alto";
  if (risk === RiskLabel.MEDIUM) return "Riesgo medio";
  if (risk === RiskLabel.LOW) return "Riesgo bajo";
  return "Revisar manualmente";
}

function labelClientStatus(status: string) {
  if (status === "CRITICAL") return "Crítico";
  if (status === "WATCHLIST") return "En observación";
  if (status === "STABLE") return "Estable";
  return "Revisar manualmente";
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTime(date: Date) {
  return date.toISOString();
}
