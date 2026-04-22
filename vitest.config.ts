import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "openclaw/plugin-sdk/config-runtime": "/Users/tianxingzhou/project/justserpapi-openclaw-websearch/src/test-support/openclaw/config-runtime.ts",
      "openclaw/plugin-sdk/plugin-entry": "/Users/tianxingzhou/project/justserpapi-openclaw-websearch/src/test-support/openclaw/plugin-entry.ts",
      "openclaw/plugin-sdk/provider-web-search": "/Users/tianxingzhou/project/justserpapi-openclaw-websearch/src/test-support/openclaw/provider-web-search.ts",
      "openclaw/plugin-sdk/provider-web-search-contract": "/Users/tianxingzhou/project/justserpapi-openclaw-websearch/src/test-support/openclaw/provider-web-search-contract.ts",
      "openclaw/plugin-sdk/secret-input": "/Users/tianxingzhou/project/justserpapi-openclaw-websearch/src/test-support/openclaw/secret-input.ts",
      "openclaw/plugin-sdk/security-runtime": "/Users/tianxingzhou/project/justserpapi-openclaw-websearch/src/test-support/openclaw/security-runtime.ts",
      "openclaw/plugin-sdk/text-runtime": "/Users/tianxingzhou/project/justserpapi-openclaw-websearch/src/test-support/openclaw/text-runtime.ts",
    },
  },
});
