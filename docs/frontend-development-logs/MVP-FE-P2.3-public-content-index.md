# FE-P2.3 — Índice editorial público

**Estado:** cerrado  
**Fecha:** 13 de julio de 2026

## Resultado

El portal ya consume la colección editorial pública y presenta un índice general en la ruta de contenido. El mismo índice alimenta las páginas de Boletines, Noticias y Publicaciones, fijando respectivamente los tipos NEWSLETTER, NEWS y REPORT definidos en la configuración de módulos.

## Alcance implementado

- Servicio tipado desde OpenAPI para la colección pública.
- Catálogos de tipos de contenido, categorías y factores críticos de vigilancia.
- Filtros persistentes en URL por búsqueda, tipo, categoría, FCV e intervalo de publicación.
- Orden por fecha de publicación o título.
- Paginación y estados de carga, error, vacío y actualización.
- Tarjetas con:
  - tipo y fecha de publicación;
  - título, resumen y categorías;
  - medio destacado cuando es una imagen pública;
  - alternativa gráfica cuando no existe una imagen utilizable;
  - enlace canónico basado exclusivamente en el slug público.
- Colecciones de módulos con tipo bloqueado, incluso si la URL intenta enviar otro tipo.
- Filtros abiertos en escritorio y plegados en móvil.

El índice no interpreta todavía las secciones y bloques del detalle editorial. Esa responsabilidad comienza en FE-P3, por lo que los enlaces canónicos pueden integrarse con el futuro renderizador sin cambiar las tarjetas ni las rutas.

## Validación

- TypeScript, ESLint y build de producción: correctos.
- 52 pruebas unitarias e integradas aprobadas.
- Playwright: 23 pruebas aprobadas en escritorio y móvil; 1 prueba de escritorio omitida por corresponder exclusivamente al menú móvil.
- Stack Docker construido correctamente.
- API real verificada con colección general y colección filtrada por NEWS.
- Catálogos reales observados: 9 tipos editoriales, 7 categorías y 9 factores críticos.
- Base limpia: 0 contenidos publicados; estados vacíos revisados en el índice general y en Noticias.
- Revisión visual responsive completada en escritorio y móvil.

## Próximo incremento

FE-P3.0 puede sustituir el placeholder de detalle por la página editorial pública y renderizar la estructura de secciones junto con los bloques heading, paragraph, quote, list, callout y divider.
