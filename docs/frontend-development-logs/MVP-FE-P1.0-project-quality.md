# FE-P1.0 — Proyecto y calidad

**Fecha:** 13 de julio de 2026

**Estado:** cerrado

## Alcance entregado

- Migración del esqueleto de React de JSX a TypeScript estricto.
- Configuración de Vite 8, TypeScript, ESLint 9 y Vitest 4.
- Alias `@/` para módulos bajo `src`.
- Scripts de generación de tipos, lint, pruebas, typecheck, build y verificación completa.
- Base de Playwright con perfiles Chromium de escritorio y móvil.
- Tokens visuales, reset global, accesibilidad de foco y reducción de movimiento.
- Primer componente base `Button` con variantes tipadas y tipo seguro predeterminado.
- Pantalla mínima de salud conectada mediante el nuevo cliente API.
- Lockfile npm versionable y build Docker reproducible mediante `npm ci`.
- `.dockerignore` del cliente para excluir dependencias, builds y reportes del contexto.

## Estructura inicial

```text
client/
├── e2e/
├── src/
│   ├── api/
│   ├── components/ui/
│   ├── styles/
│   ├── test/
│   ├── App.tsx
│   └── main.tsx
├── eslint.config.js
├── playwright.config.ts
├── tsconfig.app.json
├── tsconfig.node.json
├── tsconfig.json
└── vite.config.ts
```

Los directorios de features, layouts, pages y providers se crearán cuando FE-P1.2 introduzca router y sesión. No se añadieron carpetas vacías.

## Scripts

| Comando | Función |
| --- | --- |
| `npm run api:types` | Regenera TypeScript desde OpenAPI 0.5.6 |
| `npm run lint` | Ejecuta reglas JavaScript/TypeScript y hooks de React |
| `npm run test` | Ejecuta pruebas Vitest en jsdom |
| `npm run test:e2e` | Ejecuta Playwright en escritorio y móvil |
| `npm run typecheck` | Comprueba TypeScript sin emitir archivos |
| `npm run build` | Comprueba tipos y construye producción |
| `npm run check` | Regenera contrato y ejecuta lint, unitarias y build |

## Decisiones de calidad

- El frontend utiliza módulos ESM.
- La compilación tiene `strict`, `noUnusedLocals`, `noUnusedParameters` y protección de fallthrough.
- `schema.d.ts` se excluye del lint porque es código generado, pero participa en TypeScript.
- Vitest excluye `e2e/`; Playwright es el único ejecutor de esos archivos.
- La imagen final instala exactamente el lockfile con `npm ci`.
- Se actualizaron Vite y Vitest antes de implementar al detectarse avisos de seguridad en las versiones inicialmente compatibles con el esqueleto antiguo.

## Verificación

- `npm audit`: 0 vulnerabilidades conocidas.
- ESLint: correcto.
- TypeScript + build Vite: correcto.
- Vitest: 5 archivos, 13 pruebas aprobadas.
- Playwright: 2 escenarios descubiertos, escritorio y móvil. La ejecución con navegador se realizará al iniciar las rutas navegables de FE-P1.2; los binarios no se descargaron en este incremento.
- Docker: `npm ci` y build productivo correctos desde contexto limpio.
- Nginx: HTML compilado servido correctamente.
- Proxy: `/api/health` respondió con backend y PostgreSQL disponibles.

## Pendientes deliberados

- Router, TanStack Query y sesión global corresponden a FE-P1.2.
- La pantalla actual sigue siendo una comprobación de fundación, no el shell público final.
- Playwright todavía no cubre un recorrido funcional porque las rutas comienzan en FE-P1.2.
