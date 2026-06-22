import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const openClawTestSupport = (moduleName: string) =>
  fileURLToPath(new URL(`./src/test-support/openclaw/${moduleName}.ts`, import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "openclaw/plugin-sdk/config-runtime": openClawTestSupport("config-runtime"),
      "openclaw/plugin-sdk/plugin-entry": openClawTestSupport("plugin-entry"),
      "openclaw/plugin-sdk/provider-web-search": openClawTestSupport("provider-web-search"),
      "openclaw/plugin-sdk/provider-web-search-contract": openClawTestSupport(
        "provider-web-search-contract",
      ),
      "openclaw/plugin-sdk/secret-input": openClawTestSupport("secret-input"),
      "openclaw/plugin-sdk/security-runtime": openClawTestSupport("security-runtime"),
      "openclaw/plugin-sdk/text-runtime": openClawTestSupport("text-runtime"),
    },
  },
});
