export function normalizeResolvedSecretInputString(params: { value: unknown; path?: string }): string {
  if (typeof params.value === "string") {
    return params.value;
  }
  if (
    typeof params.value === "object" &&
    params.value !== null &&
    "value" in params.value &&
    typeof (params.value as { value?: unknown }).value === "string"
  ) {
    return (params.value as { value: string }).value;
  }
  return "";
}

export function normalizeSecretInput(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
