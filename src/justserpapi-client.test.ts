import { beforeEach, describe, expect, it, vi } from "vitest";

const readCache = vi.fn();
const writeCache = vi.fn();
const withTrustedWebSearchEndpoint = vi.fn();
const wrapWebContent = vi.fn((value: string) => value);

vi.mock("openclaw/plugin-sdk/provider-web-search", () => ({
  buildSearchCacheKey: (parts: unknown[]) => parts.join(":"),
  readCache,
  readResponseText: async (response: Response) => ({ text: await response.text() }),
  resolveCacheTtlMs: () => 900_000,
  resolveSearchCacheTtlMs: () => 900_000,
  resolveSearchTimeoutSeconds: () => 30,
  withTrustedWebSearchEndpoint,
  writeCache,
}));

vi.mock("openclaw/plugin-sdk/security-runtime", () => ({
  wrapWebContent,
}));

describe("JustSerpAPI client", () => {
  beforeEach(() => {
    readCache.mockReset();
    readCache.mockReturnValue(undefined);
    writeCache.mockReset();
    withTrustedWebSearchEndpoint.mockReset();
    wrapWebContent.mockClear();
    delete process.env.JUSTSERPAPI_API_KEY;
    delete process.env.JUSTSERP_API_KEY;
    delete process.env.JUSTSERPAPI_BASE_URL;
    delete process.env.JUSTSERP_BASE_URL;
  });

  it("returns a clear missing-key payload", async () => {
    const { runJustSerpApiSearch } = await import("./justserpapi-client.js");

    const result = await runJustSerpApiSearch({ query: "coffee" });

    expect(result.error).toBe("missing_justserpapi_api_key");
    expect(withTrustedWebSearchEndpoint).not.toHaveBeenCalled();
  });

  it("builds request URL and maps organic results", async () => {
    const { runJustSerpApiSearch } = await import("./justserpapi-client.js");

    withTrustedWebSearchEndpoint.mockImplementation(
      async (params: unknown, run: (response: Response) => Promise<unknown>) =>
        run(
          Response.json({
            code: 200,
            message: "success",
            data: {
              search_information: { total_results: 100 },
              organic_results: [
                {
                  title: "Coffee",
                  link: "https://en.wikipedia.org/wiki/Coffee",
                  displayed_link: "https://en.wikipedia.org › wiki › Coffee",
                  favicon: "data:image/png;base64,abc",
                  source: "Wikipedia",
                  snippet: "Coffee is a beverage.",
                  rank: 1,
                  page_rank: 1,
                },
                {
                  title: "Coffee shop",
                  link: "https://example.com/coffee",
                  snippet: "Example snippet.",
                  page_rank: 2,
                },
              ],
            },
          }),
        ),
    );

    const result = await runJustSerpApiSearch({
      cfg: {
        plugins: {
          entries: {
            justserpapi: {
              config: {
                webSearch: {
                  apiKey: "test-key",
                  baseUrl: "https://api.test",
                },
              },
            },
          },
        },
      },
      searchConfig: {
        cacheTtlMinutes: 15,
        timeoutSeconds: 30,
      },
      query: "coffee",
      count: 1,
      country: "us",
      language: "en",
      safeSearch: "active",
    });

    expect(withTrustedWebSearchEndpoint).toHaveBeenCalledOnce();
    const call = withTrustedWebSearchEndpoint.mock.calls[0][0];
    expect(call.url).toBe(
      "https://api.test/api/v1/google/search?query=coffee&language=en&country=us&safe=active",
    );
    expect(call.init.headers["X-API-Key"]).toBe("test-key");
    expect(result.provider).toBe("justserpapi");
    expect(result.count).toBe(1);
    expect(result.searchInformation).toEqual({ total_results: 100 });
    expect(result.results).toEqual([
      {
        title: "Coffee",
        url: "https://en.wikipedia.org/wiki/Coffee",
        snippet: "Coffee is a beverage.",
        description: "Coffee is a beverage.",
        source: "Wikipedia",
        siteName: "Wikipedia",
        displayedLink: "https://en.wikipedia.org › wiki › Coffee",
        favicon: "data:image/png;base64,abc",
        position: 1,
      },
    ]);
    expect(writeCache).toHaveBeenCalledOnce();
  });

  it("surfaces 401, 403, and 429 as specific upstream errors", async () => {
    const { runJustSerpApiSearch } = await import("./justserpapi-client.js");
    process.env.JUSTSERPAPI_API_KEY = "env-key";

    for (const status of [401, 403, 429]) {
      withTrustedWebSearchEndpoint.mockImplementationOnce(
        async (_params: unknown, run: (response: Response) => Promise<unknown>) =>
          run(new Response("upstream detail", { status })),
      );
      await expect(runJustSerpApiSearch({ query: "coffee" })).rejects.toThrow(
        status === 429 ? "rate limit" : "authentication or permission",
      );
    }
  });

  it("rejects malformed response shape", async () => {
    const { runJustSerpApiSearch } = await import("./justserpapi-client.js");
    process.env.JUSTSERPAPI_API_KEY = "env-key";

    withTrustedWebSearchEndpoint.mockImplementation(
      async (_params: unknown, run: (response: Response) => Promise<unknown>) =>
        run(Response.json({ code: 200, message: "success", data: {} })),
    );

    await expect(runJustSerpApiSearch({ query: "coffee" })).rejects.toThrow(
      "data.organic_results must be an array",
    );
  });

  it("rejects invalid JSON", async () => {
    const { runJustSerpApiSearch } = await import("./justserpapi-client.js");
    process.env.JUSTSERPAPI_API_KEY = "env-key";

    withTrustedWebSearchEndpoint.mockImplementation(
      async (_params: unknown, run: (response: Response) => Promise<unknown>) =>
        run(new Response("{", { status: 200 })),
    );

    await expect(runJustSerpApiSearch({ query: "coffee" })).rejects.toThrow(
      "returned invalid JSON",
    );
  });
});
