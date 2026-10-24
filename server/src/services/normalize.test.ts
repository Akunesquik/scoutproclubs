// @vitest-environment node
import { normalizeClubSearch, normalizeMatchDetails, normalizeMatches, normalizeMembers, toNumber } from './normalize';

// Fixtures de test fabriquées à la main, d'après le format supposé par les bibliothèques
// communautaires. Ce ne sont PAS des réponses EA actuelles.
const membersFixture = {
  members: [
    { name: 'Alpha', gamesPlayed: '10', goals: '4', assists: '0', ratingAve: '7.25', cleanSheetsDef: '2', cleanSheetsGK: '1', favoritePosition: 'midfielder' },
    { name: 'Beta', gamesPlayed: '3' },
  ],
};

describe('toNumber', () => {
  it('distingue absence et zéro', () => {
    expect(toNumber(undefined)).toBeNull();
    expect(toNumber('')).toBeNull();
    expect(toNumber('abc')).toBeNull();
    expect(toNumber('0')).toBe(0);
  });
});

describe('normalizeMembers', () => {
  it('convertit les chaînes numériques et somme les clean sheets', () => {
    const [alpha] = normalizeMembers(membersFixture)!;
    expect(alpha.stats).toMatchObject({ gamesPlayed: 10, goals: 4, assists: 0, averageRating: 7.25, cleanSheets: 3, winRate: null });
  });
  it('laisse null les champs absents', () => {
    const beta = normalizeMembers(membersFixture)![1];
    expect(beta.stats).toMatchObject({ gamesPlayed: 3, goals: null, assists: null, averageRating: null, cleanSheets: null });
  });
  it('renvoie null si la forme est inattendue', () => {
    expect(normalizeMembers({ foo: 1 })).toBeNull();
    expect(normalizeMembers('x')).toBeNull();
  });
});

describe('normalizeClubSearch', () => {
  it('gère un objet indexé par id et ignore les entrées incomplètes', () => {
    const out = normalizeClubSearch({ 1: { clubId: 1, name: 'Demo FC' }, 2: { name: 'Sans id' } });
    expect(out).toEqual([{ id: '1', name: 'Demo FC' }]);
  });
});

describe('normalizeMatches', () => {
  const payload = [
    {
      matchId: 'm1', timestamp: 1700000000,
      clubs: { '10': { goals: '2' }, '20': { goals: '1', details: { name: 'Rivals' } } },
      players: { '10': { p1: { playername: 'alpha', goals: '1', assists: '0', rating: '8.1', shots: '3', secondsPlayed: '5460', tackleattempts: '' } } },
    },
    { matchId: 'm2', clubs: {}, players: { '10': { p2: { playername: 'other' } } } },
  ];
  it('ne garde que les matchs du joueur', () => {
    const out = normalizeMatches(payload, '10', 'Alpha')!;
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ opponent: 'Rivals', scoreFor: 2, scoreAgainst: 1, goals: 1, assists: 0, rating: 8.1 });
    expect(out[0].details).toEqual([{ category: 'Général', label: 'Note', value: 8.1 }, { category: 'Général', label: 'Minutes jouées', value: 91 }, { category: 'Attaque', label: 'Buts', value: 1, percent: 33.3, percentNote: 'des tirs' }, { category: 'Attaque', label: 'Tirs', value: 3 }, { category: 'Passes', label: 'Passes décisives', value: 0 }]);
  });
  it('renvoie null pour une réponse non-tableau', () => {
    expect(normalizeMatches({}, '10', 'Alpha')).toBeNull();
  });
});

describe('normalizeMatchDetails - pourcentages', () => {
  const find = (d: { label: string; percent?: number }[], l: string) => d.find((x) => x.label === l)?.percent;
  it('attache le pourcentage à la stat correspondante', () => {
    const d = normalizeMatchDetails({ passesmade: '29', passattempts: '36', tacklesmade: '3', tackleattempts: '8', goals: '1', shots: '4', saves: '3', goalsconceded: '1' });
    expect(find(d, 'Passes réussies')).toBe(80.6);
    expect(find(d, 'Tacles réussis')).toBe(37.5);
    expect(find(d, 'Buts')).toBe(25);
    expect(find(d, 'Arrêts')).toBe(75);
    expect(d.some((x) => x.label.includes('%'))).toBe(false);
  });
  it('n’invente aucun pourcentage si le dénominateur est nul ou absent', () => {
    const d = normalizeMatchDetails({ passesmade: '0', passattempts: '0', goals: '0' });
    expect(d.every((x) => x.percent === undefined)).toBe(true);
  });
});

describe('normalizeMatchDetails - possession', () => {
  const find = (d: { label: string; value: number }[], l: string) => d.find((x) => x.label === l)?.value;
  it('somme les événements de possession des 4 champs d’agrégat', () => {
    const d = normalizeMatchDetails({ match_event_aggregate_0: '105:1,106:2,107:3,108:1,109:4', match_event_aggregate_1: '110:2', match_event_aggregate_2: '', match_event_aggregate_3: '' });
    expect(find(d, 'Ballons perdus')).toBe(6);
    expect(find(d, 'Ballons perdus (milieu)')).toBe(2);
    expect(find(d, 'Ballons récupérés')).toBe(7);
    expect(find(d, 'Ballons récupérés (tiers offensif)')).toBe(2);
  });
  it('n’affiche rien quand l’agrégat est absent ou vide', () => {
    expect(normalizeMatchDetails({ goals: '1' }).some((x) => x.category === 'Possession')).toBe(false);
    expect(normalizeMatchDetails({ match_event_aggregate_0: '', match_event_aggregate_1: '' }).some((x) => x.category === 'Possession')).toBe(false);
  });
});