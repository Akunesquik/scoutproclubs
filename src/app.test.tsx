import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PlayerResult, RecentMatch } from '../shared/types';
import { App } from './app/App';
import { ErrorState } from './components/ErrorState';
import { LoadingState } from './components/LoadingState';
import { PlayerSearch } from './components/PlayerSearch';
import { RecentMatches } from './components/RecentMatches';
import { StatsGrid } from './components/StatsGrid';

describe('PlayerSearch', () => {
  it('affiche une erreur si le champ est vide et n’appelle pas onSearch', async () => {
    const onSearch = vi.fn();
    render(<PlayerSearch loading={false} onSearch={onSearch} />);
    await userEvent.click(screen.getByRole('button', { name: 'Rechercher' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Saisissez le pseudo');
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('soumet avec la touche Entrée', async () => {
    const onSearch = vi.fn();
    render(<PlayerSearch loading={false} onSearch={onSearch} />);
    await userEvent.type(screen.getByLabelText('Pseudo du joueur'), 'Zed');
    await userEvent.type(screen.getByLabelText(/Club/), 'Demo FC{Enter}');
    expect(onSearch).toHaveBeenCalledWith({ name: 'Zed', club: 'Demo FC', platform: 'common-gen5' });
  });

  it('désactive le bouton pendant le chargement', () => {
    render(<PlayerSearch loading onSearch={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Rechercher' })).toBeDisabled();
  });
});

describe('états', () => {
  it('chargement accessible', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toHaveTextContent('Recherche en cours');
  });
  it('erreur avec candidats', () => {
    render(<ErrorState message="Plusieurs clubs" candidates={[{ id: '7', name: 'Demo FC' }]} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Plusieurs clubs');
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});

describe('StatsGrid', () => {
  it('affiche « Non disponible » pour null et 0 pour zéro', () => {
    render(<StatsGrid stats={{ gamesPlayed: 5, goals: 0, assists: null, cleanSheets: null, averageRating: 7.25, winRate: null }} />);
    const goals = screen.getByText('Buts').parentElement!;
    expect(goals).toHaveTextContent('0');
    expect(screen.getByText('Passes décisives').parentElement).toHaveTextContent('Non disponible');
    expect(screen.getByText('Note moyenne').parentElement).toHaveTextContent('7,3');
  });
});

describe('RecentMatches', () => {
  const matches: RecentMatch[] = [
    { id: '1', playedAt: null, opponent: 'Rivals', scoreFor: 2, scoreAgainst: 1, goals: 1, assists: 0, rating: 8, details: [{ category: 'Attaque', label: 'Tirs', value: 4 }] },
    { id: '2', playedAt: null, opponent: 'Other', scoreFor: null, scoreAgainst: null, goals: null, assists: null, rating: null, details: [] },
  ];
  it('déplie et replie les statistiques détaillées d’une ligne', async () => {
    render(<RecentMatches matches={matches} />);
    expect(screen.queryByText('Tirs')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Rivals'));
    expect(screen.getByText('Tirs')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Attaque' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Gardien' })).not.toBeInTheDocument();
    const [toggle] = screen.getAllByRole('button');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(toggle);
    expect(screen.queryByText('Tirs')).not.toBeInTheDocument();
  });
  it('indique l’absence de détails sans inventer de valeurs', async () => {
    render(<RecentMatches matches={matches} />);
    await userEvent.click(screen.getAllByRole('button')[1]);
    expect(screen.getByText(/Aucune statistique détaillée/)).toBeInTheDocument();
  });
});

describe('App', () => {
  it('préremplit pseudo et club de développement', () => {
    render(<App />);
    expect(screen.getByLabelText('Pseudo du joueur')).toHaveValue('Symphony-Klebar');
    expect(screen.getByLabelText(/Club/)).toHaveValue('Symphony');
  });
  it('affiche l’erreur renvoyée par le backend', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Aucun joueur « Zed » dans ce club.' } }), { status: 404 })));
    render(<App />);
    await userEvent.clear(screen.getByLabelText('Pseudo du joueur'));
    await userEvent.clear(screen.getByLabelText(/Club/));
    await userEvent.type(screen.getByLabelText('Pseudo du joueur'), 'Zed');
    await userEvent.type(screen.getByLabelText(/Club/), 'Demo FC{Enter}');
    expect(await screen.findByText(/Aucun joueur/)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('affiche un résultat avec données manquantes et bandeau démo', async () => {
    const player: PlayerResult = {
      source: { kind: 'demo-fixture', label: 'Fixture', retrievedAt: '2025-01-01T00:00:00Z' },
      profile: { name: 'DemoPlayer', platform: 'common-gen5', position: null },
      club: null,
      stats: { gamesPlayed: 1, goals: null, assists: null, cleanSheets: null, averageRating: null, winRate: null },
      recentMatches: null,
      unavailable: ['Historique des matchs récents'],
    };
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(player))));
    render(<App />);
    await userEvent.clear(screen.getByLabelText('Pseudo du joueur'));
    await userEvent.clear(screen.getByLabelText(/Club/));
    await userEvent.type(screen.getByLabelText('Pseudo du joueur'), 'DemoPlayer');
    await userEvent.type(screen.getByLabelText(/Club/), 'x{Enter}');
    expect(await screen.findByRole('heading', { name: 'DemoPlayer' })).toBeInTheDocument();
    expect(screen.getByText(/DÉMO/)).toBeInTheDocument();
    expect(screen.getByText('Historique non disponible via la source.')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
