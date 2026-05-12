import { cookies } from "next/headers";
import { Prisma, RiskLabel } from "@/generated/prisma";
import { AUTH_ROLE_COOKIE, isRoleName, type RoleName } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FollowUpsClient, type FollowUpRow, type FollowUpUser, type ReviewOption } from "./follow-ups-client";

export default async function FollowUpsPage() {
  const cookieStore = await cookies();
  const roleValue = cookieStore.get(AUTH_ROLE_COOKIE)?.value;
  const activeRole: RoleName = isRoleName(roleValue) ? roleValue : "CUSTOMER_SUCCESS";

  const [followUps, users, reviewOptions] = await Promise.all([
    prisma.followUp.findMany({
      include: {
        assignedTo: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        review: {
          select: {
            id: true,
            reviewDate: true,
            comment: true,
            category: true,
            subcategory: true,
            npsScore: true,
            prediction: {
              select: {
                riskLabel: true,
                probability: true,
                primaryCause: true,
                urgency: true,
                recommendation: true,
                detectedSignals: true,
              },
            },
          },
        },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 200,
    }),
    prisma.user.findMany({
      where: {
        isActive: true,
        role: { name: { in: ["CUSTOMER_SUCCESS", "ADMIN"] } },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.review.findMany({
      where: {
        prediction: {
          is: { riskLabel: { in: [RiskLabel.HIGH, RiskLabel.MEDIUM, RiskLabel.MANUAL_REVIEW] } },
        },
      },
      include: {
        client: { select: { id: true, name: true } },
        prediction: {
          select: {
            riskLabel: true,
            primaryCause: true,
            urgency: true,
          },
        },
      },
      orderBy: { reviewDate: "desc" },
      take: 150,
    }),
  ]);

  const rows: FollowUpRow[] = followUps.map((followUp) => ({
    id: followUp.id,
    clientId: followUp.clientId,
    clientName: followUp.client?.name ?? "Cliente no vinculado",
    reviewId: followUp.reviewId,
    reviewDate: followUp.review?.reviewDate.toISOString().slice(0, 10) ?? null,
    reviewComment: followUp.review?.comment ?? "Sin resena vinculada",
    reviewCategory: followUp.review?.category ?? null,
    reviewSubcategory: followUp.review?.subcategory ?? null,
    nps: followUp.review?.npsScore ?? null,
    risk: followUp.review?.prediction?.riskLabel ?? null,
    probability: followUp.review?.prediction?.probability ?? null,
    mainCause: followUp.review?.prediction?.primaryCause ?? null,
    urgency: followUp.review?.prediction?.urgency ?? null,
    recommendation: followUp.review?.prediction?.recommendation ?? null,
    criticalSignals: jsonArray(followUp.review?.prediction?.detectedSignals ?? null),
    assignedToId: followUp.assignedToId,
    assignedToName: followUp.assignedTo?.name ?? "Sin responsable",
    status: followUp.status,
    contactDate: followUp.contactDate?.toISOString().slice(0, 10) ?? null,
    actionTaken: followUp.actionTaken,
    escalatedArea: followUp.escalatedArea,
    contactResult: followUp.contactResult,
    note: followUp.note,
    closingNote: followUp.closingNote,
    closedAt: followUp.closedAt?.toISOString() ?? null,
    updatedAt: followUp.updatedAt.toISOString(),
  }));

  const reviewRows: ReviewOption[] = reviewOptions.map((review) => ({
    id: review.id,
    clientId: review.clientId,
    clientName: review.client.name,
    reviewDate: review.reviewDate.toISOString().slice(0, 10),
    risk: review.prediction?.riskLabel ?? "MANUAL_REVIEW",
    mainCause: review.prediction?.primaryCause ?? "Sin causa",
    urgency: review.prediction?.urgency ?? "Revisar",
  }));

  const ownerRows: FollowUpUser[] = users.map((user) => ({
    id: user.id,
    name: user.name,
  }));

  return (
    <FollowUpsClient
      activeRole={activeRole}
      followUps={rows}
      reviewOptions={reviewRows}
      users={ownerRows}
    />
  );
}

function jsonArray(value: Prisma.JsonValue | null): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}
