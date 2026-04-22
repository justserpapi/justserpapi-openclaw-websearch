# JustSerpAPI OpenClaw Web Search Provider

OpenClaw native plugin that registers `justserpapi` as a `web_search` provider.
It lets OpenClaw use [JustSerpAPI](https://justserpapi.com) for Google SERP-backed web search.

## Requirements

- OpenClaw with plugin support
- Node.js `>=22.14.0`
- A JustSerpAPI API key from the JustSerpAPI dashboard

## Install From GitHub

OpenClaw installs native plugins from local paths. For GitHub distribution, clone this public repo first, then install the local plugin directory.

```bash
git clone https://github.com/justserpapi/justserpapi-openclaw-websearch.git
cd justserpapi-openclaw-websearch
openclaw plugins install . --link
openclaw plugins enable justserpapi
```

Use `--link` while testing or developing so OpenClaw loads the checked-out repository. For a copied install instead, omit `--link`:

```bash
openclaw plugins install .
```

Confirm OpenClaw can see the plugin:

```bash
openclaw plugins list --enabled
openclaw plugins inspect justserpapi
```

## Install From GitHub Marketplace

This repository also ships a marketplace manifest at `.claude-plugin/marketplace.json`, so users can install the plugin from the public GitHub repo without npm publishing.

Inspect the marketplace:

```bash
openclaw plugins marketplace list justserpapi/justserpapi-openclaw-websearch
```

Install from the marketplace:

```bash
openclaw plugins install justserpapi --marketplace justserpapi/justserpapi-openclaw-websearch
openclaw plugins enable justserpapi
```

The full GitHub URL works too:

```bash
openclaw plugins install justserpapi --marketplace https://github.com/justserpapi/justserpapi-openclaw-websearch
```

For remote marketplaces, OpenClaw requires plugin sources to be relative paths inside the marketplace repository. This plugin's marketplace entry uses `"source": "."`, pointing at this native OpenClaw plugin root.

## Configure

Add the provider config to your OpenClaw config:

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

Supported environment fallbacks:

- `JUSTSERPAPI_API_KEY`
- `JUSTSERP_API_KEY`
- `JUSTSERPAPI_BASE_URL`
- `JUSTSERP_BASE_URL`

## Optional Settings

Under `plugins.entries.justserpapi.config.webSearch`:

- `apiKey`: JustSerpAPI API key.
- `baseUrl`: API base URL, defaults to `https://api.justserpapi.com`.
- `language`: default Google language code, such as `en`.
- `country`: default Google country code, such as `us`.
- `safeSearch`: `active` or `off`.
- `count`: default result count, clamped to 1-10.

Tool-call parameters can override the configured defaults:

- `query`
- `count`
- `country`
- `language`
- `safeSearch`

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

## Troubleshooting

- `missing_justserpapi_api_key`: configure `plugins.entries.justserpapi.config.webSearch.apiKey` or set `JUSTSERPAPI_API_KEY`.
- `401` or `403`: check that the API key is valid and the account has permission/credits.
- `429`: the JustSerpAPI account is rate limited; retry later or adjust usage.
- No `web_search` results: confirm `tools.web.search.provider` is set to `justserpapi` and the plugin is enabled.

## Development

```bash
npm install --omit=peer
npm test
npm run typecheck
npm pack --dry-run
```

`openclaw` is declared as an optional peer dependency so this package can be tested without vendoring the full OpenClaw runtime.

## Security

Do not commit real API keys. Use OpenClaw secret storage or environment variables for credentials.
