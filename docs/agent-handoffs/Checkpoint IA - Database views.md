# Handoff - Observatorio de Semiconductores de Querétaro

**Fecha:** Julio 2026

\---

# Estado actual del proyecto

Durante esta sesión quedó definida la arquitectura base del MVP tanto a nivel de infraestructura Docker como del modelo de datos del CMS editorial que alimentará al Observatorio.

Actualmente ya existe una base sólida para comenzar el desarrollo de la capa de backend.

\---

# Arquitectura

Se mantiene la arquitectura de tres capas.

```
Internet
      │
      ▼
    Nginx
      │
 ┌────┴────┐
 ▼         ▼
Frontend  Backend
(React)   (Express)
      │
      ▼
 PostgreSQL
```

## Desarrollo

En desarrollo:

* React ejecutándose mediante Vite.
* Nginx funcionando como Reverse Proxy.
* Express ejecutándose en modo watch.
* PostgreSQL como base de datos.

Todo orquestado mediante Docker Compose.

Se validó correctamente:

* Comunicación Frontend → Backend
* Comunicación Backend → PostgreSQL
* Proxy inverso mediante Nginx
* Hot Reload del frontend

\---

## Producción

En producción desaparece el contenedor de Vite.

La arquitectura queda:

```
Internet
      │
      ▼
    Nginx
      │
 ┌────┴────┐
 ▼         ▼
React Build Backend
(estático)
      │
      ▼
 PostgreSQL
```

El frontend únicamente genera archivos estáticos.

\---

# Modelo Editorial

Después del análisis del modelo original se decidió abandonar el almacenamiento de páginas HTML completas.

En su lugar se adoptó un CMS basado en bloques similar al utilizado por plataformas modernas (Notion, Gutenberg, Editor.js).

Cada contenido está compuesto por:

```
Contenido

↓

Versiones

↓

Secciones

↓

Bloques
```

Los bloques almacenan JSON en lugar de HTML.

React será responsable de renderizar los bloques.

\---

# Estructura editorial

Se definieron las entidades principales:

* Content
* Content Version
* Content Section
* Content Block

Además de las relaciones con:

* Categorías
* Señales
* Tendencias
* Alertas
* Recursos Multimedia

\---

# Versionado

Se incorporó versionado editorial.

Cada contenido puede tener múltiples versiones.

Cada versión contiene:

* secciones
* bloques
* historial de cambios

La versión publicada será consumida por el sitio público.

Las versiones anteriores únicamente estarán disponibles desde el CMS.

\---

# Secciones

Se añadió una capa intermedia entre contenido y bloques.

```
Contenido

↓

Versión

↓

Sección

↓

Bloques
```

Esto permitirá construir:

Noticias

```
Introducción

Contexto

Impacto

Conclusiones
```

Boletines

```
Resumen ejecutivo

Señales

Tendencias

Recomendaciones
```

Alertas

```
Descripción

Riesgo

Acciones sugeridas
```

sin necesidad de modificar código.

\---

# Catálogos

Se normalizaron prácticamente todos los catálogos.

Ahora todos siguen la convención:

```
id
code
name
description
active
```

cuando aplica.

Se agregaron catálogos para:

* FCV
* Categorías
* Tipos de contenido
* Tipos de bloque
* Tipos de sección
* Tipos de actor
* Tipos de fuente
* Estados
* Audiencias
* Impactos
* Urgencias
* Alcances
* Relaciones de contenido

También quedaron definidos los INSERT iniciales con la información del modelo de vigilancia tecnológica.

\---

# Modelo de Vigilancia

Se mantuvo completamente separado del CMS.

El modelo comprende:

Fuentes

↓

Señales

↓

Tendencias

↓

Alertas

además de:

Actores

Palabras clave

Audiencias

Relaciones entre entidades.

\---

# Vistas construidas

## Catálogos

Se definieron vistas para todos los catálogos.

Objetivo:

* evitar JOINs repetitivos
* mantener consistencia
* simplificar el backend

\---

## Usuarios

Se definieron vistas para:

* usuarios
* roles
* permisos

\---

## Vigilancia

Se desarrollaron vistas para:

* vw\_sources
* vw\_keywords
* vw\_actors
* vw\_signals
* vw\_signal\_keywords

\---

## Contenido

Se definió la estrategia para las vistas editoriales.

En lugar de una única vista enorme se decidió separar responsabilidades.

### vw\_content

Listado del CMS.

Incluye:

* tipo
* estado
* autor
* fecha
* publicación

\---

### vw\_content\_detail

Consumida por el sitio público.

Debe devolver:

Contenido

↓

Categorías

↓

Relaciones

↓

Versión publicada

↓

Secciones

↓

Bloques

Todo listo para que React renderice directamente.

\---

### vw\_content\_history

Consumida únicamente por el CMS.

Devuelve:

Contenido

↓

Versiones

↓

Autor

↓

Fecha

↓

Resumen de cambios

\---

### vw\_content\_version\_detail

Devuelve una versión específica.

Será utilizada para:

* editar
* restaurar
* comparar versiones

\---

### vw\_content\_relations

Agrupa:

* categorías
* señales
* tendencias
* alertas
* contenidos relacionados

para evitar repetir subconsultas.

\---

# Decisiones importantes

Se descartó:

* almacenar HTML
* construir páginas manualmente

Se adoptó:

* bloques JSON
* renderizado mediante React
* plantillas de contenido
* versionado editorial
* relaciones desacopladas

El CMS únicamente administra estructura y datos.

React se encarga de la presentación.

\---

# Estado de la Base de Datos

Actualmente se encuentran definidos:

✔ Catálogos

✔ Usuarios

✔ Vigilancia

✔ Editorial

✔ Relaciones

Pendientes:

* índices
* triggers
* funciones
* procedimientos almacenados
* reglas de negocio

\---

# Próximos pasos

## 1\. Finalizar vistas

Completar:

* vw\_content\_version\_detail

\---

## 2\. Índices

Agregar índices para:

* búsquedas
* FK
* fechas
* slugs
* business\_code
* categorías

\---

## 3\. Funciones

Diseñar funciones para:

* publicar contenido
* crear nueva versión
* restaurar versión
* generar código de negocio
* cambiar estados
* validar reglas editoriales

\---

## 4\. Triggers

Implementar:

* updated\_at automático
* incremento de versión
* auditoría
* historial de cambios
* consistencia de relaciones

\---

## 5\. Procedimientos almacenados

Implementar procedimientos para:

CMS

* crear contenido
* publicar
* archivar

Vigilancia

* registrar señal
* validar señal
* convertir señal → tendencia
* convertir tendencia → alerta

\---

## 6\. Backend (Express)

Una vez estabilizada la base de datos comenzar con:

```
Routes

↓

Controllers

↓

Services

↓

Repositories

↓

Views PostgreSQL
```

La capa Repository consumirá principalmente las vistas creadas.

\---

## 7\. Frontend

Posteriormente comenzar el CMS utilizando React.

La idea es que React únicamente renderice:

```
Secciones

↓

Bloques JSON
```

sin conocer la estructura interna de la base de datos.

\---

# Estado del proyecto

Se considera finalizada la etapa de diseño arquitectónico.

La siguiente fase corresponde a la consolidación de la base de datos (objetos SQL) para posteriormente iniciar la implementación del backend mediante Express.

