export function safeReturnTo(value: unknown, fallback = "/cuenta") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
