import { MediaLibrary } from "./MediaLibrary";import styles from "./MediaLibrary.module.css";
export function MediaAdminPage(){return <section className={styles.page}><header className={styles.header}><div><h1>Medios editoriales</h1><p>Administra imágenes y archivos reutilizables en las publicaciones.</p></div></header><MediaLibrary/></section>}
