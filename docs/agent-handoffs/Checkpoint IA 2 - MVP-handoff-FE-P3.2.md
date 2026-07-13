# Handoff del MVP — continuación desde FE-P3.2

**Fecha de corte:** 13 de julio de 2026  
**Estado:** FE-P3.1 cerrado; el siguiente incremento es FE-P3.2  
**Raíz del proyecto:** `C:\Observatorio\MVP`

## 1. Objetivo del proyecto

El repositorio implementa el MVP del Observatorio de Semiconductores. El backend administra autenticación, permisos, señales, tendencias, alertas, contenido editorial, resolución pública de bloques, medios y exportaciones. El frontend se está construyendo de forma incremental sobre el contrato real del backend.

La prioridad vigente es terminar el renderizador editorial público antes de avanzar a cuenta/exportaciones y, posteriormente, a los flujos administrativos.

## 2. Principios que se han seguido

- El contrato de la API es la fuente de verdad. No inventar DTO que contradigan OpenAPI.
- La interfaz habilita acciones según permisos, no según nombres de roles.
- El backend decide estados, cálculos de dominio, relaciones y visibilidad pública.
- Los filtros públicos se conservan en la URL.
- Cada incremento incluye implementación, pruebas, revisión responsive y documentación.
- Los bloques editoriales se validan en tiempo de ejecución. Datos inválidos o tipos desconocidos deben degradarse de forma segura sin romper la publicación.
- No se debe sobrescribir ni limpiar el trabajo existente: el árbol de trabajo contiene los incrementos frontend aún sin consolidar en Git.

## 3. Estado actual

### Backend

Está implementado hasta la Fase 5.6:

- autenticación, sesión, roles y permisos;
- verticales internas y públicas de señales, tendencias y alertas;
- flujo editorial, versiones, composición, validación y publicación;
- API editorial interna y API pública de contenido;
- resolución de referencias editoriales;
- entrega y descarga de medios existentes;
- exportaciones CSV/JSON para usuarios registrados e historial propio.

El contrato vigente es OpenAPI `0.5.6`.

También existe la migración `database/migrations/18_default_admin_user.sql`. En una base nueva crea una cuenta administrativa local:

- correo: `admin@admin.com`
- contraseña inicial: `l14Ar56@Bx16Z8!w`
- rol: `ADMIN`

La contraseña se almacena como hash bcrypt. La migración es idempotente y el inicio de sesión se verificó desde un volumen vacío con 36 permisos. Es una credencial conocida de desarrollo y debe cambiarse antes de usar un entorno compartido o productivo.

### Frontend terminado

- FE-P0: contrato de experiencia y decisiones visuales.
- FE-P1.0: React, TypeScript, Vite, ESLint, Vitest y Playwright.
- FE-P1.1: cliente API tipado, errores, paginación y descargas.
- FE-P1.2: router, providers, autenticación, sesión y guardas por permiso.
- FE-P2.0: shell y módulos públicos.
- FE-P2.1: listado y detalle público de señales.
- FE-P2.2: listados y detalles públicos de tendencias y alertas.
- FE-P2.3: índice editorial público y rutas canónicas por slug.
- FE-P3.0: secciones editoriales y bloques `heading`, `paragraph`, `quote`, `list`, `callout` y `divider`.
- FE-P3.1: bloques `table` y `chart` con barras, línea, área y pastel.

Las gráficas usan SVG nativo y ofrecen una tabla equivalente. Las tablas tienen semántica accesible y desplazamiento horizontal local. El renderizador actual muestra un estado seguro para bloques inválidos o aún no soportados.

### Frontend todavía pendiente

- FE-P3.2: referencias y medios editoriales.
- FE-P4.0 y FE-P4.1: cuenta completa, descarga e historial de exportaciones.
- FE-P5: administración de señales, tendencias y alertas.
- FE-P6: gestión y constructor editorial interno.
- FE-P7: estabilización final.

Las rutas de exportaciones y de administración existen, pero actualmente muestran páginas placeholder. La autenticación, las guardas y el layout administrativo que las rodean sí están implementados.

## 4. Próximo incremento: FE-P3.2

### Alcance

Implementar los cinco bloques restantes del renderizador público:

- `signal`
- `trend`
- `alert`
- `image`
- `file`

Las referencias de vigilancia deben soportar las variantes `compact`, `card` y `featured`. Los medios deben utilizar exclusivamente las URL controladas que entrega el backend.

### Regla crítica de integración

Los componentes no deben consultar nuevamente una entidad a partir de `data.entityId` ni construir una URL desde `data.mediaId`. Deben representar exclusivamente `block.resolved`.

El backend ya resuelve referencias mediante `backend/src/services/blockResolver.service.js`. Una entidad no pública o un medio inexistente puede ser retirado de la composición pública. El frontend también debe tolerar un objeto `resolved` ausente, incompleto o desconocido y usar el estado seguro existente.

### Secuencia sugerida

1. Revisar `ResolvedBlock`, `ResolvedEntityBlock`, `ResolvedMediaBlock` y `PublicBlock` en OpenAPI y regenerar tipos sólo si el contrato cambió.
2. Crear validadores en tiempo de ejecución para las referencias y medios resueltos.
3. Crear un componente reutilizable para referencias de vigilancia y adaptar presentación, densidad y metadatos a `compact`, `card` y `featured`.
4. Reutilizar las rutas públicas recibidas en `resolved.href`; no duplicar reglas para construir enlaces.
5. Crear el bloque de imagen con texto alternativo obligatorio, pie opcional y enlace opcional validado.
6. Crear el bloque de archivo con etiqueta, descripción, nombre, tipo, tamaño y `downloadUrl` cuando estén disponibles.
7. Registrar los cinco tipos en `TextBlockRenderer.tsx` conservando `UnsupportedBlock` como fallback.
8. Añadir pruebas unitarias para datos válidos e inválidos, las tres variantes y tipos desconocidos.
9. Añadir una prueba de integración del detalle editorial y un recorrido E2E con una publicación que contenga referencias y medios reales o semillas controladas.
10. Revisar teclado, foco, lectores de pantalla, móvil, tableta y escritorio.
11. Actualizar el plan y crear `docs/frontend-development-logs/MVP-FE-P3.2-references-media.md` al cerrar.

### Criterios de cierre

- Los trece tipos de bloque previstos en FE-P3 tienen renderer.
- Ninguna referencia editorial provoca una consulta adicional por entidad.
- Una referencia retirada o no resuelta desaparece o degrada sin romper la página.
- Las variantes son distinguibles sin cambiar la información autorizada por `resolved`.
- Imágenes y archivos utilizan sólo URL entregadas por la API.
- Existe alternativa textual suficiente y navegación por teclado.
- Lint, tipos, pruebas, build y E2E pasan.
- El comportamiento se verifica contra Docker y se documenta.

## 5. Pasos posteriores a FE-P3.2

Según el plan vigente, continuar con:

1. **FE-P4.0 — Cuenta:** completar perfil, expiración de sesión y retorno seguro.
2. **FE-P4.1 — Exportaciones:** acciones CSV/JSON, descarga como Blob e historial del usuario; un visitante debe recibir invitación a registrarse o iniciar sesión.
3. **FE-P5 — Vigilancia interna:** reemplazar placeholders administrativos por los flujos de señales, tendencias y alertas.
4. **FE-P6 — Editorial interno:** contenido, versiones, constructor, preview y publicación.
5. **FE-P7 — Estabilización:** accesibilidad, navegadores, rendimiento, E2E por perfil y despliegue.

La administración de carga de medios continúa siendo una dependencia para FE-P6.3. Esto no bloquea FE-P3.2, porque el renderizador público sólo consume medios ya resueltos.

## 6. Rutas y archivos relevantes

### Contrato, planeación y documentación

- `docs/API-docs/openapi.yaml`: contrato API 0.5.6 y fuente de tipos.
- `docs/API-docs/api-conventions.md`: convenciones de respuesta y errores.
- `docs/frontend-planning/MVP-frontend-implementation-plan.md`: fases, criterios y orden vigente.
- `docs/status-checks/MVP-backend-readiness-frontend.md`: alcance del backend al iniciar el frontend.
- `docs/frontend-development-logs/`: cierres de FE-P0 a FE-P3.1.
- `docs/backend-development-logs/`: registro de incrementos backend.
- `docs/backend-development-logs/MVP-default-admin-user.md`: cuenta local predeterminada.

### Renderizador editorial frontend

- `client/src/features/content/ContentDetailPage.tsx`: consulta y composición del detalle público.
- `client/src/features/content/EditorialSection.tsx`: renderizado de secciones.
- `client/src/features/content/TextBlockRenderer.tsx`: registro y fallback actual de bloques.
- `client/src/features/content/SafeMarkdown.tsx`: Markdown sin HTML arbitrario.
- `client/src/features/content/data-blocks.ts`: validadores de tabla y gráfica.
- `client/src/features/content/DataTableBlock.tsx`: tabla semántica.
- `client/src/features/content/ChartBlock.tsx`: gráficas SVG y tabla equivalente.
- `client/src/features/content/Editorial.module.css`: layout y estilos comunes de bloques.
- `client/src/features/content/DataBlocks.module.css`: estilos de tabla y gráfica.
- `client/src/features/content/types.ts`: alias derivados de OpenAPI.
- `client/src/features/content/editorial-blocks.test.tsx`: pruebas de bloques de texto.
- `client/src/features/content/data-blocks.test.tsx`: pruebas de tabla y gráfica.
- `client/src/features/content/content-detail.integration.test.tsx`: integración del detalle.
- `client/e2e/content-detail.spec.ts` y `client/e2e/content-data.spec.ts`: recorridos editoriales E2E.

### Resolución en backend

- `backend/src/editorial/blockRegistry.js`: esquemas de los trece bloques.
- `backend/src/services/blockResolver.service.js`: proyección `compact`, `card`, `featured`, relaciones y medios.
- `backend/src/repositories/blockResolver.repository.js`: consultas de resolución pública.
- `backend/src/services/publicContent.service.js`: servicio del detalle público.
- `backend/src/routes/content.routes.js`: rutas públicas de contenido.
- `backend/src/routes/media.routes.js`: entrega y descarga de medios.
- `database/migrations/14_editorial_domain.sql` a `17_export_history.sql`: dominio editorial, API pública y exportaciones.

### Aplicación y rutas

- `client/src/app/router.tsx`: mapa actual de rutas y placeholders.
- `client/src/app/public-modules.ts`: módulos públicos basados en colecciones o páginas editoriales.
- `client/src/features/auth/`: sesión, login, registro y guardas.
- `client/src/api/`: cliente, tipos generados, errores y descargas.
- `client/src/styles/tokens.css`: tokens visuales.
- `docker-compose.yaml`: PostgreSQL, backend, frontend y Nginx.

## 7. Comandos habituales

Desde `C:\Observatorio\MVP\client`:

```powershell
npm run api:types
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

La comprobación local completa del cliente es:

```powershell
npm run check
```

Desde `C:\Observatorio\MVP`:

```powershell
docker compose up --build -d
docker compose ps
docker compose logs backend
docker compose down
```

Usar `docker compose down -v` únicamente cuando se quiera validar explícitamente todas las migraciones desde una base vacía; elimina los datos persistidos del entorno local.

## 8. Última validación conocida

Al cerrar FE-P3.1 se obtuvo:

- 66 pruebas unitarias y de integración aprobadas;
- 29 pruebas Playwright aprobadas y una omisión esperada exclusiva de escritorio;
- TypeScript, ESLint y build de producción correctos;
- ejecución correcta del conjunto Docker;
- revisión visual en escritorio y móvil;
- inicio de sesión correcto con la cuenta administrativa en un volumen vacío;
- migración administrativa ejecutada dos veces sin duplicados.

Los contenedores y volúmenes temporales usados para esa validación quedaron detenidos y retirados. El siguiente agente debe levantar Docker nuevamente si necesita validar contra la API real.

## 9. Precauciones al retomar

- Revisar `git status` antes de editar. Hay muchos archivos modificados y no rastreados que pertenecen a los incrementos ya implementados.
- No usar `git reset --hard`, `git checkout --` ni limpiezas masivas.
- No editar manualmente `client/src/api/schema.d.ts`; se genera desde OpenAPI.
- No introducir una librería de gráficas: FE-P3.1 ya usa SVG nativo.
- No ampliar FE-P3.2 hacia carga administrativa de medios o el constructor editorial.
- No exponer campos internos ni recuperar por separado entidades que el backend no incluyó en `resolved`.
- Si se crea una publicación temporal para E2E o revisión visual, retirar su seed y cualquier archivo de composición temporal al terminar.
