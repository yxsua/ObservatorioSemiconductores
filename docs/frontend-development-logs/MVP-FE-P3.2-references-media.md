# FE-P3.2 — Referencias y medios editoriales

**Estado:** cerrado  
**Fecha:** 13 de julio de 2026

## Resultado

El renderizador editorial público admite los trece tipos de bloque previstos para FE-P3. Este incremento incorporó referencias a señales, tendencias y alertas, además de imágenes públicas y archivos de descarga protegida.

Los nuevos componentes consumen exclusivamente el objeto `resolved` agregado por el backend. No consultan por separado `data.entityId` ni `data.mediaId`. Los identificadores editoriales sólo se utilizan para comprobar que la referencia resuelta corresponde al bloque solicitado.

## Referencias de vigilancia

- Soporte para `signal`, `trend` y `alert`.
- Variantes `compact`, `card` y `featured` con densidad progresiva.
- Código de negocio, título, resumen, metadatos y relaciones según la proyección recibida.
- Enlaces a los detalles públicos existentes de React.
- El `href` canónico de API se valida contra tipo e identificador antes de habilitar la ruta pública equivalente.
- Fechas, conteos y objetos anidados se leen de forma defensiva; un valor opcional inválido no rompe la publicación.
- No se emiten solicitudes adicionales a los endpoints de señales, tendencias o alertas.

## Medios

### Imágenes

- Sólo se aceptan los MIME raster permitidos por el backend: AVIF, GIF, JPEG, PNG y WebP.
- La URL debe coincidir exactamente con `/api/media/:id` y con el medio resuelto.
- Texto alternativo obligatorio, carga diferida, decodificación asíncrona y pie opcional.
- Un enlace editorial opcional sólo admite HTTP o HTTPS y se abre con aislamiento de la página de origen.
- SVG, URL arbitrarias, identificadores inconsistentes y datos incompletos degradan al estado seguro.

### Archivos

- Presentación de etiqueta, descripción, extensión y tamaño disponibles.
- La URL de descarga debe coincidir con `/api/media/:id/download`.
- Un visitante recibe una invitación a iniciar sesión y la publicación se conserva como ruta de retorno.
- Una cuenta con `exports:download` descarga mediante el cliente binario y Bearer JWT; no se utiliza un enlace nativo que perdería la autorización.
- Una cuenta sin permiso recibe un estado informativo y una descarga fallida produce un mensaje accesible.

## Archivos principales

- `client/src/features/content/resolved-blocks.ts`
- `client/src/features/content/ReferenceBlock.tsx`
- `client/src/features/content/MediaBlocks.tsx`
- `client/src/features/content/ResolvedBlocks.module.css`
- `client/src/features/content/TextBlockRenderer.tsx`
- `client/src/features/content/resolved-blocks.test.tsx`
- `client/src/features/content/resolved-content.integration.test.tsx`
- `client/e2e/content-resolved.spec.ts`

## Validación

- TypeScript, ESLint y build de producción aprobados.
- 22 archivos y 75 pruebas unitarias/de integración aprobados.
- Playwright en Chromium de escritorio y Pixel 7: 31 pruebas aprobadas y una omisión esperada exclusiva de escritorio.
- El E2E de FE-P3.2 comprueba las cinco familias nuevas, ausencia de solicitudes adicionales de entidades y ausencia de desbordamiento horizontal global.
- Imágenes Docker de backend, frontend y Nginx construidas correctamente.
- PostgreSQL saludable y `GET /api/health` devolvió HTTP 200 desde el contenedor backend.

## Siguiente incremento

El siguiente incremento recomendado es **FE-P4.0 — Cuenta**. Debe completar la experiencia de perfil y expiración de sesión antes de conectar las exportaciones de FE-P4.1.
