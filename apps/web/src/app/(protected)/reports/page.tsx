import { Prisma, RiskLabel } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import {
  CommercialReportsClient,
  type CommercialClientRiskRow,
  type CommercialDistributionRow,
  type CommercialFilters,
  type CommercialMetrics,
  type CommercialMonthlyRiskRow,
  type CommercialTrendIndicators,
} from "./reports-client";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type ReviewWithPrediction = Prisma.ReviewGetPayload<{
  include: {
    client: { select: { id: true; name: true } };
    prediction: true;
  };
}>;

const riskWeights: Record<RiskLabel, number> = {
  HIGH: 5,
  MEDIUM: 3,
  MANUAL_REVIEW: 2,
  LOW: 0,
};

export default async function ReportsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const filters = normalizeFilters(params);

  const [reviews, filterOptions] = await Promise.all([
    prisma.review.findMany({
      where: buildWhere(filters),
      include: {
        client: { select: { id: true, name: true } },
        prediction: true,
      },
      orderBy: { reviewDate: "asc" },
      take: 5000,
    }),
    getFilterOptions(),
  ]);

  const predictionRows = reviews.filter((review) => review.prediction);
  const monthlyRiskEvolution = filterMonthlyByTrend(
    buildMonthlyRiskEvolution(predictionRows),
    filters.riskTrend,
  );
  const metrics = buildMetrics(predictionRows);
  const trendIndicators = buildTrendIndicators(predictionRows);

  return (
    <CommercialReportsClient
      causes={buildDistribution(predictionRows, (review) => review.prediction!.primaryCause)}
      clients={buildClientRiskRows(predictionRows)}
      filterOptions={filterOptions}
      filters={filters}
      metrics={metrics}
      monthlyRiskEvolution={monthlyRiskEvolution}
      productDistribution={buildDistribution(predictionRows, (review) => review.product || "Sin producto")}
      sourceDistribution={buildDistribution(predictionRows, (review) => review.source || "Sin fuente")}
      trendIndicators={trendIndicators}
    />
  );
}

function normalizeFilters(params: Record<string, string | string[] | undefined>): CommercialFilters {
  return {
    dateFrom: getParam(params.dateFrom),
    dateTo: getParam(params.dateTo),
    client: getParam(params.client),
    product: getParam(params.product),
    cause: getParam(params.cause),
    riskTrend: getParam(params.riskTrend),
  };
}

function buildWhere(filters: CommercialFilters): Prisma.ReviewWhereInput {
  const predictionFilter: Prisma.PredictionWhereInput = {};
  if (filters.cause) {
    predictionFilter.primaryCause = { contains: filters.cause, mode: "insensitive" };
  }

  const where: Prisma.ReviewWhereInput = {
    prediction: { is: predictionFilter },
  };

  if (filters.dateFrom || filters.dateTo) {
    where.reviewDate = {};
    if (filters.dateFrom) where.reviewDate.gte = new Date(`${filters.dateFrom}T00:00:00.000Z`);
    if (filters.dateTo) where.reviewDate.lte = new Date(`${filters.dateTo}T23:59:59.999Z`);
  }

  if (filters.client) {
    where.client = { name: { contains: filters.client, mode: "insensitive" } };
  }

  if (filters.product) {
    where.product = { contains: filters.product, mode: "insensitive" };
  }

  return where;
}

async function getFilterOptions() {
  const [products, causes] = await Promise.all([
    prisma.review.findMany({
      distinct: ["product"],
      where: { product: { not: null } },
      orderBy: { product: "asc" },
      select: { product: true },
    }),
    prisma.prediction.findMany({
      distinct: ["primaryCause"],
      orderBy: { primaryCause: "asc" },
      select: { primaryCause: true },
    }),
  ]);

  return {
    products: products.map((item) => item.product).filter(Boolean) as string[],
    causes: causes.map((item) => item.primaryCause),
  };
}

function buildMetrics(reviews: ReviewWithPrediction[]): CommercialMetrics {
  const total = reviews.length;
  const highRisk = reviews.filter((review) => review.prediction!.riskLabel === RiskLabel.HIGH).length;
  const mediumRisk = reviews.filter((review) => review.prediction!.riskLabel === RiskLabel.MEDIUM).length;
  const manualReview = reviews.filter(
    (review) => review.prediction!.riskLabel === RiskLabel.MANUAL_REVIEW,
  ).length;

  return {
    totalReviews: total,
    highRiskReviews: highRisk,
    mediumRiskReviews: mediumRisk,
    manualReviewReviews: manualReview,
    highRiskPercentage: total > 0 ? Math.round((highRisk / total) * 100) : 0,
  };
}

function buildMonthlyRiskEvolution(reviews: ReviewWithPrediction[]): CommercialMonthlyRiskRow[] {
  const months = new Map<string, CommercialMonthlyRiskRow>();
  for (const review of reviews) {
    const monthKey = review.reviewDate.toISOString().slice(0, 7);
    const row = months.get(monthKey) ?? {
      month: monthKey,
      total: 0,
      high: 0,
      medium: 0,
      low: 0,
      manualReview: 0,
      highRiskPercentage: 0,
      trend: "stable",
    };

    row.total += 1;
    if (review.prediction!.riskLabel === RiskLabel.HIGH) row.high += 1;
    if (review.prediction!.riskLabel === RiskLabel.MEDIUM) row.medium += 1;
    if (review.prediction!.riskLabel === RiskLabel.LOW) row.low += 1;
    if (review.prediction!.riskLabel === RiskLabel.MANUAL_REVIEW) row.manualReview += 1;
    row.highRiskPercentage = Math.round((row.high / row.total) * 100);
    months.set(monthKey, row);
  }

  const rows = [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
  return rows.map((row, index) => {
    const previous = rows[index - 1];
    const delta = previous ? row.highRiskPercentage - previous.highRiskPercentage : 0;
    return {
      ...row,
      trend: delta > 3 ? "up" : delta < -3 ? "down" : "stable",
    };
  });
}

function filterMonthlyByTrend(rows: CommercialMonthlyRiskRow[], riskTrend: string) {
  if (!["up", "down", "stable"].includes(riskTrend)) {
    return rows;
  }
  return rows.filter((row) => row.trend === riskTrend);
}

function buildClientRiskRows(reviews: ReviewWithPrediction[]): CommercialClientRiskRow[] {
  const clients = new Map<string, CommercialClientRiskRow>();
  for (const review of reviews) {
    const current = clients.get(review.clientId) ?? {
      id: review.clientId,
      client: review.client.name,
      score: 0,
      totalReviews: 0,
      highRiskReviews: 0,
      latestReviewDate: review.reviewDate.toISOString().slice(0, 10),
      mainCause: review.prediction!.primaryCause,
    };

    current.totalReviews += 1;
    current.score += riskWeights[review.prediction!.riskLabel];
    if (review.prediction!.riskLabel === RiskLabel.HIGH) current.highRiskReviews += 1;
    if (review.reviewDate > new Date(`${current.latestReviewDate}T00:00:00.000Z`)) {
      current.latestReviewDate = review.reviewDate.toISOString().slice(0, 10);
    }
    current.mainCause = mostFrequentCauseForClient(reviews, review.clientId);
    clients.set(review.clientId, current);
  }

  return [...clients.values()]
    .sort((a, b) => b.score - a.score || b.highRiskReviews - a.highRiskReviews || a.client.localeCompare(b.client))
    .slice(0, 10);
}

function mostFrequentCauseForClient(reviews: ReviewWithPrediction[], clientId: string) {
  const counts = new Map<string, number>();
  for (const review of reviews.filter((item) => item.clientId === clientId)) {
    const cause = review.prediction!.primaryCause;
    counts.set(cause, (counts.get(cause) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? "Sin causa";
}

function buildDistribution(
  reviews: ReviewWithPrediction[],
  getLabel: (review: ReviewWithPrediction) => string,
): CommercialDistributionRow[] {
  const counts = new Map<string, number>();
  for (const review of reviews) {
    const label = getLabel(review);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percentage: reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 8);
}

function buildTrendIndicators(reviews: ReviewWithPrediction[]): CommercialTrendIndicators {
  const sorted = [...reviews].sort((a, b) => a.reviewDate.getTime() - b.reviewDate.getTime());
  if (sorted.length < 2) {
    return {
      riskDirection: "stable",
      riskMessage: "Aun no hay volumen suficiente para identificar una tendencia.",
      volumeDirection: "stable",
      volumeMessage: "Volumen estable o insuficiente para comparación.",
    };
  }

  const midpoint = Math.floor(sorted.length / 2);
  const previous = sorted.slice(0, midpoint);
  const current = sorted.slice(midpoint);
  const previousHighShare = shareOfHighRisk(previous);
  const currentHighShare = shareOfHighRisk(current);
  const riskDelta = currentHighShare - previousHighShare;
  const volumeDelta = current.length - previous.length;

  return {
    riskDirection: riskDelta > 3 ? "up" : riskDelta < -3 ? "down" : "stable",
    riskMessage: buildRiskMessage(riskDelta),
    volumeDirection: volumeDelta > 0 ? "up" : volumeDelta < 0 ? "down" : "stable",
    volumeMessage:
      volumeDelta > 0
        ? "El volumen reciente de reseñas aumentó frente al periodo anterior."
        : volumeDelta < 0
          ? "El volumen reciente de reseñas disminuyó frente al periodo anterior."
          : "El volumen reciente se mantiene estable frente al periodo anterior.",
  };
}

function shareOfHighRisk(reviews: ReviewWithPrediction[]) {
  if (reviews.length === 0) return 0;
  const highRisk = reviews.filter((review) => review.prediction!.riskLabel === RiskLabel.HIGH).length;
  return Math.round((highRisk / reviews.length) * 100);
}

function buildRiskMessage(delta: number) {
  if (delta > 3) {
    return `La proporción reciente de riesgo alto subió ${delta} puntos porcentuales. Conviene revisar causas y cuentas principales.`;
  }
  if (delta < -3) {
    return `La proporción reciente de riesgo alto bajó ${Math.abs(delta)} puntos porcentuales. Mantener monitoreo de recurrencia.`;
  }
  return "La proporción de riesgo alto se mantiene estable frente al periodo anterior.";
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
