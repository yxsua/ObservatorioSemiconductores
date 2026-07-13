import { NavLink } from "react-router-dom";

const defaultItems = [
  { label: "Dashboard", href: "/dashboard", roles: ["admin", "analyst", "editor"] },
  { label: "Fuentes", href: "/sources", roles: ["admin", "analyst"] },
  { label: "Senales", href: "/signals", roles: ["admin", "analyst"] },
  { label: "Tendencias", href: "/trends", roles: ["admin", "analyst"] },
  { label: "Alertas", href: "/alerts", roles: ["admin", "analyst"] },
  { label: "Contenido", href: "/content", roles: ["admin", "editor"] },
  { label: "Usuarios", href: "/users", roles: ["admin"] },
];

function Sidebar({
  user,
  items = defaultItems,
  currentPath = "",
  onLogout,
}) {
  const userRoles = user?.roles ?? (user?.role ? [user.role] : []);
  const visibleItems = items.filter((item) => {
    if (!item.roles?.length) return true;
    return item.roles.some((role) => userRoles.includes(role));
  });

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav" aria-label="Navegacion principal">
        {visibleItems.map((item) => {
          const isActive = currentPath === item.href;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={`sidebar-link${isActive ? " is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </NavLink>
          );
        })}

        {onLogout && (
          <button type="button" className="sidebar-button" onClick={onLogout}>
            Cerrar sesion
          </button>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
