# FE-P7.2 — Contenido metodológico, ayudas y visitas

## Alcance entregado

- Página pública `/acerca-de` con propósito, perfiles de trabajo, gobernanza y principios del equipo.
- Página `/vigilancia` enriquecida con el proceso fuente → señal → tendencia → alerta → producto, los nueve FCV y las reglas esenciales de IPS, madurez y nivel de alerta.
- Ayudas contextuales accesibles en los formularios administrativos de señales, tendencias, alertas y fuentes.
- Filtros públicos reorganizados: búsqueda, categoría y fechas permanecen visibles; criterios metodológicos y orden quedan en `Filtros avanzados`. Tendencias filtran la fecha de primera señal y alertas la fecha de generación.
- Contador público de visitas para contenido editorial, señales, tendencias y alertas. Noticias, boletines y publicaciones utilizan el recurso editorial `content`.

## Contrato de visitas

La migración `database/migrations/22_public_view_counts.sql` agrega un contador polimórfico agregado por tipo e identificador. La API expone:

- `GET /api/views/{resourceType}/{resourceId}` para consultar el total.
- `POST /api/views/{resourceType}/{resourceId}` para incrementarlo de forma atómica.

Los tipos permitidos son `content`, `signal`, `trend` y `alert`. Antes de consultar o incrementar, el backend confirma que el recurso conserva un estado público. El navegador registra como máximo una visita por recurso durante la sesión mediante `sessionStorage`; el servidor sigue siendo la autoridad del total.

## Decisiones de contenido

- Las matrices completas permanecen fuera del boletín y se resumen en la página metodológica.
- Se explicita que una noticia no equivale a una señal y que un patrón sin umbrales suficientes no es una tendencia formal.
- Se diferencia el IPS de una señal del nivel de una alerta.
- La página de equipo usa funciones documentadas, sin inventar nombres personales no presentes en el material fuente.

## Verificación

- TypeScript: correcto.
- ESLint: correcto.
- Vitest con dos trabajadores: 34 archivos y 108 pruebas correctas.
- Build de producción Vite: correcto.
- Sintaxis de los nuevos módulos CommonJS del backend: correcta.
- La ejecución de la migración y la prueba HTTP contra PostgreSQL quedan pendientes de un motor Docker activo en el host.
