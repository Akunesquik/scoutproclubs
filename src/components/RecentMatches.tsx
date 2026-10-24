import type { RecentMatch } from '../../shared/types';
import { MatchRow } from './MatchRow';

function record(matches: RecentMatch[]) {
  const scored = matches.filter((m) => m.scoreFor !== null && m.scoreAgainst !== null);
  const wins = scored.filter((m) => m.scoreFor! > m.scoreAgainst!).length;
  const draws = scored.filter((m) => m.scoreFor === m.scoreAgainst).length;
  return { total: scored.length, wins, draws, losses: scored.length - wins - draws };
}

export function RecentMatches({ matches }: { matches: RecentMatch[] | null }) {
  return (
    <section aria-labelledby="matches-title">
      <h3 id="matches-title">Matchs récents</h3>
      {matches !== null && record(matches).total > 0 && (() => { const r = record(matches); return <p className="hint"><strong>Bilan de l’équipe sur ces {r.total} matchs :</strong> {r.wins} V · {r.draws} N · {r.losses} D</p>; })()}
      {matches !== null && matches.length > 0 && <p className="muted hint">Cliquez sur un match pour voir toutes les statistiques du joueur.</p>}
      {matches === null ? (
        <p className="muted">Historique non disponible via la source.</p>
      ) : matches.length === 0 ? (
        <p className="muted">La source n’a renvoyé aucun match récent pour ce joueur.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Adversaire</th><th>Score</th><th>Buts</th><th>Passes D.</th><th>Note</th></tr>
            </thead>
            <tbody>
              {matches.map((m) => <MatchRow key={m.id} match={m} />)}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
