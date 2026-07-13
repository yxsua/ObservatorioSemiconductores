export type QueryPrimitive = string | number | boolean;
export type QueryValue =
  | QueryPrimitive
  | QueryPrimitive[]
  | null
  | undefined;
export type QueryParams = Record<string, QueryValue>;

export function createQueryString(query: QueryParams = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, rawValue]) => {
    if (rawValue === undefined || rawValue === null || rawValue === "") return;
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    values.forEach((value) => params.append(key, String(value)));
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}
