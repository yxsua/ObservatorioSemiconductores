import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { detailsToFieldErrors } from "../../utils/formErrors";

const OTHER_OCCUPATION = "__other__";

const occupationOptions = [
  "Investigador/a",
  "Analista",
  "Docente",
  "Estudiante",
  "Industria",
  "Gobierno",
  "Emprendedor/a",
];

const initialState = {
  firstName: "",
  lastName: "",
  email: "",
  occupation: "",
  otherOccupation: "",
  password: "",
};

const passwordRules = [
  {
    label: "Entre 8 y 100 caracteres.",
    test: (value) => value.length >= 8 && value.length <= 100,
  },
  {
    label: "Al menos una letra minuscula.",
    test: (value) => /[a-z]/.test(value),
  },
  {
    label: "Al menos una letra mayuscula.",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    label: "Al menos un numero.",
    test: (value) => /[0-9]/.test(value),
  },
];

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    const fieldName = name === "otherOccupation" ? "occupation" : name;

    setFieldErrors((current) => ({
      ...current,
      [fieldName]: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setIsSubmitting(true);

    const occupation =
      form.occupation === OTHER_OCCUPATION
        ? form.otherOccupation.trim()
        : form.occupation;

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      occupation,
      password: form.password,
    };

    try {
      await register(payload);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      const nextFieldErrors = detailsToFieldErrors(requestError.details);

      if (requestError.status === 409) {
        nextFieldErrors.email = requestError.message;
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
      <div className="auth-card auth-card--wide">
        <p className="eyebrow">Cuenta nueva</p>
        <h1>Crear cuenta</h1>
        <p>
          Registra tus datos basicos si quieres guardar una sesion. La cuenta
          es opcional y el contenido del observatorio sigue abierto.
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form auth-form--grid" onSubmit={handleSubmit}>
          <label>
            Nombre
            <input
              aria-describedby={
                fieldErrors.firstName ? "first-name-error" : undefined
              }
              aria-invalid={Boolean(fieldErrors.firstName)}
              className={fieldErrors.firstName ? "is-invalid" : undefined}
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              autoComplete="given-name"
              required
            />
            {fieldErrors.firstName && (
              <small className="field-error" id="first-name-error">
                {fieldErrors.firstName}
              </small>
            )}
          </label>

          <label>
            Apellido
            <input
              aria-describedby={
                fieldErrors.lastName ? "last-name-error" : undefined
              }
              aria-invalid={Boolean(fieldErrors.lastName)}
              className={fieldErrors.lastName ? "is-invalid" : undefined}
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              autoComplete="family-name"
              required
            />
            {fieldErrors.lastName && (
              <small className="field-error" id="last-name-error">
                {fieldErrors.lastName}
              </small>
            )}
          </label>

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
            Ocupacion
            <select
              aria-describedby={
                fieldErrors.occupation ? "occupation-error" : undefined
              }
              aria-invalid={Boolean(fieldErrors.occupation)}
              className={fieldErrors.occupation ? "is-invalid" : undefined}
              name="occupation"
              value={form.occupation}
              onChange={handleChange}
              autoComplete="organization-title"
            >
              <option value="">Selecciona una opcion</option>
              {occupationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value={OTHER_OCCUPATION}>Otro</option>
            </select>
            {form.occupation === OTHER_OCCUPATION && (
              <input
                aria-label="Escribir otra ocupacion"
                name="otherOccupation"
                value={form.otherOccupation}
                onChange={handleChange}
                placeholder="Escribe tu ocupacion"
              />
            )}
            {fieldErrors.occupation && (
              <small className="field-error" id="occupation-error">
                {fieldErrors.occupation}
              </small>
            )}
          </label>

          <label className="auth-form__full">
            Contrasena
            <input
              aria-describedby={
                fieldErrors.password ? "password-error" : "password-help"
              }
              aria-invalid={Boolean(fieldErrors.password)}
              className={fieldErrors.password ? "is-invalid" : undefined}
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
            {fieldErrors.password && (
              <small className="field-error" id="password-error">
                {fieldErrors.password}
              </small>
            )}
            <ul className="password-rules" id="password-help">
              {passwordRules.map((rule) => (
                <li
                  className={rule.test(form.password) ? "is-met" : undefined}
                  key={rule.label}
                >
                  {rule.label}
                </li>
              ))}
            </ul>
          </label>

          <button className="auth-form__full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear cuenta"}
          </button>
        </form>

        <p className="auth-switch">
          Ya tienes cuenta? <Link to="/login">Iniciar sesion</Link>
        </p>
      </div>
    </section>
  );
}

export default RegisterPage;
