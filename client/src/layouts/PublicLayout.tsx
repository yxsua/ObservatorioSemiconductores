import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { INTERNAL_PERMISSIONS } from "@/app/permissions";
import { NAVIGATION_GROUPS } from "@/app/public-modules";
import { RouteMetadata } from "@/components/navigation/RouteMetadata";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/AuthContext";
import logoUrl from "@/assets/logo-white-background.jpeg";
import styles from "./PublicLayout.module.css";

export function PublicLayout() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const logout = () => {
    auth.logout();
    navigate("/", { replace: true });
  };

  return (
    <div className={styles.shell}>
      <RouteMetadata />
      <a className={styles.skipLink} href="#main-content">Saltar al contenido</a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link aria-label="Observatorio de Semiconductores, inicio" className={styles.brand} to="/">
            <img alt="" aria-hidden="true" className={styles.brandLogo} src={logoUrl} />
          </Link>
          <button
            aria-controls="public-navigation"
            aria-expanded={menuOpen}
            className={styles.menuToggle}
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <span>{menuOpen ? "Cerrar" : "Menú"}</span>
            <span aria-hidden="true" className={styles.menuIcon}>{menuOpen ? "×" : "☰"}</span>
          </button>
          <div
            className={`${styles.navigationPanel} ${menuOpen ? styles.navigationPanelOpen : ""}`}
            id="public-navigation"
          >
            <nav aria-label="Navegación principal">
              <ul className={styles.navigation}>
                <li>
                  <NavLink className={({ isActive }) => isActive ? styles.active : undefined} end to="/">
                    Inicio
                  </NavLink>
                </li>
                <li><NavLink className={({ isActive }) => isActive ? styles.active : undefined} to="/dashboard">Dashboard</NavLink></li>
                {NAVIGATION_GROUPS.slice(0, 1).map((group) => <li className={styles.menuGroup} key={group.id}>
                  <NavLink className={({ isActive }) => isActive ? styles.active : undefined} to={group.path}>{group.label}</NavLink>
                  <ul className={styles.submenu}>{group.items.map((item) => <li key={item.path}><NavLink to={item.path}>{item.label}</NavLink></li>)}</ul>
                </li>)}
                <li><NavLink className={({ isActive }) => isActive ? styles.active : undefined} to="/noticias">Noticias</NavLink></li>
                <li><NavLink className={({ isActive }) => isActive ? styles.active : undefined} to="/publicaciones">Publicaciones</NavLink></li>
                <li><NavLink className={({ isActive }) => isActive ? styles.active : undefined} to="/eventos">Eventos</NavLink></li>
                <li><NavLink className={({ isActive }) => isActive ? styles.active : undefined} to="/recursos">Recursos</NavLink></li>
                {NAVIGATION_GROUPS.slice(1).map((group) => <li className={styles.menuGroup} key={group.id}>
                  <NavLink className={({ isActive }) => `${isActive ? styles.active : ""} ${styles.surveillanceLink}`} to={group.path}>{group.label}</NavLink>
                  <ul className={`${styles.submenu} ${styles.submenuRight}`}>{group.items.map((item) => <li key={item.path}><NavLink to={item.path}>{item.label}</NavLink></li>)}</ul>
                </li>)}
              </ul>
            </nav>
            <div className={styles.accountActions}>
              {auth.status === "authenticated" ? (
                <>
                  {auth.hasAnyPermission(INTERNAL_PERMISSIONS) && (
                    <NavLink to="/admin">Área interna</NavLink>
                  )}
                  <NavLink to="/cuenta">Mi cuenta</NavLink>
                  <Button onClick={logout}>Cerrar sesión</Button>
                </>
              ) : (
                <>
                  <NavLink to="/iniciar-sesion">Iniciar sesión</NavLink>
                  <NavLink className={styles.registerLink} to="/registro">Crear cuenta</NavLink>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className={styles.main} id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerIntro}>
            <strong>Observatorio de Semiconductores</strong>
            <p>Información confiable para comprender el sector y apoyar la toma de decisiones.</p>
          </div>
          <nav aria-label="Módulos del observatorio" className={styles.footerNavigation}>
            <strong>Módulos</strong>
            <ul>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/industria">Industria de semiconductores</Link></li>
              <li><Link to="/noticias">Noticias</Link></li>
              <li><Link to="/publicaciones">Publicaciones e informes</Link></li>
              <li><Link to="/eventos">Eventos y convocatorias</Link></li>
              <li><Link to="/recursos">Recursos y bases de datos</Link></li>
              <li><Link to="/vigilancia">Vigilancia tecnológica</Link></li>
            </ul>
          </nav>
          <nav aria-label="Recursos del portal" className={styles.footerNavigation}>
            <strong>Explorar</strong>
            <ul>
              <li><Link to="/contenido">Todo el contenido</Link></li>
              <li><Link to="/senales">Señales</Link></li>
              <li><Link to="/tendencias">Tendencias</Link></li>
              <li><Link to="/alertas">Alertas</Link></li>
              <li><Link to="/acerca-de">Acerca del equipo</Link></li>
            </ul>
          </nav>
        </div>
        <div className={styles.footerLegal}>
          <span>Observatorio de Semiconductores</span>
          <span><Link to="/terminos">Términos de servicio</Link> · <Link to="/privacidad">Privacidad</Link></span>
        </div>
      </footer>
    </div>
  );
}
