# JustSerpAPI OpenClaw Web Search Provider

OpenClaw native plugin that registers `justserpapi` as a `web_search` provider.

## Install

Install or link this plugin into your OpenClaw environment, then enable it in your OpenClaw config.

```json
{
  "plugins": {
    "entries": {
      "justserpapi": {
        "enabled": true,
        "config": {
          "webSearch": {
            "apiKey": "YOUR_JUSTSERPAPI_KEY",
            "baseUrl": "https://api.justserpapi.com"
          }
        }
      }
    }
  },
  "tools": {
    "web": {
      "search": {
        "enabled": true,
        "provider": "justserpapi",
        "maxResults": 5,
        "timeoutSeconds": 30
      }
    }
  }
}
```

You can also provide credentials with environment variables:

```bash
export JUSTSERPAPI_API_KEY="YOUR_JUSTSERPAPI_KEY"
```

Supported fallbacks:

- `JUSTSERPAPI_API_KEY`
- `JUSTSERP_API_KEY`
- `JUSTSERPAPI_BASE_URL`
- `JUSTSERP_BASE_URL`

## How It Works

The provider calls:

```http
GET https://api.justserpapi.com/api/v1/google/search?query=...
X-API-Key: <apiKey>
```

It maps JustSerpAPI `data.organic_results[]` into OpenClaw web search results:

- `title`
- `url`
- `snippet`
- `description`
- `source`
- `siteName`
- `displayedLink`
- `favicon`
- `position`

## Optional Settings

Under `plugins.entries.justserpapi.config.webSearch`:

- `apiKey`: JustSerpAPI API key.
- `baseUrl`: API base URL, defaults to `https://api.justserpapi.com`.
- `language`: default Google language code, such as `en`.
- `country`: default Google country code, such as `us`.
- `safeSearch`: `active` or `off`.
- `count`: default result count, clamped to 1-10.

## Development

```bash
npm install
npm test
npm run typecheck
```
