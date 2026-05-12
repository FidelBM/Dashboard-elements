import { getRoleLabel, type RoleName } from "@/lib/auth";

export type AuditLogFilters = {
  user: string;
  action: string;
  entityType: string;
  dateFrom: string;
  dateTo: string;
};

export type AuditLogRow = {
  id: string;
  user: string;
  role: RoleName | null;
  action: string;
  entityType: string;
  entityId: string | null;
  previousValues: string;
  newValues: string;
  description: string | null;
  createdAt: string;
};

const actionLabels: Record<string, string> = {
  LOGIN: "Inicio de sesión",
  FILE_UPLOAD: "Carga de archivo",
  FILE_VALIDATION: "Validación de archivo",
  UPLOAD_ERRORS: "Errores de carga",
  PREDICTION_EXECUTION: "Ejecución de predicción",
  HUMAN_CORRECTION: "Corrección humana",
  CORRECTION_SUGGESTION: "Sugerencia de corrección",
  FOLLOW_UP_CREATED: "Seguimiento creado",
  FOLLOW_UP_UPDATED: "Seguimiento actualizado",
  CRITICAL_CASE_CLOSED: "Cierre de caso crítico",
  RESULT_EXPORT: "Exportación de resultados",
  USER_PERMISSION_CHANGE: "Cambio de usuario o permisos",
};

export function AuditLogClient({
  filterOptions,
  filters,
  rows,
}: {
  filterOptions: { actions: string[]; entities: string[] };
  filters: AuditLogFilters;
  rows: AuditLogRow[];
}) {
  return (
    <div className="audit-layout">
      <section className="manual-entry-copy">
        <p className="eyebrow">Trazabilidad</p>
        <h1 className="page-title">Auditoría de acciones sensibles</h1>
        <p className="page-description">
          Consulta quién hizo qué, cuándo y sobre qué entidad. Los valores se muestran resumidos
          para evitar duplicar información sensible.
        </p>
      </section>

      <AuditFilters filters={filters} options={filterOptions} />

      <section className="audit-table-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Registros</p>
            <h2>{rows.length} eventos recientes</h2>
          </div>
        </div>
        {rows.length > 0 ? (
          <div className="table-scroll">
            <table className="processed-table audit-table">
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>ID entidad</th>
                  <th>Valor anterior</th>
                  <th>Valor nuevo</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDateTime(row.createdAt)}</td>
                    <td>{row.user}</td>
                    <td>{row.role ? getRoleLabel(row.role) : "No registrado"}</td>
                    <td>{actionLabels[row.action] ?? row.action}</td>
                    <td>{row.entityType}</td>
                    <td className="mono-cell">{row.entityId ?? "No aplica"}</td>
                    <td>{row.previousValues}</td>
                    <td>{row.newValues}</td>
                    <td>{row.description ?? "Sin descripción"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No hay eventos de auditoría con los filtros actuales.</p>
        )}
      </section>
    </div>
  );
}

function AuditFilters({
  filters,
  options,
}: {
  filters: AuditLogFilters;
  options: { actions: string[]; entities: string[] };
}) {
  return (
    <form className="filters-panel">
      <label>
        <span>Usuario</span>
        <input defaultValue={filters.user} name="user" placeholder="Buscar usuario" />
      </label>
      <label>
        <span>Acción</span>
        <select defaultValue={filters.action} name="action">
          <option value="">Todas</option>
          {options.actions.map((action) => (
            <option key={action} value={action}>
              {actionLabels[action] ?? action}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Entidad</span>
        <select defaultValue={filters.entityType} name="entityType">
          <option value="">Todas</option>
          {options.entities.map((entity) => (
            <option key={entity} value={entity}>
              {entity}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Desde</span>
        <input defaultValue={filters.dateFrom} name="dateFrom" type="date" />
      </label>
      <label>
        <span>Hasta</span>
        <input defaultValue={filters.dateTo} name="dateTo" type="date" />
      </label>
      <div className="filters-actions">
        <button className="button-link" type="submit">
          Filtrar
        </button>
        <a className="secondary-button" href="/audit-log">
          Limpiar
        </a>
      </div>
    </form>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
