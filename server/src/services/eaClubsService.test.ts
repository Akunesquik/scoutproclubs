// @vitest-environment node
import supertest from 'supertest';
import { createApp } from '../app';
import { loadConfig } from '../config';
import { ProClubsHttpError, ProClubsNetworkError, ProClubsResponseError, ProClubsTimeoutError } from 'proclubs-sdk';
import { createPlayerService } from './eaClubsService';

const live = { ...loadConfig({}), timeoutMs: 50 };
const input = { name: 'Alpha', platform: 'common-gen5' as const, club: 'Demo FC' };
const svc = (client: unknown, cfg = live) => createPlayerService(cfg, client as never);
const fake = (over: Record<string, unknown> = {}) => ({
  clubs: { search: vi.fn(async () => [{ clubId: '1', clubName: 'Demo FC' }]) },
  members: { stats: vi.fn(async () => ({ members: [{ name: 'alpha', goals: '2' }] })) },
  matches: { list: vi.fn(async () => { throw new ProClubsHttpError('x', { status: 500, endpoint: 'clubs/matches' as never }); }) },
  ...over,
});
const failing = (err: Error) => fake({ clubs: { search: vi.fn(async () => { throw err; }) } });

describe('eaClubsService', () => {
  it('est actif par défaut, et la démo ne sert que si on le coupe', async () => {
    expect(loadConfig({}).eaUnofficialEnabled).toBe(true);
    const off = svc(fake(), loadConfig({ EA_UNOFFICIAL_ENABLED: 'false' }));
    await expect(off.findPlayer(input)).rejects.toMatchObject({ code: 'SOURCE_DISABLED' });
    expect((await off.findPlayer({ ...input, name: 'DemoPlayer' })).source.kind).toBe('demo-fixture');
  });

  it('récupère un joueur et marque l’historique indisponible en cas de réponse partielle', async () => {
    const r = await svc(fake()).findPlayer(input);
    expect(r.source.kind).toBe('ea-unofficial');
    expect(r.stats.goals).toBe(2);
    expect(r.stats.assists).toBeNull();
    expect(r.recentMatches).toBeNull();
    expect(r.unavailable).toContain('Historique des matchs récents');
  });

  it('utilise directement un identifiant de club numérique', async () => {
    const client = fake();
    await svc(client).findPlayer({ ...input, club: '759189' });
    expect(client.clubs.search).not.toHaveBeenCalled();
    expect(client.members.stats).toHaveBeenCalledWith({ clubId: '759189', platform: 'common-gen5' });
  });

  it('signale un joueur ou un club introuvable', async () => {
    await expect(svc(fake({ members: { stats: async () => ({ members: [] }) } })).findPlayer(input)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(svc(fake({ clubs: { search: async () => [] } })).findPlayer(input)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('signale plusieurs clubs correspondants', async () => {
    const c = fake({ clubs: { search: async () => [{ clubId: '1', clubName: 'Demo FC' }, { clubId: '2', clubName: 'demo fc' }] } });
    await expect(svc(c).findPlayer(input)).rejects.toMatchObject({ code: 'AMBIGUOUS_CLUB' });
  });

  it.each([
    [new ProClubsHttpError('x', { status: 429, endpoint: 'clubs/search' as never }), 'RATE_LIMITED'],
    [new ProClubsHttpError('x', { status: 503, endpoint: 'clubs/search' as never }), 'UPSTREAM_UNAVAILABLE'],
    [new ProClubsTimeoutError(), 'UPSTREAM_TIMEOUT'],
    [new ProClubsResponseError('x', 'clubs/search' as never), 'UPSTREAM_INVALID'],
    [new ProClubsNetworkError(), 'UPSTREAM_UNAVAILABLE'],
  ])('mappe l’erreur SDK %#', async (err, code) => {
    await expect(svc(failing(err)).findPlayer(input)).rejects.toMatchObject({ code });
  });
});
describe('GET /api/players', () => {
  const app = createApp(loadConfig({ EA_UNOFFICIAL_ENABLED: 'false' }));
  it('valide les entrées (400)', async () => {
    const res = await supertest(app).get('/api/players').query({ name: '', platform: 'common-gen5', club: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });
  it('renvoie la démo', async () => {
    const res = await supertest(app).get('/api/players').query({ name: 'DemoPlayer', platform: 'common-gen5', club: 'x' });
    expect(res.status).toBe(200);
    expect(res.body.source.kind).toBe('demo-fixture');
  });
  it('limite le débit (429)', async () => {
    const limited = createApp({ ...loadConfig({ EA_UNOFFICIAL_ENABLED: 'false' }), rateLimitPerMinute: 1 });
    const q = { name: 'DemoPlayer', platform: 'common-gen5', club: 'x' };
    await supertest(limited).get('/api/players').query(q);
    expect((await supertest(limited).get('/api/players').query(q)).status).toBe(429);
  });
});
