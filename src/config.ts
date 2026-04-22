import type { OpenClawConfig } from "openclaw/plugin-sdk/config-runtime";
import {
  normalizeResolvedSecretInputString,
  normalizeSecretInput,
} from "openclaw/plugin-sdk/secret-input";
import { normalizeOptionalString } from "openclaw/plugin-sdk/text-runtime";

export const JUSTSERPAPI_PROVIDER_ID = "justserpapi";
export const JUSTSERPAPI_CREDENTIAL_PATH =
  "plugins.entries.justserpapi.config.webSearch.apiKey";
export const DEFAULT_JUSTSERPAPI_BASE_URL = "https://api.justserpapi.com";
export const DEFAULT_JUSTSERPAPI_SEARCH_TIMEOUT_SECONDS = 30;
export const DEFAULT_JUSTSERPAPI_SEARCH_COUNT = 5;
export const MAX_JUSTSERPAPI_SEARCH_COUNT = 10;
export const JUSTSERPAPI_API_KEY_ENV_VARS = ["JUSTSERPAPI_API_KEY", "JUSTSERP_API_KEY"] as const;
export const JUSTSERPAPI_BASE_URL_ENV_VARS = [
  "JUSTSERPAPI_BASE_URL",
  "JUSTSERP_BASE_URL",
] as const;

export type JustSerpApiWebSearchConfig = {
  apiKey?: unknown;
  baseUrl?: string;
  language?: string;
  country?: string;
  safeSearch?: string;
  count?: number;
};

type PluginEntryConfig = {
  webSearch?: JustSerpApiWebSearchConfig;
};

function normalizeConfiguredSecret(value: unknown, path: string): string | undefined {
  return (
    normalizeSecretInput(
      normalizeResolvedSecretInputString({
        value,
        path,
      }),
    ) || undefined
  );
}

function readFirstEnvValue(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = normalizeSecretInput(process.env[name]);
    if (value) {
      return value;
    }
  }
  return undefined;
}

export function resolveJustSerpApiSearchConfig(
  cfg?: OpenClawConfig,
): JustSerpApiWebSearchConfig | undefined {
  const pluginConfig = cfg?.plugins?.entries?.justserpapi?.config as PluginEntryConfig | undefined;
  const webSearch = pluginConfig?.webSearch;
  if (webSearch && typeof webSearch === "object" && !Array.isArray(webSearch)) {
    return webSearch;
  }
  return undefined;
}

export function resolveJustSerpApiKey(cfg?: OpenClawConfig): string | undefined {
  const search = resolveJustSerpApiSearchConfig(cfg);
  return (
    normalizeConfiguredSecret(search?.apiKey, JUSTSERPAPI_CREDENTIAL_PATH) ||
    readFirstEnvValue(JUSTSERPAPI_API_KEY_ENV_VARS)
  );
}

export function resolveJustSerpApiBaseUrl(cfg?: OpenClawConfig): string {
  const search = resolveJustSerpApiSearchConfig(cfg);
  const configured =
    normalizeOptionalString(search?.baseUrl) || readFirstEnvValue(JUSTSERPAPI_BASE_URL_ENV_VARS);
  return configured || DEFAULT_JUSTSERPAPI_BASE_URL;
}

export function resolveJustSerpApiDefaultLanguage(cfg?: OpenClawConfig): string | undefined {
  return normalizeOptionalString(resolveJustSerpApiSearchConfig(cfg)?.language);
}

export function resolveJustSerpApiDefaultCountry(cfg?: OpenClawConfig): string | undefined {
  return normalizeOptionalString(resolveJustSerpApiSearchConfig(cfg)?.country);
}

export function resolveJustSerpApiDefaultSafeSearch(cfg?: OpenClawConfig): string | undefined {
  const value = normalizeOptionalString(resolveJustSerpApiSearchConfig(cfg)?.safeSearch);
  return value === "active" || value === "off" ? value : undefined;
}

export function resolveJustSerpApiDefaultCount(cfg?: OpenClawConfig): number | undefined {
  const value = resolveJustSerpApiSearchConfig(cfg)?.count;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.max(1, Math.min(MAX_JUSTSERPAPI_SEARCH_COUNT, Math.floor(value)));
  }
  return undefined;
}

export function resolveJustSerpApiSearchTimeoutSeconds(override?: number): number {
  if (typeof override === "number" && Number.isFinite(override) && override > 0) {
    return Math.floor(override);
  }
  return DEFAULT_JUSTSERPAPI_SEARCH_TIMEOUT_SECONDS;
}
