# Recuperación de la validación local

Fecha: 10 de septiembre de 2026. Base revisada: commit `de6def7`.

## Entorno reproducible

Desde `C:\Observatorio\MVP`, con Node.js/npm y Docker Desktop en ejecución:

```powershell
.\scripts\validate.ps1 -RestoreDependencies
```

Para repetir con las dependencias y Chromium ya instalados:

```powershell
.\scripts\validate.ps1
```

El script utiliza el npm incluido con el primer Node disponible y restaura las variables de entorno de la sesión al terminar. Esto evita el desvío hacia la instalación global incompleta de npm detectado en este equipo. No cambia la configuración global del usuario.

La validación se detiene al primer error e incluye contrato OpenAPI, ESLint, Vitest, TypeScript, compilación, presupuesto de bundle, construcción Docker, pruebas unitarias e integrales del backend, pruebas SQL, rutas HTTP y Playwright en escritorio/móvil.

`docker-compose.validation.yaml` se usa de forma independiente: no debe combinarse con los archivos Compose de desarrollo o producción. Crea el proyecto `observatorio-validation`, su base de datos y sus volúmenes separados. Sólo publica HTTP en `127.0.0.1:18080`; las credenciales declaradas son exclusivas de esta base local de pruebas. No usa `.env` ni certificados del servidor público.

Los servicios quedan disponibles para revisión en http://127.0.0.1:18080. Para detenerlos conservando sus datos:

```powershell
docker compose -f docker-compose.validation.yaml stop
```

Las pruebas integrales crean usuarios, fuentes y publicaciones propios. Pueden repetirse y acumulan datos exclusivamente en este entorno. Las pruebas SQL usan transacciones con rollback. Las migraciones 01–22 se aplicaron al crear el volumen de validación; este procedimiento no implementa actualizaciones de un volumen existente con futuras migraciones.

## Correcciones realizadas

- Restauración del frontend mediante `npm ci` y disponibilidad de Chromium.
- Actualización de pruebas del menú y ecosistema a la navegación informativa entregada en agosto.
- Selectores exactos en el formulario de señales para distinguir campos de sus botones de ayuda.
- Lectura del Blob devuelto por Response con su propia API, evitando mezclar Blob de Node con FileReader de jsdom.
- Preparación autónoma de usuarios y fuentes en la prueba de alertas.
- Identificadores de ejecución y filtros específicos en la prueba editorial para no depender de una base vacía.
- Comprobación HTTP de visitas: rechazo de borradores y cinco incrementos concurrentes conservados.
- Espera de salud del backend antes de ejecutar pruebas y recarga de Nginx después de recrear servicios.
- Exclusión de resultados temporales de Playwright del control de versiones.

## Alcance y límites

Resultados comprobados:

| Comprobación | Resultado |
| --- | --- |
| Regeneración OpenAPI | Sin diferencias de contrato generado |
| ESLint y TypeScript | Correctos |
| Frontend | 108 pruebas, 34 archivos |
| Backend | 63 pruebas |
| Build y presupuesto | 477.69 KiB iniciales; 23 chunks JS; límite de 500 KiB aprobado |
| Chromium escritorio y móvil | 55 aprobadas; 3 exclusiones por perfil ya existentes |
| PostgreSQL | Inicialización con migraciones 01–22 y cuatro scripts SQL aprobados |
| API real | Flujos de alertas, editorial, medios, exportaciones y visitas |

Las tres exclusiones corresponden al menú móvil en escritorio y a teclado/conectividad en el perfil móvil; estos últimos se ejecutan en escritorio.

Playwright comprueba el frontend compilado y utiliza respuestas API simuladas en buena parte de sus casos. Las pruebas integrales del backend y SQL comprueban por separado el comportamiento con PostgreSQL real. Esto no equivale a una certificación completa de todos los recorridos de interfaz contra la API real.

La validación local no prueba HTTPS, certificados, configuración del servidor público, restauración de respaldos ni actualización de una base productiva. Esos puntos corresponden a las siguientes etapas del plan.

Durante la construcción, npm informó nueve vulnerabilidades en las dependencias del frontend (dos moderadas y siete altas). No se aplicaron actualizaciones automáticas ni se evaluó aquí su explotabilidad; queda pendiente su revisión antes de liberar a producción.
