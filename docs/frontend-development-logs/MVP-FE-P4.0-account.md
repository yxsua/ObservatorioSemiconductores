# FE-P4.0 — Cuenta

**Estado:** cerrado  
**Fecha:** 13 de julio de 2026

## Resultado

La experiencia de cuenta registrada quedó completa sobre la autenticación implementada en FE-P1.2. La página presenta los datos públicos del perfil autenticado, estado, ocupación, fechas disponibles, perfiles y permisos efectivos, además de acceso directo al historial de exportaciones.

## Sesión y recuperación

- El JWT permanece limitado a `sessionStorage`, por lo que no se comparte entre pestañas ni persiste al cerrar la sesión del navegador.
- `/auth/me` continúa restaurando la identidad antes de abrir rutas protegidas.
- Un HTTP 401 con un token almacenado elimina inmediatamente token, caché y usuario en memoria.
- La causa de cierre se conserva como aviso visual: “Tu sesión terminó”.
- Login mantiene la ruta protegida completa como `returnTo` y regresa a ella después de autenticarse.
- Las rutas externas, absolutas o con doble barra siguen siendo rechazadas por `safeReturnTo`.
- El usuario puede descartar el aviso o cerrar su sesión local desde la página de cuenta.

## Archivos principales

- `client/src/features/auth/AuthContext.ts`
- `client/src/features/auth/AuthProvider.tsx`
- `client/src/features/auth/LoginPage.tsx`
- `client/src/features/auth/AuthForm.module.css`
- `client/src/pages/AccountPage.tsx`
- `client/src/pages/AccountPage.module.css`

## Validación

- Restauración válida, rechazo de JWT y aviso de expiración cubiertos por integración.
- Retorno desde `/cuenta/exportaciones` después de una nueva autenticación cubierto en Chromium y Pixel 7.
- Perfil MEMBER y navegación a exportaciones verificados con contrato real.

## Siguiente paso

FE-P4.1 usa la sesión y el permiso `exports:download` para habilitar archivos e historial propios.
