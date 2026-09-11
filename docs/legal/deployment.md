# Integración de correo y revisión institucional

La recuperación está implementada pero el envío permanece deshabilitado. No se generan enlaces ni se simula entrega cuando el proveedor no está configurado. Los datos de contacto institucional no se utilizan como remitente SMTP ni se han enviado mensajes a ese correo.

## Correo

1. Implementar `backend/src/services/recovery-mail.js`: `sendPasswordReset({to,url,expiresInMinutes})` con el proveedor que se contrate. El asunto sugerido es «Recupera el acceso a tu cuenta del Observatorio». El cuerpo debe incluir el enlace, su vigencia de 30 minutos y «Si no solicitaste este cambio, ignora el mensaje. Tu contraseña seguirá igual». Debe rechazar la promesa cuando falle la entrega y tener un tiempo máximo de espera. No imprimir ni persistir enlaces o credenciales en logs. Configurar alertas operativas que no incluyan destinatarios ni tokens.
2. Guardar credenciales y remitente verificado sólo en el entorno del servidor. Establecer `PUBLIC_APP_URL=https://dominio-final` (origen sin ruta). El código nunca usa Host, Origin ni direcciones proporcionadas por el visitante para formar enlaces. El fragmento `#token=...` evita enviar el secreto en URLs al servidor; el navegador lo retira al abrir la pantalla. Desactivar seguimiento de clics del proveedor para estos mensajes.
3. Cambiar `enabled` a verdadero en el adaptador únicamente después de configurar y probar el proveedor. El estado público combina esa disponibilidad con un origen válido. No existe un interruptor de frontend que permita restablecer sin validar el token.
4. Revisar el proxy del despliegue. Por defecto Express no confía en cabeceras de IP y el límite puede agrupar a visitantes tras el mismo proxy; configurar exclusivamente los proxies controlados, nunca `trust proxy=true` indiscriminadamente. Los contadores se comparten en PostgreSQL. Hay límites por conexión y por correo.
5. Ejecutar las pruebas de entrega real en una cuenta controlada antes de habilitar el servicio. No se ha probado entrega SMTP porque todavía no hay proveedor.

API documentada en OpenAPI: `GET /api/auth/password/status`, `POST /api/auth/password/forgot` con email y `POST /api/auth/password/reset` con token y password. Solicitar un enlace no modifica la contraseña. Cada nueva solicitud válida reemplaza enlaces anteriores; caduca a los 30 minutos. El cambio consume el token en transacción, invalida todas las sesiones previas e impide la reutilización concurrente. Los fallos del proveedor producen la misma respuesta genérica que una cuenta desconocida y revocan el token emitido.

Aplicar `database/migrations/27_account_recovery.sql` antes de desplegar el backend. Los usuarios anteriores conservan versión de sesión 0 y aceptación legal nula. El registro nuevo requiere `termsVersion: "2026-09-11"`; la fecha se fija en el servidor. No atribuir aceptación a cuentas anteriores. Al aprobar o cambiar los textos, publicar una nueva versión coherente en API, cliente y archivo de documentos, y definir la aceptación de cuentas existentes si procede. Conservar versiones anteriores.

## Revisión de los textos

Los textos completos están en `docs/legal/terms.md` y `docs/legal/privacy.md`; su fuente para la interfaz es `client/src/features/legal/legal-content.json`. Los datos cortos del registro están en `legal-config.ts`. Mantenerlos sincronizados.

Se incorporaron el responsable, domicilio, teléfono y correo proporcionados. `contacto@itq.edu.mx` es un canal de orientación: no se ha supuesto que sea el correo oficial de una Unidad de Transparencia. Los textos siguen identificados como propuesta hasta que el TecNM confirme:

- El fundamento de sus atribuciones para este tratamiento y los supuestos de consentimiento aplicables al Observatorio.
- La denominación, domicilio, canal y procedimiento de la Unidad de Transparencia competente para derechos ARCO.
- Los periodos y procedimientos institucionales de conservación, bloqueo, supresión y respaldos. No hay borrado general automático de cuentas implementado.
- Las condiciones de alojamiento y futuro proveedor de correo, y la aprobación de la versión definitiva.

No se han prometido usos comerciales, investigación externa ni transferencias a aliados. La aceptación de términos no se utiliza como autorización genérica de datos ni como renuncia de derechos.

Referencias verificadas el 11 de septiembre de 2026:
- Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados (en particular arts. 17–22): https://www.diputados.gob.mx/LeyesBiblio/pdf/LGPDPPSO.pdf
- Aviso institucional de referencia del TecNM, sin trasladar automáticamente su alcance al Observatorio: https://www.tecnm.mx/menu/proteccion_datos_personales/AVISO_DE_PRIVACIDAD_INTEGRAL_2023.pdf?doc=1
- Recomendaciones de recuperación de contraseña: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
