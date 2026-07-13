# FE-P6.1 — Constructor de composición

**Estado:** cerrado  
**Fecha:** 13 de julio de 2026

## Resultado

Se incorporó el constructor editorial interno para modificar la versión actual de un contenido en estado `DRAFT`. La ruta `/admin/contenido/:id/composicion` se protege con `content:update` y es accesible desde el detalle del contenido.

El constructor obtiene dinámicamente los descriptores de `/admin/editorial/block-types`, por lo que el backend conserva la autoridad sobre tipos y versiones de esquema. La entrega soporta los trece bloques actuales: encabezado, párrafo, cita, lista, destacado, separador, imagen, archivo, tabla, gráfica, señal, tendencia y alerta.

## Edición y relaciones

- alta, eliminación y reordenamiento de secciones;
- tipo, título, visibilidad y comportamiento colapsable por sección;
- alta, duplicado, eliminación y reordenamiento de bloques;
- formularios específicos para texto, listas, referencias y medios;
- edición JSON validada localmente para tablas y gráficas;
- ajustes comunes de ancho, alineación, fondo y visibilidad;
- relaciones adicionales con categorías, señales validadas, tendencias activas y alertas publicadas o cerradas.

Las relaciones utilizadas dentro de bloques `signal`, `trend` y `alert` también son deducidas y validadas por el backend al guardar.

## Guardado y concurrencia

El cliente envía un reemplazo completo mediante `PUT /admin/content/{id}/versions/{versionId}/composition`, incluyendo el `updatedAt` consultado. Hay un indicador persistente de cambios sin guardar y protección al cerrar o recargar la pestaña.

Ante un conflicto `409`, el estado local permanece intacto. El editor puede revisar sus cambios y sólo descartarlos mediante la acción explícita para recargar la versión actual. Después de un guardado exitoso se invalidan detalle, versiones y vista previa.

## Límites deliberados

- Los bloques de imagen y archivo aceptan el ID de un medio existente; el selector y la carga corresponden a FE-P6.3 y dependen de la API administrativa de medios.
- Tabla y gráfica usan una entrada JSON estructurada en esta primera entrega; un editor tabular o visual puede añadirse sin cambiar el contrato.
- La fidelidad final entre constructor, vista previa y publicación corresponde a FE-P6.2.

## Archivos principales

- `client/src/features/admin/content/CompositionBuilderPage.tsx`
- `client/src/features/admin/content/BlockEditor.tsx`
- `client/src/features/admin/content/composition-state.ts`
- `client/src/features/admin/content/CompositionBuilder.module.css`
- `client/src/features/admin/content/editorial.service.ts`
- `client/src/app/router.tsx`
- `client/e2e/editorial-admin.spec.ts`

## Validación

- TypeScript y ESLint aprobados;
- 31 archivos y 103 pruebas unitarias/de integración aprobados;
- recorrido Playwright del constructor aprobado en Chromium;
- build productivo aprobado, con el constructor separado en un chunk diferido de 20.72 kB y bundle principal de 484.80 kB.

## Siguiente incremento

El siguiente incremento es **FE-P6.2 — vista previa y publicación**: fidelidad con los renderizadores públicos, validaciones previas al flujo editorial, comparación entre versión de trabajo y publicada, y confirmaciones de publicación.
