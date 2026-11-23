import crypto from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { loadEnv, type AppEnv } from './config/env.js';
import { createDatabase, type DatabaseHandle } from './db/client.js';
import { registerProblemDetails } from './plugins/problem-details.js';
import { registerSecurityPlugins } from './plugins/security.js';
import { registerSwaggerPlugin } from './plugins/swagger.js';
import { registerHealthRoutes } from './modules/health/routes.js';
import { DrizzleCatalogRepository, type CatalogRepository } from './modules/catalog/repository.js';
import { registerCatalogRoutes } from './modules/catalog/routes.js';
import {
  DrizzleRelationsRepository,
  type RelationsRepository,
} from './modules/relations/repository.js';
import { registerRelationsRoutes } from './modules/relations/routes.js';
import { DrizzleStudiosRepository, type StudiosRepository } from './modules/studios/repository.js';
import { registerStudiosRoutes } from './modules/studios/routes.js';
import { DrizzleSourcesRepository, type SourcesRepository } from './modules/sources/repository.js';
import { registerSourcesRoutes } from './modules/sources/routes.js';
import { registerEnrichmentRoutes } from './modules/enrichment/routes.js';
import { registerLoreAndAdaptationRoutes, type LoreRepository } from './modules/lore/routes.js';
import { AniListClient } from './modules/integrations/anilist/client.js';
import {
  DrizzleAniListIdentityResolver,
  type AniListIdentityResolver,
} from './modules/integrations/anilist/identity-resolver.js';
import { AniListIntegrationService } from './modules/integrations/anilist/service.js';
import { registerAniListRoutes } from './modules/integrations/anilist/routes.js';
import {
  DrizzleStudioGraphRepository,
  type StudioGraphRepository,
} from './modules/studio-graph/repository.js';
import { registerStudioGraphRoutes } from './modules/studio-graph/routes.js';
import { MangaUpdatesClient } from './modules/integrations/editorial/mangaupdates-client.js';
import { WikidataEditorialClient } from './modules/integrations/editorial/wikidata-client.js';
import { registerEditorialRoutes } from './modules/integrations/editorial/routes.js';
import {
  registerEditorialGovernanceRoutes,
  type EditorialAuthenticator,
  type EditorialGovernanceStore,
} from './modules/editorial-governance/routes.js';

export interface BuildAppOptions {
  env?: AppEnv;
  dbHandle?: DatabaseHandle;
  checkDatabase?: () => Promise<boolean>;
  catalogRepository?: CatalogRepository;
  relationsRepository?: RelationsRepository;
  studiosRepository?: StudiosRepository;
  sourcesRepository?: SourcesRepository;
  anilistService?: AniListIntegrationService;
  anilistIdentityResolver?: AniListIdentityResolver;
  anilistFetchImpl?: typeof fetch;
  studioGraphRepository?: StudioGraphRepository;
  loreRepository?: LoreRepository;
  editorialAuthenticator?: EditorialAuthenticator;
  editorialStore?: EditorialGovernanceStore;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const env = options.env ?? loadEnv();

  const app = Fastify({
    genReqId: (req) => {
      const incoming = req.headers['x-request-id'];
      if (typeof incoming === 'string' && incoming.trim().length > 0 && incoming.length <= 128) {
        return incoming.trim();
      }
      return crypto.randomUUID();
    },
    logger: {
      level: env.logLevel,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["x-api-key"]',
          '*.password',
          '*.databaseUrl',
          '*.token',
        ],
        censor: '[REDACTED]',
      },
    },
  }).withTypeProvider<TypeBoxTypeProvider>();

  const ownedDb =
    !options.dbHandle && !options.checkDatabase && env.databaseUrl
      ? createDatabase(env.databaseUrl)
      : undefined;

  const dbHandle = options.dbHandle ?? ownedDb;

  const checkDatabase =
    options.checkDatabase ?? (dbHandle ? () => dbHandle.checkConnection() : async () => false);

  const catalogRepository =
    options.catalogRepository ?? (dbHandle ? new DrizzleCatalogRepository(dbHandle.db) : undefined);
  const relationsRepository =
    options.relationsRepository ??
    (dbHandle ? new DrizzleRelationsRepository(dbHandle.db) : undefined);
  const studiosRepository =
    options.studiosRepository ?? (dbHandle ? new DrizzleStudiosRepository(dbHandle.db) : undefined);
  const sourcesRepository = options.sourcesRepository ?? new DrizzleSourcesRepository(dbHandle?.db);

  const anilistResolver =
    options.anilistIdentityResolver ??
    (dbHandle ? new DrizzleAniListIdentityResolver(dbHandle.db) : undefined);

  const anilistService =
    options.anilistService ??
    new AniListIntegrationService(
      new AniListClient(
        {
          enabled: env.enrichmentFlags.anilist,
          endpoint: 'https://graphql.anilist.co',
          timeoutMs: 8_000,
          maxRequestsPerMinute: 25,
          maxConcurrent: 2,
          maxRetries: 1,
          cacheTtlMs: 300_000,
          cacheMaxEntries: 200,
        },
        options.anilistFetchImpl,
      ),
      anilistResolver,
    );

  const studioGraphRepository =
    options.studioGraphRepository ??
    (dbHandle ? new DrizzleStudioGraphRepository(dbHandle.db, anilistService) : undefined);

  app.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  if (ownedDb) {
    app.addHook('onClose', async () => {
      await ownedDb.close();
    });
  }

  registerProblemDetails(app);
  await registerSecurityPlugins(app, env);
  await registerSwaggerPlugin(app, env);
  await registerHealthRoutes(app, { checkDatabase });
  await registerCatalogRoutes(app, catalogRepository);
  await registerRelationsRoutes(app, relationsRepository);
  await registerStudiosRoutes(app, studiosRepository);
  await registerSourcesRoutes(app, sourcesRepository);
  await registerEnrichmentRoutes(app, env);
  await registerLoreAndAdaptationRoutes(app, options.loreRepository);
  await registerAniListRoutes(app, anilistService);
  await registerStudioGraphRoutes(app, env, studioGraphRepository);
  await registerEditorialRoutes(app, {
    db: dbHandle?.db,
    mangaUpdatesClient: new MangaUpdatesClient({ enabled: env.enrichmentFlags.mangaupdates }),
    wikidataClient: new WikidataEditorialClient({ enabled: env.enrichmentFlags.wikidata }),
  });
  await registerEditorialGovernanceRoutes(app, {
    authenticate: options.editorialAuthenticator,
    store: options.editorialStore,
  });

  return app;
}
