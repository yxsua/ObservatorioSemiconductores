import { NavLink, Outlet } from "react-router-dom";
import { MODULE_PERMISSIONS } from "@/app/permissions";
import { Can } from "@/features/auth/Can";
import { useAuth } from "@/features/auth/AuthContext";
import styles from "./AdminLayout.module.css";

export function AdminLayout() {
  const { user } = useAuth();
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <NavLink to="/">← Portal público</NavLink>
        <strong>Área interna</strong>
        <span>{user?.firstName} {user?.lastName}</span>
      </header>
      <aside className={styles.sidebar}>
        <nav aria-label="Navegación interna">
          <ul>
            <li><NavLink end to="/admin">Inicio</NavLink></li>
            <Can permission="signals:read-internal">
              <li><NavLink to="/admin/senales">Señales</NavLink></li>
            </Can>
            <Can permission="sources:read-internal">
              <li><NavLink to="/admin/fuentes">Fuentes</NavLink></li>
            </Can>
            <Can permission="trends:read-internal">
              <li><NavLink to="/admin/tendencias">Tendencias</NavLink></li>
            </Can>
            <Can permission="alerts:read-internal">
              <li><NavLink to="/admin/alertas">Alertas</NavLink></li>
            </Can>
            <Can anyOf={MODULE_PERMISSIONS.content}>
              <li><NavLink to="/admin/contenido">Contenido</NavLink></li>
            </Can>
            <Can permission="media:read-internal">
              <li><NavLink to="/admin/medios">Medios</NavLink></li>
            </Can>
          </ul>
        </nav>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
