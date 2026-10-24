import type { RecentMatch } from '../../shared/types';

export interface SessionSummary {
  matchCount: number;
  /** Bilan de l'équipe sur les matchs de la session (pas du joueur seul). */
  record: { wins: number; draws: number; losses: number } | null;
  goals: number | null;
  assists: number | null;
  averageRating: number | null;
  shots: number | null;
  passesMade: number | null;
  passAttempts: number | null;
  tacklesMade: number | null;
  tackleAttempts: number | null;
  manOfTheMatch: number | null;
  minutesPlayed: number | null;
  passAccuracy: number | null;
  tackleSuccess: number | null;
  shotConversion: number | null;
  winPct: number | null;
  momPct: number | null;
  possessionWon: number | null;
  possessionLost: number | null;
}

/** Pourcentage, ou null si le dénominateur est absent ou nul (pas de division par zéro, pas de 0 inventé). */
export function percent(part: number | null, total: number | null): number | null {
  return part === null || total === null || total <= 0 ? null : Math.round((part / total) * 1000) / 10;
}

/** Somme les seules valeurs présentes ; aucune valeur => null (pas 0). */
function sum(values: (number | null | undefined)[]): number | null {
  const present = values.filter((v): v is number => typeof v === 'number');
  return present.length ? present.reduce((a, b) => a + b, 0) : null;
}

const detail = (m: RecentMatch, label: string) => m.details.find((d) => d.label === label)?.value ?? null;

export function matchesInRange(matches: RecentMatch[], from: Date, to: Date): RecentMatch[] {
  return matches.filter((m) => {
    if (!m.playedAt) return false;
    const t = new Date(m.playedAt).getTime();
    return t >= from.getTime() && t <= to.getTime();
  });
}

export function summarizeSession(matches: RecentMatch[]): SessionSummary {
  const scored = matches.filter((m) => m.scoreFor !== null && m.scoreAgainst !== null);
  const ratings = matches.map((m) => m.rating).filter((r): r is number => r !== null);
  const goals = sum(matches.map((m) => m.goals));
  const shots = sum(matches.map((m) => detail(m, 'Tirs')));
  const passesMade = sum(matches.map((m) => detail(m, 'Passes réussies')));
  const passAttempts = sum(matches.map((m) => detail(m, 'Passes tentées')));
  const tacklesMade = sum(matches.map((m) => detail(m, 'Tacles réussis')));
  const tackleAttempts = sum(matches.map((m) => detail(m, 'Tacles tentés')));
  const manOfTheMatch = sum(matches.map((m) => detail(m, 'Homme du match')));
  const wins = scored.filter((m) => m.scoreFor! > m.scoreAgainst!).length;
  return {
    matchCount: matches.length,
    record: scored.length
      ? {
          wins,
          draws: scored.filter((m) => m.scoreFor === m.scoreAgainst).length,
          losses: scored.filter((m) => m.scoreFor! < m.scoreAgainst!).length,
        }
      : null,
    goals,
    assists: sum(matches.map((m) => m.assists)),
    averageRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    shots,
    passesMade,
    passAttempts,
    tacklesMade,
    tackleAttempts,
    manOfTheMatch,
    minutesPlayed: sum(matches.map((m) => detail(m, 'Minutes jouées'))),
    passAccuracy: percent(passesMade, passAttempts),
    tackleSuccess: percent(tacklesMade, tackleAttempts),
    shotConversion: percent(goals, shots),
    winPct: percent(scored.length ? wins : null, scored.length),
    momPct: percent(manOfTheMatch, matches.length),
    possessionWon: sum(matches.map((m) => detail(m, 'Ballons récupérés'))),
    possessionLost: sum(matches.map((m) => detail(m, 'Ballons perdus'))),
  };
}
