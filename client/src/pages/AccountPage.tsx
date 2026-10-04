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
      <header className={styles.header}><p>Tu espacio en el Observatorio</p><h1 id="account-title">Mi cuenta</h1><span>Hola, {user.firstName}. Aquí puedes consultar tus datos y continuar explorando el Observatorio.</span></header>
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
          <h2 id="access-title">Continúa explorando</h2>
          {user.permissions.includes("exports:download") ? <><p>Consulta y descarga de nuevo tus exportaciones.</p><Link className={styles.primaryLink} to="/cuenta/exportaciones">Historial de exportaciones →</Link></> : <p>Explora las noticias, publicaciones e indicadores del Observatorio.</p>}
          <Link className={styles.primaryLink} to="/noticias">Explorar noticias</Link><Link className={styles.primaryLink} to="/publicaciones">Ver publicaciones</Link>
        </aside>
      </div>
      <div className={styles.sessionActions}><Button onClick={logout}>Cerrar sesión en este dispositivo</Button></div>
    </section>
  );
}
