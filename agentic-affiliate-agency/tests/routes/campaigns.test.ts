import { describe, it, expect } from 'vitest';
import { buildServer } from '../../src/server.js';

describe('Campaign Routes', () => {
  it('GET /campaigns returns an array', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/v1/campaigns' });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
  });

  it('POST /campaigns creates a campaign', async () => {
    const app = buildServer();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/campaigns',
      payload: { name: 'Tech Deals', niche: 'technology', targetAudience: 'developers' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ id: string; name: string; status: string }>();
    expect(body.name).toBe('Tech Deals');
    expect(body.id).toBeDefined();
    expect(body.status).toBe('active');
  });

  it('GET /campaigns/:id returns 404 for unknown id', async () => {
    const app = buildServer();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/campaigns/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(404);
  });

  it('POST /campaigns rejects invalid body with 400', async () => {
    const app = buildServer();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/campaigns',
      payload: { name: '' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('full campaign lifecycle: create → update → delete', async () => {
    const app = buildServer();

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/campaigns',
      payload: { name: 'Lifecycle Test', niche: 'fitness', targetAudience: 'gym-goers' },
    });
    expect(createRes.statusCode).toBe(201);
    const { id } = createRes.json<{ id: string }>();

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/campaigns/${id}`,
      payload: { status: 'paused' },
    });
    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.json<{ status: string }>().status).toBe('paused');

    const delRes = await app.inject({ method: 'DELETE', url: `/api/v1/campaigns/${id}` });
    expect(delRes.statusCode).toBe(204);

    const getRes = await app.inject({ method: 'GET', url: `/api/v1/campaigns/${id}` });
    expect(getRes.statusCode).toBe(404);
  });

  it('POST /campaigns/:id/links adds an affiliate link', async () => {
    const app = buildServer();

    const campaignRes = await app.inject({
      method: 'POST',
      url: '/api/v1/campaigns',
      payload: { name: 'Link Campaign', niche: 'software', targetAudience: 'startups' },
    });
    const { id } = campaignRes.json<{ id: string }>();

    const linkRes = await app.inject({
      method: 'POST',
      url: `/api/v1/campaigns/${id}/links`,
      payload: { url: 'https://example.com/product', name: 'SaaS Tool', commission: 30 },
    });
    expect(linkRes.statusCode).toBe(201);
    const link = linkRes.json<{ campaignId: string; clicks: number }>();
    expect(link.campaignId).toBe(id);
    expect(link.clicks).toBe(0);
  });
});
