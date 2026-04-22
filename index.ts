import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createJustSerpApiWebSearchProvider } from "./src/justserpapi-search-provider.js";

export default definePluginEntry({
  id: "justserpapi",
  name: "JustSerpAPI Plugin",
  description: "OpenClaw web_search provider for JustSerpAPI",
  register(api) {
    api.registerWebSearchProvider(createJustSerpApiWebSearchProvider());
  },
});
