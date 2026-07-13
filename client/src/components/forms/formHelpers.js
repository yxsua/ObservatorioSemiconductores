export function resolveOptionValue(option, preferredKey) {
  return (
    option?.[preferredKey] ??
    option?.id ??
    option?.code ??
    option?.value ??
    ""
  );
}

export function resolveOptionLabel(option) {
  return (
    option?.name ??
    option?.label ??
    option?.title ??
    option?.code ??
    String(option ?? "")
  );
}

export function normalizeSelectValue(value) {
  return value == null ? "" : value;
}
