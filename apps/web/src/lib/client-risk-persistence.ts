import { ClientRiskStatus, Prisma } from "@/generated/prisma";
import {
  calculateAccumulatedCustomerRisk,
} from "@/lib/customer-risk";

export async function refreshClientRiskSnapshot(
  db: Prisma.TransactionClient,
  clientId: string,
  referenceDate = new Date(),
) {
  const windowStart = new Date(referenceDate);
  windowStart.setUTCDate(windowStart.getUTCDate() - 90);

  const reviews = await db.review.findMany({
    where: {
      clientId,
      reviewDate: { gte: windowStart, lte: referenceDate },
      prediction: { isNot: null },
    },
    include: { prediction: true },
  });

  const risk = calculateAccumulatedCustomerRisk(
    reviews
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

  await db.client.update({
    where: { id: clientId },
    data: {
      riskStatus: risk.status as ClientRiskStatus,
      accumulatedRiskScore: risk.totalScore,
    },
  });

  return risk;
}
