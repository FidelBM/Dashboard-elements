"use client";

import { FormEvent, useState } from "react";

type ExportEntity =
  | "processed_reviews"
  | "critical_clients"
  | "upload_errors"
  | "human_corrections"
  | "recommendation_feedback";

type FilterOptions = {
  products: string[];
  causes: string[];
  categories: string[];
  sources: string[];
};

const exportOptions: Array<{
  entity: ExportEntity;
  title: string;
  description: string;
}> = [
  {
    entity: "processed_reviews",
    title: "Reseñas procesadas",
    description: "Resultados del modelo sin comentarios originales ni datos crudos.",
  },
  {
    entity: "critical_clients",
    title: "Clientes críticos",
    description: "Cuentas con mayor riesgo acumulado y recomendación general.",
  },
  {
    entity: "upload_errors",
    title: "Errores de carga",
    description: "Filas inválidas y motivos de error para corregir archivos.",
  },
  {
    entity: "human_corrections",
    title: "Correcciones humanas",
    description: "Correcciones oficiales y sugeridas registradas como retroalimentación.",
  },
  {
    entity: "recommendation_feedback",
    title: "Feedback de recomendaciones",
    description: "Marcadores de utilidad sin exportar comentarios libres de feedback.",
  },
];

const riskOptions = [
  ["", "Todos"],
  ["HIGH", "Riesgo alto"],
  ["MEDIUM", "Riesgo medio"],
  ["LOW", "Riesgo bajo"],
  ["MANUAL_REVIEW", "Revisar manualmente"],
];

export function ExportsClient({ filterOptions }: { filterOptions: FilterOptions }) {
  const [message, setMessage] = useState("");

  function submitExport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      const cleaned = String(value).trim();
      if (cleaned) {
        params.set(key, cleaned);
      }
    }

    setMessage("Preparando descarga y registrando auditoría...");
    window.location.href = `/api/exports?${params.toString()}`;
    window.setTimeout(() => setMessage("La exportación fue solicitada. Revisa Auditoría para la trazabilidad."), 900);
  }

  return (
    <div className="exports-layout">
      <section className="manual-entry-copy">
        <p className="eyebrow">Salida de datos</p>
        <h1 className="page-title">Exportaciones</h1>
        <p className="page-description">
          Descarga información filtrada en CSV o Excel sin incluir datos sensibles innecesarios.
          Cada exportación queda registrada en Auditoría.
        </p>
      </section>

      {message ? <div className="submission-message success">{message}</div> : null}

      <section className="exports-grid">
        {exportOptions.map((option) => (
          <article className="export-card" key={option.entity}>
            <div>
              <p className="eyebrow">Exportar</p>
              <h2>{option.title}</h2>
              <p>{option.description}</p>
            </div>
            <form className="export-form" onSubmit={submitExport}>
              <input name="entity" type="hidden" value={option.entity} />
              <CommonFilters filterOptions={filterOptions} entity={option.entity} />
              <label>
                <span>Formato</span>
                <select name="format" defaultValue="csv">
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel</option>
                </select>
              </label>
              <button className="button-link" type="submit">
                Descargar
              </button>
            </form>
          </article>
        ))}
      </section>
    </div>
  );
}

function CommonFilters({
  entity,
  filterOptions,
}: {
  entity: ExportEntity;
  filterOptions: FilterOptions;
}) {
  const showRisk = ["processed_reviews", "human_corrections", "recommendation_feedback"].includes(entity);
  const showUseful = entity === "recommendation_feedback";

  return (
    <>
      <label>
        <span>Desde</span>
        <input name="dateFrom" type="date" />
      </label>
      <label>
        <span>Hasta</span>
        <input name="dateTo" type="date" />
      </label>
      <label>
        <span>Cliente</span>
        <input name="client" placeholder={entity === "upload_errors" ? "Nombre de archivo" : "Buscar cliente"} />
      </label>
      {showRisk ? (
        <label>
          <span>Riesgo</span>
          <select name="risk">
            {riskOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <SelectFilter label="Causa" name="cause" options={filterOptions.causes} />
      <SelectFilter label="Categoría" name="category" options={filterOptions.categories} />
      <SelectFilter label="Producto" name="product" options={filterOptions.products} />
      <SelectFilter label="Fuente" name="source" options={filterOptions.sources} />
      {showUseful ? (
        <label>
          <span>Utilidad</span>
          <select name="useful">
            <option value="">Todas</option>
            <option value="true">Útil</option>
            <option value="false">No útil</option>
          </select>
        </label>
      ) : null}
    </>
  );
}

function SelectFilter({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <label>
      <span>{label}</span>
      <select name={name}>
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
