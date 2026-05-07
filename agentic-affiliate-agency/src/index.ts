import { buildServer } from './server.js';
import { appConfig } from './config/index.js';

const app = buildServer();

try {
  await app.listen({ port: appConfig.port, host: '0.0.0.0' });
  app.log.info(`Agentic Affiliate Agency running on port ${appConfig.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
