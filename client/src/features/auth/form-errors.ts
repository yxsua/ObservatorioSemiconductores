import type {
  FieldValues,
  Path,
  UseFormSetError
} from "react-hook-form";
import type { ZodError } from "zod";
import { isApiError } from "@/api";

export function applyZodErrors<T extends FieldValues>(
  error: ZodError,
  setError: UseFormSetError<T>
) {
  error.issues.forEach((issue) => {
    const field = issue.path[0];
    if (typeof field === "string") {
      setError(field as Path<T>, { type: "validation", message: issue.message });
    }
  });
}

export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>
) {
  if (!isApiError(error)) return false;
  let applied = false;
  Object.entries(error.fieldErrors).forEach(([field, messages]) => {
    const message = messages[0];
    if (!message) return;
    setError(field as Path<T>, { type: "server", message });
    applied = true;
  });
  return applied;
}
