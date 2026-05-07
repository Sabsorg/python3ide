import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as analyticsStore from '../services/analytics-store.js';

const recordClickBody = z.object({
  linkId: z.string().uuid(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
});

const recordConversionBody = z.object({
  linkId: z.string().uuid(),
  value: z.number().min(0),
});

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { campaignId: string } }>(
    '/analytics/:campaignId',
    async (req) => analyticsStore.getCampaignAnalytics(req.params.campaignId)
  );

  app.post<{ Params: { campaignId: string } }>(
    '/analytics/:campaignId/click',
    async (req, reply) => {
      const body = recordClickBody.parse(req.body);
      const event = analyticsStore.recordClick(body.linkId, req.params.campaignId, {
        userAgent: body.userAgent,
        referrer: body.referrer,
      });
      reply.code(201);
      return event;
    }
  );

  app.post<{ Params: { campaignId: string } }>(
    '/analytics/:campaignId/conversion',
    async (req, reply) => {
      const body = recordConversionBody.parse(req.body);
      const event = analyticsStore.recordConversion(
        body.linkId,
        req.params.campaignId,
        body.value
      );
      reply.code(201);
      return event;
    }
  );
}
