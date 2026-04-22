import { describe, expect, it } from "vitest";
import { createJustSerpApiWebSearchProvider } from "./justserpapi-search-provider.js";

describe("JustSerpAPI web search provider", () => {
  it("exposes OpenClaw provider metadata and credential contract", () => {
    const provider = createJustSerpApiWebSearchProvider();

    expect(provider.id).toBe("justserpapi");
    expect(provider.label).toBe("JustSerpAPI");
    expect(provider.envVars).toEqual(["JUSTSERPAPI_API_KEY", "JUSTSERP_API_KEY"]);
    expect(provider.credentialPath).toBe("plugins.entries.justserpapi.config.webSearch.apiKey");
  });

  it("creates a web_search tool schema", () => {
    const provider = createJustSerpApiWebSearchProvider();
    const tool = provider.createTool({});

    expect(tool).not.toBeNull();
    expect(tool?.parameters.properties).toMatchObject({
      query: { type: "string" },
      count: { type: "number", minimum: 1, maximum: 10 },
      country: { type: "string" },
      language: { type: "string" },
      safeSearch: { type: "string", enum: ["active", "off"] },
    });
  });
});
