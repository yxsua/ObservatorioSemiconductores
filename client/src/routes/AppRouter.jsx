import { BrowserRouter, Route, Routes } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import AlertsPage from "../pages/alerts/AlertsPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ContentPage from "../pages/content/ContentPage";
import DashboardHome from "../pages/dashboard/DashboardHome";
import LandingPage from "../pages/LandingPage";
import NotFoundPage from "../pages/NotFoundPage";
import SignalsPage from "../pages/signals/SignalsPage";
import SourcesPage from "../pages/sources/SourcesPage";
import TrendsPage from "../pages/trends/TrendsPage";
import PublicOnlyRoute from "./PublicOnlyRoute";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<LandingPage />} />

          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/signals" element={<SignalsPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/content" element={<ContentPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
