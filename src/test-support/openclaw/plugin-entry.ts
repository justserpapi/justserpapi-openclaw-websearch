export type PluginEntryDefinition = {
  id: string;
  name: string;
  description?: string;
  register?: (api: { registerWebSearchProvider: (provider: unknown) => void }) => void;
};

export function definePluginEntry<T extends PluginEntryDefinition>(definition: T): T {
  return definition;
}
