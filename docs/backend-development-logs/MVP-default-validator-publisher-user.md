# Cuenta predeterminada de validación y publicación

**Estado:** implementada  
**Fecha:** 13 de julio de 2026

La migración `20_default_validator_publisher_user.sql` incorpora una cuenta local para completar recorridos con separación de identidades:

- correo: `validator@validator.com`;
- contraseña inicial: `Validador@2026!MVP`;
- roles: `VALIDATOR` y `PUBLISHER`.

`VALIDATOR` permite revisar señales, tendencias y alertas. La publicación de boletines pertenece a `PUBLISHER`, que aporta `content:approve` y `content:publish`; por eso la cuenta recibe ambos roles.

La contraseña sólo aparece en la base como bcrypt con coste 10. La migración no sobrescribe una cuenta existente, garantiza ambas asignaciones de rol y puede ejecutarse más de una vez sin duplicados. Se verificó mediante dos ejecuciones consecutivas y un inicio de sesión real, que devolvió los dos roles y 27 permisos.

Esta credencial es exclusivamente para desarrollo y demostración. Debe cambiarse o eliminarse antes de desplegar en un entorno compartido o productivo.
