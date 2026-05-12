export default function ProtectedLoading() {
  return (
    <main className="protected-shell">
      <section className="manual-entry-copy">
        <p className="eyebrow">Cargando</p>
        <h1 className="page-title">Preparando la vista</h1>
        <p className="page-description">
          Estamos consultando la información de la demo. Esto puede tardar unos segundos si la base
          acaba de iniciar.
        </p>
      </section>
    </main>
  );
}
