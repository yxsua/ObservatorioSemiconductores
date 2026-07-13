import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { isApiError } from "@/api";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/forms/TextField";
import { useAuth } from "./AuthContext";
import { applyApiErrors, applyZodErrors } from "./form-errors";
import { registerFormSchema, type RegisterFormValues } from "./auth.schemas";
import { safeReturnTo } from "./safe-return";
import styles from "./AuthForm.module.css";

interface LocationState {
  returnTo?: string;
}

export function RegisterPage() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError
  } = useForm<RegisterFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });
  const returnTo = safeReturnTo(
    (location.state as LocationState | null)?.returnTo
  );

  if (auth.status === "authenticated") {
    return <Navigate replace to={returnTo} />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const validation = registerFormSchema.safeParse(values);
    if (!validation.success) {
      applyZodErrors(validation.error, setError);
      return;
    }
    const input = {
      firstName: validation.data.firstName,
      lastName: validation.data.lastName,
      email: validation.data.email,
      password: validation.data.password
    };
    try {
      await auth.register(input);
      navigate(returnTo, { replace: true });
    } catch (error) {
      applyApiErrors(error, setError);
      setSubmitError(isApiError(error)
        ? error.message
        : "No fue posible crear la cuenta."
      );
    }
  });

  return (
    <section className={styles.page} aria-labelledby="register-title">
      <header className={styles.header}>
        <h1 id="register-title">Crear cuenta</h1>
        <p>El registro habilita descargas y exportaciones de información pública.</p>
      </header>
      <form className={styles.form} noValidate onSubmit={onSubmit}>
        {submitError && (
          <div className={styles.errorSummary} role="alert">{submitError}</div>
        )}
        <TextField
          autoComplete="given-name"
          error={errors.firstName?.message}
          label="Nombre"
          {...register("firstName")}
        />
        <TextField
          autoComplete="family-name"
          error={errors.lastName?.message}
          label="Apellido"
          {...register("lastName")}
        />
        <TextField
          autoComplete="email"
          error={errors.email?.message}
          label="Correo electrónico"
          type="email"
          {...register("email")}
        />
        <TextField
          autoComplete="new-password"
          error={errors.password?.message}
          hint="Mínimo 8 caracteres, con mayúscula, minúscula y número."
          label="Contraseña"
          type="password"
          {...register("password")}
        />
        <TextField
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          label="Confirmar contraseña"
          type="password"
          {...register("confirmPassword")}
        />
        <Button disabled={isSubmitting} type="submit" variant="primary">
          {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>
      <p className={styles.alternative}>
        ¿Ya tienes cuenta? <Link to="/iniciar-sesion" state={{ returnTo }}>
          Iniciar sesión
        </Link>
      </p>
    </section>
  );
}
