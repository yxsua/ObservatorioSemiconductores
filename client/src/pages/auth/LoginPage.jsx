import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { detailsToFieldErrors } from "../../utils/formErrors";

const initialState = {
  email: "",
  password: "",
};

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [name]: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      const nextFieldErrors = detailsToFieldErrors(requestError.details);

      if (requestError.status === 401) {
        nextFieldErrors.email = "Revisa este correo.";
        nextFieldErrors.password = "Revisa esta contrasena.";
      }

      setFieldErrors(nextFieldErrors);
      setError(
        Object.keys(nextFieldErrors).length > 0
          ? "Revisa los campos senalados."
          : requestError.message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Acceso</p>
        <h1>Iniciar sesion</h1>
        <p>Entra con tu correo y contrasena para continuar en el observatorio.</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Correo
            <input
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              aria-invalid={Boolean(fieldErrors.email)}
              className={fieldErrors.email ? "is-invalid" : undefined}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
            {fieldErrors.email && (
              <small className="field-error" id="email-error">
                {fieldErrors.email}
              </small>
            )}
          </label>

          <label>
            Contrasena
            <input
              aria-describedby={
                fieldErrors.password ? "password-error" : undefined
              }
              aria-invalid={Boolean(fieldErrors.password)}
              className={fieldErrors.password ? "is-invalid" : undefined}
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
            {fieldErrors.password && (
              <small className="field-error" id="password-error">
                {fieldErrors.password}
              </small>
            )}
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="auth-switch">
          No tienes cuenta? <Link to="/register">Crear cuenta</Link>
        </p>
        <p className="auth-switch auth-switch--muted">
          La cuenta es opcional. Puedes consultar el observatorio sin iniciar
          sesion.
        </p>
      </div>
    </section>
  );
}

export default LoginPage;
