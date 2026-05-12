"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";

type FormState = {
  client: string;
  date: string;
  comment: string;
  category: string;
  subcategory: string;
  product: string;
  source: string;
  original_classification: string;
  nps: string;
};

type PredictionResult = {
  risk: "HIGH" | "MEDIUM" | "LOW" | "MANUAL_REVIEW";
  probability: number;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  main_cause: string;
  secondary_cause: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  urgency: string;
  recommendation: string;
  explanation: string;
  critical_signals: string[];
  warnings: string[];
};

type SubmitResult = {
  reviewId: string;
  predictionId: string;
  prediction: PredictionResult;
};

const initialForm: FormState = {
  client: "",
  date: new Date().toISOString().slice(0, 10),
  comment: "",
  category: "",
  subcategory: "",
  product: "",
  source: "",
  original_classification: "",
  nps: "",
};

const classificationOptions = [
  "Alta intención de abandono",
  "Experiencia intermedia",
  "Plazo corto para mejorar",
  "Retención probable",
  "Revisar manualmente",
];

const riskLabels: Record<PredictionResult["risk"], string> = {
  HIGH: "Riesgo alto",
  MEDIUM: "Riesgo medio",
  LOW: "Riesgo bajo",
  MANUAL_REVIEW: "Revisar manualmente",
};

const sentimentLabels: Record<PredictionResult["sentiment"], string> = {
  POSITIVE: "Positivo",
  NEUTRAL: "Neutral",
  NEGATIVE: "Negativo",
};

const confidenceLabels: Record<PredictionResult["confidence"], string> = {
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

export default function ManualReviewEntryPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);

  const canSubmit = useMemo(() => status !== "loading", [status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateForm(form);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setStatus("error");
      setMessage("Revisa los campos marcados antes de analizar la reseña.");
      return;
    }

    setStatus("loading");
    setMessage("");
    setResult(null);

    try {
      const response = await fetch("/api/manual-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: form.client,
          date: form.date,
          comment: form.comment,
          category: form.category,
          subcategory: form.subcategory,
          product: form.product || undefined,
          source: form.source || undefined,
          original_classification: form.original_classification,
          nps: form.nps === "" ? null : Number(form.nps),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo analizar la reseña.");
      }

      setResult(data);
      setStatus("success");
      setMessage("Reseña guardada y predicción registrada correctamente.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No se pudo analizar la reseña.");
    }
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  return (
    <div className="manual-entry-layout">
      <section className="manual-entry-copy">
        <p className="eyebrow">Captura individual</p>
        <h1 className="page-title">Captura manual de reseña</h1>
        <p className="page-description">
          Registra un comentario individual, ejecútalo contra el servicio ML y conserva la
          reseña, la predicción y la auditoría en PostgreSQL.
        </p>
      </section>

      <section className="manual-entry-grid">
        <form className="review-form" onSubmit={handleSubmit}>
          <Field label="Cliente" error={fieldErrors.client} required>
            <input
              value={form.client}
              onChange={(event) => updateField("client", event.target.value)}
              placeholder="Nombre de la cuenta"
            />
          </Field>

          <Field label="Fecha" error={fieldErrors.date} required>
            <input
              type="date"
              value={form.date}
              onChange={(event) => updateField("date", event.target.value)}
            />
          </Field>

          <Field label="Categoría" error={fieldErrors.category} required>
            <input
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
              placeholder="Servicio, Operación, Facturación..."
            />
          </Field>

          <Field label="Subcategoría" error={fieldErrors.subcategory} required>
            <input
              value={form.subcategory}
              onChange={(event) => updateField("subcategory", event.target.value)}
              placeholder="Seguimiento, Retrasos, Entrega..."
            />
          </Field>

          <Field label="Clasificación" error={fieldErrors.original_classification} required>
            <select
              value={form.original_classification}
              onChange={(event) => updateField("original_classification", event.target.value)}
            >
              <option value="">Selecciona una clasificación</option>
              {classificationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <Field label="NPS/calificación" error={fieldErrors.nps}>
            <input
              min="0"
              max="10"
              type="number"
              value={form.nps}
              onChange={(event) => updateField("nps", event.target.value)}
              placeholder="0 a 10"
            />
          </Field>

          <Field label="Producto">
            <input
              value={form.product}
              onChange={(event) => updateField("product", event.target.value)}
              placeholder="Opcional"
            />
          </Field>

          <Field label="Fuente">
            <input
              value={form.source}
              onChange={(event) => updateField("source", event.target.value)}
              placeholder="Encuesta, correo, llamada..."
            />
          </Field>

          <Field label="Comentario" error={fieldErrors.comment} required wide>
            <textarea
              value={form.comment}
              onChange={(event) => updateField("comment", event.target.value)}
              placeholder="Escribe el comentario del cliente"
              rows={6}
            />
          </Field>

          {message ? (
            <div className={`submission-message ${status === "success" ? "success" : "error"}`}>
              {message}
            </div>
          ) : null}

          <div className="form-actions">
            <button className="button-link" disabled={!canSubmit} type="submit">
              {status === "loading" ? "Analizando..." : "Analizar y guardar"}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setForm(initialForm);
                setFieldErrors({});
                setStatus("idle");
                setMessage("");
                setResult(null);
              }}
            >
              Limpiar
            </button>
          </div>
        </form>

        <ResultCard result={result} />
      </section>
    </div>
  );
}

function Field({
  children,
  error,
  label,
  required = false,
  wide = false,
}: {
  children: ReactNode;
  error?: string;
  label: string;
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <label className={`form-field ${wide ? "wide" : ""}`}>
      <span>
        {label}
        {required ? <strong> *</strong> : null}
      </span>
      {children}
      {error ? <small>{error}</small> : null}
    </label>
  );
}

function ResultCard({ result }: { result: SubmitResult | null }) {
  if (!result) {
    return (
      <aside className="prediction-card empty">
        <p className="eyebrow">Resultado</p>
        <h2>Sin predicción todavía</h2>
        <p>El resultado aparecerá aquí después de analizar y guardar la reseña.</p>
      </aside>
    );
  }

  const prediction = result.prediction;

  return (
    <aside className={`prediction-card risk-${prediction.risk.toLowerCase()}`}>
      <div className="prediction-header">
        <div>
          <p className="eyebrow">Resultado guardado</p>
          <h2>{riskLabels[prediction.risk]}</h2>
        </div>
        <strong>{Math.round(prediction.probability * 100)}%</strong>
      </div>

      <div className="result-metrics">
        <Metric label="Sentimiento" value={sentimentLabels[prediction.sentiment]} />
        <Metric label="Confianza" value={confidenceLabels[prediction.confidence]} />
        <Metric label="Urgencia" value={prediction.urgency} />
      </div>

      <dl className="result-details">
        <div>
          <dt>Causa principal</dt>
          <dd>{prediction.main_cause}</dd>
        </div>
        <div>
          <dt>Causa secundaria</dt>
          <dd>{prediction.secondary_cause ?? "No aplica"}</dd>
        </div>
        <div>
          <dt>Recomendación</dt>
          <dd>{prediction.recommendation}</dd>
        </div>
        <div>
          <dt>Justificación</dt>
          <dd>{prediction.explanation}</dd>
        </div>
      </dl>

      <TagList
        emptyLabel="Sin señales críticas detectadas"
        label="Señales críticas"
        values={prediction.critical_signals}
      />
      <TagList
        emptyLabel="Sin advertencias"
        label="Advertencias"
        values={prediction.warnings}
      />

      <p className="record-note">
        Review ID: {result.reviewId}
        <br />
        Prediction ID: {result.predictionId}
      </p>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TagList({
  emptyLabel,
  label,
  values,
}: {
  emptyLabel: string;
  label: string;
  values: string[];
}) {
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

function validateForm(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (!form.client.trim()) errors.client = "El cliente es obligatorio.";
  if (!form.date) errors.date = "La fecha es obligatoria.";
  if (!form.comment.trim()) errors.comment = "El comentario es obligatorio.";
  if (!form.category.trim()) errors.category = "La categoría es obligatoria.";
  if (!form.subcategory.trim()) errors.subcategory = "La subcategoría es obligatoria.";
  if (!form.original_classification) {
    errors.original_classification = "La clasificación es obligatoria.";
  }

  if (form.nps !== "") {
    const nps = Number(form.nps);
    if (!Number.isInteger(nps) || nps < 0 || nps > 10) {
      errors.nps = "Usa un número entero entre 0 y 10.";
    }
  }

  return errors;
}
