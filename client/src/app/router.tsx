import {
  createBrowserRouter,
  type RouteObject
} from "react-router-dom";
import { INTERNAL_PERMISSIONS } from "./permissions";
import { PUBLIC_MODULES } from "./public-modules";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { RequireAnyPermission } from "@/features/auth/RequireAnyPermission";
import { SignalDetailPage } from "@/features/signals/SignalDetailPage";
import { SignalsListPage } from "@/features/signals/SignalsListPage";
import { TrendDetailPage } from "@/features/trends/TrendDetailPage";
import { TrendsListPage } from "@/features/trends/TrendsListPage";
import { AlertDetailPage } from "@/features/alerts/AlertDetailPage";
import { AlertsListPage } from "@/features/alerts/AlertsListPage";
import { ContentIndexPage } from "@/features/content/ContentIndexPage";
import { ContentDetailPage } from "@/features/content/ContentDetailPage";
import { ExportHistoryPage } from "@/features/exports/ExportHistoryPage";
import { AccountPage } from "@/pages/AccountPage";
import { AdminIndexPage } from "@/pages/AdminIndexPage";
import { HomePage } from "@/pages/HomePage";
import { AboutPage } from "@/pages/AboutPage";
import { SurveillancePage } from "@/pages/SurveillancePage";
import { ObservatoryModulePage } from "@/pages/ObservatoryModulePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PermissionDeniedPage } from "@/pages/PermissionDeniedPage";
import { RouteErrorPage } from "@/pages/RouteErrorPage";
import { PageFeedback } from "@/components/feedback/PageFeedback";

export const appRoutes: RouteObject[] = [
  {
    element: <PublicLayout />,
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <PageFeedback title="Cargando observatorio" message="Preparando la ruta solicitada." />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "dashboard", lazy: async () => ({ Component: (await import('@/features/observatory/DashboardPage')).DashboardPage }) },
      { path: "industria", element: <ObservatoryModulePage kind="industry" /> },
      ...(['indicators','ecosystem','investments','events','resources'] as const).map(kind => ({
        path: ({indicators:'indicadores-pertinencia',ecosystem:'ecosistema-regional',investments:'inversiones',events:'eventos',resources:'recursos'})[kind],
        lazy: async () => {const {DataListPage}=await import('@/features/observatory/PublicDataPage');return {Component:()=> <DataListPage kind={kind}/>};}
      })),
      { path: "datos/:kind/:id", lazy: async () => ({ Component: (await import('@/features/observatory/PublicDataPage')).DataDetailPage }) },
      { path: "cadena-de-valor", element: <ObservatoryModulePage kind="value-chain" /> },
      { path: "buscador", lazy: async () => ({ Component: (await import('@/features/observatory/SearchPage')).SearchPage }) },
      { path: "acerca-de", element: <AboutPage /> },
      { path: "vigilancia", element: <SurveillancePage /> },
      ...PUBLIC_MODULES.filter(module => module.source.kind === 'collection').map((module) => ({
        path: module.path.slice(1),
        element: module.source.kind === "collection"
          ? <ContentIndexPage description={module.description} eyebrow="Módulo del observatorio" lockedType={module.source.contentType} title={module.label} />
          : module.source.kind === "page"
            ? <ContentDetailPage slug={module.source.slug} />
            : <SurveillancePage />
      })),
      { path: "contenido", element: <ContentIndexPage /> },
      { path: "contenido/:slug", element: <ContentDetailPage /> },
      { path: "senales", element: <SignalsListPage /> },
      { path: "senales/:id", element: <SignalDetailPage /> },
      { path: "tendencias", element: <TrendsListPage /> },
      { path: "tendencias/:id", element: <TrendDetailPage /> },
      { path: "alertas", element: <AlertsListPage /> },
      { path: "alertas/:id", element: <AlertDetailPage /> },
      { path: "iniciar-sesion", lazy:async()=>({Component:(await import("@/features/auth/LoginPage")).LoginPage}) },
      { path: "registro", lazy:async()=>({Component:(await import("@/features/auth/RegisterPage")).RegisterPage}) },
      ...(['terms','privacy'] as const).map(kind=>({path:kind==='terms'?'terminos':'privacidad',lazy:async()=>{const {LegalPage}=await import('@/features/legal/LegalPage');return {Component:()=> <LegalPage kind={kind}/>};}})),
      {path:'recuperar-contrasena',lazy:async()=>({Component:(await import('@/features/auth/PasswordRecoveryPage')).ForgotPasswordPage})},
      {path:'restablecer-contrasena',lazy:async()=>({Component:(await import('@/features/auth/PasswordRecoveryPage')).ResetPasswordPage})},
      { path: "sin-permiso", element: <PermissionDeniedPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: "cuenta", element: <AccountPage /> },
          {
            element: <RequireAnyPermission permissions={["exports:download"]} />,
            children: [{
              path: "cuenta/exportaciones",
              element: <ExportHistoryPage />
            }]
          }
        ]
      },
      { path: "*", element: <NotFoundPage /> }
    ]
  },
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <PageFeedback title="Cargando área interna" message="Preparando herramientas y permisos." />,
    children: [{
      element: <RequireAnyPermission permissions={INTERNAL_PERMISSIONS} />,
      children: [{
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminIndexPage /> },
          { path: 'datos/:kind', element: <RequireAnyPermission permissions={['data:read-internal']}/>, children: [
            { index: true, lazy: async()=>({Component:(await import('@/features/observatory/AdminDataPage')).AdminDataPage}) },
            { path: ':id', lazy: async()=>({Component:(await import('@/features/observatory/AdminDataPage')).AdminDataPage}) }
          ] },
          { path: "senales/nueva", element: <RequireAnyPermission permissions={["signals:create"]} />, children: [{ index: true, lazy: async () => ({ Component: (await import("@/features/admin/signals/SignalFormPage")).CreateSignalFormPage }) }] },
          { path: "senales/:id/editar", element: <RequireAnyPermission permissions={["signals:read-internal"]} />, children: [{ element: <RequireAnyPermission permissions={["signals:update-own", "signals:update-any"]} />, children: [{ index: true, lazy: async () => ({ Component: (await import("@/features/admin/signals/SignalFormPage")).EditSignalFormPage }) }] }] },
          { path: "senales", element: <RequireAnyPermission permissions={["signals:read-internal"]} />, children: [{ index: true, lazy: async () => ({ Component: (await import("@/features/admin/AdminEntityPage")).SignalsAdminPage }) }, { path: ":id", lazy: async () => ({ Component: (await import("@/features/admin/AdminEntityPage")).SignalsAdminPage }) }] },
          { path: "fuentes/nueva", element: <RequireAnyPermission permissions={["sources:create"]} />, children: [{ index: true, lazy: async () => ({ Component: (await import("@/features/admin/sources/SourceFormPage")).CreateSourceFormPage }) }] },
          { path: "fuentes/:id/editar", element: <RequireAnyPermission permissions={["sources:update"]} />, children: [{ index: true, lazy: async () => ({ Component: (await import("@/features/admin/sources/SourceFormPage")).EditSourceFormPage }) }] },
          { path: "fuentes", element: <RequireAnyPermission permissions={["sources:read-internal"]} />, children: [{ index: true, lazy: async () => ({ Component: (await import("@/features/admin/sources/SourcesPage")).SourcesPage }) }, { path: ":id", lazy: async () => ({ Component: (await import("@/features/admin/sources/SourcesPage")).SourcesPage }) }] },
          { path: "tendencias/nueva", element: <RequireAnyPermission permissions={["trends:create"]} />, children: [{ index: true, lazy: async () => ({ Component: (await import("@/features/admin/trends/TrendFormPage")).CreateTrendFormPage }) }] },
          { path: "tendencias/:id/editar", element: <RequireAnyPermission permissions={["trends:update"]} />, children: [{ index: true, lazy: async () => ({ Component: (await import("@/features/admin/trends/TrendFormPage")).EditTrendFormPage }) }] },
          { path: "tendencias", element: <RequireAnyPermission permissions={["trends:read-internal"]} />, children: [{ index: true, lazy: async () => ({ Component: (await import("@/features/admin/AdminEntityPage")).TrendsAdminPage }) }, { path: ":id", lazy: async () => ({ Component: (await import("@/features/admin/AdminEntityPage")).TrendsAdminPage }) }] },
          { path: "alertas/nueva", element: <RequireAnyPermission permissions={["alerts:create"]} />, children: [{ index: true, lazy: async () => ({ Component: (await import("@/features/admin/alerts/AlertFormPage")).CreateAlertFormPage }) }] },
          { path: "alertas/:id/editar", element: <RequireAnyPermission permissions={["alerts:update"]} />, children: [{ index: true, lazy: async () => ({ Component: (await import("@/features/admin/alerts/AlertFormPage")).EditAlertFormPage }) }] },
          { path: "alertas", element: <RequireAnyPermission permissions={["alerts:read-internal"]} />, children: [{ index: true, lazy: async () => ({ Component: (await import("@/features/admin/AdminEntityPage")).AlertsAdminPage }) }, { path: ":id", lazy: async () => ({ Component: (await import("@/features/admin/AdminEntityPage")).AlertsAdminPage }) }] },
          { path: "contenido/nuevo", element: <RequireAnyPermission permissions={["content:create"]} />, children: [{ index: true, lazy: async () => ({ Component: (await import("@/features/admin/content/ContentFormPage")).CreateContentPage }) }] },
          { path: "contenido/:id/editar", element: <RequireAnyPermission permissions={["content:update"]} />, children: [{ index: true, lazy: async () => ({ Component: (await import("@/features/admin/content/ContentFormPage")).EditContentPage }) }] },
          { path: "contenido/:id/preview", element: <RequireAnyPermission permissions={["content:read-internal"]} />, children: [{ index: true, lazy: async () => ({ Component: (await import("@/features/admin/content/ContentPreviewPage")).ContentPreviewPage }) }] },
          { path: "contenido/:id/composicion", element: <RequireAnyPermission permissions={["content:update"]} />, children: [{ index: true, lazy: async () => ({ Component: (await import("@/features/admin/content/CompositionBuilderPage")).CompositionBuilderPage }) }] },
          { path: "contenido", element: <RequireAnyPermission permissions={["content:read-internal"]} />, children: [{ index: true, lazy: async () => ({ Component: (await import("@/features/admin/content/ContentAdminPage")).ContentAdminPage }) }, { path: ":id", lazy: async () => ({ Component: (await import("@/features/admin/content/ContentAdminPage")).ContentAdminPage }) }] },
          { path: "medios", element: <RequireAnyPermission permissions={["media:read-internal"]} />, children: [{ index: true, lazy: async () => ({ Component: (await import("@/features/admin/media/MediaAdminPage")).MediaAdminPage }) }] }
        ]
      }]
    }]
  }
];

export const appRouter = createBrowserRouter(appRoutes);
