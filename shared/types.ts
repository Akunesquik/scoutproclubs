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

export const MATCH_STAT_CATEGORIES = ['Général', 'Attaque', 'Passes', 'Défense', 'Gardien', 'Possession'] as const;
export type MatchStatCategory = (typeof MATCH_STAT_CATEGORIES)[number];

export interface MatchStat {
  category: MatchStatCategory;
  label: string;
  value: number;
  /** Pourcentage dérivé (calculé à partir de champs réels), affiché dans la même case. */
  percent?: number;
  percentNote?: string;
}

export type MatchType = 'leagueMatch' | 'friendlyMatch' | 'playoffMatch';

export const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  leagueMatch: 'Championnat',
  friendlyMatch: 'Amical',
  playoffMatch: 'Playoff',
};

export interface RecentMatch {
  id: string;
  matchType: MatchType;
  /** Horodatage fourni par la source ; supposé être la fin du match (non confirmé par EA). */
  playedAt: string | null;
  /** Durée réelle en secondes (ealtimegame), null si absente. */
  durationSeconds: number | null;
  opponent: string | null;
  scoreFor: number | null;
  scoreAgainst: number | null;
  goals: number | null;
  assists: number | null;
  rating: number | null;
  /** Statistiques individuelles détaillées réellement renvoyées par la source pour ce match. */
  details: MatchStat[];
  /** Entrée brute du joueur telle que renvoyée par la source (affichée en bas de page). */
  raw?: Record<string, unknown>;
}

export interface PlayerResult {
  source: { kind: DataSourceKind; label: string; retrievedAt: string };
  profile: { name: string; platform: Platform; position: string | null };
  club: { id: string; name: string | null } | null;
  stats: PlayerStats;
  /** `null` = historique indisponible ; `[]` = aucun match renvoyé par la source. */
  recentMatches: RecentMatch[] | null;
  /**
   * La source ne renvoie que les 10 derniers matchs par type. Si l'un des types a atteint cette limite,
   * l'historique est complet seulement à partir de cette date (ISO) ; null = pas de troncature détectée.
   */
  historyCompleteFrom: string | null;
  /** Nombre de matchs de moins de 5 minutes (abandons / déconnexions) masqués. */
  shortMatchesHidden: number;
  /** Catégories que la source n'a pas pu fournir (affichées à l'utilisateur). */
  unavailable: string[];
  /** Ligne brute du joueur dans l'effectif renvoyé par la source. */
  rawMember?: Record<string, unknown> | null;
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
