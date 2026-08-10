# FE-P6.2 — Vista previa y publicación

**Estado:** cerrado  
**Fecha:** 13 de julio de 2026

## Resultado

La vista previa interna se convirtió en un espacio de revisión editorial. Utiliza los mismos renderizadores públicos y el backend resuelve referencias y medios con las mismas reglas de elegibilidad del portal antes de devolver la composición.

La ruta `/admin/contenido/:id/preview` incorpora:

- estado y versión de trabajo;
- checklist de slug, secciones, bloques y contratos publicables;
- recomendación no bloqueante para el resumen público;
- comparación de secciones, bloques, relaciones y metadatos contra la versión publicada;
- acceso directo al constructor cuando el contenido sigue en borrador;
- acciones de revisión, aprobación y publicación según estado y permisos.

## Protección del flujo

Enviar a revisión y publicar quedan deshabilitados en la interfaz cuando falta un requisito bloqueante. El backend mantiene la autoridad final y vuelve a validar composición, versiones de esquema, bloques permitidos, permisos y separación entre editor y aprobador.

Todas las transiciones presentan un diálogo de confirmación. La publicación advierte expresamente que reemplazará la versión pública vigente. Los errores de dominio permanecen visibles dentro del diálogo.

## Contrato de preview

`GET /admin/content/{id}/preview` ahora resuelve los bloques `signal`, `trend`, `alert`, `image` y `file` mediante el servicio usado por el contenido público. Las referencias que ya no cumplen el estado público o los medios no públicos no se muestran. El contrato OpenAPI declara el campo opcional `resolved` en `EditorialBlock`.

## Validación

- pruebas del checklist y comparación de versiones;
- recorrido Playwright de revisión y confirmación de publicación;
- pruebas completas de backend y frontend;
- build local y Docker del frontend.

## Siguiente incremento

FE-P6.3 quedó completado posteriormente con la API administrativa y biblioteca de medios. El siguiente bloque es FE-P7 de estabilización.
