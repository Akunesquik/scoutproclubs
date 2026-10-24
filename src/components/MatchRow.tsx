import { useId, useState } from 'react';
import { MATCH_STAT_CATEGORIES, type RecentMatch } from '../../shared/types';
import { NOT_AVAILABLE, formatDate, formatValue } from '../services/format';

const COLUMNS = 6;

export function MatchRow({ match }: { match: RecentMatch }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const score = match.scoreFor === null || match.scoreAgainst === null ? NOT_AVAILABLE : `${match.scoreFor} – ${match.scoreAgainst}`;

  return (
    <>
      <tr className={`match-row ${open ? 'match-row--open' : ''}`} onClick={() => setOpen((o) => !o)}>
        <td>
          <button type="button" className="row-toggle" aria-expanded={open} aria-controls={panelId} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>
            <span aria-hidden="true" className="chevron">{open ? '▾' : '▸'}</span>
            {formatDate(match.playedAt)}
          </button>
        </td>
        <td>{match.opponent ?? NOT_AVAILABLE}</td>
        <td>{score}</td>
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
              MATCH_STAT_CATEGORIES.map((category) => {
                const stats = match.details.filter((d) => d.category === category);
                if (stats.length === 0) return null;
                return (
                  <section key={category} className="details-group">
                    <h4>{category}</h4>
                    <dl className="details-grid">
                      {stats.map((d) => (
                        <div key={d.label}>
                          <dt>{d.label}</dt>
                          <dd>{formatValue(d.value, Number.isInteger(d.value) ? 0 : 1)}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                );
              })
            )}
          </td>
        </tr>
      )}
    </>
  );
}
