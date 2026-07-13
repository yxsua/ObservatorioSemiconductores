# FE-P2.2 — Tendencias y alertas públicas

**Estado:** cerrado  
**Fecha:** 13 de julio de 2026

## Resultado

Se sustituyeron los placeholders de las rutas públicas de tendencias y alertas por verticales conectadas a la API real. Las vistas respetan las reglas de visibilidad del backend: tendencias ACTIVE y alertas PUBLISHED o CLOSED.

## Alcance implementado

- Servicios tipados desde OpenAPI para colecciones, detalles y catálogos.
- Filtros y orden persistidos en la URL:
  - tendencias: búsqueda, dirección y madurez;
  - alertas: búsqueda, estado público, nivel y audiencia.
- Paginación, carga, error, colección vacía y actualización conservando resultados previos.
- Tarjetas accesibles con métricas y fechas relevantes.
- Detalle de tendencias con implicaciones, señales validadas, actores y métricas públicas.
- Detalle de alertas con orientación, regla de activación, audiencias, señales, tendencias y vigencia.
- Navegación cruzada hacia señales y tendencias relacionadas.
- Estilos responsive compartidos; los filtros se muestran abiertos en escritorio y plegados en móvil.
- Extracción del consumo genérico de catálogos para reutilizarlo también desde señales.

No se renderizan campos internos como notas metodológicas, analistas, creadores, validadores o publicadores. El frontend tampoco recalcula métricas, madurez o nivel: presenta los valores públicos enviados por el backend.

## Validación

- TypeScript, ESLint y build de producción: correctos.
- Pruebas nuevas de filtros, colecciones, detalles, relaciones navegables y ausencia de información interna.
- Playwright: 19 pruebas aprobadas en escritorio y móvil; 1 prueba de escritorio omitida por diseño del escenario móvil.
- Docker: construcción completa correcta y endpoints reales verificados.
- Catálogos reales observados: 4 direcciones, 3 niveles de madurez, 3 niveles de alerta y 7 audiencias.
- Base limpia: 0 tendencias activas y 0 alertas públicas; ambos estados vacíos se verificaron visualmente.

## Próximo incremento

FE-P2.3 puede implementar el índice editorial público sobre la API de contenido, con filtros por módulo y clasificación, tarjetas de contenido publicado y navegación canónica por slug.
