# FE-P6.0 — Contenido, versiones y flujo editorial interno

**Estado:** cerrado  
**Fecha:** 13 de julio de 2026

## Resultado

El placeholder editorial fue sustituido por un espacio interno conectado con la API real. Editores y publicadores pueden consultar contenido, crear borradores, editar metadatos de la versión de trabajo, revisar versiones e historial, crear una revisión desde una publicación y ejecutar las transiciones autorizadas.

## Rutas

- `/admin/contenido`: listado paginado con búsqueda, estado y tipo en la URL;
- `/admin/contenido/nuevo`: alta con plantilla compatible opcional;
- `/admin/contenido/:id`: detalle, métricas, versiones, historial y acciones;
- `/admin/contenido/:id/editar`: metadatos de contenido `DRAFT`;
- `/admin/contenido/:id/preview`: vista previa interna de la versión actual.

Las páginas editoriales se cargan de forma diferida y están protegidas por permisos. Se incorporaron al cliente `content:submit` y `content:archive`, que ya existían en el backend pero faltaban en la matriz frontend.

## Contenido y plantillas

El formulario administra tipo, título, resumen y slug. En alta consulta las plantillas activas y sólo presenta las que corresponden al tipo seleccionado. Elegir una plantilla solicita al backend crear la composición inicial; sin plantilla se crea una versión vacía válida que deberá componerse en FE-P6.1.

La base de desarrollo validada expone nueve tipos editoriales y todavía no contiene plantillas ni contenido. No se agregaron semillas ficticias. El recorrido con plantilla se verificó mediante una respuesta contractual controlada en Playwright.

## Versiones y revisión

El detalle distingue versión actual y publicada, y muestra número, resumen de cambios, secciones y bloques. La acción **Crear revisión** sólo aparece en contenido `PUBLISHED` y clona la versión publicada a un nuevo `DRAFT` mediante `/admin/content/{id}/versions`.

Esto conserva inmutable la publicación vigente mientras se prepara una revisión. La edición de composición queda explícitamente para FE-P6.1.

## Flujo y permisos

La interfaz presenta únicamente las transiciones posibles por estado y permiso:

- `DRAFT` → enviar a revisión;
- `UNDER_REVIEW` → solicitar cambios o aprobar;
- `APPROVED` → reabrir o publicar;
- `PUBLISHED` → archivar.

El backend mantiene la autoridad sobre secciones y bloques mínimos, separación entre editor y aprobador, bloques publicables, concurrencia y transiciones. Los errores `409/422` se muestran junto a la operación correspondiente.

## Vista previa

La vista previa consume `/admin/content/{id}/preview` y reutiliza los renderizadores públicos para secciones y bloques compatibles. Sólo muestra elementos marcados como visibles. Las referencias y medios que necesitan resolución pública degradan de forma segura; la fidelidad completa y comparación de versiones corresponden a FE-P6.2 y la administración de medios a FE-P6.3.

## Archivos principales

- `client/src/features/admin/content/ContentAdminPage.tsx`
- `client/src/features/admin/content/ContentFormPage.tsx`
- `client/src/features/admin/content/ContentPreviewPage.tsx`
- `client/src/features/admin/content/editorial.service.ts`
- `client/src/features/admin/content/editorial-filters.ts`
- `client/src/features/admin/content/EditorialAdmin.module.css`
- `client/e2e/editorial-admin.spec.ts`
- `client/src/app/router.tsx`
- `client/src/app/permissions.ts`

## Validación

- TypeScript y ESLint aprobados;
- 30 archivos y 100 pruebas unitarias/de integración aprobados;
- recorrido Playwright de alta con plantilla aprobado en Chromium; el servidor de pruebas permaneció abierto hasta el límite de espera después de reportar éxito;
- API real validada con nueve tipos, cero plantillas y cero contenidos;
- build productivo local y Docker aprobados, con bundle principal de 484.33 kB.

## Siguiente incremento

El siguiente incremento es **FE-P6.1 — constructor de composición**: secciones, bloques, relaciones, reordenamiento, guardado completo con `updatedAt` y recuperación ante conflictos.
