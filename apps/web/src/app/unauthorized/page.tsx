import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="login-shell">
      <section className="login-panel">
        <p className="eyebrow">Acceso restringido</p>
        <h1 className="page-title">No tienes permiso para esta vista</h1>
        <p className="page-description">
          La navegacion se limita por rol para mantener claras las responsabilidades de V1.
        </p>
        <div className="action-row">
          <Link className="button-link" href="/dashboard">
            Volver al dashboard
          </Link>
          <form action="/api/auth/logout" method="post">
            <button className="secondary-button" type="submit">
              Cambiar usuario
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
