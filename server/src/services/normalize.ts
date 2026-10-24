import type { MatchStat, MatchStatCategory, MatchType, PlayerStats, RecentMatch } from '../../../shared/types';

type Json = Record<string, unknown>;

export const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Convertit en nombre ; absent, vide ou non numérique => null (jamais 0). */
export function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

const toText = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : null);

export function sumIfAny(...values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v !== null);
  return present.length ? present.reduce((a, b) => a + b, 0) : null;
}

export interface ClubCandidate {
  id: string;
  name: string;
}

/** Accepte un tableau ou un objet indexé par identifiant de club. */
export function normalizeClubSearch(payload: unknown): ClubCandidate[] {
  const entries = Array.isArray(payload) ? payload : isObject(payload) ? Object.values(payload) : [];
  const out: ClubCandidate[] = [];
  for (const entry of entries) {
    if (!isObject(entry)) continue;
    const info = isObject(entry.clubInfo) ? entry.clubInfo : entry;
    const id = toText(entry.clubId ?? info.clubId);
    const name = toText(entry.clubName ?? entry.name ?? info.name);
    if (id && name) out.push({ id, name });
  }
  return out;
}

export interface MemberRecord {
  name: string;
  position: string | null;
  stats: PlayerStats;
  raw: Record<string, unknown>;
}

export function normalizeMembers(payload: unknown): MemberRecord[] | null {
  if (!isObject(payload) || !Array.isArray(payload.members)) return null;
  const out: MemberRecord[] = [];
  for (const m of payload.members) {
    const name = isObject(m) ? toText(m.name) : null;
    if (!isObject(m) || !name) continue;
    out.push({
      name,
      raw: m,
      position: toText(m.favoritePosition ?? m.proPos),
      stats: {
        gamesPlayed: toNumber(m.gamesPlayed),
        goals: toNumber(m.goals),
        assists: toNumber(m.assists),
        cleanSheets: sumIfAny(toNumber(m.cleanSheetsDef), toNumber(m.cleanSheetsGK)),
        averageRating: toNumber(m.ratingAve),
        winRate: toNumber(m.winRate),
      },
    });
  }
  return out;
}

// Clés renvoyées par la source (en minuscules) => catégorie et libellé. Seules les clés présentes sont gardées.
const MATCH_STAT_FIELDS: [string, MatchStatCategory, string][] = [
  ['rating', 'Général', 'Note'],
  ['secondsplayed', 'Général', 'Minutes jouées'],
  ['mom', 'Général', 'Homme du match'],
  ['redcards', 'Général', 'Cartons rouges'],
  ['goals', 'Attaque', 'Buts'],
  ['shots', 'Attaque', 'Tirs'],
  ['assists', 'Passes', 'Passes décisives'],
  ['passesmade', 'Passes', 'Passes réussies'],
  ['passattempts', 'Passes', 'Passes tentées'],
  ['tacklesmade', 'Défense', 'Tacles réussis'],
  ['tackleattempts', 'Défense', 'Tacles tentés'],
  ['cleansheetsany', 'Défense', 'Clean sheets'],
  ['cleansheetsdef', 'Défense', 'Clean sheets (défenseur)'],
  ['saves', 'Gardien', 'Arrêts'],
  ['goalsconceded', 'Gardien', 'Buts encaissés'],
  ['cleansheetsgk', 'Gardien', 'Clean sheets (gardien)'],
];

/** Somme les compteurs `id:nombre` des 4 champs `match_event_aggregate_*` ; null si aucun n'est renseigné. */
export function parseEventAggregates(player: Json): Map<number, number> | null {
  const events = new Map<number, number>();
  let present = false;
  for (let i = 0; i < 4; i++) {
    const raw = player[`match_event_aggregate_${i}`];
    if (typeof raw !== 'string' || raw === '') continue;
    for (const pair of raw.split(',')) {
      const [id, count] = pair.split(':').map(Number);
      if (Number.isFinite(id) && Number.isFinite(count)) {
        events.set(id, (events.get(id) ?? 0) + count);
        present = true;
      }
    }
  }
  return present ? events : null;
}

// Codes d'événements issus d'une recherche communautaire (Interactive-63/eafc-pro-clubs-api-research), non confirmés par EA.
const POSSESSION_LOST: [number, string][] = [[105, 'tiers défensif'], [106, 'milieu'], [107, 'tiers offensif']];
const POSSESSION_WON: [number, string][] = [[108, 'tiers défensif'], [109, 'milieu'], [110, 'tiers offensif']];

function possessionStats(player: Json): MatchStat[] {
  const events = parseEventAggregates(player);
  if (!events) return [];
  const count = (id: number) => events.get(id) ?? 0;
  const build = (title: string, codes: [number, string][]): MatchStat[] => [
    { category: 'Possession', label: title, value: codes.reduce((s, [id]) => s + count(id), 0) },
    ...codes.map(([id, zone]) => ({ category: 'Possession' as const, label: `${title} (${zone})`, value: count(id) })),
  ];
  return [...build('Ballons récupérés', POSSESSION_WON), ...build('Ballons perdus', POSSESSION_LOST)];
}

export function normalizeMatchDetails(player: Json): MatchStat[] {
  const lower = new Map(Object.entries(player).map(([k, v]) => [k.toLowerCase(), v]));
  const out: MatchStat[] = [];
  for (const [key, category, label] of MATCH_STAT_FIELDS) {
    const n = toNumber(lower.get(key));
    if (n === null) continue;
    out.push({ category, label, value: key === 'secondsplayed' ? Math.round(n / 60) : n });
  }
  // Pourcentages dérivés : seulement si numérateur et dénominateur existent et que le dénominateur est > 0.
  const num = (key: string) => toNumber(lower.get(key));
  const pct = (n: number | null, d: number | null) => (n !== null && d !== null && d > 0 ? Math.round((n / d) * 1000) / 10 : undefined);
  const attach = (label: string, percent: number | undefined, percentNote?: string) => {
    const stat = out.find((s) => s.label === label);
    if (stat && percent !== undefined) Object.assign(stat, { percent, percentNote });
  };
  attach('Passes réussies', pct(num('passesmade'), num('passattempts')));
  attach('Tacles réussis', pct(num('tacklesmade'), num('tackleattempts')));
  attach('Buts', pct(num('goals'), num('shots')), 'des tirs');
  const saves = num('saves');
  const conceded = num('goalsconceded');
  attach('Arrêts', saves !== null && conceded !== null ? pct(saves, saves + conceded) : undefined, 'des tirs reçus');
  out.push(...possessionStats(player));  return out;
}

/** Durée réelle (`realtimegame`). Sans elle, un temps de jeu < 5 min prouve que le match est court ; sinon inconnue. */
function matchDuration(me: Record<string, unknown>): number | null {
  const real = toNumber(me.realtimegame);
  if (real !== null) return real;
  const played = toNumber(me.secondsplayed);
  return played !== null && played < 300 ? played : null;
}

/** Extrait les matchs où le joueur apparaît ; renvoie null si la forme de la réponse est inattendue. */
export function normalizeMatches(payload: unknown, clubId: string, playerName: string, matchType: MatchType = 'leagueMatch'): RecentMatch[] | null {
  if (!Array.isArray(payload)) return null;
  const target = playerName.toLowerCase();
  const out: RecentMatch[] = [];

  for (const match of payload) {
    if (!isObject(match) || !isObject(match.clubs) || !isObject(match.players)) continue;
    const mine = match.players[clubId];
    if (!isObject(mine)) continue;
    const me = Object.values(mine).find((p) => isObject(p) && toText(p.playername)?.toLowerCase() === target);
    if (!isObject(me)) continue;

    const ownClub = match.clubs[clubId];
    const opponentId = Object.keys(match.clubs).find((id) => id !== clubId);
    const oppClub = opponentId ? match.clubs[opponentId] : undefined;
    const ts = toNumber(match.timestamp);

    out.push({
      id: toText(match.matchId) ?? `${ts ?? 'm'}-${out.length}`,
      matchType,
      playedAt: ts === null ? null : new Date(ts * 1000).toISOString(),
      opponent: isObject(oppClub) && isObject(oppClub.details) ? toText(oppClub.details.name) : null,
      scoreFor: isObject(ownClub) ? toNumber(ownClub.goals ?? ownClub.score) : null,
      scoreAgainst: isObject(oppClub) ? toNumber(oppClub.goals ?? oppClub.score) : null,
      goals: toNumber(me.goals),
      assists: toNumber(me.assists),
      rating: toNumber(me.rating),
      durationSeconds: matchDuration(me),
      details: normalizeMatchDetails(me),
      raw: me,
    });
  }
  return out;
}
