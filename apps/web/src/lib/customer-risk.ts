export type ReviewRiskLabel = "HIGH" | "MEDIUM" | "LOW" | "MANUAL_REVIEW";
export type AccumulatedClientRiskStatus = "CRITICAL" | "WATCHLIST" | "STABLE" | "MANUAL_REVIEW";

export type CustomerRiskReview = {
  reviewDate: Date | string;
  riskLabel: ReviewRiskLabel;
  npsScore?: number | null;
  primaryCause?: string | null;
  detectedSignals?: unknown;
};

export type AccumulatedCustomerRisk = {
  totalScore: number;
  status: AccumulatedClientRiskStatus;
  reviewsConsidered: number;
  mainAccumulatedCauses: string[];
  detectedCriticalSignals: string[];
  recommendation: string;
};

const windowDays = 90;

export function calculateAccumulatedCustomerRisk(
  reviews: CustomerRiskReview[],
  referenceDate = new Date(),
): AccumulatedCustomerRisk {
  const windowStart = new Date(referenceDate);
  windowStart.setUTCDate(windowStart.getUTCDate() - windowDays);

  const recentReviews = reviews.filter((review) => {
    const reviewDate = toDate(review.reviewDate);
    return reviewDate >= windowStart && reviewDate <= referenceDate;
  });

  if (recentReviews.length === 0) {
    return {
      totalScore: 0,
      status: "MANUAL_REVIEW",
      reviewsConsidered: 0,
      mainAccumulatedCauses: [],
      detectedCriticalSignals: [],
      recommendation:
        "Revisar manualmente la cuenta porque no hay reseñas recientes suficientes para estimar riesgo acumulado.",
    };
  }

  const causeCounts = new Map<string, number>();
  const criticalSignals = new Set<string>();
  let totalScore = 0;

  for (const review of recentReviews) {
    totalScore += scoreRisk(review.riskLabel);

    const signals = normalizeSignals(review.detectedSignals);
    for (const signal of signals) {
      criticalSignals.add(signal);
      totalScore += 3;
    }

    if (typeof review.npsScore === "number") {
      if (review.npsScore >= 0 && review.npsScore <= 4) {
        totalScore += 2;
      } else if (review.npsScore >= 5 && review.npsScore <= 6) {
        totalScore += 1;
      }
    }

    if (review.primaryCause) {
      causeCounts.set(review.primaryCause, (causeCounts.get(review.primaryCause) ?? 0) + 1);
    }
  }

  const status = hasContradictoryData(recentReviews, criticalSignals)
    ? "MANUAL_REVIEW"
    : statusFromScore(totalScore);

  const mainAccumulatedCauses = [...causeCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([cause]) => cause);

  const detectedCriticalSignals = [...criticalSignals].sort();

  return {
    totalScore,
    status,
    reviewsConsidered: recentReviews.length,
    mainAccumulatedCauses,
    detectedCriticalSignals,
    recommendation: recommendationForStatus(status, mainAccumulatedCauses, detectedCriticalSignals),
  };
}

function scoreRisk(riskLabel: ReviewRiskLabel) {
  if (riskLabel === "HIGH") return 5;
  if (riskLabel === "MEDIUM") return 3;
  if (riskLabel === "MANUAL_REVIEW") return 2;
  return 0;
}

function statusFromScore(totalScore: number): AccumulatedClientRiskStatus {
  if (totalScore >= 10) return "CRITICAL";
  if (totalScore >= 5) return "WATCHLIST";
  return "STABLE";
}

function hasContradictoryData(reviews: CustomerRiskReview[], criticalSignals: Set<string>) {
  const allLowRisk = reviews.every((review) => review.riskLabel === "LOW");
  const hasHighRiskWithHighNpsWithoutSignals = reviews.some(
    (review) =>
      review.riskLabel === "HIGH" &&
      typeof review.npsScore === "number" &&
      review.npsScore >= 9 &&
      normalizeSignals(review.detectedSignals).length === 0,
  );

  return (allLowRisk && criticalSignals.size > 0) || hasHighRiskWithHighNpsWithoutSignals;
}

function recommendationForStatus(
  status: AccumulatedClientRiskStatus,
  causes: string[],
  signals: string[],
) {
  const causeText = causes.length > 0 ? causes.join(", ") : "sin causa dominante";
  const signalText = signals.length > 0 ? ` Señales críticas: ${signals.join(", ")}.` : "";

  if (status === "CRITICAL") {
    return `Contactar a la cuenta en menos de 24 horas, asignar responsable y revisar causa raíz: ${causeText}.${signalText}`;
  }

  if (status === "WATCHLIST") {
    return `Dar seguimiento durante la semana y monitorear reincidencia por: ${causeText}.${signalText}`;
  }

  if (status === "MANUAL_REVIEW") {
    return `Revisar manualmente la cuenta antes de decidir acciones porque hay datos insuficientes o contradictorios.${signalText}`;
  }

  return `Mantener monitoreo regular de la cuenta; no se observan señales acumuladas críticas recientes.`;
}

function normalizeSignals(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}
