"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";

type UploadSummary = {
  is_valid: boolean;
  total_rows: number;
  valid_rows_count: number;
  invalid_rows_count: number;
  missing_required_columns: string[];
  missing_recommended_columns: string[];
};

type ErrorReportItem = {
  row_number: number;
  source_record_id: string | null;
  reason: string;
  raw_data?: Record<string, string>;
};

type BatchUploadResult = {
  fileUploadId: string;
  savedReviews: number;
  savedPredictions: number;
  savedErrors: number;
  upload_summary: UploadSummary;
  warnings: string[];
  predictions: Array<{
    row_number: number;
    source_record_id: string;
    prediction: {
      risk: "HIGH" | "MEDIUM" | "LOW" | "MANUAL_REVIEW";
      probability: number;
      main_cause: string;
      urgency: string;
    };
  }>;
  error_report: ErrorReportItem[];
};

const acceptedTypes = ".csv,.xlsx,.xls";

const riskLabels: Record<string, string> = {
  HIGH: "Riesgo alto",
  MEDIUM: "Riesgo medio",
  LOW: "Riesgo bajo",
  MANUAL_REVIEW: "Revisar manualmente",
};

export default function UploadReviewsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<BatchUploadResult | null>(null);

  const canDownloadErrors = useMemo(
    () => Boolean(result && result.error_report.length > 0),
    [result],
  );

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setResult(null);
    setMessage("");
    setStatus("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setStatus("error");
      setMessage("Selecciona un archivo CSV o Excel antes de procesar.");
      return;
    }

    if (!isAllowedFile(file)) {
      setStatus("error");
      setMessage("El archivo debe ser CSV o Excel.");
      return;
    }

    setStatus("loading");
    setMessage("Validando archivo y ejecutando predicciones...");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload-reviews", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo procesar el archivo.");
      }

      setResult(data);
      setStatus("success");
      setMessage(getSuccessMessage(data));
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No se pudo procesar el archivo.");
    }
  }

  function downloadErrorReport() {
    if (!result) return;

    const csv = buildErrorReportCsv(result.error_report);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `errores-carga-${result.fileUploadId}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="upload-layout">
      <section className="manual-entry-copy">
        <p className="eyebrow">Carga masiva</p>
        <h1 className="page-title">Carga de reseñas</h1>
        <p className="page-description">
          Sube un archivo CSV o Excel. El sistema validará columnas y filas, procesará solo los
          registros válidos y guardará el resultado con trazabilidad.
        </p>
      </section>

      <section className="upload-grid">
        <form className="upload-dropzone" onSubmit={handleSubmit}>
          <label className="file-picker">
            <span>Archivo CSV o Excel</span>
            <strong>{file ? file.name : "Seleccionar archivo"}</strong>
            <small>Formatos permitidos: .csv, .xlsx, .xls</small>
            <input accept={acceptedTypes} type="file" onChange={handleFileChange} />
          </label>

          {message ? (
            <div className={`submission-message ${status === "success" ? "success" : "error"}`}>
              {message}
            </div>
          ) : null}

          <div className="form-actions">
            <button className="button-link" disabled={status === "loading"} type="submit">
              {status === "loading" ? "Procesando..." : "Validar y procesar"}
            </button>
            <button
              className="secondary-button"
              disabled={!canDownloadErrors}
              type="button"
              onClick={downloadErrorReport}
            >
              Descargar errores
            </button>
          </div>
        </form>

        <ValidationSummary result={result} />
      </section>

      {result ? <UploadDetails result={result} /> : null}
    </div>
  );
}

function ValidationSummary({ result }: { result: BatchUploadResult | null }) {
  if (!result) {
    return (
      <aside className="upload-summary-card empty">
        <p className="eyebrow">Validación</p>
        <h2>Sin archivo procesado</h2>
        <p>El resumen aparecerá aquí después de validar la carga.</p>
      </aside>
    );
  }

  const summary = result.upload_summary;
  const blocked = summary.missing_required_columns.length > 0;

  return (
    <aside className={`upload-summary-card ${blocked ? "blocked" : "ready"}`}>
      <p className="eyebrow">{blocked ? "Carga bloqueada" : "Validación completa"}</p>
      <h2>{blocked ? "Faltan columnas obligatorias" : "Archivo procesado"}</h2>

      <div className="summary-metrics">
        <Metric label="Filas totales" value={summary.total_rows} />
        <Metric label="Filas válidas" value={summary.valid_rows_count} />
        <Metric label="Filas inválidas" value={summary.invalid_rows_count} />
      </div>

      <ColumnList
        emptyLabel="Sin faltantes"
        label="Columnas obligatorias faltantes"
        values={summary.missing_required_columns}
      />
      <ColumnList
        emptyLabel="Sin faltantes"
        label="Columnas recomendadas faltantes"
        values={summary.missing_recommended_columns}
      />
      <ColumnList emptyLabel="Sin advertencias" label="Advertencias" values={result.warnings} />

      <p className="record-note">
        FileUpload ID: {result.fileUploadId}
        <br />
        Guardadas: {result.savedReviews} reseñas, {result.savedPredictions} predicciones,{" "}
        {result.savedErrors} errores.
      </p>
    </aside>
  );
}

function UploadDetails({ result }: { result: BatchUploadResult }) {
  return (
    <section className="upload-details">
      <div className="upload-table-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Predicciones</p>
            <h2>Filas válidas procesadas</h2>
          </div>
          <strong>{result.predictions.length}</strong>
        </div>

        {result.predictions.length > 0 ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>ID</th>
                  <th>Riesgo</th>
                  <th>Probabilidad</th>
                  <th>Causa principal</th>
                  <th>Urgencia</th>
                </tr>
              </thead>
              <tbody>
                {result.predictions.slice(0, 12).map((item) => (
                  <tr key={`${item.row_number}-${item.source_record_id}`}>
                    <td>{item.row_number}</td>
                    <td>{item.source_record_id}</td>
                    <td>{riskLabels[item.prediction.risk]}</td>
                    <td>{Math.round(item.prediction.probability * 100)}%</td>
                    <td>{item.prediction.main_cause}</td>
                    <td>{item.prediction.urgency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No se procesaron predicciones porque la carga fue bloqueada o no hubo filas válidas.</p>
        )}
      </div>

      <div className="upload-table-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Errores</p>
            <h2>Filas inválidas</h2>
          </div>
          <strong>{result.error_report.length}</strong>
        </div>

        {result.error_report.length > 0 ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>ID</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {result.error_report.slice(0, 12).map((error, index) => (
                  <tr key={`${error.row_number}-${error.reason}-${index}`}>
                    <td>{error.row_number}</td>
                    <td>{error.source_record_id ?? "Sin ID"}</td>
                    <td>{humanizeReason(error.reason)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No se detectaron filas inválidas.</p>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ColumnList({
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
            <span key={value}>{humanizeReason(value)}</span>
          ))}
        </div>
      ) : (
        <p>{emptyLabel}</p>
      )}
    </section>
  );
}

function isAllowedFile(file: File) {
  return /\.(csv|xlsx|xls)$/i.test(file.name);
}

function getSuccessMessage(result: BatchUploadResult) {
  if (result.upload_summary.missing_required_columns.length > 0) {
    return "El archivo fue guardado como carga rechazada. Corrige las columnas obligatorias antes de procesar.";
  }

  if (result.upload_summary.invalid_rows_count > 0) {
    return "Carga procesada con filas inválidas. Revisa y descarga el reporte de errores.";
  }

  if (result.upload_summary.missing_recommended_columns.length > 0) {
    return "Carga procesada con advertencias por columnas recomendadas faltantes.";
  }

  return "Carga procesada correctamente.";
}

function buildErrorReportCsv(errors: ErrorReportItem[]) {
  const headers = ["Fila", "ID", "Motivo", "Datos"];
  const rows = errors.map((error) => [
    String(error.row_number),
    error.source_record_id ?? "",
    humanizeReason(error.reason),
    JSON.stringify(error.raw_data ?? {}),
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function humanizeReason(value: string) {
  const labels: Record<string, string> = {
    "comentario vacio": "Comentario vacío",
    "fecha invalida": "Fecha inválida",
    "ID duplicado": "ID duplicado",
    "cliente vacio": "Cliente vacío",
    "clasificacion no reconocida": "Clasificación no reconocida",
    "categoria ausente": "Categoría ausente",
    "subcategoria ausente": "Subcategoría ausente",
  };

  return labels[value] ?? value;
}
