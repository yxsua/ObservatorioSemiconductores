# Fase 5.5 - Entrega segura de medios

## Alcance

Este incremento convierte las referencias de medios resueltas en endpoints utilizables por React, manteniendo separadas la visualización pública y la descarga restringida.

```text
GET /api/media/:id
GET /api/media/:id/download
```

## Política de acceso

`GET /api/media/:id` no requiere autenticación, pero únicamente admite imágenes raster públicas con MIME `image/avif`, `image/gif`, `image/jpeg`, `image/png` o `image/webp`. SVG, PDF y cualquier otro formato reciben HTTP 403 para impedir ejecución inline o descarga anónima.

`GET /api/media/:id/download` requiere JWT y el permiso `exports:download`. Todas las cuentas `MEMBER` y los roles internos actuales poseen este permiso. El medio debe continuar marcado como público.

## Almacenamiento

- Una URL HTTP(S) se entrega mediante redirección 302, sin proxy inverso ni descarga desde el backend.
- Una ruta relativa se resuelve dentro de `MEDIA_ROOT`.
- Rutas absolutas externas, traversal, directorios y archivos inexistentes responden 404.
- Nunca se devuelve `storage_path`, proveedor o bucket en el DTO público.

Docker configura `MEDIA_ROOT=/app/storage/media` y el volumen persistente `media_data`.

## Cabeceras

- `X-Content-Type-Options: nosniff` en respuestas y redirecciones.
- Imágenes inline: `Cache-Control: public` y `Content-Disposition: inline`.
- Descargas: `Cache-Control: private, no-store` y `Content-Disposition: attachment`.
- `sendFile` conserva soporte de rangos, `Last-Modified` y longitud real para archivos locales.
- Un checksum hexadecimal válido se utiliza como `ETag` cuando está disponible.

## Contrato de bloques

Los bloques de imagen reciben `resolved.url = /api/media/:id`. Los bloques de archivo mantienen `resolved.url = null`. Ambos reciben `resolved.downloadUrl = /api/media/:id/download`.

Esto evita que una URL remota guardada en PostgreSQL permita saltarse el control de autenticación de una descarga.

## Verificación

- Imagen PNG local entregada sin autenticación y con MIME seguro.
- Documento PDF rechazado en el endpoint inline.
- Descarga sin token rechazada con HTTP 401.
- Descarga local autenticada con `Content-Disposition: attachment`.
- Descarga remota autenticada mediante redirección 302.
- Traversal y rutas fuera de `MEDIA_ROOT` rechazados.

