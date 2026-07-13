# FE-P5.1 — Señales

**Estado:** cerrado  
**Fecha:** 13 de julio de 2026

## Resultado

El espacio interno de señales permite crear registros y editar señales `NEW` mediante los endpoints reales. La interfaz reutiliza el detalle, historial y transiciones de FE-P5.0 y añade captura tipada, permisos de propiedad, catálogos, fuentes, palabras clave y concurrencia optimista.

## Rutas y permisos

- `/admin/senales/nueva`: requiere `signals:create`;
- `/admin/senales/:id/editar`: requiere `signals:read-internal` y `signals:update-own` o `signals:update-any`;
- `update-own` sólo presenta la edición cuando el usuario autenticado es el analista de la señal;
- sólo las señales en estado `NEW` muestran la acción de editar;
- el backend conserva la autoridad final sobre propiedad, estado y reglas de dominio.

## Captura

El formulario administra:

- título, resumen, fecha de publicación y URL de evidencia;
- categoría con su FCV y fuente activa;
- tipo, impacto, urgencia, confiabilidad y alcance;
- hasta veinte palabras clave separadas por comas o saltos de línea;
- notas internas.

Los catálogos se consultan mediante `/api/catalogs/{catalog}` y las fuentes mediante `/api/admin/sources`. Los errores de campo `400/422` se asocian con su control. Un conflicto `409` conserva todos los cambios locales y ofrece recargar explícitamente la versión actual.

## IPS y detalle

El cliente nunca envía ni calcula `ips`, prioridad, estado o autor. Después de guardar recupera el DTO devuelto por la API y muestra el IPS autoritativo como valor sobre 27. El detalle interno también presenta enlace de evidencia, palabras clave y notas.

## Fuentes activas

La base de desarrollo validada no contiene todavía fuentes activas. Como el backend actual sólo permite listarlas, el formulario muestra el estado bloqueante **Sin fuentes activas** en lugar de un selector vacío. La captura queda operativa al registrar al menos una fuente por el procedimiento existente o cuando se incorpore su administración mediante API; no se sembraron fuentes editoriales ficticias.

## Rendimiento y desarrollo

- las páginas de alta y edición se cargan como un chunk diferido de aproximadamente 11 kB;
- el bundle principal permanece por debajo de 500 kB minificado;
- el contenedor de Vite usa polling en Docker Desktop para detectar archivos y rutas nuevas de forma confiable.

## Archivos principales

- `client/src/features/admin/signals/SignalFormPage.tsx`
- `client/src/features/admin/signals/SignalForm.module.css`
- `client/src/features/admin/signals/signal-form.schema.ts`
- `client/src/features/admin/signals/signal-form.service.ts`
- `client/src/features/admin/signals/signal-form.integration.test.tsx`
- `client/src/features/admin/signals/signal-form.test.ts`
- `client/src/features/admin/AdminEntityPage.tsx`
- `client/src/features/admin/AdminDetailPanel.tsx`
- `client/e2e/admin-workspace.spec.ts`

## Validación

- TypeScript, ESLint y build productivo aprobados.
- 28 archivos y 94 pruebas unitarias/de integración aprobados.
- Playwright: 45 recorridos aprobados y una omisión esperada exclusiva de escritorio.
- Alta e IPS devuelto por backend cubiertos en Chromium de escritorio y Pixel 7.
- Build productivo del frontend aprobado dentro de Docker.
- Login ADMIN HTTP 200; catálogos reales con 7 categorías, 3 tipos, 3 impactos, 3 urgencias, 3 confiabilidades y 4 alcances.

## Siguiente incremento

El siguiente incremento del plan es **FE-P5.2 — tendencias**. Antes o en paralelo conviene decidir si la administración de fuentes se incorpora como extensión del backend o se mantiene como carga operativa controlada.
