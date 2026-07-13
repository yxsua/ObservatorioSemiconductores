# FE-P5.2 — Tendencias y administración de fuentes

**Estado:** cerrado  
**Fecha:** 13 de julio de 2026

## Resultado

El área interna permite crear y editar tendencias `NEW`, asociar señales validadas y actores, y consultar la madurez sugerida y las métricas calculadas por el backend. Como extensión necesaria del flujo de captura, también se incorporó administración completa de fuentes antes de continuar con señales y tendencias.

## Fuentes

Se agregaron los permisos `sources:read-internal`, `sources:create`, `sources:update` y `sources:deactivate`, asignados mediante la migración idempotente `19_source_management.sql`. La API ofrece listado activo o histórico, detalle, alta, actualización con `updatedAt` y desactivación lógica. Las señales siguen consumiendo únicamente fuentes activas.

Rutas de interfaz:

- `/admin/fuentes` y `/admin/fuentes/:id`;
- `/admin/fuentes/nueva`;
- `/admin/fuentes/:id/editar`.

El formulario registra tipo, nombre, país o región, sitio web, RSS, API y confiabilidad histórica en el intervalo `0–1`. Desactivar conserva las relaciones históricas y evita su uso en nuevas señales.

## Tendencias

Rutas de interfaz:

- `/admin/tendencias/nueva`, con `trends:create`;
- `/admin/tendencias/:id/editar`, con `trends:update` y las reglas de propiedad/validación del backend.

El formulario administra título, narrativa, implicaciones, dirección, madurez declarada y notas metodológicas. Las señales disponibles se consultan con estado `VALIDATED`; los actores se obtienen de `/api/admin/actors`. En alta, las relaciones se guardan en la misma operación transaccional. En edición, los cambios escalares usan concurrencia optimista y las altas/bajas de relaciones usan los endpoints específicos.

La UI muestra la madurez sugerida por la API y no reproduce el algoritmo. Los estados, transiciones y detalle continúan reutilizando el patrón administrativo de FE-P5.0.

## Contrato y archivos principales

- `database/migrations/19_source_management.sql`
- `backend/src/schemas/source.schema.js`
- `backend/src/repositories/source.repository.js`
- `backend/src/services/source.service.js`
- `backend/src/routes/admin.source.routes.js`
- `client/src/features/admin/sources/`
- `client/src/features/admin/trends/`
- `docs/API-docs/openapi.yaml`, versión `0.5.7`

## Validación

- migración aplicada en la base de desarrollo existente sin reinicializar el volumen;
- login del administrador y `GET /api/admin/sources?active=all` verificados contra el stack real;
- 60 pruebas backend aprobadas;
- 28 archivos y 94 pruebas frontend aprobados;
- TypeScript, ESLint y build productivo aprobados;
- chunks diferidos independientes para fuentes y tendencias; bundle principal menor a 500 kB.

La base de desarrollo continúa sin fuentes ficticias. El administrador puede registrar la primera desde la interfaz, y el formulario de señales dirige a esa ruta cuando el catálogo activo está vacío.

## Siguiente incremento

El siguiente incremento del plan es **FE-P5.3 — alertas**, reutilizando el patrón para evidencia (señales y tendencias), audiencias, validación, publicación y cierre. La administración de actores permanece como una mejora posterior; FE-P5.2 consume el catálogo de actores ya expuesto por el backend.
