import type { RecentMatch } from '../../shared/types';
import { MatchRow } from './MatchRow';

export function MatchTable({ matches }: { matches: RecentMatch[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Date</th><th>Type</th><th>Adversaire</th><th>Résultat (nous – adv.)</th><th>Buts</th><th>Passes D.</th><th>Note</th></tr>
        </thead>
        <tbody>
          {matches.map((m) => <MatchRow key={m.id} match={m} />)}
        </tbody>
      </table>
    </div>
  );
}
