import { Router } from 'express';
import type { ApiErrorBody } from '../../../shared/types';
import { validateSearch } from '../../../shared/validation';
import type { PlayerService } from '../services/eaClubsService';
import { HTTP_STATUS, ServiceError } from '../types/errors';

export function playerRoutes(service: PlayerService) {
  const router = Router();

  router.get('/', async (req, res) => {
    const parsed = validateSearch(req.query);
    if (!parsed.ok) {
      const body: ApiErrorBody = { error: { code: 'INVALID_INPUT', message: parsed.message } };
      return res.status(400).json(body);
    }
    try {
      res.json(await service.findPlayer(parsed.value));
    } catch (err) {
      const e = err instanceof ServiceError ? err : new ServiceError('INTERNAL', 'Erreur interne du serveur.');
      const body: ApiErrorBody = { error: { code: e.code, message: e.message, candidates: e.candidates } };
      res.status(HTTP_STATUS[e.code]).json(body);
    }
  });

  return router;
}
