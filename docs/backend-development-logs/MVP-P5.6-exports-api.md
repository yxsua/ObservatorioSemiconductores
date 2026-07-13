# Incremento 5.6: API de exportaciones

## Alcance

El incremento habilita descargas de las colecciones públicas para usuarios registrados. No crea una segunda política de consulta: exportar `signals`, `trends`, `alerts` o `content` reutiliza las consultas y transformaciones de la API pública, por lo que nunca incluye borradores, estados internos, notas ni identidades del flujo de trabajo.

## Endpoints

### `GET /api/exports/{resource}.{format}`

Requiere JWT y el permiso `exports:download`, incluido en el rol `MEMBER`.

- `resource`: `signals`, `trends`, `alerts` o `content`.
- `format`: `csv` o `json`.
- filtros: los filtros públicos admitidos por el recurso seleccionado.
- no se admiten `page`, `pageSize` ni `status`.

Ejemplos:

```http
GET /api/exports/signals.csv?fcv=TECHNOLOGICAL&from=2026-01-01
Authorization: Bearer <jwt>
```

```http
GET /api/exports/content.json?type=REPORT&sort=-publishedAt
Authorization: Bearer <jwt>
```

La respuesta usa `Content-Disposition: attachment` y expone `X-Export-Id`, `X-Row-Count` y `X-Checksum-SHA256`. El archivo no se almacena: se genera en memoria, se registra su auditoría y se envía al cliente.

### `GET /api/exports/history`

Devuelve exclusivamente las exportaciones del usuario autenticado y admite `page` y `pageSize`. El historial contiene metadatos y checksum, no una copia del archivo.

## Formatos y seguridad

El CSV se emite en UTF-8 con BOM y finales CRLF. Todas las celdas se entrecomillan y los valores cuyo primer carácter significativo es `=`, `+`, `-` o `@` se prefijan con apóstrofo para evitar inyección de fórmulas al abrirlos en una hoja de cálculo.

El JSON usa un sobre con esta forma:

```json
{
  "generatedAt": "2026-07-13T18:30:00.000Z",
  "resource": "signals",
  "rowCount": 1,
  "filters": { "fcv": "TECHNOLOGICAL" },
  "data": []
}
```

`EXPORT_MAX_ROWS` controla el máximo por archivo: el valor predeterminado es 5000 y el backend nunca permite más de 10000. Si el resultado excede el límite, responde `422 DOMAIN_RULE_VIOLATION` y pide filtros más específicos.

## Persistencia

La migración `17_export_history.sql` agrega `export_history` con:

- usuario propietario;
- recurso y formato bajo listas blancas;
- filtros normalizados en JSONB;
- filas y tamaño generado;
- checksum SHA-256;
- fecha de creación.

El índice por usuario y fecha sostiene la consulta paginada del historial. Sólo las generaciones exitosas se auditan.
