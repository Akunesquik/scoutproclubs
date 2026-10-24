export const PLATFORMS = [
  { value: 'common-gen5', label: 'PlayStation 5 / Xbox Series / PC' },
  { value: 'common-gen4', label: 'PlayStation 4 / Xbox One' },
  { value: 'nx', label: 'Nintendo Switch' },
] as const;

export type Platform = (typeof PLATFORMS)[number]['value'];

export type DataSourceKind = 'demo-fixture' | 'ea-unofficial';

/** Une valeur `null` signifie « donnée non disponible », jamais zéro. */
export interface PlayerStats {
  gamesPlayed: number | null;
  goals: number | null;
  assists: number | null;
  cleanSheets: number | null;
  averageRating: number | null;
  /** Taux de victoire en % fourni par la source (pas de V/N/D par joueur). */
  winRate: number | null;
}

export const MATCH_STAT_CATEGORIES = ['Général', 'Attaque', 'Passes', 'Défense', 'Gardien'] as const;
export type MatchStatCategory = (typeof MATCH_STAT_CATEGORIES)[number];

export interface MatchStat {
  category: MatchStatCategory;
  label: string;
  value: number;
}

export interface RecentMatch {
  id: string;
  playedAt: string | null;
  opponent: string | null;
  scoreFor: number | null;
  scoreAgainst: number | null;
  goals: number | null;
  assists: number | null;
  rating: number | null;
  /** Statistiques individuelles détaillées réellement renvoyées par la source pour ce match. */
  details: MatchStat[];
}

export interface PlayerResult {
  source: { kind: DataSourceKind; label: string; retrievedAt: string };
  profile: { name: string; platform: Platform; position: string | null };
  club: { id: string; name: string | null } | null;
  stats: PlayerStats;
  /** `null` = historique indisponible ; `[]` = aucun match renvoyé par la source. */
  recentMatches: RecentMatch[] | null;
  /** Catégories que la source n'a pas pu fournir (affichées à l'utilisateur). */
  unavailable: string[];
}

export type ApiErrorCode =
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'AMBIGUOUS_CLUB'
  | 'SOURCE_DISABLED'
  | 'UPSTREAM_UNAVAILABLE'
  | 'UPSTREAM_TIMEOUT'
  | 'UPSTREAM_INVALID'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    candidates?: { id: string; name: string }[];
  };
}
