import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_JUSTSERPAPI_BASE_URL,
  resolveJustSerpApiBaseUrl,
  resolveJustSerpApiDefaultCount,
  resolveJustSerpApiKey,
} from "./config.js";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("JustSerpAPI config", () => {
  it("uses configured api key before env vars", () => {
    process.env.JUSTSERPAPI_API_KEY = "env-key";

    expect(
      resolveJustSerpApiKey({
        plugins: {
          entries: {
            justserpapi: {
              config: {
                webSearch: {
                  apiKey: "config-key",
                },
              },
            },
          },
        },
      }),
    ).toBe("config-key");
  });

  it("falls back to JUSTSERPAPI_API_KEY and JUSTSERP_API_KEY", () => {
    process.env.JUSTSERPAPI_API_KEY = "primary-env-key";
    expect(resolveJustSerpApiKey()).toBe("primary-env-key");

    delete process.env.JUSTSERPAPI_API_KEY;
    process.env.JUSTSERP_API_KEY = "legacy-env-key";
    expect(resolveJustSerpApiKey()).toBe("legacy-env-key");
  });

  it("resolves baseUrl defaults and env override", () => {
    expect(resolveJustSerpApiBaseUrl()).toBe(DEFAULT_JUSTSERPAPI_BASE_URL);

    process.env.JUSTSERPAPI_BASE_URL = "https://example.test";
    expect(resolveJustSerpApiBaseUrl()).toBe("https://example.test");
  });

  it("clamps configured default count", () => {
    expect(
      resolveJustSerpApiDefaultCount({
        plugins: {
          entries: {
            justserpapi: {
              config: {
                webSearch: {
                  count: 99,
                },
              },
            },
          },
        },
      }),
    ).toBe(10);
  });
});
