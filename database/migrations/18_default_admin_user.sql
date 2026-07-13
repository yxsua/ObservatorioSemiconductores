-- Cuenta administrativa predeterminada para visualización y desarrollo local.
-- La contraseña se almacena exclusivamente como bcrypt (coste 10).
-- Debe rotarse antes de exponer el sistema en un entorno compartido o productivo.

INSERT INTO users (
    first_name,
    last_name,
    email,
    occupation,
    password_hash,
    active
) VALUES (
    'Administrador',
    'Predeterminado',
    'admin@admin.com',
    'Administración del observatorio',
    '$2b$10$U32EurcMj1oZNb2lqim0p.3LJuXod7hjNpo2Rqqvc3rcv0mC6Zq0u',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (id_user, id_role)
SELECT user_account.id_user, role.id_role
FROM users user_account
CROSS JOIN roles role
WHERE user_account.email = 'admin@admin.com'
  AND role.name = 'ADMIN'
ON CONFLICT DO NOTHING;
