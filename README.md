# Arquitectura General del Observatorio de Semiconductores

## Introducción

La arquitectura propuesta para el Observatorio de Semiconductores sigue un modelo cliente-servidor basado en una arquitectura de tres capas, donde la interfaz de usuario, la lógica de negocio y el almacenamiento de datos se encuentran desacoplados. Esta organización permite desarrollar cada componente de manera independiente, facilita el mantenimiento del sistema y proporciona una base sólida para incorporar nuevas funcionalidades conforme evolucione el proyecto.

Todo el sistema será desplegado mediante contenedores Docker, lo que garantiza un entorno de ejecución consistente entre desarrollo, pruebas y producción. La comunicación entre los componentes se realizará mediante una API REST implementada en Express, mientras que la persistencia de la información estará a cargo de PostgreSQL.

\---

# Arquitectura General

La solución está conformada por cinco componentes principales:

* Frontend (React)
* Backend (Express)
* Base de Datos (PostgreSQL)
* Reverse Proxy (Nginx)
* Contenedores Docker

Adicionalmente, la arquitectura contempla la incorporación de un servicio **Worker** para la ejecución de tareas programadas relacionadas con la vigilancia tecnológica, así como un servicio de **Redis** para caché y optimización del rendimiento en versiones futuras.

## Flujo general de comunicación

El flujo de interacción dentro del sistema será el siguiente:

```text
Usuario
      │
      ▼
Frontend (React)
      │
      ▼
Nginx (Reverse Proxy)
      │
      ▼
Backend (Express)
      │
      ▼
PostgreSQL
```

En este modelo, el usuario interactúa únicamente con la interfaz web desarrollada en React. Todas las operaciones que requieren consultar o modificar información son enviadas mediante peticiones HTTP hacia la API REST implementada en Express.

El backend procesa la solicitud, aplica la lógica de negocio correspondiente y realiza las consultas o actualizaciones necesarias sobre la base de datos PostgreSQL. Finalmente, la información es devuelta al frontend en formato JSON para ser presentada al usuario.

\---

# Componentes de la Arquitectura

## Frontend

El frontend constituye la interfaz de usuario del observatorio y será desarrollado utilizando React.

Su principal responsabilidad consiste en presentar la información almacenada por el observatorio mediante una interfaz moderna, responsiva e intuitiva.

Entre sus funciones se encuentran:

* Navegación entre módulos.
* Consumo de la API REST.
* Visualización de dashboards.
* Consulta de noticias.
* Exploración del ecosistema regional.
* Consulta de indicadores.
* Visualización de señales y tendencias.
* Acceso al buscador inteligente.

El frontend no tendrá acceso directo a la base de datos.

Toda la información será obtenida exclusivamente mediante solicitudes HTTP hacia el backend.

\---

## Backend

El backend será implementado utilizando Express sobre Node.js.

Este componente concentra toda la lógica del sistema y actúa como intermediario entre la interfaz de usuario y la base de datos.

Sus principales responsabilidades son:

* Exponer la API REST.
* Validar las solicitudes recibidas.
* Gestionar autenticación y autorización.
* Ejecutar reglas de negocio.
* Consultar y actualizar PostgreSQL.
* Procesar información proveniente de fuentes externas.
* Administrar el CMS editorial.
* Gestionar el módulo de Vigilancia Tecnológica.

La separación entre controladores, servicios y acceso a datos facilita el mantenimiento y escalabilidad del sistema.

\---

## Base de Datos

La persistencia del sistema estará a cargo de PostgreSQL.

La base de datos almacenará la información correspondiente a:

* Usuarios y roles.
* Señales.
* Tendencias.
* Alertas.
* Indicadores.
* Ecosistema regional.
* Noticias.
* Publicaciones.
* Recursos.
* Archivos del CMS.
* Contenido editorial.
* Metadatos.
* Registros de auditoría.

El diseño contempla una estructura altamente normalizada que facilite el crecimiento del observatorio sin afectar la integridad de la información.

\---

## Nginx

Nginx actuará como Reverse Proxy del sistema.

Su función será centralizar el acceso hacia los distintos servicios y administrar el tráfico HTTP.

Entre sus responsabilidades destacan:

* Exponer una única dirección de acceso al sistema.
* Redireccionar solicitudes hacia React o Express.
* Servir archivos estáticos.
* Administrar certificados HTTPS.
* Facilitar futuras estrategias de balanceo de carga.

Gracias a este componente el usuario únicamente interactuará con un único punto de acceso.

\---

## Docker

Todos los servicios del observatorio serán ejecutados dentro de contenedores Docker.

Para iniciar el entorno de desarrollo:

```bash
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml --env-file .env.development up
```

El archivo de desarrollo descarta explícitamente el `build` productivo del frontend y usa la imagen oficial
`node:22-alpine`. No debe eliminarse ese `!reset`: evita que la imagen final de Nginx sea construida y etiquetada
accidentalmente como la imagen de Node al combinar ambos archivos Compose.

Esta estrategia ofrece diversas ventajas:

* Independencia del sistema operativo.
* Facilidad de despliegue.
* Reproducibilidad del entorno.
* Escalabilidad.
* Aislamiento entre componentes.
* Simplificación del mantenimiento.

Cada servicio contará con su propio contenedor independiente.

\---

# Contenedores Docker

La arquitectura contempla inicialmente los siguientes contenedores.

## Frontend

Contenedor encargado de ejecutar la aplicación React.

Funciones:

* Construcción de la aplicación.
* Servir recursos estáticos.
* Comunicación con la API.

\---

## Backend

Contenedor encargado de ejecutar Express.

Funciones:

* API REST.
* Autenticación.
* Lógica de negocio.
* CMS.
* Vigilancia tecnológica.

\---

## PostgreSQL

Contenedor dedicado al almacenamiento permanente de la información.

Los datos persistirán mediante volúmenes Docker para evitar pérdidas de información durante actualizaciones o reinicios.

\---

## Nginx

Recibe todas las solicitudes del usuario y las distribuye hacia los servicios correspondientes.

\---

## Worker (Opcional)

La arquitectura considera un contenedor independiente para la ejecución de procesos programados.

Entre ellos:

* Recolección automática de noticias.
* Actualización de indicadores.
* Procesamiento de señales.
* Generación de tendencias.
* Automatización de tareas de vigilancia tecnológica.

Este componente podrá incorporarse conforme evolucionen las funcionalidades del observatorio.

\---

## Redis (Futuro)

En versiones posteriores podrá incorporarse Redis como sistema de caché para mejorar el rendimiento de consultas frecuentes, dashboards e indicadores.

\---

# Organización del Proyecto

## Cuenta administrativa local predeterminada

Las instalaciones nuevas creadas mediante las migraciones incluyen una cuenta para visualización y desarrollo:

- correo: admin@admin.com
- contraseña inicial: l14Ar56@Bx16Z8!w

La contraseña se persiste como hash bcrypt y la cuenta recibe el rol ADMIN. Esta credencial es conocida y debe cambiarse antes de exponer el sistema en un entorno compartido o productivo.


La estructura del proyecto sigue una organización modular que facilita el mantenimiento y separación de responsabilidades.

```text
Observatorio-Semiconductores/
├── backend/
├── client/
├── database/
├── docker/
├── docs/
├── docker-compose.yml
└── README.md
```

\---

## backend/

Contiene toda la lógica del servidor Express.

### src/config

Configuraciones generales del sistema.

* Variables de entorno.
* Conexión a PostgreSQL.
* Parámetros globales.

### src/controllers

Reciben las solicitudes HTTP y coordinan la ejecución de los servicios correspondientes.

### src/middleware

Contiene componentes reutilizables para:

* Validaciones.
* Autenticación.
* Manejo de errores.
* Verificación de permisos.

### src/routes

Define todos los endpoints de la API REST.

Ejemplo:

```
GET /api/signals

POST /api/content

PUT /api/trends/{id}
```

### src/services

Implementa la lógica de negocio.

Aquí se realizarán operaciones como:

* Registro de señales.
* Creación de tendencias.
* Publicación de contenido.
* Gestión del CMS.

### src/repositories

Encapsula el acceso a PostgreSQL mediante consultas SQL o procedimientos almacenados, separando la lógica de persistencia del resto de la aplicación.

### src/jobs

Contendrá procesos programados relacionados con:

* Vigilancia tecnológica.
* Recolección automática de información.
* Actualización de indicadores.

### src/utils

Funciones auxiliares compartidas entre los distintos módulos.

\---

## client/

Contiene la aplicación React.

### api

Configuración de Axios y comunicación con la API.

### assets

Imágenes, iconos y recursos estáticos.

### components

Componentes reutilizables de la interfaz.

Por ejemplo:

* Cards
* Dashboards
* Tablas
* Formularios
* Gráficos

### context

Administración del estado global mediante Context API.

### hooks

Hooks personalizados reutilizables.

### layouts

Plantillas principales del sitio.

### pages

Páginas que conforman cada módulo del observatorio.

Ejemplos:

* Dashboard
* Vigilancia
* Noticias
* Ecosistema
* Recursos

### routes

Configuración de React Router.

### services

Funciones encargadas de consumir la API REST.

\---

## database/

Agrupa todos los scripts SQL del proyecto.

### migrations

Contendrá la creación del esquema completo.

Ejemplos:

* Tablas.
* Índices.
* Funciones.
* Triggers.
* Procedimientos.

### backups

Respaldos de la base de datos.

### utilities

Scripts auxiliares.

Por ejemplo:

* Validación.
* Reinicio del esquema.
* Carga inicial de datos.

\---

## docker/

Almacena todos los archivos relacionados con el despliegue.

Incluye:

* Dockerfiles.
* Configuración de Nginx.
* Scripts de inicialización.
* Configuración de volúmenes.

\---

## docs/

Concentra toda la documentación del proyecto.

Entre ella:

* Documento SRS.
* Benchmark de observatorios.
* Diagramas UML.
* Arquitectura.
* Mockups.
* Manuales técnicos.

\---

# Comunicación entre Componentes

Durante una consulta típica, el sistema opera de la siguiente manera:

1. El usuario accede al observatorio mediante su navegador.
2. La solicitud llega al contenedor de Nginx.
3. Nginx sirve la aplicación React.
4. React realiza solicitudes HTTP a la API REST.
5. Express recibe la petición.
6. Los controladores delegan el procesamiento a los servicios.
7. Los servicios consultan PostgreSQL mediante la capa de acceso a datos.
8. PostgreSQL devuelve la información solicitada.
9. Express responde con datos en formato JSON.
10. React renderiza la información y la presenta al usuario.

Este flujo desacopla completamente la presentación de la lógica de negocio y del almacenamiento de datos, facilitando el mantenimiento, la escalabilidad y la incorporación de nuevas funcionalidades.

\---

# Escalabilidad de la Arquitectura

La arquitectura fue diseñada considerando el crecimiento futuro del observatorio.

Entre las funcionalidades que podrán incorporarse posteriormente se encuentran:

* Procesamiento automático de señales.
* Generación de alertas tempranas.
* Integración con APIs externas.
* Motores de búsqueda especializados.
* Dashboards avanzados.
* Sistemas de recomendación.
* Publicación automática de boletines.
* CMS editorial completo.
* Balanceo de carga mediante múltiples instancias del backend.
* Caché distribuido mediante Redis.

Esta organización modular permite incorporar nuevos servicios sin modificar significativamente la estructura existente, garantizando una evolución progresiva del Observatorio de Semiconductores conforme aumenten las necesidades del proyecto.

