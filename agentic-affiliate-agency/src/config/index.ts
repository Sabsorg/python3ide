export const config = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  defaultModel: "claude-opus-4-7",
  defaultMaxTokens: 8192,
  ceoMaxTokens: 16384,
  environment: process.env.NODE_ENV ?? "development",
  mcpServerPort: parseInt(process.env.MCP_PORT ?? "3001", 10),
} as const;

if (!config.anthropicApiKey) {
  console.warn("Warning: ANTHROPIC_API_KEY is not set");
}
