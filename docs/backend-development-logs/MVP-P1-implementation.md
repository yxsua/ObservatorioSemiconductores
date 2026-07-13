# Fase 1 - Implementación transversal

## Componentes entregados

- Convenciones de respuestas, errores y paginación.
- Middleware de autorización basado en permisos almacenados en PostgreSQL.
- Roles y permisos iniciales.
- Asignación automática de `MEMBER` durante el registro público.
- Catálogos públicos mediante una lista blanca de vistas.
- Índices para claves foráneas, filtros, fechas y búsqueda textual.
- Contrato OpenAPI inicial.
- Pruebas unitarias de paginación y humo HTTP.

## Rutas añadidas

```text
GET /api/catalogs
GET /api/catalogs/:catalog
```

Las rutas no requieren autenticación. Solo exponen vistas declaradas en `catalog.repository.js`; un parámetro arbitrario nunca se convierte directamente en un identificador SQL.

## Uso de permisos en rutas futuras

```js
const { authenticate } = require("../middleware/auth.middleware");
const {
    requirePermissions,
    requireAnyPermission
} = require("../middleware/permission.middleware");

router.post(
    "/",
    authenticate,
    requirePermissions("signals:create"),
    asyncHandler(createSignal)
);
```

`requirePermissions` exige todos los permisos indicados. `requireAnyPermission` autoriza cuando el usuario posee al menos uno.

## Aplicación sobre una base existente

Los archivos de `/docker-entrypoint-initdb.d` solo se ejecutan cuando PostgreSQL crea un volumen vacío. En un volumen existente deben aplicarse manualmente, en este orden:

```text
database/migrations/09_indexes.sql
database/migrations/10_roles_permissions.sql
```

La migración de seguridad puede repetirse sin duplicar roles, permisos o asignaciones. Los índices utilizan `IF NOT EXISTS`.

Antes de aplicarlas en un entorno con datos reales se recomienda crear un respaldo con el mecanismo ya incluido en el proyecto.

Después de aplicar las migraciones, comprobar:

```sql
SELECT COUNT(*) FROM roles;       -- 6
SELECT COUNT(*) FROM permissions; -- 36

SELECT role_name, COUNT(*)
FROM vw_role_permissions
GROUP BY role_name
ORDER BY role_name;
```

Las cuentas existentes que no tenían ningún rol reciben `MEMBER`. Las cuentas con uno o más roles existentes se preservan sin cambios.

## Verificación local

La suite no necesita servicios externos:

```text
cd backend
npm test
```

Si el `npm` global de la máquina no está disponible, puede ejecutarse con el runtime de Node instalado:

```text
node --test
```

La validación realizada durante la implementación incluyó:

- comprobación sintáctica de todos los archivos JavaScript;
- 5 pruebas unitarias de paginación;
- carga de la aplicación Express;
- humo HTTP de descubrimiento de catálogos y error 404;
- inicialización limpia de PostgreSQL 17 con las migraciones `01` a `10` y 45 índices de soporte;
- consulta de roles, permisos y vistas de catálogos.

## Pendientes deliberados

- Los endpoints de señales comienzan en la Fase 2.
- La migración correctiva de confiabilidad, IPS y estados de señal debe implementarse antes del vertical de señales.
- `categories` todavía carece de código estable y utiliza `idCategory` como referencia.
- La autorización consulta PostgreSQL en cada petición protegida; se evaluará caché solamente si las mediciones lo justifican.
