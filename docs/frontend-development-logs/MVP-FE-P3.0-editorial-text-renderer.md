# FE-P3.0 — Estructura editorial y bloques de texto

**Estado:** cerrado  
**Fecha:** 13 de julio de 2026

## Resultado

El placeholder del detalle editorial fue sustituido por una página pública conectada al endpoint de contenido por slug. La publicación presenta metadatos, clasificación, secciones y los seis bloques previstos para este incremento.

Las páginas editoriales configuradas como módulos, actualmente Ecosistema regional e Industria de semiconductores, consumen su slug fijo mediante el mismo renderizador sin cambiar su URL pública.

## Alcance implementado

- Consulta tipada del detalle público por slug.
- Validación local del slug y manejo de carga, error, 404 y publicaciones sin secciones.
- Encabezado editorial con tipo, fecha, título, resumen y categorías.
- Navegación contextual hacia Noticias, Boletines, Publicaciones o el índice general.
- Secciones normales y secciones colapsables accesibles.
- Renderizado de:
  - heading con niveles 2 a 6 y ancla validada;
  - paragraph en formato plano o Markdown seguro;
  - quote con atribución y fuente;
  - list ordenada o no ordenada;
  - callout con tonos info, warning, success y danger;
  - divider.
- Ajustes comunes permitidos: ancho, alineación y fondo.
- Bloques desconocidos o todavía no implementados se degradan a un aviso seguro sin romper el documento.
- Título dinámico del documento con el nombre de la publicación.

## Seguridad de Markdown

El renderizador no utiliza HTML crudo ni dangerouslySetInnerHTML. El marcado admitido se convierte directamente en nodos React:

- énfasis y texto fuerte;
- código en línea;
- saltos de línea;
- enlaces HTTP, HTTPS, relativos y anclas.

Los protocolos no permitidos se muestran como texto y cualquier etiqueta HTML permanece escapada.

## Validación

- TypeScript, ESLint y build de producción: correctos.
- 59 pruebas unitarias e integradas aprobadas.
- Playwright: 27 pruebas aprobadas en escritorio y móvil; 1 prueba de escritorio omitida por corresponder al menú móvil.
- Cuatro recorridos específicos del detalle repetidos contra el stack Docker: aprobados.
- Publicación temporal creada mediante los procedimientos editoriales reales.
- Respuesta pública comprobada: 2 secciones y 7 bloques.
- Revisión visual del documento y del colapsable completada en escritorio y móvil.

## Próximo incremento

FE-P3.1 puede incorporar los bloques table y chart, incluyendo una tabla equivalente accesible para cada visualización y estrategias responsive para conjuntos de datos anchos.
