# Cuenta administrativa predeterminada

**Estado:** implementada  
**Fecha:** 13 de julio de 2026

## Migración

La migración 18_default_admin_user.sql crea una cuenta administrativa para instalaciones nuevas y entornos locales:

- correo: admin@admin.com
- contraseña inicial: l14Ar56@Bx16Z8!w
- rol: ADMIN

La contraseña no se almacena en texto plano. La migración contiene su hash bcrypt con factor de costo 10, compatible con el flujo de autenticación actual.

La operación es idempotente: no duplica ni sobrescribe una cuenta que ya utilice ese correo, y garantiza la asignación del rol administrativo. Una segunda ejecución no produce inserciones adicionales.

## Verificación

En un volumen de base de datos vacío se ejecutó la cadena completa de migraciones. El inicio de sesión con la credencial inicial fue correcto y devolvió el rol ADMIN con sus 36 permisos. La migración también se ejecutó dos veces para comprobar su idempotencia.

## Seguridad operativa

Esta es una credencial conocida orientada a desarrollo y visualización inicial. Debe cambiarse antes de desplegar el sistema en un entorno compartido o productivo.
