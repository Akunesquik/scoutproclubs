import { useId, useState } from 'react';
import { MATCH_STAT_CATEGORIES, MATCH_TYPE_LABELS, type RecentMatch } from '../../shared/types';
import { NOT_AVAILABLE, formatDate, formatTimeRange, formatValue } from '../services/format';

const COLUMNS = 7;
const OUTCOME_LABELS = { win: 'V', draw: 'N', loss: 'D' } as const;

export function MatchRow({ match }: { match: RecentMatch }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const hasScore = match.scoreFor !== null && match.scoreAgainst !== null;
  const outcome = !hasScore ? null : match.scoreFor! > match.scoreAgainst! ? 'win' : match.scoreFor! < match.scoreAgainst! ? 'loss' : 'draw';

  return (
    <>
      <tr className={`match-row ${open ? 'match-row--open' : ''}`} onClick={() => setOpen((o) => !o)}>
        <td>
          <button type="button" className="row-toggle" aria-expanded={open} aria-controls={panelId} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>
            <span aria-hidden="true" className="chevron">{open ? '▾' : '▸'}</span>
            {formatDate(match.playedAt)}
          </button>
          <div className="muted match-time" title="Début estimé : heure de fin fournie par la source moins la durée du match">{formatTimeRange(match.playedAt, match.durationSeconds)}</div>
        </td>
        <td>{MATCH_TYPE_LABELS[match.matchType]}</td>
        <td>{match.opponent ?? NOT_AVAILABLE}</td>
        <td>
          {outcome ? (
            <span className={`result result--${outcome}`}>
              <span className="result__badge">{OUTCOME_LABELS[outcome]}</span>
              <span className="result__score" aria-label={`Notre équipe ${match.scoreFor}, adversaire ${match.scoreAgainst}`}>
                <strong>{match.scoreFor}</strong> – {match.scoreAgainst}
              </span>
            </span>
          ) : (
            <span className="stat__value--na">{NOT_AVAILABLE}</span>
          )}
        </td>
        <td>{formatValue(match.goals)}</td>
        <td>{formatValue(match.assists)}</td>
        <td>{formatValue(match.rating, 1)}</td>
      </tr>
      {open && (
        <tr id={panelId} className="match-details">
          <td colSpan={COLUMNS}>
            {match.details.length === 0 ? (
              <p className="muted">Aucune statistique détaillée disponible pour ce match.</p>
            ) : (
              <div className="details-columns">
                {MATCH_STAT_CATEGORIES.map((category) => {
                  const stats = match.details.filter((d) => d.category === category);
                  if (stats.length === 0) return null;
                  return (
                    <table key={category} className="details-table">
                      <thead>
                        <tr><th colSpan={2}>{category}</th></tr>
                      </thead>
                      <tbody>
                        {stats.map((d) => (
                          <tr key={d.label}>
                            <th scope="row">{d.label}</th>
                            <td>
                              {formatValue(d.value, Number.isInteger(d.value) ? 0 : 1)}
                              {d.percent !== undefined && <span className="stat-pct"> ({formatValue(d.percent, 1)} %{d.percentNote ? ` ${d.percentNote}` : ''})</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {category === 'Possession' && (
                        <tfoot>
                          <tr><td colSpan={2} className="muted possession-note">Estimation d’après une table communautaire non confirmée par EA ; ces compteurs peuvent sous-estimer la réalité.</td></tr>
                        </tfoot>
                      )}
                    </table>
                  );
                })}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
