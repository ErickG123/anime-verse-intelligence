import './config/load-dotenv.js';
import { loadEnv } from './config/env.js';
import { buildApp } from './app.js';

const env = loadEnv();
if (!env.databaseUrl && env.nodeEnv !== 'test') {
  console.warn(
    '[animeverse-api] DATABASE_URL is not configured. Catalog and readiness endpoints will return 503 until DATABASE_URL is set in root .env or session environment.',
  );
}

const app = await buildApp({ env });

try {
  await app.listen({ port: env.apiPort, host: env.apiHost });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
