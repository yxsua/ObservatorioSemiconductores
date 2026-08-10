import { apiRequest } from "@/api";

export type PublicViewResource = "content" | "signal" | "trend" | "alert";

interface ViewCountPayload {
  data: {
    resourceType: PublicViewResource;
    resourceId: number;
    viewCount: number;
  };
}

export async function getViewCount(resource: PublicViewResource, id: number, signal?: AbortSignal) {
  const response = await apiRequest<ViewCountPayload>(`/views/${resource}/${id}`, { signal });
  return response.data.viewCount;
}

export async function recordView(resource: PublicViewResource, id: number, signal?: AbortSignal) {
  const response = await apiRequest<ViewCountPayload>(`/views/${resource}/${id}`, {
    method: "POST",
    signal
  });
  return response.data.viewCount;
}
