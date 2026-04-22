import type { OpenClawConfig } from "openclaw/plugin-sdk/config-runtime";
import {
  buildSearchCacheKey,
  readCache,
  readResponseText,
  resolveSearchCacheTtlMs,
  resolveSearchTimeoutSeconds,
  withTrustedWebSearchEndpoint,
  writeCache,
} from "openclaw/plugin-sdk/provider-web-search";
import { wrapWebContent } from "openclaw/plugin-sdk/security-runtime";
import {
  DEFAULT_JUSTSERPAPI_BASE_URL,
  DEFAULT_JUSTSERPAPI_SEARCH_COUNT,
  JUSTSERPAPI_PROVIDER_ID,
  MAX_JUSTSERPAPI_SEARCH_COUNT,
  resolveJustSerpApiBaseUrl,
  resolveJustSerpApiDefaultCount,
  resolveJustSerpApiDefaultCountry,
  resolveJustSerpApiDefaultLanguage,
  resolveJustSerpApiDefaultSafeSearch,
  resolveJustSerpApiKey,
  resolveJustSerpApiSearchTimeoutSeconds,
} from "./config.js";

const SEARCH_CACHE = new Map<
  string,
  { value: Record<string, unknown>; expiresAt: number; insertedAt: number }
>();

export type JustSerpApiSearchParams = {
  cfg?: OpenClawConfig;
  searchConfig?: Record<string, unknown>;
  query: string;
  count?: number;
  language?: string;
  country?: string;
  safeSearch?: string;
};

type JustSerpApiOrganicResult = {
  title?: unknown;
  link?: unknown;
  displayed_link?: unknown;
  favicon?: unknown;
  source?: unknown;
  snippet?: unknown;
  date?: unknown;
  rank?: unknown;
  page_rank?: unknown;
};

type JustSerpApiResponse = {
  code?: unknown;
  message?: unknown;
  data?: {
    organic_results?: unknown;
    search_information?: unknown;
  };
};

function normalizeCount(value: unknown, fallback = DEFAULT_JUSTSERPAPI_SEARCH_COUNT): number {
  const parsed = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(1, Math.min(MAX_JUSTSERPAPI_SEARCH_COUNT, Math.floor(parsed)));
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function normalizeSafeSearch(value: unknown): "active" | "off" | undefined {
  const normalized = normalizeOptionalString(value)?.toLowerCase();
  if (normalized === "active" || normalized === "on" || normalized === "true") {
    return "active";
  }
  if (normalized === "off" || normalized === "false") {
    return "off";
  }
  return undefined;
}

function resolveEndpoint(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) {
    return `${DEFAULT_JUSTSERPAPI_BASE_URL}/api/v1/google/search`;
  }
  try {
    const url = new URL(trimmed);
    url.pathname = `${url.pathname.replace(/\/$/, "")}/api/v1/google/search`;
    return url.toString();
  } catch {
    return `${DEFAULT_JUSTSERPAPI_BASE_URL}/api/v1/google/search`;
  }
}

function resolveSiteName(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function mapOrganicResult(item: JustSerpApiOrganicResult): Record<string, unknown> {
  const title = normalizeOptionalString(item.title) || "";
  const url = normalizeOptionalString(item.link) || "";
  const snippet = normalizeOptionalString(item.snippet) || "";
  const source = normalizeOptionalString(item.source);
  const siteName = source || resolveSiteName(url);
  const displayedLink = normalizeOptionalString(item.displayed_link);
  const favicon = normalizeOptionalString(item.favicon);
  const published = normalizeOptionalString(item.date);
  const position = readNumber(item.rank) ?? readNumber(item.page_rank);

  return {
    title: title ? wrapWebContent(title, "web_search") : "",
    url,
    snippet: snippet ? wrapWebContent(snippet, "web_search") : "",
    description: snippet ? wrapWebContent(snippet, "web_search") : "",
    ...(source ? { source } : {}),
    ...(siteName ? { siteName } : {}),
    ...(displayedLink ? { displayedLink } : {}),
    ...(favicon ? { favicon } : {}),
    ...(published ? { published } : {}),
    ...(position !== undefined ? { position } : {}),
  };
}

async function parseJustSerpApiResponse(response: Response): Promise<JustSerpApiResponse> {
  try {
    return (await response.json()) as JustSerpApiResponse;
  } catch (error) {
    throw new Error(
      `JustSerpAPI returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function throwJustSerpApiHttpError(response: Response): Promise<never> {
  const detail = await readResponseText(response, { maxBytes: 16_000 });
  const suffix = detail.text || response.statusText;
  if (response.status === 401 || response.status === 403) {
    throw new Error(
      `JustSerpAPI authentication or permission error (${response.status}): ${suffix}`,
    );
  }
  if (response.status === 429) {
    throw new Error(`JustSerpAPI rate limit error (429): ${suffix}`);
  }
  throw new Error(`JustSerpAPI API error (${response.status}): ${suffix}`);
}

function assertSuccessfulPayload(payload: JustSerpApiResponse): {
  organicResults: JustSerpApiOrganicResult[];
  searchInformation?: unknown;
} {
  if (payload.code !== undefined && payload.code !== 200) {
    const message =
      typeof payload.message === "string" && payload.message.trim()
        ? payload.message.trim()
        : "upstream returned an error";
    throw new Error(`JustSerpAPI API error (${payload.code}): ${message}`);
  }

  const rawOrganicResults = payload.data?.organic_results;
  if (!Array.isArray(rawOrganicResults)) {
    throw new Error("JustSerpAPI response format error: data.organic_results must be an array.");
  }

  return {
    organicResults: rawOrganicResults as JustSerpApiOrganicResult[],
    searchInformation: payload.data?.search_information,
  };
}

export async function runJustSerpApiSearch(
  params: JustSerpApiSearchParams,
): Promise<Record<string, unknown>> {
  const apiKey = resolveJustSerpApiKey(params.cfg);
  if (!apiKey) {
    return {
      error: "missing_justserpapi_api_key",
      message:
        "web_search (justserpapi) needs a JustSerpAPI API key. Configure plugins.entries.justserpapi.config.webSearch.apiKey, or set JUSTSERPAPI_API_KEY or JUSTSERP_API_KEY in the Gateway environment.",
      docs: "https://justserpapi.com",
    };
  }

  const query = params.query.trim();
  if (!query) {
    return {
      error: "missing_query",
      message: "web_search (justserpapi) requires a non-empty query.",
    };
  }

  const count = normalizeCount(params.count, resolveJustSerpApiDefaultCount(params.cfg));
  const language =
    normalizeOptionalString(params.language) || resolveJustSerpApiDefaultLanguage(params.cfg);
  const country =
    normalizeOptionalString(params.country) || resolveJustSerpApiDefaultCountry(params.cfg);
  const safeSearch =
    normalizeSafeSearch(params.safeSearch) || resolveJustSerpApiDefaultSafeSearch(params.cfg);
  const baseUrl = resolveJustSerpApiBaseUrl(params.cfg);
  const timeoutSeconds = resolveJustSerpApiSearchTimeoutSeconds(
    resolveSearchTimeoutSeconds(params.searchConfig),
  );
  const cacheTtlMs = resolveSearchCacheTtlMs(params.searchConfig);

  const cacheKey = buildSearchCacheKey([
    JUSTSERPAPI_PROVIDER_ID,
    query,
    count,
    baseUrl,
    language,
    country,
    safeSearch,
  ]);
  const cached = readCache(SEARCH_CACHE, cacheKey);
  if (cached) {
    return { ...cached.value, cached: true };
  }

  const url = new URL(resolveEndpoint(baseUrl));
  url.searchParams.set("query", query);
  if (language) {
    url.searchParams.set("language", language);
  }
  if (country) {
    url.searchParams.set("country", country);
  }
  if (safeSearch) {
    url.searchParams.set("safe", safeSearch);
  }

  const start = Date.now();
  const payload = await withTrustedWebSearchEndpoint(
    {
      url: url.toString(),
      timeoutSeconds,
      init: {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": apiKey,
        },
      },
    },
    async (response) => {
      if (!response.ok) {
        await throwJustSerpApiHttpError(response);
      }
      return await parseJustSerpApiResponse(response);
    },
  );

  const { organicResults, searchInformation } = assertSuccessfulPayload(payload);
  const results = organicResults.slice(0, count).map(mapOrganicResult);
  const result: Record<string, unknown> = {
    query,
    provider: JUSTSERPAPI_PROVIDER_ID,
    count: results.length,
    tookMs: Date.now() - start,
    externalContent: {
      untrusted: true,
      source: "web_search",
      provider: JUSTSERPAPI_PROVIDER_ID,
      wrapped: true,
    },
    results,
  };
  if (searchInformation !== undefined) {
    result.searchInformation = searchInformation;
  }

  writeCache(SEARCH_CACHE, cacheKey, result, cacheTtlMs);
  return result;
}

export const __testing = {
  normalizeCount,
  normalizeSafeSearch,
  resolveEndpoint,
  mapOrganicResult,
};
