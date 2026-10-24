import { useRef, useState } from 'react';
import type { PlayerResult } from '../../shared/types';
import type { SearchInput } from '../../shared/validation';
import { ErrorState } from '../components/ErrorState';
import { Header } from '../components/Header';
import { LoadingState } from '../components/LoadingState';
import { PlayerProfile } from '../components/PlayerProfile';
import { PlayerSearch } from '../components/PlayerSearch';
import { RecentMatches } from '../components/RecentMatches';
import { SessionSummary } from '../components/SessionSummary';
import { StatsGrid } from '../components/StatsGrid';
import { DEV_DEFAULTS } from './devDefaults';
import { ApiError, fetchPlayer } from '../services/playerService';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string; candidates?: { id: string; name: string }[] }
  | { status: 'success'; player: PlayerResult };

export function App() {
  const [state, setState] = useState<State>({ status: 'idle' });
  const controller = useRef<AbortController | null>(null);

  async function search(input: SearchInput) {
    controller.current?.abort();
    controller.current = new AbortController();
    setState({ status: 'loading' });
    try {
      const player = await fetchPlayer(input, controller.current.signal);
      setState({ status: 'success', player });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (err instanceof ApiError) setState({ status: 'error', message: err.message, candidates: err.candidates });
      else setState({ status: 'error', message: 'Une erreur inattendue est survenue.' });
    }
  }

  return (
    <>
      <Header />
      <main className="container">
        <section className="hero">
          <h1>Analysez les performances d’un joueur Clubs Pro</h1>
          <p>
            ScoutProClubs rassemble les statistiques publiques d’un joueur EA Clubs Pro : profil, club, statistiques et matchs récents.
            Aucune API EA officielle ne permet de chercher un joueur par pseudo seul : indiquez aussi son club.
          </p>
        </section>
        <PlayerSearch loading={state.status === 'loading'} onSearch={search} initialName={DEV_DEFAULTS.name} initialClub={DEV_DEFAULTS.club} />
        <div className="results" aria-live="polite">
          {state.status === 'loading' && <LoadingState />}
          {state.status === 'error' && <ErrorState message={state.message} candidates={state.candidates} />}
          {state.status === 'success' && (
            <>
              <PlayerProfile player={state.player} />
              
              {state.player.recentMatches !== null && state.player.recentMatches.length > 0 && (
                <SessionSummary
                  key={state.player.source.retrievedAt}
                  matches={state.player.recentMatches}
                  historyCompleteFrom={state.player.historyCompleteFrom}
                />
              )}
              <StatsGrid stats={state.player.stats} />
              <RecentMatches matches={state.player.recentMatches} shortMatchesHidden={state.player.shortMatchesHidden} />
            </>
          )}
        </div>
      </main>
    </>
  );
}
