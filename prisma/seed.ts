import {
  ClientRiskStatus,
  ConfidenceLevel,
  FollowUpStatus,
  PrismaClient,
  RiskLabel,
  RoleName,
  SentimentLabel,
} from "../apps/web/src/generated/prisma";

const prisma = new PrismaClient();

const demoPasswordHash = "demo-password-hash-not-for-production";

async function main() {
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: RoleName.CUSTOMER_SUCCESS },
      update: {},
      create: {
        name: RoleName.CUSTOMER_SUCCESS,
        description: "Customer Success y gerentes de cuenta.",
      },
    }),
    prisma.role.upsert({
      where: { name: RoleName.ANALYST_QUALITY },
      update: {},
      create: {
        name: RoleName.ANALYST_QUALITY,
        description: "Analista de datos, Calidad y Experiencia del Cliente.",
      },
    }),
    prisma.role.upsert({
      where: { name: RoleName.COMMERCIAL_DIRECTION },
      update: {},
      create: {
        name: RoleName.COMMERCIAL_DIRECTION,
        description: "Direccion Comercial con acceso consultivo.",
      },
    }),
    prisma.role.upsert({
      where: { name: RoleName.ADMIN },
      update: {},
      create: {
        name: RoleName.ADMIN,
        description: "Administracion de usuarios, permisos y configuracion.",
      },
    }),
  ]);

  const roleByName = new Map(roles.map((role) => [role.name, role]));

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Demo Admin",
      passwordHash: demoPasswordHash,
      roleId: roleByName.get(RoleName.ADMIN)!.id,
    },
  });

  const customerSuccess = await prisma.user.upsert({
    where: { email: "customer.success@example.com" },
    update: {},
    create: {
      email: "customer.success@example.com",
      name: "Demo Customer Success",
      passwordHash: demoPasswordHash,
      roleId: roleByName.get(RoleName.CUSTOMER_SUCCESS)!.id,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analyst.quality@example.com" },
    update: {},
    create: {
      email: "analyst.quality@example.com",
      name: "Demo Analyst Quality",
      passwordHash: demoPasswordHash,
      roleId: roleByName.get(RoleName.ANALYST_QUALITY)!.id,
    },
  });

  const commercial = await prisma.user.upsert({
    where: { email: "commercial.direction@example.com" },
    update: {},
    create: {
      email: "commercial.direction@example.com",
      name: "Demo Dirección Comercial",
      passwordHash: demoPasswordHash,
      roleId: roleByName.get(RoleName.COMMERCIAL_DIRECTION)!.id,
    },
  });

  const clientA = await prisma.client.upsert({
    where: { name: "Cliente Demo Norte" },
    update: {},
    create: {
      name: "Cliente Demo Norte",
      externalRef: "CLIENT-DEMO-001",
      riskStatus: ClientRiskStatus.CRITICAL,
      accumulatedRiskScore: 11,
    },
  });

  const clientB = await prisma.client.upsert({
    where: { name: "Cliente Demo Bajio" },
    update: {},
    create: {
      name: "Cliente Demo Bajio",
      externalRef: "CLIENT-DEMO-002",
      riskStatus: ClientRiskStatus.WATCHLIST,
      accumulatedRiskScore: 6,
    },
  });

  const clientC = await prisma.client.upsert({
    where: { name: "Cliente Demo Pacifico" },
    update: {},
    create: {
      name: "Cliente Demo Pacifico",
      externalRef: "CLIENT-DEMO-003",
      riskStatus: ClientRiskStatus.STABLE,
      accumulatedRiskScore: 1,
    },
  });

  const reviewA = await createDemoReviewWithPrediction({
    clientId: clientA.id,
    createdById: customerSuccess.id,
    sourceRecordId: "DEMO-REV-001",
    reviewDate: new Date("2026-04-12T12:00:00.000Z"),
    comment:
      "Nadie responde y los embarques siguen llegando tarde. Estamos evaluando cancelar el servicio.",
    category: "Operación",
    subcategory: "Retrasos",
    originalClassification: "Alta intención de abandono",
    npsScore: 2,
    riskLabel: RiskLabel.HIGH,
    probability: 0.91,
    sentiment: SentimentLabel.NEGATIVE,
    primaryCause: "Retrasos o incumplimiento de tiempos",
    secondaryCause: "Mala atención o falta de seguimiento",
    confidence: ConfidenceLevel.HIGH,
    urgency: "Atender hoy",
    recommendation:
      "Accion principal: contactar a la cuenta de inmediato. Urgencia: Atender hoy. Area responsable: Customer Success con apoyo de Operaciones/Calidad. Motivo: retrasos y posible cancelación. Siguiente paso: abrir seguimiento prioritario y documentar plan de atención.",
    explanation:
      "El comentario menciona falta de respuesta, retrasos y posible cancelación con NPS bajo.",
    detectedSignals: ["nadie responde", "tarde", "cancelar"],
    triggeredRules: ["critical_signal", "nps_0_4"],
  });

  const reviewB = await createDemoReviewWithPrediction({
    clientId: clientB.id,
    createdById: analyst.id,
    sourceRecordId: "DEMO-REV-002",
    reviewDate: new Date("2026-04-20T12:00:00.000Z"),
    comment:
      "El servicio ha mejorado, pero todavía necesitamos seguimiento más claro sobre incidencias.",
    category: "Servicio",
    subcategory: "Seguimiento",
    originalClassification: "Experiencia intermedia",
    npsScore: 6,
    riskLabel: RiskLabel.MEDIUM,
    probability: 0.64,
    sentiment: SentimentLabel.NEUTRAL,
    primaryCause: "Mala atencion o falta de seguimiento",
    secondaryCause: "Problemas de comunicación",
    confidence: ConfidenceLevel.MEDIUM,
    urgency: "Atender esta semana",
    recommendation:
      "Accion principal: programar seguimiento con el cliente. Urgencia: Atender esta semana. Area responsable: Customer Success. Motivo: falta de seguimiento y comunicación parcial. Siguiente paso: confirmar expectativas y monitorear reincidencia.",
    explanation:
      "La reseña indica mejora parcial, pero mantiene fricción por seguimiento e incidencias.",
    detectedSignals: ["seguimiento", "incidencias"],
    triggeredRules: ["nps_5_6"],
  });

  const reviewC = await createDemoReviewWithPrediction({
    clientId: clientC.id,
    createdById: admin.id,
    sourceRecordId: "DEMO-REV-003",
    reviewDate: new Date("2026-04-25T12:00:00.000Z"),
    comment: "La entrega fue puntual y el equipo mantuvo buena comunicacion durante el proceso.",
    category: "Servicio",
    subcategory: "Entrega",
    originalClassification: "Retención probable",
    npsScore: 9,
    riskLabel: RiskLabel.LOW,
    probability: 0.12,
    sentiment: SentimentLabel.POSITIVE,
    primaryCause: "Comentario positivo o sin riesgo relevante",
    confidence: ConfidenceLevel.HIGH,
    urgency: "Monitorear",
    recommendation:
      "Accion principal: registrar el comentario. Urgencia: Monitorear. Area responsable: Customer Success. Motivo: comentario positivo con NPS alto. Siguiente paso: mantener monitoreo regular de la cuenta.",
    explanation:
      "El comentario es positivo, menciona puntualidad y buena comunicación con NPS alto.",
    detectedSignals: ["puntual", "buena comunicacion"],
    triggeredRules: ["positive_signal"],
  });

  await createDemoFollowUp({
    clientId: clientA.id,
    reviewId: reviewA.id,
    assignedToId: customerSuccess.id,
    createdById: customerSuccess.id,
  });

  if (reviewB.prediction) {
    await createDemoCorrection({
      predictionId: reviewB.prediction.id,
      correctedById: analyst.id,
      originalRiskLabel: reviewB.prediction.riskLabel,
    });
  }

  if (reviewC.prediction) {
    await createDemoRecommendationFeedback({
      predictionId: reviewC.prediction.id,
      userId: customerSuccess.id,
    });
  }

  await createDemoUploadWithError(admin.id);
  await createDemoAuditLogs({
    adminId: admin.id,
    customerSuccessId: customerSuccess.id,
    analystId: analyst.id,
    commercialId: commercial.id,
    reviewId: reviewA.id,
    predictionId: reviewA.prediction?.id ?? null,
  });
}

async function createDemoReviewWithPrediction(input: {
  clientId: string;
  createdById: string;
  sourceRecordId: string;
  reviewDate: Date;
  comment: string;
  category: string;
  subcategory: string;
  originalClassification: string;
  npsScore: number;
  riskLabel: RiskLabel;
  probability: number;
  sentiment: SentimentLabel;
  primaryCause: string;
  secondaryCause?: string;
  confidence: ConfidenceLevel;
  urgency: string;
  recommendation: string;
  explanation: string;
  detectedSignals: string[];
  triggeredRules: string[];
}) {
  return prisma.review.upsert({
    where: {
      sourceRecordId: input.sourceRecordId,
    },
    update: {},
    create: {
      clientId: input.clientId,
      createdById: input.createdById,
      sourceRecordId: input.sourceRecordId,
      reviewDate: input.reviewDate,
      year: input.reviewDate.getUTCFullYear(),
      quarter: "Q2",
      month: "Abril",
      source: "Demo",
      comment: input.comment,
      category: input.category,
      subcategory: input.subcategory,
      originalClassification: input.originalClassification,
      npsScore: input.npsScore,
      rawData: {
        sourceRecordId: input.sourceRecordId,
        demo: true,
      },
      prediction: {
        create: {
          riskLabel: input.riskLabel,
          probability: input.probability,
          sentiment: input.sentiment,
          primaryCause: input.primaryCause,
          secondaryCause: input.secondaryCause,
          confidence: input.confidence,
          urgency: input.urgency,
          recommendation: input.recommendation,
          explanation: input.explanation,
          detectedSignals: input.detectedSignals,
          triggeredRules: input.triggeredRules,
          modelVersion: "demo-seed-v1",
        },
      },
    },
    include: {
      prediction: true,
    },
  });
}

async function createDemoFollowUp(input: {
  clientId: string;
  reviewId: string;
  assignedToId: string;
  createdById: string;
}) {
  const existing = await prisma.followUp.findFirst({
    where: { reviewId: input.reviewId },
  });

  if (existing) return;

  await prisma.followUp.create({
    data: {
      clientId: input.clientId,
      reviewId: input.reviewId,
      assignedToId: input.assignedToId,
      createdById: input.createdById,
      status: FollowUpStatus.IN_PROGRESS,
      contactDate: new Date("2026-04-13T12:00:00.000Z"),
      actionTaken: "Contacto inicial con la cuenta y revisión del caso con Operaciones.",
      escalatedArea: "Operaciones",
      contactResult: "Cliente solicita plan de atención y fecha de siguiente actualización.",
      note: "Demo: seguimiento abierto para mostrar el flujo de Customer Success.",
    },
  });
}

async function createDemoCorrection(input: {
  predictionId: string;
  correctedById: string;
  originalRiskLabel: RiskLabel;
}) {
  const existing = await prisma.humanCorrection.findFirst({
    where: { predictionId: input.predictionId },
  });

  if (existing) return;

  await prisma.humanCorrection.create({
    data: {
      predictionId: input.predictionId,
      correctedById: input.correctedById,
      originalRiskLabel: input.originalRiskLabel,
      correctedRiskLabel: RiskLabel.MEDIUM,
      reason: "OFICIAL: validación demo; el comentario requiere seguimiento, no atención inmediata.",
    },
  });
}

async function createDemoRecommendationFeedback(input: {
  predictionId: string;
  userId: string;
}) {
  const existing = await prisma.recommendationFeedback.findFirst({
    where: { predictionId: input.predictionId, userId: input.userId },
  });

  if (existing) return;

  await prisma.recommendationFeedback.create({
    data: {
      predictionId: input.predictionId,
      userId: input.userId,
      isUseful: true,
      comment: "Demo: recomendación clara para monitoreo regular.",
    },
  });
}

async function createDemoUploadWithError(adminId: string) {
  let upload = await prisma.fileUpload.findFirst({
    where: { originalFileName: "demo-carga-reseñas.csv" },
  });

  if (!upload) {
    upload = await prisma.fileUpload.create({
      data: {
        originalFileName: "demo-carga-reseñas.csv",
        mimeType: "text/csv",
        status: "PROCESSED_WITH_ERRORS",
        totalRows: 5,
        validRows: 4,
        invalidRows: 1,
        warnings: {
          warnings: ["Falta columna recomendada: Detalle"],
          demo: true,
        },
        uploadedById: adminId,
      },
    });
  }

  const existingError = await prisma.uploadError.findFirst({
    where: { fileUploadId: upload.id, rowNumber: 6 },
  });

  if (!existingError) {
    await prisma.uploadError.create({
      data: {
        fileUploadId: upload.id,
        rowNumber: 6,
        sourceRecordId: "SAMPLE-005",
        reason: "comentario vacio",
        rawData: {
          ID: "SAMPLE-005",
          Cliente: "Cliente Demo Centro",
          Comentario: "",
          demo: true,
        },
      },
    });
  }
}

async function createDemoAuditLogs(input: {
  adminId: string;
  customerSuccessId: string;
  analystId: string;
  commercialId: string;
  reviewId: string;
  predictionId: string | null;
}) {
  await createAuditIfMissing({
    userId: input.customerSuccessId,
    roleName: RoleName.CUSTOMER_SUCCESS,
    action: "PREDICTION_EXECUTION",
    entityType: "Review",
    entityId: input.reviewId,
    description: "Demo: predicción ejecutada para una reseña crítica.",
  });
  if (input.predictionId) {
    await createAuditIfMissing({
      userId: input.analystId,
      roleName: RoleName.ANALYST_QUALITY,
      action: "HUMAN_CORRECTION",
      entityType: "Prediction",
      entityId: input.predictionId,
      description: "Demo: corrección humana registrada por Analista/Calidad.",
    });
  }
  await createAuditIfMissing({
    userId: input.adminId,
    roleName: RoleName.ADMIN,
    action: "FILE_UPLOAD",
    entityType: "FileUpload",
    entityId: null,
    description: "Demo: carga histórica registrada para la demostración.",
  });
  await createAuditIfMissing({
    userId: input.commercialId,
    roleName: RoleName.COMMERCIAL_DIRECTION,
    action: "RESULT_EXPORT",
    entityType: "Reportes",
    entityId: null,
    description: "Demo: exportación ejecutiva registrada.",
  });
}

async function createAuditIfMissing(input: {
  userId: string;
  roleName: RoleName;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
}) {
  const existing = await prisma.auditLog.findFirst({
    where: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      description: input.description,
    },
  });

  if (existing) return;

  await prisma.auditLog.create({
    data: input,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
