export interface ApiErrorDetail {
  field: string | null;
  message: string;
}

export interface ApiErrorPayload {
  success?: false;
  message?: string;
  code?: string;
  errors?: ApiErrorDetail[] | null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];

  constructor(
    message: string,
    options: {
      status: number;
      code: string;
      details?: ApiErrorDetail[] | null;
      cause?: unknown;
    }
  ) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details ?? [];
  }

  get isAuthenticationError() {
    return this.status === 401;
  }

  get isPermissionError() {
    return this.status === 403;
  }

  get isConflict() {
    return this.status === 409;
  }

  get isDomainRuleViolation() {
    return this.status === 422;
  }

  get fieldErrors() {
    return this.details.reduce<Record<string, string[]>>((result, detail) => {
      if (!detail.field) return result;
      result[detail.field] = [...(result[detail.field] ?? []), detail.message];
      return result;
    }, {});
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

type UnauthorizedListener = (error: ApiError) => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export function subscribeToUnauthorized(listener: UnauthorizedListener) {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

export function publishApiError(error: ApiError) {
  if (!error.isAuthenticationError) return;
  unauthorizedListeners.forEach((listener) => listener(error));
}
