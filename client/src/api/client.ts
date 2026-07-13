import { API_BASE_URL } from "./config";
import {
  ApiError,
  publishApiError,
  type ApiErrorDetail,
  type ApiErrorPayload
} from "./errors";
import { createQueryString, type QueryParams } from "./query";

export type ApiResponseType = "json" | "text" | "blob" | "arrayBuffer";

export interface ApiRequestOptions
  extends Omit<RequestInit, "body" | "headers"> {
  body?: unknown;
  headers?: HeadersInit;
  query?: QueryParams;
  token?: string | null;
  responseType?: ApiResponseType;
}

export interface ApiResponse<T> {
  data: T;
  response: Response;
}

function isNativeBody(body: unknown): body is BodyInit {
  return typeof body === "string"
    || body instanceof FormData
    || body instanceof URLSearchParams
    || body instanceof Blob
    || body instanceof ArrayBuffer
    || ArrayBuffer.isView(body)
    || body instanceof ReadableStream;
}

function prepareBody(body: unknown, headers: Headers) {
  if (body === undefined || body === null) return undefined;
  if (isNativeBody(body)) return body;
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return JSON.stringify(body);
}

function normalizeDetails(value: unknown): ApiErrorDetail[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((detail) => {
    if (!detail || typeof detail !== "object") return [];
    const field = "field" in detail && (
      typeof detail.field === "string" || detail.field === null
    ) ? detail.field : null;
    const message = "message" in detail && typeof detail.message === "string"
      ? detail.message
      : null;
    return message ? [{ field, message }] : [];
  });
}

async function parseError(response: Response) {
  let payload: ApiErrorPayload = {};
  try {
    payload = await response.json() as ApiErrorPayload;
  } catch {
    // Las respuestas no JSON conservan un error transversal seguro.
  }
  const error = new ApiError(
    payload.message || `La API respondió con estado ${response.status}.`,
    {
      status: response.status,
      code: payload.code || "HTTP_ERROR",
      details: normalizeDetails(payload.errors)
    }
  );
  publishApiError(error);
  throw error;
}

async function parseSuccess<T>(response: Response, responseType?: ApiResponseType) {
  if (response.status === 204) return undefined as T;
  const type = responseType || (
    response.headers.get("content-type")?.includes("application/json")
      ? "json"
      : "text"
  );

  if (type === "blob") return await response.blob() as T;
  if (type === "arrayBuffer") return await response.arrayBuffer() as T;
  if (type === "text") return await response.text() as T;
  return await response.json() as T;
}

export async function apiResponse<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    body,
    headers: initialHeaders,
    query,
    token,
    responseType,
    ...requestOptions
  } = options;
  const headers = new Headers(initialHeaders);
  if (!headers.has("accept")) headers.set("accept", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);

  try {
    const response = await fetch(
      `${API_BASE_URL}${path}${createQueryString(query)}`,
      {
        ...requestOptions,
        headers,
        body: prepareBody(body, headers)
      }
    );
    if (!response.ok) await parseError(response);
    return {
      data: await parseSuccess<T>(response, responseType),
      response
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("No fue posible conectar con la API.", {
      status: 0,
      code: "NETWORK_ERROR",
      cause: error
    });
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
) {
  const result = await apiResponse<T>(path, options);
  return result.data;
}
