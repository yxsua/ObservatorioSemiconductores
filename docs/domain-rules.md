# Fase 0 - Reglas de dominio del MVP

## 1. Propósito y alcance

Este documento fija las reglas de negocio que deben guiar el contrato de la API y la implementación del backend del Observatorio de Semiconductores.

Las decisiones se basan, en este orden, en:

1. El alcance actual indicado para el proyecto.
2. El esquema SQL y el backend existentes.
3. Los documentos históricos de planeación y metodología.

La Fase 0 no implementa endpoints ni modifica todavía el esquema de la base de datos. Su resultado es un contrato de dominio que debe convertirse en migraciones, validaciones, servicios y pruebas durante las siguientes fases.

## 2. Principios del dominio

- Vigilancia tecnológica y contenido editorial son dominios separados.
- Una señal, tendencia o alerta puede existir sin convertirse en contenido editorial.
- El contenido editorial puede relacionarse con señales, tendencias y alertas sin duplicar sus datos.
- Los estados representan ciclos de revisión o publicación. Las relaciones entre entidades no son estados.
- Los códigos de catálogo son el contrato estable con el frontend. Los identificadores internos de catálogo no deben utilizarse como decisiones de interfaz.
- El backend toma la identidad y los permisos del token. El cliente no puede elegir autores, analistas, validadores ni publicadores arbitrariamente.
- Los borradores pueden estar incompletos. Las reglas metodológicas estrictas se aplican al solicitar revisión, validar o publicar.
- La automatización de tendencias y alertas queda fuera del MVP. El sistema puede calcular métricas y sugerencias, pero la decisión final es humana.

## 3. Confiabilidad e Índice de Prioridad de Señal

### 3.1 Confiabilidad

La confiabilidad debe evaluarse por señal, porque una misma fuente puede producir evidencias de distinta calidad.

Escala acordada:

| Código | Nombre | Peso | Criterio mínimo |
| --- | --- | ---: | --- |
| `LOW` | Baja | 1 | Evidencia indirecta, incompleta o no corroborada |
| `MEDIUM` | Media | 2 | Evidencia identificable y razonablemente sustentada |
| `HIGH` | Alta | 3 | Evidencia primaria, oficial o corroborada por fuentes independientes |

`sources.reliability` puede conservarse como reputación histórica de la fuente y utilizarse como sugerencia para el analista, pero no sustituye la evaluación de la señal.

### 3.2 Cálculo del IPS

El Índice de Prioridad de Señal se calcula exclusivamente en el servidor:

```text
IPS = impacto × urgencia × confiabilidad
```

Cada factor utiliza un peso entero de 1 a 3. El resultado se encuentra entre 1 y 27.

Clasificación inicial:

| Rango | Prioridad |
| ---: | --- |
| 1-7 | Baja |
| 8-17 | Media |
| 18-27 | Alta |

Reglas:

- El cliente envía códigos de impacto, urgencia y confiabilidad; nunca envía el IPS definitivo.
- El IPS se recalcula al modificar cualquiera de sus tres componentes.
- El valor almacenado puede usarse para ordenar y filtrar, pero debe ser reproducible a partir de los factores.
- Los umbrales son parámetros iniciales del MVP y podrán calibrarse con datos reales sin cambiar la fórmula.

## 4. Ciclo de vida de señales

### 4.1 Estados canónicos

```text
NEW -> UNDER_REVIEW -> VALIDATED -> ARCHIVED
  ^          |             |
  +----------+-------------+
           reapertura
```

| Estado | Significado |
| --- | --- |
| `NEW` | Borrador capturado por un analista |
| `UNDER_REVIEW` | Registro enviado a validación |
| `VALIDATED` | Evidencia revisada y aceptada |
| `ARCHIVED` | Registro retirado de operación sin eliminar su trazabilidad |

`LINKED_TO_TREND` y `ESCALATED_TO_ALERT` no deben ser estados. Se obtienen de la existencia de filas en `signal_trends` y `alert_signals`.

### 4.2 Transiciones

| Transición | Origen | Destino | Permiso |
| --- | --- | --- | --- |
| `SUBMIT_FOR_REVIEW` | `NEW` | `UNDER_REVIEW` | `signals:submit` |
| `REQUEST_CHANGES` | `UNDER_REVIEW` | `NEW` | `signals:validate` |
| `VALIDATE` | `UNDER_REVIEW` | `VALIDATED` | `signals:validate` |
| `REOPEN` | `VALIDATED` | `UNDER_REVIEW` | `signals:validate` |
| `ARCHIVE` | `NEW`, `UNDER_REVIEW`, `VALIDATED` | `ARCHIVED` | `signals:archive` |

No se permiten saltos directos de `NEW` a `VALIDATED`.

### 4.3 Reglas por etapa

Un borrador `NEW` requiere al menos título y analista.

Para enviarse a revisión requiere:

- título y resumen;
- fecha de publicación y fecha de captura válidas;
- URL de evidencia válida;
- fuente, categoría y FCV resoluble mediante la categoría;
- tipo, impacto, urgencia, confiabilidad y alcance;
- IPS calculado.

Para validarse requiere además:

- un validador distinto del analista que creó la señal;
- fuente activa;
- evidencia accesible según revisión humana;
- fecha y usuario de validación registrados.

## 5. Ciclo de vida de tendencias

### 5.1 Estados

```text
NEW -> UNDER_REVIEW -> VALIDATED -> ACTIVE -> ARCHIVED
  ^          |             |
  +----------+-------------+
```

- `VALIDATED` confirma que la tendencia cumple la metodología.
- `ACTIVE` indica que forma parte de las consultas públicas y del seguimiento vigente.
- Una tendencia archivada conserva todas sus relaciones.

### 5.2 Reglas de construcción

Una tendencia puede crearse como borrador sin señales para permitir un formulario progresivo.

Para enviarse a revisión requiere:

- título y narrativa;
- dirección propuesta;
- al menos tres señales relacionadas;
- todas las señales relacionadas en estado `VALIDATED`;
- al menos dos fuentes distintas;
- un FCV predominante y una justificación cuando existan señales de otros FCV.

Para validarse requiere revisión humana de:

- coherencia temática;
- consistencia de la dirección del cambio;
- ventana temporal pertinente;
- diversidad suficiente de fuentes;
- narrativa e implicaciones sustentadas por las señales vinculadas.

No debe modificarse el estado de una señal al vincularla o desvincularla de una tendencia.

### 5.3 Madurez

El backend calcula una madurez sugerida, pero el analista o validador confirma la clasificación.

| Madurez | Señales | Ventana orientativa | Otros criterios |
| --- | ---: | --- | --- |
| `EMERGING` | 3 o más | Hasta 6 meses | Al menos dos actores o fuentes independientes |
| `CONSOLIDATING` | 5 o más | Hasta 12 meses | Diversidad de actores o geografías |
| `ESTABLISHED` | 8 o más | Hasta 24 meses | Evidencia amplia y adopción sostenida |

La cantidad de señales por sí sola no cambia automáticamente la madurez.

## 6. Ciclo de vida de alertas

### 6.1 Estados

```text
NEW -> UNDER_REVIEW -> VALIDATED -> PUBLISHED -> CLOSED
  ^          |             |
  +----------+-------------+
```

### 6.2 Reglas

Una alerta puede crearse como borrador sin relaciones completas.

Para enviarse a revisión requiere:

- título y resumen ejecutivo;
- nivel de alerta;
- implicaciones;
- recomendaciones;
- al menos una señal validada o una tendencia validada/activa;
- al menos una audiencia;
- fecha límite de respuesta igual o posterior a la fecha de generación, cuando exista.

Para validarse requiere:

- validador distinto del creador;
- revisión de que las relaciones sustentan la interpretación;
- regla de activación o justificación registrada;
- fecha y usuario de validación.

Para publicarse requiere estado `VALIDATED`. La publicación no altera los estados de las señales o tendencias relacionadas.

Las alertas del MVP son manuales. `origin = MANUAL` es el valor predeterminado; los orígenes automáticos se reservan para una fase posterior.

## 7. Contenido editorial

### 7.1 Separación de responsabilidades

- La vigilancia conserva información estructurada y trazable.
- El CMS construye narrativas mediante contenido, versiones, secciones y bloques.
- Una publicación puede relacionarse con cero o más señales, tendencias y alertas.
- Los bloques `signal`, `trend` y `alert` deben guardar referencias, configuración de presentación o ambas; no deben copiar permanentemente la entidad relacionada.
- React renderiza únicamente tipos de bloque conocidos y validados.

### 7.2 Estados

```text
DRAFT -> UNDER_REVIEW -> APPROVED -> PUBLISHED -> ARCHIVED
```

Reglas:

- Solo una versión de un contenido puede considerarse publicada a la vez.
- Publicar debe ser una operación transaccional.
- Una versión publicada es inmutable. Cualquier cambio crea una nueva versión.
- Cada tipo de bloque debe tener un esquema de datos versionado y validado en backend.
- El contenido publicado puede existir sin estar relacionado con vigilancia.

## 8. Visibilidad y acceso

### 8.1 Información pública

Sin autenticación se puede consultar:

- contenido editorial en estado `PUBLISHED` y su versión publicada;
- señales en estado `VALIDATED` que no hayan sido archivadas;
- tendencias en estado `ACTIVE`;
- alertas en estado `PUBLISHED`;
- catálogos activos necesarios para filtros públicos.

Las respuestas públicas excluyen:

- notas internas;
- borradores e historial editorial;
- correos y otros datos personales;
- IDs de analistas, validadores y publicadores, salvo que posteriormente se decida mostrar atribución pública;
- rutas internas de almacenamiento;
- información de auditoría interna.

### 8.2 Usuario registrado

Una cuenta registrada añade:

- descarga y exportación;
- acceso a su propio perfil;
- preferencias o historial de descargas cuando se implemente.

Registrarse no concede permisos de captura, edición, validación o publicación.

### 8.3 Personal autorizado

El personal ve registros de acuerdo con permisos, incluyendo borradores, relaciones, notas e historial necesarios para su trabajo.

## 9. Roles y permisos

### 9.1 Roles iniciales

| Rol | Propósito |
| --- | --- |
| `MEMBER` | Cuenta pública registrada y exportaciones |
| `ANALYST` | Captura y análisis de vigilancia |
| `VALIDATOR` | Revisión y validación metodológica |
| `EDITOR` | Creación y edición del CMS |
| `PUBLISHER` | Aprobación y publicación editorial |
| `ADMIN` | Administración completa, usuarios y catálogos |

Los roles agrupan permisos; los servicios autorizan por permiso y no por nombre de rol.

### 9.2 Permisos mínimos

```text
profile:read-own
profile:update-own
exports:download

signals:read-internal
signals:create
signals:update-own
signals:update-any
signals:submit
signals:validate
signals:archive

trends:read-internal
trends:create
trends:update
trends:link-signals
trends:submit
trends:validate
trends:activate
trends:archive

alerts:read-internal
alerts:create
alerts:update
alerts:link-evidence
alerts:submit
alerts:validate
alerts:publish
alerts:close

content:read-internal
content:create
content:update
content:submit
content:approve
content:publish
content:archive

catalogs:manage
users:manage
roles:manage
```

Asignación inicial:

- `MEMBER`: perfil propio y exportaciones.
- `ANALYST`: permisos de miembro, captura de señales y creación de tendencias/alertas.
- `VALIDATOR`: lectura interna y validación de vigilancia.
- `EDITOR`: lectura interna editorial, creación, edición y envío a revisión.
- `PUBLISHER`: lectura interna editorial, aprobación, publicación y archivo.
- `ADMIN`: todos los permisos.

Una persona puede tener varios roles.

## 10. Identidad, auditoría y concurrencia

- `created_by`, `author_id`, `id_analyst`, `id_creator` y equivalentes se obtienen del usuario autenticado.
- Los cambios de estado registran actor, fecha y notas de transición.
- No se realiza borrado físico de señales, tendencias, alertas ni contenido publicado.
- Las operaciones que crean una entidad y sus relaciones se ejecutan en una transacción.
- Las actualizaciones deben detectar escrituras concurrentes mediante `updated_at` o un campo de versión.
- La API devuelve `409 Conflict` cuando el cliente intenta guardar sobre una versión desactualizada.

## 11. Errores de dominio

Los servicios deben convertir errores internos en códigos estables:

| Código HTTP | Código de dominio | Uso |
| ---: | --- | --- |
| 400 | `VALIDATION_ERROR` | Formato o campos inválidos |
| 401 | `AUTHENTICATION_REQUIRED` | Token ausente o inválido |
| 403 | `PERMISSION_DENIED` | Usuario sin permiso |
| 404 | `RESOURCE_NOT_FOUND` | Entidad inexistente o no visible |
| 409 | `INVALID_TRANSITION` | Cambio de estado no permitido |
| 409 | `CONCURRENT_MODIFICATION` | Versión desactualizada |
| 422 | `DOMAIN_RULE_VIOLATION` | Datos válidos que incumplen metodología |

Los mensajes de PostgreSQL no se exponen directamente al cliente.

## 12. Cambios requeridos antes de la Fase 2

El esquema actual deberá ajustarse mediante una nueva migración, sin reescribir migraciones ya aplicadas:

1. Añadir catálogo y referencia de confiabilidad por señal.
2. Hacer que el IPS sea calculado y no aceptado como autoridad desde el cliente.
3. Añadir `ARCHIVED` a estados de señal.
4. Retirar progresivamente `LINKED_TO_TREND` y `ESCALATED_TO_ALERT` como estados operativos.
5. Evitar que `sp_link_signal_to_trend` cambie el estado de la señal.
6. Validar señales antes de vincularlas a una tendencia que vaya a revisión.
7. Añadir operaciones de vinculación/desvinculación para alertas.
8. Crear seeds de roles, permisos y asignaciones.
9. Implementar índices y auditoría de transiciones.
10. Definir cuál versión editorial está publicada de manera inequívoca.

## 13. Parámetros ajustables

Estas decisiones pueden calibrarse sin cambiar el modelo conceptual:

- umbrales de prioridad IPS;
- cantidad y diversidad mínima de fuentes para tendencias;
- ventanas temporales de madurez;
- exposición pública de señales validadas;
- atribución pública de autores o analistas;
- política de conservación del historial de descargas;
- tipos de exportación habilitados en el MVP.

Mientras no exista una decisión posterior documentada, se utilizarán los valores de este documento.

## 14. Criterio de cierre de la Fase 0

La Fase 0 se considera cerrada cuando:

- estas reglas sean aceptadas como línea base;
- los parámetros ajustables que bloqueen la API estén confirmados;
- cada regla crítica tenga un caso de prueba identificable;
- la Fase 1 pueda definir OpenAPI, permisos y migraciones sin decisiones de dominio pendientes.
