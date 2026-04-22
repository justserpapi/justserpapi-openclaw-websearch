export type OpenClawConfig = {
  plugins?: {
    entries?: Record<
      string,
      {
        enabled?: boolean;
        config?: unknown;
      }
    >;
  };
  tools?: {
    web?: {
      search?: Record<string, unknown>;
    };
  };
};
