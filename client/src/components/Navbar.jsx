import { NavLink } from "react-router-dom";

import { Link } from "react-router-dom";
import navigationItems from "../routes/navigation";

function Navbar({
  title = "Observatorio de Semiconductores",
  items = navigationItems,
  isSessionLoading = false,
  onLogout,
  user,
}) {
  const displayName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email
    : null;

  return (
    <header className="navbar">
      <NavLink className="navbar-brand" to="/">
        <span className="brand-mark" aria-hidden="true">
          OS
        </span>
        <span>
          <strong>{title}</strong>
          <small>Vigilancia tecnologica</small>
        </span>
      </NavLink>

      <nav className="navbar-nav" aria-label="Navegacion principal">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `navbar-link${isActive ? " is-active" : ""}`
            }
            end={item.path === "/"}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="navbar-actions">
        {isSessionLoading ? (
          <span className="navbar-user">Sesion...</span>
        ) : displayName ? (
          <div className="auth-menu">
            <span className="navbar-user">{displayName}</span>
            <button type="button" className="auth-button" onClick={onLogout}>
              Salir
            </button>
          </div>
        ) : (
          <Link className="auth-button" to="/login">
            Iniciar sesion
          </Link>
        )}
      </div>
    </header>
  );
}

export default Navbar;
