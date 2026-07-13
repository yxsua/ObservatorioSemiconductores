import { Outlet } from "react-router-dom";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

function DashboardLayout() {
  const { isLoading, logout, user } = useAuth();

  return (
    <div className="app-shell">
      <Navbar isSessionLoading={isLoading} onLogout={logout} user={user} />

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
