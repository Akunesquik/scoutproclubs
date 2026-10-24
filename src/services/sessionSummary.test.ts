import type { RecentMatch } from '../../shared/types';
import { matchesInRange, summarizeSession } from './sessionSummary';

const base: RecentMatch = {
  id: 'x', matchType: 'leagueMatch', durationSeconds: 900, playedAt: '2026-10-23T20:00:00.000Z', opponent: 'A',
  scoreFor: 2, scoreAgainst: 1, goals: 1, assists: 2, rating: 8, details: [],
};
const m = (over: Partial<RecentMatch>): RecentMatch => ({ ...base, ...over });

describe('matchesInRange', () => {
  it('garde les matchs dans la période (bornes incluses) et ignore ceux sans date', () => {
    const list = [m({ id: '1', playedAt: '2026-10-23T20:00:00.000Z' }), m({ id: '2', playedAt: '2026-10-22T10:00:00.000Z' }), m({ id: '3', playedAt: null })];
    const out = matchesInRange(list, new Date('2026-10-23T20:00:00.000Z'), new Date('2026-10-24T00:00:00.000Z'));
    expect(out.map((x) => x.id)).toEqual(['1']);
  });
});

describe('summarizeSession', () => {
  it('additionne les stats et calcule le bilan et la note moyenne', () => {
    const s = summarizeSession([
      m({ goals: 1, assists: 2, rating: 8, details: [{ category: 'Attaque', label: 'Tirs', value: 3 }] }),
      m({ goals: 0, assists: 1, rating: 7, scoreFor: 1, scoreAgainst: 1, details: [{ category: 'Attaque', label: 'Tirs', value: 2 }] }),
      m({ goals: 2, assists: 0, rating: 6, scoreFor: 0, scoreAgainst: 3, details: [] }),
    ]);
    expect(s).toMatchObject({ matchCount: 3, goals: 3, assists: 3, shots: 5, record: { wins: 1, draws: 1, losses: 1 } });
    expect(s.averageRating).toBeCloseTo(7);
  });

  it('renvoie null (et non 0) quand aucune valeur n’est disponible', () => {
    const s = summarizeSession([m({ goals: null, assists: null, rating: null, scoreFor: null, scoreAgainst: null })]);
    expect(s).toMatchObject({ matchCount: 1, goals: null, assists: null, averageRating: null, record: null, shots: null });
  });

  it('gère une session vide', () => {
    expect(summarizeSession([])).toMatchObject({ matchCount: 0, goals: null, record: null });
  });
});

describe('pourcentages de session', () => {
  const withDetails = (details: { label: string; value: number }[]) => m({ details: details.map((d) => ({ category: 'Passes' as const, ...d })) });
  it('calcule précision des passes et réussite des tacles sur les totaux', () => {
    const s = summarizeSession([withDetails([{ label: 'Passes réussies', value: 30 }, { label: 'Passes tentées', value: 40 }, { label: 'Tacles réussis', value: 1 }, { label: 'Tacles tentés', value: 4 }]), withDetails([{ label: 'Passes réussies', value: 10 }, { label: 'Passes tentées', value: 10 }])]);
    expect(s.passAccuracy).toBe(80);
    expect(s.tackleSuccess).toBe(25);
  });
  it('renvoie null sans dénominateur', () => {
    const s = summarizeSession([m({ details: [] })]);
    expect(s.passAccuracy).toBeNull();
    expect(s.shotConversion).toBeNull();
  });
});
