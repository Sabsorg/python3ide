import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as campaignStore from '../services/campaign-store.js';
import * as researchAgent from '../agents/research-agent.js';
import * as optimizerAgent from '../agents/optimizer-agent.js';

const createCampaignBody = z.object({
  name: z.string().min(1),
  niche: z.string().min(1),
  targetAudience: z.string().min(1),
});

const updateCampaignBody = z.object({
  name: z.string().min(1).optional(),
  niche: z.string().min(1).optional(),
  targetAudience: z.string().min(1).optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
});

const addLinkBody = z.object({
  url: z.string().url(),
  name: z.string().min(1),
  commission: z.number().min(0).max(100),
});

export async function campaignRoutes(app: FastifyInstance): Promise<void> {
  app.get('/campaigns', async () => campaignStore.listCampaigns());

  app.post('/campaigns', async (req, reply) => {
    const body = createCampaignBody.parse(req.body);
    const campaign = campaignStore.createCampaign(body);
    reply.code(201);
    return campaign;
  });

  app.get<{ Params: { id: string } }>('/campaigns/:id', async (req) =>
    campaignStore.getCampaign(req.params.id)
  );

  app.patch<{ Params: { id: string } }>('/campaigns/:id', async (req) => {
    const body = updateCampaignBody.parse(req.body);
    return campaignStore.updateCampaign(req.params.id, body);
  });

  app.delete<{ Params: { id: string } }>('/campaigns/:id', async (req, reply) => {
    campaignStore.deleteCampaign(req.params.id);
    reply.code(204);
  });

  app.get<{ Params: { id: string } }>('/campaigns/:id/links', async (req) =>
    campaignStore.getCampaignLinks(req.params.id)
  );

  app.post<{ Params: { id: string } }>('/campaigns/:id/links', async (req, reply) => {
    const body = addLinkBody.parse(req.body);
    const link = campaignStore.addAffiliateLink(req.params.id, body);
    reply.code(201);
    return link;
  });

  // AI-powered research: analyze niche, find products, generate content ideas
  app.post<{ Params: { id: string } }>('/campaigns/:id/research', async (req) => {
    const campaign = campaignStore.getCampaign(req.params.id);
    return researchAgent.researchNiche(campaign.niche, campaign.targetAudience);
  });

  // AI-powered optimization: score campaign and produce prioritized action plan
  app.post<{ Params: { id: string } }>('/campaigns/:id/optimize', async (req) =>
    optimizerAgent.optimizeCampaign(req.params.id)
  );
}
