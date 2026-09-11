import { Link } from "react-router-dom";
import { MODULE_PERMISSIONS } from "@/app/permissions";
import { Can } from "@/features/auth/Can";
import styles from "./AdminIndexPage.module.css";

export function AdminIndexPage() {
  return (
    <section aria-labelledby="admin-title">
      <h1 id="admin-title">Área interna</h1>
      <p className={styles.intro}>Selecciona un módulo disponible para tu cuenta.</p>
      <div className={styles.modules}>
        <Can permission="data:read-internal"><Link to="/admin/datos/indicators"><strong>Datos del observatorio</strong><span>Indicadores, actores, inversiones, eventos y recursos.</span></Link></Can>
        <Can permission="signals:read-internal">
          <Link to="/admin/senales"><strong>Señales</strong><span>Captura y revisión.</span></Link>
        </Can>
        <Can permission="sources:read-internal">
          <Link to="/admin/fuentes"><strong>Fuentes</strong><span>Registro y canales de consulta.</span></Link>
        </Can>
        <Can permission="trends:read-internal">
          <Link to="/admin/tendencias"><strong>Tendencias</strong><span>Análisis y relaciones.</span></Link>
        </Can>
        <Can permission="alerts:read-internal">
          <Link to="/admin/alertas"><strong>Alertas</strong><span>Evidencia y publicación.</span></Link>
        </Can>
        <Can anyOf={MODULE_PERMISSIONS.content}>
          <Link to="/admin/contenido"><strong>Contenido</strong><span>Edición y publicación.</span></Link>
        </Can>
        <Can permission="media:read-internal">
          <Link to="/admin/medios"><strong>Medios</strong><span>Imágenes y archivos editoriales.</span></Link>
        </Can>
      </div>
    </section>
  );
}
