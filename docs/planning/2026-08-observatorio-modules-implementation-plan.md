# Plan de implementación de módulos públicos

**Fecha:** 20 de agosto de 2026  
**Base:** revisión del código, contrato API, migraciones y *Reporte final: Pertinencia de la industria de semiconductores en el Estado de Querétaro* (TecNM-ITQ, 2025).

## Diagnóstico

La plataforma ya cuenta con una base de producción sólida: React/TypeScript, rutas públicas, layout responsivo, CMS editorial, autenticación, roles, exportaciones y los dominios completos de señales, tendencias y alertas. El portal y los flujos internos disponen de pruebas automatizadas y despliegue con Docker.

La brecha principal no es infraestructura sino producto público: la navegación no refleja aún la arquitectura solicitada y faltan las vistas de consulta para Indicadores de pertinencia, Ecosistema regional, Cadena de valor, Inversiones y expansión, Eventos, Recursos, Buscador inteligente y Dashboard ejecutivo. El modelo de datos actual tampoco cubre entidades especializadas para indicadores, actores del ecosistema, inversiones ni eventos; en esta fase deben publicarse como contenido curado y estático, con una ruta posterior a datos administrables.

## Arquitectura de información aprobada

1. Inicio.
2. Dashboard ejecutivo.
3. Industria de semiconductores (menú): Indicadores de pertinencia, Ecosistema regional, Cadena de valor e Inversiones y expansión.
4. Noticias.
5. Publicaciones.
6. Eventos.
7. Recursos.
8. Vigilancia tecnológica (menú): Buscador inteligente, Señales, Alertas y Tendencias.
9. Inicio de sesión y Cuenta.

Las categorías principales conservan una ruta propia; el desplegable sólo es un acceso adicional a sus submódulos. En móvil, los mismos enlaces se presentan de manera expandida y navegable por teclado.

## Fases

### Fase 1 - Portal informativo y navegación (entrega actual)

- Implementar las rutas públicas y el menú exacto definido arriba.
- Publicar contenido estático curado desde el informe: SAM 2025 y 2030, cinco dimensiones del SIIP, capacidades regionales, cadena de valor y escenarios.
- Incorporar referencias externas visibles para cifras sujetas a cambio.
- Crear Dashboard Ejecutivo con selector de horizonte y visualización SVG accesible; será el único módulo interactivo en esta etapa.
- Mantener Noticias y Publicaciones conectados al CMS ya existente; Eventos y Recursos quedan inicialmente curados para evitar presentar calendarios o bases de datos desactualizados.

**Criterio de salida:** todas las rutas son navegables, responsivas, accesibles y compilan sin nueva dependencia de visualización.

### Fase 2 - Administración de datos estructurados

- Añadir dominios y API para `indicators`, `ecosystem_actors`, `investments`, `events` y `resources` con fuente, fecha de corte, responsable y estado de publicación.
- Migrar los datos curados a registros administrables y reutilizar el flujo editorial de revisión/publicación.
- Añadir archivos adjuntos, periodos de vigencia, etiquetas y relación con señales/tendencias.

**Criterio de salida:** ningún dato variable depende de cambios de código y cada registro conserva trazabilidad de fuente y fecha.

### Fase 3 - Dashboard conectado

- Exponer agregados versionados para el dashboard, con metadatos de metodología y fecha de actualización.
- Sustituir los valores iniciales por consultas API; incorporar filtros de periodo y descarga de tabla de datos.
- Conservar la alternativa tabular y pruebas de exactitud de agregados.

**Criterio de salida:** todas las gráficas provienen de datos validados, muestran fuente/corte y tienen alternativa accesible.

### Fase 4 - Búsqueda y mantenimiento

- Unificar la búsqueda de contenido, señales, tendencias y alertas en un índice público con facetas.
- Definir calendarios de revisión: indicadores trimestral/semestral, inversiones y eventos mensual, recursos bajo demanda y noticias continua.
- Instrumentar visitas por módulo y revisar consultas sin resultado para priorizar nuevas fuentes y contenidos.

## Datos iniciales y gobernanza

El informe 2025 es fuente metodológica y de línea base, no una fuente en tiempo real. Cada ficha mostrará su fecha de corte y se diferenciarán claramente las estimaciones del estudio de las cifras oficiales actualizadas. Para la primera carga se usarán como referencias públicas: INEGI, Data México/Secretaría de Economía, Plan Maestro de Semiconductores, comunicados de inversiones y fuentes institucionales de los actores.

## Riesgos a controlar

- No presentar proyecciones o anuncios como hechos consumados; usar etiquetas de *estimación*, *proyecto anunciado* o *cifra oficial*.
- No automatizar alertas ni inferencias de IA en la fase informativa.
- No usar el CMS como sustituto permanente del modelo de datos de indicadores e inversiones; la Fase 2 es necesaria antes de prometer actualización continua.
