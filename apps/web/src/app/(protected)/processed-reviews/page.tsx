import { cookies } from "next/headers";
import { Prisma, RiskLabel } from "@/generated/prisma";
import { AUTH_ROLE_COOKIE, isRoleName } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProcessedReviewsClient, type ProcessedReviewRow } from "./processed-reviews-client";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProcessedReviewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const roleValue = cookieStore.get(AUTH_ROLE_COOKIE)?.value;
  const activeRole = isRoleName(roleValue) ? roleValue : "CUSTOMER_SUCCESS";
  const filters = normalizeFilters(params ?? {});

  const reviews = await prisma.review.findMany({
    where: buildWhere(filters),
    include: {
      client: true,
      prediction: {
        include: {
          humanCorrections: {
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
              correctedBy: {
                include: {
                  role: true,
                },
              },
            },
          },
        },
      },
      followUps: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      fileUpload: {
        select: {
          id: true,
          originalFileName: true,
        },
      },
    },
    orderBy: { reviewDate: "desc" },
    take: 200,
  });

  const filterOptions = await getFilterOptions();
  const rows: ProcessedReviewRow[] = reviews
    .filter((review) => review.prediction)
    .map((review) => {
      const prediction = review.prediction!;
      return {
        id: review.id,
        client: review.client.name,
        date: review.reviewDate.toISOString().slice(0, 10),
        category: review.category,
        subcategory: review.subcategory,
        product: review.product,
        source: review.source,
        comment: review.comment,
        originalClassification: review.originalClassification,
        nps: review.npsScore,
        sourceRecordId: review.sourceRecordId,
        fileUploadName: review.fileUpload?.originalFileName ?? null,
        followUpStatus: review.followUps[0]?.status ?? null,
        prediction: {
          id: prediction.id,
          risk: prediction.riskLabel,
          probability: prediction.probability,
          sentiment: prediction.sentiment,
          mainCause: prediction.primaryCause,
          secondaryCause: prediction.secondaryCause,
          confidence: prediction.confidence,
          urgency: prediction.urgency,
          recommendation: prediction.recommendation,
          explanation: prediction.explanation,
          criticalSignals: jsonArray(prediction.detectedSignals),
          warnings: jsonArray(prediction.warnings),
          triggeredRules: jsonArray(prediction.triggeredRules),
          modelVersion: prediction.modelVersion,
          createdAt: prediction.createdAt.toISOString(),
        },
        corrections: prediction.humanCorrections.map((correction) => ({
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
          createdAt: correction.createdAt.toISOString(),
        })),
      };
    });

  return (
    <ProcessedReviewsClient
      activeRole={activeRole}
      filters={filters}
      filterOptions={filterOptions}
      rows={rows}
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

function buildWhere(filters: ReturnType<typeof normalizeFilters>): Prisma.ReviewWhereInput {
  const where: Prisma.ReviewWhereInput = {
    prediction: {
      isNot: null,
    },
  };

  if (filters.dateFrom || filters.dateTo) {
    where.reviewDate = {};
    if (filters.dateFrom) where.reviewDate.gte = new Date(`${filters.dateFrom}T00:00:00.000Z`);
    if (filters.dateTo) where.reviewDate.lte = new Date(`${filters.dateTo}T23:59:59.999Z`);
  }

  if (filters.client) {
    where.client = { name: { contains: filters.client, mode: "insensitive" } };
  }

  if (isRiskLabel(filters.risk)) {
    where.prediction = { is: { riskLabel: filters.risk } };
  }

  if (filters.cause) {
    where.prediction = {
      is: {
        ...(isRiskLabel(filters.risk) ? { riskLabel: filters.risk } : {}),
        primaryCause: { contains: filters.cause, mode: "insensitive" },
      },
    };
  }

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
    prisma.review.findMany({
      distinct: ["category"],
      orderBy: { category: "asc" },
      select: { category: true },
    }),
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
  return ["HIGH", "MEDIUM", "LOW", "MANUAL_REVIEW"].includes(value);
}

function jsonArray(value: Prisma.JsonValue | null): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}
