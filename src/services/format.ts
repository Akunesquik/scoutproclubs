export const PLATFORM_LABELS: Record<string, string> = {
  'common-gen5': 'PS5 / Xbox Series / PC',
  'common-gen4': 'PS4 / Xbox One',
  nx: 'Switch',
};

export const NOT_AVAILABLE = 'Non disponible';

export function formatValue(v: number | null, digits = 0): string {
  return v === null ? NOT_AVAILABLE : v.toLocaleString('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function formatDate(iso: string | null): string {
  if (!iso) return NOT_AVAILABLE;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(iso: string | null): string {
  if (!iso) return NOT_AVAILABLE;
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Début estimé = fin - durée ; sans durée, seule l'heure de fin est connue. */
export function formatTimeRange(endIso: string | null, durationSeconds: number | null): string {
  if (!endIso) return NOT_AVAILABLE;
  if (typeof durationSeconds !== 'number' || !Number.isFinite(durationSeconds)) return `fin ${formatTime(endIso)}`;
  const start = new Date(new Date(endIso).getTime() - durationSeconds * 1000).toISOString();
  return `${formatTime(start)} → ${formatTime(endIso)} · ${Math.round(durationSeconds / 60)} min`;
}
