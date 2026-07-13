# Estado del backend y preparación para el frontend

**Fecha de revisión:** 13 de julio de 2026

**Contrato vigente:** OpenAPI 0.5.6

**Conclusión:** **listos para iniciar el frontend, con condiciones acotadas**.

## Resumen ejecutivo

El backend ya ofrece un contrato suficientemente estable para construir el portal público, la autenticación, las vistas internas de vigilancia, el flujo editorial basado en bloques y las exportaciones. La API implementada y el contrato OpenAPI tienen 62 operaciones cada uno, organizadas en 53 rutas. Las 56 pruebas unitarias pasan y los flujos integrales más recientes validaron alertas, publicación editorial, resolución pública de bloques, medios y exportaciones.

No es necesario esperar a que el backend esté “cerrado” para comenzar el frontend. Hay dos brechas que sí deben resolverse antes de completar todas las funciones: todavía no existe una API administrativa para cargar y seleccionar medios, y la configuración productiva referencia un archivo Nginx que no existe. Ninguna bloquea el arranque del portal público ni de la mayoría de las pantallas internas.

## Alcance disponible

| Área | Estado | Capacidad disponible para el frontend |
| --- | --- | --- |
| Infraestructura | Lista para desarrollo | PostgreSQL, Express, React y Nginx integrados mediante Docker y prefijo `/api`. |
| Autenticación | MVP listo | Registro, inicio de sesión, perfil actual, JWT, roles y permisos efectivos. |
| Catálogos | Listo | Descubrimiento y consulta de catálogos para formularios. |
| Señales | Listo | Consulta pública, CRUD interno, filtros, validaciones, transiciones e historial. |
| Tendencias | Listo | Consulta pública, gestión interna, relaciones con señales y actores, transiciones e historial. |
| Alertas | Listo | Consulta pública, gestión interna, relaciones con señales, tendencias y audiencias, publicación y cierre. |
| Editorial | Núcleo listo | Contenido, versiones, composición, vista previa, historial, aprobación y publicación. |
| Bloques | Listo | Contratos para `heading`, `paragraph`, `quote`, `list`, `callout`, `divider`, `image`, `file`, `table`, `chart`, `signal`, `trend` y `alert`. |
| Consulta pública | Lista | Listados y detalles publicados, resolución segura de referencias y exclusión de datos internos. |
| Medios | Parcial | Entrega pública de imágenes y descarga autenticada; falta carga y catálogo administrativo. |
| Exportaciones | Listas | CSV y JSON para señales, tendencias, alertas y contenido, con historial por usuario. |
| Contrato | Listo | `docs/API-docs/openapi.yaml` 0.5.6 y convenciones uniformes de respuestas, errores y paginación. |

## Reglas de integración que debe respetar el frontend

- Consumir la API mediante rutas relativas bajo `/api`; Nginx mantiene frontend y backend en el mismo origen.
- Guardar el JWT recibido por registro o inicio de sesión y enviarlo como `Authorization: Bearer <jwt>`.
- Recuperar la sesión y las capacidades con `GET /api/auth/me`.
- Habilitar acciones con `user.permissions`, no comparando nombres de roles.
- Tratar `401` como sesión ausente o vencida y `403` como falta de permiso.
- Usar el sobre común `{ success, message, data }` y el contrato de error `{ success, message, code, errors }`.
- Respetar `page`, `pageSize`, filtros y orden definidos por cada colección.
- En ediciones internas, conservar y reenviar `updatedAt` cuando el endpoint lo utilice para concurrencia optimista.
- Ejecutar cambios de estado mediante transiciones semánticas; el cliente no debe asignar estados directamente.
- Construir el renderizador editorial a partir de `GET /api/admin/editorial/block-types` y del contrato de cada bloque.
- Renderizar el contenido público usando únicamente las secciones y bloques devueltos; el backend ya filtra referencias retiradas u ocultas.
- Procesar exportaciones como archivos y leer `Content-Disposition`, `X-Row-Count` y `X-Checksum-SHA256` cuando sea necesario.

## Brechas y riesgos conocidos

### Necesarios antes de completar el MVP

1. **Administración de medios.** Sólo existen lectura y descarga por ID. Para que el editor pueda crear bloques `image` y `file` sin intervención en base de datos hace falta una API autenticada de carga, listado/selección y metadatos de medios.
2. **Despliegue productivo.** `docker-compose.prod.yaml` monta `docker/nginx/production.conf`, pero ese archivo no existe actualmente. Debe crearse y validarse antes de desplegar producción.

### No bloqueantes para iniciar el frontend

- La sesión no tiene refresh token, cierre de sesión servidor, recuperación de contraseña ni verificación de correo. Para el MVP el cliente puede eliminar el JWT al cerrar sesión y volver al login cuando expire.
- Las plantillas editoriales son de sólo lectura y una base nueva puede no contener plantillas. La creación de contenido permite trabajar sin plantilla, pero conviene definir datos iniciales antes de diseñar esa experiencia.
- La cobertura automática no es uniforme en las 62 operaciones. Existen pruebas sólidas de dominio y flujos E2E principales, pero conviene añadir pruebas de contrato y recorridos frontend-backend en CI.
- No hay todavía rate limiting, telemetría ni una estrategia formal de observabilidad. Son tareas de endurecimiento previas a una exposición pública amplia.
- Permanecen algunos middlewares antiguos sin uso en `backend/src/middleware`; su limpieza es deuda técnica y no altera el contrato.

## Fuera del alcance implementado

El README describe capacidades futuras que no deben asumirse disponibles en el frontend actual: indicadores, ecosistema regional, buscador inteligente, ingesta automática de fuentes, dashboards analíticos especializados, worker y Redis. Estas funciones requieren una fase posterior de definición de dominio y API.

## Próximos pasos recomendados

1. **Fundación del frontend:** crear en React el router, cliente HTTP, manejo uniforme de errores, sesión, guardas por permiso, tipos/DTO y componentes de paginación y filtros.
2. **Portal público:** implementar contenido, señales, tendencias y alertas; después construir el renderizador de los trece tipos de bloque.
3. **Cuenta y exportación:** agregar registro, login, recuperación de sesión, descargas y el historial propio.
4. **Módulos internos:** construir formularios y flujos de señales, tendencias y alertas usando catálogos y transiciones.
5. **Editor:** implementar listado, versiones, composición, vista previa y publicación. Los bloques de imagen y archivo deben quedar condicionados a la API administrativa de medios.
6. **Trabajo backend paralelo:** agregar administración de medios, datos iniciales editoriales, configuración Nginx productiva y automatización de pruebas de contrato/E2E.

## Criterio de decisión

Se recomienda **comenzar el frontend ahora** y tratar OpenAPI 0.5.6 como línea base. Los cambios incompatibles del backend deberán reflejarse en una nueva versión del contrato. La API de medios y la configuración productiva pueden desarrollarse en paralelo, siempre que se cierren antes de declarar completo el editor y preparar el despliegue del MVP.
