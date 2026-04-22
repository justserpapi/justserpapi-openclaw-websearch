import type { OpenClawConfig } from "./config-runtime.js";

export type WebSearchProviderToolDefinition = {
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
};

export type WebSearchProviderPlugin = {
  id: string;
  label: string;
  hint: string;
  onboardingScopes?: Array<"text-inference">;
  credentialLabel?: string;
  envVars: string[];
  placeholder: string;
  signupUrl: string;
  docsUrl?: string;
  autoDetectOrder?: number;
  credentialPath: string;
  getCredentialValue: (searchConfig?: Record<string, unknown>) => unknown;
  setCredentialValue: (searchConfigTarget: Record<string, unknown>, value: unknown) => void;
  getConfiguredCredentialValue?: (config?: OpenClawConfig) => unknown;
  setConfiguredCredentialValue?: (configTarget: OpenClawConfig, value: unknown) => void;
  applySelectionConfig?: (config: OpenClawConfig) => OpenClawConfig;
  createTool: (ctx: {
    config?: OpenClawConfig;
    searchConfig?: Record<string, unknown>;
  }) => WebSearchProviderToolDefinition | null;
};

function readPath(root: Record<string, unknown> | undefined, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (typeof current !== "object" || current === null || Array.isArray(current)) {
      return undefined;
    }
    return (current as Record<string, unknown>)[part];
  }, root);
}

export function createWebSearchProviderContractFields(params: {
  credentialPath: string;
  searchCredential?: unknown;
  configuredCredential?: unknown;
  selectionPluginId?: string;
}): Pick<
  WebSearchProviderPlugin,
  | "getCredentialValue"
  | "setCredentialValue"
  | "getConfiguredCredentialValue"
  | "setConfiguredCredentialValue"
  | "applySelectionConfig"
> {
  return {
    getCredentialValue(searchConfig?: Record<string, unknown>) {
      return searchConfig?.apiKey;
    },
    setCredentialValue(searchConfigTarget: Record<string, unknown>, value: unknown) {
      searchConfigTarget.apiKey = value;
    },
    getConfiguredCredentialValue(config?: OpenClawConfig) {
      return readPath(config as Record<string, unknown> | undefined, params.credentialPath);
    },
    setConfiguredCredentialValue(configTarget: OpenClawConfig, value: unknown) {
      configTarget.plugins ??= {};
      configTarget.plugins.entries ??= {};
      const entry = (configTarget.plugins.entries.justserpapi ??= {});
      const entryConfig = ((entry.config as Record<string, unknown> | undefined) ??= {});
      entry.config = entryConfig;
      const webSearch = ((entryConfig.webSearch as Record<string, unknown> | undefined) ??= {});
      entryConfig.webSearch = webSearch;
      webSearch.apiKey = value;
    },
    applySelectionConfig(config: OpenClawConfig) {
      if (!params.selectionPluginId) {
        return config;
      }
      config.tools ??= {};
      config.tools.web ??= {};
      config.tools.web.search ??= {};
      config.tools.web.search.provider = params.selectionPluginId;
      return config;
    },
  };
}
