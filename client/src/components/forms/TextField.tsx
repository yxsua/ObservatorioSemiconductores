import { forwardRef, useId, type InputHTMLAttributes } from "react";
import styles from "./TextField.module.css";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField({
  error,
  hint,
  id: providedId,
  label,
  ...props
}: TextFieldProps, ref) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const descriptionId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      {hint && <span className={styles.hint} id={descriptionId}>{hint}</span>}
      <input
        {...props}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className={styles.input}
        id={id}
        ref={ref}
      />
      {error && <span className={styles.error} id={errorId}>{error}</span>}
    </div>
  );
});
