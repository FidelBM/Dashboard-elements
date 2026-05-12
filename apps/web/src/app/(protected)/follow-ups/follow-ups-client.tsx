"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { RoleName } from "@/lib/auth";

type FollowUpStatus = "PENDING" | "CONTACTED" | "ESCALATED" | "IN_PROGRESS" | "CLOSED";
type RiskLabel = "HIGH" | "MEDIUM" | "LOW" | "MANUAL_REVIEW";

export type FollowUpRow = {
  id: string;
  clientId: string | null;
  clientName: string;
  reviewId: string | null;
  reviewDate: string | null;
  reviewComment: string;
  reviewCategory: string | null;
  reviewSubcategory: string | null;
  nps: number | null;
  risk: RiskLabel | null;
  probability: number | null;
  mainCause: string | null;
  urgency: string | null;
  recommendation: string | null;
  criticalSignals: string[];
  assignedToId: string | null;
  assignedToName: string;
  status: FollowUpStatus;
  contactDate: string | null;
  actionTaken: string | null;
  escalatedArea: string | null;
  contactResult: string | null;
  note: string | null;
  closingNote: string | null;
  closedAt: string | null;
  updatedAt: string;
};

export type FollowUpUser = {
  id: string;
  name: string;
};

export type ReviewOption = {
  id: string;
  clientId: string;
  clientName: string;
  reviewDate: string;
  risk: RiskLabel;
  mainCause: string;
  urgency: string;
};

const statusLabels: Record<FollowUpStatus, string> = {
  PENDING: "Pendiente",
  CONTACTED: "Contactado",
  ESCALATED: "Escalado",
  IN_PROGRESS: "En seguimiento",
  CLOSED: "Cerrado",
};

const riskLabels: Record<RiskLabel, string> = {
  HIGH: "Riesgo alto",
  MEDIUM: "Riesgo medio",
  LOW: "Riesgo bajo",
  MANUAL_REVIEW: "Revisar manualmente",
};

export function FollowUpsClient({
  activeRole,
  followUps,
  reviewOptions,
  users,
}: {
  activeRole: RoleName;
  followUps: FollowUpRow[];
  reviewOptions: ReviewOption[];
  users: FollowUpUser[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<FollowUpRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [message, setMessage] = useState("");

  const canEdit = activeRole === "CUSTOMER_SUCCESS" || activeRole === "ADMIN";
  const canObserve = activeRole === "ANALYST_QUALITY" || activeRole === "ADMIN";

  const filteredFollowUps = useMemo(
    () => followUps.filter((followUp) => !statusFilter || followUp.status === statusFilter),
    [followUps, statusFilter],
  );

  async function handleSaved(successMessage: string) {
    setMessage(successMessage);
    setSelected(null);
    setCreateOpen(false);
    router.refresh();
  }

  return (
    <div className="follow-up-layout">
      <section className="manual-entry-copy">
        <p className="eyebrow">Seguimientos</p>
        <h1 className="page-title">Control de casos críticos</h1>
        <p className="page-description">
          Documenta responsables, contacto, acciones, escalamiento y cierre sin modificar el riesgo
          acumulado del cliente.
        </p>
      </section>

      <section className="follow-up-toolbar">
        <div>
          <span>{followUps.length}</span>
          <p>seguimientos registrados</p>
        </div>
        <label>
          <span>Estado</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Todos</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {canEdit ? (
          <button className="button-link" type="button" onClick={() => setCreateOpen(true)}>
            Crear seguimiento
          </button>
        ) : null}
      </section>

      {message ? <div className="submission-message success">{message}</div> : null}

      <section className="follow-up-grid">
        {filteredFollowUps.length > 0 ? (
          filteredFollowUps.map((followUp) => (
            <article className="follow-up-card" key={followUp.id}>
              <div className="follow-up-card-header">
                <div>
                  <span className={`status-pill ${followUp.status.toLowerCase()}`}>
                    {statusLabels[followUp.status]}
                  </span>
                  <h2>{followUp.clientName}</h2>
                </div>
                {followUp.risk ? (
                  <span className={`risk-pill ${followUp.risk.toLowerCase()}`}>
                    {riskLabels[followUp.risk]}
                  </span>
                ) : null}
              </div>
              <dl className="follow-up-details">
                <Detail label="Responsable" value={followUp.assignedToName} />
                <Detail label="Fecha contacto" value={formatDate(followUp.contactDate)} />
                <Detail label="Urgencia" value={followUp.urgency ?? "No capturada"} />
                <Detail label="Causa" value={followUp.mainCause ?? "Sin causa"} />
                <Detail label="Acción tomada" value={followUp.actionTaken ?? "Sin documentar"} wide />
                <Detail label="Resultado" value={followUp.contactResult ?? "Sin resultado"} />
                <Detail label="Área involucrada" value={followUp.escalatedArea ?? "No aplica"} />
              </dl>
              <p className="follow-up-note">{followUp.note ?? "Sin nota registrada."}</p>
              <div className="follow-up-actions">
                <button className="secondary-button" type="button" onClick={() => setSelected(followUp)}>
                  {canEdit ? "Editar" : canObserve ? "Agregar observación" : "Ver avance"}
                </button>
              </div>
            </article>
          ))
        ) : (
          <p>No hay seguimientos con este filtro.</p>
        )}
      </section>

      {createOpen ? (
        <FollowUpModal
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSaved={() => handleSaved("Seguimiento creado.")}
          reviewOptions={reviewOptions}
          users={users}
        />
      ) : null}

      {selected ? (
        <FollowUpModal
          activeRole={activeRole}
          followUp={selected}
          mode={canEdit ? "edit" : canObserve ? "observe" : "view"}
          onClose={() => setSelected(null)}
          onSaved={() => handleSaved(canObserve && !canEdit ? "Observación agregada." : "Seguimiento actualizado.")}
          users={users}
        />
      ) : null}
    </div>
  );
}

function FollowUpModal({
  activeRole,
  followUp,
  mode,
  onClose,
  onSaved,
  reviewOptions = [],
  users,
}: {
  activeRole?: RoleName;
  followUp?: FollowUpRow;
  mode: "create" | "edit" | "observe" | "view";
  onClose: () => void;
  onSaved: () => void;
  reviewOptions?: ReviewOption[];
  users: FollowUpUser[];
}) {
  const [requestStatus, setRequestStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [selectedReviewId, setSelectedReviewId] = useState(reviewOptions[0]?.id ?? "");
  const selectedReview = reviewOptions.find((review) => review.id === selectedReviewId);
  const readOnly = mode === "view";
  const observeOnly = mode === "observe";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly) {
      return;
    }

    setRequestStatus("loading");
    setError("");
    const formData = new FormData(event.currentTarget);
    const body = observeOnly
      ? {
          mode: "observation",
          followUpId: followUp?.id,
          note: formData.get("note"),
        }
      : {
          followUpId: followUp?.id,
          reviewId: followUp?.reviewId ?? selectedReview?.id,
          clientId: followUp?.clientId ?? selectedReview?.clientId,
          assignedToId: formData.get("assignedToId"),
          status: formData.get("status"),
          contactDate: formData.get("contactDate"),
          actionTaken: formData.get("actionTaken"),
          escalatedArea: formData.get("escalatedArea"),
          contactResult: formData.get("contactResult"),
          note: formData.get("note"),
          closingNote: formData.get("closingNote"),
        };

    const response = await fetch("/api/follow-ups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      setRequestStatus("error");
      setError(data.error ?? "No se pudo guardar el seguimiento.");
      return;
    }

    setRequestStatus("idle");
    onSaved();
  }

  return (
    <div className="modal-backdrop">
      <aside className="dashboard-modal follow-up-modal">
        <div className="prediction-header">
          <div>
            <p className="eyebrow">
              {mode === "create" ? "Nuevo seguimiento" : mode === "observe" ? "Observación" : "Seguimiento"}
            </p>
            <h2>{followUp?.clientName ?? selectedReview?.clientName ?? "Selecciona una reseña"}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <FollowUpContext followUp={followUp} selectedReview={selectedReview} />

        <form className="correction-panel follow-up-form" onSubmit={submit}>
          {mode === "create" ? (
            <label>
              <span>Reseña de riesgo</span>
              <select
                name="reviewId"
                required
                value={selectedReviewId}
                onChange={(event) => setSelectedReviewId(event.target.value)}
              >
                {reviewOptions.map((review) => (
                  <option key={review.id} value={review.id}>
                    {review.clientName} · {formatDate(review.reviewDate)} · {riskLabels[review.risk]}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {observeOnly ? (
            <label className="full-width">
              <span>Observación de Analista/Calidad</span>
              <textarea name="note" placeholder="Agrega una observación sin cambiar el estado operativo" required rows={4} />
            </label>
          ) : (
            <>
              <label>
                <span>Responsable asignado</span>
                <select defaultValue={followUp?.assignedToId ?? users[0]?.id ?? ""} disabled={readOnly} name="assignedToId">
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Estado</span>
                <select defaultValue={followUp?.status ?? "PENDING"} disabled={readOnly} name="status">
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Fecha de contacto</span>
                <input defaultValue={followUp?.contactDate ?? ""} disabled={readOnly} name="contactDate" type="date" />
              </label>
              <label>
                <span>Área involucrada si se escaló</span>
                <input defaultValue={followUp?.escalatedArea ?? ""} disabled={readOnly} name="escalatedArea" />
              </label>
              <label className="full-width">
                <span>Acción tomada</span>
                <textarea
                  defaultValue={followUp?.actionTaken ?? ""}
                  disabled={readOnly}
                  name="actionTaken"
                  placeholder="Ej. Contacto con la cuenta y revisión del plan de atención"
                  rows={3}
                />
              </label>
              <label className="full-width">
                <span>Resultado del contacto</span>
                <textarea
                  defaultValue={followUp?.contactResult ?? ""}
                  disabled={readOnly}
                  name="contactResult"
                  placeholder="Ej. Cliente acepta seguimiento con Operaciones"
                  rows={3}
                />
              </label>
              <label className="full-width">
                <span>Nota breve</span>
                <textarea defaultValue={followUp?.note ?? ""} disabled={readOnly} name="note" rows={3} />
              </label>
              <label className="full-width">
                <span>Nota de cierre</span>
                <textarea
                  defaultValue={followUp?.closingNote ?? ""}
                  disabled={readOnly}
                  name="closingNote"
                  placeholder="Obligatoria al cerrar el caso"
                  rows={3}
                />
              </label>
            </>
          )}

          {error ? <div className="submission-message error">{error}</div> : null}

          {!readOnly ? (
            <button className="button-link" disabled={requestStatus === "loading"} type="submit">
              {requestStatus === "loading" ? "Guardando..." : observeOnly ? "Agregar observación" : "Guardar seguimiento"}
            </button>
          ) : (
            <p className="read-only-note">
              {activeRole === "COMMERCIAL_DIRECTION"
                ? "Vista de solo consulta para Dirección Comercial."
                : "Vista de solo consulta."}
            </p>
          )}
        </form>
      </aside>
    </div>
  );
}

function FollowUpContext({
  followUp,
  selectedReview,
}: {
  followUp?: FollowUpRow;
  selectedReview?: ReviewOption;
}) {
  return (
    <dl className="follow-up-context">
      <Detail label="Fecha reseña" value={formatDate(followUp?.reviewDate ?? selectedReview?.reviewDate ?? null)} />
      <Detail
        label="Riesgo"
        value={followUp?.risk ? riskLabels[followUp.risk] : selectedReview ? riskLabels[selectedReview.risk] : "No seleccionado"}
      />
      <Detail label="Causa" value={followUp?.mainCause ?? selectedReview?.mainCause ?? "Sin causa"} />
      <Detail label="Urgencia" value={followUp?.urgency ?? selectedReview?.urgency ?? "Sin urgencia"} />
      {followUp ? <Detail label="Comentario" value={followUp.reviewComment} wide /> : null}
      {followUp?.recommendation ? <Detail label="Recomendación" value={followUp.recommendation} wide /> : null}
      {followUp?.closingNote ? <Detail label="Cierre" value={followUp.closingNote} wide /> : null}
    </dl>
  );
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "wide" : undefined}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "No capturada";
  }

  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${value.slice(0, 10)}T00:00:00.000Z`),
  );
}
