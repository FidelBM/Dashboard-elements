"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { RoleName } from "@/lib/auth";

type RiskLabel = "HIGH" | "MEDIUM" | "LOW" | "MANUAL_REVIEW";
type SentimentLabel = "POSITIVE" | "NEUTRAL" | "NEGATIVE";
type ConfidenceLabel = "HIGH" | "MEDIUM" | "LOW";

export type ModelQualityFilters = {
  dateFrom: string;
  dateTo: string;
  risk: string;
  confidence: string;
  manualReview: string;
  originalClassification: string;
  humanCorrection: string;
  category: string;
};

export type ModelQualityMetrics = {
  totalPredictions: number;
  manualReviewCount: number;
  manualReviewPercentage: number;
  lowConfidenceCount: number;
  uploadErrorsCount: number;
  humanCorrectionsCount: number;
  officialCorrectionsCount: number;
  riskDistribution: Record<string, number>;
};

export type ModelQualityPredictionRow = {
  id: string;
  client: string;
  date: string;
  category: string;
  subcategory: string;
  comment: string;
  originalClassification: string;
  nps: number | null;
  prediction: {
    id: string;
    risk: RiskLabel;
    probability: number;
    sentiment: SentimentLabel;
    mainCause: string;
    confidence: ConfidenceLabel;
    explanation: string;
    recommendation: string;
    warnings: string[];
    criticalSignals: string[];
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
    mode: "official" | "suggestion";
    createdAt: string;
  }>;
};

export type UploadErrorRow = {
  id: string;
  fileName: string;
  rowNumber: number;
  sourceRecordId: string | null;
  reason: string;
  createdAt: string;
};

export type ClassificationMatrixRow = {
  originalClassification: string;
  modelPrediction: RiskLabel;
  count: number;
};

export type CorrectionComparisonRow = {
  modelPrediction: RiskLabel;
  humanCorrection: RiskLabel;
  count: number;
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

export function ModelQualityClient({
  activeRole,
  categoryErrors,
  correctionComparison,
  filterOptions,
  filters,
  metrics,
  originalVsPrediction,
  predictions,
  uploadErrors,
}: {
  activeRole: RoleName;
  categoryErrors: Array<{ category: string; count: number }>;
  correctionComparison: CorrectionComparisonRow[];
  filterOptions: {
    originalClassifications: string[];
    categories: string[];
  };
  filters: ModelQualityFilters;
  metrics: ModelQualityMetrics;
  originalVsPrediction: ClassificationMatrixRow[];
  predictions: ModelQualityPredictionRow[];
  uploadErrors: UploadErrorRow[];
}) {
  const [selectedId, setSelectedId] = useState(predictions[0]?.id ?? "");
  const selected = useMemo(
    () => predictions.find((prediction) => prediction.id === selectedId) ?? predictions[0] ?? null,
    [predictions, selectedId],
  );

  return (
    <div className="quality-layout">
      <section className="manual-entry-copy">
        <p className="eyebrow">Analista / Calidad</p>
        <h1 className="page-title">Calidad del modelo y correcciones humanas</h1>
        <p className="page-description">
          Revisa revisión manual, baja confianza, errores de carga y discrepancias para registrar
          correcciones oficiales sin reentrenar automáticamente el modelo.
        </p>
      </section>

      <QualityFilters filters={filters} options={filterOptions} />
      <QualityMetrics metrics={metrics} />

      <section className="quality-insights-grid">
        <DistributionPanel metrics={metrics} />
        <InsightList
          emptyText="Sin correcciones oficiales que cambien el riesgo."
          title="Categorías con más errores"
          rows={categoryErrors.map((item) => ({
            label: item.category,
            value: `${item.count} correcciones`,
          }))}
        />
        <MatrixPanel rows={originalVsPrediction} title="Clasificación original vs modelo" type="original" />
        <MatrixPanel rows={correctionComparison} title="Modelo vs corrección humana" type="correction" />
      </section>

      <section className="quality-workbench">
        <div className="quality-table-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Predicciones</p>
              <h2>{predictions.length} casos filtrados</h2>
            </div>
          </div>
          {predictions.length > 0 ? (
            <div className="table-scroll">
              <table className="processed-table quality-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Riesgo</th>
                    <th>Confianza</th>
                    <th>Clasificación original</th>
                    <th>Categoría</th>
                    <th>Corrección humana</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((row) => (
                    <tr
                      className={row.id === selected?.id ? "selected" : ""}
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
                      <td>{confidenceLabels[row.prediction.confidence]}</td>
                      <td>{row.originalClassification}</td>
                      <td>{row.category}</td>
                      <td>{correctionStatus(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No hay predicciones con los filtros actuales.</p>
          )}
        </div>

        <PredictionReviewPanel activeRole={activeRole} row={selected} />
      </section>

      <UploadErrorsPanel rows={uploadErrors} total={metrics.uploadErrorsCount} />
    </div>
  );
}

function QualityFilters({
  filters,
  options,
}: {
  filters: ModelQualityFilters;
  options: { originalClassifications: string[]; categories: string[] };
}) {
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
      <label>
        <span>Confianza</span>
        <select defaultValue={filters.confidence} name="confidence">
          <option value="">Todas</option>
          {Object.entries(confidenceLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Revisión manual</span>
        <select defaultValue={filters.manualReview} name="manualReview">
          <option value="">Todos</option>
          <option value="only">Solo revisión manual</option>
        </select>
      </label>
      <label>
        <span>Clasificación original</span>
        <select defaultValue={filters.originalClassification} name="originalClassification">
          <option value="">Todas</option>
          {options.originalClassifications.map((classification) => (
            <option key={classification} value={classification}>
              {classification}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Corrección humana</span>
        <select defaultValue={filters.humanCorrection} name="humanCorrection">
          <option value="">Todas</option>
          <option value="with">Con corrección</option>
          <option value="without">Sin corrección</option>
          <option value="official">Oficial</option>
          <option value="suggestion">Sugerida</option>
        </select>
      </label>
      <label>
        <span>Categoría</span>
        <select defaultValue={filters.category} name="category">
          <option value="">Todas</option>
          {options.categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <div className="filters-actions">
        <button className="button-link" type="submit">
          Filtrar
        </button>
        <a className="secondary-button" href="/model-quality">
          Limpiar
        </a>
      </div>
    </form>
  );
}

function QualityMetrics({ metrics }: { metrics: ModelQualityMetrics }) {
  return (
    <section className="quality-metrics">
      <Metric label="Predicciones" value={metrics.totalPredictions} />
      <Metric label="Revisión manual" value={`${metrics.manualReviewPercentage}%`} helper={`${metrics.manualReviewCount} casos`} />
      <Metric label="Baja confianza" value={metrics.lowConfidenceCount} />
      <Metric label="Errores de carga" value={metrics.uploadErrorsCount} />
      <Metric label="Correcciones humanas" value={metrics.humanCorrectionsCount} helper={`${metrics.officialCorrectionsCount} oficiales`} />
    </section>
  );
}

function Metric({ helper, label, value }: { helper?: string; label: string; value: number | string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </div>
  );
}

function DistributionPanel({ metrics }: { metrics: ModelQualityMetrics }) {
  const rows = (Object.keys(riskLabels) as RiskLabel[]).map((risk) => ({
    label: riskLabels[risk],
    value: metrics.riskDistribution[risk] ?? 0,
  }));

  return <InsightList emptyText="Sin predicciones." title="Distribución de riesgos" rows={rows} />;
}

function InsightList({
  emptyText,
  rows,
  title,
}: {
  emptyText: string;
  rows: Array<{ label: string; value: number | string }>;
  title: string;
}) {
  const max = Math.max(...rows.map((row) => Number.parseInt(String(row.value), 10) || 0), 1);
  return (
    <article className="quality-panel">
      <h2>{title}</h2>
      {rows.length > 0 ? (
        <div className="quality-bars">
          {rows.map((row) => {
            const numeric = Number.parseInt(String(row.value), 10) || 0;
            return (
              <div key={row.label}>
                <span>{row.label}</span>
                <div>
                  <i style={{ width: `${Math.max((numeric / max) * 100, numeric > 0 ? 8 : 0)}%` }} />
                </div>
                <strong>{row.value}</strong>
              </div>
            );
          })}
        </div>
      ) : (
        <p>{emptyText}</p>
      )}
    </article>
  );
}

function MatrixPanel({
  rows,
  title,
  type,
}: {
  rows: Array<ClassificationMatrixRow | CorrectionComparisonRow>;
  title: string;
  type: "original" | "correction";
}) {
  return (
    <article className="quality-panel">
      <h2>{title}</h2>
      {rows.length > 0 ? (
        <div className="quality-matrix-list">
          {rows.slice(0, 8).map((row) => {
            const left = type === "original"
              ? (row as ClassificationMatrixRow).originalClassification
              : riskLabels[(row as CorrectionComparisonRow).modelPrediction];
            const right = type === "original"
              ? riskLabels[(row as ClassificationMatrixRow).modelPrediction]
              : riskLabels[(row as CorrectionComparisonRow).humanCorrection];
            return (
              <div key={`${left}-${right}`}>
                <span>{left}</span>
                <strong>{right}</strong>
                <em>{row.count}</em>
              </div>
            );
          })}
        </div>
      ) : (
        <p>Sin datos para comparar.</p>
      )}
    </article>
  );
}

function PredictionReviewPanel({
  activeRole,
  row,
}: {
  activeRole: RoleName;
  row: ModelQualityPredictionRow | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  if (!row) {
    return (
      <aside className="review-detail-panel empty">
        <p className="eyebrow">Detalle</p>
        <h2>Sin selección</h2>
        <p>Selecciona una predicción para revisar el caso.</p>
      </aside>
    );
  }

  const canOfficial = activeRole === "ANALYST_QUALITY" || activeRole === "ADMIN";
  const canSuggest = activeRole === "CUSTOMER_SUCCESS" || activeRole === "ADMIN";

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
        ? "Corrección oficial guardada y auditada. No se reentrenó el modelo."
        : "Sugerencia guardada y auditada. Requiere aprobación de Analista/Calidad.",
    );
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <aside className="review-detail-panel">
      <div className="prediction-header">
        <div>
          <p className="eyebrow">Detalle de predicción</p>
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
          <dt>Clasificación original</dt>
          <dd>{row.originalClassification}</dd>
        </div>
        <div>
          <dt>Predicción del modelo</dt>
          <dd>{riskLabels[row.prediction.risk]}</dd>
        </div>
        <div>
          <dt>Confianza</dt>
          <dd>{confidenceLabels[row.prediction.confidence]}</dd>
        </div>
        <div>
          <dt>Causa probable</dt>
          <dd>{row.prediction.mainCause}</dd>
        </div>
        <div>
          <dt>Explicación</dt>
          <dd>{row.prediction.explanation}</dd>
        </div>
      </dl>

      <TagList label="Señales críticas" values={row.prediction.criticalSignals} />
      <TagList label="Advertencias" values={row.prediction.warnings} />

      {row.corrections.length > 0 ? (
        <section className="metadata-panel">
          <h3>Correcciones registradas</h3>
          {row.corrections.map((correction) => (
            <p key={correction.id}>
              {correction.mode === "official" ? "Oficial" : "Sugerencia"}:{" "}
              {riskLabels[correction.originalRisk]} a {riskLabels[correction.correctedRisk]} por{" "}
              {correction.correctedBy} el {formatDateTime(correction.createdAt)}
            </p>
          ))}
        </section>
      ) : null}

      {(canOfficial || canSuggest) ? (
        <CorrectionForm
          canOfficial={canOfficial}
          canSuggest={canSuggest}
          current={row}
          message={message}
          status={status}
          onSubmit={submitCorrection}
        />
      ) : null}
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
  current: ModelQualityPredictionRow;
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
          <span>Motivo opcional</span>
          <textarea name="reason" placeholder="Motivo de la corrección" rows={3} />
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

function UploadErrorsPanel({ rows, total }: { rows: UploadErrorRow[]; total: number }) {
  return (
    <section className="quality-table-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Errores de carga</p>
          <h2>{total} errores registrados</h2>
        </div>
      </div>
      {rows.length > 0 ? (
        <div className="table-scroll">
          <table className="processed-table">
            <thead>
              <tr>
                <th>Archivo</th>
                <th>Fila</th>
                <th>ID origen</th>
                <th>Motivo</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.fileName}</td>
                  <td>{row.rowNumber}</td>
                  <td>{row.sourceRecordId ?? "No capturado"}</td>
                  <td>{row.reason}</td>
                  <td>{formatDateTime(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Sin errores de carga con los filtros actuales.</p>
      )}
    </section>
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

function correctionStatus(row: ModelQualityPredictionRow) {
  if (row.corrections.some((correction) => correction.mode === "official")) {
    return "Oficial";
  }
  if (row.corrections.some((correction) => correction.mode === "suggestion")) {
    return "Sugerida";
  }
  return "Sin corrección";
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
