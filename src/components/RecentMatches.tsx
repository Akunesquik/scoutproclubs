import type { RecentMatch } from '../../shared/types';
import { MatchTable } from './MatchTable';

function record(matches: RecentMatch[]) {
  const scored = matches.filter((m) => m.scoreFor !== null && m.scoreAgainst !== null);
  const wins = scored.filter((m) => m.scoreFor! > m.scoreAgainst!).length;
  const draws = scored.filter((m) => m.scoreFor === m.scoreAgainst).length;
  return { total: scored.length, wins, draws, losses: scored.length - wins - draws };
}

export function RecentMatches({ matches, shortMatchesHidden = 0 }: { matches: RecentMatch[] | null; shortMatchesHidden?: number }) {
  return (
    <section aria-labelledby="matches-title">
      <h3 id="matches-title">Matchs récents</h3>
      {matches !== null && record(matches).total > 0 && (() => { const r = record(matches); return <p className="hint"><strong>Bilan de l’équipe sur ces {r.total} matchs :</strong> {r.wins} V · {r.draws} N · {r.losses} D</p>; })()}
      {matches !== null && matches.length > 0 && <p className="muted hint">Cliquez sur un match pour voir toutes les statistiques du joueur.</p>}
      {shortMatchesHidden > 0 && <p className="muted hint">{shortMatchesHidden} match(s) de moins de 5 min masqué(s).</p>}
      {matches === null ? (
        <p className="muted">Historique non disponible via la source.</p>
      ) : matches.length === 0 ? (
        <p className="muted">La source n’a renvoyé aucun match récent pour ce joueur.</p>
      ) : (
        <MatchTable matches={matches} />
      )}
    </section>
  );
}
