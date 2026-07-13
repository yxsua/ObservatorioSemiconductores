import { useCallback } from "react";
import {
  apiDownload,
  apiRequest,
  type ApiRequestOptions
} from "@/api";
import { useAuth } from "./AuthContext";

export function useAuthorizedApi() {
  const { token } = useAuth();

  const request = useCallback(<T,>(
    path: string,
    options: ApiRequestOptions = {}
  ) => apiRequest<T>(path, { ...options, token }), [token]);

  const download = useCallback((
    path: string,
    fallbackFilename: string,
    options: ApiRequestOptions = {}
  ) => apiDownload(path, fallbackFilename, {
    ...options,
    token
  }), [token]);

  return { request, download };
}
