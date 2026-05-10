import { config } from 'dotenv';

config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const appConfig = {
  anthropicApiKey: requireEnv('ANTHROPIC_API_KEY'),
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  model: 'claude-opus-4-7' as const,
};
