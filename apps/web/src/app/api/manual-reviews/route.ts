import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  ConfidenceLevel,
  Prisma,
  RiskLabel,
  RoleName as PrismaRoleName,
  SentimentLabel,
} from "@/generated/prisma";
import { canUseApiAction } from "@/lib/api-auth";
import { AUDIT_ACTIONS, logAuditEvent } from "@/lib/audit";
import { AUTH_NAME_COOKIE, AUTH_ROLE_COOKIE, isRoleName } from "@/lib/auth";
import { refreshClientRiskSnapshot } from "@/lib/client-risk-persistence";
import { prisma } from "@/lib/prisma";

type ManualReviewPayload = {
  client: string;
  date: string;
  comment: string;
  category: string;
  subcategory: string;
  product?: string;
  source?: string;
  original_classification: string;
  nps: number | null;
};

type PredictionResult = {
  risk: RiskLabel;
  probability: number;
  sentiment: SentimentLabel;
  main_cause: string;
  secondary_cause: string | null;
  confidence: ConfidenceLevel;
  urgency: string;
  recommendation: string;
  explanation: string;
  critical_signals: string[];
  detected_keywords?: string[];
  warnings: string[];
  activated_rules: string[];
  prediction_source: string;
};

const requiredFields: Array<keyof ManualReviewPayload> = [
  "client",
  "date",
  "comment",
  "category",
  "subcategory",
  "original_classification",
];

export async function POST(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth.roleName) {
    return NextResponse.json({ error: "Sesion no valida." }, { status: 401 });
  }
  if (!canUseApiAction(auth.roleName, "MANUAL_REVIEW_CREATE")) {
    return NextResponse.json(
      { error: "No tienes permisos para capturar reseñas manuales." },
      { status: 403 },
    );
  }

  try {
    const payload = normalizePayload(await request.json());
    const validationError = validatePayload(payload);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const prediction = await requestPrediction(payload);
    const saved = await persistManualReview(payload, prediction, auth);

    return NextResponse.json({
      reviewId: saved.reviewId,
      predictionId: saved.predictionId,
      prediction,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo procesar la resena.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function getAuthContext() {
  const cookieStore = await cookies();
  const roleValue = cookieStore.get(AUTH_ROLE_COOKIE)?.value;
  const userName = cookieStore.get(AUTH_NAME_COOKIE)?.value ?? null;

  if (!isRoleName(roleValue)) {
    return { roleName: null, userName, userId: null };
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

  return {
    roleName: roleValue,
    userName,
    userId: user?.id ?? null,
  };
}

function normalizePayload(input: unknown): ManualReviewPayload {
  const value = input as Partial<ManualReviewPayload>;
  const npsValue = value.nps;

  return {
    client: clean(value.client),
    date: clean(value.date),
    comment: clean(value.comment),
    category: clean(value.category),
    subcategory: clean(value.subcategory),
    product: optionalClean(value.product),
    source: optionalClean(value.source),
    original_classification: clean(value.original_classification),
    nps:
      npsValue === null || npsValue === undefined || String(npsValue).trim() === ""
        ? null
        : Number(npsValue),
  };
}

function validatePayload(payload: ManualReviewPayload): string | null {
  const missingField = requiredFields.find((field) => !String(payload[field] ?? "").trim());
  if (missingField) {
    return "Completa todos los campos obligatorios.";
  }

  if (Number.isNaN(new Date(payload.date).getTime())) {
    return "La fecha no es valida.";
  }

  if (payload.nps !== null && (!Number.isInteger(payload.nps) || payload.nps < 0 || payload.nps > 10)) {
    return "El NPS/calificacion debe estar entre 0 y 10.";
  }

  return null;
}

async function requestPrediction(payload: ManualReviewPayload): Promise<PredictionResult> {
  const mlApiUrl = getMlApiUrl();
  const response = await fetch(`${mlApiUrl.replace(/\/$/, "")}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`No se pudo obtener la prediccion del servicio ML. ${details}`);
  }

  return response.json() as Promise<PredictionResult>;
}

function getMlApiUrl(): string {
  const isComposeNetwork = process.env.DATABASE_URL?.includes("@db:");

  if (isComposeNetwork && process.env.ML_API_INTERNAL_URL) {
    return process.env.ML_API_INTERNAL_URL;
  }

  return process.env.NEXT_PUBLIC_ML_API_URL ?? "http://localhost:8000";
}

async function persistManualReview(
  payload: ManualReviewPayload,
  prediction: PredictionResult,
  auth: { roleName: PrismaRoleName; userName: string | null; userId: string | null },
) {
  const reviewDate = new Date(`${payload.date}T00:00:00.000Z`);
  const sourceRecordId = `MANUAL-${randomUUID()}`;

  const saved = await prisma.$transaction(async (tx) => {
    const client = await tx.client.upsert({
      where: { name: payload.client },
      update: {},
      create: {
        name: payload.client,
      },
    });

    const review = await tx.review.create({
      data: {
        clientId: client.id,
        createdById: auth.userId,
        sourceRecordId,
        reviewDate,
        year: reviewDate.getUTCFullYear(),
        month: getSpanishMonth(reviewDate),
        source: payload.source,
        comment: payload.comment,
        category: payload.category,
        subcategory: payload.subcategory,
        product: payload.product,
        originalClassification: payload.original_classification,
        npsScore: payload.nps,
        rawData: {
          entryMode: "manual",
          sourceRecordId,
          payload: {
            client: payload.client,
            date: payload.date,
            comment: payload.comment,
            category: payload.category,
            subcategory: payload.subcategory,
            product: payload.product ?? null,
            source: payload.source ?? null,
            original_classification: payload.original_classification,
            nps: payload.nps,
          },
        } as Prisma.InputJsonValue,
      },
    });

    const savedPrediction = await tx.prediction.create({
      data: {
        reviewId: review.id,
        riskLabel: prediction.risk,
        probability: prediction.probability,
        sentiment: prediction.sentiment,
        primaryCause: prediction.main_cause,
        secondaryCause: prediction.secondary_cause,
        confidence: prediction.confidence,
        urgency: prediction.urgency,
        recommendation: prediction.recommendation,
        explanation: prediction.explanation,
        detectedSignals: prediction.critical_signals,
        warnings: prediction.warnings,
        triggeredRules: prediction.activated_rules,
        modelVersion: prediction.prediction_source,
      },
    });

    await logAuditEvent(tx, {
        userId: auth.userId,
        roleName: auth.roleName,
        action: AUDIT_ACTIONS.PREDICTION_EXECUTION,
        entityType: "Review",
        entityId: review.id,
        newValues: {
          reviewId: review.id,
          predictionId: savedPrediction.id,
          risk: prediction.risk,
          confidence: prediction.confidence,
          predictionSource: prediction.prediction_source,
        },
        description: `Prediccion manual ejecutada para ${payload.client}.`,
    });

    await refreshClientRiskSnapshot(tx, client.id, new Date());

    return {
      reviewId: review.id,
      predictionId: savedPrediction.id,
    };
  });

  return saved;
}

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function optionalClean(value: unknown): string | undefined {
  const cleaned = clean(value);
  return cleaned || undefined;
}

function getSpanishMonth(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", { month: "long", timeZone: "UTC" }).format(date);
}
