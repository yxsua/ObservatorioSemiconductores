import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/AuthContext";
import styles from "./AccountPage.module.css";

export function AccountPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { user } = auth;
  if (!user) return null;
  const logout = () => { auth.logout(); navigate("/", { replace: true }); };
  const dateTime = (value?: string | null) => {
    if (!value) return "Sin registro";
    const date = new Date(value);
    return Number.isNaN(date.valueOf())
      ? "Sin registro"
      : new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeStyle: "short" }).format(date);
  };
  return (
    <section className={styles.page} aria-labelledby="account-title">
      <header className={styles.header}><p>Cuenta registrada</p><h1 id="account-title">Mi cuenta</h1><span>Consulta tus datos y accede a las herramientas habilitadas para tu perfil.</span></header>
      <div className={styles.grid}>
        <section className={styles.profile} aria-labelledby="profile-title">
          <h2 id="profile-title">Perfil</h2>
          <dl className={styles.details}>
            <div><dt>Nombre</dt><dd>{user.firstName} {user.lastName}</dd></div>
            <div><dt>Correo</dt><dd>{user.email}</dd></div>
            <div><dt>Ocupación</dt><dd>{user.occupation || "No registrada"}</dd></div>
            <div><dt>Último acceso</dt><dd>{dateTime(user.lastLogin)}</dd></div>
            <div><dt>Cuenta creada</dt><dd>{dateTime(user.createdAt)}</dd></div>
            <div><dt>Estado</dt><dd><span className={styles.active}>Activa</span></dd></div>
          </dl>
        </section>
        <aside className={styles.access} aria-labelledby="access-title">
          <h2 id="access-title">Accesos disponibles</h2>
          {user.permissions.includes("exports:download") ? <><p>Tu cuenta puede exportar las colecciones públicas y consultar su historial.</p><Link className={styles.primaryLink} to="/cuenta/exportaciones">Historial de exportaciones →</Link></> : <p>Tu cuenta no tiene funciones adicionales disponibles.</p>}
          {user.roles.length > 0 && <p className={styles.roles}>Perfiles: {user.roles.join(", ")}</p>}
        </aside>
      </div>
      <details className={styles.permissions}>
        <summary>Permisos efectivos</summary>
        <ul>{user.permissions.map((permission) => (
          <li key={permission}><code>{permission}</code></li>
        ))}</ul>
      </details>
      <div className={styles.sessionActions}><Button onClick={logout}>Cerrar sesión en este dispositivo</Button></div>
    </section>
  );
}
