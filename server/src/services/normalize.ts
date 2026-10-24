import type { MatchStat, MatchStatCategory, PlayerStats, RecentMatch } from '../../../shared/types';

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
}

export function normalizeMembers(payload: unknown): MemberRecord[] | null {
  if (!isObject(payload) || !Array.isArray(payload.members)) return null;
  const out: MemberRecord[] = [];
  for (const m of payload.members) {
    const name = isObject(m) ? toText(m.name) : null;
    if (!isObject(m) || !name) continue;
    out.push({
      name,
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

export function normalizeMatchDetails(player: Json): MatchStat[] {
  const lower = new Map(Object.entries(player).map(([k, v]) => [k.toLowerCase(), v]));
  const out: MatchStat[] = [];
  for (const [key, category, label] of MATCH_STAT_FIELDS) {
    const n = toNumber(lower.get(key));
    if (n === null) continue;
    out.push({ category, label, value: key === 'secondsplayed' ? Math.round(n / 60) : n });
  }
  return out;
}

/** Extrait les matchs où le joueur apparaît ; renvoie null si la forme de la réponse est inattendue. */
export function normalizeMatches(payload: unknown, clubId: string, playerName: string): RecentMatch[] | null {
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
      playedAt: ts === null ? null : new Date(ts * 1000).toISOString(),
      opponent: isObject(oppClub) && isObject(oppClub.details) ? toText(oppClub.details.name) : null,
      scoreFor: isObject(ownClub) ? toNumber(ownClub.goals ?? ownClub.score) : null,
      scoreAgainst: isObject(oppClub) ? toNumber(oppClub.goals ?? oppClub.score) : null,
      goals: toNumber(me.goals),
      assists: toNumber(me.assists),
      rating: toNumber(me.rating),
      details: normalizeMatchDetails(me),
    });
  }
  return out;
}
