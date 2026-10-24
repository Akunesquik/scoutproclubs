import { useMemo } from 'react';
import { useStoredState } from '../services/storedState';
import type { RecentMatch } from '../../shared/types';
import { MatchTable } from './MatchTable';
import { NOT_AVAILABLE, formatValue } from '../services/format';
import { matchesInRange, summarizeSession } from '../services/sessionSummary';

interface Props {
  matches: RecentMatch[];
  historyCompleteFrom: string | null;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toInputValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Par défaut : de minuit à 23h59 le jour du match le plus récent. */
function defaultRange(matches: RecentMatch[]): { from: string; to: string } {
  const latest = matches.find((m) => m.playedAt)?.playedAt;
  const day = latest ? new Date(latest) : new Date();
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0);
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59);
  return { from: toInputValue(start), to: toInputValue(end) };
}

function Stat({ label, value, extra }: { label: string; value: string; extra?: string }) {
  return (
    <div className="tile">
      <span className={`tile__value ${value === NOT_AVAILABLE ? 'stat__value--na' : ''}`}>{value}{extra && <small className="tile__extra"> {extra}</small>}</span>
      <span className="tile__label">{label}</span>
    </div>
  );
}

function Row({ label, value, extra }: { label: string; value: string; extra?: string }) {
  return (
    <div className="srow">
      <dt>{label}</dt>
      <dd className={value === NOT_AVAILABLE ? 'stat__value--na' : ''}>{value}{extra && <small className="tile__extra"> {extra}</small>}</dd>
    </div>
  );
}

export function SessionSummary({ matches, historyCompleteFrom }: Props) {
  const initial = useMemo(() => defaultRange(matches), [matches]);
  const [from, setFrom] = useStoredState('scout.session.from', initial.from);
  const [to, setTo] = useStoredState('scout.session.to', initial.to);

  const fromDate = new Date(from);
  const toDate = new Date(to);
  const rangeValid = from !== '' && to !== '' && fromDate <= toDate;
  const selected = rangeValid ? matchesInRange(matches, fromDate, toDate) : [];
  const summary = summarizeSession(selected);
  const incomplete = rangeValid && historyCompleteFrom !== null && fromDate < new Date(historyCompleteFrom);

  const num = (v: number | null, digits = 0) => formatValue(v, digits);
  const pct = (v: number | null) => (v === null ? NOT_AVAILABLE : `${formatValue(v, 1)} %`);
  const ratio = (made: number | null, tried: number | null) =>
    made === null || tried === null ? NOT_AVAILABLE : `${formatValue(made)} / ${formatValue(tried)}`;

  return (
    <section className="card session" aria-labelledby="session-title">
      <div className="session-head">
        <h3 id="session-title">Résumé de session</h3>
        <div className="session-range">
          <div className="field">
            <label htmlFor="session-from">Début</label>
            <input id="session-from" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="session-to">Fin</label>
            <input id="session-to" type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </div>

      {!rangeValid ? (
        <p className="muted" role="alert">Choisissez une période valide : le début doit précéder la fin.</p>
      ) : (
        <>
          {incomplete && (
            <p className="session-warning" role="status">
              <span aria-hidden="true">⚠ </span>
              Peut-être incomplet : 10 derniers matchs par type seulement, historique garanti depuis le{' '}
              {new Date(historyCompleteFrom!).toLocaleString('fr-FR')}.
            </p>
          )}
          {summary.matchCount === 0 ? (
            <p className="muted">Aucun match du joueur sur cette période.</p>
          ) : (
            <>
              <div className="kpis">
                <Stat label="Matchs" value={String(summary.matchCount)} />
                <Stat label="Bilan V · N · D" extra={summary.winPct === null ? undefined : `${pct(summary.winPct)} V`} value={summary.record ? `${summary.record.wins} · ${summary.record.draws} · ${summary.record.losses}` : NOT_AVAILABLE} />
                <Stat label="Note moyenne" value={num(summary.averageRating, 2)} />
                <Stat label="Homme du match" value={num(summary.manOfTheMatch)} />
              </div>
              <div className="panels">
                <dl className="panel">
                  <h4>Attaque</h4>
                  <Row label="Buts" value={num(summary.goals)} extra={summary.shotConversion === null ? undefined : `${pct(summary.shotConversion)} des tirs`} />
                  <Row label="Passes décisives" value={num(summary.assists)} />
                  <Row label="Tirs" value={num(summary.shots)} />
                </dl>
                <dl className="panel">
                  <h4>Passes &amp; défense</h4>
                  <Row label="Passes réussies / tentées" value={ratio(summary.passesMade, summary.passAttempts)} extra={summary.passAccuracy === null ? undefined : pct(summary.passAccuracy)} />
                  <Row label="Tacles réussis / tentés" value={ratio(summary.tacklesMade, summary.tackleAttempts)} extra={summary.tackleSuccess === null ? undefined : pct(summary.tackleSuccess)} />
                </dl>
              </div>
            </>
          )}
          {summary.matchCount > 0 && (
            <>
              <h4 className="session-list-title">Matchs de la période ({summary.matchCount})</h4>
              <p className="muted hint">Cliquez sur un match pour voir toutes les statistiques du joueur.</p>
              <MatchTable matches={selected} />
            </>
          )}
        </>
      )}
    </section>
  );
}
