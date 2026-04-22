export type CacheEntry<T> = { value: T; expiresAt: number; insertedAt: number };

export function buildSearchCacheKey(parts: Array<string | number | boolean | undefined>): string {
  return parts.map((part) => (part === undefined ? "default" : String(part))).join(":");
}

export function readCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
): CacheEntry<T> | undefined {
  return cache.get(key);
}

export async function readResponseText(
  response: Response,
  _options?: { maxBytes?: number },
): Promise<{ text: string }> {
  return { text: await response.text() };
}

export function resolveCacheTtlMs(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.floor(value * 60_000) : fallback;
}

export function resolveSearchCacheTtlMs(_searchConfig?: Record<string, unknown>): number {
  return 300_000;
}

export function resolveSearchTimeoutSeconds(searchConfig?: Record<string, unknown>): number {
  const value = searchConfig?.timeoutSeconds;
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 30;
}

export async function withTrustedWebSearchEndpoint<T>(
  _params: {
    url: string;
    timeoutSeconds: number;
    init: RequestInit;
  },
  _run: (response: Response) => Promise<T>,
): Promise<T> {
  throw new Error("withTrustedWebSearchEndpoint test stub should be mocked.");
}

export function writeCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
  ttlMs: number,
): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs, insertedAt: Date.now() });
}
