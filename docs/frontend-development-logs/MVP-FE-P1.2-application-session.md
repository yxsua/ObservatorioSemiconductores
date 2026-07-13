# FE-P1.2 — Aplicación y sesión

**Fecha:** 13 de julio de 2026

**Estado:** cerrado

**Fuente del contrato:** `docs/API-docs/openapi.yaml` 0.5.6

## Alcance entregado

- Router central con layouts público e interno y rutas preparadas para los verticales del MVP.
- `QueryClientProvider` con política conservadora de reintentos: sin reintentar errores 4xx ni mutaciones.
- Contexto de autenticación con registro, login, restauración mediante `GET /auth/me`, cierre local y revalidación manual.
- Persistencia del JWT en `sessionStorage`; la sesión se limita a la pestaña y se elimina ante 401/403 de restauración.
- Publicación transversal de respuestas 401 desde el cliente API para invalidar sesión y caché.
- Formularios de registro e inicio de sesión con React Hook Form, Zod y errores de campo provenientes del backend.
- Retorno seguro a la ruta solicitada después de autenticarse, rechazando destinos externos.
- Guardas `RequireAuth` y `RequireAnyPermission`, además del componente condicional `Can`.
- Navegación interna derivada de permisos efectivos, no de nombres de rol.
- Páginas de cuenta, 404, permiso insuficiente y error inesperado.
- Componente común para carga, error recuperable, estado vacío y acciones de reintento.
- Configuración Nginx del frontend con fallback a `index.html` para rutas SPA profundas.

## Rutas habilitadas

El router ya reconoce las rutas públicas de contenido, señales, tendencias y alertas, las rutas de autenticación y cuenta, y los prefijos administrativos. Las pantallas de dominio aún no implementadas muestran un estado explícito de siguiente incremento; no consumen datos simulados.

Las rutas protegidas actuales son:

- `/cuenta`: cualquier sesión autenticada;
- `/cuenta/exportaciones`: requiere `exports:download`;
- `/admin/*`: requiere sesión y al menos un permiso interno;
- enlaces administrativos de señales, tendencias, alertas y contenido: aparecen sólo si existe un permiso del módulo correspondiente.

## Ciclo de sesión

1. Registro o login exitoso guarda el token y el usuario retornados por la API.
2. Al recargar, si existe token, la aplicación muestra “Restaurando sesión” mientras consulta `/auth/me`.
3. Una respuesta válida reemplaza el perfil y los permisos locales con los datos actuales del backend.
4. Un 401 o 403 durante la restauración elimina token, perfil y caché.
5. Un fallo de red conserva el token y ofrece reintentar o cerrar sesión; no confunde indisponibilidad con credenciales inválidas.
6. El cierre es local porque el contrato actual no expone revocación ni refresh token.

La revocación de permisos se refleja al volver a consultar el perfil, incluida una recarga completa. Las guardas y la navegación se recalculan a partir de `user.permissions`.

## Formularios y errores

- Las restricciones inmediatas de correo, contraseña y nombres reflejan el contrato del backend.
- La confirmación de contraseña existe sólo en la vista y no se envía a la API.
- Los errores normalizados con campo se asignan al control correspondiente.
- Los errores generales permanecen en un resumen con `role="alert"`.
- Los campos tienen etiqueta, descripción asociada, foco visible y `aria-invalid`.

## Pruebas y validación

- `npm run check`: generación OpenAPI, lint, 24 pruebas en 8 archivos y build, todo correcto.
- Integración de sesión: visitante protegido, restauración válida, sesión expirada, permiso insuficiente y acceso interno autorizado.
- Pruebas de almacenamiento por pestaña y protección del destino de retorno.
- Playwright: 4 recorridos correctos en Chromium de escritorio y emulación móvil.
- Docker: `npm ci` encontró 0 vulnerabilidades y la imagen compiló correctamente.
- Nginx de la imagen sirvió `/cuenta` y `/admin/senales` mediante fallback SPA.

## Decisiones y límites

- No se implementa refresh token porque no forma parte del contrato actual.
- Los tokens no se comparten entre pestañas ni sobreviven al cierre de la pestaña.
- Las páginas de dominio quedan como rutas preparadas; sus consultas reales comienzan en FE-P2, FE-P4, FE-P5 y FE-P6.
- El shell público responsive completo y su menú móvil pertenecen a FE-P2.0.
- Las acciones puntuales de cada módulo deberán usar permisos específicos además de la guarda general del área.

## Criterio de cierre

- Registro, login, restauración y cierre local están conectados al cliente tipado.
- Las rutas privadas no renderizan su contenido sin sesión y permiso.
- Un perfil restaurado reemplaza permisos obsoletos.
- Los estados de restauración, fallo recuperable, permiso y ruta inexistente tienen interfaz explícita.
- Los controles locales, E2E, build productivo y fallback Docker pasan.

El siguiente incremento recomendado es **FE-P2.0 — Shell público**, seguido del vertical público de señales FE-P2.1.
