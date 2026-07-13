# FE-P5.3 — Alertas

**Estado:** cerrado  
**Fecha:** 13 de julio de 2026

## Resultado

El área interna permite crear alertas manuales y editar alertas `NEW` mediante la API real. El formulario incorpora información ejecutiva, reglas de activación, evidencia, audiencias y notas, mientras que el espacio administrativo conserva detalle, historial y transiciones de validación, publicación y cierre.

## Rutas y permisos

- `/admin/alertas/nueva`: requiere `alerts:create`;
- `/admin/alertas/:id/editar`: requiere `alerts:update` y respeta propiedad o capacidad de validación;
- las relaciones sólo se pueden modificar con `alerts:link-evidence`;
- las acciones de estado continúan condicionadas por `alerts:submit`, `alerts:validate`, `alerts:publish` y `alerts:close`.

El backend conserva la autoridad final sobre estado editable, separación entre creador y validador, evidencia admisible y transiciones.

## Captura y relaciones

El formulario administra:

- título y resumen ejecutivo;
- implicaciones y recomendaciones;
- nivel, fecha límite y regla de activación;
- señales `VALIDATED`;
- tendencias `VALIDATED` o `ACTIVE`;
- audiencias del catálogo público;
- notas internas.

El alta envía las relaciones en la operación transaccional existente. En edición, los campos escalares usan `updatedAt` y las relaciones se sincronizan mediante los endpoints especializados de señales, tendencias y audiencias. Si una evidencia relacionada deja de ser válida, permanece visible con su estado para evitar que desaparezca silenciosamente del formulario.

## Preparación para revisión

El formulario y el detalle presentan una lista informativa con los requisitos que el backend comprobará al ejecutar `SUBMIT_FOR_REVIEW`:

- nivel, implicaciones, recomendaciones y regla de activación;
- al menos una señal o tendencia;
- evidencia con estado permitido;
- al menos una audiencia.

La lista no sustituye la validación de dominio. Los errores `409` conservan los cambios locales y los `422` de transición se muestran junto a la acción correspondiente.

## Archivos principales

- `client/src/features/admin/alerts/AlertFormPage.tsx`
- `client/src/features/admin/alerts/alert-form.service.ts`
- `client/src/features/admin/alerts/alert-form.schema.ts`
- `client/src/features/admin/alerts/alert-form.test.ts`
- `client/src/features/admin/AdminEntityPage.tsx`
- `client/src/features/admin/AdminDetailPanel.tsx`
- `client/src/features/admin/admin-view.ts`
- `client/src/app/router.tsx`

## Validación

- TypeScript y ESLint aprobados;
- 60 pruebas backend aprobadas;
- 29 archivos y 98 pruebas unitarias/de integración aprobados;
- suite Playwright: 45 recorridos aprobados y una omisión esperada; el proceso de servidor superó el límite de espera después de reportar los 46 resultados;
- API real: tres niveles, siete audiencias y permisos ADMIN de alta y relaciones verificados;
- build productivo local aprobado;
- el espacio administrativo se separó en carga diferida y el bundle principal bajó a 482.83 kB.

La base de desarrollo no contiene alertas ni evidencia ficticia. El flujo operativo esperado es registrar una fuente, capturar y validar señales, consolidar tendencias cuando corresponda y después construir la alerta.

## Siguiente incremento

Con FE-P5.1, FE-P5.2 y FE-P5.3 quedan cubiertos los tres verticales administrativos de vigilancia. El siguiente bloque del plan es **FE-P6.0 — contenido, versiones y flujo editorial interno**.
