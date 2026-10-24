import { existsSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import rateLimit from 'express-rate-limit';
import type { ApiErrorBody } from '../../shared/types';
import type { ServerConfig } from './config';
import { playerRoutes } from './routes/playerRoutes';
import { createPlayerService, type PlayerService } from './services/eaClubsService';

export function createApp(config: ServerConfig, service: PlayerService = createPlayerService(config), staticDir?: string) {
  const app = express();
  app.disable('x-powered-by');
  // Derrière le proxy de l'hébergeur : sans cela, la limite de débit verrait l'IP du proxy pour tous les visiteurs.
  if (config.trustProxy) app.set('trust proxy', 1);

  const limiter = rateLimit({
    windowMs: 60_000,
    limit: config.rateLimitPerMinute,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      const body: ApiErrorBody = { error: { code: 'RATE_LIMITED', message: 'Trop de requêtes. Patientez une minute.' } };
      res.status(429).json(body);
    },
  });

  app.use('/api/players', limiter, playerRoutes(service));
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, eaUnofficialEnabled: config.eaUnofficialEnabled });
  });

  // Interface construite par Vite : servie par le même service, donc même origine que l'API.
  if (staticDir && existsSync(path.join(staticDir, 'index.html'))) {
    app.use(express.static(staticDir));
    app.get(/^\/(?!api(\/|$)).*/, (_req, res) => res.sendFile(path.join(staticDir, 'index.html')));
  }
  return app;
}
