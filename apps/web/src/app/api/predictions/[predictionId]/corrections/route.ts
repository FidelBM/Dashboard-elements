import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  Prisma,
  RiskLabel,
  RoleName as PrismaRoleName,
  SentimentLabel,
} from "@/generated/prisma";
import { canUseApiAction } from "@/lib/api-auth";
import { AUDIT_ACTIONS, logAuditEvent } from "@/lib/audit";
import { AUTH_NAME_COOKIE, AUTH_ROLE_COOKIE, isRoleName } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    predictionId: string;
  }>;
};

type CorrectionPayload = {
  mode: "suggestion" | "official";
  correctedRiskLabel: RiskLabel;
  correctedSentiment?: SentimentLabel | null;
  correctedPrimaryCause?: string | null;
  reason?: string | null;
};

type AuthContext = {
  roleName: PrismaRoleName;
  userId: string;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Sesion no valida." }, { status: 401 });
  }

  const { predictionId } = await context.params;
  const payload = normalizePayload(await request.json());
  const permissionError = validatePermission(auth.roleName, payload.mode);

  if (permissionError) {
    return NextResponse.json({ error: permissionError }, { status: 403 });
  }

  if (!isRiskLabel(payload.correctedRiskLabel)) {
    return NextResponse.json({ error: "Selecciona un riesgo corregido valido." }, { status: 400 });
  }

  if (payload.correctedSentiment && !isSentimentLabel(payload.correctedSentiment)) {
    return NextResponse.json({ error: "Selecciona un sentimiento corregido valido." }, { status: 400 });
  }

  const prediction = await prisma.prediction.findUnique({
    where: { id: predictionId },
    include: {
      review: {
        include: {
          client: true,
        },
      },
    },
  });

  if (!prediction) {
    return NextResponse.json({ error: "No se encontro la prediccion seleccionada." }, { status: 404 });
  }

  const correction = await prisma.$transaction(async (tx) => {
    const savedCorrection = await tx.humanCorrection.create({
      data: {
        predictionId: prediction.id,
        correctedById: auth.userId,
        originalRiskLabel: prediction.riskLabel,
        correctedRiskLabel: payload.correctedRiskLabel,
        originalSentiment: prediction.sentiment,
        correctedSentiment: payload.correctedSentiment,
        originalPrimaryCause: prediction.primaryCause,
        correctedPrimaryCause: payload.correctedPrimaryCause,
        reason: buildReason(payload),
      },
    });

    await logAuditEvent(tx, {
        userId: auth.userId,
        roleName: auth.roleName,
        action:
          payload.mode === "official"
            ? AUDIT_ACTIONS.HUMAN_CORRECTION
            : AUDIT_ACTIONS.CORRECTION_SUGGESTION,
        entityType: "Prediction",
        entityId: prediction.id,
        previousValues: {
          riskLabel: prediction.riskLabel,
          sentiment: prediction.sentiment,
          primaryCause: prediction.primaryCause,
        } as Prisma.InputJsonValue,
        newValues: {
          correctionId: savedCorrection.id,
          correctedRiskLabel: payload.correctedRiskLabel,
          correctedSentiment: payload.correctedSentiment,
          correctedPrimaryCause: payload.correctedPrimaryCause,
          mode: payload.mode,
        } as Prisma.InputJsonValue,
        description:
          payload.mode === "official"
            ? `Correccion oficial registrada para ${prediction.review.client.name}.`
            : `Sugerencia de correccion registrada para ${prediction.review.client.name}.`,
    });

    return savedCorrection;
  });

  return NextResponse.json({ correctionId: correction.id });
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
      role: {
        name: roleValue,
      },
    },
    select: { id: true },
  });

  if (!user) {
    return null;
  }

  return {
    roleName: roleValue,
    userId: user.id,
  };
}

function normalizePayload(input: unknown): CorrectionPayload {
  const value = input as Partial<CorrectionPayload>;
  return {
    mode: value.mode === "official" ? "official" : "suggestion",
    correctedRiskLabel: String(value.correctedRiskLabel ?? "") as RiskLabel,
    correctedSentiment: value.correctedSentiment
      ? (String(value.correctedSentiment) as SentimentLabel)
      : null,
    correctedPrimaryCause: cleanOptional(value.correctedPrimaryCause),
    reason: cleanOptional(value.reason),
  };
}

function validatePermission(roleName: PrismaRoleName, mode: "suggestion" | "official") {
  if (mode === "suggestion" && canUseApiAction(roleName, "CORRECTION_SUGGESTION")) {
    return null;
  }

  if (mode === "official" && canUseApiAction(roleName, "CORRECTION_OFFICIAL")) {
    return null;
  }

  return mode === "official"
    ? "Solo Analista/Calidad puede registrar correcciones oficiales."
    : "Solo Customer Success puede sugerir correcciones.";
}

function buildReason(payload: CorrectionPayload) {
  const prefix = payload.mode === "official" ? "OFICIAL" : "SUGERENCIA";
  return `${prefix}: ${payload.reason || "Sin motivo capturado"}`;
}

function cleanOptional(value: unknown) {
  const cleaned = String(value ?? "").trim();
  return cleaned || null;
}

function isRiskLabel(value: string): value is RiskLabel {
  return ["HIGH", "MEDIUM", "LOW", "MANUAL_REVIEW"].includes(value);
}

function isSentimentLabel(value: string): value is SentimentLabel {
  return ["POSITIVE", "NEUTRAL", "NEGATIVE"].includes(value);
}
