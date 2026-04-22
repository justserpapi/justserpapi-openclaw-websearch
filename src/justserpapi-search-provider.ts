import {
  createWebSearchProviderContractFields,
  type WebSearchProviderPlugin,
} from "openclaw/plugin-sdk/provider-web-search-contract";
import {
  JUSTSERPAPI_API_KEY_ENV_VARS,
  JUSTSERPAPI_CREDENTIAL_PATH,
  JUSTSERPAPI_PROVIDER_ID,
} from "./config.js";

type JustSerpApiClientModule = typeof import("./justserpapi-client.js");

let justSerpApiClientModulePromise: Promise<JustSerpApiClientModule> | undefined;

function loadJustSerpApiClientModule(): Promise<JustSerpApiClientModule> {
  justSerpApiClientModulePromise ??= import("./justserpapi-client.js");
  return justSerpApiClientModulePromise;
}

const JustSerpApiSearchSchema = {
  type: "object",
  properties: {
    query: {
      type: "string",
      description: "Search query string.",
    },
    count: {
      type: "number",
      description: "Number of organic results to return (1-10).",
      minimum: 1,
      maximum: 10,
    },
    country: {
      type: "string",
      description: "Google country code for localized results, such as 'us' or 'gb'.",
    },
    language: {
      type: "string",
      description: "Google language code for localized results, such as 'en'.",
    },
    safeSearch: {
      type: "string",
      description: "SafeSearch setting: 'active' or 'off'.",
      enum: ["active", "off"],
    },
  },
  required: ["query"],
  additionalProperties: false,
} satisfies Record<string, unknown>;

export function createJustSerpApiWebSearchProvider(): WebSearchProviderPlugin {
  return {
    id: JUSTSERPAPI_PROVIDER_ID,
    label: "JustSerpAPI",
    hint: "Google SERP results via JustSerpAPI",
    onboardingScopes: ["text-inference"],
    credentialLabel: "JustSerpAPI API key",
    envVars: [...JUSTSERPAPI_API_KEY_ENV_VARS],
    placeholder: "sk-...",
    signupUrl: "https://justserpapi.com",
    docsUrl: "https://docs.justserpapi.com/api/v1/google/search",
    autoDetectOrder: 75,
    credentialPath: JUSTSERPAPI_CREDENTIAL_PATH,
    ...createWebSearchProviderContractFields({
      credentialPath: JUSTSERPAPI_CREDENTIAL_PATH,
      searchCredential: { type: "scoped", scopeId: JUSTSERPAPI_PROVIDER_ID },
      configuredCredential: { pluginId: JUSTSERPAPI_PROVIDER_ID },
      selectionPluginId: JUSTSERPAPI_PROVIDER_ID,
    }),
    createTool: (ctx) => ({
      description:
        "Search the web using JustSerpAPI. Returns Google organic results with titles, URLs, snippets, source, favicon, and ranking metadata.",
      parameters: JustSerpApiSearchSchema,
      execute: async (args) => {
        const { runJustSerpApiSearch } = await loadJustSerpApiClientModule();
        return await runJustSerpApiSearch({
          cfg: ctx.config,
          searchConfig: ctx.searchConfig,
          query: typeof args.query === "string" ? args.query : "",
          count: typeof args.count === "number" ? args.count : undefined,
          country: typeof args.country === "string" ? args.country : undefined,
          language: typeof args.language === "string" ? args.language : undefined,
          safeSearch: typeof args.safeSearch === "string" ? args.safeSearch : undefined,
        });
      },
    }),
  };
}
