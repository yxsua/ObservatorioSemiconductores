# FE-P2.0 — Shell público

**Fecha:** 13 de julio de 2026

**Estado:** cerrado

**Fuente editorial:** OpenAPI 0.5.6 y catálogos `NEWS`, `NEWSLETTER`, `REPORT`

## Alcance entregado

- Encabezado público fijo con marca, navegación modular y acciones de cuenta.
- Menú responsive operable mediante botón, estado `aria-expanded` y cierre con Escape o cambio de ruta.
- Enlace para saltar directamente al contenido principal y foco preparado para navegación por teclado.
- Pie de página con mapa de módulos y accesos a los recursos estructurados de vigilancia.
- Inicio responsive con propósito del observatorio, accesos prioritarios, directorio de módulos y explicación de señales, tendencias y alertas.
- Rutas propias para boletines, noticias, ecosistema regional, vigilancia tecnológica, publicaciones e industria.
- Página modular reutilizable que evita crear una implementación distinta para cada familia editorial.
- Título y descripción HTML actualizados en cada ruta pública.
- Nuevos tokens visuales para superficies, bordes y énfasis del portal.

## Compatibilidad editorial por módulo

La navegación se define en `client/src/app/public-modules.ts`. Esta configuración es la fuente común para:

- rutas;
- navegación principal;
- tarjetas del inicio;
- mapa del pie;
- metadatos;
- estrategia futura de consulta.

Se admiten tres estrategias:

| Estrategia | Módulos actuales | Consumo futuro |
| --- | --- | --- |
| Colección por tipo | Boletines, Noticias, Publicaciones | `GET /content?type=NEWSLETTER`, `NEWS` o `REPORT` |
| Página canónica | Ecosistema regional, Industria | `GET /content/{slug}` con `ecosistema-regional` o `industria-de-semiconductores` |
| Dominio estructurado | Vigilancia tecnológica | APIs públicas de señales, tendencias y alertas |

Esto permite que cada módulo tenga identidad y URL estable sin duplicar el renderer de bloques. Agregar otro módulo editorial consistirá en registrar su ruta y fuente; el contenido seguirá publicándose mediante el flujo editorial existente.

## Rutas incorporadas

- `/boletines`
- `/noticias`
- `/ecosistema-regional`
- `/vigilancia`
- `/publicaciones`
- `/industria`

Mientras FE-P2.3 no conecte las colecciones, las páginas editoriales muestran un estado informativo explícito y enlazan al índice general. No usan contenido ficticio. `/vigilancia` sí enlaza desde ahora a las rutas preparadas de señales, tendencias y alertas.

## Responsive y accesibilidad

- Navegación completa en escritorio y panel desplegable por debajo de 68 rem.
- Composición de inicio validada a 1440 × 1000 y 390 × 844 píxeles.
- Sin desplazamiento horizontal en los anchos revisados.
- Jerarquía única de `h1` por página y secciones identificadas por encabezado.
- Estados activos de navegación, foco visible y controles con nombre accesible.
- Metadatos específicos para módulos, autenticación, cuenta y vigilancia.
- Preferencia de movimiento reducido conservada desde la fundación.

## Pruebas y validación

- `npm run check`: tipos OpenAPI, lint, 30 pruebas en 10 archivos y build correctos.
- Pruebas de configuración: rutas e identificadores únicos, tipos editoriales y navegación derivada.
- Pruebas de integración: menú, landing modular, metadatos y relaciones de vigilancia.
- Playwright: 7 recorridos aprobados; el octavo corresponde al caso móvil y se omite deliberadamente en el proyecto de escritorio.
- Validación visual de inicio y menú en escritorio y móvil.
- Imagen Docker construida y rutas `/ecosistema-regional` y `/vigilancia` servidas correctamente por Nginx.

## Límites deliberados

- FE-P2.0 no lista todavía publicaciones reales; esa conexión pertenece a FE-P2.3.
- Señales, tendencias y alertas conservan sus pantallas preparadas hasta FE-P2.1 y FE-P2.2.
- Dashboard ejecutivo, indicadores, buscador, eventos y recursos no se anuncian como módulos funcionales porque aún no tienen API.
- No se agregaron tipos editoriales nuevos al backend; las páginas temáticas reutilizarán slugs publicados.

## Criterio de cierre

- El shell es navegable con teclado y responsive.
- Los módulos editoriales tienen rutas estables y una estrategia de datos explícita.
- Inicio, encabezado, menú y pie comparten una única configuración de módulos.
- Rutas, metadatos, pruebas, build y Nginx están verificados.

El siguiente incremento recomendado es **FE-P2.1 — Señales públicas**.
