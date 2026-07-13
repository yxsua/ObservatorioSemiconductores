import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { isApiError } from "@/api";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/forms/TextField";
import { useAuth } from "./AuthContext";
import { applyApiErrors, applyZodErrors } from "./form-errors";
import { loginFormSchema, type LoginFormValues } from "./auth.schemas";
import { safeReturnTo } from "./safe-return";
import styles from "./AuthForm.module.css";

interface LocationState {
  returnTo?: string;
}

export function LoginPage() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" }
  });
  const returnTo = safeReturnTo(
    (location.state as LocationState | null)?.returnTo
  );

  if (auth.status === "authenticated") {
    return <Navigate replace to={returnTo} />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const validation = loginFormSchema.safeParse(values);
    if (!validation.success) {
      applyZodErrors(validation.error, setError);
      return;
    }
    try {
      await auth.login(validation.data);
      navigate(returnTo, { replace: true });
    } catch (error) {
      applyApiErrors(error, setError);
      setSubmitError(isApiError(error)
        ? error.message
        : "No fue posible iniciar sesión."
      );
    }
  });

  return (
    <section className={styles.page} aria-labelledby="login-title">
      <header className={styles.header}>
        <h1 id="login-title">Iniciar sesión</h1>
        <p>Accede a exportaciones y a las funciones autorizadas de tu cuenta.</p>
      </header>
      {auth.sessionNotice === "expired" && (
        <div className={styles.sessionNotice} role="status">
          <strong>Tu sesión terminó.</strong>
          <span>Inicia sesión nuevamente para continuar desde donde estabas.</span>
          <button onClick={auth.dismissSessionNotice} type="button">Cerrar aviso</button>
        </div>
      )}
      <form className={styles.form} noValidate onSubmit={onSubmit}>
        {submitError && (
          <div className={styles.errorSummary} role="alert">{submitError}</div>
        )}
        <TextField
          autoComplete="email"
          error={errors.email?.message}
          label="Correo electrónico"
          type="email"
          {...register("email")}
        />
        <TextField
          autoComplete="current-password"
          error={errors.password?.message}
          label="Contraseña"
          type="password"
          {...register("password")}
        />
        <Button disabled={isSubmitting} type="submit" variant="primary">
          {isSubmitting ? "Iniciando…" : "Iniciar sesión"}
        </Button>
      </form>
      <p className={styles.alternative}>
        ¿No tienes cuenta? <Link to="/registro" state={{ returnTo }}>
          Crear cuenta
        </Link>
      </p>
    </section>
  );
}
