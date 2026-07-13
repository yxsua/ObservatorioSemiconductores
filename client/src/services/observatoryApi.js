const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

async function request(path, params) {
  const response = await fetch(`${API_BASE_URL}${path}${buildQueryString(params)}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "No se pudo cargar la informacion.");
  }

  return payload?.data ?? payload;
}

export function getObservatorySummary() {
  return request("/observatory/summary");
}

export function getObservatoryCatalogs() {
  return request("/observatory/catalogs");
}

export function getSources(filters) {
  return request("/observatory/sources", filters);
}

export function getSignals(filters) {
  return request("/observatory/signals", filters);
}

export function getTrends(filters) {
  return request("/observatory/trends", filters);
}

export function getAlerts(filters) {
  return request("/observatory/alerts", filters);
}

export function getContentItems(filters) {
  return request("/observatory/content", filters);
}
