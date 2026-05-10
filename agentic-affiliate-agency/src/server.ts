import path from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';
import staticPlugin from '@fastify/static';
import { ZodError } from 'zod';
import { appConfig } from './config/index.js';
import { AppError } from './utils/errors.js';
import { healthRoutes } from './routes/health.js';
import { campaignRoutes } from './routes/campaigns.js';
import { contentRoutes } from './routes/content.js';
import { analyticsRoutes } from './routes/analytics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function buildServer() {
  const app = Fastify({
    logger: {
      level: appConfig.logLevel,
    },
  });

  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof AppError) {
      reply.code(error.statusCode).send({ error: error.message, code: error.code });
      return;
    }
    if (error instanceof ZodError) {
      reply.code(400).send({ error: 'Validation failed', details: error.errors });
      return;
    }
    if (error.validation) {
      reply.code(400).send({ error: 'Validation failed', details: error.validation });
      return;
    }
    app.log.error(error);
    reply.code(500).send({ error: 'Internal server error' });
  });

  app.register(healthRoutes);
  app.register(campaignRoutes, { prefix: '/api/v1' });
  app.register(contentRoutes, { prefix: '/api/v1' });
  app.register(analyticsRoutes, { prefix: '/api/v1' });

  // Serve the built React frontend in production
  if (appConfig.nodeEnv === 'production') {
    const clientRoot = path.join(__dirname, '..', 'client');
    app.register(staticPlugin, { root: clientRoot, prefix: '/' });
    app.setNotFoundHandler((_req, reply) => {
      reply.sendFile('index.html', clientRoot);
    });
  }

  return app;
}
