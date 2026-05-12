import { demoUsers } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="login-shell">
      <section className="login-panel">
        <p className="eyebrow">Acceso prototipo</p>
        <h1 className="page-title">Iniciar sesion</h1>
        <p className="page-description">
          Selecciona un usuario demo para entrar con permisos de rol. La autenticacion real se
          implementara en una fase posterior.
        </p>
        {params?.error ? (
          <p className="form-error">No se pudo iniciar sesion con el rol seleccionado.</p>
        ) : null}
        <form action="/api/auth/login" method="post" className="login-form">
          <input name="next" type="hidden" value={params?.next ?? "/dashboard"} />
          <label htmlFor="role">Usuario demo</label>
          <select id="role" name="role" required>
            {demoUsers.map((user) => (
              <option key={user.role} value={user.role}>
                {user.name} - {user.roleLabel}
              </option>
            ))}
          </select>
          <button type="submit">Entrar</button>
        </form>
      </section>
    </main>
  );
}
