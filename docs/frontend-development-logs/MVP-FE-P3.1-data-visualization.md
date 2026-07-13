# FE-P3.1 — Datos y visualización

**Estado:** cerrado  
**Fecha:** 13 de julio de 2026

## Alcance entregado

El renderizador editorial público incorpora bloques de tabla y gráfica con validación en tiempo de ejecución. Un bloque inválido no intenta representar información potencialmente engañosa y utiliza el estado seguro ya existente para contenido no compatible.

### Tablas

- Estructura semántica con título, encabezados y cuerpo.
- Columnas de texto, número, booleano y fecha, además de valores nulos.
- Formatos localizados para español de México.
- Desplazamiento horizontal local y enfocable en pantallas estrechas, sin ampliar el documento completo.
- Representación estable de conjuntos sin registros.

### Gráficas

- SVG nativo, sin añadir una dependencia de visualización.
- Barras agrupadas con valores positivos y negativos, líneas, áreas con base en cero y gráfica circular.
- Validación de etiquetas, series, longitudes, valores numéricos y colores hexadecimales.
- La gráfica circular exige una sola serie, valores no negativos y un total mayor que cero.
- Título y descripción accesibles, leyenda y reducción de etiquetas cuando el conjunto es amplio.
- Cada gráfica incluye una tabla desplegable con los mismos datos como alternativa accesible y verificable.

## Validación

- TypeScript, ESLint y compilación de producción correctos.
- 66 pruebas unitarias y de integración aprobadas.
- Suite Playwright: 29 pruebas aprobadas y una omisión esperada exclusiva de escritorio.
- Compilación y ejecución del conjunto completo mediante Docker.
- Revisión con una publicación temporal que incluyó una tabla y las cuatro variantes de gráfica.
- Verificación semántica y visual en escritorio y móvil; se corrigió el desbordamiento horizontal global para confinarlo a la tabla.

## Siguiente incremento

FE-P3.2 puede incorporar referencias y medios editoriales sobre la misma arquitectura de validación, resolución y estados seguros.

