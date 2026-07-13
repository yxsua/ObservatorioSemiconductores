# FE-P1.1 — Cliente API tipado

**Fecha:** 13 de julio de 2026

**Estado:** cerrado

**Fuente del contrato:** `docs/API-docs/openapi.yaml` 0.5.6

## Alcance entregado

- Generación de `client/src/api/schema.d.ts` con `openapi-typescript`.
- Base URL configurable mediante `VITE_API_URL`, con `/api` como valor predeterminado.
- Cliente `fetch` para JSON, texto, `Blob`, `ArrayBuffer` y respuestas 204.
- Serialización automática de objetos JSON.
- Compatibilidad con `FormData`, `Blob`, streams y otros cuerpos nativos sin imponer `Content-Type`.
- Token bearer opcional por solicitud.
- `AbortSignal` y conservación de `AbortError` para cancelación real.
- Normalización de errores HTTP y de red en `ApiError`.
- Utilidades para query strings, paginación y descargas.
- Lectura de nombres RFC 5987 y metadatos de exportación desde cabeceras.

## API interna del cliente

```ts
apiRequest<T>(path, options): Promise<T>
apiResponse<T>(path, options): Promise<{ data: T; response: Response }>
apiDownload(path, fallbackFilename, options): Promise<ApiDownload>
```

`apiRequest` es la operación normal. `apiResponse` se reserva para casos que necesitan cabeceras. `apiDownload` solicita un `Blob` y conserva:

- `filename` desde `Content-Disposition`;
- `exportId` desde `X-Export-Id`;
- `rowCount` desde `X-Row-Count`;
- `checksum` desde `X-Checksum-SHA256`.

## Errores

`ApiError` expone:

```ts
status
code
details
fieldErrors
isAuthenticationError
isPermissionError
isConflict
isDomainRuleViolation
```

Un fallo de transporte utiliza `status: 0` y `code: "NETWORK_ERROR"`. Una cancelación no se transforma en error de red. FE-P1.2 conectará estas categorías con sesión, rutas y retroalimentación visual.

## Consultas y paginación

`createQueryString`:

- omite `undefined`, `null` y cadenas vacías;
- conserva cero y `false`;
- codifica caracteres mediante `URLSearchParams`;
- representa listas como parámetros repetidos.

Las exportaciones no deben recibir listas o paginación aunque la utilidad sea genérica; los adaptadores de cada feature limitarán sus parámetros con los tipos generados de la operación correspondiente.

## Seguridad y límites

- El cliente no persiste tokens; esa responsabilidad comienza en FE-P1.2.
- No se agrega `Authorization` si no hay token.
- Los nombres de descarga eliminan separadores de ruta como defensa adicional.
- `saveBlob` sólo se ejecuta como resultado de una acción del usuario.
- El cliente no reintenta escrituras automáticamente.
- La validación del navegador no sustituye las respuestas 400/409/422 del backend.

## Pruebas

Las pruebas cubren:

- cuerpo JSON, token y query string;
- `FormData` sin cabecera multipart manual;
- errores por campo;
- fallo de red y cancelación;
- valores vacíos, booleanos y listas en query strings;
- límites de paginación;
- `filename` y `filename*`;
- metadatos de exportación y contenido `Blob`.

## Criterio de cierre

- OpenAPI genera tipos sin errores.
- La aplicación usa el tipo real de `GET /health`.
- El cliente está cubierto por pruebas y compila en modo estricto.
- Las respuestas binarias conservan nombre y auditoría.
- FE-P1.2 puede añadir sesión sin modificar el transporte base.
