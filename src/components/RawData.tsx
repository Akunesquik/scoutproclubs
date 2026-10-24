import type { RecentMatch } from '../../shared/types';
import { MATCH_TYPE_LABELS } from '../../shared/types';
import { formatDate, formatTimeRange } from '../services/format';

interface Props {
  member: Record<string, unknown> | null | undefined;
  matches: RecentMatch[] | null;
}

const show = (v: unknown): string => (v === undefined ? '' : typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v));

export function RawData({ member, matches }: Props) {
  const withRaw = (matches ?? []).filter((m) => m.raw);
  const keys = [...new Set(withRaw.flatMap((m) => Object.keys(m.raw!)))];

  if (!member && withRaw.length === 0) return null;

  return (
    <section className="card raw" aria-labelledby="raw-title">
      <h3 id="raw-title">Toutes les données brutes de la source</h3>
      <p className="muted hint">Valeurs telles que renvoyées par la source non officielle, sans transformation. Dites-moi lesquelles ajouter à l’interface.</p>

      {member && (
        <details open>
          <summary>Statistiques du joueur dans l’effectif ({Object.keys(member).length} champs)</summary>
          <div className="table-wrap">
            <table className="raw-table">
              <tbody>
                {Object.entries(member).map(([k, v]) => (
                  <tr key={k}><th scope="row">{k}</th><td>{show(v)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {withRaw.length > 0 && (
        <details open>
          <summary>Données par match ({keys.length} champs × {withRaw.length} matchs)</summary>
          <div className="table-wrap">
            <table className="raw-table">
              <thead>
                <tr>
                  <th scope="col">Champ</th>
                  {withRaw.map((m) => (
                    <th scope="col" key={m.id}>
                      {formatDate(m.playedAt)}
                      <br />
                      <span className="muted">{formatTimeRange(m.playedAt, m.durationSeconds)} · {MATCH_TYPE_LABELS[m.matchType]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k}>
                    <th scope="row">{k}</th>
                    {withRaw.map((m) => <td key={m.id}>{show(m.raw![k])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
