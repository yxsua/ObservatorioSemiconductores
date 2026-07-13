# FE-P5.0 — Patrón administrativo común

**Estado:** cerrado  
**Fecha:** 13 de julio de 2026

## Resultado

Las rutas internas de señales, tendencias y alertas comparten un espacio de trabajo administrativo conectado con la API real. El incremento establece los patrones de consulta, trazabilidad y cambio de estado que reutilizarán los formularios de FE-P5.1, FE-P5.2 y FE-P5.3.

## Espacio de trabajo

- listado paginado mediante `GET /api/admin/{signals|trends|alerts}`;
- búsqueda y estado conservados en la URL, con normalización de página, tamaño y orden;
- tabla semántica con desplazamiento horizontal local;
- panel de detalle conectado con `GET /api/admin/{recurso}/:id`;
- historial cronológico conectado con `GET /api/admin/{recurso}/:id/history`;
- distribución de dos columnas en escritorio y apilada en móvil;
- estados de carga, vacío, error y reintento independientes para listado, detalle e historial.

## Permisos y transiciones

La navegación y las acciones se derivan de `user.permissions`, no del nombre del rol. Cada vertical declara sus estados y transiciones válidas; el cliente sólo muestra las acciones cuyo permiso posee la cuenta y el backend conserva la autoridad final sobre la transición.

Antes de invocar `POST /api/admin/{recurso}/:id/transitions`, se presenta una confirmación con notas opcionales. El diálogo admite teclado, cierre con Escape y foco inicial. Tras un resultado correcto se invalidan listado, detalle e historial para recuperar la versión vigente.

## Concurrencia

Un HTTP 409 `CONCURRENT_MODIFICATION` no reemplaza los datos que la persona estaba revisando. La confirmación explica el conflicto y, al cerrarla, el panel mantiene el detalle anterior con una acción explícita para recargar registro, historial y listado.

## Alcance reservado

FE-P5.0 no incorpora todavía formularios de alta o edición ni gestión de relaciones. Esas operaciones permanecen en sus verticales:

- FE-P5.1: captura, edición, catálogos y palabras clave de señales;
- FE-P5.2: captura, edición y relaciones de tendencias con señales y actores;
- FE-P5.3: captura, edición, evidencia y audiencias de alertas.

## Archivos principales

- `client/src/features/admin/AdminEntityPage.tsx`
- `client/src/features/admin/AdminDetailPanel.tsx`
- `client/src/features/admin/AdminTable.tsx`
- `client/src/features/admin/AdminHistory.tsx`
- `client/src/features/admin/TransitionPanel.tsx`
- `client/src/features/admin/admin-config.ts`
- `client/src/features/admin/admin.service.ts`
- `client/src/features/admin/admin-workspace.integration.test.tsx`
- `client/e2e/admin-workspace.spec.ts`

## Validación

- TypeScript, ESLint y build productivo aprobados.
- 26 archivos y 89 pruebas unitarias/de integración aprobados, incluidos filtros, matriz de transiciones, éxito, conflicto 409 y navegación coherente con permisos de lectura.
- Playwright: 43 recorridos aprobados y una omisión esperada exclusiva de escritorio.
- Recorridos de ANALYST y cuenta sin permisos ejecutados en Chromium de escritorio y Pixel 7, sin desbordamiento horizontal global.
- Build de backend, frontend y Nginx completado en Docker.
- Login ADMIN y consultas reales a señales, tendencias y alertas respondieron HTTP 200 desde el backend Docker.
- El Compose de desarrollo descarta el `build` productivo del frontend antes de usar `node:22-alpine`, evitando colisiones locales de imágenes y la caída por ausencia de npm.

## Siguiente incremento

El siguiente incremento recomendado es **FE-P5.1 — señales**, reutilizando este espacio de trabajo para agregar alta, edición, catálogos, palabras clave e IPS calculado por el backend.
