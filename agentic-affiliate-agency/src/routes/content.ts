import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as contentAgent from '../agents/content-agent.js';
import * as contentStore from '../services/content-store.js';

const generateContentBody = z.object({
  campaignId: z.string().uuid(),
  type: z.enum(['blog', 'social', 'email']),
  topic: z.string().optional(),
  tone: z.string().optional(),
  wordCount: z.number().int().min(100).max(5000).optional(),
});

export async function contentRoutes(app: FastifyInstance): Promise<void> {
  // Generate content with Claude (streaming internally, returns completed piece)
  app.post('/content/generate', async (req, reply) => {
    const body = generateContentBody.parse(req.body);
    const content = await contentAgent.generateContent(body);
    reply.code(201);
    return content;
  });

  app.get('/content', async () => contentStore.listContent());

  app.get<{ Params: { id: string } }>('/content/:id', async (req, reply) => {
    const content = contentStore.getContent(req.params.id);
    if (!content) {
      reply.code(404);
      return { error: 'Content not found' };
    }
    return content;
  });

  app.get<{ Params: { campaignId: string } }>(
    '/campaigns/:campaignId/content',
    async (req) => contentStore.getContentByCampaign(req.params.campaignId)
  );
}
