import express from 'express';
import rateLimit from 'express-rate-limit';
import type { ApiErrorBody } from '../../shared/types';
import type { ServerConfig } from './config';
import { playerRoutes } from './routes/playerRoutes';
import { createPlayerService, type PlayerService } from './services/eaClubsService';

export function createApp(config: ServerConfig, service: PlayerService = createPlayerService(config)) {
  const app = express();
  app.disable('x-powered-by');

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
  return app;
}
