import type { PlayerStats } from '../../shared/types';
import { NOT_AVAILABLE, formatValue } from '../services/format';

const ITEMS: { key: keyof PlayerStats; label: string; digits?: number }[] = [
  { key: 'gamesPlayed', label: 'Matchs joués' },
  { key: 'winRate', label: 'Taux de victoire (%)' },
  { key: 'goals', label: 'Buts' },
  { key: 'assists', label: 'Passes décisives' },
  { key: 'cleanSheets', label: 'Clean sheets' },
  { key: 'averageRating', label: 'Note moyenne', digits: 1 },
];

export function StatsGrid({ stats }: { stats: PlayerStats }) {
  return (
    <section aria-labelledby="stats-title">
      <h3 id="stats-title">Statistiques</h3>
      <div className="stats-grid">
        {ITEMS.map(({ key, label, digits }) => {
          const missing = stats[key] === null;
          return (
            <div className="card stat" key={key}>
              <span className="stat__label">{label}</span>
              <span className={`stat__value ${missing ? 'stat__value--na' : ''}`}>{missing ? NOT_AVAILABLE : formatValue(stats[key], digits ?? 0)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
