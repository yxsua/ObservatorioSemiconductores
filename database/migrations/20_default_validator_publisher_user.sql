-- Cuenta predeterminada para validación metodológica y publicación editorial local.
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
    'Validador',
    'Editorial',
    'validator@validator.com',
    'Validación y publicación del observatorio',
    '$2b$10$T6isuDV2yoVN6cJXXld2/.g7/HKgy58zl5/Bx1M.UwkKGFK2BikT.',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- VALIDATOR permite revisar vigilancia; PUBLISHER permite aprobar y publicar
-- contenido editorial. Ambos son necesarios para el recorrido solicitado.
INSERT INTO user_roles (id_user, id_role)
SELECT user_account.id_user, role.id_role
FROM users user_account
CROSS JOIN roles role
WHERE user_account.email = 'validator@validator.com'
  AND role.name IN ('VALIDATOR', 'PUBLISHER')
ON CONFLICT DO NOTHING;
