import type { PlayerResult } from '../../../shared/types';
import type { SearchInput } from '../../../shared/validation';
import type { ServerConfig } from '../config';
import { ServiceError } from '../types/errors';
import { DEMO_PLAYER_NAME, demoPlayer } from './demoFixture';
import { ProClubsClient, ProClubsHttpError, ProClubsResponseError, ProClubsTimeoutError, ProClubsValidationError } from 'proclubs-sdk';
import { normalizeClubSearch, normalizeMatches, normalizeMembers } from './normalize';

type ProClubsLike = Pick<ProClubsClient, 'clubs' | 'members' | 'matches'>;

/**
 * Connecteur basé sur `proclubs-sdk`, SDK communautaire NON OFFICIEL qui lit les endpoints
 * non documentés de proclubs.ea.com. Ce n'est pas une API publique EA et elle peut changer sans préavis.
 */
export function createPlayerService(config: ServerConfig, client: ProClubsLike = new ProClubsClient({ timeoutMs: config.timeoutMs })) {
  async function call<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (err) {
      if (err instanceof ProClubsTimeoutError) throw new ServiceError('UPSTREAM_TIMEOUT', 'La source EA n’a pas répondu à temps.');
      if (err instanceof ProClubsHttpError) {
        if (err.status === 429) throw new ServiceError('RATE_LIMITED', 'La source EA limite les requétes. Réessayez dans quelques minutes.');
        throw new ServiceError('UPSTREAM_UNAVAILABLE', `La source EA a refusé la requéte (HTTP ${err.status}).`);
      }
      if (err instanceof ProClubsResponseError) throw new ServiceError('UPSTREAM_INVALID', 'La source EA a renvoyé une réponse inattendue.');
      if (err instanceof ProClubsValidationError) throw new ServiceError('INVALID_INPUT', 'Paramétres de recherche refusés par le SDK.');
      throw new ServiceError('UPSTREAM_UNAVAILABLE', 'La source EA est inaccessible.');
    }
  }
  async function resolveClub(input: SearchInput): Promise<{ id: string; name: string | null }> {
    if (/^\d+$/.test(input.club)) return { id: input.club, name: null };

    const candidates = normalizeClubSearch(await call(() => client.clubs.search({ name: input.club, platform: input.platform })));
    if (!candidates.length) throw new ServiceError('NOT_FOUND', `Aucun club nommé « ${input.club} » sur cette plateforme.`);
    const exact = candidates.filter((c) => c.name.toLowerCase() === input.club.toLowerCase());
    if (exact.length === 1) return exact[0];
    if (exact.length === 0 && candidates.length === 1) return candidates[0];
    throw new ServiceError('AMBIGUOUS_CLUB', 'Plusieurs clubs correspondent. Relancez avec l’identifiant du club voulu.', (exact.length ? exact : candidates).slice(0, 10));
  }

  async function findLive(input: SearchInput): Promise<PlayerResult> {
    const club = await resolveClub(input);
    const members = normalizeMembers(await call(() => client.members.stats({ clubId: club.id, platform: input.platform })));
    if (!members) throw new ServiceError('UPSTREAM_INVALID', 'Format de réponse inattendu pour l’effectif du club.');

    const member = members.find((m) => m.name.toLowerCase() === input.name.toLowerCase());
    if (!member) throw new ServiceError('NOT_FOUND', `Aucun joueur « ${input.name} » dans ce club.`);

    const unavailable = ['Victoires / nuls / défaites cumulés par joueur (seul le taux de victoire est fourni)', 'Statistiques de carrière / de saison séparées'];
    let recentMatches = null;
    try {
      const raw = await call(() => client.matches.list({ clubId: club.id, platform: input.platform, type: 'leagueMatch', limit: 10 }));
      recentMatches = normalizeMatches(raw, club.id, member.name);
    } catch {
      // Réponse partielle : le profil reste affiché, seul l'historique est signalé indisponible.
    }
    if (recentMatches === null) unavailable.push('Historique des matchs récents');

    return {
      source: { kind: 'ea-unofficial', label: 'EA non officielle via proclubs-sdk (communautaire)', retrievedAt: new Date().toISOString() },
      profile: { name: member.name, platform: input.platform, position: member.position },
      club,
      stats: member.stats,
      recentMatches,
      unavailable,
    };
  }

  return {
    async findPlayer(input: SearchInput): Promise<PlayerResult> {
      if (config.eaUnofficialEnabled) return findLive(input);
      if (input.name.toLowerCase() === DEMO_PLAYER_NAME.toLowerCase()) return demoPlayer();
      throw new ServiceError(
        'SOURCE_DISABLED',
        `Aucune source EA officielle n’existe et le connecteur non officiel est désactivé (EA_UNOFFICIAL_ENABLED). Essayez le pseudo « ${DEMO_PLAYER_NAME} » pour la démo.`,
      );
    },
  };
}

export type PlayerService = ReturnType<typeof createPlayerService>;
