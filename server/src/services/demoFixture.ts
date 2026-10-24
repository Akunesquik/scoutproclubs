import type { PlayerResult } from '../../../shared/types';

export const DEMO_PLAYER_NAME = 'DemoPlayer';

/** Données fictives de démonstration : elles ne correspondent à aucun joueur réel. */
export function demoPlayer(): PlayerResult {
  return {
    source: { kind: 'demo-fixture', label: 'Données de démonstration fictives', retrievedAt: new Date().toISOString() },
    profile: { name: DEMO_PLAYER_NAME, platform: 'common-gen5', position: 'Attaquant' },
    club: { id: '0', name: 'Demo FC' },
    stats: { gamesPlayed: 42, goals: 31, assists: 17, cleanSheets: null, averageRating: 7.4, winRate: 64 },
    recentMatches: [
      { id: 'demo-1', matchType: 'leagueMatch', playedAt: '2025-01-10T20:00:00.000Z', durationSeconds: 900, opponent: 'Exemple United', scoreFor: 3, scoreAgainst: 1, goals: 2, assists: 0, rating: 8.6, details: [{ category: 'Attaque', label: 'Tirs', value: 5 }] },
      { id: 'demo-2', matchType: 'friendlyMatch', playedAt: '2025-01-08T19:30:00.000Z', durationSeconds: 840, opponent: 'Sample Rovers', scoreFor: 1, scoreAgainst: 1, goals: 0, assists: 1, rating: 7.0, details: [] },
    ],
    historyCompleteFrom: null,
    shortMatchesHidden: 0,
    unavailable: ['Victoires / nuls / défaites cumulés par joueur'],
  };
}
