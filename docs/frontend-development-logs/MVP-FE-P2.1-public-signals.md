# FE-P2.1 — Señales públicas

**Fecha:** 13 de julio de 2026

**Estado:** cerrado

**Fuente del contrato:** `docs/API-docs/openapi.yaml` 0.5.6

## Alcance entregado

- Adaptador tipado para `GET /signals` y `GET /signals/{id}`.
- Consulta paralela de categorías, factores críticos de vigilancia y alcances desde catálogos públicos.
- Listado responsive mediante tarjetas con prioridad, código, categoría, FCV, IPS, impacto y fecha.
- Búsqueda por código, título o resumen.
- Filtros por categoría, FCV, impacto, urgencia, confiabilidad, alcance y rango de publicación.
- Orden por fecha, IPS y título.
- Paginación pública con conservación de filtros.
- URL como única fuente de verdad para búsqueda, filtros, orden y página.
- Estados explícitos de carga, actualización, vacío, error y catálogos parcialmente indisponibles.
- Detalle con clasificación, evaluación, IPS, fuente, evidencia externa, palabras clave y relaciones públicas.
- Metadatos específicos en el detalle de cada señal.

## Contrato de consulta

La vista convierte únicamente parámetros válidos del contrato a `SignalListQuery`:

```text
page
pageSize = 12
search
categoryId
fcv
impact
urgency
reliability
scope
from
to
sort
```

Los valores inválidos encontrados al abrir una URL se descartan antes de consultar la API. Una nueva aplicación de filtros vuelve a la primera página. Los parámetros vacíos no se conservan en la URL.

## Privacidad y reglas del dominio

- El portal consume exclusivamente señales validadas; esa restricción la aplica el backend.
- No se muestran analista, validador, notas internas, historial ni transiciones.
- El frontend presenta `ips` y `priority` tal como los devuelve la API; no los calcula ni infiere.
- El enlace de evidencia abre el URL original en una pestaña nueva con `rel="noreferrer"`.
- Las relaciones públicas sólo exponen `linkedToTrend` y `linkedToAlert`. La UI informa la existencia del vínculo y enlaza a las colecciones generales, pero no inventa IDs de tendencia o alerta.
- Una respuesta 404 distingue una señal retirada o inexistente de un fallo temporal.

## Responsive y accesibilidad

- Tres tarjetas por fila en escritorio, dos en tableta y una en móvil.
- Filtros abiertos inicialmente en escritorio y colapsados en móvil después de la revisión visual.
- Controles con etiquetas persistentes y tipos nativos de fecha, búsqueda y selección.
- Conteo de resultados con región viva y número de filtros activos.
- Navegación de paginación etiquetada y botones deshabilitados en los límites.
- Un único `h1` por pantalla, regiones identificadas por encabezado y ruta de navegación en el detalle.
- Estados de prioridad complementados con texto; el color no es el único indicador.

## Pruebas y validación

- `npm run check`: tipos OpenAPI, lint, 38 pruebas en 12 archivos y build correctos.
- Pruebas unitarias de normalización, descarte y serialización de filtros.
- Integración de URL, consultas, catálogos, resultados, vacío, detalle y 404.
- Playwright: 11 recorridos aprobados en Chromium de escritorio y móvil; un caso exclusivamente móvil se omite deliberadamente en el proyecto de escritorio.
- Validación visual del listado en 1440 × 900 y 390 × 844 píxeles.
- Stack Docker aislado verificado contra PostgreSQL, backend, frontend y Nginx reales.
- La base limpia devolvió 7 categorías y 0 señales públicas; la interfaz representó correctamente el estado vacío.

## Archivos principales

- `client/src/features/signals/signals.service.ts`
- `client/src/features/signals/signal-filters.ts`
- `client/src/features/signals/SignalsListPage.tsx`
- `client/src/features/signals/SignalDetailPage.tsx`
- `client/src/features/signals/Signals.module.css`

## Límites deliberados

- La exportación permanece en FE-P4.1 y no aparece aún como acción de la colección.
- La API pública de señal no devuelve los IDs relacionados; la navegación específica sólo podrá añadirse si el contrato los incorpora.
- No se implementan mapas, gráficas ni agregaciones porque el endpoint no las ofrece.
- La vista no solicita catálogos internos ni requiere autenticación.

## Criterio de cierre

- Listado y detalle consumen endpoints públicos reales.
- Los filtros y la paginación se pueden compartir y recuperar desde la URL.
- Carga, éxito, vacío, error y 404 tienen estados verificables.
- No se filtran datos internos ni se recalculan reglas del dominio.
- Responsive, pruebas, build y stack Docker están validados.

El siguiente incremento recomendado es **FE-P2.2 — Tendencias y alertas públicas**.
