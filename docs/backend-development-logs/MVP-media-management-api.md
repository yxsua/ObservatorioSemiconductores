# API administrativa de medios

**Estado:** implementada  
**Fecha:** 13 de julio de 2026

La migración `21_media_management.sql` amplía `media` con título, texto alternativo y descripción, crea índices y agrega los permisos `media:read-internal`, `media:create` y `media:update` para `EDITOR`, `PUBLISHER` y `ADMIN`.

## Endpoints

- `GET /api/admin/media`: biblioteca paginada, filtrable por búsqueda, imagen/archivo y visibilidad;
- `GET /api/admin/media/{id}`: detalle interno;
- `POST /api/admin/media`: carga multipart con archivo y metadatos;
- `PATCH /api/admin/media/{id}`: metadatos y visibilidad con `updatedAt`.

Las cargas aceptan imágenes AVIF, GIF, JPEG, PNG y WebP, además de PDF, TXT, CSV, DOCX y XLSX. El límite predeterminado es 20 MiB y puede configurarse mediante `MEDIA_MAX_BYTES`.

El servidor genera el nombre físico, calcula SHA-256 y escribe primero un archivo temporal antes de renombrarlo dentro de `MEDIA_ROOT`. No se confía en rutas enviadas por el cliente. Los medios nacen internos salvo que se solicite explícitamente visibilidad pública.

La publicación editorial continúa aceptando únicamente medios públicos. Los endpoints públicos existentes mantienen sus controles de MIME, descarga autenticada y prevención de escape del directorio.
