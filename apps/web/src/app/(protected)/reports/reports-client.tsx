type RiskTrend = "up" | "down" | "stable";

export type CommercialFilters = {
  dateFrom: string;
  dateTo: string;
  client: string;
  product: string;
  cause: string;
  riskTrend: string;
};

export type CommercialMetrics = {
  totalReviews: number;
  highRiskReviews: number;
  mediumRiskReviews: number;
  manualReviewReviews: number;
  highRiskPercentage: number;
};

export type CommercialMonthlyRiskRow = {
  month: string;
  total: number;
  high: number;
  medium: number;
  low: number;
  manualReview: number;
  highRiskPercentage: number;
  trend: RiskTrend;
};

export type CommercialClientRiskRow = {
  id: string;
  client: string;
  score: number;
  totalReviews: number;
  highRiskReviews: number;
  latestReviewDate: string;
  mainCause: string;
};

export type CommercialDistributionRow = {
  label: string;
  count: number;
  percentage: number;
};

export type CommercialTrendIndicators = {
  riskDirection: RiskTrend;
  riskMessage: string;
  volumeDirection: RiskTrend;
  volumeMessage: string;
};

const trendLabels: Record<RiskTrend, string> = {
  up: "Al alza",
  down: "A la baja",
  stable: "Estable",
};

export function CommercialReportsClient({
  causes,
  clients,
  filterOptions,
  filters,
  metrics,
  monthlyRiskEvolution,
  productDistribution,
  sourceDistribution,
  trendIndicators,
}: {
  causes: CommercialDistributionRow[];
  clients: CommercialClientRiskRow[];
  filterOptions: {
    products: string[];
    causes: string[];
  };
  filters: CommercialFilters;
  metrics: CommercialMetrics;
  monthlyRiskEvolution: CommercialMonthlyRiskRow[];
  productDistribution: CommercialDistributionRow[];
  sourceDistribution: CommercialDistributionRow[];
  trendIndicators: CommercialTrendIndicators;
}) {
  return (
    <div className="commercial-layout">
      <section className="manual-entry-copy">
        <p className="eyebrow">Dirección Comercial</p>
        <h1 className="page-title">Panorama ejecutivo de riesgo</h1>
        <p className="page-description">
          Vista de solo consulta para identificar evolución de riesgo, concentración por cliente y
          causas prioritarias para decisiones estratégicas.
        </p>
      </section>

      <CommercialFilters filters={filters} options={filterOptions} />

      <section className="commercial-metrics">
        <Metric label="Volumen total de reseñas" value={metrics.totalReviews} />
        <Metric
          helper={`${metrics.highRiskReviews} reseñas`}
          label="Proporción de riesgo alto"
          tone={metrics.highRiskPercentage >= 25 ? "risk" : "neutral"}
          value={`${metrics.highRiskPercentage}%`}
        />
        <Metric label="Riesgo medio" value={metrics.mediumRiskReviews} />
        <Metric label="Revisión manual" value={metrics.manualReviewReviews} />
      </section>

      <section className="commercial-trend-grid">
        <TrendCard
          direction={trendIndicators.riskDirection}
          label="Tendencia de riesgo"
          message={trendIndicators.riskMessage}
        />
        <TrendCard
          direction={trendIndicators.volumeDirection}
          label="Tendencia de volumen"
          message={trendIndicators.volumeMessage}
        />
      </section>

      <section className="commercial-main-grid">
        <MonthlyEvolutionPanel rows={monthlyRiskEvolution} />
        <ClientRiskPanel rows={clients} />
      </section>

      <section className="commercial-distribution-grid">
        <DistributionPanel rows={causes} title="Causas más frecuentes" />
        <DistributionPanel rows={productDistribution} title="Distribución por producto" />
        <DistributionPanel rows={sourceDistribution} title="Distribución por fuente" />
      </section>
    </div>
  );
}

function CommercialFilters({
  filters,
  options,
}: {
  filters: CommercialFilters;
  options: { products: string[]; causes: string[] };
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
        <span>Cliente</span>
        <input defaultValue={filters.client} name="client" placeholder="Buscar cliente" />
      </label>
      <label>
        <span>Producto</span>
        <select defaultValue={filters.product} name="product">
          <option value="">Todos</option>
          {options.products.map((product) => (
            <option key={product} value={product}>
              {product}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Causa</span>
        <select defaultValue={filters.cause} name="cause">
          <option value="">Todas</option>
          {options.causes.map((cause) => (
            <option key={cause} value={cause}>
              {cause}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Tendencia de riesgo</span>
        <select defaultValue={filters.riskTrend} name="riskTrend">
          <option value="">Todas</option>
          <option value="up">Al alza</option>
          <option value="down">A la baja</option>
          <option value="stable">Estable</option>
        </select>
      </label>
      <div className="filters-actions">
        <button className="button-link" type="submit">
          Filtrar
        </button>
        <a className="secondary-button" href="/reports">
          Limpiar
        </a>
      </div>
    </form>
  );
}

function Metric({
  helper,
  label,
  tone = "neutral",
  value,
}: {
  helper?: string;
  label: string;
  tone?: "neutral" | "risk";
  value: number | string;
}) {
  return (
    <article className={tone === "risk" ? "risk" : undefined}>
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </article>
  );
}

function TrendCard({
  direction,
  label,
  message,
}: {
  direction: RiskTrend;
  label: string;
  message: string;
}) {
  return (
    <article className={`commercial-trend-card ${direction}`}>
      <div>
        <span>{label}</span>
        <strong>{trendLabels[direction]}</strong>
      </div>
      <p>{message}</p>
    </article>
  );
}

function MonthlyEvolutionPanel({ rows }: { rows: CommercialMonthlyRiskRow[] }) {
  const maxTotal = Math.max(...rows.map((row) => row.total), 1);
  return (
    <article className="commercial-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Evolución</p>
          <h2>Riesgo mensual</h2>
        </div>
      </div>
      {rows.length > 0 ? (
        <div className="monthly-risk-list">
          {rows.map((row) => (
            <div key={row.month}>
              <div>
                <strong>{formatMonth(row.month)}</strong>
                <span>{row.total} reseñas · {row.highRiskPercentage}% alto</span>
              </div>
              <div className="monthly-risk-bar">
                <i className="high" style={{ width: `${(row.high / maxTotal) * 100}%` }} />
                <i className="medium" style={{ width: `${(row.medium / maxTotal) * 100}%` }} />
                <i className="low" style={{ width: `${(row.low / maxTotal) * 100}%` }} />
                <i className="manual" style={{ width: `${(row.manualReview / maxTotal) * 100}%` }} />
              </div>
              <em className={row.trend}>{trendLabels[row.trend]}</em>
            </div>
          ))}
        </div>
      ) : (
        <p>No hay evolución mensual con los filtros actuales.</p>
      )}
    </article>
  );
}

function ClientRiskPanel({ rows }: { rows: CommercialClientRiskRow[] }) {
  return (
    <article className="commercial-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Concentración</p>
          <h2>Clientes con mayor riesgo</h2>
        </div>
      </div>
      {rows.length > 0 ? (
        <div className="commercial-client-list">
          {rows.map((row) => (
            <div key={row.id}>
              <div>
                <strong>{row.client}</strong>
                <span>{row.mainCause}</span>
              </div>
              <dl>
                <div>
                  <dt>Puntaje</dt>
                  <dd>{row.score}</dd>
                </div>
                <div>
                  <dt>Alto riesgo</dt>
                  <dd>{row.highRiskReviews}</dd>
                </div>
                <div>
                  <dt>Última reseña</dt>
                  <dd>{formatDate(row.latestReviewDate)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      ) : (
        <p>No hay clientes con datos en el periodo seleccionado.</p>
      )}
    </article>
  );
}

function DistributionPanel({ rows, title }: { rows: CommercialDistributionRow[]; title: string }) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  return (
    <article className="commercial-panel">
      <h2>{title}</h2>
      {rows.length > 0 ? (
        <div className="commercial-bars">
          {rows.map((row) => (
            <div key={row.label}>
              <span>{row.label}</span>
              <div>
                <i style={{ width: `${Math.max((row.count / max) * 100, 6)}%` }} />
              </div>
              <strong>{row.count}</strong>
              <small>{row.percentage}%</small>
            </div>
          ))}
        </div>
      ) : (
        <p>Sin datos para esta distribución.</p>
      )}
    </article>
  );
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("es-MX", { month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${value}-01T00:00:00.000Z`),
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}
