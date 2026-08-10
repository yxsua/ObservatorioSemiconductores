# Operación del MVP

## Preparación

El despliegue necesita PostgreSQL, backend, frontend compilado y Nginx. Antes de iniciarlo deben definirse, mediante un archivo de entorno protegido o el gestor de secretos de la plataforma:

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST` y `POSTGRES_PORT`;
- `JWT_SECRET` con un valor largo, aleatorio y diferente al de desarrollo;
- `JWT_EXPIRES_IN`;
- opcionalmente `MEDIA_MAX_BYTES`, `MEDIA_ROOT`, `EXPORT_MAX_ROWS`, `PORT`, `NODE_ENV` y `LOG_LEVEL`.

Los usuarios iniciales incluidos por migración son únicamente de arranque. Sus contraseñas deben rotarse o sus cuentas deshabilitarse antes de exponer el sistema.

## Construcción y arranque

Desde la raíz del proyecto:

```powershell
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml --env-file .env.production build
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml --env-file .env.production up -d
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml --env-file .env.production ps
```

La configuración publicada escucha HTTP en el puerto 80. HTTPS debe terminar en un proxy inverso o balanceador frontal que gestione certificados y reenvíe `X-Forwarded-Proto`. No debe exponerse directamente por Internet sin esa capa.

## Comprobaciones

- `GET /` debe devolver la aplicación y sus cabeceras de seguridad.
- `GET /api/health` debe confirmar que backend y base de datos están disponibles.
- una ruta profunda, por ejemplo `/contenido`, debe devolver la SPA.
- la carga administrativa de medios admite hasta 20 MiB en backend; Nginx reserva 21 MiB para incluir el cuerpo multipart.
- los volúmenes `postgres_data` y `media_data` deben incluirse en la política de respaldos.

## Calidad antes de liberar

Frontend:

```powershell
cd client
npm run check
npm run test:e2e
```

Backend:

```powershell
cd backend
npm test
```

El chequeo frontend incluye contrato OpenAPI, lint, pruebas unitarias, compilación y presupuesto de chunks. Los navegadores objetivo del MVP son Chromium de escritorio y viewport móvil; se recomienda una comprobación manual adicional en las versiones vigentes de Firefox y Safari antes de una liberación pública.

## Recuperación

Las consultas transitorias reintentan únicamente errores de red y respuestas 5xx. Los errores 4xx requieren intervención y nunca se repiten automáticamente. Ante una caída, deben revisarse `docker compose logs backend nginx postgres`, el estado de `/api/health`, el espacio de los volúmenes y la conectividad con PostgreSQL antes de reiniciar servicios.
