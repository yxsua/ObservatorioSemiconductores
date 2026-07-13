# Fase 2 - Vertical de señales

## Alcance entregado

- Confiabilidad evaluada por señal mediante escala `LOW`, `MEDIUM`, `HIGH`.
- IPS autoritativo calculado como impacto × urgencia × confiabilidad.
- Prioridades iniciales: baja 1-7, media 8-17 y alta 18-27.
- Estados canónicos `NEW`, `UNDER_REVIEW`, `VALIDATED`, `ARCHIVED`.
- Transiciones semánticas y trazabilidad completa de estados.
- Separación entre consulta pública y flujo interno.
- Captura, edición de borradores, filtros, búsqueda, paginación e historial.
- Palabras clave transaccionales.
- Control de concurrencia opcional mediante `updatedAt`.

## Migración

Aplicar después de `10_roles_permissions.sql`:

```text
database/migrations/11_signals_domain.sql
```

La migración:

1. crea `reliability_levels`;
2. añade `signals.id_reliability`;
3. recalcula todos los IPS existentes;
4. incorpora `ARCHIVED`;
5. convierte estados relacionales históricos a `VALIDATED`;
6. elimina `LINKED_TO_TREND` y `ESCALATED_TO_ALERT` del catálogo;
7. crea `signal_status_history`;
8. reemplaza la lógica de transición y vinculación a tendencias.

En instalaciones con datos existentes debe generarse un respaldo antes de aplicar la migración.

## Endpoints públicos

```text
GET /api/signals
GET /api/signals/:id
```

Solo devuelven señales `VALIDATED`. No incluyen notas, analista, validador ni fecha interna de validación.

Filtros disponibles:

```text
page, pageSize, search, categoryId, fcv, impact, urgency,
reliability, scope, from, to, sort
```

## Endpoints internos

```text
GET   /api/admin/signals
POST  /api/admin/signals
GET   /api/admin/signals/:id
PATCH /api/admin/signals/:id
POST  /api/admin/signals/:id/transitions
GET   /api/admin/signals/:id/history
GET   /api/admin/sources
```

La creación toma el analista del JWT. Una señal nace como `NEW` y el cliente no puede enviar el IPS ni seleccionar su estado.

`GET /api/admin/sources` proporciona las fuentes activas que el formulario puede seleccionar. Acepta el filtro opcional `search` y no expone las URLs internas de RSS o API.

## Permisos

| Operación | Permiso |
| --- | --- |
| Lectura interna e historial | `signals:read-internal` |
| Crear | `signals:create` |
| Modificar propia | `signals:update-own` |
| Modificar cualquiera | `signals:update-any` |
| Enviar a revisión | `signals:submit` |
| Solicitar cambios, validar o reabrir | `signals:validate` |
| Archivar | `signals:archive` |

El validador debe ser distinto del analista que creó la señal.

## Ejemplo de creación

```json
{
  "title": "Nueva inversión en empaque avanzado",
  "summary": "Descripción de la evidencia identificada.",
  "publicationDate": "2026-07-12",
  "evidenceUrl": "https://example.com/evidence",
  "categoryId": 2,
  "sourceId": 1,
  "signalTypeCode": "STRONG",
  "impactCode": "HIGH",
  "urgencyCode": "MEDIUM",
  "reliabilityCode": "HIGH",
  "scopeCode": "NATIONAL",
  "keywords": ["empaque avanzado", "inversión"]
}
```

## Transiciones

```text
NEW --SUBMIT_FOR_REVIEW--> UNDER_REVIEW
UNDER_REVIEW --REQUEST_CHANGES--> NEW
UNDER_REVIEW --VALIDATE--> VALIDATED
VALIDATED --REOPEN--> UNDER_REVIEW
NEW|UNDER_REVIEW|VALIDATED --ARCHIVE--> ARCHIVED
```

## Verificación realizada

- Inicialización limpia de PostgreSQL 17 con migraciones `01-11`.
- Cálculo comprobado: `HIGH × HIGH × HIGH = 27`.
- Prueba del ciclo `NEW → UNDER_REVIEW → VALIDATED`.
- Tres entradas de historial verificadas para creación y dos transiciones.
- Prueba HTTP completa con Express, JWT, RBAC, Zod, repositorio y PostgreSQL.
- La consulta pública rechazó borradores y mostró la señal una vez validada.
- Una ruta administrativa sin token devolvió HTTP 401.
