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

type UploadSummary = {
  is_valid: boolean;
  total_rows: number;
  valid_rows_count: number;
  invalid_rows_count: number;
  missing_required_columns: string[];
  missing_recommended_columns: string[];
};

type BatchReviewRecord = {
  row_number: number;
  source_record_id: string;
  client: string;
  review_date: string;
  year: number | null;
  quarter: string | null;
  month: string | null;
  source: string | null;
  comment: string;
  original_sentiment: string | null;
  category: string;
  subcategory: string;
  product: string | null;
  detail: string | null;
  original_classification: string;
  nps_score: number | null;
  raw_data: Record<string, string>;
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

type BatchPredictionItem = {
  row_number: number;
  source_record_id: string;
  review: BatchReviewRecord;
  prediction: PredictionResult;
};

type UploadErrorReportItem = {
  row_number: number;
  source_record_id: string | null;
  reason: string;
  raw_data?: Record<string, string>;
};

type BatchPredictResponse = {
  upload_summary: UploadSummary;
  warnings: string[];
  predictions: BatchPredictionItem[];
  error_report: UploadErrorReportItem[];
};

type AuthContext = {
  roleName: PrismaRoleName;
  userName: string | null;
  userId: string | null;
};

export async function POST(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth.roleName) {
    return NextResponse.json({ error: "Sesion no valida." }, { status: 401 });
  }
  if (!canUseApiAction(auth.roleName, "FILE_UPLOAD_PROCESS")) {
    return NextResponse.json(
      { error: "No tienes permisos para cargar reseñas." },
      { status: 403 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Selecciona un archivo CSV o Excel." }, { status: 400 });
    }

    const batchResult = await requestBatchPrediction(file);
    const saved = await persistUpload(file, batchResult, auth);

    return NextResponse.json({
      fileUploadId: saved.fileUploadId,
      savedReviews: saved.savedReviews,
      savedPredictions: saved.savedPredictions,
      savedErrors: saved.savedErrors,
      ...batchResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo procesar el archivo.";
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

async function requestBatchPrediction(file: File): Promise<BatchPredictResponse> {
  const mlFormData = new FormData();
  mlFormData.append("file", file, file.name);

  const response = await fetch(`${getMlApiUrl().replace(/\/$/, "")}/batch-predict`, {
    method: "POST",
    body: mlFormData,
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`No se pudo validar o procesar el archivo. ${details}`);
  }

  return response.json() as Promise<BatchPredictResponse>;
}

async function persistUpload(
  file: File,
  batchResult: BatchPredictResponse,
  auth: AuthContext,
) {
  return prisma.$transaction(async (tx) => {
    const upload = await tx.fileUpload.create({
      data: {
        originalFileName: file.name,
        mimeType: file.type || null,
        status: getUploadStatus(batchResult),
        totalRows: batchResult.upload_summary.total_rows,
        validRows: batchResult.upload_summary.valid_rows_count,
        invalidRows: batchResult.upload_summary.invalid_rows_count,
        warnings: {
          warnings: batchResult.warnings,
          missingRequiredColumns: batchResult.upload_summary.missing_required_columns,
          missingRecommendedColumns: batchResult.upload_summary.missing_recommended_columns,
        } as Prisma.InputJsonValue,
        uploadedById: auth.userId,
      },
    });

    await logAuditEvent(tx, {
      userId: auth.userId,
      roleName: auth.roleName,
      action: AUDIT_ACTIONS.FILE_UPLOAD,
      entityType: "FileUpload",
      entityId: upload.id,
      description: `Carga recibida: ${file.name}.`,
      newValues: {
        fileUploadId: upload.id,
        fileName: file.name,
        mimeType: file.type || null,
      },
    });

    await logAuditEvent(tx, {
      userId: auth.userId,
      roleName: auth.roleName,
      action: AUDIT_ACTIONS.FILE_VALIDATION,
      entityType: "FileUpload",
      entityId: upload.id,
      description: "Validacion de columnas y filas completada.",
      newValues: batchResult.upload_summary,
    });

    let savedReviews = 0;
    let savedPredictions = 0;
    const affectedClientIds = new Set<string>();

    if (batchResult.upload_summary.missing_required_columns.length === 0) {
      for (const item of batchResult.predictions) {
        const client = await tx.client.upsert({
          where: { name: item.review.client },
          update: {},
          create: {
            name: item.review.client,
          },
        });
        affectedClientIds.add(client.id);

        const review = await tx.review.create({
          data: {
            clientId: client.id,
            fileUploadId: upload.id,
            createdById: auth.userId,
            sourceRecordId: `${upload.id}:${item.review.source_record_id}`,
            reviewDate: new Date(`${item.review.review_date}T00:00:00.000Z`),
            year: item.review.year,
            quarter: item.review.quarter,
            month: item.review.month,
            source: item.review.source,
            comment: item.review.comment,
            originalSentiment: item.review.original_sentiment,
            category: item.review.category,
            subcategory: item.review.subcategory,
            product: item.review.product,
            detail: item.review.detail,
            originalClassification: item.review.original_classification,
            npsScore: item.review.nps_score,
            rawData: {
              rowNumber: item.row_number,
              sourceRecordId: item.review.source_record_id,
              originalFileName: file.name,
              rawData: item.review.raw_data,
            } as Prisma.InputJsonValue,
          },
        });
        savedReviews += 1;

        await tx.prediction.create({
          data: {
            reviewId: review.id,
            riskLabel: item.prediction.risk,
            probability: item.prediction.probability,
            sentiment: item.prediction.sentiment,
            primaryCause: item.prediction.main_cause,
            secondaryCause: item.prediction.secondary_cause,
            confidence: item.prediction.confidence,
            urgency: item.prediction.urgency,
            recommendation: item.prediction.recommendation,
            explanation: item.prediction.explanation,
            detectedSignals: item.prediction.critical_signals,
            warnings: item.prediction.warnings,
            triggeredRules: item.prediction.activated_rules,
            modelVersion: item.prediction.prediction_source,
          },
        });
        savedPredictions += 1;
      }
    }

    const uploadErrors = await Promise.all(
      batchResult.error_report.map((error) =>
        tx.uploadError.create({
          data: {
            fileUploadId: upload.id,
            rowNumber: error.row_number,
            sourceRecordId: error.source_record_id,
            reason: error.reason,
            rawData: (error.raw_data ?? {}) as Prisma.InputJsonValue,
          },
        }),
      ),
    );

    if (savedPredictions > 0) {
      await logAuditEvent(tx, {
        userId: auth.userId,
        roleName: auth.roleName,
        action: AUDIT_ACTIONS.PREDICTION_EXECUTION,
        entityType: "FileUpload",
        entityId: upload.id,
        description: `${savedPredictions} predicciones ejecutadas para la carga.`,
        newValues: {
          fileUploadId: upload.id,
          predictions: savedPredictions,
        },
      });
    }

    if (uploadErrors.length > 0 || batchResult.upload_summary.missing_required_columns.length > 0) {
      await logAuditEvent(tx, {
        userId: auth.userId,
        roleName: auth.roleName,
        action: AUDIT_ACTIONS.UPLOAD_ERRORS,
        entityType: "FileUpload",
        entityId: upload.id,
        description: "Errores de carga registrados para revision.",
        newValues: {
          fileUploadId: upload.id,
          uploadErrors: uploadErrors.length,
          missingRequiredColumns: batchResult.upload_summary.missing_required_columns,
        },
      });
    }

    for (const clientId of affectedClientIds) {
      await refreshClientRiskSnapshot(tx, clientId, new Date());
    }

    return {
      fileUploadId: upload.id,
      savedReviews,
      savedPredictions,
      savedErrors: uploadErrors.length,
    };
  });
}

function getMlApiUrl(): string {
  const isComposeNetwork = process.env.DATABASE_URL?.includes("@db:");

  if (isComposeNetwork && process.env.ML_API_INTERNAL_URL) {
    return process.env.ML_API_INTERNAL_URL;
  }

  return process.env.NEXT_PUBLIC_ML_API_URL ?? "http://localhost:8000";
}

function getUploadStatus(batchResult: BatchPredictResponse): string {
  if (batchResult.upload_summary.missing_required_columns.length > 0) {
    return "REJECTED_MISSING_REQUIRED_COLUMNS";
  }

  if (batchResult.upload_summary.invalid_rows_count > 0) {
    return "PROCESSED_WITH_ERRORS";
  }

  if (batchResult.upload_summary.missing_recommended_columns.length > 0) {
    return "PROCESSED_WITH_WARNINGS";
  }

  return "PROCESSED";
}
