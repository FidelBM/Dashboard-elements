import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { FollowUpStatus, Prisma, RoleName as PrismaRoleName } from "@/generated/prisma";
import { canUseApiAction } from "@/lib/api-auth";
import { AUDIT_ACTIONS, logAuditEvent } from "@/lib/audit";
import { AUTH_NAME_COOKIE, AUTH_ROLE_COOKIE, isRoleName } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AuthContext = {
  roleName: PrismaRoleName;
  userId: string;
};

export async function POST(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Sesion no valida." }, { status: 401 });
  }

  const payload = normalizePayload(await request.json());

  if (auth.roleName === "COMMERCIAL_DIRECTION") {
    return NextResponse.json(
      { error: "Direccion Comercial solo puede consultar el avance de seguimientos." },
      { status: 403 },
    );
  }

  if (payload.mode === "observation" || auth.roleName === "ANALYST_QUALITY") {
    return addObservation(auth, payload);
  }

  if (!canUseApiAction(auth.roleName, "FOLLOW_UP_WRITE")) {
    return NextResponse.json(
      { error: "No tienes permisos para crear o editar seguimientos." },
      { status: 403 },
    );
  }

  return upsertFollowUp(auth, payload);
}

async function upsertFollowUp(auth: AuthContext, payload: NormalizedPayload) {
  if (!payload.followUpId && (!payload.reviewId || !payload.clientId)) {
    return NextResponse.json(
      { error: "Selecciona una resena o seguimiento valido." },
      { status: 400 },
    );
  }

  if (!isFollowUpStatus(payload.status)) {
    return NextResponse.json({ error: "Selecciona un estado de seguimiento valido." }, { status: 400 });
  }
  const followUpStatus = payload.status;

  if (followUpStatus === "CLOSED" && (!payload.actionTaken || !payload.closingNote)) {
    return NextResponse.json(
      { error: "No se puede cerrar un caso critico sin accion documentada y nota de cierre." },
      { status: 400 },
    );
  }

  if (followUpStatus === "ESCALATED" && !payload.escalatedArea) {
    return NextResponse.json(
      { error: "Indica el area involucrada cuando el seguimiento se escala." },
      { status: 400 },
    );
  }

  const contactDate = parseOptionalDate(payload.contactDate);
  if (payload.contactDate && !contactDate) {
    return NextResponse.json({ error: "La fecha de contacto no es valida." }, { status: 400 });
  }

  const saved = await prisma.$transaction(async (tx) => {
    const existing = payload.followUpId
      ? await tx.followUp.findUnique({ where: { id: payload.followUpId } })
      : await tx.followUp.findFirst({
          where: { reviewId: payload.reviewId },
          orderBy: { createdAt: "desc" },
        });

    const data = {
      status: followUpStatus,
      assignedToId: payload.assignedToId ?? auth.userId,
      contactDate,
      actionTaken: payload.actionTaken,
      escalatedArea: followUpStatus === "ESCALATED" ? payload.escalatedArea : payload.escalatedArea,
      contactResult: payload.contactResult,
      note: payload.note,
      closingNote: followUpStatus === "CLOSED" ? payload.closingNote : payload.closingNote,
      closedAt: followUpStatus === "CLOSED" ? new Date() : null,
    };

    const followUp = existing
      ? await tx.followUp.update({
          where: { id: existing.id },
          data,
        })
      : await tx.followUp.create({
          data: {
            ...data,
            clientId: payload.clientId,
            reviewId: payload.reviewId,
            createdById: auth.userId,
          },
        });

    const action = followUpStatus === "CLOSED"
      ? AUDIT_ACTIONS.CRITICAL_CASE_CLOSED
      : existing
        ? AUDIT_ACTIONS.FOLLOW_UP_UPDATED
        : AUDIT_ACTIONS.FOLLOW_UP_CREATED;

    await logAuditEvent(tx, {
        userId: auth.userId,
        roleName: auth.roleName,
        action,
        entityType: "FollowUp",
        entityId: followUp.id,
        previousValues: existing
          ? ({
              status: existing.status,
              assignedToId: existing.assignedToId,
              contactDate: existing.contactDate?.toISOString() ?? null,
              actionTaken: existing.actionTaken,
              escalatedArea: existing.escalatedArea,
              contactResult: existing.contactResult,
              note: existing.note,
              closingNote: existing.closingNote,
              closedAt: existing.closedAt?.toISOString() ?? null,
            } as Prisma.InputJsonValue)
          : undefined,
        newValues: {
          reviewId: followUp.reviewId,
          clientId: followUp.clientId,
          status: followUp.status,
          assignedToId: followUp.assignedToId,
          contactDate: followUp.contactDate?.toISOString() ?? null,
          actionTaken: followUp.actionTaken,
          escalatedArea: followUp.escalatedArea,
          contactResult: followUp.contactResult,
          note: followUp.note,
          closingNote: followUp.closingNote,
          closedAt: followUp.closedAt?.toISOString() ?? null,
        } as Prisma.InputJsonValue,
        description:
          action === AUDIT_ACTIONS.CRITICAL_CASE_CLOSED
            ? "Seguimiento cerrado con accion documentada."
            : existing
              ? "Seguimiento actualizado."
              : "Seguimiento creado para un evento de riesgo.",
    });

    return followUp;
  });

  return NextResponse.json({ followUpId: saved.id, status: saved.status });
}

async function addObservation(auth: AuthContext, payload: NormalizedPayload) {
  if (!canUseApiAction(auth.roleName, "FOLLOW_UP_OBSERVATION")) {
    return NextResponse.json(
      { error: "Solo Analista/Calidad puede agregar observaciones sin editar el seguimiento." },
      { status: 403 },
    );
  }

  if (!payload.followUpId || !payload.note) {
    return NextResponse.json(
      { error: "Selecciona un seguimiento y captura una observacion." },
      { status: 400 },
    );
  }
  const followUpId = payload.followUpId;
  const observation = payload.note;

  const saved = await prisma.$transaction(async (tx) => {
    const existing = await tx.followUp.findUnique({ where: { id: followUpId } });
    if (!existing) {
      throw new FollowUpNotFoundError();
    }

    const note = appendObservation(existing.note, observation);
    const followUp = await tx.followUp.update({
      where: { id: existing.id },
      data: { note },
    });

    await logAuditEvent(tx, {
        userId: auth.userId,
        roleName: auth.roleName,
        action: AUDIT_ACTIONS.FOLLOW_UP_UPDATED,
        entityType: "FollowUp",
        entityId: followUp.id,
        previousValues: { note: existing.note } as Prisma.InputJsonValue,
        newValues: { note: followUp.note } as Prisma.InputJsonValue,
        description: "Observacion agregada por Analista/Calidad.",
    });

    return followUp;
  }).catch((error: unknown) => {
    if (error instanceof FollowUpNotFoundError) {
      return null;
    }
    throw error;
  });

  if (!saved) {
    return NextResponse.json({ error: "No se encontro el seguimiento." }, { status: 404 });
  }

  return NextResponse.json({ followUpId: saved.id, status: saved.status });
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
      role: { name: roleValue },
    },
    select: { id: true },
  });

  if (!user) {
    return null;
  }

  return { roleName: roleValue, userId: user.id };
}

type NormalizedPayload = {
  mode: string | null;
  followUpId: string | null;
  reviewId: string | null;
  clientId: string | null;
  assignedToId: string | null;
  status: string;
  contactDate: string | null;
  actionTaken: string | null;
  escalatedArea: string | null;
  contactResult: string | null;
  note: string | null;
  closingNote: string | null;
};

function normalizePayload(input: unknown): NormalizedPayload {
  const value = input as Record<string, unknown>;
  return {
    mode: cleanOptional(value.mode),
    followUpId: cleanOptional(value.followUpId),
    reviewId: cleanOptional(value.reviewId),
    clientId: cleanOptional(value.clientId),
    assignedToId: cleanOptional(value.assignedToId),
    status: clean(value.status || "PENDING"),
    contactDate: cleanOptional(value.contactDate),
    actionTaken: cleanOptional(value.actionTaken),
    escalatedArea: cleanOptional(value.escalatedArea),
    contactResult: cleanOptional(value.contactResult),
    note: cleanOptional(value.note),
    closingNote: cleanOptional(value.closingNote),
  };
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function cleanOptional(value: unknown) {
  const cleaned = clean(value);
  return cleaned || null;
}

function isFollowUpStatus(value: string): value is FollowUpStatus {
  return ["PENDING", "CONTACTED", "ESCALATED", "IN_PROGRESS", "CLOSED"].includes(value);
}

function parseOptionalDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function appendObservation(currentNote: string | null, observation: string) {
  const stamp = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date());
  const nextObservation = `[Observacion Analista/Calidad - ${stamp}] ${observation}`;
  return [currentNote, nextObservation].filter(Boolean).join("\n");
}

class FollowUpNotFoundError extends Error {}
