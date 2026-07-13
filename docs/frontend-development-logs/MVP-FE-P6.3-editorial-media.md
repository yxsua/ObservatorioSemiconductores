# FE-P6.3 — Medios editoriales

**Estado:** cerrado  
**Fecha:** 13 de julio de 2026

## Resultado

Se incorporó `/admin/medios` como biblioteca protegida para imágenes y archivos editoriales. Editores y publicadores pueden cargar archivos, definir título, texto alternativo, descripción y visibilidad, consultar tarjetas con su estado y cambiar entre medio interno y público.

El constructor de composición ya no exige escribir manualmente un ID en los bloques `image` y `file`: abre la biblioteca filtrada, permite cargar un recurso y selecciona únicamente medios públicos. El formulario de metadatos editoriales utiliza el mismo selector para la imagen destacada.

Las cargas realizadas desde un selector editorial se marcan públicas de forma predeterminada porque el backend exige esa condición para incorporarlas a una composición publicable. La biblioteca independiente conserva el valor predeterminado interno.

## Validación

- TypeScript, ESLint y 106 pruebas frontend aprobadas;
- 63 pruebas backend aprobadas, incluidas las de filtros, carga obligatoria y frontera pública;
- carga multipart real contra PostgreSQL y el volumen `media_data`;
- cuatro recorridos Playwright editoriales aprobados, incluido el de la biblioteca;
- builds Docker de backend y frontend.

FE-P6 queda funcionalmente completo para el MVP. El siguiente bloque del plan es **FE-P7 — estabilización**.
