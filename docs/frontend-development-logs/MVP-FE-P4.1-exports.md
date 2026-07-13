# FE-P4.1 — Descargas y exportaciones

**Estado:** cerrado  
**Fecha:** 13 de julio de 2026

## Resultado

Las colecciones públicas de señales, tendencias, alertas y contenido ofrecen exportación CSV y JSON. Un visitante puede seguir consultando toda la información, pero las acciones de descarga le solicitan iniciar sesión o crear una cuenta y conservan su ruta y filtros como retorno.

## Filtros

Cada colección entrega al componente de exportación el objeto ya normalizado por su parser público. Antes de llamar a la API se aplica una lista blanca por recurso y se eliminan valores vacíos, paginación y campos no admitidos.

- señales: búsqueda, categoría, FCV, impacto, urgencia, confiabilidad, alcance, fechas y orden;
- tendencias: búsqueda, dirección, madurez y orden;
- alertas: búsqueda, nivel, audiencia y orden; `status` se excluye porque el endpoint de exportación no lo admite;
- contenido: búsqueda, tipo, categoría, FCV, fechas y orden, incluido el tipo fijado por páginas como Noticias o Boletines.

## Descarga

- CSV y JSON se solicitan como Blob con Bearer JWT.
- Se respeta el nombre recibido en `Content-Disposition`.
- El resultado informa nombre y cantidad de registros mediante las cabeceras de exportación.
- Una respuesta 422 explica que deben aplicarse filtros más específicos.
- Un HTTP 401 activa el flujo de expiración de FE-P4.0.
- Después de una descarga correcta se invalida el caché del historial.

## Historial propio

La ruta `/cuenta/exportaciones` reemplazó el placeholder y consulta `GET /api/exports/history`:

- paginación conservada en la URL;
- fecha, colección, formato, filas, tamaño y filtros;
- checksum SHA-256 completo bajo un detalle desplegable;
- tabla semántica con desplazamiento horizontal local;
- estados de carga, vacío, error y reintento;
- acceso protegido por autenticación y `exports:download`.

## Archivos principales

- `client/src/features/exports/export-filters.ts`
- `client/src/features/exports/exports.service.ts`
- `client/src/features/exports/ExportActions.tsx`
- `client/src/features/exports/ExportHistoryPage.tsx`
- `client/src/features/exports/Exports.module.css`
- `client/src/features/exports/export-filters.test.ts`
- `client/src/features/exports/exports.integration.test.tsx`
- `client/e2e/account-exports.spec.ts`

## Validación

- TypeScript, ESLint y build de producción aprobados.
- 24 archivos y 83 pruebas unitarias/de integración aprobados.
- Playwright: 39 pruebas aprobadas y una omisión esperada exclusiva de escritorio.
- Recorridos de visitante y MEMBER ejecutados en Chromium de escritorio y Pixel 7.
- Sin desbordamiento horizontal global en el historial móvil.
- Build completo de backend, frontend y Nginx en Docker.
- Prueba real desde el backend: login ADMIN HTTP 200, exportación CSV HTTP 200 e historial HTTP 200 con la nueva entrada del mismo usuario.

## Siguiente incremento

El siguiente incremento recomendado es **FE-P5.0 — patrón administrativo común**, antes de implementar las verticales internas de señales, tendencias y alertas.
