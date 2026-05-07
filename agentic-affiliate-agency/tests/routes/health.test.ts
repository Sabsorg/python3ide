import { describe, it, expect } from 'vitest';
import { buildServer } from '../../src/server.js';

describe('GET /health', () => {
  it('returns ok status with timestamp', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ status: string; timestamp: string; version: string }>();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
    expect(body.version).toBe('1.0.0');
  });
});
