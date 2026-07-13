const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.message || "No se pudo completar la solicitud.";

    const error = new Error(message);
    error.status = response.status;
    error.details = payload?.errors ?? null;
    throw error;
  }

  return payload?.data ?? payload;
}

export function loginRequest(credentials) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function registerRequest(data) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getProfileRequest(token) {
  return request("/auth/me", {
    method: "GET",
    token,
  });
}
