import { Prisma, RiskLabel } from "@/generated/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_ROLE_COOKIE, isRoleName } from "@/lib/auth";
import { calculateAccumulatedCustomerRisk } from "@/lib/customer-risk";
import { prisma } from "@/lib/prisma";
import { CustomerSuccessDashboardClient, type DashboardReviewRow } from "./customer-success-dashboard-client";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const roleValue = cookieStore.get(AUTH_ROLE_COOKIE)?.value;
  const activeRole = isRoleName(roleValue) ? roleValue : "CUSTOMER_SUCCESS";
  if (activeRole === "ANALYST_QUALITY") {
    redirect("/model-quality");
  }
  if (activeRole === "COMMERCIAL_DIRECTION") {
    redirect("/reports");
  }

  const params = await searchParams;
  const filters = normalizeFilters(params ?? {});
  const referenceDate = new Date();
  const windowStart = new Date(referenceDate);
  windowStart.setUTCDate(windowStart.getUTCDate() - 90);

  const [clients, reviews, filterOptions] = await Promise.all([
    prisma.client.findMany({
      include: {
        reviews: {
          where: {
            reviewDate: { gte: windowStart, lte: referenceDate },
            prediction: { isNot: null },
          },
          include: { prediction: true },
          orderBy: { reviewDate: "desc" },
        },
      },
    }),
    prisma.review.findMany({
      where: buildReviewWhere(filters),
      include: {
        client: true,
        prediction: true,
        followUps: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ prediction: { riskLabel: "asc" } }, { reviewDate: "desc" }],
      take: 120,
    }),
    getFilterOptions(),
  ]);

  const criticalClients = clients
    .map((client) => {
      const risk = calculateAccumulatedCustomerRisk(
        client.reviews
          .filter((review) => review.prediction)
          .map((review) => ({
            reviewDate: review.reviewDate,
            riskLabel: review.prediction!.riskLabel,
            npsScore: review.npsScore,
            primaryCause: review.prediction!.primaryCause,
            detectedSignals: review.prediction!.detectedSignals,
          })),
        referenceDate,
      );

      return {
        id: client.id,
        name: client.name,
        score: risk.totalScore,
        status: risk.status,
        reviewsConsidered: risk.reviewsConsidered,
        mainCauses: risk.mainAccumulatedCauses,
        recommendation: risk.recommendation,
      };
    })
    .filter((client) => client.status === "CRITICAL")
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 8);

  const reviewRows: DashboardReviewRow[] = reviews
    .filter((review) => review.prediction)
    .map((review) => ({
      id: review.id,
      clientId: review.clientId,
      client: review.client.name,
      date: review.reviewDate.toISOString().slice(0, 10),
      category: review.category,
      subcategory: review.subcategory,
      product: review.product,
      source: review.source,
      comment: review.comment,
      nps: review.npsScore,
      originalClassification: review.originalClassification,
      followUpStatus: review.followUps[0]?.status ?? null,
      followUpId: review.followUps[0]?.id ?? null,
      prediction: {
        risk: review.prediction!.riskLabel,
        probability: review.prediction!.probability,
        mainCause: review.prediction!.primaryCause,
        urgency: review.prediction!.urgency,
        recommendation: review.prediction!.recommendation,
        explanation: review.prediction!.explanation,
        confidence: review.prediction!.confidence,
        criticalSignals: jsonArray(review.prediction!.detectedSignals),
        warnings: jsonArray(review.prediction!.warnings),
      },
    }))
    .sort((a, b) => riskPriority(a.prediction.risk) - riskPriority(b.prediction.risk));

  return (
    <CustomerSuccessDashboardClient
      criticalClients={criticalClients}
      filterOptions={filterOptions}
      filters={filters}
      reviews={reviewRows}
    />
  );
}

function normalizeFilters(params: Record<string, string | string[] | undefined>) {
  return {
    dateFrom: getParam(params.dateFrom),
    dateTo: getParam(params.dateTo),
    client: getParam(params.client),
    risk: getParam(params.risk),
    cause: getParam(params.cause),
    category: getParam(params.category),
    subcategory: getParam(params.subcategory),
    product: getParam(params.product),
    source: getParam(params.source),
  };
}

function buildReviewWhere(filters: ReturnType<typeof normalizeFilters>): Prisma.ReviewWhereInput {
  const predictionFilter: Prisma.PredictionWhereInput = {
    riskLabel: isRiskLabel(filters.risk) ? filters.risk : { in: [RiskLabel.HIGH, RiskLabel.MEDIUM] },
  };

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

  if (filters.client) where.client = { name: { contains: filters.client, mode: "insensitive" } };
  if (filters.category) where.category = { contains: filters.category, mode: "insensitive" };
  if (filters.subcategory) where.subcategory = { contains: filters.subcategory, mode: "insensitive" };
  if (filters.product) where.product = { contains: filters.product, mode: "insensitive" };
  if (filters.source) where.source = { contains: filters.source, mode: "insensitive" };

  return where;
}

async function getFilterOptions() {
  const [causes, categories, subcategories, products, sources] = await Promise.all([
    prisma.prediction.findMany({
      distinct: ["primaryCause"],
      orderBy: { primaryCause: "asc" },
      select: { primaryCause: true },
    }),
    prisma.review.findMany({ distinct: ["category"], orderBy: { category: "asc" }, select: { category: true } }),
    prisma.review.findMany({
      distinct: ["subcategory"],
      orderBy: { subcategory: "asc" },
      select: { subcategory: true },
    }),
    prisma.review.findMany({
      distinct: ["product"],
      where: { product: { not: null } },
      orderBy: { product: "asc" },
      select: { product: true },
    }),
    prisma.review.findMany({
      distinct: ["source"],
      where: { source: { not: null } },
      orderBy: { source: "asc" },
      select: { source: true },
    }),
  ]);

  return {
    causes: causes.map((item) => item.primaryCause),
    categories: categories.map((item) => item.category),
    subcategories: subcategories.map((item) => item.subcategory),
    products: products.map((item) => item.product).filter(Boolean) as string[],
    sources: sources.map((item) => item.source).filter(Boolean) as string[],
  };
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function isRiskLabel(value: string): value is RiskLabel {
  return [RiskLabel.HIGH, RiskLabel.MEDIUM, RiskLabel.LOW, RiskLabel.MANUAL_REVIEW].includes(
    value as RiskLabel,
  );
}

function riskPriority(risk: RiskLabel) {
  if (risk === RiskLabel.HIGH) return 0;
  if (risk === RiskLabel.MEDIUM) return 1;
  if (risk === RiskLabel.MANUAL_REVIEW) return 2;
  return 3;
}

function jsonArray(value: Prisma.JsonValue | null): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}
