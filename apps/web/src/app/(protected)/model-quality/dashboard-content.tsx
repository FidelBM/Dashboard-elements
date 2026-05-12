import { Prisma, RiskLabel, ConfidenceLevel } from "@/generated/prisma";
import type { RoleName } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ModelQualityClient,
  type ClassificationMatrixRow,
  type CorrectionComparisonRow,
  type ModelQualityFilters,
  type ModelQualityMetrics,
  type ModelQualityPredictionRow,
  type UploadErrorRow,
} from "./model-quality-client";

type DashboardContentProps = {
  activeRole: RoleName;
  searchParams?: Record<string, string | string[] | undefined>;
};

export async function ModelQualityDashboardContent({
  activeRole,
  searchParams = {},
}: DashboardContentProps) {
  const filters = normalizeFilters(searchParams);
  const where = buildReviewWhere(filters);
  const uploadErrorWhere = buildUploadErrorWhere(filters);

  const [reviews, uploadErrors, uploadErrorsCount, filterOptions] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        client: { select: { name: true } },
        prediction: {
          include: {
            humanCorrections: {
              orderBy: { createdAt: "desc" },
              include: {
                correctedBy: {
                  include: { role: true },
                },
              },
            },
          },
        },
      },
      orderBy: { reviewDate: "desc" },
      take: 250,
    }),
    prisma.uploadError.findMany({
      where: uploadErrorWhere,
      include: {
        fileUpload: { select: { originalFileName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.uploadError.count({ where: uploadErrorWhere }),
    getFilterOptions(),
  ]);

  const rows: ModelQualityPredictionRow[] = reviews
    .filter((review) => review.prediction)
    .map((review) => {
      const prediction = review.prediction!;
      const corrections = prediction.humanCorrections.map((correction) => ({
        id: correction.id,
        correctedBy: correction.correctedBy.name,
        role: correction.correctedBy.role.name,
        originalRisk: correction.originalRiskLabel,
        correctedRisk: correction.correctedRiskLabel,
        originalSentiment: correction.originalSentiment,
        correctedSentiment: correction.correctedSentiment,
        originalPrimaryCause: correction.originalPrimaryCause,
        correctedPrimaryCause: correction.correctedPrimaryCause,
        reason: correction.reason,
        mode: correction.reason?.startsWith("SUGERENCIA:") ? "suggestion" as const : "official" as const,
        createdAt: correction.createdAt.toISOString(),
      }));

      return {
        id: review.id,
        client: review.client.name,
        date: review.reviewDate.toISOString().slice(0, 10),
        category: review.category,
        subcategory: review.subcategory,
        comment: review.comment,
        originalClassification: review.originalClassification,
        nps: review.npsScore,
        prediction: {
          id: prediction.id,
          risk: prediction.riskLabel,
          probability: prediction.probability,
          sentiment: prediction.sentiment,
          mainCause: prediction.primaryCause,
          confidence: prediction.confidence,
          explanation: prediction.explanation,
          recommendation: prediction.recommendation,
          warnings: jsonArray(prediction.warnings),
          criticalSignals: jsonArray(prediction.detectedSignals),
          createdAt: prediction.createdAt.toISOString(),
        },
        corrections,
      };
    });

  const errorRows: UploadErrorRow[] = uploadErrors.map((error) => ({
    id: error.id,
    fileName: error.fileUpload.originalFileName,
    rowNumber: error.rowNumber,
    sourceRecordId: error.sourceRecordId,
    reason: error.reason,
    createdAt: error.createdAt.toISOString(),
  }));

  const metrics = buildMetrics(rows, uploadErrorsCount);

  return (
    <ModelQualityClient
      activeRole={activeRole}
      categoryErrors={buildCategoryErrors(rows)}
      correctionComparison={buildCorrectionComparison(rows)}
      filterOptions={filterOptions}
      filters={filters}
      metrics={metrics}
      originalVsPrediction={buildOriginalVsPrediction(rows)}
      predictions={rows}
      uploadErrors={errorRows}
    />
  );
}

function normalizeFilters(params: Record<string, string | string[] | undefined>): ModelQualityFilters {
  return {
    dateFrom: getParam(params.dateFrom),
    dateTo: getParam(params.dateTo),
    risk: getParam(params.risk),
    confidence: getParam(params.confidence),
    manualReview: getParam(params.manualReview),
    originalClassification: getParam(params.originalClassification),
    humanCorrection: getParam(params.humanCorrection),
    category: getParam(params.category),
  };
}

function buildReviewWhere(filters: ModelQualityFilters): Prisma.ReviewWhereInput {
  const predictionFilter: Prisma.PredictionWhereInput = {};

  if (filters.manualReview === "only") {
    predictionFilter.riskLabel = RiskLabel.MANUAL_REVIEW;
  } else if (isRiskLabel(filters.risk)) {
    predictionFilter.riskLabel = filters.risk;
  }

  if (isConfidenceLevel(filters.confidence)) {
    predictionFilter.confidence = filters.confidence;
  }

  if (filters.humanCorrection === "with") {
    predictionFilter.humanCorrections = { some: {} };
  }
  if (filters.humanCorrection === "without") {
    predictionFilter.humanCorrections = { none: {} };
  }
  if (filters.humanCorrection === "official") {
    predictionFilter.humanCorrections = { some: { reason: { startsWith: "OFICIAL:" } } };
  }
  if (filters.humanCorrection === "suggestion") {
    predictionFilter.humanCorrections = { some: { reason: { startsWith: "SUGERENCIA:" } } };
  }

  const where: Prisma.ReviewWhereInput = {
    prediction: { is: predictionFilter },
  };

  if (filters.dateFrom || filters.dateTo) {
    where.reviewDate = {};
    if (filters.dateFrom) where.reviewDate.gte = new Date(`${filters.dateFrom}T00:00:00.000Z`);
    if (filters.dateTo) where.reviewDate.lte = new Date(`${filters.dateTo}T23:59:59.999Z`);
  }

  if (filters.originalClassification) {
    where.originalClassification = { contains: filters.originalClassification, mode: "insensitive" };
  }

  if (filters.category) {
    where.category = { contains: filters.category, mode: "insensitive" };
  }

  return where;
}

function buildUploadErrorWhere(filters: ModelQualityFilters): Prisma.UploadErrorWhereInput {
  const where: Prisma.UploadErrorWhereInput = {};
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(`${filters.dateFrom}T00:00:00.000Z`);
    if (filters.dateTo) where.createdAt.lte = new Date(`${filters.dateTo}T23:59:59.999Z`);
  }
  return where;
}

async function getFilterOptions() {
  const [classifications, categories] = await Promise.all([
    prisma.review.findMany({
      distinct: ["originalClassification"],
      orderBy: { originalClassification: "asc" },
      select: { originalClassification: true },
    }),
    prisma.review.findMany({
      distinct: ["category"],
      orderBy: { category: "asc" },
      select: { category: true },
    }),
  ]);

  return {
    originalClassifications: classifications.map((item) => item.originalClassification),
    categories: categories.map((item) => item.category),
  };
}

function buildMetrics(rows: ModelQualityPredictionRow[], uploadErrorsCount: number): ModelQualityMetrics {
  const total = rows.length;
  const manualReview = rows.filter((row) => row.prediction.risk === "MANUAL_REVIEW").length;
  const lowConfidence = rows.filter((row) => row.prediction.confidence === "LOW").length;
  const corrections = rows.reduce((sum, row) => sum + row.corrections.length, 0);
  const officialCorrections = rows.reduce(
    (sum, row) => sum + row.corrections.filter((correction) => correction.mode === "official").length,
    0,
  );

  return {
    totalPredictions: total,
    manualReviewCount: manualReview,
    manualReviewPercentage: total > 0 ? Math.round((manualReview / total) * 100) : 0,
    lowConfidenceCount: lowConfidence,
    uploadErrorsCount,
    humanCorrectionsCount: corrections,
    officialCorrectionsCount: officialCorrections,
    riskDistribution: countBy(rows, (row) => row.prediction.risk),
  };
}

function buildCategoryErrors(rows: ModelQualityPredictionRow[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hasOfficialRiskChange = row.corrections.some(
      (correction) =>
        correction.mode === "official" && correction.correctedRisk !== correction.originalRisk,
    );
    if (hasOfficialRiskChange) {
      counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category))
    .slice(0, 8);
}

function buildOriginalVsPrediction(rows: ModelQualityPredictionRow[]): ClassificationMatrixRow[] {
  const counts = new Map<string, ClassificationMatrixRow>();
  for (const row of rows) {
    const key = `${row.originalClassification}__${row.prediction.risk}`;
    const current = counts.get(key);
    if (current) {
      current.count += 1;
    } else {
      counts.set(key, {
        originalClassification: row.originalClassification,
        modelPrediction: row.prediction.risk,
        count: 1,
      });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

function buildCorrectionComparison(rows: ModelQualityPredictionRow[]): CorrectionComparisonRow[] {
  const counts = new Map<string, CorrectionComparisonRow>();
  for (const row of rows) {
    for (const correction of row.corrections.filter((item) => item.mode === "official")) {
      const key = `${correction.originalRisk}__${correction.correctedRisk}`;
      const current = counts.get(key);
      if (current) {
        current.count += 1;
      } else {
        counts.set(key, {
          modelPrediction: correction.originalRisk,
          humanCorrection: correction.correctedRisk,
          count: 1,
        });
      }
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function isRiskLabel(value: string): value is RiskLabel {
  return [RiskLabel.HIGH, RiskLabel.MEDIUM, RiskLabel.LOW, RiskLabel.MANUAL_REVIEW].includes(
    value as RiskLabel,
  );
}

function isConfidenceLevel(value: string): value is ConfidenceLevel {
  return [ConfidenceLevel.HIGH, ConfidenceLevel.MEDIUM, ConfidenceLevel.LOW].includes(
    value as ConfidenceLevel,
  );
}

function jsonArray(value: Prisma.JsonValue | null): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}
