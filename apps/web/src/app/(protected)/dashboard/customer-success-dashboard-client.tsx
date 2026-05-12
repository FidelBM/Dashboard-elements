"use client";

import { FormEvent, useMemo, useState } from "react";

type RiskLabel = "HIGH" | "MEDIUM" | "LOW" | "MANUAL_REVIEW";

export type DashboardReviewRow = {
  id: string;
  clientId: string;
  client: string;
  date: string;
  category: string;
  subcategory: string;
  product: string | null;
  source: string | null;
  comment: string;
  nps: number | null;
  originalClassification: string;
  followUpStatus: string | null;
  followUpId: string | null;
  prediction: {
    risk: RiskLabel;
    probability: number;
    mainCause: string;
    urgency: string;
    recommendation: string;
    explanation: string;
    confidence: string;
    criticalSignals: string[];
    warnings: string[];
  };
};

type CriticalClient = {
  id: string;
  name: string;
  score: number;
  status: string;
  reviewsConsidered: number;
  mainCauses: string[];
  recommendation: string;
};

type Filters = {
  dateFrom: string;
  dateTo: string;
  client: string;
  risk: string;
  cause: string;
  category: string;
  subcategory: string;
  product: string;
  source: string;
};

type FilterOptions = {
  causes: string[];
  categories: string[];
  subcategories: string[];
  products: string[];
  sources: string[];
};

const riskLabels: Record<RiskLabel, string> = {
  HIGH: "Riesgo alto",
  MEDIUM: "Riesgo medio",
  LOW: "Riesgo bajo",
  MANUAL_REVIEW: "Revisar manualmente",
};

const followUpLabels: Record<string, string> = {
  PENDING: "Pendiente",
  CONTACTED: "Contactado",
  ESCALATED: "Escalado",
  IN_PROGRESS: "En seguimiento",
  CLOSED: "Cerrado",
};

export function CustomerSuccessDashboardClient({
  criticalClients,
  filterOptions,
  filters,
  reviews,
}: {
  criticalClients: CriticalClient[];
  filterOptions: FilterOptions;
  filters: Filters;
  reviews: DashboardReviewRow[];
}) {
  const [selectedReview, setSelectedReview] = useState<DashboardReviewRow | null>(null);
  const [followUpReview, setFollowUpReview] = useState<DashboardReviewRow | null>(null);

  const highRiskReviews = useMemo(
    () => reviews.filter((review) => review.prediction.risk === "HIGH"),
    [reviews],
  );
  const mediumRiskReviews = useMemo(
    () => reviews.filter((review) => review.prediction.risk === "MEDIUM"),
    [reviews],
  );

  return (
    <div className="cs-dashboard-layout">
      <section className="manual-entry-copy">
        <p className="eyebrow">Customer Success</p>
        <h1 className="page-title">¿A quién contactar primero y por qué?</h1>
        <p className="page-description">
          Prioriza cuentas críticas y reseñas de alto riesgo con acciones recomendadas y seguimiento
          inmediato.
        </p>
      </section>

      <DashboardFilters filters={filters} options={filterOptions} />

      <section className="cs-critical-band">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Prioridad máxima</p>
            <h2>Clientes críticos</h2>
          </div>
          <strong>{criticalClients.length}</strong>
        </div>
        {criticalClients.length > 0 ? (
          <div className="cs-critical-grid">
            {criticalClients.map((client) => (
              <article className="cs-critical-card" key={client.id}>
                <div>
                  <h3>{client.name}</h3>
                  <strong>{client.score} pts</strong>
                </div>
                <p>{client.recommendation}</p>
                <span>
                  {client.reviewsConsidered} reseñas recientes
                  {client.mainCauses.length > 0 ? ` · ${client.mainCauses[0]}` : ""}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <p>No hay clientes críticos con reseñas recientes.</p>
        )}
      </section>

      <ReviewSection
        rows={highRiskReviews}
        title="Reseñas de riesgo alto"
        tone="high"
        onOpenDetail={setSelectedReview}
        onOpenFollowUp={setFollowUpReview}
      />
      <ReviewSection
        rows={mediumRiskReviews}
        title="Reseñas de riesgo medio"
        tone="medium"
        onOpenDetail={setSelectedReview}
        onOpenFollowUp={setFollowUpReview}
      />

      {selectedReview ? (
        <ReviewDetailModal review={selectedReview} onClose={() => setSelectedReview(null)} />
      ) : null}
      {followUpReview ? (
        <FollowUpModal review={followUpReview} onClose={() => setFollowUpReview(null)} />
      ) : null}
    </div>
  );
}

function DashboardFilters({ filters, options }: { filters: Filters; options: FilterOptions }) {
  return (
    <form className="filters-panel">
      <label>
        <span>Desde</span>
        <input defaultValue={filters.dateFrom} name="dateFrom" type="date" />
      </label>
      <label>
        <span>Hasta</span>
        <input defaultValue={filters.dateTo} name="dateTo" type="date" />
      </label>
      <label>
        <span>Cliente</span>
        <input defaultValue={filters.client} name="client" placeholder="Buscar cliente" />
      </label>
      <label>
        <span>Riesgo</span>
        <select defaultValue={filters.risk} name="risk">
          <option value="">Alto y medio</option>
          <option value="HIGH">Riesgo alto</option>
          <option value="MEDIUM">Riesgo medio</option>
        </select>
      </label>
      <SelectFilter label="Causa principal" name="cause" options={options.causes} value={filters.cause} />
      <SelectFilter label="Categoría" name="category" options={options.categories} value={filters.category} />
      <SelectFilter
        label="Subcategoría"
        name="subcategory"
        options={options.subcategories}
        value={filters.subcategory}
      />
      <SelectFilter label="Producto" name="product" options={options.products} value={filters.product} />
      <SelectFilter label="Fuente" name="source" options={options.sources} value={filters.source} />
      <div className="filters-actions">
        <button className="button-link" type="submit">
          Filtrar
        </button>
        <a className="secondary-button" href="/dashboard">
          Limpiar
        </a>
      </div>
    </form>
  );
}

function SelectFilter({
  label,
  name,
  options,
  value,
}: {
  label: string;
  name: string;
  options: string[];
  value: string;
}) {
  return (
    <label>
      <span>{label}</span>
      <select defaultValue={value} name={name}>
        <option value="">Todas</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ReviewSection({
  onOpenDetail,
  onOpenFollowUp,
  rows,
  title,
  tone,
}: {
  onOpenDetail: (review: DashboardReviewRow) => void;
  onOpenFollowUp: (review: DashboardReviewRow) => void;
  rows: DashboardReviewRow[];
  title: string;
  tone: "high" | "medium";
}) {
  return (
    <section className={`cs-review-section ${tone}`}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{tone === "high" ? "Contactar primero" : "Seguimiento cercano"}</p>
          <h2>{title}</h2>
        </div>
        <strong>{rows.length}</strong>
      </div>
      {rows.length > 0 ? (
        <div className="cs-action-list">
          {rows.map((review) => (
            <article className="cs-action-card" key={review.id}>
              <div className="cs-action-main">
                <span className={`risk-pill ${review.prediction.risk.toLowerCase()}`}>
                  {riskLabels[review.prediction.risk]}
                </span>
                <h3>{review.client}</h3>
                <p>{review.prediction.recommendation}</p>
              </div>
              <dl className="cs-action-meta">
                <div>
                  <dt>Urgencia</dt>
                  <dd>{review.prediction.urgency}</dd>
                </div>
                <div>
                  <dt>Fecha</dt>
                  <dd>{formatDate(review.date)}</dd>
                </div>
                <div>
                  <dt>Causa</dt>
                  <dd>{review.prediction.mainCause}</dd>
                </div>
                <div>
                  <dt>Seguimiento</dt>
                  <dd>{review.followUpStatus ? followUpLabels[review.followUpStatus] : "Pendiente"}</dd>
                </div>
              </dl>
              <div className="cs-action-buttons">
                <button className="secondary-button" type="button" onClick={() => onOpenDetail(review)}>
                  Ver detalle
                </button>
                <button className="button-link" type="button" onClick={() => onOpenFollowUp(review)}>
                  {review.followUpId ? "Actualizar seguimiento" : "Crear seguimiento"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p>No hay reseñas en esta prioridad con los filtros actuales.</p>
      )}
    </section>
  );
}

function ReviewDetailModal({ onClose, review }: { onClose: () => void; review: DashboardReviewRow }) {
  return (
    <div className="modal-backdrop">
      <aside className="dashboard-modal">
        <div className="prediction-header">
          <div>
            <p className="eyebrow">Detalle de reseña</p>
            <h2>{review.client}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <dl className="result-details">
          <div>
            <dt>Comentario original</dt>
            <dd>{review.comment}</dd>
          </div>
          <div>
            <dt>Explicación</dt>
            <dd>{review.prediction.explanation}</dd>
          </div>
          <div>
            <dt>NPS</dt>
            <dd>{review.nps ?? "No capturado"}</dd>
          </div>
          <div>
            <dt>Clasificación original</dt>
            <dd>{review.originalClassification}</dd>
          </div>
          <div>
            <dt>Confianza</dt>
            <dd>{review.prediction.confidence}</dd>
          </div>
        </dl>
        <TagList label="Señales críticas" values={review.prediction.criticalSignals} />
        <TagList label="Advertencias" values={review.prediction.warnings} />
      </aside>
    </div>
  );
}

function FollowUpModal({ onClose, review }: { onClose: () => void; review: DashboardReviewRow }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submitFollowUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("Guardando seguimiento...");
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/follow-ups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewId: review.id,
        clientId: review.clientId,
        status: formData.get("status"),
        contactDate: formData.get("contactDate"),
        actionTaken: formData.get("actionTaken"),
        escalatedArea: formData.get("escalatedArea"),
        contactResult: formData.get("contactResult"),
        note: formData.get("note"),
        closingNote: formData.get("closingNote"),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus("error");
      setMessage(data.error ?? "No se pudo guardar el seguimiento.");
      return;
    }
    setStatus("success");
    setMessage("Seguimiento guardado. Actualiza la página para ver el nuevo estado en la tabla.");
  }

  return (
    <div className="modal-backdrop">
      <aside className="dashboard-modal compact">
        <div className="prediction-header">
          <div>
            <p className="eyebrow">Seguimiento</p>
            <h2>{review.client}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <form className="correction-panel" onSubmit={submitFollowUp}>
          <label>
            <span>Estado</span>
            <select defaultValue={review.followUpStatus ?? "PENDING"} name="status">
              {Object.entries(followUpLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Fecha de contacto</span>
            <input name="contactDate" type="date" />
          </label>
          <label>
            <span>Acción tomada</span>
            <textarea name="actionTaken" placeholder="Ej. Contactar al cliente y confirmar plan" rows={3} />
          </label>
          <label>
            <span>Área involucrada si se escaló</span>
            <input name="escalatedArea" placeholder="Ej. Operaciones" />
          </label>
          <label>
            <span>Resultado del contacto</span>
            <textarea name="contactResult" placeholder="Resultado o acuerdo interno documentado" rows={3} />
          </label>
          <label>
            <span>Nota breve</span>
            <textarea name="note" placeholder="Contexto o siguiente paso" rows={3} />
          </label>
          <label>
            <span>Nota de cierre</span>
            <textarea name="closingNote" placeholder="Obligatoria si se marca como cerrado" rows={3} />
          </label>
          {message ? (
            <div className={`submission-message ${status === "success" ? "success" : "error"}`}>
              {message}
            </div>
          ) : null}
          <button className="button-link" disabled={status === "loading"} type="submit">
            Guardar seguimiento
          </button>
        </form>
      </aside>
    </div>
  );
}

function TagList({ label, values }: { label: string; values: string[] }) {
  return (
    <section className="tag-section">
      <h3>{label}</h3>
      {values.length > 0 ? (
        <div className="tag-list">
          {values.map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>
      ) : (
        <p>Sin registros</p>
      )}
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}
