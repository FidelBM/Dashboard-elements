"use client";

import { FormEvent, useMemo, useState } from "react";
import type { RoleName } from "@/lib/auth";

type RiskLabel = "HIGH" | "MEDIUM" | "LOW" | "MANUAL_REVIEW";
type SentimentLabel = "POSITIVE" | "NEUTRAL" | "NEGATIVE";
type ConfidenceLabel = "HIGH" | "MEDIUM" | "LOW";

export type ProcessedReviewRow = {
  id: string;
  client: string;
  date: string;
  category: string;
  subcategory: string;
  product: string | null;
  source: string | null;
  comment: string;
  originalClassification: string;
  nps: number | null;
  sourceRecordId: string | null;
  fileUploadName: string | null;
  followUpStatus: string | null;
  prediction: {
    id: string;
    risk: RiskLabel;
    probability: number;
    sentiment: SentimentLabel;
    mainCause: string;
    secondaryCause: string | null;
    confidence: ConfidenceLabel;
    urgency: string;
    recommendation: string;
    explanation: string;
    criticalSignals: string[];
    warnings: string[];
    triggeredRules: string[];
    modelVersion: string | null;
    createdAt: string;
  };
  corrections: Array<{
    id: string;
    correctedBy: string;
    role: string;
    originalRisk: RiskLabel;
    correctedRisk: RiskLabel;
    originalSentiment: SentimentLabel | null;
    correctedSentiment: SentimentLabel | null;
    originalPrimaryCause: string | null;
    correctedPrimaryCause: string | null;
    reason: string | null;
    createdAt: string;
  }>;
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

const sentimentLabels: Record<SentimentLabel, string> = {
  POSITIVE: "Positivo",
  NEUTRAL: "Neutral",
  NEGATIVE: "Negativo",
};

const confidenceLabels: Record<ConfidenceLabel, string> = {
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

const followUpLabels: Record<string, string> = {
  PENDING: "Pendiente",
  CONTACTED: "Contactado",
  ESCALATED: "Escalado",
  IN_PROGRESS: "En seguimiento",
  CLOSED: "Cerrado",
};

export function ProcessedReviewsClient({
  activeRole,
  filterOptions,
  filters,
  rows,
}: {
  activeRole: RoleName;
  filterOptions: FilterOptions;
  filters: Filters;
  rows: ProcessedReviewRow[];
}) {
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? "");
  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? rows[0] ?? null,
    [rows, selectedId],
  );

  return (
    <div className="processed-layout">
      <section className="manual-entry-copy">
        <p className="eyebrow">Resultados</p>
        <h1 className="page-title">Reseñas procesadas</h1>
        <p className="page-description">
          Consulta resultados filtrados sin mostrar explicaciones largas en tabla. Selecciona una
          fila para revisar señales, metadatos y correcciones.
        </p>
      </section>

      <FiltersForm filters={filters} options={filterOptions} />

      <section className="processed-grid">
        <div className="processed-table-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Tabla</p>
              <h2>{rows.length} reseñas</h2>
            </div>
          </div>

          {rows.length > 0 ? (
            <div className="table-scroll">
              <table className="processed-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Riesgo</th>
                    <th>Probabilidad</th>
                    <th>Causa principal</th>
                    <th>Urgencia</th>
                    <th>Recomendación breve</th>
                    <th>Confianza</th>
                    <th>Seguimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      className={row.id === selectedRow?.id ? "selected" : ""}
                      key={row.id}
                      onClick={() => setSelectedId(row.id)}
                    >
                      <td>{row.client}</td>
                      <td>{formatDate(row.date)}</td>
                      <td>
                        <span className={`risk-pill ${row.prediction.risk.toLowerCase()}`}>
                          {riskLabels[row.prediction.risk]}
                        </span>
                      </td>
                      <td>{Math.round(row.prediction.probability * 100)}%</td>
                      <td>{row.prediction.mainCause}</td>
                      <td>{row.prediction.urgency}</td>
                      <td>{shorten(row.prediction.recommendation, 92)}</td>
                      <td>{confidenceLabels[row.prediction.confidence]}</td>
                      <td>{row.followUpStatus ? followUpLabels[row.followUpStatus] : "Sin seguimiento"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No hay reseñas procesadas con los filtros actuales.</p>
          )}
        </div>

        <DetailPanel activeRole={activeRole} row={selectedRow} />
      </section>
    </div>
  );
}

function FiltersForm({ filters, options }: { filters: Filters; options: FilterOptions }) {
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
          <option value="">Todos</option>
          {Object.entries(riskLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
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
        <a className="secondary-button" href="/processed-reviews">
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

function DetailPanel({ activeRole, row }: { activeRole: RoleName; row: ProcessedReviewRow | null }) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  if (!row) {
    return (
      <aside className="review-detail-panel empty">
        <p className="eyebrow">Detalle</p>
        <h2>Sin selección</h2>
        <p>Selecciona una reseña para ver su explicación completa.</p>
      </aside>
    );
  }

  const canSuggest = activeRole === "CUSTOMER_SUCCESS" || activeRole === "ADMIN";
  const canOfficial = activeRole === "ANALYST_QUALITY" || activeRole === "ADMIN";

  async function submitCorrection(event: FormEvent<HTMLFormElement>, mode: "suggestion" | "official") {
    event.preventDefault();
    setStatus("loading");
    setMessage("Guardando corrección...");

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/predictions/${row!.prediction.id}/corrections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        correctedRiskLabel: formData.get("correctedRiskLabel"),
        correctedSentiment: formData.get("correctedSentiment") || null,
        correctedPrimaryCause: formData.get("correctedPrimaryCause") || null,
        reason: formData.get("reason") || null,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus("error");
      setMessage(data.error ?? "No se pudo guardar la corrección.");
      return;
    }

    setStatus("success");
    setMessage(
      mode === "official"
        ? "Corrección oficial guardada y auditada."
        : "Sugerencia de corrección guardada y auditada.",
    );
    event.currentTarget.reset();
  }

  return (
    <aside className="review-detail-panel">
      <div className="prediction-header">
        <div>
          <p className="eyebrow">Detalle</p>
          <h2>{row.client}</h2>
        </div>
        <strong>{Math.round(row.prediction.probability * 100)}%</strong>
      </div>

      <dl className="result-details">
        <div>
          <dt>Comentario original</dt>
          <dd>{row.comment}</dd>
        </div>
        <div>
          <dt>Explicación completa</dt>
          <dd>{row.prediction.explanation}</dd>
        </div>
        <div>
          <dt>Clasificación original</dt>
          <dd>{row.originalClassification}</dd>
        </div>
        <div>
          <dt>NPS</dt>
          <dd>{row.nps ?? "No capturado"}</dd>
        </div>
        <div>
          <dt>Recomendación</dt>
          <dd>{row.prediction.recommendation}</dd>
        </div>
      </dl>

      <TagList emptyLabel="Sin señales críticas" label="Señales críticas" values={row.prediction.criticalSignals} />
      <TagList emptyLabel="Sin advertencias" label="Advertencias" values={row.prediction.warnings} />
      <TagList emptyLabel="Sin reglas registradas" label="Reglas activadas" values={row.prediction.triggeredRules} />

      <section className="metadata-panel">
        <h3>Metadatos de predicción</h3>
        <p>Riesgo: {riskLabels[row.prediction.risk]}</p>
        <p>Sentimiento: {sentimentLabels[row.prediction.sentiment]}</p>
        <p>Confianza: {confidenceLabels[row.prediction.confidence]}</p>
        <p>Modelo/fuente: {row.prediction.modelVersion ?? "No registrado"}</p>
        <p>Fecha de predicción: {formatDateTime(row.prediction.createdAt)}</p>
        <p>ID origen: {row.sourceRecordId ?? "No registrado"}</p>
        <p>Archivo: {row.fileUploadName ?? "Captura manual"}</p>
      </section>

      {row.corrections.length > 0 ? (
        <section className="metadata-panel">
          <h3>Correcciones registradas</h3>
          {row.corrections.map((correction) => (
            <p key={correction.id}>
              {correction.reason?.startsWith("SUGERENCIA:") ? "Sugerencia" : "Oficial"}:{" "}
              {riskLabels[correction.correctedRisk]} por {correction.correctedBy}
            </p>
          ))}
        </section>
      ) : null}

      {(canSuggest || canOfficial) && (
        <CorrectionForm
          canOfficial={canOfficial}
          canSuggest={canSuggest}
          current={row}
          message={message}
          status={status}
          onSubmit={submitCorrection}
        />
      )}
    </aside>
  );
}

function CorrectionForm({
  canOfficial,
  canSuggest,
  current,
  message,
  onSubmit,
  status,
}: {
  canOfficial: boolean;
  canSuggest: boolean;
  current: ProcessedReviewRow;
  message: string;
  onSubmit: (event: FormEvent<HTMLFormElement>, mode: "suggestion" | "official") => void;
  status: "idle" | "loading" | "success" | "error";
}) {
  return (
    <section className="correction-panel">
      <h3>Corrección humana</h3>
      <form onSubmit={(event) => onSubmit(event, canOfficial ? "official" : "suggestion")}>
        <label>
          <span>Riesgo corregido</span>
          <select defaultValue={current.prediction.risk} name="correctedRiskLabel" required>
            {Object.entries(riskLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Sentimiento corregido</span>
          <select defaultValue={current.prediction.sentiment} name="correctedSentiment">
            <option value="">Sin cambio</option>
            {Object.entries(sentimentLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Causa corregida</span>
          <input defaultValue={current.prediction.mainCause} name="correctedPrimaryCause" />
        </label>
        <label>
          <span>Motivo</span>
          <textarea name="reason" placeholder="Describe brevemente el motivo" rows={3} />
        </label>

        {message ? (
          <div className={`submission-message ${status === "success" ? "success" : "error"}`}>
            {message}
          </div>
        ) : null}

        <div className="form-actions">
          {canSuggest && !canOfficial ? (
            <button className="secondary-button" disabled={status === "loading"} type="submit">
              Sugerir corrección
            </button>
          ) : null}
          {canOfficial ? (
            <button className="button-link" disabled={status === "loading"} type="submit">
              Guardar corrección oficial
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function TagList({ emptyLabel, label, values }: { emptyLabel: string; label: string; values: string[] }) {
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
        <p>{emptyLabel}</p>
      )}
    </section>
  );
}

function shorten(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
