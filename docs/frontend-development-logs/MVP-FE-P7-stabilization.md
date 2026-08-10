# FE-P7 — Estabilización y entrega

Fecha de cierre: 13 de julio de 2026.

## Alcance implementado

- estado global accesible para pérdida y recuperación de conexión;
- salto por teclado al contenido principal tanto en el portal como en administración;
- fallback de hidratación para rutas públicas e internas;
- pruebas E2E de teclado, red, consola y navegación responsive;
- presupuesto automatizado de 500 KiB para el chunk inicial y cada chunk JavaScript;
- verificación de carga diferida del constructor editorial y la biblioteca de medios;
- Nginx productivo con límites de carga, compresión, cabeceras defensivas, proxy de API y manejo específico de medios;
- runbook de despliegue, variables, respaldos, salud y recuperación.

## Criterios operativos

El contenedor Nginx publica HTTP. TLS se delega deliberadamente a la infraestructura frontal; por ello el compose productivo no anuncia un puerto 443 sin certificados. Las credenciales semilla deben rotarse antes de una exposición real.

## Verificación ejecutada

- TypeScript y ESLint: correctos.
- Frontend: 107 pruebas unitarias aprobadas.
- Backend: 63 pruebas aprobadas.
- E2E Chromium: 28 aprobadas y una exclusión intencional exclusiva del viewport móvil.
- E2E responsive: 7 aprobadas y tres exclusiones intencionales por perfil.
- Bundle inicial: 443 KiB, por debajo del presupuesto de 500 KiB; 23 chunks JavaScript.
- Imágenes Docker de frontend, backend y Nginx: construidas correctamente.
- Stack productivo: `/`, `/contenido` y `/api/health` respondieron correctamente; PostgreSQL reportó conexión activa y se comprobaron CSP y `X-Frame-Options`.

Durante E2E se detectó que el anuncio de recuperación de red desaparecía demasiado pronto. Se corrigió para permanecer visible durante tres segundos y la regresión quedó cubierta por prueba.

## Pendientes fuera del cierre

- terminar TLS y gestionar certificados en la infraestructura frontal;
- rotar o deshabilitar credenciales semilla antes de exponer el servicio;
- realizar comprobaciones manuales de liberación en Firefox y Safari vigentes.
