import {
  calculateAccumulatedCustomerRisk,
  type AccumulatedClientRiskStatus,
} from "@/lib/customer-risk";
import { prisma } from "@/lib/prisma";

const statusLabels: Record<AccumulatedClientRiskStatus, string> = {
  CRITICAL: "Crítico",
  WATCHLIST: "En observación",
  STABLE: "Estable",
  MANUAL_REVIEW: "Revisar manualmente",
};

const statusPriority: Record<AccumulatedClientRiskStatus, number> = {
  CRITICAL: 0,
  WATCHLIST: 1,
  MANUAL_REVIEW: 2,
  STABLE: 3,
};

export default async function CriticalClientsPage() {
  const referenceDate = new Date();
  const windowStart = new Date(referenceDate);
  windowStart.setUTCDate(windowStart.getUTCDate() - 90);

  const clients = await prisma.client.findMany({
    include: {
      reviews: {
        where: {
          reviewDate: {
            gte: windowStart,
            lte: referenceDate,
          },
          prediction: {
            isNot: null,
          },
        },
        include: {
          prediction: true,
        },
        orderBy: {
          reviewDate: "desc",
        },
      },
    },
  });

  const rows = clients
    .map((client) => {
      const risk = calculateAccumulatedCustomerRisk(
        client.reviews
          .filter((review) => review.prediction)
          .map((review) => ({
            reviewDate: review.reviewDate,
            riskLabel: review.prediction!.riskLabel,
            npsScore: review.npsScore,
            primaryCause: review.prediction!.primaryCause,
            detectedSignals: review.prediction!.detectedSignals,
          })),
        referenceDate,
      );

      return {
        id: client.id,
        name: client.name,
        externalRef: client.externalRef,
        ...risk,
      };
    })
    .sort(
      (a, b) =>
        statusPriority[a.status] - statusPriority[b.status] ||
        b.totalScore - a.totalScore ||
        a.name.localeCompare(b.name),
    );

  const summary = {
    critical: rows.filter((row) => row.status === "CRITICAL").length,
    watchlist: rows.filter((row) => row.status === "WATCHLIST").length,
    manualReview: rows.filter((row) => row.status === "MANUAL_REVIEW").length,
    total: rows.length,
  };

  return (
    <div className="critical-clients-layout">
      <section className="manual-entry-copy">
        <p className="eyebrow">Priorización</p>
        <h1 className="page-title">Clientes críticos</h1>
        <p className="page-description">
          Riesgo acumulado calculado con reseñas de los últimos 90 días. Los clientes críticos
          aparecen primero para facilitar la priorización de Customer Success.
        </p>
      </section>

      <section className="critical-summary-grid">
        <SummaryCard label="Clientes críticos" value={summary.critical} />
        <SummaryCard label="En observación" value={summary.watchlist} />
        <SummaryCard label="Revisión manual" value={summary.manualReview} />
        <SummaryCard label="Clientes evaluados" value={summary.total} />
      </section>

      <section className="critical-client-list">
        {rows.length > 0 ? (
          rows.map((row) => (
            <article className={`critical-client-card status-${row.status.toLowerCase()}`} key={row.id}>
              <div className="critical-client-header">
                <div>
                  <p className="eyebrow">{statusLabels[row.status]}</p>
                  <h2>{row.name}</h2>
                  {row.externalRef ? <span>{row.externalRef}</span> : null}
                </div>
                <strong>{row.totalScore} pts</strong>
              </div>

              <div className="critical-metrics">
                <Metric label="Reseñas consideradas" value={row.reviewsConsidered} />
                <Metric label="Causas acumuladas" value={row.mainAccumulatedCauses.length} />
                <Metric label="Señales críticas" value={row.detectedCriticalSignals.length} />
              </div>

              <SectionList
                emptyLabel="Sin causa dominante"
                label="Causas principales acumuladas"
                values={row.mainAccumulatedCauses}
              />
              <SectionList
                emptyLabel="Sin señales críticas detectadas"
                label="Señales críticas detectadas"
                values={row.detectedCriticalSignals}
              />

              <div className="customer-recommendation">
                <h3>Recomendación para Customer Success</h3>
                <p>{row.recommendation}</p>
              </div>
            </article>
          ))
        ) : (
          <div className="upload-table-card">
            <p>No hay clientes con reseñas procesadas en los últimos 90 días.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="critical-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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

function SectionList({
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
