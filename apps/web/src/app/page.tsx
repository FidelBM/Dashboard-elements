import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const mlApiUrl = process.env.NEXT_PUBLIC_ML_API_URL;
  const databaseUrl = process.env.DATABASE_URL;

  return (
    <main className="shell">
      <section className="status-panel">
        <p className="eyebrow">V1 scaffold</p>
        <h1>Supply Chain Review Intelligence</h1>
        <p>
          Base local lista para Next.js, FastAPI, PostgreSQL, Prisma y Docker Compose.
        </p>
        <Link className="button-link hero-link" href="/login">
          Entrar al prototipo
        </Link>
        <dl className="config-list" aria-label="Estado de configuracion local">
          <div>
            <dt>Frontend</dt>
            <dd>En ejecucion</dd>
          </div>
          <div>
            <dt>ML API URL</dt>
            <dd>{mlApiUrl ? `Configurada: ${mlApiUrl}` : "No configurada"}</dd>
          </div>
          <div>
            <dt>Database URL</dt>
            <dd>{databaseUrl ? "Configurada" : "No configurada"}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
