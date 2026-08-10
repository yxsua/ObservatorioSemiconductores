# FE-P7.1 — Ajuste visual del portal

Fecha: 13 de julio de 2026.

## Sistema visual

Se incorporó la paleta institucional solicitada:

- tinta: `#0B1322`;
- azul principal: `#18427A`;
- naranja de énfasis: `#F18F2E`;
- texto secundario: `#66758F`;
- fondo: `#E6E7EE`.

También se definieron los tokens que faltaban para `--space-5` y `--color-background`, se ampliaron paddings de controles y tarjetas, y se añadieron radios y sombras compartidas.

## Portal público

- Logo institucional integrado en encabezado y portada.
- Hero de mayor escala, tipografía más definida e imagen principal amplia.
- Vigilancia Tecnológica diferenciada mediante el acento naranja en navegación y una tarjeta oscura destacada.
- Tarjetas editoriales con imágenes de 15 rem, mayor padding y jerarquía tipográfica.
- Tarjetas de señales, tendencias y alertas con acento naranja y elevación controlada.
- Footer en tinta oscura y módulos con superficies más amplias.
- Página de Vigilancia rediseñada como área prioritaria, separada visualmente del contenido editorial convencional.

## Verificación

- TypeScript, ESLint y build productivo correctos.
- Presupuesto de bundle aprobado: chunk inicial de 443.64 KiB.
- 5 pruebas unitarias del shell y controles aprobadas.
- 7 verificaciones E2E efectivas en escritorio y móvil; tres exclusiones intencionales por perfil.
- Inspección visual a 1440 × 1000 y 390 × 844.
- Sin errores de consola ni desbordamiento horizontal en móvil.
- Imágenes Docker actualizadas y stack productivo ejecutándose en el puerto 80.
